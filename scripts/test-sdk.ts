#!/usr/bin/env ts-node

import { TapsilatSDK } from '../src/TapsilatSDK';
import { createLoggingInterceptor, createTimingInterceptor } from '../src/http/interceptors';

/**
 * Manual SDK Testing Script
 * 
 * Usage:
 * TAPSILAT_API_KEY=your-key npm run test:manual
 */

async function main() {
  const apiKey = process.env.TAPSILAT_API_KEY;
  
  if (!apiKey) {
    console.error('❌ TAPSILAT_API_KEY environment variable is required');
    console.log('Usage: TAPSILAT_API_KEY=your-key npm run test:manual');
    process.exit(1);
  }

  console.log('🚀 Starting Tapsilat SDK Manual Tests\n');

  // Initialize SDK
  const sdk = new TapsilatSDK({
    apiKey,
    baseURL: process.env.TAPSILAT_BASE_URL || 'https://sandbox.tapsilat.com/v1',
    timeout: 30000,
    maxRetries: 3,
    debug: true
  });

  // Add interceptors for debugging
  const httpClient = (sdk as any).httpClient;
  const logging = createLoggingInterceptor(true);
  const timing = createTimingInterceptor();

  httpClient.addRequestInterceptor(logging.request);
  httpClient.addResponseInterceptor(logging.response);
  httpClient.addErrorInterceptor(logging.error);
  httpClient.addRequestInterceptor(timing.request);
  httpClient.addResponseInterceptor(timing.response);

  console.log('✅ SDK initialized with interceptors\n');

  try {
    // Test 1: Health Check
    console.log('📊 Test 1: Health Check');
    try {
      const health = await sdk.healthCheck();
      console.log('✅ Health check passed:', health);
    } catch (error) {
      console.log('ℹ️  Health check not available:', error.message);
    }
    console.log('');

    // Test 2: Create Payment
    console.log('💳 Test 2: Create Payment');
    const paymentRequest = {
      amount: 25.99,
      currency: 'TRY' as const,
      paymentMethod: 'credit_card' as const,
      description: `Manual test payment ${new Date().toISOString()}`,
      metadata: {
        testType: 'manual',
        timestamp: Date.now(),
        userId: 'test-user-123'
      }
    };

    const payment = await sdk.createPayment(paymentRequest);
    console.log('✅ Payment created:', {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      paymentUrl: payment.paymentUrl
    });
    console.log('');

    // Test 3: Retrieve Payment
    console.log('🔍 Test 3: Retrieve Payment');
    const retrievedPayment = await sdk.getPayment(payment.id);
    console.log('✅ Payment retrieved:', {
      id: retrievedPayment.id,
      status: retrievedPayment.status,
      createdAt: retrievedPayment.createdAt
    });
    console.log('');

    // Test 4: List Payments
    console.log('📋 Test 4: List Payments');
    const payments = await sdk.getPayments({ limit: 5, sortOrder: 'desc' });
    console.log('✅ Payments listed:', {
      count: payments.data.length,
      total: payments.pagination.total,
      hasNext: payments.pagination.hasNextPage
    });
    console.log('');

    // Test 5: Create Customer
    console.log('👤 Test 5: Create Customer');
    const customer = {
      email: `test-${Date.now()}@example.com`,
      name: 'Manual Test Customer',
      phone: '+9099999999',
      address: {
        street: 'Test Street 123',
        city: 'Istanbul',
        country: 'Turkey',
        postalCode: '34000'
      },
      metadata: {
        source: 'manual-test',
        testId: Date.now()
      }
    };

    const createdCustomer = await sdk.createCustomer(customer);
    console.log('✅ Customer created:', {
      id: createdCustomer.id,
      email: createdCustomer.email,
      name: createdCustomer.name
    });
    console.log('');

    // Test 6: Update Customer
    console.log('✏️  Test 6: Update Customer');
    const updatedCustomer = await sdk.updateCustomer(createdCustomer.id!, {
      name: 'Updated Manual Test Customer',
      phone: '+9099999999'
    });
    console.log('✅ Customer updated:', {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      phone: updatedCustomer.phone
    });
    console.log('');

    // Test 7: Create Payment with Customer
    console.log('💳👤 Test 7: Payment with Customer');
    const customerPayment = await sdk.createPayment({
      amount: 15.50,
      currency: 'TRY',
      paymentMethod: 'credit_card',
      description: 'Payment with customer',
      customerId: createdCustomer.id!
    });
    console.log('✅ Payment with customer created:', customerPayment.id);
    console.log('');

    // Test 8: Webhook Verification
    console.log('🔐 Test 8: Webhook Verification');
    const webhookPayload = JSON.stringify({
      event: 'payment.completed',
      data: payment
    });
    const webhookSecret = 'test-webhook-secret';
    
    const isValidSignature = await sdk.verifyWebhook(
      webhookPayload,
      'sha256=test-signature',
      webhookSecret
    );
    console.log('✅ Webhook verification result:', isValidSignature);
    console.log('');

    // Test 9: Error Handling
    console.log('❌ Test 9: Error Handling');
    try {
      await sdk.getPayment('nonexistent-payment-id');
    } catch (error) {
      console.log('✅ Error handled correctly:', error.constructor.name, '-', error.message);
    }
    console.log('');

    // Test 10: Stress Test
    console.log('⚡ Test 10: Concurrent Requests');
    const startTime = Date.now();
    const concurrentPromises = Array(5).fill(null).map((_, index) => 
      sdk.getPayments({ limit: 1, page: index + 1 })
    );
    
    const results = await Promise.allSettled(concurrentPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const duration = Date.now() - startTime;
    
    console.log('✅ Concurrent requests completed:', {
      successful: successCount,
      total: results.length,
      duration: `${duration}ms`
    });
    console.log('');

    // Test 11: Configuration Management
    console.log('⚙️  Test 11: Configuration Management');
    const configManager = sdk.getConfigManager();
    const config = configManager.getConfig();
    console.log('✅ Current config:', {
      hasBearerToken: config.hasBearerToken,
      baseURL: config.baseURL,
      timeout: config.timeout,
      maxRetries: config.maxRetries
    });

    // Update timeout and test
    configManager.updateConfig({ timeout: 45000 });
    const updatedConfig = configManager.getConfig();
    console.log('✅ Updated timeout:', updatedConfig.timeout);
    console.log('');

    // Cleanup: Try to cancel created payments
    console.log('🧹 Cleanup: Cancel Test Payments');
    for (const testPayment of [payment, customerPayment]) {
      try {
        await sdk.cancelPayment(testPayment.id);
        console.log(`✅ Cancelled payment: ${testPayment.id}`);
      } catch (error) {
        console.log(`ℹ️  Could not cancel payment ${testPayment.id}:`, error.message);
      }
    }

    // Cleanup: Delete test customer
    try {
      await sdk.deleteCustomer(createdCustomer.id!);
      console.log(`✅ Deleted customer: ${createdCustomer.id}`);
    } catch (error) {
      console.log(`ℹ️  Could not delete customer:`, error.message);
    }

    console.log('\n🎉 All manual tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ SDK initialization');
    console.log('✅ Payment creation and retrieval');
    console.log('✅ Customer management');
    console.log('✅ Error handling');
    console.log('✅ Concurrent requests');
    console.log('✅ Configuration management');
    console.log('✅ Webhook verification');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', {
      name: error.constructor.name,
      message: error.message,
      code: error.code,
      details: error.details
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main }; 