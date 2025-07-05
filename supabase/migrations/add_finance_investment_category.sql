-- =============================================
-- 添加"金融投资"对话分类
-- 在现有数据库中执行此脚本以添加新的金融投资分类
-- =============================================

-- 1. 更新prompt_category枚举类型（如果存在）
DO $$
BEGIN
  -- 检查枚举类型是否存在
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_category') THEN
    -- 添加新的枚举值（如果不存在）
    BEGIN
      ALTER TYPE prompt_category ADD VALUE IF NOT EXISTS '金融投资';
    EXCEPTION
      WHEN duplicate_object THEN
        -- 如果值已存在，忽略错误
        NULL;
    END;
  END IF;
END $$;

-- 2. 添加"金融投资"分类到categories表
-- 检查分类是否已存在，如果不存在则添加
INSERT INTO categories (name, name_en, icon, description, sort_order, type, is_active, created_at, updated_at)
SELECT 
  '金融投资',
  'finance-investment', 
  'currency-dollar',
  '金融分析、投资策略、理财规划、风险评估类提示词',
  95,
  'chat',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '金融投资' AND type = 'chat'
);

-- 3. 验证插入结果
SELECT
  id,
  name,
  name_en,
  icon,
  description,
  sort_order,
  type,
  is_active,
  created_at
FROM categories
WHERE name = '金融投资' AND type = 'chat';

-- 4. 显示所有对话类型分类的排序情况（验证排序是否正确）
SELECT
  name,
  name_en,
  sort_order,
  is_active
FROM categories
WHERE type = 'chat' AND is_active = true
ORDER BY sort_order;

-- 5. 统计信息
SELECT
  type,
  COUNT(*) as category_count
FROM categories
WHERE is_active = true
GROUP BY type
ORDER BY type;
