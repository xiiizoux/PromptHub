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
  is_public: boolean;
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
    
    // 构建查询
    let query = supabase
      .from('prompts')
      .select('*');

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
    const { data, error } = await query;

    if (error) {
      console.error('获取提示词失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: `获取提示词失败: ${error.message}` 
      });
    }

    // 格式化响应
    const formattedData = (data || []).map((prompt: PromptData) => ({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags || []
    }));

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
