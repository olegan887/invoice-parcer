import React, { useRef } from 'react';
import type { InvoiceItem } from '../types';
import type { UploadedFile } from '../App';
import DataTable from './DataTable';
import Spinner from './Spinner';
import { UploadIcon, XCircleIcon, DocumentMagnifyingGlassIcon, FileDocumentIcon } from './Icons';

interface InvoiceProcessorProps {
  nomenclatureLoaded: boolean;
  onFilesUpload: (files: FileList) => void;
  onProcessInvoices: () => void;
  onReset: () => void;
  uploadedFiles: UploadedFile[];
  invoiceData: InvoiceItem[] | null;
  isLoading: boolean;
  error: string | null;
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesUpload(event.target.files);
      // Reset the input value to allow uploading the same file(s) again
      event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
                    multiple // Allow multiple file selection
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

      {invoiceData && (
        <div>
            <div className="p-4 bg-green-50 text-green-800 rounded-lg mb-6 text-center">
                <h3 className="text-lg font-semibold">Processing Complete</h3>
                <p className="text-sm">Found {invoiceData.length} items across {new Set(invoiceData.map(i => i.invoiceFileName)).size} invoice(s).</p>
            </div>
            
            <DataTable data={invoiceData} />

            <div className="mt-6 text-center">
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
