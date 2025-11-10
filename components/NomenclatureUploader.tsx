import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon, CheckCircleIcon, XCircleIcon, TableIcon } from './Icons';

// Declare XLSX to inform TypeScript that it's available globally from the script tag
declare const XLSX: any;

interface NomenclatureUploaderProps {
  onNomenclatureUpload: (content: string) => void;
  existingNomenclature?: string;
}

const NomenclatureUploader: React.FC<NomenclatureUploaderProps> = ({ onNomenclatureUpload, existingNomenclature }) => {
  const [previewData, setPreviewData] = useState<{headers: string[], rows: (string|number)[][]} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndSetPreview = (content: string, sourceFileName: string) => {
    try {
        const workbook = XLSX.read(content, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!json || json.length < 2) throw new Error("File must contain a header row and at least one data row.");
        const parsedForPreview = { headers: json[0] || [], rows: json.slice(1) || [] };
        if (parsedForPreview.rows.length === 0) {
            throw new Error("The file seems to be empty or in an incorrect format.");
        }
        setPreviewData(parsedForPreview);
        setError(null);
        setFileName(sourceFileName);
    } catch (err: any) {
        setError("Could not parse existing nomenclature for preview.");
        setPreviewData(null);
    }
  };

  useEffect(() => {
    if (existingNomenclature) {
      parseAndSetPreview(existingNomenclature, 'Saved Nomenclature');
    } else {
        setPreviewData(null);
        setError(null);
        setFileName('');
    }
  }, [existingNomenclature]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setPreviewData(null);
      setError(null);

      const reader = new FileReader();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      reader.onload = (e) => {
        try {
            let fileContentString: string;
            
            if (fileExtension === 'csv') {
                fileContentString = e.target?.result as string;
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const data = e.target?.result as ArrayBuffer;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                fileContentString = XLSX.utils.sheet_to_csv(worksheet);
            } else {
                throw new Error("Unsupported file format. Please upload a CSV or Excel file.");
            }
            
            onNomenclatureUpload(fileContentString);
            parseAndSetPreview(fileContentString, file.name);

        } catch (err: any) {
          setError(err.message);
          setPreviewData(null);
          onNomenclatureUpload('');
        }
      };

      reader.onerror = () => {
        setError("Failed to read the file.");
        setPreviewData(null);
        onNomenclatureUpload('');
      }

      if (fileExtension === 'csv') {
        reader.readAsText(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        reader.readAsArrayBuffer(file);
      } else {
        setError("Unsupported file format. Please upload a CSV or Excel file.");
        onNomenclatureUpload('');
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if(fileInputRef.current) {
            fileInputRef.current.files = e.dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInputRef.current.dispatchEvent(event);
        }
    }
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center mb-4">
            <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg">1</div>
            <h2 className="ml-4 text-xl font-semibold text-slate-700">Upload Nomenclature</h2>
        </div>
      <p className="text-slate-500 mb-4 text-sm">Upload a CSV or Excel file with your product list. The AI will automatically understand its structure. This will be saved for the selected warehouse.</p>
      
      <label 
        htmlFor="nomenclature-upload"
        className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="flex items-center space-x-2">
            <UploadIcon className="w-6 h-6 text-slate-500" />
            <span className="font-medium text-slate-600">
                Drop files to attach, or <span className="text-indigo-600 underline">browse</span> to replace
            </span>
        </span>
        <input 
            ref={fileInputRef}
            id="nomenclature-upload" 
            type="file" 
            accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden" 
        />
      </label>

      {error && (
        <div className="mt-4 flex items-center p-3 bg-red-50 text-red-700 rounded-lg">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span>{error}</span>
        </div>
      )}

      {previewData && (
        <div className="mt-4 flex items-center p-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span>Successfully loaded {previewData.rows.length} products from <strong>{fileName}</strong>. You can now proceed to step 2.</span>
        </div>
      )}

      {previewData && (
          <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-600 flex items-center"><TableIcon className="w-4 h-4 mr-2"/> Nomenclature Preview</h3>
              <div className="max-h-40 overflow-y-auto mt-2 border rounded-lg">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                        <tr>
                            {previewData.headers.map((header, index) => (
                                <th scope="col" key={index} className="px-4 py-2">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                             <tr key={rowIndex} className="bg-white border-b">
                                {row.map((cell, cellIndex) => (
                                     <td key={cellIndex} className="px-4 py-2 font-medium text-slate-900 truncate max-w-xs">{String(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
               {previewData.rows.length > 5 && <p className="text-xs text-right text-slate-400 mt-1">Showing 5 of {previewData.rows.length} items...</p>}
          </div>
      )}
    </div>
  );
};

export default NomenclatureUploader;