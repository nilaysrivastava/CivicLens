import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { incrementValidationCount } from "./firebaseReports";
import { addTimelineEvent } from "./firebaseTimeline";

export interface Validation {
  id: string;
  reportId: string;
  userId: string;
  createdAt: any;
}

const VALIDATIONS_COLLECTION = "validations";

export async function createValidation(reportId: string, userId: string): Promise<void> {
  // Check if already validated
  const hasValidated = await hasUserValidatedReport(reportId, userId);
  if (hasValidated) {
    throw new Error("You have already validated this issue.");
  }

  const validationsRef = collection(db, VALIDATIONS_COLLECTION);
  const newValidationRef = doc(validationsRef);
  
  await setDoc(newValidationRef, {
    id: newValidationRef.id,
    reportId,
    userId,
    createdAt: serverTimestamp(),
  });

  await incrementValidationCount(reportId);
  await addTimelineEvent({
    reportId,
    title: "Issue Verified",
    description: "A community member confirmed this issue.",
    type: "citizen_action"
  });
}

export async function hasUserValidatedReport(reportId: string, userId: string): Promise<boolean> {
  const validationsRef = collection(db, VALIDATIONS_COLLECTION);
  const q = query(
    validationsRef, 
    where("reportId", "==", reportId),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
}

export async function getValidationsForReport(reportId: string): Promise<Validation[]> {
  const validationsRef = collection(db, VALIDATIONS_COLLECTION);
  const q = query(validationsRef, where("reportId", "==", reportId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Validation));
}
