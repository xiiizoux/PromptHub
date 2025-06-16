import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      promptId,
      page = '1',
      pageSize = '10'
    } = req.query;

    if (!promptId) {
      return res.status(400).json({ error: '缺少promptId参数' });
    }

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    // 获取评分列表 - 使用正确的表名和字段名
    const { data: ratings, error: ratingsError } = await supabase
      .from('prompt_ratings')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user_id,
        users (
          display_name,
          email
        )
      `)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);

    if (ratingsError) {
      throw ratingsError;
    }

    // 获取总数
    const { count } = await supabase
      .from('prompt_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_id', promptId);

    // 计算平均评分
    const { data: avgData } = await supabase
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', promptId);

    const averageRating = avgData && avgData.length > 0 
      ? avgData.reduce((sum, item) => sum + item.rating, 0) / avgData.length
      : 0;

    // 计算评分分布
    const ratingDistribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    avgData?.forEach(item => {
      ratingDistribution[item.rating.toString()]++;
    });

    // 格式化数据
    const formattedRatings = ratings?.map((item: any) => ({
      id: item.id,
      prompt_id: promptId,
      user_id: item.user_id,
      rating: item.rating,
      comment: item.comment,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      user: {
        display_name: item.users?.display_name,
        email: item.users?.email
      }
    })) || [];

    const totalPages = Math.ceil((count || 0) / pageSizeNum);

    res.status(200).json({
      success: true,
      data: formattedRatings,
      total: count || 0,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution
    });
  } catch (error: any) {
    console.error('获取评分失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 