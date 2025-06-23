import type { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/lib/database-service';
import type { PromptTemplate, TemplateFilters } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    data?: PromptTemplate[];
    total?: number;
    error?: string;
    message?: string;
  }>,
) {
  switch (req.method) {
    case 'GET':
      return await handleGetTemplates(req, res);

    default:
      return res.status(405).json({ error: '方法不允许' });
  }
}

// 获取模板列表
async function handleGetTemplates(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const {
      category,
      subcategory,
      difficulty,
      featured,
      premium,
      official,
      search,
      limit = '20',
      offset = '0',
    } = req.query;

    const filters: TemplateFilters = {};

    // 只有明确传递的参数才添加到过滤条件中
    if (category) filters.category = category as string;
    if (subcategory) filters.subcategory = subcategory as string;
    if (difficulty) filters.difficulty = difficulty as 'beginner' | 'intermediate' | 'advanced';
    if (featured !== undefined) filters.featured = featured === 'true';
    if (premium !== undefined) filters.premium = premium === 'true';
    if (official !== undefined) filters.official = official === 'true';
    if (search) filters.search = search as string;
    
    // 分页参数
    filters.limit = parseInt(limit as string, 10);
    filters.offset = parseInt(offset as string, 10);

    const templates = await databaseService.getTemplates(filters);

    res.status(200).json({
      data: templates,
      total: templates.length,
      message: '获取模板列表成功',
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({ 
      error: '获取模板列表失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
} 