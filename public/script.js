let menuItems = [];
let selectedItems = [];
let total = 0;

document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('main-page').style.display = 'block';
      loadMenu();
    } else {
      alert('Invalid credentials');
    }
  });
});

document.getElementById('menu-btn').addEventListener('click', function() {
  document.getElementById('menu-section').style.display = 'block';
  document.getElementById('billing-section').style.display = 'none';
});

document.getElementById('billing-btn').addEventListener('click', function() {
  document.getElementById('menu-section').style.display = 'none';
  document.getElementById('billing-section').style.display = 'block';
  document.getElementById('history-section').style.display = 'none';
});

document.getElementById('history-btn').addEventListener('click', function() {
  document.getElementById('menu-section').style.display = 'none';
  document.getElementById('billing-section').style.display = 'none';
  document.getElementById('history-section').style.display = 'block';
  loadBills();
});

document.getElementById('add-menu-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('item-name').value;
  const price = parseFloat(document.getElementById('item-price').value);

  fetch('/add-menu-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadMenu();
      document.getElementById('item-name').value = '';
      document.getElementById('item-price').value = '';
    }
  });
});

document.getElementById('add-item-btn').addEventListener('click', function() {
  const itemSelect = document.createElement('select');
  menuItems.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} - ₹${item.price}`;
    itemSelect.appendChild(option);
  });

  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.min = 1;
  quantityInput.value = 1;

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add';
  addBtn.addEventListener('click', function() {
    const itemId = itemSelect.value;
    const quantity = parseInt(quantityInput.value);
    const item = menuItems.find(i => i.id == itemId);
    selectedItems.push({ ...item, quantity });
    updateSelectedItems();
    itemSelect.remove();
    quantityInput.remove();
    addBtn.remove();
  });

  document.getElementById('selected-items').appendChild(itemSelect);
  document.getElementById('selected-items').appendChild(quantityInput);
  document.getElementById('selected-items').appendChild(addBtn);
});

document.getElementById('billing-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const customerPhone = document.getElementById('customer-phone').value;
  const whatsappNumber = document.getElementById('whatsapp-number').value;

  fetch('/generate-bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerPhone, whatsappNumber, items: selectedItems, total })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Bill generated and sent via WhatsApp!');
      // Open PDF and print
      const pdfWindow = window.open(`/bills/bill_${data.billId}.pdf`, '_blank');
      pdfWindow.onload = function() {
        pdfWindow.print();
      };
      selectedItems = [];
      total = 0;
      updateSelectedItems();
      document.getElementById('customer-phone').value = '';
      document.getElementById('whatsapp-number').value = '';
    }
  });
});

function loadMenu() {
  fetch('/menu')
  .then(response => response.json())
  .then(data => {
    menuItems = data;
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ₹${item.price}`;
      menuList.appendChild(li);
    });
  });
}

function updateSelectedItems() {
  const selectedItemsDiv = document.getElementById('selected-items');
  selectedItemsDiv.innerHTML = '';
  total = 0;
  selectedItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.innerHTML = `
      <span>${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}</span>
      <button onclick="removeItem(${index})">Remove</button>
    `;
    selectedItemsDiv.appendChild(itemDiv);
    total += item.price * item.quantity;
  });
  document.getElementById('total').textContent = total.toFixed(2);
}

function removeItem(index) {
  selectedItems.splice(index, 1);
  updateSelectedItems();
}

function loadBills() {
  fetch('/bills')
  .then(response => response.json())
  .then(data => {
    const billsList = document.getElementById('bills-list');
    billsList.innerHTML = '';
    data.forEach(bill => {
      const li = document.createElement('li');
      const items = JSON.parse(bill.items);
      const itemsText = items.map(item => `${item.name} x${item.quantity}`).join(', ');
       li.innerHTML = `
  <strong>Bill ID: ${bill.id}</strong><br>
  Customer Phone: ${bill.customer_phone}<br>
  Items: ${itemsText}<br>
  Total: ₹${bill.total.toFixed(2)}<br>
  Date: ${new Date(bill.date).toLocaleString()}<br><br>
  <button onclick="printThermalBill(${bill.id})">Print</button>
`;
      billsList.appendChild(li);
    });
  });
}
function printThermalBill(billId) {
  const win = window.open(`/print-bill/${billId}`, '_blank');
  win.onload = () => {
    win.print();
  };
}

