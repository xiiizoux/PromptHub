# 存储桶媒体文件访问问题诊断报告

## 问题概述
迁移后网页无法访问存储桶媒体文件，所有媒体文件访问返回500 Internal Server Error。

## 诊断过程

### 1. 数据库检查 ✅
- **Prompts表URL状态**: 
  - 10个提示词包含preview_asset_url
  - 大部分URL已正确更新为 `https://supabase.prompt-hub.cc`
  - 发现2个提示词的`parameters.media_files`仍有旧云URL

### 2. URL修复 ✅
已成功修复以下旧URL:
- `科技产品演示视频制作` - 更新media_files中的URL
- `唯美海滩日落视频` - 更新media_files中的URL

### 3. 存储桶验证 ✅
存储桶已正确创建并包含文件:
```
images 桶:
  - 1f855c66-c95f-4fcf-9fc6-eb351a8f3256.jpg
  - 5f33a3ec-479f-456f-8181-2e5c302ec3f8.png
  - 61fd8c8c-809d-4d75-983f-d07fbff95695.png
  - d7203ae1-723c-4949-964a-20c971cee84a.png

videos 桶:
  - video_1751121629196_6emei5v82tg.mp4
  - video_1751121992683_fl0x86xvoee.mp4
  - video_1751123245758_1tg6upqbgkt.mp4
  - video_1751123654907_h3dqia175lk.mp4
```

### 4. 文件访问测试 ❌
**关键问题**: 所有文件访问返回 **HTTP 500 Internal Server Error**

```json
{"statusCode":"500","error":"Internal","message":"Internal Server Error","code":"InternalError"}
```

#### 测试结果
- 可访问文件: 5/17 (29%)
- 不可访问文件: 12/17 (71%)
- 返回错误: 500 Internal Server Error

#### 具体情况
```
✓ 可访问 (部分):
  - video_1751123245758_1tg6upqbgkt.mp4 (preview_url)
  - video_1751121629196_6emei5v82tg.mp4 (preview_url) 
  - video_1751123654907_h3dqia175lk.mp4
  
✗ 不可访问 (大部分):
  - 所有images桶中的文件 (100%)
  - 大部分videos桶中的文件
```

## 根本原因

### **Supabase Storage服务配置问题**

1. **Storage API返回500错误**
   - 文件确实存在于存储桶中
   - 存储桶配置正确
   - 但Storage服务无法正确返回文件内容
   - 返回JSON错误而不是文件数据

2. **可能的原因**:
   - Storage服务未完全启动
   - Storage后端存储配置错误
   - 文件权限或访问策略问题
   - Storage服务与实际文件存储断开连接

## 修复建议

### 立即行动 (关键)

1. **检查Supabase Storage服务状态**
   ```bash
   # 检查Storage服务是否运行
   docker ps | grep storage
   # 或检查系统服务
   systemctl status supabase-storage
   ```

2. **查看Storage服务日志**
   ```bash
   # Docker环境
   docker logs supabase-storage --tail=100
   # 或系统服务
   journalctl -u supabase-storage -n 100
   ```

3. **验证Storage配置**
   检查Supabase配置文件中的Storage设置:
   - 文件存储路径是否正确
   - 权限设置是否正确
   - 是否使用本地文件系统或S3兼容存储

### 次要行动

4. **检查文件系统权限**
   ```bash
   # 查找Supabase存储文件位置
   find / -name "*1f855c66-c95f-4fcf-9fc6-eb351a8f3256*" 2>/dev/null
   # 检查权限
   ls -la /path/to/storage/files/
   ```

5. **验证存储策略**
   确认storage.objects表的RLS策略允许公开访问:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects';
   ```

6. **重启Storage服务**
   ```bash
   # Docker环境
   docker restart supabase-storage
   # 或系统服务
   systemctl restart supabase-storage
   ```

## 临时解决方案

如果无法快速修复Storage服务，可以考虑:

### 方案A: 使用Supabase官方云服务
继续使用原Supabase云服务的Storage，只迁移数据库。

### 方案B: 使用独立文件服务器
1. 配置Nginx/Apache作为文件服务器
2. 将文件移动到Web可访问目录
3. 更新数据库URL指向新的文件服务器

### 方案C: 使用CDN
1. 将文件上传到CDN (如Cloudflare R2, AWS S3)
2. 更新数据库URL

## 进一步诊断结果 ✅

### Storage API测试
```
✅ 可以获取bucket信息
✅ 可以列出bucket中的文件  
✅ 可以创建签名URL
❌ 无法下载任何文件 (所有下载请求返回500)
```

### 测试详情
```bash
# Bucket信息 - 成功
curl /storage/v1/bucket/images
返回: {"id":"images","name":"images",...}

# 列出文件 - 成功  
curl POST /storage/v1/object/list/images
返回: [{"name":"1f855c66...jpg","id":"...","size":146620}]

# 下载文件 - 失败
curl /storage/v1/object/public/images/1f855c66...jpg
返回: {"statusCode":"500","error":"Internal",...}

# 认证下载 - 失败
curl /storage/v1/object/authenticated/images/1f855c66...jpg
返回: {"statusCode":"500","error":"Internal",...}

# 签名URL - 失败
curl /storage/v1/object/sign/images/...?token=...
返回: {"statusCode":"500","error":"Internal",...}
```

## 确认的根本原因

### **Supabase Storage后端存储断开**

Storage API服务本身运行正常，可以访问数据库获取文件元数据，但无法访问实际的文件存储后端。

**可能的原因**:
1. **文件存储后端服务未运行** (MinIO/本地文件系统)
2. **Storage配置中的文件路径错误**
3. **Storage服务无权限访问文件存储**
4. **文件实际未存储或位置错误**

## 修复步骤

### 1. 检查Supabase Storage配置

查找Supabase配置文件 (通常在以下位置之一):
```bash
# Docker Compose部署
cat /path/to/supabase/docker-compose.yml | grep -A20 "storage"

# 独立安装
cat /etc/supabase/storage.conf
cat ~/.supabase/config.toml

# 检查环境变量
env | grep -i storage
```

关键配置项:
- `FILE_STORAGE_BACKEND` - 应该是 `file` 或 `s3`
- `FILE_STORAGE_BACKEND_PATH` - 本地文件系统路径
- `STORAGE_BACKEND` - 存储后端类型

### 2. 检查文件实际存储位置

```bash
# 查找实际文件
find / -name "1f855c66-c95f-4fcf-9fc6-eb351a8f3256.jpg" 2>/dev/null

# 如果使用Docker，检查volume
docker volume ls | grep storage
docker volume inspect <storage_volume_name>

# 检查常见存储位置
ls -la /var/lib/supabase/storage/
ls -la /home/supabase/storage/
ls -la ./supabase/storage/
```

### 3. 检查Storage服务日志

```bash
# Docker部署
docker logs supabase-storage --tail=100 --follow

# 系统服务
journalctl -u supabase-storage -f

# 日志文件
tail -f /var/log/supabase/storage.log
```

查找关键错误信息如:
- "Failed to read file"
- "Storage backend error"
- "Permission denied"
- "No such file or directory"

### 4. 验证文件权限

```bash
# 检查Storage服务运行用户
ps aux | grep storage

# 检查文件存储目录权限
ls -la /path/to/storage/backend/

# 如果需要，修复权限
chown -R supabase:supabase /path/to/storage/backend/
chmod -R 755 /path/to/storage/backend/
```

### 5. 重启Storage服务

```bash
# Docker
docker restart supabase-storage

# 系统服务
systemctl restart supabase-storage

# 完全重启Supabase (如有必要)
docker compose -f /path/to/docker-compose.yml restart
```

## 下一步

**需要您提供以下信息**:

1. **Supabase部署详情**:
   ```bash
   # 运行这些命令并提供输出
   docker ps -a | grep supabase
   docker compose ps
   ```

2. **Storage配置**:
   ```bash
   # 查找并显示storage配置
   env | grep -E "STORAGE|FILE_STORAGE"
   ```

3. **Storage日志** (关键!):
   ```bash
   # 获取storage服务日志
   docker logs supabase-storage --tail=50
   # 或
   journalctl -u supabase-storage -n 50
   ```

4. **文件存储位置**:
   ```bash
   # 查找存储的文件
   find / -name "*.jpg" -o -name "*.mp4" 2>/dev/null | grep -E "storage|supabase"
   ```

## 已完成修复

✅ 更新了2个prompt的media_files URL (从旧云URL到新URL)
✅ 验证了存储桶和文件都存在
✅ 确认了数据库URL大部分已正确

## 待解决

❌ Supabase Storage服务返回500错误
❌ 无法访问存储桶中的实际文件

