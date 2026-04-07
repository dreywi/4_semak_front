const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

//подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

//middleware для парсинга JSON
app.use(express.json());

//настройка CORS
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//товары
let products = [
    { id: nanoid(6), name: 'Тапочки домашние', category: 'Обувь', description: 'Мягкие и пушистые, на войлочной подошве', price: 890, stock: 15 },
    { id: nanoid(6), name: 'Керамическая кружка', category: 'Посуда', description: 'Объем 350 мл, рисунок на выбор', price: 450, stock: 22 },
    { id: nanoid(6), name: 'Стеклянная ваза', category: 'Декор', description: 'Высота 25 см, прозрачное стекло', price: 1200, stock: 8 },
    { id: nanoid(6), name: 'Плед плюшевый', category: 'Текстиль', description: 'Мягкий плед 150x200 см, цвет бежевый', price: 1800, stock: 12 },
    { id: nanoid(6), name: 'Ароматическая свеча', category: 'Декор', description: 'С запахом ванили и корицы, горит 40 часов', price: 650, stock: 25 },
    { id: nanoid(6), name: 'Чайный набор', category: 'Посуда', description: 'Заварочный чайник + 2 чашки', price: 2100, stock: 6 },
    { id: nanoid(6), name: 'Полотенце махровое', category: 'Текстиль', description: '70x140 см, 100% хлопок', price: 550, stock: 30 },
    { id: nanoid(6), name: 'Подставка под горячее', category: 'Кухня', description: 'Набор из 4 штук, бамбук', price: 350, stock: 18 },
    { id: nanoid(6), name: 'Картина-панно', category: 'Декор', description: 'Модульная картина 60x80 см', price: 2200, stock: 4 },
    { id: nanoid(6), name: 'Домашние тапочки', category: 'Обувь', description: 'С мехом внутри, нескользящая подошва', price: 1100, stock: 10 }
];


//описание API для swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина "Домашний уют"',
            version: '1.0.0',
            description: 'API для управления товарами в магазине (тапочки, кружки, вазы и т.д.)',
            contact: {
                name: 'Студентка 4 семестра'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер'
            }
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    required: ['name', 'category', 'description', 'price', 'stock'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Уникальный ID товара (генерируется автоматически)',
                            example: 'abc123'
                        },
                        name: {
                            type: 'string',
                            description: 'Название товара',
                            example: 'Тапочки домашние'
                        },
                        category: {
                            type: 'string',
                            description: 'Категория товара',
                            example: 'Обувь'
                        },
                        description: {
                            type: 'string',
                            description: 'Подробное описание товара',
                            example: 'Мягкие и пушистые, на войлочной подошве'
                        },
                        price: {
                            type: 'number',
                            description: 'Цена в рублях',
                            example: 890
                        },
                        stock: {
                            type: 'integer',
                            description: 'Количество на складе',
                            example: 15
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Сообщение об ошибке'
                        }
                    }
                }
            }
        }
    },
    //путь к файлам с JSDoc-комментариями
    apis: ['./app-swagger.js'],
};

//генерируем спецификацию
const swaggerSpec = swaggerJsdoc(swaggerOptions);

//подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//функция для поиска товара по ID
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Товар не найден" });
        return null;
    }
    return product;
}

//маршруты API

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Товары]
 *     responses:
 *       200:
 *         description: Успешный запрос. Возвращает массив товаров.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *         example: abc123
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Товары]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название товара
 *                 example: 'Новые тапочки'
 *               category:
 *                 type: string
 *                 description: Категория товара
 *                 example: 'Обувь'
 *               description:
 *                 type: string
 *                 description: Описание товара
 *                 example: 'Очень мягкие и удобные'
 *               price:
 *                 type: number
 *                 description: Цена в рублях
 *                 example: 990
 *               stock:
 *                 type: integer
 *                 description: Количество на складе
 *                 example: 5
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в данных запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock } = req.body;
    
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: "Все поля обязательны" });
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить существующий товар
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое название товара
 *               category:
 *                 type: string
 *                 description: Новая категория
 *               description:
 *                 type: string
 *                 description: Новое описание
 *               price:
 *                 type: number
 *                 description: Новая цена
 *               stock:
 *                 type: integer
 *                 description: Новое количество на складе
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    if (req.body?.name === undefined && 
        req.body?.category === undefined && 
        req.body?.description === undefined && 
        req.body?.price === undefined && 
        req.body?.stock === undefined) {
        return res.status(400).json({ error: "Нет данных для обновления" });
    }
    
    const { name, category, description, price, stock } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара для удаления
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

//запуск сервера

app.listen(port, () => {
    console.log(`Сервер с Swagger запущен на http://localhost:${port}`);
    console.log(`Документация Swagger: http://localhost:${port}/api-docs`);
    console.log(`Товаров в базе: ${products.length}`);
});