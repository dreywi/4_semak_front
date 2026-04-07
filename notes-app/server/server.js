const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ===== ВСТАВЬ СВОИ VAPID-КЛЮЧИ =====
const vapidKeys = {
  publicKey: 'BHjE-otaEgfIXQizN_1GWFZV-Fn2zS0bLS_CPtIV4_hDpGxuOYS6z1H7MtMbEKYY-hB_94Sz9CM6PsOigtY3q4s',
  privateKey: 'gLs-uTKsBTbiigrGoMBqUxGtWoUlavM_FlmePHWaT-E'
};

webpush.setVapidDetails(
  'mailto:nizharadzedt@mail.ru',  // замени на свой email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздаём статические файлы из родительской папки (notes-app)
app.use(express.static(path.join(__dirname, '..')));


const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// WebSocket соединение
io.on('connection', (socket) => {
  console.log('✅ Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    console.log('📨 Новая задача от клиента:', task);

    // Рассылаем всем подключённым клиентам
    io.emit('taskAdded', task);

    // Отправляем push-уведомления всем подписанным клиентам
    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task.text
    });

    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => {
        console.error('❌ Push error:', err);
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Клиент отключён:', socket.id);
  });
});

// Эндпоинт для подписки на push
app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Подписка сохранена' });
});

// Эндпоинт для отписки
app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});