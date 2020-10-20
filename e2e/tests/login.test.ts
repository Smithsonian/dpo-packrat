import { Page } from 'playwright';
import E2EUtils, { ID, Selectors } from '../utils';

const utils = new E2EUtils();
utils.setupJest();

let page: Page | null;
let login: () => Promise<void>;

beforeEach(() => {
    page = utils.page;
    login = utils.login;
});

describe('Login E2E tests', () => {
    test('User should be able to login', async () => {
        await login();
    });

    test('User should be able to logout', async () => {
        await login();
        page?.on('dialog', dialog => {
            dialog.accept();
        });
        await page?.click(ID(Selectors.AUTH.LOGOUT_BUTTON));
        await page?.waitForNavigation({
            timeout: 20000,
            waitUntil: 'domcontentloaded'
        });
    });
});
