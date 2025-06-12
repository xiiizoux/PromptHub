import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { exportPrompts, importPrompts } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface ImportExportProps {
  selectedPrompts?: string[];
  onImportComplete?: () => void;
  className?: string;
}

export const ImportExport: React.FC<ImportExportProps> = ({
  selectedPrompts = [],
  onImportComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    allowDuplicates: false,
    skipDuplicates: true
  });
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (selectedPrompts.length === 0) {
      toast.error('请先选择要导出的提示词');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await exportPrompts(selectedPrompts, exportFormat);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompts_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`已导出 ${selectedPrompts.length} 个提示词`);
      setShowExportModal(false);
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!importData.trim()) {
      toast.error('请提供导入数据');
      return;
    }

    try {
      setIsImporting(true);
      const result = await importPrompts(importData, importOptions);
      setImportResult(result);
      
      if (result.imported_count > 0) {
        toast.success(`成功导入 ${result.imported_count} 个提示词`);
        onImportComplete?.();
      }
      
      if (result.errors && result.errors.length > 0) {
        console.warn('导入警告:', result.errors);
      }
    } catch (error: any) {
      toast.error(error.message || '导入失败');
      setImportResult({ success: false, error: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportData('');
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: CodeBracketIcon, description: '标准JSON格式，包含完整元数据' },
    { value: 'csv', label: 'CSV', icon: TableCellsIcon, description: '表格格式，便于在Excel中查看' },
    { value: 'txt', label: 'TXT', icon: DocumentTextIcon, description: '纯文本格式，易于阅读' }
  ];

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* 导出按钮 */}
      <button
        onClick={() => setShowExportModal(true)}
        disabled={selectedPrompts.length === 0}
        className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        导出 ({selectedPrompts.length})
      </button>

      {/* 导入按钮 */}
      <button
        onClick={() => setShowImportModal(true)}
        className="btn-primary flex items-center gap-2"
      >
        <ArrowUpTrayIcon className="h-4 w-4" />
        导入
      </button>

      {/* 导出模态框 */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-xl border border-neon-cyan/20 p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">导出提示词</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-3">
                    选择导出格式：
                  </p>
                  <div className="space-y-2">
                    {formatOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            exportFormat === option.value
                              ? 'border-neon-cyan bg-neon-cyan/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={exportFormat === option.value}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                            className="sr-only"
                          />
                          <IconComponent className="h-5 w-5 text-neon-cyan mt-0.5" />
                          <div>
                            <div className="text-white font-medium">{option.label}</div>
                            <div className="text-gray-400 text-sm">{option.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? '导出中...' : '开始导出'}
                  </button>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 导入模态框 */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-xl border border-neon-purple/20 p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">导入提示词</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {!importResult ? (
                <div className="space-y-4">
                  {/* 文件上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      选择文件
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.txt,.csv"
                      onChange={handleFileSelect}
                      className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-purple file:text-white hover:file:bg-neon-purple/80"
                    />
                  </div>

                  {/* 或者直接粘贴 */}
                  <div className="text-center text-gray-400">或者</div>

                  {/* 文本输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      粘贴JSON数据
                    </label>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder='粘贴JSON格式的提示词数据...'
                      rows={8}
                      className="input-primary w-full font-mono text-sm"
                    />
                  </div>

                  {/* 导入选项 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      导入选项
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importOptions.skipDuplicates}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            skipDuplicates: e.target.checked
                          }))}
                          className="rounded border-gray-600 bg-gray-800 text-neon-purple focus:ring-neon-purple"
                        />
                        <span className="text-gray-300">跳过重复名称的提示词</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importOptions.allowDuplicates}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            allowDuplicates: e.target.checked
                          }))}
                          className="rounded border-gray-600 bg-gray-800 text-neon-purple focus:ring-neon-purple"
                        />
                        <span className="text-gray-300">允许重复名称（将自动重命名）</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleImport}
                      disabled={isImporting || !importData.trim()}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? '导入中...' : '开始导入'}
                    </button>
                    <button
                      onClick={resetImport}
                      className="btn-secondary"
                    >
                      重置
                    </button>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                /* 导入结果 */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {importResult.success ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    )}
                    <h4 className="text-lg font-medium text-white">
                      {importResult.success ? '导入完成' : '导入失败'}
                    </h4>
                  </div>

                  {importResult.success && (
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        成功导入 <span className="text-green-400 font-medium">{importResult.imported_count}</span> 个提示词
                        （共 {importResult.total_count} 个）
                      </p>
                      
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-yellow-400 text-sm mb-2">警告信息：</p>
                          <div className="bg-yellow-900/20 border border-yellow-400/20 rounded-lg p-3">
                            <ul className="text-sm text-yellow-300 space-y-1">
                              {importResult.errors.map((error: string, index: number) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!importResult.success && (
                    <div className="bg-red-900/20 border border-red-400/20 rounded-lg p-3">
                      <p className="text-red-300">{importResult.error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setImportResult(null);
                        resetImport();
                      }}
                      className="btn-primary"
                    >
                      继续导入
                    </button>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="btn-secondary"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 