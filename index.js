const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);

// Настройки безопасности и доступа (CORS)
app.use(cors({
    origin: "*", // Разрешаем подключение с любого сайта (твоего фронтенда)
    methods: ["GET", "POST"]
}));
app.use(express.json());

// --- Настройка PeerJS (для звонков) ---
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});
app.use('/peerjs', peerServer);

// --- Настройка Socket.IO (для чата) ---
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- Подключение к Базе Данных (MongoDB) ---
// Если запускаешь локально, замени process.env.MONGO_URI на свою ссылку
// На Render эту переменную нужно добавить в настройках "Environment Variables"
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:admin@cluster0.mongodb.net/morix?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MORIX: База данных подключена'))
    .catch(err => console.error('❌ Ошибка подключения к БД:', err));

// --- Схема пользователя ---
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// --- API Маршруты (Регистрация и Вход) ---

// Регистрация
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Проверка: существует ли пользователь
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Никнейм уже занят" });
        }

        // Хешируем пароль (чтобы не хранить в открытом виде)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({ username, password: hashedPassword });
        await user.save();
        
        res.status(201).json({ message: "Пользователь создан" });
    } catch (e) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// Вход
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (user && await bcrypt.compare(password, user.password)) {
            // Вход успешен
            res.json({ username: user.username, id: user._id });
        } else {
            res.status(401).json({ message: "Неверный логин или пароль" });
        }
    } catch (e) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// Простой роут для проверки работы сервера
app.get('/', (req, res) => {
    res.send('MORIX Server is Running...');
});

// --- Логика Чата (Socket.IO) ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Вход в комнату (чат)
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // Отправка сообщения
    socket.on('send_message', (data) => {
        // data = { room, author, message }
        // Отправляем всем в этой комнате, включая отправителя
        io.to(data.room).emit('receive_message', data);
        
        // Здесь можно добавить сохранение сообщения в MongoDB, если нужно сохранять историю
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// --- Запуск сервера ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер MORIX запущен на порту ${PORT}`);
});