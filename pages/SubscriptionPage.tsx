import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Plan, Subscription } from '../types';
import { CheckCircle, Crown, Shield, Users } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([
      { id: 1, name: 'Free', price: 0, features: ['Gestion stock basique', 'Max 50 produits', '1 utilisateur'] },
      { id: 2, name: 'Premium', price: 4.99, features: ['Stock illimité', 'Alertes SMS', 'Analyses avancées', 'Support prioritaire'] },
      { id: 3, name: 'Family', price: 9.99, features: ['Tout Premium', 'Utilisateurs illimités', 'Sync multi-appareils', 'Mode enfants'] }
  ]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);

  useEffect(() => {
    if (user) fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user!.id)
      .single();
    if (data) setCurrentSub(data);
  };

  const handleSelectPlan = async (planId: number) => {
    if (!user) return;
    
    const status = 'active'; // In a real app, this would be pending until stripe callback

    if (currentSub) {
      await supabase
        .from('subscriptions')
        .update({ plan_id: planId, status })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({ user_id: user.id, plan_id: planId, status });
    }
    
    fetchSubscription();
    alert("Plan mis à jour avec succès ! (Simulation)");
  };

  const getIcon = (id: number) => {
      switch(id) {
          case 2: return <Crown className="text-honey-500" size={32} />;
          case 3: return <Users className="text-aqua-500" size={32} />;
          default: return <Shield className="text-gray-400" size={32} />;
      }
  }

  const getColor = (id: number) => {
      switch(id) {
          case 2: return 'border-honey-200 bg-honey-50';
          case 3: return 'border-aqua-200 bg-aqua-50';
          default: return 'border-gray-200 bg-white';
      }
  }

  return (
    <div className="space-y-8">
      <header className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-display font-bold text-gray-800 mb-4">Plans & Abonnements</h2>
        <p className="text-gray-500 text-lg">Choisissez la formule qui correspond le mieux à votre foyer.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isActive = currentSub?.plan_id === plan.id || (!currentSub && plan.id === 1);
          return (
            <div 
                key={plan.id} 
                className={`relative rounded-2xl p-8 border-2 transition-all duration-300 hover:-translate-y-2 ${
                    isActive ? 'border-mint-500 shadow-xl ring-4 ring-mint-50' : getColor(plan.id)
                } ${plan.id === 2 ? 'shadow-lg' : ''}`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-mint-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                  ACTUEL
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-xl font-bold font-display text-gray-800">{plan.name}</h3>
                   <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}€</span>
                      <span className="text-gray-500 ml-1">/mois</span>
                   </div>
                </div>
                {getIcon(plan.id)}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                    <CheckCircle size={16} className="text-mint-500 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isActive}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isActive 
                    ? 'bg-gray-100 text-gray-400 cursor-default' 
                    : 'bg-gray-800 text-white hover:bg-gray-900 shadow-lg shadow-gray-200'
                }`}
              >
                {isActive ? 'Activé' : 'Choisir ce plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;