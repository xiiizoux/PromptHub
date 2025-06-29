import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 删除媒体文件API
 * DELETE /api/assets/[filename]
 */
async function deleteAssetHandler(req: NextApiRequest, res: NextApiResponse, userId?: string) {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return errorResponse(res, '文件名不能为空', ErrorCode.BAD_REQUEST);
  }

  if (!userId) {
    return errorResponse(res, '需要登录才能删除文件', ErrorCode.UNAUTHORIZED);
  }

  try {
    console.log(`尝试删除文件 - 文件名:${filename}, 用户ID:${userId}`);

    // 确定存储桶（根据文件名前缀）
    const isImage = filename.startsWith('image_');
    const isVideo = filename.startsWith('video_');
    
    if (!isImage && !isVideo) {
      return errorResponse(res, '无法确定文件类型', ErrorCode.BAD_REQUEST);
    }

    const bucketName = isImage ? 'images' : 'videos';
    
    // 创建管理员客户端
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // 检查文件是否存在
    const { data: files, error: listError } = await adminClient.storage
      .from(bucketName)
      .list('', {
        search: filename
      });

    if (listError) {
      console.error('检查文件存在性失败:', listError);
      return errorResponse(res, '检查文件失败', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    const fileExists = files?.some(file => file.name === filename);
    if (!fileExists) {
      console.log(`文件不存在: ${filename}`);
      return errorResponse(res, '文件不存在', ErrorCode.NOT_FOUND);
    }

    // 删除文件
    const { error: deleteError } = await adminClient.storage
      .from(bucketName)
      .remove([filename]);

    if (deleteError) {
      console.error('删除文件失败:', deleteError);
      return errorResponse(res, `删除文件失败: ${deleteError.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }

    console.log(`文件删除成功: ${filename}`);

    return successResponse(res, {
      message: '文件删除成功',
      filename
    });

  } catch (error: any) {
    console.error('删除文件时发生异常:', error);
    return errorResponse(res, '删除文件时发生异常', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export default apiHandler(deleteAssetHandler, {
  requireAuth: true,
  allowedMethods: ['DELETE'],
});
