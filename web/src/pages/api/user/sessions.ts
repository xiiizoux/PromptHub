import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

// 验证JWT令牌
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  } catch (error) {
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  
  // 验证身份
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded || typeof decoded === 'string') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const userId = (decoded as any).sub;
  const { timeFilter = 'month', satisfactionFilter = 'all', search = '' } = req.query;

  switch (method) {
    case 'GET':
      try {
        // 返回模拟的会话数据
        const sessions = [
          {
            id: '1',
            prompt_id: 'prompt_1',
            prompt_name: '创意写作助手',
            session_type: 'interactive',
            start_time: '2024-01-15T10:30:00Z',
            end_time: '2024-01-15T11:15:00Z',
            duration: 2700, // 45分钟
            interactions_count: 12,
            satisfaction_score: 4.5,
            context_adaptations: 8,
            learning_points: ['用户偏好简洁回答', '倾向创意性建议'],
            status: 'completed'
          },
          {
            id: '2',
            prompt_id: 'prompt_2',
            prompt_name: '技术文档助手',
            session_type: 'guided',
            start_time: '2024-01-14T14:20:00Z',
            end_time: '2024-01-14T15:05:00Z',
            duration: 2700,
            interactions_count: 8,
            satisfaction_score: 4.8,
            context_adaptations: 5,
            learning_points: ['用户喜欢详细步骤', '技术背景深厚'],
            status: 'completed'
          },
          {
            id: '3',
            prompt_id: 'prompt_3',
            prompt_name: '商业策略顾问',
            session_type: 'exploratory',
            start_time: '2024-01-13T09:00:00Z',
            end_time: '2024-01-13T10:30:00Z',
            duration: 5400,
            interactions_count: 15,
            satisfaction_score: 4.2,
            context_adaptations: 12,
            learning_points: ['关注ROI分析', '偏好数据驱动决策'],
            status: 'completed'
          }
        ];

        // 根据查询参数过滤数据
        let filteredSessions = sessions;
        
        if (satisfactionFilter !== 'all') {
          const minScore = satisfactionFilter === 'high' ? 4.5 : 
                          satisfactionFilter === 'medium' ? 3.5 : 0;
          const maxScore = satisfactionFilter === 'high' ? 5 :
                          satisfactionFilter === 'medium' ? 4.4 : 3.4;
          filteredSessions = filteredSessions.filter(s => 
            s.satisfaction_score >= minScore && s.satisfaction_score <= maxScore
          );
        }

        if (search) {
          filteredSessions = filteredSessions.filter(s =>
            s.prompt_name.toLowerCase().includes(search.toString().toLowerCase())
          );
        }
        
        res.status(200).json(filteredSessions);
      } catch (error) {
        console.error('Error fetching user sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}