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
      page = '1',
      pageSize = '20',
      promptId,
      model,
      dateFrom,
      dateTo
    } = req.query;

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

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    // 构建查询
    let query = supabase
      .from('prompt_usage')
      .select(`
        id,
        prompt_id,
        prompt_version,
        model,
        input_tokens,
        output_tokens,
        latency_ms,
        created_at,
        client_metadata,
        prompts (
          name,
          description,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 添加过滤条件
    if (promptId) {
      query = query.eq('prompt_id', promptId);
    }

    if (model) {
      query = query.eq('model', model);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // 获取总数
    const { count } = await supabase
      .from('prompt_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 获取分页数据
    const { data: usageHistory, error } = await query
      .range(offset, offset + pageSizeNum - 1);

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedData = usageHistory?.map((item: any) => ({
      id: item.id,
      prompt_id: item.prompt_id,
      prompt_name: item.prompts?.name || '未知提示词',
      prompt_version: item.prompt_version,
      user_id: user.id,
      model: item.model,
      input_tokens: item.input_tokens,
      output_tokens: item.output_tokens,
      latency_ms: item.latency_ms,
      created_at: item.created_at,
      client_metadata: item.client_metadata
    })) || [];

    const totalPages = Math.ceil((count || 0) / pageSizeNum);

    res.status(200).json({
      success: true,
      data: formattedData,
      total: count || 0,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages
    });
  } catch (error: any) {
    console.error('获取使用历史失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 