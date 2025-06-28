# 添加"金融投资"对话分类

## 概述

本文档说明如何在PromptHub数据库中添加新的"金融投资"对话分类。

## 背景

根据用户需求，需要在现有的对话分类中添加一个专门的"金融投资"分类，用于存放金融分析、投资策略、理财规划、风险评估等相关的提示词。

## 实施步骤

### 1. 执行SQL脚本

在Supabase SQL编辑器中执行以下脚本：

```sql
-- 文件位置：supabase/add_finance_investment_category.sql
```

该脚本会：
- 更新`prompt_category`枚举类型（如果存在）
- 在`categories`表中添加新的"金融投资"分类
- 验证插入结果并显示统计信息

### 2. 分类详细信息

- **名称**：金融投资
- **英文名称**：finance-investment
- **图标**：currency-dollar
- **描述**：金融分析、投资策略、理财规划、风险评估类提示词
- **排序**：95（位于"商业"和"办公"之间）
- **类型**：chat（对话类型）

### 3. 相关文件更新

以下文件已经更新以支持新分类：

1. **supabase/schema.sql** - 主数据库结构文件
   - 更新了`prompt_category`枚举类型
   - 在分类插入语句中添加了新分类

2. **web/src/services/qualityAnalyzer.ts** - 质量分析服务
   - 添加了"金融投资"分类的关键词映射

## 验证

执行SQL脚本后，可以通过以下查询验证分类是否正确添加：

```sql
-- 查看新添加的分类
SELECT * FROM categories WHERE name = '金融投资' AND type = 'chat';

-- 查看所有对话分类的排序
SELECT name, sort_order FROM categories 
WHERE type = 'chat' AND is_active = true 
ORDER BY sort_order;
```

## 注意事项

1. 该脚本使用了`IF NOT EXISTS`条件，可以安全地重复执行
2. 新分类的排序值为95，确保它在"商业"（90）和"办公"（100）之间
3. 所有相关的代码文件都已更新，无需额外的代码修改

## 影响范围

- 数据库：添加新的分类记录
- 前端：分类选择器将自动显示新分类
- MCP服务：分类获取API将返回新分类
- 质量分析：支持新分类的关键词分析
