import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuth } from '../../../../middleware/withApiAuth';
import axios from 'axios';
import { ApiResponse, NotificationApi } from '@/types/api';

// 从环境变量中获取MCP服务器URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:9010';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { method } = req;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    // 获取通知列表
    if (method === 'GET') {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';
      const grouped = req.query.grouped === 'true';

      const endpoint = grouped
        ? `/api/notifications?grouped=true&page=${page}&pageSize=${pageSize}`
        : `/api/notifications?page=${page}&pageSize=${pageSize}&unreadOnly=${unreadOnly}`;

      const { data } = await axios.get(`${MCP_SERVER_URL}${endpoint}`, {
        headers: {
          Authorization: authHeader
        }
      });
      
      return res.status(200).json(data);
    }

    // 标记通知为已读
    if (method === 'POST') {
      const { notificationId, allNotifications } = req.body as NotificationApi.MarkAsReadRequest;
      
      const { data } = await axios.post<ApiResponse<{ success: boolean }>>(
        `${MCP_SERVER_URL}/api/notifications/mark-read`,
        {
          notificationId,
          allNotifications
        },
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          }
        }
      );
      
      return res.status(200).json(data);
    }

    // 删除通知
    if (method === 'DELETE') {
      const { notificationId } = req.query;
      
      if (!notificationId) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数: notificationId'
        });
      }
      
      const { data } = await axios.delete(
        `${MCP_SERVER_URL}/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: authHeader
          }
        }
      );
      
      return res.status(200).json(data);
    }

    return res.status(405).json({ success: false, error: '方法不允许' });
  } catch (error) {
    console.error('通知API错误:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}

export default withApiAuth(handler);