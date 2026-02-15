const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Состояние сервера
let scripts = [];
let users = [];
let bannedIPs = new Set();
let verifiedAuthors = new Set(['tatar_506']);
let systemLogs = [];
let maintenanceMode = false;
let globalNotification = "";

const ADMIN_NAME = "tatar_506";
const ADMIN_HASH = "$2a$10$r6SgSAn9C.0fGq7p9C8CLe1XfG4u9I.5v0r4hI.4R2vO0tO6W6C6C"; // spinogrz666

// Middleware безопасности
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    req.userIP = ip;
    if (bannedIPs.has(ip)) return res.status(403).json({ error: "IP_BANNED" });
    if (maintenanceMode && req.path !== '/auth/login' && !req.headers.admin_key) {
        return res.status(503).json({ error: "MAINTENANCE" });
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
        return res.status(400).json({ error: "Invalid credentials" });
    }
    res.json({ success: true, username: user.username, role: 'user' });
});

app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) return res.status(400).json({ error: "Taken" });
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, ip: req.userIP, date: new Date() });
    res.json({ success: true });
});

// ПОЛУЧЕНИЕ ДАННЫХ
app.get('/scripts', (req, res) => {
    res.json({
        scripts: scripts.map(s => ({...s, isVerified: verifiedAuthors.has(s.author)})),
        config: { maintenanceMode, globalNotification }
    });
});

app.post('/scripts', (req, res) => {
    const { title, code, mediaData, mediaType, author } = req.body;
    scripts.unshift({ id: Date.now(), title, code, mediaData, mediaType, author, ip: req.userIP, date: new Date().toLocaleDateString() });
    res.json({ success: true });
});

// АДМИН ПАНЕЛЬ (50 ФУНКЦИЙ ЧЕРЕЗ ОДИН ЭНДПОИНТ)
app.post('/admin/execute', async (req, res) => {
    const { adminPass, action, payload } = req.body;
    const isAdmin = await bcrypt.compare(adminPass, ADMIN_HASH);
    if (!isAdmin) return res.status(403).send("Denied");

    systemLogs.push({ action, date: new Date(), payload });

    switch(action) {
        case 'get_ip': 
            const user = users.find(u => u.username === payload);
            return res.json({ ip: user ? user.ip : "Not found" });
        case 'ban_ip': bannedIPs.add(payload); break;
        case 'unban_ip': bannedIPs.delete(payload); break;
        case 'del_script': scripts = scripts.filter(s => s.id !== payload); break;
        case 'verify_user': verifiedAuthors.add(payload); break;
        case 'set_maintenance': maintenanceMode = payload; break;
        case 'set_notify': globalNotification = payload; break;
        case 'clear_scripts': scripts = []; break;
        case 'get_stats': return res.json({ users: users.length, scripts: scripts.length, banned: bannedIPs.size });
        case 'get_users_list': return res.json(users.map(u => ({n: u.username, ip: u.ip})));
        // Тут можно добавлять остальные функции...
    }
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`MORIX MASTER SYSTEM ONLINE`));
