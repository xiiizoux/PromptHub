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
    // 先查询所有提示词
    const { data: allPrompts, error: fetchError } = await supabase
      .from('prompts')
      .select('id, name, is_public');

    if (fetchError) {
      console.error('获取提示词失败:', fetchError);
      return res.status(500).json({ 
        success: false, 
        error: `获取提示词失败: ${fetchError.message}`, 
      });
    }

    if (!allPrompts || allPrompts.length === 0) {
      return res.status(404).json({
        success: false,
        error: '没有找到提示词',
      });
    }

    console.log('找到的提示词:', allPrompts);
    
    // 对每个提示词进行更新
    const updateResults = [];
    for (const prompt of allPrompts) {
      const { data, error } = await supabase
        .from('prompts')
        .update({ is_public: true })
        .eq('id', prompt.id)
        .select();
      
      updateResults.push({
        id: prompt.id,
        name: prompt.name,
        success: !error,
        error: error?.message,
      });
    }

    // 成功更新
    return res.status(200).json({
      success: true,
      message: `成功将 ${updateResults.filter(r => r.success).length} 个提示词设置为公开`,
      results: updateResults,
    });
  } catch (error: any) {
    console.error('处理更新提示词请求时出错:', error);
    return res.status(500).json({ 
      success: false, 
      error: `服务器错误: ${error.message}`, 
    });
  }
}
