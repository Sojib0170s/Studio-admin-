export type PromptStatus = 'published' | 'draft' | 'archived';

export interface PromptParameters {
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2' | '2:3' | '21:9';
  modelEngine?: string;
  stylize?: number;
  cfgScale?: number;
  seed?: number | null;
  sampler?: string;
}

export interface Prompt {
  id: string;
  title: string;
  slug: string;
  description: string;
  promptText: string;
  negativePrompt?: string;
  categoryId: string;
  categoryName?: string;
  thumbnailUrl: string;
  tags: string[];
  featured: boolean;
  status: PromptStatus;
  parameters?: PromptParameters;
  copyCount: number;
  viewsCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptFormData {
  title: string;
  slug: string;
  description: string;
  promptText: string;
  negativePrompt: string;
  categoryId: string;
  thumbnailUrl: string;
  tags: string[];
  featured: boolean;
  status: PromptStatus;
  parameters: PromptParameters;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  promptCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface StartIoAdFormatSettings {
  enabled: boolean;
  refreshRateSeconds?: number;
  frequencyInterval?: number;
  rewardAmount?: number;
  rewardItem?: string;
}

export interface StartIoAdSettings {
  masterEnabled: boolean;
  testMode: boolean;
  appIdAndroid: string;
  appIdIos: string;
  banner: StartIoAdFormatSettings;
  interstitial: StartIoAdFormatSettings;
  rewarded: StartIoAdFormatSettings;
  nativeAds: { enabled: boolean };
  gdprConsentRequired: boolean;
  ccpaConsentRequired: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AppConfig {
  appName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  heroPromptId?: string;
  defaultSort: 'newest' | 'popular' | 'featured';
  cacheTtlMinutes: number;
  updatedAt?: string;
  updatedBy?: string;
}

export type AdminActionType =
  | 'CREATE_PROMPT'
  | 'UPDATE_PROMPT'
  | 'DELETE_PROMPT'
  | 'PUBLISH_PROMPT'
  | 'UNPUBLISH_PROMPT'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'UPDATE_ADS_CONFIG'
  | 'UPDATE_APP_SETTINGS'
  | 'LOGIN'
  | 'LOGOUT';

export interface AdminActivityLog {
  id: string;
  actorEmail: string;
  actorUid: string;
  action: AdminActionType;
  targetType: 'prompt' | 'category' | 'ads' | 'settings' | 'auth';
  targetId: string;
  targetTitle: string;
  details?: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'editor';
  createdAt: string;
  lastLoginAt: string;
  status: 'active' | 'suspended';
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  adminSource: 'custom_claim' | 'firestore_doc' | 'trusted_allowlist';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  details?: string;
  duration?: number;
}
