/* eslint-disable @typescript-eslint/ban-types */

export function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

export function formatISOToHoursMinutes(time: string): string {
    const newTime = new Date(time);
    let hours = String(newTime.getHours());
    let minutes = String(newTime.getMinutes());
    if (Number(hours) < 10) {
        hours = '0' + hours;
    }
    if (Number(minutes) < 10) {
        minutes = '0' + minutes;
    }
    return `${hours}:${minutes}`;
}

export function extractISOMonthDateYear(iso: string | number | boolean | Date | null | undefined | object, materialUI = false): string | null {
    if (!iso)
        return null;
    if (typeof iso !== 'string' && (!(iso instanceof Date)))
        return null;

    const time = new Date(iso);
    if (materialUI) {
        // year-month-date
        const year = String(time.getFullYear());
        let month = String(time.getMonth() + 1);
        let date = String(time.getDate());
        if (Number(month) < 10) {
            month = '0' + month;
        }
        if (Number(date) < 10) {
            date = '0' + date;
        }
        const result = `${year}-${month}-${date}`;
        return result;
    }
    const result = `${time.getMonth() + 1}/${time.getDate()}/${time.getFullYear()}`;
    return result;
}
