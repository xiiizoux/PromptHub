# 提示词显示问题 - 最终修复总结

## 🎯 问题根本原因

### 1. 首页问题
**文件**: `web/src/pages/index.tsx`  
**问题**: `getStaticProps` 函数硬编码返回空数组
```typescript
export async function getStaticProps() {
  return {
    props: {
      featuredPrompts: [],  // ← 硬编码！
    },
  };
}
```

### 2. 分类页面问题
**文件**: `web/src/lib/supabase-adapter.ts`  
**问题**: 使用 INNER JOIN 关联 `categories` 表失败
```typescript
if (category_type) {
  query = this.supabase.from('prompts').select(`
    *,
    categories!inner(type),  // ← INNER JOIN 失败
    users!prompts_user_id_fkey(display_name, email)
  `, { count: 'exact' }).eq('categories.type', category_type);
}
```

**错误信息**:
```
Could not find a relationship between 'prompts' and 'categories' in the schema cache
```

## ✅ 修复方案

### 修复 1: 首页数据获取 (`index.tsx`)

#### 改进 `getStaticProps`
```typescript
export async function getStaticProps() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9011';
    const response = await fetch(`${baseUrl}/api/prompts?pageSize=6&sortBy=popular`);
    
    if (!response.ok) {
      return { props: { featuredPrompts: [] }, revalidate: 600 };
    }

    const data = await response.json();
    const featuredPrompts = data?.data?.data || [];

    return {
      props: { featuredPrompts: featuredPrompts.slice(0, 6) },
      revalidate: 600, // ISR: 10分钟重新生成
    };
  } catch (error) {
    return { props: { featuredPrompts: [] }, revalidate: 600 };
  }
}
```

#### 添加客户端兜底获取
```typescript
const [featuredPrompts, setFeaturedPrompts] = useState<PromptInfo[]>(initialPrompts);
const [loading, setLoading] = useState(initialPrompts.length === 0);

useEffect(() => {
  if (featuredPrompts.length === 0) {
    const fetchPrompts = async () => {
      try {
        const { getPrompts } = await import('@/lib/api');
        const response = await getPrompts({ pageSize: 6, sortBy: 'popular' });
        if (response && response.data && Array.isArray(response.data)) {
          setFeaturedPrompts(response.data.slice(0, 6));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }
}, [featuredPrompts.length]);
```

#### 添加加载状态和空状态
```typescript
{loading ? (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
  </div>
) : featuredPrompts.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {featuredPrompts.map(...)}
  </div>
) : (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="text-gray-400 text-lg mb-4">暂无提示词数据</div>
    <Link href="/prompts">前往提示词广场</Link>
  </div>
)}
```

### 修复 2: 数据库查询逻辑 (`supabase-adapter.ts`)

#### 修改前（问题代码）
```typescript
let query;
if (category_type) {
  // 通过关联categories表来按类型过滤（失败）
  query = this.supabase.from('prompts').select(`
    *,
    categories!inner(type),  // ← 这里导致查询失败
    users!prompts_user_id_fkey(display_name, email)
  `, { count: 'exact' }).eq('categories.type', category_type);
} else {
  query = this.supabase.from('prompts').select(`
    *,
    users!prompts_user_id_fkey(display_name, email)
  `, { count: 'exact' });
}
```

#### 修改后（正确代码）
```typescript
// 直接使用 category_type 字段过滤，避免 INNER JOIN 失败
let query = this.supabase.from('prompts').select(`
  *,
  users!prompts_user_id_fkey(display_name, email)
`, { count: 'exact' });

// 按 category_type 过滤
if (category_type) {
  query = query.eq('category_type', category_type);
}
```

## 📊 验证结果

### API 测试
```bash
# 无过滤
GET /api/prompts?pageSize=3
✅ 返回 3 条数据，总计 91 条

# chat 分类
GET /api/prompts?category_type=chat&pageSize=3
✅ 返回 3 条数据，总计 82 条

# image 分类
GET /api/prompts?category_type=image&pageSize=3
✅ 返回 1 条数据，总计 1 条

# video 分类
GET /api/prompts?category_type=video&pageSize=3
✅ 返回 3 条数据，总计 7 条
```

### 数据统计
- **总计**: 91 条公开提示词
  - **chat**: 82 条 ✅
  - **image**: 1 条 ✅
  - **video**: 7 条 ✅
  - **null**: 1 条（测试数据）

### 页面访问测试
- ✅ 首页 (http://localhost:9011) - 显示 6 条精选提示词
- ✅ 提示词广场 (/prompts) - 显示所有 91 条
- ✅ 对话提示词 (/chat) - 显示 82 条
- ✅ 图片提示词 (/image) - 显示 1 条
- ✅ 视频提示词 (/video) - 显示 7 条

## 🔧 技术细节

### 问题诊断过程

1. **初步怀疑**: RLS 策略、触发器、数据库连接问题
2. **API 测试**: 发现 API 返回正常（91 条数据）
3. **首页定位**: 发现 `getStaticProps` 硬编码空数组
4. **分类过滤问题**: 发现按 `category_type` 过滤返回 0 条
5. **数据库检查**: 确认数据库中有 82 条 chat 类型数据
6. **查询逻辑检查**: 发现 INNER JOIN 失败
7. **根本原因**: Supabase 无法找到 `prompts` 和 `categories` 的外键关系

### 为什么 INNER JOIN 失败？

Supabase 的关系查询依赖于：
1. 数据库中的外键约束
2. PostgREST schema cache 中的关系缓存

在本项目中：
- `prompts` 表有 `category_id` 字段
- 但可能外键约束未正确建立或未被 PostgREST 识别
- 导致 `categories!inner(type)` 查询失败

### 解决方案的优势

直接使用 `category_type` 字段的优势：
1. ✅ **简单直接**: 不依赖外键关系
2. ✅ **性能更好**: 避免 JOIN 操作
3. ✅ **更可靠**: 不受 schema cache 影响
4. ✅ **易维护**: 查询逻辑更清晰

## 📝 修改的文件

### 1. `web/src/pages/index.tsx`
- 修改 `getStaticProps` 函数
- 添加客户端数据获取
- 添加加载状态和空状态处理

### 2. `web/src/lib/supabase-adapter.ts`
- 移除 INNER JOIN 查询
- 改为直接使用 `category_type` 字段过滤

### 3. `restore-triggers.sql` (已创建，待执行)
- 用于恢复数据库触发器

## 🚀 部署步骤

1. **修改代码** ✅
2. **重新构建 Web 应用** ✅
   ```bash
   cd web && npm run build
   ```
3. **重新构建 Docker 镜像** ✅
   ```bash
   docker compose down && docker compose up -d --build
   ```
4. **恢复数据库触发器** ⏳ (待执行)
   - 在 Supabase SQL Editor 中执行 `restore-triggers.sql`

## 🎯 最终状态

### 服务状态
```
✅ 服务运行: healthy
✅ 端口 9010: MCP 服务
✅ 端口 9011: Web 服务
```

### 数据状态
```
✅ 91 条公开提示词
✅ 15 个分类
✅ RLS 策略正常
✅ 数据查询正常
```

### 功能状态
```
✅ 首页显示精选提示词
✅ 提示词广场显示所有提示词
✅ 分类过滤正常工作
✅ chat/image/video 页面正常显示
```

## 📚 相关资源

- 项目地址: http://localhost:9011
- API 文档: http://localhost:9011/docs/api
- MCP 服务: http://localhost:9010
- Supabase: https://supabase.prompt-hub.cc

## ✨ 总结

经过系统性诊断和修复，问题已经完全解决：

1. ✅ **首页**: 从硬编码空数组改为动态获取数据
2. ✅ **分类查询**: 从失败的 INNER JOIN 改为直接字段过滤
3. ✅ **用户体验**: 添加加载状态和友好的空状态提示
4. ✅ **数据完整性**: 91 条公开提示词全部可访问

**修复时间**: 2025-10-29  
**修复文件**: 
- `web/src/pages/index.tsx`
- `web/src/lib/supabase-adapter.ts`

**验证命令**:
```bash
# 测试首页
curl http://localhost:9011/

# 测试 API
curl http://localhost:9011/api/prompts?category_type=chat

# 测试分类页面
curl http://localhost:9011/chat
```

---

**🎉 所有问题已解决！页面现在可以正常显示提示词内容了！**

