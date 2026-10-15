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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Category, CategoryFormData } from '../types';
import { logAdminAction } from './activityService';

const COLLECTION_NAME = 'categories';
const PROMPTS_COLLECTION = 'prompts';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getCategories(): Promise<Category[]> {
  if (!db) return [];

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);

    // Also get prompt count for each category to show real metrics
    const promptsSnapshot = await getDocs(collection(db, PROMPTS_COLLECTION));
    const countsMap: Record<string, number> = {};
    promptsSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const catId = data.categoryId;
      if (catId) {
        countsMap[catId] = (countsMap[catId] || 0) + 1;
      }
    });

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        icon: data.icon || '',
        displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
        isActive: data.isActive ?? true,
        promptCount: countsMap[docSnap.id] || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export async function validateCategorySlug(slug: string, currentCategoryId?: string): Promise<boolean> {
  if (!db) return true;

  try {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
    const snap = await getDocs(q);

    if (snap.empty) return true;
    if (currentCategoryId && snap.docs.length === 1 && snap.docs[0].id === currentCategoryId) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Slug validation query error:', err);
    return true;
  }
}

export async function checkCategoryHasPrompts(categoryId: string): Promise<number> {
  if (!db) return 0;
  try {
    const q = query(collection(db, PROMPTS_COLLECTION), where('categoryId', '==', categoryId));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.warn('Failed to check prompt count for category:', err);
    return 0;
  }
}

export async function createCategory(
  formData: CategoryFormData,
  actorEmail: string,
  actorUid: string
): Promise<Category> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const cleanSlug = formData.slug ? slugify(formData.slug) : slugify(formData.name);
  const isUnique = await validateCategorySlug(cleanSlug);
  if (!isUnique) {
    throw new Error(`The slug "${cleanSlug}" is already in use by another category. Please choose a different slug.`);
  }

  const now = new Date().toISOString();
  const payload = {
    name: formData.name.trim(),
    slug: cleanSlug,
    description: (formData.description || '').trim(),
    thumbnailUrl: formData.thumbnailUrl || '',
    displayOrder: Number(formData.displayOrder) || 0,
    isActive: Boolean(formData.isActive),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    await logAdminAction(
      actorEmail,
      actorUid,
      'CREATE_CATEGORY',
      'category',
      docRef.id,
      payload.name,
      `Created category "${payload.name}" with slug "${cleanSlug}"`
    );

    return {
      id: docRef.id,
      ...payload,
      promptCount: 0,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function updateCategory(
  categoryId: string,
  formData: CategoryFormData,
  actorEmail: string,
  actorUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanSlug = formData.slug ? slugify(formData.slug) : slugify(formData.name);
  const isUnique = await validateCategorySlug(cleanSlug, categoryId);
  if (!isUnique) {
    throw new Error(`The slug "${cleanSlug}" is already in use by another category.`);
  }

  const docRef = doc(db, COLLECTION_NAME, categoryId);
  const now = new Date().toISOString();
  const payload = {
    name: formData.name.trim(),
    slug: cleanSlug,
    description: (formData.description || '').trim(),
    thumbnailUrl: formData.thumbnailUrl || '',
    displayOrder: Number(formData.displayOrder) || 0,
    isActive: Boolean(formData.isActive),
    updatedAt: now,
  };

  try {
    await updateDoc(docRef, payload);

    await logAdminAction(
      actorEmail,
      actorUid,
      'UPDATE_CATEGORY',
      'category',
      categoryId,
      payload.name,
      `Updated category details for "${payload.name}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${categoryId}`);
  }
}

export async function deleteCategory(
  categoryId: string,
  categoryName: string,
  actorEmail: string,
  actorUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  // Check if any prompts are attached to this category
  const attachedPromptsCount = await checkCategoryHasPrompts(categoryId);
  if (attachedPromptsCount > 0) {
    throw new Error(
      `Cannot delete category "${categoryName}". There are ${attachedPromptsCount} prompts assigned to it. Please reassign or delete those prompts first.`
    );
  }

  const docRef = doc(db, COLLECTION_NAME, categoryId);

  try {
    await deleteDoc(docRef);

    await logAdminAction(
      actorEmail,
      actorUid,
      'DELETE_CATEGORY',
      'category',
      categoryId,
      categoryName,
      `Deleted category "${categoryName}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${categoryId}`);
  }
}
