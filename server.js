const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const db = require('./database');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/login', async (req, res) => {
  const user = await db.Admin.findOne({ username: req.body.username, password: req.body.password });
  res.json({ success: !!user });
});

app.get('/menu', async (req, res) => {
  const items = await db.Menu.find();
  res.json(items);
});

app.post('/add-menu-item', async (req, res) => {
  const newItem = await db.Menu.create(req.body);
  res.json({ success: true, id: newItem._id });
});

app.delete('/menu/:id', async (req, res) => {
  await db.Menu.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.post('/generate-bill', async (req, res) => {
  const lastBill = await db.Bill.findOne({ billNumber: { $exists: true } }).sort({ billNumber: -1 });
  const billNumber = lastBill && lastBill.billNumber ? lastBill.billNumber + 1 : 1;
  const newBill = await db.Bill.create({
    billNumber,
    customer_phone: req.body.customerPhone,
    items: req.body.items,
    total: req.body.total
  });
  res.json({ success: true, billId: newBill._id });
});

app.get('/bills', async (req, res) => {
  const bills = await db.Bill.find().sort({ date: -1 });
  res.json(bills);
});

app.delete('/bills/:id', async (req, res) => {
  await db.Bill.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get('/print-bill/:id', async (req, res) => {
  const bill = await db.Bill.findById(req.params.id);
  if (!bill) return res.status(404).send('Bill not found');

  const doc = new PDFDocument({ size: [226, 600], margin: 10 });
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(14).text('OM SAI FAMILY RESTAURANT', { align: 'center' });
  doc.font('Helvetica').fontSize(8).text('Veg & Non-Veg | Free Wi-Fi', { align: 'center' });
  doc.text('Bypass Road, Samudrapur', { align: 'center' });
  doc.fontSize(10).text('-----------------------------------', { align: 'center' });

  doc.fontSize(9).text(`Bill No: ${bill.billNumber}`);
  doc.text(`Phone: ${bill.customer_phone}`);
  doc.text(`Date: ${new Date(bill.date).toLocaleString()}`);
  doc.text('-----------------------------------');

  bill.items.forEach(item => {
    doc.text(`${item.name} x${item.quantity}  Rs. ${(item.price * item.quantity).toFixed(2)}`);
  });

  doc.text('-----------------------------------');
  doc.fontSize(11).font('Helvetica-Bold').text(`TOTAL: Rs. ${bill.total.toFixed(2)}`, { align: 'right' });
  doc.font('Helvetica').fontSize(8).text('Thank you, visit again!', { align: 'center' });
  doc.end();
});

app.listen(port, () => console.log(`Server running on port ${port}`));
