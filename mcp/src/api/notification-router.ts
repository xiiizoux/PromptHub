import express from 'express';
import { StorageFactory } from '../storage/storage-factory.js';
import {
  StorageAdapter,
  Notification,
  NotificationType,
  NotificationPreference,
  User
} from '../types.js';
import { authenticateRequest } from './auth-middleware.js';

// 创建通知路由器
const router = express.Router();
const storage: StorageAdapter = StorageFactory.getStorage();

// WebSocket 连接管理
const userConnections = new Map<string, Set<any>>();

// 记录用户WebSocket连接
export const registerUserConnection = (userId: string, connection: any) => {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  
  userConnections.get(userId)?.add(connection);
  console.log(`用户 ${userId} 的WebSocket连接已注册`);
};

// 移除用户WebSocket连接
export const removeUserConnection = (userId: string, connection: any) => {
  if (userConnections.has(userId)) {
    userConnections.get(userId)?.delete(connection);
    
    // 如果没有连接了，移除用户
    if (userConnections.get(userId)?.size === 0) {
      userConnections.delete(userId);
    }
    
    console.log(`用户 ${userId} 的WebSocket连接已移除`);
  }
};

// 向用户发送WebSocket消息
const sendUserWebSocketMessage = (userId: string, message: any) => {
  if (userConnections.has(userId)) {
    const connections = userConnections.get(userId);
    
    if (connections && connections.size > 0) {
      const messageString = JSON.stringify(message);
      
      connections.forEach(connection => {
        try {
          connection.send(messageString);
        } catch (error) {
          console.error(`向用户 ${userId} 发送WebSocket消息失败:`, error);
        }
      });
      
      console.log(`向用户 ${userId} 发送WebSocket消息:`, message.type);
      return true;
    }
  }
  
  return false;
};

// 获取用户通知
router.get('/', authenticateRequest, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const grouped = req.query.grouped === 'true';
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }
    
    let notifications;
    if (grouped) {
      notifications = await storage.getGroupedNotifications(req.user.id, page, pageSize);
    } else {
      notifications = await storage.getUserNotifications(req.user.id, page, pageSize, unreadOnly);
    }
    
    return res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取未读通知数量
router.get('/unread-count', authenticateRequest, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }
    
    const count = await storage.getUnreadNotificationCount(req.user.id);
    
    return res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 标记通知为已读
router.post('/mark-read', authenticateRequest, async (req, res) => {
  try {
    const { notificationId, allNotifications } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }
    
    let result;
    if (allNotifications) {
      // 标记所有通知为已读
      result = await storage.markAllNotificationsAsRead(req.user.id);
    } else if (notificationId) {
      // 标记单个通知为已读
      result = await storage.markNotificationAsRead(notificationId, req.user.id);
    } else {
      throw new Error('缺少必需参数: notificationId 或 allNotifications');
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('标记通知已读失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除通知
router.delete('/:id', authenticateRequest, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }
    
    const result = await storage.deleteNotification(notificationId, req.user.id);
    
    return res.json({
      success: true,
      data: { deleted: result }
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取通知偏好设置
router.get('/preferences', authenticateRequest, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }
    
    const preferences = await storage.getUserNotificationPreferences(req.user.id);
    
    return res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('获取通知偏好设置失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新通知偏好设置
router.put('/preferences', authenticateRequest, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }
    
    const preferences = req.body;
    const updatedPreferences = await storage.updateUserNotificationPreferences(req.user.id, preferences);
    
    return res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('更新通知偏好设置失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 创建通知 (内部API，不对外暴露)
export const createNotification = async (
  userId: string,
  type: NotificationType,
  content: string,
  relatedId?: string,
  actorId?: string,
  groupId?: string
): Promise<Notification | null> => {
  try {
    // 检查用户是否接收此类型的通知
    const shouldSend = await storage.shouldSendNotification(userId, type);
    if (!shouldSend) {
      console.log(`用户 ${userId} 的偏好设置不接收 ${type} 类型的通知`);
      return null;
    }

    // 创建通知
    const notification = await storage.createNotification({
      user_id: userId,
      type,
      content,
      related_id: relatedId,
      actor_id: actorId,
      is_read: false,
      created_at: new Date().toISOString(),
      group_id: groupId
    });
    
    // 获取用户通知偏好设置
    const preferences = await storage.getUserNotificationPreferences(userId);
    
    // 通过WebSocket发送实时通知
    if (notification) {
      // 获取触发者信息（如果有）
      if (actorId) {
        try {
          const actorData = await storage.getUser(actorId);
          if (actorData) {
            notification.actor = actorData;
          }
        } catch (err) {
          console.error('获取触发者信息失败:', err);
        }
      }
      
      // 发送WebSocket通知
      sendUserWebSocketMessage(userId, {
        type: 'notification',
        data: notification
      });
      
      // TODO: 如果用户启用了邮件通知，发送邮件
      if (preferences.email_notifications) {
        // 实现邮件发送逻辑
        // sendEmail(userId, notification);
      }
      
      // TODO: 如果用户启用了推送通知，发送推送
      if (preferences.push_notifications) {
        // 实现推送通知逻辑
        // sendPushNotification(userId, notification);
      }
    }
    
    return notification;
  } catch (error) {
    console.error('创建通知失败:', error);
    throw error;
  }
};

// 批量创建通知 (例如关注用户时，通知所有粉丝)
export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  content: string,
  relatedId?: string,
  actorId?: string,
  groupId?: string
): Promise<number> => {
  try {
    // 过滤掉重复的用户ID
    const uniqueUserIds = [...new Set(userIds)];
    
    // 创建一个通用的组ID，用于将这批通知分组
    const commonGroupId = groupId || `group_${Date.now()}_${type}`;
    
    // 批量创建通知
    const results = await Promise.allSettled(
      uniqueUserIds.map(userId =>
        createNotification(userId, type, content, relatedId, actorId, commonGroupId)
      )
    );
    
    // 计算成功创建的通知数量
    const successCount = results.filter(result =>
      result.status === 'fulfilled' && result.value !== null
    ).length;
    
    return successCount;
  } catch (error) {
    console.error('批量创建通知失败:', error);
    throw error;
  }
};

// 为存储适配器添加getUser方法
declare module '../types.js' {
  interface StorageAdapter {
    getUser(userId: string): Promise<User | null>;
  }
}

export default router;