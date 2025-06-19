import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ProtectedLink, ProtectedButton } from '@/components/ProtectedLink';
import clsx from 'clsx';
import { 
  UserIcon, 
  KeyIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  SparklesIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  BookmarkIcon,
  ClockIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ShareIcon,
  CodeBracketIcon,
  TagIcon,
  BookOpenIcon,
  BriefcaseIcon,
  SwatchIcon,
  PaintBrushIcon,
  AcademicCapIcon,
  HeartIcon,
  PuzzlePieceIcon,
  HomeIcon,
  FolderIcon,
  LanguageIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  HeartIcon as HealthIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

// 定义与适配器返回的API密钥兼容的接口
// 从 supabase-adapter.ts 导入ApiKey类型并进行扩展
import type { ApiKey as AdapterApiKey } from '@/lib/supabase-adapter';

// 扩展适配器的ApiKey类型，添加前端需要的属性
interface ApiKey extends AdapterApiKey {
  key?: string;
  expires_in_days?: number;
}

interface UserPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at?: string; // 设为可选，与Supabase适配器的Prompt类型兼容
  user_id?: string;
  version?: number;
  messages?: any[];
  rating?: number; // 添加评分属性
}

const ProfilePage = () => {
  const { user, getToken } = useAuth();
  // 使用ref来跟踪组件挂载状态
  const isMountedRef = useRef(false);

  // 分类映射 - 与PromptCard组件保持一致
  const CATEGORY_MAP: Record<string, { name: string; color: string; icon: any }> = {
    '通用': { name: '通用', color: 'from-neon-purple to-neon-blue', icon: SparklesIcon },
    '学术': { name: '学术', color: 'from-neon-blue to-neon-cyan', icon: AcademicCapIcon },
    '职业': { name: '职业', color: 'from-neon-green to-neon-yellow', icon: BriefcaseIcon },
    '文案': { name: '文案', color: 'from-neon-pink to-neon-yellow', icon: PencilIcon },
    '设计': { name: '设计', color: 'from-neon-yellow to-neon-orange', icon: SwatchIcon },
    '绘画': { name: '绘画', color: 'from-neon-orange to-neon-red', icon: PaintBrushIcon },
    '教育': { name: '教育', color: 'from-neon-green to-neon-cyan', icon: BookOpenIcon },
    '情感': { name: '情感', color: 'from-neon-pink to-neon-purple', icon: HeartIcon },
    '娱乐': { name: '娱乐', color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
    '游戏': { name: '游戏', color: 'from-neon-purple to-neon-pink', icon: PuzzlePieceIcon },
    '生活': { name: '生活', color: 'from-neon-green to-neon-blue', icon: HomeIcon },
    '商业': { name: '商业', color: 'from-neon-red to-neon-orange', icon: ChartBarIcon },
    '办公': { name: '办公', color: 'from-neon-blue to-neon-purple', icon: FolderIcon },
    '编程': { name: '编程', color: 'from-neon-cyan to-neon-cyan-dark', icon: CodeBracketIcon },
    '翻译': { name: '翻译', color: 'from-neon-blue to-neon-cyan', icon: LanguageIcon },
    '视频': { name: '视频', color: 'from-neon-red to-neon-pink', icon: VideoCameraIcon },
    '播客': { name: '播客', color: 'from-neon-orange to-neon-yellow', icon: MicrophoneIcon },
    '音乐': { name: '音乐', color: 'from-neon-purple to-neon-blue', icon: MusicalNoteIcon },
    '健康': { name: '健康', color: 'from-neon-green to-neon-cyan', icon: HealthIcon },
    '科技': { name: '科技', color: 'from-neon-cyan to-neon-blue', icon: CpuChipIcon },
    'default': { name: '通用', color: 'from-neon-purple to-neon-blue', icon: SparklesIcon }
  };
  
  const [activeTab, setActiveTab] = useState('profile');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [userPrompts, setUserPrompts] = useState<UserPrompt[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState(30);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptCounts, setPromptCounts] = useState<{total: number, public: number, private: number}>({total: 0, public: 0, private: 0});
  
  // 新增分页状态
  const [promptCurrentPage, setPromptCurrentPage] = useState(1);
  const [promptTotalPages, setPromptTotalPages] = useState(1);
  const [promptTotalCount, setPromptTotalCount] = useState(0);
  const promptPageSize = 30; // 每页30个（10行x3列）
  
  // 新增功能的状态
  const [bookmarks, setBookmarks] = useState<UserPrompt[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  // 确保组件已挂载
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 安全的状态更新函数
  const safeSetState = (updater: () => void) => {
    if (isMountedRef.current) {
      updater();
    }
  };

  const tabs = [
    { id: 'profile', name: '个人资料', icon: UserIcon },
    { id: 'my-prompts', name: '我的提示词', icon: DocumentTextIcon },
    { id: 'bookmarks', name: '收藏夹', icon: BookmarkIcon },
    { id: 'usage-history', name: '使用历史', icon: ClockIcon },
    { id: 'ratings-reviews', name: '评分评论', icon: StarIcon },
    { id: 'import-export', name: '导入导出', icon: ArrowUpTrayIcon },
    { id: 'api-keys', name: 'API密钥', icon: KeyIcon },
  ];

  const expiryOptions = [
    { value: 7, label: '7天' },
    { value: 30, label: '30天' },
    { value: 90, label: '90天' },
    { value: 365, label: '1年' },
    { value: -1, label: '永不过期' },
  ];

  // 加载API密钥
  useEffect(() => {
    if (activeTab === 'api-keys' && user) {
      // 等待页面加载完成后再执行请求
      const timer = setTimeout(() => {
        console.log('正在获取API密钥, 用户ID:', user.id);
        fetchApiKeys();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, user]);

  // 当切换到"我的提示词"标签时，重置到第一页
  useEffect(() => {
    if (activeTab === 'my-prompts') {
      if (promptCurrentPage !== 1) {
        setPromptCurrentPage(1);
      }
    }
  }, [activeTab]);

  // 加载用户提示词 - 当标签页为"我的提示词"且页面改变时
  useEffect(() => {
    if (activeTab === 'my-prompts') {
      fetchUserPrompts(promptCurrentPage);
    }
  }, [activeTab, promptCurrentPage]);

  // 加载收藏夹
  useEffect(() => {
    if (activeTab === 'bookmarks' && user) {
      fetchBookmarks();
    }
  }, [activeTab, user]);

  // 加载使用历史
  useEffect(() => {
    if (activeTab === 'usage-history' && user) {
      fetchUsageHistory();
    }
  }, [activeTab, user]);

  // 加载评分评论
  useEffect(() => {
    if (activeTab === 'ratings-reviews' && user) {
      fetchUserRatings();
    }
  }, [activeTab, user]);

  // 加载用户提示词数量（用于统计）
  useEffect(() => {
    if (user) {
      fetchPromptCount();
    }
  }, [user]);

  // 当切换到个人资料标签时刷新统计数据
  useEffect(() => {
    if (activeTab === 'profile' && user) {
      fetchPromptCount();
      // 同时加载API密钥用于统计显示
      fetchApiKeysForStats();
    }
  }, [activeTab, user]);

  // 简化的API密钥获取函数，专门用于统计
  const fetchApiKeysForStats = async () => {
    try {
      if (!user?.id) return;
      
      const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
      const apiKeysList = await supabaseAdapter.listApiKeys(user.id);
      setApiKeys(apiKeysList);
      console.log('API密钥统计数据获取成功:', apiKeysList.length);
    } catch (error) {
      console.error('获取API密钥统计失败:', error);
      // 设置空数组，确保显示0而不是undefined
      setApiKeys([]);
    }
  };

  const fetchApiKeys = async () => {
    // 防止重复请求
    if (loading) {
      console.log('已经在加载中，跳过重复请求');
      return;
    }
    
    console.log('开始获取API密钥...');
    setLoading(true);
    
    // 添加超时保护，确保加载状态不会无限持续
    const timeoutId = setTimeout(() => {
      console.warn('获取API密钥超时 (30秒)');
      setLoading(false);
      setApiKeys([]); // 设置空列表结束加载状态
    }, 30000); // 30秒超时
    
    try {
      console.log('尝试获取API密钥...');
      
      // 首先确保我们有用户ID
      if (!user?.id) {
        console.error('用户ID不可用，无法获取API密钥');
        setApiKeys([]);
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }
      
      // 直接使用专用的API端点
      // 步骤1: 获取验证令牌
      let token = null;
      
      // 从各种可能的存储位置获取用户令牌
      try {
        // 尝试从 supabase.auth.token 获取
        const authToken = localStorage.getItem('supabase.auth.token');
        if (authToken) {
          const parsedToken = JSON.parse(authToken);
          token = parsedToken?.currentSession?.access_token;
          if (token) {
            console.log('从 supabase.auth.token 获取到令牌');
          }
        }
        
        // 如果上面的方法失败，尝试遍历其他可能的令牌存储位置
        if (!token) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('-auth-token')) {
              try {
                const storedToken = localStorage.getItem(key);
                if (storedToken) {
                  const parsed = JSON.parse(storedToken);
                  if (parsed?.access_token) {
                    token = parsed.access_token;
                    console.log(`从 ${key} 获取到令牌`);
                    break;
                  }
                }
              } catch (e) {
                console.error(`无法解析 ${key} 中的令牌:`, e);
              }
            }
          }
        }
        
        // 如果还是没有令牌，尝试刷新会话
        if (!token) {
          console.log('没有找到令牌，尝试刷新会话');
          const { data } = await supabase.auth.refreshSession();
          if (data?.session) {
            token = data.session.access_token;
            console.log('会话刷新成功，获取到新令牌');
          }
        }
      } catch (tokenError) {
        console.error('获取令牌失败:', tokenError);
      }
      
      // 如果我们没有令牌，尝试直接使用管理员权限获取
      if (!token) {
        try {
          console.log('没有可用的令牌，尝试直接获取API密钥');
          const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
          const apiKeys = await supabaseAdapter.listApiKeys(user.id);
          
          console.log('通过管理员权限获取到API密钥:', apiKeys.length);
          setApiKeys(apiKeys);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        } catch (adapterError) {
          console.error('使用管理员权限获取API密钥失败:', adapterError);
        }
      }
      
      // 如果有令牌，使用API端点
      if (token) {
        console.log('使用令牌请求API密钥端点');
        const response = await fetch('/api/profile/api-keys', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.keys) {
            console.log('从 API 端点获取到API密钥:', result.data.keys.length);
            setApiKeys(result.data.keys);
            clearTimeout(timeoutId);
            setLoading(false);
            return;
          } else {
            console.error('API响应不包含有效数据:', result);
          }
        } else {
          const errorText = await response.text();
          console.error(`API请求失败: ${response.status}`, errorText);
        }
      }
      
      // 如果所有方法都失败，尝试最后的办法 - 直接访问数据库
      console.log('尝试直接使用Supabase客户端获取API密钥');
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id);
      
      if (keysError) {
        console.error('直接使用Supabase客户端获取API密钥失败:', keysError);
        setApiKeys([]);
      } else if (keysData) {
        console.log('直接从数据库获取到API密钥:', keysData.length);
        setApiKeys(keysData);
      } else {
        setApiKeys([]);
      }
    } catch (apiError: any) {
      console.error('API请求获取API密钥失败:', apiError);
      
      // 显示用户友好的错误消息
      if (apiError.status === 401 || apiError.message?.includes('401')) {
        alert('您的登录已过期，请刷新页面后重试');
      } else {
        alert(`无法获取API密钥: ${apiError.message || '请检查网络连接和认证状态'}`);
      }
      
      // 设置空的API密钥列表
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理提示词页面变更
  const handlePromptPageChange = (page: number) => {
    if (!isMountedRef.current) return;
    if (page >= 1 && page <= promptTotalPages) {
      setPromptCurrentPage(page);
    }
  };

  // 获取用户提示词
  const fetchUserPrompts = async (page: number = 1) => {
    if (!user?.id || !isMountedRef.current) return;
    
    safeSetState(() => setPromptsLoading(true));
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('获取认证令牌失败');
      }

      const response = await fetch(`/api/profile/prompts?page=${page}&pageSize=${promptPageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      safeSetState(() => {
        if (data.success) {
          setUserPrompts(data.data.prompts || []);
          const pagination = data.data.pagination;
          setPromptTotalPages(pagination?.totalPages || 1);
          setPromptTotalCount(pagination?.total || 0);
          
          // 更新统计
          const totalPrompts = pagination?.total || 0;
          const publicPrompts = data.data.prompts?.filter((p: any) => p.is_public)?.length || 0;
          const privatePrompts = totalPrompts - publicPrompts;
          
          setPromptCounts({
            total: totalPrompts,
            public: publicPrompts,
            private: privatePrompts
          });
        } else {
          throw new Error(data.message || '获取用户提示词失败');
        }
      });
    } catch (error) {
      console.error('获取用户提示词失败:', error);
      if (!isMountedRef.current) return;
      
      safeSetState(() => {
        setUserPrompts([]);
        setPromptTotalPages(1);
        setPromptTotalCount(0);
        setPromptCounts({ total: 0, public: 0, private: 0 });
      });
    } finally {
      safeSetState(() => setPromptsLoading(false));
    }
  };



  // 获取收藏夹
  const fetchBookmarks = async () => {
    setBookmarksLoading(true);
    try {
      if (!user?.id) {
        console.log('用户未登录，跳过获取收藏夹');
        setBookmarks([]);
        return;
      }
      
      const token = await getToken();
      if (!token) {
        console.error('无法获取认证令牌，请重新登录');
        setBookmarks([]);
        return;
      }

      console.log('开始获取收藏夹，用户ID:', user.id);

      const response = await fetch('/api/user/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks(data || []);
        console.log('收藏夹数据获取成功:', data?.length || 0);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('获取收藏夹失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || '未知错误'
        });
        
        // 如果是401错误，提示用户重新登录
        if (response.status === 401) {
          console.warn('认证已过期，请重新登录');
        }
        
        setBookmarks([]);
      }
    } catch (error) {
      console.error('获取收藏夹网络错误:', error);
      setBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  };

  // 获取使用历史
  const fetchUsageHistory = async () => {
    setHistoryLoading(true);
    try {
      if (!user?.id) return;
      
      const token = await getToken();
      if (!token) {
        console.error('无法获取认证令牌');
        setUsageHistory([]);
        return;
      }

      const response = await fetch('/api/user/usage-history?pageSize=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 转换数据格式以匹配导出格式
          const formattedHistory = result.data.map((item: any) => ({
            id: item.id,
            prompt_name: item.prompt_name,
            used_at: item.created_at,
            usage_count: 1, // 每条记录代表一次使用
            model: item.model,
            input_tokens: item.input_tokens,
            output_tokens: item.output_tokens,
            latency_ms: item.latency_ms
          }));
          setUsageHistory(formattedHistory);
          console.log('使用历史数据获取成功:', formattedHistory.length);
        } else {
          console.error('获取使用历史失败:', result.error);
          setUsageHistory([]);
        }
      } else {
        console.error('获取使用历史失败:', response.status);
        setUsageHistory([]);
      }
    } catch (error) {
      console.error('获取使用历史失败:', error);
      setUsageHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 获取用户评分评论
  const fetchUserRatings = async () => {
    setRatingsLoading(true);
    try {
      if (!user?.id) return;
      
      const token = await getToken();
      if (!token) {
        console.error('无法获取认证令牌');
        setUserRatings([]);
        return;
      }

      // 获取用户的所有评分
      // 注意：我们需要查询用户评分的提示词，然后获取评分信息
      const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
      
      try {
        // 使用 Supabase 直接查询用户评分
        const response = await fetch('/api/user/ratings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 转换数据格式以匹配导出格式
            const formattedRatings = data.ratings.map((item: any) => ({
              id: item.id,
              prompt_name: item.prompt_name || '未知提示词',
              rating: item.rating,
              review: item.comment || item.feedback_text || '',
              created_at: item.created_at
            }));
            setUserRatings(formattedRatings);
            console.log('评分评论数据获取成功:', formattedRatings.length);
          } else {
            console.error('获取评分失败:', data.error);
            setUserRatings([]);
          }
        } else {
          // 如果没有专门的用户评分API，回退到空数组
          console.log('暂无用户评分API，设置为空数组');
          setUserRatings([]);
        }
      } catch (apiError) {
        console.error('通过API获取评分失败，尝试直接数据库查询:', apiError);
        
        // 回退方案：直接查询数据库
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 先获取用户的所有评分
        const { data: ratingsData, error } = await supabase
          .from('prompt_feedback')
          .select('id, rating, feedback_text, created_at, usage_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('数据库查询评分失败:', error);
          setUserRatings([]);
          return;
        }

        // 如果有评分数据，获取对应的使用记录来找到prompt信息
        let formattedRatings: any[] = [];
        if (ratingsData && ratingsData.length > 0) {
          const usageIds = ratingsData.map(r => r.usage_id).filter(Boolean);
          
          if (usageIds.length > 0) {
            const { data: usageData } = await supabase
              .from('prompt_usage')
              .select('id, prompt_id')
              .in('id', usageIds);

            const promptIds = Array.from(new Set(usageData?.map(u => u.prompt_id).filter(Boolean) || []));
            
            if (promptIds.length > 0) {
              const { data: promptsData } = await supabase
                .from('prompts')
                .select('id, name')
                .in('id', promptIds);

              const promptMap = promptsData?.reduce((acc: any, p: any) => {
                acc[p.id] = p.name;
                return acc;
              }, {}) || {};

              const usageMap = usageData?.reduce((acc: any, u: any) => {
                acc[u.id] = u.prompt_id;
                return acc;
              }, {}) || {};

              formattedRatings = ratingsData.map((item: any) => ({
                id: item.id,
                prompt_name: item.usage_id && usageMap[item.usage_id] ? 
                  promptMap[usageMap[item.usage_id]] || '未知提示词' : '未知提示词',
                rating: item.rating,
                review: item.feedback_text || '',
                created_at: item.created_at
              }));
            }
          }
        }

        setUserRatings(formattedRatings);
        console.log('评分评论数据获取成功（数据库）:', formattedRatings.length);
      }
    } catch (error) {
      console.error('获取评分评论失败:', error);
      setUserRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  };

  // 导出数据
  const handleExportData = async () => {
    try {
      if (!user?.id) return;
      
      // 获取用户所有数据
      const exportData = {
        prompts: userPrompts,
        bookmarks: bookmarks,
        usage_history: usageHistory,
        ratings: userRatings,
        exported_at: new Date().toISOString(),
        user_id: user.id,
        version: "1.0",
        description: "PromptHub用户数据导出文件"
      };
      
      // 创建下载文件
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompthub-export-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('数据导出成功！');
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请稍后重试');
    }
  };

  // 下载JSON模板
  const handleDownloadTemplate = () => {
    const template = {
      prompts: [
        {
          name: "示例提示词",
          description: "这是一个示例提示词的描述",
          category: "工作",
          tags: ["示例", "模板"],
          messages: [
            {
              role: "system",
              content: "你是一个有用的AI助手。"
            },
            {
              role: "user", 
              content: "请帮我{{任务描述}}，要求{{具体要求}}。"
            }
          ],
          is_public: false,
          version: 1
        }
      ],
      bookmarks: [],
      usage_history: [],
      ratings: [],
      version: "1.0",
      description: "PromptHub导入模板文件 - 请填写您的提示词数据",
      template: true,
      instructions: {
        prompts: "在此数组中添加您要导入的提示词",
        fields: {
          name: "提示词名称（必填）",
          description: "提示词描述（必填）",
          category: "分类（可选，如：工作、学习、创意等）",
          tags: "标签数组（可选）",
          messages: "对话消息数组，包含system和user消息",
          is_public: "是否公开（true/false）",
          version: "版本号（默认为1）"
        },
        notes: [
          "请保持JSON格式正确",
          "必填字段不能为空",
          "messages数组至少包含一个user消息",
          "导入前会验证数据格式"
        ]
      }
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompthub-import-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 验证导入数据格式
  const validateImportData = (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 检查基本结构
    if (!data || typeof data !== 'object') {
      errors.push('文件格式无效：必须是有效的JSON对象');
      return { valid: false, errors };
    }

    // 检查prompts数组
    if (!data.prompts || !Array.isArray(data.prompts)) {
      errors.push('缺少prompts数组或格式错误');
      return { valid: false, errors };
    }

    // 验证每个prompt
    data.prompts.forEach((prompt: any, index: number) => {
      const promptErrors: string[] = [];

      if (!prompt.name || typeof prompt.name !== 'string') {
        promptErrors.push('名称（name）是必填字段');
      }

      if (!prompt.description || typeof prompt.description !== 'string') {
        promptErrors.push('描述（description）是必填字段');
      }

      if (!prompt.messages || !Array.isArray(prompt.messages) || prompt.messages.length === 0) {
        promptErrors.push('messages数组是必填字段且不能为空');
      } else {
        // 检查是否至少有一个user消息
        const hasUserMessage = prompt.messages.some((msg: any) => msg.role === 'user');
        if (!hasUserMessage) {
          promptErrors.push('至少需要一个role为"user"的消息');
        }

        // 验证messages格式
        prompt.messages.forEach((msg: any, msgIndex: number) => {
          if (!msg.role || !msg.content) {
            promptErrors.push(`消息${msgIndex + 1}缺少role或content字段`);
          }
        });
      }

      if (promptErrors.length > 0) {
        errors.push(`提示词${index + 1}（${prompt.name || '未命名'}）: ${promptErrors.join(', ')}`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // 处理文件导入
  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // 验证导入数据格式
      const validation = validateImportData(importData);
      if (!validation.valid) {
        alert(`导入文件格式错误：\n${validation.errors.join('\n')}`);
        return;
      }

      // 确认导入
      const confirmMessage = `准备导入 ${importData.prompts.length} 个提示词。\n\n注意：这将会创建新的提示词，不会覆盖现有数据。\n\n确定要继续吗？`;
      if (!confirm(confirmMessage)) {
        return;
      }

      // 开始导入
      setLoading(true);
      
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('认证失败，请重新登录');
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // 逐个导入提示词
        for (const promptData of importData.prompts) {
          try {
            const response = await fetch('/api/prompts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: promptData.name,
                description: promptData.description,
                category: promptData.category || '未分类',
                tags: promptData.tags || [],
                messages: promptData.messages,
                is_public: promptData.is_public || false,
                version: promptData.version || 1
              })
            });

            if (response.ok) {
              successCount++;
            } else {
              const errorData = await response.json();
              failCount++;
              errors.push(`${promptData.name}: ${errorData.error || '导入失败'}`);
            }
          } catch (promptError) {
            failCount++;
            errors.push(`${promptData.name}: ${promptError instanceof Error ? promptError.message : '未知错误'}`);
          }
        }

        // 显示导入结果
        let resultMessage = `导入完成！\n成功: ${successCount}个\n失败: ${failCount}个`;
        if (errors.length > 0) {
          resultMessage += `\n\n失败详情:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            resultMessage += `\n... 还有${errors.length - 5}个错误`;
          }
        }

        alert(resultMessage);

        // 刷新数据
        if (successCount > 0) {
          fetchUserPrompts(promptCurrentPage);
          fetchPromptCount();
        }
        
      } catch (error) {
        console.error('导入过程中发生错误:', error);
        alert(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
      
    } catch (error) {
      console.error('解析导入文件失败:', error);
      alert('导入文件格式错误或文件损坏');
    }
  };

  const fetchPromptCount = async () => {
    try {
      // 直接使用Supabase适配器获取提示词计数
      const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
      
      if (!user?.id) {
        console.warn('未登录用户无法获取提示词计数');
        setPromptCounts({ total: 0, public: 0, private: 0 });
        return;
      }
      
      try {
        // 使用适配器获取用户所有提示词
        const result = await supabaseAdapter.getPrompts({
          userId: user.id,
          page: 1,
          pageSize: 1000  // 大量传输以便统计
        });
        
        const promptsList = result.data || [];
        const totalCount = promptsList.length;
        const publicCount = promptsList.filter(p => p.is_public).length;
        const privateCount = totalCount - publicCount;
        
        console.log('提示词计数统计:', { total: totalCount, public: publicCount, private: privateCount });
        
        setPromptCounts({
          total: totalCount,
          public: publicCount,
          private: privateCount
        });
      } catch (adapterError) {
        console.error('通过适配器获取提示词计数失败:', adapterError);
        
        // 如果适配器方法失败，回退到直接API调用
        const token = await getToken();
        if (!token) {
          console.error('无法获取认证令牌');
          setPromptCounts({ total: 0, public: 0, private: 0 });
          return;
        }
        
        const response = await fetch('/api/profile/prompts?pageSize=1000', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const totalCount = data.prompts ? data.prompts.length : 0;
          const publicCount = data.prompts ? data.prompts.filter((p: any) => p.is_public).length : 0;
          const privateCount = totalCount - publicCount;
          
          setPromptCounts({
            total: totalCount,
            public: publicCount,
            private: privateCount
          });
        } else {
          setPromptCounts({ total: 0, public: 0, private: 0 });
        }
      }
    } catch (error) {
      console.error('获取提示词统计失败:', error);
      setPromptCounts({ total: 0, public: 0, private: 0 });
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('请输入API密钥名称');
      return;
    }

    setLoading(true);
    try {
      // 直接使用Supabase适配器创建API密钥
      const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
      
      if (!user?.id) {
        alert('您尚未登录或会话已过期，请刷新页面后重试');
        setLoading(false);
        return;
      }
      
      console.log('正在创建API密钥:', { name: newKeyName, expiryDays: newKeyExpiry, userId: user.id });
      
      try {
        // 直接使用适配器创建API密钥
        const newKey = await supabaseAdapter.generateApiKey(user.id, newKeyName, newKeyExpiry);
        console.log('API密钥创建成功:', newKey);
        
        // 添加新创建的密钥到列表中
        setApiKeys(prev => [newKey, ...prev]);
        setNewKeyName('');
        setShowCreateForm(false);
        
        // 自动显示并复制新创建的密钥 - 使用Array.from解决Set迭代问题
        setVisibleKeys(prev => {
          // 先转换为Array，再添加新元素，然后转回成Set
          const prevArray = Array.from(prev);
          return new Set([...prevArray, newKey.id]);
        });
        
        // 如果密钥中包含原始密钥字符串，显示提示
        if (newKey.key && newKey.key.length > 32) {
          // 使用浏览器API复制到剪贴板
          try {
            await navigator.clipboard.writeText(newKey.key);
            alert(`API密钥创建成功并已复制到剪贴板：\n${newKey.key}\n\n注意：这是唯一一次显示完整密钥的机会！`);
          } catch (e) {
            alert(`API密钥创建成功。请手动复制密钥：\n${newKey.key}\n\n注意：这是唯一一次显示完整密钥的机会！`);
          }
        }
      } catch (adapterError) {
        console.error('通过适配器创建API密钥失败:', adapterError);
        
        // 如果适配器方法失败，回退到直接API调用
        const token = await getToken();
        if (!token) {
          alert('认证失败，请刷新页面后重试');
          return;
        }
        
        const response = await fetch('/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newKeyName,
            expiresInDays: newKeyExpiry,
            expires_in_days: newKeyExpiry
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const newKey = result.data || result.key;
          
          if (newKey) {
            setApiKeys(prev => [newKey, ...prev]);
            setNewKeyName('');
            setShowCreateForm(false);
            
            if (newKey.key && newKey.key.length > 32) {
              alert(`API密钥创建成功。请保存密钥：${newKey.key}`);
            } else {
              alert('API密钥创建成功');
              // 刷新密钥列表以获取完整数据
              fetchApiKeys();
            }
          } else {
            alert('密钥创建成功，但无法显示详情。请刷新页面。');
            fetchApiKeys();
          }
        } else {
          // 错误处理
          try {
            const errorData = await response.json();
            alert(`创建API密钥失败: ${errorData.error || JSON.stringify(errorData)}`);
          } catch {
            alert('创建API密钥失败，请稍后重试');
          }
        }
      }
    } catch (error) {
      console.error('创建API密钥时发生错误:', error);
      alert('创建API密钥失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('确定要删除此API密钥吗？此操作无法撤销。')) {
      return;
    }

    setLoading(true);
    try {
      // 直接使用Supabase适配器删除API密钥
      const { default: supabaseAdapter } = await import('@/lib/supabase-adapter');
      
      if (!user?.id) {
        alert('您尚未登录或会话已过期，请刷新页面后重试');
        setLoading(false);
        return;
      }
      
      console.log('正在删除API密钥:', { keyId, userId: user.id });
      
      try {
        // 直接使用适配器删除API密钥
        const success = await supabaseAdapter.deleteApiKey(user.id, keyId);
        
        if (success) {
          console.log('API密钥删除成功:', keyId);
          // 从列表中移除已删除的密钥
          setApiKeys(prev => prev.filter(key => key.id !== keyId));
        } else {
          console.error('API密钥删除失败');
          alert('删除API密钥失败，请稍后重试');
        }
      } catch (adapterError) {
        console.error('通过适配器删除API密钥失败:', adapterError);
        
        // 如果适配器方法失败，回退到直接API调用
        const token = await getToken();
        if (!token) {
          alert('认证失败，请刷新页面后重试');
          return;
        }
        
        const response = await fetch(`/api/auth/api-keys?id=${keyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // 从列表中移除已删除的密钥
          setApiKeys(prev => prev.filter(key => key.id !== keyId));
        } else {
          const errorText = await response.text();
          console.error('删除API密钥失败:', response.status, errorText);
          alert(`删除API密钥失败: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('删除API密钥时发生错误:', error);
      alert('删除API密钥失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    // 使用Array.from处理Set迭代兼容性问题
    const visibleKeysArray = Array.from(visibleKeys);
    let newVisibleKeysArray: string[];
    
    if (visibleKeys.has(keyId)) {
      // 如果密钥已可见，则从数组中移除
      newVisibleKeysArray = visibleKeysArray.filter(id => id !== keyId);
    } else {
      // 如果密钥不可见，则添加到数组中
      newVisibleKeysArray = [...visibleKeysArray, keyId];
    }
    
    // 创建新的Set
    setVisibleKeys(new Set(newVisibleKeysArray));
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 渲染提示词分页组件
  const renderPromptPagination = () => {
    if (promptTotalPages <= 1) return null;

    const maxVisiblePages = 7; // 显示7个页码
    const startPage = Math.max(1, promptCurrentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(promptTotalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 md:p-6 bg-dark-card/30 backdrop-blur-md rounded-xl border border-dark-border shadow-xl mt-6"
      >
        <div className="flex flex-1 items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              显示第 <span className="font-medium text-neon-cyan">{(promptCurrentPage - 1) * promptPageSize + 1}</span> 到{' '}
              <span className="font-medium text-neon-cyan">
                {Math.min(promptCurrentPage * promptPageSize, promptTotalCount)}
              </span>{' '}
              条，共 <span className="font-medium text-neon-purple">{promptTotalCount}</span> 条结果
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* 上一页 */}
              <button
                onClick={() => handlePromptPageChange(promptCurrentPage - 1)}
                disabled={promptCurrentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 页码 */}
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePromptPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 ${
                    page === promptCurrentPage
                      ? 'z-10 bg-neon-cyan text-dark-bg-primary'
                      : 'text-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {/* 下一页 */}
              <button
                onClick={() => handlePromptPageChange(promptCurrentPage + 1)}
                disabled={promptCurrentPage === promptTotalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </motion.div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };
  
  // 删除提示词
  const deletePrompt = async (promptId: string) => {
    if (!confirm('确定要删除这个提示词吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      // 获取认证令牌
      const token = await getToken();
      if (!token) {
        alert('无法获取认证令牌，请重新登录');
        return;
      }
      
      // 使用专用的删除提示词API端点
      const response = await fetch(`/api/prompts/delete-by-id?id=${promptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // 从列表中移除已删除的提示词
        setUserPrompts(userPrompts.filter(p => p.id !== promptId));
        // 更新提示词计数
        // 更新提示词计数统计
      setPromptCounts(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
        alert('提示词已成功删除');
      } else {
        const error = await response.json();
        throw new Error(error.message || '删除提示词失败');
      }
    } catch (error: any) {
      console.error('删除提示词失败:', error);
      alert(`删除提示词失败: ${error.message || '请检查您的权限或网络连接'}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary py-8">
      <div className="container-custom">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">账户管理</h1>
          <p className="text-gray-400">管理您的个人信息和API密钥</p>
        </motion.div>

        {/* 标签页导航 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-neon-cyan/20">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center space-x-2 py-4 px-1 border-b-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-neon-cyan text-neon-cyan'
                        : 'border-transparent text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-lg bg-neon-cyan/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* 个人信息卡片 */}
                <div className="glass rounded-2xl p-8 border border-neon-cyan/20">
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink p-1">
                        <div className="w-full h-full rounded-full bg-dark-bg-primary flex items-center justify-center">
                          <UserIcon className="h-12 w-12 text-neon-cyan" />
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-green rounded-full border-2 border-dark-bg-primary flex items-center justify-center">
                        <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{user?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 mt-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>加入于 {user?.created_at ? formatDate(user.created_at) : '未知'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 glass rounded-xl border border-neon-cyan/10">
                      <SparklesIcon className="h-8 w-8 text-neon-cyan mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{promptCounts.total}</div>
                      <div className="text-sm text-gray-400">创建的提示词</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border border-neon-purple/10">
                      <KeyIcon className="h-8 w-8 text-neon-purple mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{apiKeys.length}</div>
                      <div className="text-sm text-gray-400">API密钥</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border border-neon-pink/10">
                      <UserIcon className="h-8 w-8 text-neon-pink mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{user?.role || 'user'}</div>
                      <div className="text-sm text-gray-400">账户类型</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                {/* 创建API密钥按钮 */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">API密钥管理</h2>
                    <p className="text-gray-400 mt-1">创建和管理您的API密钥</p>
                  </div>
                  <div className="flex space-x-3">

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateForm(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span>创建密钥</span>
                    </motion.button>
                  </div>
                </div>

                {/* 创建密钥表单 */}
                <AnimatePresence>
                  {showCreateForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass rounded-2xl p-6 border border-neon-cyan/20"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">创建新的API密钥</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            密钥名称
                          </label>
                          <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="例如：开发环境"
                            className="input-primary w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            有效期
                          </label>
                          <select
                            value={newKeyExpiry}
                            onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                            className="input-primary w-full"
                          >
                            {expiryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={createApiKey}
                          disabled={loading || !newKeyName.trim()}
                          className="btn-primary disabled:opacity-50"
                        >
                          {loading ? '创建中...' : '创建密钥'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewKeyName('');
                            setNewKeyExpiry(30);
                          }}
                          className="btn-secondary"
                        >
                          取消
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* API密钥列表 */}
                {loading && !apiKeys.length ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <KeyIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">您还没有创建任何API密钥</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey, index) => (
                      <motion.div
                        key={apiKey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-2xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                              <span className="px-2 py-1 text-xs rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30">
                                活跃
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>创建于 {formatDate(apiKey.created_at)}</span>
                              {apiKey.last_used_at && (
                                <span>最后使用 {formatDate(apiKey.last_used_at)}</span>
                              )}
                              {apiKey.expires_in_days && apiKey.expires_in_days > 0 && (
                                <span>
                                  {apiKey.expires_in_days}天后过期
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                              <button
                                onClick={() => deleteApiKey(apiKey.id)}
                                className="p-2 glass rounded-lg hover:bg-neon-red/10 transition-colors"
                                title="删除密钥"
                              >
                                <TrashIcon className="h-5 w-5 text-neon-red" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'my-prompts' && (
              <div className="space-y-6">
                {/* 创建提示词按钮 */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">我的提示词</h2>
                    <p className="text-gray-400 mt-1">创建和管理您的提示词</p>
                  </div>
                  <ProtectedLink href="/create" className="btn-primary flex items-center space-x-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span>创建提示词</span>
                    </motion.div>
                  </ProtectedLink>
                </div>

                {/* 提示词列表 */}
                {promptsLoading && !userPrompts.length ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                  </div>
                ) : userPrompts.length === 0 ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">您还没有创建任何提示词</p>
                  </div>
                ) : (
                  <>
                    <div className="prompt-grid">
                      {userPrompts.map((prompt, index) => (
                        <motion.div
                          key={prompt.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="glass rounded-2xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                        >
                          {/* 背景渐变 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative">
                            {/* 标题与分类图标、公开/私有状态 */}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-start space-x-2 flex-1 pr-2">
                                {(() => {
                                  const categoryInfo = CATEGORY_MAP[prompt.category || 'default'] || CATEGORY_MAP.default;
                                  const CategoryIcon = categoryInfo.icon;
                                  return (
                                    <>
                                      <div className={clsx(
                                        'inline-flex p-2 rounded-lg bg-gradient-to-br flex-shrink-0',
                                        categoryInfo.color
                                      )}>
                                        <CategoryIcon className="h-4 w-4 text-dark-bg-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">
                                          {prompt.name}
                                        </h3>
                                        <div className="text-xs text-gray-400 mt-1">{categoryInfo.name}</div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  prompt.is_public 
                                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                    : 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
                                }`}>
                                  {prompt.is_public ? '公开' : '私有'}
                                </span>
                              </div>
                            </div>

                            {/* 描述 */}
                            <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                              {prompt.description || '暂无描述'}
                            </p>

                            {/* 标签 */}
                            {prompt.tags && prompt.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {prompt.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 text-xs rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {prompt.tags.length > 2 && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-600/20 text-gray-400 border border-gray-600/20">
                                    +{prompt.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 底部信息 */}
                            <div className="mt-auto pt-4 border-t border-neon-cyan/10 space-y-3">
                              {/* 第一行：评分与日期 */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                  {(() => {
                                    // 优先使用 average_rating，如果没有则使用 rating 字段
                                    const rating = (prompt as any).average_rating !== undefined 
                                      ? (prompt as any).average_rating 
                                      : ((prompt as any).rating || 0);
                                    const percentage = (rating / 5) * 100;
                                    return rating > 0 ? (
                                      <div className="flex items-center space-x-2">
                                        <div className="relative w-20 h-2 bg-dark-bg-tertiary rounded-full overflow-hidden">
                                          <div 
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-yellow to-neon-green rounded-full"
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-400">{rating.toFixed(1)}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-500">暂无评分</span>
                                    );
                                  })()}
                                </div>
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <ClockIcon className="h-3 w-3" />
                                  <span>创建于 {formatDate(prompt.created_at)}</span>
                                </div>
                              </div>
                              
                              {/* 第二行：作者版本信息与操作按钮 */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-1">
                                    <UserIcon className="h-3 w-3" />
                                    <span>您</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DocumentTextIcon className="h-3 w-3" />
                                    <span>v{prompt.version || '1.0'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1" onClick={(e) => e.preventDefault()}>
                                  <Link
                                    href={`/prompts/${prompt.id}`}
                                    className="p-1.5 glass rounded-md hover:bg-neon-cyan/10 transition-colors group/btn"
                                    title="查看详情"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <EyeIcon className="h-3.5 w-3.5 text-gray-400 group-hover/btn:text-neon-cyan" />
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const shareUrl = `${window.location.origin}/prompts/${prompt.id}`;
                                      navigator.clipboard.writeText(shareUrl).then(() => {
                                        alert('分享链接已复制到剪贴板！');
                                      }).catch(() => {
                                        alert('复制失败，请手动复制链接');
                                      });
                                    }}
                                    className="p-1.5 glass rounded-md hover:bg-neon-blue/10 transition-colors group/btn"
                                    title="分享提示词"
                                  >
                                    <ShareIcon className="h-3.5 w-3.5 text-gray-400 group-hover/btn:text-neon-blue" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(prompt.name, prompt.id);
                                    }}
                                    className="p-1.5 glass rounded-md hover:bg-neon-green/10 transition-colors group/btn"
                                    title="复制提示词名称"
                                  >
                                    {copiedKey === prompt.id ? (
                                      <CheckIcon className="h-3.5 w-3.5 text-neon-green" />
                                    ) : (
                                      <ClipboardIcon className="h-3.5 w-3.5 text-gray-400 group-hover/btn:text-neon-green" />
                                    )}
                                  </button>
                                  <Link
                                    href={`/prompts/${prompt.id}/edit`}
                                    className="p-1.5 glass rounded-md hover:bg-neon-purple/10 transition-colors group/btn"
                                    title="编辑提示词"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <PencilIcon className="h-3.5 w-3.5 text-gray-400 group-hover/btn:text-neon-purple" />
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePrompt(prompt.id);
                                    }}
                                    className="p-1.5 glass rounded-md hover:bg-neon-red/10 transition-colors group/btn"
                                    title="删除提示词"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5 text-gray-400 group-hover/btn:text-neon-red" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* 分页组件 */}
                    {renderPromptPagination()}
                  </>
                )}
              </div>
            )}

            {/* 收藏夹标签页 */}
            {activeTab === 'bookmarks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">收藏夹</h2>
                    <p className="text-gray-400 mt-1">管理您收藏的提示词</p>
                  </div>
                </div>

                {bookmarksLoading ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <BookmarkIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">您还没有收藏任何提示词</p>
                    <Link href="/prompts" className="btn-primary mt-4 inline-flex items-center space-x-2">
                      <SparklesIcon className="h-5 w-5" />
                      <span>浏览提示词</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookmarks.map((prompt, index) => (
                      <motion.div
                        key={prompt.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-xl p-4 border border-neon-pink/20 hover:border-neon-pink/40 transition-all duration-300"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">{prompt.name}</h3>
                        <p className="text-gray-300 text-sm mb-3">{prompt.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">收藏于 {formatDate(prompt.created_at)}</span>
                          <Link href={`/prompts/${prompt.id}`} className="btn-secondary text-xs">
                            查看
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 使用历史标签页 */}
            {activeTab === 'usage-history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">使用历史</h2>
                    <p className="text-gray-400 mt-1">查看您的提示词使用记录</p>
                  </div>
                </div>

                {historyLoading ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                  </div>
                ) : usageHistory.length === 0 ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <ClockIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">暂无使用历史记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usageHistory.map((history, index) => (
                      <motion.div
                        key={history.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-xl p-4 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{history.prompt_name}</h3>
                            <p className="text-gray-400 text-sm">使用次数: {history.usage_count}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">最后使用</p>
                            <p className="text-neon-purple">{formatDate(history.used_at)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 评分评论标签页 */}
            {activeTab === 'ratings-reviews' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">评分评论</h2>
                    <p className="text-gray-400 mt-1">管理您的评分和评论</p>
                  </div>
                </div>

                {ratingsLoading ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                  </div>
                ) : userRatings.length === 0 ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <StarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">您还没有评价过任何提示词</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRatings.map((rating, index) => (
                      <motion.div
                        key={rating.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-xl p-6 border border-neon-yellow/20 hover:border-neon-yellow/40 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{rating.prompt_name}</h3>
                            <div className="flex items-center space-x-1 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < rating.rating
                                      ? 'text-neon-yellow fill-current'
                                      : 'text-gray-400'
                                  }`}
                                />
                              ))}
                              <span className="text-gray-400 ml-2">({rating.rating}/5)</span>
                            </div>
                          </div>
                          <span className="text-gray-400 text-sm">{formatDate(rating.created_at)}</span>
                        </div>
                        {rating.review && (
                          <p className="text-gray-300 bg-dark-bg-secondary/30 rounded-lg p-3">
                            "{rating.review}"
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 导入导出标签页 */}
            {activeTab === 'import-export' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">导入导出</h2>
                    <p className="text-gray-400 mt-1">备份和恢复您的数据</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 导出数据 */}
                  <div className="glass rounded-2xl p-6 border border-neon-green/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <ArrowUpTrayIcon className="h-8 w-8 text-neon-green" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">导出数据</h3>
                        <p className="text-gray-400 text-sm">备份您的所有数据</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">
                      导出包括您的提示词、收藏夹、使用历史和评分评论在内的所有数据。
                    </p>
                    <ProtectedButton
                      onClick={handleExportData}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <ArrowUpTrayIcon className="h-5 w-5" />
                      <span>导出数据</span>
                    </ProtectedButton>
                  </div>

                  {/* 下载JSON模板 */}
                  <div className="glass rounded-2xl p-6 border border-neon-blue/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <ArrowDownTrayIcon className="h-8 w-8 text-neon-blue" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">下载模板</h3>
                        <p className="text-gray-400 text-sm">获取导入模板</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">
                      下载标准JSON模板，填写您的提示词数据。
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="btn-secondary w-full flex items-center justify-center space-x-2"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      <span>下载模板</span>
                    </button>
                  </div>

                  {/* 导入数据 */}
                  <div className="glass rounded-2xl p-6 border border-neon-purple/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <ArrowUpTrayIcon className="h-8 w-8 text-neon-purple" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">导入数据</h3>
                        <p className="text-gray-400 text-sm">从JSON文件导入</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">
                      选择填写好的JSON文件来导入您的提示词。
                    </p>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImportFile(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neon-purple/20 file:text-neon-purple hover:file:bg-neon-purple/30 file:cursor-pointer"
                      />
                      {importFile && (
                        <ProtectedButton
                          onClick={() => handleImportData(importFile)}
                          disabled={loading}
                          className="btn-secondary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-purple"></div>
                              <span>导入中...</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpTrayIcon className="h-5 w-5" />
                              <span>导入 {importFile.name}</span>
                            </>
                          )}
                        </ProtectedButton>
                      )}
                    </div>
                    {exportData && (
                      <div className="mt-4 p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg">
                        <p className="text-neon-green text-sm">
                          预览: 包含 {exportData.prompts?.length || 0} 个提示词
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="glass rounded-2xl p-6 border border-neon-cyan/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-neon-cyan" />
                    <span>使用说明</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
                    <div>
                      <h4 className="text-neon-green font-medium mb-2">1. 导出数据</h4>
                      <p>点击"导出数据"按钮，系统会将您的所有数据打包成JSON文件下载。</p>
                    </div>
                    <div>
                      <h4 className="text-neon-blue font-medium mb-2">2. 下载模板</h4>
                      <p>如需批量导入新提示词，请先下载JSON模板，按格式填写您的数据。</p>
                    </div>
                    <div>
                      <h4 className="text-neon-purple font-medium mb-2">3. 导入数据</h4>
                      <p>选择填写好的JSON文件，系统会验证格式并批量创建提示词。</p>
                    </div>
                  </div>
                </div>

                {/* 数据统计 */}
                <div className="glass rounded-2xl p-6 border border-neon-cyan/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <ChartBarIcon className="h-6 w-6 text-neon-cyan" />
                    <span>数据统计</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                      <div className="text-2xl font-bold text-neon-cyan">{promptCounts.total}</div>
                      <div className="text-sm text-gray-400">提示词</div>
                    </div>
                    <div className="text-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                      <div className="text-2xl font-bold text-neon-pink">{bookmarks.length}</div>
                      <div className="text-sm text-gray-400">收藏</div>
                    </div>
                    <div className="text-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                      <div className="text-2xl font-bold text-neon-purple">{usageHistory.length}</div>
                      <div className="text-sm text-gray-400">使用记录</div>
                    </div>
                    <div className="text-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                      <div className="text-2xl font-bold text-neon-yellow">{userRatings.length}</div>
                      <div className="text-sm text-gray-400">评价</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default withAuth(ProfilePage);


