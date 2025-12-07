'use client';

import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/contexts/AIContext';
import styles from './ChatInterface.module.scss';
import { Send, Loader, AlertCircle, Trash2, Bot, User } from 'lucide-react';

interface ChatInterfaceProps {
  placeholder?: string;
  maxHeight?: string;
}

export default function ChatInterface({
  placeholder = 'Ask about your business data...',
  maxHeight = '600px',
}: ChatInterfaceProps) {
  const { chatMessages, isLoadingChat, chatError, sendChatMessage, clearChatHistory } =
    useAI();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoadingChat) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');

    await sendChatMessage(message);

    // Focus back on input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    'How many leads did we get this month?',
    'What&apos;s our win rate?',
    'Show me call sentiment breakdown',
    'Which pest types are most popular?',
  ];

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <Bot className={styles.botIcon} size={24} />
          <div>
            <h3 className={styles.headerTitle}>AI Assistant</h3>
            <p className={styles.headerSubtitle}>
              Ask questions about your business data
            </p>
          </div>
        </div>
        {chatMessages.length > 0 && (
          <button
            type="button"
            onClick={clearChatHistory}
            className={styles.clearButton}
            title="Clear chat history"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer} style={{ maxHeight }}>
        {chatMessages.length === 0 ? (
          <div className={styles.emptyState}>
            <Bot size={48} className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>Start a conversation</h4>
            <p className={styles.emptyDescription}>
              Ask me anything about your business data, metrics, or insights.
            </p>

            {/* Suggested questions */}
            <div className={styles.suggestions}>
              <p className={styles.suggestionsTitle}>Try asking:</p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInputMessage(question)}
                  className={styles.suggestionButton}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                <div className={styles.messageAvatar}>
                  {message.role === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.messageRole}>
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className={styles.messageText}>{message.content}</div>
                  {message.timestamp && (
                    <div className={styles.messageTimestamp}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoadingChat && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageAvatar}>
                  <Bot size={20} />
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.messageRole}>AI Assistant</div>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error message */}
      {chatError && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} />
          <span>{chatError}</span>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.input}
          rows={1}
          disabled={isLoadingChat}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoadingChat}
          className={styles.sendButton}
          title="Send message"
        >
          {isLoadingChat ? <Loader className={styles.spinner} size={20} /> : <Send size={20} />}
        </button>
      </form>

      {/* Hint text */}
      <div className={styles.hintText}>
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </div>
    </div>
  );
}
