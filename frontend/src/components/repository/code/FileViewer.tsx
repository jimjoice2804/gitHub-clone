'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CopyIcon, CheckIcon } from 'lucide-react';
import { repositoryApi } from '@/lib/api/repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileViewerProps {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export function FileViewer({ owner, repo, branch, path }: FileViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadFileContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await repositoryApi.getFileContent(owner, repo, branch, path);

      // Decode content if base64
      if (response.encoding === 'base64') {
        setContent(atob(response.content));
      } else {
        setContent(response.content);
      }
    } catch (err) {
      setError('Failed to load file content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, branch, path]);

  useEffect(() => {
    loadFileContent();
  }, [loadFileContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  const lines = content.split('\n');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-mono">{path}</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="font-mono text-sm">
            {lines.map((line, index) => (
              <div key={index} className="flex hover:bg-muted/50">
                <div className="select-none text-muted-foreground px-4 py-1 text-right border-r min-w-12">
                  {index + 1}
                </div>
                <pre className="px-4 py-1 flex-1 overflow-x-auto">
                  <code>{line || ' '}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
