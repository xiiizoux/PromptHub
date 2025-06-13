import React from 'react';

interface PerformanceMonitorProps {
  promptId: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ promptId }) => {
  // TODO: 实现性能监控逻辑
  return (
    <div className="glass rounded-xl border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">性能监控</h3>
      <p className="text-gray-400">
        正在监控提示词 ID: {promptId} 的性能数据...
      </p>
      {/* 这里将来会添加实际的性能监控图表和数据 */}
    </div>
  );
};

export { PerformanceMonitor };
export default PerformanceMonitor; 