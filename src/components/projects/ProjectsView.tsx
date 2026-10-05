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
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';

export const ProjectsView: React.FC = () => {
  const { projects, activeProject, selectProject, createProject, removeProject } = useProjectStore();
  const { bots } = useBotStore();
  const { setActiveView, showToast } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Project name required', 'warn');
      return;
    }
    if (!goal.trim()) {
      showToast('Project goal required', 'warn');
      return;
    }
    if (selectedBotIds.length === 0) {
      showToast('Please select at least 1 bot for this project', 'warn');
      return;
    }

    try {
      const proj = await createProject(name.trim(), goal.trim(), selectedBotIds);
      showToast(`Created project "${proj.name}"!`, 'success');
      setName('');
      setGoal('');
      setSelectedBotIds([]);
      setIsCreating(false);
      await selectProject(proj.id);
      setActiveView('office');
    } catch (e: unknown) {
      showToast(String(e), 'error');
    }
  };

  const toggleBotSelection = (botId: string) => {
    setSelectedBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Projects Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Group your bots to work cooperatively toward shared goals.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Define New Collaborative Project</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                placeholder="e.g. Minimalist Markdown Notes App, Crypto Ticker..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Shared Goal & Specifications
              </label>
              <textarea
                placeholder="Describe what the team of bots should build together..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                          ? 'bg-indigo-600/20 border-indigo-500 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: b.avatarColor }}
                      >
                        {b.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold">{b.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{b.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
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
          const isActive = activeProject?.id === proj.id;
          const assignedBots = bots.filter((b) => proj.botIds.includes(b.id));

          return (
            <div
              key={proj.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                isActive ? 'border-indigo-500/50 shadow-md shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-slate-100 text-sm">
                      {proj.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      proj.status === 'running'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : proj.status === 'completed'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {proj.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {proj.goal}
                </p>

                {/* Assigned bots avatar stack */}
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="text-[11px] text-slate-500 mr-1 font-mono">Team:</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {assignedBots.map((b) => (
                      <div
                        key={b.id}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 text-[10px] font-bold text-white flex items-center justify-center"
                        style={{ backgroundColor: b.avatarColor }}
                        title={`${b.name} (${b.role})`}
                      >
                        {b.name.slice(0, 1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={async () => {
                    await selectProject(proj.id);
                    setActiveView('office');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Open in Office</span>
                </button>

                {projects.length > 1 && (
                  <button
                    onClick={() => removeProject(proj.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
