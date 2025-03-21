import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/config";

type ProgressCallback = (progress: number) => void;

/**
 * Télécharge une image vers Firebase Storage
 */
export const uploadImage = async (
  uri: string,
  path: string,
  onProgress?: ProgressCallback
): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storage = getStorage();
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Afficher la progression
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Soumet une demande de vérification d'identité
 */
export const submitVerificationRequest = async (
  idFront: string,
  idBack: string,
  selfie: string,
  onProgress?: ProgressCallback
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("Utilisateur non connecté");
  }

  const userId = auth.currentUser.uid;
  const timestamp = Date.now();

  // Upload des images
  const idFrontURL = await uploadImage(
    idFront,
    `verifications/${userId}/id_front_${timestamp}.jpg`,
    onProgress
  );

  const idBackURL = await uploadImage(
    idBack,
    `verifications/${userId}/id_back_${timestamp}.jpg`,
    onProgress
  );

  const selfieURL = await uploadImage(
    selfie,
    `verifications/${userId}/selfie_${timestamp}.jpg`,
    onProgress
  );

  // Mise à jour du statut de vérification dans Firestore
  await updateDoc(doc(db, "users", userId), {
    verification_status: "pending",
    verification_documents: {
      id_front: idFrontURL,
      id_back: idBackURL,
      selfie: selfieURL,
      submitted_at: serverTimestamp(),
    },
  });
};
