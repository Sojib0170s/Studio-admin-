import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StartIoAdSettings, AppConfig } from '../types';
import { logAdminAction } from './activityService';

const APP_CONFIG_COLLECTION = 'appConfig';

export const DEFAULT_ADS_CONFIG: StartIoAdSettings = {
  masterEnabled: false,
  testMode: true,
  appIdAndroid: '',
  appIdIos: '',
  banner: {
    enabled: true,
    refreshRateSeconds: 30,
  },
  interstitial: {
    enabled: true,
    frequencyInterval: 3, // Show after every 3 prompt copies
  },
  rewarded: {
    enabled: false,
    rewardAmount: 5,
    rewardItem: 'Unlock HD Prompts',
  },
  nativeAds: {
    enabled: true,
  },
  gdprConsentRequired: true,
  ccpaConsentRequired: true,
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'Prompt Studio',
  tagline: 'AI Photo-Editing Prompt Library',
  description: 'Curated studio-grade prompts for Midjourney, Flux.1, and Stable Diffusion photo enhancements.',
  logoUrl: '',
  supportEmail: 'support@promptstudio.ai',
  privacyPolicyUrl: 'https://promptstudio.ai/privacy',
  termsUrl: 'https://promptstudio.ai/terms',
  defaultSort: 'newest',
  cacheTtlMinutes: 60,
};

export async function getStartIoSettings(): Promise<StartIoAdSettings> {
  if (!db) return DEFAULT_ADS_CONFIG;

  try {
    const docRef = doc(db, APP_CONFIG_COLLECTION, 'ads');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return {
        ...DEFAULT_ADS_CONFIG,
        ...(snap.data() as StartIoAdSettings),
      };
    }
    return DEFAULT_ADS_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${APP_CONFIG_COLLECTION}/ads`);
    return DEFAULT_ADS_CONFIG;
  }
}

export async function saveStartIoSettings(
  settings: StartIoAdSettings,
  actorEmail: string,
  actorUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  // Validate Android App ID format if master enabled
  if (settings.masterEnabled && !settings.appIdAndroid && !settings.testMode) {
    throw new Error('Please specify an official Start.io Android App ID when live ads are enabled.');
  }

  const payload: StartIoAdSettings = {
    masterEnabled: Boolean(settings.masterEnabled),
    testMode: Boolean(settings.testMode),
    appIdAndroid: (settings.appIdAndroid || '').trim(),
    appIdIos: (settings.appIdIos || '').trim(),
    banner: {
      enabled: Boolean(settings.banner?.enabled),
      refreshRateSeconds: Number(settings.banner?.refreshRateSeconds) || 30,
    },
    interstitial: {
      enabled: Boolean(settings.interstitial?.enabled),
      frequencyInterval: Number(settings.interstitial?.frequencyInterval) || 3,
    },
    rewarded: {
      enabled: Boolean(settings.rewarded?.enabled),
      rewardAmount: Number(settings.rewarded?.rewardAmount) || 5,
      rewardItem: (settings.rewarded?.rewardItem || 'VIP Prompts').trim(),
    },
    nativeAds: {
      enabled: Boolean(settings.nativeAds?.enabled),
    },
    gdprConsentRequired: Boolean(settings.gdprConsentRequired),
    ccpaConsentRequired: Boolean(settings.ccpaConsentRequired),
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid || 'system',
  };

  try {
    const docRef = doc(db, APP_CONFIG_COLLECTION, 'ads');
    await setDoc(docRef, payload, { merge: true });

    await logAdminAction(
      actorEmail,
      actorUid,
      'UPDATE_ADS_CONFIG',
      'ads',
      'ads',
      'Start.io Ad Configuration',
      `Updated Start.io settings (Master: ${payload.masterEnabled ? 'ON' : 'OFF'}, TestMode: ${payload.testMode ? 'ON' : 'OFF'})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${APP_CONFIG_COLLECTION}/ads`);
  }
}

export async function getAppConfig(): Promise<AppConfig> {
  if (!db) return DEFAULT_APP_CONFIG;

  try {
    const docRef = doc(db, APP_CONFIG_COLLECTION, 'general');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return {
        ...DEFAULT_APP_CONFIG,
        ...(snap.data() as AppConfig),
      };
    }
    return DEFAULT_APP_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${APP_CONFIG_COLLECTION}/general`);
    return DEFAULT_APP_CONFIG;
  }
}

export async function saveAppConfig(
  config: AppConfig,
  actorEmail: string,
  actorUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  if (!config.appName || config.appName.trim().length < 2) {
    throw new Error('App name must be at least 2 characters long.');
  }
  if (!config.supportEmail || !config.supportEmail.includes('@')) {
    throw new Error('Please provide a valid support email address.');
  }

  const payload: AppConfig = {
    ...config,
    appName: config.appName.trim(),
    tagline: (config.tagline || '').trim(),
    description: (config.description || '').trim(),
    supportEmail: config.supportEmail.trim(),
    privacyPolicyUrl: (config.privacyPolicyUrl || '').trim(),
    termsUrl: (config.termsUrl || '').trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid,
  };

  try {
    const docRef = doc(db, APP_CONFIG_COLLECTION, 'general');
    await setDoc(docRef, payload, { merge: true });

    await logAdminAction(
      actorEmail,
      actorUid,
      'UPDATE_APP_SETTINGS',
      'settings',
      'general',
      'General App Settings',
      `Updated application branding and settings for "${payload.appName}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${APP_CONFIG_COLLECTION}/general`);
  }
}
