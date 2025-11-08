import React, { useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';
import {
  notificationApi,
  NotificationPreference,
  DigestFrequency,
} from '../../lib/notification-api';

interface NotificationPreferencesProps {
  onSaved?: () => void;
}

export default function NotificationPreferences({ onSaved }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successTimeout, setSuccessTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 加载用户通知偏好设置
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const data = await notificationApi.getPreferences();
        setPreferences(data);
        setError(null);
      } catch (err) {
        setError('加载通知偏好设置失败');
        console.error('获取通知偏好设置失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (successTimeout) {
        clearTimeout(successTimeout);
      }
    };
  }, [successTimeout]);

  // 处理开关变更
  const handleSwitchChange = (checked: boolean, name: keyof NotificationPreference) => {
    if (!preferences) {return;}
    setPreferences({ ...preferences, [name]: checked });
  };

  // 处理下拉菜单变更
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!preferences) {return;}
    
    const name = event.target.name as keyof NotificationPreference;
    const value = event.target.value;
    if (name) {
      setPreferences({ ...preferences, [name]: value });
    }
  };

  // 保存偏好设置
  const savePreferences = async () => {
    if (!preferences) {return;}
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // 清除之前的定时器
      if (successTimeout) {
        clearTimeout(successTimeout);
        setSuccessTimeout(null);
      }
      
      await notificationApi.updatePreferences(preferences);
      
      setSuccess(true);
      if (onSaved) {
        onSaved();
      }
      
      // 3秒后自动隐藏成功消息
      const timeout = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      setSuccessTimeout(timeout);
    } catch (err) {
      setError('保存通知偏好设置失败');
      console.error('更新通知偏好设置失败:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
        无法加载通知偏好设置。请刷新页面重试。
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-2">
        通知偏好设置
      </h2>
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">
            接收通知类型
          </h3>
          
          <div className="space-y-4">
            <ToggleSwitch
              checked={preferences.follow_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'follow_notifications')}
              label="关注通知"
            />
            
            <ToggleSwitch
              checked={preferences.like_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'like_notifications')}
              label="点赞通知"
            />
            
            <ToggleSwitch
              checked={preferences.comment_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'comment_notifications')}
              label="评论通知"
            />
            
            <ToggleSwitch
              checked={preferences.reply_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'reply_notifications')}
              label="回复通知"
            />
            
            <ToggleSwitch
              checked={preferences.mention_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'mention_notifications')}
              label="提及通知"
            />
            
            <ToggleSwitch
              checked={preferences.system_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'system_notifications')}
              label="系统通知"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">
            通知方式
          </h3>
          
          <div className="space-y-4">
            <ToggleSwitch
              checked={preferences.email_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'email_notifications')}
              label="接收邮件通知"
            />
            
            <ToggleSwitch
              checked={preferences.push_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'push_notifications')}
              label="接收推送通知"
            />
            
            <ToggleSwitch
              checked={preferences.digest_notifications}
              onChange={(checked) => handleSwitchChange(checked, 'digest_notifications')}
              label="接收汇总通知"
            />
            
            {preferences.digest_notifications && (
              <div className="mt-2">
                <label htmlFor="digest-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  汇总频率
                </label>
                <select
                  id="digest-frequency"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={preferences.digest_frequency}
                  onChange={handleSelectChange}
                  name="digest_frequency"
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end items-center">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md mr-4 flex-grow">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md mr-4 flex-grow">
            设置已保存
          </div>
        )}
        
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          onClick={savePreferences}
          disabled={saving}
          aria-label="保存设置"
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : '保存设置'}
        </button>
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <Switch.Group as="div">
      <div className="flex items-center">
        <Switch
          checked={checked}
          onChange={onChange}
          className={`${
            checked ? 'bg-indigo-600' : 'bg-gray-200'
          } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          <span className="sr-only">{checked ? '开启' : '关闭'}{label}</span>
          <span
            aria-hidden="true"
            className={`${
              checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
          />
        </Switch>
        <Switch.Label className="ml-3 text-sm text-gray-700">{label}</Switch.Label>
      </div>
    </Switch.Group>
  );
}