
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { InvoiceItem, Plan, PlanId, UserProfile, ExportColumn } from './types';
import Header from './components/Header';
import NomenclatureUploader from './components/NomenclatureUploader';
import InvoiceProcessor from './components/InvoiceProcessor';
import { parseInvoice } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { Company, Warehouse, Product } from './types';
import SetupScreen from './components/SetupScreen';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import LandingPage from './components/LandingPage';

// Declare XLSX to inform TypeScript that it's available globally
declare const XLSX: any;

export interface UploadedFile {
  file: File;
  preview: string;
}

const PLANS: Record<PlanId, Plan> = {
    free: { id: 'free', name: 'Free Trial', price: 0, currency: 'EUR', invoiceLimit: 50, description: "Perfect for trying out the service." },
    pro: { id: 'pro', name: 'Pro', price: 19.99, currency: 'EUR', invoiceLimit: 1000, description: "Ideal for small to medium businesses." },
    premium: { id: 'premium', name: 'Premium', price: 79.99, currency: 'EUR', invoiceLimit: 10000, description: "For power users and large operations." }
};

const DEFAULT_EXPORT_CONFIG: ExportColumn[] = [
    { key: 'invoiceFileName', header: 'Invoice File', enabled: true, order: 0 },
    { key: 'matchedProductName', header: 'Matched Product Name', enabled: true, order: 1 },
    { key: 'originalName', header: 'Original Name', enabled: true, order: 2 },
    { key: 'sku', header: 'SKU', enabled: true, order: 3 },
    { key: 'quantity', header: 'Quantity', enabled: true, order: 4 },
    { key: 'totalQuantity', header: 'Total Quantity', enabled: true, order: 5 },
    { key: 'unitOfMeasure', header: 'Unit of Measure', enabled: true, order: 6 },
    { key: 'unitPrice', header: 'Unit Price', enabled: true, order: 7 },
    { key: 'totalPrice', header: 'Total Price', enabled: true, order: 8 },
];


const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [planId, setPlanId] = useState<PlanId>('free');
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  const [nomenclature, setNomenclature] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState<InvoiceItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedInvoices, setUploadedInvoices] = useState<UploadedFile[]>([]);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [exportConfig, setExportConfig] = useState<ExportColumn[]>(DEFAULT_EXPORT_CONFIG);


  // Load user-specific data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const loggedInUser = JSON.parse(savedUser);
      setUser(loggedInUser);
      loadUserData(loggedInUser.id);
    }
  }, []);
  
  const loadUserData = (userId: string) => {
    try {
        const savedPlanId = localStorage.getItem(`plan_${userId}`);
        const savedInvoiceCount = localStorage.getItem(`invoiceCount_${userId}`);
        setPlanId((savedPlanId as PlanId) || 'free');
        setInvoiceCount(savedInvoiceCount ? parseInt(savedInvoiceCount, 10) : 0);

        const savedCompanies = localStorage.getItem(`companies_${userId}`);
        const savedWarehouses = localStorage.getItem(`warehouses_${userId}`);
        const savedSelectedCompanyId = localStorage.getItem(`selectedCompanyId_${userId}`);
        const savedSelectedWarehouseId = localStorage.getItem(`selectedWarehouseId_${userId}`);

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
        console.error("Failed to load user data from localStorage", e);
    }
  };

  const persistUserData = useCallback(() => {
    if (!user) return;
    try {
        localStorage.setItem(`plan_${user.id}`, planId);
        localStorage.setItem(`invoiceCount_${user.id}`, String(invoiceCount));
        localStorage.setItem(`companies_${user.id}`, JSON.stringify(companies));
        localStorage.setItem(`warehouses_${user.id}`, JSON.stringify(warehouses));
        if (selectedCompanyId) localStorage.setItem(`selectedCompanyId_${user.id}`, selectedCompanyId);
        if (selectedWarehouseId) localStorage.setItem(`selectedWarehouseId_${user.id}`, selectedWarehouseId);
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
  }, [user, planId, invoiceCount, companies, warehouses, selectedCompanyId, selectedWarehouseId]);

  useEffect(() => {
      persistUserData();
  }, [persistUserData]);

  useEffect(() => {
    if (user && selectedWarehouseId) {
        const savedNomenclature = localStorage.getItem(`nomenclature_${user.id}_${selectedWarehouseId}`);
        setNomenclature(savedNomenclature || '');
        const savedExportConfig = localStorage.getItem(`exportConfig_${user.id}_${selectedWarehouseId}`);
        setExportConfig(savedExportConfig ? JSON.parse(savedExportConfig) : DEFAULT_EXPORT_CONFIG);
        handleResetInvoices();
    } else {
        setNomenclature('');
        setExportConfig(DEFAULT_EXPORT_CONFIG);
    }
  }, [user, selectedWarehouseId]);

  const handleLogin = (loggedInUser: UserProfile) => {
    // Persist the full user profile against their ID so it can be retrieved by email login later
    localStorage.setItem(`user_profile_${loggedInUser.id}`, JSON.stringify(loggedInUser));
    
    // Set the current user for session management
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    loadUserData(loggedInUser.id);
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
      // Reset all states to default
      setShowLoginPage(false);
      setCompanies([]);
      setWarehouses([]);
      setSelectedCompanyId(null);
      setSelectedWarehouseId(null);
      setNomenclature('');
      handleResetInvoices();
      setPlanId('free');
      setInvoiceCount(0);
  };

  const handleSelectPlan = (newPlanId: PlanId) => {
      setPlanId(newPlanId);
      // Reset invoice count on plan change, simulating a monthly reset
      if (newPlanId !== 'free') {
        setInvoiceCount(0);
      }
      setPricingModalOpen(false);
  };
  
  const handleNomenclatureUpload = (content: string) => {
    setNomenclature(content);
    if (user && selectedWarehouseId) {
        localStorage.setItem(`nomenclature_${user.id}_${selectedWarehouseId}`, content);
    }
    handleResetInvoices();
  };

  const handleExportConfigSave = (newConfig: ExportColumn[]) => {
    setExportConfig(newConfig);
    if (user && selectedWarehouseId) {
        localStorage.setItem(`exportConfig_${user.id}_${selectedWarehouseId}`, JSON.stringify(newConfig));
    }
  };
  
  const handleInvoicesUpload = async (files: FileList) => {
      if (!files || files.length === 0) return;
      setInvoiceData(null);
      setError(null);
      setIsLoading(true);
      try {
        const newUploadedInvoices: UploadedFile[] = await Promise.all(
            Array.from(files).map(async (file) => ({
                file,
                preview: await fileToBase64(file),
            }))
        );
        setUploadedInvoices(newUploadedInvoices);
      } catch (err) {
          setError('Failed to read one or more files.');
          console.error(err);
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
                // This now calls our backend!
                const parsedData = await parseInvoice(imageData, mimeType, nomenclature);
                return parsedData.map(item => ({...item, id: crypto.randomUUID(), invoiceFileName: file.name}));
            })
        );
        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => (result as PromiseFulfilledResult<InvoiceItem[]>).value);
        
        const failedResults = results.filter(result => result.status === 'rejected');
        if (failedResults.length > 0) {
            console.error("Some invoices failed to process:", failedResults);
            setError(`Failed to process ${failedResults.length} out of ${uploadedInvoices.length} invoices. Check the console.`);
        }
        if (successfulResults.length === 0 && failedResults.length > 0) {
             const reason = (failedResults[0] as PromiseRejectedResult).reason;
             throw new Error(reason?.message || "All invoices failed to process.");
        }
        setInvoiceData(successfulResults);
        // Increment count after successful processing
        setInvoiceCount(prev => prev + successfulResults.length > 0 ? uploadedInvoices.length : 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during processing.');
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

  const handleUpdateInvoiceItem = (itemId: string, updatedFields: Partial<InvoiceItem>) => {
    setInvoiceData(currentData => {
        if (!currentData) return null;
        return currentData.map(item =>
            item.id === itemId ? { ...item, ...updatedFields } : item
        );
    });
  };

  const productList = useMemo((): Product[] => {
    if (!nomenclature) return [];
    try {
        const workbook = XLSX.read(nomenclature, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length < 2) return [];
        const headers = json[0].map(h => String(h).toLowerCase().trim());
        const nameIndex = headers.indexOf('name');
        const skuIndex = headers.indexOf('sku');
        if (nameIndex === -1 || skuIndex === -1) return [];
        return json.slice(1).map(row => ({
            name: String(row[nameIndex] || ''),
            sku: String(row[skuIndex] || '')
        })).filter(p => p.name && p.sku);
    } catch (e) { return []; }
  }, [nomenclature]);

  if (!user) {
    return showLoginPage ? 
        <LoginScreen onLogin={handleLogin} /> : 
        <LandingPage onGetStarted={() => setShowLoginPage(true)} plans={PLANS} />;
  }

  if (companies.length === 0) {
    return <SetupScreen onSetupComplete={handleInitialSetup} />;
  }

  const currentPlan = PLANS[planId];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans">
      <Header
        user={user}
        onLogout={handleLogout}
        plan={currentPlan}
        invoiceCount={invoiceCount}
        onUpgrade={() => setPricingModalOpen(true)}
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
                key={`${user.id}-${selectedWarehouseId}`} // Force re-render on user/warehouse change
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
                setError={setError}
                onUpdateItem={handleUpdateInvoiceItem}
                productList={productList}
                plan={currentPlan}
                invoiceCount={invoiceCount}
                onUpgrade={() => setPricingModalOpen(true)}
                exportConfig={exportConfig}
                onExportConfigChange={handleExportConfigSave}
                defaultExportConfig={DEFAULT_EXPORT_CONFIG}
              />
            </>
          ) : (
             <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-700">No Warehouse Selected</h2>
                <p className="text-slate-500 mt-2">Please select a company and a warehouse to begin.</p>
             </div>
          )}
        </div>
      </main>
      <PricingModal 
        isOpen={isPricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        onSelectPlan={handleSelectPlan}
        currentPlanId={planId}
        plans={PLANS}
      />
      <footer className="text-center p-4 text-xs text-slate-400 mt-8">
        <p>&copy; 2024 Invoice AI Parser. Streamlining your inventory management.</p>
      </footer>
    </div>
  );
};

export default App;
