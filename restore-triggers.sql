-- ===================================
-- 恢复用户触发器
-- ===================================

-- 启用所有之前禁用的用户触发器
DO $$ 
DECLARE
    trigger_rec RECORD;
    enabled_count INT := 0;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'prompts'
          AND tgname NOT LIKE 'RI_ConstraintTrigger%'
          AND tgname NOT LIKE 'pg_%'
          AND tgenabled = 'D'  -- 只处理已禁用的触发器
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE prompts ENABLE TRIGGER %I', trigger_rec.tgname);
            enabled_count := enabled_count + 1;
            RAISE NOTICE '✓ 已启用触发器: %', trigger_rec.tgname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '✗ 无法启用触发器 %: %', trigger_rec.tgname, SQLERRM;
        END;
    END LOOP;
    
    IF enabled_count = 0 THEN
        RAISE NOTICE '没有需要启用的触发器';
    ELSE
        RAISE NOTICE '共启用了 % 个触发器', enabled_count;
    END IF;
END $$;

-- 验证结果
SELECT 
    tgname AS trigger_name,
    CASE tgenabled
        WHEN 'D' THEN '已禁用'
        WHEN 'O' THEN '已启用 ✓'
        ELSE '其他'
    END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'prompts'
  AND tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY tgname;

SELECT '触发器已恢复' AS result;

