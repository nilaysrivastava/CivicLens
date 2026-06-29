import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseAppletConfig from "../../firebase-applet-config.json";

// Initialize Firebase only once
export const app = getApps().length === 0 ? initializeApp(firebaseAppletConfig) : getApp();

export const auth = getAuth(app);

const firestoreDatabaseId = firebaseAppletConfig.firestoreDatabaseId;

export const db = firestoreDatabaseId
  ? initializeFirestore(app, {}, firestoreDatabaseId)
  : getFirestore(app);

// explicitly pass the bucket URL to getStorage
export const storage = getStorage(app, `gs://${firebaseAppletConfig.storageBucket}`);

export const isFirebaseReady = true;
