import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 管理员API：系统完整性检查和维护工具
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 检查用户权限
  if (!userId) {
    return errorResponse(res, '需要管理员权限', ErrorCode.UNAUTHORIZED);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (req.method) {
      case 'POST':
        return await performSystemCheck(req, res, supabase, userId);
      default:
        return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
    }
  } catch (error: any) {
    console.error('系统检查失败:', error);
    return errorResponse(res, '系统检查失败', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: true,
});

async function performSystemCheck(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  try {
    const { action = 'check' } = req.body;

    const results: any = {};

    if (action === 'check' || action === 'full') {
      // 执行用户归档系统完整性检查
      const integrityResults = await checkArchiveSystemIntegrity(supabase);

      results.integrityCheck = integrityResults;
    }

    if (action === 'stats' || action === 'full') {
      // 获取详细统计信息
      const stats = await getDetailedStats(supabase);
      results.detailedStats = stats;
    }

    if (action === 'verify' || action === 'full') {
      // 验证数据一致性
      const verification = await verifyDataConsistency(supabase);
      results.dataVerification = verification;
    }

    // 记录管理员操作
    await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: 'admin_system_check',
        activity_data: {
          action,
          timestamp: new Date().toISOString(),
          results_summary: {
            checks_performed: Object.keys(results).length,
            status: 'completed',
          },
        },
      });

    return successResponse(res, {
      action,
      timestamp: new Date().toISOString(),
      results,
      summary: generateSummary(results),
    });
  } catch (error: any) {
    console.error('执行系统检查失败:', error);
    throw error;
  }
}

async function getDetailedStats(supabase: any) {
  try {
    // 获取各种统计数据
    const [
      archivedCount,
      interactionsCount,
      totalPrompts,
      publicPrompts,
      activeUsers,
    ] = await Promise.all([
      supabase.from('user_prompt_archives').select('id', { count: 'exact' }),
      supabase.from('user_interactions').select('id', { count: 'exact' }),
      supabase.from('prompts').select('id', { count: 'exact' }),
      supabase.from('prompts').select('id', { count: 'exact' }).eq('is_public', true),
      supabase.from('users').select('id', { count: 'exact' }).eq('is_active', true),
    ]);

    return {
      user_archives: archivedCount.count || 0,
      total_interactions: interactionsCount.count || 0,
      total_prompts: totalPrompts.count || 0,
      public_prompts: publicPrompts.count || 0,
      active_users: activeUsers.count || 0,
      archive_ratio: totalPrompts.count ? 
        ((archivedCount.count || 0) / totalPrompts.count * 100).toFixed(2) + '%' : '0%',
    };
  } catch (error) {
    console.error('获取详细统计失败:', error);
    return { error: error.message };
  }
}

async function verifyDataConsistency(supabase: any) {
  try {
    const issues: any[] = [];

    // 检查归档记录是否指向存在的提示词
    const { data: archivesWithPrompts } = await supabase
      .from('user_prompt_archives')
      .select(`
        id, user_id, prompt_id, archive_reason,
        prompts:prompt_id (id, name)
      `);

    if (archivesWithPrompts) {
      const invalidArchives = archivesWithPrompts.filter(
        (archive: any) => !archive.prompts,
      );

      if (invalidArchives.length > 0) {
        issues.push({
          type: 'invalid_archive_references',
          count: invalidArchives.length,
          description: '归档记录指向不存在的提示词',
          affected_archives: invalidArchives.map((a: any) => ({ 
            id: a.id, 
            prompt_id: a.prompt_id,
            user_id: a.user_id, 
          })),
        });
      }
    }

    // 检查用户交互是否指向存在的提示词
    const { data: transfersWithoutOrphans } = await supabase
      .from('prompt_ownership_transfers')
      .select(`
        id, prompt_id, transfer_type,
        prompt:prompts(id, is_orphaned)
      `)
      .eq('transfer_type', 'orphan_protection');

    if (transfersWithoutOrphans) {
      const invalidTransfers = transfersWithoutOrphans.filter(
        (transfer: any) => !transfer.prompt || !transfer.prompt.is_orphaned,
      );

      if (invalidTransfers.length > 0) {
        issues.push({
          type: 'invalid_transfer_records',
          count: invalidTransfers.length,
          description: '转移记录指向非孤儿提示词',
          affected_transfers: invalidTransfers.map((t: any) => ({ id: t.id, prompt_id: t.prompt_id })),
        });
      }
    }

    return {
      status: issues.length === 0 ? 'consistent' : 'has_issues',
      issues_found: issues.length,
      issues: issues,
    };
  } catch (error) {
    console.error('数据一致性验证失败:', error);
    return { error: error.message };
  }
}

function generateSummary(results: any) {
  const summary: string[] = [];

  if (results.integrityCheck) {
    const checks = results.integrityCheck;
    const errorCount = checks.filter((c: any) => c.status === 'ERROR').length;
    const warningCount = checks.filter((c: any) => c.status === 'WARNING').length;
    
    if (errorCount > 0) {
      summary.push(`🔴 发现 ${errorCount} 个错误`);
    }
    if (warningCount > 0) {
      summary.push(`🟡 发现 ${warningCount} 个警告`);
    }
    if (errorCount === 0 && warningCount === 0) {
      summary.push('✅ 系统完整性检查通过');
    }
  }

  if (results.detailedStats) {
    const stats = results.detailedStats;
    summary.push(`📊 总计 ${stats.total_prompts} 个提示词，${stats.user_archives} 个用户归档（${stats.archive_ratio}）`);
  }

  if (results.dataVerification) {
    const verification = results.dataVerification;
    if (verification.status === 'consistent') {
      summary.push('✅ 数据一致性验证通过');
    } else {
      summary.push(`⚠️ 发现 ${verification.issues_found} 个数据一致性问题`);
    }
  }

  return summary.join(' | ');
}

// 新的用户归档系统完整性检查函数
async function checkArchiveSystemIntegrity(supabase: any) {
  try {
    const checks = [];

    // 检查归档表结构是否存在
    const { data: tableExists } = await supabase
      .from('user_prompt_archives')
      .select('count(*)', { count: 'exact' })
      .limit(1);

    if (tableExists !== null) {
      checks.push({
        check_name: 'user_archives_table',
        status: 'OK',
        details: '用户归档表结构正常',
        affected_count: 0,
      });
    } else {
      checks.push({
        check_name: 'user_archives_table',
        status: 'ERROR',
        details: '用户归档表不存在',
        affected_count: 1,
      });
    }

    // 检查归档完整性函数是否存在
    try {
      const { data: functionTest } = await supabase
        .rpc('has_other_users_context', {
          prompt_id_param: '00000000-0000-0000-0000-000000000000',
          user_id_param: '00000000-0000-0000-0000-000000000000',
        });

      checks.push({
        check_name: 'archive_functions',
        status: 'OK',
        details: '归档系统函数正常',
        affected_count: 0,
      });
    } catch (error) {
      checks.push({
        check_name: 'archive_functions',
        status: 'ERROR',
        details: '归档系统函数缺失或异常',
        affected_count: 1,
      });
    }

    // 检查归档数据一致性
    const { data: inconsistentArchives } = await supabase
      .from('user_prompt_archives')
      .select(`
        id, prompt_id,
        prompts:prompt_id (id)
      `)
      .is('prompts.id', null);

    if (inconsistentArchives && inconsistentArchives.length > 0) {
      checks.push({
        check_name: 'archive_data_consistency',
        status: 'WARNING',
        details: `发现 ${inconsistentArchives.length} 个指向不存在提示词的归档记录`,
        affected_count: inconsistentArchives.length,
      });
    } else {
      checks.push({
        check_name: 'archive_data_consistency',
        status: 'OK',
        details: '归档数据一致性正常',
        affected_count: 0,
      });
    }

    return checks;
  } catch (error: any) {
    return [{
      check_name: 'system_check',
      status: 'ERROR',
      details: `系统检查失败: ${error.message}`,
      affected_count: 1,
    }];
  }
}