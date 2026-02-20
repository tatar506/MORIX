const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// --- Настройка Базы Данных PostgreSQL ---
// Render сам подставит DATABASE_URL в переменные окружения
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Нужно для Render
        }
    },
    logging: false
});

// --- Модель пользователя ---
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Синхронизация БД
sequelize.sync();

// --- PeerJS для звонков ---
const peerServer = ExpressPeerServer(server, { debug: true, path: '/' });
app.use('/peerjs', peerServer);

// --- Сокеты для чата ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- API ---

// Регистрация
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: "User created" });
    } catch (e) {
        res.status(400).json({ error: "Username already exists" });
    }
});

// Вход
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ username: user.username });
    } else {
        res.status(401).json({ error: "Invalid login" });
    }
});

// Логика чата
io.on('connection', (socket) => {
    socket.on('join_room', (room) => socket.join(room));
    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`MORIX Server on port ${PORT}`));
   
