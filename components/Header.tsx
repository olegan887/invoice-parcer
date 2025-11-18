
import React, { useState, useEffect, useRef } from 'react';
import { Company, Warehouse, UserProfile, Plan } from '../types';
import { Link } from 'react-router-dom';

interface HeaderProps {
    user: UserProfile;
    onLogout: () => void;
    plan: Plan;
    invoiceCount: number;
    onUpgrade: () => void;
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
    user,
    onLogout,
    plan,
    invoiceCount,
    onUpgrade,
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
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newWarehouseName, setNewWarehouseName] = useState('');
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleAddCompany = () => {
        if (newCompanyName.trim()) {
            const newCompany: Company = { id: crypto.randomUUID(), name: newCompanyName.trim() };
            setCompanies(prev => [...prev, newCompany]);
            setNewCompanyName('');
            setCompanyModalOpen(false);
            onCompanyChange(newCompany.id);
        }
    };
    
    const handleAddWarehouse = () => {
        if (newWarehouseName.trim() && selectedCompanyId) {
            const newWarehouse: Warehouse = { id: crypto.randomUUID(), name: newWarehouseName.trim(), companyId: selectedCompanyId };
            setWarehouses(prev => [...prev, newWarehouse]);
            setNewWarehouseName('');
            setWarehouseModalOpen(false);
            onWarehouseChange(newWarehouse.id);
        }
    };

    const usagePercentage = Math.min((invoiceCount / plan.invoiceLimit) * 100, 100);

  return (
    <>
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between flex-wrap">
        <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-slate-800">Invoice AI Parser</Link>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
                <select 
                    value={selectedCompanyId || ''} 
                    onChange={(e) => onCompanyChange(e.target.value)}
                    className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => setCompanyModalOpen(true)} className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-800">+</button>
            </div>
            <div className="flex items-center space-x-2">
                <select 
                    value={selectedWarehouseId || ''}
                    onChange={(e) => onWarehouseChange(e.target.value)}
                    disabled={!selectedCompanyId || companyWarehouses.length === 0}
                    className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-100"
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
            <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!isUserMenuOpen)}>
                    <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full" />
                </button>
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="p-4">
                            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            <div className="mt-4">
                                <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                                    <span>{plan.name} Plan</span>
                                    <span>{invoiceCount} / {plan.invoiceLimit}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${usagePercentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-100">
                             <button onClick={onUpgrade} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-slate-50">Upgrade Plan</button>
                             <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Logout</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
    {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add New Company</h3>
                <input type="text" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Company Name" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={() => setCompanyModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button onClick={handleAddCompany} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Add</button>
                </div>
            </div>
        </div>
    )}
    {isWarehouseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Add New Warehouse</h3>
                <input type="text" value={newWarehouseName} onChange={(e) => setNewWarehouseName(e.target.value)} placeholder="Warehouse Name" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
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
