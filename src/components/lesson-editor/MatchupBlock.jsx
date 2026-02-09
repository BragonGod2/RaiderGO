import React, { useState, useEffect } from 'react';
import { Swords, Link as LinkIcon, Plus, Trash2, Search, X, Info, ChevronLeft, ChevronRight, Pencil, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChampionPicker from './ChampionPicker';
import ItemPicker from './ItemPicker';
import lolDataService from '@/services/lolDataService';

const THREAT_LEVELS = [
    { label: 'EXTREME', color: 'bg-[#ff4655]', hover: 'hover:bg-[#ff5a67]', value: 6 },
    { label: 'MAJOR', color: 'bg-[#c33a3d]/60', hover: 'hover:bg-[#c33a3d]/80', value: 11 },
    { label: 'EVEN', color: 'bg-[#2b3c5a]/60', hover: 'hover:bg-[#2b3c5a]/80', value: 20 },
    { label: 'MINOR', color: 'bg-[#1a2333]', hover: 'hover:bg-[#242f45]', value: 10 },
    { label: 'TINY', color: 'bg-[#0d131c]', hover: 'hover:bg-[#161f2d]', value: 1 }
];

const SYNERGY_LEVELS = [
    { label: 'NONE', color: 'bg-[#0d131c]', hover: 'hover:bg-[#161f2d]', value: 0 },
    { label: 'LOW', color: 'bg-[#1a2333]', hover: 'hover:bg-[#242f45]', value: 0 },
    { label: 'OK', color: 'bg-[#2b3c5a]/60', hover: 'hover:bg-[#2b3c5a]/80', value: 0 },
    { label: 'STRONG', color: 'bg-[#1b5e20]/60', hover: 'hover:bg-[#1b5e20]/80', value: 0 },
    { label: 'IDEAL', color: 'bg-[#43a047]', hover: 'hover:bg-[#4caf50]', value: 3 }
];

const STAT_SHARDS = [
    [
        { id: '5008', name: 'Adaptive Force', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsadaptiveforceicon.png', description: '+5.4 AD or 9 AP' },
        { id: '5005', name: 'Attack Speed', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsattackspeedicon.png', description: '+10% Attack Speed' },
        { id: '5007', name: 'Ability Haste', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodscdrscalingicon.png', description: '+8 Ability Haste' }
    ],
    [
        { id: '5008', name: 'Adaptive Force', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsadaptiveforceicon.png', description: '+5.4 AD or 9 AP' },
        { id: '5001', name: 'Move Speed', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsmovementspeedicon.png', description: '+2.5% Move Speed' },
        { id: '5011', name: 'Health Scaling', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodshealthscalingicon.png', description: '+10-200 Health' }
    ],
    [
        { id: '5013', name: 'Bonus Health', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodshealthplusicon.png', description: '+65 Bonus Health' },
        { id: '5010', name: 'Tenacity', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodstenacityicon.png', description: '+15% Tenacity/Slow Resist' },
        { id: '5011', name: 'Health Scaling', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodshealthscalingicon.png', description: '+10-200 Health' }
    ]
];

export default function MatchupBlock({ block, onChange, isAdmin }) {
    const [selectedType, setSelectedType] = useState('all'); // 'threats', 'synergies', or 'all'
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [filterLevel, setFilterLevel] = useState(null); // 'EXTREME', 'MAJOR', etc OR null for show all
    const [showPicker, setShowPicker] = useState(false);
    const [showLoadoutPicker, setShowLoadoutPicker] = useState(null);
    const [showItemPicker, setShowItemPicker] = useState(null); // { groupId: string }
    const [mainChampion, setMainChampion] = useState(null);
    const [pickerType, setPickerType] = useState('item');
    const [runeTrees, setRuneTrees] = useState([]);
    const [summoners, setSummoners] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const data = block.data || { threats: [], synergies: [], mainChampionId: null };
    const threats = data.threats || [];
    const synergies = data.synergies || [];

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            const [trees, spells, items, champ] = await Promise.all([
                lolDataService.getRunes(),
                lolDataService.getSummonerSpells(),
                lolDataService.getItems(),
                data.mainChampionId ? lolDataService.getChampionById(data.mainChampionId) : null
            ]);
            setRuneTrees(trees);
            setSummoners(spells);
            setAllItems(items);
            if (champ) setMainChampion(champ);
            setLoading(false);
        };
        loadAll();
    }, [data.mainChampionId]);

    useEffect(() => {
        const fullList = selectedType === 'all' ? [...threats, ...synergies] : (selectedType === 'threats' ? threats : synergies);
        const currentList = filterLevel ? fullList.filter(i => i.level === filterLevel) : fullList;

        // If nothing is selected OR the current selection isn't in the current filtered list, pick the first one
        if (!selectedItemId || !currentList.find(i => i.id === selectedItemId)) {
            if (currentList.length > 0) {
                setSelectedItemId(currentList[0].id);
            } else if (selectedItemId) {
                setSelectedItemId(null);
            }
        }
    }, [selectedType, filterLevel, threats, synergies]);

    const handleAddMatchup = (champion) => {
        if (pickerType === 'main') {
            onChange({
                data: { ...data, mainChampionId: champion.data.id }
            });
            setShowPicker(false);
            return;
        }

        const newItem = {
            id: champion.data.id,
            name: champion.data.name,
            icon: champion.data.icon,
            level: selectedType === 'threats' ? 'EXTREME' : 'IDEAL',
            description: '',
            loadout: {
                primaryTreeId: null,
                primaryRuneIds: [],
                secondaryTreeId: null,
                secondaryRuneIds: [],
                shardIds: {},
                summonerIds: [],
                runeNotes: '',
                spellNotes: '',
                itemGroups: []
            }
        };

        const list = selectedType === 'threats' ? [...threats] : [...synergies];
        if (list.find(i => i.id === newItem.id)) {
            setShowPicker(false);
            return;
        }

        list.push(newItem);
        onChange({
            data: { ...data, [selectedType]: list }
        });
        setSelectedItemId(newItem.id);
        setShowPicker(false);
    };

    const updateItem = (id, updates) => {
        const list = activeItemType === 'threats' ? [...threats] : [...synergies];
        const newList = list.map(item => item.id === id ? { ...item, ...updates } : item);
        onChange({
            data: { ...data, [activeItemType]: newList }
        });
    };

    const updateActiveLoadout = (updates) => {
        if (!activeItem) return;
        const newLoadout = { ...(activeItem.loadout || {}), ...updates };
        updateItem(activeItem.id, { loadout: newLoadout });
    };

    const removeItem = (id) => {
        const type = threats.find(i => i.id === id) ? 'threats' : 'synergies';
        const list = type === 'threats' ? [...threats] : [...synergies];
        const newList = list.filter(item => item.id !== id);
        if (selectedItemId === id) setSelectedItemId(null);
        onChange({
            data: { ...data, [type]: newList }
        });
    };

    const activeItem = [...threats, ...synergies].find(i => i.id === selectedItemId);
    const activeItemType = threats.find(i => i?.id === selectedItemId) ? 'threats' : 'synergies';
    const activeLoadout = activeItem?.loadout || {};

    const getCounts = (type, level) => {
        const list = type === 'threats' ? threats : synergies;
        return list.filter(i => i.level === level).length;
    };

    const getRuneIcon = (id) => {
        for (const tree of runeTrees) {
            if (tree.id === id) return tree.icon;
            for (const slot of tree.slots) {
                for (const rune of slot.runes) {
                    if (rune.id === id) return rune.icon;
                }
            }
        }
        return null;
    };

    const getRuneName = (id) => {
        for (const tree of runeTrees) {
            if (tree.id === id) return tree.name;
            for (const slot of tree.slots) {
                for (const rune of slot.runes) {
                    if (rune.id === id) return rune.name;
                }
            }
        }
        return '';
    };

    const getSummonerIcon = (id) => summoners.find(s => s.id === id)?.icon;
    const getSummonerName = (id) => summoners.find(s => s.id === id)?.name;

    const getItemIcon = (id) => allItems.find(i => i.id === id)?.icon;
    const getItemName = (id) => allItems.find(i => i.id === id)?.name;

    const addItemGroup = () => {
        const currentGroups = activeLoadout.itemGroups || [];
        const newGroup = {
            id: Math.random().toString(36).substring(7),
            title: 'NEW ITEM SET',
            items: [],
            notes: ''
        };
        updateActiveLoadout({ itemGroups: [...currentGroups, newGroup] });
    };

    const updateItemGroup = (groupId, updates) => {
        const groups = activeLoadout.itemGroups.map(g => g.id === groupId ? { ...g, ...updates } : g);
        updateActiveLoadout({ itemGroups: groups });
    };

    const removeItemGroup = (groupId) => {
        const groups = activeLoadout.itemGroups.filter(g => g.id !== groupId);
        updateActiveLoadout({ itemGroups: groups });
    };


    if (loading) return (
        <div className="bg-[#0b0e14] border border-white/5 rounded-[40px] p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-text-muted">Initializing Tactical Interface...</span>
        </div>
    );

    return (
        <div className="bg-[#0b0e14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl matchup-block-container">
            {/* Header with Arrow */}
            <div className="flex items-center gap-3 px-10 py-5 border-b border-white/5 bg-[#0d1117] group/header cursor-pointer">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-text-muted transition-transform group-hover:translate-y-0.5" />
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-text-muted group-hover:text-text-primary transition-colors italic">Threats & Synergies</h3>
            </div>

            <div className="p-12 space-y-16 lg:space-y-24">
                {/* Visual Scale Section (Same as before) */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4 max-w-5xl mx-auto">
                    {/* Threats Side */}
                    <div className="flex-1 w-full space-y-8">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <Swords className="w-5 h-5 text-[#ff4655] drop-shadow-[0_0_8px_rgba(255,70,85,0.5)]" />
                                <span className="text-sm font-black tracking-[0.2em] uppercase text-white italic">Threats</span>
                            </div>
                        </div>
                        <div className="flex h-20 items-stretch gap-1">
                            {THREAT_LEVELS.map((level, i) => {
                                const count = getCounts('threats', level.label);
                                const isSelectedType = selectedType === 'threats';
                                return (
                                    <button
                                        key={level.label}
                                        onClick={() => {
                                            setSelectedType('threats');
                                            setFilterLevel(level.label);
                                        }}
                                        className={`flex-1 relative transition-all duration-300 group ${level.color} 
                                            ${level.hover} flex flex-col items-center justify-center overflow-hidden
                                            ${(isSelectedType && filterLevel === level.label) ? 'ring-2 ring-white/40 z-10 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                                        style={{
                                            clipPath: i === 0
                                                ? 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)'
                                                : i === 4
                                                    ? 'polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%)'
                                                    : `polygon(0% ${15 - i * 3}%, 100% ${15 - (i + 1) * 3}%, 100% ${85 + (i + 1) * 3}%, 0% ${85 + i * 3}%)`,
                                        }}
                                    >
                                        <span className="text-[9px] font-black text-white/60 tracking-tighter mb-1 select-none">{level.label}</span>
                                        <span className="text-lg font-black text-white drop-shadow-md select-none">{count}</span>
                                        {isSelectedType && <div className="absolute inset-0 bg-white/5 pointer-events-none" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Champion Pivot */}
                    <div className="relative group/main z-20 mx-4">
                        <div
                            onClick={() => isAdmin && (setPickerType('main'), setShowPicker(true))}
                            className={`w-32 h-32 rounded-full border-[6px] border-[#161b22] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-2 ring-white/10 relative transition-all duration-500 ${isAdmin ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
                        >
                            {mainChampion ? (
                                <img src={mainChampion.icon} alt={mainChampion.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#161b22] flex items-center justify-center text-text-muted italic text-[10px] text-center px-6 uppercase font-black leading-tight">Pick Lesson Champion</div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setSelectedType('all');
                                setFilterLevel(null);
                            }}
                            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.3em] transition-all italic px-4 py-1 rounded-full border shadow-xl
                                ${selectedType === 'all' && filterLevel === null ? 'bg-primary text-white border-primary' : 'bg-[#0b0e14] text-primary border-white/5 hover:text-white'}`}
                        >
                            Show All
                        </button>
                    </div>

                    {/* Synergies Side */}
                    <div className="flex-1 w-full space-y-8">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <LinkIcon className="w-5 h-5 text-[#43a047] drop-shadow-[0_0_8px_rgba(67,160,71,0.5)]" />
                                <span className="text-sm font-black tracking-[0.2em] uppercase text-white italic">Synergies</span>
                            </div>
                        </div>
                        <div className="flex h-20 items-stretch gap-1">
                            {SYNERGY_LEVELS.map((level, i) => {
                                const count = getCounts('synergies', level.label);
                                const isSelectedType = selectedType === 'synergies';
                                return (
                                    <button
                                        key={level.label}
                                        onClick={() => {
                                            setSelectedType('synergies');
                                            setFilterLevel(level.label);
                                        }}
                                        className={`flex-1 relative transition-all duration-300 group ${level.color} 
                                            ${level.hover} flex flex-col items-center justify-center overflow-hidden
                                            ${(isSelectedType && filterLevel === level.label) ? 'ring-2 ring-white/40 z-10 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                                        style={{
                                            clipPath: i === 4
                                                ? 'polygon(0% 0%, 100% 15%, 100% 85%, 0% 100%)'
                                                : i === 0
                                                    ? 'polygon(0% 5%, 100% 0%, 100% 100%, 0% 95%)'
                                                    : `polygon(0% ${(i) * 3}%, 100% ${(i + 1) * 3}%, 100% ${100 - (i + 1) * 3}%, 0% ${100 - i * 3}%)`,
                                        }}
                                    >
                                        <span className="text-[9px] font-black text-white/60 tracking-tighter mb-1 select-none">{level.label}</span>
                                        <span className="text-lg font-black text-white drop-shadow-md select-none">{count}</span>
                                        {isSelectedType && <div className="absolute inset-0 bg-white/5 pointer-events-none" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sub-Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-t border-white/5 pt-16">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${selectedType === 'threats' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                            {selectedType === 'threats' ? <Swords className="w-6 h-6 text-red-500" /> : <LinkIcon className="w-6 h-6 text-green-500" />}
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter italic">
                            {selectedType === 'all' && !filterLevel ? 'Total Strategic Grid' :
                                filterLevel ? `${filterLevel} ${selectedType === 'threats' ? 'Threats' : selectedType === 'synergies' ? 'Synergies' : 'Targets'}` :
                                    `All ${selectedType === 'threats' ? 'Threats' : 'Synergies'}`}
                        </h4>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => (setPickerType('item'), setShowPicker(true))}
                            className="w-fit flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-xs font-black tracking-[0.1em] uppercase text-text-muted hover:text-white transition-all border border-white/5 shadow-xl"
                        >
                            <Plus className="w-4 h-4 text-primary" /> Add Champion
                        </button>
                    )}
                </div>

                {/* Matchup Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-16 xl:gap-24 min-h-[480px]">
                    {/* Detail Column */}
                    <div className="relative">
                        {activeItem && (
                            <div className="space-y-16">
                                {/* Header Info */}
                                <div className="flex flex-col md:flex-row items-start gap-10">
                                    <div className={`w-40 h-40 rounded-full border-[8px] overflow-hidden shrink-0 shadow-2xl relative z-10 
                                        ${activeItemType === 'threats' ? 'border-red-500/30' : 'border-green-500/30'}`}>
                                        <img src={activeItem.icon} alt={activeItem.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 space-y-4 pt-4 w-full">
                                        <div className="space-y-1">
                                            <h5 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{activeItem.name}</h5>
                                            <div className={`text-[11px] font-black tracking-[0.2em] uppercase italic ${activeItemType === 'threats' ? 'text-red-500' : 'text-green-500'}`}>
                                                {activeItem.level}
                                            </div>
                                        </div>

                                        {isAdmin ? (
                                            <div className="space-y-6 pt-4">
                                                <div className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/5 w-fit">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Adjust Level:</span>
                                                    <select
                                                        value={activeItem.level}
                                                        onChange={(e) => updateItem(activeItem.id, { level: e.target.value })}
                                                        className="bg-[#161b22] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg border border-white/10 outline-none text-white hover:border-primary/50 transition-colors"
                                                    >
                                                        {(activeItemType === 'threats' ? THREAT_LEVELS : SYNERGY_LEVELS).map(l => (
                                                            <option key={l.label} value={l.label}>{l.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <textarea
                                                    value={activeItem.description}
                                                    onChange={(e) => updateItem(activeItem.id, { description: e.target.value })}
                                                    placeholder="Enter strategic matchup data, power spikes, and counter-play..."
                                                    className="w-full bg-[#161b22]/30 p-6 rounded-[24px] border border-white/5 text-sm md:text-base text-text-secondary leading-relaxed focus:outline-none focus:border-primary/30 min-h-[120px] scrollbar-hide resize-none shadow-inner transition-all"
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-[#161b22]/20 p-8 rounded-[32px] border border-white/5 mt-6">
                                                <p className="text-base text-text-secondary leading-loose italic opacity-90">
                                                    {activeItem.description || "The Grandmaster hasn't provided specific tactical data for this matchup yet."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Integrated Loadout Section */}
                                <div className="border-t border-white/5 pt-16 space-y-12">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                            <h6 className="text-xl font-black uppercase tracking-tighter italic">Recommended Loadout</h6>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_0.6fr] gap-12 lg:gap-20 bg-white/[0.01] p-10 rounded-[40px] border border-white/5 relative">
                                        {/* Runes Column */}
                                        <div className="space-y-16">
                                            <div className="space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-primary italic">Primary: {getRuneName(activeLoadout.primaryTreeId) || 'Select Path'}</h4>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <button
                                                        onClick={() => isAdmin && setShowLoadoutPicker({ type: 'primary-tree' })}
                                                        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center bg-[#0d1117] transition-all shadow-xl relative 
                                                            ${activeLoadout.primaryTreeId ? 'border-primary/40' : 'border-dashed border-white/10'}
                                                            ${isAdmin ? 'hover:border-primary/60 cursor-pointer active:scale-95' : 'cursor-default'}`}
                                                    >
                                                        {activeLoadout.primaryTreeId ? <img src={getRuneIcon(activeLoadout.primaryTreeId)} className="w-10 h-10 brightness-110" /> : <Plus className="w-5 h-5 text-white/5" />}
                                                    </button>
                                                    <div className="flex items-center gap-6">
                                                        {[0, 1, 2, 3].map(rowIdx => (
                                                            <div key={rowIdx} className="flex flex-col items-center gap-2">
                                                                <button
                                                                    onClick={() => isAdmin && setShowLoadoutPicker({ type: 'primary-rune', slotIndex: rowIdx })}
                                                                    className={`rounded-full flex items-center justify-center transition-all bg-[#0d1117] shadow-lg 
                                                                        ${rowIdx === 0 ? 'w-14 h-14 border-2 border-primary/20' : 'w-10 h-10 border border-white/10'} 
                                                                        ${activeLoadout.primaryRuneIds?.[rowIdx] ? 'ring-1 ring-white/10' : 'opacity-30 border-dashed'}
                                                                        ${isAdmin ? 'hover:scale-110 cursor-pointer active:scale-90' : 'cursor-default'}`}
                                                                >
                                                                    {activeLoadout.primaryRuneIds?.[rowIdx] ? <img src={getRuneIcon(activeLoadout.primaryRuneIds[rowIdx])} className={rowIdx === 0 ? 'w-10 h-10' : 'w-7 h-7'} alt="rune" /> : <Plus className="w-4 h-4 text-white/20" />}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-green-500/80 italic">Secondary: {getRuneName(activeLoadout.secondaryTreeId) || 'Select Path'}</h4>
                                                <div className="flex items-center gap-6">
                                                    <button
                                                        onClick={() => isAdmin && setShowLoadoutPicker({ type: 'secondary-tree' })}
                                                        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center bg-[#0d1117] transition-all shadow-xl relative 
                                                            ${activeLoadout.secondaryTreeId ? 'border-green-500/40' : 'border-dashed border-white/10'}
                                                            ${isAdmin ? 'hover:border-green-500/60 cursor-pointer active:scale-95' : 'cursor-default'}`}
                                                    >
                                                        {activeLoadout.secondaryTreeId ? <img src={getRuneIcon(activeLoadout.secondaryTreeId)} className="w-8 h-8 brightness-110" /> : <Plus className="w-4 h-4 text-white/5" />}
                                                    </button>
                                                    <div className="flex items-center gap-6">
                                                        {[0, 1].map(idx => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => isAdmin && setShowLoadoutPicker({ type: 'secondary-rune', slotIndex: idx })}
                                                                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all bg-[#0d1117] shadow-lg 
                                                                    ${activeLoadout.secondaryRuneIds?.[idx] ? 'border-white/10' : 'opacity-30 border-dashed border-white/5'}
                                                                    ${isAdmin ? 'hover:scale-110 cursor-pointer active:scale-90' : 'cursor-default'}`}
                                                            >
                                                                {activeLoadout.secondaryRuneIds?.[idx] ? <img src={getRuneIcon(activeLoadout.secondaryRuneIds[idx])} className="w-7 h-7" alt="rune" /> : <Plus className="w-4 h-4 text-white/20" />}
                                                            </button>
                                                        ))}
                                                        <div className="flex flex-col gap-1.5 pl-6 border-l border-white/5">
                                                            {[0, 1, 2].map(rowIdx => (
                                                                <div key={rowIdx} className="flex gap-1.5">
                                                                    {STAT_SHARDS[rowIdx].map(shard => (
                                                                        <button
                                                                            key={shard.id}
                                                                            onClick={() => isAdmin && updateActiveLoadout({ shardIds: { ...(activeLoadout.shardIds || {}), [rowIdx]: shard.id } })}
                                                                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all 
                                                                                ${activeLoadout.shardIds?.[rowIdx] === shard.id ? 'bg-primary ring-1 ring-white/20 scale-110' : 'bg-white/5 grayscale opacity-30'}
                                                                                ${isAdmin ? 'hover:opacity-100 hover:grayscale-0 cursor-pointer' : 'cursor-default'}`}
                                                                        >
                                                                            <img src={shard.icon} className="w-3.5 h-3.5" alt={shard.name} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex flex-col max-w-[120px]">
                                                            {[0, 1, 2].map(rowIdx => {
                                                                const shard = STAT_SHARDS[rowIdx].find(s => s.id === activeLoadout.shardIds?.[rowIdx]);
                                                                return <span key={rowIdx} className="text-[8px] font-bold text-text-muted/40 uppercase tracking-tighter leading-none mb-1">{shard ? shard.description : '—'}</span>;
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden lg:block w-px bg-white/5" />

                                        {/* Spells Column */}
                                        <div className="space-y-12">
                                            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest block">Summoner Spells</span>
                                            <div className="flex gap-8">
                                                {[0, 1].map(idx => (
                                                    <div key={idx} className="flex flex-col items-center gap-3">
                                                        <button
                                                            onClick={() => isAdmin && setShowLoadoutPicker({ type: 'summoner', slotIndex: idx })}
                                                            className={`w-16 h-16 rounded-full border-[4px] border-[#161b22] overflow-hidden shadow-2xl relative transition-all 
                                                                ${activeLoadout.summonerIds?.[idx] ? 'ring-2 ring-white/5' : 'border-dashed border-white/5'}
                                                                ${isAdmin ? 'hover:scale-105 cursor-pointer active:scale-95' : 'cursor-default'}`}
                                                        >
                                                            {activeLoadout.summonerIds?.[idx] ? <img src={getSummonerIcon(activeLoadout.summonerIds[idx])} className="w-full h-full object-cover" /> : <Plus className="w-5 h-5 text-white/5" />}
                                                        </button>
                                                        <span className="text-[10px] font-black text-text-muted uppercase italic tracking-tighter">{activeLoadout.summonerIds?.[idx] ? getSummonerName(activeLoadout.summonerIds[idx]) : 'Select'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-white/5 space-y-3">
                                                {isAdmin ? (
                                                    <textarea
                                                        value={activeLoadout.runeNotes || ''}
                                                        onChange={e => updateActiveLoadout({ runeNotes: e.target.value })}
                                                        placeholder="Tactical Loadout Notes..."
                                                        className="w-full bg-transparent text-[11px] text-text-secondary leading-relaxed border-none focus:outline-none placeholder:text-text-muted/40 italic h-24 resize-none"
                                                    />
                                                ) : activeLoadout.runeNotes && (
                                                    <p className="text-[11px] text-text-secondary leading-relaxed italic opacity-80">{activeLoadout.runeNotes}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Section */}
                                    <div className="pt-16 space-y-12">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-text-muted" />
                                                <h6 className="text-xl font-black uppercase tracking-tighter italic">Tactical Itemization</h6>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={addItemGroup}
                                                    className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors bg-primary/10 px-4 py-2 rounded-lg border border-primary/20"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> ADD ITEM SET
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {(activeLoadout.itemGroups || []).map(group => (
                                                <div key={group.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-6 relative group/item-group">
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => removeItemGroup(group.id)}
                                                            className="absolute top-4 right-4 p-2 text-red-500/40 hover:text-red-500 opacity-0 group-hover/item-group:opacity-100 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between gap-4">
                                                            {isAdmin ? (
                                                                <input
                                                                    value={group.title}
                                                                    onChange={e => updateItemGroup(group.id, { title: e.target.value.toUpperCase() })}
                                                                    placeholder="SET TITLE..."
                                                                    className="bg-transparent border-none text-[11px] font-black tracking-[0.2em] uppercase text-text-muted italic focus:outline-none focus:text-white w-full"
                                                                />
                                                            ) : (
                                                                <span className="text-[11px] font-black tracking-[0.2em] uppercase text-text-muted italic">{group.title}</span>
                                                            )}
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => setShowItemPicker({ groupId: group.id })}
                                                                    className="flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-white/80 transition-colors shrink-0"
                                                                >
                                                                    <Pencil className="w-3 h-3 text-primary" /> NOTES
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-4">
                                                            {group.items?.map(itemId => (
                                                                <div key={itemId} className="relative group/item">
                                                                    <div className="w-14 h-14 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative">
                                                                        <img src={getItemIcon(itemId)} alt="item" className="w-full h-full object-cover" />
                                                                        {isAdmin && (
                                                                            <button
                                                                                onClick={() => updateItemGroup(group.id, { items: group.items.filter(id => id !== itemId) })}
                                                                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all"
                                                                            >
                                                                                <X className="w-5 h-5 text-white" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-text-muted/60 uppercase tracking-tighter block mt-2 text-center max-w-[56px] leading-tight truncate">
                                                                        {getItemName(itemId)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => setShowItemPicker({ groupId: group.id })}
                                                                    className="w-14 h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center hover:border-primary/50 transition-all bg-white/[0.01]"
                                                                >
                                                                    <Plus className="w-5 h-5 text-white/10" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(isAdmin || group.notes) && (
                                                        <div className="pt-6 border-t border-white/5">
                                                            {isAdmin ? (
                                                                <textarea
                                                                    value={group.notes}
                                                                    onChange={e => updateItemGroup(group.id, { notes: e.target.value })}
                                                                    placeholder="Tactical reasoning for this set..."
                                                                    className="w-full bg-transparent text-[10px] text-text-secondary leading-relaxed border-none focus:outline-none placeholder:text-text-muted/30 italic h-20 resize-none"
                                                                />
                                                            ) : (
                                                                <p className="text-[10px] text-text-secondary leading-relaxed italic opacity-80">{group.notes}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {isAdmin && (activeLoadout.itemGroups || []).length === 0 && (
                                                <div className="col-span-full border-2 border-dashed border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 bg-white/[0.01]">
                                                    <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">No item sets defined for this target</span>
                                                    <Button onClick={addItemGroup} variant="ghost" className="text-primary hover:text-white transition-colors">Start Itemization</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* List Column */}
                    <div className="relative xl:pl-16 xl:border-l border-white/5">
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-3 gap-5">
                            {(selectedType === 'all' ? [...threats, ...synergies] : (selectedType === 'threats' ? threats : synergies))
                                .filter(item => !filterLevel || item.level === filterLevel)
                                .map(item => {
                                    const itemIsThreat = threats.find(t => t.id === item.id);
                                    return (
                                        <div key={item.id} className="relative group/card aspect-square">
                                            <button
                                                onClick={() => setSelectedItemId(item.id)}
                                                className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 relative
                                                ${selectedItemId === item.id
                                                        ? (itemIsThreat ? 'border-red-500 shadow-[0_0_25px_rgba(255,70,85,0.4)] scale-[1.02]' : 'border-green-500 shadow-[0_0_25px_rgba(67,160,71,0.4)] scale-[1.02]')
                                                        : `border-white/10 ${isAdmin ? 'hover:border-white/30 hover:scale-[1.05]' : 'hover:border-white/20'}`}
                                            `}
                                            >
                                                <img src={item.icon} alt={item.name} className={`w-full h-full object-cover transition-all duration-500 ${selectedItemId !== item.id ? 'grayscale opacity-50 group-hover/card:grayscale-0 group-hover/card:opacity-100' : ''}`} />
                                                <div className={`absolute top-2 right-2 w-5 h-5 rounded-lg bg-[#0b0e14] border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300 ${selectedItemId === item.id ? 'scale-110 border-primary' : 'opacity-80'}`}>
                                                    <div className={`w-1 h-2.5 relative overflow-hidden rounded-full ${itemIsThreat ? 'bg-red-500' : 'bg-green-500'}`}><div className="absolute top-0 left-0 w-full h-[20%] bg-white/50" /></div>
                                                </div>
                                            </button>
                                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#ff4655] text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all shadow-2xl hover:scale-110 active:scale-90 border-[3px] border-[#0b0e14] z-30"><X className="w-4 h-4" /></button>}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Loadout Pickers (In-place) */}
            {showLoadoutPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
                    <div className="bg-bg-secondary border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">Selection Required</h3>
                            <button onClick={() => setShowLoadoutPicker(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {showLoadoutPicker.type === 'primary-tree' || showLoadoutPicker.type === 'secondary-tree' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {runeTrees.map(tree => (
                                        <button key={tree.id} onClick={() => { updateActiveLoadout(showLoadoutPicker.type === 'primary-tree' ? { primaryTreeId: tree.id, primaryRuneIds: [] } : { secondaryTreeId: tree.id, secondaryRuneIds: [] }); setShowLoadoutPicker(null); }} className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all">
                                            <img src={tree.icon} className="w-12 h-12" />
                                            <span className="text-xs font-black uppercase tracking-widest">{tree.name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : showLoadoutPicker.type === 'primary-rune' || showLoadoutPicker.type === 'secondary-rune' ? (
                                <div className="space-y-4">
                                    {(() => {
                                        const treeId = showLoadoutPicker.type === 'primary-rune' ? activeLoadout.primaryTreeId : activeLoadout.secondaryTreeId;
                                        const tree = runeTrees.find(t => t.id === treeId);
                                        if (!tree) return <div className="text-center py-10 italic opacity-40">Select a tree first</div>;
                                        const slots = showLoadoutPicker.type === 'primary-rune' ? [tree.slots[showLoadoutPicker.slotIndex]] : tree.slots.slice(1);
                                        return slots.map((slot, sIdx) => (
                                            <div key={sIdx} className="grid grid-cols-3 gap-4">
                                                {slot.runes.map(rune => (
                                                    <button key={rune.id} onClick={() => { const field = showLoadoutPicker.type === 'primary-rune' ? 'primaryRuneIds' : 'secondaryRuneIds'; const current = activeLoadout[field] || []; const next = [...current]; next[showLoadoutPicker.slotIndex] = rune.id; updateActiveLoadout({ [field]: next }); setShowLoadoutPicker(null); }} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all">
                                                        <img src={rune.icon} className="w-10 h-10" />
                                                        <span className="text-[10px] font-bold text-center uppercase tracking-tighter leading-tight">{rune.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            ) : showLoadoutPicker.type === 'summoner' && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {summoners.map(s => (
                                        <button key={s.id} onClick={() => { const current = activeLoadout.summonerIds || []; const next = [...current]; next[showLoadoutPicker.slotIndex] = s.id; updateActiveLoadout({ summonerIds: next }); setShowLoadoutPicker(null); }} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all">
                                            <img src={s.icon} className="w-12 h-12 rounded-lg" />
                                            <span className="text-[10px] font-bold text-center uppercase tracking-tighter leading-tight">{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPicker && <ChampionPicker onSelect={handleAddMatchup} onClose={() => setShowPicker(false)} />}

            {showItemPicker && (
                <ItemPicker
                    onSelect={(result) => {
                        const groupId = showItemPicker.groupId;
                        const group = activeLoadout.itemGroups.find(g => g.id === groupId);
                        const existingItems = group.items || [];
                        const newItems = result.data.map(i => i.id);
                        // Filter out duplicates
                        const combined = [...new Set([...existingItems, ...newItems])];
                        updateItemGroup(groupId, { items: combined });
                    }}
                    onClose={() => setShowItemPicker(null)}
                />
            )}
        </div>
    );
}
