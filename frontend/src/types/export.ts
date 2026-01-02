export interface ExportConfig {
  orientation: 'landscape';
  pageSize: 'a4';
  theme: 'light';
  scaling: 'auto-fit';
  header: {
    staffName: string;
    dateRange: string;
  };
}

export interface TimetableSnapshot {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

