// 加载根目录的环境变量文件
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载项目根目录的.env文件
const rootEnvPath = join(__dirname, '../.env');
const result = config({ path: rootEnvPath });

if (result.error) {
  console.warn('Warning: 无法加载项目根目录的.env文件:', result.error.message);
} else {
  console.log('成功加载根目录的环境变量文件');
}

// 导出用于测试
export default result;
