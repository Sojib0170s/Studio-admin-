import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format "${file.type}". Supported formats: JPEG, PNG, WebP, GIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 5 MB limit. Please compress your image.`,
    };
  }

  return { valid: true };
}

export async function uploadThumbnail(
  file: File,
  folder: 'prompts' | 'categories' | 'branding' = 'prompts',
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Please verify your Firebase project configuration.');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniquePath = `thumbnails/${folder}/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, uniquePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=86400',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Storage Upload Error:', error);
        let message = 'Failed to upload image to Firebase Storage.';
        if (error.code === 'storage/unauthorized') {
          message = 'Storage permission denied. Ensure you are signed in as an administrator.';
        } else if (error.code === 'storage/canceled') {
          message = 'Image upload was canceled.';
        } else if (error.code === 'storage/quota-exceeded') {
          message = 'Firebase Storage quota exceeded.';
        }
        reject(new Error(message));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (urlErr) {
          console.error('Failed to get download URL:', urlErr);
          reject(new Error('Upload completed, but failed to retrieve public download URL.'));
        }
      }
    );
  });
}
