import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AdminActivityLog, AdminActionType } from '../types';

const COLLECTION_NAME = 'adminActivityLogs';

export async function logAdminAction(
  actorEmail: string,
  actorUid: string,
  action: AdminActionType,
  targetType: 'prompt' | 'category' | 'ads' | 'settings' | 'auth',
  targetId: string,
  targetTitle: string,
  details?: string
): Promise<string | null> {
  if (!db) {
    console.warn('Firestore not configured, skipping activity log write');
    return null;
  }

  const logData: Omit<AdminActivityLog, 'id'> = {
    actorEmail: actorEmail || 'unknown',
    actorUid: actorUid || 'system',
    action,
    targetType,
    targetId,
    targetTitle: targetTitle || 'Untitled',
    details: details || '',
    timestamp: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), logData);
    return docRef.id;
  } catch (error) {
    console.error('Failed to record activity log:', error);
    // Don't throw to prevent blocking the primary user action, but log context
    return null;
  }
}

export async function fetchRecentActivityLogs(maxItems = 50): Promise<AdminActivityLog[]> {
  if (!db) return [];

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      firestoreLimit(maxItems)
    );
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AdminActivityLog, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}
