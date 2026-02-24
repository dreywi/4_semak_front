const express = require('express');
const app = express();
const port = 3000;

//список товаров
let items = [
    {id: 101, name: 'тапочки', cost: 200},
    {id: 102, name: 'кружка', cost: 150},
    {id: 103, name: 'ваза', cost: 500}
]

//парсинга json
app.use(express.json());

//создание главной страницы
app.get('/', (req, res) => {
    res.send('Main page')
});

//создание нового товара
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

//получение всех товаров
app.get('/items', (req, res) => {
    res.send(JSON.stringify(items));
});

//получение товара по id
app.get('/items/:id', (req, res) => {
    let item = items.find(u => u.id == req.params.id);
    res.send(JSON.stringify(item));
});

//обновление товара по id
app.patch('/items/:id', (req, res) => {
    const item = items.find(u => u.id == req.params.id);
    const { name, cost } = req.body;

    if (name != undefined) {
        item.name = name;
    }
    if (cost != undefined) {
        item.cost = cost;
    }

    res.json(item);
});

//удаление товара по id
app.delete('/items/:id', (req, res) => {
    items = items.filter(u => u.id != req.params.id);
    res.send('OK');
});


//запуск сервера
app.listen(port, () => {
    console.log(`Сервер звпущен на http://localhost:${port}`);
});