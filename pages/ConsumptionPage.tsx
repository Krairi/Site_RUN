import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { ConsumptionLog, StockItem } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { PlusCircle, MinusCircle } from 'lucide-react';

const ConsumptionPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Colors for charts
  const COLORS = ['#76D7C4', '#5DADE2', '#F5B041', '#E74C3C', '#8E44AD'];

  useEffect(() => {
    if (!user) return;
    fetchInitialData();

    // Realtime subscription
    const channel = supabase
      .channel('public:consumption_logs')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'consumption_logs', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          // Fetch the full log including product name for display
          fetchOneLog(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;
    
    // Fetch logs
    const { data: logData } = await supabase
      .from('consumption_logs')
      .select(`*, product:products(name)`)
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (logData) setLogs(logData);

    // Fetch stock for manual consumption
    const { data: stockData } = await supabase
      .from('stock')
      .select(`*, product:products(name)`)
      .eq('user_id', user.id);
    
    if (stockData) setStock(stockData);
  };

  const fetchOneLog = async (id: number) => {
    const { data } = await supabase
        .from('consumption_logs')
        .select(`*, product:products(name)`)
        .eq('id', id)
        .single();
    if (data) {
        setLogs(prev => [data, ...prev]);
    }
  }

  const handleQuickConsume = async (qty: number) => {
    if (!selectedProduct || !user) return;
    
    // 1. Add log
    await supabase.from('consumption_logs').insert({
        user_id: user.id,
        product_id: selectedProduct,
        quantity: qty,
        date: new Date().toISOString()
    });

    // 2. Update stock (decrement)
    const currentStock = stock.find(s => s.product_id === selectedProduct);
    if(currentStock) {
        await supabase.from('stock').update({
            quantity: Math.max(0, currentStock.quantity - qty)
        }).eq('id', currentStock.id);
        
        // Update local stock
        setStock(prev => prev.map(s => s.id === currentStock.id ? {...s, quantity: Math.max(0, s.quantity - qty)} : s));
    }
  };

  // Prepare data for charts
  const logsByProduct = logs.reduce((acc, log) => {
    const name = log.product?.name || 'Inconnu';
    acc[name] = (acc[name] || 0) + log.quantity;
    return acc;
  }, {} as {[key: string]: number});

  const chartData = Object.keys(logsByProduct).map(name => ({
    name: name.length > 10 ? name.substring(0, 10) + '...' : name,
    quantity: logsByProduct[name]
  })).slice(0, 10); // Top 10

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-display font-bold text-gray-800">Consommation</h2>
        <p className="text-gray-500 mt-1">Suivi en temps réel.</p>
      </header>

      {/* Manual Action Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-700">Déclarer une consommation</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="w-full md:w-1/2">
                <label className="block text-sm text-gray-600 mb-1">Produit</label>
                <select 
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50"
                    onChange={(e) => setSelectedProduct(Number(e.target.value))}
                    value={selectedProduct || ''}
                >
                    <option value="">Sélectionner un produit...</option>
                    {stock.map(s => (
                        <option key={s.id} value={s.product_id}>{s.product?.name} (En stock: {s.quantity})</option>
                    ))}
                </select>
             </div>
             <div className="flex gap-2">
                 <button 
                    onClick={() => handleQuickConsume(1)}
                    disabled={!selectedProduct}
                    className="flex items-center gap-2 bg-aqua-500 hover:bg-aqua-600 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                 >
                     <MinusCircle size={20} /> Consommer 1
                 </button>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Top Consommation</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                cursor={{fill: '#F3F4F6'}}
              />
              <Bar dataKey="quantity" fill="#76D7C4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Répartition</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="quantity"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
       {/* Log List */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Historique</h3>
          <div className="overflow-y-auto max-h-60">
            {logs.map((log) => (
                <div key={log.id} className="flex justify-between items-center py-3 border-b border-gray-50 text-sm">
                    <span className="text-gray-800">{log.product?.name}</span>
                    <span className="text-gray-500">{new Date(log.date).toLocaleString()}</span>
                    <span className="font-bold text-red-400">-{log.quantity}</span>
                </div>
            ))}
          </div>
       </div>

    </div>
  );
};

export default ConsumptionPage;