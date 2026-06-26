/* ─── Constants ─────────────────────────────────────────── */
const CATEGORIES = {
  camisetas: 'Camisetas', polos: 'Polos', camisas: 'Camisas',
  calcas: 'Calças', bermudas: 'Bermudas', moletons: 'Moletons',
  jaquetas: 'Jaquetas', outros: 'Outros',
}

const SIZES_LETTERS  = ['PP','P','M','G','GG','XGG']
const SIZES_NUMBERS  = ['34','36','38','40','42','44','46','48','50']

const SIZE_ORDER = [...SIZES_LETTERS, ...SIZES_NUMBERS]

/* ─── State ─────────────────────────────────────────────── */
let allProducts  = []
let editingId    = null
let deleteTarget = null
let pendingFiles = []
let existingImages = []
let sizeType     = 'letters'

const ADMIN_EMAIL = 'admin@vilavela.com'

/* ─── DOM refs ──────────────────────────────────────────── */
const authScreen  = document.getElementById('auth-screen')
const adminApp    = document.getElementById('admin-app')
const authError   = document.getElementById('auth-error')

const modalOverlay  = document.getElementById('modal-overlay')
const confirmModal  = document.getElementById('confirm-modal')
const tbody         = document.getElementById('products-tbody')
const toast         = document.getElementById('toast')

/* ─── Auth ──────────────────────────────────────────────── */
db.auth.onAuthStateChange((_event, session) => {
  if (session) {
    authScreen.style.display = 'none'
    adminApp.style.display = 'block'
    loadProducts()
  } else {
    authScreen.style.display = ''
    adminApp.style.display = 'none'
  }
})

document.getElementById('btn-login').addEventListener('click', async () => {
  const pass = document.getElementById('login-password').value
  if (!pass) { showAuthError('Digite a senha.'); return }

  const btn = document.getElementById('btn-login')
  btn.disabled = true; btn.textContent = 'Entrando...'

  const { error } = await db.auth.signInWithPassword({ email: ADMIN_EMAIL, password: pass })
  if (error) {
    showAuthError('Senha incorreta.')
    btn.disabled = false; btn.textContent = 'Entrar'
  }
})

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click()
})

document.getElementById('btn-logout').addEventListener('click', () => db.auth.signOut())

function showAuthError(msg) {
  authError.textContent = msg
  authError.className = 'auth-error show'
}

/* ─── Load products ─────────────────────────────────────── */
async function loadProducts() {
  const { data, error } = await db
    .from('products')
    .select('*, product_sizes(*)')
    .order('created_at', { ascending: false })

  if (error) { showToast('Erro ao carregar produtos', 'error'); return }

  allProducts = data || []
  updateStats()
  renderTable()
}

function updateStats() {
  document.getElementById('stat-total').textContent  = allProducts.length
  document.getElementById('stat-active').textContent = allProducts.filter(p => p.active).length
  const totalStock = allProducts.flatMap(p => p.product_sizes || [])
    .reduce((s, sz) => s + sz.stock, 0)
  document.getElementById('stat-stock').textContent = totalStock
}

/* ─── Search + filter ───────────────────────────────────── */
document.getElementById('search-input').addEventListener('input', renderTable)
document.getElementById('cat-filter').addEventListener('change', renderTable)

function filteredProducts() {
  const q   = document.getElementById('search-input').value.trim().toLowerCase()
  const cat = document.getElementById('cat-filter').value
  return allProducts.filter(p =>
    (!q   || p.name.toLowerCase().includes(q)) &&
    (!cat || p.category === cat)
  )
}

/* ─── Render table ──────────────────────────────────────── */
function renderTable() {
  const list = filteredProducts()

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nenhum produto encontrado.</td></tr>'
    return
  }

  tbody.innerHTML = list.map(p => {
    const sizes = (p.product_sizes || []).sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
    const sizeChips = sizes.map(sz => {
      const cls = sz.stock === 0 ? 'out' : sz.stock <= 3 ? 'low' : ''
      return `<span class="size-chip ${cls}">${sz.size}:${sz.stock}</span>`
    }).join('')

    const thumb = p.images && p.images.length
      ? `<img class="product-thumb" src="${p.images[0]}" alt="${p.name}" />`
      : `<div class="product-thumb-placeholder">VV</div>`

    return `
      <tr data-id="${p.id}">
        <td>
          <div class="product-thumb-cell">
            ${thumb}
            <span class="product-name-cell">${p.name}</span>
          </div>
        </td>
        <td><span class="product-cat-cell">${CATEGORIES[p.category] || p.category}</span></td>
        <td class="product-price-cell">${formatPrice(p.price)}</td>
        <td><div class="sizes-summary">${sizeChips || '<span style="color:#aaa;font-size:12px">Sem tamanhos</span>'}</div></td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" class="active-toggle" data-id="${p.id}" ${p.active ? 'checked' : ''} />
            <span class="toggle-track"></span>
          </label>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn-edit" data-id="${p.id}">Editar</button>
            <button class="btn-delete" data-id="${p.id}">Excluir</button>
          </div>
        </td>
      </tr>`
  }).join('')

  tbody.querySelectorAll('.active-toggle').forEach(t => {
    t.addEventListener('change', () => toggleActive(t.dataset.id, t.checked))
  })
  tbody.querySelectorAll('.btn-edit').forEach(b => {
    b.addEventListener('click', () => openEdit(b.dataset.id))
  })
  tbody.querySelectorAll('.btn-delete').forEach(b => {
    b.addEventListener('click', () => openDelete(b.dataset.id))
  })
}

async function toggleActive(id, active) {
  const { error } = await db.from('products').update({ active }).eq('id', id)
  if (error) { showToast('Erro ao atualizar', 'error'); return }
  const p = allProducts.find(p => p.id === id)
  if (p) p.active = active
  updateStats()
  showToast(active ? 'Produto ativado' : 'Produto desativado')
}

/* ─── Open add / edit ───────────────────────────────────── */
document.getElementById('btn-add-product').addEventListener('click', openAdd)
document.getElementById('modal-close').addEventListener('click', closeModal)
document.getElementById('modal-cancel').addEventListener('click', closeModal)
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal() })

function openAdd() {
  editingId = null
  existingImages = []
  pendingFiles   = []
  document.getElementById('modal-title').textContent = 'Novo Produto'
  document.getElementById('f-name').value    = ''
  document.getElementById('f-cat').value     = 'camisetas'
  document.getElementById('f-price').value   = ''
  document.getElementById('f-desc').value    = ''
  document.getElementById('f-active').checked   = true
  document.getElementById('f-featured').checked = false
  updateToggleLabels()
  renderSizesEditor({})
  renderUploadPreviews()
  setSizeType('letters')
  modalOverlay.classList.add('open')
}

function openEdit(id) {
  const p = allProducts.find(p => p.id === id)
  if (!p) return
  editingId = id
  existingImages = [...(p.images || [])]
  pendingFiles   = []

  document.getElementById('modal-title').textContent = 'Editar Produto'
  document.getElementById('f-name').value    = p.name
  document.getElementById('f-cat').value     = p.category
  document.getElementById('f-price').value   = p.price
  document.getElementById('f-desc').value    = p.description || ''
  document.getElementById('f-active').checked   = p.active
  document.getElementById('f-featured').checked = p.featured
  updateToggleLabels()

  const sizesMap = {}
  for (const sz of (p.product_sizes || [])) sizesMap[sz.size] = sz.stock

  const hasNumbers = (p.product_sizes || []).some(sz => SIZES_NUMBERS.includes(sz.size))
  setSizeType(hasNumbers ? 'numbers' : 'letters')
  renderSizesEditor(sizesMap)
  renderUploadPreviews()
  modalOverlay.classList.add('open')
}

function closeModal() {
  modalOverlay.classList.remove('open')
  editingId = null
  pendingFiles = []
  existingImages = []
}

/* ─── Toggle active/featured labels ─────────────────────── */
document.getElementById('f-active').addEventListener('change', updateToggleLabels)
document.getElementById('f-featured').addEventListener('change', updateToggleLabels)

function updateToggleLabels() {
  document.getElementById('active-label').textContent   = document.getElementById('f-active').checked   ? 'Sim' : 'Não'
  document.getElementById('featured-label').textContent = document.getElementById('f-featured').checked ? 'Sim' : 'Não'
}

/* ─── Sizes editor ──────────────────────────────────────── */
document.querySelectorAll('.size-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const current = {}
    document.querySelectorAll('.size-stock-input').forEach(inp => {
      if (inp.value) current[inp.dataset.size] = parseInt(inp.value) || 0
    })
    setSizeType(btn.dataset.type, current)
  })
})

function setSizeType(type, carry = {}) {
  sizeType = type
  document.querySelectorAll('.size-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type)
  })
  renderSizesEditor(carry)
}

function renderSizesEditor(sizesMap) {
  const sizes = sizeType === 'letters' ? SIZES_LETTERS : SIZES_NUMBERS
  const editor = document.getElementById('sizes-editor')
  editor.innerHTML = sizes.map(sz => `
    <div class="size-row">
      <label>${sz}</label>
      <input class="size-stock-input" type="number" min="0"
        data-size="${sz}" value="${sizesMap[sz] ?? 0}"
        placeholder="0" />
    </div>`).join('')
}

/* ─── Image upload ──────────────────────────────────────── */
const uploadZone = document.getElementById('upload-zone')
const fileInput  = document.getElementById('f-images')

fileInput.addEventListener('change', () => handleFileSelect(fileInput.files))
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag') })
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'))
uploadZone.addEventListener('drop', e => {
  e.preventDefault()
  uploadZone.classList.remove('drag')
  handleFileSelect(e.dataTransfer.files)
})

function handleFileSelect(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    if (f.size > 5 * 1024 * 1024) { showToast(`${f.name} é muito grande (máx 5MB)`, 'error'); continue }
    pendingFiles.push(f)
  }
  renderUploadPreviews()
}

function renderUploadPreviews() {
  const container = document.getElementById('upload-previews')
  container.innerHTML = ''

  existingImages.forEach((url, i) => {
    const div = document.createElement('div')
    div.className = 'upload-preview-item'
    div.innerHTML = `<img src="${url}" alt="" /><button title="Remover">×</button>`
    div.querySelector('button').addEventListener('click', () => {
      existingImages.splice(i, 1)
      renderUploadPreviews()
    })
    container.appendChild(div)
  })

  pendingFiles.forEach((f, i) => {
    const url = URL.createObjectURL(f)
    const div = document.createElement('div')
    div.className = 'upload-preview-item'
    div.innerHTML = `<img src="${url}" alt="" /><button title="Remover">×</button>`
    div.querySelector('button').addEventListener('click', () => {
      pendingFiles.splice(i, 1)
      renderUploadPreviews()
    })
    container.appendChild(div)
  })
}

async function uploadPendingFiles(productId) {
  if (!pendingFiles.length) return existingImages

  const progress = document.getElementById('upload-progress')
  const bar      = document.getElementById('upload-progress-bar')
  progress.style.display = 'block'

  const uploaded = [...existingImages]

  for (let i = 0; i < pendingFiles.length; i++) {
    const f   = pendingFiles[i]
    const ext = f.name.split('.').pop()
    const key = `${productId}/${Date.now()}-${i}.${ext}`

    const { data, error } = await db.storage
      .from('product-images')
      .upload(key, f, { upsert: true })

    if (!error) {
      const { data: pub } = db.storage.from('product-images').getPublicUrl(data.path)
      uploaded.push(pub.publicUrl)
    }

    bar.style.width = `${((i + 1) / pendingFiles.length) * 100}%`
  }

  progress.style.display = 'none'
  bar.style.width = '0%'
  return uploaded
}

/* ─── Save product ──────────────────────────────────────── */
document.getElementById('btn-save').addEventListener('click', saveProduct)

async function saveProduct() {
  const name  = document.getElementById('f-name').value.trim()
  const cat   = document.getElementById('f-cat').value
  const price = parseFloat(document.getElementById('f-price').value)
  const desc  = document.getElementById('f-desc').value.trim()
  const active   = document.getElementById('f-active').checked
  const featured = document.getElementById('f-featured').checked

  if (!name)          { showToast('Nome é obrigatório', 'error'); return }
  if (isNaN(price) || price < 0) { showToast('Preço inválido', 'error'); return }

  const sizes = []
  document.querySelectorAll('.size-stock-input').forEach(inp => {
    const stock = parseInt(inp.value) || 0
    sizes.push({ size: inp.dataset.size, stock })
  })

  const btn = document.getElementById('btn-save')
  btn.disabled = true; btn.textContent = 'Salvando...'

  try {
    let productId = editingId

    if (editingId) {
      const { error } = await db.from('products').update({ name, category: cat, price, description: desc, active, featured })
        .eq('id', editingId)
      if (error) throw error
    } else {
      const { data, error } = await db.from('products')
        .insert({ name, category: cat, price, description: desc, active, featured })
        .select('id').single()
      if (error) throw error
      productId = data.id
    }

    const images = await uploadPendingFiles(productId)
    await db.from('products').update({ images }).eq('id', productId)

    await db.from('product_sizes').delete().eq('product_id', productId)
    const sizeRows = sizes
      .filter(sz => sz.stock >= 0)
      .map(sz => ({ product_id: productId, size: sz.size, stock: sz.stock }))
    if (sizeRows.length) {
      const { error } = await db.from('product_sizes').insert(sizeRows)
      if (error) throw error
    }

    showToast(editingId ? 'Produto atualizado!' : 'Produto criado!', 'success')
    closeModal()
    await loadProducts()

  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'error')
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar produto'
  }
}

/* ─── Delete ────────────────────────────────────────────── */
function openDelete(id) {
  deleteTarget = id
  const p = allProducts.find(p => p.id === id)
  document.getElementById('confirm-text').textContent =
    `"${p?.name || 'Produto'}" será removido permanentemente da loja.`
  confirmModal.classList.add('open')
}

document.getElementById('confirm-cancel').addEventListener('click', () => {
  confirmModal.classList.remove('open'); deleteTarget = null
})
document.getElementById('confirm-delete').addEventListener('click', async () => {
  if (!deleteTarget) return

  const { error } = await db.from('products').delete().eq('id', deleteTarget)
  confirmModal.classList.remove('open')
  deleteTarget = null

  if (error) { showToast('Erro ao excluir', 'error'); return }
  showToast('Produto excluído', 'success')
  await loadProducts()
})

/* ─── Toast ─────────────────────────────────────────────── */
let toastTimer
function showToast(msg, type = '') {
  clearTimeout(toastTimer)
  toast.textContent = msg
  toast.className   = `show ${type}`
  toastTimer = setTimeout(() => { toast.className = '' }, 3000)
}

/* ─── Helpers ───────────────────────────────────────────── */
function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
