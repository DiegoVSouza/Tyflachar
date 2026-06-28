import React, { useState, useRef } from 'react';
import styles from './MessageInput.module.css';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: Props): React.ReactElement {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    onSend(content);
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Enviar mensagem">
      <textarea
        id="input-message"
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem… (Enter para enviar)"
        disabled={disabled}
        rows={1}
        aria-label="Texto da mensagem"
      />
      <button
        id="btn-send"
        type="submit"
        className={styles.btnSend}
        disabled={disabled || !text.trim()}
        aria-label="Enviar mensagem"
      >
        ➤
      </button>
    </form>
  );
}
