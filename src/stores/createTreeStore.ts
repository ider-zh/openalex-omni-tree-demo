import { TreeNode, SearchResult } from '../types';
import { parseCSV } from '../utils/csv-parser';

// Build concept path by traversing pids using lookupMap
// Returns array of names from root to current node
function buildConceptPath(cid: string, name: string, lookupMap: Record<string, string>, searchData: any[]): string[] {
  // Find the search item for this cid
  const item = searchData.find((s: any) => s.id === cid);
  if (!item) return [name];

  // If no parents, this is a root
  if (!item.pids || item.pids.length === 0) return [name];

  // For concepts with multiple parents, pick the first parent path
  const parentCid = item.pids[0];
  const parentItem = searchData.find((s: any) => s.id === parentCid);
  
  if (!parentItem) return [name];

  // Recursively build parent path
  const parentPath = buildConceptPath(parentCid, parentItem.name, lookupMap, searchData);
  return [...parentPath, name];
}

export interface TreeStore {
  treeData: TreeNode | null;
  dataVersion: string;
  searchLoaded: boolean;
  searchLoading: boolean;
  loadTree(): Promise<void>;
  search(query: string): Promise<{ results: SearchResult[]; expandedNodes: Set<string> }>;
}

interface TreeStoreConfig {
  /** URL for tree skeleton JSON */
  treeUrl: string;
  /** Search data format: 'csv-topics' for topics, 'csv-concepts' for concepts ancestor tree */
  searchType: 'csv-topics' | 'csv-concepts';
  /** URL for search index file */
  searchUrl: string;
  /** Optional URL for lookup CSV */
  lookupUrl?: string;
  /** Optional transform applied to loaded tree data */
  transformTree?: (data: any) => any;
}

export function createTreeStore(config: TreeStoreConfig): TreeStore {
  let treeData: TreeNode | null = null;
  let dataVersion = '';
  let searchData: any[] | null = null;
  let searchLoaded = false;
  let searchLoading = false;
  let lookupMap: Record<string, string> = {};

  const store: TreeStore = {
    get treeData() { return treeData; },
    get dataVersion() { return dataVersion; },
    get searchLoaded() { return searchLoaded; },
    get searchLoading() { return searchLoading; },

    async loadTree() {
      if (treeData) return;
      try {
        const res = await fetch(config.treeUrl);
        const raw = await res.json();
        if (raw.version) dataVersion = raw.version;

        const processed = config.transformTree ? config.transformTree(raw) : raw;
        treeData = processed;
        console.log(`Tree loaded from ${config.treeUrl}`);
      } catch (error) {
        console.error(`Failed to load tree from ${config.treeUrl}:`, error);
      }
    },

    async search(query: string): Promise<{ results: SearchResult[]; expandedNodes: Set<string> }> {
      if (!query.trim()) return { results: [], expandedNodes: new Set() };

      // Lazy-load search data
      if (!searchLoaded && !searchLoading) {
        searchLoading = true;
        try {
          const fetches: Promise<Response>[] = [fetch(config.searchUrl)];
          if (config.lookupUrl) fetches.push(fetch(config.lookupUrl));
          const responses = await Promise.all(fetches);

          if (config.lookupUrl && responses[1]) {
            const lookupRows = parseCSV(await responses[1].text());
            for (const row of lookupRows) { lookupMap[row.cid || row.id] = row.name; }
          }

          const searchRows = parseCSV(await responses[0].text());

          if (config.searchType === 'csv-topics') {
            searchData = searchRows.map(row => ({
              id: row.id,
              name: row.name,
              domain: lookupMap[row.did] || row.did,
              field: lookupMap[row.fid] || row.fid,
              subfield: lookupMap[row.sid] || row.sid,
              works_count: parseInt(row.works_count, 10) || 0,
            }));
          } else {
            searchData = searchRows.map(row => ({
              id: row.id,
              name: row.name,
              level: row.level ? parseInt(row.level) : 0,
              works_count: parseInt(row.works_count, 10) || 0,
              pids: (row.pids || '').split(';').filter(Boolean),
            }));
          }
          searchLoaded = true;
          console.log(`Search data loaded: ${searchData!.length} entries`);
        } catch (error) {
          console.error('Failed to load search data:', error);
        } finally {
          searchLoading = false;
        }
      }

      // Wait if search is still loading (concurrent call)
      while (searchLoading) {
        await new Promise(r => setTimeout(r, 100));
      }

      if (!searchData) return { results: [], expandedNodes: new Set() };

      const lowerQuery = query.toLowerCase();
      const matches: SearchResult[] = [];
      const MAX_RESULTS = 200;

      for (let i = 0; i < searchData.length; i++) {
        const item = searchData[i];
        if (item.name.toLowerCase().includes(lowerQuery)) {
          let path: string[];
          if (config.searchType === 'csv-topics') {
            path = [item.domain, item.field, item.subfield, item.name].filter(Boolean);
          } else {
            // Concepts: build path by traversing pids recursively
            path = buildConceptPath(item.id, item.name, lookupMap, searchData);
          }
          matches.push({ id: item.id, path, level: item.level });
          if (matches.length >= MAX_RESULTS) break;
        }
      }

      const expandedNodes = new Set<string>();
      matches.forEach(r => r.path.forEach(n => expandedNodes.add(n)));
      return { results: matches, expandedNodes };
    }
  };

  return store;
}
