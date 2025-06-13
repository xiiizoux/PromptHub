import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 验证用户令牌并获取用户ID
async function authenticateUser(req: NextApiRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // 验证用户token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('JWT验证失败:', error);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('认证错误:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: '提示词ID不能为空' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getPrompt(req, res, id);
      case 'PUT':
        return await updatePrompt(req, res, id);
      case 'DELETE':
        return await deletePrompt(req, res, id);
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        });
    }
  } catch (error: any) {
    console.error('API错误:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
}

async function getPrompt(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    let prompt = null;
    
    // 首先尝试通过ID查找（如果看起来像UUID）
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      const { data: promptById, error: idError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!idError) {
        prompt = promptById;
      }
    }
    
    // 如果UUID查找失败或不是UUID格式，尝试通过名称查找
    if (!prompt) {
      const decodedName = decodeURIComponent(id);
      
      const { data: promptByName, error: nameError } = await supabase
        .from('prompts')
        .select('*')
        .eq('name', decodedName)
        .single();

      if (nameError) {
        return res.status(404).json({ 
          success: false, 
          error: '未找到指定的提示词' 
        });
      }

      prompt = promptByName;
    }

    // 获取当前用户ID（可选）
    const userId = await authenticateUser(req);

    // 增加查看次数
    await supabase
      .from('prompts')
      .update({ 
        view_count: (prompt.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', prompt.id);

    // 记录使用历史
    if (userId) {
      await supabase
        .from('prompt_usage_history')
        .insert({
          prompt_id: prompt.id,
          user_id: userId,
          action: 'view',
          timestamp: new Date().toISOString()
        });
    }

    // 获取评分统计
    const { data: ratingStats } = await supabase
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', prompt.id);

    let averageRating = 0;
    let ratingCount = 0;

    if (ratingStats && ratingStats.length > 0) {
      const totalRating = ratingStats.reduce((sum, r) => sum + r.rating, 0);
      averageRating = totalRating / ratingStats.length;
      ratingCount = ratingStats.length;
    }

    // 获取用户是否已收藏
    let isBookmarked = false;
    if (userId) {
      const { data: bookmark } = await supabase
        .from('prompt_bookmarks')
        .select('id')
        .eq('prompt_id', prompt.id)
        .eq('user_id', userId)
        .single();
      
      isBookmarked = !!bookmark;
    }

    // 获取用户评分
    let userRating = null;
    if (userId) {
      const { data: rating } = await supabase
        .from('prompt_ratings')
        .select('rating')
        .eq('prompt_id', prompt.id)
        .eq('user_id', userId)
        .single();
      
      userRating = rating?.rating || null;
    }

    // 获取用户信息
    let authorName = '匿名用户';
    if (prompt.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', prompt.user_id)
        .single();
      
      if (user) {
        authorName = user.display_name || user.email;
      }
    }

    // 获取类别信息
    let categoryName = '未分类';
    if (prompt.category_id) {
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', prompt.category_id)
        .single();
      
      if (category) {
        categoryName = category.name;
      }
    }

    // 从messages中提取content用于前端兼容性
    let contentFromMessages = '';
    if (prompt.messages && Array.isArray(prompt.messages) && prompt.messages.length > 0) {
      const systemMessage = prompt.messages.find((msg: any) => msg.role === 'system');
      if (systemMessage?.content?.text) {
        contentFromMessages = systemMessage.content.text;
      } else if (typeof systemMessage?.content === 'string') {
        contentFromMessages = systemMessage.content;
      }
    }

    const responseData = {
      ...prompt,
      content: contentFromMessages, // 添加content字段以保持前端兼容性
      author: authorName,
      category: categoryName,
      average_rating: Math.round(averageRating * 10) / 10,
      rating_count: ratingCount,
      is_bookmarked: isBookmarked,
      user_rating: userRating,
      view_count: (prompt.view_count || 0) + 1
    };

    res.status(200).json({
      success: true,
      prompt: responseData
    });
  } catch (error: any) {
    console.error('获取提示词失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取提示词失败' 
    });
  }
}

async function updatePrompt(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { 
      name, 
      content, 
      description, 
      category, 
      category_id, 
      tags, 
      version,
      is_public,
      allow_collaboration,
      edit_permission,
      input_variables,
      compatible_models
    } = req.body;
    
    // 验证用户身份
    const userId = await authenticateUser(req);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '需要登录才能更新提示词' 
      });
    }

    // 检查提示词是否存在且用户有权限
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('user_id, created_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ 
        success: false, 
        error: '未找到指定的提示词' 
      });
    }

    // 检查权限（支持created_by和user_id两个字段）
    const hasPermission = existingPrompt.user_id === userId || existingPrompt.created_by === userId;
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        error: '无权限更新此提示词' 
      });
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_modified_by: userId
    };

    // 处理基本字段
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (version !== undefined) updateData.version = parseInt(String(version), 10);
    if (is_public !== undefined) updateData.is_public = Boolean(is_public);
    if (allow_collaboration !== undefined) updateData.allow_collaboration = Boolean(allow_collaboration);
    if (edit_permission !== undefined) updateData.edit_permission = edit_permission;

    // 处理分类（支持category_id和category两种方式）
    if (category_id !== undefined) {
      updateData.category_id = category_id;
    } else if (category !== undefined) {
      updateData.category = category;
      
      // 如果提供了分类名称，尝试查找对应的category_id
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (categoryData) {
        updateData.category_id = categoryData.id;
      }
    }

    // 处理content字段 - 转换为messages格式
    if (content !== undefined) {
      // 将content字符串转换为messages JSONB格式
      const messages = [{
        role: "system",
        content: {
          type: "text",
          text: content
        }
      }];
      updateData.messages = messages;
    }

    console.log('更新提示词数据:', { id, updateData });

    // 执行数据库更新
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('数据库更新错误:', updateError);
      throw updateError;
    }

    // 从messages中提取content用于响应
    let contentFromMessages = '';
    if (updatedPrompt.messages && Array.isArray(updatedPrompt.messages) && updatedPrompt.messages.length > 0) {
      const systemMessage = updatedPrompt.messages.find((msg: any) => msg.role === 'system');
      if (systemMessage?.content?.text) {
        contentFromMessages = systemMessage.content.text;
      } else if (typeof systemMessage?.content === 'string') {
        contentFromMessages = systemMessage.content;
      }
    }

    // 构建响应数据
    const responseData = {
      ...updatedPrompt,
      content: contentFromMessages, // 添加content字段以保持前端兼容性
      input_variables: input_variables || updatedPrompt.input_variables || [],
      compatible_models: compatible_models || updatedPrompt.compatible_models || []
    };

    res.status(200).json({
      success: true,
      prompt: responseData,
      message: '提示词更新成功'
    });
  } catch (error: any) {
    console.error('更新提示词失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '更新提示词失败' 
    });
  }
}

async function deletePrompt(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 验证用户身份
    const userId = await authenticateUser(req);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '需要登录才能删除提示词' 
      });
    }

    // 检查提示词是否存在且用户有权限
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('user_id, name')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ 
        success: false, 
        error: '未找到指定的提示词' 
      });
    }

    if (existingPrompt.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: '无权限删除此提示词' 
      });
    }

    // 删除相关数据（由于外键约束，某些可能会自动删除）
    await Promise.all([
      supabase.from('prompt_ratings').delete().eq('prompt_id', id),
      supabase.from('prompt_bookmarks').delete().eq('prompt_id', id),
      supabase.from('prompt_usage_history').delete().eq('prompt_id', id),
      supabase.from('prompt_comments').delete().eq('prompt_id', id)
    ]);

    // 删除提示词
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: `提示词 "${existingPrompt.name}" 删除成功`
    });
  } catch (error: any) {
    console.error('删除提示词失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '删除提示词失败' 
    });
  }
} 