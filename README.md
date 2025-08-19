# Tapsilat TypeScript SDK

<div align="center">

[![Tapsilat Logo](https://tapsilat.com/og-tapsilat.png)](https://tapsilat.dev)

**Enterprise-grade TypeScript SDK for Tapsilat Payment Processing Platform**

</div>

## About Tapsilat

**Tapsilat** is Turkey's leading fintech platform providing comprehensive payment processing solutions for businesses of all sizes. Our cutting-edge technology enables secure, fast, and reliable payment transactions with support for multiple payment methods, currencies, and advanced fraud protection.

---

## Installation

```bash
npm install @tapsilat/tapsilat-js
```

---

## Quick Start

### Initialize the SDK

```typescript
import { TapsilatSDK } from "@tapsilat/tapsilat-js";

const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_BEARER_TOKEN!,
  baseURL: "https://acquiring.tapsilat.dev/api/v1",
});
```

### Create an Order

```typescript
const order = await tapsilat.createOrder({
  amount: 150.75,
  currency: "TRY",
  locale: "tr",
  buyer: {
    name: "John",
    surname: "Doe",
    email: "john.doe@example.com",
    phone: "+9099999999",
  },
  description: "Premium subscription - Monthly plan",
  // Metadata must be an array of key-value pairs
  metadata: [
    { key: "productId", value: "PREMIUM-MONTHLY" },
    { key: "customerType", value: "new" }
  ]
});

console.log("Checkout URL:", order.checkout_url);
```

### Check Order Status

```typescript
const status = await tapsilat.getOrderStatus(order.reference_id);
console.log("Order status:", status.status);
```

---

## Features

### Core Payment Operations
- Secure authentication with bearer tokens
- Complete payment lifecycle management
- Multi-currency support (TRY, USD, EUR, GBP)
- Advanced filtering and pagination

### Payment Term Management
- Create and manage installment plans
- Update payment terms (amount, dates, status)
- Delete payment terms
- Term-specific refunds and termination
- Complete order termination

### Validation & Utilities
- Turkish GSM number validation and formatting
- Installment validation with flexible input formats
- Input validation for all request parameters
- Webhook signature verification

### Technical Features
- Full TypeScript support
- Modern ES6+ architecture
- Automatic retry logic
- Configuration management
- Health monitoring
- Request/response interceptors

---

## SDK Compatibility

This JavaScript SDK provides full feature parity with Tapsilat's Python and .NET SDKs:

| Feature Category | JavaScript | Python | .NET | 
|-----------------|------------|--------|------|
| Order Management | Yes | Yes | Yes |
| Payment Terms | Yes | Yes | Yes |
| GSM Validation | Yes | Yes | Yes |
| Installment Validation | Yes | Yes | Yes |
| Webhook Verification | Yes | No | No |
| TypeScript Support | Yes | No | Yes |
| Health Monitoring | Yes | No | No |

---

## API Methods & Examples

### Order Management

#### Create Order
```typescript
const order = await tapsilat.createOrder({
  amount: 299.99,
  currency: 'TRY',
  locale: 'tr',
  buyer: {
    name: 'John',
    surname: 'Doe',
    email: 'john-doe@example.com',
    phone: '+9099999999'
  },
  description: 'Product purchase',
  callbackUrl: 'https://mystore.com/success',
  metadata: [
    { key: 'productId', value: 'PROD_123' },
    { key: 'campaignCode', value: 'DISCOUNT20' }
  ]
});
```

#### Get Order Details
```typescript
const order = await tapsilat.getOrder('order-reference-id');
console.log('Order amount:', order.amount);
console.log('Order status:', order.status);
```

#### Check Order Status
```typescript
const status = await tapsilat.getOrderStatus('order-reference-id');
if (status.status === 'completed') {
  console.log('Payment successful!');
}
```

#### List Orders
```typescript
const orders = await tapsilat.getOrders({ page: 1, per_page: 10 });
orders.rows.forEach(order => {
  console.log(`Order ${order.reference_id}: ${order.amount} ${order.currency}`);
});
```

#### Cancel Order
```typescript
try {
  await tapsilat.cancelOrder('order-reference-id');
  console.log('Order cancelled successfully');
} catch (error) {
  console.error('Cannot cancel order:', error.message);
}
```

### Payment Operations

#### Get Payment Details
```typescript
const paymentDetails = await tapsilat.getOrderPaymentDetails('order-reference-id');
paymentDetails.forEach(detail => {
  console.log(`Payment: ${detail.amount} ${detail.currency}`);
});
```

#### Get Transaction History
```typescript
const transactions = await tapsilat.getOrderTransactions('order-reference-id');
transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} on ${tx.created_at}`);
});
```

#### Get Checkout URL
```typescript
const checkoutUrl = await tapsilat.getCheckoutUrl('order-reference-id');
// Redirect customer to checkout
window.location.href = checkoutUrl;
```

### Refund Operations

#### Process Partial Refund
```typescript
const refund = await tapsilat.refundOrder({
  reference_id: 'order-reference-id',
  amount: 50.00,
  reason: 'Customer request',
  metadata: [
    { key: 'refundType', value: 'partial' },
    { key: 'ticketId', value: 'TICKET_789' }
  ]
});
console.log('Refund ID:', refund.id);
```

#### Process Full Refund
```typescript
const fullRefund = await tapsilat.refundAllOrder('order-reference-id');
console.log('Full refund processed:', fullRefund.amount);
```

### Webhook Handling

#### Verify Webhook Signature
```typescript
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/tapsilat', async (req, res) => {
  const payload = req.body.toString();
  const signature = req.headers['x-tapsilat-signature'];
  
  const isValid = await tapsilat.verifyWebhook(
    payload, 
    signature, 
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'order.completed':
      console.log('Order completed:', event.data.reference_id);
      // Process successful payment
      break;
    case 'order.failed':
      console.log('Order failed:', event.data.reference_id);
      // Handle failed payment
      break;
  }
  
  res.json({ received: true });
});
```

### Payment Term Management

#### Create Payment Term
```typescript
const paymentTerm = await tapsilat.createOrderTerm({
  order_id: 'order-reference-id',
  term_reference_id: 'term-001',
  amount: 250.00,
  due_date: '2024-12-31',
  term_sequence: 1,
  required: true,
  status: 'pending',
  data: 'First installment'
});
console.log('Payment term created:', paymentTerm.term_reference_id);
```

#### Update Payment Term
```typescript
const updatedTerm = await tapsilat.updateOrderTerm({
  term_reference_id: 'term-001',
  amount: 275.00,
  due_date: '2025-01-15',
  status: 'updated'
});
console.log('Payment term updated:', updatedTerm.status);
```

#### Delete Payment Term
```typescript
const deletedTerm = await tapsilat.deleteOrderTerm({
  term_reference_id: 'term-001'
});
console.log('Payment term deleted:', deletedTerm.term_reference_id);
```

#### Refund Payment Term
```typescript
const termRefund = await tapsilat.refundOrderTerm({
  term_id: 'term-001',
  amount: 100.00,
  reference_id: 'refund-ref-123'
});
console.log('Term refund processed:', termRefund.refund_id);
```

#### Terminate Payment Term
```typescript
const terminatedTerm = await tapsilat.terminateOrderTerm({
  term_reference_id: 'term-001',
  reason: 'Customer request'
});
console.log('Payment term terminated:', terminatedTerm.status);
```

#### Terminate Order
```typescript
const terminatedOrder = await tapsilat.terminateOrder({
  reference_id: 'order-reference-id',
  reason: 'Business decision'
});
console.log('Order terminated at:', terminatedOrder.terminated_at);
```

### Validation Utilities

#### GSM Number Validation
```typescript
import { validateGsmNumber } from "@tapsilat/tapsilat-js";

const gsmResult = validateGsmNumber('+90 555 123 45 67');
if (gsmResult.isValid) {
  console.log('Cleaned number:', gsmResult.cleanedNumber); // +905551234567
} else {
  console.error('Invalid GSM:', gsmResult.error);
}

// Supports multiple formats
validateGsmNumber('0555 123 45 67');  // National format
validateGsmNumber('555 123 45 67');   // Local format
validateGsmNumber('5551234567');      // No formatting
```

#### Installments Validation
```typescript
import { validateInstallments } from "@tapsilat/tapsilat-js";

// Single installment
const single = validateInstallments(3);
console.log(single.validatedInstallments); // [3]

// Multiple installments
const multiple = validateInstallments('1,3,6,12');
console.log(multiple.validatedInstallments); // [1, 3, 6, 12]

// Array format
const array = validateInstallments([6, 3, 12, 1]);
console.log(array.validatedInstallments); // [1, 3, 6, 12] (sorted, unique)

// Error handling
const invalid = validateInstallments('abc');
if (!invalid.isValid) {
  console.error('Validation error:', invalid.error);
}
```

### Health Monitoring

#### API Health Check
```typescript
const health = await tapsilat.healthCheck();
console.log('API Status:', health.status);
console.log('Timestamp:', health.timestamp);
```

---

## �️ Advanced Configuration

The SDK can be customized with various configuration options:

```typescript
const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_BEARER_TOKEN!,
  baseURL: "https://acquiring.tapsilat.dev/api/v1",
  timeout: 30000, // 30 seconds
  retryAttempts: 3, // Auto-retry on network errors
  debug: true, // Enable detailed logging
});
```

## �🔐 Authentication

Use Bearer Token authentication:

```typescript
const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_BEARER_TOKEN!,
});
```

Get your API token from the [Tapsilat Dashboard](https://tapsilat.dev) → Settings → API Keys

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Resources

- **Website**: [https://tapsilat.dev](https://tapsilat.dev)
- **Issues**: [GitHub Issues](https://github.com/tapsilat/tapsilat-js/issues)
- **Examples**: See [examples/basic-usage.js](examples/basic-usage.js) for a complete implementation

## Type System

All TypeScript types are organized in `src/types/index.ts` with proper JSDoc documentation including:
- `@category` - Logical grouping of related types
- `@summary` - Brief description of what the type represents
- `@description` - Detailed explanation with usage context
- `@typedef` / `@interface` - Appropriate type annotations

---

<div align="center">

[![Tapsilat](https://img.shields.io/badge/Tapsilat-Payment%20Solutions-blue?style=for-the-badge)](https://tapsilat.dev)

</div>
