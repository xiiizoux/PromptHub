import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { supabase, clearAuthState } from '@/lib/supabase';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

/**
 * 紧急认证状态清理页面
 * 当用户遇到登录卡死问题时的解决方案
 */
export default function ClearAuthPage() {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  const addStep = (step: string) => {
    setSteps(prev => [...prev, step]);
  };

  const clearAuthenticationState = async () => {
    setIsClearing(true);
    setSteps([]);
    
    try {
      addStep('开始清理认证状态...');
      
      // 1. 登出Supabase会话
      try {
        addStep('正在登出Supabase会话...');
        const { error } = await supabase.auth.signOut();
        if (error) {
          addStep(`Supabase登出警告: ${error.message}`);
        } else {
          addStep('✓ Supabase会话已清理');
        }
      } catch (err) {
        addStep('⚠ Supabase登出失败，继续清理本地状态');
      }
      
      // 2. 清理localStorage
      addStep('正在清理本地存储...');
      try {
        const keysToRemove = [
          'prompthub-auth-token',
          'auth_token',
          'user',
          'sb-localhost-auth-token', // 本地开发环境
          'sb-project-auth-token', // 生产环境
        ];
        
        let removedCount = 0;
        keysToRemove.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            removedCount++;
          }
        });
        
        // 清理所有Supabase相关的keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth-token')) {
            localStorage.removeItem(key);
            removedCount++;
          }
        });
        
        addStep(`✓ 已清理 ${removedCount} 个本地存储项`);
      } catch (err) {
        addStep('⚠ 清理本地存储时出错，但继续执行');
      }
      
      // 3. 清理sessionStorage
      addStep('正在清理会话存储...');
      try {
        let sessionRemovedCount = 0;
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
            sessionStorage.removeItem(key);
            sessionRemovedCount++;
          }
        });
        addStep(`✓ 已清理 ${sessionRemovedCount} 个会话存储项`);
      } catch (err) {
        addStep('⚠ 清理会话存储时出错，但继续执行');
      }
      
      // 4. 清理cookies（如果有的话）
      addStep('正在清理相关cookies...');
      try {
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (name.includes('auth') || name.includes('token') || name.includes('supabase')) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          }
        });
        addStep('✓ 相关cookies已清理');
      } catch (err) {
        addStep('⚠ 清理cookies时出错，但继续执行');
      }
      
      // 5. 使用集成的清理函数
      addStep('执行深度清理...');
      clearAuthState();
      addStep('✓ 深度清理完成');
      
      // 6. 刷新页面以确保所有状态重置
      addStep('正在刷新页面状态...');
      setTimeout(() => {
        addStep('✓ 认证状态清理完成！');
        setCleared(true);
      }, 1000);
      
    } catch (error) {
      console.error('清理认证状态时出错:', error);
      addStep('❌ 清理过程中出现错误，但大部分状态应该已被清理');
      setCleared(true);
    } finally {
      setIsClearing(false);
    }
  };

  const goToLogin = () => {
    // 强制刷新页面后跳转到登录页
    window.location.href = '/auth/login';
  };

  const goHome = () => {
    // 强制刷新页面后跳转到首页
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden flex items-center justify-center">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-tr from-orange-500/20 to-red-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
        >
          {/* 头部 */}
          <div className="p-8 text-center border-b border-dark-border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 p-0.5"
            >
              <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-400" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">认证状态清理工具</h1>
            <p className="text-gray-400">
              如果您遇到登录卡死或一直转圈的问题，请使用此工具清理认证状态
            </p>
          </div>

          {/* 内容区域 */}
          <div className="p-8">
            {!cleared ? (
              <>
                {/* 问题说明 */}
                <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <h3 className="text-orange-400 font-semibold mb-2">常见问题：</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• 登录页面一直显示转圈加载</li>
                    <li>• 提示"网络连接超时"</li>
                    <li>• 登录后立即退出</li>
                    <li>• 页面卡住无响应</li>
                  </ul>
                </div>

                {/* 清理按钮 */}
                <div className="text-center mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAuthenticationState}
                    disabled={isClearing}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isClearing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        清理中...
                      </div>
                    ) : (
                      '开始清理认证状态'
                    )}
                  </motion.button>
                </div>

                {/* 清理步骤 */}
                {steps.length > 0 && (
                  <div className="bg-dark-bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3">清理进度：</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {steps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-sm text-gray-300 font-mono"
                        >
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 完成状态 */
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 p-0.5"
                >
                  <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-400" />
                  </div>
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white mb-2">清理完成！</h2>
                <p className="text-gray-400 mb-6">
                  认证状态已成功清理，现在您可以重新登录了
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToLogin}
                    className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    前往登录页
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goHome}
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
                  >
                    返回首页
                  </motion.button>
                </div>
              </div>
            )}

            {/* 返回按钮 */}
            {!cleared && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  返回上一页
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* 使用说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-gray-500 text-sm"
        >
          <p>此工具会清理所有认证相关的本地数据，包括登录令牌和用户信息</p>
          <p>清理后您需要重新登录</p>
        </motion.div>
      </div>
    </div>
  );
} 