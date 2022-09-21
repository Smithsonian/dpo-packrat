/**
 * Config Overrides
 *
 * This config is used for overriding default webpack config of CRA without
 * ejecting.
 */
const path = require('path');
const { override, addExternalBabelPlugin, babelInclude } = require('customize-cra');
const { addReactRefresh } = require('customize-cra-react-refresh');

/*
function overrideIncludes(config) {
    // See https://stackoverflow.com/questions/65893787/create-react-app-with-typescript-and-npm-link-enums-causing-module-parse-failed.
    config.module.rules[1].oneOf[2].include = [
        path.join(__dirname, './src'),
        // path.join(__dirname, '../common/src')
        path.join(__dirname, '../common')
    ];
    return config;
}
*/

// module.exports = override(overrideIncludes(config), addExternalBabelPlugin('react-activation/babel'), addReactRefresh(), disableEsLint());
// module.exports = override(overrideIncludes, addExternalBabelPlugin('react-activation/babel'), addReactRefresh());
// module.exports = override(addExternalBabelPlugin('react-activation/babel'), addReactRefresh(), addExternalBabelPlugin(path.join(__dirname, '../common')));
module.exports = override(addExternalBabelPlugin('react-activation/babel'), addReactRefresh(), babelInclude([
    path.resolve('src'), // make sure you link your own source
    path.resolve('../common'),
]));
