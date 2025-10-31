import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  ClockIcon, 
  TagIcon,
  XMarkIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';
import { performSemanticSearch, getSearchSuggestions, saveSearchQuery } from '@/lib/api';
import { PromptDetails } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

interface SemanticSearchProps {
  onResults?: (results: PromptDetails[]) => void;
  onSearchStateChange?: (isSearching: boolean) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  showHistory?: boolean;
  className?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'keyword' | 'category' | 'semantic' | 'history';
  confidence?: number;
}

export const SemanticSearch: React.FC<SemanticSearchProps> = ({
  onResults,
  onSearchStateChange,
  placeholder,
  showSuggestions = true,
  showHistory = true,
  className = '',
}) => {
  const { t } = useLanguage();
  const defaultPlaceholder = placeholder || t('search.placeholder');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [semanticMode, setSemanticMode] = useState(true);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // 防抖搜索查询
  const debouncedQuery = useDebounce(query, 500);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestions = await getSearchSuggestions(searchTerm);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
    }
  }, []);

  // 执行语义搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {return;}

    try {
      setIsSearching(true);
      onSearchStateChange?.(true);

      const results = await performSemanticSearch({
        query: searchQuery,
        mode: semanticMode ? 'semantic' : 'keyword',
        limit: 20,
      });

      onResults?.(results);
      
      // 保存搜索查询
      await saveSearchQuery(searchQuery);
      
      // 更新搜索历史
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 10);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
        return newHistory;
      });

      setShowSuggestionDropdown(false);
    } catch (error: unknown) {
      console.error('Search failed:', error);
      toast.error(t('search.search_failed') + ': ' + (error instanceof Error ? error.message : t('errors.unknown_error')));
    } finally {
      setIsSearching(false);
      onSearchStateChange?.(false);
    }
  }, [semanticMode, onResults, onSearchStateChange, t]);

  // 加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // 处理防抖查询
  useEffect(() => {
    if (debouncedQuery && showSuggestions) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, fetchSuggestions, showSuggestions]);

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionDropdown) {return;}

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          setQuery(selectedSuggestion.text);
          performSearch(selectedSuggestion.text);
        } else {
          performSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestionDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // 选择建议
  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    performSearch(suggestion.text);
  };

  // 清除搜索
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestionDropdown(false);
    onResults?.([]);
  };

  // 获取建议图标
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'semantic':
        return <SparklesIcon className="h-4 w-4 text-neon-cyan" />;
      case 'category':
        return <TagIcon className="h-4 w-4 text-neon-purple" />;
      case 'history':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <LightBulbIcon className="h-4 w-4 text-neon-yellow" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索模式切换 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center bg-dark-bg-secondary rounded-lg p-1">
          <button
            onClick={() => setSemanticMode(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              semanticMode
                ? 'bg-neon-cyan text-dark-bg-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SparklesIcon className="h-4 w-4 inline mr-1" />
            {t('search.semantic_mode')}
          </button>
          <button
            onClick={() => setSemanticMode(false)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              !semanticMode
                ? 'bg-neon-cyan text-dark-bg-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
            {t('search.keyword_mode')}
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          {semanticMode ? t('search.semantic_hint') : t('search.keyword_hint')}
        </div>
      </div>

      {/* 搜索输入框 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <input
            ref={searchInputRef}
            id="semantic-search-input"
            name="search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestionDropdown(true);
            }}
            onFocus={() => setShowSuggestionDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={defaultPlaceholder}
            autoComplete="off"
            aria-label={t('search.search_prompts')}
            className={`w-full pl-12 pr-12 py-4 rounded-xl glass border transition-all duration-300 ${
              semanticMode
                ? 'border-neon-cyan/30 focus:border-neon-cyan/60'
                : 'border-neon-purple/30 focus:border-neon-purple/60'
            } bg-dark-bg-secondary/50 text-white placeholder-gray-400 focus:outline-none focus:shadow-lg`}
          />
          
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 搜索建议下拉框 */}
        <AnimatePresence>
          {showSuggestionDropdown && (suggestions.length > 0 || (showHistory && searchHistory.length > 0)) && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-neon-cyan/20 overflow-hidden z-50"
            >
              {/* 搜索建议 */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700/50">
                    {t('search.smart_suggestions')}
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        index === selectedSuggestionIndex
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'text-gray-300 hover:bg-gray-800/50'
                      }`}
                      whileHover={{ x: 2 }}
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span className="flex-1">{suggestion.text}</span>
                      {suggestion.confidence && (
                        <span className="text-xs text-gray-500">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* 搜索历史 */}
              {showHistory && searchHistory.length > 0 && (
                <div className="p-2 border-t border-gray-700/50">
                  <div className="text-xs text-gray-400 px-3 py-2">
                    {t('search.recent_searches')}
                  </div>
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <motion.button
                      key={index}
                      onClick={() => selectSuggestion({ text: historyItem, type: 'history' })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-400 hover:bg-gray-800/50 transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span className="flex-1 truncate">{historyItem}</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* 搜索提示 */}
      {semanticMode && !query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20"
        >
          <div className="flex items-start gap-3">
            <SparklesIcon className="h-5 w-5 text-neon-cyan mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-neon-cyan mb-1">{t('search.semantic_search_hint_title')}</h4>
              <p className="text-xs text-gray-400">
                {t('search.semantic_search_hint_description')}
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-500">
                  • {t('search.example_1')}
                </div>
                <div className="text-xs text-gray-500">
                  • {t('search.example_2')}
                </div>
                <div className="text-xs text-gray-500">
                  • {t('search.example_3')}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 