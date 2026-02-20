// ... (предыдущий код с PostgreSQL остается, добавляем новые роуты)

// Поиск пользователей
app.get('/search/:query', async (req, res) => {
    const users = await User.findAll({
        where: { username: { [Sequelize.Op.iLike]: `%${req.params.query}%` } },
        attributes: ['username']
    });
    res.json(users);
});

// Схема Групп
const Group = sequelize.define('Group', {
    name: { type: DataTypes.STRING, allowNull: false },
    creator: { type: DataTypes.STRING }
});
sequelize.sync();

// Создание группы
app.post('/groups', async (req, res) => {
    const { name, creator } = req.body;
    const group = await Group.create({ name, creator });
    res.json(group);
});

// Получение списка групп
app.get('/groups', async (req, res) => {
    const groups = await Group.findAll();
    res.json(groups);
});
              
