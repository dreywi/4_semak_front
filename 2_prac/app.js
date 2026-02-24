const express = require('express');
const app = express();
const port = 3000;

let items = [
    {id: 1, name: "Лягушка", cost: 1000},
    {id: 2, name: "Котик", cost: 1090},
    {id: 3, name: "Утенок", cost: 1000},
]

app.use(express.json());// для парсинга JSON

app.get('/', (req, res) => {
    res.send('Main page')
}); //создание главной страницы

//добавление нового товара
app.post('/items', (req, res) => {
    const { name, cost } = req.body;

    const New_item = {
        id: Math.floor(Math.random() * 1000) + 1,
        name,
        cost
    };

    items.push(New_item);
    res.status(201).json(New_item);
});

// получение всех товаров
app.get('/items', (res, req) => {
    res.send(JSON.stringify(items));
});

// получение товара по id
app.get('/items/:id', (req, res) => {
    let item = items.find(u => u.id == req.params.id);
    res.send(JSON.stringify(item));
});

// получение товара по id
app.get('/items/:id', (req, res) => {
    let item = items.find(u => u.id == req.params.id);
    res.send(JSON.stringify(item));
});