
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import type { InvoiceItem, Plan, PlanId, UserProfile, ExportColumn } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import { parseInvoice } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { Company, Warehouse, Product } from './types';
import SetupScreen from './components/SetupScreen';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import LandingPage from './components/LandingPage';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from 'firebase/auth';

declare const XLSX: any;

export interface UploadedFile {
  file: File;
  preview: string;
}

const PLANS: Record<PlanId, Plan> = {
    free: { id: 'free', name: 'Starter', price: 0, currency: 'EUR', invoiceLimit: 50, description: "Great for testing the service.", stripePriceId: '' },
    pro: { id: 'pro', name: 'Pro', price: 19.99, currency: 'EUR', invoiceLimit: 1000, description: "Ideal for small to medium businesses.", stripePriceId: 'price_1Pbum2RqcWwIeHkP3sVkYF3h' },
    premium: { id: 'premium', name: 'Premium', price: 79.99, currency: 'EUR', invoiceLimit: 10000, description: "For large companies and high volumes.", stripePriceId: 'price_1PbumMRqcWwIeHkPz11L95Yv' }
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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';
    const [user] = useState(auth.currentUser);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans flex flex-col">
            {children}
            {(!user || !isLandingPage) && <Footer />}
        </div>
    );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
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

  const updateUserDocument = async (userId: string, data: object) => {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, data, { merge: true });
  };

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
            await updateUserDocument(userProfile.id, { 
                email: userProfile.email, 
                name: userProfile.name,
                lastLogin: serverTimestamp() 
            });
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
            const now = new Date();
            const lastReset = (data.invoiceCountResetDate as Timestamp)?.toDate() || new Date(0);
            
            if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
                setInvoiceCount(0);
                await updateUserDocument(userId, { invoiceCount: 0, invoiceCountResetDate: serverTimestamp() });
            } else {
                setInvoiceCount(data.invoiceCount || 0);
            }

            setPlanId(data.planId || 'free');
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
                } else {
                    setSelectedWarehouseId(null);
                }
            }
        }
    } catch (e) {
        console.error("Failed to load user data from Firestore", e);
        setError("Could not load your profile. Please try refreshing the page.");
    }
  };

  const persistUserData = useCallback(async () => {
    if (!user) return;
    const userData = {
        planId,
        companies,
        warehouses,
        selectedCompanyId,
        selectedWarehouseId,
    };
    try {
        await updateUserDocument(user.id, userData);
    } catch (e) {
        console.error("Failed to save data to Firestore", e);
    }
  }, [user, planId, companies, warehouses, selectedCompanyId, selectedWarehouseId]);

  useEffect(() => {
      if(user) persistUserData();
  }, [persistUserData]);

  useEffect(() => {
    const saveWarehouseSpecificData = async () => {
        if (user && selectedWarehouseId) {
            const warehouseDocRef = doc(db, "users", user.id, "warehouses", selectedWarehouseId);
            try {
                await setDoc(warehouseDocRef, { nomenclature, exportConfig }, { merge: true });
            } catch (error) {
                console.error("Failed to save warehouse-specific data", error);
            }
        }
    };
    if (isDataLoaded) { // Only save after initial data load
        saveWarehouseSpecificData();
    }
  }, [user, selectedWarehouseId, nomenclature, exportConfig, isDataLoaded]);

  useEffect(() => {
    const loadWarehouseSpecificData = async () => {
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
        } else {
            setNomenclature('');
            setExportConfig(DEFAULT_EXPORT_CONFIG);
        }
    };
    loadWarehouseSpecificData();
    handleResetInvoices();
  }, [user, selectedWarehouseId]);

  const handleLogin = (loggedInUser: UserProfile) => {
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

  const handleSelectPlan = async (newPlanId: PlanId) => {
      setPlanId(newPlanId);
      const newCount = newPlanId === 'free' ? invoiceCount : 0;
      setInvoiceCount(newCount);
      if (user) {
          await updateUserDocument(user.id, { 
              planId: newPlanId, 
              invoiceCount: newCount,
              invoiceCountResetDate: serverTimestamp() 
            });
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
  
  const saveProcessedInvoices = async (processedData: InvoiceItem[]) => {
      if (!user || !selectedWarehouseId || processedData.length === 0) return;

      const invoicesCollectionRef = collection(db, "users", user.id, "warehouses", selectedWarehouseId, "invoices");
      try {
          await addDoc(invoicesCollectionRef, {
              createdAt: serverTimestamp(),
              invoiceData: processedData,
              fileNames: processedData.map(item => item.invoiceFileName).filter((v, i, a) => a.indexOf(v) === i) // Unique file names
          });
      } catch(e) {
        console.error("Error saving processed invoices:", e);
      }
  }

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
        
        // --- DATA PERSISTENCE ---
        const processedCount = uploadedInvoices.length;
        const newTotalCount = invoiceCount + processedCount;
        setInvoiceCount(newTotalCount);
        if (user) {
            await updateUserDocument(user.id, { invoiceCount: newTotalCount });
            await saveProcessedInvoices(successfulResults);
        }
        // --- END DATA PERSISTENCE ---

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

  const currentPlan = useMemo(() => PLANS[planId], [planId]);

  if (!isDataLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }
  
  return (
    <Router>
        <Layout>
            <Routes>
                <Route path="/login" element={!user ? <LoginScreen onLogin={handleLogin} /> : <Navigate to="/app" />} />
                <Route path="/setup" element={user && companies.length === 0 ? <SetupScreen onSetupComplete={handleInitialSetup} /> : <Navigate to="/app" />} />
                
                <Route path="/app" element={
                    user ? (
                        companies.length === 0 ? <Navigate to="/setup" /> : (
                            <>
                                <Header
                                    user={user}
                                    onLogout={handleLogout}
                                    plan={currentPlan}
                                    invoiceCount={invoiceCount}
                                    onUpgrade={() => setPricingModalOpen(true)}
                                    companies={companies}
                                    warehouses={warehouses}
                                    selectedCompanyId={selectedCompanyId}
                                    onCompanyChange={setSelectedCompanyId}
                                    onWarehouseChange={setSelectedWarehouseId}
                                    setCompanies={setCompanies}
                                    setWarehouses={setWarehouses}
                                />
                                <HomePage 
                                    user={user}
                                    selectedWarehouseId={selectedWarehouseId}
                                    handleNomenclatureUpload={handleNomenclatureUpload}
                                    nomenclature={nomenclature}
                                    handleFilesInvoicesUpload={handleInvoicesUpload}
                                    handleProcessInvoices={handleInvoiceProcess}
                                    handleResetInvoices={handleResetInvoices}
                                    uploadedInvoices={uploadedInvoices}
                                    invoiceData={invoiceData}
                                    isLoading={isLoading}
                                    error={error}
                                    setError={setError}
                                    handleUpdateInvoiceItem={handleUpdateInvoiceItem}
                                    productList={productList}
                                    currentPlan={currentPlan}
                                    invoiceCount={invoiceCount}
                                    openPricingModal={() => setPricingModalOpen(true)}
                                    exportConfig={exportConfig}
                                    handleExportConfigSave={handleExportConfigSave}
                                    DEFAULT_EXPORT_CONFIG={DEFAULT_EXPORT_CONFIG}
                                />
                            </>
                        )
                    ) : <Navigate to="/" />
                } />

                <Route path="/" element={!user ? <LandingPage plans={Object.values(PLANS)} /> : <Navigate to="/app" />} />

                <Route path="/privacy-policy" element={<div>Privacy Policy Page</div>} />
                <Route path="/terms-of-service" element={<div>Terms of Service Page</div>} />
            </Routes>
            <PricingModal 
                isOpen={isPricingModalOpen}
                onClose={() => setPricingModalOpen(false)}
                onSelectPlan={handleSelectPlan}
                currentPlanId={planId}
                plans={PLANS}
                userEmail={user?.email ?? ''}
            />
        </Layout>
    </Router>
  );
};

export default App;
