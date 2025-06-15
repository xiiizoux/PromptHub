import type { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/lib/database-service';
import type { PromptTemplate } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    data?: PromptTemplate;
    error?: string;
    message?: string;
  }>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '模板ID无效' });
  }

  switch (req.method) {
    case 'GET':
      return await handleGetTemplate(req, res, id);

    case 'POST':
      // 处理模板使用和评分
      return await handleTemplateAction(req, res, id);

    default:
      return res.status(405).json({ error: '方法不允许' });
  }
}

// 获取模板详情
async function handleGetTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  templateId: string
) {
  try {
    const template = await databaseService.getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.status(200).json({
      data: template,
      message: '获取模板详情成功'
    });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({ 
      error: '获取模板详情失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}

// 处理模板相关操作（使用统计、评分等）
async function handleTemplateAction(
  req: NextApiRequest,
  res: NextApiResponse,
  templateId: string
) {
  try {
    const { action, user_id, rating, comment } = req.body;

    switch (action) {
      case 'use':
        // 记录使用统计
        await databaseService.incrementTemplateUsage(templateId, user_id);
        break;

      case 'rate':
        // 提交评分
        if (!user_id) {
          return res.status(400).json({ error: '用户ID缺失' });
        }
        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: '评分必须在1-5之间' });
        }
        await databaseService.rateTemplate(templateId, user_id, rating, comment);
        break;

      default:
        return res.status(400).json({ error: '无效的操作类型' });
    }

    res.status(200).json({
      message: '操作成功'
    });
  } catch (error) {
    console.error('模板操作失败:', error);
    res.status(500).json({ 
      error: '操作失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
} 