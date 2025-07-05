import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BeakerIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// 定义A/B测试相关的类型
interface ABTest {
  id: string;
  name: string;
  description: string;
  prompt_id: string;
  creator_id: string;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  traffic_allocation: number;
  test_type: string;
  participant_count?: number;
  variant_a: {
    name: string;
    description: string;
  };
  variant_b: {
    name: string;
    description: string;
  };
  created_at: string;
  updated_at: string;
}

interface ABTestResults {
  total_participants: number;
  confidence_level: number;
  statistical_significance: boolean;
  variant_a_metrics: Record<string, unknown>;
  variant_b_metrics: Record<string, unknown>;
  recommendations?: string;
}

// 临时的API函数，用于演示
const createABTest = async (_data: Partial<ABTest>): Promise<ABTest> => {
  // 这里应该是实际的API调用
  throw new Error('A/B测试功能正在开发中');
};

const getABTests = async (_promptId?: string): Promise<ABTest[]> => {
  // 这里应该是实际的API调用
  return [];
};

const updateABTest = async (_id: string, _data: Partial<ABTest>): Promise<ABTest> => {
  // 这里应该是实际的API调用
  throw new Error('A/B测试功能正在开发中');
};

const getABTestResults = async (_testId: string): Promise<ABTestResults> => {
  // 这里应该是实际的API调用
  throw new Error('A/B测试功能正在开发中');
};

interface ABTestManagerProps {
  promptId?: string;
  className?: string;
}

export const ABTestManager: React.FC<ABTestManagerProps> = ({ 
  promptId, 
  className = '', 
}) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testResults, setTestResults] = useState<ABTestResults | null>(null);

  const fetchABTests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getABTests(promptId);
      setTests(data);
    } catch (error: unknown) {
      console.error('获取A/B测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('获取A/B测试失败: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    if (promptId) {
      fetchABTests();
    }
  }, [promptId, fetchABTests]);

  const handleCreateTest = async (testData: Partial<ABTest>) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    try {
      setIsLoading(true);
      await createABTest({
        ...testData,
        prompt_id: promptId!,
        creator_id: user.id,
      });
      
      toast.success('A/B测试创建成功');
      setShowCreateModal(false);
      await fetchABTests();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('创建A/B测试失败: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTest = async (test: ABTest) => {
    try {
      const newStatus = test.status === 'running' ? 'paused' : 'running';
      await updateABTest(test.id, { status: newStatus });
      
      toast.success(`测试已${newStatus === 'running' ? '启动' : '暂停'}`);
      await fetchABTests();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('更新测试状态失败: ' + errorMessage);
    }
  };

  const handleViewResults = async (test: ABTest) => {
    try {
      const results = await getABTestResults(test.id);
      setTestResults(results);
      setSelectedTest(test);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('获取测试结果失败: ' + errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-4 w-4 text-green-400" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-400" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-blue-400" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-400" />;
      default:
        return <ArrowPathIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'paused':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (!promptId) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <BeakerIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">请选择一个提示词来管理A/B测试</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和创建按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BeakerIcon className="h-6 w-6 text-neon-cyan" />
          <h3 className="text-xl font-semibold text-white">A/B测试管理</h3>
          <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full">
            {tests.length} 个测试
          </span>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <BeakerIcon className="h-4 w-4" />
          创建测试
        </button>
      </div>

      {/* 测试列表 */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12">
          <BeakerIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">还没有A/B测试</h4>
          <p className="text-gray-500 mb-6">创建A/B测试来比较不同版本的提示词效果</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            创建第一个测试
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl border border-neon-cyan/20 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">{test.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)}
                      {test.status === 'running' ? '运行中' : 
                       test.status === 'paused' ? '已暂停' :
                       test.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3">{test.description}</p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">测试类型</span>
                      <p className="text-white font-medium">{test.test_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">流量分配</span>
                      <p className="text-white font-medium">{test.traffic_allocation}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">参与用户</span>
                      <p className="text-white font-medium">{test.participant_count || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">创建时间</span>
                      <p className="text-white font-medium">
                        {new Date(test.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewResults(test)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    查看结果
                  </button>
                  
                  {test.status !== 'completed' && test.status !== 'cancelled' && (
                    <button
                      onClick={() => handleToggleTest(test)}
                      className={`btn-secondary flex items-center gap-2 text-sm ${
                        test.status === 'running' ? 'text-yellow-400' : 'text-green-400'
                      }`}
                    >
                      {test.status === 'running' ? (
                        <>
                          <PauseIcon className="h-4 w-4" />
                          暂停
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4" />
                          启动
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 测试配置预览 */}
              <div className="border-t border-gray-700/50 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-neon-cyan mb-2">版本A（控制组）</h5>
                    <div className="bg-dark-bg-secondary/50 rounded-lg p-3">
                      <p className="text-gray-300 text-sm">{test.variant_a.name}</p>
                      <p className="text-gray-500 text-xs mt-1">{test.variant_a.description}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-neon-pink mb-2">版本B（实验组）</h5>
                    <div className="bg-dark-bg-secondary/50 rounded-lg p-3">
                      <p className="text-gray-300 text-sm">{test.variant_b.name}</p>
                      <p className="text-gray-500 text-xs mt-1">{test.variant_b.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 创建测试模态框 */}
      <CreateTestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTest}
        isLoading={isLoading}
      />

      {/* 测试结果模态框 */}
      <TestResultsModal
        test={selectedTest}
        results={testResults}
        onClose={() => {
          setSelectedTest(null);
          setTestResults(null);
        }}
      />
    </div>
  );
};

// 创建测试模态框组件
interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ABTest>) => void;
  isLoading: boolean;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    test_type: 'content_variation',
    traffic_allocation: 50,
    variant_a: { name: '原始版本', description: '', content: '' },
    variant_b: { name: '测试版本', description: '', content: '' },
    success_metrics: ['response_quality', 'user_satisfaction'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) {return null;}

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-xl border border-neon-cyan/20 p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">创建A/B测试</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div>
              <label htmlFor="test-name" className="block text-sm font-medium text-gray-300 mb-2">
                测试名称
              </label>
              <input
                id="test-name"
                name="test_name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-primary w-full"
                placeholder="例如：标题优化测试"
                required
              />
            </div>

            <div>
              <label htmlFor="test-description" className="block text-sm font-medium text-gray-300 mb-2">
                测试描述
              </label>
              <textarea
                id="test-description"
                name="test_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-primary w-full h-20"
                placeholder="描述这个测试的目的和预期效果"
              />
            </div>

            {/* 测试配置 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="test-type" className="block text-sm font-medium text-gray-300 mb-2">
                  测试类型
                </label>
                <select
                  id="test-type"
                  name="test_type"
                  value={formData.test_type}
                  onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                  className="input-primary w-full"
                >
                  <option value="content_variation">内容变体测试</option>
                  <option value="parameter_tuning">参数调优测试</option>
                  <option value="format_comparison">格式对比测试</option>
                </select>
              </div>

              <div>
                <label htmlFor="traffic-allocation" className="block text-sm font-medium text-gray-300 mb-2">
                  流量分配 (%)
                </label>
                <input
                  id="traffic-allocation"
                  name="traffic_allocation"
                  type="number"
                  min="10"
                  max="100"
                  value={formData.traffic_allocation}
                  onChange={(e) => setFormData({ ...formData, traffic_allocation: parseInt(e.target.value) })}
                  className="input-primary w-full"
                />
              </div>
            </div>

            {/* 版本配置 */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">版本配置</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-neon-cyan">版本A（控制组）</h5>
                  <input
                    id="variant-a-name"
                    name="variant_a_name"
                    type="text"
                    value={formData.variant_a.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant_a: { ...formData.variant_a, name: e.target.value },
                    })}
                    className="input-primary w-full"
                    placeholder="版本名称"
                  />
                  <textarea
                    id="variant-a-description"
                    name="variant_a_description"
                    value={formData.variant_a.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant_a: { ...formData.variant_a, description: e.target.value },
                    })}
                    className="input-primary w-full h-20"
                    placeholder="版本描述"
                  />
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-neon-pink">版本B（实验组）</h5>
                  <input
                    id="variant-b-name"
                    name="variant_b_name"
                    type="text"
                    value={formData.variant_b.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant_b: { ...formData.variant_b, name: e.target.value },
                    })}
                    className="input-primary w-full"
                    placeholder="版本名称"
                  />
                  <textarea
                    id="variant-b-description"
                    name="variant_b_description"
                    value={formData.variant_b.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      variant_b: { ...formData.variant_b, description: e.target.value },
                    })}
                    className="input-primary w-full h-20"
                    placeholder="版本描述"
                  />
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? '创建中...' : '创建测试'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 测试结果模态框组件
interface TestResultsModalProps {
  test: ABTest | null;
  results: ABTestResults | null;
  onClose: () => void;
}

const TestResultsModal: React.FC<TestResultsModalProps> = ({
  test,
  results,
  onClose,
}) => {
  if (!test || !results) {return null;}

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-xl border border-neon-cyan/20 p-6 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">{test.name} - 测试结果</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 测试结果内容 */}
          <div className="space-y-6">
            {/* 概览统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-dark-bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-neon-cyan">{results.total_participants}</p>
                <p className="text-gray-400 text-sm">总参与用户</p>
              </div>
              <div className="text-center p-4 bg-dark-bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-neon-pink">{results.confidence_level}%</p>
                <p className="text-gray-400 text-sm">置信水平</p>
              </div>
              <div className="text-center p-4 bg-dark-bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-neon-yellow">
                  {results.statistical_significance ? '显著' : '不显著'}
                </p>
                <p className="text-gray-400 text-sm">统计显著性</p>
              </div>
            </div>

            {/* 版本对比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-neon-cyan mb-4">版本A（控制组）</h4>
                <div className="space-y-3">
                  {Object.entries(results.variant_a_metrics).map(([metric, value]) => (
                    <div key={metric} className="flex justify-between">
                      <span className="text-gray-400">{metric}</span>
                      <span className="text-white font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-neon-pink mb-4">版本B（实验组）</h4>
                <div className="space-y-3">
                  {Object.entries(results.variant_b_metrics).map(([metric, value]) => (
                    <div key={metric} className="flex justify-between">
                      <span className="text-gray-400">{metric}</span>
                      <span className="text-white font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 建议 */}
            {results.recommendations && (
              <div className="bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-neon-cyan mb-2">测试建议</h4>
                <p className="text-gray-300">{results.recommendations}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 