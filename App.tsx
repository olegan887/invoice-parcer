import React, { useState, useEffect } from 'react';
import type { InvoiceItem } from './types';
import Header from './components/Header';
import NomenclatureUploader from './components/NomenclatureUploader';
import InvoiceProcessor from './components/InvoiceProcessor';
import { parseInvoice } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { Company, Warehouse } from './types';
import SetupScreen from './components/SetupScreen';

// New type for uploaded file state
export interface UploadedFile {
  file: File;
  preview: string;
}

const App: React.FC = () => {
  const [nomenclature, setNomenclature] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState<InvoiceItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedInvoices, setUploadedInvoices] = useState<UploadedFile[]>([]);
  
  // State for companies and warehouses
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const savedCompanies = localStorage.getItem('companies');
      const savedWarehouses = localStorage.getItem('warehouses');
      const savedSelectedCompanyId = localStorage.getItem('selectedCompanyId');
      const savedSelectedWarehouseId = localStorage.getItem('selectedWarehouseId');

      const loadedCompanies = savedCompanies ? JSON.parse(savedCompanies) : [];
      setCompanies(loadedCompanies);

      const loadedWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
      setWarehouses(loadedWarehouses);

      if (loadedCompanies.length > 0) {
        const companyId = savedSelectedCompanyId || loadedCompanies[0].id;
        setSelectedCompanyId(companyId);
        
        const companyWarehouses = loadedWarehouses.filter((w: Warehouse) => w.companyId === companyId);
        if (companyWarehouses.length > 0) {
            const warehouseId = savedSelectedWarehouseId || companyWarehouses[0].id;
            setSelectedWarehouseId(warehouseId);
        }
      }
    } catch (e) {
        console.error("Failed to load data from localStorage", e);
    }
  }, []);
  
  // Load nomenclature for selected warehouse
  useEffect(() => {
    if (selectedWarehouseId) {
        const savedNomenclature = localStorage.getItem(`nomenclature_${selectedWarehouseId}`);
        setNomenclature(savedNomenclature || '');
        handleResetInvoices();
    } else {
        setNomenclature('');
    }
  }, [selectedWarehouseId]);
  

  // Persist state to localStorage
  useEffect(() => {
    try {
        localStorage.setItem('companies', JSON.stringify(companies));
        localStorage.setItem('warehouses', JSON.stringify(warehouses));
        if (selectedCompanyId) localStorage.setItem('selectedCompanyId', selectedCompanyId);
        if (selectedWarehouseId) localStorage.setItem('selectedWarehouseId', selectedWarehouseId);
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
  }, [companies, warehouses, selectedCompanyId, selectedWarehouseId]);

  const handleNomenclatureUpload = (content: string) => {
    setNomenclature(content);
    if (selectedWarehouseId) {
        localStorage.setItem(`nomenclature_${selectedWarehouseId}`, content);
    }
    handleResetInvoices(); // Reset invoices if nomenclature changes
  };
  
  const handleInvoicesUpload = async (files: FileList) => {
      if (!files || files.length === 0) return;
      // Reset previous batch when new files are uploaded
      setInvoiceData(null);
      setError(null);
      
      setIsLoading(true); // Show loader while generating previews
      try {
        const fileList = Array.from(files);
        const newUploadedInvoices: UploadedFile[] = await Promise.all(
            fileList.map(async (file) => ({
                file,
                preview: await fileToBase64(file),
            }))
        );
        setUploadedInvoices(newUploadedInvoices);
      } catch (err) {
          setError('Failed to read one or more files.');
          console.error(err);
          setUploadedInvoices([]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleInvoiceProcess = async () => {
    if (uploadedInvoices.length === 0 || nomenclature.length === 0) {
      setError('Please upload nomenclature and at least one invoice file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInvoiceData(null);

    try {
        const results = await Promise.allSettled(
            uploadedInvoices.map(async ({ file }) => {
                const base64Data = await fileToBase64(file);
                const imageData = base64Data.split(',')[1];
                const mimeType = file.type;
                const parsedData = await parseInvoice(imageData, mimeType, nomenclature);
                
                // Add filename to each item
                return parsedData.map(item => ({...item, invoiceFileName: file.name}));
            })
        );

        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => (result as PromiseFulfilledResult<InvoiceItem[]>).value);
        
        const failedResults = results.filter(result => result.status === 'rejected');

        if (failedResults.length > 0) {
            console.error("Some invoices failed to process:", failedResults);
            setError(`Failed to process ${failedResults.length} out of ${uploadedInvoices.length} invoices. Please check the files and try again.`);
        }

        if (successfulResults.length === 0 && failedResults.length > 0) {
             throw new Error("All invoices failed to process.");
        }

        setInvoiceData(successfulResults);

    } catch (err) {
      console.error(err);
      // More specific error is set inside the loop
      if (!error) {
        setError('An unexpected error occurred during processing. Please check the console.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInvoices = () => {
    setUploadedInvoices([]);
    setInvoiceData(null);
    setError(null);
  };
  
  const handleInitialSetup = (companyName: string, warehouseName: string) => {
    const newCompany: Company = { id: crypto.randomUUID(), name: companyName };
    const newWarehouse: Warehouse = { id: crypto.randomUUID(), name: warehouseName, companyId: newCompany.id };
    setCompanies([newCompany]);
    setWarehouses([newWarehouse]);
    setSelectedCompanyId(newCompany.id);
    setSelectedWarehouseId(newWarehouse.id);
  };

  if (companies.length === 0) {
    return <SetupScreen onSetupComplete={handleInitialSetup} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans">
      <Header
        companies={companies}
        warehouses={warehouses}
        selectedCompanyId={selectedCompanyId}
        selectedWarehouseId={selectedWarehouseId}
        onCompanyChange={setSelectedCompanyId}
        onWarehouseChange={setSelectedWarehouseId}
        setCompanies={setCompanies}
        setWarehouses={setWarehouses}
       />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {selectedWarehouseId ? (
            <>
              <NomenclatureUploader 
                onNomenclatureUpload={handleNomenclatureUpload} 
                key={selectedWarehouseId} // Force re-render on warehouse change
                existingNomenclature={nomenclature}
              />
              
              <InvoiceProcessor 
                nomenclatureLoaded={nomenclature.length > 0}
                onFilesUpload={handleInvoicesUpload}
                onProcessInvoices={handleInvoiceProcess}
                onReset={handleResetInvoices}
                uploadedFiles={uploadedInvoices}
                invoiceData={invoiceData}
                isLoading={isLoading}
                error={error}
              />
            </>
          ) : (
             <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-700">No Warehouse Selected</h2>
                <p className="text-slate-500 mt-2">Please select a company and a warehouse from the header to begin.</p>
                <p className="text-slate-500 mt-1">If no warehouses exist for the selected company, please add one.</p>
             </div>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-slate-400 mt-8">
        <p>&copy; 2024 Invoice AI Parser. Streamlining your inventory management.</p>
      </footer>
    </div>
  );
};

export default App;