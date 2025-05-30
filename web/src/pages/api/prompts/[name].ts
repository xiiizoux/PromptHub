import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取提示词名称
  const { name } = req.query;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: '必须提供有效的提示词名称' 
    });
  }

  // 根据请求方法调用相应的处理函数
  switch (req.method) {
    case 'GET':
      return handleGetPrompt(req, res, name);
    case 'PUT':
      return handleUpdatePrompt(req, res, name);
    case 'DELETE':
      return handleDeletePrompt(req, res, name);
    default:
      return res.status(405).json({ success: false, message: '方法不允许' });
  }
}

// 获取单个提示词详情
async function handleGetPrompt(req: NextApiRequest, res: NextApiResponse, name: string) {
  try {
    // 从获取提示词详情，只获取公开的提示词
    const { data: prompt, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('name', name)
      .eq('is_public', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: '提示词不存在' 
        });
      }
      console.error('获取提示词详情错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取提示词详情失败',
        error: error.message
      });
    }

    // 转换数据格式以匹配前端期望的结构
    const transformedPrompt = {
      ...prompt,
      content: prompt.messages?.[0]?.content?.text || prompt.content || '',
      // 保持原有的messages结构以备后用
      messages: prompt.messages
    };

    return res.status(200).json({
      success: true,
      data: transformedPrompt
    });
  } catch (error) {
    console.error('获取提示词详情错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取提示词详情过程中发生错误' 
    });
  }
}

// 更新提示词
async function handleUpdatePrompt(req: NextApiRequest, res: NextApiResponse, name: string) {
  try {
    // 验证请求体
    const { content, description, category, tags } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: '提示词内容是必需的' 
      });
    }
    
    // 更新Supabase中的提示词
    const { data: updatedPrompt, error } = await supabase
      .from('prompts')
      .update({
        content,
        description: description || '',
        category: category || 'general',
        tags: tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('name', name)
      .eq('is_public', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: '提示词不存在' 
        });
      }
      console.error('更新提示词错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '更新提示词失败',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPrompt,
      message: '提示词更新成功'
    });
  } catch (error) {
    console.error('更新提示词错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '更新提示词过程中发生错误' 
    });
  }
}

// 删除提示词
async function handleDeletePrompt(req: NextApiRequest, res: NextApiResponse, name: string) {
  try {
    // 从Supabase删除提示词
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('name', name)
      .eq('is_public', true);

    if (error) {
      console.error('删除提示词错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '删除提示词失败',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: '提示词删除成功'
    });
  } catch (error) {
    console.error('删除提示词错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '删除提示词过程中发生错误' 
    });
  }
}
