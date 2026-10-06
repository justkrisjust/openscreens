import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  Lock,
  Plus,
  Download,
  Play,
  Save,
  Trash2,
  Check,
  Eye,
  Edit3,
} from 'lucide-react';
import JSZip from 'jszip';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';

export const MemoryBox: React.FC = () => {
  const {
    files,
    selectedFileId,
    selectFile,
    createVirtualFile,
    updateVirtualFileContent,
    deleteVirtualFileById,
    assignFileToBot,
    unassignFile,
    activeLocks,
    activeProject,
  } = useProjectStore();

  const { bots } = useBotStore();

  const { setActiveView, showToast } = useUIStore();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(true);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      await createVirtualFile(newFileName.trim(), '');
      showToast(`Created virtual file "${newFileName}"`, 'success');
      setNewFileName('');
      setIsCreatingFile(false);
    } catch (e: unknown) {
      showToast(String(e), 'error');
    }
  };

  const handleDownloadZip = async () => {
    if (!activeProject || files.length === 0) {
      showToast('No files to export.', 'warn');
      return;
    }

    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.path, file.content);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Project files downloaded as ZIP!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate ZIP archive.', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
    return <FileCode className="w-3.5 h-3.5 text-emerald-400" />;
  };

  // Safe markdown render
  const renderSanitizedMarkdown = (content: string) => {
    const rawHtml = marked.parse(content || '') as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl flex flex-col h-full overflow-hidden shadow-sm transition-colors duration-200">
      {/* Memory Box Header */}
      <div className="border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold text-[var(--text-main)] tracking-wide uppercase font-mono">
            Shared Memory Box
          </h3>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            ({files.length} virtual files)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCreatingFile(!isCreatingFile)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Create new virtual file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-500 hover:bg-[var(--bg-elevated)] transition-colors"
            title="Download project as ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
            title="Run code in sandboxed preview iframe"
          >
            <Play className="w-3 h-3 fill-emerald-500 text-emerald-500" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form
          onSubmit={handleCreateFile}
          className="border-b border-[var(--border-subtle)] p-2.5 bg-[var(--bg-panel)] flex items-center gap-2 animate-in fade-in duration-150"
        >
          <input
            type="text"
            placeholder="filename.ext (e.g. style.css, spec.md)..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs rounded-lg px-2.5 py-1.5 text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingFile(false)}
            className="px-2 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Horizontal / Vertical File Tabs */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/60 px-2 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {files.map((file) => {
          const lockInfo = activeLocks[file.path.toLowerCase()];
          const isSelected = activeFile?.id === file.id;

          return (
            <button
              key={file.id}
              onClick={() => selectFile(file.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
                isSelected
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-subtle)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/40'
              }`}
            >
              {getFileIcon(file.path)}
              <span>{file.path}</span>
              {lockInfo && (
                <span
                  title={`Locked by ${lockInfo.botName} (busy, others wait)`}
                  className="flex items-center text-[10px] text-amber-500 ml-1 animate-pulse"
                >
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* File Editor / Viewer Area */}
      {activeFile ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-card)]">
          {/* Active File Metadata Bar */}
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-panel)]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[var(--text-main)] font-semibold">{activeFile.path}</span>
              {activeLocks[activeFile.path.toLowerCase()] ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    Locked: {activeLocks[activeFile.path.toLowerCase()].botName}
                  </span>
                  <button
                    onClick={async () => {
                      await unassignFile(activeFile.id);
                      showToast(`Unassigned ${activeFile.path}`, 'info');
                    }}
                    className="text-[10px] text-rose-500 hover:underline font-mono"
                    title="Release lock and relieve bot"
                  >
                    (Release)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Assign to:</span>
                  <select
                    value=""
                    onChange={async (e) => {
                      const botId = e.target.value;
                      if (botId) {
                        const targetBot = bots.find((b) => b.id === botId);
                        if (targetBot) {
                          await assignFileToBot(activeFile.id, targetBot.id, targetBot.name);
                          showToast(`Assigned ${activeFile.path} to ${targetBot.name}!`, 'success');
                        }
                      }
                    }}
                    className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] rounded px-1.5 py-0.5 text-[var(--text-main)] font-mono focus:border-emerald-500"
                  >
                    <option value="">Choose bot...</option>
                    {bots.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeFile.path.endsWith('.md') && (
                <button
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-panel)] text-[11px] text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors"
                >
                  {previewMarkdown ? (
                    <>
                      <Edit3 className="w-3 h-3" /> Edit Raw
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Preview Render
                    </>
                  )}
                </button>
              )}

              {files.length > 1 && (
                <button
                  onClick={() => deleteVirtualFileById(activeFile.id)}
                  className="p-1 text-[var(--text-faint)] hover:text-rose-500 transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeFile.path.endsWith('.md') && previewMarkdown ? (
              <div
                className="prose prose-xs max-w-none text-[var(--text-main)] leading-relaxed"
                dangerouslySetInnerHTML={renderSanitizedMarkdown(activeFile.content)}
              />
            ) : (
              <textarea
                value={activeFile.content}
                onChange={(e) =>
                  updateVirtualFileContent(activeFile.id, e.target.value)
                }
                className="w-full h-full bg-transparent text-xs font-mono text-[var(--text-main)] resize-none focus:outline-none leading-relaxed"
                placeholder="Virtual file content..."
                spellCheck={false}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)]">
          No file selected.
        </div>
      )}
    </div>
  );
};
