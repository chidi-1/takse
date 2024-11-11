import vituum from 'vituum'
import pug from '@vituum/vite-plugin-pug'

export default {
    base: 'http://bevolgayan.temp.swtest.ru/promo/takse/',
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