import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-display font-bold text-gray-800">Mon Compte</h2>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-mint-100 rounded-full flex items-center justify-center text-mint-600">
            <User size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Utilisateur</h3>
            <p className="text-gray-500">Membre depuis {new Date(user?.created_at || '').toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <Mail className="text-gray-400 mr-4" size={20} />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <Shield className="text-gray-400 mr-4" size={20} />
            <div>
              <p className="text-sm text-gray-500">ID Utilisateur</p>
              <p className="font-medium text-gray-800 font-mono text-xs">{user?.id}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={signOut}
            className="w-full py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;