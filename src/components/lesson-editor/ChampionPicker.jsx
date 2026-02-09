import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lolDataService from '@/services/lolDataService';

/**
 * Champion Picker Component
 * Displays a searchable grid of League of Legends champions
 */
export default function ChampionPicker({ onSelect, onClose }) {
    const [champions, setChampions] = useState([]);
    const [filteredChampions, setFilteredChampions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState('all');

    useEffect(() => {
        loadChampions();
    }, []);

    useEffect(() => {
        filterChampions();
    }, [searchQuery, selectedRole, champions]);

    const loadChampions = async () => {
        setLoading(true);
        const data = await lolDataService.getChampions();
        setChampions(data);
        setFilteredChampions(data);
        setLoading(false);
    };

    const filterChampions = () => {
        let filtered = champions;

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.title.toLowerCase().includes(query)
            );
        }

        // Filter by role
        if (selectedRole !== 'all') {
            filtered = filtered.filter(c => c.tags.includes(selectedRole));
        }

        setFilteredChampions(filtered);
    };

    const roles = [
        { value: 'all', label: 'All' },
        { value: 'Fighter', label: 'Fighter' },
        { value: 'Tank', label: 'Tank' },
        { value: 'Mage', label: 'Mage' },
        { value: 'Assassin', label: 'Assassin' },
        { value: 'Marksman', label: 'Marksman' },
        { value: 'Support', label: 'Support' }
    ];

    const handleSelect = (champion) => {
        onSelect({
            type: 'champion',
            data: champion
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-text-primary">Select Champion</h2>
                    <Button onClick={onClose} variant="ghost" size="icon">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Search and Filter */}
                <div className="p-6 space-y-4 border-b border-white/10">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search champions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-tertiary border border-white/10 rounded-xl pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {roles.map(role => (
                            <button
                                key={role.value}
                                onClick={() => setSelectedRole(role.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRole === role.value
                                        ? 'bg-primary text-white'
                                        : 'bg-bg-tertiary text-text-secondary hover:bg-white/5'
                                    }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Champions Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-text-secondary">Loading champions...</div>
                    ) : filteredChampions.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No champions found</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredChampions.map(champion => (
                                <button
                                    key={champion.id}
                                    onClick={() => handleSelect(champion)}
                                    className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-primary transition-all hover:scale-105"
                                >
                                    <img
                                        src={champion.icon}
                                        alt={champion.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <div className="text-left w-full">
                                            <div className="text-white font-semibold text-sm">{champion.name}</div>
                                            <div className="text-text-muted text-xs">{champion.title}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
