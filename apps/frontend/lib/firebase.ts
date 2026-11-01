import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { registerFcmToken } from "@/services/api/notifications.service";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  return app;
}

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null; // SSR guard
  if (!isFirebaseConfigured()) return null;
  if (messaging) return messaging;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch {
    return null;
  }
}

let messageUnsubscribe: (() => void) | null = null;

/**
 * Request browser notification permission, get an FCM token, register it
 * with the backend, and set up a foreground message handler.
 *
 * Call this once per session after the user is authenticated.
 * All errors are caught — this must never break the app.
 */
export async function requestFcmPermission(
  onForegroundMessage?: (payload: any) => void
): Promise<(() => void) | void> {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured()) {
    console.info("[FCM] Firebase not configured — push notifications disabled.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info("[FCM] Notification permission denied.");
      return;
    }

    const msg = getFirebaseMessaging();
    if (!msg) return;

    // Explicitly register the service worker with config in the URL params
    const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`;
    const registration = await navigator.serviceWorker.register(swUrl);

    const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return;

    await registerFcmToken(token);

    if (messageUnsubscribe) {
      messageUnsubscribe();
    }

    // Handle foreground messages (app is open & focused)
    messageUnsubscribe = onMessage(msg, (payload) => {
      if (onForegroundMessage) {
        onForegroundMessage(payload);
      }
    });

    return messageUnsubscribe;
  } catch (err) {
    console.error("[FCM] requestFcmPermission error:", err);
    // Never rethrow
  }
}
