// ========== 1. Подключение к серверу ==========
const socket = io('http://localhost:3001');

// ========== 2. Элементы DOM и заметки ==========
let notes = [];

function loadNotes() {
  const notesList = document.getElementById('notes-list');
  if (!notesList) return;
  
  const stored = localStorage.getItem('notes');
  notes = stored ? JSON.parse(stored) : [];
  
  notesList.innerHTML = notes.map(note => `
    <li style="margin-bottom: 0.5rem;">
      📌 ${note.text}
      <small style="color: gray; display: block;">${note.datetime || ''}</small>
    </li>
  `).join('');
}

function addNote(text, datetime) {
  const newNote = { id: Date.now(), text, datetime: datetime || new Date().toLocaleString() };
  notes.push(newNote);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
  
  // Отправляем событие через WebSocket
  socket.emit('newTask', { text, datetime: newNote.datetime });
}

// ========== 3. Обработчик формы ==========
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');

if (form && input) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addNote(text, new Date().toLocaleString());
      input.value = '';
    }
  });
}

// ========== 4. Получение события от других клиентов ==========
socket.on('taskAdded', (task) => {
  console.log('📢 Задача от другого клиента:', task);
  
  // Показываем всплывающее сообщение
  const notification = document.createElement('div');
  notification.textContent = `✨ Новая задача: ${task.text}`;
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: #4285f4; color: white; padding: 1rem;
    border-radius: 8px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
});

// ========== 5. Push-уведомления (VAPID) ==========
const VAPID_PUBLIC_KEY = 'BHjE-otaEgfIXQizN_1GWFZV-Fn2zS0bLS_CPtIV4_hDpGxuOYS6z1H7MtMbEKYY-hB_94Sz9CM6PsOigtY3q4s';

function urlBase64ToUint8Array(base64String) {
  // Удаляем все пробелы и переносы строк
  const clean = base64String.trim();
  
  // Добавляем паддинг если нужно
  let padded = clean;
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  
  // Заменяем URL-safe символы на стандартные Base64
  const standardBase64 = padded.replace(/\-/g, '+').replace(/_/g, '/');
  
  // Декодируем
  const binaryString = atob(standardBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push не поддерживается');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    await fetch('http://localhost:3001/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('✅ Подписка на push сохранена');
  } catch (err) {
    console.error('❌ Ошибка подписки:', err);
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch('http://localhost:3001/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
    console.log('🔕 Отписка выполнена');
  }
}

// ========== 6. Регистрация Service Worker и управление кнопками ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker зарегистрирован', reg);
      
      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');
      
      if (enableBtn && disableBtn) {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        }
        
        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите в настройках браузера.');
            return;
          }
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              alert('Необходимо разрешить уведомления.');
              return;
            }
          }
          await subscribeToPush();
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        });
        
        disableBtn.addEventListener('click', async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = 'none';
          enableBtn.style.display = 'inline-block';
        });
      }
    } catch (err) {
      console.error('❌ Ошибка регистрации SW:', err);
    }
  });
}

// Загружаем заметки при старте
loadNotes();