
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Supply, SupplyRecipeLine } from '../../types';
import { getSupplies, saveSupply, deleteSupply, getRecipe, saveRecipeLine, deleteRecipeLine } from '../../services/supabaseService';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const SuppliesView: React.FC = () => {
    return (
        <div className="space-y-6">
            <SuppliesCrud />
            <RecipeCrud />
        </div>
    );
};

const SuppliesCrud: React.FC = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const { addNotification } = useNotification();

  const fetchSupplies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSupplies();
      setSupplies(data);
    } catch (error) {
       addNotification('Error al cargar los insumos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSupplies();
  }, [fetchSupplies]);

  const handleOpenModal = (supply: Supply | null = null) => {
    setEditingSupply(supply);
    setIsModalOpen(true);
  };

  const handleSave = async (supply: Supply) => {
    try {
        await saveSupply(supply);
        addNotification(`Insumo "${supply.name}" guardado.`, 'success');
        fetchSupplies();
        setIsModalOpen(false);
    } catch (error) {
        addNotification('Error al guardar el insumo.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro? Esto podría afectar la receta global.')) {
        try {
            await deleteSupply(id);
            addNotification('Insumo eliminado.', 'success');
            fetchSupplies();
        } catch (error) {
            addNotification('Error al eliminar el insumo.', 'error');
        }
    }
  };
  
  const columns = [
    { header: 'Nombre', accessor: (item: Supply) => item.name },
    { header: 'Costo Unitario', accessor: (item: Supply) => `$${item.unit_cost.toFixed(2)}` },
    {
      header: 'Acciones',
      accessor: (item: Supply) => (
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)}><Edit className="w-4 h-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Insumos</h2>
        <Button onClick={() => handleOpenModal()}><PlusCircle className="w-4 h-4 mr-2" />Añadir Insumo</Button>
      </div>
      {isLoading ? <p>Cargando...</p> : <Table data={supplies} columns={columns} />}
      {isModalOpen && <SupplyForm initialData={editingSupply} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
    </Card>
  );
};

const RecipeCrud: React.FC = () => {
    const [recipeLines, setRecipeLines] = useState<SupplyRecipeLine[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<SupplyRecipeLine | null>(null);
    const { addNotification } = useNotification();

    const fetchRecipeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [recipeData, suppliesData] = await Promise.all([getRecipe(), getSupplies()]);
            const recipeWithNames = recipeData.map(line => ({
                ...line,
                supply_name: suppliesData.find(s => s.id === line.supply_id)?.name || 'Desconocido'
            }));
            setRecipeLines(recipeWithNames);
            setSupplies(suppliesData);
        } catch (error) {
            addNotification('Error al cargar la receta.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);
    
    useEffect(() => {
        fetchRecipeData();
    }, [fetchRecipeData]);

    const handleOpenModal = (line: SupplyRecipeLine | null = null) => {
        setEditingLine(line);
        setIsModalOpen(true);
    };
    
    const handleSave = async (line: SupplyRecipeLine) => {
        try {
            await saveRecipeLine(line);
            addNotification(`Receta actualizada.`, 'success');
            fetchRecipeData();
            setIsModalOpen(false);
        } catch(error) {
            addNotification('Error al guardar la línea de receta.', 'error');
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm('¿Eliminar esta línea de la receta?')) {
            try {
                await deleteRecipeLine(id);
                addNotification('Línea de receta eliminada.', 'success');
                fetchRecipeData();
            } catch(error) {
                addNotification('Error al eliminar la línea.', 'error');
            }
        }
    };

    const totalCost = recipeLines.reduce((acc, line) => {
        const supply = supplies.find(s => s.id === line.supply_id);
        return acc + (supply ? supply.unit_cost * line.qty_per_sale : 0);
    }, 0);

    const columns = [
        { header: 'Insumo', accessor: (item: SupplyRecipeLine) => item.supply_name || item.supply_id },
        { header: 'Cantidad por Venta', accessor: (item: SupplyRecipeLine) => item.qty_per_sale },
        {
            header: 'Acciones',
            accessor: (item: SupplyRecipeLine) => (
                <div className="flex space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
            )
        }
    ];

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Receta Global de Insumos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Costo total por venta: <span className="font-bold text-blue-600 dark:text-blue-400">${totalCost.toFixed(2)}</span></p>
                </div>
                <Button onClick={() => handleOpenModal()}><PlusCircle className="w-4 h-4 mr-2" />Añadir a Receta</Button>
            </div>
            {isLoading ? <p>Cargando...</p> : <Table data={recipeLines} columns={columns} />}
            {isModalOpen && <RecipeLineForm initialData={editingLine} supplies={supplies} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </Card>
    );
};

// --- FORMS ---

interface SupplyFormProps {
    initialData: Supply | null;
    onSave: (data: Supply) => void;
    onClose: () => void;
}
const SupplyForm: React.FC<SupplyFormProps> = ({ initialData, onSave, onClose }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [unitCost, setUnitCost] = useState(initialData?.unit_cost.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: initialData?.id || Date.now(), seller_id: 1, name, unit_cost: parseFloat(unitCost) });
    };

    return (
        <Modal isOpen title={initialData ? 'Editar Insumo' : 'Añadir Insumo'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} required />
                <Input label="Costo Unitario" type="number" step="0.01" min="0" value={unitCost} onChange={e => setUnitCost(e.target.value)} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

interface RecipeLineFormProps {
    initialData: SupplyRecipeLine | null;
    supplies: Supply[];
    onSave: (data: SupplyRecipeLine) => void;
    onClose: () => void;
}
const RecipeLineForm: React.FC<RecipeLineFormProps> = ({ initialData, supplies, onSave, onClose }) => {
    const [supplyId, setSupplyId] = useState(initialData?.supply_id.toString() || '');
    const [qty, setQty] = useState(initialData?.qty_per_sale.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: initialData?.id || Date.now(), seller_id: 1, supply_id: parseInt(supplyId), qty_per_sale: parseFloat(qty) });
    };
    
    return (
        <Modal isOpen title={initialData ? 'Editar Línea de Receta' : 'Añadir a Receta'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="supply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insumo</label>
                    <select id="supply" value={supplyId} onChange={e => setSupplyId(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="">Seleccionar un insumo...</option>
                        {supplies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <Input label="Cantidad por Venta" type="number" step="0.01" min="0" value={qty} onChange={e => setQty(e.target.value)} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default SuppliesView;
