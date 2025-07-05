import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 管理员永久删除API
 * ⚠️  这是唯一可以真正删除提示词的接口！
 * POST /api/admin/permanent-delete
 * Body: { promptId: string, reason?: string, confirmPassword?: string }
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  if (req.method !== 'POST') {
    return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
  }

  // 检查管理员权限
  if (!userId) {
    return errorResponse(res, '需要管理员权限', ErrorCode.UNAUTHORIZED);
  }

  // TODO: 这里应该检查用户是否是管理员
  // 简化处理，实际部署时需要严格的权限验证
  
  const { promptId, reason = '管理员永久删除', confirmPassword } = req.body;

  if (!promptId || typeof promptId !== 'string') {
    return errorResponse(res, '请提供有效的提示词ID', ErrorCode.BAD_REQUEST);
  }

  // 简单的确认密码检查（实际应该更严格）
  if (confirmPassword !== 'PERMANENT_DELETE_CONFIRM') {
    return errorResponse(res, '确认密码错误', ErrorCode.FORBIDDEN);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取提示词信息（用于记录）
    const { data: promptInfo, error: fetchError } = await supabase
      .from('prompts')
      .select('id, name, user_id')
      .eq('id', promptId)
      .single();

    if (fetchError || !promptInfo) {
      return errorResponse(res, '未找到指定的提示词', ErrorCode.NOT_FOUND);
    }

    // 使用数据库函数执行永久删除
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('admin_permanent_delete_prompt', {
        prompt_id_param: promptId,
        admin_user_id: userId,
        deletion_reason: reason
      });

    if (deleteError) {
      throw new Error(`永久删除失败: ${deleteError.message}`);
    }

    if (!deleteResult) {
      return errorResponse(res, '删除失败：提示词不存在或已被删除', ErrorCode.NOT_FOUND);
    }

    // 记录高风险操作
    console.warn(`⚠️  管理员永久删除操作 - 管理员: ${userId}, 提示词: ${promptId} (${promptInfo.name}), 原因: ${reason}`);

    return successResponse(res, {
      message: '提示词已永久删除',
      deletedPrompt: {
        id: promptId,
        name: promptInfo.name,
        originalUserId: promptInfo.user_id
      },
      warning: '此操作不可撤销！所有相关数据已永久删除。'
    });
  } catch (error: any) {
    console.error('管理员永久删除失败:', error);
    return errorResponse(res, '永久删除失败: ' + (error.message || '未知错误'), ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: true,
});