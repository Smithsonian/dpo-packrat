import * as H from '../../utils/helpers';

describe('Utils: Helpers', () => {
    test('Utils: Helpers.arraysEqual', () => {
        // Number 1
        // Number 2
        // Arrays of different lengths
        // Arrays of same lengths, different values
        // Arryas of same lengths, same values, different sort
        // Arryas of same lengths, same values, same sort
        const n1: number = 3;
        const n2: number = 5;
        const a1: number[] = [1, 2];
        const a2: number[] = [1, 2, 3];
        const a3: number[] = [1, 2, 4];
        const a4: number[] = [3, 1, 2];
        const a5: number[] = [1, 2, 3];
        const a6: string[] = ['one', 'two', 'three'];
        expect(H.Helpers.arraysEqual(n1, n1)).toBeFalsy();
        expect(H.Helpers.arraysEqual(n1, n2)).toBeFalsy();
        expect(H.Helpers.arraysEqual(n1, a1)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a1, n1)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a1, a2)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a2, a3)).toBeFalsy();
        expect(H.Helpers.arraysEqual(a2, a4)).toBeTruthy();
        expect(H.Helpers.arraysEqual(a2, a5)).toBeTruthy();
        expect(H.Helpers.arraysEqual(a5, a6)).toBeFalsy();
    });
});
