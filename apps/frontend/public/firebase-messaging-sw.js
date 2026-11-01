// Firebase Cloud Messaging Service Worker
// This file MUST be in /public and served at /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const urlParams = new URLSearchParams(location.search);

firebase.initializeApp({
  apiKey: urlParams.get('apiKey') || "",
  authDomain: urlParams.get('authDomain') || "",
  projectId: urlParams.get('projectId') || "",
  storageBucket: urlParams.get('storageBucket') || "",
  messagingSenderId: urlParams.get('messagingSenderId') || "",
  appId: urlParams.get('appId') || "",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Grovyn Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/grovyn-icon.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — navigate to the link
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === link && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
