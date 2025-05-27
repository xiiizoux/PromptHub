/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 转译外部依赖
  transpilePackages: [],
  experimental: {
    externalDir: true,
  },
  // 配置webpack来处理TypeScript文件
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 配置模块解析规则
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [/supabase/],
      use: [defaultLoaders.babel],
    });

    return config;
  },
  env: {
    // 默认连接到本地的MCP Prompt Server
    API_URL: process.env.API_URL || 'http://localhost:9010',
    API_KEY: process.env.API_KEY,
    // 支持Supabase认证
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // 移除API代理配置，使用本地API路由
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.API_URL || 'http://localhost:9010'}/api/:path*`,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
