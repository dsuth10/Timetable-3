import { useState, useCallback, useRef } from 'react';
import { exportTimetableToPdf } from '../services/pdfExportService';

/**
 * A hook to manage the timetable PDF export process.
 * Provides a ref to attach to the export container and a function to trigger the export.
 */
export const useTimetableExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  // Ref to the hidden container that will be captured
  const exportRef = useRef<HTMLDivElement>(null);

  /**
   * Triggers the PDF export process.
   * @param filename The name of the file to save (without extension).
   */
  const handleExport = useCallback(async (filename: string) => {
    if (!exportRef.current) {
      console.warn('Export ref not attached to any element');
      return;
    }
    
    setIsExporting(true);
    try {
      // Ensure the filename has .pdf extension
      const fullFilename = filename.toLowerCase().endsWith('.pdf') 
        ? filename 
        : `${filename}.pdf`;
        
      // Small delay to ensure any internal React rendering or layout is complete
      await new Promise(resolve => setTimeout(resolve, 500));
        
      await exportTimetableToPdf(exportRef.current, fullFilename);
    } catch (error) {
      console.error('PDF Export failed:', error);
      throw error; // Re-throw to allow component to handle error (e.g. show toast)
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportRef,
    handleExport,
  };
};

