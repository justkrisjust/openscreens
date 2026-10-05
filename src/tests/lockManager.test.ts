import { describe, it, expect, beforeEach } from 'vitest';
import { lockManager } from '../services/lockManager';

describe('Virtual File Lock Manager', () => {
  const projectId = 'test-project-1';

  beforeEach(() => {
    lockManager.clearAll();
  });

  it('allows a bot to acquire a lock on an unlocked file', () => {
    const res = lockManager.acquireLock(projectId, 'plan.md', 'bot-larry', 'Larry');
    expect(res.success).toBe(true);
    expect(res.isOwner).toBe(true);
    expect(res.busy).toBe(false);
    expect(lockManager.isLocked(projectId, 'plan.md')).toBe(true);
  });

  it('rejects a second bot with busy status when file is locked', () => {
    // Larry acquires first
    lockManager.acquireLock(projectId, 'index.html', 'bot-larry', 'Larry');

    // Ada tries to acquire same file
    const res = lockManager.acquireLock(projectId, 'index.html', 'bot-ada', 'Ada');
    expect(res.success).toBe(false);
    expect(res.busy).toBe(true);
    expect(res.message).toContain('busy, pick another task');
    expect(res.heldBy?.botName).toBe('Larry');
  });

  it('supports re-entrant locks for the same holding bot', () => {
    lockManager.acquireLock(projectId, 'style.css', 'bot-milo', 'Milo');
    const secondAcquire = lockManager.acquireLock(projectId, 'style.css', 'bot-milo', 'Milo');
    expect(secondAcquire.success).toBe(true);
    expect(secondAcquire.isOwner).toBe(true);
  });

  it('releases lock cleanly and allows subsequent bot acquisition', () => {
    lockManager.acquireLock(projectId, 'app.js', 'bot-ada', 'Ada');
    const released = lockManager.releaseLock(projectId, 'app.js', 'bot-ada');
    expect(released).toBe(true);
    expect(lockManager.isLocked(projectId, 'app.js')).toBe(false);

    // Now Larry can acquire it
    const res = lockManager.acquireLock(projectId, 'app.js', 'bot-larry', 'Larry');
    expect(res.success).toBe(true);
  });

  it('releases all files held by a bot when bot takes a break', () => {
    lockManager.acquireLock(projectId, 'file1.md', 'bot-larry', 'Larry');
    lockManager.acquireLock(projectId, 'file2.md', 'bot-larry', 'Larry');
    lockManager.acquireLock(projectId, 'file3.md', 'bot-ada', 'Ada');

    const released = lockManager.releaseAllForBot(projectId, 'bot-larry');
    expect(released.length).toBe(2);
    expect(lockManager.isLocked(projectId, 'file1.md')).toBe(false);
    expect(lockManager.isLocked(projectId, 'file2.md')).toBe(false);
    expect(lockManager.isLocked(projectId, 'file3.md')).toBe(true);
  });
});
