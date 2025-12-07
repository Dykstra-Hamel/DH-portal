'use client';

import React from 'react';
import styles from './SearchByLetter.module.scss';

interface SearchByLetterProps {
  letterCounts: Record<string, number>;
  selectedLetter: string | null;
  onLetterSelect: (letter: string | null) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function SearchByLetter({
  letterCounts,
  selectedLetter,
  onLetterSelect,
}: SearchByLetterProps) {
  const handleLetterClick = (letter: string) => {
    // Toggle: if already selected, deselect it
    if (selectedLetter === letter) {
      onLetterSelect(null);
    } else {
      onLetterSelect(letter);
    }
  };

  return (
    <div className={styles.container}>
      {ALPHABET.map((letter) => {
        const count = letterCounts[letter] || 0;
        const isActive = selectedLetter === letter;

        return (
          <button
            key={letter}
            className={`${styles.letterBox} ${isActive ? styles.active : ''}`}
            onClick={() => handleLetterClick(letter)}
            type="button"
          >
            <div className={styles.letter}>{letter}</div>
            <div className={styles.count}>{count} Cust.</div>
          </button>
        );
      })}
    </div>
  );
}

export default SearchByLetter;
