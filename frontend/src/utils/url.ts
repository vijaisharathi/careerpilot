/**
 * URL security utility to sanitize user-provided or external URLs
 * and prevent XSS through `javascript:` or other unsafe URI schemes.
 */
export const sanitizeExternalUrl = (url?: string): string => {
  if (!url) return '#';
  const trimmed = url.trim();

  // Allow standard web protocols
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Allow email links
  if (/^mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
    return trimmed;
  }

  // Prepend https:// if it looks like a valid domain without protocol (e.g. "github.com/myrepo")
  if (/^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Block dangerous schemes (javascript:, data:, vbscript:)
  return '#';
};

