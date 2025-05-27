import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // 构建查询
    let query = supabase
      .from('prompts')
      .select('*')
      // 只获取公开的提示词
      .eq('is_public', true);
    
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
