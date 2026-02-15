const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let scripts = []; 

// ТЕСТОВАЯ СТРАНИЦА (Просто открой ссылку в браузере)
app.get('/', (req, res) => {
    res.send('MORIX API IS WORKING! ✅');
});

app.get('/scripts', (req, res) => {
    const search = req.query.search?.toLowerCase() || '';
    const filtered = scripts.filter(s => 
        s.title.toLowerCase().includes(search) || 
        (s.description && s.description.toLowerCase().includes(search)) ||
        s.code.toLowerCase().includes(search)
    );
    res.json(filtered);
});

app.post('/scripts', (req, res) => {
    const { title, description, code } = req.body;

    if (!title || !code) {
        return res.status(400).json({ error: "Title and Code are required!" });
    }

    const newScript = {
        id: Date.now(),
        title,
        description: description || "Без описания",
        code,
        date: new Date().toLocaleDateString('ru-RU')
    };

    scripts.unshift(newScript);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
                                               
