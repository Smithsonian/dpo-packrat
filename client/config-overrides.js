const { override, addExternalBabelPlugin } = require('customize-cra');

module.exports = override(addExternalBabelPlugin('react-activation/babel'));
