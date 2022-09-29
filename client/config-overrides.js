/**
 * Config Overrides
 *
 * This config is used for overriding default webpack config of CRA without
 * ejecting.
 */
const path = require('path');
const { override, addExternalBabelPlugin, babelInclude } = require('customize-cra');
const { addReactRefresh } = require('customize-cra-react-refresh');

module.exports = override(addExternalBabelPlugin('react-activation/babel'), addReactRefresh(), babelInclude([
    path.resolve('src'), // make sure you link your own source
    path.resolve('../common'),
]));
