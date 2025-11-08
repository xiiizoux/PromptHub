import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Popover } from '@headlessui/react';
import { BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { notificationApi } from '../../lib/notification-api';
import NotificationList from './NotificationList';

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleViewAll = () => {
    router.push('/notifications');
    setIsOpen(false);
  };

  const handleSettings = () => {
    router.push('/profile/notification-settings');
    setIsOpen(false);
  };

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 定期刷新未读通知数量
  useEffect(() => {
    fetchUnreadCount();

    // 设置定时器，每分钟刷新一次
    timerRef.current = setInterval(fetchUnreadCount, 60000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 通知菜单被关闭后可能需要更新未读数量
  useEffect(() => {
    if (!isOpen) {
      // 短暂延迟，确保所有标记已读操作完成
      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    }
  }, [isOpen]);

  return (
    <Popover className="relative">
      {({ open }) => {
        // 同步外部和内部状态
        if (open !== isOpen) {
          setIsOpen(open);
        }
        
        return (
          <>
            <Popover.Button
              ref={buttonRef}
              className="relative p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-label={`显示通知${unreadCount > 0 ? `，${unreadCount}条未读` : ''}`}
              onClick={() => fetchUnreadCount()}
            >
              {loading ? (
                <div className="h-6 w-6 flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </Popover.Button>

            <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="notifications-menu">
              <div className="max-h-80 overflow-auto">
                <NotificationList
                  maxItems={5}
                  showHeader={false}
                  onClose={() => {
                    if (buttonRef.current) {
                      buttonRef.current.click(); // 关闭弹出框
                    }
                  }}
                />
              </div>
              
              <div className="border-t border-gray-200">
                <button
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
                  onClick={handleViewAll}
                  role="menuitem"
                >
                  查看全部通知
                </button>
                
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleSettings}
                  role="menuitem"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  <span>通知设置</span>
                </button>
              </div>
            </Popover.Panel>
          </>
        );
      }}
    </Popover>
  );
}