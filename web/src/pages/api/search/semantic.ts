import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, mode = 'semantic', limit = 20, filters } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: '搜索查询不能为空', 
      });
    }

    let searchResults;

    if (mode === 'semantic') {
      // 语义搜索：使用向量相似度搜索
      searchResults = await performSemanticSearch(query, limit, filters);
    } else {
      // 关键词搜索：使用全文搜索
      searchResults = await performKeywordSearch(query, limit, filters);
    }

    // 记录搜索统计
    await recordSearchQuery(query, mode, req);

    res.status(200).json({
      success: true,
      results: searchResults,
      mode,
      query,
      count: searchResults.length,
    });
  } catch (error: any) {
    console.error('搜索失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '搜索失败', 
    });
  }
}

// 语义搜索实现
async function performSemanticSearch(query: string, limit: number, filters?: any) {
  try {
    // 注意：这里需要实际的向量数据库支持
    // 暂时使用增强的关键词搜索作为语义搜索的回退
    const searchTerms = extractSearchTerms(query);
    
    let queryBuilder = supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        is_public,
        created_at,
        updated_at,
        version,
        user_id,
        users (
          display_name,
          email
        )
      `)
      .eq('is_public', true);

    // 构建语义搜索查询
    const searchConditions = searchTerms.map(term => {
      // 使用ilike进行模糊匹配，支持部分匹配
      return `name.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`;
    }).join(',');

    if (searchConditions) {
      queryBuilder = queryBuilder.or(searchConditions);
    }

    // 应用过滤器
    if (filters?.categories?.length) {
      queryBuilder = queryBuilder.in('category', filters.categories);
    }

    if (filters?.tags?.length) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags);
    }

    // 限制结果数量
    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // 计算相关性分数（简化版）
    const resultsWithScore = data?.map(prompt => ({
      ...prompt,
      author: (prompt.users as any)?.display_name || (prompt.users as any)?.email || '匿名用户',
      relevanceScore: calculateRelevanceScore(prompt, searchTerms),
    })) || [];

    // 按相关性排序
    return resultsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('语义搜索失败:', error);
    throw error;
  }
}

// 关键词搜索实现
async function performKeywordSearch(query: string, limit: number, filters?: any) {
  try {
    let queryBuilder = supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        is_public,
        created_at,
        updated_at,
        version,
        user_id,
        users (
          display_name,
          email
        )
      `)
      .eq('is_public', true);

    // 精确关键词匹配
    const keywords = query.trim().split(/\s+/);
    const searchConditions = keywords.map(keyword => 
      `name.ilike.%${keyword}%,description.ilike.%${keyword}%,tags.cs.{${keyword}}`,
    ).join(',');

    if (searchConditions) {
      queryBuilder = queryBuilder.or(searchConditions);
    }

    // 应用过滤器
    if (filters?.categories?.length) {
      queryBuilder = queryBuilder.in('category', filters.categories);
    }

    if (filters?.tags?.length) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data?.map(prompt => ({
      ...prompt,
      author: (prompt.users as any)?.display_name || (prompt.users as any)?.email || '匿名用户',
    })) || [];
  } catch (error) {
    console.error('关键词搜索失败:', error);
    throw error;
  }
}

// 提取搜索词汇
function extractSearchTerms(query: string): string[] {
  // 移除停用词并提取关键词
  const stopWords = ['的', '了', '和', '是', '有', '我', '你', '他', '她', '它', '我们', '你们', '他们'];
  const terms = query
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ') // 保留中文、英文、数字
    .split(/\s+/)
    .filter(term => term.length > 1 && !stopWords.includes(term));
  
  return Array.from(new Set(terms)); // 去重
}

// 计算相关性分数（简化版）
function calculateRelevanceScore(prompt: any, searchTerms: string[]): number {
  let score = 0;
  const text = `${prompt.name} ${prompt.description} ${prompt.tags?.join(' ') || ''}`.toLowerCase();
  
  searchTerms.forEach(term => {
    const termLower = term.toLowerCase();
    
    // 标题匹配权重更高
    if (prompt.name.toLowerCase().includes(termLower)) {
      score += 3;
    }
    
    // 描述匹配
    if (prompt.description?.toLowerCase().includes(termLower)) {
      score += 2;
    }
    
    // 标签匹配
    if (prompt.tags?.some((tag: string) => tag.toLowerCase().includes(termLower))) {
      score += 1;
    }
  });
  
  return score;
}

// 记录搜索查询
async function recordSearchQuery(query: string, mode: string, req: NextApiRequest) {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    
    // 尝试获取用户ID（如果已登录）
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // 记录搜索统计
    await supabase
      .from('search_stats')
      .insert({
        query,
        search_mode: mode,
        user_id: userId,
        search_time: new Date().toISOString(),
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      });
  } catch (error) {
    // 记录搜索统计失败不影响主要功能
    console.error('记录搜索统计失败:', error);
  }
} 