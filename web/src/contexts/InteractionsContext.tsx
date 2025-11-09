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
    // 使用函数式更新来避免依赖 interactions 和 loadingPrompts
    let shouldLoad = false;
    let newPromptIds: string[] = [];
    
    setLoadingPrompts(prev => {
      // 过滤掉空值、无效值和已经加载的提示词
      newPromptIds = promptIds.filter(id => 
        id && 
        typeof id === 'string' && 
        id.trim() !== '' && 
        !prev.has(id),
      );
      
      if (newPromptIds.length === 0) {
        shouldLoad = false;
        return prev;
      }

      shouldLoad = true;
      // 标记正在加载的提示词
      const newSet = new Set(prev);
      newPromptIds.forEach(id => newSet.add(id));
      return newSet;
    });
    
    if (!shouldLoad) {return;}

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

      // 更新状态 - 使用函数式更新避免依赖 interactions
      setInteractions(prev => {
        // 检查是否已经加载过
        const alreadyLoaded = newPromptIds.some(id => prev[id]);
        if (alreadyLoaded) {return prev;}
        
        return {
          ...prev,
          ...defaultInteractions,
        };
      });
    } finally {
      setLoading(false);
      // 清除加载标记
      setLoadingPrompts(current => {
        const updatedSet = new Set(current);
        newPromptIds.forEach(id => updatedSet.delete(id));
        return updatedSet;
      });
    }
  }, []);

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