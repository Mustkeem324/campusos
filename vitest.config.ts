import { defineConfig } from 'vitest/config';
import fs from 'fs';
import path from 'path';

function loadEnvFile(file: string) {
  if (fs.existsSync(file)) {
    const envConfig = fs.readFileSync(file, 'utf-8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const envKey = key.trim();
          let envVal = valueParts.join('=').trim();
          if (envVal.startsWith('"') && envVal.endsWith('"')) {
            envVal = envVal.slice(1, -1);
          }
          process.env[envKey] = envVal;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, '.env'));
loadEnvFile(path.resolve(__dirname, 'apps/web/.env'));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/tests/**/*.spec.ts'],
  },
});
