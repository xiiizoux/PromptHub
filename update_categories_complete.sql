-- =============================================
-- PromptHub 分类表完全重构SQL脚本
-- 基于新的三大类型分类系统：Chat(12) + Image(15) + Video(12) = 39个分类
-- 此脚本会安全地处理外键约束，清理错误表，并实现新分类架构
-- =============================================

-- 开始事务
BEGIN;

-- =============================================
-- 1. 清理错误表和备份现有数据
-- =============================================

-- 清理之前执行错误留下的表
DROP TABLE IF EXISTS categories_backup CASCADE;
DROP TABLE IF EXISTS prompts_category_backup CASCADE;
DROP TABLE IF EXISTS template_categories CASCADE;
DROP TABLE IF EXISTS template_ratings CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;

-- 删除错误的视图
DROP VIEW IF EXISTS prompts_with_category_type CASCADE;

-- 备份现有分类数据
CREATE TABLE categories_backup AS 
SELECT * FROM categories;

-- 备份现有提示词的分类关联
CREATE TABLE prompts_category_backup AS 
SELECT id, category, category_id FROM prompts;

-- =============================================
-- 2. 临时禁用外键约束
-- =============================================

-- 临时禁用外键约束检查
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_category_id_fkey;
ALTER TABLE prompt_versions DROP CONSTRAINT IF EXISTS prompt_versions_category_id_fkey;

-- =============================================
-- 3. 清空并重建分类表
-- =============================================

-- 清空现有分类数据
DELETE FROM categories;

-- 插入新的分类数据
-- 📝 对话提示词（Chat）- 12个分类
INSERT INTO categories (id, name, name_en, icon, description, sort_order, is_active, type) VALUES
-- 基础对话类
('11111111-1111-1111-1111-111111111101', '通用对话', 'general', 'chat-bubble-left-right', '日常交流、基础咨询', 101, true, 'chat'),
('11111111-1111-1111-1111-111111111102', '客服助手', 'customer_service', 'phone', '客户服务、问题解答', 102, true, 'chat'),
('11111111-1111-1111-1111-111111111103', '角色扮演', 'role_playing', 'user-group', '角色模拟、情景对话', 103, true, 'chat'),

-- 专业领域类
('11111111-1111-1111-1111-111111111104', '学术研究', 'academic', 'academic-cap', '学术论文、研究方法', 104, true, 'chat'),
('11111111-1111-1111-1111-111111111105', '编程开发', 'programming', 'code-bracket', '代码编写、技术问答', 105, true, 'chat'),
('11111111-1111-1111-1111-111111111106', '商业咨询', 'business', 'chart-bar', '商业分析、策略规划', 106, true, 'chat'),
('11111111-1111-1111-1111-111111111107', '法律顾问', 'legal', 'scale', '法律咨询、合规指导', 107, true, 'chat'),
('11111111-1111-1111-1111-111111111108', '医疗健康', 'health', 'heart', '健康咨询、医学信息', 108, true, 'chat'),

-- 创作服务类
('11111111-1111-1111-1111-111111111109', '文案写作', 'copywriting', 'pencil-square', '营销文案、内容创作', 109, true, 'chat'),
('11111111-1111-1111-1111-111111111110', '翻译语言', 'translation', 'language', '多语言翻译、语言学习', 110, true, 'chat'),
('11111111-1111-1111-1111-111111111111', '教育辅导', 'education', 'book-open', '教学助手、知识解释', 111, true, 'chat'),
('11111111-1111-1111-1111-111111111112', '心理咨询', 'psychology', 'heart', '情感支持、心理疏导', 112, true, 'chat');

-- 🎨 图像提示词（Image）- 15个分类
INSERT INTO categories (id, name, name_en, icon, description, sort_order, is_active, type) VALUES
-- 摄影风格类
('22222222-2222-2222-2222-222222222201', '真实摄影', 'realistic_photo', 'camera', '写实摄影、纪实风格', 201, true, 'image'),
('22222222-2222-2222-2222-222222222202', '人像摄影', 'portrait', 'user', '肖像拍摄、人物特写', 202, true, 'image'),
('22222222-2222-2222-2222-222222222203', '风景摄影', 'landscape', 'photo', '自然风光、城市景观', 203, true, 'image'),
('22222222-2222-2222-2222-222222222204', '产品摄影', 'product', 'cube', '商品拍摄、静物摄影', 204, true, 'image'),

-- 艺术创作类
('22222222-2222-2222-2222-222222222205', '艺术绘画', 'art_painting', 'paint-brush', '传统绘画、油画水彩', 205, true, 'image'),
('22222222-2222-2222-2222-222222222206', '动漫插画', 'anime', 'sparkles', '二次元、卡通风格', 206, true, 'image'),
('22222222-2222-2222-2222-222222222207', '抽象艺术', 'abstract', 'swatch', '现代艺术、概念设计', 207, true, 'image'),
('22222222-2222-2222-2222-222222222208', '数字艺术', 'digital_art', 'computer-desktop', 'CG艺术、数字绘画', 208, true, 'image'),

-- 设计应用类
('22222222-2222-2222-2222-222222222209', 'Logo设计', 'logo', 'identification', '品牌标识、图标设计', 209, true, 'image'),
('22222222-2222-2222-2222-222222222210', '海报设计', 'poster', 'document-text', '宣传海报、平面设计', 210, true, 'image'),
('22222222-2222-2222-2222-222222222211', '时尚设计', 'fashion', 'sparkles', '服装设计、时尚造型', 211, true, 'image'),
('22222222-2222-2222-2222-222222222212', '建筑空间', 'architecture', 'building-office', '建筑设计、室内设计', 212, true, 'image'),

-- 特殊效果类
('22222222-2222-2222-2222-222222222213', '概念设计', 'concept', 'light-bulb', '概念图、设定画', 213, true, 'image'),
('22222222-2222-2222-2222-222222222214', '科幻奇幻', 'sci_fi', 'rocket-launch', '科幻场景、奇幻世界', 214, true, 'image'),
('22222222-2222-2222-2222-222222222215', '复古怀旧', 'vintage', 'clock', '复古风格、怀旧色调', 215, true, 'image');

-- 🎬 视频提示词（Video）- 12个分类
INSERT INTO categories (id, name, name_en, icon, description, sort_order, is_active, type) VALUES
-- 内容创作类
('33333333-3333-3333-3333-333333333301', '故事叙述', 'storytelling', 'book-open', '剧情片、微电影', 301, true, 'video'),
('33333333-3333-3333-3333-333333333302', '纪录片', 'documentary', 'film', '纪实拍摄、专题片', 302, true, 'video'),
('33333333-3333-3333-3333-333333333303', '教学视频', 'tutorial', 'academic-cap', '教程制作、知识分享', 303, true, 'video'),
('33333333-3333-3333-3333-333333333304', '访谈对话', 'interview', 'microphone', '人物访谈、对话节目', 304, true, 'video'),

-- 商业应用类
('33333333-3333-3333-3333-333333333305', '产品展示', 'product_demo', 'cube', '商品演示、功能介绍', 305, true, 'video'),
('33333333-3333-3333-3333-333333333306', '广告营销', 'advertising', 'megaphone', '营销宣传、品牌推广', 306, true, 'video'),
('33333333-3333-3333-3333-333333333307', '企业宣传', 'corporate', 'building-office', '公司介绍、文化展示', 307, true, 'video'),
('33333333-3333-3333-3333-333333333308', '活动记录', 'event', 'calendar', '会议记录、活动拍摄', 308, true, 'video'),

-- 艺术表现类
('33333333-3333-3333-3333-333333333309', '动画特效', 'animation', 'sparkles', '动画制作、特效合成', 309, true, 'video'),
('33333333-3333-3333-3333-333333333310', '音乐视频', 'music_video', 'musical-note', 'MV制作、音乐表演', 310, true, 'video'),
('33333333-3333-3333-3333-333333333311', '艺术短片', 'art_film', 'film', '实验影像、艺术表达', 311, true, 'video'),

-- 生活记录类
('33333333-3333-3333-3333-333333333312', '自然风景', 'nature', 'photo', '风光摄影、延时拍摄', 312, true, 'video');

-- =============================================
-- 4. 创建分类映射表并更新现有提示词
-- =============================================

-- 创建临时映射表，将旧分类ID映射到新分类ID
CREATE TEMP TABLE category_id_mapping AS
SELECT old_id::uuid, new_id::uuid, old_name, new_name FROM (VALUES
    -- 基于现有分类的智能映射
    ('cfdcf4df-7b94-4903-a484-31116a309a37', '11111111-1111-1111-1111-111111111101', '通用', '通用对话'),
    ('c962b0ec-20d9-46d9-9b99-0e56dcf7c50c', '11111111-1111-1111-1111-111111111104', '学术', '学术研究'),
    ('71a767ba-15b3-4003-b72c-e42685b89c2d', '11111111-1111-1111-1111-111111111106', '职业', '商业咨询'),
    ('feea81ca-677a-4ff5-9688-deae8f7f1306', '11111111-1111-1111-1111-111111111109', '文案', '文案写作'),
    ('fa8debdc-72d1-4395-819e-c76a7a90513d', '11111111-1111-1111-1111-111111111109', '写作', '文案写作'),
    ('a2d062c1-5216-42ff-b048-09e35ffe7198', '22222222-2222-2222-2222-222222222209', '设计', 'Logo设计'),
    ('23742fa9-3f81-4a50-ae04-096ce802bc2f', '22222222-2222-2222-2222-222222222205', '绘画', '艺术绘画'),
    ('215dd466-042d-424a-8d67-a410e84a4f95', '33333333-3333-3333-3333-333333333310', '音乐', '音乐视频'),
    ('6898e83f-539c-4684-af17-8441fe62f1c0', '11111111-1111-1111-1111-111111111105', '编程', '编程开发'),
    ('89402d80-077a-4f46-801f-9d7e98e81ac7', '11111111-1111-1111-1111-111111111105', '科技', '编程开发'),
    ('1baed622-35a7-4025-8dd7-5d95f0d53f96', '11111111-1111-1111-1111-111111111110', '翻译', '翻译语言'),
    ('dd2d1297-4ef6-40f6-a39f-5d7811ce69fd', '11111111-1111-1111-1111-111111111106', '商业', '商业咨询'),
    ('51214a84-74f4-41df-94ad-37e7eb660664', '11111111-1111-1111-1111-111111111106', '金融', '商业咨询'),
    ('5b947f18-bfaf-4e6d-b941-8138349efffa', '11111111-1111-1111-1111-111111111106', '办公', '商业咨询'),
    ('d5fe293f-ced2-43d4-9ad6-0b1ae03c5feb', '11111111-1111-1111-1111-111111111111', '教育', '教育辅导'),
    ('ba16cefa-86a3-4737-bc07-77ae854b8de9', '11111111-1111-1111-1111-111111111101', '生活', '通用对话'),
    ('515ed327-88f9-4b2a-a098-88bbf4d26bc4', '11111111-1111-1111-1111-111111111108', '健康', '医疗健康'),
    ('83bf26fd-7315-431c-99a7-5e2f41f00cb3', '11111111-1111-1111-1111-111111111101', '娱乐', '通用对话'),
    ('6ff5b845-3e76-4d06-b357-b3934fa84e2a', '11111111-1111-1111-1111-111111111103', '游戏', '角色扮演'),
    ('f0180954-90fd-42fe-925a-9ac962fe6684', '33333333-3333-3333-3333-333333333301', '视频', '故事叙述'),
    ('4d9fa8ca-7880-4901-9d61-319a466caf50', '33333333-3333-3333-3333-333333333304', '播客', '访谈对话'),
    ('69b5270d-166e-4f6a-90a4-0aaf71eaf78c', '11111111-1111-1111-1111-111111111112', '情感', '心理咨询')
) AS mapping(old_id, new_id, old_name, new_name);

-- 更新prompts表中的category_id
UPDATE prompts
SET category_id = mapping.new_id
FROM category_id_mapping mapping
WHERE prompts.category_id = mapping.old_id;

-- 更新prompt_versions表中的category_id
UPDATE prompt_versions
SET category_id = mapping.new_id
FROM category_id_mapping mapping
WHERE prompt_versions.category_id = mapping.old_id;

-- 对于没有映射的提示词，设置为默认的通用对话分类
UPDATE prompts
SET category_id = '11111111-1111-1111-1111-111111111101'::uuid
WHERE category_id NOT IN (SELECT id FROM categories);

UPDATE prompt_versions
SET category_id = '11111111-1111-1111-1111-111111111101'::uuid
WHERE category_id NOT IN (SELECT id FROM categories);

-- =============================================
-- 5. 重新创建外键约束
-- =============================================

-- 重新添加外键约束
ALTER TABLE prompts
ADD CONSTRAINT prompts_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE prompt_versions
ADD CONSTRAINT prompt_versions_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id);

-- =============================================
-- 6. 重新创建优化的视图
-- =============================================

-- 先删除现有视图以避免列结构冲突
DROP VIEW IF EXISTS category_stats CASCADE;
DROP VIEW IF EXISTS category_type_stats CASCADE;

-- 创建分类统计视图
CREATE VIEW category_stats AS
SELECT
    c.id,
    c.name,
    c.name_en,
    c.type,
    c.icon,
    c.description,
    c.sort_order,
    COUNT(p.id) as prompt_count,
    COUNT(CASE WHEN p.is_public = true THEN 1 END) as public_count,
    COUNT(CASE WHEN p.is_public = false THEN 1 END) as private_count
FROM categories c
LEFT JOIN prompts p ON c.id = p.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.name_en, c.type, c.icon, c.description, c.sort_order
ORDER BY c.sort_order;

-- 创建按类型分组的统计视图
CREATE VIEW category_type_stats AS
SELECT
    type,
    COUNT(*) as category_count,
    SUM(prompt_count) as total_prompts,
    SUM(public_count) as total_public,
    SUM(private_count) as total_private
FROM category_stats
GROUP BY type
ORDER BY
    CASE type
        WHEN 'chat' THEN 1
        WHEN 'image' THEN 2
        WHEN 'video' THEN 3
        ELSE 4
    END;

-- 创建带分类类型的提示词视图
CREATE VIEW prompts_with_category_type AS
SELECT
    p.*,
    c.name as category_name,
    c.name_en as category_name_en,
    c.type as category_type,
    c.icon as category_icon
FROM prompts p
LEFT JOIN categories c ON p.category_id = c.id;

-- =============================================
-- 7. 数据验证和报告
-- =============================================

-- 验证数据完整性
DO $$
DECLARE
    total_categories INTEGER;
    chat_categories INTEGER;
    image_categories INTEGER;
    video_categories INTEGER;
    orphaned_prompts INTEGER;
BEGIN
    -- 统计分类数量
    SELECT COUNT(*) INTO total_categories FROM categories WHERE is_active = true;
    SELECT COUNT(*) INTO chat_categories FROM categories WHERE type = 'chat' AND is_active = true;
    SELECT COUNT(*) INTO image_categories FROM categories WHERE type = 'image' AND is_active = true;
    SELECT COUNT(*) INTO video_categories FROM categories WHERE type = 'video' AND is_active = true;

    -- 检查孤立的提示词
    SELECT COUNT(*) INTO orphaned_prompts
    FROM prompts p
    WHERE p.category_id NOT IN (SELECT id FROM categories);

    -- 输出验证报告
    RAISE NOTICE '=== 分类系统重构完成 ===';
    RAISE NOTICE '总分类数: % (预期: 39)', total_categories;
    RAISE NOTICE '对话分类: % (预期: 12)', chat_categories;
    RAISE NOTICE '图像分类: % (预期: 15)', image_categories;
    RAISE NOTICE '视频分类: % (预期: 12)', video_categories;
    RAISE NOTICE '孤立提示词: % (应为: 0)', orphaned_prompts;

    -- 如果数据不符合预期，抛出错误
    IF total_categories != 39 OR chat_categories != 12 OR image_categories != 15 OR video_categories != 12 OR orphaned_prompts > 0 THEN
        RAISE EXCEPTION '数据验证失败，请检查分类配置';
    END IF;

    RAISE NOTICE '✅ 所有验证通过，分类系统重构成功！';
END $$;

-- 提交事务
COMMIT;

-- =============================================
-- 8. 清理备份表（可选，建议保留一段时间）
-- =============================================

-- 如果确认无误，可以删除备份表
-- DROP TABLE IF EXISTS categories_backup;
-- DROP TABLE IF EXISTS prompts_category_backup;

-- 显示最终统计
SELECT '=== 最终分类统计 ===' as report;
SELECT * FROM category_type_stats;
SELECT '=== 各分类详情 ===' as report;
SELECT type, name, name_en, prompt_count FROM category_stats ORDER BY sort_order;
