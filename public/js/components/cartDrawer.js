// Slide-out Shopping Cart Drawer Component
import { formatCurrency, escapeHtml } from '../utils/helpers.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { toast } from './toast.js';

export function initCartDrawer() {
  const drawerContainer = document.getElementById('cart-drawer-container');
  if (!drawerContainer) return;

  // Render initial drawer container shell
  renderDrawer(drawerContainer);

  // Subscribe to store updates
  store.on('cart:updated', () => renderDrawer(drawerContainer));
  store.on('coupon:updated', () => renderDrawer(drawerContainer));
  store.on('cart:open', () => openCart());
  store.on('cart:close', () => closeCart());
}

export function openCart() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (backdrop) {
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeCart() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (backdrop) {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function renderDrawer(container) {
  const cart = store.cart;
  const count = store.getCartCount();
  const subtotal = store.getCartSubtotal();
  const discount = store.getDiscount();
  const shipping = store.getShippingCost();
  const tax = store.getEstimatedTax();
  const total = store.getFinalTotal();
  const appliedCoupon = store.appliedCoupon;

  // Free shipping threshold: $50
  const freeShippingThreshold = 50.0;
  const isFreeShipEligible = subtotal >= freeShippingThreshold || appliedCoupon?.type === 'free_shipping';
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const isCurrentlyOpen = document.getElementById('cart-drawer-backdrop')?.classList.contains('active');

  container.innerHTML = `
    <div id="cart-drawer-backdrop" class="drawer-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${isCurrentlyOpen ? 'active' : ''}">
      <div class="drawer-panel fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-50 border-l border-slate-200 dark:border-slate-800">
        
        <!-- Drawer Header -->
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-white">Shopping Cart</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">${count} ${count === 1 ? 'item' : 'items'} in your bag</p>
            </div>
          </div>

          <button id="close-cart-btn" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close cart">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Free Shipping Progress Tracker -->
        <div class="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span class="text-slate-700 dark:text-slate-300">
              ${isFreeShipEligible 
                ? '🎉 Congratulations! You unlocked <span class="text-emerald-600 dark:text-emerald-400 font-bold">FREE Shipping!</span>' 
                : `Add <span class="text-indigo-600 dark:text-indigo-400 font-bold">${formatCurrency(amountNeeded)}</span> more for Free Shipping`}
            </span>
            <span class="text-[11px] text-slate-400 font-medium">${progressPercent}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div class="progress-bar-animated h-full rounded-full ${isFreeShipEligible ? 'bg-emerald-500' : 'bg-indigo-600'}" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <!-- Cart Items List (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          ${cart.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-center p-8">
              <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <h4 class="font-bold text-slate-800 dark:text-slate-200 mb-1">Your cart is empty</h4>
              <p class="text-xs text-slate-400 mb-6 max-w-[220px]">Discover our curated collection and add your favorite items!</p>
              <button id="cart-start-shopping" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md">
                Start Shopping
              </button>
            </div>
          ` : `
            ${cart.map(item => `
              <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <img 
                  src="${escapeHtml(item.image)}" 
                  alt="${escapeHtml(item.name)}" 
                  class="w-16 h-16 rounded-xl object-cover bg-white dark:bg-slate-800 shrink-0" 
                  onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'"
                />
                
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate mb-1" title="${escapeHtml(item.name)}">
                    ${escapeHtml(item.name)}
                  </h4>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">${formatCurrency(item.price)}</span>
                    <span class="text-[10px] text-slate-400">(${(item.price * item.quantity).toFixed(2)})</span>
                  </div>

                  <!-- Quantity Stepper -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <button 
                        class="js-cart-minus px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        data-product-id="${item.id}"
                      >-</button>
                      <span class="px-2.5 text-xs font-bold text-slate-900 dark:text-white">${item.quantity}</span>
                      <button 
                        class="js-cart-plus px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        data-product-id="${item.id}"
                      >+</button>
                    </div>

                    <button 
                      class="js-cart-remove text-slate-400 hover:text-rose-500 transition-colors p-1"
                      data-product-id="${item.id}"
                      title="Remove item"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          `}
        </div>

        <!-- Footer / Checkout Section (Visible only when cart has items) -->
        ${cart.length > 0 ? `
          <div class="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3 shadow-lg">
            
            <!-- Promo Code Section -->
            <div class="space-y-1.5">
              ${appliedCoupon ? `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">${appliedCoupon.code} (${appliedCoupon.description})</span>
                  </div>
                  <button id="remove-coupon-btn" class="text-xs font-semibold text-rose-500 hover:underline">Remove</button>
                </div>
              ` : `
                <div class="flex gap-2">
                  <input 
                    id="coupon-input" 
                    type="text" 
                    placeholder="Promo code (e.g. SAVE10)" 
                    class="flex-1 text-xs uppercase px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                  <button 
                    id="apply-coupon-btn" 
                    class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>Try:</span>
                  <button class="js-quick-coupon underline hover:text-indigo-600" data-code="SAVE10">SAVE10</button>
                  <span>•</span>
                  <button class="js-quick-coupon underline hover:text-indigo-600" data-code="FREESHIP">FREESHIP</button>
                  <span>•</span>
                  <button class="js-quick-coupon underline hover:text-indigo-600" data-code="AURA20">AURA20</button>
                </div>
              `}
            </div>

            <!-- Price Breakdown -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(subtotal)}</span>
              </div>
              ${discount > 0 ? `
                <div class="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-${formatCurrency(discount)}</span>
                </div>
              ` : ''}
              <div class="flex justify-between">
                <span>Estimated Shipping</span>
                <span class="font-semibold ${shipping === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}">
                  ${shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(tax)}</span>
              </div>
              <div class="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Total</span>
                <span class="text-base text-indigo-600 dark:text-indigo-400">${formatCurrency(total)}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <button 
              id="proceed-checkout-btn" 
              class="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>

            <button id="clear-cart-btn" class="text-center text-[11px] text-slate-400 hover:text-rose-500 transition-colors">
              Clear entire cart
            </button>

          </div>
        ` : ''}

      </div>
    </div>
  `;

  // Attach Event Handlers
  const backdrop = document.getElementById('cart-drawer-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCart();
  });

  document.getElementById('close-cart-btn')?.addEventListener('click', closeCart);
  document.getElementById('cart-start-shopping')?.addEventListener('click', closeCart);

  // Cart item controls
  container.querySelectorAll('.js-cart-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.dataset.productId;
      const item = store.cart.find(i => i.id === prodId);
      if (item) store.updateQuantity(prodId, item.quantity + 1);
    });
  });

  container.querySelectorAll('.js-cart-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.dataset.productId;
      const item = store.cart.find(i => i.id === prodId);
      if (item) store.updateQuantity(prodId, item.quantity - 1);
    });
  });

  container.querySelectorAll('.js-cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.dataset.productId;
      store.removeFromCart(prodId);
      toast.info('Item removed from cart');
    });
  });

  document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
    store.clearCart();
    toast.info('Cart cleared');
  });

  // Apply Coupon Code
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-input');

  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponInput?.value.trim();
    if (!code) {
      toast.warning('Please enter a coupon code.');
      return;
    }

    try {
      const result = await api.validateCoupon(code, store.getCartSubtotal());
      if (result.valid) {
        store.applyCoupon(result);
        toast.success(result.message);
      }
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code');
    }
  };

  applyCouponBtn?.addEventListener('click', () => handleApplyCoupon());
  couponInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleApplyCoupon();
  });

  // Quick coupon chips
  container.querySelectorAll('.js-quick-coupon').forEach(chip => {
    chip.addEventListener('click', () => {
      handleApplyCoupon(chip.dataset.code);
    });
  });

  document.getElementById('remove-coupon-btn')?.addEventListener('click', () => {
    store.removeCoupon();
    toast.info('Coupon removed');
  });

  // Proceed to checkout
  document.getElementById('proceed-checkout-btn')?.addEventListener('click', () => {
    closeCart();
    store.emit('checkout:open');
  });
}
