
import React from 'react';
import type { InvoiceItem, Product } from '../types';
import { DownloadIcon } from './Icons';

interface DataTableProps {
  data: InvoiceItem[];
  onRowHover: (item: InvoiceItem | null) => void;
  onUpdateItem: (itemId: string, updatedFields: Partial<InvoiceItem>) => void;
  productList: Product[];
}

const DataTable: React.FC<DataTableProps> = ({ data, onRowHover, onUpdateItem, productList }) => {

  const downloadCSV = () => {
    const headers = ["Invoice File", "Matched Product Name", "Original Name", "SKU", "Quantity", "Total Quantity", "Unit of Measure", "Unit Price", "Total Price"];
    const rows = data.map(item => [
      `"${item.invoiceFileName.replace(/"/g, '""')}"`,
      `"${item.matchedProductName.replace(/"/g, '""')}"`,
      `"${item.originalName.replace(/"/g, '""')}"`,
      item.sku,
      item.quantity,
      item.totalQuantity,
      item.unitOfMeasure,
      item.unitPrice,
      item.totalPrice
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'invoice_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleProductChange = (itemId: string, newProductName: string) => {
    const selectedProduct = productList.find(p => p.name === newProductName);
    onUpdateItem(itemId, {
        matchedProductName: newProductName,
        sku: selectedProduct ? selectedProduct.sku : (newProductName === 'UNKNOWN' ? 'UNKNOWN' : 'CUSTOM')
    });
  };

  const handleFieldChange = (itemId: string, field: keyof InvoiceItem, value: string) => {
    onUpdateItem(itemId, { [field]: value });
  };

  const handleNumericChange = (itemId: string, field: 'quantity' | 'unitPrice' | 'totalPrice' | 'totalQuantity', value: string) => {
      const sanitizedValue = value.replace(',', '.');
      const numericValue = parseFloat(sanitizedValue);
      
      if (isNaN(numericValue) && sanitizedValue.trim() !== '') return;

      const currentItem = data.find(item => item.id === itemId);
      if (!currentItem) return;
      
      const valueToUpdate = isNaN(numericValue) ? 0 : numericValue;

      const updatedFields: Partial<InvoiceItem> = { [field]: valueToUpdate };
      
      if (field === 'quantity' || field === 'unitPrice') {
          const newQuantity = field === 'quantity' ? valueToUpdate : currentItem.quantity;
          const newUnitPrice = field === 'unitPrice' ? valueToUpdate : currentItem.unitPrice;
          updatedFields.totalPrice = parseFloat((newQuantity * newUnitPrice).toFixed(2));
      }
      onUpdateItem(itemId, updatedFields);
  };

  return (
    <div>
        <div className="flex justify-end mb-4">
            <button
            onClick={downloadCSV}
            className="flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download this table
            </button>
        </div>
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border max-h-[60vh]">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
            <tr>
                <th scope="col" className="py-3 px-4">Matched Product</th>
                <th scope="col" className="py-3 px-4">Original Name</th>
                <th scope="col" className="py-3 px-4">SKU</th>
                <th scope="col" className="py-3 px-4 text-right">Qty</th>
                <th scope="col" className="py-3 px-4 text-right">Total Qty</th>
                 <th scope="col" className="py-3 px-4">UoM</th>
                <th scope="col" className="py-3 px-4 text-right">Unit Price</th>
                <th scope="col" className="py-3 px-4 text-right">Total Price</th>
            </tr>
            </thead>
            <tbody>
            {data.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`border-b transition-colors duration-150 group ${
                    item.matchedProductName === 'UNKNOWN' 
                      ? 'bg-red-50 hover:bg-red-100' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => item.boundingBox && onRowHover(item)}
                  onMouseLeave={() => item.boundingBox && onRowHover(null)}
                >
                    <td className="p-1 px-2" style={{minWidth: '200px'}}>
                        <select
                            value={item.matchedProductName}
                            onChange={(e) => handleProductChange(item.id, e.target.value)}
                            className={`w-full bg-transparent border rounded-md px-2 py-1 text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${item.matchedProductName === 'UNKNOWN' ? 'border-red-300' : 'border-slate-200 group-hover:border-slate-300'}`}
                        >
                            {/* Add current value if it's not in the list to handle custom/unmatched items */}
                            {!productList.some(p => p.name === item.matchedProductName) && item.matchedProductName !== 'UNKNOWN' && (
                                <option value={item.matchedProductName}>{item.matchedProductName} (Custom)</option>
                            )}
                            <option value="UNKNOWN">UNKNOWN</option>
                            {productList.map(p => (
                                <option key={p.sku} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </td>
                    <td className="p-1 px-2" style={{minWidth: '200px'}}>
                        <input type="text" value={item.originalName} onChange={(e) => handleFieldChange(item.id, 'originalName', e.target.value)} className="w-full bg-transparent border border-slate-200 group-hover:border-slate-300 rounded-md px-2 py-1 text-slate-500 italic focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                    </td>
                    <td className="p-1 px-2 text-slate-600 font-mono" style={{minWidth: '100px'}}>{item.sku}</td>
                    <td className="p-1 px-2 text-right" style={{width: '110px'}}>
                        <input type="text" value={item.quantity} onChange={(e) => handleNumericChange(item.id, 'quantity', e.target.value)} className="w-full text-right bg-transparent border border-slate-200 group-hover:border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                    </td>
                    <td className="p-1 px-2 text-right" style={{width: '110px'}}>
                        <input type="text" value={item.totalQuantity} onChange={(e) => handleNumericChange(item.id, 'totalQuantity', e.target.value)} className="w-full text-right bg-transparent border border-slate-200 group-hover:border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700" />
                    </td>
                     <td className="p-1 px-2" style={{width: '90px'}}>
                        <input type="text" value={item.unitOfMeasure} onChange={(e) => handleFieldChange(item.id, 'unitOfMeasure', e.target.value)} className="w-full bg-transparent border border-slate-200 group-hover:border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                    </td>
                    <td className="p-1 px-2 text-right" style={{width: '130px'}}>
                        <input type="text" value={item.unitPrice} onChange={(e) => handleNumericChange(item.id, 'unitPrice', e.target.value)} className="w-full text-right bg-transparent border border-slate-200 group-hover:border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                    </td>
                    <td className="p-1 px-2 text-right" style={{width: '130px'}}>
                        <input type="text" value={item.totalPrice} onChange={(e) => handleNumericChange(item.id, 'totalPrice', e.target.value)} className="w-full text-right bg-transparent border border-slate-200 group-hover:border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-gray-800" />
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
  );
};

export default DataTable;
