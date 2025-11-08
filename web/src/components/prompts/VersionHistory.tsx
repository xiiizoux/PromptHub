import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { PromptVersion } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';
import VersionComparison from './VersionComparison';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface VersionHistoryProps {
  isOpen?: boolean;
  onClose?: () => void;
  promptId: string;
  currentVersion: number;
  onVersionRevert?: (versionId: string) => void;
  inline?: boolean;
  className?: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen = false,
  onClose,
  promptId,
  currentVersion,
  onVersionRevert,
  inline = false,
  className = '',
}) => {
  const { t } = useLanguage();
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<PromptVersion[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if ((isOpen || inline) && promptId) {
      fetchVersions();
    }
  }, [isOpen, inline, promptId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('开始获取版本历史，promptId:', promptId);

      // 获取认证 token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error(t('versionHistory.errors.notAuthenticated'));
      }

      const response = await fetch(`/api/prompts/${promptId}/versions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('版本历史API响应状态:', response.status);

      const data = await response.json();
      console.log('版本历史API响应数据:', data);

      if (!response.ok) {
        throw new Error(data.error || t('versionHistory.errors.fetchFailed'));
      }

      const versions = data.data || [];
      console.log('获取到版本历史数量:', versions.length);
      setVersions(versions);
    } catch (err) {
      console.error('获取版本历史失败:', err);
      setError(err instanceof Error ? err.message : t('versionHistory.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!onVersionRevert) {return;}

    setReverting(versionId);

    try {
      // 获取认证 token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error(t('versionHistory.errors.notAuthenticated'));
      }

      const response = await fetch(`/api/prompts/${promptId}/revert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('versionHistory.errors.revertFailed'));
      }

      onVersionRevert(versionId);
      onClose && onClose();
    } catch (err) {
      console.error('版本回滚失败:', err);
      setError(err instanceof Error ? err.message : t('versionHistory.errors.revertFailed'));
    } finally {
      setReverting(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleCompareToggle = (version: PromptVersion) => {
    if (!compareMode) {return;}
    
    setSelectedForComparison(prev => {
      const isSelected = prev.some(v => v.id === version.id);
      if (isSelected) {
        return prev.filter(v => v.id !== version.id);
      } else if (prev.length < 2) {
        return [...prev, version];
      } else {
        // 如果已经选择了2个，替换第一个
        return [prev[1], version];
      }
    });
  };

  const startComparison = () => {
    if (selectedForComparison.length === 2) {
      setShowComparison(true);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedForComparison([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = t('versionHistory.title') === 'Version History' ? 'en-US' : 'zh-CN';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染版本历史内容
  const renderVersionHistoryContent = () => (
    <div className={inline ? className : ''}>
      {/* 标题和控制按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <ClockIcon className="h-6 w-6 mr-2 text-neon-cyan" />
          {t('versionHistory.title')}
        </h3>
        <div className="flex items-center space-x-3">
          {!compareMode ? (
            <button
              onClick={() => setCompareMode(true)}
              className="px-3 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center space-x-2"
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
              <span>{t('versionHistory.compareMode')}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={startComparison}
                disabled={selectedForComparison.length !== 2}
                className="px-3 py-2 rounded-lg bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors disabled:opacity-50"
              >
                {t('versionHistory.compare', { count: selectedForComparison.length })}
              </button>
              <button
                onClick={exitCompareMode}
                className="px-3 py-2 rounded-lg bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
              >
                {t('versionHistory.cancel')}
              </button>
            </div>
          )}
          {!inline && onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 媒体版本管理说明 */}
      <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-400 mt-0.5">⚠️</span>
          <div className="text-sm">
            <p className="font-medium mb-1">{t('versionHistory.mediaFilesNoticeTitle')}</p>
            <p>{t('versionHistory.mediaFilesNoticeDesc')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-neon-red/10 border border-neon-red/30 text-neon-red">
          {error}
        </div>
      )}

      {compareMode && (
        <div className="mb-4 p-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
          <p className="text-sm">
            {t('versionHistory.compareModeHint', { count: selectedForComparison.length })}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-300">{t('versionHistory.loading')}</span>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('versionHistory.noHistory')}</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {versions.map((version, index) => {
            const isCurrentVersion = version.version === currentVersion;
            const isSelectedForComparison = selectedForComparison.some(v => v.id === version.id);

            return (
              <div
                key={version.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isCurrentVersion
                    ? 'bg-neon-green/10 border-neon-green/30'
                    : isSelectedForComparison
                    ? 'bg-neon-purple/10 border-neon-purple/30'
                    : 'bg-dark-bg-secondary/50 border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => compareMode && handleCompareToggle(version)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        isCurrentVersion
                          ? 'bg-neon-green/20 text-neon-green'
                          : 'bg-neon-cyan/20 text-neon-cyan'
                      }`}>
                        v{formatVersionDisplay(version.version)}
                      </span>
                      {isCurrentVersion && (
                        <span className="px-2 py-1 rounded text-xs bg-neon-green/20 text-neon-green">
                          {t('versionHistory.currentVersion')}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">
                        {formatDate(version.created_at)}
                      </span>
                    </div>

                    {version.description && (
                      <p className="text-gray-300 text-sm mb-2">
                        {version.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{t('versionHistory.contentLength', { length: version.content.length })}</span>
                      {version.tags && version.tags.length > 0 && (
                        <span>• {t('versionHistory.tagsCount', { count: version.tags.length })}</span>
                      )}
                    </div>
                  </div>

                  {!compareMode && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('点击查看版本:', version);
                          setSelectedVersion(version);
                          setShowContent(true);
                          console.log('设置状态完成 - selectedVersion:', version.id, 'showContent:', true);
                        }}
                        className="px-3 py-1 rounded bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors text-sm flex items-center space-x-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>{t('versionHistory.view')}</span>
                      </button>

                      {!isCurrentVersion && onVersionRevert && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevert(version.id);
                          }}
                          disabled={reverting === version.id}
                          className="px-3 py-1 rounded bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors text-sm flex items-center space-x-1 disabled:opacity-50"
                        >
                          <ArrowUturnLeftIcon className="h-4 w-4" />
                          <span>{reverting === version.id ? t('versionHistory.reverting') : t('versionHistory.revert')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 内联模式直接返回内容
  if (inline) {
    return (
      <>
        {renderVersionHistoryContent()}

        {/* 版本对比弹窗 */}
        {selectedForComparison.length === 2 && (
          <VersionComparison
            isOpen={showComparison}
            onClose={() => setShowComparison(false)}
            version1={selectedForComparison[0]}
            version2={selectedForComparison[1]}
          />
        )}
      </>
    );
  }

  // 弹窗模式
  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={onClose || (() => {})}>
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-black bg-opacity-25"
        />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
              className="w-full max-w-4xl transform overflow-hidden rounded-2xl glass border border-neon-cyan/20 p-6 text-left align-middle shadow-xl transition-all"
            >
              <Dialog.Panel>
                {renderVersionHistoryContent()}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* 内容查看模态框 */}
        {showContent && selectedVersion && (
          <Transition appear show={showContent}>
            <Dialog as="div" className="relative z-[70]" onClose={() => setShowContent(false)}>
              <Transition.Child
                as="div"
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                className="fixed inset-0 bg-black bg-opacity-50"
              />

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as="div"
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                  className="w-full max-w-3xl transform overflow-hidden rounded-2xl glass border border-neon-cyan/20 p-6 text-left align-middle shadow-xl transition-all"
                >
                  <Dialog.Panel>
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title className="text-lg font-semibold text-white">
                        {t('versionHistory.versionContent', { version: selectedVersion ? formatVersionDisplay(selectedVersion.version) : '' })}
                      </Dialog.Title>
                      <button
                        onClick={() => setShowContent(false)}
                        className="rounded-full p-2 hover:bg-white/10 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6 text-gray-400" />
                      </button>
                    </div>

                    {selectedVersion && (
                      <div className="space-y-4">
                        {selectedVersion.description && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">{t('versionHistory.description')}</h4>
                            <p className="text-gray-300">{selectedVersion.description}</p>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">{t('versionHistory.content')}</h4>
                          <div className="bg-dark-bg-secondary rounded-lg p-4 border border-neon-cyan/10">
                            <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
                              {selectedVersion.content}
                            </pre>
                          </div>
                        </div>

                        {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">{t('versionHistory.tags')}</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedVersion.tags.map((tag, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 rounded text-sm bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
        )}
      </Dialog>

      {/* 版本对比弹窗 */}
      {selectedForComparison.length === 2 && (
        <VersionComparison
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          version1={selectedForComparison[0]}
          version2={selectedForComparison[1]}
        />
      )}
    </Transition>
  );
};

export default VersionHistory;