
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import type { InvoiceItem, PlanId, UserProfile, UserSubscription, Company, Warehouse, Product, ExportColumn, UploadedFile } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomePage from '../components/HomePage';
import { parseInvoice } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import SetupScreen from '../components/SetupScreen';
import LoginScreen from '../components/LoginScreen';
import PricingModal from '../components/PricingModal';
import LandingPage from '../components/LandingPage';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { createUserProfile, getUserSubscription, getCompaniesByOwner, getWarehousesByCompany, saveProcessedInvoice } from '../services/firestoreService';
import { PLANS, DEFAULT_EXPORT_CONFIG } from './constants';
import toast from 'react-hot-toast';

declare const XLSX: any;

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

const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
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
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);
  const [exportConfig, setExportConfig] = useState<ExportColumn[]>(DEFAULT_EXPORT_CONFIG);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Moved these declarations up
  const currentPlan = useMemo(() => PLANS[subscription?.planId || 'free'], [subscription]);
  const invoiceCount = useMemo(() => subscription?.invoiceCount || 0, [subscription]);

  const loadUserData = useCallback(async (firebaseUser: any) => {
    try {
        await createUserProfile(firebaseUser);
        const userProfile: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            email: firebaseUser.email!,
            picture: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email!.split('@')[0])}&background=random&color=fff`,
            companyIds: [],
        };
        setUser(userProfile);
        
        const sub = await getUserSubscription(firebaseUser.uid);
        setSubscription(sub);

        const userCompanies = await getCompaniesByOwner(firebaseUser.uid);
        setCompanies(userCompanies);

        if (userCompanies.length > 0) {
            const companyId = userCompanies[0].id;
            setSelectedCompanyId(companyId);
        }
    } catch (err) {
        console.error("Failed to load user data:", err);
        toast.error("Failed to load your data. Please try again later.");
    } finally {
        setIsDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            loadUserData(firebaseUser);
        } else {
            setUser(null);
            setSubscription(null);
            setCompanies([]);
            setWarehouses([]);
            setSelectedCompanyId(null);
            setSelectedWarehouseId(null);
            setIsDataLoaded(true);
        }
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error('Failed to log out.');
    }
  }, []);
  
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen onLogin={() => {}} /> : <Navigate to="/app" />} />
        <Route path="/setup" element={user && companies.length === 0 ? <SetupScreen onSetupComplete={() => {}} /> : <Navigate to="/app" />} />
        
        <Route path="/app" element={
            user ? (
                companies.length === 0 && isDataLoaded ? <Navigate to="/setup" /> : (
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
                            selectedCompanyId={selectedCompanyId}
                            setSelectedCompanyId={setSelectedCompanyId}
                            selectedWarehouseId={selectedWarehouseId}
                            setSelectedWarehouseId={setSelectedWarehouseId}
                            companies={companies}
                            setCompanies={setCompanies}
                            warehouses={warehouses}
                            setWarehouses={setWarehouses}
                            nomenclatures={nomenclatures}
                            setNomenclatures={setNomenclatures}
                            nomenclature={nomenclature}
                            setNomenclature={setNomenclature}
                            invoiceData={invoiceData}
                            setInvoiceData={setInvoiceData}
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                            error={error}
                            setError={setError}
                            uploadedInvoices={uploadedInvoices}
                            setUploadedInvoices={setUploadedInvoices}
                            currentPlan={currentPlan}
                            invoiceCount={invoiceCount}
                            openPricingModal={() => setPricingModalOpen(true)}
                            exportConfig={exportConfig}
                            setExportConfig={setExportConfig}
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
          onSelectPlan={() => {}}
          currentPlanId={subscription?.planId || 'free'}
          plans={PLANS}
          userEmail={user?.email ?? ''}
      />
    </Layout>
  );
};

export default AppContent;
