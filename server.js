const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let scripts = []; 

app.get('/', (req, res) => res.send('MORIX API IS WORKING! ✅'));

app.get('/scripts', (req, res) => {
    const search = req.query.search?.toLowerCase() || '';
    const filtered = scripts.filter(s => 
        s.title.toLowerCase().includes(search) || 
        s.code.toLowerCase().includes(search)
    );
    res.json(filtered);
});

app.post('/scripts', (req, res) => {
    const { title, description, code, mediaUrl, mediaType } = req.body;

    if (!title || !code) {
        return res.status(400).json({ error: "Название и код обязательны!" });
    }

    const newScript = {
        id: Date.now(),
        title,
        description: description || "Без описания",
        code,
        mediaUrl: mediaUrl || null, // Ссылка на картинку/видео
        mediaType: mediaType || null, // 'image' или 'video'
        date: new Date().toLocaleDateString('ru-RU')
    };

    scripts.unshift(newScript);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
