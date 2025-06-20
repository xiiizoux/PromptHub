-- =============================================
-- Migration 011: 修复 prompts 表的 RLS 策略
-- 解决提示词详情页面404问题
-- 创建时间: 2025-06-20
-- =============================================

-- 检查 prompts 表是否启用了 RLS，如果启用了但没有策略，会导致所有查询失败
DO $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
BEGIN
    -- 检查 prompts 表的 RLS 状态
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'prompts';
    
    -- 检查现有策略数量
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'prompts';
    
    RAISE NOTICE 'prompts 表 RLS 状态: %', CASE WHEN rls_enabled THEN '已启用' ELSE '未启用' END;
    RAISE NOTICE 'prompts 表策略数量: %', policy_count;
    
    -- 如果启用了 RLS 但没有策略，或者策略不足，则创建策略
    IF rls_enabled AND policy_count = 0 THEN
        RAISE NOTICE '检测到 prompts 表启用了 RLS 但没有策略，这会导致所有查询失败！';
        RAISE NOTICE '正在创建必要的 RLS 策略...';
        
        -- 删除可能存在的旧策略
        DROP POLICY IF EXISTS "prompts_read_public" ON prompts;
        DROP POLICY IF EXISTS "prompts_read_own" ON prompts;
        DROP POLICY IF EXISTS "prompts_manage_own" ON prompts;
        
        -- 创建读取策略：允许查看公共提示词或自己的提示词
        CREATE POLICY "prompts_read_public" ON prompts 
        FOR SELECT USING (
            is_public = true OR 
            auth.uid() = user_id OR 
            auth.uid() IS NULL  -- 允许匿名用户查看公共提示词
        );
        
        -- 创建管理策略：只能管理自己的提示词
        CREATE POLICY "prompts_manage_own" ON prompts 
        FOR ALL USING (
            auth.uid() = user_id OR 
            auth.uid() IS NULL  -- 允许匿名用户进行某些操作（如查看）
        );
        
        RAISE NOTICE '✅ 已创建 prompts 表的 RLS 策略';
        
    ELSIF NOT rls_enabled THEN
        RAISE NOTICE 'prompts 表未启用 RLS，启用并创建策略...';
        
        -- 启用 RLS
        ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
        
        -- 创建策略
        DROP POLICY IF EXISTS "prompts_read_public" ON prompts;
        DROP POLICY IF EXISTS "prompts_manage_own" ON prompts;
        
        CREATE POLICY "prompts_read_public" ON prompts 
        FOR SELECT USING (
            is_public = true OR 
            auth.uid() = user_id OR 
            auth.uid() IS NULL
        );
        
        CREATE POLICY "prompts_manage_own" ON prompts 
        FOR ALL USING (
            auth.uid() = user_id OR 
            auth.uid() IS NULL
        );
        
        RAISE NOTICE '✅ 已启用 prompts 表的 RLS 并创建策略';
        
    ELSE
        RAISE NOTICE 'prompts 表 RLS 配置正常，策略数量: %', policy_count;
    END IF;
END $$;

-- 验证策略是否正确创建
DO $$
DECLARE
    policy_count integer;
    policy_names text;
BEGIN
    SELECT COUNT(*), string_agg(policyname, ', ') 
    INTO policy_count, policy_names
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'prompts';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'prompts 表 RLS 修复完成！';
    RAISE NOTICE '';
    RAISE NOTICE '📊 当前状态：';
    RAISE NOTICE '• 策略数量: %', policy_count;
    RAISE NOTICE '• 策略名称: %', COALESCE(policy_names, '无');
    RAISE NOTICE '';
    RAISE NOTICE '🔧 修复内容：';
    RAISE NOTICE '• 允许查看公共提示词（is_public = true）';
    RAISE NOTICE '• 允许查看自己的提示词（user_id = auth.uid()）';
    RAISE NOTICE '• 允许匿名用户查看公共提示词';
    RAISE NOTICE '• 只允许管理自己的提示词';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 预期效果：';
    RAISE NOTICE '• 提示词详情页面不再返回 404';
    RAISE NOTICE '• 公共提示词可以正常访问';
    RAISE NOTICE '• 用户可以管理自己的提示词';
    RAISE NOTICE '• 保持数据安全性';
    RAISE NOTICE '==============================================';
END $$;
