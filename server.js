const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(cors());

// Хранилища
let scripts = [];
let users = [];

// Хэшированный пароль админа (пароль: spinogrz666)
const ADMIN_NAME = "tatar_506";
const ADMIN_HASH = "$2a$10$7R1pY6p1pY6p1pY6p1pY6uepB0C9xVjG4mN2z7vL8hK9zXyW3qG2S"; 

// Регистрация
app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) return res.status(400).json({ error: "Имя занято" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.json({ success: true });
});

// Вход
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    // Проверка админа
    if (username === ADMIN_NAME) {
        const isAdmin = await bcrypt.compare(password, ADMIN_HASH);
        if (isAdmin) return res.json({ success: true, username: ADMIN_NAME, role: 'admin' });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Неверный логин или пароль" });
    }
    res.json({ success: true, username: user.username, role: 'user' });
});

// Получение скриптов
app.get('/scripts', (req, res) => {
    const { id, search } = req.query;
    if (id) {
        const script = scripts.find(s => s.id == id);
        return res.json(script || { error: "Не найден" });
    }
    const filtered = scripts.filter(s => 
        s.title.toLowerCase().includes(search?.toLowerCase() || '')
    );
    res.json(filtered);
});

// Публикация
app.post('/scripts', (req, res) => {
    const { title, code, mediaData, mediaType, author } = req.body;
    const newScript = {
        id: Date.now(),
        title, code, mediaData, mediaType, author,
        date: new Date().toLocaleDateString('ru-RU')
    };
    scripts.unshift(newScript);
    res.json({ success: true, id: newScript.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`MORIX SECURE UP`));
