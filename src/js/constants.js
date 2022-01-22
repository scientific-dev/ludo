/**
 * Ludo Steps ID Map Reference
 * 
 *                    01 07 13
 *                    02 08 14
 *                    03 09 15
 *                    04 10 16
 *                    05 11 17
 *                    06 12 18
 *  19 20 21 22 23 24          42 41 40 39 38 37
 *  25 26 27 28 29 30          48 47 46 45 44 43
 *  31 32 33 34 35 36          54 53 52 51 50 49 
 *                    60 66 72
 *                    59 65 71
 *                    58 64 70
 *                    57 63 69
 *                    56 62 68
 *                    55 61 67
 */

export const COLORS = ["red", "yellow", "green", "blue"];

export const LUDO_PATH = [
    19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1, 7, 13, 14, 15, 16, 17, 18,
    42, 41, 40, 39, 38, 37, 43, 49, 50, 51, 52, 53, 54, 72, 71, 70, 69, 
    68, 67, 61, 55, 56, 57, 58, 59, 60, 36, 35, 34, 33, 32, 31, 25
];

export const START_POINTS = {
    red: 20, 
    blue: 14,
    yellow: 50,
    green: 56
};

export const HOME_PATHS = {
    red: [26, 27, 28, 29, 30],
    blue: [8, 9, 10, 11, 12],
    yellow: [44, 45, 46, 47, 48],
    green: [62, 63, 64, 65, 66]
};

export const NULL_POINTS = [33, 69, 39, 3, ...Object.values(START_POINTS)];

export const PLAYER_PATHS = 
    Object.fromEntries(
        COLORS.map(color => {
            let x = LUDO_PATH.indexOf(START_POINTS[color]);
            let sliced = LUDO_PATH.slice(x, x + 51);
            if (sliced.length != 51) sliced = sliced.concat(LUDO_PATH.slice(0, 51 - sliced.length))
            return [color, [...sliced, ...HOME_PATHS[color], Infinity]]
        })
    )

// TODO(scientific-dev): Find a better way for dice html sides...
export const DICE_HTML_SIDES = [
    `<div class="dot"></div>`,
    `<div class="dot"></div>`.repeat(2),
    `<div class="dot"></div>`.repeat(3),
    `<div class="flex"><div class="dot"></div> <div class="dot"></div></div>`.repeat(2),
    `
        <div class="flex"><div class="dot"></div> <div class="e-dot"></div> <div class="dot"></div></div> 
        <div class="flex"><div class="e-dot"></div> <div class="dot"></div></div> 
        <div class="flex"><div class="dot"></div> <div class="e-dot"></div> <div class="dot"></div></div>
    `,
    `<div class="flex"><div class="dot"></div> <div class="dot"></div></div>`.repeat(3),
];

export const HOUSE_SIDES = {
    red: 'top-left',
    blue: 'top-right',
    green: 'bottom-left',
    yellow: 'bottom-right'
};