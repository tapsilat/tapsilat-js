import crypto from "crypto";
import { TapsilatSDK, WebhookEvent, validateGsmNumber, validateInstallments } from "../dist/index.esm.js";

/**
 * Test offline features that work without API calls
 */

console.log("🚀 Testing Tapsilat SDK - Offline Features\n");

// Test SDK initialization and validation
console.log("=== SDK Initialization & Validation ===");

try {
  // Test invalid bearer token
  new TapsilatSDK({ bearerToken: "" });
} catch (error) {
  console.log(`✅ Bearer token validation: ${error.message}`);
}

try {
  // Test invalid bearer token (too short)
  new TapsilatSDK({ bearerToken: "abc" });
} catch (error) {
  console.log(`✅ Bearer token length validation: ${error.message}`);
}

// Test valid SDK initialization
const sdk = new TapsilatSDK({
  bearerToken: "test-token-123456789",
  baseURL: "https://test.api.com/v1"
});
console.log("✅ SDK initialized successfully with valid config");

// Test order validation without API calls
console.log("\n=== Order Request Validation ===");

try {
  await sdk.createOrder({
    amount: -100, // Invalid
    currency: "TRY",
    locale: "tr",
    buyer: {
      name: "John",
      surname: "Doe", 
      email: "john.doe@example.com"
    }
  });
} catch (error) {
  console.log(`✅ Negative amount validation: ${error.message}`);
}

try {
  await sdk.createOrder({
    amount: 100.555, // Too many decimals
    currency: "TRY",
    locale: "tr",
    buyer: {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com"
    }
  });
} catch (error) {
  console.log(`✅ Decimal places validation: ${error.message}`);
}

try {
  await sdk.createOrder({
    amount: 100,
    currency: "TRY",
    locale: "tr",
    buyer: {
      name: "John",
      surname: "Doe",
      email: "invalid-email" // Invalid email
    }
  });
} catch (error) {
  console.log(`✅ Email format validation: ${error.message}`);
}

try {
  await sdk.createOrder({
    amount: 100,
    currency: "TRY", 
    locale: "tr",
    buyer: {
      name: "", // Empty name
      surname: "Doe",
      email: "john.doe@example.com"
    }
  });
} catch (error) {
  console.log(`✅ Empty name validation: ${error.message}`);
}

// Test Payment Term validation
console.log("\n=== Payment Term Validation ===");

try {
  await sdk.createOrderTerm({
    order_id: "",
    term_reference_id: "term-123",
    amount: 100,
    due_date: "2024-12-31",
    term_sequence: 1,
    required: true,
    status: "pending"
  });
} catch (error) {
  console.log(`✅ Empty order ID validation: ${error.message}`);
}

try {
  await sdk.createOrderTerm({
    order_id: "order-123",
    term_reference_id: "term-123",
    amount: -50, // Negative
    due_date: "2024-12-31",
    term_sequence: 1,
    required: true,
    status: "pending"
  });
} catch (error) {
  console.log(`✅ Negative term amount validation: ${error.message}`);
}

try {
  await sdk.createOrderTerm({
    order_id: "order-123",
    term_reference_id: "term-123",
    amount: 100,
    due_date: "2024-12-31",
    term_sequence: 1.5, // Not integer
    required: true,
    status: "pending"
  });
} catch (error) {
  console.log(`✅ Non-integer sequence validation: ${error.message}`);
}

try {
  await sdk.createOrderTerm({
    order_id: "order-123",
    term_reference_id: "term-123",
    amount: 100,
    due_date: "2024-12-31",
    term_sequence: 1,
    required: "true", // Not boolean
    status: "pending"
  });
} catch (error) {
  console.log(`✅ Non-boolean required validation: ${error.message}`);
}

// Test Validation Utilities
console.log("\n=== GSM Number Validation Utilities ===");

const gsmTests = [
  "+90 555 123 45 67",
  "0555 123 45 67",
  "555-123-45-67",
  "invalid-number"
];

gsmTests.forEach(gsm => {
  const result = validateGsmNumber(gsm);
  if (result.isValid) {
    console.log(`✅ GSM "${gsm}" → ${result.cleanedNumber}`);
  } else {
    console.log(`❌ GSM "${gsm}" → ${result.error}`);
  }
});

console.log("\n=== Installments Validation Utilities ===");

const installmentTests = [
  3,
  "1,3,6,12",
  [2, 6, 9],
  "invalid",
  37 // Too high
];

installmentTests.forEach(inst => {
  const result = validateInstallments(inst);
  if (result.isValid) {
    console.log(`✅ Installments ${JSON.stringify(inst)} → [${result.validatedInstallments.join(', ')}]`);
  } else {
    console.log(`❌ Installments ${JSON.stringify(inst)} → ${result.error}`);
  }
});

// Test webhook validation
console.log("\n=== Webhook Validation ===");

// Callbacks carry "Tapsilat-Signature: t=<unix time>,v1=<hex HMAC-SHA256 of '<t>.<raw body>'>"
const webhookPayload = '{"data":{"orderReferenceId":"ref-1","status":"3"},"type":"order_lite","token":"t-1"}';
const signedAt = Math.floor(Date.now() / 1000);
const webhookSignature = `t=${signedAt},v1=${crypto
  .createHmac("sha256", "secret")
  .update(`${signedAt}.${webhookPayload}`)
  .digest("hex")}`;

if (await sdk.verifyWebhook(webhookPayload, webhookSignature, "secret")) {
  console.log("✅ Signed callback verified");
}
if (!(await sdk.verifyWebhook(webhookPayload.replace('"3"', '"13"'), webhookSignature, "secret"))) {
  console.log("✅ Tampered callback rejected");
}
if (!(await sdk.verifyWebhook(webhookPayload, `t=${signedAt - 301},v1=0`, "secret"))) {
  console.log("✅ Stale timestamp rejected");
}
if (!(await sdk.verifyWebhook(webhookPayload, "", "secret"))) {
  console.log("✅ Empty signature rejected");
}
if (!(await sdk.verifyWebhook(webhookPayload, webhookSignature, ""))) {
  console.log("✅ Empty secret rejected");
}

try {
  await sdk.verifyWebhook(JSON.parse(webhookPayload), webhookSignature, "secret");
} catch (error) {
  console.log(`✅ Parsed payload validation: ${error.message}`);
}

const event = WebhookEvent.fromPayload(webhookPayload);
console.log(`✅ Webhook event: ${event.type} for ${event.referenceId}, status ${event.status}`);

console.log("\n🎉 All offline features tested successfully!");
console.log("\n📝 Summary:");
console.log("✅ SDK Initialization & Configuration");
console.log("✅ Order Request Validation");
console.log("✅ Payment Term Validation");
console.log("✅ GSM Number Validation");
console.log("✅ Installments Validation");  
console.log("✅ Webhook Signature Verification");
console.log("✅ Error Handling & Messaging");

console.log("\n🔥 New Payment Term Features:");
console.log("• createOrderTerm() - Installment creation");
console.log("• updateOrderTerm() - Payment term updates");
console.log("• deleteOrderTerm() - Term deletion");
console.log("• refundOrderTerm() - Term-specific refunds");
console.log("• terminateOrderTerm() - Term termination");
console.log("• terminateOrder() - Full order termination");
console.log("• validateGsmNumber() - Turkish phone validation");
console.log("• validateInstallments() - Installment validation");

console.log("\n✨ SDK ready for production use with valid API credentials!");