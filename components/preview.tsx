"use client";

import '@/css/tiptap.scss'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorProvider } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface PreviewProps {
  value: string;
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

export const Preview = ({ value }: PreviewProps) => {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <EditorProvider
        extensions={extensions}
        content={value}
        editable={false}
      />
    </div>
  );
};