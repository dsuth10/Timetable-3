import { calculateScaleFactor } from '../../src/services/pdfExportService';
import { describe, it, expect } from 'vitest';

describe('pdfExportService scaling logic', () => {
  it('should calculate correct scale factor for A4 landscape', () => {
    // A4 Landscape in points: 841.89 x 595.28
    const w_pdf = 841.89;
    const h_pdf = 595.28;

    // Case 1: Canvas is larger than PDF
    const w_canvas = 1683.78; // 2x w_pdf
    const h_canvas = 1190.56; // 2x h_pdf
    // Scale factor should be 0.5 to fit
    expect(calculateScaleFactor(w_canvas, h_canvas)).toBeCloseTo(0.5);

    // Case 2: Canvas is smaller than PDF
    const w_canvas2 = 420.945; // 0.5x w_pdf
    const h_canvas2 = 297.64;  // 0.5x h_pdf
    // Scale factor should be 2.0 to fit
    expect(calculateScaleFactor(w_canvas2, h_canvas2)).toBeCloseTo(2.0);

    // Case 3: Aspect ratio differs (wider)
    const w_canvas3 = 1000;
    const h_canvas3 = 500;
    // w_pdf / 1000 = 0.84189
    // h_pdf / 500 = 1.19056
    // min should be 0.84189
    expect(calculateScaleFactor(w_canvas3, h_canvas3)).toBeCloseTo(0.84189);

    // Case 4: Aspect ratio differs (taller)
    const w_canvas4 = 500;
    const h_canvas4 = 1000;
    // w_pdf / 500 = 1.68378
    // h_pdf / 1000 = 0.59528
    // min should be 0.59528
    expect(calculateScaleFactor(w_canvas4, h_canvas4)).toBeCloseTo(0.59528);
  });
});

