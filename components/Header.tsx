
import React from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile, Plan, Company, Warehouse } from '../types';

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
    // ... other props
}) => {
    const usagePercentage = Math.min((invoiceCount / plan.invoiceLimit) * 100, 100);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-slate-800">Invoice AI Parser</Link>
                
                <div className="flex items-center space-x-4">
                    {/* Company and Warehouse selectors can be added here if needed */}
                    
                    <div className="relative">
                        <div className="flex items-center space-x-2">
                            <span>{plan.name} Plan</span>
                            <span>({invoiceCount} / {plan.invoiceLimit})</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div 
                                className={`h-1.5 rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                                style={{ width: `${usagePercentage}%` }}
                            ></div>
                        </div>
                        {usagePercentage > 80 && (
                            <button onClick={onUpgrade} className="text-sm text-indigo-600 hover:underline">
                                Upgrade
                            </button>
                        )}
                    </div>

                    <button onClick={onLogout} className="text-sm text-slate-700 hover:underline">
                        Logout
                    </button>
                    <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full" />
                </div>
            </div>
        </header>
    );
};

export default Header;
