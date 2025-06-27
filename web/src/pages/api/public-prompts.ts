import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ApiResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // 只接受GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: '方法不允许',
      data: [],
      total: 0,
      page: 1,
      pageSize: 0,
      totalPages: 0,
    });
  }

  try {
    // 解析查询参数
    const { search, category, tag, sortBy, page = '1', pageSize = '21', category_type } = req.query;
    
    // 解析分页参数
    const currentPage = Math.max(1, parseInt(page as string) || 1);
    const currentPageSize = Math.max(1, Math.min(100, parseInt(pageSize as string) || 21));
    
    // 获取请求中的用户ID（如果存在）
    const userId = req.headers['x-user-id'] as string;
    console.log('请求中的用户ID:', userId, '页面:', currentPage, '页面大小:', currentPageSize);
    
    // 构建基础查询 - 使用count来获取总数
    let query = supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        version,
        is_public,
        user_id,
        created_at,
        updated_at,
        created_by
      `, { count: 'exact' });

    // 如果有用户ID，则获取该用户的所有提示词和公开提示词
    // 如果没有用户ID，则只获取公开提示词
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      console.log('获取用户自己的提示词和公开提示词');
    } else {
      query = query.eq('is_public', true);
      console.log('只获取公开提示词');
    }
    
    // 添加搜索条件
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // 添加分类过滤
    if (category && typeof category === 'string' && category !== '全部') {
      query = query.eq('category', category);
    }
    
    // 添加标签过滤
    if (tag && typeof tag === 'string') {
      query = query.contains('tags', [tag]);
    }
    
    // 临时禁用类型过滤（直到数据库字段添加完成）
    // if (category_type && typeof category_type === 'string') {
    //   query = query.eq('category_type', category_type);
    // }
    
    // 添加排序
    if (sortBy && typeof sortBy === 'string') {
      switch (sortBy) {
        case 'latest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'updated':
          query = query.order('updated_at', { ascending: false });
          break;
        default:
          // 默认按创建时间降序排列（最新的在前面）
          query = query.order('created_at', { ascending: false });
      }
    } else {
      // 如果没有指定排序，默认按创建时间降序排列（最新的在前面）
      query = query.order('created_at', { ascending: false });
    }
    
    // 应用分页
    const from = (currentPage - 1) * currentPageSize;
    const to = from + currentPageSize - 1;
    query = query.range(from, to);
    
    // 执行查询
    const { data: promptsData, error, count } = await query;

    if (error) {
      console.error('获取提示词失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: `获取提示词失败: ${error.message}`,
        data: [],
        total: 0,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: 0,
      });
    }

    console.log('获取到的提示词数量:', promptsData?.length || 0, '总数:', count);

    // 如果没有提示词，直接返回
    if (!promptsData || promptsData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: count || 0,
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: count ? Math.ceil(count / currentPageSize) : 0,
      });
    }

    // 收集所有唯一的用户ID
    const userIds = Array.from(new Set(
      promptsData
        .map(p => p.user_id || p.created_by)
        .filter(Boolean),
    ));

    console.log('需要获取用户信息的用户ID:', userIds);

    // 分别查询用户信息
    let usersData: any[] = [];
    if (userIds.length > 0) {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, display_name')
          .in('id', userIds);
        
        if (usersError) {
          console.error('获取用户信息失败:', usersError);
        } else {
          usersData = users || [];
        }
      } catch (userError) {
        console.error('查询用户信息时出错:', userError);
      }
    }

    // 获取所有提示词的评分数据
    const promptIds = promptsData.map(p => p.id).filter(Boolean);
    const ratingsMap = new Map<string, { average: number; count: number }>();
    
    if (promptIds.length > 0) {
      try {
        const { data: ratingData, error: ratingError } = await supabase
          .from('prompt_ratings')
          .select('prompt_id, rating')
          .in('prompt_id', promptIds);

        if (!ratingError && ratingData && ratingData.length > 0) {
          // 计算每个提示词的平均评分和评分数量
          const ratingStats = ratingData.reduce((acc, rating) => {
            if (!acc[rating.prompt_id]) {
              acc[rating.prompt_id] = { sum: 0, count: 0 };
            }
            acc[rating.prompt_id].sum += rating.rating;
            acc[rating.prompt_id].count += 1;
            return acc;
          }, {} as Record<string, { sum: number; count: number }>);

          // 计算平均值并存储到Map中
          Object.entries(ratingStats).forEach(([promptId, stats]) => {
            ratingsMap.set(promptId, {
              average: Math.round((stats.sum / stats.count) * 10) / 10,
              count: stats.count,
            });
          });

          console.log('计算的评分统计:', Object.fromEntries(ratingsMap));
        }
      } catch (ratingError) {
        console.error('获取评分数据时出错:', ratingError);
      }
    }

    // 创建用户映射
    const userMap = new Map(usersData.map(user => [user.id, user]));

    // 格式化数据，确保包含用户信息和评分信息
    const formattedPrompts = promptsData.map(prompt => {
      const user = userMap.get(prompt.user_id || prompt.created_by);
      const authorName = user && user.display_name ? user.display_name : '未知用户';
      const ratingInfo = ratingsMap.get(prompt.id) || { average: 0, count: 0 };
      
      return {
        ...prompt,
        author: authorName,
        average_rating: ratingInfo.average,
        rating_count: ratingInfo.count,
        rating: ratingInfo.average, // 为了兼容前端组件，同时提供rating字段
      };
    });

    // 计算总页数
    const totalPages = count ? Math.ceil(count / currentPageSize) : 0;

    console.log('返回数据:', {
      total: count,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: totalPages,
      dataLength: formattedPrompts.length,
    });

    return res.status(200).json({
      success: true,
      data: formattedPrompts,
      total: count || 0,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: totalPages,
    });

  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误',
      data: [],
      total: 0,
      page: 1,
      pageSize: 21,
      totalPages: 0,
    });
  }
}
