'use client';

import { useState } from 'react';
import { FileTree } from './FileTree';
import { FileViewer } from './FileViewer';
import { Card } from '@/components/ui/card';

interface CodeBrowserProps {
  owner: string;
  repo: string;
  branch: string;
}

export function CodeBrowser({ owner, repo, branch }: CodeBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      {/* File Tree */}
      <Card className="h-[600px] overflow-hidden">
        <FileTree owner={owner} repo={repo} branch={branch} onFileSelect={setSelectedFile} />
      </Card>

      {/* File Viewer */}
      <div className="h-[600px] overflow-auto">
        {selectedFile ? (
          <FileViewer owner={owner} repo={repo} branch={branch} path={selectedFile} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Select a file to view</p>
          </Card>
        )}
      </div>
    </div>
  );
}
