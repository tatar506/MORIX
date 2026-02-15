const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(cors());

// Временные базы данных (в памяти)
let scripts = [];
let users = [];
let bannedIPs = new Set();
let verifiedAuthors = new Set(['tatar_506']);

const ADMIN_NAME = "tatar_506";
const ADMIN_HASH = "$2a$10$7R1pY6p1pY6p1pY6p1pY6uepB0C9xVjG4mN2z7vL8hK9zXyW3qG2S"; 

// Middleware для получения IP и проверки бана
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    req.userIP = ip;
    if (bannedIPs.has(ip)) {
        return res.status(403).json({ error: "Ваш IP адрес заблокирован." });
    }
    next();
});

// АВТОРИЗАЦИЯ
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_NAME) {
        const isAdmin = await bcrypt.compare(password, ADMIN_HASH);
        if (isAdmin) return res.json({ success: true, username: ADMIN_NAME, role: 'admin' });
    }
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Неверный логин или пароль" });
    }
    res.json({ success: true, username: user.username, role: 'user' });
});

app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) return res.status(400).json({ error: "Имя занято" });
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, ip: req.userIP });
    res.json({ success: true });
});

// СКРИПТЫ
app.get('/scripts', (req, res) => {
    const { search } = req.query;
    const data = scripts.filter(s => s.title.toLowerCase().includes(search?.toLowerCase() || ''));
    res.json(data.map(s => ({
        ...s,
        isVerified: verifiedAuthors.has(s.author)
    })));
});

app.post('/scripts', (req, res) => {
    const { title, code, mediaData, mediaType, author } = req.body;
    const newScript = {
        id: Date.now(),
        title, code, mediaData, mediaType, author,
        ip: req.userIP,
        date: new Date().toLocaleDateString('ru-RU')
    };
    scripts.unshift(newScript);
    res.json({ success: true });
});

// АДМИН-ПАНЕЛЬ
app.post('/admin/action', async (req, res) => {
    const { adminUser, adminPass, action, targetId, targetIP, targetAuthor } = req.body;
    
    // Проверка прав админа
    if (adminUser !== ADMIN_NAME || !(await bcrypt.compare(adminPass, ADMIN_HASH))) {
        return res.status(403).json({ error: "Нет прав" });
    }

    if (action === 'delete') {
        scripts = scripts.filter(s => s.id !== targetId);
    } else if (action === 'ban') {
        bannedIPs.add(targetIP);
    } else if (action === 'unban') {
        bannedIPs.delete(targetIP);
    } else if (action === 'verify') {
        verifiedAuthors.add(targetAuthor);
    }

    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`MORIX ADMIN ENGINE RUNNING`));
