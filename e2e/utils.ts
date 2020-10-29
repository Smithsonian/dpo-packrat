import playwright, { ChromiumBrowser, ChromiumBrowserContext, LaunchOptions, Page } from 'playwright';
import { Selectors } from '../client/src/config';

class E2ETestUtils {
    public page: Page | null = null;
    private browser: ChromiumBrowser | null = null;
    private context: ChromiumBrowserContext | null = null;

    public setupJest(): void {
        global.beforeEach(this.beforeEach.bind(this));
        global.afterEach(this.afterEach.bind(this));
    }

    private async beforeEach(): Promise<void> {
        jest.setTimeout(60000);
        const options: LaunchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-gpu']
        };

        this.browser = await playwright.chromium.launch(options);
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();

        const { CLIENT_ENDPOINT } = process.env;

        if (!CLIENT_ENDPOINT) {
            throw new Error('E2E tests: CLIENT_ENDPOINT was not provided');
        }

        await this.page.goto(CLIENT_ENDPOINT);
    }

    private async afterEach(): Promise<void> {
        await this.browser?.close();
    }

    public login = async (): Promise<void> => {
        if (!this.page) {
            throw new Error('E2E tests: page was not initialized');
        }

        const TEST_USER_EMAIL: string = 'karan.pratapsingh686@gmail.com';
        const TEST_USER_PASSWORD: string = 'karan.pratapsingh686@gmail.com';

        await this.page.type(ID(Selectors.AUTH.EMAIL_FIELD), TEST_USER_EMAIL);
        await this.page.type(ID(Selectors.AUTH.PASSWORD_FIELD), TEST_USER_PASSWORD);
        await this.page.click(ID(Selectors.AUTH.LOGIN_BUTTON));
        await this.page.waitForNavigation({
            timeout: 20000,
            waitUntil: 'domcontentloaded'
        });
    };
}

const ID = (selector: string): string => `#${selector}`;

export { E2ETestUtils as default, Selectors, ID };
