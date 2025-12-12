import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { StockItem, ConsumptionLog } from '../types';
import { AlertTriangle, TrendingDown, Package, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<ConsumptionLog[]>([]);
  const [totalStockCount, setTotalStockCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch total stock count
      const { count } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (count !== null) setTotalStockCount(count);

      // Fetch low stock items
      const { data: stockData } = await supabase
        .from('stock')
        .select(`*, product:products(name)`)
        .eq('user_id', user.id);
      
      if (stockData) {
        // Filter in JS since "quantity <= threshold" comparison can be tricky with simple equality filters in supabase-js sometimes, 
        // but .lte() works. Using JS filter here for simplicity with Types.
        const low = stockData.filter(item => item.quantity <= item.threshold);
        setLowStock(low);
      }

      // Fetch recent consumption
      const { data: logData } = await supabase
        .from('consumption_logs')
        .select(`*, product:products(name)`)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      if (logData) setRecentLogs(logData);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-display font-bold text-gray-800">Bonjour, <span className="text-mint-600">{user?.email?.split('@')[0]}</span></h2>
        <p className="text-gray-500 mt-1">Voici le résumé de votre foyer aujourd'hui.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Produits en Stock</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{totalStockCount}</p>
          </div>
          <div className="p-3 bg-aqua-50 text-aqua-600 rounded-xl">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Alertes Stock</p>
            <p className={`text-3xl font-bold mt-1 ${lowStock.length > 0 ? 'text-honey-600' : 'text-gray-800'}`}>
              {lowStock.length}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${lowStock.length > 0 ? 'bg-honey-50 text-honey-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Activité Récente</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{recentLogs.length}</p>
          </div>
          <div className="p-3 bg-mint-50 text-mint-600 rounded-xl">
            <Activity size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Low Stock Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold font-display text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-honey-600" />
            Stock Critique
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm italic">Tout va bien, le stock est suffisant.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-honey-50 rounded-xl border border-honey-100">
                  <span className="font-medium text-gray-700">{item.product?.name || 'Produit inconnu'}</span>
                  <span className="text-sm font-bold text-honey-600 bg-white px-3 py-1 rounded-lg">
                    {item.quantity} restants
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Consumption Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold font-display text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-aqua-600" />
            Consommation Récente
          </h3>
          <div className="space-y-0">
             {recentLogs.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Aucune consommation récente.</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">{log.product?.name || 'Inconnu'}</span>
                      <span className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-bold text-aqua-600 bg-aqua-50 px-3 py-1 rounded-full">
                      -{log.quantity}
                    </span>
                  </div>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;