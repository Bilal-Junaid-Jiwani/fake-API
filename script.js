// API + element refs
const apiURL = 'https://dummyjson.com';

const homeSection = document.getElementById('home-section');
const productsContainer = document.getElementById('products');
const skeleton = document.getElementById('skeleton');
const categoriesNav = document.getElementById('categories');
const categoriesRail = document.getElementById('categoriesRail');

const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');

const cartPanel = document.getElementById('cartPanel');
const wishlistPanel = document.getElementById('wishlistPanel');
const panelOverlay = document.getElementById('panelOverlay');

const cartBtn = document.getElementById('cartBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const cartCount = document.getElementById('cartCount');
const wishCount = document.getElementById('wishCount');
const menuToggle = document.getElementById('menuToggle');

const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const themeToggle = document.getElementById('themeToggle');
const toastStack = document.getElementById('toastStack');
const quickChips = document.getElementById('quickChips');

// State
let allProducts = [];
let currentCategory = '';
let query = '';
let sort = '';

// Utilities
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fmt = (n) => `$${Number(n).toFixed(2)}`;

function setTheme(initial=false){
  const saved = localStorage.getItem('theme') || 'dark';
  if(saved === 'light'){ document.documentElement.classList.add('light'); }
  else { document.documentElement.classList.remove('light'); }
  if(!initial){
    localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }
}
function toggleTheme(){
  document.documentElement.classList.toggle('light');
  localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
}

function showToast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  toastStack.appendChild(t);
  setTimeout(()=>{
    t.style.transform = 'translateY(-4px)'; t.style.opacity = '0.96';
  }, 10);
  setTimeout(()=>{
    t.style.opacity = '0'; t.style.transform = 'translateY(0)';
    setTimeout(()=> t.remove(), 300);
  }, 2500);
}

// Modal
function showModal(message) {
  modalMessage.innerHTML = message;
  modal.style.display = 'flex';
}
function closeModal(event) {
  if (!event || event.target === modal) { modal.style.display = 'none'; }
}

// Panels
function togglePanel(panelId) {
  const otherPanelId = panelId === 'cartPanel' ? 'wishlistPanel' : 'cartPanel';
  const panel = document.getElementById(panelId);
  const otherPanel = document.getElementById(otherPanelId);
  if (panel.classList.contains('show')) {
    panel.classList.remove('show'); panelOverlay.classList.remove('show');
  } else {
    otherPanel.classList.remove('show'); panel.classList.add('show'); panelOverlay.classList.add('show');
  }
}
function hidePanels() {
  cartPanel.classList.remove('show');
  wishlistPanel.classList.remove('show');
  panelOverlay.classList.remove('show');
}
panelOverlay.addEventListener('click', hidePanels);

// Storage
const getCart = ()=> JSON.parse(localStorage.getItem('cart') || '[]');
const setCart = (c)=> { localStorage.setItem('cart', JSON.stringify(c)); updateCounts(); };
const getWishlist = ()=> JSON.parse(localStorage.getItem('wishlist') || '[]');
const setWishlist = (w)=> { localStorage.setItem('wishlist', JSON.stringify(w)); updateCounts(); };
function updateCounts(){
  cartCount.textContent = getCart().length;
  wishCount.textContent = getWishlist().length;
}

// Fetch helpers
async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Network error');
  return res.json();
}

// Categories + chips
async function loadCategories(){
  const categories = await fetchJSON(`${apiURL}/products/category-list`);
  const groups = {
    'Electronics': ['smartphones','laptops','tablets','automotive'],
    'Home': ['furniture','home-decoration','lighting','kitchen-accessories'],
    'Fashion': ['mens-shirts','mens-shoes','mens-watches','womens-dresses','womens-shoes','womens-watches','womens-bags','womens-jewellery','tops','sunglasses']
  };

  categoriesNav.innerHTML = '';
  // Home chip
  const homeLi = document.createElement('li');
  homeLi.className = 'active';
  homeLi.innerHTML = `<a href="#">Home</a>`;
  homeLi.addEventListener('click', (e)=>{ e.preventDefault(); currentCategory=''; setActiveCategory(homeLi); showHome(); });
  categoriesNav.appendChild(homeLi);

  // add categories flat as chips for mobile simplicity
  categories.forEach(cat => {
    const name = typeof cat === 'string' ? cat : (cat.name || cat.slug);
    const li = document.createElement('li');
    li.innerHTML = `<a href="#">${name.replace(/-/g,' ')}</a>`;
    li.addEventListener('click', (e)=>{
      e.preventDefault();
      currentCategory = name;
      setActiveCategory(li);
      showProducts(name);
    });
    categoriesNav.appendChild(li);
  });

  // Quick chips on home
  const quick = ['smartphones','laptops','fragrances','skincare','groceries'];
  quickChips.innerHTML = '';
  quick.forEach(c => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.innerHTML = `<i class="fa-regular fa-compass"></i> ${c.replace(/-/g,' ')}`;
    chip.addEventListener('click', ()=>{ currentCategory=c; showProducts(c); });
    quickChips.appendChild(chip);
  });
}
function setActiveCategory(li){
  [...categoriesNav.children].forEach(x=> x.classList.remove('active'));
  li.classList.add('active');
}

// Products
function showHome(){
  homeSection.style.display = 'block';
  productsContainer.style.display = 'none';
  skeleton.style.display = 'none';
  hidePanels();
}
async function showProducts(category=''){
  homeSection.style.display = 'none';
  productsContainer.style.display = 'grid';
  skeleton.style.display = 'grid';
  productsContainer.innerHTML = '';
  renderSkeletons(10);
  hidePanels();

  let url = `${apiURL}/products${category ? `/category/${category}` : ''}`;
  const data = await fetchJSON(url);
  const products = data.products || data;

  // cache and draw
  allProducts = products;
  await sleep(300); // small delay to let skeleton feel nice
  skeleton.style.display = 'none';
  renderProducts();
}
function renderSkeletons(n=8){
  skeleton.innerHTML = '';
  for(let i=0;i<n;i++){
    const s = document.createElement('div');
    s.className = 'skel';
    const shimmer = document.createElement('div');
    shimmer.className = 'shimmer';
    s.appendChild(shimmer);
    skeleton.appendChild(s);
  }
}

function applyFilters(list){
  let items = [...list];
  if(query){
    const q = query.toLowerCase();
    items = items.filter(p => `${p.title} ${p.description}`.toLowerCase().includes(q));
  }
  switch(sort){
    case 'price-asc': items.sort((a,b)=> a.price - b.price); break;
    case 'price-desc': items.sort((a,b)=> b.price - a.price); break;
    case 'rating-desc': items.sort((a,b)=> (b.rating||0) - (a.rating||0)); break;
    case 'title-asc': items.sort((a,b)=> a.title.localeCompare(b.title)); break;
  }
  return items;
}

function renderProducts(){
  const items = applyFilters(allProducts);
  productsContainer.innerHTML = '';
  items.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    const discount = p.discountPercentage ? `<span class="badge muted">-${Math.round(p.discountPercentage)}%</span>` : '';
    const rating = p.rating ? `⭐ ${p.rating.toFixed(1)}` : '';
    card.innerHTML = `
      <img src="${p.thumbnail || p.images?.[0] || p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="meta">
        <div>
          <div class="price">${fmt(p.price)}</div>
          <div class="rating">${rating}</div>
        </div>
        <div class="badges">${discount}</div>
      </div>
      <div class="actions">
        <button class="btn" onclick="showProductDetails(${p.id})"><i class="fa-solid fa-circle-info"></i> Details</button>
        <button class="btn primary" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-plus"></i> Add</button>
        <button class="btn" onclick="addToWishlist(${p.id})"><i class="fa-regular fa-heart"></i></button>
      </div>
    `;
    productsContainer.appendChild(card);
  });
  if(items.length === 0){
    productsContainer.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align:center;">No products match your search.</div>`;
  }
}

// Search + sort
function debounce(fn, ms=300){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=> fn(...args), ms); };
}
searchInput?.addEventListener('input', debounce((e)=>{ query = e.target.value.trim(); renderProducts(); }, 250));
sortSelect?.addEventListener('change', (e)=>{ sort = e.target.value; renderProducts(); });

// Details
async function showProductDetails(productId){
  try {
    const p = await fetchJSON(`${apiURL}/products/${productId}`);
    modalMessage.innerHTML = `
      <h2>${escapeHtml(p.title)}</h2>
      <img src="${p.thumbnail || p.images?.[0] || p.image}" alt="${escapeHtml(p.title)}" style="max-width:180px; margin: .8rem 0;" />
      <p>${escapeHtml(p.description)}</p>
      <p><strong>Category:</strong> ${escapeHtml(p.category)}</p>
      <p><strong>Rating:</strong> ${p.rating ? p.rating.toFixed(1) : '—'}</p>
      <p><strong>Price:</strong> ${fmt(p.price)}</p>
    `;
    modal.style.display = 'flex';
  } catch (e){
    showModal('Failed to load product details.');
  }
}

// Cart + wishlist
function addToCart(productId){
  const cart = getCart();
  if(cart.includes(productId)){ showToast('Already in cart'); return; }
  cart.push(productId); setCart(cart);
  showCartAnimation(); showToast('Added to cart');
}
function addToWishlist(productId){
  const w = getWishlist();
  if(w.includes(productId)){ showToast('Already in wishlist'); return; }
  w.push(productId); setWishlist(w);
  showToast('Added to wishlist');
}

async function renderCart(){
  const cart = getCart();
  cartPanel.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;">
    <h2>Your Cart</h2>
    <button class="btn ghost" onclick="hidePanels()"><i class="fa-solid fa-xmark"></i></button>
  </div>`;
  if(cart.length===0){ cartPanel.innerHTML += '<p class="muted">Your cart is empty.</p>'; return; }
  const prods = await Promise.all(cart.map(id => fetchJSON(`${apiURL}/products/${id}`)));
  let total = 0;
  prods.forEach(p => {
    total += p.price;
    const row = document.createElement('div');
    row.className = 'product';
    row.innerHTML = `
      <img src="${p.thumbnail || p.images?.[0] || p.image}">
      <div><div>${escapeHtml(p.title)}</div><div class="muted">${fmt(p.price)}</div></div>
      <button class="btn destructive" onclick="removeFromCart(${p.id})"><i class="fa-solid fa-trash"></i></button>
    `;
    cartPanel.appendChild(row);
  });
  const totalDiv = document.createElement('div');
  totalDiv.style.marginTop = '1rem';
  totalDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin:.6rem 0;">
      <strong>Total</strong><strong>${fmt(total)}</strong>
    </div>
    <button class="btn primary" style="width:100%;" onclick="openCheckout()">Proceed to Checkout</button>
  `;
  cartPanel.appendChild(totalDiv);
}
function removeFromCart(productId){ const c = getCart().filter(id=> id!==productId); setCart(c); renderCart(); }

async function renderWishlist(){
  const w = getWishlist();
  wishlistPanel.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;">
    <h2>Your Wishlist</h2>
    <button class="btn ghost" onclick="hidePanels()"><i class="fa-solid fa-xmark"></i></button>
  </div>`;
  if(w.length===0){ wishlistPanel.innerHTML += '<p class="muted">Your wishlist is empty.</p>'; return; }
  const prods = await Promise.all(w.map(id => fetchJSON(`${apiURL}/products/${id}`)));
  prods.forEach(p => {
    const row = document.createElement('div');
    row.className = 'product';
    row.innerHTML = `
      <img src="${p.thumbnail || p.images?.[0] || p.image}">
      <div><div>${escapeHtml(p.title)}</div><div class="muted">${fmt(p.price)}</div></div>
      <button class="btn destructive" onclick="removeFromWishlist(${p.id})"><i class="fa-solid fa-trash"></i></button>
    `;
    wishlistPanel.appendChild(row);
  });
}
function removeFromWishlist(productId){ const w = getWishlist().filter(id=> id!==productId); setWishlist(w); renderWishlist(); }

// Checkout (reuse user's previous pattern, but simplified UI hooks)
async function calculateTotal(){
  const cart = getCart();
  if(cart.length===0) return 0;
  const prods = await Promise.all(cart.map(id => fetchJSON(`${apiURL}/products/${id}`)));
  return prods.reduce((s,p)=> s + p.price, 0).toFixed(2);
}

async function openCheckout(){
  const cart = getCart();
  if(cart.length===0){ showModal('Your cart is empty.'); return; }
  const products = await Promise.all(cart.map(id => fetchJSON(`${apiURL}/products/${id}`)));
  const total = products.reduce((s,p)=> s + p.price, 0);
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutContent = document.getElementById('checkoutContent');
  checkoutContent.innerHTML = `
    <div class="order-summary">
      <h3>Order Summary</h3>
      ${products.map(p=> `<div class="order-item"><span>${escapeHtml(p.title)}</span><span>${fmt(p.price)}</span></div>`).join('')}
      <div class="order-item"><span><strong>Total</strong></span><span><strong>${fmt(total)}</strong></span></div>
    </div>
    <form class="checkout-form" onsubmit="processCheckout(event)">
      <div class="form-group"><label for="customerName">Full Name *</label><input id="customerName" required></div>
      <div class="form-group"><label for="customerEmail">Email *</label><input type="email" id="customerEmail" required></div>
      <div class="form-group"><label for="customerPhone">Phone *</label><input type="tel" id="customerPhone" required></div>
      <div class="form-group"><label for="customerAddress">Delivery Address *</label><input id="customerAddress" required></div>
      <h3>Payment Method</h3>
      <div class="payment-methods">
        <div class="payment-method" onclick="selectPaymentMethod('easypaisa')" data-method="easypaisa"><div style="font-size:2rem;">📱</div><div><strong>Easypaisa</strong></div></div>
        <div class="payment-method" onclick="selectPaymentMethod('jazzcash')" data-method="jazzcash"><div style="font-size:2rem;">📱</div><div><strong>JazzCash</strong></div></div>
        <div class="payment-method" onclick="selectPaymentMethod('bank')" data-method="bank"><div style="font-size:2rem;">🏦</div><div><strong>Bank Transfer</strong></div></div>
        <div class="payment-method" onclick="selectPaymentMethod('cod')" data-method="cod"><div style="font-size:2rem;">💵</div><div><strong>Cash on Delivery</strong></div></div>
      </div>
      <div id="paymentDetails" style="display:none;"></div>
      <div class="checkout-buttons">
        <button type="button" class="btn" onclick="closeCheckoutModal()">Cancel</button>
        <button type="submit" class="btn primary">Place Order</button>
      </div>
    </form>
  `;
  checkoutModal.style.display = 'flex';
  hidePanels();
}

function selectPaymentMethod(method){
  document.querySelectorAll('.payment-method').forEach(el=> el.classList.remove('selected'));
  document.querySelector(`[data-method="${method}"]`).classList.add('selected');
  const paymentDetails = document.getElementById('paymentDetails');
  paymentDetails.style.display = 'block';
  switch(method){
    case 'easypaisa':
      paymentDetails.innerHTML = `<div class="form-group"><label for="easypaisaNumber">Easypaisa Account *</label><input id="easypaisaNumber" placeholder="03XXXXXXXXX" required></div>`; break;
    case 'jazzcash':
      paymentDetails.innerHTML = `<div class="form-group"><label for="jazzcashNumber">JazzCash Account *</label><input id="jazzcashNumber" placeholder="03XXXXXXXXX" required></div>`; break;
    case 'bank':
      paymentDetails.innerHTML = `
        <div class="form-group"><label for="bankName">Bank *</label>
          <select id="bankName" required>
            <option value="">Select Bank</option>
            <option>HBL</option><option>UBL</option><option>MCB</option><option>ABL</option><option>NBP</option><option>JS Bank</option><option>Meezan</option>
          </select></div>
        <div class="form-group"><label for="accountNumber">Account Number *</label><input id="accountNumber" required></div>`; break;
    default:
      paymentDetails.innerHTML = `<p class="muted">You will pay on delivery.</p>`;
  }
}

function processCheckout(event){
  event.preventDefault();
  const selectedPayment = document.querySelector('.payment-method.selected');
  if(!selectedPayment){ showModal('Please select a payment method.'); return; }
  const name = document.getElementById('customerName').value;
  const email = document.getElementById('customerEmail').value;
  const phone = document.getElementById('customerPhone').value;
  const address = document.getElementById('customerAddress').value;
  const paymentMethod = selectedPayment.dataset.method;

  const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
  calculateTotal().then(total => {
    const body = `Dear ${name},\n\nThank you for your order!\n\nOrder Number: ${orderNumber}\nTotal Amount: $${total}\nPayment Method: ${paymentMethod.toUpperCase()}\nShipping Address: ${address}\n\nWe will keep you updated.`;
    sendEmail(email, 'Order Confirmation - ' + orderNumber, body);
  });

  closeCheckoutModal();
  showModal(`Order placed! 🎉<br><br><strong>Order #:</strong> ${orderNumber}<br><strong>Payment:</strong> ${paymentMethod.toUpperCase()}<br><br>A confirmation email was sent to ${email}.`);
  setCart([]); renderCart();
}

// EmailJS (kept compatible with your previous keys)
(function(){
  try { emailjs.init("Vvg73yzWgobsWNWMq"); } catch(e){ console.error('EmailJS init failed', e); }
})();
function sendEmail(to, subject, body){
  try {
    if(typeof emailjs === 'undefined'){ showToast('Email service unavailable'); return false; }
    const params = { to_email: to, subject, message: body };
    emailjs.send("service_6gomw7p", "template_cyh3e2k", params)
      .then(()=> showToast(`Email sent to ${to}`))
      .catch(()=> showToast('Email failed'));
    return true;
  } catch(e){ console.error(e); showToast('Email error'); return false; }
}

// Cart animation
function showCartAnimation(){
  const a = document.getElementById('cartAnimation');
  a.classList.add('show'); setTimeout(()=> a.classList.remove('show'), 1600);
}

// Close checkout modal
function closeCheckoutModal(event){
  const m = document.getElementById('checkoutModal');
  if(!event || event.target === m){ m.style.display = 'none'; }
}

// Helpers
function escapeHtml(str){
  return (str??'').toString().replace(/[&<>"']/g, s=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// Event wiring
cartBtn?.addEventListener('click', ()=> { togglePanel('cartPanel'); renderCart(); });
wishlistBtn?.addEventListener('click', ()=> { togglePanel('wishlistPanel'); renderWishlist(); });
menuToggle?.addEventListener('click', ()=> { categoriesRail.scrollIntoView({behavior:'smooth'}); });

themeToggle?.addEventListener('click', toggleTheme);

document.addEventListener('click', (e)=>{
  if(!e.target.closest('.panel') && !e.target.closest('#cartBtn') && !e.target.closest('#wishlistBtn')){
    // clicking outside
  }
});

window.onload = async () => {
  setTheme(true);
  updateCounts();
  await loadCategories();
  showHome();
  // Default: show some products quickly
  showProducts('smartphones');
};
