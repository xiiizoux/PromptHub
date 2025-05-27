# Prompt Hub - AI提示词管理与分享平台

Prompt Hub是一个现代化的AI提示词管理与分享平台，基于MCP Prompt Server构建，提供直观的用户界面来创建、管理、分享和优化AI提示词。

## 功能特点

- **提示词浏览与搜索**: 轻松浏览和搜索提示词库，通过类别、标签和关键词快速找到所需的提示词
- **提示词创建与编辑**: 使用直观的编辑器创建和编辑提示词，支持变量、版本控制和示例
- **性能分析**: 跟踪和分析提示词的使用情况、成功率和用户反馈，获取数据驱动的优化建议
- **响应式设计**: 完全响应式的用户界面，在桌面和移动设备上提供一致的用户体验
- **与MCP Prompt Server无缝集成**: 直接连接到MCP Prompt Server API，实现完整的提示词管理功能

## 技术栈

- **前端框架**: Next.js (React)
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **API通信**: Axios
- **表单处理**: React Hook Form
- **数据获取**: SWR

## 项目结构

```
prompt-hub/
├── public/               # 静态资源
├── src/
│   ├── components/       # React组件
│   │   ├── layout/       # 布局组件（导航栏、页脚等）
│   │   ├── prompts/      # 提示词相关组件
│   │   └── ui/           # 通用UI组件
│   ├── hooks/            # 自定义React Hooks
│   ├── lib/              # 工具函数和API客户端
│   ├── pages/            # Next.js页面
│   │   ├── analytics/    # 性能分析页面
│   │   ├── prompts/      # 提示词相关页面
│   │   └── _app.tsx      # Next.js应用入口
│   ├── styles/           # 全局样式
│   └── types/            # TypeScript类型定义
├── .env                  # 环境变量
├── next.config.js        # Next.js配置
├── package.json          # 项目依赖
├── postcss.config.js     # PostCSS配置
└── tailwind.config.js    # Tailwind CSS配置
```

## 快速开始

### 前置条件

- Node.js 14.x 或更高版本
- MCP Prompt Server 已配置并运行

### 安装

1. 克隆仓库
   ```bash
   git clone https://github.com/xiiizoux/PromptHub.git
   cd mcp-prompt-server/frontend/prompt-hub
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 创建`.env.local`文件并配置环境变量
   ```
   API_URL=http://localhost:9010
   API_KEY=your-api-key
   ```

4. 启动开发服务器
   ```bash
   npm run dev
   ```

5. 打开浏览器访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
npm run start
```

## 部署

### Vercel部署

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 配置环境变量
4. 点击部署

### 自托管部署

1. 构建生产版本
   ```bash
   npm run build
   ```

2. 使用PM2或其他进程管理器运行
   ```bash
   pm2 start npm --name "prompt-hub" -- start
   ```

## 连接到MCP Prompt Server

Prompt Hub前端默认连接到本地运行的MCP Prompt Server（http://localhost:9010）。如需连接到远程服务器，请修改`.env.local`文件中的`API_URL`和`API_KEY`。

## 开发指南

### 添加新页面

1. 在`src/pages/`目录下创建新的`.tsx`文件
2. 导入必要的组件和钩子
3. 创建页面组件并导出

### 添加新组件

1. 在适当的目录下创建新的`.tsx`文件
2. 定义组件接口（Props）
3. 实现组件功能
4. 导出组件

### 样式指南

- 使用Tailwind CSS类进行样式设计
- 对于复杂组件，可以使用`@apply`在`src/styles/globals.css`中定义组合类
- 遵循项目中定义的设计系统（颜色、间距、排版等）

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 贡献指南

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

MIT
