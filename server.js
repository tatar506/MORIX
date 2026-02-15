const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(cors());

// Хранилища (в оперативной памяти)
let scripts = [];
let users = [];
let bannedIPs = new Set();
let verifiedAuthors = new Set(['tatar_506']);

const ADMIN_NAME = "tatar_506";
// Хэш для пароля: spinogrz666
const ADMIN_HASH = "$2a$10$r6SgSAn9C.0fGq7p9C8CLe1XfG4u9I.5v0r4hI.4R2vO0tO6W6C6C";

// Middleware проверки бана
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    req.userIP = ip;
    if (bannedIPs.has(ip)) return res.status(403).json({ error: "Your IP is banned" });
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
    const { id, search } = req.query;
    if (id) return res.json(scripts.find(s => s.id == id) || { error: "Not found" });

    let filtered = scripts.filter(s => s.title.toLowerCase().includes(search?.toLowerCase() || ''));
    res.json(filtered.map(s => ({ ...s, isVerified: verifiedAuthors.has(s.author) })));
});

app.post('/scripts', (req, res) => {
    const { title, code, mediaData, mediaType, author } = req.body;
    const newScript = {
        id: Date.now(),
        title, code, mediaData, mediaType, author, ip: req.userIP,
        date: new Date().toLocaleDateString('ru-RU')
    };
    scripts.unshift(newScript);
    res.json({ success: true });
});

// АДМИН ПАНЕЛЬ
app.post('/admin/action', async (req, res) => {
    const { adminPass, action, targetId, targetIP, targetAuthor } = req.body;
    const isAdmin = await bcrypt.compare(adminPass, ADMIN_HASH);
    if (!isAdmin) return res.status(403).send("No access");

    if (action === 'delete') scripts = scripts.filter(s => s.id !== targetId);
    if (action === 'ban') bannedIPs.add(targetIP);
    if (action === 'unban') bannedIPs.delete(targetIP);
    if (action === 'verify') verifiedAuthors.add(targetAuthor);

    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`MORIX UP ON ${PORT}`));
