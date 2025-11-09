import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderItem, UnavailableItem, OrderItemStatus, Restaurant, Product, OrderedHistoryItem, SupplierOrderItem } from '../types';
import { 
    CheckIcon, UnavailableIcon, HistoryIcon, ListIcon, LogoutIcon, 
    ChevronDownIcon, CoinIcon, PencilIcon, TrashIcon, 
    PlusCircleIcon, WrenchScrewdriverIcon, PaperAirplaneIcon, SparklesIcon
} from './Icons';
import { SUPPLIERS } from '../constants';
import AIAnalyticsView from './AIAnalyticsView';

interface AdminViewProps {
  products: Product[];
  productCategories: string[];
  activeOrders: Order[];
  completedOrders: Order[];
  unavailableItems: UnavailableItem[];
  orderedHistory: OrderedHistoryItem[];
  updateOrderItemStatus: (orderId: string, productId: string, status: OrderItemStatus) => void;
  updateOrderItemDetails: (orderId: string, productId: string, details: Partial<Pick<OrderItem, 'actualQuantity' | 'pricePerUnit'>>) => void;
  completeOrder: (orderId: string) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onMarkAsOrdered: (selectedItemIds: Set<string>) => void;
  onUpdateSupplier: (historyItemId: string, itemIndex: number, supplier: string) => void;
  logout: () => void;
}

const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ka-GE', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('ka-GE', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
}

const NotificationPrompter: React.FC = () => {
    const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'denied');

    const requestPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(setPermission);
        }
    };

    if (permission === 'default') {
        return (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded-md shadow-md" role="alert">
                <div className="flex">
                    <div className="py-1"><svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v2H9v-2z"/></svg></div>
                    <div>
                        <p className="font-bold">ჩართეთ შეტყობინებები</p>
                        <p className="text-sm">მიიღეთ შეტყობინება, როდესაც ახალი შეკვეთა გაკეთდება.</p>
                        <button onClick={requestPermission} className="mt-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors text-sm">
                            შეტყობინებების ჩართვა
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};


const OrderCard: React.FC<{
  order: Order;
  productCategories: string[];
  updateOrderItemStatus: (orderId: string, productId: string, status: OrderItemStatus) => void;
  updateOrderItemDetails: (orderId: string, productId: string, details: Partial<Pick<OrderItem, 'actualQuantity' | 'pricePerUnit'>>) => void;
  completeOrder: (orderId: string) => void;
  commonProductIds: Set<string>;
  selectedItems: Set<string>;
  onSelectItem: (orderId: string, productId: string) => void;
  lastPrices: Map<string, number>;
}> = ({ order, productCategories, updateOrderItemStatus, updateOrderItemDetails, completeOrder, commonProductIds, selectedItems, onSelectItem, lastPrices }) => {
  const isOrderComplete = order.items.every(item => item.status !== OrderItemStatus.PENDING);
  const groupedItems = useMemo(() => {
    return order.items.reduce((acc, item) => {
      const category = item.product.category_ka;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, OrderItem[]>);
  }, [order.items]);

  const getStatusClasses = (status: OrderItemStatus) => {
    switch (status) {
      case OrderItemStatus.PURCHASED: return 'text-green-500 line-through decoration-red-500 decoration-2';
      case OrderItemStatus.UNAVAILABLE: return 'text-red-500';
      case OrderItemStatus.FORWARDED: return 'text-blue-500';
      default: return 'text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{order.restaurant} - {order.chef}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">შეკვეთის დრო: {formatDateTime(order.date)}</p>
        </div>
      </div>
      <div>
        {productCategories.map(category => {
          if (!groupedItems[category] || groupedItems[category].length === 0) return null;
          return (
            <div key={category} className="mb-4">
              <h4 className="font-semibold text-md text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-1 mb-2">{category}</h4>
              <ul>
                {groupedItems[category].map((item) => {
                  const { product, status, quantity, unit, actualQuantity, pricePerUnit } = item;
                  const isSelected = selectedItems.has(`${order.id}-${product.id}`);
                  const lastPrice = lastPrices.get(product.id);
                  const priceColorClass = (() => {
                    if (pricePerUnit !== undefined && pricePerUnit > 0 && lastPrice !== undefined) {
                      if (pricePerUnit > lastPrice) return 'text-red-500 font-semibold';
                      if (pricePerUnit < lastPrice) return 'text-green-500 font-semibold';
                    }
                    return 'text-gray-500 dark:text-gray-400';
                  })();
                  return (
                    <li key={product.id} className={`flex items-start gap-3 p-2 rounded-md transition-colors ${status !== OrderItemStatus.PENDING ? 'bg-gray-100 dark:bg-gray-700' : ''} ${commonProductIds.has(product.id) ? 'bg-amber-100 dark:bg-amber-800/20' : ''}`}>
                      <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:bg-gray-900 dark:border-gray-600 dark:checked:bg-blue-500 mt-1" checked={isSelected} onChange={() => onSelectItem(order.id, product.id)} aria-label={`Select ${product.name_ka}`} />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`font-medium ${getStatusClasses(status)}`}>{product.name_ka} - <span className="font-normal">{quantity} {unit}</span></span>
                            {commonProductIds.has(product.id) && <p className="text-xs text-amber-700 dark:text-amber-400">საჭიროა ორივე რესტორანშიც</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button title="შეძენილია" onClick={() => updateOrderItemStatus(order.id, product.id, OrderItemStatus.PURCHASED)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><CheckIcon className="w-6 h-6" /></button>
                            <button title="არ იყო" onClick={() => updateOrderItemStatus(order.id, product.id, OrderItemStatus.UNAVAILABLE)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><UnavailableIcon className="w-6 h-6"/></button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col items-start gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <input type="number" step="0.1" placeholder="ფაქტ. რაოდ." defaultValue={actualQuantity} onBlur={(e) => updateOrderItemDetails(order.id, product.id, { actualQuantity: parseFloat(e.target.value) })} className="w-24 p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 text-sm" aria-label="Actual Quantity" />
                            <input type="number" step="0.01" placeholder="ფასი ერთ." defaultValue={pricePerUnit} onBlur={(e) => updateOrderItemDetails(order.id, product.id, { pricePerUnit: parseFloat(e.target.value) })} className="w-24 p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 text-sm" aria-label="Price Per Unit" />
                            {actualQuantity && pricePerUnit && <span className="font-semibold text-gray-700 dark:text-gray-300">= {(actualQuantity * pricePerUnit).toFixed(2)} ₾</span>}
                          </div>
                          {lastPrice !== undefined && <span className={`${priceColorClass} text-xs ml-1`}>(წინა: {lastPrice.toFixed(2)} ₾)</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      {isOrderComplete && <button onClick={() => completeOrder(order.id)} className="w-full mt-4 p-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">შეკვეთის დასრულება</button>}
    </div>
  );
};

const HistorySection: React.FC<{ title: string; items: (Order | UnavailableItem)[] }> = ({ title, items }) => {
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const groupedByDate = items.reduce((acc, item) => {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, (Order | UnavailableItem)[]>);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
      {Object.keys(groupedByDate).length === 0 ? <p className="text-gray-500 dark:text-gray-400">ისტორია ცარიელია.</p> : (
        <div className="space-y-4">
          {Object.keys(groupedByDate).sort((a,b) => b.localeCompare(a)).map((date) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <button onClick={() => setOpenDates(p => ({ ...p, [date]: !p[date] }))} className="w-full flex justify-between items-center p-4 text-left font-bold text-lg">
                <span>{formatDate(date)}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openDates[date] ? 'rotate-180' : ''}`} />
              </button>
              {openDates[date] && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {groupedByDate[date].map(item => 'chef' in item ? (
                    <div key={item.id} className="mb-2 p-2 border rounded-md dark:border-gray-600">
                      <p className="font-semibold">{item.restaurant} - {item.chef}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">დასრულდა: {item.completionDate ? formatDateTime(item.completionDate) : 'დრო მიუწვდომელია'}</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {item.items.map(orderItem => (
                          <li key={orderItem.product.id} className={`${orderItem.status === OrderItemStatus.UNAVAILABLE ? 'text-red-500' : ''}`}>
                            {orderItem.product.name_ka} ({orderItem.quantity} {orderItem.unit})
                            {orderItem.status === OrderItemStatus.PURCHASED && orderItem.actualQuantity != null && orderItem.pricePerUnit != null && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">[ფაქტ: {orderItem.actualQuantity} {orderItem.unit}, ფასი: {orderItem.pricePerUnit.toFixed(2)} ₾]</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : <p key={item.id} className="p-2">{item.restaurant}: <span className="font-semibold">{item.product.name_ka}</span> - ვერ მოვიდა</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrderedHistorySection: React.FC<{ 
  items: OrderedHistoryItem[];
  onUpdateSupplier: (historyItemId: string, itemIndex: number, supplier: string) => void;
}> = ({ items, onUpdateSupplier }) => {
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});

  const groupedByDate = items.reduce((acc, item) => {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, OrderedHistoryItem[]>);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">მომწოდებელთან გაგზავნილი შეკვეთები</h2>
      {Object.keys(groupedByDate).length === 0 ? <p className="text-gray-500 dark:text-gray-400">ისტორია ცარიელია.</p> : (
        <div className="space-y-4">
          {Object.keys(groupedByDate).sort((a,b) => b.localeCompare(a)).map((date) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <button onClick={() => setOpenDates(p => ({ ...p, [date]: !p[date] }))} className="w-full flex justify-between items-center p-4 text-left font-bold text-lg">
                <span>{formatDate(date)}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openDates[date] ? 'rotate-180' : ''}`} />
              </button>
              {openDates[date] && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {groupedByDate[date].map(historyItem => {
                    const groupedByRestaurant = historyItem.items.reduce((acc, item) => {
                        if (!acc[item.restaurant]) acc[item.restaurant] = [];
                        acc[item.restaurant].push(item);
                        return acc;
                    }, {} as Record<Restaurant, SupplierOrderItem[]>);

                    return (
                        <div key={historyItem.id} className="mb-2 p-3 border rounded-md dark:border-gray-600">
                            <div className="flex justify-between items-start mb-2 pb-2 border-b dark:border-gray-600">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">შეკვეთა #{historyItem.id.slice(-6)} ({historyItem.items.length} პროდუქტი)</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(historyItem.date)}</p>
                            </div>
                            {Object.keys(groupedByRestaurant).map(restaurant => (
                                <div key={restaurant} className="mt-2">
                                    <p className="font-semibold">{restaurant}</p>
                                    <ul className="pl-5 space-y-2 text-sm">
                                        {groupedByRestaurant[restaurant as Restaurant].map((item) => {
                                            const originalIndex = historyItem.items.findIndex(originalItem => originalItem === item);
                                            return (
                                            <li key={`${historyItem.id}-${item.product.id}-${originalIndex}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    {item.product.name_ka} ({item.quantity} {item.unit}) - <span className="text-xs text-gray-500">{item.chef}</span>
                                                </div>
                                                <select
                                                    value={item.supplier || ''}
                                                    onChange={(e) => onUpdateSupplier(historyItem.id, originalIndex, e.target.value)}
                                                    className="mt-1 sm:mt-0 p-1 border rounded-md text-xs dark:bg-gray-700 dark:border-gray-600 w-full sm:w-auto"
                                                >
                                                    <option value="" disabled>აირჩიეთ მომწოდებელი</option>
                                                    {SUPPLIERS.map(supplier => (
                                                        <option key={supplier} value={supplier}>{supplier}</option>
                                                    ))}
                                                </select>
                                            </li>
                                        )})}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FinanceSection: React.FC<{ completedOrders: Order[] }> = ({ completedOrders }) => {
  const [openProducts, setOpenProducts] = useState<Record<string, boolean>>({});
  const financeData = useMemo(() => {
    const data: Record<string, { total: number; count: number; history: { date: string; price: number; }[] }> = {};
    [...completedOrders].reverse().forEach(order => {
      order.items.forEach(item => {
        if (item.pricePerUnit !== undefined && item.pricePerUnit > 0) {
          const productId = item.product.id;
          if (!data[productId]) data[productId] = { total: 0, count: 0, history: [] };
          data[productId].total += item.pricePerUnit;
          data[productId].count += 1;
          data[productId].history.push({ date: order.completionDate || order.date, price: item.pricePerUnit });
        }
      });
    });
    const result: Record<string, { product: Product; data: { avgPrice: number; history: { date: string; price: number; }[] } }> = {};
    Object.keys(data).forEach(productId => {
      const product = completedOrders.flatMap(o => o.items).find(i => i.product.id === productId)?.product;
      if (product) {
        result[productId] = { product, data: { avgPrice: data[productId].total / data[productId].count, history: data[productId].history.reverse() } };
      }
    });
    return Object.values(result).sort((a,b) => a.product.name_ka.localeCompare(b.product.name_ka));
  }, [completedOrders]);

  if (financeData.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-10">ფინანსური მონაცემები არ არის.</p>;
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">პროდუქტების ფინანსები</h2>
      <div className="space-y-2">
        {financeData.map(({ product, data }) => (
          <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <button onClick={() => setOpenProducts(p => ({ ...p, [product.id]: !p[product.id] }))} className="w-full flex justify-between items-center p-4 text-left font-semibold">
              <span>{product.name_ka}</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-400">საშ. ფასი: <span className="font-bold text-blue-600 dark:text-blue-400">{data.avgPrice.toFixed(2)} ₾</span></span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openProducts[product.id] ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {openProducts[product.id] && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2">ფასების ისტორია:</h4>
                <ul className="space-y-1 text-sm">
                  {data.history.map((entry, index) => <li key={index} className="flex justify-between p-1 rounded-md bg-gray-50 dark:bg-gray-700/50"><span className="text-gray-500 dark:text-gray-400">{formatDate(entry.date)}</span><span className="font-medium">{entry.price.toFixed(2)} ₾</span></li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductManagementSection: React.FC<{
    products: Product[];
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
}> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = (productData: Omit<Product, 'id'> | Product) => {
        if ('id' in productData) {
            onUpdateProduct(productData);
        } else {
            onAddProduct(productData);
        }
        setIsModalOpen(false);
    };

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return products;
        }
        return products.filter(p => 
            p.name_ka.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">პროდუქტების მართვა</h2>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusCircleIcon className="w-5 h-5" /> ახლის დამატება
                </button>
            </div>
             <div className="mb-4">
                <input
                    type="text"
                    placeholder="პროდუქტის ძებნა..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.sort((a,b) => a.name_ka.localeCompare(b.name_ka)).map(product => (
                        <li key={product.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{product.name_ka}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{product.category_ka} / {product.defaultUnit}</p>
                                <div className="flex gap-2 mt-1">
                                    {product.restaurants.map(r => (
                                        <span key={r} className={`px-2 py-0.5 text-xs rounded-full ${
                                            r === Restaurant.MIDIEBI ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        }`}>
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {isModalOpen && <ProductModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const ProductModal: React.FC<{
    product: Product | null;
    onSave: (productData: Omit<Product, 'id'> | Product) => void;
    onClose: () => void;
}> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name_ka: product?.name_ka || '', name_en: product?.name_en || '', name_ru: product?.name_ru || '',
        category_ka: product?.category_ka || '', category_en: product?.category_en || '', category_ru: product?.category_ru || '',
        defaultUnit: product?.defaultUnit || 'კგ',
    });
    const [restaurants, setRestaurants] = useState<Restaurant[]>(product?.restaurants || []);

    const handleRestaurantChange = (restaurant: Restaurant) => {
        setRestaurants(prev => 
            prev.includes(restaurant) 
            ? prev.filter(r => r !== restaurant) 
            : [...prev, restaurant]
        );
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fullProductData = { ...formData, restaurants };
        if (product) {
            onSave({ ...product, ...fullProductData });
        } else {
            onSave(fullProductData as Omit<Product, 'id'>);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4">{product ? 'პროდუქტის რედაქტირება' : 'ახალი პროდუქტი'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">დასახელება (ქარ)</label><input type="text" name="name_ka" value={formData.name_ka} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">კატეგორია (ქარ)</label><input type="text" name="category_ka" value={formData.category_ka} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">დასახელება (ინგ)</label><input type="text" name="name_en" value={formData.name_en} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">კატეგორია (ინგ)</label><input type="text" name="category_en" value={formData.category_en} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">დასახელება (რუს)</label><input type="text" name="name_ru" value={formData.name_ru} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">კატეგორია (რუს)</label><input type="text" name="category_ru" value={formData.category_ru} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">საზომი ერთეული</label><select name="defaultUnit" value={formData.defaultUnit} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"><option>კგ</option><option>ლიტრი</option><option>ცალი</option><option>შეკვრა</option></select></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">რესტორნები</label>
                        <div className="mt-2 space-y-2">
                            <label className="flex items-center">
                                <input type="checkbox" checked={restaurants.includes(Restaurant.MIDIEBI)} onChange={() => handleRestaurantChange(Restaurant.MIDIEBI)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{Restaurant.MIDIEBI}</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" checked={restaurants.includes(Restaurant.SAKHINKLE)} onChange={() => handleRestaurantChange(Restaurant.SAKHINKLE)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{Restaurant.SAKHINKLE}</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">გაუქმება</button>
                        <button type="submit" disabled={restaurants.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">შენახვა</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type Tab = 'active' | 'ordered' | 'completed' | 'unavailable' | 'finances' | 'products' | 'ai_analytics';

const AdminView: React.FC<AdminViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const handleSelectItem = (orderId: string, productId: string) => {
    const itemId = `${orderId}-${productId}`;
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) newSet.delete(itemId);
        else newSet.add(itemId);
        return newSet;
    });
  };

  const handleMarkOrderedClick = () => {
    props.onMarkAsOrdered(selectedItems);
    setSelectedItems(new Set());
    setActiveTab('ordered');
  };

  const commonProductIds = useMemo(() => {
    const sets = [new Set<string>(), new Set<string>()]; // [Midiebi, Sakhinkle]
    props.activeOrders.forEach(order => {
        const setIndex = order.restaurant === Restaurant.MIDIEBI ? 0 : 1;
        order.items.forEach(item => sets[setIndex].add(item.product.id));
    });
    const intersection = new Set<string>();
    sets[0].forEach(id => { if (sets[1].has(id)) intersection.add(id); });
    return intersection;
  }, [props.activeOrders]);

  const lastPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    for (const order of [...props.completedOrders].reverse()) {
        for (const item of order.items) {
            if (item.pricePerUnit !== undefined && item.pricePerUnit > 0) priceMap.set(item.product.id, item.pricePerUnit);
        }
    }
    return priceMap;
  }, [props.completedOrders]);

  const shoppingListTotal = useMemo(() => {
    return props.activeOrders.reduce((total, order) => total + order.items.reduce((orderTotal, item) => (item.status === OrderItemStatus.PENDING && typeof item.actualQuantity === 'number' && item.actualQuantity > 0 && typeof item.pricePerUnit === 'number' && item.pricePerUnit > 0) ? orderTotal + (item.actualQuantity * item.pricePerUnit) : orderTotal, 0), 0);
  }, [props.activeOrders]);

  const getTabClass = (tabName: Tab) => `flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tabName ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`;
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">ადმინისტრატორის პანელი</h1>
        <button onClick={props.logout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"><LogoutIcon className="w-5 h-5" /> გასვლა</button>
      </header>
       <NotificationPrompter />
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('active')} className={getTabClass('active')}><ListIcon className="w-5 h-5" /> აქტიური შეკვეთები ({props.activeOrders.length})</button>
            <button onClick={() => setActiveTab('ordered')} className={getTabClass('ordered')}><PaperAirplaneIcon className="w-5 h-5" /> შეკვეთილი</button>
            <button onClick={() => setActiveTab('completed')} className={getTabClass('completed')}><HistoryIcon className="w-5 h-5" /> დასრულებული</button>
            <button onClick={() => setActiveTab('unavailable')} className={getTabClass('unavailable')}><UnavailableIcon className="w-5 h-5" /> არ იყო</button>
            <button onClick={() => setActiveTab('finances')} className={getTabClass('finances')}><CoinIcon className="w-5 h-5" /> ფინანსები</button>
            <button onClick={() => setActiveTab('products')} className={getTabClass('products')}><WrenchScrewdriverIcon className="w-5 h-5" /> პროდუქტები</button>
            <button onClick={() => setActiveTab('ai_analytics')} className={getTabClass('ai_analytics')}><SparklesIcon className="w-5 h-5" /> AI ანალიტიკა</button>
        </div>
      </div>
      <div>
        {activeTab === 'active' && (
          <div>
            {selectedItems.size > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md mb-4 flex items-center gap-4 sticky top-2 z-10">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedItems.size} პროდუქტი მონიშნულია</span>
                </div>
            )}
            {props.activeOrders.length > 0 ? props.activeOrders.map(order => <OrderCard key={order.id} order={order} productCategories={props.productCategories} updateOrderItemStatus={props.updateOrderItemStatus} updateOrderItemDetails={props.updateOrderItemDetails} completeOrder={props.completeOrder} commonProductIds={commonProductIds} selectedItems={selectedItems} onSelectItem={handleSelectItem} lastPrices={lastPrices}/>) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">აქტიური შეკვეთები არ არის.</p>}
            {selectedItems.size > 0 && (
              <div className="mt-6 flex justify-center">
                  <button
                      onClick={handleMarkOrderedClick}
                      className="flex items-center gap-3 px-8 py-3 text-lg bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                  >
                      <PaperAirplaneIcon className="w-6 h-6" />
                      შეკვეთა
                  </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'ordered' && <OrderedHistorySection items={props.orderedHistory} onUpdateSupplier={props.onUpdateSupplier} />}
        {activeTab === 'completed' && <HistorySection title="შეკვეთების ისტორია" items={props.completedOrders} />}
        {activeTab === 'unavailable' && <HistorySection title="პროდუქტები, რომლებიც არ იყო" items={props.unavailableItems} />}
        {activeTab === 'finances' && <FinanceSection completedOrders={props.completedOrders} />}
        {activeTab === 'products' && <ProductManagementSection products={props.products} onAddProduct={props.onAddProduct} onUpdateProduct={props.onUpdateProduct} onDeleteProduct={props.onDeleteProduct} />}
        {activeTab === 'ai_analytics' && <AIAnalyticsView completedOrders={props.completedOrders} />}
      </div>
      {activeTab === 'active' && shoppingListTotal > 0 && <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-blue-600 text-white p-4 rounded-lg shadow-xl z-20 transition-all duration-300 ease-in-out transform hover:scale-105"><h4 className="text-sm font-medium text-blue-100">გადასახდელი თანხა:</h4><p className="text-3xl font-bold tracking-tight">{shoppingListTotal.toFixed(2)} ₾</p></div>}
    </div>
  );
};

export default AdminView;