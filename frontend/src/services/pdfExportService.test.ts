import { describe, it, expect, vi } from 'vitest';
import { calculateScaleFactor } from './pdfExportService';

describe('pdfExportService', () => {
  describe('calculateScaleFactor', () => {
    // A4 Landscape in points: 841.89 x 595.28
    const W_A4 = 841.89;
    const H_A4 = 595.28;

    it('should return 0 if width or height is 0', () => {
      expect(calculateScaleFactor(0, 500)).toBe(0);
      expect(calculateScaleFactor(500, 0)).toBe(0);
    });

    it('should scale based on width if width is the bottleneck', () => {
      // 1200x600 -> scale to fit 841.89 width
      // scaleW = 841.89 / 1200 = 0.701575
      // scaleH = 595.28 / 600 = 0.992133
      // Should pick 0.701575
      const w = 1200;
      const h = 600;
      const expected = W_A4 / w;
      expect(calculateScaleFactor(w, h)).toBeCloseTo(expected);
    });

    it('should scale based on height if height is the bottleneck', () => {
      // 800x800 -> scale to fit 595.28 height
      // scaleW = 841.89 / 800 = 1.0523
      // scaleH = 595.28 / 800 = 0.7441
      // Should pick 0.7441
      const w = 800;
      const h = 800;
      const expected = H_A4 / h;
      expect(calculateScaleFactor(w, h)).toBeCloseTo(expected);
    });

    it('should scale up if both dimensions are smaller than A4', () => {
      // 400x200 -> scale up
      // scaleW = 841.89 / 400 = 2.104
      // scaleH = 595.28 / 200 = 2.976
      // Should pick 2.104
      const w = 400;
      const h = 200;
      const expected = W_A4 / w;
      expect(calculateScaleFactor(w, h)).toBeCloseTo(expected);
    });
  });
});

