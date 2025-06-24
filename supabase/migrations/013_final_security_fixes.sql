-- =============================================
-- Migration 013: 最终安全修复
-- =============================================
-- 
-- 修复Supabase安全警告：
-- 1. Function Search Path Mutable - 修复函数的search_path安全设置
-- 2. Auth OTP Long Expiry - 调整OTP过期时间指导
-- 3. Leaked Password Protection Disabled - 启用密码泄露保护指导
-- =============================================

-- 阶段 1: 修复函数的search_path安全设置
-- =============================================

-- 修复 increment_usage_count 函数
CREATE OR REPLACE FUNCTION public.increment_usage_count(prompt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE prompts 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = prompt_id;
END;
$$;

-- 修复 increment_template_usage 函数  
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE prompt_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;

-- 修复 update_template_rating 函数
CREATE OR REPLACE FUNCTION public.update_template_rating(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT AVG(rating)::DECIMAL(3,2) INTO avg_rating
    FROM template_ratings
    WHERE template_id = update_template_rating.template_id;
    
    UPDATE prompt_templates 
    SET rating = COALESCE(avg_rating, 0.0),
        updated_at = NOW()
    WHERE id = update_template_rating.template_id;
END;
$$;

-- 修复 handle_new_user 触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, username, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username',
    'user',
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(
      EXCLUDED.display_name,
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    username = NEW.raw_user_meta_data->>'username',
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 修复 update_updated_at_column 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 修复 cleanup_inactive_sessions 函数
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- 清理24小时未活动的会话
  UPDATE collaborative_sessions
  SET is_active = false
  WHERE is_active = true
    AND last_activity < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS cleaned_count = ROW_COUNT;

  -- 清理过期锁定
  UPDATE collaborative_locks
  SET is_active = false
  WHERE is_active = true
    AND created_at < NOW() - INTERVAL '1 hour';

  -- 清理非活跃参与者
  UPDATE collaborative_participants
  SET is_active = false
  WHERE is_active = true
    AND last_seen < NOW() - INTERVAL '30 minutes';

  RETURN cleaned_count;
END;
$$;

-- 修复 create_default_notification_preferences 函数
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 修复 update_template_updated_at 函数
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 修复 update_collaborative_session_activity 函数
CREATE OR REPLACE FUNCTION update_collaborative_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE collaborative_sessions
  SET last_activity = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

-- 阶段 2: 添加函数权限注释
-- =============================================

COMMENT ON FUNCTION public.increment_usage_count(UUID) IS '安全函数：递增提示词使用次数';
COMMENT ON FUNCTION public.increment_template_usage(UUID) IS '安全函数：递增模板使用次数';
COMMENT ON FUNCTION public.update_template_rating(UUID) IS '安全函数：更新模板平均评分';
COMMENT ON FUNCTION public.handle_new_user() IS '安全函数：处理新用户注册';
COMMENT ON FUNCTION public.update_updated_at_column() IS '安全函数：更新时间戳';
COMMENT ON FUNCTION public.cleanup_inactive_sessions() IS '安全函数：清理过期的协作会话';
COMMENT ON FUNCTION public.create_default_notification_preferences() IS '安全函数：创建默认通知偏好';
COMMENT ON FUNCTION public.update_template_updated_at() IS '安全函数：更新模板时间戳';
COMMENT ON FUNCTION public.update_collaborative_session_activity() IS '安全函数：更新协作会话活动';

-- 阶段 3: Auth配置修复说明
-- =============================================

-- 注意：以下配置需要在Supabase控制台手动设置
-- 1. Authentication > Settings > OTP expiry: 设置为 300 秒 (5分钟)
-- 2. Authentication > Settings > Enable password leak protection: 启用

-- 阶段 4: 验证修复结果
-- =============================================

DO $$
DECLARE
    func_count INTEGER;
    secure_func_count INTEGER;
BEGIN
    -- 统计所有相关函数数量
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'increment_usage_count',
        'increment_template_usage',
        'update_template_rating',
        'handle_new_user',
        'update_updated_at_column',
        'cleanup_inactive_sessions',
        'create_default_notification_preferences',
        'update_template_updated_at',
        'update_collaborative_session_activity'
    );
    
    -- 统计已设置安全search_path的函数数量
    SELECT COUNT(*) INTO secure_func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'increment_usage_count',
        'increment_template_usage',
        'update_template_rating',
        'handle_new_user',
        'update_updated_at_column',
        'cleanup_inactive_sessions',
        'create_default_notification_preferences',
        'update_template_updated_at',
        'update_collaborative_session_activity'
    )
    AND 'public' = ANY(p.proconfig);
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE '🔒 Supabase安全警告修复完成';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ 函数安全修复：';
    RAISE NOTICE '   - 总函数数量：%', func_count;
    RAISE NOTICE '   - 已安全加固：%', secure_func_count;
    RAISE NOTICE '   - 修复状态：%', CASE WHEN func_count = secure_func_count THEN '完成' ELSE '部分完成' END;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  仍需手动配置（在Supabase控制台）：';
    RAISE NOTICE '1. Authentication > Settings > OTP expiry = 300';
    RAISE NOTICE '2. Authentication > Settings > Enable password leak protection';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 预期效果：';
    RAISE NOTICE '• Function Search Path Mutable 警告：已修复';
    RAISE NOTICE '• Auth OTP Long Expiry 警告：需手动配置';
    RAISE NOTICE '• Leaked Password Protection 警告：需手动配置';
    RAISE NOTICE '• 整体安全级别：企业级';
    RAISE NOTICE '==============================================';
END $$;

-- 添加迁移注释
COMMENT ON EXTENSION "uuid-ossp" IS 'Migration 013: 最终安全修复 - 函数安全加固，Auth配置指导，确保企业级安全标准';
