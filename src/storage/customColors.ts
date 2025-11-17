const customColorsKey = "psnp-gee-customcolors";

var cachedCustomColors: CustomColors | null;

export function getCustomColors(guideID: number): string[] {
    if(!cachedCustomColors) {
        loadCustomColors();
    }

    return cachedCustomColors?.guideIDToCustomColorList.get(guideID) ?? [];
}

export function setCustomColors(guideID: number, colors: string[]) {
    if(!cachedCustomColors) {
        loadCustomColors();
    }

    cachedCustomColors?.guideIDToCustomColorList.set(guideID, colors);

    saveCustomColors();
}

function loadCustomColors() {
    const customColorsJSON = localStorage.getItem(customColorsKey);
    if(customColorsJSON) {
        const parsed = JSON.parse(customColorsJSON);
        cachedCustomColors = {
            guideIDToCustomColorList: new Map<number, string[]>(parsed.guideIDToCustomColorList || [])
        }
    } else {
        cachedCustomColors = {
            guideIDToCustomColorList: new Map<number, string[]>()
        };
    }
}

function saveCustomColors() {
    if(!cachedCustomColors) {
        return;
    }

    const serializable = {
        guideIDToCustomColorList: Array.from(cachedCustomColors.guideIDToCustomColorList.entries())
    }

    localStorage.setItem(customColorsKey, JSON.stringify(serializable));
}

interface CustomColors {
    guideIDToCustomColorList: Map<number, string[]>
}