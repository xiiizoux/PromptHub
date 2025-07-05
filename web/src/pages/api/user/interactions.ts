import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // 验证身份
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  // 验证用户token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = user.id;
  const { timeFilter = 'month' } = req.query;

  switch (method) {
    case 'GET':
      try {
        // 返回模拟的交互数据
        const interactions = [
          {
            id: '1',
            session_id: '1',
            prompt_id: 'prompt_1',
            timestamp: '2024-01-15T10:30:00Z',
            input_type: 'text',
            input_length: 150,
            output_length: 320,
            satisfaction_rating: 5,
            context_used: ['用户偏好', '历史对话'],
            adaptations_made: ['语调调整', '内容简化'],
            processing_time: 2.3,
            tokens_used: 180,
          },
          {
            id: '2',
            session_id: '1',
            prompt_id: 'prompt_1',
            timestamp: '2024-01-15T10:45:00Z',
            input_type: 'text',
            input_length: 89,
            output_length: 245,
            satisfaction_rating: 4,
            context_used: ['用户偏好', '会话历史'],
            adaptations_made: ['格式调整'],
            processing_time: 1.8,
            tokens_used: 145,
          },
          {
            id: '3',
            session_id: '2',
            prompt_id: 'prompt_2',
            timestamp: '2024-01-14T14:25:00Z',
            input_type: 'text',
            input_length: 200,
            output_length: 480,
            satisfaction_rating: 5,
            context_used: ['技术背景', '偏好设置'],
            adaptations_made: ['详细程度增加', '技术术语解释'],
            processing_time: 3.1,
            tokens_used: 220,
          },
          {
            id: '4',
            session_id: '3',
            prompt_id: 'prompt_3',
            timestamp: '2024-01-13T09:15:00Z',
            input_type: 'text',
            input_length: 175,
            output_length: 390,
            satisfaction_rating: 4,
            context_used: ['商业背景', '决策偏好'],
            adaptations_made: ['数据重点突出', 'ROI分析加强'],
            processing_time: 2.7,
            tokens_used: 195,
          },
        ];

        // 根据时间过滤器过滤数据
        const now = new Date();
        const filterDate = new Date();
        
        switch (timeFilter) {
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            filterDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            filterDate.setMonth(now.getMonth() - 1);
        }

        const filteredInteractions = interactions.filter(interaction =>
          new Date(interaction.timestamp) >= filterDate,
        );
        
        res.status(200).json(filteredInteractions);
      } catch (error) {
        console.error('Error fetching user interactions:', error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}