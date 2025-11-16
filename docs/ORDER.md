# Order Creation API - Complete Guide

This document provides a comprehensive guide for creating orders using the Tapsilat SDK.

## Table of Contents

- [Quick Start](#quick-start)
- [Complete API Reference](#complete-api-reference)
- [Field Descriptions](#field-descriptions)
- [Examples](#examples)
- [Validation Rules](#validation-rules)

## Quick Start

```typescript
import { TapsilatSDK } from '@tapsilat/tapsilat-js';

const tapsilat = new TapsilatSDK({
  bearerToken: 'your-bearer-token',
  baseURL: 'https://panel.tapsilat.dev/api/v1'
});

const order = await tapsilat.createOrder({
  amount: 100,
  locale: 'tr',
  currency: 'TRY',
  basket_items: [{
    id: "item_001",
    name: "Product Name",
    category1: "Category",
    item_type: "Physical",
    price: 100,
    quantity: 1
  }],
  billing_address: {
    address: "Street Address",
    city: "İSTANBUL",
    contact_name: "John Doe",
    country: "tr",
    zip_code: "34000",
    billing_type: "PERSONAL"
  },
  buyer: {
    name: "John",
    surname: "Doe",
    email: "john@example.com",
    city: "İSTANBUL",
    country: "tr"
  }
});

console.log('Order ID:', order.order_id);
console.log('Reference ID:', order.reference_id);
```

## Complete API Reference

### OrderCreateRequest

The main interface for creating an order.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `number` | Total order amount (positive, max 2 decimal places) |
| `locale` | `'tr' \| 'en'` | Display language for the payment page |
| `currency` | `Currency` | Currency code: `'TRY'`, `'USD'`, `'EUR'`, or `'GBP'` |
| `basket_items` | `BasketItem[]` | Array of items in the order (at least 1 item required) |
| `billing_address` | `BillingAddress` | Billing address with tax information |
| `buyer` | `Buyer` | Customer information |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `tax_amount` | `number` | Tax amount included in the total |
| `three_d_force` | `boolean` | Force 3D Secure authentication |
| `shipping_address` | `Address` | Shipping address for delivery |
| `conversation_id` | `string` | Custom tracking ID for your system |
| `partial_payment` | `boolean` | Enable partial payment functionality |
| `payment_methods` | `boolean` | Enable payment method selection |
| `payment_options` | `PaymentOption[]` | Available payment options for customer |
| `payment_success_url` | `string` | Redirect URL after successful payment |
| `payment_failure_url` | `string` | Redirect URL after failed payment |
| `enabled_installments` | `number[]` | Allowed installment counts (e.g., [1, 3, 6, 12]) |
| `metadata` | `Record<string, unknown>` | Custom metadata for the order |

### Buyer

Customer information required for the order.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Customer's first name |
| `surname` | `string` | Customer's last name |
| `email` | `string` | Customer's email address (validated) |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Customer ID in your system |
| `gsm_number` | `string` | Phone number (format: +90XXXXXXXXXX) |
| `identity_number` | `string` | National ID or tax number |
| `registration_address` | `string` | Customer's registration address |
| `city` | `string` | City name |
| `country` | `string` | Country code (e.g., 'tr') |
| `zip_code` | `string` | Postal code |
| `ip` | `string` | IP address |
| `registration_date` | `string` | Registration date (ISO 8601) |
| `last_login_date` | `string` | Last login date (ISO 8601) |

### BillingAddress

Billing address with tax information.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | `string` | Full street address |
| `city` | `string` | City name |
| `contact_name` | `string` | Contact person name |
| `country` | `string` | Country code |
| `zip_code` | `string` | Postal code |
| `billing_type` | `'PERSONAL' \| 'CORPORATE'` | Type of billing |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `district` | `string` | District or neighborhood |
| `contact_phone` | `string` | Contact phone number |
| `vat_number` | `string` | VAT/Tax identification number |
| `tax_office` | `string` | Tax office name (for corporate) |
| `title` | `string` | Company title (for corporate) |

### Address

Shipping address structure.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | `string` | Yes | Full street address |
| `city` | `string` | Yes | City name |
| `contact_name` | `string` | Yes | Contact person name |
| `country` | `string` | Yes | Country code |
| `zip_code` | `string` | Yes | Postal code |
| `district` | `string` | No | District or neighborhood |
| `contact_phone` | `string` | No | Contact phone number |

### BasketItem

Individual item in the order basket.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique item identifier |
| `name` | `string` | Item name |
| `category1` | `string` | Primary category |
| `item_type` | `string` | Type of item (e.g., 'Physical', 'Digital') |
| `price` | `number` | Unit price |
| `quantity` | `number` | Quantity ordered |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `category2` | `string` | Secondary category |
| `coupon_discount` | `number` | Discount amount from coupon |
| `data` | `string` | Additional item data |
| `quantity_unit` | `string` | Unit of measurement (e.g., 'PCE', 'KG') |

### PaymentOption

Available payment methods for the order.

```typescript
type PaymentOption = 
  | 'PAY_WITH_WALLET'   // Digital wallet payment
  | 'PAY_WITH_CARD'     // Credit/debit card
  | 'PAY_WITH_LOAN'     // Loan/financing
  | 'PAY_WITH_CASH'     // Cash payment
  | 'PAY_WITH_BANK';    // Bank transfer
```

### OrderCreateResponse

The response returned after creating an order.

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | `string` | Internal order identifier |
| `reference_id` | `string` | Unique order reference for tracking |
| `checkout_url` | `string` (optional) | Payment page URL for customer |
| `conversation_id` | `string` (optional) | Echo of provided conversation ID |
| `status` | `string` (optional) | Initial order status |
| `qr_code_url` | `string` (optional) | QR code URL for mobile payments |

## Examples

### Minimal Order

The simplest order with only required fields:

```typescript
const order = await tapsilat.createOrder({
  amount: 100,
  locale: 'tr',
  currency: 'TRY',
  basket_items: [{
    id: "item_001",
    name: "Product",
    category1: "General",
    item_type: "Physical",
    price: 100,
    quantity: 1
  }],
  billing_address: {
    address: "Address 123",
    city: "İSTANBUL",
    contact_name: "John Doe",
    country: "tr",
    zip_code: "34000",
    billing_type: "PERSONAL"
  },
  buyer: {
    name: "John",
    surname: "Doe",
    email: "john@example.com",
    city: "İSTANBUL",
    country: "tr"
  }
});
```

### Complete Order with All Fields

```typescript
const order = await tapsilat.createOrder({
  amount: 1,
  tax_amount: 0,
  locale: 'tr',
  three_d_force: true,
  currency: 'TRY',
  
  shipping_address: {
    address: "Kazım Karabekir Cad. No:69/B",
    city: "İSTANBUL",
    contact_name: "Adem Yılmaz",
    country: "tr",
    zip_code: "909090"
  },
  
  basket_items: [{
    category1: "Digital Product or Service",
    category2: "Digital Product or Service",
    name: "TEST",
    id: "sku_12345789",
    price: 1,
    coupon_discount: 0,
    quantity: 1,
    item_type: "digital_product",
    data: "CUSTOMER",
    quantity_unit: "PCE"
  }],
  
  billing_address: {
    address: "Kazım Karabekir Cad. No:69/B",
    city: "İSTANBUL",
    contact_name: "Adem Yılmaz",
    country: "tr",
    zip_code: "909090",
    billing_type: "PERSONAL",
    contact_phone: "+90000000000",
    district: "Tuzla",
    vat_number: "22174921738"
  },
  
  buyer: {
    city: "İSTANBUL",
    country: "tr",
    email: "foo@example.com",
    gsm_number: "+90000000000",
    id: "sku_id_123456789",
    identity_number: "22174921738",
    registration_address: "Kazım Karabekir Cad. No:69/B",
    name: "Adem",
    surname: "Yılmaz",
    zip_code: "909090"
  },
  
  conversation_id: "payses_01JVYBHQPEFDMAPWG6CAT207RG",
  partial_payment: false,
  payment_methods: true,
  payment_options: [
    "PAY_WITH_WALLET",
    "PAY_WITH_CARD",
    "PAY_WITH_LOAN",
    "PAY_WITH_CASH"
  ],
  
  payment_success_url: "https://your-site.com/success",
  payment_failure_url: "https://your-site.com/failure",
  
  enabled_installments: [1, 2, 3, 6, 9, 12],
  
  metadata: {
    order_type: "digital",
    campaign_id: "SUMMER2025"
  }
});
```

### Corporate Order

Order with corporate billing:

```typescript
const order = await tapsilat.createOrder({
  amount: 500,
  locale: 'tr',
  currency: 'TRY',
  three_d_force: true,
  
  basket_items: [{
    id: "item_business_001",
    name: "Business Service",
    category1: "Services",
    item_type: "Service",
    price: 500,
    quantity: 1,
    quantity_unit: "PCE"
  }],
  
  billing_address: {
    address: "Business Plaza, Floor 5",
    city: "İSTANBUL",
    contact_name: "Ali Veli",
    country: "tr",
    zip_code: "34100",
    billing_type: "CORPORATE",
    vat_number: "1234567890",
    tax_office: "İstanbul Kurumlar VD",
    title: "Example Corp. Ltd."
  },
  
  buyer: {
    name: "Ali",
    surname: "Veli",
    email: "ali.veli@company.com",
    gsm_number: "+90000000000",
    city: "İSTANBUL",
    country: "tr"
  },
  
  payment_options: ["PAY_WITH_BANK", "PAY_WITH_CARD"]
});
```

### Multiple Items Order

```typescript
const order = await tapsilat.createOrder({
  amount: 350,
  locale: 'tr',
  currency: 'TRY',
  
  basket_items: [
    {
      id: "item_001",
      name: "Product A",
      category1: "Electronics",
      category2: "Phones",
      item_type: "Physical",
      price: 150,
      quantity: 1,
      quantity_unit: "PCE"
    },
    {
      id: "item_002",
      name: "Product B",
      category1: "Electronics",
      category2: "Accessories",
      item_type: "Physical",
      price: 100,
      quantity: 2,
      quantity_unit: "PCE"
    }
  ],
  
  billing_address: {
    address: "Street Address",
    city: "İSTANBUL",
    contact_name: "Customer Name",
    country: "tr",
    zip_code: "34000",
    billing_type: "PERSONAL"
  },
  
  buyer: {
    name: "Customer",
    surname: "Name",
    email: "customer@example.com",
    city: "İSTANBUL",
    country: "tr"
  },
  
  enabled_installments: [1, 3, 6]
});
```

## Validation Rules

### Amount

- Must be a positive number
- Maximum 2 decimal places
- Cannot be zero or negative

```typescript
// ✅ Valid
amount: 100
amount: 99.99
amount: 0.01

// ❌ Invalid
amount: -10      // Negative
amount: 0        // Zero
amount: 99.999   // More than 2 decimals
```

### Email

- Must be a valid email format
- Required field for buyer

```typescript
// ✅ Valid
email: "user@example.com"
email: "test.user+label@domain.co"

// ❌ Invalid
email: "invalid"
email: "@example.com"
email: "user@"
```

### Basket Items

- Must be a non-empty array
- At least one item required
- Each item must have all required fields

```typescript
// ✅ Valid
basket_items: [{
  id: "item_1",
  name: "Product",
  category1: "Cat",
  item_type: "Physical",
  price: 100,
  quantity: 1
}]

// ❌ Invalid
basket_items: []                    // Empty array
basket_items: [{ id: "item_1" }]    // Missing required fields
```

### Currency

Must be one of the supported currencies:

- `'TRY'` - Turkish Lira
- `'USD'` - US Dollar
- `'EUR'` - Euro
- `'GBP'` - British Pound

### Locale

Must be one of:

- `'tr'` - Turkish
- `'en'` - English

### Payment Options

Valid payment options:

- `'PAY_WITH_WALLET'` - Digital wallet
- `'PAY_WITH_CARD'` - Credit/debit card
- `'PAY_WITH_LOAN'` - Loan payment
- `'PAY_WITH_CASH'` - Cash payment
- `'PAY_WITH_BANK'` - Bank transfer

## Error Handling

The SDK throws specific error types for different scenarios:

```typescript
import { 
  TapsilatValidationError, 
  TapsilatNetworkError, 
  TapsilatError 
} from '@tapsilat/tapsilat-js';

try {
  const order = await tapsilat.createOrder(orderRequest);
  console.log('Success:', order);
  
} catch (error) {
  if (error instanceof TapsilatValidationError) {
    // Validation error - fix the request data
    console.error('Validation error:', error.message);
    console.error('Details:', error.details);
    
  } else if (error instanceof TapsilatNetworkError) {
    // Network error - retry or check connection
    console.error('Network error:', error.message);
    
  } else if (error instanceof TapsilatError) {
    // API error - check error code and message
    console.error('API error:', error.message);
    console.error('Code:', error.code);
    
  } else {
    // Unknown error
    console.error('Unexpected error:', error);
  }
}
```

## Response Handling

After successfully creating an order:

```typescript
const response = await tapsilat.createOrder(orderRequest);

// Required fields always present
console.log('Order ID:', response.order_id);
console.log('Reference ID:', response.reference_id);

// Optional fields - check before use
if (response.checkout_url) {
  // Redirect customer to payment page
  window.location.href = response.checkout_url;
}

if (response.conversation_id) {
  // Store conversation ID for tracking
  localStorage.setItem('conversationId', response.conversation_id);
}

if (response.qr_code_url) {
  // Display QR code for mobile payment
  document.getElementById('qr-code').src = response.qr_code_url;
}
```

## Best Practices

1. **Always validate data before sending**
   - Check required fields
   - Validate email format
   - Ensure amounts are positive

2. **Use conversation_id for tracking**
   - Generate unique IDs for each order
   - Store them in your database
   - Use for order correlation

3. **Handle errors appropriately**
   - Catch specific error types
   - Log errors for debugging
   - Show user-friendly messages

4. **Provide callback URLs**
   - Set payment_success_url
   - Set payment_failure_url
   - Handle redirects properly

5. **Use metadata for custom data**
   - Store order-specific information
   - Use for analytics and reporting
   - Keep data serializable

6. **Test with different scenarios**
   - Test minimal orders
   - Test complete orders
   - Test validation errors
   - Test network failures

## Support

For questions or issues:
- Check the [main README](../README.md)
- Review [examples](../examples/)
- Contact support at support@tapsilat.com
