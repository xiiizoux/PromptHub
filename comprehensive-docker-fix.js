#!/usr/bin/env node
// comprehensive-docker-fix.js
// 全面的Docker构建修复脚本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('开始全面修复Docker构建问题...\n');

// 配置
const fixes = {
  // 修复1: 将TypeScript枚举转换为JavaScript对象
  fixEnums: () => {
    console.log('修复1: 转换TypeScript枚举...');
    const mcpServerPath = './mcp/src/mcp-server.ts';
    
    if (fs.existsSync(mcpServerPath)) {
      let content = fs.readFileSync(mcpServerPath, 'utf8');
      
      // 将enum转换为const对象
      content = content.replace(
        /enum\s+ErrorCode\s*{[\s\S]*?}/,
        `// Error codes as const object for JavaScript compatibility
export const ErrorCode = {
  InvalidParams: 1,
  MethodNotFound: 2,
  InternalError: 3,
  Unauthorized: 4
} as const;

type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];`
      );
      
      // 修复类中的类型声明
      content = content.replace(
        /class PromptServerError extends Error {\s*code: number;/,
        `class PromptServerError extends Error {
  code: ErrorCode;`
      );
      
      fs.writeFileSync(mcpServerPath, content);
      console.log('✓ 枚举已转换为const对象');
    }
  },

  // 修复2: 创建适用于Docker的tsconfig
  createDockerTsConfig: () => {
    console.log('\n修复2: 创建Docker专用的tsconfig...');
    const tsConfig = {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ES2020",
        "moduleResolution": "node",
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": false,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "allowJs": true,
        "checkJs": false,
        "declaration": false,
        "sourceMap": false,
        "removeComments": true,
        "noEmitOnError": false,
        "isolatedModules": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"]
    };
    
    fs.writeFileSync('./mcp/tsconfig.docker.json', JSON.stringify(tsConfig, null, 2));
    console.log('✓ Docker tsconfig已创建');
  },

  // 修复3: 修复导入路径
  fixImportPaths: () => {
    console.log('\n修复3: 修复所有TypeScript文件的导入路径...');
    const srcDir = './mcp/src';
    
    function processDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (item.endsWith('.ts')) {
          let content = fs.readFileSync(fullPath, 'utf8');
          let modified = false;
          
          // 修复相对导入路径，添加.js扩展名
          content = content.replace(
            /from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g,
            (match, importPath) => {
              // 跳过.json文件
              if (importPath.endsWith('.json')) return match;
              modified = true;
              return `from '${importPath}.js'`;
            }
          );
          
          if (modified) {
            fs.writeFileSync(fullPath, content);
            console.log(`✓ 修复导入路径: ${fullPath}`);
          }
        }
      }
    }
    
    if (fs.existsSync(srcDir)) {
      processDirectory(srcDir);
    }
  },

  // 修复4: 创建编译脚本
  createBuildScript: () => {
    console.log('\n修复4: 创建优化的编译脚本...');
    const buildScript = `#!/usr/bin/env node
// docker-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始Docker编译流程...');

try {
  // 清理旧的构建
  console.log('清理旧构建...');
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
  }
  
  // 使用Docker专用的tsconfig编译
  console.log('编译TypeScript...');
  execSync('npx tsc -p tsconfig.docker.json', { stdio: 'inherit' });
  
  // 复制必要的静态文件
  console.log('复制静态文件...');
  const filesToCopy = ['package.json', 'package-lock.json'];
  
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
    }
  }
  
  // 确保package.json使用ES modules
  const pkgPath = path.join('dist', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.type = 'module';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  
  console.log('✓ 编译完成！');
} catch (error) {
  console.error('编译失败:', error.message);
  process.exit(1);
}
`;
    
    fs.writeFileSync('./mcp/docker-build.js', buildScript);
    execSync('chmod +x ./mcp/docker-build.js');
    console.log('✓ 编译脚本已创建');
  },

  // 修复5: 更新Dockerfile
  updateDockerfile: () => {
    console.log('\n修复5: 更新Dockerfile...');
    const dockerfileContent = `FROM node:18-alpine

# 设置内存限制
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 创建应用目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production \\
    PORT=9010 \\
    FRONTEND_PORT=9011 \\
    TRANSPORT_TYPE=sse

# 安装系统依赖
RUN apk add --no-cache \\
    cairo-dev \\
    jpeg-dev \\
    pango-dev \\
    giflib-dev \\
    python3 \\
    make \\
    g++

# 复制package文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 安装根依赖
RUN npm ci --only=production

# 安装子项目依赖
WORKDIR /app/mcp
RUN npm ci

WORKDIR /app/web
RUN npm ci --legacy-peer-deps

WORKDIR /app/supabase
RUN npm ci

# 返回根目录
WORKDIR /app

# 复制所有源代码
COPY . .

# 运行修复脚本
COPY comprehensive-docker-fix.js /app/
RUN node comprehensive-docker-fix.js

# 构建MCP服务
WORKDIR /app/mcp
RUN npm run build || node docker-build.js

# 构建Web应用
WORKDIR /app/web
RUN NODE_ENV=production npm run build

# 返回根目录
WORKDIR /app

# 创建日志目录
RUN mkdir -p /app/logs /app/mcp/data

# 暴露端口
EXPOSE 9010 9011

# 确保启动脚本可执行
RUN chmod +x /app/docker-start.sh

# 启动命令
CMD ["/bin/sh", "/app/docker-start.sh"]
`;
    
    fs.writeFileSync('./Dockerfile', dockerfileContent);
    console.log('✓ Dockerfile已更新');
  },

  // 修复6: 更新package.json脚本
  updatePackageScripts: () => {
    console.log('\n修复6: 更新MCP package.json脚本...');
    const pkgPath = './mcp/package.json';
    
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      
      // 确保是ES module
      pkg.type = 'module';
      
      // 更新scripts
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.build = 'node docker-build.js';
      pkg.scripts.start = 'node dist/src/index.js';
      pkg.scripts.dev = 'tsx src/index.ts';
      
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('✓ package.json已更新');
    }
  },

  // 修复7: 创建类型声明文件
  createTypeDeclarations: () => {
    console.log('\n修复7: 创建类型声明文件...');
    const typeDeclarations = `// mcp/src/types.d.ts
// Docker构建所需的类型声明

declare module 'express';
declare module 'cors';
declare module 'http';

// 添加其他必要的类型声明
export {};
`;
    
    const typesPath = './mcp/src/types.d.ts';
    fs.writeFileSync(typesPath, typeDeclarations);
    console.log('✓ 类型声明文件已创建');
  }
};

// 执行所有修复
async function runAllFixes() {
  console.log('开始执行全面修复...\n');
  
  for (const [name, fix] of Object.entries(fixes)) {
    try {
      await fix();
    } catch (error) {
      console.error(`✗ ${name} 失败:`, error.message);
    }
  }
  
  console.log('\n✓ 所有修复已完成！');
  console.log('\n下一步:');
  console.log('1. 运行: docker build -t prompthub .');
  console.log('2. 运行: docker run -p 9010:9010 -p 9011:9011 prompthub');
}

// 执行修复
runAllFixes().catch(console.error);