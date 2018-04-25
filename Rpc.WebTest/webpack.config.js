const path = require('path');

module.exports = {
    entry: {
        wsRpc: path.resolve(__dirname, 'Scripts/WebSocketRpc.ts')
    },
    devtool: 'inline-source-map',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'wwwroot/js'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' }
        ]
    }
}