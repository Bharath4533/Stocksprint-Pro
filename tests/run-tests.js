// Master Test Runner for StockSprint Pro

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting StockSprint Pro Test Suite...');

// 1. Run Unit Tests synchronously
const unit = spawn(process.execPath, [path.join(__dirname, 'unit.test.js')], { stdio: 'inherit' });

unit.on('close', (unitCode) => {
  if (unitCode !== 0) {
    console.error('Unit tests failed with exit code', unitCode);
    process.exit(unitCode);
  }

  // 2. Start Backend Server for Integration Tests
  const server = spawn(process.execPath, [path.join(__dirname, '../backend/server.js')], {
    stdio: 'pipe',
    env: { ...process.env, PORT: 3000 }
  });

  setTimeout(() => {
    // 3. Run Integration Tests
    const integration = spawn(process.execPath, [path.join(__dirname, 'integration.test.js')], { stdio: 'inherit' });

    integration.on('close', (intCode) => {
      server.kill();
      if (intCode === 0) {
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)');
      } else {
        console.error('Integration tests failed with exit code', intCode);
      }
      process.exit(intCode);
    });
  }, 1000);
});