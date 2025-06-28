# 测试文件说明

本目录包含用于测试MCP适配器图片和视频功能的测试文件。

## 文件列表

### test-image.png
- **用途**: 测试图片上传和存储功能
- **格式**: PNG图片
- **大小**: 70字节
- **MIME类型**: image/png
- **描述**: 1x1像素的透明PNG图片，用于测试图片上传、存储和预览功能

### test-video.mp4
- **用途**: 测试视频上传和存储功能
- **格式**: MP4视频
- **大小**: 40字节
- **MIME类型**: video/mp4 (file命令检测) / application/octet-stream (multer检测)
- **描述**: 最小化的MP4文件结构，包含基本的ftyp和mdat box

## 使用说明

这些文件主要用于：

1. **开发测试**: 在开发过程中快速测试文件上传功能
2. **功能验证**: 验证MCP适配器的图片和视频处理能力
3. **集成测试**: 测试完整的存储、搜索和展示流程

## 注意事项

- `test-video.mp4` 由于结构简化，可能在某些MIME类型检测器中被识别为 `application/octet-stream`
- 这些文件仅用于测试目的，不包含实际的图片或视频内容
- 在生产环境中，应使用真实的图片和视频文件进行测试

## 测试命令示例

### 测试图片上传
```bash
curl -X POST -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@test-image.png" \
  -F "category_type=image" \
  http://localhost:9010/api/assets/upload
```

### 测试视频上传
```bash
curl -X POST -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@test-video.mp4" \
  -F "category_type=video" \
  http://localhost:9010/api/assets/upload
```

## 更新日期
2025-06-28
