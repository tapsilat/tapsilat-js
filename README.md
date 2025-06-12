# Tapsilat TypeScript SDK

<div align="center">

[![Tapsilat Logo](https://tapsilat.dev/assets/logo.png)](https://tapsilat.dev)

**Enterprise-grade TypeScript SDK for Tapsilat Payment Processing Platform**

[![npm version](https://img.shields.io/npm/v/tapsilat-js.svg?style=flat-square)](https://www.npmjs.com/package/tapsilat-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)

</div>

## 🏢 About Tapsilat

**Tapsilat** is Turkey's leading fintech platform providing comprehensive payment processing solutions for businesses of all sizes. Our cutting-edge technology enables secure, fast, and reliable payment transactions with support for multiple payment methods, currencies, and advanced fraud protection.

### ✨ Key Features
- 🛡️ **Enterprise Security**: PCI DSS Level 1 compliant with advanced fraud detection
- 🌍 **Multi-Currency Support**: Process payments in TRY, USD, EUR, and GBP
- ⚡ **Real-time Processing**: Sub-second transaction processing with 99.9% uptime
- 🔄 **Flexible Integration**: REST API, webhooks, and comprehensive SDKs
- 📊 **Advanced Analytics**: Real-time reporting and business intelligence
- 🎯 **TypeScript First**: Full type safety with comprehensive IntelliSense support

---

## 🚀 Installation

```bash
npm install tapsilat-js
```

---

## ⚡ Quick Start

### Initialize the SDK

```typescript
import { TapsilatSDK } from "tapsilat-js";

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
    phone: "+905551234567",
  },
  description: "Premium subscription - Monthly plan",
});
```

### Check Order Status

```typescript
const status = await tapsilat.getOrderStatus(order.reference_id);
console.log("Order status:", status.status);
```

---

## 📖 API Methods & Examples

### Order Management

#### Create Order
```typescript
const order = await tapsilat.createOrder({
  amount: 299.99,
  currency: 'TRY',
  locale: 'tr',
  buyer: {
    name: 'Ahmet',
    surname: 'Yılmaz',
    email: 'ahmet@example.com',
    phone: '+905551234567'
  },
  description: 'Product purchase',
  callbackUrl: 'https://mystore.com/success',
  metadata: {
    productId: 'PROD_123',
    campaignCode: 'DISCOUNT20'
  }
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
  metadata: {
    refundType: 'partial',
    ticketId: 'TICKET_789'
  }
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

### Health Monitoring

#### API Health Check
```typescript
const health = await tapsilat.healthCheck();
console.log('API Status:', health.status);
console.log('Timestamp:', health.timestamp);
```

---

## 🔐 Authentication

Use Bearer Token authentication:

```typescript
const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_BEARER_TOKEN!,
});
```

Get your API token from the [Tapsilat Dashboard](https://tapsilat.dev) → Settings → API Keys

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Resources

- 🌐 **Website**: [https://tapsilat.dev](https://tapsilat.dev)
- 📚 **API Documentation**: [https://docs.tapsilat.dev](https://docs.tapsilat.dev)
- 📞 **Support**: [support@tapsilat.dev](mailto:support@tapsilat.dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/tapsilat/tapsilat-js/issues)

---

<div align="center">

[![Tapsilat](https://img.shields.io/badge/Tapsilat-Payment%20Solutions-blue?style=for-the-badge)](https://tapsilat.dev)

</div>
