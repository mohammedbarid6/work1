// Checkout Modal & Order Placement Component
import { formatCurrency, escapeHtml, formatDate } from '../utils/helpers.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { toast } from './toast.js';

export function initCheckoutModal() {
  const container = document.getElementById('checkout-modal-container');
  if (!container) return;

  store.on('checkout:open', () => openCheckout(container));
  store.on('checkout:close', () => closeCheckout(container));
}

let currentShippingMethod = 'standard';
let currentPaymentMethod = 'card';

export function openCheckout(container) {
  if (store.cart.length === 0) {
    toast.warning('Your cart is empty! Add items before checking out.');
    return;
  }
  renderCheckout(container);
  document.body.style.overflow = 'hidden';
}

export function closeCheckout(container) {
  if (!container) container = document.getElementById('checkout-modal-container');
  if (container) container.innerHTML = '';
  document.body.style.overflow = '';
}

function renderCheckout(container) {
  const cart = store.cart;
  const subtotal = store.getCartSubtotal();
  const discount = store.getDiscount();
  const shipping = store.getShippingCost(currentShippingMethod);
  const tax = store.getEstimatedTax(currentShippingMethod);
  const total = store.getFinalTotal(currentShippingMethod);
  const coupon = store.appliedCoupon;

  container.innerHTML = `
    <div id="checkout-modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 my-auto" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div>
              <h2 class="text-base font-extrabold text-slate-900 dark:text-white">Secure Checkout</h2>
              <p class="text-[11px] text-slate-400">256-bit Encrypted SSL Guarantee</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button 
              id="autofill-checkout-btn" 
              type="button" 
              class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <span>⚡ Autofill Demo Details</span>
            </button>

            <button id="close-checkout-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Close checkout">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div id="checkout-content-area" class="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
          
          <!-- Left Column: Checkout Forms (7 cols) -->
          <form id="checkout-form" class="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            
            <!-- Section 1: Contact Details -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Contact Information</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input type="text" id="chk-name" required placeholder="John Doe" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                  <input type="email" id="chk-email" required placeholder="john@example.com" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input type="tel" id="chk-phone" placeholder="+1 (555) 019-2834" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                </div>
              </div>
            </div>

            <!-- Section 2: Shipping Address -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Shipping Address</h3>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address *</label>
                  <input type="text" id="chk-street" required placeholder="123 Market St, Apt 4B" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                    <input type="text" id="chk-city" required placeholder="San Francisco" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State / Province</label>
                    <input type="text" id="chk-state" placeholder="CA" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP / Postal *</label>
                    <input type="text" id="chk-zip" required placeholder="94105" class="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Delivery Options -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Shipping Method</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${currentShippingMethod === 'standard' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}">
                  <div class="flex items-center gap-2.5">
                    <input type="radio" name="shippingMethod" value="standard" ${currentShippingMethod === 'standard' ? 'checked' : ''} class="text-indigo-600 focus:ring-0" />
                    <div>
                      <p class="text-xs font-bold text-slate-900 dark:text-white">Standard Delivery</p>
                      <p class="text-[11px] text-slate-400">3-5 business days</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold ${subtotal >= 50 || coupon?.type === 'free_shipping' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}">
                    ${subtotal >= 50 || coupon?.type === 'free_shipping' ? 'FREE' : '$8.99'}
                  </span>
                </label>

                <label class="flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${currentShippingMethod === 'express' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}">
                  <div class="flex items-center gap-2.5">
                    <input type="radio" name="shippingMethod" value="express" ${currentShippingMethod === 'express' ? 'checked' : ''} class="text-indigo-600 focus:ring-0" />
                    <div>
                      <p class="text-xs font-bold text-slate-900 dark:text-white">Express Overnight</p>
                      <p class="text-[11px] text-slate-400">1-2 business days</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-900 dark:text-white">$15.00</span>
                </label>
              </div>
            </div>

            <!-- Section 4: Payment Method -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Payment Details</h3>
                </div>
                <button type="button" id="autofill-card-btn" class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Auto-fill Test Card
                </button>
              </div>

              <!-- Payment Tabs -->
              <div class="grid grid-cols-3 gap-2 mb-3">
                <button type="button" class="js-pay-tab py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${currentPaymentMethod === 'card' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}" data-method="card">
                  <span>Credit Card</span>
                </button>
                <button type="button" class="js-pay-tab py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${currentPaymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}" data-method="upi">
                  <span>UPI / Wallet</span>
                </button>
                <button type="button" class="js-pay-tab py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${currentPaymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}" data-method="cod">
                  <span>Cash on Del.</span>
                </button>
              </div>

              <!-- Payment Form Fields -->
              <div id="payment-fields-area">
                ${currentPaymentMethod === 'card' ? `
                  <div class="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                      <input type="text" id="chk-card-num" placeholder="4242 •••• •••• 4242" class="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expires (MM/YY)</label>
                        <input type="text" id="chk-card-exp" placeholder="12/28" class="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CVC / CVV</label>
                        <input type="password" id="chk-card-cvv" placeholder="•••" maxlength="4" class="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono" />
                      </div>
                    </div>
                  </div>
                ` : currentPaymentMethod === 'upi' ? `
                  <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Virtual Payment Address (VPA) / UPI ID</label>
                    <input type="text" id="chk-upi-id" placeholder="username@oksbi / user@okhdfcbank" class="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                    <p class="text-[11px] text-slate-400 mt-1.5">You will receive a payment prompt on your UPI app to authorize.</p>
                  </div>
                ` : `
                  <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    Pay with cash when your shipment arrives at your doorstep. Please have exact change ready.
                  </div>
                `}
              </div>
            </div>

            <button 
              type="submit" 
              id="submit-order-btn"
              class="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>Place Order (${formatCurrency(total)})</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>

          </form>

          <!-- Right Column: Order Summary (5 cols) -->
          <div class="lg:col-span-5 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4">Order Summary (${cart.reduce((s, i) => s + i.quantity, 0)} items)</h3>
              
              <!-- Items Preview -->
              <div class="space-y-3 max-h-56 overflow-y-auto pr-1 mb-6">
                ${cart.map(item => `
                  <div class="flex items-center gap-3">
                    <div class="relative w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                      <img src="${escapeHtml(item.image)}" alt="" class="w-full h-full object-cover" />
                      <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">${item.quantity}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold text-slate-900 dark:text-white truncate">${escapeHtml(item.name)}</p>
                      <p class="text-[11px] text-slate-400">${item.quantity} x ${formatCurrency(item.price)}</p>
                    </div>
                    <span class="text-xs font-bold text-slate-900 dark:text-white">${formatCurrency(item.price * item.quantity)}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Breakdown -->
              <div class="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <div class="flex justify-between">
                  <span>Subtotal</span>
                  <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div class="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount (${coupon?.code})</span>
                    <span>-${formatCurrency(discount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between">
                  <span>Shipping</span>
                  <span class="font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}">
                    ${shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>Sales Tax (8%)</span>
                  <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(tax)}</span>
                </div>
                <div class="flex justify-between text-base font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount</span>
                  <span class="text-indigo-600 dark:text-indigo-400">${formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <!-- Guarantee badges -->
            <div class="mt-6 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Money-back guarantee within 30 days</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Carbon-neutral verified delivery</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  // Attach Listeners
  const backdrop = document.getElementById('checkout-modal-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCheckout(container);
  });
  document.getElementById('close-checkout-btn')?.addEventListener('click', () => closeCheckout(container));

  // Autofill button
  document.getElementById('autofill-checkout-btn')?.addEventListener('click', () => {
    document.getElementById('chk-name').value = 'Jordan Peterson';
    document.getElementById('chk-email').value = 'jordan.p@example.com';
    document.getElementById('chk-phone').value = '+1 (555) 349-1029';
    document.getElementById('chk-street').value = '450 Mission Street, Suite 200';
    document.getElementById('chk-city').value = 'San Francisco';
    document.getElementById('chk-state').value = 'CA';
    document.getElementById('chk-zip').value = '94105';
    toast.info('Demo contact details auto-filled!');
  });

  // Autofill card
  document.getElementById('autofill-card-btn')?.addEventListener('click', () => {
    const cardNum = document.getElementById('chk-card-num');
    const cardExp = document.getElementById('chk-card-exp');
    const cardCvv = document.getElementById('chk-card-cvv');
    if (cardNum) cardNum.value = '4242 •••• •••• 4242';
    if (cardExp) cardExp.value = '08/28';
    if (cardCvv) cardCvv.value = '982';
    toast.info('Test card credentials auto-filled!');
  });

  // Shipping method change
  container.querySelectorAll('input[name="shippingMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentShippingMethod = e.target.value;
      renderCheckout(container);
    });
  });

  // Payment tab switch
  container.querySelectorAll('.js-pay-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentPaymentMethod = tab.dataset.method;
      renderCheckout(container);
    });
  });

  // Form submit -> Order creation
  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing Secure Payment...
    `;

    const orderPayload = {
      customer: {
        fullName: document.getElementById('chk-name').value.trim(),
        email: document.getElementById('chk-email').value.trim(),
        phone: document.getElementById('chk-phone').value.trim()
      },
      shippingAddress: {
        street: document.getElementById('chk-street').value.trim(),
        city: document.getElementById('chk-city').value.trim(),
        state: document.getElementById('chk-state').value.trim(),
        zip: document.getElementById('chk-zip').value.trim(),
        country: 'United States'
      },
      items: store.cart,
      shippingMethod: currentShippingMethod,
      couponCode: store.appliedCoupon ? store.appliedCoupon.code : null,
      paymentMethod: currentPaymentMethod
    };

    try {
      const response = await api.createOrder(orderPayload);
      if (response.success && response.order) {
        // Clear cart in store
        store.clearCart();
        store.removeCoupon();
        renderOrderSuccess(container, response.order);
      }
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please check your information.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Place Order (${formatCurrency(total)})`;
    }
  });
}

function renderOrderSuccess(container, order) {
  const contentArea = document.getElementById('checkout-content-area');
  if (!contentArea) return;

  contentArea.className = 'p-6 sm:p-10 max-h-[85vh] overflow-y-auto text-center';
  contentArea.innerHTML = `
    <div class="max-w-xl mx-auto flex flex-col items-center">
      
      <!-- Success Icon -->
      <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Payment Authorized</span>
      <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Order Confirmed!</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Thank you, <span class="font-bold text-slate-800 dark:text-slate-200">${escapeHtml(order.customer.fullName)}</span>. We've sent your receipt and tracking link to <span class="font-bold text-slate-800 dark:text-slate-200">${escapeHtml(order.customer.email)}</span>.
      </p>

      <!-- Order Receipt Card -->
      <div class="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left mb-6 shadow-sm">
        <div class="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-2 mb-3">
          <div>
            <p class="text-[11px] text-slate-400">Order Number</p>
            <p class="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">${order.id}</p>
          </div>
          <div class="text-right">
            <p class="text-[11px] text-slate-400">Placed On</p>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">${formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <p class="text-[11px] text-slate-400 mb-0.5">Shipping Carrier</p>
            <p class="font-bold text-slate-800 dark:text-slate-200">${escapeHtml(order.carrier)}</p>
            <p class="text-[11px] font-mono text-slate-500">${order.trackingNumber}</p>
          </div>
          <div>
            <p class="text-[11px] text-slate-400 mb-0.5">Shipping Destination</p>
            <p class="font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(order.shippingAddress.street)}</p>
            <p class="text-[11px] text-slate-500">${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.zip)}</p>
          </div>
        </div>

        <!-- Items Mini List -->
        <div class="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
          ${order.items.map(item => `
            <div class="flex justify-between items-center">
              <span class="text-slate-600 dark:text-slate-300">${item.quantity}x ${escapeHtml(item.name)}</span>
              <span class="font-bold text-slate-900 dark:text-white">${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
          <div class="flex justify-between items-center pt-2 font-bold text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
            <span>Total Paid</span>
            <span class="text-indigo-600 dark:text-indigo-400">${formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-center gap-3 w-full">
        <button 
          id="track-this-order-btn" 
          class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
          <span>Live Order Tracking</span>
        </button>

        <button 
          id="print-receipt-btn" 
          class="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          <span>Print Receipt</span>
        </button>

        <button 
          id="continue-shopping-btn" 
          class="px-4 py-3 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold text-xs transition-colors"
        >
          Continue Shopping
        </button>
      </div>

    </div>
  `;

  // Attach Success Actions
  document.getElementById('track-this-order-btn')?.addEventListener('click', () => {
    closeCheckout(container);
    store.emit('tracking:open', order.id);
  });

  document.getElementById('print-receipt-btn')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('continue-shopping-btn')?.addEventListener('click', () => {
    closeCheckout(container);
  });
}
