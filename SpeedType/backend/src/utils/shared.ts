// Backend entry point for all shared utilities
//
// This file acts as the single entry point for all shared utilities used by the backend.
// Always import shared logic from here, not directly from the shared/ directory.
// To add a new shared utility, export it from here after creating it in shared/.

export { sanitizeText } from '../../../shared/sanitizeText';
// Add more shared exports here as needed in the future
