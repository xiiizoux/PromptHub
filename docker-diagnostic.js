#!/usr/bin/env node
// docker-diagnostic.js - Comprehensive Docker build diagnostic tool

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

// Diagnostic checks
const diagnostics = {
  // Check environment
  checkEnvironment: () => {
    log.section('Environment Check');
    
    try {
      const nodeVersion = execSync('node --version').toString().trim();
      log.success(`Node.js version: ${nodeVersion}`);
      
      const npmVersion = execSync('npm --version').toString().trim();
      log.success(`NPM version: ${npmVersion}`);
      
      const dockerVersion = execSync('docker --version').toString().trim();
      log.success(`Docker version: ${dockerVersion}`);
    } catch (error) {
      log.error('Environment check failed: ' + error.message);
    }
  },
  
  // Check project structure
  checkProjectStructure: () => {
    log.section('Project Structure Check');
    
    const requiredFiles = [
      'package.json',
      'Dockerfile',
      'docker-start.sh',
      'mcp/package.json',
      'mcp/src/index.ts',
      'mcp/src/mcp-server.ts',
      'web/package.json',
      'supabase/package.json'
    ];
    
    let allGood = true;
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        log.success(`Found: ${file}`);
      } else {
        log.error(`Missing: ${file}`);
        allGood = false;
      }
    }
    
    return allGood;
  },
  
  // Check TypeScript issues
  checkTypeScriptIssues: () => {
    log.section('TypeScript Issues Check');
    
    const issues = [];
    
    // Check for enum usage
    const mcpServerPath = './mcp/src/mcp-server.ts';
    if (fs.existsSync(mcpServerPath)) {
      const content = fs.readFileSync(mcpServerPath, 'utf8');
      
      if (content.includes('enum ErrorCode')) {
        issues.push('Found TypeScript enum (needs conversion to const object)');
      }
      
      if (content.match(/private\s+\w+\s*:/)) {
        issues.push('Found TypeScript class member declarations (needs removal)');
      }
      
      const importMatches = content.match(/from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g);
      if (importMatches && importMatches.length > 0) {
        issues.push(`Found ${importMatches.length} imports missing .js extension`);
      }
    }
    
    // Check for tsconfig
    const tsconfigPaths = [
      './mcp/tsconfig.json',
      './mcp/tsconfig.docker.json'
    ];
    
    let hasValidTsconfig = false;
    for (const configPath of tsconfigPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.compilerOptions && config.compilerOptions.module) {
            log.info(`Found tsconfig: ${configPath} (module: ${config.compilerOptions.module})`);
            hasValidTsconfig = true;
          }
        } catch (e) {
          log.error(`Invalid JSON in ${configPath}`);
        }
      }
    }
    
    if (!hasValidTsconfig) {
      issues.push('Missing valid tsconfig.json');
    }
    
    // Report issues
    if (issues.length > 0) {
      log.warning('Found TypeScript issues:');
      issues.forEach(issue => log.warning(`  - ${issue}`));
    } else {
      log.success('No TypeScript issues found');
    }
    
    return issues;
  },
  
  // Check module system
  checkModuleSystem: () => {
    log.section('Module System Check');
    
    const packageJsonFiles = [
      './package.json',
      './mcp/package.json',
      './web/package.json',
      './supabase/package.json'
    ];
    
    const moduleTypes = [];
    
    for (const pkgPath of packageJsonFiles) {
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const moduleType = pkg.type || 'commonjs';
          log.info(`${pkgPath}: type="${moduleType}"`);
          
          if (pkgPath === './mcp/package.json' && moduleType !== 'module') {
            log.warning('MCP should use "type": "module"');
          }
          
          moduleTypes.push({ path: pkgPath, type: moduleType });
        } catch (e) {
          log.error(`Failed to read ${pkgPath}`);
        }
      }
    }
    
    return moduleTypes;
  },
  
  // Check Docker configuration
  checkDockerConfig: () => {
    log.section('Docker Configuration Check');
    
    // Check Dockerfile
    if (fs.existsSync('./Dockerfile')) {
      const dockerfile = fs.readFileSync('./Dockerfile', 'utf8');
      
      // Check for common issues
      if (!dockerfile.includes('NODE_OPTIONS')) {
        log.warning('Dockerfile missing NODE_OPTIONS for memory limits');
      }
      
      if (!dockerfile.includes('npm ci')) {
        log.warning('Dockerfile uses npm install instead of npm ci');
      }
      
      if (dockerfile.includes('comprehensive-docker-fix.js')) {
        log.info('Dockerfile uses comprehensive fix script');
      }
      
      log.success('Dockerfile exists');
    } else {
      log.error('Dockerfile not found');
    }
    
    // Check docker-start.sh
    if (fs.existsSync('./docker-start.sh')) {
      const startScript = fs.readFileSync('./docker-start.sh', 'utf8');
      
      if (!startScript.includes('set -e')) {
        log.warning('docker-start.sh missing "set -e" for error handling');
      }
      
      log.success('docker-start.sh exists');
    } else {
      log.error('docker-start.sh not found');
    }
  },
  
  // Generate report
  generateReport: (issues) => {
    log.section('Diagnostic Summary');
    
    const recommendations = [];
    
    if (issues.length > 0) {
      log.warning(`Found ${issues.length} issues that need fixing:`);
      
      if (issues.some(i => i.includes('enum'))) {
        recommendations.push('Convert TypeScript enums to const objects');
      }
      
      if (issues.some(i => i.includes('missing .js extension'))) {
        recommendations.push('Add .js extensions to all relative imports');
      }
      
      if (issues.some(i => i.includes('class member declarations'))) {
        recommendations.push('Remove TypeScript-specific class member declarations');
      }
      
      if (issues.some(i => i.includes('tsconfig'))) {
        recommendations.push('Create proper tsconfig.json for Docker builds');
      }
    }
    
    if (recommendations.length > 0) {
      log.info('\nRecommended fixes:');
      recommendations.forEach((rec, i) => {
        log.info(`${i + 1}. ${rec}`);
      });
      
      log.info('\nNext steps:');
      log.info('1. Run: node comprehensive-docker-fix.js');
      log.info('2. Build: docker build -t prompthub:fixed .');
      log.info('3. Run: docker run -p 9010:9010 -p 9011:9011 prompthub:fixed');
    } else {
      log.success('No critical issues found!');
    }
    
    return recommendations;
  }
};

// Run full diagnostics
async function runDiagnostics() {
  console.log('\n🔍 Docker Build Diagnostic Tool v1.0\n');
  
  // Run all checks
  diagnostics.checkEnvironment();
  const structureOk = diagnostics.checkProjectStructure();
  const tsIssues = diagnostics.checkTypeScriptIssues();
  diagnostics.checkModuleSystem();
  diagnostics.checkDockerConfig();
  
  // Generate recommendations
  const recommendations = diagnostics.generateReport(tsIssues);
  
  // Final summary
  log.section('Action Plan');
  
  if (tsIssues.length > 0 || !structureOk) {
    log.info('To fix all issues automatically:');
    log.info('1. Ensure comprehensive-docker-fix.js exists');
    log.info('2. Run: node comprehensive-docker-fix.js');
    log.info('3. Rebuild Docker image with: docker build -t prompthub:fixed .');
    log.info('4. Run container: docker run -p 9010:9010 -p 9011:9011 prompthub:fixed');
  } else {
    log.success('Your project appears to be properly configured for Docker builds!');
  }
  
  return {
    issues: tsIssues,
    recommendations: recommendations,
    structureOk: structureOk
  };
}

// Export for use in other scripts
module.exports = { diagnostics, runDiagnostics };

// Run if called directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}