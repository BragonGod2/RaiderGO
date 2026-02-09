import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ChevronLeft, ChevronRight, Pencil, Plus, X, Info, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lolDataService from '@/services/lolDataService';

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

export default function RunesSpellsBlock({ block, onChange, isAdmin }) {
    const [runeTrees, setRuneTrees] = useState([]);
    const [summoners, setSummoners] = useState([]);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [showPicker, setShowPicker] = useState(null); // { type: 'primary' | 'secondary' | 'summoner' | 'shard', slotIndex?: number }
    const [loading, setLoading] = useState(true);

    const pages = block.data?.pages || [{ id: '1', title: 'New Loadout' }];
    const activePage = pages[activePageIndex] || pages[0];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [trees, spells] = await Promise.all([
                lolDataService.getRunes(),
                lolDataService.getSummonerSpells()
            ]);
            setRuneTrees(trees);
            setSummoners(spells);
            setLoading(false);
        };
        loadData();
    }, []);

    const updateActivePage = (updates) => {
        const newPages = [...pages];
        newPages[activePageIndex] = { ...activePage, ...updates };
        onChange({ data: { ...block.data, pages: newPages } });
    };

    const addPage = () => {
        const newPage = { id: Math.random().toString(36).substring(7), title: `Loadout ${pages.length + 1}` };
        onChange({ data: { ...block.data, pages: [...pages, newPage] } });
        setActivePageIndex(pages.length);
    };

    const removePage = (index) => {
        if (pages.length <= 1) return;
        const newPages = pages.filter((_, i) => i !== index);
        onChange({ data: { ...block.data, pages: newPages } });
        setActivePageIndex(Math.max(0, activePageIndex - 1));
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

    const renderShard = (shardId, rowIndex) => {
        const shard = STAT_SHARDS[rowIndex].find(s => s.id === shardId);
        return (
            <div className="relative group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xl bg-bg-tertiary
                    ${shard ? 'border-primary/50' : 'border-white/5 opacity-30'}`}>
                    {shard ? <img src={shard.icon} className="w-5 h-5" alt={shard.name} title={shard.description} /> : null}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="bg-[#0b0e14] border border-white/5 rounded-[40px] p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-text-muted">Initializing Loadout Data...</span>
        </div>
    );

    return (
        <div className="bg-[#0b0e14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative group/loadout">
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-5 border-b border-white/5 bg-[#0d1117]">
                <div className="flex items-center gap-4">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-text-muted" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase tracking-[0.4em] text-text-muted italic">Runes:</span>
                        <input
                            value={activePage.title || ''}
                            onChange={e => isAdmin && updateActivePage({ title: e.target.value })}
                            readOnly={!isAdmin}
                            className="bg-transparent border-none focus:outline-none text-sm font-black text-white uppercase tracking-[0.2em] italic w-48"
                        />
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                    <button onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))} className="p-1.5 text-text-muted hover:text-white transition-colors disabled:opacity-20" disabled={activePageIndex === 0}><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex gap-1">
                        {pages.map((p, i) => (
                            <button
                                key={p.id}
                                onClick={() => setActivePageIndex(i)}
                                className={`w-6 h-7 flex items-center justify-center text-[10px] font-black tracking-tighter transition-all rounded-sm
                                    ${activePageIndex === i ? 'bg-primary text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        {isAdmin && (
                            <button onClick={addPage} className="w-6 h-7 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-all"><Plus className="w-3.5 h-3.5" /></button>
                        )}
                    </div>
                    <button onClick={() => setActivePageIndex(Math.min(pages.length - 1, activePageIndex + 1))} className="p-1.5 text-text-muted hover:text-white transition-colors disabled:opacity-20" disabled={activePageIndex === pages.length - 1}><ChevronRight className="w-4 h-4" /></button>
                    {isAdmin && pages.length > 1 && (
                        <button onClick={() => removePage(activePageIndex)} className="ml-2 p-1.5 text-red-500/50 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    )}
                </div>
            </div>

            <div className="p-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_0.6fr] gap-12 lg:gap-24">
                    {/* Runes Column */}
                    <div className="space-y-16">
                        {/* Primary Path */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black tracking-[0.3em] uppercase text-primary italic">Primary: {getRuneName(activePage.primaryTreeId) || 'Select Tree'}</h4>
                                {isAdmin && (
                                    <button onClick={() => setShowPicker({ type: 'rune-notes' })} className="flex items-center gap-2 text-[10px] font-bold text-text-muted hover:text-white transition-colors">
                                        <Pencil className="w-3 h-3" /> NOTES
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-8">
                                {/* Tree Icon */}
                                <button
                                    onClick={() => isAdmin && setShowPicker({ type: 'primary-tree' })}
                                    className={`w-20 h-20 rounded-full border-2 flex items-center justify-center bg-bg-tertiary transition-all shadow-xl relative
                                        ${activePage.primaryTreeId ? 'border-primary/40' : 'border-dashed border-white/10'}`}>
                                    {activePage.primaryTreeId ? <img src={getRuneIcon(activePage.primaryTreeId)} className="w-12 h-12 brightness-110" /> : <Info className="w-6 h-6 text-text-muted/20" />}
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-white/5" />
                                </button>

                                {/* Keystone + Row Runes */}
                                <div className="flex items-center gap-10">
                                    {[0, 1, 2, 3].map(rowIdx => (
                                        <div key={rowIdx} className="flex flex-col items-center gap-3">
                                            <button
                                                onClick={() => isAdmin && setShowPicker({ type: 'primary-rune', slotIndex: rowIdx })}
                                                className={`rounded-full flex items-center justify-center transition-all bg-bg-tertiary shadow-lg group/rune
                                                    ${rowIdx === 0 ? 'w-16 h-16 border-2 border-primary/20' : 'w-12 h-12 border border-white/10'}
                                                    ${(activePage.primaryRuneIds?.[rowIdx]) ? 'ring-1 ring-white/10' : 'opacity-30 border-dashed'}`}>
                                                {(activePage.primaryRuneIds?.[rowIdx]) ? (
                                                    <img src={getRuneIcon(activePage.primaryRuneIds[rowIdx])} className={`${rowIdx === 0 ? 'w-12 h-12' : 'w-8 h-8'}`} alt="rune" />
                                                ) : <Plus className="w-4 h-4 text-text-muted/50" />}
                                            </button>
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter text-center max-w-[80px] leading-tight">
                                                {(activePage.primaryRuneIds?.[rowIdx]) ? getRuneName(activePage.primaryRuneIds[rowIdx]) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Secondary Path */}
                        <div className="space-y-8">
                            <h4 className="text-[11px] font-black tracking-[0.3em] uppercase text-green-500/80 italic">Secondary: {getRuneName(activePage.secondaryTreeId) || 'Select Tree'}</h4>
                            <div className="flex items-center gap-8">
                                {/* Tree Icon */}
                                <button
                                    onClick={() => isAdmin && setShowPicker({ type: 'secondary-tree' })}
                                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center bg-bg-tertiary transition-all shadow-xl relative
                                        ${activePage.secondaryTreeId ? 'border-green-500/40' : 'border-dashed border-white/10'}`}>
                                    {activePage.secondaryTreeId ? <img src={getRuneIcon(activePage.secondaryTreeId)} className="w-10 h-10 brightness-110" /> : <Info className="w-5 h-5 text-text-muted/20" />}
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-white/5" />
                                </button>

                                {/* Secondary Runes */}
                                <div className="flex items-center gap-10">
                                    {[0, 1].map(idx => (
                                        <div key={idx} className="flex flex-col items-center gap-3">
                                            <button
                                                onClick={() => isAdmin && setShowPicker({ type: 'secondary-rune', slotIndex: idx })}
                                                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all bg-bg-tertiary shadow-lg
                                                    ${(activePage.secondaryRuneIds?.[idx]) ? 'border-white/10' : 'opacity-30 border-dashed border-white/5'}`}>
                                                {(activePage.secondaryRuneIds?.[idx]) ? (
                                                    <img src={getRuneIcon(activePage.secondaryRuneIds[idx])} className="w-8 h-8" alt="rune" />
                                                ) : <Plus className="w-4 h-4 text-text-muted/50" />}
                                            </button>
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter text-center max-w-[80px] leading-tight">
                                                {(activePage.secondaryRuneIds?.[idx]) ? getRuneName(activePage.secondaryRuneIds[idx]) : '—'}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Stat Shards */}
                                    <div className="flex flex-col gap-2 pl-8 border-l border-white/5">
                                        {[0, 1, 2].map(rowIdx => (
                                            <div key={rowIdx} className="flex gap-2">
                                                {STAT_SHARDS[rowIdx].map(shard => {
                                                    const isSelected = activePage.shardIds?.[rowIdx] === shard.id;
                                                    return (
                                                        <button
                                                            key={shard.id}
                                                            onClick={() => isAdmin && updateActivePage({ shardIds: { ...(activePage.shardIds || {}), [rowIdx]: shard.id } })}
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all
                                                                ${isSelected ? 'bg-primary ring-2 ring-white/20' : 'bg-white/5 hover:bg-white/10 grayscale opacity-40'}`}>
                                                            <img src={shard.icon} className="w-4 h-4" alt={shard.name} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-[9px] font-black text-white/40 italic uppercase mb-1">Bonus:</span>
                                        {[0, 1, 2].map(rowIdx => {
                                            const shard = STAT_SHARDS[rowIdx].find(s => s.id === activePage.shardIds?.[rowIdx]);
                                            return <span key={rowIdx} className="text-[9px] font-medium text-text-muted/60 leading-tight tracking-tighter">{shard ? shard.description : '—'}</span>;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="hidden lg:block w-px bg-white/5 h-full self-stretch" />

                    {/* Spells Column */}
                    <div className="space-y-16">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black tracking-[0.3em] uppercase text-text-muted italic">Spells:</h4>
                                {isAdmin && (
                                    <button onClick={() => setShowPicker({ type: 'spell-notes' })} className="flex items-center gap-2 text-[10px] font-bold text-text-muted hover:text-white transition-colors">
                                        <Pencil className="w-3 h-3" /> NOTES
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest block">Summoners:</span>
                                <div className="flex gap-10">
                                    {[0, 1].map(idx => (
                                        <div key={idx} className="flex flex-col items-center gap-4">
                                            <button
                                                onClick={() => isAdmin && setShowPicker({ type: 'summoner', slotIndex: idx })}
                                                className={`w-20 h-20 rounded-full border-[6px] border-[#161b22] overflow-hidden shadow-2xl relative transition-all group/spell
                                                    ${activePage.summonerIds?.[idx] ? 'ring-2 ring-white/10' : 'border-dashed border-white/5'}`}>
                                                {activePage.summonerIds?.[idx] ? (
                                                    <img src={getSummonerIcon(activePage.summonerIds[idx])} className="w-full h-full object-cover group-hover/spell:scale-110 transition-transform" />
                                                ) : <Plus className="w-6 h-6 text-text-muted/20" />}
                                            </button>
                                            <span className="text-sm font-black text-text-muted uppercase italic tracking-tighter">
                                                {activePage.summonerIds?.[idx] ? getSummonerName(activePage.summonerIds[idx]) : 'Select'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Notes Section (if they exist) */}
                        {(activePage.runeNotes || activePage.spellNotes) && (
                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
                                <h5 className="text-[9px] font-black uppercase text-primary italic tracking-widest">Tactical Briefing:</h5>
                                <p className="text-xs text-text-secondary leading-loose italic opacity-80 whitespace-pre-line">
                                    {[activePage.runeNotes, activePage.spellNotes].filter(Boolean).join('\n\n')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* In-place Pickers */}
            {showPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
                    <div className="bg-bg-secondary border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">Selection Required</h3>
                            <button onClick={() => setShowPicker(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {showPicker.type === 'primary-tree' || showPicker.type === 'secondary-tree' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {runeTrees.map(tree => (
                                        <button
                                            key={tree.id}
                                            onClick={() => {
                                                const updates = showPicker.type === 'primary-tree'
                                                    ? { primaryTreeId: tree.id, primaryRuneIds: [] }
                                                    : { secondaryTreeId: tree.id, secondaryRuneIds: [] };
                                                updateActivePage(updates);
                                                setShowPicker(null);
                                            }}
                                            className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/50 transition-all">
                                            <img src={tree.icon} className="w-12 h-12" />
                                            <span className="text-xs font-black uppercase tracking-widest">{tree.name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : showPicker.type === 'primary-rune' || showPicker.type === 'secondary-rune' ? (
                                <div className="space-y-4">
                                    {(() => {
                                        const treeId = showPicker.type === 'primary-rune' ? activePage.primaryTreeId : activePage.secondaryTreeId;
                                        const tree = runeTrees.find(t => t.id === treeId);
                                        if (!tree) return <div className="text-center py-10 italic opacity-40">Select a tree first</div>;

                                        // Primary has 4 slots (Keystone, Row 1, 2, 3)
                                        // Secondary has 2 slots, but they can be from any row (except Keystone)
                                        // For simplicity, we'll show all runes in the tree for secondary slots
                                        const slots = showPicker.type === 'primary-rune'
                                            ? [tree.slots[showPicker.slotIndex]]
                                            : tree.slots.slice(1);

                                        return slots.map((slot, sIdx) => (
                                            <div key={sIdx} className="grid grid-cols-3 gap-4">
                                                {slot.runes.map(rune => (
                                                    <button
                                                        key={rune.id}
                                                        onClick={() => {
                                                            const field = showPicker.type === 'primary-rune' ? 'primaryRuneIds' : 'secondaryRuneIds';
                                                            const current = activePage[field] || [];
                                                            const next = [...current];
                                                            next[showPicker.slotIndex] = rune.id;
                                                            updateActivePage({ [field]: next });
                                                            setShowPicker(null);
                                                        }}
                                                        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all">
                                                        <img src={rune.icon} className="w-10 h-10" />
                                                        <span className="text-[10px] font-bold text-center uppercase tracking-tighter leading-tight">{rune.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            ) : showPicker.type === 'summoner' ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {summoners.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                const current = activePage.summonerIds || [];
                                                const next = [...current];
                                                next[showPicker.slotIndex] = s.id;
                                                updateActivePage({ summonerIds: next });
                                                setShowPicker(null);
                                            }}
                                            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all">
                                            <img src={s.icon} className="w-12 h-12 rounded-lg" />
                                            <span className="text-[10px] font-bold text-center uppercase tracking-tighter leading-tight">{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : showPicker.type === 'rune-notes' || showPicker.type === 'spell-notes' ? (
                                <div className="space-y-4">
                                    <textarea
                                        autoFocus
                                        value={showPicker.type === 'rune-notes' ? activePage.runeNotes : activePage.spellNotes}
                                        onChange={e => updateActivePage({ [showPicker.type === 'rune-notes' ? 'runeNotes' : 'spellNotes']: e.target.value })}
                                        className="w-full bg-[#161b22] p-6 rounded-2xl border border-white/10 text-sm leading-relaxed focus:outline-none focus:border-primary min-h-[200px]"
                                        placeholder="Type tactical notes here..."
                                    />
                                    <Button onClick={() => setShowPicker(null)} className="w-full h-12 font-black uppercase">Close Notes</Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
