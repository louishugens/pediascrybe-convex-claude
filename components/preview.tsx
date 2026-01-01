"use client";

import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';

interface PreviewProps {
  value: string;
}

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-2xl font-bold mb-4',
    h2: 'text-xl font-bold mb-3',
    h3: 'text-lg font-bold mb-2',
    h4: 'text-base font-bold mb-2',
    h5: 'text-sm font-bold mb-1',
    h6: 'text-xs font-bold mb-1',
  },
  list: {
    ul: 'list-disc ml-4 mb-2',
    ol: 'list-decimal ml-4 mb-2',
    listitem: 'mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-gray-100 px-1 rounded font-mono text-sm',
  },
  quote: 'border-l-4 border-gray-300 pl-4 italic my-4',
  code: 'bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm block my-4',
};

// Plugin to load HTML content for preview
function LoadContentPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        $insertNodes(nodes);
      });
    }
  }, [editor, value]);

  return null;
}

function onError(error: Error) {
  console.error('Lexical Preview Error:', error);
}

export const Preview = ({ value }: PreviewProps) => {
  const initialConfig = {
    namespace: 'ReportPreview',
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    editable: false,
  };

  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="lexical-preview outline-none" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <LoadContentPlugin value={value} />
      </LexicalComposer>
    </div>
  );
};
