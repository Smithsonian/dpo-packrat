import playwright, { ChromiumBrowser, ChromiumBrowserContext, LaunchOptions, Page } from 'playwright';

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
}

export default E2ETestUtils;
