import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PromptInteractions, getPromptInteractions } from '@/lib/api';

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

  // 批量加载互动数据
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
      // 使用批量控制，避免同时发起太多请求
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < newPromptIds.length; i += batchSize) {
        batches.push(newPromptIds.slice(i, i + batchSize));
      }

      // 顺序处理批次，避免服务器过载
      for (const batch of batches) {
        const promises = batch.map(async (promptId) => {
          try {
            const data = await getPromptInteractions(promptId);
            return { promptId, data };
          } catch (error) {
            console.error(`获取提示词 ${promptId} 互动数据失败:`, error);
            // 返回默认数据
            return {
              promptId,
              data: {
                likes: 0,
                bookmarks: 0,
                userLiked: false,
                userBookmarked: false,
              } as PromptInteractions,
            };
          }
        });

        const results = await Promise.all(promises);
        
        // 更新状态
        setInteractions(prev => {
          const newInteractions = { ...prev };
          results.forEach(({ promptId, data }) => {
            newInteractions[promptId] = data;
          });
          return newInteractions;
        });

        // 小延迟避免请求过于密集
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
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