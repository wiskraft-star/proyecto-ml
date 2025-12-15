
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { SkuCost } from '../../types';
import { getSkuCosts, saveSkuCost, deleteSkuCost } from '../../services/supabaseService';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const CogsView: React.FC = () => {
  const [skuCosts, setSkuCosts] = useState<SkuCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<SkuCost | null>(null);
  const { addNotification } = useNotification();

  const fetchCogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSkuCosts();
      setSkuCosts(data);
    } catch (error) {
       addNotification('Error al cargar los costos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchCogs();
  }, [fetchCogs]);

  const handleOpenModal = (skuCost: SkuCost | null = null) => {
    setEditingSku(skuCost);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSku(null);
    setIsModalOpen(false);
  };

  const handleSave = async (skuCost: SkuCost) => {
    try {
        await saveSkuCost(skuCost);
        addNotification(`Costo para SKU ${skuCost.sku} guardado.`, 'success');
        fetchCogs();
        handleCloseModal();
    } catch (error) {
        addNotification('Error al guardar el costo.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este costo?')) {
        try {
            await deleteSkuCost(id);
            addNotification('Costo eliminado correctamente.', 'success');
            fetchCogs();
        } catch (error) {
            addNotification('Error al eliminar el costo.', 'error');
        }
    }
  };
  
  const columns = [
    { header: 'SKU', accessor: (item: SkuCost) => <span className="font-mono text-blue-400">{item.sku}</span> },
    { header: 'Costo Unitario', accessor: (item: SkuCost) => `$${item.unit_cost.toFixed(2)}` },
    {
      header: 'Acciones',
      accessor: (item: SkuCost) => (
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)}><Edit className="w-4 h-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Costos por SKU (COGS)</h2>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="w-4 h-4 mr-2" />Añadir Costo</Button>
        </div>
      </Card>
      <Card>
        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Cargando costos...</p>
        ) : (
          <Table data={skuCosts} columns={columns} />
        )}
      </Card>
      
      {isModalOpen && <SkuCostForm initialData={editingSku} onSave={handleSave} onClose={handleCloseModal} />}

    </div>
  );
};

interface SkuCostFormProps {
    initialData: SkuCost | null;
    onSave: (data: SkuCost) => void;
    onClose: () => void;
}

const SkuCostForm: React.FC<SkuCostFormProps> = ({ initialData, onSave, onClose }) => {
    const [sku, setSku] = useState(initialData?.sku || '');
    const [unitCost, setUnitCost] = useState(initialData?.unit_cost.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cost = parseFloat(unitCost);
        if (!sku || isNaN(cost) || cost < 0) {
            alert('Por favor, ingrese un SKU válido y un costo no negativo.');
            return;
        }
        onSave({
            id: initialData?.id || Date.now(),
            seller_id: initialData?.seller_id || 1, // Mock seller_id
            sku,
            unit_cost: cost,
        });
    };
    
    return (
        <Modal isOpen title={initialData ? 'Editar Costo de SKU' : 'Añadir Costo de SKU'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="SKU"
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    disabled={!!initialData}
                />
                <Input
                    label="Costo Unitario"
                    id="unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    required
                />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};


export default CogsView;
