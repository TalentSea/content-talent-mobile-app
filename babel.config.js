const fs = require('fs');
const path = require('path');

function getEnvVars() {
  const envPath = path.resolve(__dirname, '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length > 0) {
          envVars[key.trim()] = vals.join('=').trim();
        }
      }
    });
  }
  return envVars;
}

const envVars = getEnvVars();

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    function inlineEnvPlugin({ types: t }) {
      return {
        visitor: {
          MemberExpression(path) {
            if (
              path.node.object &&
              path.node.object.type === 'MemberExpression' &&
              path.node.object.object &&
              path.node.object.object.name === 'process' &&
              path.node.object.property &&
              path.node.object.property.name === 'env'
            ) {
              const envKey = path.node.property.name;
              if (envKey && envVars[envKey] !== undefined) {
                path.replaceWith(t.stringLiteral(envVars[envKey]));
              }
            }
          },
        },
      };
    },
  ],
};
