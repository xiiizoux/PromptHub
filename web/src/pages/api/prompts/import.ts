import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { importData, options = {} } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: '未授权访问' });
    }

    // 从Authorization header获取token
    const token = authHeader.replace('Bearer ', '');
    
    // 验证用户token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的授权token' });
    }

    if (!importData) {
      return res.status(400).json({ error: '没有导入数据' });
    }

    let prompts: any[] = [];

    // 解析导入数据
    if (typeof importData === 'string') {
      try {
        const parsed = JSON.parse(importData);
        if (parsed.prompts && Array.isArray(parsed.prompts)) {
          prompts = parsed.prompts;
        } else if (Array.isArray(parsed)) {
          prompts = parsed;
        } else {
          throw new Error('无效的JSON格式');
        }
      } catch (error) {
        return res.status(400).json({ error: 'JSON格式错误' });
      }
    } else if (Array.isArray(importData)) {
      prompts = importData;
    } else if (importData.prompts && Array.isArray(importData.prompts)) {
      prompts = importData.prompts;
    } else {
      return res.status(400).json({ error: '无效的导入数据格式' });
    }

    if (prompts.length === 0) {
      return res.status(400).json({ error: '没有有效的提示词数据' });
    }

    // 验证导入数据
    const validPrompts = [];
    const errors = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      
      if (!prompt.name || !prompt.content) {
        errors.push(`第${i + 1}个提示词缺少必要字段（名称或内容）`);
        continue;
      }

      // 检查是否已存在相同名称的提示词
      const { data: existingPrompt } = await supabase
        .from('prompts')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('name', prompt.name)
        .single();

      if (existingPrompt && !options.allowDuplicates) {
        if (options.skipDuplicates) {
          errors.push(`跳过重复提示词: ${prompt.name}`);
          continue;
        } else {
          errors.push(`提示词名称已存在: ${prompt.name}`);
          continue;
        }
      }

      // 获取或创建分类
      let categoryId = null;
      if (prompt.category) {
        // 首先尝试查找现有分类
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', prompt.category)
          .single();

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // 创建新分类
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              name: prompt.category,
              description: '从导入数据自动创建的分类',
              color: '#3B82F6',
            })
            .select('id')
            .single();

          if (!categoryError && newCategory) {
            categoryId = newCategory.id;
          }
        }
      }

      validPrompts.push({
        id: randomUUID(),
        name: prompt.name,
        content: prompt.content,
        description: prompt.description || '',
        category_id: categoryId,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        is_public: prompt.is_public || false,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (validPrompts.length === 0) {
      return res.status(400).json({ 
        error: '没有有效的提示词可以导入',
        errors, 
      });
    }

    // 批量插入提示词
    const { data: insertedPrompts, error: insertError } = await supabase
      .from('prompts')
      .insert(validPrompts)
      .select('id, name');

    if (insertError) {
      throw insertError;
    }

    res.status(200).json({
      success: true,
      imported_count: validPrompts.length,
      total_count: prompts.length,
      errors: errors.length > 0 ? errors : undefined,
      prompts: insertedPrompts,
    });

  } catch (error: any) {
    console.error('导入失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误', 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 支持较大的导入文件
    },
  },
}; 