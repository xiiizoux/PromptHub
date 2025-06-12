import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端（使用服务角色密钥以绕过RLS）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('初始化Supabase客户端，使用服务角色密钥：', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

type PromptData = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: number;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只接受GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    // 解析查询参数
    const { search, category, tag } = req.query;
    
    // 获取请求中的用户ID（如果存在）
    const userId = req.headers['x-user-id'] as string;
    console.log('请求中的用户ID:', userId);
    
    // 构建基础查询 - 不使用外键关系，先获取提示词数据
    let query = supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        version,
        is_public,
        user_id,
        created_at,
        updated_at,
        created_by
      `);

    // 如果有用户ID，则获取该用户的所有提示词和公开提示词
    // 如果没有用户ID，则只获取公开提示词
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      console.log('获取用户自己的提示词和公开提示词');
    } else {
      query = query.eq('is_public', true);
      console.log('只获取公开提示词');
    }
    
    // 添加搜索条件
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // 添加分类过滤
    if (category && typeof category === 'string' && category !== '全部') {
      query = query.eq('category', category);
    }
    
    // 添加标签过滤
    if (tag && typeof tag === 'string') {
      query = query.contains('tags', [tag]);
    }
    
    // 执行查询
    const { data: promptsData, error } = await query;

    if (error) {
      console.error('获取提示词失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: `获取提示词失败: ${error.message}` 
      });
    }

    console.log('获取到的提示词数量:', promptsData?.length || 0);

    // 如果没有提示词，直接返回
    if (!promptsData || promptsData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 0,
        totalPages: 1
      });
    }

    // 收集所有唯一的用户ID
    const userIds = Array.from(new Set(
      promptsData
        .map(p => p.user_id || p.created_by)
        .filter(Boolean)
    ));

    console.log('需要获取用户信息的用户ID:', userIds);

    // 分别查询用户信息
    let usersData: any[] = [];
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', userIds);

      if (!usersError && users) {
        usersData = users;
      } else {
        console.warn('获取用户信息失败:', usersError);
      }
    }

    // 创建用户ID到用户信息的映射
    const userMap = new Map();
    usersData.forEach(user => {
      userMap.set(user.id, user);
    });

    console.log('用户映射表:', Object.fromEntries(userMap));

    // 格式化响应，确保包含所有必要字段
    const formattedData = promptsData.map((prompt: PromptData) => {
      // 确定作者信息的优先级：created_by > user_id
      const authorId = prompt.created_by || prompt.user_id;
      const authorInfo = authorId ? userMap.get(authorId) : null;
      const authorName = authorInfo?.display_name || 
                        authorInfo?.email?.split('@')[0] || 
                        '未知用户';

      return {
        id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        tags: prompt.tags || [],
        version: prompt.version || 1,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
        author: authorName,
        is_public: prompt.is_public,
        user_id: prompt.user_id
      };
    });

    console.log('格式化后的数据样例:', JSON.stringify(formattedData?.[0], null, 2));

    // 返回结果
    return res.status(200).json({
      success: true,
      data: formattedData,
      total: formattedData.length,
      page: 1,
      pageSize: formattedData.length,
      totalPages: 1
    });
  } catch (error: any) {
    console.error('处理获取提示词请求时出错:', error);
    return res.status(500).json({ 
      success: false, 
      error: `处理请求时出错: ${error.message}` 
    });
  }
}
