import { addColorButtonsIfNeeded } from "./tools/editColors";
import { addGridToolbarButtonsIfNeeded } from "./tools/gridMoving";
import {
    addImageButtonsIfNeeded,
    onEditorInitializationForImage
} from "./tools/selfLinkImage";
import {
    onEditorInitializationForAutoSave
} from "./tools/autoSave";

export const psnpGeeCustomClassName = "psnp-gee-editor";

export var guideID: number | null;

main();

async function main() {
    if(!window.location.pathname.endsWith("/edit")) {
        return;
    }

    parseGuideID();
    setupObserver();
}

function parseGuideID() {
    const match = window.location.href.match(/\/guide\/(\d+)-/);
    if(match) {
        guideID = Number(match[1]);
    } else {
        console.error(`Unable to parse Guide ID from URL: ${window.location.href}`);
    }
}

function setupObserver() {
    const observer = new MutationObserver(() => {
        addGridToolbarButtonsIfNeeded();
        addColorButtonsIfNeeded();
        addImageButtonsIfNeeded();

        listenForEditors();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function listenForEditors() {
    const editors = Array.from(document.getElementsByClassName("fr-element fr-view"))
        .map(x => x as HTMLDivElement);

    for(const editor of editors) {
        if(editor.classList.contains(psnpGeeCustomClassName)) {
            continue;
        }

        editor.className = `${editor.className} ${psnpGeeCustomClassName}`;

        onEditorInitializationForImage(editor);
        onEditorInitializationForAutoSave(editor);
    }
}