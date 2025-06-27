import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

// 支持的文件类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

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

    // 解析表单数据
    const form = formidable({
      maxFileSize: MAX_VIDEO_SIZE, // 使用最大限制
      keepExtensions: true,
      multiples: false,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    // 获取上传的文件
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: '未找到上传文件'
      });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
      return res.status(400).json({
        success: false,
        error: '不支持的文件类型。支持的格式：JPG, PNG, WebP, GIF, MP4, WebM, MOV, AVI'
      });
    }

    // 验证文件大小
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype || '');
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype || '');
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
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

    // 读取文件内容
    const fileContent = fs.readFileSync(file.filepath);

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
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

    // 清理临时文件
    fs.unlinkSync(file.filepath);

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
        filename: file.originalFilename || fileName,
        size: file.size,
        type: file.mimetype || 'unknown'
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