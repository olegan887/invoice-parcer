
import React from 'react';
import NomenclatureUploader from './NomenclatureUploader';
import InvoiceProcessor from './InvoiceProcessor';
import type { InvoiceItem, Plan, ExportColumn, Product } from '../types';

interface HomePageProps {
  user: any;
  selectedWarehouseId: string | null;
  handleNomenclatureUpload: (content: string) => void;
  nomenclature: string;
  handleFilesInvoicesUpload: (files: FileList) => void;
  handleProcessInvoices: () => void;
  handleResetInvoices: () => void;
  uploadedInvoices: any[];
  invoiceData: InvoiceItem[] | null;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  handleUpdateInvoiceItem: (itemId: string, updatedFields: Partial<InvoiceItem>) => void;
  productList: Product[];
  currentPlan: Plan;
  invoiceCount: number;
  openPricingModal: () => void;
  exportConfig: ExportColumn[];
  handleExportConfigSave: (newConfig: ExportColumn[]) => void;
  DEFAULT_EXPORT_CONFIG: ExportColumn[];
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  selectedWarehouseId,
  handleNomenclatureUpload,
  nomenclature,
  handleFilesInvoicesUpload,
  handleProcessInvoices,
  handleResetInvoices,
  uploadedInvoices,
  invoiceData,
  isLoading,
  error,
  setError,
  handleUpdateInvoiceItem,
  productList,
  currentPlan,
  invoiceCount,
  openPricingModal,
  exportConfig,
  handleExportConfigSave,
  DEFAULT_EXPORT_CONFIG,
}) => {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {selectedWarehouseId ? (
          <>
            <NomenclatureUploader 
              onNomenclatureUpload={handleNomenclatureUpload} 
              key={`${user.id}-${selectedWarehouseId}`}
              existingNomenclature={nomenclature}
            />
            
            <InvoiceProcessor 
              nomenclatureLoaded={nomenclature.length > 0}
              onFilesUpload={handleFilesInvoicesUpload}
              onProcessInvoices={handleProcessInvoices}
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
              onUpgrade={openPricingModal}
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
  );
};

export default HomePage;
