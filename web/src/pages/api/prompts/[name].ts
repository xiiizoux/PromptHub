import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    // 从请求头部获取用户ID（如果有的话）
    const userId = req.headers['x-user-id'] as string;
    console.log('提示词详情请求 -', name, ', 用户ID:', userId || '未登录');
    
    // 创建管理员客户端以绕过RLS策略
    const adminClient = createClient(supabaseUrl, supabaseKey);
    
    // 构建查询条件
    let query = adminClient
      .from('prompts')
      .select('*')
      .eq('name', name);
    
    // 如果用户已登录，显示公开提示词或用户自己的提示词
    if (userId) {
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
      console.log('允许访问公开或用户自己的提示词');
    } else {
      query = query.eq('is_public', true);
      console.log('未登录用户只能访问公开提示词');
    }
    
    const { data: prompt, error } = await query.single();

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
    // 获取用户ID
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权，请登录后再删除提示词'
      });
    }
    
    console.log(`尝试删除提示词 - 参数:${name}, 用户ID:${userId}`);
    
    // 创建管理员客户端以绕过RLS策略
    const adminClient = createClient(supabaseUrl, supabaseKey);
    
    // 确定删除条件 - 支持通过ID或名称删除
    let query = adminClient.from('prompts').delete();
    
    // 检查name是否为UUID格式（可能是ID）
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(name)) {
      // 如果是UUID格式，按ID查询
      console.log('按ID删除提示词:', name);
      query = query.eq('id', name);
    } else {
      // 否则按名称查询
      console.log('按名称删除提示词:', name);
      query = query.eq('name', name);
    }
    
    // 确保只能删除自己的提示词
    query = query.eq('user_id', userId);
    
    // 执行删除操作
    const { error, count } = await query;

    if (error) {
      console.error('删除提示词错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '删除提示词失败',
        error: error.message
      });
    }
    
    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到提示词或您没有权限删除该提示词'
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
