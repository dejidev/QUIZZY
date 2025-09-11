// One year from now (approx 365 days)
export const oneYearFromNow = (): Date => {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
};

// Thirty days from now
export const thirtyDaysFromNow = (): Date => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};


// export const fifteenMinutesFromNow = () => {
//     new Date(Date.now() + 15 * 60 * 1000)
// }


export function fifteenMinutesFromNow(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return now;
}


export const ONE_DAY_MS = 24 * 60 * 60 * 1000