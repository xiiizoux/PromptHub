# MCP Prompt Server 数据库结构

MCP Prompt Server使用Supabase作为首选数据库后端，提供完整的关系型数据库支持。本文档详细介绍了数据库表结构和关系。

## 基础表结构

### prompts 表

存储所有提示词的主表，包含基本信息和当前版本内容。

```sql
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,           -- 提示词唯一名称，用于API访问
  description TEXT,                    -- 提示词描述
  category TEXT,                       -- 分类
  tags TEXT[],                         -- 标签数组
  messages JSONB NOT NULL,             -- 提示词内容（符合ChatGPT格式的消息数组）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 创建时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 更新时间
  version INT DEFAULT 1,               -- 当前版本号
  is_public BOOLEAN DEFAULT FALSE      -- 是否公开（预留字段，用于权限控制）
);
```

### prompt_versions 表

存储提示词的所有历史版本，支持版本控制功能。

```sql
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,  -- 关联到prompts表
  version INT NOT NULL,                -- 版本号
  messages JSONB NOT NULL,             -- 该版本的提示词内容
  description TEXT,                    -- 该版本的描述
  tags TEXT[],                         -- 该版本的标签
  category TEXT,                       -- 该版本的分类
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 版本创建时间
  created_by UUID REFERENCES auth.users(id),         -- 创建者（可选，关联到auth.users）
  UNIQUE(prompt_id, version)           -- 确保每个提示词的版本号唯一
);
```

### users 表

用户表，用于身份验证和权限控制。

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,  -- 关联到Supabase认证系统
  email TEXT UNIQUE,                   -- 用户邮箱
  display_name TEXT,                   -- 显示名称
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- 创建时间
);
```

## 性能分析表结构

### prompt_usage 表

记录每次提示词使用的基本信息。

```sql
CREATE TABLE IF NOT EXISTS prompt_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version INT,                     -- 使用的提示词版本
  user_id UUID REFERENCES auth.users(id), -- 可选，关联到用户
  session_id TEXT,                        -- 会话标识符
  model TEXT,                             -- 使用的模型，如"gpt-4"
  input_tokens INT,                       -- 输入token数量
  output_tokens INT,                      -- 输出token数量
  latency_ms INT,                         -- 响应延迟(毫秒)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_metadata JSONB                   -- 客户端信息，如浏览器、设备等
);
```

### prompt_feedback 表

存储用户对提示词生成结果的评价。

```sql
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usage_id UUID REFERENCES prompt_usage(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5), -- 1-5星评分
  feedback_text TEXT,                        -- 文本反馈
  categories TEXT[],                         -- 反馈分类标签
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)     -- 提交反馈的用户
);
```

### prompt_performance 表

存储聚合的性能数据，便于快速查询。

```sql
CREATE TABLE IF NOT EXISTS prompt_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version INT,                      -- 提示词版本
  usage_count INT DEFAULT 0,               -- 使用次数
  avg_rating NUMERIC(3,2),                 -- 平均评分
  avg_latency_ms INT,                      -- 平均响应时间
  avg_input_tokens INT,                    -- 平均输入token数
  avg_output_tokens INT,                   -- 平均输出token数
  feedback_count INT DEFAULT 0,            -- 收到的反馈数量
  last_used_at TIMESTAMP WITH TIME ZONE,   -- 最后使用时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, prompt_version)        -- 添加唯一约束，用于ON CONFLICT子句
);
```

### prompt_ab_tests 表

用于比较不同提示词版本的性能。

```sql
CREATE TABLE IF NOT EXISTS prompt_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                      -- 测试名称
  description TEXT,                        -- 测试描述
  prompt_id UUID REFERENCES prompts(id),   -- 测试的提示词
  version_a INT NOT NULL,                  -- 比较的版本A
  version_b INT NOT NULL,                  -- 比较的版本B
  metric TEXT NOT NULL,                    -- 主要比较指标
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,       -- 测试结束时间
  status TEXT DEFAULT 'active',            -- active, completed, cancelled
  result JSONB,                            -- 测试结果数据
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 索引

为提高查询性能，创建了以下索引：

```sql
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_id ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_created_at ON prompt_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_usage_id ON prompt_feedback(usage_id);
CREATE INDEX IF NOT EXISTS idx_prompt_performance_prompt_id ON prompt_performance(prompt_id, prompt_version);
```

## 触发器

系统使用两个主要触发器自动更新性能数据：

### 使用记录触发器

在添加新的使用记录时自动更新性能汇总：

```sql
CREATE TRIGGER after_prompt_usage_insert
AFTER INSERT ON prompt_usage
FOR EACH ROW
EXECUTE FUNCTION update_prompt_performance();
```

### 反馈记录触发器

在添加新的反馈时更新性能汇总中的评分数据：

```sql
CREATE TRIGGER after_prompt_feedback_insert
AFTER INSERT ON prompt_feedback
FOR EACH ROW
EXECUTE FUNCTION update_prompt_performance_rating();
```

## 表间关系

数据库表之间的关系可以总结为：

- **prompts** ← **prompt_versions**: 一个提示词有多个版本
- **prompts** ← **prompt_usage**: 一个提示词有多次使用记录
- **prompts** ← **prompt_performance**: 一个提示词有多个版本的性能数据
- **prompts** ← **prompt_ab_tests**: 一个提示词可以进行多次A/B测试
- **prompt_usage** ← **prompt_feedback**: 一次使用记录可以有多条反馈

## 初始数据

系统初始化时会创建两个示例提示词：

1. **general_assistant**: 通用助手提示词，用于日常对话和问答
2. **code_assistant**: 代码助手提示词，用于编程和代码相关问题

每个示例提示词都会创建初始版本记录。

## 数据库设置

要设置数据库，请在Supabase SQL编辑器中执行`supabase/schema.sql`脚本。此脚本会创建所有必要的表、索引、触发器和初始数据。
