import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lolDataService from '@/services/lolDataService';

/**
 * Rune Picker Component
 */
export default function RunePicker({ onSelect, onClose }) {
    const [runeTrees, setRuneTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTree, setSelectedTree] = useState(null);
    const [selectedRunes, setSelectedRunes] = useState([]);

    useEffect(() => {
        loadRunes();
    }, []);

    const loadRunes = async () => {
        setLoading(true);
        const data = await lolDataService.getRunes();
        setRuneTrees(data);
        if (data.length > 0) {
            setSelectedTree(data[0]);
        }
        setLoading(false);
    };

    const toggleRune = (item, type = 'rune') => {
        setSelectedRunes(prev => {
            const isSelected = prev.find(r => r.id === item.id && r.type === type);
            if (isSelected) {
                return prev.filter(r => !(r.id === item.id && r.type === type));
            } else {
                const newItem = {
                    id: item.id,
                    name: item.name,
                    icon: item.icon,
                    type: type
                };

                // Limit to 8 items total (runes + paths)
                if (prev.length >= 8) {
                    return [...prev.slice(1), newItem];
                }
                return [...prev, newItem];
            }
        });
    };

    const handleDone = () => {
        if (selectedRunes.length > 0) {
            onSelect({
                type: 'runes', // This type might need to be more generic like 'items' if paths are also included
                data: selectedRunes
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Select Runes & Paths</h2>
                        <p className="text-sm text-text-secondary mt-1">Pick runes or entire paths (e.g. Precision) to add to your lesson</p>
                    </div>
                    <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Rune Trees */}
                    <div className="w-56 border-r border-white/10 overflow-y-auto bg-bg-tertiary/30 p-4 space-y-2">
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 px-2">Rune Paths</h3>
                        {runeTrees.map(tree => {
                            const isPathSelected = selectedRunes.find(r => r.id === tree.id && r.type === 'path');
                            return (
                                <div key={tree.id} className="relative group/path">
                                    <button
                                        onClick={() => setSelectedTree(tree)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${selectedTree?.id === tree.id
                                            ? 'bg-primary/20 text-primary border-primary/30'
                                            : 'text-text-secondary hover:bg-white/5 border-transparent'
                                            }`}
                                    >
                                        <img src={tree.icon} alt={tree.name} className={`w-6 h-6 transition-all ${selectedTree?.id === tree.id ? 'brightness-125' : 'grayscale'}`} />
                                        <span className="text-sm font-semibold">{tree.name}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleRune(tree, 'path');
                                        }}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isPathSelected
                                            ? 'bg-primary text-white scale-100 opacity-100'
                                            : 'hover:bg-primary/20 text-primary opacity-0 group-hover/path:opacity-100 scale-90'
                                            }`}
                                        title={isPathSelected ? 'Remove Path' : 'Add Path to Selection'}
                                    >
                                        {isPathSelected ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Content - Runes Grid */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <div className="text-text-secondary font-medium">Loading runes...</div>
                            </div>
                        ) : !selectedTree ? (
                            <div className="text-center py-24 text-text-muted">Select a path from the left to see its runes</div>
                        ) : (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {selectedTree.slots.map((slot, slotIndex) => (
                                    <div key={slotIndex} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                                                {slotIndex === 0 ? 'Keystone Selection' : `Standard Runes - Row ${slotIndex}`}
                                            </h4>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {slot.runes.map(rune => {
                                                const isSelected = selectedRunes.find(r => r.id === rune.id && r.type === 'rune');
                                                return (
                                                    <button
                                                        key={rune.id}
                                                        onClick={() => toggleRune(rune, 'rune')}
                                                        className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all hover:scale-[1.03] group ${isSelected
                                                            ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(103,61,230,0.15)]'
                                                            : 'border-white/5 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'
                                                            }`}
                                                    >
                                                        <div className={`relative mb-3 transition-transform group-hover:scale-110 ${slotIndex === 0 ? 'w-16 h-16' : 'w-12 h-12'}`}>
                                                            <img
                                                                src={rune.icon}
                                                                alt={rune.name}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className={`text-white font-bold text-center leading-tight ${slotIndex === 0 ? 'text-sm' : 'text-xs'}`}>{rune.name}</div>

                                                        {isSelected && (
                                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg ring-2 ring-bg-secondary">
                                                                {selectedRunes.findIndex(r => r.id === rune.id && r.type === 'rune') + 1}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between bg-bg-tertiary/20">
                    <div className="flex flex-wrap gap-2 max-w-2xl px-2">
                        {selectedRunes.length === 0 ? (
                            <span className="text-sm text-text-muted italic">No items selected</span>
                        ) : (
                            selectedRunes.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="relative group/selected shrink-0">
                                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-bg-tertiary border transition-all ${item.type === 'path' ? 'border-primary shadow-[0_0_10px_rgba(103,61,230,0.2)]' : 'border-white/10'}`}>
                                        <img src={item.icon} alt={item.name} className={`w-6 h-6 object-contain ${item.type === 'path' ? 'brightness-125' : ''}`} title={item.name} />
                                    </div>
                                    <button
                                        onClick={() => toggleRune(item, item.type)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white shadow-lg opacity-0 group-hover/selected:opacity-100 transition-all scale-75 group-hover/selected:scale-100"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={onClose} variant="ghost" className="text-text-secondary hover:text-white hover:bg-white/5">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDone}
                            disabled={selectedRunes.length === 0}
                            className="bg-primary hover:bg-primary/90 text-white btn-glow px-8 h-11 font-bold"
                        >
                            Insert {selectedRunes.length} Item{selectedRunes.length !== 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
