import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimetableExport } from '../../hooks/useTimetableExport';
import * as pdfService from '../../services/pdfExportService';

// Mock html2canvas and jspdf since they won't work in JSDOM
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 1200,
    height: 800,
    toDataURL: () => 'data:image/png;base64,mock',
  }),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

describe('useTimetableExport integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers the export process correctly', async () => {
    // We need a real DOM element for the ref
    const div = document.createElement('div');
    div.id = 'timetable-export-view';
    document.body.appendChild(div);

    const { result } = renderHook(() => useTimetableExport());

    // Manually attach the ref
    (result.current.exportRef as any).current = div;

    await act(async () => {
      await result.current.handleExport('test-timetable');
    });

    expect(result.current.isExporting).toBe(false);
    
    // Verify pdfExportService was called (indirectly via handleExport)
    // Since handleExport calls exportTimetableToPdf, which is imported from pdfExportService,
    // we can spy on the exportTimetableToPdf function if we didn't mock the whole module.
    // However, it's better to verify the side effects (html2canvas and jsPDF calls).
    
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    
    expect(html2canvas).toHaveBeenCalledWith(div, expect.any(Object));
    expect(jsPDF).toHaveBeenCalled();
    
    const pdfInstance = vi.mocked(jsPDF).mock.results[0].value;
    expect(pdfInstance.save).toHaveBeenCalledWith('test-timetable.pdf');

    document.body.removeChild(div);
  });

  it('handles missing ref gracefully', async () => {
    const { result } = renderHook(() => useTimetableExport());
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.handleExport('test-timetable');
    });

    expect(warnSpy).toHaveBeenCalledWith('Export ref not attached to any element');
    expect(result.current.isExporting).toBe(false);
    
    warnSpy.mockRestore();
  });
});

