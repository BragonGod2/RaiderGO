
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function TextBlock({ block, onChange, isAdmin }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write something amazing...'
            })
        ],
        content: block.content || '',
        editable: isAdmin,
        onUpdate: ({ editor }) => {
            onChange({ ...block, content: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px] px-4 py-2'
            }
        }
    }, [block.id]); // Re-init only if block ID changes significantly? Actually usually want to preserve instance.

    // Handle external content updates
    React.useEffect(() => {
        if (editor && block.content !== editor.getHTML()) {
            // editor.commands.setContent(block.content);
        }
    }, [block.content, editor]);

    return (
        <div className={`rounded-lg ${isAdmin ? 'bg-bg-tertiary/20' : ''}`}>
            <EditorContent editor={editor} />
        </div>
    );
}
