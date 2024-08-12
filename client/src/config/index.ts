/**
 * Config
 *
 * Organize and export client config here by extending from .env
 */
const Config = {
    contact: {
        email: 'maslowskiec@si.edu'
    },
    /*
        Notes about Voyager:
            -https://3d-api.si.edu/resources/js/voyager-story.min.js will always hit the latest and greatest version
            -Once a voyager/dev endpoint is deployed, these links should point to that and be tested upon each release
            -To specify a version, use https://3d-api.si.edu/resources/js/v[release]/voyager-explorer.min.js
                -e.g. https://3d-api.si.edu/resources/js/v0.14.2/voyager-explorer.min.js

            -See releases @ https://github.com/Smithsonian/dpo-voyager/releases
    */
    voyager: {
        storyJS: process.env.NODE_ENV === 'development' ? 'https://3d-api.si.edu/resources/js/voyager-story.min.js': 'https://3d-api.si.edu/resources/js/voyager-story.min.js',
        storyJSDev: process.env.NODE_ENV === 'development' ? 'https://3d-api.si.edu/resources/js/voyager-story.dev.js': 'https://3d-api.si.edu/resources/js/voyager-story.dev.js',
        storyCSS: process.env.NODE_ENV === 'development' ? 'https://3d-api.si.edu/resources/css/voyager-story.min.css' : 'https://3d-api.si.edu/resources/css/voyager-story.min.css',
        explorerJS: process.env.NODE_ENV === 'development' ? 'https://3d-api.si.edu/resources/js/voyager-explorer.min.js' : 'https://3d-api.si.edu/resources/js/voyager-explorer.min.js',
    }
};

export default Config;
export * from './Selectors';
