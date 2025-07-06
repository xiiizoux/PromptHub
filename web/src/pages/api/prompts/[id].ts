import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';
import { logger } from '@/lib/error-handler';

// 输入验证函数
function validatePromptId(id: string): { isValid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: '提示词ID不能为空' };
  }

  // 检查是否是有效的UUID格式或合法的名称
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const nameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]{1,100}$/; // 允许中英文、数字、下划线、连字符，最长100字符

  if (!uuidRegex.test(id) && !nameRegex.test(id)) {
    return { isValid: false, error: '无效的提示词ID格式' };
  }

  return { isValid: true };
}

function validateUpdateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.length < 1 || data.name.length > 100) {
      errors.push('提示词名称长度应在1-100个字符之间');
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string' || data.description.length > 1000) {
      errors.push('描述长度不能超过1000个字符');
    }
  }

  // 支持新的 JSONB 内容字段
  if (data.content !== undefined) {
    if (typeof data.content !== 'string' && typeof data.content !== 'object') {
      errors.push('内容必须是字符串或对象格式');
    } else if (typeof data.content === 'string' && data.content.length > 10000) {
      errors.push('内容长度不能超过10000个字符');
    }
  }

  if (data.content_text !== undefined) {
    if (typeof data.content_text !== 'string' || data.content_text.length > 10000) {
      errors.push('内容文本长度不能超过10000个字符');
    }
  }

  if (data.content_structure !== undefined) {
    if (typeof data.content_structure !== 'object') {
      errors.push('内容结构必须是对象格式');
    }
  }

  if (data.context_engineering_enabled !== undefined) {
    if (typeof data.context_engineering_enabled !== 'boolean') {
      errors.push('Context Engineering 启用状态必须是布尔值');
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags) || data.tags.length > 20) {
      errors.push('标签应为数组且不超过20个');
    } else {
      for (const tag of data.tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          errors.push('每个标签长度不能超过50个字符');
          break;
        }
      }
    }
  }

  if (data.version !== undefined) {
    const version = parseFloat(String(data.version));
    if (isNaN(version) || version < 0 || version > 999) {
      errors.push('版本号应为0-999之间的数字');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  const { id } = req.query;

  // 验证提示词ID
  const idValidation = validatePromptId(id as string);
  if (!idValidation.isValid) {
    return errorResponse(res, idValidation.error!, ErrorCode.BAD_REQUEST);
  }

  const promptId = id as string;

  try {
    switch (req.method) {
      case 'GET':
        return await getPrompt(req, res, promptId, userId);
      case 'PUT':
        if (!userId) {
          return errorResponse(res, '需要登录才能更新提示词', ErrorCode.UNAUTHORIZED);
        }
        return await updatePrompt(req, res, promptId, userId);
      case 'DELETE':
        if (!userId) {
          return errorResponse(res, '需要登录才能删除提示词', ErrorCode.UNAUTHORIZED);
        }
        return await deletePrompt(req, res, promptId, userId);
      default:
        return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
    }
  } catch (error: any) {
    logger.error('API处理错误', error, { method: req.method, promptId, userId });
    return errorResponse(res, '服务器内部错误', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['GET', 'PUT', 'DELETE'],
  requireAuth: false, // 在内部根据方法判断是否需要认证
});

async function getPrompt(req: NextApiRequest, res: NextApiResponse, id: string, userId?: string) {
  try {
    console.log(`[API getPrompt] 获取提示词详情，ID: ${id}, 用户ID: ${userId}`);

    // 使用数据库服务获取提示词详情
    // 注意：getPromptByName 方法实际上支持通过ID或name查找
    const prompt = await databaseService.getPromptByName(id, userId);

    if (!prompt) {
      console.log(`[API getPrompt] 未找到提示词，ID: ${id}`);
      return errorResponse(res, '未找到指定的提示词', ErrorCode.NOT_FOUND);
    }

    console.log(`[API getPrompt] 成功获取提示词: ${prompt.name} (ID: ${prompt.id})`);

    // TODO: 增加查看次数和记录使用历史的功能可以在这里添加
    // 目前先返回基本的提示词信息

    logger.info('获取提示词详情', { promptId: id, userId });

    return successResponse(res, { prompt });
  } catch (error: any) {
    console.error(`[API getPrompt] 获取提示词失败，ID: ${id}`, error);
    logger.error('获取提示词失败', error, { promptId: id, userId });
    return errorResponse(res, '获取提示词失败', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function updatePrompt(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  try {
    // 验证输入数据
    const validation = validateUpdateData(req.body);
    if (!validation.isValid) {
      logger.warn('更新提示词输入验证失败', {
        errors: validation.errors,
        promptId: id,
        userId,
      });
      return errorResponse(res, validation.errors.join('; '), ErrorCode.BAD_REQUEST);
    }

    // 使用数据库服务更新提示词
    const updatedPrompt = await databaseService.updatePrompt(id, req.body, userId);

    logger.info('提示词更新成功', { promptId: id, userId });

    return successResponse(res, {
      prompt: updatedPrompt,
      message: '提示词更新成功',
    });
  } catch (error: any) {
    logger.error('更新提示词失败', error, { promptId: id, userId });

    if (error.message?.includes('不存在')) {
      return errorResponse(res, '未找到指定的提示词', ErrorCode.NOT_FOUND);
    }
    if (error.message?.includes('无权限')) {
      return errorResponse(res, '无权限更新此提示词', ErrorCode.FORBIDDEN);
    }

    return errorResponse(res, '更新提示词失败', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function deletePrompt(req: NextApiRequest, res: NextApiResponse, id: string, userId: string) {
  try {
    // 使用增强的数据库服务删除提示词
    const deleteResult = await databaseService.deletePromptEnhanced(id, userId);

    if (!deleteResult.success) {
      return errorResponse(res, deleteResult.message || '删除提示词失败', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    // 根据删除类型记录不同的日志和返回不同的消息
    const logData = { 
      promptId: id, 
      userId, 
      deleteType: deleteResult.type,
      affectedUsers: deleteResult.affectedUsers || 0,
    };

    if (deleteResult.type === 'archived') {
      logger.info('提示词删除 - 已归档保护', logData);
      
      return successResponse(res, {
        message: '已归档',
        type: 'archived',
        details: deleteResult.details,
        affectedUsers: deleteResult.affectedUsers,
        notice: '提示词已归档到您的个人归档中，其他用户的个性化配置得到保护。您可以随时从归档中恢复。',
      });
    } else {
      logger.info('提示词删除 - 完全删除', logData);
      
      return successResponse(res, {
        message: '提示词删除成功',
        type: 'deleted',
        details: deleteResult.message,
      });
    }
  } catch (error: any) {
    logger.error('删除提示词失败', error, { promptId: id, userId });

    // 增强错误处理
    if (error.message?.includes('不存在')) {
      return errorResponse(res, '未找到指定的提示词', ErrorCode.NOT_FOUND);
    }
    if (error.message?.includes('无权限')) {
      return errorResponse(res, '无权限删除此提示词', ErrorCode.FORBIDDEN);
    }
    if (error.message?.includes('系统用户')) {
      return errorResponse(res, '无法删除系统保护的提示词', ErrorCode.FORBIDDEN);
    }

    return errorResponse(res, '删除提示词失败: ' + (error.message || '未知错误'), ErrorCode.INTERNAL_SERVER_ERROR);
  }
}