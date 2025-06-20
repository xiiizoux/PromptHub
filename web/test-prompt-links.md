# 提示词链接修复测试

## 问题描述
从账户管理页面的提示词卡片点击互动按钮进入提示词详情和编辑页面时出现空白页，浏览器控制台显示404错误。

## 根本原因
链接标识符不一致：
- PromptCard组件原本使用 `prompt.id` (UUID格式)
- 个人资料页面使用 `prompt.name` (名称格式)
- 这导致不同页面跳转到不同的URL格式，造成路由不匹配

## 修复内容

### 1. 统一使用 `prompt.name` 作为路由标识符

**修复的文件：**
- `web/src/components/prompts/PromptCard.tsx` - 链接从 `/prompts/${prompt.id}` 改为 `/prompts/${prompt.name}`
- `web/src/pages/prompts/[id].tsx` - 编辑链接从 `/prompts/${prompt.id}/edit` 改为 `/prompts/${prompt.name}/edit`
- `web/src/pages/prompts/[id].tsx` - 分析链接从 `/analytics/${prompt.id}` 改为 `/analytics/${prompt.name}`
- `web/src/pages/analytics/[promptId].tsx` - 查看提示词链接从 `/prompts/${prompt.id}` 改为 `/prompts/${prompt.name}`
- `web/src/pages/profile/index.tsx` - 分享链接从 `/prompts/${prompt.id}` 改为 `/prompts/${prompt.name}`

### 2. 添加加载状态和错误处理

**在 `web/src/pages/prompts/[id].tsx` 中添加：**
- 空数据检查和加载状态显示
- 防止空白页面出现

## 技术细节

### URL路由格式统一
- **之前**: 混合使用 `/prompts/{uuid}` 和 `/prompts/{name}`
- **现在**: 统一使用 `/prompts/{name}`

### API兼容性
- API端点 `/api/prompts/[id].ts` 已经支持按名称和UUID查询
- `supabaseAdapter.getPrompt()` 函数会自动判断输入是UUID还是名称

### Next.js数据获取
- `getServerSideProps` 调用 `getPromptDetails(id)` 
- 该函数会向 `/api/prompts/${id}` 发送请求
- API会根据输入类型（UUID或名称）进行相应查询

## 预期效果
1. 从提示词卡片点击进入详情页面正常显示
2. 从个人资料页面点击编辑按钮正常进入编辑页面
3. 所有提示词相关链接保持一致性
4. 不再出现404错误和空白页面

## 测试建议
1. 从首页提示词卡片点击进入详情页
2. 从个人资料页面点击查看和编辑按钮
3. 检查分享链接是否正确
4. 验证所有提示词相关导航是否正常工作
