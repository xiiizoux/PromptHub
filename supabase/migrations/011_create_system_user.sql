-- =============================================
-- Migration 011: Create System User for MCP Service
-- 创建MCP服务的系统用户
-- 创建时间: 2025-06-20
-- =============================================

-- 创建系统用户记录
-- 由于users表引用auth.users，我们需要特殊处理系统用户

DO $$
DECLARE
    system_user_id UUID := '00000000-0000-5000-8000-000000000001';
    system_email TEXT := 'system@mcp-server.local';
BEGIN
    -- 检查系统用户是否已存在
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = system_user_id) THEN
        -- 在auth.users中创建系统用户记录
        -- 注意：这是一个特殊的系统用户，不用于实际登录
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            system_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            system_email,
            crypt('system-user-no-login', gen_salt('bf')), -- 无法登录的密码
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "system", "providers": ["system"]}',
            '{"display_name": "MCP System User", "system_user": true}',
            false,
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE '✅ 系统用户已创建在 auth.users 表中';
    ELSE
        RAISE NOTICE 'ℹ️  系统用户已存在于 auth.users 表中';
    END IF;
    
    -- 检查并创建users表中的记录
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = system_user_id) THEN
        INSERT INTO users (
            id,
            email,
            display_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            system_user_id,
            system_email,
            'MCP System User',
            'system',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ 系统用户已创建在 users 表中';
    ELSE
        RAISE NOTICE 'ℹ️  系统用户已存在于 users 表中';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 系统用户创建完成：';
    RAISE NOTICE '• 用户ID: %', system_user_id;
    RAISE NOTICE '• 邮箱: %', system_email;
    RAISE NOTICE '• 用途: MCP服务系统操作';
    RAISE NOTICE '• 注意: 此用户无法用于正常登录';
    
EXCEPTION
    WHEN others THEN
        RAISE WARNING '❌ 创建系统用户时出错: %', SQLERRM;
        RAISE NOTICE '💡 如果遇到权限问题，请在Supabase控制台的SQL编辑器中手动执行此脚本';
END $$;

-- 添加迁移注释
COMMENT ON SCHEMA public IS 'Migration 011: 为MCP服务创建系统用户，解决UUID格式问题';
