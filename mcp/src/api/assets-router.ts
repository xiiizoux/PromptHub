/**
 * 文件资源上传路由
 * 
 * 专门处理图片和视频示例文件的上传
 * 用于为图片/视频提示词提供预览资源
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { SupabaseAdapter } from '../storage/supabase-adapter.js';
import logger from '../utils/logger.js';

const router = express.Router();

// 允许的文件MIME类型
const ALLOWED_MIME_TYPES = [
  // 图片类型
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 视频类型
  'video/mp4',
  'video/avi',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-flv',
  'video/webm',
  'video/x-matroska'
];

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// 配置multer用于内存存储（文件直接存储到Supabase Storage）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制
  },
  // 暂时接受所有文件，在后续处理中进行MIME类型检测
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

/**
 * 文件上传接口
 * POST /api/assets/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const { category_type = 'image' } = req.body; // 从请求中获取分类类型

    // 验证分类类型
    if (!['image', 'video'].includes(category_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的分类类型，仅支持 image 或 video'
      });
    }

    // 使用file-type检测真实的MIME类型
    let detectedMimeType = mimetype;
    try {
      // 对于较大的文件，只检测前几KB来提高性能
      const sampleSize = Math.min(buffer.length, 4096); // 检测前4KB
      const sampleBuffer = buffer.subarray(0, sampleSize);

      const fileType = await fileTypeFromBuffer(sampleBuffer);
      if (fileType) {
        detectedMimeType = fileType.mime;
        logger.info('文件类型检测', {
          originalMime: mimetype,
          detectedMime: detectedMimeType,
          extension: fileType.ext,
          fileSize: buffer.length,
          sampleSize
        });
      } else {
        logger.debug('file-type无法识别文件类型，使用原始MIME类型', {
          originalMime: mimetype,
          fileSize: buffer.length
        });
      }
    } catch (error) {
      logger.warn('文件类型检测失败，使用原始MIME类型', {
        error: error instanceof Error ? error.message : error,
        originalMime: mimetype,
        fileSize: buffer.length
      });
    }

    // 验证检测到的MIME类型是否在允许的类型列表中
    if (!ALLOWED_MIME_TYPES.includes(detectedMimeType as AllowedMimeType)) {
      return res.status(400).json({
        success: false,
        message: `不支持的文件类型: ${detectedMimeType}。仅支持图片（JPEG, PNG, GIF, WebP, SVG）和视频（MP4, AVI, MOV, WMV, FLV, WebM, MKV）文件`
      });
    }

    // 验证文件类型与分类类型的匹配
    const isImageFile = detectedMimeType.startsWith('image/');
    const isVideoFile = detectedMimeType.startsWith('video/');

    if (category_type === 'image' && !isImageFile) {
      return res.status(400).json({
        success: false,
        message: '图片分类只能上传图片文件'
      });
    }

    if (category_type === 'video' && !isVideoFile) {
      return res.status(400).json({
        success: false,
        message: '视频分类只能上传视频文件'
      });
    }

    logger.info('开始上传文件', {
      filename: originalname,
      originalMimetype: mimetype,
      detectedMimetype: detectedMimeType,
      size,
      category_type
    });

    // 生成唯一文件名
    const fileExtension = path.extname(originalname);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${category_type}_${timestamp}_${randomString}${fileExtension}`;

    // 创建存储适配器实例
    const storage = new SupabaseAdapter();

    // 上传到Supabase Storage，使用检测到的MIME类型
    const uploadResult = await storage.uploadAsset(buffer, filename, detectedMimeType, category_type);

    if (!uploadResult.success) {
      throw new Error(uploadResult.message || '文件上传失败');
    }

    logger.info('文件上传成功', {
      filename,
      url: uploadResult.url,
      category_type
    });

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename,
        original_name: originalname,
        url: uploadResult.url,
        mimetype: detectedMimeType,
        original_mimetype: mimetype,
        size,
        category_type,
        uploaded_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('文件上传失败', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '文件上传失败'
    });
  }
});

/**
 * 获取支持的文件类型接口
 * GET /api/assets/supported-types
 */
router.get('/supported-types', (req, res) => {
  res.json({
    success: true,
    data: {
      image: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ],
      video: [
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/mkv'
      ],
      max_size: 50 * 1024 * 1024 // 50MB
    }
  });
});

/**
 * 获取文件信息接口
 * GET /api/assets/:filename
 */
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    const storage = new SupabaseAdapter();
    const fileInfo = await storage.getAssetInfo(filename);

    if (!fileInfo.success) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.json({
      success: true,
      data: fileInfo.data
    });

  } catch (error) {
    logger.error('获取文件信息失败', error);
    
    res.status(500).json({
      success: false,
      message: '获取文件信息失败'
    });
  }
});

/**
 * 删除文件接口
 * DELETE /api/assets/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    const storage = new SupabaseAdapter();
    const deleteResult = await storage.deleteAsset(filename);

    if (!deleteResult.success) {
      return res.status(404).json({
        success: false,
        message: deleteResult.message || '文件删除失败'
      });
    }

    logger.info('文件删除成功', { filename });

    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    logger.error('文件删除失败', error);
    
    res.status(500).json({
      success: false,
      message: '文件删除失败'
    });
  }
});

export default router;