# Prompt Studio Admin Panel

A secure, production-grade Dark Admin Panel for the **Prompt Studio** AI photo-editing prompt library, built with **React 19 + TypeScript + Vite + Firebase (Authentication, Cloud Firestore, Firebase Storage)**.

---

## 1. Architecture & Design

- **Dark Prompt Studio Aesthetic**: Charcoal/black base (`#0A0B10`), elevated panels (`#13141F`, `#161824`), subtle purple accents (`#8B5CF6`), and restrained electric lime highlights (`#A3E635`).
- **Responsive Layout**: Collapsible sidebar navigation, sticky top bar with connection diagnostics badge, search, filter toolbars, modal drawers, and responsive table/grid views.
- **Strict Zero-Trust RBAC**: Ordinary users cannot gain admin access by signing up. Access requires verified Firebase Custom Claims (`admin: true`), server `/admins/{uid}` document presence, or verified bootstrap email allowlist.

---

## 2. Firebase Collections & Schema

### `prompts`
Collection of AI photo-editing prompts:
- `title` (string, 3–120 chars)
- `slug` (string, URL-safe)
- `description` (string, brief summary)
- `promptText` (string, 10–4000 chars, exact AI prompt syntax)
- `negativePrompt` (string, optional exclusion parameters)
- `categoryId` & `categoryName` (string, reference to category)
- `thumbnailUrl` (string, Firebase Storage download URL)
- `tags` (string[])
- `featured` (boolean, hero carousel highlight)
- `status` ('published' | 'draft' | 'archived')
- `parameters` (aspectRatio, modelEngine, stylize, cfgScale)
- `copyCount` & `viewsCount` (number, analytics counters)
- `createdAt` & `updatedAt` (ISO timestamps)

### `categories`
Taxonomy categories grouping prompts (e.g., Cinematic Portraits, Cyberpunk, Studio Lighting):
- `name` (string, 2–80 chars)
- `slug` (string, unique URL slug)
- `description` (string)
- `thumbnailUrl` (string)
- `displayOrder` (number)
- `isActive` (boolean)
- **Deletion Guard**: Deletion is blocked if any prompts reference the category, preventing orphaned data.

### `appConfig/ads`
Remote Start.io ad network settings for mobile app clients:
- `masterEnabled` (boolean)
- `testMode` (boolean)
- `appIdAndroid` (string, official Start.io Android App ID)
- `appIdIos` (string)
- `banner` (`{ enabled: boolean, refreshRateSeconds: number }`)
- `interstitial` (`{ enabled: boolean, frequencyInterval: number }`)
- `rewarded` (`{ enabled: boolean, rewardAmount: number, rewardItem: string }`)
- `nativeAds` (`{ enabled: boolean }`)
- `gdprConsentRequired` & `ccpaConsentRequired` (boolean)

### `appConfig/general`
Global app branding and legal documentation:
- `appName`, `tagline`, `description`, `logoUrl`
- `supportEmail`, `privacyPolicyUrl`, `termsUrl`
- `heroPromptId`, `defaultSort`, `cacheTtlMinutes`

### `adminActivityLogs`
Append-only immutable audit trail:
- `actorEmail`, `actorUid`, `action`, `targetType`, `targetId`, `targetTitle`, `details`, `timestamp`

### `userProfiles`
Privacy-conscious profile records of registered mobile users (`uid`, `email`, `displayName`, `photoURL`, `role`, `status`, `createdAt`, `lastLoginAt`).

---

## 3. Security Rules

### `firestore.rules`
- **Default Deny**: `match /{document=**} { allow read, write: if false; }`
- **Zero-Trust Admin Function**: Evaluates `request.auth.token.admin == true`, `/admins/{uid}`, or verified allowlist email (`ssssssgggs2@gmail.com`).
- **Public Reads**: Public users can read only published prompts and active categories.
- **Restricted Writes**: Writes on prompts, categories, configs, and logs strictly require admin verification with schema boundary checks (`isValidPrompt()`, `isValidCategory()`).
- **Immutable Audit Trail**: `adminActivityLogs` allow create, but forbid updates and deletes.

### `storage.rules`
- Public read access for images under `/thumbnails/**`.
- Write access restricted to verified admins with content-type `image/*` and file size `< 5MB`.

---

## 4. Setup & Deployment Instructions

### 1. Environment Variables (`.env`)
The project is configured with the `prompt-studio-872ba` Firebase credentials in `.env`:
```bash
VITE_FIREBASE_API_KEY="AIzaSyDBq8tNwAIw6kScMEOSWOIlbiyDX7v73i4"
VITE_FIREBASE_AUTH_DOMAIN="prompt-studio-872ba.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="prompt-studio-872ba"
VITE_FIREBASE_STORAGE_BUCKET="prompt-studio-872ba.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="442696720006"
VITE_FIREBASE_APP_ID="1:442696720006:web:f6f3bd58bef9407d893b07"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="(default)"

# Trusted Admin Allowlist
VITE_ADMIN_EMAILS="ssssssgggs2@gmail.com,admin@promptstudio.ai"
```

### 2. Resolving "Missing or insufficient permissions" on `appConfig/ads`
If you encounter `Missing or insufficient permissions` when saving Start.io Ad Settings:
1. **Root Cause**: The live Cloud Firestore database in your project `prompt-studio-872ba` still has the initial default rules (`allow read, write: if false;`), or the deployed `isAdmin()` function did not recognize your token email.
2. **Immediate Fix in Firebase Console (1 minute)**:
   - Navigate to **[Firebase Console &rarr; Firestore Database &rarr; Rules](https://console.firebase.google.com/project/prompt-studio-872ba/firestore/rules)**.
   - Copy the complete contents of `firestore.rules` (or click "Copy firestore.rules" inside the Admin Panel's **Firebase & Security** dialog).
   - Paste into the Firebase Console rules editor and click **Publish**.
3. **Or Deploy via Firebase CLI**:
```bash
firebase use prompt-studio-872ba
firebase deploy --only firestore:rules,storage:rules
```

### 3. Granting Admin Custom Claims (Node.js Admin SDK)
Run this script locally with your Google Cloud Service Account:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function grantAdmin(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
  console.log(`Admin claim assigned to ${email} (${user.uid})`);
}

grantAdmin('ssssssgggs2@gmail.com');
```

---

## 5. Start.io Native Android Integration Note

Saving settings in this Admin Panel updates the remote Firestore document (`appConfig/ads`). To render real ads in the Prompt Studio Android mobile app:
1. Add `implementation("com.startapp:inapp-sdk:5.1.0")` in `app/build.gradle`.
2. Initialize `StartAppSDK.init(this, appId, returnAds)` in `Application.kt`.
3. Adhere to Google Play User Data policies by showing European GDPR consent dialogs.
