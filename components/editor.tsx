"use client";

import '@/css/tiptap.scss'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorProvider, useCurrentEditor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
}

const MenuBar = () => {
  const { editor } = useCurrentEditor()

  if (!editor) return null

  const buttonStyle = 'rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-colors hover:bg-primary/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  return (
    <div className="control-group">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(
            editor.isActive('bold') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn(
            editor.isActive('italic') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={cn(
            editor.isActive('strike') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Strike
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={cn(
            editor.isActive('code') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Code
        </button>

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className={cn('bg-muted text-muted-foreground', buttonStyle)}
        >
          Clear marks
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().run()}
          className={cn('bg-muted text-muted-foreground', buttonStyle)}
        >
          Clear nodes
        </button>

        {/* Paragraph & Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn(
            editor.isActive('paragraph') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Paragraph
        </button>
        {[1, 2, 3, 4, 5, 6].map((level: 1 | 2 | 3 | 4 | 5 | 6) => (
          <button
            key={level}
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={cn(
              editor.isActive('heading', { level }) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
              buttonStyle
            )}
          >
            H{level}
          </button>
        ))}

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            editor.isActive('bulletList') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            editor.isActive('orderedList') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Ordered List
        </button>

        {/* Code & Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            editor.isActive('codeBlock') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Code Block
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            editor.isActive('blockquote') ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Blockquote
        </button>

        {/* Special Elements */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={cn('bg-muted text-muted-foreground', buttonStyle)}
        >
          Horizontal Rule
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className={cn('bg-muted text-muted-foreground', buttonStyle)}
        >
          Hard Break
        </button>

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className={cn('bg-muted text-muted-foreground', buttonStyle)}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className={cn('bg-muted text-muted-foreground', buttonStyle)}
        >
          Redo
        </button>

        {/* Colors */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setColor('#958DF1').run()}
          className={cn(
            editor.isActive('textStyle', { color: '#958DF1' }) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            buttonStyle
          )}
        >
          Purple
        </button>
      </div>
      <div className="border-b border-muted-foreground mb-8" />
    </div>
  )
}

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle,
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
]

export const Editor = (props: EditorProps) => {
  const { onChange, value } = props;
  const initialContent = `${value}` || '<p></p>'

  console.log('value :>> ', value);

  return (
    <div className="bg-white rounded-md border border-input p-4">
      <EditorProvider
        immediatelyRender={false}
        slotBefore={<MenuBar />}
        extensions={extensions}
        content={initialContent}
        onUpdate={({ editor }) => {
          const newContent = editor.getHTML();
          if (newContent !== value) {
            onChange(newContent);
          }
        }}
        onCreate={({ editor }) => {
          // Set initial content
          if (value && editor.getHTML() !== value) {
            editor.commands.setContent(value);
          }
        }}
        editorProps={{
          attributes: {
            class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none'
          }
        }}
      />
    </div>
  );
};