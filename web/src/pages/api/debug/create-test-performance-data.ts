import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId, count = 10 } = req.body;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '必须提供promptId' 
      });
    }

    // 生成测试使用记录
    const usageRecords = [];
    for (let i = 0; i < count; i++) {
      const usageRecord = {
        prompt_id: promptId,
        prompt_version: Math.floor(Math.random() * 3) + 1, // 版本1-3
        user_id: null, // 匿名用户
        session_id: `test_session_${Date.now()}_${i}`,
        model: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'][Math.floor(Math.random() * 3)],
        input_tokens: Math.floor(Math.random() * 500) + 100, // 100-600 tokens
        output_tokens: Math.floor(Math.random() * 300) + 50, // 50-350 tokens
        latency_ms: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 过去30天内
        client_metadata: {
          test_data: true,
          created_by: 'debug_api'
        }
      };
      usageRecords.push(usageRecord);
    }

    // 插入使用记录
    const { data: insertedUsage, error: usageError } = await supabase
      .from('prompt_usage')
      .insert(usageRecords)
      .select('id');

    if (usageError) {
      throw usageError;
    }

    // 生成一些反馈记录（约30%的使用记录有反馈）
    const feedbackRecords = [];
    const feedbackCount = Math.floor(count * 0.3);
    
    for (let i = 0; i < feedbackCount && i < insertedUsage.length; i++) {
      const feedbackRecord = {
        usage_id: insertedUsage[i].id,
        rating: Math.floor(Math.random() * 5) + 1, // 1-5星
        feedback_text: [
          '效果很好，输出质量高',
          '响应时间有点慢',
          '结果符合预期',
          '需要改进准确性',
          '非常满意'
        ][Math.floor(Math.random() * 5)],
        categories: [['quality'], ['performance'], ['accuracy'], ['speed']][Math.floor(Math.random() * 4)],
        created_at: new Date().toISOString(),
        user_id: null
      };
      feedbackRecords.push(feedbackRecord);
    }

    if (feedbackRecords.length > 0) {
      const { error: feedbackError } = await supabase
        .from('prompt_feedback')
        .insert(feedbackRecords);

      if (feedbackError) {
        throw feedbackError;
      }
    }

    // 等待触发器更新性能汇总表
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查生成的性能数据
    const { data: performanceData, error: perfError } = await supabase
      .from('prompt_performance')
      .select('*')
      .eq('prompt_id', promptId);

    if (perfError) {
      throw perfError;
    }

    res.status(200).json({
      success: true,
      message: `成功为提示词 ${promptId} 生成 ${count} 条使用记录和 ${feedbackRecords.length} 条反馈记录`,
      data: {
        usage_records: usageRecords.length,
        feedback_records: feedbackRecords.length,
        performance_summary: performanceData
      }
    });

  } catch (error: any) {
    console.error('生成测试数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '生成测试数据失败' 
    });
  }
} 