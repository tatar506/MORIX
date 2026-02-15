const express = require('express');
const cors = require('cors');
const luaparse = require('luaparse');
const app = express();

app.use(cors());
app.use(express.json());

let scripts = []; // Временное хранилище (после перезагрузки Render очистится)

// Функция проверки на Lua
function isLuaCode(code) {
    try {
        luaparse.parse(code); // Пытаемся распарсить
        // Проверка на наличие базовых слов Lua
        const luaKeywords = ['local', 'function', 'end', 'if', 'then', 'print', 'while', 'game', 'loadstring', 'HttpGet', 'workspace', 'wait', 'script', 'require', 'loadstring(game:HttpGet(''))()' ];
        return luaKeywords.some(key => code.includes(key));
    } catch (e) {
        return false;
    }
}

// Получение скриптов (с поиском)
app.get('/scripts', (req, res) => {
    const search = req.query.search?.toLowerCase() || '';
    const filtered = scripts.filter(s => 
        s.title.toLowerCase().includes(search) || 
        s.description.toLowerCase().includes(search)
    );
    res.json(filtered);
});

// Публикация скрипта
app.post('/scripts', (req, res) => {
    const { title, description, code } = req.body;

    if (!isLuaCode(code)) {
        return res.status(400).json({ error: "Это не Lua код или обычный текст!" });
    }

    const newScript = {
        id: Date.now(),
        title,
        description,
        code,
        date: new Date().toLocaleDateString()
    };

    scripts.unshift(newScript);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
