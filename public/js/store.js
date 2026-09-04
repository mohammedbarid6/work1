// AuraMarket Central Reactive State Store

class Store {
  constructor() {
    this.listeners = new Map();

    // Load persisted state
    this.cart = this.loadFromStorage('auramarket_cart', []);
    this.wishlist = new Set(this.loadFromStorage('auramarket_wishlist', []));
    this.theme = localStorage.getItem('auramarket_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    this.appliedCoupon = null;
    this.products = [];
    this.categories = [];
    this.filters = {
      search: '',
      category: 'All',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      sort: 'featured'
    };

    this.selectedProduct = null;
    this.trackedOrder = null;
    this.isCartOpen = false;
    this.isWishlistOpen = false;
    this.isCheckoutOpen = false;
    this.isTrackingOpen = false;
    this.isAdminOpen = false;
  }

  loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Could not read ${key} from localStorage:`, e);
      return fallback;
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Could not save ${key} to localStorage:`, e);
    }
  }

  // Event Pub/Sub
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.error(`Error executing event listener for ${event}:`, e);
        }
      });
    }
  }

  // Theme Management
  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('auramarket_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.emit('theme:changed', this.theme);
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  // Cart Management
  addToCart(product, quantity = 1) {
    const existingIndex = this.cart.findIndex(item => item.id === product.id);
    const availableStock = product.stock !== undefined ? product.stock : 99;

    if (existingIndex > -1) {
      const currentQty = this.cart[existingIndex].quantity;
      const newQty = Math.min(availableStock, currentQty + quantity);
      this.cart[existingIndex].quantity = newQty;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: availableStock,
        quantity: Math.min(availableStock, Math.max(1, quantity))
      });
    }

    this.saveToStorage('auramarket_cart', this.cart);
    this.recalculateCouponDiscount();
    this.emit('cart:updated', this.cart);
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveToStorage('auramarket_cart', this.cart);
    this.recalculateCouponDiscount();
    this.emit('cart:updated', this.cart);
  }

  updateQuantity(productId, quantity) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const availableStock = item.stock || 99;
    item.quantity = Math.min(availableStock, quantity);
    this.saveToStorage('auramarket_cart', this.cart);
    this.recalculateCouponDiscount();
    this.emit('cart:updated', this.cart);
  }

  clearCart() {
    this.cart = [];
    this.appliedCoupon = null;
    this.saveToStorage('auramarket_cart', this.cart);
    this.emit('cart:updated', this.cart);
  }

  getCartCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartSubtotal() {
    return parseFloat(this.cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2));
  }

  applyCoupon(couponData) {
    this.appliedCoupon = couponData;
    this.recalculateCouponDiscount();
    this.emit('coupon:updated', this.appliedCoupon);
    this.emit('cart:updated', this.cart);
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.emit('coupon:updated', null);
    this.emit('cart:updated', this.cart);
  }

  recalculateCouponDiscount() {
    if (!this.appliedCoupon) return;
    const subtotal = this.getCartSubtotal();

    if (this.appliedCoupon.minSpend && subtotal < this.appliedCoupon.minSpend) {
      this.appliedCoupon = null;
      this.emit('coupon:updated', null);
      return;
    }

    if (this.appliedCoupon.type === 'percentage') {
      this.appliedCoupon.discount = parseFloat(((subtotal * this.appliedCoupon.value) / 100).toFixed(2));
    } else if (this.appliedCoupon.type === 'fixed') {
      this.appliedCoupon.discount = Math.min(subtotal, this.appliedCoupon.value);
    } else if (this.appliedCoupon.type === 'free_shipping') {
      this.appliedCoupon.discount = 0;
    }
  }

  getDiscount() {
    return this.appliedCoupon ? (this.appliedCoupon.discount || 0) : 0;
  }

  getShippingCost(method = 'standard') {
    if (this.cart.length === 0) return 0;
    if (method === 'express') return 15.00;
    
    // Free shipping if coupon applied or subtotal >= 50
    if (this.appliedCoupon?.type === 'free_shipping' || this.getCartSubtotal() >= 50) {
      return 0;
    }
    return 8.99;
  }

  getEstimatedTax(method = 'standard') {
    const taxable = Math.max(0, this.getCartSubtotal() - this.getDiscount());
    return parseFloat((taxable * 0.08).toFixed(2));
  }

  getFinalTotal(method = 'standard') {
    if (this.cart.length === 0) return 0;
    const subtotal = this.getCartSubtotal();
    const discount = this.getDiscount();
    const shipping = this.getShippingCost(method);
    const tax = this.getEstimatedTax(method);
    return parseFloat(Math.max(0, subtotal - discount + shipping + tax).toFixed(2));
  }

  // Wishlist Management
  toggleWishlist(productId) {
    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
    } else {
      this.wishlist.add(productId);
    }
    this.saveToStorage('auramarket_wishlist', Array.from(this.wishlist));
    this.emit('wishlist:updated', Array.from(this.wishlist));
  }

  isWishlisted(productId) {
    return this.wishlist.has(productId);
  }

  getWishlistCount() {
    return this.wishlist.size;
  }

  // Filter Updates
  setFilter(key, value) {
    this.filters[key] = value;
    this.emit('filters:changed', this.filters);
  }

  resetFilters() {
    this.filters = {
      search: '',
      category: 'All',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      sort: 'featured'
    };
    this.emit('filters:changed', this.filters);
  }
}

export const store = new Store();
