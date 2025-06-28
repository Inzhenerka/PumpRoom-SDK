import typescript from 'rollup-plugin-typescript2';
import terser from "@rollup/plugin-terser";
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isWatch = process.env.ROLLUP_WATCH === 'true';

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
            typescript({tsconfig: "tsconfig.json", useTsconfigDeclarationDir: true}),
            terser(),
            isWatch && serve({
                contentBase: [''], // папки, которые хотим отдавать
                port: 8002,
                open: false,
            }),
            isWatch && livereload({watch: ['dist', 'example']}),
        ].filter(Boolean)
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/pumproom-sdk.esm.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: [
            typescript({tsconfig: "tsconfig.json", useTsconfigDeclarationDir: true})
        ]
    }
];
