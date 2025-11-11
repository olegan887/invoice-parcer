
import React, { useRef, useMemo, useState, useEffect } from 'react';
import type { InvoiceItem, Product } from '../types';
import type { UploadedFile } from '../App';
import DataTable from './DataTable';
import Spinner from './Spinner';
import InvoiceViewer from './InvoiceViewer';
import { UploadIcon, XCircleIcon, DocumentMagnifyingGlassIcon, FileDocumentIcon, DownloadIcon, TableCellsIcon } from './Icons';

interface InvoiceProcessorProps {
  nomenclatureLoaded: boolean;
  onFilesUpload: (files: FileList) => void;
  onProcessInvoices: () => void;
  onReset: () => void;
  uploadedFiles: UploadedFile[];
  invoiceData: InvoiceItem[] | null;
  isLoading: boolean;
  error: string | null;
  onUpdateItem: (itemId: string, updatedFields: Partial<InvoiceItem>) => void;
  productList: Product[];
  onExportToExcel: () => void;
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
  onUpdateItem,
  productList,
  onExportToExcel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [highlightedItem, setHighlightedItem] = useState<InvoiceItem | null>(null);

  const groupedInvoices = useMemo(() => {
    if (!invoiceData) return {};
    return invoiceData.reduce((acc, item) => {
        const key = item.invoiceFileName;
        if (!acc[key]) {
            acc[key] = [];
        }
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


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesUpload(event.target.files);
      event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const selectedInvoicePreview = useMemo(() => {
    return uploadedFiles.find(f => f.file.name === selectedInvoice)?.preview;
  }, [selectedInvoice, uploadedFiles]);

  const downloadAllCSV = () => {
    if (!invoiceData) return;
    const headers = ["Invoice File", "Matched Product Name", "Original Name", "SKU", "Quantity", "Total Quantity", "Unit of Measure", "Unit Price", "Total Price"];
    const rows = invoiceData.map(item => [
      `"${item.invoiceFileName.replace(/"/g, '""')}"`,
      `"${item.matchedProductName.replace(/"/g, '""')}"`,
      `"${item.originalName.replace(/"/g, '""')}"`,
      item.sku,
      item.quantity,
      item.totalQuantity,
      item.unitOfMeasure,
      item.unitPrice,
      item.totalPrice
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'all_invoices_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div className={`bg-white p-6 rounded-xl shadow-md border border-slate-200 transition-opacity duration-500 ${!nomenclatureLoaded ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
        <div className="flex items-center mb-4">
             <div className={`flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg ${nomenclatureLoaded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <h2 className="ml-4 text-xl font-semibold text-slate-700">Process Invoice(s)</h2>
        </div>
      
      {!nomenclatureLoaded && (
        <p className="text-slate-500 text-sm">Please upload your nomenclature in Step 1 to enable this section.</p>
      )}

      {nomenclatureLoaded && !invoiceData && (
        <div className="space-y-6">
            <p className="text-slate-500 text-sm">Now, upload one or more clear photos or PDFs of the invoices you want to process.</p>
          
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
                <button
                    onClick={handleButtonClick}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
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
                    <button 
                        onClick={onProcessInvoices}
                        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <DocumentMagnifyingGlassIcon className="w-6 h-6 mr-3" />
                        Process {uploadedFiles.length} Invoice(s)
                    </button>
                )}

                {isLoading && <Spinner />}

                {!isLoading && error && (
                    <div className="w-full text-center flex flex-col items-center p-3 bg-red-50 text-red-700 rounded-lg">
                        <XCircleIcon className="h-6 w-6 mb-2" />
                        <span className="font-semibold">Processing Failed</span>
                        <span className="text-sm">{error}</span>
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
                    <p className="text-sm">Found {invoiceData.length} items across {invoiceFileNames.length} invoice(s). You can now edit the data below.</p>
                </div>
                {invoiceData.length > 0 && (
                     <div className="flex items-center space-x-2">
                         <button
                            onClick={downloadAllCSV}
                            className="flex-shrink-0 flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download as CSV
                        </button>
                        <button
                            onClick={onExportToExcel}
                            className="flex-shrink-0 flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                        >
                            <TableCellsIcon className="w-4 h-4 mr-2" />
                            Export to Excel
                        </button>
                     </div>
                )}
            </div>
            
            <div className="border-b border-slate-200">
              <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {invoiceFileNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setSelectedInvoice(name)}
                    className={`${
                      name === selectedInvoice
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                  >
                    {name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">Invoice Preview</h3>
                    {selectedInvoicePreview ? (
                        <div className="border rounded-lg overflow-hidden">
                            <InvoiceViewer 
                                imageUrl={selectedInvoicePreview} 
                                highlightedItem={highlightedItem} 
                            />
                        </div>
                    ) : (
                        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                            <p className="text-slate-500">No image preview available.</p>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">Extracted Data (Editable)</h3>
                    <DataTable 
                        data={groupedInvoices[selectedInvoice] || []} 
                        onRowHover={setHighlightedItem}
                        onUpdateItem={onUpdateItem}
                        productList={productList}
                    />
                </div>
            </div>


            <div className="mt-8 text-center">
                <button
                    onClick={onReset}
                    className="flex items-center justify-center mx-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <UploadIcon className="w-5 h-5 mr-2"/>
                    Process More Invoices
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceProcessor;
