module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
    ],
    plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-runtime'
    ]
};
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript'
        ],
        plugins: [
            '@babel/plugin-transform-modules-commonjs'
        ]
    };
};
