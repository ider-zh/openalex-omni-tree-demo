import { Topic, ApiResponse } from './types';

const API_BASE_URL = 'https://api.openalex.org/topics';
const EMAIL = 'user@example.com';

export async function fetchTopics(page: number = 1, perPage: number = 100): Promise<ApiResponse> {
  const url = `${API_BASE_URL}?per-page=${perPage}&page=${page}&mailto=${EMAIL}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  return response.json();
}

export async function fetchAllTopics(): Promise<Topic[]> {
  const allTopics: Topic[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetchTopics(page, 200);
    allTopics.push(...response.results);
    totalPages = Math.ceil(response.meta.count / 200);
    page++;
  }

  return allTopics;
}

export async function searchTopics(query: string): Promise<Topic[]> {
  const url = `${API_BASE_URL}?search=${encodeURIComponent(query)}&per-page=100&mailto=${EMAIL}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search topics');
  }
  const data = await response.json();
  return data.results;
}
