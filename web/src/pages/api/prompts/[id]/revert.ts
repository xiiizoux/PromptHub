import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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
    // 创建 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 从请求头获取认证信息
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未认证' });
    }

    const token = authHeader.split(' ')[1];

    // 验证token并获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: '未认证' });
    }

    // 检查用户是否有权限编辑这个提示词
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, user_id')
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
    // version 字段已移除，版本信息现在通过 prompt_versions 表管理

    // 首先保存当前状态到版本历史（回滚前的备份）
    const { data: currentPrompt, error: currentPromptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (currentPromptError || !currentPrompt) {
      return res.status(500).json({ error: '无法获取当前提示词状态' });
    }

    // 获取当前最新的版本号
    const { data: latestVersion, error: latestVersionError } = await supabase
      .from('prompt_versions')
      .select('version')
      .eq('prompt_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 计算当前版本号（如果存在则递增，否则从1开始）
    const currentVersion = latestVersion?.version 
      ? (parseFloat(latestVersion.version) + 0.1).toFixed(1)
      : '1.0';

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
          media_files: currentParams.media_files,
        };
      }
    }

    // 获取目标版本对应的分类信息，确保数据一致性
    let categoryName = targetVersion.category;
    let categoryId = targetVersion.category_id;

    // 如果有 category_id，从数据库获取最新的分类名称，确保数据一致性
    if (categoryId) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .eq('is_active', true)
        .maybeSingle();

      if (categoryData) {
        categoryName = categoryData.name;
        console.log(`分类数据同步: ${targetVersion.category} -> ${categoryName}`);
      } else {
        console.warn(`分类ID ${categoryId} 不存在或已禁用，使用原分类名称: ${categoryName}`);
      }
    } else if (categoryName) {
      // 如果只有分类名称，尝试获取对应的 category_id
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('is_active', true)
        .maybeSingle();

      if (categoryData) {
        categoryId = categoryData.id;
        console.log(`分类ID补全: ${categoryName} -> ${categoryId}`);
      } else {
        console.warn(`分类名称 ${categoryName} 不存在或已禁用`);
      }
    }

    // 计算新版本号（基于目标版本号递增）
    const newVersion = (parseFloat(targetVersion.version) + 0.1).toFixed(1);

    // 更新主提示词记录为目标版本的内容（但保持当前的媒体文件）
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        content: targetVersion.content,
        description: targetVersion.description,
        tags: targetVersion.tags,
        category: categoryName, // 使用最新的分类名称
        category_id: categoryId,
        parameters: updatedParameters, // 使用处理后的参数，保留媒体文件
        // 注意：不更新 preview_asset_url，保持当前的媒体状态
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('回滚失败:', updateError);
      console.error('回滚参数:', {
        content: targetVersion.content?.substring(0, 100) + '...',
        description: targetVersion.description,
        tags: targetVersion.tags,
        category: categoryName,
        category_id: categoryId,
        version: newVersion,
      });
      return res.status(500).json({ error: '回滚失败: ' + updateError.message });
    }

    console.log('回滚成功:', {
      promptId: id,
      fromVersion: currentVersion,
      toVersion: targetVersion.version,
      newVersion: newVersion,
      category: categoryName,
      category_id: categoryId,
    });

    return res.status(200).json({
      success: true,
      message: `成功回滚到版本 ${targetVersion.version}`,
      data: {
        ...updatedPrompt,
        previousVersion: currentVersion,
        newVersion: newVersion,
        revertedFromVersion: targetVersion.version,
      },
    });

  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}