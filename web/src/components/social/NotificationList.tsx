import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  BellIcon,
  TrashIcon,
  CheckCircleIcon,
  UserPlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowUturnLeftIcon,
  MegaphoneIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { notificationApi } from '../../lib/notification-api';
import { NotificationApi } from '@/types/api';

// 从API类型导入类型定义
type Notification = NotificationApi.Notification;
type NotificationType = NotificationApi.NotificationType;

interface NotificationListProps {
  maxItems?: number;
  showHeader?: boolean;
  showActions?: boolean;
  onClose?: () => void;
  unreadOnly?: boolean;
  grouped?: boolean;
}

export default function NotificationList({
  maxItems,
  showHeader = true,
  showActions = true,
  onClose,
  unreadOnly = false,
  grouped = false
}: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<Notification[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isGrouped] = useState(grouped);

  // 加载通知
  const loadNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications(
        pageNum,
        maxItems || 10,
        unreadOnly,
        isGrouped
      );
      
      if (isGrouped) {
        // 处理分组通知
        const groupedData = response.data as Notification[][];
        if (pageNum === 1) {
          setGroupedNotifications(groupedData);
        } else {
          setGroupedNotifications(prev => [...prev, ...groupedData]);
        }
      } else {
        // 处理普通通知
        const normalData = response.data as Notification[];
        if (pageNum === 1) {
          setNotifications(normalData);
        } else {
          setNotifications(prev => [...prev, ...normalData]);
        }
      }
      
      setHasMore(
        Array.isArray(response.data) &&
        response.data.length > 0 &&
        response.page < response.totalPages
      );
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError('加载通知失败');
      console.error('获取通知失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 标记单个通知已读
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('标记通知已读失败:', err);
    }
  };

  // 标记所有通知已读
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('标记所有通知已读失败:', err);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('删除通知失败:', err);
    }
  };

  // 加载更多通知
  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  // 首次加载
  useEffect(() => {
    loadNotifications();
  }, []);

  // 获取通知图标
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlusIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />;
      case 'like':
        return <HeartIcon className="h-5 w-5 text-red-500" aria-hidden="true" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />;
      case 'reply':
        return <ArrowUturnLeftIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />;
      case 'mention':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />;
      case 'system':
        return <MegaphoneIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />;
    }
  };

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 如果未读，标记为已读
    if (!notification.is_read) {
      await markAsRead(notification.id!);
    }

    // 根据通知类型导航到相应页面
    if (notification.related_id) {
      switch (notification.type) {
        case 'like':
        case 'comment':
        case 'reply':
          // 导航到提示词详情页
          router.push(`/prompts/${notification.related_id}`);
          break;
        case 'follow':
          // 导航到用户个人页面
          router.push(`/profile/${notification.actor_id}`);
          break;
        default:
          break;
      }
    }

    // 如果有onClose回调（例如从下拉菜单打开），则关闭菜单
    if (onClose) {
      onClose();
    }
  };

  // 渲染通知项
  const renderNotificationItem = (notification: Notification) => {
    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
      addSuffix: true,
      locale: zhCN
    });
    
    // 获取第一个字母用于头像显示
    const avatarText = notification.actor?.display_name?.charAt(0).toUpperCase() || 
                       notification.actor?.email?.charAt(0).toUpperCase() || '';
    
    return (
      <div key={notification.id} className="relative">
        <div
          className={`flex items-start p-3 ${notification.is_read ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
          onClick={() => handleNotificationClick(notification)}
          role="button"
          tabIndex={0}
          aria-label={`${notification.is_read ? '已读通知' : '未读通知'}：${notification.content}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleNotificationClick(notification);
            }
          }}
        >
          {/* 头像部分 */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
              {avatarText || getNotificationIcon(notification.type)}
            </div>
          </div>
          
          {/* 内容部分 */}
          <div className="ml-3 flex-1">
            <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
              {notification.content}
            </p>
            <div className="mt-1 flex items-center text-xs">
              <span className="text-gray-500">{timeAgo}</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {{
                  'follow': '关注',
                  'like': '点赞',
                  'comment': '评论',
                  'reply': '回复',
                  'mention': '提及',
                  'system': '系统'
                }[notification.type] || notification.type}
              </span>
            </div>
          </div>
          
          {/* 删除按钮 */}
          {showActions && (
            <button 
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id!);
              }}
              aria-label="删除通知"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="border-b border-gray-100"></div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white shadow rounded-md overflow-hidden">
      {/* 头部 */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">通知</h2>
          
          {showActions && (
            <button
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={markAllAsRead}
              aria-label="标记所有通知为已读"
              title="标记所有已读"
            >
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      
      {/* 内容 */}
      <div className="overflow-auto" style={{ maxHeight: maxItems ? `${maxItems * 80}px` : 'auto' }}>
        {/* 加载中 */}
        {loading && page === 1 ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          /* 加载错误 */
          <div className="p-4 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => loadNotifications()}
            >
              重试
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* 无通知 */
          <div className="p-8 text-center">
            <BellIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-gray-500">暂无通知</p>
          </div>
        ) : (
          /* 通知列表 */
          <div className="divide-y divide-gray-100">
            {notifications.map(renderNotificationItem)}
          </div>
        )}
      </div>
      
      {/* 加载更多 */}
      {hasMore && (
        <div className="p-3 text-center border-t border-gray-100">
          <button 
            className="inline-flex items-center px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                加载中...
              </>
            ) : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
}