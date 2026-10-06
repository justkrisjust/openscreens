import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Play,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  Folder,
  FileText,
  FileCode,
  File,
  X,
  Upload,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';
import { BotFace } from '../office/BotFace';
import type { KnowledgeItem } from '../../services/storage';
import {
  pickLocalDirectory,
  readUploadedFiles,
  formatFileSize,
} from '../../services/knowledgeService';

export const ProjectsView: React.FC = () => {
  const { projects, activeProject, selectProject, createProject, removeProject } = useProjectStore();
  const { bots } = useBotStore();
  const { setActiveView, showToast } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [localFolder, setLocalFolder] = useState<string | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Project name required', 'warn');
      return;
    }
    if (!goal.trim()) {
      showToast('Shared goal required', 'warn');
      return;
    }
    if (selectedBotIds.length === 0) {
      showToast('Please assign at least one bot to the project', 'warn');
      return;
    }

    try {
      await createProject(
        name.trim(),
        goal.trim(),
        selectedBotIds,
        knowledgeItems,
        localFolder || undefined
      );
      showToast(`Created collaborative project "${name}"!`, 'success');
      setName('');
      setGoal('');
      setSelectedBotIds([]);
      setKnowledgeItems([]);
      setLocalFolder(null);
      setIsCreating(false);
      setActiveView('office');
    } catch (e: unknown) {
      showToast(String(e), 'error');
    }
  };

  const handlePickFolder = async () => {
    setIsLoadingFolder(true);
    try {
      const res = await pickLocalDirectory('temp');
      setLocalFolder(res.folderPath);
      setKnowledgeItems((prev) => [...prev, ...res.items]);
      showToast(`Linked local folder "${res.folderPath}" with ${res.items.length} files!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('aborted') && !msg.includes('cancel')) {
        showToast(msg, 'warn');
      }
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const items = await readUploadedFiles('temp', e.target.files);
      setKnowledgeItems((prev) => [...prev, ...items]);
      showToast(`Added ${items.length} knowledge files!`, 'success');
    } catch (err) {
      showToast('Failed to process uploaded files', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const toggleBotSelection = (botId: string) => {
    setSelectedBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            Projects Workspace
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {projects.length} Projects
            </span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Group your bots to work cooperatively toward shared goals with shared project knowledge.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 mb-8 shadow-sm animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Define New Collaborative Project</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                placeholder="e.g. Minimalist Markdown Notes App, Weather Dashboard..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                Shared Goal & Specifications
              </label>
              <textarea
                placeholder="Describe what the team of bots should build together..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2 text-[var(--text-main)] focus:outline-none focus:border-emerald-500 leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                Select Team Bots ({selectedBotIds.length} selected)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {bots.map((b) => {
                  const isSelected = selectedBotIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBotSelection(b.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-main)]'
                          : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="shrink-0">
                        <BotFace
                          shape={b.avatarShape || 'squircle'}
                          color={b.avatarColor}
                          status={b.status}
                          size={32}
                          showEmoteBadge={false}
                        />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold">{b.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] capitalize">{b.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Knowledge Base & Local Docs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[var(--text-main)] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Project Knowledge Base & Local Docs</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    (Markdowns, PDFs, Specs, Images)
                  </span>
                </label>
                {localFolder && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <Folder className="w-3 h-3" /> Linked: {localFolder}
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] space-y-3">
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Provide reference knowledge for bots to visit so specifications, guidelines, and logic remain consistent across every turn.
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePickFolder}
                    disabled={isLoadingFolder}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isLoadingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Link Local PC Folder (No 100MB Limit)</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] transition-colors cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Upload Docs (.md, .pdf, images)</span>
                    <input
                      type="file"
                      multiple
                      accept=".md,.txt,.pdf,.json,.png,.jpg,.jpeg,.svg,.ts,.js,.html,.css"
                      onChange={handleUploadFiles}
                      className="hidden"
                    />
                  </label>
                </div>

                {knowledgeItems.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {knowledgeItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-[var(--bg-card)] rounded-lg text-xs font-mono border border-[var(--border-subtle)]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-muted)] uppercase font-semibold">
                            {item.type}
                          </span>
                          <span className="text-[var(--text-main)] truncate max-w-xs">{item.name}</span>
                          <span className="text-[var(--text-faint)] text-[10px]">({formatFileSize(item.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setKnowledgeItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-[var(--text-faint)] hover:text-rose-500 transition-colors p-1"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                Create Project
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const assignedBots = bots.filter((b) => proj.botIds.includes(b.id));
          const isActive = activeProject?.id === proj.id;
          const kbCount = proj.knowledgeBase?.length || 0;

          return (
            <div
              key={proj.id}
              className={`bg-[var(--bg-card)] border rounded-2xl p-5 transition-all flex flex-col justify-between shadow-sm ${
                isActive
                  ? 'border-emerald-500/60 shadow-md shadow-emerald-500/10'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-main)]">{proj.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                        <span className="font-mono">Turns: {proj.currentTurn} / {proj.maxTurns}</span>
                        <span>•</span>
                        <span className="capitalize">{proj.status}</span>
                      </div>
                    </div>
                  </div>

                  {projects.length > 1 && (
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
                  {proj.goal}
                </p>

                {/* Knowledge Base pill if present */}
                {(kbCount > 0 || proj.localFolderPath) && (
                  <div className="mb-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <BookOpen className="w-3 h-3" />
                    <span>
                      {proj.localFolderPath ? `Linked Folder: ${proj.localFolderPath}` : `${kbCount} Knowledge Files`}
                    </span>
                  </div>
                )}

                {/* Assigned bots avatar stack */}
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="text-[11px] text-[var(--text-muted)] mr-1 font-mono">Team:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {assignedBots.map((b) => (
                      <div
                        key={b.id}
                        className="shrink-0"
                        title={`${b.name} (${b.role})`}
                      >
                        <BotFace
                          shape={b.avatarShape || 'squircle'}
                          color={b.avatarColor}
                          status={b.status}
                          size={24}
                          showEmoteBadge={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <button
                  onClick={async () => {
                    await selectProject(proj.id);
                    setActiveView('office');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? 'View in Office' : 'Open in Office'}</span>
                </button>
                {isActive && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
