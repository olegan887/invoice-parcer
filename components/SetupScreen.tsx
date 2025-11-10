import React, { useState } from 'react';
import { DocumentTextIcon } from './Icons';

interface SetupScreenProps {
  onSetupComplete: (companyName: string, warehouseName: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim() && warehouseName.trim()) {
      onSetupComplete(companyName.trim(), warehouseName.trim());
    } else {
        setError('Both company and warehouse names are required.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-4 rounded-full text-white">
              <DocumentTextIcon className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800">Welcome!</h1>
          <p className="text-center text-slate-500 mt-2 mb-6">Let's get started by setting up your first company and warehouse.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-slate-700">Company Name</label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., My Restaurant Group"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="warehouse-name" className="block text-sm font-medium text-slate-700">Warehouse / Location Name</label>
              <input
                id="warehouse-name"
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="e.g., Central Kitchen"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Processing Invoices
            </button>
          </form>
        </div>
        <footer className="text-center p-4 text-xs text-slate-400 mt-4">
            <p>&copy; 2024 Invoice AI Parser.</p>
        </footer>
      </div>
    </div>
  );
};

export default SetupScreen;
