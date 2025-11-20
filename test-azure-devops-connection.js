#!/usr/bin/env node

/**
 * Azure DevOps Connection Diagnostic Tool
 * This script tests the Azure DevOps connection with detailed debugging
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

async function testAzureDevOpsConnection() {
  try {
    // Read the config file
    const configPath = 'C:\\AzureDevOps\\bswhealth\\HealthSource\\bsw.category\\.azure-devops.json';
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ Config file not found:', configPath);
      console.log('Please create .azure-devops.json with your configuration');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('📋 Configuration loaded:');
    console.log('  Organization:', config.organization);
    console.log('  Project:', config.project);
    console.log('  Repository:', config.repository);
    console.log('  Has Token:', !!config.personalAccessToken);
    console.log('  Token Length:', config.personalAccessToken ? config.personalAccessToken.length : 0);
    
    if (!config.personalAccessToken) {
      console.error('❌ No personalAccessToken found in config');
      return;
    }

    // Determine the base URL
    const organization = config.organization;
    let baseUrl;
    
    if (organization.startsWith('http')) {
      baseUrl = `${organization}`;
    } else {
      // Check if this looks like visualstudio.com format
      if (organization.includes('.')) {
        baseUrl = `https://${organization}`;
      } else {
        // Assume it needs visualstudio.com format based on the logs
        baseUrl = `https://${organization}.visualstudio.com`;
      }
    }
    
    const testUrl = `${baseUrl}/${config.project}/_apis/git/repositories?api-version=7.0&$top=1`;
    
    console.log('🔗 Test URL:', testUrl);
    
    // Create Authorization header
    const auth = Buffer.from(`:${config.personalAccessToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'git-spark-diagnostic-tool/1.0'
    };
    
    console.log('📤 Headers:');
    console.log('  Authorization: Basic [REDACTED]');
    console.log('  Accept:', headers.Accept);
    console.log('  Content-Type:', headers['Content-Type']);
    console.log('  User-Agent:', headers['User-Agent']);
    
    // Make the test request
    console.log('\n🔄 Making test request...');
    
    const { URL } = require('url');
    const parsedUrl = new URL(testUrl);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: headers,
      timeout: 30000,
    };
    
    console.log('🌐 Request details:');
    console.log('  Hostname:', requestOptions.hostname);
    console.log('  Port:', requestOptions.port);
    console.log('  Path:', requestOptions.path);
    
    const startTime = Date.now();
    
    const result = await new Promise((resolve, reject) => {
      const req = https.request(requestOptions, res => {
        let responseData = '';
        res.on('data', chunk => (responseData += chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          console.log('\n📥 Response received:');
          console.log('  Status Code:', res.statusCode);
          console.log('  Status Message:', res.statusMessage);
          console.log('  Response Time:', duration + 'ms');
          console.log('  Content Length:', responseData.length);
          
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Connection successful!');
            try {
              const parsed = JSON.parse(responseData);
              console.log('  Repositories found:', parsed.count || parsed.value?.length || 0);
            } catch (e) {
              console.log('  Response data preview:', responseData.substring(0, 200));
            }
            resolve({ success: true, statusCode: res.statusCode, data: responseData });
          } else {
            console.log('❌ Connection failed');
            console.log('  Response preview:', responseData.substring(0, 500));
            resolve({ success: false, statusCode: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', error => {
        const duration = Date.now() - startTime;
        console.log('\n❌ Request error:');
        console.log('  Error:', error.message);
        console.log('  Duration:', duration + 'ms');
        reject(error);
      });

      req.on('timeout', () => {
        const duration = Date.now() - startTime;
        console.log('\n⏰ Request timeout:');
        console.log('  Duration:', duration + 'ms');
        reject(new Error('Request timeout'));
      });

      req.end();
    });
    
    if (!result.success) {
      console.log('\n🔍 Troubleshooting suggestions:');
      
      if (result.statusCode === 401) {
        console.log('  • Check that your PAT token is valid and not expired');
        console.log('  • Verify PAT token has these scopes: Code (read), Pull Request (read), Project and Team (read)');
        console.log('  • Try regenerating your PAT token');
        console.log('  • Ensure the organization name is correct');
      } else if (result.statusCode === 403) {
        console.log('  • Your PAT token may not have sufficient permissions');
        console.log('  • Check that you have access to this project');
      } else if (result.statusCode === 404) {
        console.log('  • Check the organization and project names');
        console.log('  • Verify the URL format is correct');
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

testAzureDevOpsConnection().catch(console.error);