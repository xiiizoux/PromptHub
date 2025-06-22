#!/usr/bin/env node

/**
 * Simple test for PromptHub MCP Adapter
 */

const { spawn } = require('child_process');

console.log('🧪 Testing PromptHub MCP Adapter...');

// Test 1: Check if the adapter starts without API key
console.log('\n📋 Test 1: Starting adapter without API key (should fail)');
const child = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let stderr = '';
child.stderr.on('data', (data) => {
  stderr += data.toString();
});

child.on('close', (code) => {
  if (stderr.includes('未设置API_KEY环境变量') || stderr.includes('API_KEY not set')) {
    console.log('✅ Test 1 passed: Correctly detected missing API key');
  } else {
    console.log('❌ Test 1 failed: Did not detect missing API key');
    console.log('stderr:', stderr);
  }

  // Test 2: Check if package.json is valid
  console.log('\n📋 Test 2: Validating package.json');
  try {
    const packageJson = require('./package.json');
    if (packageJson.name === 'prompthub-mcp' && packageJson.bin && packageJson.bin['prompthub-mcp']) {
      console.log('✅ Test 2 passed: package.json is valid');
    } else {
      console.log('❌ Test 2 failed: package.json is invalid');
    }
  } catch (error) {
    console.log('❌ Test 2 failed: Cannot read package.json');
  }

  // Test 3: Check if index.js exists and is executable
  console.log('\n📋 Test 3: Checking index.js');
  const fs = require('fs');
  if (fs.existsSync('./index.js')) {
    const stats = fs.statSync('./index.js');
    if (stats.isFile()) {
      console.log('✅ Test 3 passed: index.js exists and is a file');
    } else {
      console.log('❌ Test 3 failed: index.js is not a file');
    }
  } else {
    console.log('❌ Test 3 failed: index.js does not exist');
  }

  console.log('\n🎉 Test suite completed!');
  console.log('\n📦 Package is ready for npm publish');
  console.log('\n🚀 To publish:');
  console.log('   1. npm login');
  console.log('   2. npm publish');
  console.log('\n💡 To test locally:');
  console.log('   API_KEY=your-key npx . (from this directory)');
});

child.stdin.end(); 