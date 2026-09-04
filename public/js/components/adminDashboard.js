// Admin & Inventory Management Dashboard Component
import { formatCurrency, escapeHtml, formatDate } from '../utils/helpers.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { toast } from './toast.js';

export function initAdminDashboard() {
  const container = document.getElementById('admin-modal-container');
  if (!container) return;

  store.on('admin:open', () => openAdmin(container));
  store.on('admin:close', () => closeAdmin(container));
}

let currentAdminTab = 'products'; // 'products' or 'orders'

export async function openAdmin(container) {
  renderAdminShell(container);
  document.body.style.overflow = 'hidden';
  await loadAdminData();
}

export function closeAdmin(container) {
  if (!container) container = document.getElementById('admin-modal-container');
  if (container) container.innerHTML = '';
  document.body.style.overflow = '';
}

function renderAdminShell(container) {
  container.innerHTML = `
    <div id="admin-modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div class="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 my-auto" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">Admin Operations Center</h2>
              <p class="text-xs text-slate-400">Inventory control, order fulfillment, and store metrics</p>
            </div>
          </div>

          <button id="close-admin-btn" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close admin">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- KPI Metrics Grid -->
        <div id="admin-kpis" class="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Gross Sales</p>
            <p id="kpi-revenue" class="text-xl font-black text-slate-900 dark:text-white">--</p>
          </div>
          <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Orders Count</p>
            <p id="kpi-orders" class="text-xl font-black text-slate-900 dark:text-white">--</p>
          </div>
          <div class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <p class="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Avg Order Value</p>
            <p id="kpi-aov" class="text-xl font-black text-slate-900 dark:text-white">--</p>
          </div>
          <div class="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <p class="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Catalog Items</p>
            <p id="kpi-products" class="text-xl font-black text-slate-900 dark:text-white">--</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <button 
            id="tab-products-btn" 
            class="pb-3 text-xs font-bold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 transition-all flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>Product Inventory</span>
          </button>

          <button 
            id="tab-orders-btn" 
            class="pb-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Orders Fulfillment</span>
          </button>
        </div>

        <!-- Main Tab Content Area -->
        <div id="admin-tab-content" class="p-6 max-h-[55vh] overflow-y-auto">
          <!-- Dynamic Content Injected Here -->
        </div>

      </div>
    </div>
  `;

  // Attach backdrop & close
  const backdrop = document.getElementById('admin-modal-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAdmin(container);
  });
  document.getElementById('close-admin-btn')?.addEventListener('click', () => closeAdmin(container));

  // Tab switching
  const tabProdBtn = document.getElementById('tab-products-btn');
  const tabOrdBtn = document.getElementById('tab-orders-btn');

  tabProdBtn?.addEventListener('click', () => {
    currentAdminTab = 'products';
    tabProdBtn.className = 'pb-3 text-xs font-bold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 transition-all flex items-center gap-1.5';
    tabOrdBtn.className = 'pb-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5';
    renderProductsTab();
  });

  tabOrdBtn?.addEventListener('click', () => {
    currentAdminTab = 'orders';
    tabOrdBtn.className = 'pb-3 text-xs font-bold border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 transition-all flex items-center gap-1.5';
    tabProdBtn.className = 'pb-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5';
    renderOrdersTab();
  });
}

async function loadAdminData() {
  try {
    const stats = await api.getStats();
    document.getElementById('kpi-revenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('kpi-orders').textContent = stats.totalOrders;
    document.getElementById('kpi-aov').textContent = formatCurrency(stats.averageOrderValue);
    document.getElementById('kpi-products').textContent = stats.totalProducts;

    if (currentAdminTab === 'products') {
      await renderProductsTab();
    } else {
      await renderOrdersTab();
    }
  } catch (err) {
    toast.error('Failed to load admin metrics.');
  }
}

async function renderProductsTab() {
  const content = document.getElementById('admin-tab-content');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-6">
      
      <!-- Collapsible Add Product Box -->
      <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add New Product
          </h3>
        </div>

        <form id="admin-add-product-form" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Product Name *</label>
              <input type="text" id="new-prod-name" required placeholder="e.g. Studio Monitor Speakers" class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Category *</label>
              <select id="new-prod-category" required class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home & Living">Home & Living</option>
                <option value="Fitness & Sports">Fitness & Sports</option>
                <option value="Beauty & Wellness">Beauty & Wellness</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Badge</label>
              <input type="text" id="new-prod-badge" placeholder="e.g. New, Bestseller, 20% OFF" class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Price ($) *</label>
              <input type="number" step="0.01" id="new-prod-price" required placeholder="89.99" class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Original Price ($)</label>
              <input type="number" step="0.01" id="new-prod-orig-price" placeholder="119.99" class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Stock Quantity *</label>
              <input type="number" id="new-prod-stock" required placeholder="25" class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Image URL</label>
            <input type="url" id="new-prod-image" placeholder="https://images.unsplash.com/..." class="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Description</label>
            <textarea id="new-prod-desc" rows="2" placeholder="Describe the product features..." class="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"></textarea>
          </div>

          <div class="flex justify-end">
            <button type="submit" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all">
              Add to Catalog
            </button>
          </div>
        </form>
      </div>

      <!-- Inventory Table -->
      <div>
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Stock & Pricing</h4>
        <div id="admin-products-table" class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
          <div class="p-6 text-center text-slate-400">Loading catalog...</div>
        </div>
      </div>

    </div>
  `;

  // Attach Add Product Form Handler
  const form = document.getElementById('admin-add-product-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value.trim();
    const category = document.getElementById('new-prod-category').value;
    const badge = document.getElementById('new-prod-badge').value.trim();
    const price = document.getElementById('new-prod-price').value;
    const originalPrice = document.getElementById('new-prod-orig-price').value;
    const stock = document.getElementById('new-prod-stock').value;
    const image = document.getElementById('new-prod-image').value.trim();
    const description = document.getElementById('new-prod-desc').value.trim();

    try {
      await api.createProduct({
        name,
        category,
        badge,
        price,
        originalPrice,
        stock,
        image: image || undefined,
        description: description || undefined
      });
      toast.success(`Product "${name}" added to catalog!`);
      form.reset();
      await loadAdminData();
      store.emit('products:reload');
    } catch (err) {
      toast.error(err.message || 'Failed to add product');
    }
  });

  // Load products table
  try {
    const data = await api.getProducts();
    const products = data.products || [];
    const tableEl = document.getElementById('admin-products-table');

    if (products.length === 0) {
      tableEl.innerHTML = `<div class="p-6 text-center text-slate-400">No products found.</div>`;
      return;
    }

    tableEl.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <th class="p-3">Item</th>
              <th class="p-3">Category</th>
              <th class="p-3">Price</th>
              <th class="p-3">Stock</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            ${products.map(p => `
              <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="p-3 flex items-center gap-2.5">
                  <img src="${escapeHtml(p.image)}" alt="" class="w-9 h-9 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
                  <span class="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[200px]" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
                </td>
                <td class="p-3 text-slate-600 dark:text-slate-400">${escapeHtml(p.category)}</td>
                <td class="p-3 font-bold text-slate-900 dark:text-white">${formatCurrency(p.price)}</td>
                <td class="p-3">
                  <span class="font-semibold ${p.stock < 10 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}">${p.stock}</span>
                </td>
                <td class="p-3 text-right">
                  <button 
                    class="js-delete-product text-slate-400 hover:text-rose-600 transition-colors p-1"
                    data-id="${p.id}"
                    data-name="${escapeHtml(p.name)}"
                    title="Delete product"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach Delete buttons
    tableEl.querySelectorAll('.js-delete-product').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (confirm(`Are you sure you want to delete "${name}" from the store catalog?`)) {
          try {
            await api.deleteProduct(id);
            toast.info(`Deleted "${name}"`);
            await loadAdminData();
            store.emit('products:reload');
          } catch (err) {
            toast.error(err.message || 'Failed to delete product');
          }
        }
      });
    });

  } catch (err) {
    document.getElementById('admin-products-table').innerHTML = `<div class="p-6 text-center text-rose-500">Failed to load product table.</div>`;
  }
}

async function renderOrdersTab() {
  const content = document.getElementById('admin-tab-content');
  if (!content) return;

  content.innerHTML = `
    <div>
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">All Placed Customer Orders</h4>
      <div id="admin-orders-table" class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
        <div class="p-6 text-center text-slate-400">Loading orders...</div>
      </div>
    </div>
  `;

  try {
    const orders = await api.getOrders();
    const tableEl = document.getElementById('admin-orders-table');

    if (orders.length === 0) {
      tableEl.innerHTML = `<div class="p-6 text-center text-slate-400">No orders placed yet.</div>`;
      return;
    }

    tableEl.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <th class="p-3">Order ID</th>
              <th class="p-3">Customer</th>
              <th class="p-3">Total</th>
              <th class="p-3">Date</th>
              <th class="p-3">Fulfillment Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            ${orders.map(order => `
              <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">${order.id}</td>
                <td class="p-3">
                  <p class="font-bold text-slate-900 dark:text-white">${escapeHtml(order.customer?.fullName || 'Guest')}</p>
                  <p class="text-[11px] text-slate-400">${escapeHtml(order.customer?.email || '')}</p>
                </td>
                <td class="p-3 font-bold text-slate-900 dark:text-white">${formatCurrency(order.total)}</td>
                <td class="p-3 text-slate-400 text-[11px]">${formatDate(order.createdAt)}</td>
                <td class="p-3">
                  <select 
                    class="js-order-status-select text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                    data-order-id="${order.id}"
                  >
                    ${['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(st => `
                      <option value="${st}" ${order.orderStatus === st ? 'selected' : ''}>${st}</option>
                    `).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach Status change listeners
    tableEl.querySelectorAll('.js-order-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const orderId = select.dataset.orderId;
        const newStatus = e.target.value;

        try {
          await api.updateOrderStatus(orderId, newStatus);
          toast.success(`Order ${orderId} status set to ${newStatus}`);
          await loadAdminData();
        } catch (err) {
          toast.error(err.message || 'Failed to update order status');
        }
      });
    });

  } catch (err) {
    document.getElementById('admin-orders-table').innerHTML = `<div class="p-6 text-center text-rose-500">Failed to load orders.</div>`;
  }
}
