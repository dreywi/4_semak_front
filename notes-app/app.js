// ========== 1. ПОДКЛЮЧЕНИЕ К СЕРВЕРУ ==========
const socket = io();

// ========== 2. ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ==========
function initNotes() {
  console.log('initNotes вызвана');
  
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');
  const list = document.getElementById('notes-list');

  console.log('Формы найдены:', { 
    form: !!form, 
    reminderForm: !!reminderForm 
  });

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (!list) return;
    
    if (notes.length === 0) {
      list.innerHTML = '<li>Нет заметок</li>';
      return;
    }
    
    list.innerHTML = notes.map(note => {
      let reminderInfo = '';
      if (note.reminder) {
        const date = new Date(note.reminder);
        reminderInfo = `<br><small>🔔 Напоминание: ${date.toLocaleString()}</small>`;
      }
      return `
        <li class="card" style="margin-bottom: 0.5rem; padding: 1rem;">
          <strong>${note.text}</strong>
          ${reminderInfo}
          <br><small>🆔 ID: ${note.id}</small>
        </li>
      `;
    }).join('');
  }

  // Обычная форма
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const newNote = { id: Date.now(), text: text };
        notes.push(newNote);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
        socket.emit('newNote', { text: text });
        input.value = '';
        console.log('Обычная заметка добавлена:', text);
      }
    });
  }

  // Форма с напоминанием
  if (reminderForm) {
    reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = reminderText.value.trim();
      const reminderDateTime = reminderTime.value;

      if (text && reminderDateTime) {
        const reminderTimestamp = new Date(reminderDateTime).getTime();
        if (reminderTimestamp <= Date.now()) {
          alert('Выберите будущую дату и время');
          return;
        }

        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const newNote = {
          id: Date.now(),
          text: text,
          reminder: reminderTimestamp
        };
        notes.push(newNote);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();

        socket.emit('newReminder', {
          id: newNote.id,
          text: text,
          reminderTime: reminderTimestamp
        });

        reminderText.value = '';
        reminderTime.value = '';
        console.log('Напоминание добавлено:', text, new Date(reminderTimestamp).toLocaleString());
        alert(`Напоминание запланировано на ${new Date(reminderTimestamp).toLocaleString()}`);
      }
    });
  }

  loadNotes();
}

// ========== 3. ЗАГРУЗКА HOME.HTML ИЗ ПАПКИ CONTENT ==========
fetch('/content/home.html')  // ← ВАЖНО: путь /content/home.html
  .then(response => {
    if (!response.ok) throw new Error('home.html не найден');
    return response.text();
  })
  .then(data => {
    const container = document.getElementById('home-container');
    if (container) {
      container.innerHTML = data;
      console.log('home.html загружен из /content/');
      initNotes();
    }
  })
  .catch(err => console.error('Ошибка загрузки home.html:', err));

// ========== 4. РЕГИСТРАЦИЯ SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker зарегистрирован', reg))
    .catch(err => console.error('Ошибка SW:', err));
}