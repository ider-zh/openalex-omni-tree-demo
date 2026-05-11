/**
 * OpenAlex API 客户端（浏览器端直接调用 API）
 * 注意：当前应用使用预构建的 CSV 数据，此模块为备用/开发调试用途
 */

const API_BASE_URL = 'https://api.openalex.org/topics';
const EMAIL = 'user@example.com';

export async function fetchTopics(page: number = 1, perPage: number = 100) {
  const url = `${API_BASE_URL}?per-page=${perPage}&page=${page}&mailto=${EMAIL}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  return response.json();
}

export async function searchTopics(query: string) {
  const url = `${API_BASE_URL}?search=${encodeURIComponent(query)}&per-page=100&mailto=${EMAIL}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search topics');
  }
  const data = await response.json();
  return data.results;
}
