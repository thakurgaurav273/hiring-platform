import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let firebaseApp: App | null = null;

function isConfigured(): boolean {
    return !!(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    );
}

export function getFirebaseAdmin(): App | null {
    if (!isConfigured()) {
        return null;
    }

    if (firebaseApp) return firebaseApp;

    const existing = getApps();
    if (existing.length > 0) {
        firebaseApp = existing[0];
        return firebaseApp;
    }

    firebaseApp = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
    });

    return firebaseApp;
}

export async function sendFcmMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<void> {
    if (!tokens.length || !isConfigured()) return;

    try {
        const app = getFirebaseAdmin();
        if (!app) return;

        const messaging = getMessaging(app);

        // FCM supports up to 500 tokens per multicast
        const batchSize = 500;
        for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            const message = {
                tokens: batch,
                notification: { title, body },
                webpush: {
                    notification: {
                        title,
                        body,
                        icon: "/grovyn-icon.png",
                    },
                    fcmOptions: {
                        link: data?.link || "/",
                    },
                },
                data: data || {},
            };

            const response = await messaging.sendEachForMulticast(message);
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.warn(`[FCM] Token ${batch[idx]} failed: ${resp.error?.message}`);
                    }
                });
            }
        }
    } catch (err) {
        // Never throw — FCM failure must not break the business operation
        console.error("[FCM] sendFcmMulticast error:", err);
    }
}
