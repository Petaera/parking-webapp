import { ref, getDownloadURL } from "firebase/storage";
import { auth, storage } from "./firebase";


export async function getDownloadUrl(filePath: string) {
    try {
      // Assuming the user is already authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User is not authenticated");
      }
  
      // Get a reference to the file in Firebase Storage
      const fileRef = ref(storage, filePath);
  
      // Get the download URL for the file
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.error("Error getting file URL:", error);
    }
}
  
  