import axios from 'axios';
import { ApiResponse, PaginatedResponse, NotificationApi } from '@/types/api';

// 从类型定义中导出需要的类型
export type NotificationType = NotificationApi.NotificationType;
export type DigestFrequency = NotificationApi.DigestFrequency;
export type Notification = NotificationApi.Notification;
export type NotificationPreference = NotificationApi.NotificationPreference;

// 统一的数据提取助手，消除多层嵌套问题
function extractNotificationData<T>(response: any, fallback: T): T {
  // 处理标准API响应格式: response.data.data
  if (response?.data?.success && response.data.data !== undefined) {
    return response.data.data;
  }
  // 处理简单格式: response.data
  if (response?.data !== undefined) {
    return response.data;
  }
  return fallback;
}

// 安全的可选数据提取
function _extractOptionalNotificationData<T>(response: any, fallback: T | null = null): T | null {
  try {
    return extractNotificationData(response, fallback);
  } catch {
    return fallback;
  }
}

/**
 * 通知API客户端
 */
export const notificationApi = {
  /**
   * 获取通知列表
   * @param page 页码
   * @param pageSize 每页大小
   * @param unreadOnly 是否只获取未读通知
   * @param grouped 是否按组获取通知
   */
  getNotifications: async (
    page: number = 1,
    pageSize: number = 20,
    unreadOnly: boolean = false,
    grouped: boolean = false,
  ): Promise<PaginatedResponse<Notification> | PaginatedResponse<Notification[]>> => {
    const response = await axios.get<NotificationApi.GetNotificationsResponse>('/api/social/notifications', {
      params: { page, pageSize, unreadOnly, grouped },
    });
    return extractNotificationData(response, { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await axios.get<NotificationApi.GetUnreadCountResponse>('/api/social/notifications/unread-count');
    const data = extractNotificationData(response, { count: 0 });
    return data.count || 0;
  },

  /**
   * 标记通知为已读
   * @param notificationId 通知ID，如果为undefined则标记所有通知为已读
   */
  markAsRead: async (notificationId?: string): Promise<{ success: boolean }> => {
    const request: NotificationApi.MarkAsReadRequest = {
      notificationId,
      allNotifications: !notificationId,
    };
    const response = await axios.post<NotificationApi.MarkAsReadResponse>('/api/social/notifications', request);
    return { success: response.data.success };
  },

  /**
   * 删除通知
   * @param notificationId 通知ID
   */
  deleteNotification: async (notificationId: string): Promise<{ success: boolean }> => {
    const response = await axios.delete<ApiResponse<{ deleted: boolean }>>(`/api/social/notifications?notificationId=${notificationId}`);
    const data = extractNotificationData(response, { deleted: false });
    return { success: data.deleted || false };
  },

  /**
   * 获取通知偏好设置
   */
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await axios.get<NotificationApi.GetPreferencesResponse>('/api/social/notifications/preferences');
    const data = extractNotificationData(response, null);
    if (!data) {
      throw new Error('获取通知偏好设置失败');
    }
    return data;
  },

  /**
   * 更新通知偏好设置
   * @param preferences 通知偏好设置
   */
  updatePreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await axios.put<NotificationApi.UpdatePreferencesResponse>(
      '/api/social/notifications/preferences',
      preferences,
    );
    const data = extractNotificationData(response, null);
    if (!data) {
      throw new Error('更新通知偏好设置失败');
    }
    return data;
  },
};