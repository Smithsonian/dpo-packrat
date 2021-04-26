process.env.NODE_ENV = 'test';
process.env.PACKRAT_CLIENT_ENDPOINT = 'http://localhost:3000';
process.env.PACKRAT_SESSION_SECRET = 'test-secret';
if (!process.env.PACKRAT_EDAN_AUTH_KEY)
    process.env.PACKRAT_EDAN_AUTH_KEY = 'testing1234';
if (!process.env.PACKRAT_EDAN_SERVER)
    process.env.PACKRAT_EDAN_SERVER = 'http://edan.si.edu/';
if (!process.env.PACKRAT_EDAN_APPID)
    process.env.PACKRAT_EDAN_APPID = 'OCIO3D';
if (!process.env.PACKRAT_OCFL_STORAGE_ROOT)
    process.env.PACKRAT_OCFL_STORAGE_ROOT = './var/Storage/Repository';
if (!process.env.PACKRAT_OCFL_STAGING_ROOT)
    process.env.PACKRAT_OCFL_STAGING_ROOT = './var/Storage/Staging';
if (!process.env.PACKRAT_COOK_SERVER_URL)
    process.env.PACKRAT_COOK_SERVER_URL = 'http://si-3ddigip01.si.edu:8011/';
