# Tapsilat JS SDK

Modern, type-safe, and secure TypeScript SDK for integrating with the [Tapsilat](https://tapsilat.com) payment API.  
Easily create payments, manage orders, handle refunds, and verify webhooks in your Node.js or browser-based applications.

[![npm version](https://img.shields.io/npm/v/tapsilat-js.svg)](https://www.npmjs.com/package/tapsilat-js)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://github.com/tapsilat/tapsilat-js/actions/workflows/ci.yml/badge.svg)](https://github.com/tapsilat/tapsilat-js/actions)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Payments](#payments)
  - [Orders](#orders)
  - [Refunds](#refunds)
  - [Customers](#customers)
  - [Webhooks](#webhooks)
  - [Health Check](#health-check)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **TypeScript-first:** Full type safety and autocompletion.
- **Bearer Token Authentication:** Secure, modern API access.
- **Comprehensive API Coverage:** Payments, orders, refunds, customers, and webhooks.
- **Advanced Error Handling:** Custom error classes for robust integrations.
- **Retry & Timeout:** Built-in retry logic and configurable timeouts.
- **Metadata Sanitization:** Sensitive data is automatically filtered.
- **Webhook Verification:** Securely validate incoming webhook events.
- **Pagination & Sorting:** Easy access to large datasets.

---

## Installation

```bash
npm install tapsilat-js
# or
yarn add tapsilat-js
```

> **Requires Node.js v18+**

---

## Quick Start

```js
const { TapsilatSDK } = require("tapsilat-js");

const tapsilat = new TapsilatSDK({
  bearerToken: "your-bearer-token-here",
  baseURL: "https://acquiring.tapsilat.dev/api/v1", // optional
  timeout: 30000, // optional, in ms
  maxRetries: 3,  // optional
});

async function main() {
  // Create a payment
  const payment = await tapsilat.createPayment({
    amount: 150.75,
    currency: "TRY",
    paymentMethod: "credit_card",
    description: "Example payment",
    metadata: { orderId: "ORDER-123" },
    returnUrl: "https://your-site.com/payment/success",
    webhookUrl: "https://your-site.com/webhooks/payment",
  });

  console.log("Payment created:", payment);

  // Get payment status
  const paymentStatus = await tapsilat.getPayment(payment.id);
  console.log("Payment status:", paymentStatus.status);
}

main().catch(console.error);
```

See [`examples/basic-usage.js`](examples/basic-usage.js) for a full workflow.

---

## Configuration

The SDK is configured via the `TapsilatConfig` object:

| Option         | Type      | Required | Description                                      |
| -------------- | --------- | -------- | ------------------------------------------------ |
| bearerToken    | string    | Yes      | Your Tapsilat API Bearer token                   |
| baseURL        | string    | No       | API base URL (default: `https://api.tapsilat.com/v1`) |
| timeout        | number    | No       | Request timeout in milliseconds (default: 30000) |
| maxRetries     | number    | No       | Max retry attempts for failed requests (default: 3) |
| retryDelay     | number    | No       | Delay between retries in ms (default: 1000)      |
| version        | string    | No       | API version (for future compatibility)           |
| debug          | boolean   | No       | Enable debug logging                             |

---

## API Reference

### Payments

- **Create Payment**
  ```js
  const payment = await tapsilat.createPayment({
    amount: 100.50,
    currency: "TRY",
    paymentMethod: "credit_card",
    description: "Order #123",
    returnUrl: "https://your-site.com/success",
    webhookUrl: "https://your-site.com/webhook",
    metadata: { orderId: "123" }
  });
  ```

- **Get Payment**
  ```js
  const payment = await tapsilat.getPayment("payment_id");
  ```

- **List Payments**
  ```js
  const payments = await tapsilat.getPayments({ page: 1, limit: 10 });
  ```

- **Cancel Payment**
  ```js
  await tapsilat.cancelPayment("payment_id");
  ```

### Orders

- **Create Order**
  ```js
  const order = await tapsilat.createOrder({
    amount: 200,
    currency: "TRY",
    locale: "tr",
    buyer: {
      name: "Jane",
      surname: "Doe",
      email: "jane@example.com"
    },
    description: "Order for Jane"
  });
  ```

- **Get Order**
  ```js
  const order = await tapsilat.getOrder("reference_id");
  ```

- **List Orders**
  ```js
  const orders = await tapsilat.getOrders({ page: 1, limit: 10 });
  ```

- **Cancel Order**
  ```js
  await tapsilat.cancelOrder("reference_id");
  ```

### Refunds

- **Create Refund**
  ```js
  const refund = await tapsilat.createRefund({
    paymentId: "payment_id",
    amount: 50.00, // Partial refund
    reason: "Customer request"
  });
  ```

- **Get Refund**
  ```js
  const refund = await tapsilat.getRefund("refund_id");
  ```

- **List Refunds**
  ```js
  const refunds = await tapsilat.getRefunds("payment_id", { page: 1, limit: 10 });
  ```

### Customers

- **Create Customer**
  ```js
  const customer = await tapsilat.createCustomer({
    email: "customer@example.com",
    name: "John Doe",
    phone: "+905551234567",
    address: {
      street: "Main St 123",
      city: "Istanbul",
      country: "TR",
      postalCode: "34000"
    }
  });
  ```

- **Get Customer**
  ```js
  const customer = await tapsilat.getCustomer("customer_id");
  ```

- **Update Customer**
  ```js
  const updated = await tapsilat.updateCustomer("customer_id", { name: "Jane Doe" });
  ```

- **Delete Customer**
  ```js
  await tapsilat.deleteCustomer("customer_id");
  ```

### Webhooks

- **Verify Webhook Signature**
  ```js
  const isValid = await tapsilat.verifyWebhook(
    JSON.stringify(req.body),
    req.headers["x-tapsilat-signature"],
    "your-webhook-secret"
  );
  ```

### Health Check

- **Check API Health**
  ```js
  const health = await tapsilat.healthCheck();
  console.log(health.status, health.timestamp);
  ```

---

## Error Handling

All SDK methods throw rich error objects for robust error handling:

- `TapsilatAuthenticationError` – Invalid or missing bearer token
- `TapsilatNetworkError` – Network or connectivity issues
- `TapsilatValidationError` – Invalid input or parameters
- `TapsilatRateLimitError` – Too many requests (HTTP 429)
- `TapsilatError` – Other API or SDK errors

**Example:**
```js
try {
  await tapsilat.createPayment({ ... });
} catch (error) {
  if (error.code === "AUTHENTICATION_ERROR") {
    // Handle invalid token
  } else if (error.code === "VALIDATION_ERROR") {
    // Handle bad input
  } else {
    // Handle other errors
  }
}
```

---

## Security Best Practices

- **Never commit your bearer token to source control.** Use environment variables.
- **All requests use HTTPS.** Never use the SDK over insecure connections.
- **Sensitive metadata (e.g., passwords, tokens) is automatically filtered.**
- **Webhook verification** uses HMAC SHA-256 signatures. Always verify webhooks before processing.
- **Token rotation:** If you rotate your token, use `updateConfig({ bearerToken: "new-token" })`.

---

## Testing

- **Unit tests:** Run with `npm test`
- **Integration tests:** Run with `npm run test:integration`
- **Coverage:** Run with `npm run test:coverage`

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[MIT](LICENSE) © 2024 Tapsilat

---

**Links:**
- [Tapsilat API Docs](https://tapsilat.com/docs)
- [GitHub Issues](https://github.com/tapsilat/tapsilat-js/issues) 