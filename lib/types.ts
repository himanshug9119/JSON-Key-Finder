export interface SearchResult {
  path: string;
  value: any;
}

export interface RecentSearch {
  id: string;
  key: string;
  timestamp: number;
  results: SearchResult[];
}