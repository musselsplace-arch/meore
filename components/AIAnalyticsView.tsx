import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Order } from '../types';
import { PaperAirplaneIcon, SparklesIcon } from './Icons';

const AIAnalyticsView: React.FC<{ completedOrders: Order[] }> = ({ completedOrders }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendQuery = async (prompt?: string) => {
        const currentQuery = prompt || query;
        if (!currentQuery.trim()) return;
        
        setIsLoading(true);
        setError('');
        setResponse('');
        if (!prompt) {
            setQuery('');
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Simplify data to reduce token usage and improve relevance.
            const contextData = completedOrders.map(order => ({
                restaurant: order.restaurant,
                completionDate: order.completionDate,
                totalCost: order.items.reduce((acc, item) => acc + ((item.actualQuantity || 0) * (item.pricePerUnit || 0)), 0),
                items: order.items.map(item => ({
                    name: item.product.name_ka,
                    category: item.product.category_ka,
                    quantity: item.actualQuantity || item.quantity,
                    unit: item.unit,
                    pricePerUnit: item.pricePerUnit
                }))
            }));

            const fullPrompt = `
                Context: You are provided with a JSON array of completed market orders for two restaurants: 'მიდიები' and 'სახინკლე'. Each order includes the restaurant name, completion date, and a list of items with their names, categories, quantities, units, and price per unit.

                Data:
                ${JSON.stringify(contextData, null, 2)}

                User's question: "${currentQuery}"
            `;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: fullPrompt,
                config: {
                    systemInstruction: "You are an expert financial and logistics analyst for a restaurant group. Your name is 'Giorgi the Analyst'. Analyze the provided order data to answer the user's question. Provide concise, clear, and actionable insights. All your responses MUST be in the Georgian language.",
                    thinkingConfig: {
                        thinkingBudget: 32768,
                    },
                },
            });

            setResponse(result.text);
        } catch (e) {
            console.error(e);
            setError('მოთხოვნის დამუშავებისას მოხდა შეცდომა. გთხოვთ, სცადოთ თავიდან.');
        } finally {
            setIsLoading(false);
        }
    };

    const examplePrompts = [
        'გააანალიზე ფასების ტრენდები ყველაზე ძვირადღირებული პროდუქტებისთვის.',
        'რომელ რესტორანს აქვს მეტი დანახარჯი ხორცპროდუქტებზე?',
        'გასული თვის ხარჯების შეჯამება.',
        'რომელი პროდუქტების ფასი გაიზარდა ყველაზე მეტად ბოლო პერიოდში?'
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-center mb-6">
                 <SparklesIcon className="w-12 h-12 mx-auto text-blue-500" />
                <h2 className="text-2xl font-semibold mt-2 text-gray-800 dark:text-white">AI ანალიტიკოსი</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">დასვით რთული კითხვები თქვენი შეკვეთების შესახებ.</p>
            </div>

            <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {examplePrompts.map((prompt, i) => (
                        <button key={i} onClick={() => handleSendQuery(prompt)} className="text-left p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors disabled:opacity-50" disabled={isLoading}>
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="text-center p-8">
                    <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">ანალიზი მიმდინარეობს... გთხოვთ, დაელოდოთ.</p>
                </div>
            ) : error ? (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">შეცდომა</p>
                    <p>{error}</p>
                </div>
            ) : response && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {response}
                    </div>
                </div>
            )}
            
            <div className="mt-6 flex gap-2">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendQuery(); }}}
                    placeholder="აკრიფეთ თქვენი კითხვა აქ..."
                    className="flex-grow w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    rows={2}
                    disabled={isLoading}
                />
                <button
                    onClick={() => handleSendQuery()}
                    disabled={isLoading || !query.trim()}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Send Query"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default AIAnalyticsView;
