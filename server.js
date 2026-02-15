const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let scripts = []; // Хранилище (очищается при перезагрузке Render)

// Получение списка скриптов и поиск
app.get('/scripts', (req, res) => {
    const search = req.query.search?.toLowerCase() || '';
    const filtered = scripts.filter(s => 
        s.title.toLowerCase().includes(search) || 
        s.description.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search)
    );
    res.json(filtered);
});

// Публикация (теперь БЕЗ модерации)
app.post('/scripts', (req, res) => {
    const { title, description, code } = req.body;

    // Простая проверка: чтобы пост не был совсем пустым
    if (!title || !code) {
        return res.status(400).json({ error: "Заполни название и вставь код!" });
    }

    const newScript = {
        id: Date.now(),
        title,
        description: description || "Без описания",
        code,
        date: new Date().toLocaleDateString('ru-RU')
    };

    scripts.unshift(newScript); // Добавляем в начало списка
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MORIX Server running on port ${PORT}`));
