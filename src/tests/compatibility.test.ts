import { describe, it, expect } from 'vitest';
import { runFullCompatibilityCheck } from '../services/compatibility';
import { DEMO_BOTS } from '../services/demoData';

describe('Compatibility Suite Engine', () => {
  it(
    'runs 4-stage test across demo bots and produces accurate derived metrics',
    async () => {
      const report = await runFullCompatibilityCheck(
        DEMO_BOTS.slice(0, 2),
        () => 'mock-token'
      );

      expect(report.botReports.length).toBe(2);
      expect(report.canStart).toBe(true);
      expect(report.hasHardFailures).toBe(false);
      expect(report.overallScorePercent).toBeGreaterThanOrEqual(80);

      // Check individual test steps
      for (const b of report.botReports) {
        expect(b.steps.length).toBe(3);
        expect(b.steps.every((s) => s.status === 'pass' || s.status === 'warn')).toBe(true);
      }

      // Check handshake
      expect(report.handshakeReport).toBeDefined();
      expect(report.handshakeReport?.status).toBe('pass');
      expect(report.handshakeReport?.suggestion).toContain('handshake successful');
    },
    20000 // 20s timeout for multi-step mock simulation
  );
});
