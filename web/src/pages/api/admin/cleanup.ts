import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 系统清理工具API
 * POST /api/admin/cleanup
 * Body: { 
 *   action: 'analyze' | 'cleanup_old' | 'cleanup_orphaned',
 *   daysOld?: number,
 *   dryRun?: boolean 
 * }
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  if (req.method !== 'POST') {
    return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
  }

  // 检查管理员权限
  if (!userId) {
    return errorResponse(res, '需要管理员权限', ErrorCode.UNAUTHORIZED);
  }

  const { action, daysOld = 365, dryRun = true } = req.body;

  if (!action || !['analyze', 'cleanup_old', 'cleanup_orphaned'].includes(action)) {
    return errorResponse(res, '无效的清理操作', ErrorCode.BAD_REQUEST);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const results: any = { action, dryRun, timestamp: new Date().toISOString() };

    switch (action) {
      case 'analyze':
        results.analysis = await analyzeSystemState(supabase);
        break;
      
      case 'cleanup_old':
        results.cleanup = await cleanupOldArchives(supabase, daysOld, dryRun, userId);
        break;
      
      case 'cleanup_orphaned':
        results.cleanup = await cleanupOrphanedData(supabase, dryRun, userId);
        break;
    }

    return successResponse(res, results);
  } catch (error: any) {
    console.error('系统清理操作失败:', error);
    return errorResponse(res, '清理操作失败: ' + (error.message || '未知错误'), ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: true,
});

/**
 * 分析系统状态
 */
async function analyzeSystemState(supabase: any) {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // 1年前

  const [
    totalPrompts,
    archivedPrompts,
    oldArchives,
    activeUsers,
    totalInteractions,
    recentActivity
  ] = await Promise.all([
    // 总提示词数
    supabase.from('prompts').select('id', { count: 'exact' }),
    
    // 用户归档记录数
    supabase.from('user_prompt_archives').select('id', { count: 'exact' }),
    
    // 超过1年的归档记录
    supabase.from('user_prompt_archives').select('id', { count: 'exact' })
      .lt('created_at', cutoffDate.toISOString()),
    
    // 活跃用户数
    supabase.from('users').select('id', { count: 'exact' }).eq('is_active', true),
    
    // 用户活动记录数（如果存在）
    supabase.from('user_interactions').select('id', { count: 'exact' }),
    
    // 最近归档活动
    supabase.from('user_prompt_archives').select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  // 分析数据库大小（估算）
  const estimatedSize = {
    prompts: (totalPrompts.count || 0) * 0.01, // 假设每个提示词平均10KB
    archives: (archivedPrompts.count || 0) * 0.001, // 假设每个归档记录1KB
    interactions: (totalInteractions.count || 0) * 0.0005, // 假设每个交互0.5KB
  };

  const recommendations = [];
  
  if ((oldArchives.count || 0) > 1000) {
    recommendations.push({
      type: 'cleanup_old_archives',
      priority: 'medium',
      description: `建议清理 ${oldArchives.count} 个超过1年的用户归档记录`,
      estimatedSpace: `约 ${((oldArchives.count || 0) * 0.001).toFixed(2)} MB`
    });
  }

  if ((archivedPrompts.count || 0) > (totalPrompts.count || 0) * 0.3) {
    recommendations.push({
      type: 'review_archives',
      priority: 'low',
      description: '用户归档记录较多，建议审查归档策略和用户行为模式'
    });
  }

  return {
    statistics: {
      totalPrompts: totalPrompts.count || 0,
      userArchives: archivedPrompts.count || 0,
      oldArchives: oldArchives.count || 0,
      activeUsers: activeUsers.count || 0,
      totalInteractions: totalInteractions.count || 0,
      recentArchives: recentActivity.count || 0,
      archiveRatio: ((archivedPrompts.count || 0) / Math.max(totalPrompts.count || 1, 1) * 100).toFixed(1) + '%'
    },
    estimatedSize: {
      total: Object.values(estimatedSize).reduce((a, b) => a + b, 0).toFixed(2) + ' MB',
      breakdown: estimatedSize
    },
    recommendations
  };
}

/**
 * 清理老旧用户归档记录
 */
async function cleanupOldArchives(supabase: any, daysOld: number, dryRun: boolean, adminUserId: string) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // 查找超过指定天数的用户归档记录
  const { data: oldArchives, error: findError } = await supabase
    .from('user_prompt_archives')
    .select(`
      id, 
      user_id,
      prompt_id,
      archive_reason,
      created_at,
      prompts:prompt_id (name)
    `)
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (findError) {
    throw new Error(`查找老旧归档记录失败: ${findError.message}`);
  }

  const cleanupResults = {
    found: oldArchives?.length || 0,
    deleted: 0,
    errors: [] as string[],
    processedIds: [] as string[]
  };

  if (!oldArchives || oldArchives.length === 0) {
    return cleanupResults;
  }

  if (dryRun) {
    cleanupResults.preview = oldArchives.map(archive => ({
      id: archive.id,
      promptName: archive.prompts?.name || '未知提示词',
      userId: archive.user_id,
      archivedDaysAgo: Math.floor((Date.now() - new Date(archive.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      reason: archive.archive_reason
    }));
    return cleanupResults;
  }

  // 执行实际删除（只删除归档记录，不删除提示词本身）
  for (const archive of oldArchives) {
    try {
      const { error: deleteError } = await supabase
        .from('user_prompt_archives')
        .delete()
        .eq('id', archive.id);

      if (deleteError) {
        cleanupResults.errors.push(`删除归档记录 ${archive.id} 失败: ${deleteError.message}`);
      } else {
        cleanupResults.deleted++;
        cleanupResults.processedIds.push(archive.id);
      }
    } catch (error: any) {
      cleanupResults.errors.push(`删除归档记录 ${archive.id} 失败: ${error.message}`);
    }
  }

  return cleanupResults;
}

/**
 * 清理无效的数据引用
 */
async function cleanupOrphanedData(supabase: any, dryRun: boolean, adminUserId: string) {
  const cleanupResults = {
    orphanedInteractions: 0,
    orphanedArchives: 0,
    invalidReferences: 0,
    errors: [] as string[]
  };

  try {
    // 获取所有存在的提示词ID
    const { data: existingPrompts } = await supabase
      .from('prompts')
      .select('id');
    
    const existingPromptIds = new Set(existingPrompts?.map(p => p.id) || []);

    // 清理指向不存在提示词的用户交互
    const { data: orphanedInteractions } = await supabase
      .from('user_interactions')
      .select('id, prompt_id')
      .not('prompt_id', 'is', null);

    const invalidInteractions = orphanedInteractions?.filter(
      interaction => !existingPromptIds.has(interaction.prompt_id)
    ) || [];

    if (invalidInteractions.length > 0 && !dryRun) {
      const { error: deleteInteractionsError } = await supabase
        .from('user_interactions')
        .delete()
        .in('id', invalidInteractions.map(i => i.id));

      if (!deleteInteractionsError) {
        cleanupResults.orphanedInteractions = invalidInteractions.length;
      }
    } else {
      cleanupResults.orphanedInteractions = invalidInteractions.length;
    }

    // 清理指向不存在提示词的归档记录
    const { data: orphanedArchives } = await supabase
      .from('user_prompt_archives')
      .select('id, prompt_id');

    const invalidArchives = orphanedArchives?.filter(
      archive => !existingPromptIds.has(archive.prompt_id)
    ) || [];

    if (invalidArchives.length > 0 && !dryRun) {
      const { error: deleteArchivesError } = await supabase
        .from('user_prompt_archives')
        .delete()
        .in('id', invalidArchives.map(a => a.id));

      if (!deleteArchivesError) {
        cleanupResults.orphanedArchives = invalidArchives.length;
      }
    } else {
      cleanupResults.orphanedArchives = invalidArchives.length;
    }

    // 记录清理操作
    if (!dryRun) {
      await supabase
        .from('user_activities')
        .insert({
          user_id: adminUserId,
          activity_type: 'admin_system_cleanup',
          activity_data: {
            action: 'cleanup_orphaned',
            results: cleanupResults,
            timestamp: new Date().toISOString()
          }
        });
    }

  } catch (error: any) {
    cleanupResults.errors.push(`清理孤儿数据失败: ${error.message}`);
  }

  return cleanupResults;
}