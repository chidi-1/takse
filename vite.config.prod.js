import vituum from 'vituum'
import pug from '@vituum/vite-plugin-pug'

export default {
    base: '',
    build: {
        minify: false,
        cssMinify: false,
        terserOptions: {compress: false, mangle: false},
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        },
        outDir: 'dist',
        assetsDir: 'assets',
        assetsInlineLimit: 0,
    },
    plugins: [
        vituum(
            {
                imports: {
                    filenamePattern: {
                        '+.css': [],
                        '+.sass': 'src/styles'
                    }
                },
            }
        ), pug({
            root: './src',
            options: { pretty: true }
        }),
    ],
}