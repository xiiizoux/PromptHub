import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

// 禁用 Next.js 默认的 body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    path: string;
    filename: string;
    size: number;
    type: string;
  };
  error?: string;
}

// 支持的文件类型 - MIME类型和魔数签名对照
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// file-type库支持的扩展名对照
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi'];
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

// 配置multer内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB 最大限制
  },
  fileFilter: (_req, file, cb) => {
    // 第一层验证：检查MIME类型
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`不支持的文件类型: ${file.mimetype}。支持的格式：图片(jpg, png, webp, gif)，视频(mp4, webm, mov, avi)`) as any;
      cb(error, false);
    }
  },
});

// 转换为Promise
const uploadSingle = promisify(upload.single('file'));

// 双重文件类型验证函数
async function validateFileType(buffer: Buffer, mimetype: string): Promise<{ isValid: boolean; error?: string; detectedType?: string }> {
  try {
    console.log(`Validating file: MIME type = ${mimetype}, buffer size = ${buffer.length}`);
    
    // 首先检查MIME类型是否被允许
    if (!ALLOWED_TYPES.includes(mimetype)) {
      return {
        isValid: false,
        error: `不支持的文件类型 "${mimetype}"。支持的格式：图片(${ALLOWED_IMAGE_EXTENSIONS.join(', ')})，视频(${ALLOWED_VIDEO_EXTENSIONS.join(', ')})`
      };
    }

    // 注意：AVIF格式由于兼容性问题已移除支持

    // 第二层验证：使用file-type检查文件魔数签名
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      // 对于file-type无法识别的文件，如果MIME类型已经被允许，则通过验证
      console.log(`File type detection failed for ${mimetype}, but MIME type is allowed. Proceeding with MIME type validation.`);
      return {
        isValid: true,
        detectedType: mimetype
      };
    }

    // 检查扩展名是否在允许列表中
    if (!ALLOWED_EXTENSIONS.includes(fileType.ext)) {
      return {
        isValid: false,
        error: `不支持的文件格式 "${fileType.ext}"。支持的格式：图片(${ALLOWED_IMAGE_EXTENSIONS.join(', ')})，视频(${ALLOWED_VIDEO_EXTENSIONS.join(', ')})`,
        detectedType: fileType.mime
      };
    }

    // 检查检测到的MIME类型是否在允许列表中
    if (!ALLOWED_TYPES.includes(fileType.mime)) {
      return {
        isValid: false,
        error: `不支持的文件类型 "${fileType.mime}"。支持的格式：图片(${ALLOWED_IMAGE_EXTENSIONS.join(', ')})，视频(${ALLOWED_VIDEO_EXTENSIONS.join(', ')})`,
        detectedType: fileType.mime
      };
    }

    // 验证MIME类型一致性（防止文件扩展名伪装）
    const isConsistent = mimetype === fileType.mime;
    if (!isConsistent) {
      console.log(`MIME type mismatch: declared ${mimetype}, detected ${fileType.mime}. Using detected type.`);
    }

    return {
      isValid: true,
      detectedType: fileType.mime
    };
  } catch (error) {
    console.error('File validation error:', error);
    return {
      isValid: false,
      error: `文件类型验证失败: ${error instanceof Error ? error.message : '未知错误'}。支持的格式：图片(${ALLOWED_IMAGE_EXTENSIONS.join(', ')})，视频(${ALLOWED_VIDEO_EXTENSIONS.join(', ')})`
    };
  }
}

// 文件大小限制
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '只支持 POST 请求'
    });
  }

  try {
    // 创建 Supabase 客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 配置错误'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 从请求头获取认证信息
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未认证用户，请先登录'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // 验证token并获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '认证失败，请重新登录'
      });
    }

    // 使用multer处理文件上传
    await uploadSingle(req as any, res as any);
    
    // 获取上传的文件
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: '未找到上传文件'
      });
    }

    // 双重文件类型验证
    const validationResult = await validateFileType(file.buffer, file.mimetype);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: `文件验证失败: ${validationResult.error}`
      });
    }

    // 验证文件大小
    const detectedType = validationResult.detectedType || file.mimetype;
    const isImage = ALLOWED_IMAGE_TYPES.includes(detectedType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(detectedType);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return res.status(400).json({
        success: false,
        error: `文件大小超出限制。${isImage ? '图像' : '视频'}文件最大支持 ${maxSizeMB}MB`
      });
    }

    // 确定存储桶
    const bucket = isImage ? 'images' : isVideo ? 'videos' : 'images';
    
    // 生成文件名
    const fileExtension = path.extname(file.originalname || '');
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

    // 文件内容已在内存中
    const fileContent = file.buffer;

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileContent, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: `文件上传失败: ${uploadError.message}`
      });
    }

    // 获取公共 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // 返回成功响应（multer使用内存存储，无需清理临时文件）
    res.status(200).json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
        filename: file.originalname || fileName,
        size: file.size,
        type: validationResult.detectedType || file.mimetype || 'unknown'
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

// 辅助函数：生成缩略图 URL（仅视频）
export function generateThumbnailUrl(videoUrl: string): string {
  // 这里可以集成视频缩略图生成服务
  // 暂时返回默认缩略图或视频第一帧
  return videoUrl.replace(/\.[^/.]+$/, '_thumbnail.jpg');
}

// 辅助函数：验证文件是否为图像
export function isImageFile(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

// 辅助函数：验证文件是否为视频
export function isVideoFile(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

// 辅助函数：格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}