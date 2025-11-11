import React, { useState, useEffect, useRef } from 'react';
import type { ExportColumn } from '../types';
import { Bars3Icon } from './Icons';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExportColumn[];
  onSave: (newConfig: ExportColumn[]) => void;
  defaultConfig: ExportColumn[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({ isOpen, onClose, config, onSave, defaultConfig }) => {
  const [localConfig, setLocalConfig] = useState<ExportColumn[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    // Deep copy to prevent mutating the original prop state
    setLocalConfig(JSON.parse(JSON.stringify(config.sort((a, b) => a.order - b.order))));
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragOverItem.current = index;
  };
  
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
    };
    
    const newConfig = [...localConfig];
    const draggedItemContent = newConfig.splice(dragItem.current, 1)[0];
    newConfig.splice(dragOverItem.current, 0, draggedItemContent);
    
    // Update order property
    const finalConfig = newConfig.map((item, index) => ({...item, order: index}));
    
    setLocalConfig(finalConfig);
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleEnabledChange = (key: string, enabled: boolean) => {
    setLocalConfig(current =>
      current.map(item => (item.key === key ? { ...item, enabled } : item))
    );
  };

  const handleHeaderChange = (key: string, header: string) => {
    setLocalConfig(current =>
      current.map(item => (item.key === key ? { ...item, header } : item))
    );
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };
  
  const handleReset = () => {
    setLocalConfig(JSON.parse(JSON.stringify(defaultConfig.sort((a, b) => a.order - b.order))));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Configure Export Format</h2>
        <p className="text-sm text-slate-500 mb-6">Drag and drop to reorder columns. Enable or disable columns and rename headers for your exported CSV and Excel files.</p>
        
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            <ul className="space-y-2">
                {localConfig.map((col, index) => (
                    <li 
                      key={col.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-move"
                    >
                        <Bars3Icon className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                        <input
                            type="checkbox"
                            checked={col.enabled}
                            onChange={(e) => handleEnabledChange(col.key, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-4"
                        />
                        <div className="flex-grow">
                            <input
                                type="text"
                                value={col.header}
                                onChange={(e) => handleHeaderChange(col.key, e.target.value)}
                                className="w-full bg-transparent px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-sm"
                                disabled={!col.enabled}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Reset to Default</button>
            <div className="flex space-x-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Save Configuration</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExportConfigModal;
