process.env.NODE_ENV = 'test';
process.env.PACKRAT_CLIENT_ENDPOINT = 'http://localhost:3000';
process.env.PACKRAT_SESSION_SECRET = 'test-secret';
if (!process.env.PACKRAT_EDAN_AUTH_KEY)
    process.env.PACKRAT_EDAN_AUTH_KEY = 'testing1234';
if (!process.env.PACKRAT_EDAN_SERVER)
    process.env.PACKRAT_EDAN_SERVER = 'https://edan.si.edu/';
if (!process.env.PACKRAT_EDAN_3D_API)
    process.env.PACKRAT_EDAN_3D_API = 'http://dev.3d.api.si.edu/';
if (!process.env.PACKRAT_EDAN_APPID)
    process.env.PACKRAT_EDAN_APPID = 'OCIO3D';
if (!process.env.PACKRAT_EDAN_UPSERT_RESOURCE_ROOT)
    process.env.PACKRAT_EDAN_UPSERT_RESOURCE_ROOT = 'nfs:///si-3ddigi-staging/upload/';
if (!process.env.PACKRAT_EDAN_STAGING_ROOT)
    process.env.PACKRAT_EDAN_STAGING_ROOT = './var/Storage/StagingEdan';
if (!process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER)
    process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER = './var/Storage/StagingEdan';
if (!process.env.PACKRAT_OCFL_STORAGE_ROOT)
    process.env.PACKRAT_OCFL_STORAGE_ROOT = './var/Storage/Repository';
if (!process.env.PACKRAT_OCFL_STAGING_ROOT)
    process.env.PACKRAT_OCFL_STAGING_ROOT = './var/Storage/Staging';
if (!process.env.PACKRAT_COOK_SERVER_URL)
    process.env.PACKRAT_COOK_SERVER_URL = 'http://si-3ddigip01.si.edu:8011/';
