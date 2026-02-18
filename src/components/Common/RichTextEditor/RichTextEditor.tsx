/**
 * Rich Text Editor Component
 *
 * A simple rich text editor using Tiptap for formatting text with bold, italic, etc.
 * Supports @mentions when mentionUsers prop is provided.
 */

'use client';

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { useEffect, useCallback, useState, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import styles from './RichTextEditor.module.scss';
import LinkModal from './LinkModal';
import MentionList, { MentionUser, MentionListRef, MentionListProps } from './MentionList';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  mentionUsers?: MentionUser[];
}

export interface RichTextEditorHandle {
  insertText: (text: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { value, onChange, placeholder = 'Start typing...', className, compact = false, mentionUsers }: RichTextEditorProps,
  ref
) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(true);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);

  // Use ref to store mentionUsers so the suggestion can always access latest value
  const mentionUsersRef = useRef<MentionUser[]>(mentionUsers || []);

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
          // Read from ref to get latest users
          const users = mentionUsersRef.current;
          console.log('Mention items called, users:', users, 'query:', query);
          return users
            .filter((user) => {
              const searchTerm = query.toLowerCase();
              const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
              const email = (user.email || '').toLowerCase();
              return fullName.includes(searchTerm) || email.includes(searchTerm);
            })
            .slice(0, 5);
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
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: null,
        },
      }),
      ...(mentionExtension ? [mentionExtension] : []),
    ];

    return baseExtensions;
  }, [placeholder, mentionExtension]);

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
    immediatelyRender: false,
  });

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href || '';
    const previousTarget = editor.getAttributes('link').target || '_blank';

    setLinkUrl(previousUrl);
    setLinkOpenInNewTab(previousTarget === '_blank');
    setIsLinkModalOpen(true);
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
        target: openInNewTab ? '_blank' : '_self',
        rel: openInNewTab ? 'noopener noreferrer' : null,
      })
      .run();
  }, [editor]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
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
        className={editor.isActive('bold') ? styles.active : ''}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? styles.active : ''}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? styles.active : ''}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={openLinkModal}
        className={editor.isActive('link') ? styles.active : ''}
        title="Add Link"
      >
        🔗
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive('paragraph') ? styles.active : ''}
        title="Paragraph"
      >
        P
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
        title="Heading 3"
      >
        H3
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? styles.active : ''}
        title="Bullet List"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? styles.active : ''}
        title="Numbered List"
      >
        1.
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        onClick={() => editor.chain().focus().setHardBreak().run()}
        title="Line Break"
      >
        ↵
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
      <EditorContent editor={editor} />
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        initialUrl={linkUrl}
        initialOpenInNewTab={linkOpenInNewTab}
      />
    </div>
  );
});

export default RichTextEditor;
