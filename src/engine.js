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

export default class LudoEngine {

    path = [
        19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1, 7, 13, 14, 15, 16, 17, 18,
        42, 41, 40, 39, 38, 37, 43, 49, 50, 51, 52, 53, 54, 72, 71, 70, 69, 
        68, 67, 61, 55, 56, 57, 58, 59, 60, 36, 35, 34, 33, 32, 31, 25
    ];

    startPoints = {
        red: 20, 
        blue: 14,
        yellow: 50,
        green: 56
    };

    nullPoints = [33, 69, 39, 3];

    onWindowLoad () {
        let styleElement = document.createElement('style');
        styleElement.innerHTML = 
            Object.entries(this.startPoints)
                .map(([color, id]) => `#step-${id} {background-color:var(--${color}-house)!important}`)
                .join('');

        styleElement.innerHTML += 
            this.nullPoints
                .map(id => `#step-${id} {background-color:var(--dark-wood)!important}`)
                .join('');

        document.getElementById('wrap').append(styleElement);
    }

    async alert (message, waitTill = 2000) {
        let parentElement = document.querySelector('.board-wrapper');
        let alertElement = document.createElement('div');
        alertElement.className = 'alert';
        alertElement.style.opacity = 0;

        let pElement = document.createElement('p');
        pElement.innerHTML = message;

        alertElement.appendChild(pElement);
        parentElement.appendChild(alertElement);

        await LudoEngine.sleep(1000)
        alertElement.style.opacity = 1;
        await LudoEngine.sleep(waitTill);
        alertElement.style.opacity = 0;
        await LudoEngine.sleep(200);

        parentElement.removeChild(alertElement)
    }

    static sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

}