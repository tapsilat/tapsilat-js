import { TapsilatSDK } from "../dist/index.esm.js";

/**
 * Comprehensive Example of Tapsilat Payment SDK Integration
 * 
 * This example demonstrates the core functionality of the Tapsilat SDK:
 * 1. Creating payment orders with detailed customer information
 * 2. Retrieving and monitoring order status updates
 * 3. Fetching complete order details including buyer information
 * 4. Listing orders with pagination support
 * 5. Cancelling pending orders when needed
 * 
 * The Tapsilat SDK provides a robust interface for managing the entire
 * payment lifecycle with built-in validation, error handling, and
 * standardized response formats.
 */

async function main() {
  try {
    // Initialize the SDK with your organization's credentials
    // The SDK handles authentication, request formatting, and error handling
    const tapsilat = new TapsilatSDK({
      bearerToken: "YOUR_BEARER_TOKEN", // Replace with your actual bearer token
      baseURL: "https://api.tapsilat.com/v1", // API base URL
      timeout: 30000, // Request timeout in milliseconds
      retryAttempts: 3, // Number of automatic retry attempts for failed requests
    });

    console.log("Tapsilat SDK initialized");

    // STEP 1: Creating a new payment order
    // -----------------------------------------
    // This creates a new order in the payment system and returns
    // a checkout URL where customers can complete their payment
    const orderRequest = {
      amount: 150.75, // Payment amount with up to 2 decimal places
      currency: "TRY", // Supported currencies: TRY, USD, EUR, GBP
      locale: "tr",    // Interface language: tr (Turkish) or en (English)
      
      // Customer information (required for compliance and notifications)
      buyer: {
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        phone: "+9099999999", // Optional
        identityNumber: "11111111111", // Optional - national ID or tax number
      },
      
      // Optional order parameters
      description: "Premium Subscription - Annual Plan",
      callbackUrl: "https://your-website.com/payment-complete", // Redirect after payment
      conversationId: "order-" + Date.now(), // Your custom reference ID
      
      // Optional metadata (key-value pairs for your reference)
      metadata: [
        { key: "productId", value: "PREMIUM-12M" },
        { key: "customerType", value: "new" },
        { key: "campaign", value: "summer2025" }
      ]
    };

    // Create the order and store the reference for tracking
    const order = await tapsilat.createOrder(orderRequest);
    
    // Extract key information from the response
    // The API uses snake_case format for field names
    const referenceId = order.reference_id;
    const checkoutUrl = order.checkout_url;
    
    console.log(`Order created successfully with reference ID: ${referenceId}`);
    console.log(`Checkout URL to send to customer: ${checkoutUrl}`);

    // STEP 2: Checking order payment status
    // -----------------------------------------
    // Use this to monitor whether the payment has been completed
    // This is typically called after customer returns from checkout
    // or via a webhook notification
    const orderStatus = await tapsilat.getOrderStatus(referenceId);
    console.log(`Current payment status: ${orderStatus.status}`);

    // STEP 3: Retrieving complete order details
    // -----------------------------------------
    // This provides the full order information including:
    // - Payment details (amount, currency, timestamps)
    // - Customer information
    // - Current status and payment history
    const orderDetails = await tapsilat.getOrder(referenceId);
    console.log(`Order amount: ${orderDetails.amount} ${orderDetails.currency}`);
    console.log(`Status: ${orderDetails.status_enum}`);
    
    // STEP 4: Listing recent orders with pagination
    // -----------------------------------------
    // Retrieve a paginated list of orders for reporting or dashboard display
    const ordersList = await tapsilat.getOrders({
      page: 1,        // Page number (starting from 1)
      per_page: 5     // Number of items per page
    });
    
    // Process the paginated response
    const orders = ordersList.rows || [];
    const totalOrders = ordersList.total;
    const totalPages = ordersList.total_pages;
    
    console.log(`Displaying ${orders.length} of ${totalOrders} total orders (Page 1 of ${totalPages})`);
    
    // STEP 5: Cancelling an order (if still pending)
    // -----------------------------------------
    // Cancel an order that hasn't been paid yet
    // This prevents the order from being processed further
    try {
      const cancelledOrder = await tapsilat.cancelOrder(referenceId);
      console.log(`Order cancelled successfully. New status: ${cancelledOrder.status}`);
    } catch (error) {
      // Orders can only be cancelled in certain states (typically CREATED or PENDING_PAYMENT)
      console.log(`Could not cancel order: ${error.message}`);
    }

  } catch (error) {
    // The SDK provides detailed error information
    console.error(`Error: ${error.message}`);
    
    // Error codes help identify specific issues
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
  }
}

// Execute the example
main().catch(console.error);
