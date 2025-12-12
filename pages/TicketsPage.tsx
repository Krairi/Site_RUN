import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { Plus, Trash2, Save, ShoppingBag } from 'lucide-react';

interface TicketItemRow {
  productName: string;
  quantity: number;
  price: number;
}

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<TicketItemRow[]>([{ productName: '', quantity: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<{[key: number]: Product[]}>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setExistingProducts(data);
  };

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof TicketItemRow, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);

    if (field === 'productName') {
        const filtered = existingProducts.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
        setSuggestions(prev => ({...prev, [index]: filtered.slice(0, 5)}));
    }
  };
  
  const selectSuggestion = (index: number, name: string) => {
      const newItems = [...items];
      newItems[index].productName = name;
      setItems(newItems);
      setSuggestions(prev => ({...prev, [index]: []}));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // 1. Create Receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          store_name: storeName,
          date: date,
          total_amount: totalAmount
        })
        .select()
        .single();

      if (receiptError) throw receiptError;
      if (!receipt) throw new Error("Erreur création ticket");

      // 2. Process Items
      for (const item of items) {
        if (!item.productName.trim()) continue;

        // Find or Create Product
        let productId: number;
        let product = existingProducts.find(p => p.name.toLowerCase() === item.productName.toLowerCase());

        if (product) {
          productId = product.id;
        } else {
          const { data: newProduct, error: prodError } = await supabase
            .from('products')
            .insert({ name: item.productName })
            .select()
            .single();
          
          if (prodError) throw prodError;
          productId = newProduct.id;
          // Optimistically update local cache
          setExistingProducts(prev => [...prev, newProduct]);
        }

        // Create Receipt Item
        await supabase
          .from('receipt_items')
          .insert({
            receipt_id: receipt.id,
            product_id: productId,
            quantity: item.quantity,
            price_unit: item.price
          });

        // Update or Create Stock
        const { data: stockItem } = await supabase
          .from('stock')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .single();

        if (stockItem) {
          await supabase
            .from('stock')
            .update({ quantity: stockItem.quantity + Number(item.quantity) })
            .eq('id', stockItem.id);
        } else {
          await supabase
            .from('stock')
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity: item.quantity,
              threshold: 5 // Default threshold
            });
        }
      }

      alert('Ticket enregistré et stock mis à jour !');
      // Reset form
      setStoreName('');
      setItems([{ productName: '', quantity: 1, price: 0 }]);
      
    } catch (error: any) {
      console.error(error);
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-display font-bold text-gray-800">Nouveau Ticket</h2>
        <p className="text-gray-500 mt-1">Saisissez votre ticket de caisse pour mettre à jour le stock automatiquement.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-aqua-50 p-4 border-b border-aqua-100 flex items-center gap-3">
          <ShoppingBag className="text-aqua-600" />
          <h3 className="font-semibold text-aqua-800">Détails du ticket</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Magasin</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-200 focus:border-aqua-500 outline-none"
                placeholder="ex: Carrefour"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-200 focus:border-aqua-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Articles</label>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start relative">
                 <div className="flex-1 relative">
                    <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-aqua-200 outline-none"
                    placeholder="Produit"
                    />
                    {suggestions[index] && suggestions[index].length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                            {suggestions[index].map(s => (
                                <div 
                                    key={s.id} 
                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                    onClick={() => selectSuggestion(index, s.name)}
                                >
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-aqua-200 outline-none"
                  placeholder="Qté"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-aqua-200 outline-none"
                  placeholder="Prix/u"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 text-sm text-aqua-600 hover:text-aqua-700 font-medium px-2"
            >
              <Plus size={16} />
              Ajouter une ligne
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-mint-600 hover:bg-mint-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-mint-200 transition-all active:scale-95"
            >
              <Save size={20} />
              {loading ? 'Traitement...' : 'Enregistrer le ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketsPage;