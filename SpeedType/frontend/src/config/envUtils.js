/**
 * Shared utilities for environment configuration
 */

/**
 * Validates if all required environment variables are present
 * @param {Object} envVars - The environment variables object
 * @param {Array<string>} requiredVars - List of required variable names
 * @returns {Array<string>} - List of missing variables (empty if all present)
 */
export const validateRequiredVars = (envVars, requiredVars) => {
  return requiredVars.filter(key => {
    const value = envVars[key];
    return value === undefined || value === null || value === '';
  });
};

/**
 * Logs environment initialization details
 * @param {string} mode - The environment mode
 * @param {Object} config - The environment configuration
 */
export const logEnvironmentInfo = (mode, config = {}) => {
  console.log(`Environment initialized: ${mode}`);
  
  if (config.BACKEND_URL) {
    console.log('Using backend URL:', config.BACKEND_URL);
  }
};

/**
 * Parse a string value as an integer with fallback
 * @param {string} value - The string value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - The parsed integer or default value
 */
export const parseIntWithDefault = (value, defaultValue = 0) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse a comma-separated string into an array
 * @param {string} value - The comma-separated string
 * @param {Array} defaultValue - Default value if parsing fails
 * @returns {Array} - The parsed array or default value
 */
export const parseArrayFromString = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim());
};

/**
 * Validate environment mode and return normalized value
 * @param {string} mode - The environment mode
 * @param {Array<string>} validModes - List of valid modes
 * @param {string} defaultMode - Default mode if invalid
 * @returns {string} - The validated mode
 */
export const validateMode = (mode, validModes, defaultMode) => {
  if (!mode || !validModes.includes(mode)) {
    console.warn(`Invalid environment mode: ${mode}, falling back to ${defaultMode}`);
    return defaultMode;
  }
  return mode;
}; 