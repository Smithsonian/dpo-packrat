const { override, addExternalBabelPlugin } = require('customize-cra');
const { addReactRefresh } = require('customize-cra-react-refresh');

module.exports = override(addExternalBabelPlugin('react-activation/babel'), addReactRefresh());
