import { app } from '../../../index';
import request from 'supertest';
import * as DBAPI from '../../../db';

describe('Auth implementation: local login', () => {
    afterAll(done => {
        done();
    });

    test('should work with correct user credentials', async done => {
        const userInput = {
            Name: 'Test User',
            EmailAddress: 'test@si.edu',
            SecurityID: 'SECURITY_ID',
            Active: true,
            DateActivated: new Date(),
            DateDisabled: null,
            WorkflowNotificationTime: new Date(),
            EmailSettings: 0,
            idUser: 0
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

        const { body } = await request(app).post('/auth/login').send(authBody).expect(200);
        expect(body.success).toBe(true);
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
            idUser: 0
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

        const { body } = await request(app).post('/auth/login').send(authBody).expect(200);
        expect(body.success).toBe(false);
        expect(body.message).toBeTruthy();
        done();
    });

    test('should fail with invalid credentials', async done => {
        const authBody = {
            email: null,
            password: null
        };

        const response = await request(app).post('/auth/login').send(authBody).expect(500);
        expect(response.accepted).toBe(false);
        done();
    });
});
