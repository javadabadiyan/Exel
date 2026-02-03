
export interface ExcelHeader {
  index: number;
  name: string;
}

export interface ColumnMapping {
  templateHeader: string;
  sourceHeader: string;
  confidence: number;
  reason?: string;
}

export interface ExcelData {
  headers: string[];
  rows: any[][];
}

export enum Step {
  UPLOAD = 'UPLOAD',
  MAPPING = 'MAPPING',
  PREVIEW = 'PREVIEW',
  DOWNLOAD = 'DOWNLOAD'
}
