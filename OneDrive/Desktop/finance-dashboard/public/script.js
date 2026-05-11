async function addTransaction() {

    const type = document.getElementById('type').value;
    const amount = document.getElementById('amount').value;

    await fetch('/addTransaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({type, amount})
    });

    loadTransactions();
}

async function loadTransactions() {

    const res = await fetch('/transactions');
    const data = await res.json();

    const list = document.getElementById('list');
    list.innerHTML = '';

    data.forEach(t => {
        const li = document.createElement('li');
        li.innerText = `${t.type}: ${t.amount}`;
        list.appendChild(li);
    });
}

loadTransactions();