import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PromptInteractions } from '@/lib/api';

interface InteractionsContextType {
  interactions: Record<string, PromptInteractions>;
  loadInteractions: (promptIds: string[]) => Promise<void>;
  updateInteraction: (promptId: string, data: Partial<PromptInteractions>) => void;
  loading: boolean;
}

const InteractionsContext = createContext<InteractionsContextType | undefined>(undefined);

export const useInteractions = () => {
  const context = useContext(InteractionsContext);
  if (!context) {
    throw new Error('useInteractions must be used within an InteractionsProvider');
  }
  return context;
};

export const InteractionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interactions, setInteractions] = useState<Record<string, PromptInteractions>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState<Set<string>>(new Set());

  // 批量加载互动数据 - 使用本地默认数据，不再依赖 MCP 服务
  const loadInteractions = useCallback(async (promptIds: string[]) => {
    // 过滤掉空值、无效值和已经加载的提示词
    const newPromptIds = promptIds.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim() !== '' && 
      !interactions[id] && 
      !loadingPrompts.has(id)
    );
    
    if (newPromptIds.length === 0) {return;}

    // 标记正在加载的提示词
    setLoadingPrompts(prev => {
      const newSet = new Set(prev);
      newPromptIds.forEach(id => newSet.add(id));
      return newSet;
    });

    setLoading(true);

    try {
      // 模拟短暂的加载时间以保持用户体验
      await new Promise(resolve => setTimeout(resolve, 100));

      // 为每个提示词创建默认的互动数据
      const defaultInteractions: Record<string, PromptInteractions> = {};
      newPromptIds.forEach(promptId => {
        defaultInteractions[promptId] = {
          likes: 0,
          bookmarks: 0,
          userLiked: false,
          userBookmarked: false,
          shares: 0,
          comments: 0,
        };
      });

      // 更新状态
      setInteractions(prev => ({
        ...prev,
        ...defaultInteractions,
      }));
    } finally {
      setLoading(false);
      // 清除加载标记
      setLoadingPrompts(prev => {
        const newSet = new Set(prev);
        newPromptIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [interactions, loadingPrompts]);

  // 更新单个提示词的互动数据
  const updateInteraction = useCallback((promptId: string, data: Partial<PromptInteractions>) => {
    setInteractions(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        ...data,
      },
    }));
  }, []);

  return (
    <InteractionsContext.Provider
      value={{
        interactions,
        loadInteractions,
        updateInteraction,
        loading,
      }}
    >
      {children}
    </InteractionsContext.Provider>
  );
};