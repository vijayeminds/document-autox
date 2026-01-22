import axios from 'axios'
export function createPageUrl(page: string): string {
  return `/${page.toLowerCase().replace(/\s+/g, '-')}`;
}

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
});
