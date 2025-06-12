# Tapsilat TypeScript SDK

<div align="center">

[![Tapsilat Logo](https://tapsilat.dev/assets/logo.png)](https://tapsilat.dev)

**Enterprise-grade TypeScript SDK for Tapsilat Payment Processing Platform**


</div>

## 🏢 About Tapsilat

**Tapsilat** is Turkey's leading fintech platform providing comprehensive payment processing solutions for businesses of all sizes. Our cutting-edge technology enables secure, fast, and reliable payment transactions with support for multiple payment methods, currencies, and advanced fraud protection.

---

## 📋 Table of Contents

- [🏢 About Tapsilat](#-about-tapsilat)
- [🚀 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [📖 API Reference](#-api-reference)
  - [Order Management](#order-management)
  - [Payment Processing](#payment-processing)
  - [Transaction Tracking](#transaction-tracking)
  - [Refund Operations](#refund-operations)
  - [Webhook Handling](#webhook-handling)
  - [Health Monitoring](#health-monitoring)
- [🔐 Authentication](#-authentication)
- [🛡️ Security](#️-security)
- [🧪 Testing](#-testing)
- [🌐 Environment Support](#-environment-support)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 🚀 Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (or yarn/pnpm equivalent)
- **TypeScript**: v4.5.0 or higher (for TypeScript projects)

### Install via npm
```bash
npm install tapsilat-js
```

### Install via yarn
```bash
yarn add tapsilat-js
```

### Install via pnpm
```bash
pnpm add tapsilat-js
```

### For TypeScript Projects
```bash
npm install tapsilat-js @types/node
```

---

## ⚡ Quick Start

### 1. Initialize the SDK

```typescript
import { TapsilatSDK } from 'tapsilat-js';

const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_BEARER_TOKEN!,
  baseURL: 'https://acquiring.tapsilat.dev/api/v1',
  timeout: 30000,
  maxRetries: 3
});
```

### 2. Create Your First Order

```typescript
async function createOrder() {
  try {
    const order = await tapsilat.createOrder({
      amount: 150.75,
      currency: 'TRY',
      locale: 'tr',
      buyer: {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        phone: '+905551234567'
      },
      description: 'Premium subscription - Monthly plan',
      metadata: {
        customerId: 'CUST_12345',
        planType: 'premium',
        billingCycle: 'monthly'
      }
    });

    console.log('Order created successfully:', {
      orderId: order.order_id,
      referenceId: order.reference_id,
      checkoutUrl: order.checkout_url
    });

    return order;
  } catch (error) {
    console.error('Order creation failed:', error.message);
    throw error;
  }
}
```

### 3. Check Order Status

```typescript
async function checkOrderStatus(referenceId: string) {
  try {
    const status = await tapsilat.getOrderStatus(referenceId);
    
    console.log('Order status:', {
      status: status.status,
      timestamp: new Date().toISOString()
    });

    return status;
  } catch (error) {
    console.error('Status check failed:', error.message);
    throw error;
  }
}
```

### 4. Handle Webhooks

```typescript
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/tapsilat', async (req, res) => {
  try {
    const signature = req.headers['x-tapsilat-signature'] as string;
    const payload = req.body.toString();
    
    const isValid = await tapsilat.verifyWebhook(
      payload,
      signature,
      process.env.TAPSILAT_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);
    
    // Process the webhook event
    switch (event.type) {
      case 'order.completed':
        await handleOrderCompleted(event.data);
        break;
      case 'order.failed':
        await handleOrderFailed(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## ⚙️ Configuration

### Basic Configuration

```typescript
interface TapsilatConfig {
  /** Your Tapsilat API Bearer token */
  bearerToken: string;
  
  /** API base URL (default: production URL) */
  baseURL?: string;
  
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Maximum retry attempts for failed requests (default: 3) */
  maxRetries?: number;
  
  /** Delay between retry attempts in milliseconds (default: 1000) */
  retryDelay?: number;
  
  /** API version for future compatibility */
  version?: string;
  
  /** Enable debug logging */
  debug?: boolean;
}
```

### Environment-Specific Configuration

#### Development Environment
```typescript
const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_DEV_TOKEN!,
  baseURL: 'https://acquiring.tapsilat.dev/api/v1',
  timeout: 60000, // Longer timeout for development
  debug: true     // Enable detailed logging
});
```

#### Production Environment
```typescript
const tapsilat = new TapsilatSDK({
  bearerToken: process.env.TAPSILAT_PROD_TOKEN!,
  baseURL: 'https://acquiring.tapsilat.com/api/v1',
  timeout: 30000,
  maxRetries: 5,
  debug: false
});
```

### Dynamic Configuration Updates

```typescript
// Update configuration at runtime
tapsilat.updateConfig({
  bearerToken: newToken,
  timeout: 45000
});

// Get current configuration (sensitive data is masked)
const config = tapsilat.getConfig();
console.log('Current config:', config);
```

---

## 📖 API Reference

### Order Management

The order management system provides comprehensive functionality for creating, tracking, and managing payment orders throughout their lifecycle.

#### Create Order

Create a new payment order with detailed buyer information and configuration options.

```typescript
async createOrder(orderRequest: OrderCreateRequest): Promise<OrderCreateResponse>
```

**Parameters:**

```typescript
interface OrderCreateRequest {
  amount: number;           // Payment amount (e.g., 150.75)
  currency: Currency;       // 'TRY' | 'USD' | 'EUR' | 'GBP'
  locale: Locale;          // 'tr' | 'en'
  buyer: Buyer;            // Buyer information
  description?: string;     // Order description
  callbackUrl?: string;     // Post-payment redirect URL
  conversationId?: string;  // Unique conversation identifier
  metadata?: Record<string, unknown>; // Custom metadata
}

interface Buyer {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  identityNumber?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}
```

**Example:**

```typescript
const order = await tapsilat.createOrder({
  amount: 299.99,
  currency: 'TRY',
  locale: 'tr',
  buyer: {
    name: 'Ahmet',
    surname: 'Yılmaz',
    email: 'ahmet.yilmaz@example.com',
    phone: '+905551234567',
    identityNumber: '12345678901'
  },
  description: 'E-commerce purchase - Electronics',
  callbackUrl: 'https://mystore.com/payment/success',
  conversationId: 'ORDER_20240612_001',
  metadata: {
    productId: 'PROD_12345',
    categoryId: 'ELECTRONICS',
    campaignCode: 'SUMMER2024'
  }
});
```

#### Get Order Details

Retrieve comprehensive information about a specific order.

```typescript
async getOrder(referenceId: string): Promise<Order>
```

**Example:**

```typescript
const order = await tapsilat.getOrder('5130a46d-88d0-44cb-9f58-d19a3f000af4');

console.log('Order details:', {
  id: order.id,
  referenceId: order.reference_id,
  amount: order.amount,
  currency: order.currency,
  status: order.status,
  checkoutUrl: order.checkout_url,
  createdAt: order.createdAt
});
```

#### Get Order by Conversation ID

Retrieve order information using the conversation ID.

```typescript
async getOrderByConversationId(conversationId: string): Promise<Order>
```

**Example:**

```typescript
const order = await tapsilat.getOrderByConversationId('ORDER_20240612_001');
```

#### List Orders

Retrieve a paginated list of orders with filtering options.

```typescript
async getOrders(params?: {
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Order>>
```

**Example:**

```typescript
const orders = await tapsilat.getOrders({
  page: 1,
  per_page: 25
});

console.log('Orders retrieved:', {
  totalOrders: orders.total,
  currentPage: orders.page,
  totalPages: orders.total_pages,
  ordersCount: orders.rows.length
});

// Process each order
orders.rows.forEach(order => {
  console.log(`Order ${order.reference_id}: ${order.amount} ${order.currency}`);
});
```

#### Get Order Status

Check the current status of an order.

```typescript
async getOrderStatus(referenceId: string): Promise<OrderStatusResponse>
```

**Example:**

```typescript
const status = await tapsilat.getOrderStatus('5130a46d-88d0-44cb-9f58-d19a3f000af4');

switch (status.status) {
  case 'pending':
    console.log('Order is waiting for payment');
    break;
  case 'completed':
    console.log('Order has been paid successfully');
    break;
  case 'failed':
    console.log('Order payment failed');
    break;
  case 'cancelled':
    console.log('Order was cancelled');
    break;
}
```

#### Cancel Order

Cancel a pending order.

```typescript
async cancelOrder(referenceId: string): Promise<Order>
```

**Example:**

```typescript
try {
  const cancelledOrder = await tapsilat.cancelOrder('5130a46d-88d0-44cb-9f58-d19a3f000af4');
  console.log('Order cancelled successfully');
} catch (error) {
  if (error.code === 'ORDER_NOT_CANCELLABLE') {
    console.log('Order cannot be cancelled (already processed)');
  } else {
    console.error('Cancellation failed:', error.message);
  }
}
```

#### Get Order Transactions

Retrieve transaction history for an order.

```typescript
async getOrderTransactions(referenceId: string): Promise<Transaction[]>
```

**Example:**

```typescript
const transactions = await tapsilat.getOrderTransactions('5130a46d-88d0-44cb-9f58-d19a3f000af4');

transactions.forEach(transaction => {
  console.log(`Transaction ${transaction.id}: ${transaction.type} - ${transaction.amount}`);
});
```

#### Get Checkout URL

Generate or retrieve the checkout URL for an order.

```typescript
async getCheckoutUrl(referenceId: string): Promise<string>
```

**Example:**

```typescript
const checkoutUrl = await tapsilat.getCheckoutUrl('5130a46d-88d0-44cb-9f58-d19a3f000af4');

// Redirect user to checkout
window.location.href = checkoutUrl;
```

### Payment Processing

Advanced payment processing capabilities for handling complex payment scenarios.

#### Get Order Payment Details

Retrieve detailed payment information for an order.

```typescript
async getOrderPaymentDetails(
  referenceId: string,
  conversationId?: string
): Promise<OrderPaymentDetail[]>
```

**Example:**

```typescript
// Get payment details by reference ID
const paymentDetails = await tapsilat.getOrderPaymentDetails('5130a46d-88d0-44cb-9f58-d19a3f000af4');

// Get payment details by conversation ID
const paymentDetailsByConversation = await tapsilat.getOrderPaymentDetails(
  '5130a46d-88d0-44cb-9f58-d19a3f000af4',
  'ORDER_20240612_001'
);

paymentDetails.forEach(detail => {
  console.log('Payment detail:', {
    id: detail.id,
    amount: detail.amount,
    currency: detail.currency,
    method: detail.paymentMethod,
    status: detail.status
  });
});
```

#### Get Order Submerchants

Retrieve submerchant information for marketplace scenarios.

```typescript
async getOrderSubmerchants(params?: {
  page?: number;
  per_page?: number;
}): Promise<any>
```

**Example:**

```typescript
const submerchants = await tapsilat.getOrderSubmerchants({
  page: 1,
  per_page: 10
});
```

### Refund Operations

Comprehensive refund processing with support for full and partial refunds.

#### Partial Refund

Process a partial refund for an order.

```typescript
async refundOrder(refundData: OrderRefundRequest): Promise<OrderRefundResponse>
```

**Example:**

```typescript
const refund = await tapsilat.refundOrder({
  reference_id: '5130a46d-88d0-44cb-9f58-d19a3f000af4',
  amount: 50.00,
  reason: 'Customer requested partial refund',
  metadata: {
    refundType: 'partial',
    requestedBy: 'customer_service',
    ticketId: 'TICKET_789'
  }
});

console.log('Refund processed:', {
  refundId: refund.id,
  amount: refund.amount,
  status: refund.status
});
```

#### Full Refund

Process a complete refund for an order.

```typescript
async refundAllOrder(referenceId: string): Promise<OrderRefundResponse>
```

**Example:**

```typescript
const fullRefund = await tapsilat.refundAllOrder('5130a46d-88d0-44cb-9f58-d19a3f000af4');

console.log('Full refund processed:', {
  refundId: fullRefund.id,
  originalAmount: fullRefund.originalAmount,
  refundedAmount: fullRefund.amount,
  status: fullRefund.status
});
```

### Webhook Handling

Secure webhook processing for real-time event notifications.

#### Verify Webhook Signature

Verify the authenticity of incoming webhook payloads.

```typescript
async verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean>
```

**Example:**

```typescript
// Express.js middleware for webhook verification
app.use('/webhooks/tapsilat', express.raw({ type: 'application/json' }));

app.post('/webhooks/tapsilat', async (req, res) => {
  const payload = req.body.toString();
  const signature = req.headers['x-tapsilat-signature'] as string;
  const webhookSecret = process.env.TAPSILAT_WEBHOOK_SECRET!;

  try {
    const isValid = await tapsilat.verifyWebhook(payload, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = JSON.parse(payload);
    await processWebhookEvent(event);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processWebhookEvent(event: any) {
  switch (event.type) {
    case 'order.created':
      console.log('New order created:', event.data.reference_id);
      break;
    case 'order.completed':
      console.log('Order completed:', event.data.reference_id);
      await fulfillOrder(event.data);
      break;
    case 'order.failed':
      console.log('Order failed:', event.data.reference_id);
      await handleFailedOrder(event.data);
      break;
    case 'refund.processed':
      console.log('Refund processed:', event.data.refund_id);
      await updateInventory(event.data);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
}
```

### Health Monitoring

Monitor API health and service availability.

#### Health Check

Check the health status of the Tapsilat API.

```typescript
async healthCheck(): Promise<{ status: string; timestamp: string }>
```

**Example:**

```typescript
async function monitorApiHealth() {
  try {
    const health = await tapsilat.healthCheck();
    
    console.log('API Health Check:', {
      status: health.status,
      timestamp: health.timestamp,
      isHealthy: health.status === 'healthy'
    });

    return health.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

// Periodic health monitoring
setInterval(async () => {
  const isHealthy = await monitorApiHealth();
  
  if (!isHealthy) {
    // Alert system administrators
    await notifyAdministrators('Tapsilat API health check failed');
  }
}, 60000); // Check every minute
```

---

## 🔐 Authentication

### Bearer Token Authentication

Tapsilat uses Bearer Token authentication for secure API access. Tokens are JWT-based and include organization and user context.

#### Obtaining API Tokens

1. **Login to Tapsilat Dashboard**: Access your merchant portal
2. **Navigate to API Settings**: Go to Settings → API Keys
3. **Generate New Token**: Create a new Bearer token for your application
4. **Configure Permissions**: Set appropriate permissions for your use case
5. **Secure Storage**: Store the token securely using environment variables

#### Token Management

```typescript
// Environment variable configuration
const config = {
  bearerToken: process.env.TAPSILAT_BEARER_TOKEN!,
  // ... other config
};

// Validate token format
if (!config.bearerToken.startsWith('eyJ')) {
  throw new Error('Invalid Bearer token format');
}

// Initialize SDK
const tapsilat = new TapsilatSDK(config);
```

#### Token Rotation

```typescript
// Update token at runtime
tapsilat.updateConfig({
  bearerToken: newBearerToken
});

// Verify new token works
try {
  await tapsilat.healthCheck();
  console.log('Token updated successfully');
} catch (error) {
  console.error('Token update failed:', error.message);
  // Rollback to previous token
}
```

---

```

## 🧪 Testing

### Unit Tests

Run the comprehensive unit test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test -- TapsilatSDK.test.ts
```

### Integration Tests

Test against the actual Tapsilat API:

```bash
# Set up environment variables
export TAPSILAT_TEST_BEARER_TOKEN="your-test-token"
export TAPSILAT_TEST_BASE_URL="https://acquiring.tapsilat.dev/api/v1"

# Run integration tests
npm run test:integration
```

### Test Environment Setup

```typescript
// test-setup.ts
import { TapsilatSDK } from '../src/TapsilatSDK';

export function createTestSDK() {
  return new TapsilatSDK({
    bearerToken: process.env.TAPSILAT_TEST_BEARER_TOKEN!,
    baseURL: process.env.TAPSILAT_TEST_BASE_URL!,
    timeout: 30000,
    debug: true
  });
}

export const mockOrderData = {
  amount: 150.75,
  currency: 'TRY' as const,
  locale: 'tr' as const,
  buyer: {
    name: 'Test',
    surname: 'User',
    email: 'test@example.com'
  }
};
```

---

## 🌐 Environment Support

### Node.js Environments

- **Node.js**: v18.0.0+ (LTS recommended)
- **npm**: v8.0.0+
- **TypeScript**: v4.5.0+ (for TypeScript projects)

### Framework Compatibility

#### Express.js
```typescript
import express from 'express';
import { TapsilatSDK } from 'tapsilat-js';

const app = express();
const tapsilat = new TapsilatSDK({ /* config */ });

app.post('/create-order', async (req, res) => {
  try {
    const order = await tapsilat.createOrder(req.body);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```
---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our development process and how to submit pull requests.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/tapsilat/tapsilat-js.git
cd tapsilat-js

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Additional Resources

### Official Links
- 🌐 **Website**: [https://tapsilat.dev](https://tapsilat.dev)
- 📚 **API Documentation**: [https://docs.tapsilat.dev](https://docs.tapsilat.dev)
- 🎯 **Developer Portal**: [https://developer.tapsilat.dev](https://developer.tapsilat.dev)
- 📞 **Support**: [support@tapsilat.dev](mailto:support@tapsilat.dev)

### Community
- 🐛 **Issue Tracker**: [GitHub Issues](https://github.com/tapsilat/tapsilat-js/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/tapsilat/tapsilat-js/discussions)
- 📢 **Changelog**: [CHANGELOG.md](CHANGELOG.md)

### Related SDKs
- 🐍 **Python SDK**: [tapsilat-py](https://github.com/tapsilat/tapsilat-py)

---

<div align="center">

[![Tapsilat](https://img.shields.io/badge/Tapsilat-Payment%20Solutions-blue?style=for-the-badge)](https://tapsilat.dev)

</div> 