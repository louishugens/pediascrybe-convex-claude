"use client";

import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, EditorState, LexicalEditor } from 'lexical';
import { cn } from '@/lib/utils';
import '@/css/lexical.scss';

// Toolbar imports
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $getSelection, $isRangeSelection, $createParagraphNode } from 'lexical';

interface EditorProps {
  onChange: (value: string) => void;
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

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const buttonStyle = 'rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-colors hover:bg-primary/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-muted text-muted-foreground';

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  return (
    <div className="control-group">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          className={buttonStyle}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          className={buttonStyle}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          className={buttonStyle}
        >
          Strike
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          className={buttonStyle}
        >
          Underline
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
          className={buttonStyle}
        >
          Code
        </button>

        {/* Paragraph & Headings */}
        <button
          type="button"
          onClick={formatParagraph}
          className={buttonStyle}
        >
          Paragraph
        </button>
        {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((heading) => (
          <button
            key={heading}
            type="button"
            onClick={() => formatHeading(heading)}
            className={buttonStyle}
          >
            {heading.toUpperCase()}
          </button>
        ))}

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          className={buttonStyle}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          className={buttonStyle}
        >
          Ordered List
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
          className={buttonStyle}
        >
          Remove List
        </button>

        {/* Quote */}
        <button
          type="button"
          onClick={formatQuote}
          className={buttonStyle}
        >
          Blockquote
        </button>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          className={buttonStyle}
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          className={buttonStyle}
        >
          Center
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          className={buttonStyle}
        >
          Right
        </button>

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className={buttonStyle}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className={buttonStyle}
        >
          Redo
        </button>
      </div>
      <div className="border-b border-muted-foreground mb-4" />
    </div>
  );
}

// Plugin to load initial HTML content
function InitialContentPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value) {
      editor.update(() => {
        const root = $getRoot();
        // Only set content if root is empty
        if (root.getTextContent().trim() === '') {
          const parser = new DOMParser();
          const dom = parser.parseFromString(value, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          root.clear();
          $insertNodes(nodes);
        }
      });
    }
  }, []);

  return null;
}

function onError(error: Error) {
  console.error('Lexical Error:', error);
}

export const Editor = ({ onChange, value }: EditorProps) => {
  const initialConfig = {
    namespace: 'ReportEditor',
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor);
      if (html !== value) {
        onChange(html);
      }
    });
  };

  return (
    <div className="bg-white rounded-md border border-input p-4">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="lexical-editor min-h-[200px] outline-none prose prose-sm sm:prose-base max-w-none" />
            }
            placeholder={
              <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
                Start writing your report...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin value={value} />
      </LexicalComposer>
    </div>
  );
};
