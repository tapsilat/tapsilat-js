import { validateGsmNumber, validateInstallments } from "../dist/index.esm.js";

/**
 * Test the validation utilities that don't require API calls
 */

console.log("🧪 Testing Tapsilat SDK Validation Utilities\n");

// Test GSM Number Validation
console.log("=== GSM Number Validation ===");

const gsmTests = [
  "+90 555 123 45 67",
  "0555 123 45 67", 
  "555-123-45-67",
  "555.123.45.67",
  "(555) 123-45-67",
  "5551234567",
  "90 555 123 45 67",
  "invalid-number",
  "4551234567", // Doesn't start with 5
  "555123", // Too short
  ""
];

gsmTests.forEach(gsm => {
  const result = validateGsmNumber(gsm);
  if (result.isValid) {
    console.log(`✅ GSM "${gsm}" → ${result.cleanedNumber}`);
  } else {
    console.log(`❌ GSM "${gsm}" → ${result.error}`);
  }
});

console.log("\n=== Installments Validation ===");

// Test Installments Validation
const installmentTests = [
  3,
  "1,3,6,12",
  [2, 6, 9],
  [12, 3, 6, 1], // Will be sorted and deduplicated
  "6,3,12,6,1", // Will be sorted and deduplicated
  "",
  null,
  undefined,
  0,
  "invalid",
  37, // Too high
  -1, // Negative
  [1, "invalid", 3], // Mixed types
  {}
];

installmentTests.forEach(inst => {
  const result = validateInstallments(inst);
  if (result.isValid) {
    console.log(`✅ Installments ${JSON.stringify(inst)} → [${result.validatedInstallments.join(', ')}]`);
  } else {
    console.log(`❌ Installments ${JSON.stringify(inst)} → ${result.error}`);
  }
});

console.log("\n🎉 Validation utilities test completed!");
console.log("\nNote: These utilities work offline and don't require API credentials.");
console.log("For full API testing, update basic-usage.js with your actual bearer token.");