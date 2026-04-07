const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//база данных
let users = [];        // массив пользователей
let products = [];     // массив товаров


//поиск пользователя по email
function findUserByEmail(email) {
    return users.find(u => u.email === email);
}

//поиск пользователя по ID
function findUserById(id) {
    return users.find(u => u.id === id);
}

//поиск товара по ID
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Товар не найден" });
        return null;
    }
    return product;
}

//хеширование пароля
async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

//проверка пароля
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

//маршруты для пользователей


app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    //проверка обязательных полей
    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    //проверка, существует ли уже пользователь с таким email
    if (findUserByEmail(email)) {
        return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    //хешируем пароль
    const hashedPassword = await hashPassword(password);

    //создаем нового пользователя
    const newUser = {
        id: nanoid(6),
        email,
        first_name,
        last_name,
        passwordHash: hashedPassword,  //храним только хеш!
        created_at: new Date().toISOString()
    };

    users.push(newUser);

    //возвращаем данные пользователя (без пароля!)
    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name
    });
});


app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    //ищем пользователя по email
    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    //проверяем пароль
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    //вход выполнен успешно
    res.json({ 
        message: "Вход выполнен успешно",
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        }
    });
});

//маршруты для товаров

//получить все товары
app.get('/api/products', (req, res) => {
    res.json(products);
});

//получить товар по ID
app.get('/api/products/:id', (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

//создать новый товар
app.post('/api/products', (req, res) => {
    const { name, category, description, price } = req.body;
    
    if (!name || !category || !description || !price) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price)
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

//полностью обновить товар
app.put('/api/products/:id', (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    
    const { name, category, description, price } = req.body;
    
    if (!name || !category || !description || !price) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }
    
    product.name = name.trim();
    product.category = category.trim();
    product.description = description.trim();
    product.price = Number(price);
    
    res.json(product);
});

//удалить товар
app.delete('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    products.splice(index, 1);
    res.status(204).send();
});

//запуск сервера
app.listen(port, () => {
    console.log(`Сервер для практики 7 запущен на http://localhost:${port}`);
    console.log(`Пользователей: ${users.length}`);
    console.log(`Товаров: ${products.length}`);
});