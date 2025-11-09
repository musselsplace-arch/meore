import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, UserRole, Restaurant, Order, OrderItemStatus, UnavailableItem, Language, OrderItem, Product, OrderedHistoryItem, SupplierOrderItem } from './types';
import LoginScreen from './components/LoginScreen';
import ChefView from './components/ChefView';
import AdminView from './components/AdminView';
import { ACCESS_CODES, PRODUCTS } from './constants';
import { DownloadIcon } from './components/Icons';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';

const LanguageSelector: React.FC<{ onSelectLanguage: (lang: Language) => void }> = ({ onSelectLanguage }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">აირჩიეთ ენა / Select Language / Выберите язык</h2>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={() => onSelectLanguage('ka')} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">ქართული</button>
        <button onClick={() => onSelectLanguage('en')} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">English</button>
        <button onClick={() => onSelectLanguage('ru')} className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Русский</button>
      </div>
    </div>
  </div>
);

const LoadingScreen: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600 mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">იტვირთება...</h2>
            <p className="text-gray-500 dark:text-gray-400">გთხოვთ, დაელოდოთ.</p>
        </div>
    </div>
);


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [unavailableItems, setUnavailableItems] = useState<UnavailableItem[]>([]);
  const [orderedHistory, setOrderedHistory] = useState<OrderedHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data Fetching from Firestore
  useEffect(() => {
    setIsLoading(true);
    // Seed initial products if collection is empty
    const productsRef = collection(db, "products");
    const checkAndSeed = async () => {
        const snapshot = await getDocs(productsRef);
        if (snapshot.empty) {
            console.log("Products collection is empty. Seeding initial data...");
            const batch = writeBatch(db);
            PRODUCTS.forEach(product => {
                const { id, ...data } = product; 
                batch.set(doc(productsRef, id), data);
            });
            await batch.commit();
            console.log("Initial products seeded.");
        }
    };

    const unsubscribes = [
        onSnapshot(collection(db, "products"), (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
        }),
        onSnapshot(query(collection(db, "activeOrders"), orderBy("date", "desc")), (snapshot) => {
            setActiveOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order)));
        }),
        onSnapshot(query(collection(db, "completedOrders"), orderBy("completionDate", "desc")), (snapshot) => {
            setCompletedOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order)));
        }),
        onSnapshot(query(collection(db, "unavailableItems"), orderBy("date", "desc")), (snapshot) => {
            setUnavailableItems(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UnavailableItem)));
        }),
        onSnapshot(query(collection(db, "orderedHistory"), orderBy("date", "desc")), (snapshot) => {
            setOrderedHistory(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as OrderedHistoryItem)));
        })
    ];
    
    checkAndSeed().finally(() => setIsLoading(false));

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      setInstallPrompt(null);
    });
  };

  const productCategories = useMemo(() => {
    const categories: Record<Language, string[]> = { ka: [], en: [], ru: [] };
    const catKaSet = new Set<string>();
    const catEnSet = new Set<string>();
    const catRuSet = new Set<string>();

    products.forEach(p => {
        catKaSet.add(p.category_ka);
        catEnSet.add(p.category_en);
        catRuSet.add(p.category_ru);
    });

    // FIX: Use custom sorting for Georgian categories for better UX.
    const kaOrder = ['ალკოჰოლური სასმელები და ღვინო', 'ხორცი და ხორცპროდუქტები', 'ზღვის პროდუქტები', 'რძის პროდუქტები და ყველი', 'ბოსტნეული, ხილი, თხილი და მწვანილი', 'ბურღულეული, ფქვილი და სხვა მშრალი პროდუქტები', 'სოუსები და პიურეები', 'სუნელები და სანელებლები', 'ზეთები და ცხიმები', 'სასმელები (უალკოჰოლო)', 'სხვა პროდუქტები', 'ლუდი', 'სასმელები', 'ზეთები', 'რძის პროდუქტები', 'ბოსტნეული', 'მწვანილი', 'თხილეული', 'პურ-ფუნთუშეული', 'ღვინო', 'ხორცი', 'სოუსები', 'ბურღულეული', 'სხვა'];
    
    categories.ka = [...catKaSet].sort((a, b) => {
        const indexA = kaOrder.indexOf(a);
        const indexB = kaOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b, 'ka-GE');
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    categories.en = [...catEnSet].sort();
    categories.ru = [...catRuSet].sort();
    return categories;
  }, [products]);

  const handleLogin = (code: string, chef?: string) => {
    const identity = ACCESS_CODES[code as keyof typeof ACCESS_CODES];
    if (identity) {
      if (identity === 'ADMIN') {
        setUser({ role: UserRole.ADMIN });
        setLoginError(null);
      } else if (chef) {
        setUser({ role: UserRole.CHEF, restaurant: identity as Restaurant, name: chef });
        setLoginError(null);
      }
    } else {
      setLoginError('არასწორი კოდი. გთხოვთ სცადოთ თავიდან.');
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    setLanguage(null);
  };
  
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    await addDoc(collection(db, "products"), productData);
  };
  
  const handleUpdateProduct = async (updatedProduct: Product) => {
    const { id, ...data } = updatedProduct;
    await updateDoc(doc(db, "products", id), data);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if(window.confirm('ნამდვილად გსურთ პროდუქტის წაშლა?')) {
        await deleteDoc(doc(db, "products", productId));
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id'>) => {
    await addDoc(collection(db, "activeOrders"), orderData);
  };
  
  const updateOrderItemStatus = useCallback(async (orderId: string, productId: string, status: OrderItemStatus) => {
    const orderRef = doc(db, "activeOrders", orderId);
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;
    const updatedItems = order.items.map(item => {
        if (item.product.id === productId) {
            const finalStatus = item.status === status ? OrderItemStatus.PENDING : status;
            return { ...item, status: finalStatus };
        }
        return item;
    });
    await updateDoc(orderRef, { items: updatedItems });
  }, [activeOrders]);

  const updateOrderItemDetails = useCallback(async (orderId: string, productId: string, details: Partial<Pick<OrderItem, 'actualQuantity' | 'pricePerUnit'>>) => {
    const orderRef = doc(db, "activeOrders", orderId);
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;
    const updatedItems = order.items.map(item => {
        if (item.product.id === productId) {
            const updatedItem = { ...item };
            if (details.actualQuantity !== undefined && !isNaN(details.actualQuantity)) updatedItem.actualQuantity = details.actualQuantity;
            if (details.pricePerUnit !== undefined && !isNaN(details.pricePerUnit)) updatedItem.pricePerUnit = details.pricePerUnit;
            return updatedItem;
        }
        return item;
    });
    await updateDoc(orderRef, { items: updatedItems });
  }, [activeOrders]);

  const completeOrder = useCallback(async (orderId: string) => {
    const orderToComplete = activeOrders.find(o => o.id === orderId);
    if (!orderToComplete) return;

    const batch = writeBatch(db);
    const completedOrderData = { ...orderToComplete, completionDate: new Date().toISOString() };
    const { id, ...completedData } = completedOrderData;
    batch.set(doc(collection(db, "completedOrders")), completedData);

    orderToComplete.items.forEach(item => {
        if (item.status === OrderItemStatus.UNAVAILABLE) {
            const unavailableData = { product: item.product, date: orderToComplete.date, orderId: orderToComplete.id, restaurant: orderToComplete.restaurant };
            batch.set(doc(collection(db, "unavailableItems")), unavailableData);
        }
    });

    batch.delete(doc(db, "activeOrders", orderId));
    await batch.commit();
  }, [activeOrders]);

  const handleMarkAsOrdered = useCallback(async (selectedItemIds: Set<string>) => {
    if (selectedItemIds.size === 0) return;
    
    const batch = writeBatch(db);
    const itemsToOrder: SupplierOrderItem[] = [];
    const updatedOrdersMap = new Map<string, OrderItem[]>();

    selectedItemIds.forEach(itemId => {
        const [orderId, productId] = itemId.split('-');
        const order = activeOrders.find(o => o.id === orderId);
        const item = order?.items.find(i => i.product.id === productId);

        if (order && item) {
            itemsToOrder.push({ product: item.product, quantity: item.actualQuantity ?? item.quantity, unit: item.unit, restaurant: order.restaurant, chef: order.chef });
            if (!updatedOrdersMap.has(orderId)) {
                updatedOrdersMap.set(orderId, order.items);
            }
        }
    });

    updatedOrdersMap.forEach((items, orderId) => {
        const newItems = items.filter(item => !selectedItemIds.has(`${orderId}-${item.product.id}`));
        const orderRef = doc(db, "activeOrders", orderId);
        if (newItems.length > 0) {
            batch.update(orderRef, { items: newItems });
        } else {
            batch.delete(orderRef);
        }
    });
    
    if (itemsToOrder.length > 0) {
        const newHistoryData = { date: new Date().toISOString(), items: itemsToOrder };
        batch.set(doc(collection(db, "orderedHistory")), newHistoryData);
    }
    
    await batch.commit();
  }, [activeOrders]);

  const handleUpdateSupplierForItem = useCallback(async (historyItemId: string, itemIndex: number, supplier: string) => {
    const historyItem = orderedHistory.find(h => h.id === historyItemId);
    if (!historyItem) return;
    const newItems = [...historyItem.items];
    if (newItems[itemIndex]) {
        newItems[itemIndex] = { ...newItems[itemIndex], supplier };
    }
    await updateDoc(doc(db, "orderedHistory", historyItemId), { items: newItems });
  }, [orderedHistory]);

  const renderContent = () => {
    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!user) {
      return <LoginScreen onLogin={handleLogin} error={loginError} />;
    }

    if (user.role === UserRole.ADMIN) {
       return <AdminView
          products={products}
          productCategories={productCategories.ka}
          activeOrders={activeOrders}
          completedOrders={completedOrders}
          unavailableItems={unavailableItems}
          orderedHistory={orderedHistory}
          updateOrderItemStatus={updateOrderItemStatus}
          updateOrderItemDetails={updateOrderItemDetails}
          completeOrder={completeOrder}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onMarkAsOrdered={handleMarkAsOrdered}
          onUpdateSupplier={handleUpdateSupplierForItem}
          logout={handleLogout}
        />;
    }
    
    if (user.role === UserRole.CHEF) {
        if (!language) {
            return <LanguageSelector onSelectLanguage={setLanguage} />;
        }
        if (user.restaurant && user.name) {
            const chefProducts = products.filter(p => p.restaurants.includes(user.restaurant!));
            
            return <ChefView 
                restaurant={user.restaurant} 
                chefName={user.name}
                language={language}
                products={chefProducts}
                productCategories={productCategories}
                addOrder={addOrder} 
                onAddProduct={handleAddProduct}
                logout={handleLogout}
            />;
        }
    }
    
    return <LoginScreen onLogin={handleLogin} error="An unexpected error occurred." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {renderContent()}
      {installPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg animate-bounce"
            aria-label="Install App"
          >
            <DownloadIcon className="w-6 h-6" />
            აპლიკაციის ჩაწერა
          </button>
        </div>
      )}
    </div>
  );
};

export default App;