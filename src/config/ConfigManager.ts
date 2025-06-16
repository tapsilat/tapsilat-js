import { TapsilatConfig } from "../types";
import { validateBearerToken } from "../utils/validators";

/**
 * Manages SDK configuration with validation and security
 * 
 * @summary Configuration management for Tapsilat SDK
 * @description Handles SDK configuration updates, validation, and secure access to configuration data
 */
export class ConfigManager {
  private config: TapsilatConfig;

  constructor(config: TapsilatConfig) {
    this.config = { ...config }; // Create a copy to avoid external mutations
  }

  /**
   * Gets current SDK configuration (without sensitive data)
   *
   * @summary Get current SDK configuration without sensitive information
   * @description Returns a copy of the current configuration with sensitive data (like bearer token) excluded.
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
   * Updates SDK configuration
   *
   * @summary Update SDK configuration with new values
   * @description Updates the SDK configuration with provided values, validating bearer token if changed.
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
   * Gets the internal configuration for SDK use
   * 
   * @internal
   * @returns Full configuration including sensitive data
   */
  getInternalConfig(): TapsilatConfig {
    return { ...this.config }; // Return a copy to prevent external mutations
  }

  /**
   * Gets the bearer token for authentication
   * 
   * @internal
   * @returns Bearer token
   */
  getBearerToken(): string {
    return this.config.bearerToken;
  }

  /**
   * Gets the base URL for API requests
   * 
   * @internal
   * @returns API base URL
   */
  getBaseUrl(): string | undefined {
    return this.config.baseURL;
  }

  /**
   * Gets the request timeout value
   * 
   * @internal
   * @returns Request timeout in milliseconds
   */
  getTimeout(): number | undefined {
    return this.config.timeout;
  }
}
