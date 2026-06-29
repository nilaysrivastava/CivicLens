import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

const schema = z.object({
  issueType: z.enum(["pothole", "garbage", "streetlight", "water_leakage", "drainage", "traffic", "other"]).default("other"),
  title: z.string().default("Civic issue reported"),
  summary: z.string().default("A citizen submitted this civic issue with photo proof. Manual review is recommended."),
  severity: z.number().min(1).max(5).default(2),
  urgency: z.number().min(1).max(5).default(2),
  confidence: z.number().min(0).max(1).default(0.4),
  safetyRisk: z.enum(["low", "medium", "high", "critical"]).default("low"),
  visibleEvidence: z.array(z.string()).default(["Citizen-submitted photo proof"]),
  department: z.string().default("Municipal review"),
  recommendedAction: z.string().default("Review submitted evidence and assign the responsible department."),
  duplicateKeywords: z.array(z.string()).default([]),
  citizenMessage: z.string().default("Your report was saved and prepared for review."),
  authoritySummary: z.string().default("Manual review recommended."),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/gemini-health", async (req, res) => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Reply 'OK'.",
        config: { maxOutputTokens: 5, temperature: 0 },
      });
      res.json({ status: "connected", model: "gemini-2.5-flash", message: "Gemini connected" });
    } catch (err: any) {
      console.warn("Gemini health check error:", err.message);
      if (err.status === 503 || err.status === 429 || err.message?.includes("503") || err.message?.includes("429") || err.message?.toLowerCase().includes("overloaded") || err.message?.toLowerCase().includes("high demand")) {
        res.json({ status: "degraded", message: "Gemini is busy or degraded" });
      } else {
        res.json({ status: "not_connected", error: err.message || "Gemini API not configured or failed" });
      }
    }
  });

  app.post("/api/analyze-issue", async (req, res) => {
    try {
      const { imageUrl, imageDataUrlPreview, description, lat, lng, address } = req.body;

      const hasPhotoProof = !!(imageUrl || imageDataUrlPreview);
      let photoContext = hasPhotoProof ? "The citizen has submitted photo proof if either imageUrl or imageDataUrlPreview is present. Do not claim that no photo evidence was provided when image data exists. If the image quality is unclear, say image evidence is limited, not missing." : "No photo evidence was provided.";

      const prompt = `You are CivicLens, a civic issue verification assistant. Analyze the citizen’s uploaded civic issue photo, description, and location context. Classify the issue, estimate severity and urgency, identify visible evidence, suggest the responsible department, and provide practical recommended action. Do not hallucinate. If the image evidence is unclear, lower confidence.
${photoContext}

Return only valid JSON. Do not include markdown. Do not include explanation. Do not wrap in \`\`\`json.
Expected JSON shape:
{
  "issueType": "pothole",
  "title": "Large pothole reported",
  "summary": "A citizen reported a visible pothole with photo proof. The issue may affect road safety and should be reviewed.",
  "severity": 3,
  "urgency": 3,
  "confidence": 0.75,
  "safetyRisk": "medium",
  "visibleEvidence": ["citizen-submitted photo proof"],
  "department": "Roads / PWD",
  "recommendedAction": "Inspect and repair the affected road surface.",
  "duplicateKeywords": ["pothole", "road damage"],
  "citizenMessage": "Your report has been saved and prepared for civic review.",
  "authoritySummary": "Citizen-submitted road issue requiring municipal review."
}

Context:
- Description: ${description || "None provided"}
- Location: ${lat}, ${lng}
- Address: ${address || "None provided"}
- Image URL: ${imageUrl || "None"}
- Data URL Preview: ${imageDataUrlPreview ? "Present (Base64)" : "None"}`;

      let responseText = "";
      
      try {
        const ai = getAI();
        console.log(`[Gemini] Key present: ${!!process.env.GEMINI_API_KEY}`);
        const requestContent: any[] = [prompt];
        
        if (imageDataUrlPreview) {
           const match = imageDataUrlPreview.match(/^data:image\/(.+);base64,(.*)$/);
           if (match) {
             const mimeType = `image/${match[1]}`;
             const base64Data = match[2];
             requestContent.push({
               inlineData: {
                 data: base64Data,
                 mimeType: mimeType
               }
             });
           } else {
             console.warn("[Gemini] Failed to parse imageDataUrlPreview base64");
           }
        }
        
        const generateParams = {
          contents: requestContent,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        };

        const tryGenerate = async (modelName: string) => {
          console.log(`[Gemini] Attempting generation with model: ${modelName}`);
          return await ai.models.generateContent({
            model: modelName,
            ...generateParams
          });
        };

        try {
          const response = await tryGenerate("gemini-2.5-flash");
          responseText = response.text || "{}";
        } catch (err: any) {
          const isBusy = err.status === 503 || err.status === 429 || err.message?.includes("503") || err.message?.includes("429") || err.message?.toLowerCase().includes("overloaded");
          if (isBusy) {
            console.warn(`[Gemini] Degraded (503/429), retrying in 1s... Error: ${err.message}`);
            await new Promise(r => setTimeout(r, 1000));
            try {
              const response = await tryGenerate("gemini-2.5-flash");
              responseText = response.text || "{}";
            } catch (errRetry: any) {
              console.warn(`[Gemini] Retry failed, trying fallback model. Error: ${errRetry.message}`);
              const response = await tryGenerate("gemini-2.5-flash");
              responseText = response.text || "{}";
            }
          } else {
            throw err;
          }
        }
      } catch (err: any) {
        console.warn(`[Gemini] API Error (will use fallback): ${err.message || err}`);
        throw new Error("Gemini API failed");
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        // Attempt repair
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          console.warn("Could not parse JSON from Gemini");
        }
      }

      // Normalize before validation
      const normalized = {
        issueType: parsed.issueType || parsed.issue_type || parsed.issue,
        title: parsed.title,
        summary: parsed.summary,
        severity: typeof parsed.severity === 'number' ? parsed.severity : parseInt(parsed.severity),
        urgency: typeof parsed.urgency === 'number' ? parsed.urgency : parseInt(parsed.urgency),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : parseFloat(parsed.confidence),
        safetyRisk: parsed.safetyRisk || parsed.risk,
        visibleEvidence: Array.isArray(parsed.visibleEvidence) ? parsed.visibleEvidence : (Array.isArray(parsed.evidence) ? parsed.evidence : undefined),
        department: parsed.department || parsed.departmentRouting,
        recommendedAction: parsed.recommendedAction || parsed.recommended_action,
        duplicateKeywords: Array.isArray(parsed.duplicateKeywords) ? parsed.duplicateKeywords : undefined,
        citizenMessage: parsed.citizenMessage || parsed.citizen_message,
        authoritySummary: parsed.authoritySummary || parsed.authority_summary,
      };

      const validated = schema.parse(normalized);
      res.json(validated);
    } catch (error) {
      console.warn("Error analyzing issue (using fallback):", error);
      const reqIssueType = req.body?.issueType || "other";
      const addressStr = req.body?.address ? ' near ' + req.body.address.split(',')[0] : '';
      const title = `${reqIssueType !== "other" ? reqIssueType.charAt(0).toUpperCase() + reqIssueType.slice(1).replace('_', ' ') : "Civic issue"} reported${addressStr}`;
      
      // Return fallback
      res.json({
        issueType: reqIssueType,
        title: title,
        summary: "A citizen submitted a civic issue with photo proof. AI confidence was limited and manual review is recommended.",
        severity: 2,
        urgency: 2,
        confidence: 0.3,
        safetyRisk: "low",
        visibleEvidence: ["Citizen-submitted photo proof"],
        department: "Municipal review",
        recommendedAction: "Review submitted evidence and assign the responsible department.",
        duplicateKeywords: [],
        citizenMessage: "Your report was submitted and is awaiting review.",
        authoritySummary: "Manual review recommended.",
      });
    }
  });

  app.post("/api/generate-escalation", async (req, res) => {
    try {
      const { reportData } = req.body;
      const prompt = `You are an expert civic administration assistant. Generate a formal escalation brief for the following civic issue.
Return only valid JSON. Do not wrap in \`\`\`json. Do not include markdown. Do not include placeholders like "[Current Date]". Do not invent dates. Use the exact data provided. Do not expose citizen email in public-facing content. Keep language professional, concise, and authority-ready.

Department routing rules:
- pothole -> Roads / PWD
- garbage -> Sanitation Department
- streetlight -> Street Lighting Department
- water_leakage -> Water Department
- drainage -> Drainage Department
- traffic -> Traffic Police / Transport Department
- other -> Municipal Review Cell

Score rules:
- Urgency/Severity (1-5): 1=Low, 2=Moderate, 3=Medium, 4=High, 5=Critical
- PriorityScore (0-100): 0-34=Low, 35-59=Needs Attention, 60-79=High, 80-100=Critical

Expected JSON shape:
{
  "assignedDepartment": "string",
  "sla": "string",
  "priorityLabel": "string",
  "evidenceLabel": "string",
  "safetyRisk": "string",
  "civicSummary": "string (Short paragraph summary)",
  "escalationReason": "string (Short paragraph explaining why this needs action)",
  "requestedActions": ["string", "string"],
  "publicUpdate": "string (Citizen-friendly message)",
  "internalNote": "string (Admin-facing note)"
}

Report Data:
${JSON.stringify(reportData, null, 2)}`;

      let parsed: any = null;
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.2 },
        });
        parsed = JSON.parse(response.text || "{}");
      } catch (e) {
        console.warn("Gemini escalation generation failed, using fallback:", e);
      }

      if (!parsed || !parsed.assignedDepartment) {
        // Fallback
        const type = reportData.issueType || "other";
        let dept = "Municipal Review Cell";
        if (type === "pothole") dept = "Roads / PWD";
        if (type === "garbage") dept = "Sanitation Department";
        if (type === "streetlight") dept = "Street Lighting Department";
        if (type === "water_leakage") dept = "Water Department";
        if (type === "drainage") dept = "Drainage Department";
        if (type === "traffic") dept = "Traffic Police / Transport Department";

        const risk = reportData.safetyRisk || "low";
        let sla = "7 days";
        if (risk === "critical") sla = "24 hours";
        if (risk === "high") sla = "48 hours";
        if (risk === "medium") sla = "3-5 days";

        let priorityLabel = "Low";
        const ps = reportData.priorityScore || 0;
        if (ps >= 80) priorityLabel = "Critical";
        else if (ps >= 60) priorityLabel = "High";
        else if (ps >= 35) priorityLabel = "Needs Attention";

        let evidenceLabel = "Low";
        const ev = reportData.evidenceScore || 0;
        if (ev >= 80) evidenceLabel = "High";
        else if (ev >= 50) evidenceLabel = "Medium";

        parsed = {
          assignedDepartment: dept,
          sla,
          priorityLabel,
          evidenceLabel,
          safetyRisk: risk.toUpperCase(),
          civicSummary: `Citizen reported an issue categorized as ${type} at ${reportData.address}.`,
          escalationReason: `System-generated escalation based on safety risk level: ${risk.toUpperCase()}.`,
          requestedActions: [
            "Inspect the reported location.",
            "Place temporary safety markers if needed.",
            "Schedule necessary actions based on verified severity.",
            "Update the case status after action is taken."
          ],
          publicUpdate: "Your report has been escalated for priority resolution.",
          internalNote: `Auto-escalated. Priority Score: ${ps}.`
        };
      }

      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verify-resolution", async (req, res) => {
    try {
      const { beforeImageUrl, beforeImageData, afterImageUrl, afterImageData, description, resolutionNote } = req.body;
      const prompt = `You are a civic resolution verification assistant. Compare the original issue with the new resolution proof.
Return only valid JSON. Do not wrap in \`\`\`json.
Expected JSON shape:
{
  "resolutionVerified": true,
  "confidence": 0.85,
  "beforeSummary": "Pothole visible",
  "afterSummary": "Pothole filled and paved",
  "changedEvidence": ["surface smoothed", "new asphalt visible"],
  "remainingConcern": "None",
  "publicResolutionSummary": "The pothole has been successfully repaired."
}

Context:
- Original Issue: ${description || "None provided"}
- Resolution Note: ${resolutionNote || "None provided"}`;

      let parsed: any = null;
      try {
        const ai = getAI();
        const requestContent: any[] = [prompt];
        
        // Add before image
        if (beforeImageData) {
           const match = beforeImageData.match(/^data:image\/(.+);base64,(.*)$/);
           if (match) {
             requestContent.push({ inlineData: { data: match[2], mimeType: `image/${match[1]}` } });
           }
        }
        
        // Add after image
        if (afterImageData) {
           const match = afterImageData.match(/^data:image\/(.+);base64,(.*)$/);
           if (match) {
             requestContent.push({ inlineData: { data: match[2], mimeType: `image/${match[1]}` } });
           }
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: requestContent,
          config: { responseMimeType: "application/json", temperature: 0.1 },
        });
        parsed = JSON.parse(response.text || "{}");
      } catch (e) {
        console.warn("Gemini resolution verification failed, using fallback:", e);
      }

      if (!parsed || parsed.resolutionVerified === undefined) {
        // Fallback
        parsed = {
          resolutionVerified: false,
          confidence: 0.35,
          beforeSummary: "Original issue",
          afterSummary: "Resolution proof submitted",
          changedEvidence: ["resolution photo provided"],
          remainingConcern: "Manual review recommended.",
          publicResolutionSummary: "Resolution proof was submitted and is pending verification."
        };
      }

      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
