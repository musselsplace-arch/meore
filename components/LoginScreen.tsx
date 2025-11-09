import React, { useState } from 'react';
import { ACCESS_CODES, CHEFS } from '../constants';
import { Restaurant } from '../types';

interface LoginScreenProps {
  onLogin: (code: string, chef?: string) => void;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [code, setCode] = useState('');
  const [pendingRestaurant, setPendingRestaurant] = useState<Restaurant | null>(null);
  const [selectedChef, setSelectedChef] = useState('');

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const identity = ACCESS_CODES[code as keyof typeof ACCESS_CODES];
    
    if (identity === 'ADMIN') {
      onLogin(code);
    } else if (identity) { // It's a restaurant
      setPendingRestaurant(identity as Restaurant);
    } else {
      onLogin(code); // Let App component handle the error message
    }
  };

  const handleChefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChef) {
      onLogin(code, selectedChef);
    }
  };

  if (pendingRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pendingRestaurant}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">აირჩიეთ თქვენი სახელი</p>
          </div>
          <form onSubmit={handleChefSubmit} className="space-y-6">
            <div>
              <select
                value={selectedChef}
                onChange={(e) => setSelectedChef(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                required
              >
                <option value="" disabled>აირჩიეთ მზარეული</option>
                {CHEFS[pendingRestaurant].map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                disabled={!selectedChef}
              >
                შესვლა
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">შეკვეთების მენეჯერი</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">შეიყვანეთ წვდომის კოდი</p>
        </div>
        <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="წვდომის კოდი"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                    disabled={!code}
                >
                    შესვლა
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;