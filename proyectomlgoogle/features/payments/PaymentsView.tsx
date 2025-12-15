
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import SyncButton from '../../components/SyncButton';
import { Payment } from '../../types';
import { getPayments } from '../../services/supabaseService';
import { syncPayments } from '../../services/mpService';

const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPayments();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const columns = [
    { header: 'Fecha Pago', accessor: (item: Payment) => new Date(item.paid_at).toLocaleString() },
    { header: 'MP Payment ID', accessor: (item: Payment) => <span className="font-mono text-sm">{item.mp_payment_id}</span> },
    { header: 'Order ID', accessor: (item: Payment) => <span className="font-mono text-sm">{item.order_id || '-'}</span> },
    { header: 'ID Económico', accessor: (item: Payment) => <span className="font-mono text-sm">{item.economic_id || '-'}</span> },
    { header: 'Bruto', accessor: (item: Payment) => `$${item.gross_amount.toFixed(2)}` },
    { header: 'Comisiones', accessor: (item: Payment) => `$${item.fees_amount.toFixed(2)}` },
    { header: 'Neto', accessor: (item: Payment) => <span className="font-semibold text-green-600 dark:text-green-400">${item.net_amount.toFixed(2)}</span> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Cobros de Mercado Pago</h2>
          <SyncButton label="Sincronizar Cobros" syncFn={syncPayments} onSyncComplete={fetchPayments} />
        </div>
      </Card>
      <Card>
        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Cargando cobros...</p>
        ) : (
          <Table data={payments} columns={columns} />
        )}
      </Card>
    </div>
  );
};

export default PaymentsView;
