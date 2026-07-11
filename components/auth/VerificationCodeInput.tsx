'use client';

import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react';

type VerificationCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
};

export default function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  length = 8,
}: VerificationCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // We ensure we always have an array of exactly `length` characters
  const codeArray = Array.from({ length }).map((_, i) => value[i] || '');

  const handleChange = (index: number, char: string) => {
    const normalizedChar = char.replace(/[^a-z0-9]/gi, '').toUpperCase();
    if (!normalizedChar) {
      const clearedCodeArray = [...codeArray];
      clearedCodeArray[index] = '';
      onChange(clearedCodeArray.join(''));
      return;
    }

    const newCodeArray = [...codeArray];

    if (normalizedChar.length > 1) {
      normalizedChar
        .slice(0, length - index)
        .split('')
        .forEach((character, offset) => {
          newCodeArray[index + offset] = character;
        });

      onChange(newCodeArray.join(''));
      inputsRef.current[Math.min(index + normalizedChar.length, length - 1)]?.focus();
      return;
    }

    newCodeArray[index] = normalizedChar.slice(-1);
    
    const newCode = newCodeArray.join('');
    onChange(newCode);

    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!codeArray[index] && index > 0) {
        const newCodeArray = [...codeArray];
        newCodeArray[index - 1] = '';
        onChange(newCodeArray.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newCodeArray = [...codeArray];
        newCodeArray[index] = '';
        onChange(newCodeArray.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text/plain')
      .replace(/[^a-z0-9]/gi, '')
      .toUpperCase()
      .slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2" role="group" aria-label="Verification Code Input">
      {codeArray.map((character, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="text"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoCapitalize="characters"
          pattern="[A-Za-z0-9]*"
          maxLength={1}
          value={character}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-10 w-8 sm:h-12 sm:w-10 rounded-xl border-2 border-gray-200 bg-white text-center font-sans text-lg sm:text-xl font-bold text-[#1a1f18] transition-all focus:border-[#D6B53B] focus:outline-none focus:ring-4 focus:ring-[#D6B53B]/20 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Code character ${index + 1}`}
        />
      ))}
    </div>
  );
}
