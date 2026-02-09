
import React from 'react';
import { Plus, Trash2, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TableBlock({ block, onChange, isAdmin, onAssetRequest }) {
    const data = block.data || [['', ''], ['', '']];

    const updateCell = (rowIndex, colIndex, value) => {
        const newData = [...data];
        newData[rowIndex][colIndex] = value;
        onChange({ ...block, data: newData });
    };

    const addRow = () => {
        const newRow = new Array(data[0].length).fill('');
        const newData = [...data, newRow];
        onChange({ ...block, data: newData });
    };

    const addColumn = () => {
        const newData = data.map(row => [...row, '']);
        onChange({ ...block, data: newData });
    };

    const removeRow = (rowIndex) => {
        if (data.length <= 1) return;
        const newData = data.filter((_, i) => i !== rowIndex);
        onChange({ ...block, data: newData });
    };

    const removeColumn = (colIndex) => {
        if (data[0].length <= 1) return;
        const newData = data.map(row => row.filter((_, i) => i !== colIndex));
        onChange({ ...block, data: newData });
    };

    if (!isAdmin) {
        return (
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {data[0].map((cell, i) => (
                                <th key={i} className="border-b border-white/10 bg-white/[0.03] p-6 text-left font-black text-text-primary uppercase tracking-widest text-xs">
                                    <div dangerouslySetInnerHTML={{ __html: cell }} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(1).map((row, i) => (
                            <tr key={i} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.05] last:border-0 text-left">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-6 text-text-secondary">
                                        <div dangerouslySetInnerHTML={{ __html: cell }} className="flex items-center gap-2 flex-wrap" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto rounded-[32px] border border-white/10 bg-bg-secondary p-1">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr>
                            {data[0].map((_, colIndex) => (
                                <th key={colIndex} className="p-2">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => removeColumn(colIndex)}
                                            className="p-1 px-3 rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="p-1 min-w-[200px] group relative">
                                        <div className="relative">
                                            <textarea
                                                value={cell}
                                                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                rows={1}
                                                className={`w-full bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none ${rowIndex === 0 ? 'font-black uppercase tracking-widest bg-white/5 text-xs' : ''}`}
                                                placeholder={rowIndex === 0 ? "HEADER..." : "CELL CONTENT..."}
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-tertiary/90 backdrop-blur-sm p-1 rounded-lg border border-white/10 shadow-xl z-20">
                                                <button onClick={() => onAssetRequest('champion', rowIndex, colIndex)} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"><User className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => onAssetRequest('item', rowIndex, colIndex)} className="p-1 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"><Shield className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    </td>
                                ))}
                                <td className="p-1 text-center">
                                    <button onClick={() => removeRow(rowIndex)} className="p-1 px-3 rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex gap-4">
                <Button onClick={addRow} variant="outline" size="sm" className="border-white/10 text-text-muted hover:text-white hover:bg-white/5 rounded-full px-6 font-black text-[10px] tracking-widest"><Plus className="w-3.5 h-3.5 mr-2" />ADD ROW</Button>
                <Button onClick={addColumn} variant="outline" size="sm" className="border-white/10 text-text-muted hover:text-white hover:bg-white/5 rounded-full px-6 font-black text-[10px] tracking-widest"><Plus className="w-3.5 h-3.5 mr-2" />ADD COLUMN</Button>
            </div>
        </div>
    );
}
