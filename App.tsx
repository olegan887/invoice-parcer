
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
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
  const [isDataLoaded, setIsDataLoaded] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                email: firebaseUser.email!,
                picture: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email!.split('@')[0])}&background=random&color=fff`,
            };
            setUser(userProfile);
            await loadUserData(userProfile.id);
        } else {
            setUser(null);
            resetAppState();
        }
        setIsDataLoaded(true);
    });
    return () => unsubscribe();
  }, []);
  
  const loadUserData = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setPlanId(data.planId || 'free');
            setInvoiceCount(data.invoiceCount || 0);
            const loadedCompanies = data.companies || [];
            setCompanies(loadedCompanies);
            const loadedWarehouses = data.warehouses || [];
            setWarehouses(loadedWarehouses);
            
            if(loadedCompanies.length > 0) {
                const companyId = data.selectedCompanyId || loadedCompanies[0].id;
                setSelectedCompanyId(companyId);
                const companyWarehouses = loadedWarehouses.filter((w: Warehouse) => w.companyId === companyId);
                if (companyWarehouses.length > 0) {
                    const warehouseId = data.selectedWarehouseId || companyWarehouses[0].id;
                    setSelectedWarehouseId(warehouseId);
                }
            }
        } else {
          // If no data, it might be a new user. Default states are already set.
          // The data will be saved on first action.
        }
    } catch (e) {
        console.error("Failed to load user data from Firestore", e);
        setError("Could not load your profile. Please try refreshing the page.");
    }
  };

  const persistUserData = useCallback(async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.id);
    const userData = {
        planId,
        invoiceCount,
        companies,
        warehouses,
        selectedCompanyId,
        selectedWarehouseId,
    };
    try {
        await setDoc(userDocRef, userData, { merge: true });
    } catch (e) {
        console.error("Failed to save data to Firestore", e);
    }
  }, [user, planId, invoiceCount, companies, warehouses, selectedCompanyId, selectedWarehouseId]);

  useEffect(() => {
      if(user) persistUserData();
  }, [persistUserData]);

  useEffect(() => {
    const saveNomenclatureAndConfig = async () => {
        if (user && selectedWarehouseId) {
            const warehouseDocRef = doc(db, "users", user.id, "warehouses", selectedWarehouseId);
            try {
                await setDoc(warehouseDocRef, { nomenclature, exportConfig }, { merge: true });
            } catch (error) {
                console.error("Failed to save warehouse-specific data", error);
            }
        }
    };
    saveNomenclatureAndConfig();
  }, [user, selectedWarehouseId, nomenclature, exportConfig]);

  useEffect(() => {
    const loadNomenclatureAndConfig = async () => {
        if (user && selectedWarehouseId) {
            const warehouseDocRef = doc(db, "users", user.id, "warehouses", selectedWarehouseId);
            try {
                const docSnap = await getDoc(warehouseDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNomenclature(data.nomenclature || '');
                    setExportConfig(data.exportConfig || DEFAULT_EXPORT_CONFIG);
                } else {
                    setNomenclature('');
                    setExportConfig(DEFAULT_EXPORT_CONFIG);
                }
            } catch (error) {
                console.error("Failed to load warehouse-specific data", error);
            }
        }
    };
    loadNomenclatureAndConfig();
    handleResetInvoices();
  }, [user, selectedWarehouseId]);

  const handleLogin = (loggedInUser: UserProfile) => {
    // This function is now primarily handled by onAuthStateChanged
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout failed:", error);
      }
  };
  
  const resetAppState = () => {
      setShowLoginPage(false);
      setCompanies([]);
      setWarehouses([]);
      setSelectedCompanyId(null);
      setSelectedWarehouseId(null);
      setNomenclature('');
      handleResetInvoices();
      setPlanId('free');
      setInvoiceCount(0);
      setIsDataLoaded(false);
  }

  const handleSelectPlan = (newPlanId: PlanId) => {
      setPlanId(newPlanId);
      if (newPlanId !== 'free') {
        setInvoiceCount(0);
      }
      setPricingModalOpen(false);
  };
  
  const handleNomenclatureUpload = (content: string) => {
    setNomenclature(content);
    handleResetInvoices();
  };

  const handleExportConfigSave = (newConfig: ExportColumn[]) => {
    setExportConfig(newConfig);
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

  if (!isDataLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

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
        setWarehouses={setWarewareses}
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
        userEmail={user?.email ?? ''}
      />
      <footer className="text-center p-4 text-xs text-slate-400 mt-8">
        <p>&copy; 2024 Invoice AI Parser. Все права защищены.</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="/privacy-policy" className="text-indigo-600 hover:text-indigo-800">Политика конфиденциальности</a>
          <a href="/terms-of-service" className="text-indigo-600 hover:text-indigo-800">Условия использования</a>
          <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-800">Связаться с нами</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
