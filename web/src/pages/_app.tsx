import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '@/components/layout/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthRefresher from '@/components/AuthRefresher';
import Head from 'next/head';
import { useEffect } from 'react';
import { logger } from '@/lib/error-handler';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 全局错误处理
    const handleError = (event: ErrorEvent) => {
      logger.error('未捕获的JavaScript错误', new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('未处理的Promise拒绝', new Error(String(event.reason)), {
        reason: event.reason,
      });
    };

    // 添加全局错误监听器
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* 智能认证刷新组件，自动维持会话有效性 */}
      <AuthRefresher />
      <Layout>
        <Component {...pageProps} />
      </Layout>
      {/* Toast通知组件 */}
      <Toaster 
        position="bottom-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(26, 26, 36, 0.95)',
            color: '#fff',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            fontSize: '14px',
          },
          success: {
            style: {
              border: '1px solid rgba(16, 185, 129, 0.3)',
            },
          },
          error: {
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
            },
          },
        }}
      />
    </AuthProvider>
  );
}
