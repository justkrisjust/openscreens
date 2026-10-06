import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Play,
  Trash2,
  Edit3,
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
import type { KnowledgeItem, Project } from '../../services/storage';
import {
  pickLocalDirectory,
  readUploadedFiles,
  formatFileSize,
} from '../../services/knowledgeService';

export const ProjectsView: React.FC = () => {
  const { projects, activeProject, selectProject, createProject, updateProject, removeProject } = useProjectStore();
  const { bots } = useBotStore();
  const { setActiveView, showToast } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [localFolder, setLocalFolder] = useState<string | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  // Edit Project State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editBotIds, setEditBotIds] = useState<string[]>([]);
  const [editMaxTurns, setEditMaxTurns] = useState<number>(15);
  const [editKnowledgeItems, setEditKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [editLocalFolder, setEditLocalFolder] = useState<string | null>(null);
  const [isEditLoadingFolder, setIsEditLoadingFolder] = useState(false);

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditGoal(proj.goal);
    setEditBotIds([...proj.botIds]);
    setEditMaxTurns(proj.maxTurns || 15);
    setEditKnowledgeItems([...(proj.knowledgeBase || [])]);
    setEditLocalFolder(proj.localFolderPath || null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editName.trim()) {
      showToast('Project name required', 'warn');
      return;
    }
    if (!editGoal.trim()) {
      showToast('Shared goal required', 'warn');
      return;
    }
    if (editBotIds.length === 0) {
      showToast('Please assign at least one bot to the project', 'warn');
      return;
    }

    try {
      await updateProject(editingProject.id, {
        name: editName.trim(),
        goal: editGoal.trim(),
        botIds: editBotIds,
        maxTurns: editMaxTurns,
        knowledgeBase: editKnowledgeItems,
        localFolderPath: editLocalFolder || undefined,
      });
      showToast(`Project "${editName}" updated successfully!`, 'success');
      setEditingProject(null);
    } catch (err: unknown) {
      showToast(String(err), 'error');
    }
  };

  const handleEditPickFolder = async () => {
    setIsEditLoadingFolder(true);
    try {
      const res = await pickLocalDirectory(editingProject?.id || 'temp');
      setEditLocalFolder(res.folderPath);
      setEditKnowledgeItems((prev) => [...prev, ...res.items]);
      showToast(`Linked folder "${res.folderPath}" with ${res.items.length} files!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('aborted') && !msg.includes('cancel')) {
        showToast(msg, 'warn');
      }
    } finally {
      setIsEditLoadingFolder(false);
    }
  };

  const handleEditUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const items = await readUploadedFiles(editingProject?.id || 'temp', e.target.files);
      setEditKnowledgeItems((prev) => [...prev, ...items]);
      showToast(`Added ${items.length} knowledge files!`, 'success');
    } catch (err) {
      showToast('Failed to process uploaded files', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const toggleEditBotSelection = (botId: string) => {
    setEditBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

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
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-card)]/50 p-8 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-4 text-2xl">
              📁
            </div>
            <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">No Projects Found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
              All project offices and memory vaults are closed on the canvas. Create a project to open the vault and assign bots.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Create First Project
            </button>
          </div>
        ) : (
          projects.map((proj) => {
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(proj)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 rounded-lg transition-colors"
                        title="Edit project settings, bots, and knowledge"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete project "${proj.name}"?`)) {
                            removeProject(proj.id);
                          }
                        }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
        }))}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)] font-heading">
                    Edit Project: {editingProject.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Update goal, turn limits, assigned bots, and knowledge base.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">
                  Shared Project Goal / Vision
                </label>
                <textarea
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">
                  Max Turns (Milestone limit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={editMaxTurns}
                  onChange={(e) => setEditMaxTurns(Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-32 px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Bot Team Selection */}
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-2">
                  Assigned Team Bots ({editBotIds.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {bots.map((bot) => {
                    const isSelected = editBotIds.includes(bot.id);
                    return (
                      <div
                        key={bot.id}
                        onClick={() => toggleEditBotSelection(bot.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-main)]'
                            : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <BotFace
                          shape={bot.avatarShape || 'squircle'}
                          color={bot.avatarColor}
                          status={bot.status}
                          size={28}
                          showEmoteBadge={false}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate text-[var(--text-main)]">
                            {bot.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] capitalize truncate">
                            {bot.role} • {bot.provider}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by div onClick
                          className="w-4 h-4 text-emerald-600 rounded border-[var(--border-subtle)] focus:ring-emerald-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Knowledge Base in Edit Modal */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    Knowledge Base ({editKnowledgeItems.length} items)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer px-2.5 py-1 text-[11px] bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleEditUploadFiles}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleEditPickFolder}
                      disabled={isEditLoadingFolder}
                      className="px-2.5 py-1 text-[11px] bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1"
                    >
                      {isEditLoadingFolder ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Folder className="w-3 h-3" />
                      )}
                      <span>Folder</span>
                    </button>
                  </div>
                </div>

                {editKnowledgeItems.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-[var(--bg-panel)] p-2 rounded-xl border border-[var(--border-subtle)]">
                    {editKnowledgeItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-[11px] font-mono text-[var(--text-main)] p-1 rounded hover:bg-[var(--bg-card)]"
                      >
                        <span className="truncate max-w-[280px]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatFileSize(item.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditKnowledgeItems((prev) =>
                                prev.filter((i) => i.id !== item.id)
                              )
                            }
                            className="text-[var(--text-muted)] hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
