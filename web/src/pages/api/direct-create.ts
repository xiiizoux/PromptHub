import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const {
      name,
      description,
      category,
      tags,
      messages,
      is_public,
      user_id
    } = req.body;

    // 验证必填字段
    if (!name || !description || !category || !messages || messages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要字段: name, description, category, messages' 
      });
    }

    // 准备要插入数据库的提示词数据
    const promptData = {
      name,
      description,
      category,
      tags: tags || [],
      messages,
      is_public: is_public !== undefined ? is_public : true,
      user_id: user_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };

    // 插入数据到prompts表
    const { data, error } = await supabase
      .from('prompts')
      .insert([promptData])
      .select();

    if (error) {
      console.error('创建提示词失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: `创建提示词失败: ${error.message}` 
      });
    }

    // 成功创建
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    console.error('处理创建提示词请求时出错:', error);
    return res.status(500).json({ 
      success: false, 
      error: `服务器错误: ${error.message}` 
    });
  }
}
