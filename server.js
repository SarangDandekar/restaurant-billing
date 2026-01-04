const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: !!row });
  });
});

app.get('/menu', (req, res) => {
  db.all('SELECT * FROM menu', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/add-menu-item', (req, res) => {
  const { name, price } = req.body;
  db.run('INSERT INTO menu (name, price) VALUES (?, ?)', [name, price], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/generate-bill', (req, res) => {
  const { customerPhone, items, total } = req.body;
  const date = new Date().toISOString();
  db.run(
    'INSERT INTO bills (customer_phone, items, total, date) VALUES (?, ?, ?, ?)',
    [customerPhone, JSON.stringify(items), total, date],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, billId: this.lastID });
    }
  );
});

app.get('/bills', (req, res) => {
  db.all('SELECT * FROM bills ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/print-bill/:id', (req, res) => {
  const billId = req.params.id;

  db.get('SELECT * FROM bills WHERE id = ?', [billId], (err, bill) => {
    if (err || !bill) return res.status(404).send('Bill not found');

    const items = JSON.parse(bill.items);
    const doc = new PDFDocument({ size: [226, 600], margin: 10 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    doc.pipe(res);

    doc.fontSize(14).text('FAMILY RESTAURANT', { align: 'center' });
    doc.fontSize(10).text('------------------------------', { align: 'center' });
    doc.fontSize(9).text(`Bill ID: ${bill.id}`);
    doc.text(`Phone: ${bill.customer_phone}`);
    doc.text(`Date: ${new Date(bill.date).toLocaleString()}`);
    doc.text('------------------------------');

    items.forEach(item => {
      doc.text(`${item.name} x${item.quantity}  ₹${(item.price * item.quantity).toFixed(2)}`);
    });

    doc.text('------------------------------');
    doc.fontSize(11).text(`TOTAL: ₹${bill.total.toFixed(2)}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(9).text('Thank you! Visit again 😊', { align: 'center' });

    doc.end();
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
