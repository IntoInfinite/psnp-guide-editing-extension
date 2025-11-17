import { guideID } from "..";
import {
    EditorType,
    getFroalaEditor,
    findEditorInfo,
    EditorInfo
} from "../froalaEditor/froalaHelpers";

const customSaveButtonClass = "psnp-gee-save-button";
const customSaveLabelClass = "psnp-gee-save-label";

var editorIDToLastSavedDate = new Map<string, Date>();

export function onEditorInitializationForAutoSave(editor: HTMLDivElement) {
    setupQuickSaveButton(editor);
    listenForSaveShortcut(editor);
}

function setupQuickSaveButton(editor: HTMLDivElement) {
    const editorInfo = findEditorInfo(editor);
    if(!editorInfo) {
        console.log("Failed to find editor info")
        return;
    }

    const sectionDiv = findSectionContainerDivView(editorInfo);
    if(!sectionDiv) {
        console.log("Failed to find section container")
        return;
    }

    const froalaEditor = getFroalaEditor(editor);
    if(!froalaEditor) {
        return;
    }

    // Ensure the strikethrough, that's not even supported, is not enabled. This would conflict with our saving shortcut.
    //
    froalaEditor.opts.shortcutsEnabled = froalaEditor.opts.shortcutsEnabled.filter(x => x !== "strikeThrough");

    const buttonContainers = Array.from(sectionDiv.getElementsByClassName("floatr"));
    if(buttonContainers.length == 0) {
        return;
    }

    const buttonContainer = buttonContainers[0] as HTMLSpanElement;
    const parentDiv = buttonContainer.parentElement as HTMLDivElement;
    parentDiv.style.display = "flex"
    parentDiv.style.flexWrap = "nowrap";
    parentDiv.style.flexDirection = "row"
    parentDiv.style.gap = "4px";
    parentDiv.style.alignItems = "center";

    // When editing a roadmap stage, the stage name label will be here.
    //
    if(parentDiv.firstElementChild?.tagName === "SPAN") {
        console.log(parentDiv.firstElementChild);
        const stageName = parentDiv.firstElementChild! as HTMLSpanElement;
        stageName.style.whiteSpace = "nowrap";
        stageName.style.alignSelf = "center";
        stageName.style.verticalAlign = "center";
        stageName.style.marginBottom = "10px";
    }

    const input = parentDiv.querySelector("input");
    if(input) {
        input.style.flexGrow = "1";
        input.style.minWidth = "0";
        input.style.width = "auto";
    }

    const sectionRevisions = parentDiv.getElementsByClassName("SectionRevisions");
    if(sectionRevisions.length == 1) {
        const sectionRevision = sectionRevisions[0] as HTMLDivElement;
        sectionRevision.style.display = "flex";
        sectionRevision.style.flexWrap = "nowrap";
        sectionRevision.style.gap = "4px";
        sectionRevision.style.flexGrow = "1";
        sectionRevision.style.flex = "1";
        sectionRevision.style.minWidth = "0";
        (sectionRevision.firstElementChild as HTMLSelectElement).style.flex = "1";
        (sectionRevision.firstElementChild as HTMLSelectElement).style.minWidth = "0";
        (sectionRevision.firstElementChild as HTMLSelectElement).style.flexGrow = "1";
        (sectionRevision.firstElementChild as HTMLSelectElement).style.width = "100%";
    }

    buttonContainer.style.display = "flex";
    buttonContainer.style.flexWrap = "nowrap";
    buttonContainer.style.gap = "4px";
    buttonContainer.style.margin = "0";
    buttonContainer.style.marginBottom = editorInfo.editorType == EditorType.Roadmap ? "10px" : "0px";
    buttonContainer.style.marginLeft = "50px";
    buttonContainer.style.justifyContent = "flex-end";

    // Find the existing save button.
    //
    const saveButtons = Array.from(sectionDiv.getElementsByClassName("section-saveButton"))
        .map(x => x as HTMLAnchorElement);

    if(saveButtons.length == 0) {
        console.error(`Could not find save button!`);
        return;
    }

    const saveButton = saveButtons[0];

    const quickSaveButton = saveButton.cloneNode(true) as HTMLAnchorElement;
    quickSaveButton.innerText = "Quick Save";
    // Override existing onClick and ensure we return false for any browser navigation.
    //
    quickSaveButton.setAttribute("onclick", "return false;");
    quickSaveButton.className = `${quickSaveButton.className} ${customSaveButtonClass}`;
    quickSaveButton.addEventListener('click', _ => {
        save(sectionDiv, editor);
    });

    saveButton.parentElement?.insertBefore(quickSaveButton, saveButton.nextElementSibling);
}

function listenForSaveShortcut(editor: HTMLDivElement) {
    editor.addEventListener("keydown", (e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

        if (ctrlOrCmd && e.key.toLowerCase() === "s") {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const editorInfo = findEditorInfo(editor);
            if(!editorInfo) {
                console.log("Failed to find editor info")
                return;
            }

            const sectionDiv = findSectionContainerDivView(editorInfo);
            if(!sectionDiv) {
                console.log("Failed to find section container")
                return;
            }

            save(sectionDiv, editor);
        }
    });
}

async function save(parentDivView: HTMLDivElement, editorDiv: HTMLDivElement) {
    const froalaEditor = getFroalaEditor(editorDiv);
    const editorInfo = findEditorInfo(editorDiv);
    const saveButtons = Array.from(parentDivView.getElementsByClassName(customSaveButtonClass))
    if(!froalaEditor || !editorInfo || !guideID || saveButtons.length == 0) {
        console.log("Unable to find required information to save.");
        return;
    }

    const quickSaveButton = saveButtons[0] as HTMLButtonElement;
    quickSaveButton.disabled = true;
    quickSaveButton.innerText = "Saving...";

    // May be null for trophy descriptions. The API expects a blank string in this case.
    //
    const nameInput = parentDivView.querySelector('input') as HTMLInputElement | null;

    const name = nameInput?.value || '';
    const content = froalaEditor.html.get();

    var url = "";
    var data: Record<string, any> = {
        id: guideID,
        content: encodeURIComponent(content),
        name: encodeURIComponent(name),
    }

    if(editorInfo.editorType == EditorType.Roadmap) {
        url = `guide/roadmap/save`;
        data.step = String(editorInfo.numericEditorID);
    } else {
        url = `guide/section/save`;
        data.section = String(editorInfo.numericEditorID);
    }

    const minDelay = new Promise(resolve => setTimeout(resolve, 750));
    try {
        await Promise.all([
            await performRequest({
                url: url,
                method: 'POST',
                data: data
            }),
            minDelay
        ]);

        addOrUpdateSaveLabel(parentDivView, editorInfo);
    } catch {
        alert('Failed to save.');
    } finally {
        quickSaveButton.disabled = false;
        quickSaveButton.innerText = "Quick Save";
    }
}

function findSectionContainerDivView(editorInfo: EditorInfo): HTMLDivElement | null {
    if(editorInfo.editorType == EditorType.Roadmap) {
        return document.getElementById(`roadmapStep${editorInfo.numericEditorID}`) as HTMLDivElement;
    } else {
        return document.getElementById(`SectionContainer${editorInfo.numericEditorID}`) as HTMLDivElement;
    }
}

function addOrUpdateSaveLabel(parentDivView: HTMLDivElement, editorInfo: EditorInfo) {
    const lastEdited = new Date();

    editorIDToLastSavedDate.set(editorInfo.fullEditorID, lastEdited);

    const labels = Array.from(parentDivView.getElementsByClassName(customSaveLabelClass));

    let label;
    if(labels.length == 1) {
        label = labels[0] as HTMLSpanElement;
    } else {
        const quickSaveButtons = Array.from(parentDivView.getElementsByClassName(customSaveButtonClass));
        if(quickSaveButtons.length == 0) {
            return;
        }

        const quickSaveButton = quickSaveButtons[0];

        label = document.createElement('span') as HTMLSpanElement;
        label.className = customSaveLabelClass;
        label.style.whiteSpace = "nowrap";
        label.style.marginLeft = "0px";
        label.style.marginTop = "2px";
        label.style.display = "inline";

        quickSaveButton.parentElement?.insertBefore(label, quickSaveButton.parentElement?.firstChild);
    }

    const updateText = () => {
        const lastEdited = editorIDToLastSavedDate.get(editorInfo.fullEditorID);
        if(!lastEdited) {
            return;
        }

        label.innerText = `Saved: ${formattedTimeAgo(lastEdited)}`;
    };

    updateText();

    let timeoutID: number | undefined;

    const setupDynamicUpdate = () => {
        if(timeoutID) {
            clearTimeout(timeoutID);
        }

        const lastEditedSource = editorIDToLastSavedDate.get(editorInfo.fullEditorID);
        if(!lastEditedSource || lastEdited != lastEditedSource) {
            return;
        }

        const secondsSinceSave = (Date.now() - lastEdited.getTime()) / 1000;

        const refreshRate = secondsSinceSave < 60 ? 5000 : 60000;

        timeoutID = window.setTimeout(() => {
            updateText();
            setupDynamicUpdate();
        }, refreshRate);
    };

    setupDynamicUpdate();

    const observer = new MutationObserver(() => {
        // A different observer has been started.
        //
        const lastEditedSource = editorIDToLastSavedDate.get(editorInfo.fullEditorID);
        if(lastEdited != lastEditedSource) {
            observer.disconnect();
            return;
        }
        if(!document.body.contains(label) || (parentDivView.firstElementChild as HTMLDivElement).style.display === "none") {
            if(timeoutID) {
                clearInterval(timeoutID);
            }
            editorIDToLastSavedDate.delete(editorInfo.fullEditorID);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

interface RequestOptions {
    url: string;
    method: 'GET' | 'POST';
    data?: Record<string, any>;
}

async function performRequest(options: RequestOptions): Promise<any> {
    try {
        const response = await fetch(
            (options.url.startsWith('/') ? '' : '/xhr/') + options.url,
            {
                method: options.method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-csrf-token': getCSRFToken()
                },
                body:
                options.method === 'POST' && options.data
                    ? new URLSearchParams(options.data).toString()
                    : undefined,
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false || data.error) {
            throw new Error(data.message || data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (err) {
        console.error('performRequest failed: ', err);
        throw new Error(`${err}`);
    }
}

function getCSRFToken(): string {
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    if(csrfToken) {
        return csrfToken;
    }

    console.error(`Could not retrieve CSRF token`);
    return "";
}

function formattedTimeAgo(fromDate: Date): string {
    const seconds = Math.floor((Date.now() - fromDate.getTime()) / 1000);

    if(seconds < 5) {
        return "Just now";
    }
    if(seconds < 60) {
        return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if(minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if(hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    if(days < 7) {
        return `${days}d ago`;
    }

    const weeks = Math.floor(days / 7);
    if(weeks < 5) {
        return `${weeks}w ago`;
    }

    const months = Math.floor(days / 30);
    if(months < 12) {
        return `${months}m ago`;
    }

    const years = Math.floor(days / 365);
    return `${years}y ago`;
}