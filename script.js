// Вставь URL своего сервера с Render
const SERVER_URL = "https://your-app-name.onrender.com"; 

let socket;
let currentUser = null;
let peer;
let myStream;

// --- Мобильная навигация ---
function openChat(roomName) {
    // Логика для мобильных: показываем экран чата
    const chatView = document.getElementById('chat-view');
    chatView.classList.add('active');
    
    document.getElementById('current-chat-name').innerText = roomName;
    
    // Подключение к комнате (Socket.IO)
    if(socket) {
        // Сначала выходим из старых, если нужно (упрощенно)
        socket.emit('join_room', roomName);
        document.getElementById('messages').innerHTML = ''; // Чистим чат при смене
    }
}

function backToMenu() {
    // Логика для мобильных: возвращаемся к списку
    const chatView = document.getElementById('chat-view');
    chatView.classList.remove('active');
}

// --- Авторизация ---
async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if(!user || !pass) return alert("Введите данные");

    try {
        const res = await fetch(`${SERVER_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.username;
            initApp();
        } else {
            document.getElementById('auth-error').innerText = "Ошибка входа";
        }
    } catch (e) {
        document.getElementById('auth-error').innerText = "Ошибка сервера";
    }
}

async function register() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if(!user || !pass) return alert("Введите данные");

    try {
        const res = await fetch(`${SERVER_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (res.ok) {
            alert("MORIX: Регистрация успешна! Войдите.");
        } else {
            alert("Ник занят");
        }
    } catch (e) {
        alert("Ошибка сервера");
    }
}

// --- Инициализация ---
function initApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('my-username').innerText = currentUser;

    socket = io(SERVER_URL);
    
    peer = new Peer(currentUser, {
        host: new URL(SERVER_URL).hostname,
        port: 443,
        path: '/peerjs',
        secure: true
    });

    // По умолчанию открываем Global (для пк)
    if(window.innerWidth > 768) {
        openChat('Global');
    }

    socket.on('receive_message', (data) => {
        addMessageToUI(data);
    });

    // Входящий звонок
    peer.on('call', (call) => {
        if(confirm(`MORIX: Звонок от ${call.peer}. Ответить?`)) {
            navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream) => {
                myStream = stream;
                document.getElementById('call-modal').classList.remove('hidden');
                document.getElementById('local-video').srcObject = stream;
                call.answer(stream);
                call.on('stream', (remoteStream) => {
                    document.getElementById('remote-video').srcObject = remoteStream;
                });
            });
        }
    });
}

// --- Чат ---
function sendMessage() {
    const input = document.getElementById('msg-input');
    const msg = input.value;
    const room = document.getElementById('current-chat-name').innerText;
    
    if (msg) {
        const data = { room: room, author: currentUser, message: msg };
        socket.emit('send_message', data);
        input.value = '';
    }
}

// Отправка по Enter
document.getElementById('msg-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

function addMessageToUI(data) {
    // Проверяем, открыта ли сейчас эта комната
    const currentRoom = document.getElementById('current-chat-name').innerText;
    if(data.room !== currentRoom) return; // Уведомления пока не делаем

    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.classList.add('message');
    if (data.author === currentUser) div.classList.add('my-message');
    
    // Защита от XSS (вставка скриптов)
    div.textContent = data.message;
    const meta = document.createElement('div');
    meta.style.fontSize = "10px";
    meta.style.opacity = "0.7";
    meta.style.marginTop = "4px";
    meta.innerText = data.author;
    div.prepend(meta);

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// --- Звонки ---
function startCall(isVideo) {
    const targetUser = prompt("Введите ник пользователя MORIX:");
    if (!targetUser || targetUser === currentUser) return;

    document.getElementById('call-modal').classList.remove('hidden');
    
    navigator.mediaDevices.getUserMedia({video: isVideo, audio: true})
    .then((stream) => {
        myStream = stream;
        document.getElementById('local-video').srcObject = stream;
        
        const call = peer.call(targetUser, stream);
        call.on('stream', (remoteStream) => {
            document.getElementById('remote-video').srcObject = remoteStream;
        });
    })
    .catch(err => {
        alert("Ошибка доступа к камере/микрофону");
        document.getElementById('call-modal').classList.add('hidden');
    });
}

function shareScreen() {
    if(!myStream) return;
    navigator.mediaDevices.getDisplayMedia({ cursor: true })
    .then(screenStream => {
        const videoTrack = screenStream.getVideoTracks()[0];
        // Замена трека - сложная тема, для MVP просто меняем локальное видео
        document.getElementById('local-video').srcObject = screenStream;
        videoTrack.onended = () => {
             // Вернуть камеру (нужна доп логика)
        };
    });
}

function endCall() {
    if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('call-modal').classList.add('hidden');
    window.location.reload(); // Простой способ сбросить Peer соединения
}