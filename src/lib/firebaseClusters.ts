import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion
} from "firebase/firestore";
import { db } from "./firebase";
import { IssueType } from "../types/report";
import { isDuplicate } from "./intelligence/dedupe";

export interface Cluster {
  id: string;
  issueType: IssueType;
  title: string;
  centerLat: number;
  centerLng: number;
  reportIds: string[];
  status: string;
  priorityScore: number;
  validationCount: number;
  duplicateCount: number;
  createdAt: any;
  updatedAt: any;
}

const CLUSTERS_COLLECTION = "clusters";

export async function findNearbyDuplicateCluster(
  lat: number,
  lng: number,
  issueType: IssueType
): Promise<Cluster | null> {
  const clustersRef = collection(db, CLUSTERS_COLLECTION);
  const q = query(clustersRef, where("issueType", "==", issueType));
  const querySnapshot = await getDocs(q);
  
  for (const doc of querySnapshot.docs) {
    const cluster = { ...doc.data(), id: doc.id } as Cluster;
    if (isDuplicate(lat, lng, cluster.centerLat, cluster.centerLng, issueType, cluster.issueType)) {
      return cluster;
    }
  }
  
  return null;
}

export async function createCluster(
  reportId: string,
  issueType: IssueType,
  title: string,
  lat: number,
  lng: number,
  priorityScore: number
): Promise<string> {
  const clustersRef = collection(db, CLUSTERS_COLLECTION);
  const newClusterRef = doc(clustersRef);
  
  await setDoc(newClusterRef, {
    id: newClusterRef.id,
    issueType,
    title,
    centerLat: lat,
    centerLng: lng,
    reportIds: [reportId],
    status: "reported",
    priorityScore,
    validationCount: 0,
    duplicateCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newClusterRef.id;
}

export async function attachReportToCluster(
  clusterId: string,
  reportId: string
): Promise<void> {
  const clusterRef = doc(db, CLUSTERS_COLLECTION, clusterId);
  await updateDoc(clusterRef, {
    reportIds: arrayUnion(reportId),
    duplicateCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function updateClusterStats(
  clusterId: string,
  updates: Partial<Cluster>
): Promise<void> {
  const clusterRef = doc(db, CLUSTERS_COLLECTION, clusterId);
  await updateDoc(clusterRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
