import React, { useState, useRef, KeyboardEvent } from 'react';
import styles from './InputTags.module.css';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function InputTags({ tags, onChange, placeholder = 'Add tag…', disabled = false }: Props): React.ReactElement {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const tag = value.trim().toLowerCase();
    if (!tag || tags.includes(tag)) {
      setInput('');
      return;
    }
    onChange([...tags, tag]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      const last = tags[tags.length - 1];
      if (last) removeTag(last);
    }
  }

  return (
    <div
      className={`${styles.container} ${disabled ? styles.disabled : ''}`}
      onClick={() => inputRef.current?.focus()}
      role="group"
      aria-label="Client tags"
    >
      {tags.map((tag) => (
        <span key={tag} className={styles.chip}>
          {tag}
          {!disabled && (
            <button
              type="button"
              className={styles.chipRemove}
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={`Remove tag ${tag}`}
            >
              ✕
            </button>
          )}
        </span>
      ))}

      {!disabled && (
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          aria-label="New tag"
        />
      )}
    </div>
  );
}
