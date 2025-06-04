-- 删除现有触发器
DROP TRIGGER IF EXISTS prompt_audit_trigger ON prompts;

-- 创建新的BEFORE DELETE触发器
CREATE TRIGGER prompt_audit_trigger_before_delete
  BEFORE DELETE ON prompts
  FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();

-- 保留现有的AFTER INSERT/UPDATE触发器
CREATE TRIGGER prompt_audit_trigger_after_change
  AFTER INSERT OR UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
