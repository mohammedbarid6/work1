// Order Tracking Component
import { formatCurrency, escapeHtml, formatDate } from '../utils/helpers.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { toast } from './toast.js';

export function initOrderTracking() {
  const container = document.getElementById('order-tracking-container');
  if (!container) return;

  store.on('tracking:open', (orderId = null) => openTracking(container, orderId));
  store.on('tracking:close', () => closeTracking(container));
}

export async function openTracking(container, initialOrderId = null) {
  renderTrackingModal(container);
  document.body.style.overflow = 'hidden';

  if (initialOrderId) {
    const input = document.getElementById('track-order-input');
    if (input) input.value = initialOrderId;
    await performTrackingLookup(initialOrderId);
  }
}

export function closeTracking(container) {
  if (!container) container = document.getElementById('order-tracking-container');
  if (container) container.innerHTML = '';
  document.body.style.overflow = '';
}

function renderTrackingModal(container) {
  container.innerHTML = `
    <div id="tracking-modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 my-auto" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </div>
            <div>
              <h2 class="text-base font-extrabold text-slate-900 dark:text-white">Track Order Status</h2>
              <p class="text-[11px] text-slate-400">Live shipping timeline and package details</p>
            </div>
          </div>

          <button id="close-tracking-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Close tracking">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Lookup Form -->
        <div class="p-6 border-b border-slate-200 dark:border-slate-800">
          <form id="track-order-form" class="flex gap-2">
            <input 
              type="text" 
              id="track-order-input" 
              required
              placeholder="Enter Order ID (e.g. ORD-2026-9041)" 
              class="flex-1 text-xs px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 uppercase font-mono"
            />
            <button 
              type="submit" 
              class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Track</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          <!-- Demo Quick Orders -->
          <div class="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span>Try sample order:</span>
            <button type="button" class="js-demo-order underline hover:text-indigo-600 font-mono" data-id="ORD-2026-9041">ORD-2026-9041</button>
            <span>•</span>
            <button type="button" class="js-demo-order underline hover:text-indigo-600 font-mono" data-id="ORD-2026-8812">ORD-2026-8812</button>
          </div>
        </div>

        <!-- Tracking Content Result Area -->
        <div id="tracking-result-area" class="p-6 max-h-[60vh] overflow-y-auto">
          <div class="py-12 text-center text-slate-400 text-xs">
            Enter an Order ID above to view live dispatch and delivery updates.
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach Close handlers
  const backdrop = document.getElementById('tracking-modal-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeTracking(container);
  });
  document.getElementById('close-tracking-btn')?.addEventListener('click', () => closeTracking(container));

  // Form Submit
  const form = document.getElementById('track-order-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('track-order-input').value.trim();
    if (id) performTrackingLookup(id);
  });

  // Demo chips
  container.querySelectorAll('.js-demo-order').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.id;
      document.getElementById('track-order-input').value = id;
      performTrackingLookup(id);
    });
  });
}

async function performTrackingLookup(orderId) {
  const resultArea = document.getElementById('tracking-result-area');
  if (!resultArea) return;

  resultArea.innerHTML = `
    <div class="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
      <svg class="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Locating package tracking records...</span>
    </div>
  `;

  try {
    const order = await api.getOrderById(orderId);
    renderOrderTimeline(resultArea, order);
  } catch (err) {
    resultArea.innerHTML = `
      <div class="py-8 text-center">
        <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-1">No Order Found</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">We couldn't find an order matching "${escapeHtml(orderId)}". Please check the ID and try again.</p>
      </div>
    `;
  }
}

function renderOrderTimeline(container, order) {
  const steps = order.trackingSteps || [
    { status: 'Order Placed', time: order.createdAt, completed: true },
    { status: 'Processing', time: null, completed: false },
    { status: 'Shipped', time: null, completed: false },
    { status: 'Out for Delivery', time: null, completed: false },
    { status: 'Delivered', time: null, completed: false }
  ];

  let statusBadgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200';
  if (order.orderStatus === 'Delivered') {
    statusBadgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
  } else if (order.orderStatus === 'Shipped') {
    statusBadgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200';
  }

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Status Card -->
      <div class="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-3">
        <div>
          <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Current Status</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-base font-extrabold text-slate-900 dark:text-white">${order.orderStatus}</span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusBadgeColor}">${order.orderStatus}</span>
          </div>
        </div>

        <div class="text-right">
          <span class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Carrier & Tracking</span>
          <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">${escapeHtml(order.carrier || 'Standard Ground')}</p>
          <p class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">${order.trackingNumber}</p>
        </div>
      </div>

      <!-- Timeline Stepper -->
      <div>
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Shipment Progress</h4>
        <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          ${steps.map((step, idx) => {
            const isCompleted = step.completed;
            const isCurrent = isCompleted && (!steps[idx + 1] || !steps[idx + 1].completed);

            return `
              <div class="relative flex items-start gap-4">
                <!-- Bullet Icon -->
                <div class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-transparent'} ${isCurrent ? 'ring-4 ring-indigo-600/20' : ''}">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>

                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-bold ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}">
                      ${step.status}
                    </p>
                    <span class="text-[10px] text-slate-400">
                      ${step.time ? formatDate(step.time) : (isCurrent ? 'In progress' : 'Upcoming')}
                    </span>
                  </div>
                  ${isCurrent ? `
                    <p class="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">Package is currently in this stage.</p>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Items in Order -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Package Contents (${order.items.length} items)</h4>
        <div class="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          ${order.items.map(item => `
            <div class="p-3 bg-white dark:bg-slate-900 flex items-center gap-3">
              <img src="${escapeHtml(item.image)}" alt="" class="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-900 dark:text-white truncate">${escapeHtml(item.name)}</p>
                <p class="text-[11px] text-slate-400">Qty: ${item.quantity} • ${formatCurrency(item.price)} each</p>
              </div>
              <span class="text-xs font-bold text-slate-900 dark:text-white">${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}
