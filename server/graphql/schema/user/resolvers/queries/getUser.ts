export default function getUser(parent: any, args: any, context: any): any {
    console.log(parent, args, context);

    const { input: { id } } = args;

    const user = {
        id,
        name: 'Packrat user'
    };

    return { user };
}