// Automated Test Suite for AuraMarket API
const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting AuraMarket Automated Tests...\n');
  let passed = 0;
  let failed = 0;

  async function assert(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // Test 1: GET /api/products
  await assert('GET /api/products returns products catalog', async () => {
    const res = await request('/products');
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (!Array.isArray(res.data.products) || res.data.products.length === 0) {
      throw new Error('Products array empty or missing');
    }
    if (!Array.isArray(res.data.categories) || res.data.categories.length === 0) {
      throw new Error('Categories array empty or missing');
    }
  });

  // Test 2: Filter by category
  await assert('GET /api/products?category=Electronics filters properly', async () => {
    const res = await request('/products?category=Electronics');
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const nonElec = res.data.products.find(p => p.category !== 'Electronics');
    if (nonElec) throw new Error(`Found non-electronic product: ${nonElec.name}`);
  });

  // Test 3: Search by keyword
  await assert('GET /api/products?search=headphones searches properly', async () => {
    const res = await request('/products?search=headphones');
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (res.data.products.length === 0) throw new Error('Search found 0 products');
  });

  // Test 4: Single product details with reviews
  await assert('GET /api/products/prod-1 returns single product with reviews', async () => {
    const res = await request('/products/prod-1');
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (res.data.id !== 'prod-1') throw new Error(`Expected prod-1, got ${res.data.id}`);
    if (!Array.isArray(res.data.reviews)) throw new Error('Reviews missing');
  });

  // Test 5: Validate coupon code
  await assert('POST /api/coupons/validate returns valid discount for SAVE10', async () => {
    const res = await request('/coupons/validate', {
      method: 'POST',
      body: { code: 'SAVE10', subtotal: 100 }
    });
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (!res.data.valid || res.data.discount !== 10) {
      throw new Error(`Invalid discount calculation: ${JSON.stringify(res.data)}`);
    }
  });

  // Test 6: Place a new order
  let createdOrderId = null;
  await assert('POST /api/orders successfully places order with calculations', async () => {
    const res = await request('/orders', {
      method: 'POST',
      body: {
        customer: {
          fullName: 'Test Buyer',
          email: 'test.buyer@example.com',
          phone: '+1 555-111-2222'
        },
        shippingAddress: {
          street: '123 Main St',
          city: 'Portland',
          state: 'OR',
          zip: '97201',
          country: 'United States'
        },
        items: [
          { id: 'prod-1', quantity: 1 }
        ],
        shippingMethod: 'standard',
        couponCode: 'SAVE10',
        paymentMethod: 'card'
      }
    });

    if (res.status !== 201) throw new Error(`Status was ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.order || !res.data.order.id) throw new Error('Order ID missing in response');
    createdOrderId = res.data.order.id;
  });

  // Test 7: Order tracking lookup
  await assert('GET /api/orders/:id returns newly created order tracking', async () => {
    if (!createdOrderId) throw new Error('No order ID from previous test');
    const res = await request(`/orders/${createdOrderId}`);
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (res.data.id !== createdOrderId) throw new Error(`Order ID mismatch`);
    if (!Array.isArray(res.data.trackingSteps)) throw new Error('Tracking steps missing');
  });

  // Test 8: Admin update order status
  await assert('PATCH /api/orders/:id/status updates order status to Shipped', async () => {
    if (!createdOrderId) throw new Error('No order ID');
    const res = await request(`/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      body: { status: 'Shipped' }
    });
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (res.data.order.orderStatus !== 'Shipped') throw new Error(`Expected Shipped, got ${res.data.order.orderStatus}`);
  });

  // Test 9: Admin KPIs
  await assert('GET /api/stats returns store revenue and order metrics', async () => {
    const res = await request('/stats');
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    if (typeof res.data.totalRevenue !== 'number' || typeof res.data.totalOrders !== 'number') {
      throw new Error(`Invalid stats structure: ${JSON.stringify(res.data)}`);
    }
  });

  // Test 10: Admin add & delete product
  let newProdId = null;
  await assert('POST and DELETE /api/products handles product CRUD', async () => {
    const createRes = await request('/products', {
      method: 'POST',
      body: {
        name: 'Unit Test Gadget',
        category: 'Electronics',
        price: 49.99,
        stock: 15,
        description: 'Temporary unit test gadget'
      }
    });

    if (createRes.status !== 201) throw new Error(`Create failed: ${createRes.status}`);
    newProdId = createRes.data.product.id;

    const delRes = await request(`/products/${newProdId}`, { method: 'DELETE' });
    if (delRes.status !== 200) throw new Error(`Delete failed: ${delRes.status}`);
  });

  console.log(`\n================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Give server a second if starting together, or run immediately
setTimeout(runTests, 1000);
