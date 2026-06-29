import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadReportImage(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!file) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("File must be an image");
  if (file.size > 5 * 1024 * 1024) throw new Error("File size must be under 5MB");
  if (!storage) throw new Error("Storage object is not initialized");

  const safeName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${Date.now()}-${safeName}`;
  const filePath = `reports/${uid}/${filename}`;
  const storageRef = ref(storage, filePath);

  if (onProgress) onProgress(0);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (process.env.NODE_ENV !== "production") console.log(`Upload is ${progress}% done`);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Firebase Storage Upload Error Code:", error.code);
          console.warn("Firebase Storage Upload Error Message:", error.message);
        }
        reject(error);
      },
      async () => {
        try {
          if (process.env.NODE_ENV !== "production") console.log("Upload snapshot complete");
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (process.env.NODE_ENV !== "production") console.log("Download URL received", downloadURL);
          resolve(downloadURL);
        } catch (err) {
          if (process.env.NODE_ENV !== "production") console.error("Error getting download URL", err);
          reject(err);
        }
      }
    );
  });
}
