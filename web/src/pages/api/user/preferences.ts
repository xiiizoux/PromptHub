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
        // 返回模拟的用户偏好数据
        const preferences = {
          language: 'zh-CN',
          style: 'professional',
          format: 'structured',
          tone: 'friendly',
          complexity: 'intermediate',
          domain_knowledge: ['technology', 'business'],
          output_length: 'medium',
          creative_freedom: 7,
          factual_accuracy: 9,
          personalization_level: 8
        };
        
        res.status(200).json(preferences);
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
      }
      break;

    case 'PUT':
      try {
        const { preferences } = req.body;
        
        // 这里应该保存到数据库，现在返回成功
        console.log('Updating preferences for user:', userId, preferences);
        
        res.status(200).json({ message: 'Preferences updated successfully' });
      } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}