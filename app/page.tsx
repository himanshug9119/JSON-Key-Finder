'use client';

import { useState } from 'react';
import { Upload, Search, Sun, Moon, Download, Share2, Copy, FileJson, Clock, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { SearchResult } from '@/lib/types';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from 'date-fns';

export default function Home() {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonUrl, setJsonUrl] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

  const findKeysInJson = (obj: any, searchKey: string, path = ''): SearchResult[] => {
    let results: SearchResult[] = [];
    
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key === searchKey) {
        results.push({ path: currentPath, value: obj[key] });
      }
      
      if (obj[key] && typeof obj[key] === 'object') {
        results = [...results, ...findKeysInJson(obj[key], searchKey, currentPath)];
      }
    }
    
    return results;
  };

  const fetchJsonFromUrl = async (url: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data from URL');
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('URL does not return JSON data');
      }
      const data = await response.json();
      setJsonInput(JSON.stringify(data, null, 2));
      toast.success('JSON data fetched successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch JSON data');
      setJsonInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      const searchResults = findKeysInJson(jsonData, searchKey);
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        toast.info('No matches found');
      } else {
        toast.success(`Found ${searchResults.length} match${searchResults.length > 1 ? 'es' : ''}`);
        addRecentSearch(searchKey, searchResults);
      }
    } catch (error) {
      toast.error('Invalid JSON format');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          JSON.parse(text); // Validate JSON
          setJsonInput(text);
          toast.success('JSON file loaded successfully');
        } catch (error) {
          toast.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadResults = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Results downloaded');
  };

  const loadRecentSearch = (search: RecentSearch) => {
    setSearchKey(search.key);
    setResults(search.results);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="h-8 w-8" />
            <h1 className="text-3xl font-bold">JSON Key Finder</h1>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    Recent Searches
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="flex gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear History
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {recentSearches.map((search) => (
                    <Card
                      key={search.id}
                      className="p-4 cursor-pointer hover:bg-accent"
                      onClick={() => loadRecentSearch(search)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Search key: "{search.key}"</p>
                        <p className="text-sm text-muted-foreground">
                          {format(search.timestamp, 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {search.results.length} result{search.results.length !== 1 ? 's' : ''}
                      </p>
                    </Card>
                  ))}
                  {recentSearches.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No recent searches
                    </p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex gap-4">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="json-upload"
            />
            <Button
              onClick={() => document.getElementById('json-upload')?.click()}
              className="flex gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload JSON
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Enter JSON URL..."
              value={jsonUrl}
              onChange={(e) => setJsonUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => fetchJsonFromUrl(jsonUrl)}
              disabled={isLoading || !jsonUrl}
              className="flex gap-2 whitespace-nowrap"
            >
              <Globe className="h-4 w-4" />
              {isLoading ? 'Fetching...' : 'Fetch JSON'}
            </Button>
          </div>

          <Textarea
            placeholder="Paste your JSON here..."
            className="min-h-[200px] font-mono"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />

          <div className="flex gap-4">
            <Input
              placeholder="Enter key to search..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
            <Button onClick={handleSearch} className="flex gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </Card>

        {results.length > 0 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Results</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="p-4">
                  <p className="font-mono text-sm mb-2">Path: {result.path}</p>
                  <p className="font-mono text-sm break-all">
                    Value: {JSON.stringify(result.value)}
                  </p>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}