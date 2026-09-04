// Product Card Component
import { formatCurrency, renderStarRating, escapeHtml } from '../utils/helpers.js';
import { store } from '../store.js';

export function renderProductCard(product) {
  const isWishlisted = store.isWishlisted(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  let badgeColor = 'bg-indigo-600 text-white';
  if (product.badge?.toLowerCase().includes('off') || product.badge?.toLowerCase().includes('sale')) {
    badgeColor = 'bg-rose-600 text-white';
  } else if (product.badge?.toLowerCase().includes('top') || product.badge?.toLowerCase().includes('best')) {
    badgeColor = 'bg-amber-500 text-slate-950 font-bold';
  } else if (product.badge?.toLowerCase().includes('eco')) {
    badgeColor = 'bg-emerald-600 text-white';
  }

  return `
    <div class="product-card group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" data-product-id="${product.id}">
      
      <!-- Top Image Container -->
      <div class="relative w-full aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer js-view-product" data-product-id="${product.id}">
        <img 
          src="${escapeHtml(product.image)}" 
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'"
        />

        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          ${product.badge ? `
            <span class="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeColor} shadow-sm">
              ${escapeHtml(product.badge)}
            </span>
          ` : ''}
          ${hasDiscount ? `
            <span class="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              Save ${formatCurrency(product.originalPrice - product.price)}
            </span>
          ` : ''}
        </div>

        <!-- Wishlist Button -->
        <button 
          type="button" 
          class="js-toggle-wishlist absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shadow-sm"
          data-product-id="${product.id}"
          title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
          aria-label="Wishlist"
        >
          <svg class="w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none stroke-current stroke-2'}" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <!-- Quick View Overlay on Hover -->
        <div class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            type="button"
            class="js-view-product text-xs font-semibold px-4 py-2 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white rounded-xl shadow-md hover:bg-indigo-600 hover:text-white transition-colors"
            data-product-id="${product.id}"
          >
            Quick View
          </button>
        </div>
      </div>

      <!-- Card Details Content -->
      <div class="flex-1 flex flex-col p-4 sm:p-5">
        
        <!-- Category & Rating -->
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            ${escapeHtml(product.category)}
          </span>
          ${renderStarRating(product.rating || 5.0, product.reviewCount || 0)}
        </div>

        <!-- Product Name -->
        <h3 class="font-semibold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer js-view-product mb-2" data-product-id="${product.id}">
          ${escapeHtml(product.name)}
        </h3>

        <!-- Description snippet -->
        <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          ${escapeHtml(product.description)}
        </p>

        <!-- Stock Status -->
        <div class="mb-3">
          ${isOutOfStock ? `
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span> Out of Stock
            </span>
          ` : isLowStock ? `
            <span class="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Only ${product.stock} left in stock!
            </span>
          ` : `
            <span class="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> In Stock (${product.stock})
            </span>
          `}
        </div>

        <!-- Price & Action Button -->
        <div class="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-bold text-slate-900 dark:text-white">
                ${formatCurrency(product.price)}
              </span>
              ${hasDiscount ? `
                <span class="text-xs text-slate-400 line-through">
                  ${formatCurrency(product.originalPrice)}
                </span>
              ` : ''}
            </div>
          </div>

          <button 
            type="button" 
            class="js-add-to-cart inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 shadow-sm ${isOutOfStock ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20 hover:shadow-indigo-600/30'}"
            data-product-id="${product.id}"
            ${isOutOfStock ? 'disabled' : ''}
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>${isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        </div>

      </div>

    </div>
  `;
}
