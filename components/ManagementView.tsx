

import React, { useState, useMemo } from 'react';
import { Order, OrderItem, UnavailableItem, OrderItemStatus, Restaurant, Product } from '../types';
import { WhatsAppIcon, CheckIcon, UnavailableIcon, HistoryIcon, ListIcon, LogoutIcon, ChevronDownIcon, CopyIcon, ShareIcon, CoinIcon } from './Icons';
import { PRODUCT_CATEGORIES } from '../constants';

interface ManagementViewProps {
  activeOrders: Order[];
  completedOrders: Order[];
  unavailableItems: UnavailableItem[];
  updateOrderItemStatus: (orderId: string, productId: string, status: OrderItemStatus) => void;
  updateOrderItemDetails: (orderId: string, productId: string, details: Partial<Pick<OrderItem, 'actualQuantity' | 'pricePerUnit'>>) => void;
  completeOrder: (orderId: string) => void;
  logout: () => void;
}

const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ka-GE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('ka-GE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

const OrderCard: React.FC<{
  order: Order;
  updateOrderItemStatus: (orderId: string, productId: string, status: OrderItemStatus) => void;
  updateOrderItemDetails: (orderId: string, productId: string, details: Partial<Pick<OrderItem, 'actualQuantity' | 'pricePerUnit'>>) => void;
  completeOrder: (orderId: string) => void;
  commonProductIds: Set<string>;
  selectedItems: Set<string>;
  onSelectItem: (orderId: string, productId: string) => void;
  lastPrices: Map<string, number>;
}> = ({ order, updateOrderItemStatus, updateOrderItemDetails, completeOrder, commonProductIds, selectedItems, onSelectItem, lastPrices }) => {
  
  const isOrderComplete = order.items.every(item => item.status !== OrderItemStatus.PENDING);

  const groupedItems = useMemo(() => {
    return order.items.reduce((acc, item) => {
      const category = item.product.category_ka;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, OrderItem[]>);
  }, [order.items]);

  const getStatusClasses = (status: OrderItemStatus) => {
    switch (status) {
      case OrderItemStatus.PURCHASED:
        return 'text-green-500 line-through decoration-red-500 decoration-2';
      case OrderItemStatus.UNAVAILABLE:
        return 'text-red-500';
      case OrderItemStatus.FORWARDED:
        return 'text-blue-500';
      default:
        return 'text-gray-800 dark:text-gray-200';
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
        {PRODUCT_CATEGORIES.ka.map(category => {
          if (groupedItems[category] && groupedItems[category].length > 0) {
            return (
              <div key={category} className="mb-4">
                <h4 className="font-semibold text-md text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-1 mb-2">{category}</h4>
                <ul>
                  {groupedItems[category].map((item) => {
                    const { product, status, quantity, unit, actualQuantity, pricePerUnit } = item;
                    const lastPrice = lastPrices.get(product.id);
                    
                    const priceColorClass = (() => {
                      if (pricePerUnit !== undefined && pricePerUnit > 0 && lastPrice !== undefined) {
                        if (pricePerUnit > lastPrice) return 'text-red-500 font-semibold';
                        if (pricePerUnit < lastPrice) return 'text-green-500 font-semibold';
                      }
                      return 'text-gray-500 dark:text-gray-400';
                    })();

                    return (
                        <li key={product.id} className={`flex items-start gap-3 p-2 rounded-md transition-colors 
                            ${status !== OrderItemStatus.PENDING ? 'bg-gray-100 dark:bg-gray-700' : ''}
                            ${commonProductIds.has(product.id) ? 'bg-amber-100 dark:bg-amber-800/20' : ''}`}>
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:bg-gray-900 dark:border-gray-600 dark:checked:bg-blue-500 mt-1"
                            checked={selectedItems.has(`${order.id}-${product.id}`)}
                            onChange={() => onSelectItem(order.id, product.id)}
                            aria-label={`Select ${product.name_ka}`}
                          />
                           <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`font-medium ${getStatusClasses(status)}`}>{product.name_ka} - <span className="font-normal">{quantity} {unit}</span></span>
                                        {commonProductIds.has(product.id) && (
                                            <p className="text-xs text-amber-700 dark:text-amber-400">საჭიროა ორივე რესტორანშიც</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button title="გაგზავნა WhatsApp-ში" onClick={() => updateOrderItemStatus(order.id, product.id, OrderItemStatus.FORWARDED)} className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"><WhatsAppIcon className="w-6 h-6"/></button>
                                        <button title="შეძენილია" onClick={() => updateOrderItemStatus(order.id, product.id, OrderItemStatus.PURCHASED)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><CheckIcon className="w-6 h-6" /></button>
                                        <button title="არ იყო" onClick={() => updateOrderItemStatus(order.id, product.id, OrderItemStatus.UNAVAILABLE)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><UnavailableIcon className="w-6 h-6"/></button>
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-col items-start gap-1 text-xs">
                                  <div className="flex items-center gap-2">
                                      <input
                                          type="number"
                                          step="0.1"
                                          placeholder="ფაქტ. რაოდ."
                                          defaultValue={actualQuantity}
                                          onBlur={(e) => updateOrderItemDetails(order.id, product.id, { actualQuantity: parseFloat(e.target.value) })}
                                          className="w-24 p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 text-sm"
                                          aria-label="Actual Quantity"
                                      />
                                      <input
                                          type="number"
                                          step="0.01"
                                          placeholder="ფასი ერთ."
                                          defaultValue={pricePerUnit}
                                          onBlur={(e) => updateOrderItemDetails(order.id, product.id, { pricePerUnit: parseFloat(e.target.value) })}
                                          className="w-24 p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 text-sm"
                                          aria-label="Price Per Unit"
                                      />
                                      {actualQuantity && pricePerUnit && (
                                          <span className="font-semibold text-gray-700 dark:text-gray-300">= {(actualQuantity * pricePerUnit).toFixed(2)} ₾</span>
                                      )}
                                  </div>
                                  {lastPrice !== undefined && (
                                      <span className={`${priceColorClass} text-xs ml-1`}>
                                          (წინა: {lastPrice.toFixed(2)} ₾)
                                      </span>
                                  )}
                                </div>
                           </div>
                        </li>
                    );
                  })}
                </ul>
              </div>
            );
          }
          return null;
        })}
      </div>

       {isOrderComplete && (
         <button 
           onClick={() => completeOrder(order.id)}
           className="w-full mt-4 p-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
         >
           შეკვეთის დასრულება
         </button>
       )}
    </div>
  );
};


const HistorySection: React.FC<{ title: string; items: (Order | UnavailableItem)[] }> = ({ title, items }) => {
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});

  const groupedByDate = items.reduce((acc, item) => {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, (Order | UnavailableItem)[]>);

  const toggleDate = (date: string) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
      {Object.keys(groupedByDate).length === 0 ? (
         <p className="text-gray-500 dark:text-gray-400">ისტორია ცარიელია.</p>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedByDate).sort((a,b) => b.localeCompare(a)).map((date) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <button onClick={() => toggleDate(date)} className="w-full flex justify-between items-center p-4 text-left font-bold text-lg">
                <span>{formatDate(date)}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openDates[date] ? 'rotate-180' : ''}`} />
              </button>
              {openDates[date] && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {groupedByDate[date].map(item => 'chef' in item ? ( // It's an Order
                    <div key={item.id} className="mb-2 p-2 border rounded-md dark:border-gray-600">
                      <p className="font-semibold">{item.restaurant} - {item.chef}</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                         დასრულდა: {item.completionDate ? formatDateTime(item.completionDate) : 'დრო მიუწვდომელია'}
                       </p>
                      <ul className="list-disc pl-5 space-y-1">
                          {item.items.map(orderItem => (
                            <li key={orderItem.product.id} className={`${orderItem.status === OrderItemStatus.UNAVAILABLE ? 'text-red-500' : ''}`}>
                                {orderItem.product.name_ka} ({orderItem.quantity} {orderItem.unit})
                                {orderItem.status === OrderItemStatus.PURCHASED && orderItem.actualQuantity != null && orderItem.pricePerUnit != null && (
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        [ფაქტ: {orderItem.actualQuantity} {orderItem.unit}, ფასი: {orderItem.pricePerUnit.toFixed(2)} ₾]
                                    </span>
                                )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : ( // It's an UnavailableItem
                    // FIX: Use unique item.id for the key, which is now available on the UnavailableItem type.
                    <p key={item.id} className="p-2">{item.restaurant}: <span className="font-semibold">{item.product.name_ka}</span> - ვერ მოვიდა</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface PriceHistoryEntry {
  date: string;
  price: number;
}
interface FinanceData {
  avgPrice: number;
  history: PriceHistoryEntry[];
}
const FinanceSection: React.FC<{ completedOrders: Order[] }> = ({ completedOrders }) => {
    const [openProducts, setOpenProducts] = useState<Record<string, boolean>>({});

    const financeData = useMemo(() => {
        const data: Record<string, { total: number; count: number; history: PriceHistoryEntry[] }> = {};
        
        [...completedOrders].reverse().forEach(order => {
            order.items.forEach(item => {
                if (item.pricePerUnit !== undefined && item.pricePerUnit > 0) {
                    const productId = item.product.id;
                    if (!data[productId]) {
                        data[productId] = { total: 0, count: 0, history: [] };
                    }
                    data[productId].total += item.pricePerUnit;
                    data[productId].count += 1;
                    data[productId].history.push({
                        date: order.completionDate || order.date, // Prefer completion date for accuracy
                        price: item.pricePerUnit,
                    });
                }
            });
        });

        const result: Record<string, { product: Product; data: FinanceData }> = {};
        Object.keys(data).forEach(productId => {
            const product = completedOrders.flatMap(o => o.items).find(i => i.product.id === productId)?.product;
            if (product) {
                result[productId] = {
                    product: product,
                    data: {
                        avgPrice: data[productId].total / data[productId].count,
                        history: data[productId].history.reverse()
                    }
                };
            }
        });

        return Object.values(result).sort((a,b) => a.product.name_ka.localeCompare(b.product.name_ka));
    }, [completedOrders]);
    
    const toggleProduct = (productId: string) => {
        setOpenProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
    };

    if (financeData.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 py-10">ფინანსური მონაცემები არ არის.</p>;
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">პროდუქტების ფინანსები</h2>
            <div className="space-y-2">
                {financeData.map(({ product, data }) => (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <button onClick={() => toggleProduct(product.id)} className="w-full flex justify-between items-center p-4 text-left font-semibold">
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
                                    {data.history.map((entry, index) => (
                                        <li key={index} className="flex justify-between p-1 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                            <span className="text-gray-500 dark:text-gray-400">{formatDate(entry.date)}</span>
                                            <span className="font-medium">{entry.price.toFixed(2)} ₾</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


type Tab = 'active' | 'completed' | 'unavailable' | 'finances';

const ManagementView: React.FC<ManagementViewProps> = ({
  activeOrders,
  completedOrders,
  unavailableItems,
  updateOrderItemStatus,
  updateOrderItemDetails,
  completeOrder,
  logout
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSelectItem = (orderId: string, productId: string) => {
    const itemId = `${orderId}-${productId}`;
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        return newSet;
    });
  };
  
  const getSelectedItemsText = () => {
    if (selectedItems.size === 0) return "";

    const aggregatedItems = new Map<string, { name: string; quantity: number; unit: string; category: string }>();
    selectedItems.forEach(itemId => {
        const [orderId, productId] = itemId.split('-');
        const order = activeOrders.find(o => o.id === orderId);
        const item = order?.items.find(i => i.product.id === productId);

        if (item) {
            const key = `${item.product.name_ka}|${item.unit}`;
            if (aggregatedItems.has(key)) {
                const existing = aggregatedItems.get(key)!;
                existing.quantity += item.quantity;
            } else {
                aggregatedItems.set(key, { name: item.product.name_ka, quantity: item.quantity, unit: item.unit, category: item.product.category_ka });
            }
        }
    });
    
    const groupedByCategory = new Map<string, { name: string; quantity: number; unit: string }[]>();
    aggregatedItems.forEach(item => {
        const category = item.category;
        if (!groupedByCategory.has(category)) groupedByCategory.set(category, []);
        groupedByCategory.get(category)!.push({ name: item.name, quantity: item.quantity, unit: item.unit });
    });

    let productText = "";
    PRODUCT_CATEGORIES.ka.forEach(category => {
        if (groupedByCategory.has(category)) {
            productText += `${category}:\n`;
            const itemsInCategory = groupedByCategory.get(category)!;
            itemsInCategory.sort((a, b) => a.name.localeCompare(b.name, 'ka-GE'));
            itemsInCategory.forEach(item => {
                productText += `${item.name} - ${item.quantity} ${item.unit}\n`;
            });
            productText += '\n';
        }
    });

    productText = productText.trim();
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', weekday: 'long' });
    const headerText = `შპს სევინგსონ ენდ გრიკსონ\nშეკვეთა (${formattedDate})`;
    const footerText = 'საიდენტიფიკაციო კოდი - 40040386\nმისამართი - გიგა ლორთქიფანიძის 7\nსამუშაო საათები - ორშაბათი - პარასკევი 15:00 - 23:00\nშაბათი კვირა 12:00 - 23:00\nტელეფონის ნომერი : ტელეფონი 511 10 02 26';
    
    return `${headerText}\n\n${productText}\n\n${footerText}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSelectedItemsText()).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  const handleShare = async () => {
      const text = getSelectedItemsText();
      if (navigator.share) {
          try {
              await navigator.share({ title: 'შეკვეთა', text });
          } catch (error) { console.error('Error sharing:', error); }
      } else {
          handleCopy();
          alert('Share API not supported. List copied to clipboard.');
      }
  }

  const commonProductIds = useMemo(() => {
    const midiebiProducts = new Set<string>();
    const sakhinkleProducts = new Set<string>();
    activeOrders.forEach(order => {
        const targetSet = order.restaurant === Restaurant.MIDIEBI ? midiebiProducts : sakhinkleProducts;
        order.items.forEach(item => targetSet.add(item.product.id));
    });
    const intersection = new Set<string>();
    midiebiProducts.forEach(id => { if (sakhinkleProducts.has(id)) intersection.add(id); });
    return intersection;
  }, [activeOrders]);

  const lastPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    for (const order of completedOrders) {
        for (const item of order.items) {
            if (!priceMap.has(item.product.id) && item.pricePerUnit !== undefined && item.pricePerUnit > 0) {
                priceMap.set(item.product.id, item.pricePerUnit);
            }
        }
    }
    return priceMap;
  }, [completedOrders]);

  const shoppingListTotal = useMemo(() => {
    return activeOrders.reduce((total, order) => {
        return total + order.items.reduce((orderTotal, item) => {
            if (
                item.status === OrderItemStatus.PENDING &&
                typeof item.actualQuantity === 'number' && item.actualQuantity > 0 &&
                typeof item.pricePerUnit === 'number' && item.pricePerUnit > 0
            ) {
                return orderTotal + (item.actualQuantity * item.pricePerUnit);
            }
            return orderTotal;
        }, 0);
    }, 0);
  }, [activeOrders]);

  const getTabClass = (tabName: Tab) => 
    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tabName 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
       <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">მენეჯმენტის პანელი</h1>
        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
           <LogoutIcon className="w-5 h-5" /> გასვლა
        </button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button onClick={() => setActiveTab('active')} className={getTabClass('active')}>
          <ListIcon className="w-5 h-5" /> აქტიური შეკვეთები ({activeOrders.length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={getTabClass('completed')}>
          <HistoryIcon className="w-5 h-5" /> დასრულებული
        </button>
        <button onClick={() => setActiveTab('unavailable')} className={getTabClass('unavailable')}>
          <UnavailableIcon className="w-5 h-5" /> არ იყო
        </button>
        <button onClick={() => setActiveTab('finances')} className={getTabClass('finances')}>
          <CoinIcon className="w-5 h-5" /> ფინანსები
        </button>
      </div>

      <div>
        {activeTab === 'active' && (
          <div>
            {selectedItems.size > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md mb-4 flex items-center gap-4 sticky top-2 z-10">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedItems.size} პროდუქტი მონიშნულია</span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            <CopyIcon className="w-4 h-4" /> {copySuccess ? 'დაკოპირებულია!' : 'კოპირება'}
                        </button>
                        {navigator.share && (
                            <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                <ShareIcon className="w-4 h-4" /> გაზიარება
                            </button>
                        )}
                    </div>
                </div>
            )}
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    updateOrderItemStatus={updateOrderItemStatus}
                    updateOrderItemDetails={updateOrderItemDetails}
                    completeOrder={completeOrder}
                    commonProductIds={commonProductIds}
                    selectedItems={selectedItems}
                    onSelectItem={handleSelectItem}
                    lastPrices={lastPrices}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">აქტიური შეკვეთები არ არის.</p>
            )}
          </div>
        )}
        {activeTab === 'completed' && <HistorySection title="შეკვეთების ისტორია" items={completedOrders} />}
        {activeTab === 'unavailable' && <HistorySection title="პროდუქტები, რომლებიც არ იყო" items={unavailableItems} />}
        {activeTab === 'finances' && <FinanceSection completedOrders={completedOrders} />}
      </div>

      {activeTab === 'active' && shoppingListTotal > 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-blue-600 text-white p-4 rounded-lg shadow-xl z-20 transition-all duration-300 ease-in-out transform hover:scale-105">
            <h4 className="text-sm font-medium text-blue-100">გადასახდელი თანხა:</h4>
            <p className="text-3xl font-bold tracking-tight">{shoppingListTotal.toFixed(2)} ₾</p>
        </div>
      )}
    </div>
  );
};

export default ManagementView;