/**
 * @category Configuration
 * @module ConfigManager
 */
import { TapsilatConfig } from "../types/index";
import { validateBearerToken } from "../utils/validators";

/**
 * @category Configuration
 * @summary Configuration management for Tapsilat SDK
 * @description Handles SDK configuration updates, validation, and secure access to configuration data
 * @class ConfigManager
 */
export class ConfigManager {
  private config: TapsilatConfig;

  /**
   * @summary Creates a new configuration manager
   * @description Initializes the configuration manager with the provided configuration options
   * 
   * @param config - Initial SDK configuration
   */
  constructor(config: TapsilatConfig) {
    this.config = { ...config }; // Create a copy to avoid external mutations
  }

  /**
   * @category Configuration Access
   * @summary Get current SDK configuration without sensitive information
   * @description Returns a copy of the current configuration with sensitive data (like bearer token) excluded
   *
   * @returns Copy of current configuration without bearer token
   */
  getConfig(): Omit<TapsilatConfig, "bearerToken"> & {
    hasBearerToken: boolean;
  } {
    const { bearerToken, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      hasBearerToken: Boolean(bearerToken),
    };
  }

  /**
   * @category Configuration Management
   * @summary Update SDK configuration with new values
   * @description Updates the SDK configuration with provided values, validating bearer token if changed
   *
   * @param newConfig - Partial configuration to update
   * @throws {TapsilatValidationError} When Bearer token is invalid
   */
  updateConfig(newConfig: Partial<TapsilatConfig>): void {
    if (newConfig.bearerToken) {
      validateBearerToken(newConfig.bearerToken);
    }
    Object.assign(this.config, newConfig);
  }

  /**
   * @category Internal
   * @summary Gets the internal configuration for SDK use
   * @description Returns a full copy of the configuration for internal SDK operations
   * 
   * @internal
   * @returns Full configuration including sensitive data
   */
  getInternalConfig(): TapsilatConfig {
    return { ...this.config }; // Return a copy to prevent external mutations
  }

  /**
   * @category Authentication
   * @summary Gets the bearer token for authentication
   * @description Retrieves the configured bearer token for API authentication
   * 
   * @internal
   * @returns Bearer token
   */
  getBearerToken(): string {
    return this.config.bearerToken;
  }

  /**
   * @category Endpoints
   * @summary Gets the base URL for API requests
   * @description Retrieves the configured base URL for API endpoints
   * 
   * @internal
   * @returns API base URL
   */
  getBaseUrl(): string | undefined {
    return this.config.baseURL;
  }

  /**
   * @category Networking
   * @summary Gets the request timeout value
   * @description Retrieves the configured timeout value for API requests
   * 
   * @internal
   * @returns Request timeout in milliseconds
   */
  getTimeout(): number | undefined {
    return this.config.timeout;
  }
}
