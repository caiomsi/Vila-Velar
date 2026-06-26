/* ─── Config ────────────────────────────────────────────── */
// Replace with the store's WhatsApp number (country code + number, no spaces/dashes)
const WHATSAPP_NUMBER = '5500000000000'

const CATEGORIES = {
  camisetas: 'Camisetas',
  polos:     'Polos',
  camisas:   'Camisas',
  calcas:    'Calças',
  bermudas:  'Bermudas',
  moletons:  'Moletons',
  jaquetas:  'Jaquetas',
  outros:    'Outros',
}

/* ─── State ─────────────────────────────────────────────── */
let allProducts = []
let currentCat  = 'todos'
let cart        = []

/* ─── DOM refs ──────────────────────────────────────────── */
const grid       = document.getElementById('products-grid')
const countEl    = document.getElementById('section-count')
const cartDrawer = document.getElementById('cart-drawer')
const cartOverlay= document.getElementById('cart-overlay')
const cartItems  = document.getElementById('cart-items')
const cartFooter = document.getElementById('cart-footer')
const cartTotal  = document.getElementById('cart-total')
const cartCount  = document.getElementById('cart-count')
const waBtnEl    = document.getElementById('whatsapp-btn')

/* ─── Nav ───────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 10)
})

document.getElementById('nav-toggle').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open')
})

/* ─── Cart open/close ───────────────────────────────────── */
document.getElementById('cart-btn').addEventListener('click', openCart)
document.getElementById('cart-close').addEventListener('click', closeCart)
cartOverlay.addEventListener('click', closeCart)
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart() })

function openCart()  {
  cartDrawer.classList.add('open')
  cartOverlay.classList.add('open')
  document.body.style.overflow = 'hidden'
  renderCart()
}
function closeCart() {
  cartDrawer.classList.remove('open')
  cartOverlay.classList.remove('open')
  document.body.style.overflow = ''
}

/* ─── Load products ─────────────────────────────────────── */
async function loadProducts() {
  const { data: products, error } = await db
    .from('products')
    .select('*, product_sizes(*)')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    grid.innerHTML = '<div class="products-empty"><h3>Erro ao carregar produtos</h3><p>Tente recarregar a página.</p></div>'
    return
  }

  allProducts = products || []
  renderProducts()
}

/* ─── Filter ────────────────────────────────────────────── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentCat = btn.dataset.cat
    renderProducts()
  })
})

function filteredProducts() {
  if (currentCat === 'todos') return allProducts
  return allProducts.filter(p => p.category === currentCat)
}

/* ─── Render products ───────────────────────────────────── */
function renderProducts() {
  const list = filteredProducts()
  countEl.textContent = list.length ? `${list.length} peça${list.length > 1 ? 's' : ''}` : ''

  if (!list.length) {
    grid.innerHTML = `
      <div class="products-empty">
        <h3>Nenhum produto encontrado</h3>
        <p>Tente outra categoria.</p>
      </div>`
    return
  }

  grid.innerHTML = list.map(p => productCardHTML(p)).join('')

  grid.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', () => selectSize(pill))
  })

  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id
      const card = btn.closest('.product-card')
      const sel  = card.querySelector('.size-pill.selected')
      if (!sel) { flashNoSize(card); return }
      addToCart(id, sel.dataset.size, sel.dataset.stock)
      btn.textContent = 'Adicionado ✓'
      btn.classList.add('added')
      setTimeout(() => {
        btn.textContent = 'Adicionar ao Carrinho'
        btn.classList.remove('added')
      }, 1600)
    })
  })
}

function productCardHTML(p) {
  const sizes = (p.product_sizes || []).sort((a, b) => sizeOrder(a.size) - sizeOrder(b.size))
  const totalStock = sizes.reduce((s, sz) => s + sz.stock, 0)
  const cat   = CATEGORIES[p.category] || p.category

  const imgHTML = p.images && p.images.length
    ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy" />`
    : `<div class="product-placeholder">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
             d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
         </svg>
         <span>Vila Velar</span>
       </div>`

  const badge = totalStock === 0
    ? '<span class="badge-esgotado">Esgotado</span>'
    : p.featured ? '<span class="badge-novo">Destaque</span>' : ''

  const sizePills = sizes.map(sz =>
    `<button class="size-pill ${sz.stock === 0 ? 'out' : ''}"
       data-size="${sz.size}" data-stock="${sz.stock}"
       ${sz.stock === 0 ? 'disabled' : ''}
       title="${sz.stock === 0 ? 'Esgotado' : sz.stock + ' em estoque'}"
     >${sz.size}</button>`
  ).join('')

  const price = formatPrice(p.price)

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        ${imgHTML}
        ${badge}
      </div>
      <div class="product-info">
        <p class="product-cat">${cat}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-price">${price}</p>
        <div class="size-pills">${sizePills}</div>
        <button class="add-btn" data-id="${p.id}" ${totalStock === 0 ? 'disabled' : ''}>
          ${totalStock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </div>`
}

function selectSize(pill) {
  const card = pill.closest('.product-card')
  card.querySelectorAll('.size-pill').forEach(p => p.classList.remove('selected'))
  pill.classList.add('selected')
}

function flashNoSize(card) {
  const pills = card.querySelector('.size-pills')
  pills.style.outline = '2px solid #e53e3e'
  pills.style.borderRadius = '4px'
  setTimeout(() => { pills.style.outline = ''; pills.style.borderRadius = '' }, 800)
}

/* ─── Cart logic ────────────────────────────────────────── */
function addToCart(productId, size, stock) {
  const product = allProducts.find(p => p.id === productId)
  if (!product) return

  const key     = `${productId}__${size}`
  const existing = cart.find(i => i.key === key)

  if (existing) {
    if (existing.qty < parseInt(stock)) existing.qty++
  } else {
    cart.push({ key, productId, size, qty: 1, stock: parseInt(stock), product })
  }

  updateCartCount()
  renderCart()
}

function removeFromCart(key) {
  cart = cart.filter(i => i.key !== key)
  updateCartCount()
  renderCart()
}

function changeQty(key, delta) {
  const item = cart.find(i => i.key === key)
  if (!item) return
  item.qty = Math.max(0, Math.min(item.qty + delta, item.stock))
  if (item.qty === 0) cart = cart.filter(i => i.key !== key)
  updateCartCount()
  renderCart()
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0)
  cartCount.textContent = total
  cartCount.classList.toggle('visible', total > 0)
}

/* ─── Render cart ───────────────────────────────────────── */
function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p>Seu carrinho está vazio</p>
      </div>`
    cartFooter.style.display = 'none'
    return
  }

  cartItems.innerHTML = cart.map(item => {
    const img = item.product.images && item.product.images.length
      ? `<img class="cart-item-img" src="${item.product.images[0]}" alt="${item.product.name}">`
      : `<div class="cart-item-img-placeholder">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
               d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/>
           </svg>
         </div>`
    return `
      <div class="cart-item" data-key="${item.key}">
        ${img}
        <div class="cart-item-info">
          <p class="cart-item-name">${item.product.name}</p>
          <p class="cart-item-size">Tamanho: ${item.size}</p>
          <div class="cart-item-row">
            <span class="cart-item-price">${formatPrice(item.product.price * item.qty)}</span>
            <div style="display:flex;align-items:center">
              <div class="qty-ctrl">
                <button class="qty-btn" data-key="${item.key}" data-delta="-1">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" data-key="${item.key}" data-delta="1">+</button>
              </div>
              <button class="cart-item-remove" data-key="${item.key}" aria-label="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>`
  }).join('')

  cartItems.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => changeQty(btn.dataset.key, parseInt(btn.dataset.delta)))
  })
  cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.key))
  })

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  cartTotal.textContent = formatPrice(subtotal)
  cartFooter.style.display = 'block'

  waBtnEl.href = buildWhatsAppURL()
}

function buildWhatsAppURL() {
  const lines = cart.map(i =>
    `• ${i.product.name} (${i.size}) x${i.qty} — ${formatPrice(i.product.price * i.qty)}`
  )
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const msg = [
    '🛍️ *Pedido — Vila Velar*',
    '',
    ...lines,
    '',
    `*Total: ${formatPrice(subtotal)}*`,
    '',
    'Olá! Gostaria de finalizar esse pedido.',
  ].join('\n')

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

/* ─── Helpers ───────────────────────────────────────────── */
function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const SIZE_ORDER = ['PP','P','M','G','GG','XGG','XG','34','36','38','40','42','44','46','48','50']
function sizeOrder(size) {
  const idx = SIZE_ORDER.indexOf(size)
  return idx === -1 ? 99 : idx
}

/* ─── Init ──────────────────────────────────────────────── */
loadProducts()
