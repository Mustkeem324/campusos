// eslint.config.mjs — ESLint 9 flat config for the CampusOS monorepo.
// Replaces the legacy `.eslintrc` / `.eslintrc.json` files that ESLint 9 no
// longer reads by default, and which `next lint` (removed in Next 16) relied on.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    settings: {
      next: {
        // Monorepo: the Next.js app lives under apps/web.
        rootDir: 'apps/web',
      },
    },
  },
  {
    // Ported from the previous `.eslintrc.json` overrides.
    files: ['apps/web/src/components/community/chat/AcademicCommunityChat.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // eslint-plugin-react-hooks v6/v7 ships a new family of React-Compiler-era
    // rules that the Next 14 toolchain (react-hooks v4/v5) never enforced. They
    // are disabled here so this framework upgrade preserves the pre-existing
    // lint baseline; enabling them is a dedicated follow-up refactor.
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  globalIgnores([
    // Toolchain outputs and generated artifacts.
    'apps/web/.next/**',
    'apps/web/out/**',
    'apps/web/build/**',
    'apps/web/next-env.d.ts',
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    // Prisma-generated client lives in node_modules and is already ignored.
    'packages/db/prisma/migrations/**',
  ]),
]);
