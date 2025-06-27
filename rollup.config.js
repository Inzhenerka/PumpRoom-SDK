import typescript from 'rollup-plugin-typescript2';
import terser from "@rollup/plugin-terser";

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/pumproom-sdk.umd.js',
      format: 'umd',
      name: 'PumpRoomSdk',
      sourcemap: true
    },
    plugins: [
      typescript({ tsconfig: "tsconfig.json", useTsconfigDeclarationDir: true }),
      terser()
    ]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/pumproom-sdk.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      typescript({ tsconfig: "tsconfig.json", useTsconfigDeclarationDir: true })
    ]
  }
];
