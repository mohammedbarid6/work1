const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Safe file helpers
function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// -------------------------------------------------------------
// PRODUCTS API
// -------------------------------------------------------------

// GET /api/products
app.get('/api/products', (req, res) => {
  let products = readJson(PRODUCTS_FILE, []);
  const { category, search, minPrice, maxPrice, inStock, sort } = req.query;

  // Filter by category
  if (category && category.toLowerCase() !== 'all') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by search query
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Filter by price range
  if (minPrice !== undefined && minPrice !== '') {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) products = products.filter(p => p.price >= min);
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) products = products.filter(p => p.price <= max);
  }

  // Filter by stock
  if (inStock === 'true') {
    products = products.filter(p => p.stock > 0);
  }

  // Sort
  if (sort === 'price-low') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    products.sort((a, b) => (b.badge === 'New Arrival' ? 1 : 0) - (a.badge === 'New Arrival' ? 1 : 0));
  } else {
    // Default: featured first, then bestselling
    products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  // Extract distinct categories with counts
  const allProducts = readJson(PRODUCTS_FILE, []);
  const categoryCounts = allProducts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total: products.length,
    products,
    categories: Object.entries(categoryCounts).map(([name, count]) => ({ name, count }))
  });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = readJson(REVIEWS_FILE, []).filter(r => r.productId === req.params.id);
  res.json({
    ...product,
    reviews
  });
});

// POST /api/products (Admin)
app.post('/api/products', (req, res) => {
  const { name, category, price, originalPrice, stock, description, image, specs, tags, badge } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required.' });
  }

  const products = readJson(PRODUCTS_FILE, []);
  const newProduct = {
    id: `prod-${Date.now()}`,
    name: name.trim(),
    category: category.trim(),
    price: parseFloat(price),
    originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
    stock: parseInt(stock, 10) || 10,
    rating: 5.0,
    reviewCount: 0,
    badge: badge || 'New',
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    gallery: [
      image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
    ],
    description: description || 'Premium quality craftsmanship with modern aesthetic.',
    specs: specs || { "Quality": "Premium", "Warranty": "1 Year" },
    tags: Array.isArray(tags) ? tags : ['new', category.toLowerCase()],
    isFeatured: false
  };

  products.unshift(newProduct);
  writeJson(PRODUCTS_FILE, products);
  res.status(201).json({ success: true, product: newProduct });
});

// PUT /api/products/:id (Admin update)
app.put('/api/products/:id', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updated = {
    ...products[index],
    ...req.body,
    id: products[index].id // preserve ID
  };

  if (req.body.price !== undefined) updated.price = parseFloat(req.body.price);
  if (req.body.originalPrice !== undefined) updated.originalPrice = parseFloat(req.body.originalPrice);
  if (req.body.stock !== undefined) updated.stock = parseInt(req.body.stock, 10);

  products[index] = updated;
  writeJson(PRODUCTS_FILE, products);
  res.json({ success: true, product: updated });
});

// DELETE /api/products/:id (Admin delete)
app.delete('/api/products/:id', (req, res) => {
  let products = readJson(PRODUCTS_FILE, []);
  const initialLen = products.length;
  products = products.filter(p => p.id !== req.params.id);
  if (products.length === initialLen) {
    return res.status(404).json({ error: 'Product not found' });
  }

  writeJson(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// POST /api/products/:id/reviews
app.post('/api/products/:id/reviews', (req, res) => {
  const { author, rating, title, comment } = req.body;
  if (!author || !rating || !comment) {
    return res.status(400).json({ error: 'Author, rating, and comment are required.' });
  }

  const products = readJson(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = readJson(REVIEWS_FILE, []);
  const newReview = {
    id: `rev-${Date.now()}`,
    productId: req.params.id,
    author: author.trim(),
    rating: Math.max(1, Math.min(5, parseInt(rating, 10))),
    title: title ? title.trim() : 'Great product!',
    comment: comment.trim(),
    verified: true,
    date: new Date().toISOString()
  };

  reviews.push(newReview);
  writeJson(REVIEWS_FILE, reviews);

  // Recalculate average rating
  const prodReviews = reviews.filter(r => r.productId === req.params.id);
  const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
  product.rating = parseFloat(avg.toFixed(1));
  product.reviewCount = prodReviews.length;
  writeJson(PRODUCTS_FILE, products);

  res.status(201).json({ success: true, review: newReview, rating: product.rating, reviewCount: product.reviewCount });
});

// -------------------------------------------------------------
// COUPONS API
// -------------------------------------------------------------

// POST /api/coupons/validate
app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Please provide a coupon code.' });
  }

  const coupons = readJson(COUPONS_FILE, []);
  const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ valid: false, message: 'Invalid promo code. Try SAVE10 or FREESHIP' });
  }

  const numericSubtotal = parseFloat(subtotal) || 0;
  if (coupon.minSpend && numericSubtotal < coupon.minSpend) {
    return res.status(400).json({
      valid: false,
      message: `Coupon ${coupon.code} requires a minimum order of $${coupon.minSpend.toFixed(2)}.`
    });
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = parseFloat(((numericSubtotal * coupon.value) / 100).toFixed(2));
  } else if (coupon.type === 'fixed') {
    discount = Math.min(numericSubtotal, coupon.value);
  } else if (coupon.type === 'free_shipping') {
    discount = 0; // handled during shipping calculation
  }

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    description: coupon.description,
    discount,
    message: `Coupon ${coupon.code} applied! ${coupon.description}`
  });
});

// -------------------------------------------------------------
// ORDERS API
// -------------------------------------------------------------

// GET /api/orders
app.get('/api/orders', (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  const { email } = req.query;
  if (email) {
    const userOrders = orders.filter(o => o.customer?.email?.toLowerCase() === email.trim().toLowerCase());
    return res.json(userOrders);
  }
  res.json(orders);
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  const order = orders.find(o => o.id.toUpperCase() === req.params.id.trim().toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found with that tracking ID' });
  }
  res.json(order);
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
  const { customer, shippingAddress, items, shippingMethod, couponCode, paymentMethod } = req.body;

  if (!customer || !customer.fullName || !customer.email) {
    return res.status(400).json({ error: 'Customer name and email are required.' });
  }
  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zip) {
    return res.status(400).json({ error: 'Complete shipping address is required.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please add items.' });
  }

  const products = readJson(PRODUCTS_FILE, []);
  const coupons = readJson(COUPONS_FILE, []);

  // Calculate order values accurately from catalog prices
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemPrice = prod.price;
      subtotal += itemPrice * qty;
      verifiedItems.push({
        id: prod.id,
        name: prod.name,
        price: itemPrice,
        quantity: qty,
        image: prod.image
      });

      // Decrement stock
      prod.stock = Math.max(0, prod.stock - qty);
    }
  }

  // Update products with new stock counts
  writeJson(PRODUCTS_FILE, products);

  // Validate coupon discount
  let discount = 0;
  let isFreeShipping = false;
  if (couponCode) {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (coupon && (!coupon.minSpend || subtotal >= coupon.minSpend)) {
      if (coupon.type === 'percentage') {
        discount = parseFloat(((subtotal * coupon.value) / 100).toFixed(2));
      } else if (coupon.type === 'fixed') {
        discount = Math.min(subtotal, coupon.value);
      } else if (coupon.type === 'free_shipping') {
        isFreeShipping = true;
      }
    }
  }

  // Shipping calculation
  let shippingCost = 0;
  if (shippingMethod === 'express') {
    shippingCost = 15.00;
  } else {
    // Standard shipping is free for orders over $50 or with free shipping coupon
    if (subtotal < 50 && !isFreeShipping) {
      shippingCost = 8.99;
    }
  }

  // Tax estimated at 8%
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = parseFloat((taxableAmount * 0.08).toFixed(2));
  const total = parseFloat((taxableAmount + shippingCost + tax).toFixed(2));

  // Generate unique readable order ID
  const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: orderId,
    customer: {
      fullName: customer.fullName.trim(),
      email: customer.email.trim(),
      phone: customer.phone ? customer.phone.trim() : ''
    },
    shippingAddress: {
      street: shippingAddress.street.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state ? shippingAddress.state.trim() : '',
      zip: shippingAddress.zip.trim(),
      country: shippingAddress.country ? shippingAddress.country.trim() : 'United States'
    },
    items: verifiedItems,
    shippingMethod: shippingMethod || 'standard',
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    shippingCost: parseFloat(shippingCost.toFixed(2)),
    tax,
    total,
    couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
    paymentMethod: paymentMethod || 'card',
    paymentStatus: 'Paid',
    orderStatus: 'Confirmed',
    trackingSteps: [
      { status: 'Order Placed', time: new Date().toISOString(), completed: true },
      { status: 'Processing', time: null, completed: false },
      { status: 'Shipped', time: null, completed: false },
      { status: 'Out for Delivery', time: null, completed: false },
      { status: 'Delivered', time: null, completed: false }
    ],
    carrier: shippingMethod === 'express' ? 'FedEx Priority Overnight' : 'Standard Ground Service',
    trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
    createdAt: new Date().toISOString()
  };

  const orders = readJson(ORDERS_FILE, []);
  orders.unshift(newOrder);
  writeJson(ORDERS_FILE, orders);

  res.status(201).json({
    success: true,
    message: 'Order created successfully!',
    order: newOrder
  });
});

// PATCH /api/orders/:id/status (Admin)
app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const orders = readJson(ORDERS_FILE, []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.orderStatus = status;

  // Update tracking steps up to the current status
  const statusHierarchy = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  const targetIndex = statusHierarchy.indexOf(status === 'Confirmed' ? 'Order Placed' : status);

  if (targetIndex !== -1 && order.trackingSteps) {
    order.trackingSteps.forEach((step, idx) => {
      if (idx <= targetIndex) {
        step.completed = true;
        if (!step.time) step.time = new Date().toISOString();
      } else {
        step.completed = false;
        step.time = null;
      }
    });
  }

  writeJson(ORDERS_FILE, orders);
  res.json({ success: true, order });
});

// -------------------------------------------------------------
// STATS / ANALYTICS API (Admin)
// -------------------------------------------------------------

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  const products = readJson(PRODUCTS_FILE, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lowStockProducts = products.filter(p => p.stock < 15);

  res.json({
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    totalProducts: products.length,
    lowStockCount: lowStockProducts.length,
    recentOrders: orders.slice(0, 5)
  });
});

// SPA fallback for HTML5 history API navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with Port Fallback
const DEFAULT_PORT = process.env.PORT || 3000;

function startServer(port, attempts = 0) {
  const server = app.listen(port, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 AuraMarket Server running on http://localhost:${port}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, 'public')}`);
    console.log(`⚡ REST API available at http://localhost:${port}/api`);
    console.log(`==============================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts < 5) {
      console.warn(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1, attempts + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
