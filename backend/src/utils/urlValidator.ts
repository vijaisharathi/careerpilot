import { URL } from 'url';

/**
 * URL Security and Validation Utility
 * Enforces safe public web protocols (http, https) and prevents SSRF / unsafe scheme execution.
 */

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS/GCP metadata service
  '[::1]',
]);

export function isValidHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const url = new URL(urlString.trim());

    // Only allow standard http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost and cloud metadata services
    if (BLOCKED_HOSTS.has(hostname)) {
      return false;
    }

    // Block private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return false;
    }

    // Block internal non-routable domains (.local, .internal, .lan)
    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates a redirect or application URL.
 * Returns safe URL string or a safe fallback URL.
 */
export function sanitizeSafeUrl(rawUrl: string, fallbackUrl = 'https://careerpilot.ai'): string {
  if (isValidHttpUrl(rawUrl)) {
    return rawUrl.trim();
  }
  return fallbackUrl;
}
