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
      return res.status(401).json({ 
        success: false, 
        error: '未授权访问', 
      });
    }

    // 只允许GET请求
    if (method !== 'GET') {
      return res.status(405).json({ 
        success: false, 
        error: '方法不允许', 
      });
    }

    // 请求MCP服务器获取未读通知数量
    const { data } = await axios.get<NotificationApi.GetUnreadCountResponse>(
      `${MCP_SERVER_URL}/api/notifications/unread-count`,
      {
        headers: {
          Authorization: authHeader,
        },
      },
    );
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('获取未读通知数量错误:', error);
    return res.status(500).json({
      success: false,
      data: { count: 0 },
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}

export default withApiAuth(handler);