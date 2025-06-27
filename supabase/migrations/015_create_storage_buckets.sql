-- =============================================
-- 015_create_storage_buckets.sql
-- 创建图像和视频存储桶
-- 设置存储桶权限和访问策略
-- =============================================

-- 创建图像存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 创建视频存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos', 
    true,
    524288000, -- 500MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 创建缩略图存储桶（用于视频缩略图）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 设置存储桶访问策略

-- 先删除可能存在的同名策略（如果存在）
DROP POLICY IF EXISTS "Public Access Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;

-- 图像存储桶策略
CREATE POLICY "Public Access Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 视频存储桶策略
CREATE POLICY "Public Access Videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own videos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own videos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 缩略图存储桶策略
CREATE POLICY "Public Access Thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own thumbnails" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own thumbnails" ON storage.objects
FOR DELETE USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 创建文件上传和管理的辅助函数
CREATE OR REPLACE FUNCTION get_file_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
    RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql;

-- 创建文件删除函数
CREATE OR REPLACE FUNCTION delete_file_if_exists(bucket_name text, file_path text)
RETURNS boolean AS $$
DECLARE
    file_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM storage.objects 
        WHERE bucket_id = bucket_name AND name = file_path
    ) INTO file_exists;
    
    IF file_exists THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = bucket_name AND name = file_path;
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 创建清理孤儿文件的函数
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS void AS $$
BEGIN
    -- 删除不被任何prompt引用的图像文件
    DELETE FROM storage.objects 
    WHERE bucket_id = 'images' 
    AND name NOT IN (
        SELECT DISTINCT preview_asset_url 
        FROM prompts 
        WHERE preview_asset_url IS NOT NULL
        AND preview_asset_url LIKE '%/storage/v1/object/public/images/%'
    );
    
    -- 删除不被任何prompt引用的视频文件
    DELETE FROM storage.objects 
    WHERE bucket_id = 'videos' 
    AND name NOT IN (
        SELECT DISTINCT preview_asset_url 
        FROM prompts 
        WHERE preview_asset_url IS NOT NULL
        AND preview_asset_url LIKE '%/storage/v1/object/public/videos/%'
    );
    
    -- 删除不被任何prompt引用的缩略图文件
    DELETE FROM storage.objects 
    WHERE bucket_id = 'thumbnails' 
    AND name NOT IN (
        SELECT DISTINCT preview_asset_url 
        FROM prompts 
        WHERE preview_asset_url IS NOT NULL
        AND preview_asset_url LIKE '%/storage/v1/object/public/thumbnails/%'
    );
END;
$$ LANGUAGE plpgsql;

-- 创建存储统计视图
CREATE OR REPLACE VIEW storage_stats AS
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    SUM((metadata->>'size')::bigint) as total_size,
    AVG((metadata->>'size')::bigint) as avg_file_size,
    MIN(created_at) as oldest_file,
    MAX(created_at) as newest_file
FROM storage.objects
WHERE bucket_id IN ('images', 'videos', 'thumbnails')
  AND metadata->>'size' IS NOT NULL
  AND metadata->>'size' != ''
GROUP BY bucket_id;

-- 添加注释
COMMENT ON FUNCTION get_file_url(text, text) IS '获取文件的公共访问URL';
COMMENT ON FUNCTION delete_file_if_exists(text, text) IS '删除指定文件（如果存在）';
COMMENT ON FUNCTION cleanup_orphaned_files() IS '清理不被任何prompt引用的孤儿文件';
COMMENT ON VIEW storage_stats IS '存储桶统计信息视图';