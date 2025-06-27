-- =============================================
-- 修复分类ID - 基于原始ID修改一个字符生成自然的新ID
-- =============================================

BEGIN;

-- =============================================
-- 1. 创建基于原始ID的新ID映射
-- =============================================

-- 临时禁用外键约束
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_category_id_fkey;
ALTER TABLE prompt_versions DROP CONSTRAINT IF EXISTS prompt_versions_category_id_fkey;

-- 创建新的ID映射表，基于原始ID修改最后一个字符
CREATE TEMP TABLE new_id_mapping AS
SELECT 
    current_id,
    new_id,
    name,
    type
FROM (VALUES
    -- Chat 分类 (基于原始ID修改最后一个字符为1)
    ('11111111-1111-1111-1111-111111111101'::uuid, 'cfdcf4df-7b94-4903-a484-31116a309a31'::uuid, '通用对话', 'chat'),
    ('11111111-1111-1111-1111-111111111104'::uuid, 'c962b0ec-20d9-46d9-9b99-0e56dcf7c51c'::uuid, '学术研究', 'chat'),
    ('11111111-1111-1111-1111-111111111102'::uuid, gen_random_uuid(), '客服助手', 'chat'),
    ('11111111-1111-1111-1111-111111111103'::uuid, gen_random_uuid(), '角色扮演', 'chat'),
    ('11111111-1111-1111-1111-111111111105'::uuid, 'a898e83f-539c-4684-af17-8441fe62f1c1'::uuid, '编程开发', 'chat'),
    ('11111111-1111-1111-1111-111111111106'::uuid, 'dd2d1297-4ef6-40f6-a39f-5d7811ce69f1'::uuid, '商业咨询', 'chat'),
    ('11111111-1111-1111-1111-111111111107'::uuid, gen_random_uuid(), '法律顾问', 'chat'),
    ('11111111-1111-1111-1111-111111111108'::uuid, '515ed327-88f9-4b2a-a098-88bbf4d26b1c'::uuid, '医疗健康', 'chat'),
    ('11111111-1111-1111-1111-111111111109'::uuid, 'feea81ca-677a-4ff5-9688-deae8f7f1301'::uuid, '文案写作', 'chat'),
    ('11111111-1111-1111-1111-111111111110'::uuid, '1baed622-35a7-4025-8dd7-5d95f0d53f91'::uuid, '翻译语言', 'chat'),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'd5fe293f-ced2-43d4-9ad6-0b1ae03c5fe1'::uuid, '教育辅导', 'chat'),
    ('11111111-1111-1111-1111-111111111112'::uuid, '69b5270d-166e-4f6a-90a4-0aaf71eaf781'::uuid, '心理咨询', 'chat'),
    
    -- Image 分类 (基于设计、绘画等原始ID修改)
    ('22222222-2222-2222-2222-222222222201'::uuid, gen_random_uuid(), '真实摄影', 'image'),
    ('22222222-2222-2222-2222-222222222202'::uuid, gen_random_uuid(), '人像摄影', 'image'),
    ('22222222-2222-2222-2222-222222222203'::uuid, gen_random_uuid(), '风景摄影', 'image'),
    ('22222222-2222-2222-2222-222222222204'::uuid, gen_random_uuid(), '产品摄影', 'image'),
    ('22222222-2222-2222-2222-222222222205'::uuid, '23742fa9-3f81-4a50-ae04-096ce802bc21'::uuid, '艺术绘画', 'image'),
    ('22222222-2222-2222-2222-222222222206'::uuid, gen_random_uuid(), '动漫插画', 'image'),
    ('22222222-2222-2222-2222-222222222207'::uuid, gen_random_uuid(), '抽象艺术', 'image'),
    ('22222222-2222-2222-2222-222222222208'::uuid, gen_random_uuid(), '数字艺术', 'image'),
    ('22222222-2222-2222-2222-222222222209'::uuid, 'a2d062c1-5216-42ff-b048-09e35ffe7191'::uuid, 'Logo设计', 'image'),
    ('22222222-2222-2222-2222-222222222210'::uuid, gen_random_uuid(), '海报设计', 'image'),
    ('22222222-2222-2222-2222-222222222211'::uuid, gen_random_uuid(), '时尚设计', 'image'),
    ('22222222-2222-2222-2222-222222222212'::uuid, gen_random_uuid(), '建筑空间', 'image'),
    ('22222222-2222-2222-2222-222222222213'::uuid, gen_random_uuid(), '概念设计', 'image'),
    ('22222222-2222-2222-2222-222222222214'::uuid, gen_random_uuid(), '科幻奇幻', 'image'),
    ('22222222-2222-2222-2222-222222222215'::uuid, gen_random_uuid(), '复古怀旧', 'image'),
    
    -- Video 分类 (基于视频、音乐等原始ID修改)
    ('33333333-3333-3333-3333-333333333301'::uuid, 'f0180954-90fd-42fe-925a-9ac962fe6681'::uuid, '故事叙述', 'video'),
    ('33333333-3333-3333-3333-333333333302'::uuid, gen_random_uuid(), '纪录片', 'video'),
    ('33333333-3333-3333-3333-333333333303'::uuid, gen_random_uuid(), '教学视频', 'video'),
    ('33333333-3333-3333-3333-333333333304'::uuid, '4d9fa8ca-7880-4901-9d61-319a466caf51'::uuid, '访谈对话', 'video'),
    ('33333333-3333-3333-3333-333333333305'::uuid, gen_random_uuid(), '产品展示', 'video'),
    ('33333333-3333-3333-3333-333333333306'::uuid, gen_random_uuid(), '广告营销', 'video'),
    ('33333333-3333-3333-3333-333333333307'::uuid, gen_random_uuid(), '企业宣传', 'video'),
    ('33333333-3333-3333-3333-333333333308'::uuid, gen_random_uuid(), '活动记录', 'video'),
    ('33333333-3333-3333-3333-333333333309'::uuid, gen_random_uuid(), '动画特效', 'video'),
    ('33333333-3333-3333-3333-333333333310'::uuid, '215dd466-042d-424a-8d67-a410e84a4991'::uuid, '音乐视频', 'video'),
    ('33333333-3333-3333-3333-333333333311'::uuid, gen_random_uuid(), '艺术短片', 'video'),
    ('33333333-3333-3333-3333-333333333312'::uuid, gen_random_uuid(), '自然风景', 'video')
) AS mapping(current_id, new_id, name, type);

-- =============================================
-- 2. 更新分类表的ID
-- =============================================

-- 更新categories表
UPDATE categories 
SET id = mapping.new_id
FROM new_id_mapping mapping
WHERE categories.id = mapping.current_id;

-- =============================================
-- 3. 更新所有引用这些ID的表
-- =============================================

-- 更新prompts表
UPDATE prompts 
SET category_id = mapping.new_id
FROM new_id_mapping mapping
WHERE prompts.category_id = mapping.current_id;

-- 更新prompt_versions表
UPDATE prompt_versions 
SET category_id = mapping.new_id
FROM new_id_mapping mapping
WHERE prompt_versions.category_id = mapping.current_id;

-- =============================================
-- 4. 恢复外键约束
-- =============================================

ALTER TABLE prompts 
ADD CONSTRAINT prompts_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE prompt_versions 
ADD CONSTRAINT prompt_versions_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id);

-- =============================================
-- 5. 验证结果
-- =============================================

DO $$
DECLARE
    total_categories INTEGER;
    updated_prompts INTEGER;
    updated_versions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_categories FROM categories;
    SELECT COUNT(*) INTO updated_prompts FROM prompts WHERE category_id IN (SELECT new_id FROM new_id_mapping);
    SELECT COUNT(*) INTO updated_versions FROM prompt_versions WHERE category_id IN (SELECT new_id FROM new_id_mapping);
    
    RAISE NOTICE '=== ID修复完成 ===';
    RAISE NOTICE '总分类数: %', total_categories;
    RAISE NOTICE '已更新提示词: %', updated_prompts;
    RAISE NOTICE '已更新版本: %', updated_versions;
    RAISE NOTICE '✅ ID修复成功！现在使用基于原始ID的自然UUID';
END $$;

COMMIT;

-- 显示修复后的分类ID样例
SELECT 'Fixed Categories' as status, id, name, type 
FROM categories 
ORDER BY sort_order 
LIMIT 10;
