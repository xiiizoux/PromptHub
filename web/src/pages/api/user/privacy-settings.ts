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
        // 返回模拟的隐私设置数据
        const privacySettings = {
          learning_enabled: true,
          data_retention_days: 365,
          share_anonymous_insights: false,
          allow_pattern_detection: true,
          context_data_usage: 'personalization_only', // 'personalization_only', 'research_anonymous', 'full_sharing'
          interaction_logging: true,
          performance_analytics: true,
          cross_session_learning: true,
          third_party_integrations: false,
          data_export_format: 'json', // 'json', 'csv', 'both'
          auto_delete_inactive: false,
          inactive_threshold_months: 12,
          encryption_level: 'high', // 'standard', 'high', 'maximum'
          access_logging: true,
          notification_preferences: {
            privacy_updates: true,
            data_usage_reports: false,
            security_alerts: true,
            feature_updates: true,
          },
          consent_records: [
            {
              type: 'data_collection',
              granted: true,
              timestamp: '2024-01-01T00:00:00Z',
              version: '1.0',
            },
            {
              type: 'personalization',
              granted: true,
              timestamp: '2024-01-01T00:00:00Z',
              version: '1.0',
            },
            {
              type: 'analytics',
              granted: false,
              timestamp: '2024-01-01T00:00:00Z',
              version: '1.0',
            },
          ],
          data_categories: {
            interaction_history: { 
              enabled: true, 
              retention_days: 365,
              description: '您与AI的对话记录，用于个性化改进',
            },
            preference_learning: { 
              enabled: true, 
              retention_days: 730,
              description: '从您的使用习惯中学习到的偏好模式',
            },
            performance_metrics: { 
              enabled: true, 
              retention_days: 180,
              description: '响应时间、满意度等性能指标',
            },
            context_adaptations: { 
              enabled: true, 
              retention_days: 365,
              description: 'AI根据您的需求进行的适应性调整记录',
            },
          },
        };
        
        res.status(200).json(privacySettings);
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
        res.status(500).json({ error: 'Failed to fetch privacy settings' });
      }
      break;

    case 'PUT':
      try {
        const { settings } = req.body;
        
        // 这里应该保存到数据库，现在返回成功
        console.log('Updating privacy settings for user:', userId, settings);
        
        res.status(200).json({ 
          message: 'Privacy settings updated successfully',
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({ error: 'Failed to update privacy settings' });
      }
      break;

    case 'POST':
      try {
        const { action, data } = req.body;
        
        switch (action) {
          case 'export_data':
            // 模拟数据导出
            const exportData = {
              export_id: `export_${Date.now()}`,
              status: 'processing',
              estimated_completion: new Date(Date.now() + 300000).toISOString(), // 5分钟后
              download_url: null,
            };
            res.status(202).json(exportData);
            break;
            
          case 'delete_category':
            // 模拟删除特定类别的数据
            console.log('Deleting data category for user:', userId, data.category);
            res.status(200).json({ 
              message: `Data category '${data.category}' deleted successfully`,
              deleted_records: Math.floor(Math.random() * 100) + 1,
            });
            break;
            
          case 'revoke_consent':
            // 模拟撤销同意
            console.log('Revoking consent for user:', userId, data.consent_type);
            res.status(200).json({ 
              message: `Consent for '${data.consent_type}' revoked successfully`,
              effective_date: new Date().toISOString(),
            });
            break;
            
          default:
            res.status(400).json({ error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Error processing privacy action:', error);
        res.status(500).json({ error: 'Failed to process privacy action' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}