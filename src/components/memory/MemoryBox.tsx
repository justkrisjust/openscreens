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
import { useUIStore } from '../../stores/useUIStore';

export const MemoryBox: React.FC = () => {
  const {
    files,
    selectedFileId,
    selectFile,
    createVirtualFile,
    updateVirtualFileContent,
    deleteVirtualFileById,
    activeLocks,
    activeProject,
  } = useProjectStore();

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Memory Box Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-slate-200 tracking-wide uppercase font-mono">
            Shared Memory Box
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            ({files.length} virtual files)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCreatingFile(!isCreatingFile)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Create new virtual file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Download project as ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
            title="Run code in sandboxed preview iframe"
          >
            <Play className="w-3 h-3 fill-emerald-300" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form
          onSubmit={handleCreateFile}
          className="border-b border-slate-800 p-2.5 bg-slate-950 flex items-center gap-2 animate-in fade-in duration-150"
        >
          <input
            type="text"
            placeholder="filename.ext (e.g. style.css, spec.md)..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingFile(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Horizontal / Vertical File Tabs */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-2 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {files.map((file) => {
          const lockInfo = activeLocks[file.path.toLowerCase()];
          const isSelected = activeFile?.id === file.id;

          return (
            <button
              key={file.id}
              onClick={() => selectFile(file.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
                isSelected
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              {getFileIcon(file.path)}
              <span>{file.path}</span>
              {lockInfo && (
                <span
                  title={`Locked by ${lockInfo.botName} (busy, others wait)`}
                  className="flex items-center text-[10px] text-amber-400 ml-1 animate-pulse"
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
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          {/* Active File Metadata Bar */}
          <div className="px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-200">{activeFile.path}</span>
              {activeLocks[activeFile.path.toLowerCase()] ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
                  <Lock className="w-2.5 h-2.5" />
                  Locked by {activeLocks[activeFile.path.toLowerCase()].botName}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Unlocked</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeFile.path.endsWith('.md') && (
                <button
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
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
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
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
                className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={renderSanitizedMarkdown(activeFile.content)}
              />
            ) : (
              <textarea
                value={activeFile.content}
                onChange={(e) =>
                  updateVirtualFileContent(activeFile.id, e.target.value)
                }
                className="w-full h-full bg-transparent text-xs font-mono text-slate-200 resize-none focus:outline-none leading-relaxed"
                placeholder="Virtual file content..."
                spellCheck={false}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          No file selected.
        </div>
      )}
    </div>
  );
};
