import { Server, createServer } from 'http';
import express, { Express } from 'express';
import type { AddressInfo } from 'net';
import { Socket } from 'net';

interface TestServerInfo {
  server: Server;
  app: Express;
  port: number;
  baseUrl: string;
  activeSockets: Set<Socket>;
}

/**
 * 创建一个用于测试的Express服务器
 * @param basePath - API基础路径，默认为'/mcp'
 * @returns 包含服务器信息的对象
 */
export async function setupTestServer(basePath: string = '/mcp'): Promise<TestServerInfo> {
  const app = express();
  const server = createServer(app);
  const activeSockets = new Set<Socket>();
  
  // 跟踪所有活动连接以便强制关闭
  server.on('connection', (socket) => {
    activeSockets.add(socket);
    socket.on('close', () => {
      activeSockets.delete(socket);
    });
  });
  
  // 启动服务器
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });
  
  const address = server.address() as AddressInfo;
  const port = address.port;
  const baseUrl = `http://localhost:${port}${basePath}`;
  
  return {
    server,
    app,
    port,
    baseUrl,
    activeSockets
  };
}

/**
 * 关闭测试服务器，确保所有连接都被正确终止
 * @param serverInfo - 由setupTestServer返回的服务器信息
 */
export async function closeTestServer(serverInfo: TestServerInfo): Promise<void> {
  const { server, activeSockets } = serverInfo;
  
  // 尝试正常关闭
  const normalClose = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (server.listening) {
        server.close(() => {
          console.log('Server closed successfully');
          resolve();
        });
      } else {
        resolve();
      }
    });
  };
  
  // 强制关闭所有连接的函数
  const forceCloseAllConnections = () => {
    for (const socket of activeSockets) {
      socket.destroy();
    }
    activeSockets.clear();
  };
  
  // 等待正常关闭或超时
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      normalClose(),
      new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          // 使用更简洁的强制关闭机制
          forceCloseAllConnections();
          if (server.listening) {
            try {
              server.close();
            } catch (e) {
              // 忽略关闭错误
            }
          }
          resolve(true);
        }, 1000);
      })
    ]);
  } finally {
    // 确保超时被清除
    if (timeoutId) clearTimeout(timeoutId);
  }
}
