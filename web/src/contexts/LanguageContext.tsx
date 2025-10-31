import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 支持的语言类型
export type Language = 'zh' | 'en';

// 语言配置
export const languages: Record<Language, { code: Language; name: string; nativeName: string }> = {
  zh: {
    code: 'zh',
    name: '中文',
    nativeName: '中文',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
};

// 语言上下文接口
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: { fallback?: string; returnObjects?: boolean; [key: string]: any } | string) => any;
  isZh: boolean;
  isEn: boolean;
}

// 创建语言上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('zh'); // 默认中文，将在客户端初始化
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后初始化语言
  useEffect(() => {
    setMounted(true);
    
    // 从 localStorage 读取保存的语言
    const saved = localStorage.getItem('app_language') as Language | null;
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLanguageState(saved);
      return;
    }

    // 从浏览器语言检测
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLanguageState('zh');
      } else if (browserLang.startsWith('en')) {
        setLanguageState('en');
      }
    }
  }, []);

  // 加载翻译文件
  const loadTranslations = useCallback(async (lang: Language) => {
    try {
      const commonTranslations = await import(`../../../locales/${lang}/common.json`);
      setTranslations(commonTranslations.default || {});
    } catch (error) {
      console.warn(`Failed to load translations for ${lang}:`, error);
      setTranslations({});
    }
  }, []);

  // 初始化加载翻译（仅在客户端挂载后）
  useEffect(() => {
    if (mounted) {
      loadTranslations(language);
    }
  }, [language, loadTranslations, mounted]);

  // 设置语言
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
      // 更新 HTML lang 属性
      document.documentElement.lang = lang;
    }
  }, []);

  // 翻译函数
  const t = useCallback(
    (key: string, options?: { fallback?: string; returnObjects?: boolean; [key: string]: any }): any => {
      const opts = typeof options === 'string' ? { fallback: options } : (options || {});
      const keys = key.split('.');
      let value: any = translations;

      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          return opts.fallback || key;
        }
      }

      // 如果请求返回对象（用于数组等）
      if (opts.returnObjects) {
        // 如果值存在且是对象/数组，返回它；否则返回空数组（避免.map()错误）
        if (value !== undefined && typeof value === 'object') {
          return value;
        }
        // 如果没有找到翻译，返回空数组而不是字符串，避免.map()错误
        return [];
      }

      // 处理字符串插值
      if (typeof value === 'string') {
        let result = value;
        // 替换占位符 {key}
        Object.keys(opts).forEach(key => {
          if (key !== 'fallback' && key !== 'returnObjects') {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(opts[key]));
          }
        });
        return result;
      }

      return opts.fallback || key;
    },
    [translations],
  );

  // 初始化设置 HTML lang 属性
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isZh: language === 'zh',
    isEn: language === 'en',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// 使用语言上下文的 Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

