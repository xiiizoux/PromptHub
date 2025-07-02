import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  const { id } = req.query;
  const { versionId } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '无效的提示词ID' });
  }

  if (!versionId || typeof versionId !== 'string') {
    return res.status(400).json({ error: '无效的版本ID' });
  }

  try {
    // 创建认证的 Supabase 客户端
    const supabase = createPagesServerClient({ req, res });

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: '未认证' });
    }

    // 检查用户是否有权限编辑这个提示词
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, user_id, version')
      .eq('id', id)
      .single();

    if (promptError || !prompt) {
      return res.status(404).json({ error: '提示词不存在' });
    }

    if (prompt.user_id !== user.id) {
      return res.status(403).json({ error: '无权限编辑此提示词' });
    }

    // 获取要回滚到的版本信息
    const { data: targetVersion, error: versionError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', versionId)
      .eq('prompt_id', id)
      .single();

    if (versionError || !targetVersion) {
      return res.status(404).json({ error: '版本不存在' });
    }

    // 开始事务：先创建当前状态的版本记录，然后更新主记录
    const currentVersion = prompt.version || 1.0;
    const newVersion = Math.round((currentVersion + 0.1) * 10) / 10;

    // 首先保存当前状态到版本历史（回滚前的备份）
    const { data: currentPrompt, error: currentPromptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (currentPromptError || !currentPrompt) {
      return res.status(500).json({ error: '无法获取当前提示词状态' });
    }

    // 创建回滚前的版本记录（不包含媒体相关信息，媒体文件不支持版本管理）
    const { error: backupError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: id,
        version: currentVersion,
        content: currentPrompt.content,
        description: currentPrompt.description,
        tags: currentPrompt.tags,
        category: currentPrompt.category,
        category_id: currentPrompt.category_id,
        user_id: user.id,
        // 注意：不保存 parameters 和 preview_asset_url，媒体文件不支持版本管理
      });

    if (backupError) {
      console.error('创建备份版本失败:', backupError);
      return res.status(500).json({ error: '创建备份版本失败' });
    }

    // 处理参数：保留当前媒体文件，只恢复非媒体参数
    let updatedParameters = targetVersion.parameters || {};
    if (currentPrompt.parameters && typeof currentPrompt.parameters === 'object') {
      const currentParams = currentPrompt.parameters as Record<string, unknown>;
      // 保留当前的媒体文件
      if (currentParams.media_files) {
        updatedParameters = {
          ...updatedParameters,
          media_files: currentParams.media_files
        };
      }
    }

    // 更新主提示词记录为目标版本的内容（但保持当前的媒体文件）
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        content: targetVersion.content,
        description: targetVersion.description,
        tags: targetVersion.tags,
        category: targetVersion.category,
        category_id: targetVersion.category_id,
        parameters: updatedParameters, // 使用处理后的参数，保留媒体文件
        // 注意：不更新 preview_asset_url，保持当前的媒体状态
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('回滚失败:', updateError);
      return res.status(500).json({ error: '回滚失败' });
    }

    return res.status(200).json({
      success: true,
      message: `成功回滚到版本 ${targetVersion.version}`,
      data: {
        ...updatedPrompt,
        previousVersion: currentVersion,
        newVersion: newVersion,
        revertedFromVersion: targetVersion.version
      }
    });

  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}