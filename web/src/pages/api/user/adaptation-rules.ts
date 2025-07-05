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
        // 返回模拟的适应规则数据
        const rules = [
          {
            id: '1',
            name: '工作时间正式语调',
            description: '在工作时间（9-18点）使用更正式的语调',
            condition: 'time_range',
            action: 'set_tone_formal',
            priority: 1,
            enabled: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: '编程问题技术风格',
            description: '当提问涉及编程时，采用技术性更强的回答风格',
            condition: 'content_category_programming',
            action: 'set_style_technical',
            priority: 2,
            enabled: true,
            created_at: '2024-01-02T00:00:00Z',
          },
          {
            id: '3',
            name: '移动设备简洁回答',
            description: '在移动设备上使用时，提供更简洁的回答',
            condition: 'device_mobile',
            action: 'set_length_concise',
            priority: 3,
            enabled: false,
            created_at: '2024-01-03T00:00:00Z',
          },
        ];
        
        res.status(200).json(rules);
      } catch (error) {
        console.error('Error fetching adaptation rules:', error);
        res.status(500).json({ error: 'Failed to fetch adaptation rules' });
      }
      break;

    case 'POST':
      try {
        const { rule } = req.body;
        
        // 这里应该保存到数据库，现在返回成功
        console.log('Creating rule for user:', userId, rule);
        
        const newRule = {
          id: Date.now().toString(),
          ...rule,
          created_at: new Date().toISOString(),
        };
        
        res.status(201).json(newRule);
      } catch (error) {
        console.error('Error creating adaptation rule:', error);
        res.status(500).json({ error: 'Failed to create adaptation rule' });
      }
      break;

    case 'PUT':
      try {
        const { ruleId, updates } = req.body;
        
        // 这里应该更新数据库，现在返回成功
        console.log('Updating rule for user:', userId, ruleId, updates);
        
        res.status(200).json({ message: 'Rule updated successfully' });
      } catch (error) {
        console.error('Error updating adaptation rule:', error);
        res.status(500).json({ error: 'Failed to update adaptation rule' });
      }
      break;

    case 'DELETE':
      try {
        const { ruleId } = req.body;
        
        // 这里应该从数据库删除，现在返回成功
        console.log('Deleting rule for user:', userId, ruleId);
        
        res.status(200).json({ message: 'Rule deleted successfully' });
      } catch (error) {
        console.error('Error deleting adaptation rule:', error);
        res.status(500).json({ error: 'Failed to delete adaptation rule' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}