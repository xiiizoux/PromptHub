-- 添加提示词权限管理字段
-- Migration: 20241201_add_prompt_permissions

-- 扩展prompts表，添加权限相关字段
-- 注意：is_public字段已存在，只添加新字段
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS allow_collaboration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_permission VARCHAR(20) DEFAULT 'owner_only',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id);

-- 为现有数据设置created_by字段（使用user_id字段的值）
UPDATE prompts 
SET created_by = user_id 
WHERE created_by IS NULL AND user_id IS NOT NULL;

-- 创建协作者表
CREATE TABLE IF NOT EXISTS prompt_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'edit' CHECK (permission_level IN ('edit', 'review', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS prompt_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_prompts_allow_collaboration ON prompts(allow_collaboration);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_edit_permission ON prompts(edit_permission);
CREATE INDEX IF NOT EXISTS idx_prompt_collaborators_prompt_id ON prompt_collaborators(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_collaborators_user_id ON prompt_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_prompt_id ON prompt_audit_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_user_id ON prompt_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_logs_created_at ON prompt_audit_logs(created_at);

-- 添加RLS (Row Level Security) 策略
ALTER TABLE prompt_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_audit_logs ENABLE ROW LEVEL SECURITY;

-- 协作者表的RLS策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_collaborators' AND policyname = 'Users can view their own collaborations') THEN
    CREATE POLICY "Users can view their own collaborations" ON prompt_collaborators
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_collaborators' AND policyname = 'Prompt owners can manage collaborators') THEN
    CREATE POLICY "Prompt owners can manage collaborators" ON prompt_collaborators
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM prompts 
          WHERE prompts.id = prompt_collaborators.prompt_id 
          AND (prompts.created_by = auth.uid() OR prompts.user_id = auth.uid())
        )
      );
  END IF;
END $$;

-- 审计日志的RLS策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_audit_logs' AND policyname = 'Users can view audit logs for their prompts') THEN
    CREATE POLICY "Users can view audit logs for their prompts" ON prompt_audit_logs
      FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM prompts 
          WHERE prompts.id = prompt_audit_logs.prompt_id 
          AND (prompts.created_by = auth.uid() OR prompts.user_id = auth.uid())
        )
      );
  END IF;
END $$;

-- 更新现有prompts表的RLS策略
-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;

-- 新的RLS策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Public prompts are viewable by everyone') THEN
    CREATE POLICY "Public prompts are viewable by everyone" ON prompts
      FOR SELECT USING (is_public = true OR created_by = auth.uid() OR user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can insert their own prompts') THEN
    CREATE POLICY "Users can insert their own prompts" ON prompts
      FOR INSERT WITH CHECK (created_by = auth.uid() OR user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can update their own prompts or collaborate') THEN
    CREATE POLICY "Users can update their own prompts or collaborate" ON prompts
      FOR UPDATE USING (
        created_by = auth.uid() OR 
        user_id = auth.uid() OR
        (is_public = true AND allow_collaboration = true) OR
        EXISTS (
          SELECT 1 FROM prompt_collaborators 
          WHERE prompt_collaborators.prompt_id = prompts.id 
          AND prompt_collaborators.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can delete their own prompts') THEN
    CREATE POLICY "Users can delete their own prompts" ON prompts
      FOR DELETE USING (created_by = auth.uid() OR user_id = auth.uid());
  END IF;
END $$;

-- 创建函数来记录审计日志
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO prompt_audit_logs (prompt_id, user_id, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'prompt_updated',
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
    -- 更新last_modified_by字段
    NEW.last_modified_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO prompt_audit_logs (prompt_id, user_id, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'prompt_created',
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO prompt_audit_logs (prompt_id, user_id, action, changes)
    VALUES (
      OLD.id,
      auth.uid(),
      'prompt_deleted',
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS prompt_audit_trigger ON prompts;
CREATE TRIGGER prompt_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prompts
  FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 添加注释
COMMENT ON COLUMN prompts.allow_collaboration IS '是否允许协作编辑';
COMMENT ON COLUMN prompts.edit_permission IS '编辑权限级别: owner_only, collaborators, public';
COMMENT ON COLUMN prompts.created_by IS '创建者用户ID（新字段，与user_id字段功能类似）';
COMMENT ON COLUMN prompts.last_modified_by IS '最后修改者用户ID';

COMMENT ON TABLE prompt_collaborators IS '提示词协作者表';
COMMENT ON TABLE prompt_audit_logs IS '提示词操作审计日志表'; 