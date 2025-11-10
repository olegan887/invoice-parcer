import React, { useState, useEffect } from 'react';
import { DocumentTextIcon } from './Icons';
import { Company, Warehouse } from '../types';

interface HeaderProps {
    companies: Company[];
    warehouses: Warehouse[];
    selectedCompanyId: string | null;
    selectedWarehouseId: string | null;
    onCompanyChange: (id: string) => void;
    onWarehouseChange: (id: string) => void;
    setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
    setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
}

const Header: React.FC<HeaderProps> = ({
    companies,
    warehouses,
    selectedCompanyId,
    selectedWarehouseId,
    onCompanyChange,
    onWarehouseChange,
    setCompanies,
    setWarehouses,
}) => {
    const [companyWarehouses, setCompanyWarehouses] = useState<Warehouse[]>([]);
    const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
    const [isWarehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newWarehouseName, setNewWarehouseName] = useState('');

    useEffect(() => {
        if (selectedCompanyId) {
            const filtered = warehouses.filter(w => w.companyId === selectedCompanyId);
            setCompanyWarehouses(filtered);
            if (!filtered.some(w => w.id === selectedWarehouseId)) {
                onWarehouseChange(filtered[0]?.id || '');
            }
        } else {
            setCompanyWarehouses([]);
        }
    }, [selectedCompanyId, warehouses, selectedWarehouseId, onWarehouseChange]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onCompanyChange(e.target.value);
    };

    const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onWarehouseChange(e.target.value);
    };

    const handleAddCompany = () => {
        if (newCompanyName.trim()) {
            const newCompany: Company = { id: crypto.randomUUID(), name: newCompanyName.trim() };
            setCompanies(prev => [...prev, newCompany]);
            setNewCompanyName('');
            setCompanyModalOpen(false);
            onCompanyChange(newCompany.id); // Switch to the new company
        }
    };
    
    const handleAddWarehouse = () => {
        if (newWarehouseName.trim() && selectedCompanyId) {
            const newWarehouse: Warehouse = { id: crypto.randomUUID(), name: newWarehouseName.trim(), companyId: selectedCompanyId };
            setWarehouses(prev => [...prev, newWarehouse]);
            setNewWarehouseName('');
            setWarehouseModalOpen(false);
            onWarehouseChange(newWarehouse.id); // Switch to the new warehouse
        }
    };

  return (
    <>
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between flex-wrap">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-indigo-600 p-3 rounded-lg text-white">
            <DocumentTextIcon className="h-8 w-8" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Invoice AI Parser</h1>
                <p className="text-sm text-slate-500">Automate your inventory data entry.</p>
            </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
                <select 
                    value={selectedCompanyId || ''} 
                    onChange={handleCompanyChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => setCompanyModalOpen(true)} className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-800">+</button>
            </div>
            <div className="flex items-center space-x-2">
                <select 
                    value={selectedWarehouseId || ''}
                    onChange={handleWarehouseChange}
                    disabled={!selectedCompanyId || companyWarehouses.length === 0}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-100"
                >
                    {companyWarehouses.length > 0 ? (
                        companyWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                    ) : (
                        <option>No warehouses</option>
                    )}
                </select>
                <button 
                    onClick={() => setWarehouseModalOpen(true)} 
                    disabled={!selectedCompanyId} 
                    className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
                >+</button>
            </div>
        </div>
      </div>
    </header>

    {/* Add Company Modal */}
    {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add New Company</h3>
                <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Company Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={() => setCompanyModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button onClick={handleAddCompany} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Add</button>
                </div>
            </div>
        </div>
    )}

    {/* Add Warehouse Modal */}
    {isWarehouseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add New Warehouse</h3>
                <input
                    type="text"
                    value={newWarehouseName}
                    onChange={(e) => setNewWarehouseName(e.target.value)}
                    placeholder="Warehouse Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={() => setWarehouseModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button onClick={handleAddWarehouse} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Add</button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Header;