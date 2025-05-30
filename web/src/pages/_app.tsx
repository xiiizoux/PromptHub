import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '@/components/layout/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthRefresher from '@/components/AuthRefresher';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* 添加认证刷新组件，自动维持会话有效性 */}
      <AuthRefresher />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
