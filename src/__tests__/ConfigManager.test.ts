import { ConfigManager } from "../config/ConfigManager";
import { TapsilatConfig } from "../types";
import { TapsilatValidationError } from "../errors/TapsilatError";

describe("ConfigManager", () => {
  const validConfig: TapsilatConfig = {
    bearerToken: "test-token-12345", // Valid token: alphanumeric with hyphens
    baseURL: "https://api.tapsilat.com/v1",
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    version: "v1",
    debug: false,
  };

  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager(validConfig);
  });

  describe("constructor", () => {
    it("should create ConfigManager with valid config", () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
    });

    it("should create a copy of config to prevent external mutations", () => {
      const originalConfig = { ...validConfig };
      const manager = new ConfigManager(originalConfig);
      
      // Mutate original config
      originalConfig.timeout = 999999;
      
      // Internal config should remain unchanged
      expect(manager.getInternalConfig().timeout).toBe(30000);
    });
  });

  describe("getConfig", () => {
    it("should return config without bearer token", () => {
      const config = configManager.getConfig();
      
      expect(config).not.toHaveProperty("bearerToken");
      expect(config).toHaveProperty("hasBearerToken", true);
      expect(config.baseURL).toBe("https://api.tapsilat.com/v1");
      expect(config.timeout).toBe(30000);
    });

    it("should indicate when bearer token is missing", () => {
      const configWithoutToken = { ...validConfig, bearerToken: "" };
      const manager = new ConfigManager(configWithoutToken);
      
      const config = manager.getConfig();
      expect(config.hasBearerToken).toBe(false);
    });
  });

  describe("updateConfig", () => {
    it("should update configuration values", () => {
      configManager.updateConfig({
        timeout: 60000,
        debug: true,
      });

      const config = configManager.getInternalConfig();
      expect(config.timeout).toBe(60000);
      expect(config.debug).toBe(true);
      expect(config.bearerToken).toBe("test-token-12345"); // Should remain unchanged
    });

    it("should validate bearer token when updating", () => {
      expect(() => {
        configManager.updateConfig({
          bearerToken: "invalid@token", // Contains invalid character @
        });
      }).toThrow(TapsilatValidationError);
    });

    it("should allow valid bearer token updates", () => {
      const newToken = "new-valid-token-67890"; // Valid token without special chars
      configManager.updateConfig({
        bearerToken: newToken,
      });

      expect(configManager.getBearerToken()).toBe(newToken);
    });
  });

  describe("getInternalConfig", () => {
    it("should return full config including sensitive data", () => {
      const config = configManager.getInternalConfig();
      
      expect(config).toHaveProperty("bearerToken", "test-token-12345");
      expect(config.baseURL).toBe("https://api.tapsilat.com/v1");
    });

    it("should return a copy to prevent mutations", () => {
      const config = configManager.getInternalConfig();
      config.timeout = 999999;
      
      // Original should remain unchanged
      expect(configManager.getInternalConfig().timeout).toBe(30000);
    });
  });

  describe("getBearerToken", () => {
    it("should return bearer token", () => {
      expect(configManager.getBearerToken()).toBe("test-token-12345");
    });
  });

  describe("getBaseUrl", () => {
    it("should return base URL", () => {
      expect(configManager.getBaseUrl()).toBe("https://api.tapsilat.com/v1");
    });

    it("should return undefined if base URL is not set", () => {
      const configWithoutBaseUrl = { ...validConfig };
      delete configWithoutBaseUrl.baseURL;
      const manager = new ConfigManager(configWithoutBaseUrl);
      
      expect(manager.getBaseUrl()).toBeUndefined();
    });
  });

  describe("getTimeout", () => {
    it("should return timeout value", () => {
      expect(configManager.getTimeout()).toBe(30000);
    });

    it("should return undefined if timeout is not set", () => {
      const configWithoutTimeout = { ...validConfig };
      delete configWithoutTimeout.timeout;
      const manager = new ConfigManager(configWithoutTimeout);
      
      expect(manager.getTimeout()).toBeUndefined();
    });
  });
});
