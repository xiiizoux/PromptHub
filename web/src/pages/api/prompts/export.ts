import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptIds, format = 'json' } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: '未授权访问' });
    }

    // 从Authorization header获取token
    const token = authHeader.replace('Bearer ', '');
    
    // 验证用户token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的授权token' });
    }

    if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
      return res.status(400).json({ error: '请选择要导出的提示词' });
    }

    // 获取提示词数据
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        content,
        description,
        category,
        tags,
        is_public,
        created_at,
        updated_at,
        categories (
          name,
          description
        )
      `)
      .in('id', promptIds)
      .eq('user_id', user.id); // 只能导出自己的提示词

    if (promptsError) {
      throw promptsError;
    }

    if (!prompts || prompts.length === 0) {
      return res.status(404).json({ error: '没有找到可导出的提示词' });
    }

    // 格式化导出数据
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      total_count: prompts.length,
      prompts: prompts.map((prompt: any) => ({
        name: prompt.name,
        content: prompt.content,
        description: prompt.description,
        category: prompt.categories?.name || prompt.category,
        tags: prompt.tags || [],
        is_public: prompt.is_public,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at
      }))
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="prompts_export_${new Date().toISOString().split('T')[0]}.json"`);
      res.status(200).json(exportData);
    } else if (format === 'csv') {
      // CSV格式导出
      const csvHeaders = ['名称', '内容', '描述', '分类', '标签', '是否公开', '创建时间'];
      const csvRows = prompts.map((prompt: any) => [
        `"${prompt.name.replace(/"/g, '""')}"`,
        `"${prompt.content.replace(/"/g, '""')}"`,
        `"${(prompt.description || '').replace(/"/g, '""')}"`,
        `"${prompt.categories?.name || prompt.category || ''}"`,
        `"${(prompt.tags || []).join(', ')}"`,
        prompt.is_public ? '是' : '否',
        prompt.created_at
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="prompts_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send('\uFEFF' + csvContent); // 添加BOM以支持中文
    } else if (format === 'txt') {
      // 纯文本格式导出
      const txtContent = prompts.map((prompt: any) => {
        return [
          `=== ${prompt.name} ===`,
          `分类: ${prompt.categories?.name || prompt.category || '未分类'}`,
          `标签: ${(prompt.tags || []).join(', ') || '无'}`,
          `描述: ${prompt.description || '无描述'}`,
          `内容:`,
          prompt.content,
          '',
          `创建时间: ${prompt.created_at}`,
          `更新时间: ${prompt.updated_at}`,
          ''.repeat(50),
          ''
        ].join('\n');
      }).join('\n');

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="prompts_export_${new Date().toISOString().split('T')[0]}.txt"`);
      res.status(200).send(txtContent);
    } else {
      return res.status(400).json({ error: '不支持的导出格式' });
    }

  } catch (error: any) {
    console.error('导出失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 