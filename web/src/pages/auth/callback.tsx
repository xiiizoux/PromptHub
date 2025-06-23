import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function AuthCallback() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理登录...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 处理OAuth回调
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth回调错误:', error);
          setStatus('error');
          setMessage('登录失败，请重试');
          return;
        }

        if (data.session) {
          console.log('OAuth登录成功:', data.session.user.email);
          setStatus('success');
          setMessage('登录成功，正在跳转...');
          
          // 重新检查认证状态
          await checkAuth();
          
          // 获取重定向URL
          const redirectUrl = router.query.returnUrl as string || '/';
          
          // 短暂延迟后跳转
          setTimeout(() => {
            router.replace(redirectUrl);
          }, 1500);
        } else {
          setStatus('error');
          setMessage('未能获取登录信息');
        }
      } catch (err: any) {
        console.error('处理OAuth回调时出错:', err);
        setStatus('error');
        setMessage('登录过程中出现错误');
      }
    };

    // 只在客户端执行
    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, [router, checkAuth]);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-16 w-16 text-neon-green" />;
      case 'error':
        return <XCircleIcon className="h-16 w-16 text-neon-red" />;
      default:
        return <SparklesIcon className="h-16 w-16 text-neon-cyan animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-neon-green';
      case 'error':
        return 'text-neon-red';
      default:
        return 'text-neon-cyan';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg-primary via-dark-bg-secondary to-dark-bg-primary" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container-custom">
        <motion.div
          className="glass rounded-xl p-8 border border-neon-cyan/20 max-w-md mx-auto text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="flex justify-center mb-6"
            animate={{ 
              rotate: status === 'loading' ? 360 : 0,
              scale: status !== 'loading' ? [1, 1.1, 1] : 1,
            }}
            transition={{ 
              rotate: { duration: 2, repeat: status === 'loading' ? Infinity : 0, ease: 'linear' },
              scale: { duration: 0.5 },
            }}
          >
            {getIcon()}
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-4">
            {status === 'loading' && '正在处理登录'}
            {status === 'success' && '登录成功！'}
            {status === 'error' && '登录失败'}
          </h1>

          <p className={`text-lg ${getStatusColor()} mb-6`}>
            {message}
          </p>

          {status === 'error' && (
            <motion.button
              onClick={() => router.push('/auth/login')}
              className="btn-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              返回登录页面
            </motion.button>
          )}

          {status === 'loading' && (
            <div className="w-full bg-dark-bg-tertiary rounded-full h-2 mb-4">
              <motion.div 
                className="bg-gradient-to-r from-neon-cyan to-neon-pink h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 