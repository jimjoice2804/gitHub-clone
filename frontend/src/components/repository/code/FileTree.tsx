'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Loader2,
} from 'lucide-react';
import { repositoryApi } from '@/lib/api/repository';
import { FileEntry } from '@/lib/types';

interface FileTreeProps {
  owner: string;
  repo: string;
  branch: string;
  onFileSelect: (path: string) => void;
}

interface TreeNode extends FileEntry {
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

export function FileTree({ owner, repo, branch, onFileSelect }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRootTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await repositoryApi.getFileTree(owner, repo, branch, '');
      setTree(response.entries.map((entry) => ({ ...entry })));
    } catch (err) {
      setError('Failed to load file tree');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, branch]);

  useEffect(() => {
    loadRootTree();
  }, [loadRootTree]);

  const loadSubTree = async (node: TreeNode) => {
    try {
      // Mark node as loading
      updateNodeState(node.path, { isLoading: true });

      const response = await repositoryApi.getFileTree(owner, repo, branch, node.path);

      // Update node with children
      updateNodeState(node.path, {
        children: response.entries,
        isExpanded: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load subtree:', err);
      updateNodeState(node.path, { isLoading: false });
    }
  };

  const updateNodeState = (path: string, updates: Partial<TreeNode>) => {
    setTree((prevTree) => updateTreeNode(prevTree, path, updates));
  };

  const updateTreeNode = (
    nodes: TreeNode[],
    targetPath: string,
    updates: Partial<TreeNode>
  ): TreeNode[] => {
    return nodes.map((node) => {
      if (node.path === targetPath) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateTreeNode(node.children, targetPath, updates) };
      }
      return node;
    });
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'file') {
      onFileSelect(node.path);
    } else {
      // Directory
      if (node.isExpanded) {
        // Collapse
        updateNodeState(node.path, { isExpanded: false });
      } else {
        // Expand - load children if not already loaded
        if (!node.children) {
          loadSubTree(node);
        } else {
          updateNodeState(node.path, { isExpanded: true });
        }
      }
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isDirectory = node.type === 'directory';
    const isExpanded = node.isExpanded || false;
    const isLoading = node.isLoading || false;

    return (
      <div key={node.path}>
        <button
          onClick={() => handleNodeClick(node)}
          className="w-full flex items-center gap-2 px-2 py-1 hover:bg-muted/50 text-sm text-left"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isDirectory && (
            <span className="shrink-0">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </span>
          )}
          <span className="shrink-0">
            {isDirectory ? (
              isExpanded ? (
                <FolderOpenIcon className="h-4 w-4" />
              ) : (
                <FolderIcon className="h-4 w-4" />
              )
            ) : (
              <FileIcon className="h-4 w-4" />
            )}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {isDirectory && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-destructive">{error}</div>;
  }

  if (tree.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No files found</div>;
  }

  return <div className="overflow-y-auto">{tree.map((node) => renderNode(node))}</div>;
}
