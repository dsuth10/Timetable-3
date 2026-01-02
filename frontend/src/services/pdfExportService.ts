import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// A4 Landscape in points: 297mm x 210mm
// 1mm = 2.83465 points
// 297 * 2.83465 = 841.89
// 210 * 2.83465 = 595.28
const W_A4_LANDSCAPE = 841.89;
const H_A4_LANDSCAPE = 595.28;

/**
 * Calculates the scale factor required to fit a canvas of given dimensions
 * into an A4 landscape page while preserving aspect ratio.
 */
export const calculateScaleFactor = (w_canvas: number, h_canvas: number): number => {
  if (w_canvas === 0 || h_canvas === 0) return 0;
  const scaleW = W_A4_LANDSCAPE / w_canvas;
  const scaleH = H_A4_LANDSCAPE / h_canvas;
  // Use the smaller scale factor to ensure it fits both width and height
  return Math.min(scaleW, scaleH);
};

/**
 * Captures an HTML element as an image and exports it to a single-page A4 landscape PDF.
 */
export const exportTimetableToPdf = async (element: HTMLElement, filename: string) => {
  // Capture the element using html2canvas
  const canvas = await html2canvas(element, {
    scale: 2, // High fidelity capture
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff', // Ensure white background for the capture
  });

  const scaleFactor = calculateScaleFactor(canvas.width, canvas.height);
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const imgData = canvas.toDataURL('image/png');
  
  // Calculate scaled dimensions
  const imgWidth = canvas.width * scaleFactor;
  const imgHeight = canvas.height * scaleFactor;
  
  // Center on page
  const x = (W_A4_LANDSCAPE - imgWidth) / 2;
  const y = (H_A4_LANDSCAPE - imgHeight) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(filename);
};
