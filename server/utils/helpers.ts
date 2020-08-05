/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export class Helpers {
    static arraysEqual(input1: any, input2: any): boolean {
        if (!Array.isArray(input1) || ! Array.isArray(input2) || input1.length !== input2.length)
            return false;

        const SortedArray1 = input1.concat().sort();
        const SortedArray2 = input2.concat().sort();

        for (let arrayElement = 0; arrayElement < SortedArray1.length; arrayElement++) {
            if (SortedArray1[arrayElement] !== SortedArray2[arrayElement])
                return false;
        }

        return true;
    }
}