const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let transactions = [];

app.post('/addTransaction', (req, res) => {
    transactions.push(req.body);
    res.send({message: "Transaction Added"});
});

app.get('/transactions', (req, res) => {
    res.send(transactions);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});