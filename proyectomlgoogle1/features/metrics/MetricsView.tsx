
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { SaleMargin, Kpi, SaleItem } from '../../types';
import { getSaleMargins } from '../../services/supabaseService';
import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

const KpiCard: React.FC<{ kpi: Kpi }> = ({ kpi }) => (
  <Card>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{kpi.title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{kpi.value}</p>
    {kpi.change && (
      <p className="mt-1 flex items-baseline text-sm font-semibold">
        {kpi.changeType === 'increase' ? (
          <ArrowUp className="h-5 w-5 self-center text-green-500" />
        ) : (
          <ArrowDown className="h-5 w-5 self-center text-red-500" />
        )}
        <span className="ml-1">{kpi.change}</span>
        <span className="ml-1 text-gray-500">vs mes anterior</span>
      </p>
    )}
  </Card>
);

const MetricsView: React.FC = () => {
  const [margins, setMargins] = useState<SaleMargin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchMargins = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSaleMargins();
      setMargins(data);
    } catch (error) {
      console.error("Error fetching sale margins:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMargins();
  }, [fetchMargins]);

  const kpis = useMemo<Kpi[]>(() => {
    if (!margins.length) return [];
    const netTotal = margins.reduce((acc, curr) => acc + (curr.net_amount || 0), 0);
    const cogsTotal = margins.reduce((acc, curr) => acc + (curr.cogs || 0), 0);
    const suppliesTotal = margins.reduce((acc, curr) => acc + (curr.supplies || 0), 0);
    const marginTotal = margins.reduce((acc, curr) => acc + (curr.margin || 0), 0);
    const marginPercentage = netTotal > 0 ? (marginTotal / netTotal) * 100 : 0;

    return [
      { title: 'Facturación Neta', value: `$${netTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
      { title: 'COGS Total', value: `$${cogsTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
      { title: 'Insumos Total', value: `$${suppliesTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
      { title: 'Margen Total', value: `$${marginTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, changeType: marginTotal > 0 ? 'increase' : 'decrease' },
      { title: 'Margen %', value: `${marginPercentage.toFixed(2)}%` },
    ];
  }, [margins]);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };
  
  const getMissingFlag = (item: SaleMargin) => {
      const missing = [];
      if (item.net_amount === null) missing.push("Neto");
      if (item.cogs === null) missing.push("COGS");
      if (item.supplies === null) missing.push("Insumos");
      if (missing.length === 0) return null;

      return (
          <div className="flex items-center text-yellow-500" title={`Faltante: ${missing.join(', ')}`}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="text-xs">{missing.join(', ')}</span>
          </div>
      );
  };

  const columns = [
    { header: 'Fecha', accessor: (item: SaleMargin) => new Date(item.sold_at).toLocaleDateString() },
    { header: 'ID Económico', accessor: (item: SaleMargin) => <span className="font-mono text-sm">{item.economic_id}</span> },
    { header: 'Neto', accessor: (item: SaleMargin) => formatCurrency(item.net_amount) },
    { header: 'COGS', accessor: (item: SaleMargin) => formatCurrency(item.cogs) },
    { header: 'Insumos', accessor: (item: SaleMargin) => formatCurrency(item.supplies) },
    { header: 'Margen', accessor: (item: SaleMargin) => <span className={item.margin && item.margin < 0 ? 'text-red-500' : 'text-green-500'}>{formatCurrency(item.margin)}</span> },
    { header: 'Faltantes', accessor: (item: SaleMargin) => getMissingFlag(item) },
  ];

  const handleRowClick = (saleId: number) => {
      setExpandedRow(expandedRow === saleId ? null : saleId);
  }

  const renderTable = () => {
    if (isLoading) return <p className="text-center text-gray-500 dark:text-gray-400">Cargando métricas...</p>;
    
    const allRows = margins.flatMap(margin => {
        const rows = [<tr key={margin.sale_id} onClick={() => handleRowClick(margin.sale_id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {col.accessor(margin)}
                </td>
            ))}
        </tr>];
        if (expandedRow === margin.sale_id) {
            rows.push(
                <tr key={`${margin.sale_id}-details`} className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={columns.length} className="p-4">
                        <div className="text-sm text-gray-800 dark:text-gray-200">
                            <h4 className="font-bold mb-2">Items de la Venta:</h4>
                            <ul>
                                {margin.items.map((item: SaleItem) => (
                                    <li key={item.id} className="flex justify-between">
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
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map(kpi => <KpiCard key={kpi.title} kpi={kpi} />)}
      </div>
      <Card title="Detalle de Margen por Venta">
        {renderTable()}
      </Card>
    </div>
  );
};

export default MetricsView;
