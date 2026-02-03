
import * as XLSX from 'xlsx';
import { ExcelData, ColumnMapping } from '../types';

export const readExcel = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          throw new Error("فایل اکسل خالی است");
        }

        const headers = jsonData[0].map(h => String(h || '').trim());
        const rows = jsonData.slice(1);

        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const generateMappedExcel = (
  templateHeaders: string[],
  sourceData: ExcelData,
  mappings: ColumnMapping[]
): void => {
  // Create a map for quick lookup: sourceHeaderName -> index in source rows
  const sourceHeaderToIndex = new Map<string, number>();
  sourceData.headers.forEach((h, idx) => sourceHeaderToIndex.set(h, idx));

  // Build the new rows based on template structure
  const resultRows = sourceData.rows.map(sourceRow => {
    return templateHeaders.map(tHeader => {
      const mapping = mappings.find(m => m.templateHeader === tHeader);
      if (mapping && mapping.sourceHeader) {
        const sourceIndex = sourceHeaderToIndex.get(mapping.sourceHeader);
        return sourceIndex !== undefined ? sourceRow[sourceIndex] : "";
      }
      return "";
    });
  });

  // Include headers at the top
  const finalData = [templateHeaders, ...resultRows];

  // Create workbook
  const worksheet = XLSX.utils.aoa_to_sheet(finalData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MappedData");

  // Export
  XLSX.writeFile(workbook, "smart_mapped_excel.xlsx");
};
