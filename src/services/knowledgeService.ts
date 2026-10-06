import type { KnowledgeItem } from './storage';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function detectFileType(fileName: string): KnowledgeItem['type'] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (lower.endsWith('.txt')) return 'text';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.svg')) return 'image';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.html') || lower.endsWith('.css')) return 'code';
  return 'text';
}

/**
 * Access local folder directly on user's machine using the File System Access API
 * User explicitly grants permission. Removes the 100MB browser limit!
 */
export async function pickLocalDirectory(projectId: string): Promise<{ folderPath: string; items: KnowledgeItem[] }> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API is not supported in this browser. Please use the manual file uploader.');
  }

  // Request directory picker from user
  const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
  const folderName = dirHandle.name;
  const items: KnowledgeItem[] = [];

  // Recursively read text, markdown, pdf, images up to 2 levels
  async function readDirectory(handle: FileSystemDirectoryHandle, currentPath: string, depth = 0) {
    if (depth > 2) return;
    for await (const entry of (handle as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const type = detectFileType(file.name);
        
        let content: string | undefined = undefined;
        // Read text/markdown/json files under 500KB into content for immediate bot retrieval
        if ((type === 'markdown' || type === 'text' || type === 'json' || type === 'code') && file.size < 500 * 1024) {
          content = await file.text();
        }

        items.push({
          id: `kb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          projectId,
          name: file.name,
          type,
          size: file.size,
          path: `${currentPath}/${file.name}`,
          content,
          updatedAt: Date.now(),
        });
      } else if (entry.kind === 'directory' && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await readDirectory(entry as FileSystemDirectoryHandle, `${currentPath}/${entry.name}`, depth + 1);
      }
    }
  }

  await readDirectory(dirHandle, folderName, 0);

  return {
    folderPath: folderName,
    items,
  };
}

/**
 * Read uploaded files via standard browser file picker
 */
export async function readUploadedFiles(projectId: string, files: FileList | File[]): Promise<KnowledgeItem[]> {
  const items: KnowledgeItem[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const type = detectFileType(file.name);
    let content: string | undefined = undefined;

    if ((type === 'markdown' || type === 'text' || type === 'json' || type === 'code') && file.size < 1024 * 1024) {
      content = await file.text();
    }

    items.push({
      id: `kb-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      name: file.name,
      type,
      size: file.size,
      path: file.name,
      content,
      updatedAt: Date.now(),
    });
  }

  return items;
}

/**
 * Compiles a compact, token-efficient knowledge context string for injecting into bot prompts
 */
export function buildKnowledgeContextPrompt(knowledgeBase?: KnowledgeItem[]): string {
  if (!knowledgeBase || knowledgeBase.length === 0) return '';

  const manifest = knowledgeBase
    .map((k) => `- [${k.type.toUpperCase()}] ${k.name} (${formatFileSize(k.size)})`)
    .join('\n');

  // Include excerpts of markdown and text files
  const excerpts = knowledgeBase
    .filter((k) => k.content && (k.type === 'markdown' || k.type === 'text'))
    .slice(0, 3)
    .map((k) => `--- Excerpt: ${k.name} ---\n${(k.content || '').slice(0, 600)}...`)
    .join('\n\n');

  return `\n\nPROJECT KNOWLEDGE BASE (Refer to these documents for consistency):\n${manifest}\n\n${excerpts}\n`;
}
