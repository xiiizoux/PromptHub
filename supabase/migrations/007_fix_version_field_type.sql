-- 修复版本字段类型 - 支持小数版本号
-- 将version字段从INT改为NUMERIC(3,1)以支持如1.0, 1.1, 6.1等小数版本

-- 修改prompts表的version字段类型
ALTER TABLE prompts ALTER COLUMN version TYPE NUMERIC(3,1);

-- 修改prompt_versions表的version字段类型
ALTER TABLE prompt_versions ALTER COLUMN version TYPE NUMERIC(3,1);

-- 修改prompt_usage表的prompt_version字段类型
ALTER TABLE prompt_usage ALTER COLUMN prompt_version TYPE NUMERIC(3,1);

-- 修改prompt_performance表的prompt_version字段类型
ALTER TABLE prompt_performance ALTER COLUMN prompt_version TYPE NUMERIC(3,1);

-- 修改prompt_ab_tests表的version_a和version_b字段类型
ALTER TABLE prompt_ab_tests ALTER COLUMN version_a TYPE NUMERIC(3,1);
ALTER TABLE prompt_ab_tests ALTER COLUMN version_b TYPE NUMERIC(3,1);

-- 更新现有数据，将整数版本转换为小数格式
-- 例如：版本1转换为1.0，版本2转换为2.0
UPDATE prompts 
SET version = CASE 
  WHEN version < 10 THEN version::NUMERIC(3,1)
  ELSE version::NUMERIC(3,1) / 10
END
WHERE version IS NOT NULL;

UPDATE prompt_versions 
SET version = CASE 
  WHEN version < 10 THEN version::NUMERIC(3,1)
  ELSE version::NUMERIC(3,1) / 10
END
WHERE version IS NOT NULL;

UPDATE prompt_usage 
SET prompt_version = CASE 
  WHEN prompt_version < 10 THEN prompt_version::NUMERIC(3,1)
  ELSE prompt_version::NUMERIC(3,1) / 10
END
WHERE prompt_version IS NOT NULL;

UPDATE prompt_performance 
SET prompt_version = CASE 
  WHEN prompt_version < 10 THEN prompt_version::NUMERIC(3,1)
  ELSE prompt_version::NUMERIC(3,1) / 10
END
WHERE prompt_version IS NOT NULL;

UPDATE prompt_ab_tests 
SET version_a = CASE 
  WHEN version_a < 10 THEN version_a::NUMERIC(3,1)
  ELSE version_a::NUMERIC(3,1) / 10
END,
version_b = CASE 
  WHEN version_b < 10 THEN version_b::NUMERIC(3,1)
  ELSE version_b::NUMERIC(3,1) / 10
END
WHERE version_a IS NOT NULL AND version_b IS NOT NULL;

-- 添加注释说明新的版本字段格式
COMMENT ON COLUMN prompts.version IS '版本号，支持一位小数格式（如1.0, 1.1, 6.1）';
COMMENT ON COLUMN prompt_versions.version IS '版本号，支持一位小数格式（如1.0, 1.1, 6.1）';
COMMENT ON COLUMN prompt_usage.prompt_version IS '提示词版本号，支持一位小数格式（如1.0, 1.1, 6.1）';
COMMENT ON COLUMN prompt_performance.prompt_version IS '提示词版本号，支持一位小数格式（如1.0, 1.1, 6.1）';
COMMENT ON COLUMN prompt_ab_tests.version_a IS 'A版本号，支持一位小数格式（如1.0, 1.1, 6.1）';
COMMENT ON COLUMN prompt_ab_tests.version_b IS 'B版本号，支持一位小数格式（如1.0, 1.1, 6.1）'; 