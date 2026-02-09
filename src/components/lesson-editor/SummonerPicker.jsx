import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lolDataService from '@/services/lolDataService';

/**
 * Summoner Spell Picker Component
 */
export default function SummonerPicker({ onSelect, onClose }) {
    const [summoners, setSummoners] = useState([]);
    const [filteredSummoners, setFilteredSummoners] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedSummoners, setSelectedSummoners] = useState([]);

    useEffect(() => {
        loadSummoners();
    }, []);

    useEffect(() => {
        filterSummoners();
    }, [searchQuery, summoners]);

    const loadSummoners = async () => {
        setLoading(true);
        const data = await lolDataService.getSummonerSpells();
        setSummoners(data);
        setFilteredSummoners(data);
        setLoading(false);
    };

    const filterSummoners = () => {
        if (!searchQuery) {
            setFilteredSummoners(summoners);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = summoners.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query)
        );
        setFilteredSummoners(filtered);
    };

    const toggleSummoner = (summoner) => {
        setSelectedSummoners(prev => {
            const isSelected = prev.find(s => s.id === summoner.id);
            if (isSelected) {
                return prev.filter(s => s.id !== summoner.id);
            } else {
                // Limit to 2 summoner spells
                if (prev.length >= 2) {
                    return [prev[1], summoner];
                }
                return [...prev, summoner];
            }
        });
    };

    const handleDone = () => {
        if (selectedSummoners.length > 0) {
            onSelect({
                type: 'summoners',
                data: selectedSummoners
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Select Summoner Spells</h2>
                        <p className="text-sm text-text-secondary mt-1">Choose up to 2 summoner spells</p>
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
                            placeholder="Search spells..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-tertiary border border-white/10 rounded-xl pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Summoners Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-text-secondary">Loading summoner spells...</div>
                    ) : filteredSummoners.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No spells found</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {filteredSummoners.map(summoner => {
                                const isSelected = selectedSummoners.find(s => s.id === summoner.id);
                                return (
                                    <button
                                        key={summoner.id}
                                        onClick={() => toggleSummoner(summoner)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${isSelected
                                                ? 'border-primary ring-2 ring-primary'
                                                : 'border-white/10 hover:border-primary/50'
                                            }`}
                                    >
                                        <img
                                            src={summoner.icon}
                                            alt={summoner.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <div className="text-white text-xs font-semibold text-center">{summoner.name}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {selectedSummoners.indexOf(summoner) + 1}
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
                        disabled={selectedSummoners.length === 0}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        Add Summoner Spells
                    </Button>
                </div>
            </div>
        </div>
    );
}
