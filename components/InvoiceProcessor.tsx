


import React, { useRef, useMemo, useState, useEffect } from 'react';
import type { InvoiceItem, Product, Plan, ExportColumn } from '../types';
import type { UploadedFile } from '../App';
import DataTable from './DataTable';
import Spinner from './Spinner';
import InvoiceViewer from './InvoiceViewer';
import { UploadIcon, XCircleIcon, DocumentMagnifyingGlassIcon, FileDocumentIcon, DownloadIcon, TableCellsIcon, ShieldExclamationIcon, Cog8ToothIcon } from './Icons';
import ExportConfigModal from './ExportConfigModal';

// Declare XLSX to inform TypeScript that it's available globally
declare const XLSX: any;

interface InvoiceProcessorProps {
  nomenclatureLoaded: boolean;
  onFilesUpload: (files: FileList) => void;
  onProcessInvoices: () => Promise<void>;
  onReset: () => void;
  uploadedFiles: UploadedFile[];
  invoiceData: InvoiceItem[] | null;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  onUpdateItem: (itemId: string, updatedFields: Partial<InvoiceItem>) => void;
  productList: Product[];
  plan: Plan;
  invoiceCount: number;
  onUpgrade: () => void;
  exportConfig: ExportColumn[];
  onExportConfigChange: (newConfig: ExportColumn[]) => void;
  defaultExportConfig: ExportColumn[];
}

const InvoiceProcessor: React.FC<InvoiceProcessorProps> = ({
  nomenclatureLoaded,
  onFilesUpload,
  onProcessInvoices,
  onReset,
  uploadedFiles,
  invoiceData,
  isLoading,
  error,
  setError,
  onUpdateItem,
  productList,
  plan,
  invoiceCount,
  onUpgrade,
  exportConfig,
  onExportConfigChange,
  defaultExportConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [highlightedItem, setHighlightedItem] = useState<InvoiceItem | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);

  const groupedInvoices = useMemo(() => {
    if (!invoiceData) return {};
    return invoiceData.reduce((acc, item) => {
        const key = item.invoiceFileName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, InvoiceItem[]>);
  }, [invoiceData]);

  const invoiceFileNames = Object.keys(groupedInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceFileNames.length > 0 && !invoiceFileNames.includes(selectedInvoice || '')) {
      setSelectedInvoice(invoiceFileNames[0]);
    } else if (invoiceFileNames.length === 0) {
      setSelectedInvoice(null);
    }
  }, [invoiceFileNames, selectedInvoice]);

  useEffect(() => {
    setLimitError(null);
  }, [uploadedFiles]);

  const handleProcessClick = () => {
    const invoicesToProcess = uploadedFiles.length;
    if (invoiceCount + invoicesToProcess > plan.invoiceLimit) {
        setLimitError(`Processing ${invoicesToProcess} invoices would exceed your ${plan.name} plan limit of ${plan.invoiceLimit} (current usage: ${invoiceCount}).`);
        return;
    }
    onProcessInvoices();
  };

  const selectedInvoicePreview = useMemo(() => {
    return uploadedFiles.find(f => f.file.name === selectedInvoice)?.preview;
  }, [selectedInvoice, uploadedFiles]);

  const downloadAllCSV = () => {
    if (!invoiceData) return;
    
    const activeColumns = exportConfig.filter(c => c.enabled).sort((a, b) => a.order - b.order);
    const headers = activeColumns.map(c => c.header);
    
    const rows = invoiceData.map(item =>
        activeColumns.map(col => {
            const value = item[col.key as keyof InvoiceItem] ?? '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'all_invoices_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    if (!invoiceData) return;
    try {
        type AggregatedItem = Omit<InvoiceItem, 'id' | 'invoiceFileName' | 'originalName' | 'quantity' | 'totalQuantity' | 'totalPrice'> & {
            quantity: number;
            totalQuantity: number;
            totalPrice: number;
            invoiceFileNames: Set<string>;
            originalNames: Set<string>;
        };

        const aggregatedData = new Map<string, AggregatedItem>();
        invoiceData.forEach(item => {
            const key = item.sku;
            if (key === 'UNKNOWN') return; 

            if (!aggregatedData.has(key)) {
                aggregatedData.set(key, {
                    sku: item.sku,
                    matchedProductName: item.matchedProductName, // Assuming matchedProductName is consistent per SKU
                    unitOfMeasure: item.unitOfMeasure,           // Assuming unitOfMeasure is consistent per SKU
                    unitPrice: item.unitPrice,                   // Taking the unitPrice from the first encountered item
                    quantity: 0,
                    totalQuantity: 0,
                    totalPrice: 0,
                    invoiceFileNames: new Set<string>(),
                    originalNames: new Set<string>(),
                });
            }
            const existing = aggregatedData.get(key)!;
            existing.quantity += item.quantity;
            existing.totalQuantity += item.totalQuantity;
            existing.totalPrice += item.totalPrice;
            existing.invoiceFileNames.add(item.invoiceFileName);
            existing.originalNames.add(item.originalName);
        });

        const finalData = Array.from(aggregatedData.values()).map(aggregatedItem => ({
            ...aggregatedItem,
            invoiceFileName: Array.from(aggregatedItem.invoiceFileNames).join('; '), // Join unique file names
            originalName: Array.from(aggregatedItem.originalNames).join('; '),     // Join unique original names
        }));

        const activeColumns = exportConfig.filter(c => c.enabled).sort((a, b) => a.order - b.order);
        const exportHeaders = activeColumns.map(c => c.header);
        
        const exportableData = finalData.map(item => {
            const row: {[key: string]: any} = {};
            activeColumns.forEach(col => {
                row[col.header] = item[col.key as keyof AggregatedItem] ?? ''; // Use AggregatedItem type here
            });
            return row;
        });
        
        const newWorksheet = XLSX.utils.json_to_sheet(exportableData, { header: exportHeaders });
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Aggregated Inventory');
        XLSX.writeFile(newWorkbook, `Aggregated_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (e) {
        console.error("Failed to export to Excel:", e);
        setError("Failed to generate the Excel file.");
    }
  };

  return (
    <>
    <div className={`bg-white p-6 rounded-xl shadow-md border border-slate-200 transition-opacity duration-500 ${!nomenclatureLoaded ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
        <div className="flex items-center mb-4">
             <div className={`flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg ${nomenclatureLoaded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <h2 className="ml-4 text-xl font-semibold text-slate-700">Process Invoice(s)</h2>
        </div>
      
      {!nomenclatureLoaded && <p className="text-slate-500 text-sm">Please upload your nomenclature in Step 1 to enable this section.</p>}

      {nomenclatureLoaded && !invoiceData && (
        <div className="space-y-6">
            <p className="text-slate-500 text-sm">Upload one or more clear photos or PDFs of the invoices you want to process.</p>
          
            <div>
                <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, application/pdf" onChange={(e) => e.target.files && onFilesUpload(e.target.files)} className="hidden" multiple />
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    <UploadIcon className="w-5 h-5 mr-2" />
                    {uploadedFiles.length > 0 ? 'Upload Different Files' : 'Upload Invoice Files (Image/PDF)'}
                </button>
                {uploadedFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {uploadedFiles.map(({ file, preview }, index) => (
                             <div key={index} className="relative border rounded-lg p-2 bg-slate-50 aspect-square flex items-center justify-center">
                                {file.type.startsWith('image/') ? (
                                    <img src={preview} alt={file.name} className="max-w-full max-h-full object-contain rounded-md" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-1">
                                        <FileDocumentIcon className="w-10 h-10 text-slate-400" />
                                        <p className="mt-1 text-xs font-semibold text-slate-600 break-all">{file.name}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[50px]">
                {uploadedFiles.length > 0 && !isLoading && (
                    <button onClick={handleProcessClick} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <DocumentMagnifyingGlassIcon className="w-6 h-6 mr-3" />
                        Process {uploadedFiles.length} Invoice(s)
                    </button>
                )}
                {isLoading && <Spinner />}
                {!isLoading && (error || limitError) && (
                    <div className="w-full text-center p-4 bg-red-50 text-red-700 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                           <XCircleIcon className="h-6 w-6 mr-2" />
                           <span className="font-semibold">Processing Failed</span>
                        </div>
                        <span className="text-sm">{error || limitError}</span>
                        {limitError && (
                            <button onClick={onUpgrade} className="mt-3 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm">Upgrade Plan</button>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}
      {invoiceData && selectedInvoice && (
        <div>
            <div className="p-4 bg-green-50 text-green-800 rounded-lg mb-6 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold">Processing Complete</h3>
                    <p className="text-sm">Found {invoiceData.length} items across {invoiceFileNames.length} invoice(s).</p>
                </div>
                {invoiceData.length > 0 && (
                     <div className="flex items-center space-x-2">
                         <button onClick={() => setConfigModalOpen(true)} className="flex-shrink-0 flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400">
                            <Cog8ToothIcon className="w-4 h-4 mr-2" /> Configure Export
                        </button>
                         <button onClick={downloadAllCSV} className="flex-shrink-0 flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-500">
                            <DownloadIcon className="w-4 h-4 mr-2" /> Download as CSV
                        </button>
                        <button onClick={handleExportToExcel} className="flex-shrink-0 flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600">
                            <TableCellsIcon className="w-4 h-4 mr-2" /> Export Aggregated (Excel)
                        </button>
                     </div>
                )}
            </div>
            <div className="border-b border-slate-200">
              <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {invoiceFileNames.map((name) => (
                  <button key={name} onClick={() => setSelectedInvoice(name)} className={`${name === selectedInvoice ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                    {name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">Invoice Preview</h3>
                    {selectedInvoicePreview ? (
                        <div className="border rounded-lg overflow-hidden"><InvoiceViewer imageUrl={selectedInvoicePreview} highlightedItem={highlightedItem} /></div>
                    ) : (
                        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center"><p className="text-slate-500">No image preview available.</p></div>
                    )}
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">Extracted Data (Editable)</h3>
                    <DataTable data={groupedInvoices[selectedInvoice] || []} onRowHover={setHighlightedItem} onUpdateItem={onUpdateItem} productList={productList} />
                </div>
            </div>
            <div className="mt-8 text-center">
                <button onClick={onReset} className="flex items-center justify-center mx-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <UploadIcon className="w-5 h-5 mr-2"/> Process More Invoices
                </button>
            </div>
        </div>
      )}
    </div>
    <ExportConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={exportConfig}
        onSave={onExportConfigChange}
        defaultConfig={defaultExportConfig}
    />
    </>
  );
};

export default InvoiceProcessor;