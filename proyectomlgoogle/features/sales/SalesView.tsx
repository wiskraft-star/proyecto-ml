
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import SyncButton from '../../components/SyncButton';
import { Sale, SaleItem } from '../../types';
import { getSales } from '../../services/supabaseService';
import { syncSales } from '../../services/mlService';

const SalesView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSales();
      setSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);
  
  const handleRowClick = (saleId: number) => {
    setExpandedRow(expandedRow === saleId ? null : saleId);
  }

  const columns = [
    { header: 'Fecha Venta', accessor: (item: Sale) => new Date(item.sold_at).toLocaleString() },
    { header: 'ID Económico', accessor: (item: Sale) => <span className="font-mono text-sm">{item.economic_id}</span> },
    { header: 'Order ID', accessor: (item: Sale) => <span className="font-mono text-sm">{item.order_id || '-'}</span> },
    { header: 'Pack ID', accessor: (item: Sale) => <span className="font-mono text-sm">{item.pack_id || '-'}</span> },
    {
      header: 'Status',
      accessor: (item: Sale) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    { header: 'Items', accessor: (item: Sale) => item.items.length },
  ];

  const renderTable = () => {
    if (isLoading) return <p className="text-center text-gray-500 dark:text-gray-400">Cargando ventas...</p>;

    const allRows = sales.flatMap(sale => {
      const rows = [<tr key={sale.id} onClick={() => handleRowClick(sale.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          {columns.map((col, colIndex) => (
              <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {col.accessor(sale)}
              </td>
          ))}
      </tr>];

      if (expandedRow === sale.id) {
          rows.push(
              <tr key={`${sale.id}-details`} className="bg-gray-50 dark:bg-gray-700">
                  <td colSpan={columns.length} className="p-4">
                      <div className="text-sm text-gray-800 dark:text-gray-200">
                          <h4 className="font-bold mb-2">Items:</h4>
                          <ul>
                              {sale.items.map((item: SaleItem) => (
                                  <li key={item.id} className="flex justify-between py-1">
                                      <span>{item.quantity}x {item.title}</span>
                                      <span className="font-mono text-xs">SKU: {item.sku}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </td>
              </tr>
          );
      }
      return rows;
    });

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {allRows.length > 0 ? allRows : (
                    <tr><td colSpan={columns.length} className="text-center p-4">No hay ventas para mostrar.</td></tr>
                  )}
                </tbody>
            </table>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Ventas de Mercado Libre</h2>
          <SyncButton label="Sincronizar Ventas" syncFn={syncSales} onSyncComplete={fetchSales} />
        </div>
      </Card>
      <Card>
        {renderTable()}
      </Card>
    </div>
  );
};

export default SalesView;
