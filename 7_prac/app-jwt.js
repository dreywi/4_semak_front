const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  // новая зависимость!
const cors = require('cors');

const app = express();
const port = 3000;

//секретный ключ для JWT
const JWT_SECRET = 'my_super_secret_key_12345';
const ACCESS_EXPIRES_IN = '15m';  //токен живет 15 минут

//middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//база данных
let users = [];
let products = [];

function findUserByEmail(email) {
    return users.find(u => u.email === email);
}

function findUserById(id) {
    return users.find(u => u.id === id);
}

function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Товар не найден" });
        return null;
    }
    return product;
}

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

//middleware для проверки JWT
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    
    const [scheme, token] = header.split(" ");
    
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Отсутствует или неверный заголовок Authorization" });
    }
    
    try {
        //проверяем токен
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Недействительный или просроченный токен" });
    }
}

//маршрут
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = findUserById(userId);
    
    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
    });
});

//маршруты для пользователей

app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    if (findUserByEmail(email)) {
        return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
        id: nanoid(6),
        email,
        first_name,
        last_name,
        passwordHash: hashedPassword,
        created_at: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name
    });
});

//Вход с выдачей JWT
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    //ренерация токена
    const accessToken = jwt.sign(
        {
            sub: user.id,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN
        }
    );

    res.json({
        message: "Вход выполнен успешно",
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        }
    });
});

//получить все товары (только для авторизованных)
app.get('/api/products', authMiddleware, (req, res) => {
    res.json(products);
});

//получить товар по ID (только для авторизованных)
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

//создать новый товар (только для авторизованных)
app.post('/api/products', authMiddleware, (req, res) => {
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

//полностью обновить товар (только для авторизованных)
app.put('/api/products/:id', authMiddleware, (req, res) => {
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

//далить товар (только для авторизованных)
app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    products.splice(index, 1);
    res.status(204).send();
});

//запуск сервера
app.listen(port, () => {
    console.log(`Сервер для практики 8 (с JWT) запущен на http://localhost:${port}`);
    console.log(`JWT секрет: ${JWT_SECRET}`);
    console.log(`Время жизни токена: ${ACCESS_EXPIRES_IN}`);
    console.log(`Пользователей: ${users.length}`);
    console.log(`Товаров: ${products.length}`);
});