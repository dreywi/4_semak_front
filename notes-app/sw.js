// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: ' ', reminderId: null };
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: '/icons/favicon-128x128.png',
    badge: '/icons/favicon-48x48.png',
    data: { reminderId: data.reminderId }
  };

  // Добавляем кнопку только если это напоминание
  if (data.reminderId) {
    options.actions = [
      { action: 'snooze', title: 'Отложить на 5 минут' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обработка нажатия на уведомление
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const reminderId = notification.data.reminderId;

  notification.close();

  if (action === 'snooze') {
    // Отправляем запрос на сервер для откладывания
    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
        .then(() => notification.close())
        .catch(err => console.error('Snooze failed: ', err))
    );
  } else {
    notification.close();
  }
});