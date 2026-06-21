self.addEventListener("install", () => {
    self.skipWaiting();
  });
  
  self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
  });
  
  self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
  
    event.waitUntil(
      self.registration.showNotification(data.title || "DOKATA-System", {
        body: data.body || "通知があります",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: {
          url: data.url || "/home",
        },
      })
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    const url = event.notification.data?.url || "/home";
const fullUrl = new URL(url, self.location.origin).href;

event.waitUntil(clients.openWindow(fullUrl));
  });