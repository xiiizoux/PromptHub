import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { PromptVersion } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '无效的提示词ID' });
  }

  try {
    // 创建认证的 Supabase 客户端
    const supabase = createPagesServerClient({ req, res });

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: '未认证' });
    }

    // 首先检查用户是否有权限访问这个提示词
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, user_id, is_public')
      .eq('id', id)
      .single();

    if (promptError || !prompt) {
      return res.status(404).json({ error: '提示词不存在' });
    }

    // 检查权限：只有作者或公开的提示词才能查看历史版本
    if (prompt.user_id !== user.id && !prompt.is_public) {
      return res.status(403).json({ error: '无权限访问' });
    }

    // 获取历史版本列表（不包含媒体相关字段，因为媒体文件不支持版本管理）
    const { data: versions, error: versionsError } = await supabase
      .from('prompt_versions')
      .select(`
        id,
        prompt_id,
        version,
        content,
        description,
        tags,
        category,
        category_id,
        created_at,
        user_id
      `)
      .eq('prompt_id', id)
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.error('获取版本历史失败:', versionsError);
      return res.status(500).json({ error: '获取版本历史失败' });
    }

    // 转换数据格式
    const formattedVersions: PromptVersion[] = versions?.map(version => ({
      id: version.id,
      prompt_id: version.prompt_id,
      version: version.version,
      content: version.content || '',
      description: version.description,
      tags: version.tags,
      category: version.category,
      category_id: version.category_id,
      parameters: version.parameters || {},
      preview_asset_url: version.preview_asset_url,
      created_at: version.created_at,
      user_id: version.user_id,
    })) || [];

    return res.status(200).json({
      success: true,
      data: formattedVersions,
      total: formattedVersions.length
    });

  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}