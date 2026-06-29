import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface TimelineEvent {
  id: string;
  reportId: string;
  title: string;
  description: string;
  type: "status_change" | "ai_analysis" | "citizen_action" | "admin_action";
  createdAt: any;
}

const TIMELINE_COLLECTION = "timeline";

export async function addTimelineEvent(
  eventData: Omit<TimelineEvent, "id" | "createdAt">
): Promise<string> {
  const timelineRef = collection(db, TIMELINE_COLLECTION);
  const newEventRef = doc(timelineRef);
  
  await setDoc(newEventRef, {
    ...eventData,
    id: newEventRef.id,
    createdAt: serverTimestamp(),
  });
  
  return newEventRef.id;
}

export async function getTimelineForReport(reportId: string): Promise<TimelineEvent[]> {
  const timelineRef = collection(db, TIMELINE_COLLECTION);
  const q = query(timelineRef, where("reportId", "==", reportId), orderBy("createdAt", "asc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TimelineEvent));
}
