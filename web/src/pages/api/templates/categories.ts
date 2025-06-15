import type { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/lib/database-service';
import type { TemplateCategory } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    data?: TemplateCategory[];
    error?: string;
    message?: string;
  }>
) {
  switch (req.method) {
    case 'GET':
      return await handleGetCategories(req, res);

    default:
      return res.status(405).json({ error: '方法不允许' });
  }
}

// 获取模板分类列表
async function handleGetCategories(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const categories = await databaseService.getTemplateCategories();

    res.status(200).json({
      data: categories,
      message: '获取模板分类成功'
    });
  } catch (error) {
    console.error('获取模板分类失败:', error);
    res.status(500).json({ 
      error: '获取模板分类失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
} 