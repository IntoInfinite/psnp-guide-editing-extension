// No TS types exist for v2.5.0 which PSNP has been using for many years.
// Will add just what we use here.
//
export interface FroalaEditor {
    undo: {
        saveStep: () => void;
    };
    colors: {
        showColorsPopup: () => void;
    };
    html: {
        get: () => string;
    }
    opts: {
        shortcutsEnabled: string[];
    }
    undoIndex: number;
}