-- 协作编辑数据库迁移
-- 创建协作会话表
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建协作参与者表
CREATE TABLE IF NOT EXISTS collaborative_participants (
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position TEXT, -- JSON格式存储光标位置
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (session_id, user_id)
);

-- 创建协作操作表
CREATE TABLE IF NOT EXISTS collaborative_operations (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('insert', 'delete', 'replace')),
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position TEXT -- JSON格式存储光标位置
);

-- 创建协作锁定表
CREATE TABLE IF NOT EXISTS collaborative_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建协作冲突表
CREATE TABLE IF NOT EXISTS collaborative_conflicts (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  operation_id TEXT NOT NULL,
  conflicting_operation_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_by UUID REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建协作版本表
CREATE TABLE IF NOT EXISTS collaborative_versions (
  id TEXT PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  message TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  changes_summary TEXT, -- JSON格式存储变更统计
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, version_number)
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_collaborative_sessions_prompt_id ON collaborative_sessions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_sessions_active ON collaborative_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_collaborative_participants_session_id ON collaborative_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_participants_user_id ON collaborative_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_participants_active ON collaborative_participants(is_active);
CREATE INDEX IF NOT EXISTS idx_collaborative_operations_session_id ON collaborative_operations(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_operations_timestamp ON collaborative_operations(timestamp);
CREATE INDEX IF NOT EXISTS idx_collaborative_locks_session_id ON collaborative_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_locks_active ON collaborative_locks(is_active);
CREATE INDEX IF NOT EXISTS idx_collaborative_conflicts_session_id ON collaborative_conflicts(session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_conflicts_status ON collaborative_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_collaborative_versions_prompt_id ON collaborative_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_versions_created_at ON collaborative_versions(created_at);

-- 添加提示词表的版本字段（如果不存在）
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;

-- 创建自动更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_collaborative_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collaborative_sessions 
  SET last_activity = NOW() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为协作操作创建触发器
DROP TRIGGER IF EXISTS trigger_update_session_activity_on_operation ON collaborative_operations;
CREATE TRIGGER trigger_update_session_activity_on_operation
  AFTER INSERT ON collaborative_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborative_session_activity();

-- 为参与者活动创建触发器
DROP TRIGGER IF EXISTS trigger_update_session_activity_on_participant ON collaborative_participants;
CREATE TRIGGER trigger_update_session_activity_on_participant
  AFTER UPDATE ON collaborative_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborative_session_activity();

-- 创建清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- 插入示例数据（可选）
-- INSERT INTO collaborative_sessions (prompt_id, created_by) 
-- SELECT id, user_id FROM prompts LIMIT 1;

COMMENT ON TABLE collaborative_sessions IS '协作编辑会话表';
COMMENT ON TABLE collaborative_participants IS '协作参与者表';
COMMENT ON TABLE collaborative_operations IS '协作操作记录表';
COMMENT ON TABLE collaborative_locks IS '协作区域锁定表';
COMMENT ON TABLE collaborative_conflicts IS '协作冲突记录表';
COMMENT ON TABLE collaborative_versions IS '协作版本历史表'; 