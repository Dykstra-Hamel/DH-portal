/**
 * Rich Text Editor Component
 *
 * A simple rich text editor using Tiptap for formatting text with bold, italic, etc.
 * Supports @mentions when mentionUsers prop is provided.
 */

'use client';

import { useEditor, EditorContent, ReactRenderer, useEditorState } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Link2, Pilcrow,
  Heading2, Heading3, List, ListOrdered, Sparkles
} from 'lucide-react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { useEffect, useCallback, useState, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import styles from './RichTextEditor.module.scss';
import LinkModal from './LinkModal';
import AIModal from './AIModal';
import MentionList, { MentionUser, MentionListRef, MentionListProps } from './MentionList';

// Extends the built-in Link extension to enforce rel="noopener noreferrer"
// on any link with target="_blank", including pasted links.
const SafeLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rel: {
        default: null,
        renderHTML(attrs) {
          if (attrs.target === '_blank') {
            return { rel: 'noopener noreferrer' };
          }
          return {};
        },
      },
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
  mentionUsers?: MentionUser[];
  companyId?: string;
}

export interface RichTextEditorHandle {
  insertText: (text: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { value, onChange, placeholder = 'Start typing...', className, contentClassName, compact = false, mentionUsers, companyId }: RichTextEditorProps,
  ref
) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSelectedText, setAISelectedText] = useState('');
  const [aiMode, setAiMode] = useState<'edit' | 'insert'>('edit');
  const [aiDocumentContext, setAiDocumentContext] = useState('');
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Use ref to store mentionUsers so the suggestion can always access latest value
  const mentionUsersRef = useRef<MentionUser[]>(mentionUsers || []);

  // Flag to distinguish programmatic content updates from real user edits
  const isProgrammaticUpdateRef = useRef(false);

  // Keep ref updated when mentionUsers changes
  useEffect(() => {
    mentionUsersRef.current = mentionUsers || [];
  }, [mentionUsers]);

  // Create mention extension configuration (only if mentionUsers prop exists)
  const mentionExtension = useMemo(() => {
    // Always create the extension if mentionUsers prop is provided (even if empty)
    // The ref will have the latest users when the suggestion triggers
    if (mentionUsers === undefined) return null;

    return Mention.configure({
      HTMLAttributes: {
        class: 'mention',
      },
      suggestion: {
        char: '@',
        items: ({ query }: { query: string }) => {
          const users = mentionUsersRef.current;
          const searchTerm = query.toLowerCase();

          const filtered = users.filter((user) => {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            return fullName.includes(searchTerm) || email.includes(searchTerm);
          });

          filtered.sort((a, b) => {
            const aFirst = (a.first_name || '').toLowerCase();
            const bFirst = (b.first_name || '').toLowerCase();

            if (searchTerm) {
              const aStartsWith = aFirst.startsWith(searchTerm);
              const bStartsWith = bFirst.startsWith(searchTerm);
              if (aStartsWith && !bStartsWith) return -1;
              if (!aStartsWith && bStartsWith) return 1;
            }

            const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
            const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
            return aName.localeCompare(bName);
          });

          return filtered;
        },
        render: () => {
          let component: ReactRenderer<MentionListRef, MentionListProps> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props: any) {
              component?.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }

              return (component?.ref as any)?.onKeyDown?.(props) || false;
            },

            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      },
    });
  }, [mentionUsers]);

  const extensions = useMemo(() => {
    const baseExtensions = [
      StarterKit.configure({
        link: false,
      }),
      SafeLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: null,
          rel: null,
          class: null,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ...(mentionExtension ? [mentionExtension] : []),
    ];

    return baseExtensions;
  }, [placeholder, mentionExtension]);

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      if (!isProgrammaticUpdateRef.current) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
    immediatelyRender: false,
  });

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor?.isActive('bold') ?? false,
      isItalic: ctx.editor?.isActive('italic') ?? false,
      isStrike: ctx.editor?.isActive('strike') ?? false,
      isLink: ctx.editor?.isActive('link') ?? false,
      isParagraph: ctx.editor?.isActive('paragraph') ?? false,
      isHeading2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
      isHeading3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
      isBulletList: ctx.editor?.isActive('bulletList') ?? false,
      isOrderedList: ctx.editor?.isActive('orderedList') ?? false,
      hasSelection: !(ctx.editor?.state.selection.empty ?? true),
    }),
  });

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href || '';
    const previousTarget = editor.getAttributes('link').target;

    setLinkUrl(previousUrl);
    setLinkOpenInNewTab(previousTarget === '_blank');
    setIsLinkModalOpen(true);
  }, [editor]);

  const openAIModal = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      const text = editor.state.doc.textBetween(from, to, '\n');
      if (!text) return;
      savedSelectionRef.current = { from, to };
      setAISelectedText(text);
      setAiMode('edit');
      setAiDocumentContext('');
    } else {
      savedSelectionRef.current = { from, to };
      setAISelectedText('');
      setAiMode('insert');
      setAiDocumentContext(editor.getHTML());
    }
    setIsAIModalOpen(true);
  }, [editor]);

  const handleApplyAI = useCallback((result: string) => {
    if (!editor || !savedSelectionRef.current) return;
    const { from, to } = savedSelectionRef.current;
    editor.chain().focus().setTextSelection({ from, to }).insertContent(result).run();
    savedSelectionRef.current = null;
  }, [editor]);

  const handleSaveLink = useCallback((url: string, openInNewTab: boolean) => {
    if (!editor) return;

    // Empty string removes the link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update link with target attribute
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: url,
        target: openInNewTab ? '_blank' : null,
        rel: openInNewTab ? 'noopener noreferrer' : null,
      })
      .run();
  }, [editor]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      isProgrammaticUpdateRef.current = true;
      editor.commands.setContent(value);
      isProgrammaticUpdateRef.current = false;
    }
  }, [value, editor]);

  // Expose insertText to allow variable insertion at cursor from parent
  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(text).run();
      },
    }),
    [editor]
  );

  if (!editor) {
    return null;
  }

  const toolbarContent = (
    <>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editorState?.isBold ? styles.active : ''}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editorState?.isItalic ? styles.active : ''}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editorState?.isStrike ? styles.active : ''}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={openLinkModal}
        className={editorState?.isLink ? styles.active : ''}
        title="Add Link"
      >
        <Link2 size={16} />
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editorState?.isParagraph ? styles.active : ''}
        title="Paragraph"
      >
        <Pilcrow size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editorState?.isHeading2 ? styles.active : ''}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editorState?.isHeading3 ? styles.active : ''}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editorState?.isBulletList ? styles.active : ''}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editorState?.isOrderedList ? styles.active : ''}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={openAIModal}
        title={editorState?.hasSelection ? 'Edit with AI' : 'Add content with AI'}
        className={styles.aiButton}
      >
        <Sparkles size={16} />
      </button>
    </>
  );

  return (
    <div className={`${styles.richTextEditor} ${compact ? styles.compact : ''} ${className || ''}`}>
      {compact ? (
        <div className={styles.compactToolbarWrapper}>
          <button
            type="button"
            className={styles.toolbarToggle}
            onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
            title="Formatting options"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {isToolbarExpanded && (
            <div className={styles.toolbarDropdown}>
              {toolbarContent}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.toolbar}>
          {toolbarContent}
        </div>
      )}
      <div className={contentClassName}>
        <EditorContent editor={editor} />
      </div>
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        initialUrl={linkUrl}
        initialOpenInNewTab={linkOpenInNewTab}
      />
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApply={handleApplyAI}
        selectedText={aiSelectedText}
        mode={aiMode}
        documentContext={aiDocumentContext}
        companyId={companyId}
      />
    </div>
  );
});

export default RichTextEditor;
