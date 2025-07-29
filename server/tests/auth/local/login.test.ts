import { HttpServer } from '../../../http';
import request from 'supertest';
import * as DBAPI from '../../../db';

describe('Auth implementation: local login', () => {
    let httpServer: HttpServer | null = null;

    test('initialize', async () => {
        httpServer = await HttpServer.getInstance();
        expect(httpServer).toBeTruthy();
    });

    test('should work with correct user credentials', async done => {
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
            const { body } = await request(httpServer.app).post('/auth/login').send(authBody).expect(200);
            expect(body.success).toBe(true);
        }
        done();
    });

    test('should fail with incorrect credentials', async done => {
        const userInput = {
            Name: 'Test User',
            EmailAddress: 'test@si.edu',
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
            password: 'incorrect-password'
        };

        if (httpServer) {
            const { body } = await request(httpServer.app).post('/auth/login').send(authBody).expect(200);
            expect(body.success).toBe(false);
            expect(body.message).toBeTruthy();
        }
        done();
    });

    test('should fail with invalid credentials', async done => {
        const authBody = {
            email: null,
            password: null
        };

        if (httpServer) {
            const response = await request(httpServer.app).post('/auth/login').send(authBody).expect(500);
            expect(response.accepted).toBe(false);
        }
        done();
    });
});
