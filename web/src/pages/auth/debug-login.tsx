import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DebugLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('尝试登录:', email);
      
      // 使用服务端管理员客户端查询用户信息
      const adminSupabase = supabase.admin();
      const { data: userData, error: userError } = await adminSupabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      console.log('用户查询结果:', userData, userError);
      
      // 使用标准登录流程
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('登录错误:', error);
        setError(`登录失败: ${error.message}`);
        return;
      }

      if (data?.user) {
        setSuccess(`登录成功! 用户ID: ${data.user.id}`);
        console.log('登录成功, 用户:', data.user);
        
        // 确保用户数据存在于users表中
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        console.log('检查用户数据:', existingUser, fetchError);
        
        if (fetchError && fetchError.code === 'PGRST116') {
          // 用户不存在，创建一个
          console.log('用户不在数据库中，创建新记录');
          const userData = {
            id: data.user.id,
            email: data.user.email,
            display_name: data.user.user_metadata?.username || 
                        data.user.user_metadata?.full_name || 
                        data.user.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: data.user.created_at,
          };
          
          const { error: insertError } = await supabase
            .from('users')
            .insert(userData);
            
          if (insertError) {
            console.error('创建用户记录失败:', insertError);
            setError(`创建用户记录失败: ${insertError.message}`);
          } else {
            console.log('用户记录创建成功:', userData);
          }
        }
        
        // 3秒后重定向到主页
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (err: any) {
      console.error('登录过程出错:', err);
      setError(`登录过程出错: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">调试登录</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
            <p className="mt-2">3秒后跳转到主页...</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-600">
            返回正常登录
          </Link>
        </div>
      </div>
    </div>
  );
}
