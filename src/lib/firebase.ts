import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const RUNTIME_CONFIG_KEY = 'prompt_studio_firebase_config';

export function getStoredRuntimeConfig(): FirebaseClientConfig | null {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read runtime Firebase configuration from localStorage', e);
  }
  return null;
}

export function saveStoredRuntimeConfig(config: FirebaseClientConfig): void {
  try {
    localStorage.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error('Failed to save runtime Firebase config', e);
  }
}

export function clearStoredRuntimeConfig(): void {
  try {
    localStorage.removeItem(RUNTIME_CONFIG_KEY);
    window.location.reload();
  } catch (e) {
    console.error('Failed to clear runtime Firebase config', e);
  }
}

export function resolveFirebaseConfig(): FirebaseClientConfig | null {
  // 1. Check local storage override first
  const stored = getStoredRuntimeConfig();
  if (stored && stored.apiKey && stored.projectId) {
    return stored;
  }

  // 2. Check import.meta.env variables
  const env = import.meta.env;
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && !env.VITE_FIREBASE_API_KEY.includes('YourApiKeyHere')) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
      firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)',
    };
  }

  // 3. Project configuration from google-services.json
  return {
    apiKey: 'AIzaSyDBq8tNwAIw6kScMEOSWOIlbiyDX7v73i4',
    authDomain: 'prompt-studio-872ba.firebaseapp.com',
    projectId: 'prompt-studio-872ba',
    storageBucket: 'prompt-studio-872ba.firebasestorage.app',
    messagingSenderId: '442696720006',
    appId: '1:442696720006:web:f6f3bd58bef9407d893b07',
    firestoreDatabaseId: '(default)',
  };
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const config = resolveFirebaseConfig();

if (config) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(config) : getApp();
    authInstance = getAuth(appInstance);
    // Initialize Firestore with databaseId if specified
    dbInstance = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? getFirestore(appInstance, config.firestoreDatabaseId)
      : getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
  } catch (err) {
    console.error('Error initializing Firebase services:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export function isFirebaseConfigured(): boolean {
  return appInstance !== null && authInstance !== null && dbInstance !== null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuth = authInstance;
  const currentUser = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
  };

  console.error('Firestore Error context:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export interface FormattedFirestoreError {
  userFriendlyMessage: string;
  isPermissionDenied: boolean;
  path: string | null;
  actorEmail: string | null;
  rawError: string;
}

export function formatFirestoreError(err: unknown): FormattedFirestoreError {
  const rawMessage = err instanceof Error ? err.message : String(err);
  let isPermission = rawMessage.includes('Missing or insufficient permissions') || rawMessage.includes('permission-denied');
  let path: string | null = null;
  let actorEmail: string | null = authInstance?.currentUser?.email || null;

  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed.error && (parsed.error.includes('Missing or insufficient permissions') || parsed.error.includes('permission-denied'))) {
      isPermission = true;
    }
    if (parsed.path) {
      path = parsed.path;
    }
    if (parsed.authInfo?.email) {
      actorEmail = parsed.authInfo.email;
    }
  } catch {
    // not JSON
  }

  let userFriendlyMessage = rawMessage;
  if (isPermission) {
    userFriendlyMessage = `Missing or insufficient permissions on "${path || 'Firestore'}". Verify that the signed-in user (${actorEmail || 'unauthenticated'}) is authorized in Firestore Security Rules and that the rules have been deployed to your Firebase project.`;
  }

  return {
    userFriendlyMessage,
    isPermissionDenied: isPermission,
    path,
    actorEmail,
    rawError: rawMessage,
  };
}

export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  if (!dbInstance) {
    return {
      success: false,
      message: 'Firebase is not initialized. Please provide your Firebase project credentials.',
    };
  }

  try {
    // Attempt to probe server connection as required by Firebase integration skill
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    return { success: true, message: 'Connected to Cloud Firestore successfully.' };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('permission-denied') || errorMsg.includes('Missing or insufficient permissions')) {
      // Permission denied on 'test/connection' is expected with strict rules and means the network connection reached Firestore!
      return { success: true, message: 'Firestore reachable (security rules active).' };
    }
    if (errorMsg.includes('the client is offline') || errorMsg.includes('unavailable')) {
      return { success: false, message: 'Cloud Firestore is unreachable. Please verify network or project ID.' };
    }
    return { success: false, message: errorMsg };
  }
}

export function getBootstrapAdminEmails(): string[] {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS || '';
  const list = envEmails
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  // Always include primary project owner email from instructions as trusted fallback
  if (!list.includes('ssssssgggs2@gmail.com')) {
    list.push('ssssssgggs2@gmail.com');
  }
  return list;
}
