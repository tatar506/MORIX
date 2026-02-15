const express = require('express');
const cors = require('cors');
const app = express();

// Лимит 20мб для Base64 видео и картинок
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

// Временное хранилище в оперативной памяти
let scripts = []; 

// 1. Главная страница для проверки (чтобы знать, что сервер не упал)
app.get('/', (req, res) => {
    res.send('<h1>MORIX SCRIPTS API is Online ✅</h1>');
});

// 2. Получение списка скриптов и поиск
app.get('/scripts', (req, res) => {
    const search = req.query.search?.toLowerCase() || '';
    const filtered = scripts.filter(s => 
        s.title.toLowerCase().includes(search) || 
        (s.code && s.code.toLowerCase().includes(search))
    );
    res.json(filtered);
});

// 3. Добавление нового скрипта
app.post('/scripts', (req, res) => {
    const { title, code, mediaData, mediaType } = req.body;
    
    // Проверка на наличие данных
    if (!title || !code) {
        return res.status(400).json({ error: "Missing title or code" });
    }

    const newScript = {
        id: Date.now(),
        title,
        code,
        mediaData, // Здесь хранится картинка/видео в Base64
        mediaType, // 'image' или 'video'
        date: new Date().toLocaleDateString('ru-RU')
    };

    scripts.unshift(newScript); // Добавляем в начало списка
    res.json({ success: true });
});

// 4. Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ====================================
    MORIX SCRIPTS SERVER IS RUNNING
    Port: ${PORT}
    Status: Online
    ====================================
    `);
});
