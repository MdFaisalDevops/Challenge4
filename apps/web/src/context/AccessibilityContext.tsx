'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextProps {
  highContrast: boolean;
  toggleHighContrast: () => void;
  largeFonts: boolean;
  toggleLargeFonts: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  ttsEnabled: boolean;
  toggleTtsEnabled: () => void;
  voiceCommandsActive: boolean;
  toggleVoiceCommands: () => void;
  speakText: (text: string) => void;
  startDictation: (onResult: (text: string) => void, onError?: (err: any) => void) => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeFonts, setLargeFonts] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voiceCommandsActive, setVoiceCommandsActive] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Load accessibility configurations and check reduced-motion prefers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedContrast = localStorage.getItem('access-high-contrast') === 'true';
      const savedFonts = localStorage.getItem('access-large-fonts') === 'true';
      const savedMotion = localStorage.getItem('access-reduced-motion') === 'true';
      const savedTts = localStorage.getItem('access-tts') === 'true';
      const savedVoice = localStorage.getItem('access-voice') === 'true';

      setHighContrast(savedContrast);
      setLargeFonts(savedFonts);
      setTtsEnabled(savedTts);
      setVoiceCommandsActive(savedVoice);

      // System preferences override for reduced motion if not saved
      if (localStorage.getItem('access-reduced-motion') === null) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setReducedMotion(prefersReduced);
      } else {
        setReducedMotion(savedMotion);
      }
    }
  }, []);

  // Sync classes to HTML element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (highContrast) {
        root.classList.add('theme-high-contrast');
      } else {
        root.classList.remove('theme-high-contrast');
      }

      if (largeFonts) {
        root.classList.add('font-large-accessible');
      } else {
        root.classList.remove('font-large-accessible');
      }
    }
  }, [highContrast, largeFonts]);

  // Handle Speech Recognition for voice navigation commands
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (voiceCommandsActive) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        const result = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('[accessibility-voice]: Heard command phrase:', result);

        // Map speech command phrases to custom events
        if (result.includes('show dashboard') || result.includes('go to dashboard') || result.includes('open dashboard')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'dashboard' }));
          speakText('Opening Dashboard overview');
        } else if (result.includes('show crowd') || result.includes('go to crowd') || result.includes('open crowd')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'crowd' }));
          speakText('Opening Crowd Density analysis');
        } else if (result.includes('show map') || result.includes('go to map') || result.includes('open map') || result.includes('show navigation')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'navigation' }));
          speakText('Opening spatial routing maps');
        } else if (result.includes('show incidents') || result.includes('go to incidents') || result.includes('open incidents')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'incidents' }));
          speakText('Opening safety incident registry');
        } else if (result.includes('show transportation') || result.includes('go to transportation') || result.includes('open transportation')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'transportation' }));
          speakText('Opening transportation routes');
        } else if (result.includes('show volunteers') || result.includes('go to volunteers') || result.includes('open volunteers')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'volunteers' }));
          speakText('Opening volunteer marshal roster');
        } else if (result.includes('show settings') || result.includes('go to settings') || result.includes('open settings')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'settings' }));
          speakText('Opening operations threshold configurations');
        } else if (result.includes('show profile') || result.includes('go to profile') || result.includes('open profile')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'profile' }));
          speakText('Opening security user profile');
        } else if (result.includes('sign out') || result.includes('log out')) {
          window.dispatchEvent(new CustomEvent('voice-navigate', { detail: 'logout' }));
        }
      };

      recognizer.onend = () => {
        // Automatically restart if commands are active
        if (voiceCommandsActive) {
          try {
            recognizer.start();
          } catch (e) {
            // Ignore if already active
          }
        }
      };

      try {
        recognizer.start();
        setRecognition(recognizer);
      } catch (err) {
        console.error('[accessibility-voice]: Failed to start recognition:', err);
      }

      return () => {
        recognizer.onend = null;
        recognizer.stop();
      };
    } else {
      if (recognition) {
        recognition.stop();
        setRecognition(null);
      }
    }
  }, [voiceCommandsActive]);

  // Speech Synthesis Helper
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel current speeches
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // Dictation Speech-to-Text helper for input forms
  const startDictation = (onResult: (text: string) => void, onError?: (err: any) => void) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech-to-text dictation is not supported in this browser.');
      return;
    }

    const dictationRecognizer = new SpeechRecognition();
    dictationRecognizer.continuous = false;
    dictationRecognizer.interimResults = false;
    dictationRecognizer.lang = 'en-US';

    dictationRecognizer.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    if (onError) {
      dictationRecognizer.onerror = onError;
    }

    try {
      dictationRecognizer.start();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      localStorage.setItem('access-high-contrast', String(next));
      return next;
    });
  };

  const toggleLargeFonts = () => {
    setLargeFonts((prev) => {
      const next = !prev;
      localStorage.setItem('access-large-fonts', String(next));
      return next;
    });
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => {
      const next = !prev;
      localStorage.setItem('access-reduced-motion', String(next));
      return next;
    });
  };

  const toggleTtsEnabled = () => {
    setTtsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('access-tts', String(next));
      if (next) speakText('Text to speech mode enabled.');
      return next;
    });
  };

  const toggleVoiceCommands = () => {
    setVoiceCommandsActive((prev) => {
      const next = !prev;
      localStorage.setItem('access-voice', String(next));
      if (next) speakText('Voice commands mode activated. You can speak navigation actions.');
      return next;
    });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        largeFonts,
        toggleLargeFonts,
        reducedMotion,
        toggleReducedMotion,
        ttsEnabled,
        toggleTtsEnabled,
        voiceCommandsActive,
        toggleVoiceCommands,
        speakText,
        startDictation,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used inside AccessibilityProvider');
  }
  return context;
};
