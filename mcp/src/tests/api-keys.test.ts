import { expect } from 'chai';
import sinon from 'sinon';
import { StorageFactory } from '../storage/storage-factory.js';
import { User } from '../types.js';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';
import apiKeysRouter from '../api/api-keys-router.js';
import { describe, it, before, beforeEach, afterEach } from 'mocha';

// 当测试环境没有设置 Supabase 环境变量时，跳过整个测试套件
const supabaseEnvAvailable = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

(supabaseEnvAvailable ? describe : describe.skip)('API密钥功能测试', () => {
  let app: express.Application;
  let mockStorage: any;
  let mockUser1: User;
  let mockUser2: User;
  let sandbox: sinon.SinonSandbox;

  before(() => {
    // 创建Express应用
    app = express();
    app.use(express.json());
    
    // 设置测试中间件，模拟认证
    app.use((req: any, res, next) => {
      // 测试时通过headers中的test-user-id来模拟不同用户
      if (req.headers['test-user-id'] === 'user1') {
        req.user = mockUser1;
      } else if (req.headers['test-user-id'] === 'user2') {
        req.user = mockUser2;
      }
      next();
    });
    
    app.use('/api/api-keys', apiKeysRouter);
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // 创建模拟用户
    mockUser1 = {
      id: 'user1-id',
      email: 'user1@example.com',
      display_name: 'User One',
      created_at: new Date().toISOString()
    };
    
    mockUser2 = {
      id: 'user2-id',
      email: 'user2@example.com',
      display_name: 'User Two',
      created_at: new Date().toISOString()
    };

    // 创建模拟存储
    mockStorage = {
      listApiKeys: sandbox.stub(),
      generateApiKey: sandbox.stub(),
      deleteApiKey: sandbox.stub(),
      verifyApiKey: sandbox.stub(),
      updateApiKeyLastUsed: sandbox.stub()
    };

    // 模拟StorageFactory.getStorage方法
    sandbox.stub(StorageFactory, 'getStorage').returns(mockStorage);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /api/api-keys', () => {
    it('应该返回已认证用户的API密钥列表', async () => {
      // 模拟API密钥列表
      const mockApiKeys = [
        { 
          id: 'key1', 
          name: 'Test Key 1', 
          created_at: new Date().toISOString() 
        }
      ];
      
      mockStorage.listApiKeys.withArgs('user1-id').resolves(mockApiKeys);

      const response = await request(app)
        .get('/api/api-keys')
        .set('test-user-id', 'user1');

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.deep.equal(mockApiKeys);
      expect(mockStorage.listApiKeys.calledWith('user1-id')).to.be.true;
    });

    it('未认证用户应该无法获取API密钥列表', async () => {
      const response = await request(app)
        .get('/api/api-keys');

      expect(response.status).to.equal(401);
      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/api-keys', () => {
    it('应该为已认证用户创建新API密钥', async () => {
      const keyName = 'New Test Key';
      const mockApiKey = crypto.randomBytes(32).toString('hex');
      const expiresInDays = 30;
      
      mockStorage.generateApiKey
        .withArgs('user1-id', keyName, expiresInDays)
        .resolves(mockApiKey);

      const response = await request(app)
        .post('/api/api-keys')
        .set('test-user-id', 'user1')
        .send({ name: keyName, expiresInDays });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.apiKey).to.equal(mockApiKey);
      expect(response.body.data.name).to.equal(keyName);
      expect(mockStorage.generateApiKey.calledWith('user1-id', keyName, expiresInDays)).to.be.true;
    });

    it('应该验证API密钥名称', async () => {
      const response = await request(app)
        .post('/api/api-keys')
        .set('test-user-id', 'user1')
        .send({ name: '', expiresInDays: 30 });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(mockStorage.generateApiKey.called).to.be.false;
    });

    it('未认证用户应该无法创建API密钥', async () => {
      const response = await request(app)
        .post('/api/api-keys')
        .send({ name: 'Test Key', expiresInDays: 30 });

      expect(response.status).to.equal(401);
      expect(response.body.success).to.be.false;
      expect(mockStorage.generateApiKey.called).to.be.false;
    });
  });

  describe('DELETE /api/api-keys/:id', () => {
    it('应该允许用户删除自己的API密钥', async () => {
      const keyId = 'test-key-id';
      
      mockStorage.deleteApiKey
        .withArgs('user1-id', keyId)
        .resolves(true);

      const response = await request(app)
        .delete(`/api/api-keys/${keyId}`)
        .set('test-user-id', 'user1');

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(mockStorage.deleteApiKey.calledWith('user1-id', keyId)).to.be.true;
    });

    it('应该处理删除不存在的API密钥', async () => {
      const keyId = 'nonexistent-key-id';
      
      mockStorage.deleteApiKey
        .withArgs('user1-id', keyId)
        .resolves(false);

      const response = await request(app)
        .delete(`/api/api-keys/${keyId}`)
        .set('test-user-id', 'user1');

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
      expect(mockStorage.deleteApiKey.calledWith('user1-id', keyId)).to.be.true;
    });

    it('未认证用户应该无法删除API密钥', async () => {
      const keyId = 'test-key-id';
      
      const response = await request(app)
        .delete(`/api/api-keys/${keyId}`);

      expect(response.status).to.equal(401);
      expect(response.body.success).to.be.false;
      expect(mockStorage.deleteApiKey.called).to.be.false;
    });
  });

  describe('多用户安全测试', () => {
    it('用户不能获取其他用户的API密钥列表', async () => {
      // 用户1的密钥
      const user1Keys = [{ 
        id: 'key1', 
        user_id: 'user1-id',
        name: 'User1 Key', 
        created_at: new Date().toISOString() 
      }];
      // 用户2的密钥
      const user2Keys = [{ 
        id: 'key2', 
        user_id: 'user2-id',
        name: 'User2 Key', 
        created_at: new Date().toISOString() 
      }];
      
      mockStorage.listApiKeys.withArgs('user1-id').resolves(user1Keys);
      mockStorage.listApiKeys.withArgs('user2-id').resolves(user2Keys);

      // 用户1请求自己的密钥
      const response1 = await request(app)
        .get('/api/api-keys')
        .set('test-user-id', 'user1');

      expect(response1.status).to.equal(200);
      expect(response1.body.data).to.deep.equal(user1Keys);

      // 用户2请求自己的密钥
      const response2 = await request(app)
        .get('/api/api-keys')
        .set('test-user-id', 'user2');

      expect(response2.status).to.equal(200);
      expect(response2.body.data).to.deep.equal(user2Keys);
      
      // 确认两个用户看到的密钥不同
      expect(response1.body.data).to.not.deep.equal(response2.body.data);
    });

    it('用户不能删除其他用户的API密钥', async () => {
      const keyId = 'other-user-key-id';
      
      // 模拟用户2尝试删除密钥失败
      mockStorage.deleteApiKey
        .withArgs('user2-id', keyId)
        .resolves(false);

      // 用户2尝试删除可能属于用户1的密钥
      const response = await request(app)
        .delete(`/api/api-keys/${keyId}`)
        .set('test-user-id', 'user2');

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
      expect(mockStorage.deleteApiKey.calledWith('user2-id', keyId)).to.be.true;
    });
  });
});
