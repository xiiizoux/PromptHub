import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuth } from '../../../../middleware/withApiAuth';
import axios from 'axios';
import { NotificationApi } from '@/types/api';

// 从环境变量中获取MCP服务器URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:9010';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { method } = req;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    // 获取通知偏好设置
    if (method === 'GET') {
      const { data } = await axios.get<NotificationApi.GetPreferencesResponse>(
        `${MCP_SERVER_URL}/api/notifications/preferences`,
        {
          headers: {
            Authorization: authHeader,
          },
        },
      );
      
      return res.status(200).json(data);
    }

    // 更新通知偏好设置
    if (method === 'PUT') {
      const preferences = req.body as Partial<NotificationApi.NotificationPreference>;
      
      const { data } = await axios.put<NotificationApi.UpdatePreferencesResponse>(
        `${MCP_SERVER_URL}/api/notifications/preferences`,
        preferences,
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        },
      );
      
      return res.status(200).json(data);
    }

    return res.status(405).json({ success: false, error: '方法不允许' });
  } catch (error) {
    console.error('通知偏好设置API错误:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}

export default withApiAuth(handler);