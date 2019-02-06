const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    output: {
        filename: 'visualization.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin(['visualization.json'])
    ]
};
