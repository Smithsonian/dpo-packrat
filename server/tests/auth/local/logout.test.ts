import { HttpServer } from '../../../http';
import request from 'supertest';
import * as DBAPI from '../../../db';

describe('Auth implementation: local logout', () => {
    let httpServer: HttpServer | null = null;

    test('initialize', async () => {
        httpServer = await HttpServer.getInstance();
        expect(httpServer).toBeTruthy();
    });

    test('should logout user correctly', async done => {
        const randomNumber: number = Math.random() * 100000000;
        const userInput = {
            Name: 'Test User',
            EmailAddress: 'test-' + randomNumber + '@si.edu',
            SecurityID: 'SECURITY_ID',
            Active: true,
            DateActivated: new Date(),
            DateDisabled: null,
            WorkflowNotificationTime: new Date(),
            EmailSettings: 0,
            idUser: 0,
            SlackID: ''
        };

        const user = new DBAPI.User(userInput);
        expect(user).toBeTruthy();
        if (user) {
            expect(await user.create()).toBeTruthy();
            expect(user.idUser).toBeGreaterThan(0);
        }

        const authBody = {
            email: userInput.EmailAddress,
            password: userInput.EmailAddress
        };

        if (httpServer) {
            const mockApp = request(httpServer.app);

            const { body: loginBody } = await mockApp.post('/auth/login').send(authBody).expect(200);
            expect(loginBody.success).toBeTruthy();

            const { body: logoutBody } = await mockApp.get('/auth/logout').expect(200);
            expect(logoutBody.success).toBeTruthy();
        }
        done();
    });
});
