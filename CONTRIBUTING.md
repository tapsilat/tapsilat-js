# Contributing to Tapsilat JS SDK

🎉 Öncelikle Tapsilat JS SDK'ya katkıda bulunmak istediğiniz için teşekkürler!

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git

### Local Development
```bash
# Repository'yi klonlayın
git clone https://github.com/tapsilat/tapsilat-js.git
cd tapsilat-js

# Bağımlılıkları yükleyin
npm install

# Development mode'da çalıştırın
npm run dev

# Testleri çalıştırın
npm test

# Linting kontrolü
npm run lint
```

## 📝 Code Style

### TypeScript Guidelines
- Strict TypeScript kullanın
- Explicit return types belirtin
- Interface'leri class'lara tercih edin
- Union types kullanın (string literals)

### Naming Conventions
```typescript
// ✅ Good
interface PaymentRequest { }
class TapsilatSDK { }
const createPayment = async () => { }

// ❌ Bad  
interface paymentrequest { }
class tapsilat_sdk { }
const CreatePayment = async () => { }
```

### Error Handling
```typescript
// ✅ Custom error classes kullanın
throw new TapsilatValidationError('Invalid amount');

// ❌ Generic Error kullanmayın
throw new Error('Something went wrong');
```

## 🧪 Testing

### Test Structure
```
src/
  __tests__/
    TapsilatSDK.test.ts      # Unit tests
    integration.test.ts       # Integration tests
    performance.test.ts       # Performance tests
```

### Writing Tests
```typescript
describe('Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle success case', async () => {
    // Mock setup
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    });

    // Test execution
    const result = await sdk.someMethod();

    // Assertions
    expect(result).toEqual(expectedResult);
  });

  it('should handle error case', async () => {
    // Error scenario test
  });
});
```

### Test Coverage
- Minimum %90 test coverage
- Unit tests for all public methods
- Error case testing
- Edge case testing

## 📋 Pull Request Process

### Before Submitting
1. **Test Coverage**: Ensure tests pass
```bash
npm test
npm run test:coverage
```

2. **Linting**: Fix all linting issues
```bash
npm run lint:fix
```

3. **Type Check**: Ensure TypeScript compiles
```bash
npm run type-check
```

4. **Build**: Ensure build succeeds
```bash
npm run build
```

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
```

### Commit Messages
```bash
# Format: type(scope): description

feat(payments): add payment cancellation support
fix(validation): handle edge case in amount validation
docs(readme): update installation instructions
test(sdk): add integration test for refunds
```

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Step 1
2. Step 2
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**  
What actually happens

**Environment**
- SDK Version: 
- Node.js Version:
- Operating System:

**Code Sample**
```typescript
// Minimal code to reproduce
```

**Error Messages**
```
Error logs/stack traces
```
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this be implemented?

**Alternatives**
Other solutions considered

**Additional Context**
Any other relevant information
```

## 🔒 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email: security@tapsilat.com
- Include detailed description and reproduction steps

### Security Guidelines
- Never commit API keys or secrets
- Sanitize all user inputs
- Validate all data types
- Use secure defaults

## 📚 Documentation

### Documentation Updates
- Update README.md for new features
- Add JSDoc comments for public APIs
- Update examples when APIs change
- Keep CHANGELOG.md updated

### Example Format
```typescript
/**
 * Creates a new payment
 * 
 * @param request - Payment request data
 * @returns Promise resolving to payment response
 * @throws {TapsilatValidationError} When validation fails
 * 
 * @example
 * ```typescript
 * const payment = await sdk.createPayment({
 *   amount: 100,
 *   currency: 'TRY',
 *   paymentMethod: 'credit_card'
 * });
 * ```
 */
```

## 🎯 Release Process

### Version Bumping
- **Patch** (1.0.X): Bug fixes, no breaking changes
- **Minor** (1.X.0): New features, backwards compatible  
- **Major** (X.0.0): Breaking changes

### Release Checklist
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create release notes
- [ ] Tag release
- [ ] Publish to NPM

## 🤝 Code of Conduct

### Our Pledge
- Welcoming and inclusive environment
- Respectful communication
- Constructive feedback
- Professional behavior

### Enforcement
Issues can be reported to: conduct@tapsilat.com

## 📞 Questions?

- GitHub Discussions: Ask questions
- GitHub Issues: Bug reports, feature requests  
- Email: developers@tapsilat.com

Thank you for contributing! 🎉 