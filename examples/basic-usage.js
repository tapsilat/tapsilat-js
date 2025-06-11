const { TapsilatSDK } = require("../dist/index.js");

async function main() {
  // SDK'yı başlat
  const tapsilat = new TapsilatSDK({
    apiKey: "your-api-key-here",
    baseURL: "https://api.tapsilat.com/v1", // opsiyonel
    timeout: 30000, // opsiyonel, 30 saniye
    retryAttempts: 3, // opsiyonel, yeniden deneme sayısı
  });

  const order = await tapsilat.createOrder({
    amount: 150.75,
    currency: "TRY",
    locale: "tr",
    buyer: {
      name: "Ahmet",
      surname: "Yilmaz",
      email: "ahmet@example.com",
      phone: "+905551234567",
      identityNumber: "12345678901",
    },
    description: "Example payment",
  });

  const orderStatus = await tapsilat.getOrderStatus(order.referenceId);

  try {
    // Ödeme oluştur
    console.log("🔄 Creating payment...");
    const payment = await tapsilat.createPayment({
      amount: 150.75,
      currency: "TRY",
      paymentMethod: "credit_card",
      description: "Example payment",
      metadata: {
        orderId: "ORDER-123",
        userId: "456",
      },
      returnUrl: "https://your-site.com/payment/success",
      webhookUrl: "https://your-site.com/webhooks/payment",
    });

    console.log("✅ Payment created:", {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentUrl: payment.paymentUrl,
    });

    const paymentStatus = await tapsilat.getPayment(payment.id);

    const payments = await tapsilat.getPayments({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    const customer = await tapsilat.createCustomer({
      email: "customer@example.com",
      name: "Ahmet Yılmaz",
      phone: "+905551234567",
      address: {
        street: "Atatürk Caddesi No: 123",
        city: "Istanbul",
        state: "Istanbul",
        postalCode: "34000",
        country: "TR",
      },
    });

    console.log("✅ Customer created:", {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    });

    if (payment.status === "completed") {
      const refund = await tapsilat.createRefund({
        paymentId: payment.id,
        amount: 50.0, // Partial refund
        reason: "Customer request",
      });

      console.log("✅ Refund created:", {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.code) {
      console.error("Error code:", error.code);
    }

    if (error.details) {
      console.error("Error details:", error.details);
    }
  }
}

// Webhook doğrulama örneği
function verifyWebhookExample() {
  const tapsilat = new TapsilatSDK({
    apiKey: "your-api-key-here",
  });

  // Webhook payload'ı ve signature'ı
  const payload = '{"id":"payment-123","status":"completed"}';
  const signature = "sha256=abc123..."; // Header'dan gelen signature
  const webhookSecret = "your-webhook-secret";

  const isValid = tapsilat.verifyWebhook(payload, signature, webhookSecret);
}

if (require.main === module) {
  main().catch(console.error);
}
