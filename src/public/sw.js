self.addEventListener('push', function (event) {
  const data = event.data?.json() || {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag,
    requireInteraction: data.requireInteraction,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
