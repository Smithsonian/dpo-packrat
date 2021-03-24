export type VerifyUserResult = {
    success: boolean;
    error: string | null;
};

export interface IAuth {
    verifyUser: (email: string, password: string) => Promise<VerifyUserResult>;
}

export { IAuth as default };
