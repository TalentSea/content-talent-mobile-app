const fs = require('fs');
const path = require('path');

let envCreatorId = 2;
let envApiBaseUrl = 'http://138.68.140.83:8000';

try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const cidMatch = envContent.match(/CREATOR_ID\s*=\s*(\d+)/);
    if (cidMatch && cidMatch[1]) {
      envCreatorId = parseInt(cidMatch[1], 10);
    }
    const urlMatch = envContent.match(/API_BASE_URL\s*=\s*(\S+)/);
    if (urlMatch && urlMatch[1]) {
      envApiBaseUrl = urlMatch[1].trim();
    }
  }
} catch (e) {
  console.warn('[babel.config.js] Notice reading .env:', e);
}

process.env.CREATOR_ID = process.env.CREATOR_ID || String(envCreatorId);
process.env.API_BASE_URL = process.env.API_BASE_URL || envApiBaseUrl;

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    function inlineEnvVariablesPlugin() {
      return {
        visitor: {
          MemberExpression(memberPath) {
            if (
              memberPath.node.object.type === 'MemberExpression' &&
              memberPath.node.object.object.name === 'process' &&
              memberPath.node.object.property.name === 'env'
            ) {
              const key = memberPath.node.property.name;
              if (key === 'CREATOR_ID') {
                memberPath.replaceWith({
                  type: 'NumericLiteral',
                  value: Number(process.env.CREATOR_ID || envCreatorId),
                });
              } else if (key === 'API_BASE_URL') {
                memberPath.replaceWith({
                  type: 'StringLiteral',
                  value: String(process.env.API_BASE_URL || envApiBaseUrl),
                });
              }
            }
          },
        },
      };
    },
  ],
};

