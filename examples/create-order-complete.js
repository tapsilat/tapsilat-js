/**
 * Complete Order Creation Example
 * 
 * This example demonstrates how to create a comprehensive order with all available fields
 * including basket items, billing/shipping addresses, payment options, and buyer information.
 */

import { TapsilatSDK } from '@tapsilat/tapsilat-js';

// Initialize the SDK with your bearer token
const tapsilat = new TapsilatSDK({
  bearerToken: 'your-bearer-token-here',
  baseURL: 'https://panel.tapsilat.dev/api/v1',
  debug: true,
});

/**
 * Create a complete order with all fields
 */
async function createCompleteOrder() {
  try {
    const orderRequest = {
      // Required: Order amount
      amount: 1,
      
      // Optional: Tax amount
      tax_amount: 0,
      
      // Required: Locale (tr or en)
      locale: 'tr',
      
      // Optional: Force 3D Secure authentication
      three_d_force: true,
      
      // Required: Currency
      currency: 'TRY',
      
      // Optional: Shipping address
      shipping_address: {
        address: "Any Street, Any Building",
        city: "İSTANBUL",
        contact_name: "Adem Yılmaz",
        country: "tr",
        zip_code: "909090"
      },
      
      // Required: Basket items
      basket_items: [
        {
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
        }
      ],
      
      // Required: Billing address
      billing_address: {
        address: "Any Street, Any Building",
        city: "İSTANBUL",
        contact_name: "Adem Yılmaz",
        country: "tr",
        zip_code: "909090",
        billing_type: "PERSONAL",
        contact_phone: "+90000000000",
        district: "Tuzla",
        vat_number: "22174921738"
      },
      
      // Required: Buyer information
      buyer: {
        city: "İSTANBUL",
        country: "tr",
        email: "foo@example.com",
        gsm_number: "+90000000000",
        id: "sku_id_123456789",
        identity_number: "22174921738",
        registration_address: "Any Street, Any Building",
        name: "Adem",
        surname: "Yılmaz",
        zip_code: "909090"
      },
      
      // Optional: Conversation ID for tracking
      conversation_id: "conver_id_12345-1234-123-123",
      
      // Optional: Partial payment support
      partial_payment: false,
      
      // Optional: Payment methods toggle
      payment_methods: true,
      
      // Optional: Available payment options
      payment_options: [
        "PAY_WITH_WALLET",
        "PAY_WITH_CARD",
        "PAY_WITH_LOAN",
        "PAY_WITH_CASH"
      ],
      
      // Optional: Payment success/failure URLs
      payment_success_url: "https://your-site.com/payment/success",
      payment_failure_url: "https://your-site.com/payment/failure",
      
      // Optional: Enabled installments
      enabled_installments: [1, 2, 3, 6, 9, 12],
      
      // Optional: Custom metadata
      metadata: {
        order_type: "digital",
        customer_segment: "premium",
        campaign_id: "SUMMER2025"
      }
    };

    // Create the order
    console.log('Creating order...');
    const response = await tapsilat.createOrder(orderRequest);
    
    console.log('Order created successfully!');
    console.log('Order ID:', response.order_id);
    console.log('Reference ID:', response.reference_id);
    
    if (response.checkout_url) {
      console.log('Checkout URL:', response.checkout_url);
    }
    
    if (response.conversation_id) {
      console.log('Conversation ID:', response.conversation_id);
    }
    
    return response;
    
  } catch (error) {
    console.error('Error creating order:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.details) {
      console.error('Error details:', error.details);
    }
    
    throw error;
  }
}

/**
 * Create a minimal order with only required fields
 */
async function createMinimalOrder() {
  try {
    const orderRequest = {
      amount: 100,
      locale: 'tr',
      currency: 'TRY',
      
      basket_items: [
        {
          id: "item_001",
          name: "Basic Product",
          category1: "General",
          item_type: "Physical",
          price: 100,
          quantity: 1
        }
      ],
      
      billing_address: {
        address: "Sample Address 123",
        city: "İSTANBUL",
        contact_name: "John Doe",
        country: "tr",
        zip_code: "34000",
        billing_type: "PERSONAL"
      },
      
      buyer: {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        city: "İSTANBUL",
        country: "tr"
      }
    };

    console.log('Creating minimal order...');
    const response = await tapsilat.createOrder(orderRequest);
    
    console.log('Minimal order created!');
    console.log('Order ID:', response.order_id);
    console.log('Reference ID:', response.reference_id);
    
    return response;
    
  } catch (error) {
    console.error('Error creating minimal order:', error.message);
    throw error;
  }
}

/**
 * Create an order with multiple basket items
 */
async function createOrderWithMultipleItems() {
  try {
    const orderRequest = {
      amount: 350,
      locale: 'tr',
      currency: 'TRY',
      three_d_force: true,
      
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
        address: "Business District, Building 5",
        city: "İSTANBUL",
        contact_name: "Jane Smith",
        country: "tr",
        zip_code: "34100",
        billing_type: "CORPORATE",
        vat_number: "1234567890",
        tax_office: "İstanbul Tax Office"
      },
      
      buyer: {
        name: "Jane",
        surname: "Smith",
        email: "jane.smith@company.com",
        gsm_number: "+90000000000",
        city: "İSTANBUL",
        country: "tr"
      },
      
      payment_options: ["PAY_WITH_CARD", "PAY_WITH_BANK"],
      enabled_installments: [1, 3, 6]
    };

    console.log('Creating order with multiple items...');
    const response = await tapsilat.createOrder(orderRequest);
    
    console.log('Multi-item order created!');
    console.log('Order ID:', response.order_id);
    console.log('Reference ID:', response.reference_id);
    
    return response;
    
  } catch (error) {
    console.error('Error creating multi-item order:', error.message);
    throw error;
  }
}

// Run examples
async function runExamples() {
  console.log('=== Tapsilat Order Creation Examples ===\n');
  
  try {
    // Example 1: Complete order
    console.log('Example 1: Complete Order');
    console.log('------------------------');
    await createCompleteOrder();
    console.log('\n');
    
    // Example 2: Minimal order
    console.log('Example 2: Minimal Order');
    console.log('------------------------');
    await createMinimalOrder();
    console.log('\n');
    
    // Example 3: Multiple items
    console.log('Example 3: Multiple Items Order');
    console.log('-------------------------------');
    await createOrderWithMultipleItems();
    console.log('\n');
    
    console.log('All examples completed successfully!');
    
  } catch (error) {
    console.error('Examples failed:', error);
    process.exit(1);
  }
}

// Uncomment to run examples
// runExamples();

// Export for use in other modules
export {
  createCompleteOrder,
  createMinimalOrder,
  createOrderWithMultipleItems,
};
