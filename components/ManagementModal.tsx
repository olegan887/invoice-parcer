
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import type { Company, Warehouse, Nomenclature } from '../types';

type Item = Company | Warehouse | Nomenclature;

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  itemType: 'company' | 'warehouse' | 'nomenclature';
  onRename: (id: string, newName: string) => Promise<void>; // Make async for toast
  onDelete: (id: string) => Promise<void>; // Make async for toast
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, items, itemType, onRename, onDelete }) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleRename = async (id: string) => {
    try {
      await onRename(id, newName);
      setEditingId(null);
      setNewName('');
      // The toast notification will be handled in the parent component (HomePage)
    } catch (error) {
      // Error toast is also handled in the parent
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      setDeletingId(null);
      // Toast notification handled in parent
    } catch (error) {
      // Error toast handled in parent
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      {/* ... (Modal UI) */}

      <ConfirmationModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => handleDelete(deletingId!)}
        title={t(`modals.delete_${itemType}.title`)}
        message={t(`modals.delete_${itemType}.message`)}
      />
    </div>
  );
};

export default ManagementModal;
