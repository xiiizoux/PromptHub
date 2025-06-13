/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用严格模式以发现潜在问题
  reactStrictMode: true,
  // 禁用类型检查
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用ESLint检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 使用默认输出模式，解决prerender-manifest.json问题
  // output: 'standalone',
  // 启用SWC压缩
  swcMinify: true,
  // 禁用图片优化以减少内存使用
  images: {
    unoptimized: true,
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
    // 加载根目录的.env文件
    ...(() => {
      try {
        const path = require('path');
        const fs = require('fs');
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          const envVars = require('dotenv').config({ path: envPath }).parsed || {};
          // 过滤掉Next.js不允许的变量
          const { NODE_ENV, ...filteredVars } = envVars;
          return filteredVars;
        }
      } catch (e) {
        console.warn('无法加载根目录.env文件:', e.message);
      }
      return {};
    })(),
    // Docker部署环境变量
    API_KEY: process.env.API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // 跳过静态导出中的预渲染错误
  trailingSlash: false,
  // Docker部署时的API代理配置
  async rewrites() {
    return [
      {
        source: '/api/mcp/:path*',
        destination: `${process.env.MCP_URL || 'http://localhost:9010'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
