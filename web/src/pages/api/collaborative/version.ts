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
    const { promptId, content, message } = req.body;

    if (!promptId || !content) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID和内容不能为空', 
      });
    }

    // 获取当前用户信息（这里简化处理，实际应该从JWT中获取）
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '未授权，缺少用户信息', 
      });
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在', 
      });
    }

    // 生成版本号
    const { data: existingVersions, error: countError } = await supabase
      .from('collaborative_versions')
      .select('version_number')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;

    // 计算与上一版本的差异
    let previousContent = '';
    if (existingVersions && existingVersions.length > 0) {
      const { data: previousVersion, error: prevError } = await supabase
        .from('collaborative_versions')
        .select('content')
        .eq('prompt_id', promptId)
        .eq('version_number', nextVersionNumber - 1)
        .single();

      if (!prevError && previousVersion) {
        previousContent = previousVersion.content;
      }
    }

    const changes = calculateChanges(previousContent, content);

    // 保存新版本
    const versionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newVersion, error: versionError } = await supabase
      .from('collaborative_versions')
      .insert({
        id: versionId,
        prompt_id: promptId,
        version_number: nextVersionNumber,
        content,
        message: message || `版本 ${nextVersionNumber}`,
        author_id: userId,
        author_name: user.display_name || user.email,
        changes_summary: JSON.stringify(changes),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (versionError) throw versionError;

    // 更新提示词表的版本信息
    await supabase
      .from('prompts')
      .update({ 
        current_version: nextVersionNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId);

    const responseVersion = {
      id: newVersion.id,
      content: newVersion.content,
      operations: [], // 简化处理
      timestamp: new Date(newVersion.created_at),
      author: newVersion.author_name,
      message: newVersion.message,
    };

    res.status(200).json({
      success: true,
      version: responseVersion,
    });
  } catch (error: any) {
    console.error('保存版本失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '保存版本失败', 
    });
  }
}

function calculateChanges(oldContent: string, newContent: string) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let added = 0;
  let removed = 0;
  let modified = 0;

  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';

    if (oldLine && !newLine) {
      removed++;
    } else if (!oldLine && newLine) {
      added++;
    } else if (oldLine !== newLine) {
      modified++;
    }
  }

  return {
    linesAdded: added,
    linesRemoved: removed,
    linesModified: modified,
    totalChanges: added + removed + modified,
    changePercentage: maxLines > 0 ? Math.round(((added + removed + modified) / maxLines) * 100) : 0,
  };
} 