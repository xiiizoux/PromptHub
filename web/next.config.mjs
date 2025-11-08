import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode to discover potential issues
  reactStrictMode: true,
  // Disable type checking
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint checking
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Use default output mode, fix prerender-manifest.json issue
  // output: 'standalone',
  // Next.js 15 has SWC compression enabled by default, no configuration needed
  // Disable image optimization to reduce memory usage
  images: {
    unoptimized: true,
  },
  // Set workspace root directory to eliminate warnings
  outputFileTracingRoot: path.join(__dirname, '..'),
  // Configure webpack to handle TypeScript files
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configure module resolution rules
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [/supabase/],
      use: [defaultLoaders.babel],
    });

    return config;
  },
  env: {
    // Priority: read from environment variables (Docker build), then from .env file (local development)
    ...(() => {
      // If Docker build environment, environment variables already passed via ARG/ENV, use directly
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('✓ Using Docker environment variables');
        return {};
      }
      
      // Local development environment, load from root .env file
      try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          const envVars = dotenv.config({ path: envPath }).parsed || {};
          // Filter out variables not allowed by Next.js
          const { NODE_ENV, ...filteredVars } = envVars;
          console.log('✓ Loading environment variables from root .env file');
          return filteredVars;
        }
      } catch (e) {
        console.warn('⚠ Unable to load root .env file:', e.message);
      }
      return {};
    })(),
    // Explicitly declare environment variables (read from process.env, supports Docker ARG/ENV passing)
    API_KEY: process.env.API_KEY || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
  },
  // Skip prerendering errors in static export
  trailingSlash: false,
};

export default nextConfig;
