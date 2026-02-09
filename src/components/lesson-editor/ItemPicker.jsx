import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lolDataService from '@/services/lolDataService';

/**
 * Item Picker Component
 * Displays a searchable grid of League of Legends items
 */
export default function ItemPicker({ onSelect, onClose }) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        loadItems();
    }, []);

    useEffect(() => {
        filterItems();
    }, [searchQuery, items]);

    const loadItems = async () => {
        setLoading(true);
        const data = await lolDataService.getItems();
        setItems(data);
        setFilteredItems(data);
        setLoading(false);
    };

    const filterItems = () => {
        if (!searchQuery) {
            setFilteredItems(items);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.plaintext && item.plaintext.toLowerCase().includes(query))
        );
        setFilteredItems(filtered);
    };

    const toggleItem = (item) => {
        setSelectedItems(prev => {
            const isSelected = prev.find(i => i.id === item.id);
            if (isSelected) {
                return prev.filter(i => i.id !== item.id);
            } else {
                return [...prev, item];
            }
        });
    };

    const handleDone = () => {
        if (selectedItems.length > 0) {
            onSelect({
                type: 'items',
                data: selectedItems
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Select Items</h2>
                        {selectedItems.length > 0 && (
                            <p className="text-sm text-text-secondary mt-1">{selectedItems.length} item(s) selected</p>
                        )}
                    </div>
                    <Button onClick={onClose} variant="ghost" size="icon">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-tertiary border border-white/10 rounded-xl pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Items Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-text-secondary">Loading items...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No items found</div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                            {filteredItems.map(item => {
                                const isSelected = selectedItems.find(i => i.id === item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(item)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-110 ${isSelected
                                                ? 'border-primary ring-2 ring-primary'
                                                : 'border-white/10 hover:border-primary/50'
                                            }`}
                                        title={item.name}
                                    >
                                        <img
                                            src={item.icon}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    ✓
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <Button onClick={onClose} variant="outline" className="border-white/10">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDone}
                        disabled={selectedItems.length === 0}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        Add {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}
                    </Button>
                </div>
            </div>
        </div>
    );
}
