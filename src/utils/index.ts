import axios from "axios";
export function createPageUrl(page: string): string {
  return `/${page.toLowerCase().replace(/\s+/g, "-")}`;
}

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
});

/**
 * Check if an S3 URL or any URL is accessible
 * @param url - The URL to check
 * @param timeout - Request timeout in milliseconds (default: 5000)
 * @returns Promise with accessibility status and details
 */
export async function checkUrlAccessibility(
  url: string,
  timeout: number = 5000,
) {
  try {
    // Validate URL format
    new URL(url);

    const response = await axios.head(url, {
      timeout,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    return {
      accessible: response.status >= 200 && response.status < 400,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers["content-type"],
      contentLength: response.headers["content-length"],
      url,
      error: null,
    };
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      return {
        accessible: false,
        status: 0,
        statusText: "Timeout",
        url,
        error: "Request timed out",
      };
    }

    return {
      accessible: false,
      status: error.response?.status || 0,
      statusText: error.response?.statusText || "Error",
      url,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Check multiple URLs in parallel
 * @param urls - Array of URLs to check
 * @param timeout - Request timeout in milliseconds (default: 5000)
 * @returns Promise with array of accessibility results
 */
export async function checkMultipleUrls(
  urls: string[],
  timeout: number = 5000,
) {
  const results = await Promise.all(
    urls.map((url) => checkUrlAccessibility(url, timeout)),
  );

  return {
    results,
    summary: {
      total: urls.length,
      accessible: results.filter((r) => r.accessible).length,
      inaccessible: results.filter((r) => !r.accessible).length,
    },
  };
}
