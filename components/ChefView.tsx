import React, { useState, useMemo } from 'react';
import { Restaurant, Product, OrderItem, OrderItemStatus, Order, Language } from '../types';
import { CHEFS, TRANSLATIONS } from '../constants';
import { ChevronDownIcon } from './Icons';

interface ChefViewProps {
  restaurant: Restaurant;
  chefName: string;
  language: Language;
  products: Product[];
  productCategories: Record<Language, string[]>;
  addOrder: (order: Omit<Order, 'id'>) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  logout: () => void;
}

const ProductSelector: React.FC<{ 
    language: Language; 
    products: Product[];
    productCategories: string[];
    onAddProductToOrder: (product: Product) => void; 
}> = ({ language, products, productCategories, onAddProductToOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const T = TRANSLATIONS[language];
  const nameKey = `name_${language}` as keyof Product;
  const categoryKey = `category_${language}` as keyof Product;

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(p => (p[nameKey] as string).toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, nameKey, products]);

  const groupedProducts = useMemo(() => {
    return productCategories.map(category => ({
      category,
      products: filteredProducts.filter(p => p[categoryKey] === category)
    })).filter(group => group.products.length > 0);
  }, [filteredProducts, categoryKey, productCategories]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <input
        type="text"
        placeholder={T.searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <div className="max-h-[60vh] overflow-y-auto">
        {groupedProducts.map(({ category, products }) => (
          <div key={category} className="mb-2">
             <button 
                onClick={() => toggleCategory(category)} 
                className="w-full flex justify-between items-center p-2 text-left font-bold text-lg text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
              <span>{category}</span>
              <ChevronDownIcon className={`w-5 h-5 transition-transform ${openCategories[category] ? 'rotate-180' : ''}`} />
            </button>
            {openCategories[category] && (
              <div className="mt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => onAddProductToOrder(product)}
                      className="p-3 text-sm text-center bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 rounded-md hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                    >
                      {product[nameKey]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ChefView: React.FC<ChefViewProps> = ({ restaurant, chefName, language, products, productCategories, addOrder, logout, onAddProduct }) => {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemUnit, setCustomItemUnit] = useState<'კგ' | 'ლიტრი' | 'ცალი' | 'შეკვრა'>('კგ');
  const [customItemCategory, setCustomItemCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  
  const T = TRANSLATIONS[language];
  const nameKey = `name_${language}` as keyof Product;

  const handleAddProductToOrder = (product: Product) => {
    if (currentOrderItems.some(item => item.product.id === product.id)) {
      return; // Avoid duplicates
    }
    setCurrentOrderItems(prev => [...prev, { product, status: OrderItemStatus.PENDING, quantity: 1, unit: product.defaultUnit }]);
  };

  const handleCreateAndAddCustomProduct = () => {
    const name = customItemName.trim();
    const isAddingNewCategory = customItemCategory === '__add_new__';
    const category = (isAddingNewCategory ? newCategoryName.trim() : customItemCategory).trim();

    if (!name || !category) return;

    const newProductData: Omit<Product, 'id'> = {
      name_ka: name,
      name_en: name, // Default to Georgian name
      name_ru: name, // Default to Georgian name
      category_ka: category,
      category_en: category, // Default to Georgian category
      category_ru: category, // Default to Georgian category
      defaultUnit: customItemUnit,
      restaurants: [restaurant],
    };

    onAddProduct(newProductData);

    // Reset form
    setCustomItemName('');
    setCustomItemUnit('კგ');
    setCustomItemCategory('');
    setNewCategoryName('');
  };

  const handleRemoveProduct = (productId: string) => {
    setCurrentOrderItems(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const handleUpdateItem = (productId: string, updates: Partial<Pick<OrderItem, 'quantity' | 'unit'>>) => {
      setCurrentOrderItems(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, ...updates } : item
        )
      );
  };

  const handleSubmitOrder = () => {
    if (currentOrderItems.length === 0) {
      alert(T.alertFillFields);
      return;
    }
    const newOrder = {
      restaurant,
      chef: chefName,
      date: new Date().toISOString(),
      items: currentOrderItems,
    };
    addOrder(newOrder);
    setCurrentOrderItems([]);
    alert(T.orderSent);
  };

  const welcomeMessage = `მოგესალმებით ${chefName}, რესტორან ${restaurant === Restaurant.MIDIEBI ? '"სამიდიეში"' : '"სახინკლეში"'}`;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
       <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          {restaurant} - {T.newOrder}
        </h1>
        <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {T.logout}
        </button>
      </header>
      
      {showWelcome && (
        <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-800 dark:text-green-200 p-4 mb-6 rounded-md shadow-md flex justify-between items-center" role="alert">
            <p className="font-bold">{welcomeMessage}</p>
            <button 
                onClick={() => setShowWelcome(false)}
                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
                დახურვა
            </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <ProductSelector 
            language={language} 
            products={products} 
            productCategories={productCategories[language]} 
            onAddProductToOrder={handleAddProductToOrder}
          />
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">{T.addCustomItemTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{T.itemName}</label>
                    <input
                        type="text"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{T.itemUnit}</label>
                    <select
                        value={customItemUnit}
                        onChange={(e) => setCustomItemUnit(e.target.value as any)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="კგ">კგ</option>
                        <option value="ლიტრი">ლიტრი</option>
                        <option value="ცალი">ცალი</option>
                        <option value="შეკვრა">შეკვრა</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{T.itemCategory}</label>
                    <select
                        value={customItemCategory}
                        onChange={(e) => setCustomItemCategory(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="" disabled>{T.selectCategory}</option>
                        {productCategories[language].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="__add_new__">{T.addNewCategory}</option>
                    </select>
                </div>
                {customItemCategory === '__add_new__' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{T.newCategoryName}</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                )}
            </div>
            <button
                onClick={handleCreateAndAddCustomProduct}
                disabled={!customItemName.trim() || !customItemCategory || (customItemCategory === '__add_new__' && !newCategoryName.trim())}
                className="mt-4 w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
                {T.addItem}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col h-full">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{T.currentOrder}</h2>
          
          <div className="flex-grow overflow-y-auto mb-4 border-t border-b border-gray-200 dark:border-gray-700 py-2">
            {currentOrderItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">{T.noProductsAdded}</p>
            ) : (
              <ul className="space-y-2">
                {currentOrderItems.map(item => (
                   <li key={item.product.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 gap-2">
                    <span className="font-medium text-sm sm:text-base">{item.product[nameKey]}</span>
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                      <button onClick={() => handleUpdateItem(item.product.id, { quantity: Math.max(0, item.quantity - 1) })} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-lg font-bold flex items-center justify-center">-</button>
                      <input 
                        type="number"
                        value={item.quantity} 
                        onChange={(e) => handleUpdateItem(item.product.id, { quantity: Number(e.target.value) })}
                        className="w-12 sm:w-14 p-1 text-center border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      />
                      <button onClick={() => handleUpdateItem(item.product.id, { quantity: item.quantity + 1 })} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-lg font-bold flex items-center justify-center">+</button>
                      <input 
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.product.id, { unit: e.target.value })}
                        className="w-16 sm:w-20 p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="ერთ."
                      />
                      <button
                        onClick={() => handleRemoveProduct(item.product.id)}
                        className="text-red-500 hover:text-red-700 text-2xl font-bold px-2"
                      >
                        &times;
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button
            onClick={handleSubmitOrder}
            disabled={currentOrderItems.length === 0}
            className="w-full mt-auto p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {T.submitOrder}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChefView;