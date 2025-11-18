import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import NomenclatureUploader from './NomenclatureUploader';
import InvoiceProcessor from './InvoiceProcessor';
import CreateItemModal from './CreateItemModal';
import ManagementModal from './ManagementModal';
import type { Company, Warehouse, Nomenclature, InvoiceItem, Plan, ExportColumn, Product, UploadedFile } from '../types';
import {
  createCompany, getCompaniesByOwner, updateCompany, deleteCompany,
  createWarehouse, getWarehousesByCompany, updateWarehouse, deleteWarehouse,
  createNomenclature, getNomenclaturesByCompany, updateNomenclature, deleteNomenclature,
  saveProcessedInvoice
} from '../services/firestoreService';
import { parseInvoice } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';

declare const XLSX: any;

interface HomePageProps {
  user: any; // UserProfile
  selectedCompanyId: string | null;
  setSelectedCompanyId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: React.Dispatch<React.SetStateAction<string | null>>;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  nomenclatures: Nomenclature[];
  setNomenclatures: React.Dispatch<React.SetStateAction<Nomenclature[]>>;
  nomenclature: string;
  setNomenclature: React.Dispatch<React.SetStateAction<string>>;
  invoiceData: InvoiceItem[] | null;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceItem[] | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  uploadedInvoices: UploadedFile[];
  setUploadedInvoices: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  currentPlan: Plan;
  invoiceCount: number;
  openPricingModal: () => void;
  exportConfig: ExportColumn[];
  setExportConfig: React.Dispatch<React.SetStateAction<ExportColumn[]>>;
  DEFAULT_EXPORT_CONFIG: ExportColumn[];
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  selectedCompanyId,
  setSelectedCompanyId,
  selectedWarehouseId,
  setSelectedWarehouseId,
  companies,
  setCompanies,
  warehouses,
  setWarehouses,
  nomenclatures,
  setNomenclatures,
  nomenclature,
  setNomenclature,
  invoiceData,
  setInvoiceData,
  isLoading,
  setIsLoading,
  error,
  setError,
  uploadedInvoices,
  setUploadedInvoices,
  currentPlan,
  invoiceCount,
  openPricingModal,
  exportConfig,
  setExportConfig,
  DEFAULT_EXPORT_CONFIG,
}) => {
  const { t } = useTranslation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'company' | 'warehouse' | 'nomenclature'>('company');
  
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageModalType, setManageModalType] = useState<'company' | 'warehouse' | 'nomenclature'>('company');

  useEffect(() => {
    const fetchCompanyRelatedData = async () => {
      if (selectedCompanyId) {
        const fetchedWarehouses = await getWarehousesByCompany(selectedCompanyId);
        setWarehouses(fetchedWarehouses);
        if (fetchedWarehouses.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(fetchedWarehouses[0].id);
        }

        const fetchedNomenclatures = await getNomenclaturesByCompany(selectedCompanyId);
        setNomenclatures(fetchedNomenclatures);
      } else {
        setWarehouses([]);
        setNomenclatures([]);
        setSelectedWarehouseId(null);
      }
    };
    fetchCompanyRelatedData();
  }, [selectedCompanyId, setWarehouses, setNomenclatures, setSelectedWarehouseId, selectedWarehouseId]);

  const openCreateModal = useCallback((type: 'company' | 'warehouse' | 'nomenclature') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateItem = useCallback(async (name: string) => {
    if (!user) { toast.error('User not authenticated.'); return; }

    try {
      if (createModalType === 'company') {
        const newCompany = { name, ownerId: user.id };
        const companyId = await createCompany(newCompany);
        setCompanies(prev => [...prev, { id: companyId, ...newCompany }]);
        toast.success(t('modals.create_company.success', { name }));
      } else if (createModalType === 'warehouse') {
        if (!selectedCompanyId) { toast.error('No company selected.'); return; }
        const newWarehouse = { name, companyId: selectedCompanyId };
        const warehouseId = await createWarehouse(newWarehouse);
        setWarehouses(prev => [...prev, { id: warehouseId, ...newWarehouse }]);
        toast.success(t('modals.create_warehouse.success', { name }));
      } else if (createModalType === 'nomenclature') {
        if (!selectedCompanyId) { toast.error('No company selected.'); return; }
        const newNomenclature = { name, companyId: selectedCompanyId, data: [] };
        const nomenclatureId = await createNomenclature(newNomenclature);
        setNomenclatures(prev => [...prev, { id: nomenclatureId, ...newNomenclature }]);
        toast.success(t('modals.create_nomenclature.success', { name }));
      }
    } catch (error) {
      console.error(`Failed to create ${createModalType}:`, error);
      toast.error(t(`modals.create_${createModalType}.error`));
    }
  }, [user, createModalType, selectedCompanyId, setCompanies, setWarehouses, setNomenclatures, t]);

  const openManageModal = useCallback((type: 'company' | 'warehouse' | 'nomenclature') => {
    setManageModalType(type);
    setIsManageModalOpen(true);
  }, []);

  const handleRenameItem = useCallback(async (id: string, newName: string) => {
    try {
      if (manageModalType === 'company') {
        await updateCompany(id, { name: newName });
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
        toast.success(t('modals.manage_company.rename_success', { newName }));
      } else if (manageModalType === 'warehouse') {
        await updateWarehouse(id, { name: newName });
        setWarehouses(prev => prev.map(w => w.id === id ? { ...w, name: newName } : w));
        toast.success(t('modals.manage_warehouse.rename_success', { newName }));
      } else if (manageModalType === 'nomenclature') {
        await updateNomenclature(id, { name: newName });
        setNomenclatures(prev => prev.map(n => n.id === id ? { ...n, name: newName } : n));
        toast.success(t('modals.manage_nomenclature.rename_success', { newName }));
      }
    } catch (error) {
      console.error(`Failed to rename ${manageModalType}:`, error);
      toast.error(t(`modals.manage_${manageModalType}.rename_error`));
    }
  }, [manageModalType, setCompanies, setWarehouses, setNomenclatures, t]);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      if (manageModalType === 'company') {
        await deleteCompany(id);
        setCompanies(prev => prev.filter(c => c.id !== id));
        if (selectedCompanyId === id) setSelectedCompanyId(null);
        toast.success(t('modals.manage_company.delete_success'));
      } else if (manageModalType === 'warehouse') {
        await deleteWarehouse(id);
        setWarehouses(prev => prev.filter(w => w.id !== id));
        if (selectedWarehouseId === id) setSelectedWarehouseId(null);
        toast.success(t('modals.manage_warehouse.delete_success'));
      } else if (manageModalType === 'nomenclature') {
        await deleteNomenclature(id);
        setNomenclatures(prev => prev.filter(n => n.id !== id));
        toast.success(t('modals.manage_nomenclature.delete_success'));
      }
    } catch (error) {
      console.error(`Failed to delete ${manageModalType}:`, error);
      toast.error(t(`modals.manage_${manageModalType}.delete_error`));
    }
  }, [manageModalType, selectedCompanyId, setSelectedCompanyId, selectedWarehouseId, setSelectedWarehouseId, setCompanies, setWarehouses, setNomenclatures, t]);

  const handleNomenclatureUpload = useCallback((content: string) => {
    setNomenclature(content);
    toast.success(t('nomenclature.upload_success'));
  }, [setNomenclature, t]);

  const handleFilesUpload = useCallback(async (files: FileList) => {
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
      toast.success(t('invoices.upload_success', { count: files.length }));
    } catch (err) {
        setError(t('invoices.upload_error'));
        toast.error(t('invoices.upload_error'));
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [setInvoiceData, setError, setIsLoading, setUploadedInvoices, t]);

  const handleProcessInvoices = useCallback(async () => {
    if (!user || !selectedCompanyId || !selectedWarehouseId || !nomenclature) {
      toast.error(t('invoices.process_prerequisites_error'));
      return;
    }
    if (uploadedInvoices.length === 0) {
      toast.error(t('invoices.process_no_files_error'));
      return;
    }

    const isLimitReached = invoiceCount >= currentPlan.invoiceLimit;
    if (isLimitReached) {
      toast.error(t('invoices.process_limit_error'));
      openPricingModal();
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
                const parsedData = await parseInvoice(imageData, mimeType, nomenclature, user.id);
                return parsedData.map(item => ({
                    ...item, 
                    id: crypto.randomUUID(), 
                    invoiceFileName: file.name,
                    userId: user.id,
                    companyId: selectedCompanyId,
                    warehouseId: selectedWarehouseId,
                    nomenclatureId: nomenclatures.find(n => n.data === nomenclature)?.id || 'unknown',
                }));
            })
        );
        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => (result as PromiseFulfilledResult<InvoiceItem[]>).value);
        
        const failedResults = results.filter(result => result.status === 'rejected');
        if (failedResults.length > 0) {
            console.error("Some invoices failed to process:", failedResults);
            toast.error(t('invoices.process_partial_error', { failed: failedResults.length, total: uploadedInvoices.length }));
        }
        if (successfulResults.length === 0 && failedResults.length > 0) {
             const reason = (failedResults[0] as PromiseRejectedResult).reason;
             throw new Error(reason?.message || t('invoices.process_all_failed_error'));
        }
        setInvoiceData(successfulResults);
        toast.success(t('invoices.process_success'));

        for (const invoice of successfulResults) {
            await saveProcessedInvoice({
                userId: user.id,
                companyId: selectedCompanyId,
                warehouseId: selectedWarehouseId,
                nomenclatureId: nomenclatures.find(n => n.data === nomenclature)?.id || 'unknown',
                fileName: invoice.invoiceFileName,
                processedAt: Date.now(),
                items: [invoice]
            });
        }

    } catch (err: any) {
      console.error(err);
      setError(err.message || t('invoices.process_unexpected_error'));
      toast.error(err.message || t('invoices.process_unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedCompanyId, selectedWarehouseId, nomenclature, uploadedInvoices, invoiceCount, currentPlan, setInvoiceData, setError, setIsLoading, nomenclatures, t, openPricingModal]);

  const handleResetInvoices = useCallback(() => {
    setUploadedInvoices([]);
    setInvoiceData(null);
    setError(null);
    toast.success(t('invoices.reset_success'));
  }, [setUploadedInvoices, setInvoiceData, setError, t]);
  
  const handleUpdateInvoiceItem = useCallback((itemId: string, updatedFields: Partial<InvoiceItem>) => {
    setInvoiceData(currentData => {
        if (!currentData) return null;
        return currentData.map(item =>
            item.id === itemId ? { ...item, ...updatedFields } : item
        );
    });
  }, [setInvoiceData]);

  const handleExportConfigSave = useCallback((newConfig: ExportColumn[]) => {
    setExportConfig(newConfig);
    toast.success(t('export.config_save_success'));
  }, [setExportConfig, t]);

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

  const isLimitReached = invoiceCount >= currentPlan.invoiceLimit;

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* ... UI ... */}
    </main>
  );
};

export default HomePage;
