import * as Yup from 'yup';

export interface ILoginForm {
    email: string;
    password: string;
}

const loginValidationSchema = () =>
    Yup.object({
        email: Yup.string().required('Required'),
        password: Yup.string().required('Required')
    });

const initialValues = {
    email: 'test@si.edu',
    password: 'test@si.edu'
};

function useLoginForm(): { initialValues: ILoginForm; loginValidationSchema: typeof loginValidationSchema } {
    return {
        initialValues,
        loginValidationSchema
    };
}

export default useLoginForm;
