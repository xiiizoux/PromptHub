import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ServerIcon,
  CpuChipIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { getSystemPerformance } from '@/lib/api';
import toast from 'react-hot-toast';

interface SystemDashboardProps {
  className?: string;
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({ className = '' }) => {
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSystemData();
    
    // 自动刷新（每5分钟）
    const interval = setInterval(fetchSystemData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const fetchSystemData = async () => {
    try {
      setIsLoading(true);
      const data = await getSystemPerformance();
      setSystemData(data);
    } catch (error: any) {
      console.error('获取系统数据失败:', error);
      toast.error('获取系统数据失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return { color: 'text-green-400', bgColor: 'bg-green-400', label: '优秀' };
      case 'good':
        return { color: 'text-blue-400', bgColor: 'bg-blue-400', label: '良好' };
      case 'fair':
        return { color: 'text-yellow-400', bgColor: 'bg-yellow-400', label: '一般' };
      case 'poor':
        return { color: 'text-red-400', bgColor: 'bg-red-400', label: '需要关注' };
      default:
        return { color: 'text-gray-400', bgColor: 'bg-gray-400', label: '未知' };
    }
  };

  if (isLoading && !systemData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">加载系统数据中...</p>
      </div>
    );
  }

  if (!systemData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ServerIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">暂无系统数据</p>
      </div>
    );
  }

  const healthInfo = getHealthColor(systemData.system_health);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ServerIcon className="h-6 w-6 text-neon-cyan" />
          <h3 className="text-xl font-semibold text-white">系统监控仪表板</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${healthInfo.color} bg-opacity-20 border border-current`}>
            系统状态: {healthInfo.label}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            最后更新: {new Date().toLocaleTimeString('zh-CN')}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ClockIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl border border-neon-cyan/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-6 w-6 text-neon-cyan" />
              <span className="text-gray-400">总提示词数</span>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {systemData.total_prompts?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500">活跃内容</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl border border-neon-purple/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-neon-purple" />
              <span className="text-gray-400">活跃用户</span>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {systemData.active_users?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500">过去24小时</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl border border-neon-pink/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CpuChipIcon className="h-6 w-6 text-neon-pink" />
              <span className="text-gray-400">平均响应时间</span>
            </div>
            {systemData.avg_response_time < 1000 ? 
              <CheckCircleIcon className="h-5 w-5 text-green-400" /> :
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            }
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {systemData.avg_response_time || 0}ms
          </div>
          <div className="text-sm text-gray-500">系统性能</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl border border-neon-yellow/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="h-6 w-6 text-neon-yellow" />
              <span className="text-gray-400">系统健康度</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${healthInfo.bgColor}`} />
          </div>
          <div className={`text-3xl font-bold mb-2 ${healthInfo.color}`}>
            {healthInfo.label}
          </div>
          <div className="text-sm text-gray-500">综合评估</div>
        </motion.div>
      </div>

      {/* 最近活动 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl border border-neon-cyan/20 p-6"
      >
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-neon-cyan" />
          最近活动
        </h4>
        
        <div className="space-y-3">
          {systemData.recent_activity?.slice(0, 5).map((activity: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center justify-between p-3 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                <div>
                  <div className="text-white font-medium">
                    {activity.prompt_name}
                  </div>
                  <div className="text-sm text-gray-400">
                    用户 {activity.user_id?.substring(0, 8)}... 
                    {new Date(activity.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  activity.performance_score >= 80 ? 'bg-green-400/20 text-green-400' :
                  activity.performance_score >= 60 ? 'bg-yellow-400/20 text-yellow-400' :
                  'bg-red-400/20 text-red-400'
                }`}>
                  {activity.performance_score}/100
                </span>
              </div>
            </motion.div>
          )) || (
            <div className="text-center py-4 text-gray-500">
              暂无最近活动数据
            </div>
          )}
        </div>
      </motion.div>

      {/* 简化的性能指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API健康状态 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl border border-green-400/20 p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            API可用性
          </h4>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">98%</div>
            <p className="text-sm text-gray-400">99.8% SLA</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '98%' }}></div>
            </div>
          </div>
        </motion.div>

        {/* 数据库性能 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl border border-blue-400/20 p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CpuChipIcon className="h-5 w-5 text-blue-400" />
            数据库性能
          </h4>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">95%</div>
            <p className="text-sm text-gray-400">平均查询 &lt; 50ms</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
        </motion.div>

        {/* 存储使用率 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-xl border border-yellow-400/20 p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-yellow-400" />
            存储使用率
          </h4>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">85%</div>
            <p className="text-sm text-gray-400">1.2TB / 2.0TB</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 