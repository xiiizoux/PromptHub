import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguage, languages } from '@/contexts/LanguageContext';
import clsx from 'clsx';

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 切换语言
  const handleLanguageChange = (lang: 'zh' | 'en') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const currentLanguage = languages[language];

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center space-x-2 px-3 py-2 rounded-lg glass transition-all duration-300',
          'text-gray-300 hover:text-neon-cyan hover:border-neon-cyan/30',
          'border border-transparent',
          isOpen && 'border-neon-cyan/30 text-neon-cyan',
        )}
        aria-label={language === 'zh' ? '切换语言' : 'Switch language'}
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-40 glass rounded-xl border border-neon-cyan/20 overflow-hidden z-50"
          >
            {(Object.values(languages) as Array<{ code: 'zh' | 'en'; name: string; nativeName: string }>).map(
              (lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200',
                    language === lang.code
                      ? 'text-neon-cyan bg-neon-cyan/10'
                      : 'text-gray-300 hover:text-neon-cyan hover:bg-neon-cyan/5',
                  )}
                >
                  <span className="font-medium">{lang.nativeName}</span>
                  {language === lang.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-neon-cyan"
                    />
                  )}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitch;

