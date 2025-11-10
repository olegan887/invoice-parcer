
import React from 'react';
import type { InvoiceItem } from '../types';
import { DownloadIcon } from './Icons';

interface DataTableProps {
  data: InvoiceItem[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {

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

  return (
    <div>
        <div className="flex justify-end mb-4">
            <button
            onClick={downloadCSV}
            className="flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download CSV
            </button>
        </div>
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
                <th scope="col" className="py-3 px-6">Invoice File</th>
                <th scope="col" className="py-3 px-6">Matched Product</th>
                <th scope="col" className="py-3 px-6">Original Name</th>
                <th scope="col" className="py-3 px-6">SKU</th>
                <th scope="col" className="py-3 px-6 text-right">Quantity</th>
                <th scope="col" className="py-3 px-6 text-right">Total Quantity</th>
                <th scope="col" className="py-3 px-6 text-right">Unit Price</th>
                <th scope="col" className="py-3 px-6 text-right">Total Price</th>
            </tr>
            </thead>
            <tbody>
            {data.map((item, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                    {item.invoiceFileName}
                </td>
                <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    {item.matchedProductName}
                </th>
                <td className="py-4 px-6 text-slate-500 italic">
                    {item.originalName}
                </td>
                <td className="py-4 px-6">
                    {item.sku}
                </td>
                <td className="py-4 px-6 text-right">
                    {item.quantity}
                </td>
                <td className="py-4 px-6 text-right font-medium text-gray-700">
                    {item.totalQuantity} {item.unitOfMeasure}
                </td>
                <td className="py-4 px-6 text-right">
                    {item.unitPrice.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right font-semibold text-gray-800">
                    {item.totalPrice.toFixed(2)}
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