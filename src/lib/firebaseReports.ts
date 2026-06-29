import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { db } from "./firebase";
import { Report } from "../types/report";

const REPORTS_COLLECTION = "reports";

export async function createReport(
  reportData: Omit<Report, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const reportsRef = collection(db, REPORTS_COLLECTION);
  const newReportRef = doc(reportsRef);
  
  await setDoc(newReportRef, {
    ...reportData,
    id: newReportRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newReportRef.id;
}

export async function getReportById(id: string): Promise<Report | null> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as Report;
  }
  return null;
}

export async function listReports(): Promise<Report[]> {
  const reportsRef = collection(db, REPORTS_COLLECTION);
  const q = query(reportsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Report));
}

export async function listAllReportsForAdmin(): Promise<Report[]> {
  const reportsRef = collection(db, REPORTS_COLLECTION);
  
  try {
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Report));
  } catch (error: any) {
    // If order by fails due to missing index, fetch all and sort client-side
    console.warn("Falling back to client-side sorting for listAllReportsForAdmin:", error);
    const querySnapshot = await getDocs(reportsRef);
    const reports = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Report));
    return reports.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }
}

export async function listReportsByUser(userId: string): Promise<Report[]> {
  const reportsRef = collection(db, REPORTS_COLLECTION);
  const q = query(reportsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Report));
}

export async function updateReport(id: string, data: Partial<Report>): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function incrementValidationCount(id: string): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  await updateDoc(docRef, {
    validationCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}
