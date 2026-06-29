import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createReport } from "../lib/firebaseReports";
import { uploadReportImage } from "../lib/firebaseStorage";
import { addTimelineEvent } from "../lib/firebaseTimeline";
import { IssueType } from "../types/report";
import { Upload, MapPin, Loader2, CheckCircle2, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCurrentPosition, reverseGeocode, geocodeAddress } from "../lib/location";

// Default marker icon for Leaflet map pin fallback
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<IssueType>("other");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'map_pin' | 'manual'>('manual');
  
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  import("../lib/firebase").then((m) => {
    // just ping to see it loaded
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    setAddress("Capturing your location...");
    try {
      const position = await getCurrentPosition();
      setLat(position.lat);
      setLng(position.lng);
      setLocationAccuracy(position.accuracy || null);
      setLocationSource("gps");

      setAddress("Finding address...");
      const reversedAddress = await reverseGeocode(position.lat, position.lng);
      if (reversedAddress) {
        setAddress(reversedAddress);
      } else {
        setAddress("Location captured. Address lookup unavailable, you can enter it manually.");
      }
    } catch (err: any) {
      setError(err.message || "Could not get your location. Please enter it manually.");
      setAddress("");
      // Don't reset lat/lng here just in case they typed it in before
    } finally {
      setIsLocating(false);
    }
  };

  const handleFindOnMap = async () => {
    if (!address.trim()) {
      setError("Please enter an address to search.");
      return;
    }
    
    setIsLocating(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setLat(result.lat);
        setLng(result.lng);
        setLocationSource("manual"); // Geocoded from their typed address
        setError("");
      } else {
        setError("Could not find that address on the map. You can still submit the report.");
      }
    } catch (err: any) {
      setError("Error finding address on map.");
    } finally {
      setIsLocating(false);
    }
  };

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        setLocationSource("map_pin");
        
        // Reverse geocode the clicked spot
        setIsLocating(true);
        setAddress("Finding address...");
        reverseGeocode(e.latlng.lat, e.latlng.lng)
          .then(reversedAddress => {
            if (reversedAddress) {
              setAddress(reversedAddress);
            } else {
              setAddress("Location captured from map. Address lookup unavailable.");
            }
          })
          .catch(() => {
            setAddress("Location captured from map.");
          })
          .finally(() => setIsLocating(false));
      },
    });

    useEffect(() => {
      if (lat !== null && lng !== null) {
        map.flyTo([lat, lng], map.getZoom());
      }
    }, [lat, lng, map]);

    return lat === null || lng === null ? null : (
      <Marker position={[lat, lng]} />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to report an issue.");
      return;
    }
    if (!file) {
      setError("Please add a photo as proof.");
      return;
    }
    if (!address && (!lat || !lng)) {
      setError("Please provide a location.");
      return;
    }

    setLoading(true);
    setAnalysisStep("Securing photo proof...");
    setError("");

    try {
      setAnalysisStep("Securing photo proof...");
      const { compressImage } = await import("../lib/imageCompression");
      const compressedFile = await compressImage(file);

      let imageUrl = "";
      let imageDataUrlPreview = "";
      let storageMode = "firebase-storage";

      try {
        imageUrl = await uploadReportImage(compressedFile, user.uid, (progress) => {
          setUploadProgress(progress);
        });
      } catch (uploadError: any) {
        if (uploadError.code === "storage/retry-limit-exceeded" || uploadError.message?.includes("taking too long") || uploadError.message?.includes("retry limit")) {
          const reader = new FileReader();
          imageDataUrlPreview = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(compressedFile);
          });
          storageMode = "preview-data-url";
          imageUrl = "";
        } else {
          throw uploadError;
        }
      }

      let reportId: string | null = null;
      try {
        setAnalysisStep("Preparing civic case...");
        reportId = await createReport({
          userId: user.uid,
          userEmail: user.email || "",
          userName: user.displayName || "Citizen",
          userPhotoURL: user.photoURL || "",
          clusterId: null,
          title: "New Issue Report",
          description,
          issueType,
          imageUrl,
          imageDataUrlPreview,
          storageMode,
          lat: lat || 0,
          lng: lng || 0,
          locationAccuracy: locationAccuracy || undefined,
          locationSource: locationSource,
          address,
          severity: 1,
          urgency: 1,
          confidence: 0,
          evidenceScore: 0,
          priorityScore: 0,
          safetyRisk: "low",
          department: "Pending AI review",
          aiSummary: "AI verification pending.",
          visibleEvidence: [],
          recommendedAction: "Awaiting AI analysis.",
          status: "reported",
          validationCount: 0,
          duplicateCount: 0,
        });
        if (process.env.NODE_ENV !== "production") console.log("Report created with ID:", reportId);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") console.error("Failed to create report", err);
        throw err; // Fatal error
      }

      try {
        setAnalysisStep("Preparing timeline...");
        await addTimelineEvent({
          reportId,
          title: "Issue Reported",
          description: "Citizen submitted issue with photo proof.",
          type: "citizen_action",
        });
      } catch (timelineError) {
      }

      setAnalysisStep("Reviewing evidence...");
      
      let aiResult;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        let response = null;
        let retries = 2;
        let delay = 1000;
        
        while (retries >= 0) {
          try {
            response = await fetch("/api/analyze-issue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reportId, 
                imageUrl,
                imageDataUrlPreview,
                description,
                issueType,
                lat: lat || 0,
                lng: lng || 0,
                address
              }),
              signal: controller.signal
            });
            
            if (response.status === 503 || response.status === 429) {
              throw new Error(`Gemini temporary error: ${response.status}`);
            }
            if (!response.ok) {
               throw new Error(`Gemini error: ${response.statusText}`);
            }
            break; // Success
          } catch (fetchErr) {
            if (retries === 0) throw fetchErr;
            if (process.env.NODE_ENV !== "production") console.warn(`Gemini analysis failed, retrying in ${delay}ms...`, fetchErr);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
            retries--;
          }
        }
        
        clearTimeout(timeoutId);
        if (response) {
          aiResult = await response.json();
          if (process.env.NODE_ENV !== "production") console.log("Gemini analysis complete");
        } else {
           throw new Error("No response from Gemini");
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") console.warn("AI analysis failed, using fallback", err);
        const hasImage = !!(imageUrl || imageDataUrlPreview);
        const titleText = `${issueType !== "other" ? issueType.charAt(0).toUpperCase() + issueType.slice(1).replace('_', ' ') : "Civic issue"} reported${address ? ' in ' + address.split(',')[0] : ''}`;
        const hasDescription = !!description;
        
        let confidenceScore = 0.3;
        if (hasImage) {
            confidenceScore = 0.45;
        }

        let fallbackRisk = "low";
        if (issueType === "pothole" || issueType === "water_leakage" || issueType === "drainage" || issueType === "traffic") {
            if (description && (description.toLowerCase().includes("large") || description.toLowerCase().includes("big") || description.toLowerCase().includes("deep") || description.toLowerCase().includes("road") || description.toLowerCase().includes("main"))) {
                fallbackRisk = "high";
            } else {
                fallbackRisk = "medium";
            }
        }

        let visibleEvidenceFallback = [];
        if (hasImage) {
            visibleEvidenceFallback.push("Citizen-submitted photo proof");
        }
        if (hasDescription && issueType) {
            visibleEvidenceFallback.push(`User description mentions a ${issueType.replace('_', ' ')}`);
        } else if (hasDescription) {
            visibleEvidenceFallback.push("User provided issue description");
        }

        aiResult = {
          issueType: issueType !== "other" ? issueType : "other",
          title: titleText,
          summary: `A citizen submitted ${hasImage ? 'photo proof and ' : ''}reported a ${issueType !== "other" ? issueType.replace('_', ' ') : 'civic issue'}${address ? ' at ' + address.split(',')[0] : ''}. Manual review is recommended because AI confidence was limited.`,
          severity: 2,
          urgency: 2,
          confidence: confidenceScore,
          safetyRisk: fallbackRisk,
          visibleEvidence: visibleEvidenceFallback,
          department: "Municipal review",
          recommendedAction: `Inspect the reported location and schedule repair if verified.`,
          duplicateKeywords: [],
          citizenMessage: "Your report was submitted and is awaiting review. AI verification will be retried or reviewed manually.",
          authoritySummary: "Manual review recommended due to temporary AI unavailability.",
        };
      }

      setAnalysisStep("Opening case file...");
      let evidenceScore = 0;
      let priorityScore = 0;
      try {
        const { calcEvidenceScore, calcPriorityScore } = await import("../lib/intelligence/scoring");
        
        evidenceScore = calcEvidenceScore(
          aiResult.confidence,
          !!(imageUrl || imageDataUrlPreview), // hasImage
          !!(lat && lng), // hasLocation
          aiResult.visibleEvidence?.length || 0,
          0, // validationCount
          0,  // duplicateCount
          !!description // hasDescription
        );
        
        priorityScore = calcPriorityScore(
          aiResult.severity,
          aiResult.urgency,
          aiResult.safetyRisk,
          0, // validationCount
          0, // duplicateCount
          new Date(), // createdAt
          address
        );
      } catch (scoreError) {
      }

      let finalClusterId = null;
      let finalDuplicateCount = 0;
      try {
        const { findNearbyDuplicateCluster, attachReportToCluster, createCluster } = await import("../lib/firebaseClusters");
        
        const duplicateCluster = await findNearbyDuplicateCluster(lat || 0, lng || 0, aiResult.issueType as any);
        if (duplicateCluster) {
          finalClusterId = duplicateCluster.id;
          finalDuplicateCount = duplicateCluster.duplicateCount + 1;
          await attachReportToCluster(duplicateCluster.id, reportId);
          await addTimelineEvent({
            reportId,
            title: "Duplicate Clustered",
            description: "Similar nearby issue detected and clustered.",
            type: "ai_analysis",
          }).catch(e => { });
        } else {
          finalClusterId = await createCluster(reportId, aiResult.issueType as any, aiResult.title, lat || 0, lng || 0, priorityScore);
        }
      } catch (clusterError) {
      }

      try {
        const { updateReport } = await import("../lib/firebaseReports");
        await updateReport(reportId, {
          title: aiResult.title,
          issueType: aiResult.issueType as any,
          aiSummary: aiResult.summary,
          severity: aiResult.severity,
          urgency: aiResult.urgency,
          confidence: aiResult.confidence,
          safetyRisk: aiResult.safetyRisk as any,
          visibleEvidence: aiResult.visibleEvidence,
          department: aiResult.department,
          recommendedAction: aiResult.recommendedAction,
          evidenceScore,
          priorityScore,
          clusterId: finalClusterId,
          duplicateCount: finalDuplicateCount
        });
        
        await addTimelineEvent({
          reportId,
          title: aiResult.confidence >= 0.5 ? "AI Analysis Complete" : "Manual Review Recommended",
          description: aiResult.confidence >= 0.5 ? "CivicLens analyzed and structured the civic issue evidence." : "AI verification queued. Manual review recommended.",
          type: "ai_analysis",
        }).catch(e => { });
      } catch (updateError) {
      }

      navigate(`/issues/${reportId}`);
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") console.error("Report submission failed", err);
      if (err.message?.includes("taking too long") || err.code === "storage/retry-limit-exceeded" || err.message?.includes("retry limit")) {
        setError("Upload failed due to network/retry limit. Please check your connection.");
      } else if (err.code === "storage/unauthorized") {
        setError("Upload blocked by security rules.");
      } else if (err.code === "storage/canceled") {
        setError("Upload was cancelled.");
      } else if (err.code === "storage/unknown") {
        setError("Storage system is temporarily unavailable.");
      } else if (err.message?.includes("Upload") || err.message?.includes("storage") || err.message?.includes("storageBucket")) {
        setError("Could not upload proof. Please try again.");
      } else if (err.message?.includes("createReport") || err.message?.includes("Firestore") || err.message?.includes("permission-denied")) {
        setError("Could not create report. Please try again.");
      } else {
        setError(err.message || "Failed to submit report. Please try again.");
      }
    } finally {
      setLoading(false);
      setAnalysisStep("");
    }
  };

  const issueTypes: { type: IssueType; label: string }[] = [
    { type: "pothole", label: "Pothole" },
    { type: "garbage", label: "Garbage" },
    { type: "streetlight", label: "Streetlight" },
    { type: "water_leakage", label: "Water Leakage" },
    { type: "drainage", label: "Drainage" },
    { type: "traffic", label: "Traffic" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
            Report a civic issue
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Add proof, confirm location, and CivicLens will prepare it for verification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {/* Step 1: Proof */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
              Add proof
            </h2>
            
            <div className="relative">
              {preview ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                  <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
                  >
                    Replace Image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 rounded-full bg-white shadow-sm border border-slate-100 mb-4 group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="mb-2 text-sm text-slate-500 font-medium">
                      <span className="font-bold text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-400">JPEG, PNG, JPG (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          {/* Step 2: Location */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
              Confirm location
            </h2>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full sm:w-auto rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                {isLocating ? (lat ? "Finding address..." : "Capturing location...") : (lat && lng && locationSource === 'gps' ? "Location Captured" : "Use current GPS location")}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-sm text-slate-400">or enter manually</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="E.g., 123 Main St, near the park"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleFindOnMap}
                  disabled={isLocating || !address.trim()}
                  className="sm:w-auto rounded-xl bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Search size={18} />
                  Find on map
                </button>
              </div>
              
              <div className="text-xs text-slate-500 mb-2">
                You can also click on the map to place a pin manually.
              </div>

              <div className="h-[300px] sm:h-[360px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0">
                <MapContainer 
                  center={lat !== null && lng !== null ? [lat, lng] : [20.5937, 78.9629]} 
                  zoom={lat !== null && lng !== null ? 15 : 4} 
                  scrollWheelZoom={true} 
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <LocationMarker />
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Step 3: Describe */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
              Describe issue
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  What kind of issue is this?
                </label>
                <div className="flex flex-wrap gap-2">
                  {issueTypes.map((type) => (
                    <button
                      key={type.type}
                      type="button"
                      onClick={() => setIssueType(type.type)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        issueType === type.type
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIssueType("other")}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      issueType === "other"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any other details that might help?"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !file || (!address && !lat)}
              className="w-full sm:w-auto rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {analysisStep || "Submitting your report..."}
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
