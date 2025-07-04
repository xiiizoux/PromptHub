import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 检查环境变量
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV,
    // 显示实际值的前几个字符用于调试
    SUPABASE_URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || '未设置',
    SERVICE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || '未设置',
  };

  console.log('环境变量检查:', envVars);

  return res.status(200).json({
    success: true,
    data: envVars,
    timestamp: new Date().toISOString(),
  });
}
