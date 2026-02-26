const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

//начальные товары
let products = [
    { id: nanoid(6), name: 'Пушистые тапочки', category: 'Обувь', description: 'Как облачка для ножек', price: 890, stock: 15 },
    { id: nanoid(6), name: 'Кружка с котиком', category: 'Посуда', description: 'На кружке нарисован спящий котик', price: 550, stock: 20 },
    { id: nanoid(6), name: 'Маленькая вазочка', category: 'Декор', description: 'Для одного цветочка', price: 350, stock: 12 },
    { id: nanoid(6), name: 'Уютный плед', category: 'Текстиль', description: 'Мягкий, как объятия', price: 1650, stock: 8 },
    { id: nanoid(6), name: 'Свеча "Лаванда"', category: 'Декор', description: 'Расслабляющий аромат', price: 480, stock: 18 },
    { id: nanoid(6), name: 'Кружка-большая', category: 'Посуда', description: 'Для тех, кто любит много чая', price: 590, stock: 14 },
    { id: nanoid(6), name: 'Ваза напольная', category: 'Декор', description: 'Высокая, для сухоцветов', price: 2450, stock: 3 },
    { id: nanoid(6), name: 'Носочки уютные', category: 'Одежда', description: 'Шерстяные, с узором', price: 320, stock: 25 },
    { id: nanoid(6), name: 'Коврик прикроватный', category: 'Текстиль', description: 'Мягкий и пушистый', price: 1250, stock: 7 },
    { id: nanoid(6), name: 'Набор свечей', category: 'Декор', description: '3 маленькие свечки с разными запахами', price: 780, stock: 10 }
];

//middleware
app.use(express.json());

//настройка CORS
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//middleware для запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

//функция-помощник для поиска товара
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

//маршруты
//GET /api/products - получить все товары
app.get('/api/products', (req, res) => {
    res.json(products);
});

//GET /api/products/:id - получить товар по ID
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

//POST /api/products - создать новый товар
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock } = req.body;
    
    //проверка обязательных полей
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock)
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

//PATCH /api/products/:id - обновить товар
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    //проверка, есть ли что обновлять
    if (req.body?.name === undefined && 
        req.body?.category === undefined && 
        req.body?.description === undefined && 
        req.body?.price === undefined && 
        req.body?.stock === undefined) {
        return res.status(400).json({ error: "Nothing to update" });
    }
    
    const { name, category, description, price, stock } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    
    res.json(product);
});

//DELETE /api/products/:id - удалить товар
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    if (!exists) return res.status(404).json({ error: "Product not found" });
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

//404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

//глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

//запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Товаров в базе: ${products.length}`);
});