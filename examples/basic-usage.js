import { TapsilatSDK } from "../dist/index.esm.js";

// Order creation is not available in this SDK version or for this API endpoint.
// Please refer to the API documentation or SDK updates for supported features.

async function main() {
  const tapsilat = new TapsilatSDK({
    bearerToken:
      "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJFbWFpbCI6InRhcmlrQGFwaS50YXBzaWxhdGRldiIsIklEIjoiNjI5NjJhMDMtM2RhYy00YzlhLWIzN2UtZWYxYWMwMGMyM2I5IiwiT3JnYW5pemF0aW9uSUQiOiIxZjk0NWZmNy1kMGQ5LTQzZTctYjk2Mi1kYjhiYzMzNWJhYWIiLCJPcmdhbml6YXRpb24iOiJUYXBzaWxhdERFViIsIklzT3JnYW5pemF0aW9uVXNlciI6dHJ1ZSwiSXBBZGRyZXNzIjoiIiwiQWdlbnQiOiIiLCJPcmdUaW1lemVvbmUiOiJUdXJrZXkiLCJJc0FwaVVzZXIiOnRydWUsImlzcyI6InRhcHNpbGF0IiwiZXhwIjoyNjExMDM0NzAyfQ.71tFaa_ABkAxv8xN_0GgJZwe2gM3DhUHz16FAKQ9U2B6nY6tCBJuyAzOpxmQg1DLtv_v6nCV5qRJOlcCSm6Jhg",
    baseURL: "https://acquiring.tapsilat.dev/api/v1",
    timeout: 30000,
    retryAttempts: 3,
  });

  // 1. Create an order (using the new model)
  const orderRequest = {
    amount: 150.75,
    currency: "TRY",
    locale: "tr",
    buyer: {
      name: "John",
      surname: "Doe",
      email: "john-doe@example.com",
    },
    // Add other fields as needed
  };

  const order = await tapsilat.createOrder(orderRequest);
  console.log("Order created! Checkout URL:", order.checkout_url);

  // 2. (Optional) Get order status
  const orderStatus = await tapsilat.getOrderStatus(order.reference_id);
  console.log("Order status:", orderStatus.status);
}

// Webhook doğrulama örneği
function verifyWebhookExample() {
  const tapsilat = new TapsilatSDK({
    bearerToken: "your-bearer-token-here",
  });

  // Webhook payload'ı ve signature'ı
  const payload = '{"id":"payment-123","status":"completed"}';
  const signature = "sha256=abc123..."; // Header'dan gelen signature
  const webhookSecret = "your-webhook-secret";

  const isValid = tapsilat.verifyWebhook(payload, signature, webhookSecret);
}

// Configuration management örneği
function configurationExample() {
  const tapsilat = new TapsilatSDK({
    bearerToken: "your-bearer-token-here",
    baseURL: "https://api.tapsilat.com/v1",
    timeout: 30000,
  });

  // ConfigManager'a erişim
  const configManager = tapsilat.getConfigManager();

  // Mevcut konfigürasyonu görüntüle (bearer token gizli)
  console.log("Current config:", configManager.getConfig());

  // Konfigürasyonu güncelle
  configManager.updateConfig({
    timeout: 60000,
    debug: true,
  });

  // Internal config erişimi (advanced)
  const baseUrl = configManager.getBaseUrl();
  console.log("Base URL:", baseUrl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
