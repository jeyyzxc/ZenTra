"use client";

import React, { useState, useRef, useEffect } from 'react';

// Comprehensive Knowledge Base
const knowledgeBase = [
  {
    keywords: ['book', 'reserve', 'schedule', 'date'],
    question: "How do I book a date?",
    answer: "You can easily book a date by clicking the 'Book Now' button at the top of the page. It will guide you through our step-by-step reservation process where you can select your preferred date, theme, and package."
  },
  {
    keywords: ['capacity', 'maximum', 'how many people', 'guests', 'pax', 'attendees'],
    question: "What is the maximum guest capacity?",
    answer: "Zion Events Place can comfortably accommodate up to 300 guests for a grand celebration, but we also cater to intimate gatherings of 50-100 guests."
  },
  {
    keywords: ['catering', 'food', 'menu', 'eat'],
    question: "Do you offer catering services?",
    answer: "Yes! Our Premium and Ultimate packages include full catering options with a curated menu, but we also allow external caterers subject to an accredited supplier fee."
  },
  {
    keywords: ['supplier', 'vendor', 'corkage', 'bring own', 'photographer', 'coordinator', 'decorator'],
    question: "Can we bring our own suppliers?",
    answer: "Absolutely! You are welcome to bring your preferred photographers, decorators, and coordinators. We only apply a minimal corkage fee for non-accredited food and beverage suppliers. This is part of our Open Vendor policy."
  },
  {
    keywords: ['parking', 'park', 'cars', 'vehicles'],
    question: "Is there a parking area available?",
    answer: "Yes, we have a spacious, secured parking area that can accommodate up to 100 vehicles for you and your guests."
  },
  {
    keywords: ['air', 'condition', 'aircon', 'hot', 'cold'],
    question: "Is the venue fully air-conditioned?",
    answer: "Yes! All our indoor spaces are fully air-conditioned to ensure maximum comfort for you and your guests."
  },
  {
    keywords: ['generator', 'power', 'outage', 'electricity', 'blackout'],
    question: "Do you provide a generator in case of power outages?",
    answer: "Yes, we have a 100% standby backup generator to ensure your event proceeds flawlessly even during power interruptions."
  },
  {
    keywords: ['room', 'celebrant', 'bride', 'dressing', 'makeup'],
    question: "Is there a dedicated room for the celebrant or bride?",
    answer: "Yes, we provide an elegant, fully-furnished suite for the celebrant or bride to prepare, rest, and take pre-event photos."
  },
  {
    keywords: ['christian', 'christening', 'ceremony', 'mass', 'wedding ceremony'],
    question: "Can we hold a Christian ceremony or a Christening on-site?",
    answer: "Yes, our versatile spaces can be arranged to accommodate on-site ceremonies, including Christian weddings and Christenings."
  },
  {
    keywords: ['location', 'where', 'located', 'address', 'place'],
    question: "Where are you located?",
    answer: "Zion Events Place is strategically located to offer a serene and exclusive environment for your events. Please refer to the map on our Contact Us page for exact directions!"
  },
  {
    keywords: ['one event', 'exclusive', 'per day', 'multiple events'],
    question: "Do you hold only one event per day?",
    answer: "Yes, we prioritize exclusivity. We typically hold only one major event per day to ensure our full attention, resources, and staff are dedicated entirely to your special celebration."
  },
  {
    keywords: ['customize', 'customizable', 'wedding package', 'change package', 'flexible'],
    question: "Are your wedding packages customizable?",
    answer: "Absolutely! We understand that every couple is unique. All of our wedding packages can be fully customized to perfectly match your vision, preferences, and guest count."
  },
  {
    keywords: ['ocular', 'visit', 'appointment', 'tour', 'walk-in', 'walk in'],
    question: "Can we do an ocular visit without a prior appointment?",
    answer: "To ensure we can give you a dedicated tour of our venues and provide our undivided attention to all your questions, we highly recommend scheduling an appointment prior to your ocular visit."
  }
];

// Suggested Quick Questions
const suggestedQuestions = [
  "Where are you located?",
  "Do you hold only one event per day?",
  "Are your wedding packages customizable?",
  "Can we do an ocular visit without a prior appointment?"
];

// Organized Emojis
const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ["😊", "😂", "🥰", "😍", "😎", "😇", "😉", "🤩"] },
  { name: 'Celebration', emojis: ["🎉", "✨", "🎊", "🥳", "🍾", "🥂", "🎂", "🎈"] },
  { name: 'Gestures', emojis: ["🙌", "👍", "👏", "🤝", "🙏", "✌️", "🫶", "💪"] },
  { name: 'Love & Events', emojis: ["❤️", "💍", "💐", "💒", "💖", "🎀", "🕊️", "📸"] }
];

type Message = {
  id: string;
  sender: 'zeni' | 'user';
  text: string;
};

export default function SmartGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'zeni', text: "Hello! I am Zeni, your AI-Powered Smart Assistant. How can I help make your dream event come true? ✨" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen, showSuggestions]);

  // Logic to show suggestions only if the user has no follow-up questions
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // If Zeni just answered and user is not typing anything yet
    if (messages.length > 1 && messages[messages.length - 1].sender === 'zeni' && !isTyping && input.trim() === '') {
      timer = setTimeout(() => {
        setShowSuggestions(true);
      }, 3500); // Wait 3.5 seconds before showing suggestions
    } else {
      setShowSuggestions(false);
    }
    
    return () => clearTimeout(timer);
  }, [messages, isTyping, input]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside the chat window
      if (isOpen && chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setShowEmojis(false);
    setIsTyping(true);

    // Simulate AI thinking and searching
    setTimeout(() => {
      const response = generateAIResponse(text);
      const zeniMsg: Message = { id: (Date.now() + 1).toString(), sender: 'zeni', text: response };
      setMessages(prev => [...prev, zeniMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 800); // Faster, snappier response
  };

  const generateAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Check for greetings
    if (lowerQuery.match(/^(hi|hello|hey|greetings)/)) {
      return "Hi there! Feel free to ask me anything about Zion Events Place—from our packages and guest capacity to booking procedures! 😊";
    }

    // Keyword matching logic
    let bestMatch = null;
    let maxMatches = 0;

    for (const item of knowledgeBase) {
      let matches = 0;
      for (const keyword of item.keywords) {
        if (lowerQuery.includes(keyword)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = item;
      }
    }

    // Direct question matching
    const directMatch = knowledgeBase.find(item => item.question.toLowerCase() === lowerQuery);
    if (directMatch) {
      return directMatch.answer;
    }

    if (bestMatch && maxMatches > 0) {
      return bestMatch.answer;
    }

    return "I couldn't find an exact answer to that. However, you can always reach out to our team at inquire@zionevents.com or use the 'Contact Us' page for more specific inquiries! 💌";
  };

  const onEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  return (
    <>
      {/* Zeni Chat Popup Window */}
      <div 
        ref={chatWindowRef}
        className={`fixed bottom-6 right-6 w-[340px] sm:w-[380px] h-[550px] max-h-[85vh] bg-white/95 backdrop-blur-3xl border border-[#ECDD77]/30 shadow-[0_20px_60px_rgba(236,221,119,0.15)] rounded-[32px] overflow-hidden z-[200] transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col ${
          isOpen ? 'translate-y-0 opacity-100 pointer-events-auto scale-100' : 'translate-y-16 opacity-0 pointer-events-none scale-90'
        }`}
      >

        {/* Header - Elegant Dark Green & Gold */}
        <div className="bg-gradient-to-r from-[#2c3328] to-[#1a1f18] border-b border-[#D4A017]/30 p-4 flex justify-between items-center shadow-md relative overflow-hidden">
          {/* Decorative subtle gold glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A017] rounded-full blur-[50px] opacity-20 pointer-events-none"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-[1.5px] border-white/20 bg-gradient-to-br from-[#ECDD77] to-[#D4A017] flex items-center justify-center shadow-[0_0_15px_rgba(212,160,23,0.5)]">
              <img src="/zion-logo.png" alt="Zion Logo" className="w-6 h-6 object-contain brightness-0 opacity-90" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-[#2c3328] rounded-full animate-pulse"></span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-serif font-bold text-lg tracking-wider leading-none mb-0.5 text-white">Zeni</h3>
              <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-[#ECDD77] font-bold">Smart Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:rotate-90 relative z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-gradient-to-b from-[#FAFAFA] to-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={() => setShowEmojis(false)}>
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-[fadeInUp_0.4s_ease-out]`}
              style={{ animationFillMode: 'both' }}
            >
              <div className="flex items-start">
                {msg.sender === 'zeni' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ECDD77] to-[#D4A017] flex-shrink-0 flex items-center justify-center mr-2 shadow-sm mt-1">
                    <img src="/zion-logo.png" alt="Zeni" className="w-3.5 h-3.5 object-contain filter invert brightness-0" />
                  </div>
                )}
                <div className={`max-w-[85%] p-4 text-[15px] leading-relaxed shadow-sm relative text-left ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-l from-[#ECDD77]/40 to-white text-[#2c3328] rounded-[20px] rounded-tr-sm font-medium tracking-wide shadow-[0_4px_15px_rgba(236,221,119,0.3)] border border-[#D4A017]/30' 
                    : 'bg-white border border-[#D4A017]/30 text-[#2c3328] rounded-[20px] rounded-tl-sm font-sans font-medium'
                }`}>
                  {msg.text}
                </div>
              </div>

              {/* Suggested Chips (Only show if last message is from Zeni and not typing) */}
              {messages.length === 1 && !isTyping && (
                <div className="flex flex-col gap-3 mt-1 animate-[fadeInUp_0.5s_ease-out_0.2s]" style={{ animationFillMode: 'both' }}>
                <p className="text-[14px] text-neutral-500 font-sans text-center mb-1 leading-relaxed">Here are some frequently asked<br/>questions to help get you started.</p>
                <div className="flex flex-wrap gap-2 justify-center px-1">
                  {suggestedQuestions.map((q, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-[12px] bg-white hover:bg-gradient-to-r hover:from-[#ECDD77]/20 hover:to-transparent text-[#2c3328] border border-[#D4A017]/30 hover:border-[#D4A017] px-4 py-2 rounded-full text-left transition-all duration-300 font-sans font-medium shadow-sm hover:shadow-[0_4px_12px_rgba(212,160,23,0.15)] hover:-translate-y-0.5 group"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Persistent Suggested Chips after chatting (Delayed) */}
              {showSuggestions && index === messages.length - 1 && (
                <div className="flex flex-col gap-2.5 ml-8 mt-2 animate-[fadeInUp_0.4s_ease-out]" style={{ animationFillMode: 'both' }}>
                  <p className="text-[10px] text-[#2c3328]/70 font-sans uppercase tracking-[0.2em] font-bold ml-1 flex items-center gap-1.5">
                    <span className="w-2 h-px bg-[#D4A017]"></span> Suggested for you
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSend(q)}
                        className="text-[12px] bg-white hover:bg-gradient-to-r hover:from-[#ECDD77]/20 hover:to-transparent text-[#2c3328] border border-[#D4A017]/30 hover:border-[#D4A017] px-4 py-2 rounded-full text-left transition-all duration-300 font-sans font-medium shadow-sm hover:shadow-[0_4px_12px_rgba(212,160,23,0.15)] hover:-translate-y-0.5 group"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start items-center animate-[fadeIn_0.3s_ease-out]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ECDD77] to-[#D4A017] flex-shrink-0 flex items-center justify-center mr-2 shadow-sm">
                <img src="/zion-logo.png" alt="Zeni" className="w-3.5 h-3.5 object-contain filter invert brightness-0" />
              </div>
              <div className="bg-white border border-[#ECDD77]/40 rounded-[20px] rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center h-[38px]">
                <div className="w-1.5 h-1.5 bg-[#D4A017] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#D4A017] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#D4A017] rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-[#ECDD77]/30 relative z-20">
          {/* Enhanced Emoji Picker Popup */}
          {showEmojis && (
            <div className="absolute bottom-full right-4 mb-2 bg-white/95 backdrop-blur-xl border border-[#ECDD77]/40 shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-[24px] p-4 w-[280px] max-h-[250px] overflow-y-auto animate-[scaleIn_0.2s_ease-out] origin-bottom-right scrollbar-thin scrollbar-thumb-[#ECDD77]/50">
              {EMOJI_CATEGORIES.map((category, idx) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <p className="text-[11px] uppercase tracking-widest text-[#2c3328]/80 font-bold mb-1.5 pl-1">{category.name}</p>
                  <div className="grid grid-cols-4 gap-1">
                    {category.emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => onEmojiClick(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-[#ECDD77]/20 rounded-xl transition-all hover:scale-110 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#FAFAFA] rounded-full p-1.5 border border-[#ECDD77]/20 focus-within:border-[#D4A017]/50 focus-within:bg-white transition-all shadow-inner focus-within:shadow-[0_0_15px_rgba(236,221,119,0.3)]">
            {/* Emoticon Toggle Button */}
            <button
              onClick={() => setShowEmojis(!showEmojis)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showEmojis ? 'text-[#2c3328] bg-[#ECDD77]/40 rotate-12' : 'text-neutral-400 hover:text-[#2c3328] hover:bg-black/5'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm3.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowEmojis(false)}
              onClick={() => setShowEmojis(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask Zeni something..."
              className="flex-1 bg-transparent border-none px-2 py-2 text-[15px] focus:outline-none text-[#2c3328] placeholder-[#2c3328]/50 font-sans font-medium"
            />

            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ECDD77] to-[#D4A017] flex items-center justify-center text-[#2c3328] hover:shadow-[0_0_15px_rgba(212,160,23,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Hide when chat is open */}
      <button 
        id="zeni-fab"
        onClick={(e) => {
          e.stopPropagation(); // Prevent immediate close trigger
          setIsOpen(true);
        }}
        className={`fixed bottom-6 right-6 z-[190] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-110 bg-gradient-to-br from-[#2c3328] to-[#1a1f18] hover:shadow-[0_15px_35px_rgba(44,51,40,0.5)] border border-[#D4A017]/30 ${
          isOpen ? 'opacity-0 scale-50 pointer-events-none translate-y-10' : 'opacity-100 scale-100 pointer-events-auto hover:-translate-y-1'
        }`}
      >
        <div className="relative">
          <img src="/zion-logo.png" alt="Zion" className="w-7 h-7 object-contain brightness-0 invert opacity-90" />
        </div>
        
        {/* Unread indicator dot */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A017] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#D4A017] border-2 border-[#2c3328]"></span>
        </span>
      </button>
    </>
  );
}
