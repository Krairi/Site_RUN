import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { StockItem } from '../types';
import { Search, AlertCircle, Edit2, Check, X } from 'lucide-react';

const StockPage: React.FC = () => {
  const { user } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{quantity: number, threshold: number}>({ quantity: 0, threshold: 0 });

  useEffect(() => {
    if (user) fetchStock();
  }, [user]);

  const fetchStock = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('stock')
      .select(`
        *,
        product:products(name, category, unit)
      `)
      .eq('user_id', user.id);
    
    if (data) setStock(data);
  };

  const startEdit = (item: StockItem) => {
    setEditingId(item.id);
    setEditForm({ quantity: item.quantity, threshold: item.threshold });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    await supabase
      .from('stock')
      .update({ quantity: editForm.quantity, threshold: editForm.threshold })
      .eq('id', id);
    
    setEditingId(null);
    fetchStock();
  };

  const filteredStock = stock.filter(item => 
    item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-800">Mon Stock</h2>
          <p className="text-gray-500 mt-1">Gérez vos quantités et vos seuils d'alerte.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-mint-200 outline-none w-full md:w-64"
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium text-sm">
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Quantité</th>
                <th className="px-6 py-4">Seuil d'alerte</th>
                <th className="px-6 py-4">État</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStock.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {item.product?.name}
                    <span className="block text-xs text-gray-400 font-normal">{item.product?.category}</span>
                  </td>
                  
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <input 
                        type="number" 
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({...editForm, quantity: Number(e.target.value)})}
                        className="w-20 px-2 py-1 border rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-600">{item.quantity} {item.product?.unit}</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                     {editingId === item.id ? (
                      <input 
                        type="number" 
                        value={editForm.threshold}
                        onChange={(e) => setEditForm({...editForm, threshold: Number(e.target.value)})}
                        className="w-20 px-2 py-1 border rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500">{item.threshold}</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {item.quantity <= item.threshold ? (
                      <span className="inline-flex items-center gap-1 bg-honey-50 text-honey-600 px-3 py-1 rounded-full text-xs font-bold">
                        <AlertCircle size={12} /> Faible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-mint-50 text-mint-600 px-3 py-1 rounded-full text-xs font-bold">
                         OK
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item.id)} className="text-mint-600 hover:bg-mint-50 p-1 rounded"><Check size={18} /></button>
                        <button onClick={cancelEdit} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={18} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-aqua-600 transition-colors">
                        <Edit2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStock.length === 0 && (
            <div className="p-8 text-center text-gray-400 italic">Aucun produit trouvé.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockPage;