'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './RichTextEditor.module.scss';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Enter text...', rows = 4 }: RichTextEditorProps) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Sync value to editor content
  useEffect(() => {
    if (editorRef.current && isEditorReady && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isEditorReady]);

  useEffect(() => {
    setIsEditorReady(true);
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  return (
    <div className={styles.richTextEditor}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolbarButton} ${isCommandActive('bold') ? styles.active : ''}`}
          onClick={() => execCommand('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`${styles.toolbarButton} ${isCommandActive('italic') ? styles.active : ''}`}
          onClick={() => execCommand('italic')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`${styles.toolbarButton} ${isCommandActive('underline') ? styles.active : ''}`}
          onClick={() => execCommand('underline')}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <div className={styles.separator} />
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => execCommand('createLink', prompt('Enter URL:') || '')}
          title="Insert Link"
        >
          🔗
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => execCommand('removeFormat')}
          title="Clear Formatting"
        >
          ✗
        </button>
      </div>
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ minHeight: `${rows * 1.5}em` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      <small className={styles.hint}>
        Use the toolbar buttons or keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline)
      </small>
    </div>
  );
}