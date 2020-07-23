import { User } from '../../db';

type VerifiedUser = {
    user: User | null;
    error: string | null;
};

interface IAuth {
    verifyUser: (email: string, password: string) => Promise<VerifiedUser>;
}

export { IAuth as default, VerifiedUser };
