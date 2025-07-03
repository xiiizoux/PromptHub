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

  switch (method) {
    case 'GET':
      try {
        // 返回模拟的学习模式数据
        const patterns = [
          {
            id: '1',
            category: '沟通偏好',
            pattern: '偏好简洁直接的回答',
            description: '用户通常对超过200字的回答表现出较低的满意度',
            confidence: 0.87,
            sample_count: 45,
            last_updated: '2024-01-15T10:30:00Z',
            impact_score: 8.5,
            examples: [
              '当询问技术问题时，用户更喜欢步骤化的简短回答',
              '长篇解释通常被跳过或获得较低评分'
            ]
          },
          {
            id: '2',
            category: '内容偏好',
            pattern: '重视实际应用案例',
            description: '包含具体示例的回答获得更高满意度',
            confidence: 0.92,
            sample_count: 38,
            last_updated: '2024-01-14T15:20:00Z',
            impact_score: 9.2,
            examples: [
              '抽象概念配合实际案例时，满意度提升35%',
              '代码示例比纯理论解释更受欢迎'
            ]
          },
          {
            id: '3',
            category: '互动方式',
            pattern: '喜欢引导式对话',
            description: '当AI主动提出后续问题时，用户参与度更高',
            confidence: 0.78,
            sample_count: 52,
            last_updated: '2024-01-13T09:45:00Z',
            impact_score: 7.8,
            examples: [
              '包含"您是否需要我详细解释..."的回答获得更多互动',
              '开放式问题比封闭式结论更能延续对话'
            ]
          },
          {
            id: '4',
            category: '技术深度',
            pattern: '适合中级技术水平',
            description: '既不需要基础解释，也不需要高深理论',
            confidence: 0.85,
            sample_count: 41,
            last_updated: '2024-01-12T14:10:00Z',
            impact_score: 8.1,
            examples: [
              '跳过基本概念解释时满意度更高',
              '过于高深的架构讨论获得较低评分'
            ]
          },
          {
            id: '5',
            category: '时间偏好',
            pattern: '工作时间偏好效率导向',
            description: '9-18点使用时更注重快速解决问题',
            confidence: 0.74,
            sample_count: 67,
            last_updated: '2024-01-11T16:30:00Z',
            impact_score: 6.9,
            examples: [
              '工作时间内的咨询更偏好直接答案',
              '晚间使用时对探索性对话更开放'
            ]
          },
          {
            id: '6',
            category: '格式偏好',
            pattern: '结构化输出更受欢迎',
            description: '使用标题、列表、分段的回答效果更好',
            confidence: 0.91,
            sample_count: 59,
            last_updated: '2024-01-10T11:15:00Z',
            impact_score: 8.7,
            examples: [
              '使用项目符号的回答满意度高出25%',
              '明确的段落结构帮助快速理解'
            ]
          }
        ];
        
        res.status(200).json(patterns);
      } catch (error) {
        console.error('Error fetching learned patterns:', error);
        res.status(500).json({ error: 'Failed to fetch learned patterns' });
      }
      break;

    case 'DELETE':
      try {
        const { patternId } = req.body;
        
        // 这里应该从数据库删除，现在返回成功
        console.log('Deleting learned pattern for user:', userId, patternId);
        
        res.status(200).json({ message: 'Pattern deleted successfully' });
      } catch (error) {
        console.error('Error deleting learned pattern:', error);
        res.status(500).json({ error: 'Failed to delete learned pattern' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}