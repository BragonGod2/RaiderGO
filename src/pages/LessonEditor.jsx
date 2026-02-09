
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
    ArrowLeft, Save, X, Bold, Italic, List as ListIcon, ListOrdered,
    Heading1, Heading2, Heading3, User, Shield, Sparkles, Plus, Trash2,
    Type, Table as TableIcon, Zap, Underline as UnderlineIcon,
    Strikethrough, Quote, Minus, Link as LinkIcon, Pilcrow, Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import ChampionPicker from '@/components/lesson-editor/ChampionPicker';
import ItemPicker from '@/components/lesson-editor/ItemPicker';
import SummonerPicker from '@/components/lesson-editor/SummonerPicker';
import RunePicker from '@/components/lesson-editor/RunePicker';
import MatchupBlock from '@/components/lesson-editor/MatchupBlock';

// Helper for unique IDs that works in non-secure contexts
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 11);
};

// Custom Inline Icon Extension to ensure images are treated as inline text
const InlineIcon = Image.extend({
    name: 'inlineIcon',
    inline: true,
    group: 'inline',
    draggable: true,
    addAttributes() {
        return {
            ...this.parent?.(),
            src: { default: null },
            alt: { default: null },
            width: {
                default: null,
                parseHTML: element => element.getAttribute('width') || element.style.width,
                renderHTML: attributes => attributes.width ? { width: attributes.width } : {},
            },
            height: {
                default: null,
                parseHTML: element => element.getAttribute('height') || element.style.height,
                renderHTML: attributes => attributes.height ? { height: attributes.height } : {},
            },
            style: {
                default: null,
                parseHTML: element => element.getAttribute('style'),
                renderHTML: attributes => attributes.style ? { style: attributes.style } : {},
            },
        }
    },
    parseHTML() {
        return [{ tag: 'img[src]' }]
    },
    renderHTML({ HTMLAttributes }) {
        return ['img', HTMLAttributes]
    },
    addNodeView() {
        return ReactNodeViewRenderer(ResizableIcon);
    },
});

const ResizableIcon = ({ node, updateAttributes, selected, editor }) => {
    const imgRef = useRef(null);
    const [isSnapped, setIsSnapped] = useState(false);

    const onMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = imgRef.current?.offsetWidth || 32;

        // Collect all other specific widths of inline icons in the editor for snapping
        const otherWidths = [];
        editor.state.doc.descendants((child) => {
            if (child.type.name === 'inlineIcon' && child !== node) {
                const w = parseInt(child.attrs.width);
                if (w && !otherWidths.includes(w)) otherWidths.push(w);
            }
        });

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const step = 4;
            const rawWidth = startWidth + deltaX;

            // 1. Regular grid snapping
            let targetWidth = Math.round(rawWidth / step) * step;
            let snapped = false;

            // 2. Asset snapping (overrides grid if close enough)
            const snapThreshold = 8;
            for (const w of otherWidths) {
                if (Math.abs(rawWidth - w) < snapThreshold) {
                    targetWidth = w;
                    snapped = true;
                    break;
                }
            }

            setIsSnapped(snapped);
            const newWidth = Math.max(16, targetWidth);

            updateAttributes({
                width: `${newWidth}px`,
                height: 'auto',
            });
        };

        const onMouseUp = () => {
            setIsSnapped(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Parse the style string but filter out width/height so attributes take priority
    const baseStyle = typeof node.attrs.style === 'string'
        ? node.attrs.style.split(';').reduce((acc, s) => {
            const [k, v] = s.split(':').map(str => str.trim());
            if (k && v && !['width', 'height'].includes(k.toLowerCase())) {
                acc[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] = v;
            }
            return acc;
        }, {})
        : {};

    return (
        <NodeViewWrapper className={`inline-block relative leading-none align-middle ${selected ? 'ProseMirror-selectednode' : ''}`}>
            <img
                ref={imgRef}
                src={node.attrs.src}
                alt={node.attrs.alt}
                style={{
                    ...baseStyle,
                    width: node.attrs.width || 'auto',
                    height: node.attrs.height || 'auto',
                    maxWidth: 'none',
                    display: 'block',
                }}
                className={`rounded shadow-lg ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-primary' : ''}`}
            />
            {selected && editor.isEditable && (
                <div
                    onMouseDown={onMouseDown}
                    className={`absolute -right-2 -bottom-2 w-4 h-4 border-2 border-white rounded-sm cursor-nwse-resize shadow-xl z-[100] transition-all
                        ${isSnapped ? 'bg-green-500 scale-125' : 'bg-primary hover:scale-110 active:scale-95'}`}
                />
            )}
        </NodeViewWrapper>
    );
};

// Text Block Component
const TextBlockItem = ({ block, onChange, isAdmin, onFocus }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
            }),
            InlineIcon.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'inline-block rounded shadow-lg align-middle mx-1 my-0',
                    style: 'display: inline-block; vertical-align: middle; height: 1.8em; width: auto;'
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing this section...'
            })
        ],
        content: block.content || '',
        editable: isAdmin,
        onUpdate: ({ editor }) => {
            onChange({ content: editor.getHTML() });
        },
        onFocus: () => {
            if (onFocus) onFocus(editor);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] px-6 py-4'
            }
        }
    });

    useEffect(() => {
        if (editor && block.content !== editor.getHTML() && !editor.isFocused) {
            editor.commands.setContent(block.content, false);
        }
    }, [block.content, editor]);

    return (
        <div className={`rounded-xl transition-all duration-500 border border-white/5 ${isAdmin ? 'bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]' : 'bg-transparent'}`}>
            <EditorContent editor={editor} />
        </div>
    );
};

export default function LessonEditor() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdmin();

    const [lesson, setLesson] = useState({ title: '', content_blocks: [], is_free: false });
    const [loading, setLoading] = useState(false);
    const [accessLoading, setAccessLoading] = useState(true);

    const [activeBlockId, setActiveBlockId] = useState(null);
    const [activeEditor, setActiveEditor] = useState(null);

    const [showChampionPicker, setShowChampionPicker] = useState(false);
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [showSummonerPicker, setShowSummonerPicker] = useState(false);
    const [showRunePicker, setShowRunePicker] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

    // First render ref to avoid autosaving on load
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!adminLoading) {
            if (lessonId && lessonId !== 'new') { loadLesson(); }
            else {
                setAccessLoading(false);
                setLesson({
                    title: 'New Lesson',
                    content_blocks: [{ id: generateId(), type: 'text', title: 'Introduction', content: '' }],
                    is_free: false
                });
            }
        }
    }, [lessonId, adminLoading]);

    // Autosave logic
    useEffect(() => {
        if (!isAdmin || isFirstRender.current || lessonId === 'new') {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            saveLessonSilently();
        }, 2000);

        return () => clearTimeout(timer);
    }, [lesson, lesson.content_blocks, lesson.title, lesson.is_free]);

    const saveLessonSilently = async () => {
        setSaveStatus('saving');
        const firstTextBlock = lesson.content_blocks.find(b => b.type === 'text');
        const payload = {
            title: lesson.title,
            course_id: courseId,
            is_free: !!lesson.is_free,
            content_blocks: lesson.content_blocks,
            content: firstTextBlock?.content || ''
        };

        const { error } = await supabase.from('lessons').update(payload).eq('id', lessonId);

        if (error) {
            setSaveStatus('error');
            console.error('Autosave error:', error);
        } else {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const loadLesson = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single();
            if (error) throw error;

            if (!isAdmin && !(data.is_free || data.isFree)) {
                const { data: purchase } = await supabase.from('purchases').select('id').eq('user_id', currentUser?.id).eq('course_id', courseId).maybeSingle();
                if (!purchase) { navigate(`/courses/${courseId}`); return; }
            }

            const blocks = data.content_blocks?.length > 0 ? data.content_blocks : [{ id: 'migrated', type: 'text', title: 'Content', content: data.content || '' }];
            setLesson({ ...data, content_blocks: blocks.map(b => ({ ...b, id: b.id || generateId() })) });
        } catch (e) {
            toast({ title: 'Error loading lesson', variant: 'destructive' });
            navigate(`/courses/${courseId}`);
        } finally {
            setLoading(false); setAccessLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isAdmin) return;
        setLoading(true);
        const firstTextBlock = lesson.content_blocks.find(b => b.type === 'text');
        const payload = {
            title: lesson.title,
            course_id: courseId,
            is_free: !!lesson.is_free,
            content_blocks: lesson.content_blocks,
            content: firstTextBlock?.content || ''
        };

        const { error } = lessonId === 'new'
            ? await supabase.from('lessons').insert(payload)
            : await supabase.from('lessons').update(payload).eq('id', lessonId);

        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Lesson saved successfully' });
            navigate(`/courses/${courseId}${isAdmin ? '?edit=true' : ''}`);
        }
        setLoading(false);
    };

    const addBlock = (type) => {
        setLesson(prev => ({
            ...prev,
            content_blocks: [...prev.content_blocks, {
                id: generateId(),
                type,
                title: type === 'text' ? 'New Section' : type === 'matchup' ? 'Matchups' : 'Tactical Loadout',
                content: type === 'text' ? '' : undefined,
                data: type === 'matchup' ? { threats: [], synergies: [], mainChampionId: null } : undefined
            }]
        }));
    };

    const updateBlock = (id, updates) => {
        setLesson(prev => ({ ...prev, content_blocks: prev.content_blocks.map(b => b.id === id ? { ...b, ...updates } : b) }));
    };

    const removeBlock = (id) => {
        if (activeBlockId === id) { setActiveBlockId(null); setActiveEditor(null); }
        setLesson(prev => ({ ...prev, content_blocks: prev.content_blocks.filter(b => b.id !== id) }));
    };

    const insertAsset = (html) => {
        if (activeEditor) {
            // Focus and insert as a single transaction
            activeEditor.chain()
                .focus()
                .insertContent(html)
                .insertContent(' ') // trailing space for cursor landing
                .run();
        } else {
            toast({ title: 'Select a text area first' });
        }
    };

    if (accessLoading || adminLoading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            <Navigation />
            <div className="fixed top-16 left-0 right-0 z-[60] bg-bg-secondary/90 backdrop-blur-2xl border-b border-white/5">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-8">
                    <div className="flex items-center gap-4 flex-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-text-muted hover:text-white shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
                        <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-primary' : 'bg-green-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                                    {isAdmin ? 'Editorial Mode' : 'Viewing Mode'}
                                    {saveStatus === 'saving' && ' • SAVING...'}
                                    {saveStatus === 'saved' && ' • SAVED'}
                                </span>
                            </div>
                            <input
                                value={lesson.title || ''}
                                onChange={e => isAdmin && setLesson(prev => ({ ...prev, title: e.target.value }))}
                                readOnly={!isAdmin}
                                placeholder="LESSON TITLE"
                                className="bg-transparent text-xl font-bold border-none focus:outline-none text-text-primary px-0 py-0 placeholder:text-text-muted/30"
                            />
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-[11px] font-black tracking-widest text-text-muted hover:text-white cursor-pointer bg-white/[0.03] px-4 py-2 rounded-full border border-white/5"><input type="checkbox" checked={!!lesson.is_free} onChange={e => setLesson(prev => ({ ...prev, is_free: e.target.checked }))} className="w-3.5 h-3.5 rounded-full border-white/20 bg-bg-tertiary text-primary" />FREE PREVIEW</label>
                            {lessonId === 'new' && (
                                <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-black px-10 shadow-xl">{loading ? 'Saving...' : 'SAVE'}</Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <main className="container mx-auto max-w-7xl px-6 pt-48 pb-32">
                <div className="space-y-40">
                    {lesson.content_blocks.map((block, index) => (
                        <div key={block.id} className="group relative">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-6 flex-1">
                                    <span className="text-6xl font-black text-white/20 font-mono leading-none tracking-tighter">{(index + 1).toString().padStart(2, '0')}</span>
                                    <input
                                        value={block.title || ''}
                                        onChange={e => isAdmin && updateBlock(block.id, { title: e.target.value })}
                                        placeholder="SECTION TITLE"
                                        readOnly={!isAdmin}
                                        className="bg-transparent text-3xl font-black border-none focus:outline-none text-text-primary placeholder:text-text-muted/20 tracking-tighter uppercase flex-1"
                                    />
                                </div>
                                {isAdmin && <Button variant="ghost" size="icon" onClick={() => removeBlock(block.id)} className="text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-full group-hover:opacity-100 opacity-30"><Trash2 className="w-5 h-5" /></Button>}
                            </div>
                            <div className="relative">
                                {block.type === 'text' ? (
                                    <div className="space-y-8">
                                        <TextBlockItem block={block} onChange={updates => updateBlock(block.id, updates)} isAdmin={isAdmin} onFocus={(editor) => { setActiveEditor(editor); setActiveBlockId(block.id); }} />
                                        {isAdmin && activeBlockId === block.id && (
                                            <div className="flex flex-col gap-5 p-5 bg-bg-secondary border border-white/5 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex gap-1 border-r border-white/5 pr-3">
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().setParagraph().run()} className={activeEditor?.isActive('paragraph') ? 'text-primary' : 'text-text-muted'} title="Normal Text"><Pilcrow className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 1 }).run()} className={activeEditor?.isActive('heading', { level: 1 }) ? 'text-primary' : 'text-text-muted'}><Heading1 className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 2 }).run()} className={activeEditor?.isActive('heading', { level: 2 }) ? 'text-primary' : 'text-text-muted'}><Heading2 className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 3 }).run()} className={activeEditor?.isActive('heading', { level: 3 }) ? 'text-primary' : 'text-text-muted'}><Heading3 className="w-4 h-4" /></Button>
                                                    </div>
                                                    <div className="flex gap-1 border-r border-white/5 pr-3">
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleBold().run()} className={activeEditor?.isActive('bold') ? 'text-primary' : 'text-text-muted'}><Bold className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleItalic().run()} className={activeEditor?.isActive('italic') ? 'text-primary' : 'text-text-muted'}><Italic className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} className={activeEditor?.isActive('underline') ? 'text-primary' : 'text-text-muted'}><UnderlineIcon className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleStrike().run()} className={activeEditor?.isActive('strike') ? 'text-primary' : 'text-text-muted'}><Strikethrough className="w-4 h-4" /></Button>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleBulletList().run()} className={activeEditor?.isActive('bulletList') ? 'text-primary' : 'text-text-muted'}><ListIcon className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} className={activeEditor?.isActive('orderedList') ? 'text-primary' : 'text-text-muted'}><ListOrdered className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                                                    <button onClick={() => setShowChampionPicker(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-black uppercase hover:bg-blue-500/20 transition-all"><User className="w-4 h-4" /> CHAMPION</button>
                                                    <button onClick={() => setShowItemPicker(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 text-xs font-black uppercase hover:bg-yellow-500/20 transition-all"><Shield className="w-4 h-4" /> ITEMS</button>
                                                    <button onClick={() => setShowRunePicker(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-black uppercase hover:bg-purple-500/20 transition-all"><Sparkles className="w-4 h-4" /> RUNES</button>
                                                    <button onClick={() => setShowSummonerPicker(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-black uppercase hover:bg-green-500/20 transition-all"><Zap className="w-4 h-4" /> SUMMONER</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : block.type === 'matchup' ? (
                                    <MatchupBlock block={block} onChange={updates => updateBlock(block.id, updates)} isAdmin={isAdmin} />
                                ) : null}
                            </div>
                        </div>
                    ))}
                    {isAdmin && (
                        <div className="flex flex-col items-center gap-12 py-32 border-4 border-dashed border-white/5 rounded-[60px] hover:border-primary/20 transition-all hover:bg-white/[0.01]">
                            <div className="text-center space-y-3"><h3 className="text-3xl font-black uppercase tracking-tighter">Add Component</h3><p className="text-text-muted font-medium">Add a storytelling block or tactical matchups</p></div>
                            <div className="flex gap-20">
                                <button onClick={() => addBlock('text')} className="group flex flex-col items-center gap-5 transition-all hover:scale-110"><div className="w-24 h-24 rounded-[32px] bg-bg-secondary flex items-center justify-center border-2 border-white/5 shadow-2xl group-hover:border-primary/50 transition-all text-text-muted group-hover:text-primary"><Type className="w-10 h-10" /></div><span className="text-xs font-black tracking-widest uppercase">STORYTELLING</span></button>
                                <button onClick={() => addBlock('matchup')} className="group flex flex-col items-center gap-5 transition-all hover:scale-110"><div className="w-24 h-24 rounded-[32px] bg-bg-secondary flex items-center justify-center border-2 border-white/5 shadow-2xl group-hover:border-red-500/50 transition-all text-text-muted group-hover:text-red-500"><Swords className="w-10 h-10" /></div><span className="text-xs font-black tracking-widest uppercase">MATCHUPS</span></button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <div className="relative z-[200]">
                {showChampionPicker && <ChampionPicker onSelect={(champ) => insertAsset(`<img src="${champ.data.icon}" alt="${champ.data.name}" title="${champ.data.name}" style="width: 32px; height: 32px; vertical-align: middle; margin: 0 4px; display: inline-block; border-radius: 6px;" />`)} onClose={() => setShowChampionPicker(false)} />}
                {showItemPicker && <ItemPicker onSelect={(items) => insertAsset(items.data.map(item => `<img src="${item.icon}" alt="${item.name}" style="width: 28px; height: 28px; border-radius: 4px; vertical-align: middle; margin: 0 2px;" />`).join(''))} onClose={() => setShowItemPicker(false)} />}
                {showRunePicker && <RunePicker onSelect={(runes) => insertAsset(runes.data.map(r => `<img src="${r.icon}" alt="${r.name}" style="width: 24px; height: 24px; vertical-align: middle; margin: 0 2px;" />`).join(''))} onClose={() => setShowRunePicker(false)} />}
                {showSummonerPicker && <SummonerPicker onSelect={(s) => insertAsset(s.data.map(spell => `<img src="${spell.icon}" style="width: 32px; height: 32px; border-radius: 6px; vertical-align: middle; margin: 0 2px;" />`).join(''))} onClose={() => setShowSummonerPicker(false)} />}
            </div>
        </div>
    );
}
