// AuraMarket Main Application Controller
import { store } from './store.js';
import { api } from './api.js';
import { debounce, formatCurrency } from './utils/helpers.js';
import { renderProductCard } from './components/productCard.js';
import { openProductModal } from './components/productModal.js';
import { initCartDrawer } from './components/cartDrawer.js';
import { initCheckoutModal } from './components/checkoutModal.js';
import { initOrderTracking } from './components/orderTracking.js';
import { initAdminDashboard } from './components/adminDashboard.js';
import { toast } from './components/toast.js';

// Application State
let currentProducts = [];
let allCategories = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Theme
  store.setTheme(store.theme);

  // Initialize Modules & Modals
  initCartDrawer();
  initCheckoutModal();
  initOrderTracking();
  initAdminDashboard();

  // Setup Global Navigation & Header Listeners
  setupNavigation();
  setupFilterControls();
  setupStorefrontInteractions();

  // Load Initial Catalog
  await loadCatalog();

  // Store Event Subscriptions
  store.on('cart:updated', () => updateBadges());
  store.on('wishlist:updated', () => {
    updateBadges();
    renderCatalog();
  });
  store.on('filters:changed', () => loadCatalog());
  store.on('products:reload', () => loadCatalog());

  updateBadges();
});

// Update Header Badges
function updateBadges() {
  const cartBadge = document.getElementById('header-cart-count');
  const cartCount = store.getCartCount();
  if (cartBadge) {
    cartBadge.textContent = cartCount;
    if (cartCount > 0) {
      cartBadge.classList.remove('hidden');
    } else {
      cartBadge.classList.add('hidden');
    }
  }

  const wishlistBadge = document.getElementById('header-wishlist-count');
  const wishlistCount = store.getWishlistCount();
  if (wishlistBadge) {
    wishlistBadge.textContent = wishlistCount;
    if (wishlistCount > 0) {
      wishlistBadge.classList.remove('hidden');
    } else {
      wishlistBadge.classList.add('hidden');
    }
  }
}

// Navigation & Header Handlers
function setupNavigation() {
  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const updateThemeIcon = (theme) => {
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (theme === 'dark') {
      sunIcon?.classList.remove('hidden');
      moonIcon?.classList.add('hidden');
    } else {
      sunIcon?.classList.add('hidden');
      moonIcon?.classList.remove('hidden');
    }
  };
  updateThemeIcon(store.theme);

  themeToggleBtn?.addEventListener('click', () => {
    store.toggleTheme();
    updateThemeIcon(store.theme);
  });

  // Cart Button
  document.getElementById('header-cart-btn')?.addEventListener('click', () => {
    store.emit('cart:open');
  });

  // Wishlist Button
  document.getElementById('header-wishlist-btn')?.addEventListener('click', () => {
    openWishlistModal();
  });

  // Track Order Button
  document.getElementById('header-track-btn')?.addEventListener('click', () => {
    store.emit('tracking:open');
  });

  // Admin Portal Button
  document.getElementById('header-admin-btn')?.addEventListener('click', () => {
    store.emit('admin:open');
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });
}

// Filter and Search Controls
function setupFilterControls() {
  // Global Search Input
  const searchInput = document.getElementById('catalog-search-input');
  const handleSearch = debounce((e) => {
    store.setFilter('search', e.target.value.trim());
  }, 350);
  searchInput?.addEventListener('input', handleSearch);

  // Price Slider & Inputs
  const priceSlider = document.getElementById('filter-price-slider');
  const priceMaxLabel = document.getElementById('filter-price-val');
  priceSlider?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (priceMaxLabel) priceMaxLabel.textContent = formatCurrency(val);
    debounce(() => {
      store.setFilter('maxPrice', val);
    }, 200)();
  });

  // In Stock Checkbox
  const inStockCheckbox = document.getElementById('filter-in-stock');
  inStockCheckbox?.addEventListener('change', (e) => {
    store.setFilter('inStock', e.target.checked);
  });

  // Sort Dropdown
  const sortSelect = document.getElementById('sort-dropdown');
  sortSelect?.addEventListener('change', (e) => {
    store.setFilter('sort', e.target.value);
  });

  // Reset Filters Button
  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (priceSlider) {
      priceSlider.value = priceSlider.max || 300;
      if (priceMaxLabel) priceMaxLabel.textContent = formatCurrency(priceSlider.value);
    }
    if (inStockCheckbox) inStockCheckbox.checked = false;
    if (sortSelect) sortSelect.value = 'featured';
    store.resetFilters();
  });
}

// Load Catalog Products from REST API
async function loadCatalog() {
  const gridContainer = document.getElementById('products-grid');
  const resultsCount = document.getElementById('results-count');

  if (gridContainer) {
    gridContainer.innerHTML = Array(6).fill(0).map(() => `
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-pulse">
        <div class="w-full aspect-square rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div class="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div class="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div class="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    `).join('');
  }

  try {
    const data = await api.getProducts(store.filters);
    currentProducts = data.products || [];
    allCategories = data.categories || [];

    if (resultsCount) {
      resultsCount.textContent = `Showing ${currentProducts.length} ${currentProducts.length === 1 ? 'item' : 'items'}`;
    }

    renderCategoryPills();
    renderCatalog();
  } catch (err) {
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <p class="text-sm font-bold text-rose-500 mb-1">Failed to load products</p>
          <p class="text-xs text-slate-400 mb-4">Please make sure the server is active.</p>
          <button onclick="location.reload()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Try Again</button>
        </div>
      `;
    }
  }
}

// Render Category Filter Pills
function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  const totalAll = allCategories.reduce((s, c) => s + c.count, 0);
  const activeCat = store.filters.category || 'All';

  const categoriesWithAll = [
    { name: 'All', count: totalAll },
    ...allCategories
  ];

  container.innerHTML = categoriesWithAll.map(cat => {
    const isActive = activeCat.toLowerCase() === cat.name.toLowerCase();
    return `
      <button 
        type="button" 
        class="js-category-btn px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
            : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
        }"
        data-category="${cat.name}"
      >
        <span>${cat.name}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}">${cat.count}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.js-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category;
      store.setFilter('category', cat);
    });
  });
}

// Render Products Grid
function renderCatalog() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (currentProducts.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-1">No matching products found</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">Try clearing some filters or searching for different keywords.</p>
        <button id="clear-search-btn" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md">
          Reset All Filters
        </button>
      </div>
    `;

    document.getElementById('clear-search-btn')?.addEventListener('click', () => {
      store.resetFilters();
    });
    return;
  }

  grid.innerHTML = currentProducts.map(renderProductCard).join('');
}

// Global Event Delegation for Product Cards
function setupStorefrontInteractions() {
  document.addEventListener('click', (e) => {
    // Add to Cart from Card
    const addBtn = e.target.closest('.js-add-to-cart');
    if (addBtn) {
      e.stopPropagation();
      const prodId = addBtn.dataset.productId;
      const prod = currentProducts.find(p => p.id === prodId);
      if (prod && prod.stock > 0) {
        store.addToCart(prod, 1);
        toast.success(`Added ${prod.name} to cart!`);
      }
      return;
    }

    // Toggle Wishlist from Card
    const wishBtn = e.target.closest('.js-toggle-wishlist');
    if (wishBtn) {
      e.stopPropagation();
      const prodId = wishBtn.dataset.productId;
      const prod = currentProducts.find(p => p.id === prodId);
      store.toggleWishlist(prodId);
      const isNowWishlisted = store.isWishlisted(prodId);
      toast.info(isNowWishlisted ? `Saved to Wishlist ❤️` : `Removed from Wishlist`);
      return;
    }

    // View Product Quick View / Detail Modal
    const viewTrigger = e.target.closest('.js-view-product');
    if (viewTrigger) {
      const prodId = viewTrigger.dataset.productId;
      const prod = currentProducts.find(p => p.id === prodId);
      if (prod) openProductModal(prod);
      return;
    }
  });
}

// Wishlist Modal
function openWishlistModal() {
  const container = document.getElementById('wishlist-modal-container');
  if (!container) return;

  const wishlistedIds = Array.from(store.wishlist);
  const wishlistedProducts = currentProducts.filter(p => wishlistedIds.includes(p.id));

  container.innerHTML = `
    <div id="wishlist-modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 my-auto" onclick="event.stopPropagation()">
        
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div class="flex items-center gap-2">
            <span class="text-rose-500 text-lg">❤️</span>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Your Saved Wishlist (${wishlistedProducts.length})</h3>
          </div>
          <button id="close-wishlist-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Close">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-6 max-h-[60vh] overflow-y-auto">
          ${wishlistedProducts.length === 0 ? `
            <div class="py-12 text-center text-slate-400 text-xs">
              <span class="text-3xl block mb-2">✨</span>
              You have not saved any favorites yet. Click the heart icon on any product to save it here!
            </div>
          ` : `
            <div class="divide-y divide-slate-100 dark:divide-slate-800">
              ${wishlistedProducts.map(p => `
                <div class="py-3 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <img src="${p.image}" alt="" class="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
                    <div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">${p.name}</h4>
                      <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400">${formatCurrency(p.price)}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button 
                      class="js-wishlist-move-to-cart px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
                      data-product-id="${p.id}"
                    >
                      Move to Cart
                    </button>
                    <button 
                      class="js-wishlist-remove text-slate-400 hover:text-rose-500 p-1"
                      data-product-id="${p.id}"
                      title="Remove"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    </div>
  `;

  document.body.style.overflow = 'hidden';

  const backdrop = document.getElementById('wishlist-modal-backdrop');
  const close = () => {
    container.innerHTML = '';
    document.body.style.overflow = '';
  };

  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.getElementById('close-wishlist-btn')?.addEventListener('click', close);

  // Move to Cart
  container.querySelectorAll('.js-wishlist-move-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.dataset.productId;
      const prod = currentProducts.find(p => p.id === prodId);
      if (prod) {
        store.addToCart(prod, 1);
        store.toggleWishlist(prodId);
        toast.success(`Moved ${prod.name} to cart!`);
        openWishlistModal(); // re-render
      }
    });
  });

  // Remove
  container.querySelectorAll('.js-wishlist-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.dataset.productId;
      store.toggleWishlist(prodId);
      openWishlistModal(); // re-render
    });
  });
}
