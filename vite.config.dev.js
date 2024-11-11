import vituum from 'vituum'
import pug from '@vituum/vite-plugin-pug'

export default {
    build: {
        minify: false,
        cssMinify: false,
        terserOptions: {compress: false, mangle: false}
    },
    plugins: [vituum(
        {
            imports: {
                filenamePattern: {
                    '+.css': [],
                    '+.sass': 'src/styles'
                }
            },
            input: [
                './public/images/*.*'
                /*'./src/assets/images/!*.*'*/
            ]
        }
    ), pug({
        root: './src'
    })],
}