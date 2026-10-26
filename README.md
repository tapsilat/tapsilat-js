# Tapsilat TypeScript SDK

<div align="center">

[![Tapsilat Logo](https://tapsilat.com/logo.png)](https://tapsilat.dev)

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
  baseURL: "https://panel.tapsilat.dev/api/v1",
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
- Tapsilat Elements sessions for the native Android and iOS card sheet

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

All Tapsilat SDKs (Go, JavaScript, Python, .NET, Kotlin, Rust, Swift and Zig) target the same panel REST API, so orders, payment terms, subscriptions, organization settings, submerchants, VPOS, card tokenization, card installments and the marketplace API behave the same in each. Webhook signature verification and the health check are additional helpers in this SDK.

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
if (OrderStatus.isPaid(status.status)) {
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

#### Charge Order
```typescript
const chargeResult = await tapsilat.chargeOrder({
  order_reference_id: 'order-reference-id'
});
console.log('Order charged:', chargeResult);
```

#### Get Order Payments
`getAllOrdersPayments` is deprecated: the API has no route for it. List one order's payments with `getOrderPayments` and an order ID, reference ID or conversation ID.

```typescript
const payments = await tapsilat.getOrderPayments({ order_reference_id: 'order-reference-id' });
console.log('Merchant net amount:', payments.total_merchant_net_amount);
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
Tapsilat signs every callback it sends to your callback URLs, and to an order's `payment_success_url` and `payment_failure_url`, with the webhook secret from the panel's callback settings. The `Tapsilat-Signature` header looks like `t=1726480000,v1=5257a8…`: `v1` is the hex HMAC-SHA256 of the timestamp, a dot and the raw body.

`verifyWebhook` checks it in constant time and rejects a timestamp more than 5 minutes from the server clock, so a captured callback cannot be replayed. Pass the raw body (a string or a `Buffer`), not re-encoded JSON. It resolves to `false` when the header is missing, malformed, stale or wrong.
```typescript
import express from 'express';
import { WebhookEvent, WEBHOOK_SIGNATURE_HEADER } from '@tapsilat/tapsilat-js';

const app = express();

app.post('/webhooks/tapsilat', express.raw({ type: '*/*' }), async (req, res) => {
  const isValid = await tapsilat.verifyWebhook(
    req.body, // the raw body as a Buffer
    req.get(WEBHOOK_SIGNATURE_HEADER), // "Tapsilat-Signature"
    process.env.TAPSILAT_WEBHOOK_SECRET!
  );
  if (!isValid) {
    return res.sendStatus(400);
  }

  const event = WebhookEvent.fromPayload(req.body);
  event.type;           // "order_lite" (the default), "order", "order_payment_detail", ...
  event.referenceId;    // the order's reference ID, whatever the callback type
  event.conversationId;
  event.status;         // e.g. "Paid", when the callback type carries a status

  if (event.isPaid()) {
    // fulfil the order
  }
  res.sendStatus(200);
});
```

A different tolerance in seconds can be passed as `{ tolerance }` in the fourth argument (`0` disables the timestamp check), and `{ now }` sets the Unix time to compare with. A bare hex HMAC of the body, with or without a `sha256=` prefix, is still accepted for signatures made the way earlier SDK versions documented.

#### Order Statuses
`OrderStatus` has the numeric status codes that callbacks carry, the names `getOrderStatus()` returns, and the groups most integrations need:
```typescript
import { OrderStatus } from '@tapsilat/tapsilat-js';

const { status } = await tapsilat.getOrderStatus(referenceId); // e.g. "Waiting for payment"

OrderStatus.isPaid(status);     // Paid, Completed, Sub merchant payment approved
OrderStatus.isFailed(status);   // Cancelled, Fraud, Rejected, Failure, Expired, Terminated
OrderStatus.isRefunded(status); // Refunded, Partially refunded
OrderStatus.code(status);       // 7; also accepts "7" or 7
```

### Payment Term Management

#### Create Payment Term
```typescript
// order_id is the order's ID (order_id from createOrder), not its reference ID
const paymentTerm = await tapsilat.createOrderTerm({
  order_id: createdOrder.order_id,
  term_reference_id: 'term-001',
  amount: 250.00,
  due_date: '2024-12-31', // YYYY-MM-DD
  term_sequence: 1,
  required: true,
  data: 'First installment'
});
console.log('Payment term created:', paymentTerm.term_reference_id);
```

#### Update Payment Term
```typescript
// The update replaces the term, so send every field rather than only the changed ones
const updatedTerm = await tapsilat.updateOrderTerm({
  term_reference_id: 'term-001',
  term_sequence: 1,
  required: true,
  amount: 275.00,
  due_date: '2025-01-15',
  status: 'pending'
});
console.log('Payment term updated:', updatedTerm.status);
```

#### Delete Payment Term
```typescript
const deletedTerm = await tapsilat.deleteOrderTerm({
  order_id: createdOrder.order_id,
  term_reference_id: 'term-001'
});
console.log('Payment term deleted:', deletedTerm.term_reference_id);
```

#### Refund Payment Term
```typescript
const termRefund = await tapsilat.refundOrderTerm({
  term_id: 'term-id',              // the term's ID
  reference_id: 'order-reference-id', // the order's reference ID
  amount: 100.00
});
console.log('Term refund processed:', termRefund.refund_id);
```

#### Terminate Payment Term
`terminateOrderTerm` is deprecated: the API has no payment term termination route. Delete the term with `deleteOrderTerm`, or end the whole order with `terminateOrder`.

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

### Submerchant Management

#### Create Submerchant
```typescript
const submerchant = await tapsilat.submerchant.create({
  name: "Test Submerchant",
  email: "submerchant@example.com",
  address: "Istanbul, Turkey",
  city: "Istanbul",
  country: "Turkey",
  gsm_number: "5555555555",
  iban: "TR123456789012345678901234",
  identity_number: "11111111111",
  contact_name: "Test",
  contact_surname: "Sub",
  sub_merchant_type: "PERSONAL",
  tax_office: "Test Office",
  zip_code: "34000"
});
console.log('Submerchant created:', submerchant.id);
```

#### List Submerchants
```typescript
const submerchants = await tapsilat.submerchant.list(1, 10);
submerchants.data.forEach(sub => {
  console.log(`Submerchant: ${sub.name}`);
});
```

### Document Downloads

#### Download Order PDF
```typescript
const pdfBlob = await tapsilat.orders.getPdf('order-reference-id');
// For browsers, you can create an object URL to download the Blob:
// const url = URL.createObjectURL(pdfBlob);
// window.open(url);
```

#### Download Order Excel
```typescript
const excelBlob = await tapsilat.orders.getExcel('order-reference-id');
```

### Subscription Management

#### Create Subscription
```typescript
const subscription = await tapsilat.createSubscription({
  plan_id: 'plan-123',
  subscriber: {
    name: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    gsm_number: '+905551234567'
  },
  pricing: {
    amount: 100,
    currency: 'TRY'
  }
});
console.log('Subscription created:', subscription.reference_id);
```

#### Get Subscription Details
```typescript
const sub = await tapsilat.getSubscription({
  reference_id: 'sub-ref-123'
});
console.log('Subscription status:', sub.status);
```

#### List Subscriptions
```typescript
const subs = await tapsilat.listSubscriptions(1, 10);
subs.rows.forEach(sub => {
  console.log(`Subscription ${sub.reference_id}: ${sub.status}`);
});
```

#### Cancel Subscription
```typescript
const result = await tapsilat.cancelSubscription({
  reference_id: 'sub-ref-123',
  reason: 'Customer request'
});
console.log('Subscription cancelled:', result.success);
```

#### Redirect Subscription
```typescript
const redirect = await tapsilat.redirectSubscription({
  reference_id: 'sub-ref-123',
  return_url: 'https://mysite.com/callback'
});
console.log('Redirect URL:', redirect.url);
```

### Validation Utilities

#### GSM Number Validation
```typescript
import { validateGsmNumber } from "@tapsilat/tapsilat-js";

const gsmResult = validateGsmNumber('+90 555 123 45 67');
if (gsmResult.isValid) {
  console.log('Cleaned number:', gsmResult.cleanedNumber); // +90000000000
} else {
  console.error('Invalid GSM:', gsmResult.error);
}

// Supports multiple formats
validateGsmNumber('0999 123 45 67');  // National format
validateGsmNumber('999 123 45 67');   // Local format
validateGsmNumber('9991234567');      // No formatting
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

### Organization & Settings

#### Get Organization Settings
```typescript
const settings = await tapsilat.getOrganizationSettings();
console.log('Organization Settings:', settings);
```

#### Get Currency Presets
```typescript
const presets = await tapsilat.getOrganizationCurrencyPresets();
console.log('Available currencies:', presets.items);
```

#### Organization Management
```typescript
// Create Currency
const newCurrency = await tapsilat.createOrganizationCurrency({
  currency_code: 'EUR'
});

// Get Partners
const partners = await tapsilat.getOrganizationPartners();

// Get Limits
const limits = await tapsilat.getOrganizationLimitsById('org-uuid', { currency: 'TRY' });
```

#### Get Suborganization Details
```typescript
const suborg = await tapsilat.getOrganizationSuborganizationDetails('suborg-id');
console.log('Suborganization Name:', suborg.name);
```

### System Utilities

#### Get System Endpoints
```typescript
// Fetch various system configurations
const config = await tapsilat.getSystemConfig();
const errorCodes = await tapsilat.getSystemErrorCodes();
const productTypes = await tapsilat.getSystemProductTypes();
const transactionStatuses = await tapsilat.getSystemTransactionStatuses();
const basketItemTypes = await tapsilat.getSystemBasketItemTypes();

console.log('Available Error Codes:', errorCodes.rows);
```

### Manual Operations

#### Trigger Manual Callback
```typescript
const callbackResult = await tapsilat.orderManualCallback(
  'order-reference-id',
  'conversation-id' // optional
);
console.log('Callback triggered:', callbackResult.success);
```

#### Update Related Order
```typescript
const updateResult = await tapsilat.orderRelatedUpdate(
  'order-reference-id',
  'related-reference-id'
);
console.log('Related order updated:', updateResult.success);
```

### Card Installments and Charging

```typescript
const options = await tapsilat.getCardInstallments({
  bin: '54066200',
  amount: 100,
  currency: 'TRY',
});
// options.installments lists each installment count with its commission rate and monthly payment

const table = await tapsilat.getInstallmentTable({ amount: 100, currency: 'TRY' });
// table.groups lists installment rows per bank card program

const charge = await tapsilat.chargeOrder({ order_reference_id: 'order-reference-id' });
if (!charge.isSuccess) {
  // The request succeeded but the charge did not; inspect charge.errorCode and charge.message
}
```

### Submerchants, VPOS and Tokenization

Grouped services cover the remaining management APIs. Currency fields accept a currency UUID or an organization unit such as `TRY`; the server resolves units.

```typescript
await tapsilat.submerchants.createSubmerchant({
  locale: 'tr',
  conversation_id: 'seller-1',
  name: 'Example Ltd',
  email: 'finance@example.test',
  gsm_number: '905551112233',
  sub_merchant_type: 'PRIVATE_COMPANY',
  tax_number: '1234567890',
  currency_id: 'TRY',
});

const posList = await tapsilat.vpos.listVpos({ page: 1, per_page: 20 });
const card = await tapsilat.tokenization.tokenizeCard({
  card_number: '4111111111111111',
  holder_name: 'John Doe',
  expiry_month: '12',
  expiry_year: '30',
  cvv: '123',
  user_id: 'customer-1',
});
```

`updateVpos` and `updateSubmerchant` replace the stored record: read it first and send every field back. For example, leaving out `failover` or `tls` stores `false`.

### Marketplace

`tapsilat.marketplace` uses the API version 2 routes, derived from your `baseURL`. Revisions are opaque strings: pass them back exactly as received.

```typescript
const payout = await tapsilat.marketplace.getMarketplacePayout(payoutId);
if (payout.eligibility_status === 'eligible' && payout.release_status === 'awaiting_approval') {
  await tapsilat.marketplace.approveMarketplacePayouts({ ids: [payout.id!] });
}

await tapsilat.marketplace.runMarketplacePayoutOperation(payoutId, {
  kind: 'update_item',
  idempotency_key: 'booking-123-allocation-change-1',
  revision: payout.revision!,
  seller_reference: seller.routing_reference,
  net_amount: '60.25',
});
```

Approval policies need a currency UUID; `createMarketplaceApprovalPolicy` and `updateMarketplaceApprovalPolicy` resolve units such as `TRY` for you, and `tapsilat.resolveCurrencyId('TRY')` exposes the same lookup.

### Tapsilat Elements Sessions

Tapsilat Elements is the native Android and iOS card sheet. Your backend creates a session with its secret API key and passes only the session's `client_secret` to the app, which opens the sheet with it. Card data goes from the sheet to Tapsilat encrypted and never reaches your backend.

#### Create an Elements Session
```typescript
import { ElementsSessionPurpose } from '@tapsilat/tapsilat-js';

const session = await tapsilat.createElementsSession({
  purpose: ElementsSessionPurpose.PAY,
  order_reference_id: order.reference_id,
  save_card: true,
});

// Return session.id and session.client_secret to your app. Do not log or store the secret.
res.json({ id: session.id, client_secret: session.client_secret });
```

A `pay` session needs `order_reference_id`. A `tokenize` session saves a card for `user_id`, with `mode` set to `ElementsTokenizeMode.SECURE` (3D Secure), `HALF_SECURE` or `NON_SECURE`:
```typescript
import { ElementsSessionPurpose, ElementsTokenizeMode } from '@tapsilat/tapsilat-js';

const session = await tapsilat.createElementsSession({
  purpose: ElementsSessionPurpose.TOKENIZE,
  user_id: 'customer-1',
  user_email: 'customer@example.test',
  mode: ElementsTokenizeMode.SECURE,
});
```

#### Get the Session Outcome
Read the outcome on your backend before fulfilling, instead of trusting what the app reports:
```typescript
import { ElementsSessionStatus } from '@tapsilat/tapsilat-js';

const outcome = await tapsilat.getElementsSession(sessionId);
if (outcome.status === ElementsSessionStatus.SUCCEEDED) {
  // fulfil the order; outcome.card holds the brand, last4 and expiry
} else if (outcome.status === ElementsSessionStatus.FAILED) {
  // outcome.last_error?.code says why, for example "card_declined"
}
```

#### Cancel an Elements Session
```typescript
const canceled = await tapsilat.cancelElementsSession(sessionId);
```
This cancels a session that is still waiting for a card. A session that is confirming or has completed comes back unchanged, so check `canceled.status`.

The client secret is returned only by `createElementsSession`. In Node.js, `console.log` and `util.inspect` print it as `[redacted]`, and `JSON.stringify` keeps it so you can still send it to the app; a copy made with the spread operator prints it in full. `status`, `purpose` and `card.brand` are plain strings, so compare them with `ElementsSessionStatus`, `ElementsSessionPurpose` and `ElementsCardBrand`. Elements errors carry a stable `apiCode` (for example `elements_not_enabled` with HTTP 403, `session_not_found` with HTTP 404) and `retryable`, which is `true` for a temporary failure such as HTTP 503 `unavailable`:
```typescript
import { TapsilatError } from '@tapsilat/tapsilat-js';

try {
  await tapsilat.getElementsSession(sessionId);
} catch (error) {
  if (error instanceof TapsilatError && error.retryable) {
    // try again later
  }
}
```

### Error Details

Failed requests throw a `TapsilatError` (or a subclass). Besides `message` and `code`, it carries `statusCode`, the API's own `apiCode` and `apiStatus`, per-field validation `errors`, `retryable`, and the `rawBody`. Elements routes nest the error as `{"error": {"code": "...", "message": "...", "retryable": true}}`; `apiCode`, `message` and `retryable` are read from that object. Most "not found" errors arrive as HTTP 400, and rejected state changes (for example approving an ineligible payout) as HTTP 424. A successful status with an HTML body, which a deployment serving the panel UI returns for unknown routes, raises a `TapsilatError` with code `UNEXPECTED_RESPONSE`.

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
  baseURL: "https://panel.tapsilat.dev/api/v1",
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
