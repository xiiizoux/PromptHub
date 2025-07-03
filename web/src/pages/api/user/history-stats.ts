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

  switch (method) {
    case 'GET':
      try {
        // 返回模拟的历史统计数据
        const stats = {
          overview: {
            total_sessions: 45,
            total_interactions: 387,
            total_time_spent: 142800, // 秒
            average_satisfaction: 4.3,
            prompts_used: 12,
            adaptations_made: 156
          },
          weekly_trends: [
            { week: '2024-W01', sessions: 8, interactions: 67, avg_satisfaction: 4.2 },
            { week: '2024-W02', sessions: 12, interactions: 89, avg_satisfaction: 4.4 },
            { week: '2024-W03', sessions: 10, interactions: 78, avg_satisfaction: 4.1 },
            { week: '2024-W04', sessions: 15, interactions: 153, avg_satisfaction: 4.6 }
          ],
          category_breakdown: [
            { category: '创意写作', sessions: 15, interactions: 132, satisfaction: 4.5 },
            { category: '技术文档', sessions: 12, interactions: 98, satisfaction: 4.7 },
            { category: '商业策略', sessions: 8, interactions: 67, satisfaction: 4.1 },
            { category: '学术研究', sessions: 6, interactions: 45, satisfaction: 4.2 },
            { category: '日常对话', sessions: 4, interactions: 45, satisfaction: 4.0 }
          ],
          time_patterns: {
            hourly_distribution: [
              { hour: '09', sessions: 8 },
              { hour: '10', sessions: 12 },
              { hour: '11', sessions: 6 },
              { hour: '14', sessions: 10 },
              { hour: '15', sessions: 5 },
              { hour: '16', sessions: 4 }
            ],
            daily_distribution: [
              { day: 'Monday', sessions: 8, avg_satisfaction: 4.2 },
              { day: 'Tuesday', sessions: 12, avg_satisfaction: 4.5 },
              { day: 'Wednesday', sessions: 6, avg_satisfaction: 4.1 },
              { day: 'Thursday', sessions: 10, avg_satisfaction: 4.4 },
              { day: 'Friday', sessions: 9, avg_satisfaction: 4.3 }
            ]
          },
          learning_progression: {
            adaptation_accuracy: 0.78,
            context_relevance: 0.85,
            personalization_score: 0.72,
            improvement_rate: 0.15, // 每月提升15%
            milestones: [
              { date: '2024-01-01', metric: 'context_relevance', value: 0.65 },
              { date: '2024-01-15', metric: 'adaptation_accuracy', value: 0.72 },
              { date: '2024-01-30', metric: 'personalization_score', value: 0.78 }
            ]
          }
        };
        
        res.status(200).json(stats);
      } catch (error) {
        console.error('Error fetching history stats:', error);
        res.status(500).json({ error: 'Failed to fetch history statistics' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}