import assert from 'node:assert';
import { can } from '../lib/permissions';
import { validateEnv } from '../../../../packages/config/src/env';

console.log('🧪 Running CampusOS Phase 0 Built-in Unit Test Suite...\n');

// 1. RBAC & Permission Tests
console.log('Test 1: SUPER_ADMIN bypass permissions...');
assert.strictEqual(can('SUPER_ADMIN', 'users', 'delete', 'all'), true);
assert.strictEqual(can('SUPER_ADMIN', 'finance', 'manage', 'institution'), true);
console.log('✅ PASS: SUPER_ADMIN bypass verified.\n');

console.log('Test 2: FACULTY section attendance permissions...');
assert.strictEqual(can('FACULTY', 'attendance', 'mark', 'own_section'), true);
assert.strictEqual(can('FACULTY', 'assignments', 'manage', 'own_section'), true);
assert.strictEqual(can('FACULTY', 'fees', 'manage', 'institution'), false);
console.log('✅ PASS: FACULTY permissions verified.\n');

console.log('Test 3: STUDENT self permissions...');
assert.strictEqual(can('STUDENT', 'attendance', 'read', 'own'), true);
assert.strictEqual(can('STUDENT', 'grades', 'read', 'own'), true);
assert.strictEqual(can('STUDENT', 'attendance', 'mark', 'own_section'), false);
assert.strictEqual(can('STUDENT', 'marks', 'approve', 'department'), false);
console.log('✅ PASS: STUDENT permission boundaries verified.\n');

// 2. Zod Environment Variable Validation Tests
console.log('Test 4: Environment Zod Schema validation...');
const validEnv = {
  DATABASE_URL: 'postgresql://campusos:campusos_password@localhost:5432/campusos_db?schema=public',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'campusos_super_secret_jwt_key_32_bytes_min_length_12345',
  JWT_REFRESH_SECRET: 'campusos_super_secret_refresh_key_32_bytes_12345',
  S3_ACCESS_KEY: 'minioadmin',
  S3_SECRET_KEY: 'minioadminpassword',
  NODE_ENV: 'development',
};

const parsed = validateEnv(validEnv as any);
assert.strictEqual(parsed.DATABASE_URL, 'postgresql://campusos:campusos_password@localhost:5432/campusos_db?schema=public');
assert.strictEqual(parsed.NODE_ENV, 'development');
console.log('✅ PASS: Environment Zod schema validation verified.\n');

console.log('🎉 ALL PHASE 0 UNIT TESTS PASSED CLEANLY (4/4)!');
