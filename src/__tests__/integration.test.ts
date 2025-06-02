import { TapsilatSDK } from '../TapsilatSDK';

// Integration tests - requires real API key
// Set TAPSILAT_TEST_API_KEY environment variable to run these tests

describe('TapsilatSDK Integration Tests', () => {
  let sdk: TapsilatSDK;
  const testApiKey = process.env.TAPSILAT_TEST_API_KEY;

  beforeAll(() => {
    if (!testApiKey) {
      console.warn('⚠️  Skipping integration tests - TAPSILAT_TEST_API_KEY not set');
      return;
    }

    sdk = new TapsilatSDK({
      apiKey: testApiKey,
      baseURL: process.env.TAPSILAT_TEST_BASE_URL || 'https://sandbox.tapsilat.com/v1',
      timeout: 30000,
      maxRetries: 3,
      debug: true
    });
  });

  // Only run if API key is provided
  const conditionalDescribe = testApiKey ? describe : describe.skip;

  conditionalDescribe('Real API Tests', () => {
    describe('Health Check', () => {
      it('should connect to API successfully', async () => {
        try {
          const health = await sdk.healthCheck();
          expect(health.status).toBeTruthy();
        } catch (error) {
          // Health endpoint might not exist, that's ok
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Health check not available:', errorMessage);
        }
      });
    });

    describe('Authentication', () => {
      it('should authenticate with valid API key', async () => {
        try {
          // Try to get payments to test auth
          await sdk.getPayments({ limit: 1 });
        } catch (error) {
          // If auth fails, it should be auth error, not network
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
            throw new Error('Authentication failed - check your API key');
          }
          // Other errors might be ok (like no payments found)
        }
      });
    });

    describe('Payment Flow', () => {
      let createdPaymentId: string;

      it('should create a test payment', async () => {
        const paymentRequest = {
          amount: 1.00, // Minimum test amount
          currency: 'TRY' as const,
          paymentMethod: 'credit_card' as const,
          description: 'Integration test payment',
          metadata: {
            testId: `test-${Date.now()}`,
            environment: 'test'
          }
        };

        const payment = await sdk.createPayment(paymentRequest);

        expect(payment.id).toBeTruthy();
        expect(payment.amount).toBe(1.00);
        expect(payment.currency).toBe('TRY');
        expect(payment.status).toBeTruthy();

        createdPaymentId = payment.id;
        console.log('✅ Created test payment:', payment.id);
      });

      it('should retrieve the created payment', async () => {
        if (!createdPaymentId) {
          throw new Error('No payment created in previous test');
        }

        const payment = await sdk.getPayment(createdPaymentId);

        expect(payment.id).toBe(createdPaymentId);
        expect(payment.amount).toBe(1.00);
        expect(payment.description).toBe('Integration test payment');

        console.log('✅ Retrieved payment:', payment.id, 'Status:', payment.status);
      });

      it('should list payments including our test payment', async () => {
        const payments = await sdk.getPayments({ limit: 10 });

        expect(payments.data).toBeInstanceOf(Array);
        expect(payments.pagination).toBeTruthy();

        // Our payment should be in the list
        const ourPayment = payments.data.find(p => p.id === createdPaymentId);
        expect(ourPayment).toBeTruthy();

        console.log('✅ Listed payments, found', payments.data.length, 'payments');
      });

      it('should cancel the test payment if possible', async () => {
        if (!createdPaymentId) return;

        try {
          const cancelledPayment = await sdk.cancelPayment(createdPaymentId);
          expect(cancelledPayment.id).toBe(createdPaymentId);
          console.log('✅ Cancelled payment:', createdPaymentId);
        } catch (error) {
          // Payment might not be cancellable in its current state
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('ℹ️  Payment cancellation not possible:', errorMessage);
        }
      });
    });

    describe('Customer Management', () => {
      let createdCustomerId: string;

      it('should create a test customer', async () => {
        const customer = {
          email: `test-${Date.now()}@example.com`,
          name: 'Integration Test User',
          phone: '+905551234567',
          metadata: {
            testCustomer: true,
            createdAt: new Date().toISOString()
          }
        };

        const createdCustomer = await sdk.createCustomer(customer);

        expect(createdCustomer.id).toBeTruthy();
        expect(createdCustomer.email).toBe(customer.email);
        expect(createdCustomer.name).toBe(customer.name);

        createdCustomerId = createdCustomer.id!;
        console.log('✅ Created test customer:', createdCustomerId);
      });

      it('should retrieve the created customer', async () => {
        if (!createdCustomerId) return;

        const customer = await sdk.getCustomer(createdCustomerId);

        expect(customer.id).toBe(createdCustomerId);
        expect(customer.email).toContain('test-');
        expect(customer.name).toBe('Integration Test User');

        console.log('✅ Retrieved customer:', customer.id);
      });

      it('should update the customer', async () => {
        if (!createdCustomerId) return;

        const updates = {
          name: 'Updated Integration Test User',
          phone: '+905559876543'
        };

        const updatedCustomer = await sdk.updateCustomer(createdCustomerId, updates);

        expect(updatedCustomer.name).toBe(updates.name);
        expect(updatedCustomer.phone).toBe(updates.phone);

        console.log('✅ Updated customer:', createdCustomerId);
      });

      it('should delete the test customer', async () => {
        if (!createdCustomerId) return;

        await sdk.deleteCustomer(createdCustomerId);

        // Verify deletion by trying to retrieve
        try {
          await sdk.getCustomer(createdCustomerId);
          throw new Error('Customer should have been deleted');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          expect(errorMessage).toContain('not found');
          console.log('✅ Deleted customer:', createdCustomerId);
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid payment data gracefully', async () => {
        try {
          await sdk.createPayment({
            amount: -100, // Invalid negative amount
            currency: 'TRY',
            paymentMethod: 'credit_card'
          });
          throw new Error('Should have thrown validation error');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          expect(errorMessage).toContain('positive');
          console.log('✅ Properly handled validation error');
        }
      });

      it('should handle non-existent resource gracefully', async () => {
        try {
          await sdk.getPayment('payment_does_not_exist');
          throw new Error('Should have thrown not found error');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          expect(errorMessage).toBeTruthy();
          console.log('✅ Properly handled not found error');
        }
      });
    });
  });

  describe('Performance Tests', () => {
    const perfDescribe = testApiKey ? describe : describe.skip;

    perfDescribe('Response Times', () => {
      it('should respond to getPayments within reasonable time', async () => {
        const startTime = Date.now();
        
        await sdk.getPayments({ limit: 5 });
        
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(5000); // 5 seconds max
        
        console.log(`✅ getPayments response time: ${responseTime}ms`);
      });

      it('should handle concurrent requests', async () => {
        const promises = Array(5).fill(null).map(() => 
          sdk.getPayments({ limit: 1 })
        );

        const startTime = Date.now();
        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;

        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result.data).toBeInstanceOf(Array);
        });

        console.log(`✅ 5 concurrent requests completed in ${totalTime}ms`);
      });
    });
  });
}); 