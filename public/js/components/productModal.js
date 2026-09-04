// Product Detail Modal Component
import { formatCurrency, renderStarRating, escapeHtml, formatDate } from '../utils/helpers.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { toast } from './toast.js';

export function openProductModal(product) {
  const modalContainer = document.getElementById('product-modal-container');
  if (!modalContainer) return;

  const isWishlisted = store.isWishlisted(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isOutOfStock = product.stock <= 0;
  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];

  modalContainer.innerHTML = `
    <div id="product-modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 transform transition-all" onclick="event.stopPropagation()">
        
        <!-- Close Button -->
        <button 
          id="close-product-modal"
          class="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
          aria-label="Close modal"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          
          <!-- Left: Image & Gallery -->
          <div class="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
            <div class="w-full aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-inner flex items-center justify-center mb-4">
              <img 
                id="main-product-image"
                src="${escapeHtml(gallery[0])}" 
                alt="${escapeHtml(product.name)}"
                class="w-full h-full object-cover object-center transition-all duration-300"
              />
            </div>

            <!-- Gallery Thumbnails -->
            ${gallery.length > 1 ? `
              <div class="w-full flex items-center gap-3 overflow-x-auto py-2">
                ${gallery.map((imgUrl, idx) => `
                  <button 
                    type="button" 
                    class="js-gallery-thumb shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}"
                    data-img-src="${escapeHtml(imgUrl)}"
                  >
                    <img src="${escapeHtml(imgUrl)}" alt="" class="w-full h-full object-cover" />
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <!-- Value guarantees banner -->
            <div class="w-full mt-6 grid grid-cols-3 gap-2 text-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700/60">
              <div class="flex flex-col items-center gap-1">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Authentic</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>30-Day Return</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>2-Yr Warranty</span>
              </div>
            </div>
          </div>

          <!-- Right: Product Details & Purchase Actions -->
          <div class="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <!-- Category and Rating -->
              <div class="flex items-center justify-between gap-4 mb-2">
                <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  ${escapeHtml(product.category)}
                </span>
                ${renderStarRating(product.rating || 5.0, product.reviewCount || 0)}
              </div>

              <!-- Product Title -->
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-3">
                ${escapeHtml(product.name)}
              </h2>

              <!-- Price Breakdown -->
              <div class="flex items-baseline gap-3 mb-4">
                <span class="text-3xl font-black text-slate-900 dark:text-white">
                  ${formatCurrency(product.price)}
                </span>
                ${hasDiscount ? `
                  <span class="text-base text-slate-400 line-through">
                    ${formatCurrency(product.originalPrice)}
                  </span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Save ${formatCurrency(product.originalPrice - product.price)}
                  </span>
                ` : ''}
              </div>

              <!-- Stock Pill -->
              <div class="mb-4">
                ${isOutOfStock ? `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span> Currently Out of Stock
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${product.stock} Units In Stock
                  </span>
                `}
              </div>

              <!-- Description -->
              <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                ${escapeHtml(product.description)}
              </p>

              <!-- Technical Specifications Table -->
              ${product.specs ? `
                <div class="mb-6">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Specifications</h4>
                  <div class="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                    ${Object.entries(product.specs).map(([key, val]) => `
                      <div class="grid grid-cols-3 p-2.5 bg-slate-50/50 dark:bg-slate-800/20 odd:bg-white odd:dark:bg-slate-900">
                        <span class="font-medium text-slate-500 dark:text-slate-400">${escapeHtml(key)}</span>
                        <span class="col-span-2 font-semibold text-slate-900 dark:text-white">${escapeHtml(val)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Action Controls -->
            <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-3 mb-4">
                <!-- Quantity Stepper -->
                <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <button 
                    id="modal-qty-minus" 
                    type="button" 
                    class="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    -
                  </button>
                  <input 
                    id="modal-qty-input" 
                    type="number" 
                    value="1" 
                    min="1" 
                    max="${product.stock}" 
                    class="w-12 text-center bg-transparent font-bold text-sm text-slate-900 dark:text-white focus:outline-none" 
                    readonly
                  />
                  <button 
                    id="modal-qty-plus" 
                    type="button" 
                    class="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    +
                  </button>
                </div>

                <!-- Wishlist Toggle -->
                <button 
                  id="modal-wishlist-toggle"
                  type="button"
                  class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-300 transition-colors"
                  title="Save to Wishlist"
                >
                  <svg class="w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none stroke-current stroke-2'}" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <!-- Main Add to Cart / Buy Now Buttons -->
              <div class="grid grid-cols-2 gap-3">
                <button 
                  id="modal-add-to-cart"
                  type="button"
                  class="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isOutOfStock ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white'}"
                  ${isOutOfStock ? 'disabled' : ''}
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span>Add to Cart</span>
                </button>

                <button 
                  id="modal-buy-now"
                  type="button"
                  class="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${isOutOfStock ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}"
                  ${isOutOfStock ? 'disabled' : ''}
                >
                  <span>Buy Now</span>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- Reviews Section -->
        <div class="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">Customer Reviews</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Verified buyer ratings and authentic feedback</p>
            </div>
            <button 
              id="toggle-write-review" 
              type="button"
              class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Write a Review
            </button>
          </div>

          <!-- Write Review Form (Initially Hidden) -->
          <div id="write-review-form" class="hidden p-5 mb-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Share your experience</h4>
            
            <form id="review-submit-form" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Rating</label>
                <div id="star-picker" class="flex items-center gap-1 cursor-pointer">
                  ${[1, 2, 3, 4, 5].map(num => `
                    <button type="button" class="star-btn p-1 text-slate-300 hover:text-amber-400 transition-colors" data-star="${num}">
                      <svg class="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </button>
                  `).join('')}
                </div>
                <input type="hidden" id="review-rating-val" value="5" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Name *</label>
                  <input type="text" id="review-author" required placeholder="e.g. Jordan Smith" class="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Review Headline</label>
                  <input type="text" id="review-title" placeholder="e.g. Incredible quality and fast shipping" class="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Detailed Feedback *</label>
                <textarea id="review-comment" required rows="3" placeholder="Tell us what you liked or how the product performed..." class="w-full text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"></textarea>
              </div>

              <div class="flex justify-end gap-2">
                <button type="button" id="cancel-review" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700">Submit Review</button>
              </div>
            </form>
          </div>

          <!-- Reviews Feed -->
          <div id="reviews-feed" class="space-y-4">
            <div class="text-xs text-slate-400 py-4 text-center">Loading customer reviews...</div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Bind Gallery Thumbnails
  const mainImage = document.getElementById('main-product-image');
  const thumbs = modalContainer.querySelectorAll('.js-gallery-thumb');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('border-indigo-600', 'scale-105'));
      thumb.classList.add('border-indigo-600', 'scale-105');
      mainImage.src = thumb.dataset.imgSrc;
    });
  });

  // Quantity stepper
  const qtyInput = document.getElementById('modal-qty-input');
  document.getElementById('modal-qty-minus')?.addEventListener('click', () => {
    const val = parseInt(qtyInput.value, 10) || 1;
    if (val > 1) qtyInput.value = val - 1;
  });
  document.getElementById('modal-qty-plus')?.addEventListener('click', () => {
    const val = parseInt(qtyInput.value, 10) || 1;
    if (val < product.stock) qtyInput.value = val + 1;
  });

  // Wishlist toggle
  const wishlistBtn = document.getElementById('modal-wishlist-toggle');
  wishlistBtn?.addEventListener('click', () => {
    store.toggleWishlist(product.id);
    const wishlisted = store.isWishlisted(product.id);
    wishlistBtn.innerHTML = `
      <svg class="w-5 h-5 ${wishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none stroke-current stroke-2'}" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    `;
    toast.info(wishlisted ? `Saved ${product.name} to Wishlist` : `Removed from Wishlist`);
  });

  // Add to Cart
  document.getElementById('modal-add-to-cart')?.addEventListener('click', () => {
    const qty = parseInt(qtyInput.value, 10) || 1;
    store.addToCart(product, qty);
    toast.success(`Added ${qty}x ${product.name} to cart!`);
  });

  // Buy Now
  document.getElementById('modal-buy-now')?.addEventListener('click', () => {
    const qty = parseInt(qtyInput.value, 10) || 1;
    store.addToCart(product, qty);
    closeProductModal();
    // Trigger checkout
    store.emit('checkout:open');
  });

  // Close modal bindings
  const backdrop = document.getElementById('product-modal-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeProductModal();
  });
  document.getElementById('close-product-modal')?.addEventListener('click', closeProductModal);

  // Review Form Toggle
  const writeReviewToggle = document.getElementById('toggle-write-review');
  const reviewFormBox = document.getElementById('write-review-form');
  writeReviewToggle?.addEventListener('click', () => {
    reviewFormBox.classList.toggle('hidden');
  });
  document.getElementById('cancel-review')?.addEventListener('click', () => {
    reviewFormBox.classList.add('hidden');
  });

  // Star Picker
  let currentStarRating = 5;
  const starBtns = modalContainer.querySelectorAll('.star-btn');
  const updateStarDisplay = (rating) => {
    starBtns.forEach(btn => {
      const starVal = parseInt(btn.dataset.star, 10);
      if (starVal <= rating) {
        btn.classList.add('text-amber-400');
        btn.classList.remove('text-slate-300');
      } else {
        btn.classList.remove('text-amber-400');
        btn.classList.add('text-slate-300');
      }
    });
  };
  updateStarDisplay(5);

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentStarRating = parseInt(btn.dataset.star, 10);
      document.getElementById('review-rating-val').value = currentStarRating;
      updateStarDisplay(currentStarRating);
    });
  });

  // Load reviews from API
  loadProductReviews(product.id);

  // Submit Review Form
  const reviewSubmitForm = document.getElementById('review-submit-form');
  reviewSubmitForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = document.getElementById('review-author').value.trim();
    const title = document.getElementById('review-title').value.trim();
    const comment = document.getElementById('review-comment').value.trim();

    try {
      await api.addReview(product.id, {
        author,
        rating: currentStarRating,
        title,
        comment
      });
      toast.success('Thank you! Your review has been submitted.');
      reviewSubmitForm.reset();
      reviewFormBox.classList.add('hidden');
      loadProductReviews(product.id);
      // Reload products catalog in store to reflect new rating
      store.emit('products:reload');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    }
  });
}

async function loadProductReviews(productId) {
  const reviewsFeed = document.getElementById('reviews-feed');
  if (!reviewsFeed) return;

  try {
    const productData = await api.getProductById(productId);
    const reviews = productData.reviews || [];

    if (reviews.length === 0) {
      reviewsFeed.innerHTML = `
        <div class="text-center py-6 text-slate-400 text-xs">
          No reviews yet for this product. Be the first to share your review!
        </div>
      `;
      return;
    }

    reviewsFeed.innerHTML = reviews.map(rev => `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs text-slate-900 dark:text-white">${escapeHtml(rev.author)}</span>
            ${rev.verified ? `
              <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Verified Purchase
              </span>
            ` : ''}
          </div>
          <span class="text-[11px] text-slate-400">${formatDate(rev.date)}</span>
        </div>

        <div class="flex items-center gap-2 mb-2">
          ${renderStarRating(rev.rating)}
          <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(rev.title)}</span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          ${escapeHtml(rev.comment)}
        </p>
      </div>
    `).join('');
  } catch (err) {
    reviewsFeed.innerHTML = `<div class="text-xs text-rose-500 py-2">Could not load reviews.</div>`;
  }
}

export function closeProductModal() {
  const container = document.getElementById('product-modal-container');
  if (container) container.innerHTML = '';
}
