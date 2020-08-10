process.env.NODE_ENV = 'test';
process.env.CLIENT_ENDPOINT = 'http://localhost:3000';
process.env.SESSION_SECRET = 'test-secret';
if (!process.env.EDAN_AUTH_KEY)
    process.env.EDAN_AUTH_KEY = 'testing1234';
if (!process.env.EDAN_SERVER)
    process.env.EDAN_SERVER = 'http://edan.si.edu/';
if (!process.env.EDAN_APPID)
    process.env.EDAN_APPID = 'OCIO3D';
if (!process.env.OCFL_STORAGE_ROOT)
    process.env.OCFL_STORAGE_ROOT = './var/PackratStorage';