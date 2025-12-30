#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Run this to diagnose env var issues in development
 */

const fs = require('fs');
const path = require('path');

console.log('=== PerformIQ Environment Verification ===\n');

// Check root .env
const rootEnvPath = path.join(__dirname, '.env');
const rootEnvExists = fs.existsSync(rootEnvPath);
console.log(`Root .env file: ${rootEnvExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (rootEnvExists) {
  const rootEnv = fs.readFileSync(rootEnvPath, 'utf8');
  const hasUrl = rootEnv.includes('VITE_SUPABASE_URL=');
  const hasKey = rootEnv.includes('VITE_SUPABASE_ANON_KEY=');
  console.log(`  - VITE_SUPABASE_URL: ${hasUrl ? '✓' : '✗'}`);
  console.log(`  - VITE_SUPABASE_ANON_KEY: ${hasKey ? '✓' : '✗'}`);
}

// Check client .env
const clientEnvPath = path.join(__dirname, 'client', '.env');
const clientEnvExists = fs.existsSync(clientEnvPath);
console.log(`\nClient .env file: ${clientEnvExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (clientEnvExists) {
  const clientEnv = fs.readFileSync(clientEnvPath, 'utf8');
  const hasUrl = clientEnv.includes('VITE_SUPABASE_URL=');
  const hasKey = clientEnv.includes('VITE_SUPABASE_ANON_KEY=');
  console.log(`  - VITE_SUPABASE_URL: ${hasUrl ? '✓' : '✗'}`);
  console.log(`  - VITE_SUPABASE_ANON_KEY: ${hasKey ? '✓' : '✗'}`);
}

// Check process.env
console.log('\nProcess Environment:');
console.log(`  - VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✓ SET' : '✗ NOT SET'}`);
console.log(`  - VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✓ SET' : '✗ NOT SET'}`);

// Check build output
const distPath = path.join(__dirname, 'dist', 'public');
const distExists = fs.existsSync(distPath);
console.log(`\nBuild output: ${distExists ? '✓ EXISTS' : '✗ NOT BUILT'}`);

if (distExists) {
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
      const jsContent = fs.readFileSync(path.join(assetsPath, jsFiles[0]), 'utf8');
      const hasBakedUrl = jsContent.includes('brnaxuizuks');
      const hasPlaceholder = jsContent.includes('placeholder.supabase.co');
      console.log(`  - Env vars in bundle: ${hasBakedUrl ? '✓ PRESENT' : '✗ MISSING'}`);
      console.log(`  - Placeholder in bundle: ${hasPlaceholder ? '✗ USING FALLBACK' : '✓ CLEAN'}`);
    }
  }
}

// Check Vite config
const viteConfigPath = path.join(__dirname, 'client', 'vite.config.mjs');
const viteConfigExists = fs.existsSync(viteConfigPath);
console.log(`\nVite config: ${viteConfigExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (viteConfigExists) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  const hasLoadEnv = viteConfig.includes('loadEnv');
  const hasDefine = viteConfig.includes('define:');
  console.log(`  - loadEnv() usage: ${hasLoadEnv ? '✓' : '✗'}`);
  console.log(`  - define injection: ${hasDefine ? '✓' : '✗'}`);
}

console.log('\n=== Recommendations ===\n');

if (!rootEnvExists && !clientEnvExists) {
  console.log('⚠️  No .env files found. Create client/.env with:');
  console.log('   VITE_SUPABASE_URL=https://brnaxuizukscigenouyd.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
}

if (!distExists) {
  console.log('⚠️  Build output missing. Run: npm run build');
}

console.log('\n✅ All checks complete\n');
