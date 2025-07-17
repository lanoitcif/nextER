#!/usr/bin/env node

/**
 * Simple test cases for TRIPOD MCP Server
 * Tests the basic functionality of session management and messaging
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

class TripodTester {
  constructor() {
    this.testCount = 0;
    this.passCount = 0;
  }

  async runTest(name, testFn) {
    this.testCount++;
    console.log(`\n🧪 Test ${this.testCount}: ${name}`);
    
    try {
      await testFn();
      this.passCount++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  async sendMcpRequest(tool, args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['tripod-mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: tool,
          arguments: args
        }
      };

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        } else {
          try {
            const lines = output.trim().split('\n');
            const response = JSON.parse(lines[lines.length - 1]);
            resolve(response);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${output}`));
          }
        }
      });

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();
    });
  }

  async runAllTests() {
    console.log('🚀 Starting TRIPOD MCP Server Tests\n');

    // Test 1: Create Session
    await this.runTest('Create Session', async () => {
      const response = await this.sendMcpRequest('tripod_create_session', {
        name: 'Test Session'
      });
      
      if (!response.result || !response.result.content) {
        throw new Error('No content in response');
      }
      
      const content = response.result.content[0].text;
      if (!content.includes('Session created successfully')) {
        throw new Error('Session creation failed');
      }
    });

    // Test 2: List Sessions
    await this.runTest('List Sessions', async () => {
      const response = await this.sendMcpRequest('tripod_list_sessions', {});
      
      if (!response.result || !response.result.content) {
        throw new Error('No content in response');
      }
      
      const content = response.result.content[0].text;
      if (!content.includes('Active TRIPOD Sessions')) {
        throw new Error('Session listing failed');
      }
    });

    // Test 3: Join Session (requires session ID from previous test)
    await this.runTest('Join Session', async () => {
      // First create a session to join
      const createResponse = await this.sendMcpRequest('tripod_create_session', {
        name: 'Join Test Session'
      });
      
      const sessionId = this.extractSessionId(createResponse.result.content[0].text);
      
      const joinResponse = await this.sendMcpRequest('tripod_join_session', {
        sessionId: sessionId,
        participantName: 'TestUser'
      });
      
      if (!joinResponse.result.content[0].text.includes('Successfully joined session')) {
        throw new Error('Session join failed');
      }
    });

    // Test 4: Send Message
    await this.runTest('Send Message', async () => {
      // Create session first
      const createResponse = await this.sendMcpRequest('tripod_create_session', {
        name: 'Message Test Session'
      });
      
      const sessionId = this.extractSessionId(createResponse.result.content[0].text);
      
      const messageResponse = await this.sendMcpRequest('tripod_send_message', {
        sessionId: sessionId,
        from: 'TestUser',
        content: 'Hello, TRIPOD!'
      });
      
      if (!messageResponse.result.content[0].text.includes('Message sent successfully')) {
        throw new Error('Message send failed');
      }
    });

    // Test 5: Get Messages
    await this.runTest('Get Messages', async () => {
      // Create session and send a message first
      const createResponse = await this.sendMcpRequest('tripod_create_session', {
        name: 'Get Messages Test'
      });
      
      const sessionId = this.extractSessionId(createResponse.result.content[0].text);
      
      await this.sendMcpRequest('tripod_send_message', {
        sessionId: sessionId,
        from: 'TestUser',
        content: 'Test message'
      });
      
      const messagesResponse = await this.sendMcpRequest('tripod_get_messages', {
        sessionId: sessionId
      });
      
      const content = messagesResponse.result.content[0].text;
      if (!content.includes('Test message')) {
        throw new Error('Message retrieval failed');
      }
    });

    // Test Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Tests Run: ${this.testCount}`);
    console.log(`   Passed: ${this.passCount}`);
    console.log(`   Failed: ${this.testCount - this.passCount}`);
    console.log(`   Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`);
    
    if (this.passCount === this.testCount) {
      console.log('\n🎉 All tests passed! TRIPOD MCP Server is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
  }

  extractSessionId(text) {
    const match = text.match(/Session ID: ([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Could not extract session ID from response');
    }
    return match[1];
  }
}

// Run tests
const tester = new TripodTester();
tester.runAllTests().catch(console.error);