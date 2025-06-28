-- =============================================
-- 最终同步 category_type 数据完整性
-- 确保所有提示词的 category_type 与其关联的 categories.type 保持一致
-- =============================================

BEGIN;

-- 显示修复前的状态
DO $$
DECLARE
    total_prompts INTEGER;
    null_category_type INTEGER;
    inconsistent_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_prompts FROM prompts;
    SELECT COUNT(*) INTO null_category_type FROM prompts WHERE category_type IS NULL;
    
    SELECT COUNT(*) INTO inconsistent_records 
    FROM prompts p 
    JOIN categories c ON p.category_id = c.id 
    WHERE p.category_type != c.type;
    
    RAISE NOTICE '=== 修复前状态 ===';
    RAISE NOTICE '总提示词数: %', total_prompts;
    RAISE NOTICE 'Null category_type: %', null_category_type;
    RAISE NOTICE '不一致记录数: %', inconsistent_records;
END $$;

-- =============================================
-- 1. 修复所有不一致的 category_type
-- =============================================

-- 更新所有提示词的 category_type 以匹配其关联的 categories.type
UPDATE prompts 
SET 
    category_type = c.type,
    updated_at = NOW()
FROM categories c
WHERE 
    prompts.category_id = c.id 
    AND (
        prompts.category_type IS NULL 
        OR prompts.category_type != c.type
    );

-- =============================================
-- 2. 处理没有 category_id 的记录
-- =============================================

-- 为没有 category_id 但有 category 名称的记录设置正确的 category_id 和 category_type
UPDATE prompts 
SET 
    category_id = c.id,
    category_type = c.type,
    updated_at = NOW()
FROM categories c
WHERE 
    prompts.category_id IS NULL 
    AND prompts.category = c.name 
    AND c.is_active = true;

-- =============================================
-- 3. 处理仍然为 null 的记录
-- =============================================

-- 对于仍然没有正确设置的记录，根据名称智能判断并设置默认值
UPDATE prompts 
SET 
    category_id = (
        SELECT c.id 
        FROM categories c 
        WHERE c.type = CASE 
            WHEN prompts.name ILIKE '%图像%' OR prompts.name ILIKE '%图片%' OR prompts.name ILIKE '%风景%' OR prompts.name ILIKE '%艺术%' OR prompts.name ILIKE '%设计%' THEN 'image'
            WHEN prompts.name ILIKE '%视频%' OR prompts.name ILIKE '%短视频%' OR prompts.name ILIKE '%影像%' THEN 'video'
            ELSE 'chat'
        END
        AND c.is_active = true
        ORDER BY c.sort_order
        LIMIT 1
    ),
    category_type = CASE 
        WHEN prompts.name ILIKE '%图像%' OR prompts.name ILIKE '%图片%' OR prompts.name ILIKE '%风景%' OR prompts.name ILIKE '%艺术%' OR prompts.name ILIKE '%设计%' THEN 'image'
        WHEN prompts.name ILIKE '%视频%' OR prompts.name ILIKE '%短视频%' OR prompts.name ILIKE '%影像%' THEN 'video'
        ELSE 'chat'
    END,
    category = (
        SELECT c.name 
        FROM categories c 
        WHERE c.type = CASE 
            WHEN prompts.name ILIKE '%图像%' OR prompts.name ILIKE '%图片%' OR prompts.name ILIKE '%风景%' OR prompts.name ILIKE '%艺术%' OR prompts.name ILIKE '%设计%' THEN 'image'
            WHEN prompts.name ILIKE '%视频%' OR prompts.name ILIKE '%短视频%' OR prompts.name ILIKE '%影像%' THEN 'video'
            ELSE 'chat'
        END
        AND c.is_active = true
        ORDER BY c.sort_order
        LIMIT 1
    ),
    updated_at = NOW()
WHERE 
    category_type IS NULL 
    OR category_id IS NULL;

-- =============================================
-- 4. 同步 prompt_versions 表
-- =============================================

-- 确保 prompt_versions 表与 prompts 表的分类信息保持同步
UPDATE prompt_versions 
SET 
    category_id = p.category_id,
    category = p.category
FROM prompts p
WHERE 
    prompt_versions.prompt_id = p.id 
    AND (
        prompt_versions.category_id IS NULL 
        OR prompt_versions.category_id != p.category_id
        OR prompt_versions.category != p.category
    );

-- =============================================
-- 5. 验证修复结果
-- =============================================

DO $$
DECLARE
    total_prompts INTEGER;
    null_category_type INTEGER;
    inconsistent_records INTEGER;
    chat_count INTEGER;
    image_count INTEGER;
    video_count INTEGER;
BEGIN
    -- 统计总数
    SELECT COUNT(*) INTO total_prompts FROM prompts;
    SELECT COUNT(*) INTO null_category_type FROM prompts WHERE category_type IS NULL;
    
    -- 统计不一致记录
    SELECT COUNT(*) INTO inconsistent_records 
    FROM prompts p 
    JOIN categories c ON p.category_id = c.id 
    WHERE p.category_type != c.type;
    
    -- 统计各类型数量
    SELECT COUNT(*) INTO chat_count FROM prompts WHERE category_type = 'chat';
    SELECT COUNT(*) INTO image_count FROM prompts WHERE category_type = 'image';
    SELECT COUNT(*) INTO video_count FROM prompts WHERE category_type = 'video';
    
    RAISE NOTICE '=== 修复后状态 ===';
    RAISE NOTICE '总提示词数: %', total_prompts;
    RAISE NOTICE 'Null category_type: %', null_category_type;
    RAISE NOTICE '不一致记录数: %', inconsistent_records;
    RAISE NOTICE 'Chat类型: %', chat_count;
    RAISE NOTICE 'Image类型: %', image_count;
    RAISE NOTICE 'Video类型: %', video_count;
    
    IF null_category_type = 0 AND inconsistent_records = 0 THEN
        RAISE NOTICE '✅ 数据完整性修复成功！';
    ELSE
        RAISE WARNING '⚠️  仍有问题需要处理';
    END IF;
END $$;

-- =============================================
-- 6. 显示修复结果摘要
-- =============================================

-- 显示类型分布
SELECT 
    '修复后类型分布' as report,
    category_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM prompts 
GROUP BY category_type
ORDER BY category_type;

-- 显示所有图像和视频类型的提示词
SELECT 
    '图像类型提示词' as report,
    p.name,
    p.category,
    c.name as category_name,
    c.type as category_type
FROM prompts p
JOIN categories c ON p.category_id = c.id
WHERE p.category_type = 'image'
ORDER BY p.name;

SELECT 
    '视频类型提示词' as report,
    p.name,
    p.category,
    c.name as category_name,
    c.type as category_type
FROM prompts p
JOIN categories c ON p.category_id = c.id
WHERE p.category_type = 'video'
ORDER BY p.name;

-- 检查是否还有不一致的记录
SELECT 
    '数据一致性检查' as report,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 所有数据一致'
        ELSE '❌ 仍有 ' || COUNT(*) || ' 个不一致记录'
    END as status
FROM prompts p
JOIN categories c ON p.category_id = c.id
WHERE p.category_type != c.type;

COMMIT;

-- 最终报告
SELECT '=== 最终数据完整性报告 ===' as final_report;