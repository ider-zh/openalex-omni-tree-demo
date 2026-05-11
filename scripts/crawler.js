/**
 * Crawler to fetch all OpenAlex topics data
 * API: https://api.openalex.org/topics
 * Pagination: per-page max 200, need to paginate through all pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://api.openalex.org/topics';
const PER_PAGE = 200;
const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'topics.json');

async function fetchPage(page) {
  const url = `${API_BASE}?per-page=${PER_PAGE}&page=${page}&mailto=user@example.com`;
  console.log(`Fetching page ${page}: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function fetchAllTopics() {
  console.log('Starting to fetch all OpenAlex topics...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const allTopics = [];
  let page = 1;
  let totalPages = 1;
  
  try {
    while (page <= totalPages) {
      const data = await fetchPage(page);
      
      // Update total pages based on meta
      if (data.meta && data.meta.count) {
        totalPages = Math.ceil(data.meta.count / PER_PAGE);
        console.log(`Total topics: ${data.meta.count}, Total pages: ${totalPages}`);
      }
      
      // Add results to our collection
      if (data.results && Array.isArray(data.results)) {
        allTopics.push(...data.results);
        console.log(`Fetched ${data.results.length} topics from page ${page}, total so far: ${allTopics.length}`);
      }
      
      // Check if there's a next page
      if (!data.meta || allTopics.length >= data.meta.count) {
        break;
      }
      
      page++;
      
      // Rate limiting - be nice to the API
      if (page <= totalPages) {
        console.log('Waiting 1 second before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\nFetching complete! Total topics collected: ${allTopics.length}`);
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTopics, null, 2), 'utf8');
    console.log(`Data saved to: ${OUTPUT_FILE}`);
    
    // Save stats
    const stats = {
      totalTopics: allTopics.length,
      fetchedAt: new Date().toISOString(),
      domains: {}
    };
    
    // Count topics by domain
    allTopics.forEach(topic => {
      if (topic.domain && topic.domain.id) {
        const domainName = topic.domain.display_name || topic.domain.id;
        stats.domains[domainName] = (stats.domains[domainName] || 0) + 1;
      }
    });
    
    const statsFile = path.join(OUTPUT_DIR, 'stats.json');
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf8');
    console.log(`Stats saved to: ${statsFile}`);
    
    return allTopics;
    
  } catch (error) {
    console.error('Error during fetching:', error.message);
    
    // Save what we have so far
    if (allTopics.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTopics, null, 2), 'utf8');
      console.log(`Partial data saved: ${allTopics.length} topics`);
    }
    
    throw error;
  }
}

// Run the crawler
fetchAllTopics()
  .then(() => {
    console.log('\nCrawler finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nCrawler failed:', error);
    process.exit(1);
  });
