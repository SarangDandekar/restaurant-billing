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
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('main-page').style.display = 'block';
      loadMenu();
    } else { alert('Ghalat credentials!'); }
  });
});

document.getElementById('add-menu-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('item-name').value;
  const price = document.getElementById('item-price').value;

  fetch('/add-menu-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      loadMenu();
      this.reset();
    }
  });
});

document.getElementById('menu-btn').addEventListener('click', () => showSection('menu-section'));
document.getElementById('billing-btn').addEventListener('click', () => showSection('billing-section'));
document.getElementById('history-btn').addEventListener('click', () => {
  showSection('history-section');
  loadBills();
});

function showSection(id) {
  ['menu-section', 'billing-section', 'history-section'].forEach(s => {
    document.getElementById(s).style.display = (s === id) ? 'block' : 'none';
  });
}

document.getElementById('add-item-btn').addEventListener('click', function() {
  const itemSelect = document.createElement('select');
  menuItems.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id; opt.textContent = `${item.name} - Rs. ${item.price}`;
    itemSelect.appendChild(opt);
  });
  const qty = document.createElement('input');
  qty.type = 'number'; qty.value = 1; qty.style.width = "50px";
  const add = document.createElement('button');
  add.textContent = 'Add'; add.style.width = "auto";
  add.onclick = () => {
    const item = menuItems.find(i => i.id == itemSelect.value);
    selectedItems.push({ ...item, quantity: parseInt(qty.value) });
    updateSelectedItems();
    itemSelect.remove(); qty.remove(); add.remove();
  };
  document.getElementById('selected-items').appendChild(itemSelect);
  document.getElementById('selected-items').appendChild(qty);
  document.getElementById('selected-items').appendChild(add);
});

document.getElementById('billing-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const phone = document.getElementById('whatsapp-number').value;
  fetch('/generate-bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerPhone: document.getElementById('customer-phone').value, items: selectedItems, total })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const url = `${window.location.origin}/print-bill/${data.billId}`;
      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent("*OM SAI FAMILY RESTAURANT*\nAapka bill link: " + url)}`, '_blank');
      window.open(`/print-bill/${data.billId}`, '_blank');
      selectedItems = []; total = 0; updateSelectedItems(); this.reset();
    }
  });
});

function loadMenu() {
  fetch('/menu').then(res => res.json()).then(data => {
    menuItems = data;
    document.getElementById('menu-list').innerHTML = data.map(i => `<li>${i.name} - Rs. ${i.price} <button onclick="deleteMenuItem(${i.id})" style="width:auto; background:red;">Delete</button></li>`).join('');
  });
}

function updateSelectedItems() {
  total = 0;
  document.getElementById('selected-items').innerHTML = selectedItems.map((item, i) => {
    total += item.price * item.quantity;
    return `<div class="item"><span>${item.name} x${item.quantity}</span><span>Rs. ${(item.price * item.quantity).toFixed(2)}</span><button onclick="removeItem(${i})" style="width:auto;">X</button></div>`;
  }).join('');
  document.getElementById('total').textContent = total.toFixed(2);
}

function loadBills() {
  fetch('/bills').then(res => res.json()).then(data => {
    document.getElementById('bills-list').innerHTML = data.map(b => `<li>ID: ${b.id} | Rs. ${b.total} | ${b.customer_phone} <button onclick="printThermalBill(${b.id})" style="width:auto;">Print</button> <button onclick="deleteBill(${b.id})" style="width:auto; background:red;">Del</button></li>`).join('');
  });
}

function removeItem(i) { selectedItems.splice(i, 1); updateSelectedItems(); }
function deleteBill(id) { if(confirm('Delete?')) fetch('/bills/'+id, {method:'DELETE'}).then(loadBills); }
function printThermalBill(id) { window.open('/print-bill/'+id, '_blank'); }
function deleteMenuItem(id) { if(confirm('Delete?')) fetch('/menu/'+id, {method:'DELETE'}).then(loadMenu); }
