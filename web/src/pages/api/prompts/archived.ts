import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 获取用户的归档提示词列表（用户级别归档）
 * GET /api/prompts/archived?page=1&limit=20
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  if (req.method !== 'GET') {
    return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
  }

  if (!userId) {
    return errorResponse(res, '需要登录才能查看归档', ErrorCode.UNAUTHORIZED);
  }

  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 使用新的用户级别归档表获取用户的归档提示词
    const { data: archivedData, error: fetchError, count } = await supabase
      .from('user_prompt_archives')
      .select(`
        id,
        prompt_id,
        archive_reason,
        context_users_count,
        created_at as archived_at,
        prompts:prompt_id (
          id,
          name,
          description,
          content,
          tags,
          category,
          category_type,
          is_public,
          user_id,
          created_at,
          updated_at,
          view_count,
          preview_asset_url,
          parameters
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (fetchError) {
      throw new Error(`获取归档列表失败: ${fetchError.message}`);
    }

    // 处理数据格式，展平嵌套的prompts对象
    const promptsWithDetails = (archivedData || []).map((archive) => {
      const prompt = archive.prompts;
      if (!prompt) {
        return null;
      }

      return {
        ...prompt,
        original_author_id: prompt.user_id, // 保持兼容性
        archiveInfo: {
          affectedUsers: archive.context_users_count || 0,
          archiveReason: archive.archive_reason || '用户归档',
          archivedAt: archive.archived_at,
        },
      };
    }).filter(Boolean); // 过滤掉null值

    return successResponse(res, {
      archivedPrompts: promptsWithDetails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
      summary: {
        totalArchived: count || 0,
        canRestoreAll: true,
      },
    });
  } catch (error: any) {
    console.error('获取归档提示词失败:', error);
    return errorResponse(res, '获取归档列表失败: ' + (error.message || '未知错误'), ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['GET'],
  requireAuth: true,
});