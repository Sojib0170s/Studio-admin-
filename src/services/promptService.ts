import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Prompt, PromptFormData, PromptStatus } from '../types';
import { logAdminAction } from './activityService';
import { slugify } from './categoryService';

const COLLECTION_NAME = 'prompts';

export interface PromptFilterOptions {
  categoryId?: string;
  status?: PromptStatus | 'all';
  featuredOnly?: boolean;
  searchQuery?: string;
}

export async function getPrompts(filters?: PromptFilterOptions): Promise<Prompt[]> {
  if (!db) return [];

  try {
    const collRef = collection(db, COLLECTION_NAME);
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    let prompts: Prompt[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        slug: data.slug || '',
        description: data.description || '',
        promptText: data.promptText || '',
        negativePrompt: data.negativePrompt || '',
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || '',
        thumbnailUrl: data.thumbnailUrl || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        featured: Boolean(data.featured),
        status: (data.status as PromptStatus) || 'draft',
        parameters: data.parameters || { aspectRatio: '1:1' },
        copyCount: typeof data.copyCount === 'number' ? data.copyCount : 0,
        viewsCount: typeof data.viewsCount === 'number' ? data.viewsCount : 0,
        createdBy: data.createdBy || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });

    // Apply client-side filters if requested
    if (filters) {
      if (filters.categoryId && filters.categoryId !== 'all') {
        prompts = prompts.filter((p) => p.categoryId === filters.categoryId);
      }
      if (filters.status && filters.status !== 'all') {
        prompts = prompts.filter((p) => p.status === filters.status);
      }
      if (filters.featuredOnly) {
        prompts = prompts.filter((p) => p.featured);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const queryLower = filters.searchQuery.toLowerCase().trim();
        prompts = prompts.filter((p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.promptText.toLowerCase().includes(queryLower) ||
          p.tags.some((t) => t.toLowerCase().includes(queryLower))
        );
      }
    }

    return prompts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export async function getPromptById(promptId: string): Promise<Prompt | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, COLLECTION_NAME, promptId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: snap.id,
      title: data.title || '',
      slug: data.slug || '',
      description: data.description || '',
      promptText: data.promptText || '',
      negativePrompt: data.negativePrompt || '',
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      thumbnailUrl: data.thumbnailUrl || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      featured: Boolean(data.featured),
      status: (data.status as PromptStatus) || 'draft',
      parameters: data.parameters || { aspectRatio: '1:1' },
      copyCount: typeof data.copyCount === 'number' ? data.copyCount : 0,
      viewsCount: typeof data.viewsCount === 'number' ? data.viewsCount : 0,
      createdBy: data.createdBy || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${promptId}`);
    return null;
  }
}

export async function createPrompt(
  formData: PromptFormData,
  categoryName: string,
  actorEmail: string,
  actorUid: string
): Promise<Prompt> {
  if (!db) throw new Error('Firestore is not initialized.');

  if (!formData.title || formData.title.trim().length < 3) {
    throw new Error('Title must be at least 3 characters long.');
  }
  if (!formData.promptText || formData.promptText.trim().length < 10) {
    throw new Error('Prompt instructions must be at least 10 characters long.');
  }
  if (!formData.categoryId) {
    throw new Error('Please select a valid category for the prompt.');
  }

  const cleanSlug = formData.slug ? slugify(formData.slug) : slugify(formData.title);
  const now = new Date().toISOString();

  const payload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    description: (formData.description || '').trim(),
    promptText: formData.promptText.trim(),
    negativePrompt: (formData.negativePrompt || '').trim(),
    categoryId: formData.categoryId,
    categoryName: categoryName || '',
    thumbnailUrl: formData.thumbnailUrl || '',
    tags: Array.isArray(formData.tags) ? formData.tags.map((t) => t.trim()).filter(Boolean) : [],
    featured: Boolean(formData.featured),
    status: formData.status,
    parameters: formData.parameters || { aspectRatio: '1:1' },
    copyCount: 0,
    viewsCount: 0,
    createdBy: actorUid,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    await logAdminAction(
      actorEmail,
      actorUid,
      'CREATE_PROMPT',
      'prompt',
      docRef.id,
      payload.title,
      `Created prompt "${payload.title}" in category "${categoryName}"`
    );

    return {
      id: docRef.id,
      ...payload,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function updatePrompt(
  promptId: string,
  formData: PromptFormData,
  categoryName: string,
  actorEmail: string,
  actorUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  if (!formData.title || formData.title.trim().length < 3) {
    throw new Error('Title must be at least 3 characters long.');
  }
  if (!formData.promptText || formData.promptText.trim().length < 10) {
    throw new Error('Prompt text must be at least 10 characters long.');
  }

  const cleanSlug = formData.slug ? slugify(formData.slug) : slugify(formData.title);
  const docRef = doc(db, COLLECTION_NAME, promptId);
  const now = new Date().toISOString();

  const payload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    description: (formData.description || '').trim(),
    promptText: formData.promptText.trim(),
    negativePrompt: (formData.negativePrompt || '').trim(),
    categoryId: formData.categoryId,
    categoryName: categoryName || '',
    thumbnailUrl: formData.thumbnailUrl || '',
    tags: Array.isArray(formData.tags) ? formData.tags.map((t) => t.trim()).filter(Boolean) : [],
    featured: Boolean(formData.featured),
    status: formData.status,
    parameters: formData.parameters,
    updatedAt: now,
  };

  try {
    await updateDoc(docRef, payload);

    await logAdminAction(
      actorEmail,
      actorUid,
      'UPDATE_PROMPT',
      'prompt',
      promptId,
      payload.title,
      `Updated prompt "${payload.title}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${promptId}`);
  }
}

export async function togglePublishPrompt(
  promptId: string,
  currentStatus: PromptStatus,
  title: string,
  actorEmail: string,
  actorUid: string
): Promise<PromptStatus> {
  if (!db) throw new Error('Firestore is not initialized.');

  const nextStatus: PromptStatus = currentStatus === 'published' ? 'draft' : 'published';
  const docRef = doc(db, COLLECTION_NAME, promptId);

  try {
    await updateDoc(docRef, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });

    await logAdminAction(
      actorEmail,
      actorUid,
      nextStatus === 'published' ? 'PUBLISH_PROMPT' : 'UNPUBLISH_PROMPT',
      'prompt',
      promptId,
      title,
      `Changed publication status of "${title}" to ${nextStatus}`
    );

    return nextStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${promptId}`);
  }
}

export async function toggleFeaturedPrompt(
  promptId: string,
  currentFeatured: boolean,
  title: string,
  actorEmail: string,
  actorUid: string
): Promise<boolean> {
  if (!db) throw new Error('Firestore is not initialized.');

  const nextFeatured = !currentFeatured;
  const docRef = doc(db, COLLECTION_NAME, promptId);

  try {
    await updateDoc(docRef, {
      featured: nextFeatured,
      updatedAt: new Date().toISOString(),
    });

    await logAdminAction(
      actorEmail,
      actorUid,
      'UPDATE_PROMPT',
      'prompt',
      promptId,
      title,
      `${nextFeatured ? 'Marked' : 'Unmarked'} "${title}" as featured`
    );

    return nextFeatured;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${promptId}`);
  }
}

export async function deletePrompt(
  promptId: string,
  title: string,
  actorEmail: string,
  actorUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const docRef = doc(db, COLLECTION_NAME, promptId);

  try {
    await deleteDoc(docRef);

    await logAdminAction(
      actorEmail,
      actorUid,
      'DELETE_PROMPT',
      'prompt',
      promptId,
      title,
      `Deleted prompt "${title}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${promptId}`);
  }
}

export async function incrementPromptCopyCount(promptId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, promptId);
    await updateDoc(docRef, {
      copyCount: increment(1),
    });
  } catch (err) {
    console.warn('Failed to increment copy count:', err);
  }
}
