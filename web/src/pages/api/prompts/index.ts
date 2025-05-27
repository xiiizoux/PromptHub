import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 根据请求方法调用相应的处理函数
  switch (req.method) {
    case 'GET':
      return handleGetPrompts(req, res);
    case 'POST':
      return handleCreatePrompt(req, res);
    default:
      return res.status(405).json({ success: false, message: '方法不允许' });
  }
}

// 获取提示词列表
async function handleGetPrompts(req: NextApiRequest, res: NextApiResponse) {
  try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // 从Supabase获取提示词列表
    const { data: prompts, error, count } = await supabase
      .from('prompts')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('获取提示词列表错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取提示词列表失败',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: prompts || [],
      total: count || 0,
          page,
          pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    });
  } catch (error) {
    console.error('获取提示词列表错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取提示词列表过程中发生错误' 
    });
  }
}

// 创建新提示词
async function handleCreatePrompt(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证请求体
    const { name, content, description, category, tags } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '提示词名称和内容是必需的' 
      });
    }
    
    // 插入新提示词到Supabase
    const { data: newPrompt, error } = await supabase
      .from('prompts')
      .insert([{
        name,
        content,
        description: description || '',
        category: category || 'general',
        tags: tags || [],
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('创建提示词错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建提示词失败',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: newPrompt,
      message: '提示词创建成功'
    });
  } catch (error) {
    console.error('创建提示词错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '创建提示词过程中发生错误' 
    });
  }
}
