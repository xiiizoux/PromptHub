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
    console.log(`尝试删除文件 - 文件路径:${filename}, 用户ID:${userId}`);

    // 从URL中提取文件路径信息
    // URL格式: https://.../storage/v1/object/public/{bucket}/{userId}/{filename}
    let bucketName: string;
    let filePath: string;

    // 解析文件路径，支持直接传入文件路径或URL
    if (filename.includes('/')) {
      // 如果包含路径分隔符，解析为用户ID/文件名格式
      const pathParts = filename.split('/');
      if (pathParts.length >= 2) {
        const actualFilename = pathParts[pathParts.length - 1];
        filePath = filename; // 使用完整路径
        
        // 根据文件扩展名确定bucket
        const extension = actualFilename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) {
          bucketName = 'images';
        } else if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) {
          bucketName = 'videos';
        } else {
          return errorResponse(res, '不支持的文件类型', ErrorCode.BAD_REQUEST);
        }
      } else {
        return errorResponse(res, '无效的文件路径格式', ErrorCode.BAD_REQUEST);
      }
    } else {
      // 向后兼容：处理只有文件名的情况
      const isImage = filename.startsWith('image_');
      const isVideo = filename.startsWith('video_');
      
      if (!isImage && !isVideo) {
        return errorResponse(res, '无法确定文件类型，请提供完整路径', ErrorCode.BAD_REQUEST);
      }

      bucketName = isImage ? 'images' : 'videos';
      filePath = `${userId}/${filename}`;
    }
    
    // 创建管理员客户端
    const adminClient = createClient(supabaseUrl, supabaseKey);

    console.log(`删除文件 - bucket: ${bucketName}, path: ${filePath}`);

    // 删除文件
    const { error: deleteError } = await adminClient.storage
      .from(bucketName)
      .remove([filePath]);

    if (deleteError) {
      console.error('删除文件失败:', deleteError);
      return errorResponse(res, `删除文件失败: ${deleteError.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }

    console.log(`文件删除成功: ${filename}`);

    return successResponse(res, {
      message: '文件删除成功',
      filename,
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
