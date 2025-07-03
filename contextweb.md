# PromptHub Web应用改造方案

基于已完成的数据库和MCP架构，我设计了一套全面且可行的PromptHub Web应用改造方案。
总体目标：上下文工程控制中心 (Context Engineering Control Center)
我们的目标是将Web UI从一个简单的提示词库，转变为一个全面的上下文工程控制中心。这将使用户和管理员能够管理、个性化并优化智能提示词和AI Agent的整个生命周期。

## 设计原则

* 基于角色的体验 (Role-Based Experience)：UI应根据用户角色进行调整。
  * 普通用户: 专注于个性化设置和交互历史。
  * 提示词创建者: 提供强大的工具来创建动态提示词。
  * 管理员: 提供系统级的分析和实验管理功能。
* 直观的抽象化 (Intuitive Abstraction)：将JSONB和规则引擎的复杂性隐藏在用户友好的界面（如可视化构建器、结构化表单）之后。
* 渐进式披露 (Progressive Disclosure)：默认显示基本选项，并允许用户展开以查看高级配置。
* 数据驱动的UI (Data-Informed UI)：利用新的分析视图，直接在界面中为创建者和管理员提供可操作的洞察。
*

### 第一阶段：提示词详情页改造

如果用户只能在后台默默地被“个性化”，而无法直观地看到和理解个性化是如何发生的，那么Context Engineering的价值就只实现了一半。改造提示词详情页，让登录用户能看到与自己相关的上下文内容，是提升用户体验、建立信任和发挥新架构全部威力的核心举措。
下面是一个切实可行的改造方案，包含后端API和前端组件的完整实现。
核心目标：打造“为我而生”的提示词详情页
当登录用户查看一个提示词时，页面不仅应展示其通用描述，还应增加一个**“我的上下文”模块，清晰地告诉用户：“这个提示词将会如何为你量身定制”**。

第一步：创建后端API端点
我们需要一个新的API端点，它能安全地获取特定用户与特定提示词相关的所有上下文信息。
文件路径: /web/pages/api/prompts/[id]/my-context.ts (这是一个新文件)
这个API将执行以下操作：

1. 验证用户身份。
2. 根据 promptId 和 userId 从数据库中聚合信息。
3. 查询 user_context_profiles 获取用户偏好。
4. 查询 prompts 表获取提示词自带的公共适应规则。
5. 查询 user_interactions 表获取用户与此提示词的最近交互记录。
6. 返回一个结构化的JSON对象给前端。
unfold_morenote_addNew file: my-context.ts
+72

content_copy

fullscreen

check

 Show full code block
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { db } from '../../../../lib/db'; // 假设这是你的Prisma/DB客户端

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: promptId } = req.query;
  const userId = session.user.id;

  if (typeof promptId !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt ID' });
  }

  try {
    // 1. 获取用户上下文档案
    const userProfile = await db.user_context_profiles.findFirst({
      where: { user_id: userId, is_active: true },
      select: { preferences: true, context_data: true },
    });

    // 2. 获取提示词的公共适应规则
    const prompt = await db.prompts.findUnique({
      where: { id: promptId },
      select: { adaptation_rules: true },
    });

    // 3. 获取用户与此提示词的最近5次交互
    const recentInteractions = await db.user_interactions.findMany({
      where: {
        user_id: userId,
        prompt_id: promptId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 5,
      select: {
        created_at: true,
        interaction_data: true, // 包含输入和输出的JSONB
      },
    });

    const responseData = {
      userPreferences: userProfile?.preferences || {},
      promptRules: prompt?.adaptation_rules || [],
      recentInteractions: recentInteractions.map(interaction => ({
        timestamp: interaction.created_at,
        // 假设 interaction_data 结构为 { input: '...', output: '...' }
        input: (interaction.interaction_data as any)?.input,
        output: (interaction.interaction_data as any)?.output,
      })),
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`Error fetching user context for prompt ${promptId}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

第二步：设计并实现前端UI组件

现在，我们创建一个新的React组件来展示从上述API获取的数据。这个组件将只在用户登录时显示。
文件路径: /web/components/prompts/UserPromptContext.tsx (这是一个新文件)
这个组件将包含一个选项卡界面，使用户可以轻松地在不同类型的上下文信息之间切换。
unfold_morenote_addNew file: UserPromptContext.tsx
+110

content_copy

fullscreen

check

 Show full code block
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

interface UserPromptContextProps {
  promptId: string;
  isLoggedIn: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    if (res.status === 401) return null; // 用户未登录，正常处理
    throw new Error('Failed to fetch user context');
  }
  return res.json();
});

const TABS = ['个性化预览', '最近交互', '适用规则'];

export default function UserPromptContext({ promptId, isLoggedIn }: UserPromptContextProps) {
  const { data, error } = useSWR(isLoggedIn ? `/api/prompts/${promptId}/my-context` : null, fetcher);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  if (!isLoggedIn) {
    return null; // 未登录用户不显示此组件
  }

  if (error) {
    return <div className="p-4 my-4 border border-red-200 bg-red-50 rounded-md">加载您的个性化信息时出错。</div>;
  }

  if (!data) {
    return <div className="p-4 my-4 border border-gray-200 bg-gray-50 rounded-md">正在加载您的个性化信息...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case '个性化预览':
        return (
          <div>
            <h4 className="font-semibold">您的偏好设置</h4>
            {Object.keys(data.userPreferences).length > 0 ? (
              <pre className="p-2 mt-2 bg-gray-100 rounded text-sm">
                {JSON.stringify(data.userPreferences, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-500 mt-2">您尚未设置个人偏好。前往“账户设置”进行配置。</p>
            )}
            <p className="text-xs text-gray-600 mt-2">这些设置将用于动态调整提示词，以更好地满足您的需求。</p>
          </div>
        );
      case '最近交互':
        return (
          <div>
            {data.recentInteractions.length > 0 ? (
              <ul className="space-y-3">
                {data.recentInteractions.map((item: any, index: number) => (
                  <li key={index} className="p-2 border-b border-gray-200">
                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                    <p className="font-mono text-sm truncate"><strong>输入:</strong> {item.input}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">您还没有使用过这个提示词。</p>
            )}
          </div>
        );
      case '适用规则':
        return (
          <div>
            <h4 className="font-semibold">提示词内置规则</h4>
            {data.promptRules.length > 0 ? (
              <pre className="p-2 mt-2 bg-gray-100 rounded text-sm">
                {JSON.stringify(data.promptRules, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-500">此提示词没有内置的公共适应规则。</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="my-6 p-4 border border-blue-200 bg-blue-50 rounded-lg shadow-sm">
      <h3 className="text-lg font-bold text-blue-800 mb-3">🚀 我的上下文</h3>
      <div className="border-b border-gray-300 mb-4">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
}

第三步：在提示词详情页中集成新组件

最后，在你现有的提示词详情页（例如 /web/pages/prompts/[id].tsx）中，导入并使用这个新组件。
unfold_moretsx

content_copy

add

 Show full code block
// 在你的提示词详情页组件中 (e.g., /web/pages/prompts/[id].tsx)

import { useUser } from '@supabase/auth-helpers-react';
import UserPromptContext from '../../components/prompts/UserPromptContext';
// ... 其他导入

export default function PromptDetailPage({ prompt }) {
  const user = useUser();

  return (
    <div>
      {/*... 现有的提示词信息展示 ...*/}
      <h1>{prompt.name}</h1>
      <p>{prompt.description}</p>

      {/* 在这里集成新的上下文组件 */}
      <UserPromptContext promptId={prompt.id} isLoggedIn={!!user} />

      {/* ... 其他页面内容，如评论区等 ... */}
    </div>
  );
}

总结

通过以上三步，我们就成功地将一个静态的提示词详情页，改造成了一个动态的、个性化的、对用户透明的“上下文工程”展示窗口。
这个改造带来了巨大的好处：

* 提升用户信任：用户能清楚地看到系统将如何利用他们的偏好，而不是一个“黑盒”。
* 增强用户参与度：鼓励用户去完善自己的个性化配置，以获得更好的体验。
* 展示产品价值：直观地展示了Context Engineering架构的强大能力，使其不再仅仅是一个后端概念。
* 闭环优化：用户看到自己的交互历史，能更好地理解和优化未来的输入。

### 第二阶段：核心提示词管理界面改造

此阶段专注于更新应用最关键的部分：创建和编辑提示词。

1. 提示词编辑器大修
现有的提示词编辑器（很可能是一个简单的文本区域）需要被一个多功能的组件所取代，该组件能够处理新的 content JSONB 结构。
位置: /prompts/[id]/edit 页面
建议的UI设计:

* 一个 “启用上下文工程” 的切换开关。
  * 关闭时: 显示一个简单的Markdown编辑器，用于编辑 simple_text 或 legacy_text 内容，确保向后兼容。
  * 开启时: 显示一个选项卡式界面，用于构建 PromptContentJsonb 对象。
* 上下文工程的选项卡式界面:
    1. 静态内容 (Static Content): 一个富文本编辑器，用于 static_content 字段。这是提示词的基础模板。
    2. 动态上下文 (Dynamic Context): 一个用于配置 dynamic_context 对象的区域。
        * 示例 (Examples): 一个用于添加、编辑和重新排序 few-shot 示例（输入/输出对）的UI。这将管理 example_pool。
        * 工具 (Tools): 一个多选下拉菜单，用于链接可用的工具（如果存在工具注册表）。
        * 适应规则 (Adaptation Rules): 这是一个关键功能。
            * 初步实现: 一个带schema验证的JSON编辑器（如 react-json-editor-ajrm），帮助用户编写正确的规则结构。
            * 未来增强: 一个可视化的规则构建器：如果 [上下文变量] [操作符] [值] 则 [执行动作]。
    3. 变量 (Variables): 一个专门的UI，用于定义 input_variables，包含名称、描述和类型，比简单的文本字段更清晰。
    4. 设置 (Settings): 一个用于填写元数据（如 version, is_public, compatible_models 等）的表单。

2. 新组件: ContextualPromptEditor.tsx
为了实现这一点，需要一个新的、复杂的组件。
unfold_morenote_addNew file: ContextualPromptEditor.tsx

 Show full code block
import React, { useState } from 'react';
import { Prompt, PromptContentJsonb } from '../../lib/types'; // 假设类型是共享的

// 导入每个选项卡的子组件
import StaticContentEditor from './editors/StaticContentEditor';
import DynamicContextEditor from './editors/DynamicContextEditor';
import VariablesEditor from './editors/VariablesEditor';
import PromptSettingsEditor from './editors/PromptSettingsEditor';

interface Props {
  prompt: Prompt;
  onSave: (updatedPrompt: Partial<Prompt>) => void;
}

const TABS = ['静态内容', '动态上下文', '变量', '设置'];

export default function ContextualPromptEditor({ prompt, onSave }: Props) {
  const [isCeEnabled, setIsCeEnabled] = useState(prompt.context_engineering_enabled || false);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [content, setContent] = useState<PromptContentJsonb | string>(prompt.content);

  const handleToggleCe = (enabled: boolean) => {
    setIsCeEnabled(enabled);
    if (enabled) {
      // 切换时将字符串内容转换为JSONB结构
      if (typeof content === 'string') {
        setContent({
          type: 'context_engineering',
          static_content: content,
          dynamic_context: {},
          fallback_content: content,
        });
      }
    } else {
      // 转换回纯文本
      setContent(
        (typeof content === 'object' && content.static_content) || ''
      );
    }
  };

  const handleSave = () => {
    onSave({
      ...prompt,
      content,
      context_engineering_enabled: isCeEnabled,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>编辑提示词</h2>
        <div>
          <label>启用上下文工程</label>
          <input type="checkbox" checked={isCeEnabled} onChange={(e) => handleToggleCe(e.target.checked)} />
        </div>
      </div>

      {isCeEnabled ? (
        <div>
          <div className="tabs">
            {TABS.map(tab => <button key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          {activeTab === '静态内容' && <StaticContentEditor />}
          {activeTab === '动态上下文' && <DynamicContextEditor />}
          {/* ... 其他选项卡 */}
        </div>
      ) : (
        <textarea value={typeof content === 'string' ? content : ''} /* ... */ />
      )}
      <button onClick={handleSave}>保存提示词</button>
    </div>
  );
}

### 第三阶段：用户个性化与历史记录

此阶段引入新页面，让用户可以控制自己的体验并回顾他们的活动，这充分利用了新的以用户为中心的表。

1. 用户个性化中心
一个新页面，用户可以在这里管理他们的 user_context_profiles。
位置: /account/personalization
建议的UI设计:

* 用户偏好 (User Preferences): 一个表单，用于设置他们上下文的键值对（例如 language: 'zh-CN', style: 'formal'）。这对应于 user_context_profiles 表中的 preferences JSONB 字段。
* 我的适应规则 (My Adaptation Rules): 一个查看和管理个人适应规则的视图。这为用户提供了对提示词如何适应他们的精细控制。
* 学习到的模式 (Learned Patterns - 透明度): 一个只读视图，显示他们的 usagePatterns 和 contextualMemory（来自 context-manager.ts 的逻辑）。通过向用户展示系统学习到的关于他们的信息来建立信任。
* 隐私控制 (Privacy Controls): 一个清晰的 allowAnonymousAnalytics 切换开关，以及一个用于导出或删除其数据的按钮，以符合GDPR原则。

2. 会话历史查看器
一个用于查看交互历史的新页面。
位置: /account/history
建议的UI设计:

* 一个列出所有 context_sessions 的列表。
* 每个会话都可以展开，以显示该会话中 user_interactions 的时间线。
* 对于每次交互，显示输入、最终适应后的提示词以及模型的响应。这对于调试和理解为什么会生成某个特定响应非常有价值。

### 第四阶段：管理员与高级功能

此阶段为管理员和高级用户构建高层级的管理和分析工具。

1. 实验平台
在管理员仪表盘中增加一个新部分来管理A/B测试。
位置: /admin/experiments
建议的UI设计:

* 仪表盘: 一个列出所有实验的表格，由 context_experiments 表和 experiment_analytics 视图提供支持。显示状态、参与者数量、完成率等。
* 实验创建/编辑器: 一个多步骤向导，用于创建新实验。
    1. 定义名称、描述和假设。
    2. 选择实验类型（例如，对某个提示词进行A/B测试）。
    3. 配置变体（例如，变体A使用一套适应规则，变体B使用另一套）。
    4. 设置受众/目标规则。
    5. 安排开始和结束日期。
* 结果页面: 对于每个完成的实验，显示图表和指标，比较每个变体的性能。

2. 分析与健康仪表盘
在管理区域创建新页面，以可视化新数据库视图中的数据。
位置: /admin/analytics
建议的UI设计:

* 系统健康 (System Health): 可视化来自 context_engineering_health 的数据（例如，活动会话数、缓存命中率）。
* 提示词性能 (Prompt Performance): 一个可搜索、可排序的表格，列出所有提示词，使用 prompt_performance_analysis 视图，显示使用次数、满意度分数和响应时间。
* 提示词依赖图 (Prompt Dependency Graph): 使用像 react-flow 或 vis.js 这样的库来渲染 prompt_dependency_graph 视图的输出。这将是理解复杂提示词链的强大工具。
后端API改造 (Web服务器)
的Web服务器将需要新的API端点来支持这些前端更改。
unfold_morenote_addNew file: [...slug].ts

 Show full code block
// Web服务器新API路由结构的示例
// 用于处理上下文工程管理功能。

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db'; // 的数据库客户端
import { auth } from '../../../lib/auth'; // 的认证中间件

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = await auth(req, res);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { slug } = req.query;
  const action = slug[0];

  try {
    switch (`${req.method} /${action}`) {
      // GET /api/context-engineering/preferences
      case 'GET /preferences':
        // 从 user_context_profiles 获取数据的逻辑
        const profile = await db.user_context_profiles.findUnique({ where: { user_id: userId }});
        res.status(200).json(profile?.preferences || {});
        break;

      // POST /api/context-engineering/preferences
      case 'POST /preferences':
        // 更新 user_context_profiles 的逻辑
        const { preferences } = req.body;
        const updatedProfile = await db.user_context_profiles.upsert({
            where: { user_id: userId },
            update: { preferences },
            create: { user_id: userId, profile_name: 'default', preferences, context_data: {} }
        });
        res.status(200).json(updatedProfile);
        break;

      // 添加 adaptation-rules, experiments 等情况的处理
      // 管理员专用路由示例:
      // GET /api/context-engineering/experiments
      case 'GET /experiments':
        // 在此处添加管理员角色检查
        const experiments = await db.context_experiments.findMany();
        res.status(200).json(experiments);
        break;

      default:
        res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

### 总结

这个方案提供了一个分阶段的、稳健的路径，可以将强大的新上下文工程后端的全部功能，集成到一个用户友好且功能强大的Web应用程序中。
请按照这个方案改造web服务器，注意，请发挥你的想象力和才能，如果你有更好的方案和想法，你可以主动修改我的方案，无需经过我的同意
