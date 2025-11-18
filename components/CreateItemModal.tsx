
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  itemType: 'company' | 'warehouse' | 'nomenclature';
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ isOpen, onClose, onCreate, itemType }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name);
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{t(`modals.create_${itemType}.title`)}</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(`modals.create_${itemType}.placeholder`)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="p-2 bg-gray-300 text-black rounded">{t('modals.buttons.cancel')}</button>
          <button onClick={handleCreate} className="p-2 bg-blue-500 text-white rounded">{t('modals.buttons.create')}</button>
        </div>
      </div>
    </div>
  );
};

export default CreateItemModal;
