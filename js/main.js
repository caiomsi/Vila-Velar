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
const grid        = document.getElementById('products-grid')
const countEl     = document.getElementById('section-count')
const sliderTrack = document.getElementById('slider-track')
const cartDrawer  = document.getElementById('cart-drawer')
const cartOverlay = document.getElementById('cart-overlay')
const cartItems   = document.getElementById('cart-items')
const cartFooter  = document.getElementById('cart-footer')
const cartTotal   = document.getElementById('cart-total')
const cartCount   = document.getElementById('cart-count')
const waBtnEl     = document.getElementById('whatsapp-btn')

/* ─── Banner carousel ───────────────────────────────────── */
;(function () {
  const slides = document.getElementById('hero-slides')
  const dots   = document.querySelectorAll('.banner-dot')
  const TOTAL  = 3
  let current  = 0
  let timer

  function goTo(idx) {
    current = (idx + TOTAL) % TOTAL
    slides.style.transform = `translateX(-${current * (100 / TOTAL)}%)`
    dots.forEach((d, i) => d.classList.toggle('active', i === current))
  }

  function next() { goTo(current + 1) }
  function prev() { goTo(current - 1) }

  function startAuto() {
    clearInterval(timer)
    timer = setInterval(next, 4000)
  }

  document.getElementById('banner-next').addEventListener('click', () => { next(); startAuto() })
  document.getElementById('banner-prev').addEventListener('click', () => { prev(); startAuto() })
  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.idx); startAuto() }))

  startAuto()
})()

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

function openCart() {
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

/* ─── CSV parser ─────────────────────────────────────────── */
function parseCSV(text) {
  const rows = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const fields = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) {
        fields.push(cur); cur = ''
      } else {
        cur += c
      }
    }
    fields.push(cur)
    rows.push(fields)
  }
  return rows
}

/* ─── Sizes parser — "P:5,M:10,G:8" → { P: 5, M: 10, G: 8 } ── */
function parseSizes(str) {
  const result = {}
  if (!str) return result
  str.split(',').forEach(pair => {
    const parts = pair.trim().split(':')
    const size  = parts[0].trim().toUpperCase()
    const stock = parseInt(parts[1]) || 0
    if (size) result[size] = stock
  })
  return result
}

/* ─── Load products from Google Sheets CSV ──────────────── */
async function loadProducts() {
  if (!SHEET_CSV_URL || SHEET_CSV_URL === 'COLE_AQUI_A_URL_DA_PLANILHA') {
    grid.innerHTML = `
      <div class="products-empty">
        <h3>Planilha não configurada</h3>
        <p>Edite o arquivo <strong>js/config.js</strong> e cole a URL da sua planilha.</p>
      </div>`
    sliderTrack.innerHTML = ''
    return
  }

  try {
    const res = await fetch(SHEET_CSV_URL)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = await res.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      allProducts = []
      renderSlider()
      renderProducts()
      return
    }

    const headers = rows[0].map(h =>
      h.trim().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
        .replace(/\s+/g, '_')
    )

    allProducts = rows.slice(1).map((row, i) => {
      const raw = {}
      headers.forEach((h, j) => raw[h] = (row[j] || '').trim())

      return {
        id:          `row_${i}`,
        name:        raw.nome   || raw.name        || '',
        category:    (raw.categoria || raw.category || '').toLowerCase(),
        price:       parseFloat((raw.preco || raw.price || '0').replace(',', '.')),
        description: raw.descricao || raw.description || '',
        image:       raw.imagem || raw.image || raw.foto || raw.photo || '',
        sizes:       parseSizes(raw.tamanhos || raw.sizes || ''),
        active:      (raw.ativo || raw.active || 'TRUE').toUpperCase() !== 'FALSE',
        featured:    (raw.destaque || raw.featured || 'FALSE').toUpperCase() === 'TRUE',
      }
    })
    .filter(p => p.active && p.name)
    .sort((a, b) => b.featured - a.featured)

    renderSlider()
    renderProducts()
  } catch (e) {
    grid.innerHTML = `
      <div class="products-empty">
        <h3>Erro ao carregar produtos</h3>
        <p>Verifique se a URL da planilha está correta em <strong>js/config.js</strong>.</p>
      </div>`
    sliderTrack.innerHTML = ''
  }
}

/* ─── Slider ─────────────────────────────────────────────── */
function renderSlider() {
  const list = filteredProducts()
  const heroCount = document.getElementById('hero-count')
  if (heroCount) heroCount.textContent = list.length ? `— ${list.length} peça${list.length > 1 ? 's' : ''}` : ''

  if (!list.length) {
    sliderTrack.innerHTML = '<p style="padding:40px;color:#666;font-size:14px">Nenhum produto nessa categoria.</p>'
    return
  }

  sliderTrack.innerHTML = list.map(p => {
    const totalStock = Object.values(p.sizes).reduce((s, v) => s + v, 0)
    const cat = CATEGORIES[p.category] || p.category

    const imgHTML = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />`
      : `<div class="slider-card-placeholder">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
               d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
           </svg>
           <span>Vila Velar</span>
         </div>`

    const badge = totalStock === 0
      ? '<span class="slider-badge out">Esgotado</span>'
      : p.featured ? '<span class="slider-badge">Destaque</span>' : ''

    return `
      <div class="slider-card" data-id="${p.id}">
        <div class="slider-card-img-wrap">
          ${imgHTML}
          ${badge}
        </div>
        <div class="slider-card-info">
          <p class="slider-card-cat">${cat}</p>
          <h3 class="slider-card-name">${p.name}</h3>
          <p class="slider-card-price">${formatPrice(p.price)}</p>
        </div>
      </div>`
  }).join('')

  sliderTrack.querySelectorAll('.slider-card').forEach(card => {
    card.addEventListener('click', () => {
      const gridCard = grid.querySelector(`[data-id="${card.dataset.id}"]`)
      if (gridCard) gridCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' })
    })
  })

  initSliderControls()
}

function initSliderControls() {
  const prev  = document.getElementById('slider-prev')
  const next  = document.getElementById('slider-next')
  const cardW = 280 + 20

  prev.onclick = () => sliderTrack.scrollBy({ left: -cardW * 2, behavior: 'smooth' })
  next.onclick = () => sliderTrack.scrollBy({ left:  cardW * 2, behavior: 'smooth' })

  sliderTrack.addEventListener('scroll', updateArrows)
  updateArrows()

  let isDown = false, startX, scrollLeft
  sliderTrack.addEventListener('mousedown', e => {
    isDown = true; startX = e.pageX - sliderTrack.offsetLeft; scrollLeft = sliderTrack.scrollLeft
  })
  sliderTrack.addEventListener('mouseleave', () => isDown = false)
  sliderTrack.addEventListener('mouseup',    () => isDown = false)
  sliderTrack.addEventListener('mousemove', e => {
    if (!isDown) return
    e.preventDefault()
    sliderTrack.scrollLeft = scrollLeft - (e.pageX - sliderTrack.offsetLeft - startX)
  })

  function updateArrows() {
    prev.disabled = sliderTrack.scrollLeft < 10
    next.disabled = sliderTrack.scrollLeft >= sliderTrack.scrollWidth - sliderTrack.clientWidth - 10
  }
}

/* ─── Category filter ───────────────────────────────────── */
function setCategory(cat) {
  currentCat = cat
  document.querySelectorAll('.filter-btn, .hero-cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat)
  })
  renderSlider()
  renderProducts()
}

document.querySelectorAll('.hero-cat-btn').forEach(btn => {
  btn.addEventListener('click', () => setCategory(btn.dataset.cat))
})
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => setCategory(btn.dataset.cat))
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
  const sizeEntries = Object.entries(p.sizes).sort((a, b) => sizeOrder(a[0]) - sizeOrder(b[0]))
  const totalStock  = Object.values(p.sizes).reduce((s, v) => s + v, 0)
  const cat = CATEGORIES[p.category] || p.category

  const imgHTML = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />`
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

  const sizePills = sizeEntries.map(([size, stock]) =>
    `<button class="size-pill ${stock === 0 ? 'out' : ''}"
       data-size="${size}" data-stock="${stock}"
       ${stock === 0 ? 'disabled' : ''}
       title="${stock === 0 ? 'Esgotado' : stock + ' em estoque'}"
     >${size}</button>`
  ).join('')

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        ${imgHTML}
        ${badge}
      </div>
      <div class="product-info">
        <p class="product-cat">${cat}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-price">${formatPrice(p.price)}</p>
        <div class="size-pills">${sizePills}</div>
        <button class="add-btn" data-id="${p.id}" ${totalStock === 0 ? 'disabled' : ''}>
          ${totalStock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </div>`
}

function selectSize(pill) {
  pill.closest('.product-card').querySelectorAll('.size-pill').forEach(p => p.classList.remove('selected'))
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

  const key      = `${productId}__${size}`
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
    const img = item.product.image
      ? `<img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}">`
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

/* ─── Load banner images from Google Sheets ─────────────── */
async function loadBanner() {
  if (!BANNER_CSV_URL || BANNER_CSV_URL === 'COLE_AQUI_A_URL_DA_ABA_BANNER') return
  try {
    const res = await fetch(BANNER_CSV_URL)
    if (!res.ok) return
    const text = await res.text()
    const rows = parseCSV(text)
    const settings = {}
    rows.slice(1).forEach(row => {
      const key = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '_')
      const val = (row[1] || '').trim()
      if (key && val) settings[key] = val
    })
    applyBannerImage('banner-slide-1', settings.banner_1)
    applyBannerImage('banner-slide-2', settings.banner_2)
  } catch (e) {
    // placeholders permanecem se falhar
  }
}

function applyBannerImage(slideId, url) {
  if (!url) return
  const slide = document.getElementById(slideId)
  if (!slide) return
  slide.innerHTML = `<img src="${url}" alt="Banner" />`
}

/* ─── Init ──────────────────────────────────────────────── */
loadBanner()
loadProducts()
