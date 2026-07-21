'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import Image from 'next/image';

type Message = {
  id: string;
  sender: 'zeni' | 'user';
  text: string;
  sourceQuestion?: string | null;
};

type AssistantResponse = {
  answer: string;
  fallback: boolean;
  matchConfidence: number;
  source: {
    id: string;
    question: string;
    categoryName: string | null;
  } | null;
};

type SuggestedFaq = {
  id: string;
  question: string;
};

const localizedData = {
  en: {
    greeting: 'Hello! I am Zeni, your Smart Assistant. I can answer using approved Zion support content.',
    placeholder: 'Ask Zeni something...',
    suggestedLabel: 'Suggested for you',
    fallback: "I'm not fully sure about that yet. Please contact Zion Events Place directly or send an inquiry so the team can assist you properly.",
  },
  tl: {
    greeting: 'Kumusta! Ako si Zeni, ang inyong Smart Assistant. Sasagot ako gamit ang approved Zion support content.',
    placeholder: 'Magtanong kay Zeni...',
    suggestedLabel: 'Mungkahi para sa iyo',
    fallback: 'Hindi pa ako lubos na sigurado tungkol diyan. Mangyaring makipag-ugnayan sa Zion Events Place para matulungan kayo nang maayos.',
  },
};

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : fallback);
  return payload as T;
}

export default function SmartGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'tl'>('en');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedFaq[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'zeni', text: localizedData.en.greeting },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(1);
  const t = localizedData[lang];

  const createMessageId = () => {
    messageIdRef.current += 1;
    return String(messageIdRef.current);
  };

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const settingsPayload = await readJson<{
          settings?: {
            client?: {
              maintenanceMode?: boolean;
              assistantEnabled?: boolean;
              faqVisible?: boolean;
            };
          };
        }>(
          await fetch('/api/client/settings', { cache: 'no-store' }),
          'Unable to load assistant settings.',
        );
        const clientSettings = settingsPayload.settings?.client;
        const assistantEnabled = !clientSettings?.maintenanceMode &&
          clientSettings?.assistantEnabled !== false &&
          clientSettings?.faqVisible !== false;

        setIsEnabled(assistantEnabled);

        if (!assistantEnabled) {
          return;
        }

        const payload = await readJson<{ faqs: SuggestedFaq[] }>(
          await fetch('/api/client/faqs/popular?limit=4', { cache: 'no-store' }),
          'Unable to load suggested questions.',
        );
        setSuggestions(payload.faqs);
      } catch {
        setSuggestions([]);
      }
    }
    void loadSuggestions();
  }, []);

  const changeLanguage = (nextLang: 'en' | 'tl') => {
    setLang(nextLang);
    setMessages((current) => current.map((message) => (
      message.id === '1' ? { ...message, text: localizedData[nextLang].greeting } : message
    )));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (isOpen && chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  const askAssistant = async (question: string) => {
    const payload = await readJson<AssistantResponse>(
      await fetch('/api/client/assistant/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          sourcePage: typeof window !== 'undefined' ? window.location.pathname : 'smart_assistant',
        }),
      }),
      t.fallback,
    );
    return payload;
  };

  const handleSend = async (text: string) => {
    const question = text.trim();
    if (!question || isTyping) return;

    setMessages((current) => [...current, { id: createMessageId(), sender: 'user', text: question }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askAssistant(question);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          sender: 'zeni',
          text: response.answer,
          sourceQuestion: response.source?.question ?? null,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: createMessageId(), sender: 'zeni', text: t.fallback },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return isEnabled ? (
    <>
      <div
        ref={chatWindowRef}
        aria-label="Zeni Smart Assistant"
        aria-hidden={!isOpen}
        className={`public-smart-guide fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[200] flex h-[min(70dvh,32rem)] max-h-[calc(100dvh-2rem)] w-auto flex-col overflow-hidden rounded-[20px] border border-[#D4AF37]/30 bg-white/95 shadow-[0_20px_60px_rgba(212,175,55,0.15)] backdrop-blur-3xl transition-[transform,opacity] duration-300 ease-out sm:inset-x-auto sm:bottom-[max(2rem,env(safe-area-inset-bottom))] sm:right-[max(2rem,env(safe-area-inset-right))] sm:h-[550px] sm:w-[380px] sm:rounded-[32px] ${
          isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-8 scale-95 opacity-0'
        }`}
        data-motion="decorative"
        inert={!isOpen}
        role="dialog"
      >
        <div className="relative flex items-center justify-between overflow-hidden border-b border-white/20 bg-gradient-to-r from-[#D4AF37] to-[#C5B358] p-3 shadow-md sm:p-4">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white opacity-20 blur-[50px]" />
          <div className="relative z-10 flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white shadow-md sm:h-11 sm:w-11">
              <Image src="/zion-logo.png" alt="Zion Logo" width={24} height={24} className="h-5 w-5 object-contain brightness-0 opacity-85 sm:h-6 sm:w-6" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#00E676] motion-safe:animate-pulse sm:h-3 sm:w-3" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-base font-bold leading-none tracking-wider text-white sm:text-lg">Zeni</h3>
              <p className="mt-1 truncate font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 sm:text-[11px] sm:tracking-[0.15em]">Smart Assistant</p>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex rounded-full bg-white/10 p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase transition-colors ${lang === 'en' ? 'bg-white text-[#D4AF37]' : 'text-white/70 hover:text-white'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('tl')}
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase transition-colors ${lang === 'tl' ? 'bg-white text-[#D4AF37]' : 'text-white/70 hover:text-white'}`}
              >
                TL
              </button>
            </div>
            <button aria-label="Close Smart Assistant" type="button" onClick={() => setIsOpen(false)} className="touch-target flex items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#FAFAFA] to-white p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:p-5">
          {messages.map((message, index) => (
            <div key={message.id} className={`flex flex-col gap-2 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-start">
                {message.sender === 'zeni' && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white shadow-sm">
                    <Image src="/zion-logo.png" alt="Zeni" width={16} height={16} className="h-4 w-4 object-contain brightness-0 opacity-85" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-[18px] p-3 text-left text-sm font-medium leading-relaxed shadow-sm sm:rounded-[20px] sm:p-4 sm:text-[15px] ${
                  message.sender === 'user'
                    ? 'rounded-tr-sm border border-[#D4AF37]/30 bg-gradient-to-l from-[#FAFAFA] to-white text-[#1A1A1A]'
                    : 'rounded-tl-sm border border-[#D4AF37]/30 bg-white text-[#1A1A1A]'
                }`}>
                  {message.text}
                  {message.sourceQuestion && (
                    <p className="mt-3 border-t border-[#D4AF37]/20 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8E7722]">
                      Source: {message.sourceQuestion}
                    </p>
                  )}
                </div>
                {message.sender === 'user' && (
                  <div className="ml-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white text-[#D4AF37] shadow-sm">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {index === 0 && suggestions.length > 0 && messages.length === 1 && !isTyping && (
                <div className="ml-8 mt-1 flex max-w-[calc(100%-2rem)] flex-col gap-2 sm:ml-9">
                  <p className="text-left font-sans text-[12px] font-semibold text-neutral-500">{t.suggestedLabel}</p>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => void handleSend(suggestion.question)}
                      className="rounded-[18px] border border-[#D4AF37]/30 bg-white px-3 py-2 text-left font-sans text-[12px] font-medium leading-snug text-[#1A1A1A] shadow-sm transition-all hover:border-[#D4AF37] hover:bg-[#FAFAFA] sm:rounded-[20px] sm:px-4"
                    >
                      {suggestion.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center justify-start">
              <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white shadow-sm">
                <Image src="/zion-logo.png" alt="Zeni" width={16} height={16} className="h-4 w-4 object-contain brightness-0 opacity-85" />
              </div>
              <div className="flex h-[38px] items-center gap-1.5 rounded-[20px] rounded-tl-sm border border-[#D4AF37]/30 bg-white px-4 py-3 shadow-sm">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[#D4AF37]/30 bg-white p-2 sm:p-3">
          <div className="flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#FAFAFA] p-1.5 shadow-inner transition-all focus-within:border-[#D4AF37]/50 focus-within:bg-white">
            <Bot className="ml-2 hidden h-5 w-5 text-neutral-400 min-[340px]:block sm:ml-3" />
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSend(input);
              }}
              placeholder={t.placeholder}
              className="min-w-0 flex-1 border-none bg-transparent px-2 py-2 font-sans text-sm font-medium text-[#1A1A1A] placeholder:text-[#1A1A1A]/50 focus:outline-none sm:text-[15px]"
            />
            <button
              type="button"
              onClick={() => void handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5B358] text-white transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`public-smart-guide fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-[190] transition-[transform,opacity] duration-300 ease-out md:bottom-8 md:right-8 ${
          isOpen ? 'pointer-events-none translate-y-4 scale-75 opacity-0' : 'pointer-events-auto translate-y-0 scale-100 opacity-100'
        }`}
        data-motion="decorative"
      >
        <button
          aria-label="Open Zeni Smart Assistant"
          id="zeni-fab"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(true);
          }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(212,175,55,0.2)] sm:h-14 sm:w-14"
        >
          <Image src="/zion-logo.png" alt="" width={32} height={32} className="h-7 w-7 object-contain brightness-0 opacity-85 sm:h-8 sm:w-8" />
          <span className="absolute bottom-0 right-0 inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[#00E676] sm:h-4 sm:w-4" />
        </button>
      </div>
    </>
  ) : null;
}
