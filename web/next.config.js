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
  // Next.js 15 已默认启用 SWC 压缩，无需配置
  // 禁用图片优化以减少内存使用
  images: {
    unoptimized: true,
  },
  // 设置工作区根目录以消除警告
  outputFileTracingRoot: require('path').join(__dirname, '..'),
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
    // 优先从环境变量读取（Docker构建时），其次从.env文件读取（本地开发时）
    ...(() => {
      // 如果是Docker构建环境，环境变量已经通过ARG/ENV传入，直接使用
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('✓ 使用Docker环境变量');
        return {};
      }
      
      // 本地开发环境，从根目录.env文件加载
      try {
        const path = require('path');
        const fs = require('fs');
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          const envVars = require('dotenv').config({ path: envPath }).parsed || {};
          // 过滤掉Next.js不允许的变量
          const { NODE_ENV, ...filteredVars } = envVars;
          console.log('✓ 从根目录.env文件加载环境变量');
          return filteredVars;
        }
      } catch (e) {
        console.warn('⚠ 无法加载根目录.env文件:', e.message);
      }
      return {};
    })(),
    // 显式声明环境变量（从process.env读取，支持Docker ARG/ENV传递）
    API_KEY: process.env.API_KEY || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
  },
  // 跳过静态导出中的预渲染错误
  trailingSlash: false,
};

module.exports = nextConfig;
