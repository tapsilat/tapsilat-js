import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const config = [
  // Build TypeScript to JavaScript
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named',
      },
    ],
    external: ['crypto'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
  // Bundle TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    external: ['crypto'],
    plugins: [dts()],
  },
];

export default config; 