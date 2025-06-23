import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q: query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = await generateSearchSuggestions(query.trim());

    res.status(200).json({
      success: true,
      suggestions,
      query,
    });
  } catch (error: any) {
    console.error('获取搜索建议失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取搜索建议失败', 
    });
  }
}

async function generateSearchSuggestions(query: string) {
  const suggestions: Array<{
    text: string;
    type: 'keyword' | 'category' | 'semantic' | 'history';
    confidence?: number;
  }> = [];

  try {
    // 1. 关键词建议 - 基于现有提示词名称和描述
    const keywordSuggestions = await getKeywordSuggestions(query);
    suggestions.push(...keywordSuggestions);

    // 2. 分类建议 - 基于现有分类
    const categorySuggestions = await getCategorySuggestions(query);
    suggestions.push(...categorySuggestions);

    // 3. 语义建议 - 基于内容相似性
    const semanticSuggestions = await getSemanticSuggestions(query);
    suggestions.push(...semanticSuggestions);

    // 4. 历史建议 - 基于热门搜索
    const historySuggestions = await getHistorySuggestions(query);
    suggestions.push(...historySuggestions);

    // 去重并排序
    const uniqueSuggestions = deduplicateAndScore(suggestions);
    
    // 限制返回数量
    return uniqueSuggestions.slice(0, 8);
  } catch (error) {
    console.error('生成搜索建议失败:', error);
    return [];
  }
}

// 关键词建议
async function getKeywordSuggestions(query: string) {
  const { data, error } = await supabase
    .from('prompts')
    .select('name, description, tags')
    .eq('is_public', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('获取关键词建议失败:', error);
    return [];
  }

  const suggestions: any[] = [];
  
  data?.forEach(prompt => {
    // 提示词名称建议
    if (prompt.name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push({
        text: prompt.name,
        type: 'keyword',
        confidence: 0.9,
      });
    }

    // 从描述中提取相关短语
    const descWords = prompt.description?.split(/[，。！？\s]+/) || [];
    descWords.forEach((word: string) => {
      if (word.length > 2 && word.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: word,
          type: 'keyword',
          confidence: 0.7,
        });
      }
    });

    // 标签建议
    prompt.tags?.forEach((tag: string) => {
      if (tag.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: tag,
          type: 'keyword',
          confidence: 0.8,
        });
      }
    });
  });

  return suggestions;
}

// 分类建议
async function getCategorySuggestions(query: string) {
  const { data, error } = await supabase
    .from('prompts')
    .select('category')
    .eq('is_public', true)
    .ilike('category', `%${query}%`)
    .limit(20);

  if (error) {
    console.error('获取分类建议失败:', error);
    return [];
  }

  const categories = Array.from(new Set(data?.map(item => item.category) || []));
  
  return categories.map(category => ({
    text: category,
    type: 'category' as const,
    confidence: 0.8,
  }));
}

// 语义建议
async function getSemanticSuggestions(query: string) {
  // 基于查询意图生成语义建议
  const suggestions: any[] = [];
  
  // 预定义的语义模式
  const semanticPatterns = [
    { keywords: ['写', '创作', '写作'], suggestions: ['创意写作助手', '文章写作工具', '内容创作指南'] },
    { keywords: ['邮件', '邮箱', 'email'], suggestions: ['专业邮件模板', '邮件写作助手', '商务邮件指南'] },
    { keywords: ['翻译', 'translate'], suggestions: ['多语言翻译工具', '专业翻译助手', '文档翻译'] },
    { keywords: ['代码', '编程', 'code'], suggestions: ['代码生成助手', '编程问题解答', '代码审查工具'] },
    { keywords: ['分析', '总结', '解析'], suggestions: ['文档分析工具', '内容总结助手', '数据分析指南'] },
    { keywords: ['学习', '教育', '教学'], suggestions: ['学习计划制定', '教学内容设计', '知识点解释'] },
    { keywords: ['营销', '推广', '广告'], suggestions: ['营销文案生成', '广告创意助手', '推广策略制定'] },
  ];

  const queryLower = query.toLowerCase();
  
  semanticPatterns.forEach(pattern => {
    if (pattern.keywords.some(keyword => queryLower.includes(keyword))) {
      pattern.suggestions.forEach(suggestion => {
        suggestions.push({
          text: suggestion,
          type: 'semantic',
          confidence: 0.9,
        });
      });
    }
  });

  return suggestions;
}

// 历史建议
async function getHistorySuggestions(query: string) {
  try {
    const { data, error } = await supabase
      .from('search_stats')
      .select('query')
      .ilike('query', `%${query}%`)
      .order('search_time', { ascending: false })
      .limit(10);

    if (error) {
      console.error('获取历史建议失败:', error);
      return [];
    }

    // 统计热门查询
    const queryCount = new Map<string, number>();
    data?.forEach(item => {
      const count = queryCount.get(item.query) || 0;
      queryCount.set(item.query, count + 1);
    });

    // 转换为建议格式
    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([queryText, count]) => ({
        text: queryText,
        type: 'history' as const,
        confidence: Math.min(0.8, 0.5 + count * 0.1),
      }));
  } catch (error) {
    console.error('获取历史建议失败:', error);
    return [];
  }
}

// 去重并评分
function deduplicateAndScore(suggestions: any[]) {
  const seen = new Set<string>();
  const unique: any[] = [];

  suggestions.forEach(suggestion => {
    const key = suggestion.text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(suggestion);
    }
  });

  // 按置信度和类型权重排序
  const typeWeights: Record<string, number> = {
    semantic: 3,
    keyword: 2,
    category: 1.5,
    history: 1,
  };

  return unique.sort((a, b) => {
    const scoreA = (a.confidence || 0.5) * (typeWeights[a.type] || 1);
    const scoreB = (b.confidence || 0.5) * (typeWeights[b.type] || 1);
    return scoreB - scoreA;
  });
} 