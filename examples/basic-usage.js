const { TapsilatSDK } = require('../dist/index.js');

async function main() {
  // SDK'yı başlat
  const tapsilat = new TapsilatSDK({
    apiKey: 'your-api-key-here',
    baseURL: 'https://api.tapsilat.com/v1', // opsiyonel
    timeout: 30000, // opsiyonel, 30 saniye
    retryAttempts: 3 // opsiyonel, yeniden deneme sayısı
  });

  try {
    // Ödeme oluştur
    console.log('🔄 Ödeme oluşturuluyor...');
    const payment = await tapsilat.createPayment({
      amount: 150.75,
      currency: 'TRY',
      paymentMethod: 'credit_card',
      description: 'Örnek ödeme',
      metadata: {
        orderId: 'ORDER-123',
        userId: '456'
      },
      returnUrl: 'https://your-site.com/payment/success',
      webhookUrl: 'https://your-site.com/webhooks/payment'
    });

    console.log('✅ Ödeme oluşturuldu:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentUrl: payment.paymentUrl
    });

    // Ödeme durumunu kontrol et
    console.log('\n🔄 Ödeme durumu kontrol ediliyor...');
    const paymentStatus = await tapsilat.getPayment(payment.id);
    console.log('📊 Ödeme durumu:', paymentStatus.status);

    // Ödemeleri listele
    console.log('\n🔄 Son ödemeler getiriliyor...');
    const payments = await tapsilat.getPayments({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    console.log('📋 Toplam ödeme sayısı:', payments.pagination.total);
    console.log('📋 Bu sayfadaki ödeme sayısı:', payments.data.length);

    // Müşteri oluştur
    console.log('\n🔄 Müşteri oluşturuluyor...');
    const customer = await tapsilat.createCustomer({
      email: 'customer@example.com',
      name: 'Ahmet Yılmaz',
      phone: '+905551234567',
      address: {
        street: 'Atatürk Caddesi No: 123',
        city: 'Istanbul',
        state: 'Istanbul',
        postalCode: '34000',
        country: 'TR'
      }
    });

    console.log('✅ Müşteri oluşturuldu:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    });

    // İade işlemi (eğer ödeme tamamlandıysa)
    if (payment.status === 'completed') {
      console.log('\n🔄 İade işlemi başlatılıyor...');
      const refund = await tapsilat.createRefund({
        paymentId: payment.id,
        amount: 50.00, // Kısmi iade
        reason: 'Müşteri talebi'
      });

      console.log('✅ İade oluşturuldu:', {
        id: refund.id,
        amount: refund.amount,
        status: refund.status
      });
    }

    // Health check
    console.log('\n🔄 API sağlık durumu kontrol ediliyor...');
    const health = await tapsilat.healthCheck();
    console.log('💚 API Durumu:', health.status);

  } catch (error) {
    console.error('❌ Hata oluştu:', error.message);
    
    if (error.code) {
      console.error('Hata kodu:', error.code);
    }
    
    if (error.details) {
      console.error('Hata detayları:', error.details);
    }
  }
}

// Webhook doğrulama örneği
function verifyWebhookExample() {
  const tapsilat = new TapsilatSDK({
    apiKey: 'your-api-key-here'
  });

  // Webhook payload'ı ve signature'ı
  const payload = '{"id":"payment-123","status":"completed"}';
  const signature = 'sha256=abc123...'; // Header'dan gelen signature
  const webhookSecret = 'your-webhook-secret';

  const isValid = tapsilat.verifyWebhook(payload, signature, webhookSecret);
  console.log('🔒 Webhook geçerli mi?', isValid);
}

if (require.main === module) {
  main().catch(console.error);
} 