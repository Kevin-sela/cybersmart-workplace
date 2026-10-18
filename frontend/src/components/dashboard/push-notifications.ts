"use client";

export type OneSignalApi = {
  init: (options: { appId: string; serviceWorkerPath: string; serviceWorkerParam: { scope: string } }) => Promise<void>;
  Notifications: {
    permission: boolean;
    permissionNative: string;
    requestPermission: () => Promise<void>;
  };
  User: { PushSubscription: { optedIn: boolean; optIn: () => Promise<void> } };
};

declare global {
  interface Window { OneSignalDeferred?: Array<(OneSignal: OneSignalApi) => void> }
}

let loadPromise: Promise<void> | null = null;
let oneSignalClient: OneSignalApi | null = null;

export function loadOneSignal(): Promise<void> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return Promise.reject(new Error("Push notifications aren’t configured yet. Add the OneSignal App ID to the frontend environment."));
  if (window.OneSignalDeferred) return loadPromise ?? Promise.resolve();

  window.OneSignalDeferred = [];
  loadPromise = new Promise((resolve, reject) => {
    window.OneSignalDeferred?.push(async (OneSignal) => {
      try {
        await OneSignal.init({ appId, serviceWorkerPath: "/OneSignalSDKWorker.js", serviceWorkerParam: { scope: "/" } });
        oneSignalClient = OneSignal;
        resolve();
      } catch (error) { reject(error); }
    });
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onerror = () => reject(new Error("Could not load the OneSignal browser SDK."));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function enablePushNotifications(): Promise<void> {
  await loadOneSignal();
  const OneSignal = oneSignalClient;
  if (!OneSignal) throw new Error("OneSignal did not finish initializing. Please try again.");
  if (OneSignal.Notifications.permissionNative === "granted") {
    await OneSignal.User.PushSubscription.optIn();
    return;
  }
  await OneSignal.Notifications.requestPermission();
  if (window.Notification?.permission === "granted") await OneSignal.User.PushSubscription.optIn();
}

export function isPushEnabled(): boolean {
  return Boolean(oneSignalClient?.User.PushSubscription.optedIn);
}
