import { FroalaEditor } from "./froalaEditor";

export enum EditorType {
    Roadmap = "roadmap",
    Section = "section"
}

export interface EditorInfo {
    editorType: EditorType;
    fullEditorID: string;
    numericEditorID: number;
}

// Triggers the content changed event in jQuery so the save buttons come in.
// Finds the editor that the view passed in belongs to.
// Note: This should be called when inserting a trophy link, too.
//
export function triggerContentChangedEvent(view: HTMLElement) {
    const editorInfo = findEditorInfo(view);
    if(!editorInfo) {
        return;
    }

    const $editor = $(`#${editorInfo.fullEditorID}`);
    $editor.trigger('froalaEditor.contentChanged', [{}]);
}

// Saves the current state of the HTML to the editor's undo stack.
//
// view - Finds the editor that the view passed in belongs to.
//
// onlyIfUndoStackEmpty - Indicates if the state should be saved only
// to act as the initial HTML state. The editor does not start with a beginning state
// when editing begins. If the undo stack is empty, we will create the initial state before making changes.
//
export function saveStateToUndoStack(view: HTMLElement, onlyIfUndoStackEmpty: Boolean) {
    const froalaEditor = getFroalaEditor(view);
    if(!froalaEditor) {
        return;
    }

    if(onlyIfUndoStackEmpty && froalaEditor.undoIndex > 0) {
        return;
    }

    froalaEditor.undo.saveStep();
}

export function getFroalaEditor(view: HTMLElement): FroalaEditor | null {
    const editorInfo = findEditorInfo(view);
    if(!editorInfo) {
        return null;
    }

    const $editor = $(`#${editorInfo.fullEditorID}`);
    return $editor.data("froala.editor") as FroalaEditor;
}

// PSNP has two types of editors. The roadmap and the section editors.
// In a gameplay guide (non-trophy guide), all of the editors are section
// editors.
//
export function findEditorInfo(startElement: HTMLElement): EditorInfo | null {
    var currentElement: HTMLElement | null = startElement;

    while(currentElement) {
        if(currentElement.tagName === 'TEXTAREA') {
            if(/^(SectionTextarea)/.test(currentElement.id)) {
                return {
                    editorType: EditorType.Section,
                    fullEditorID: currentElement.id,
                    numericEditorID: getNumericSectionID(currentElement.id)!
                };
            } else if(/^(editRoadmapTextarea)/.test(currentElement.id)) {
                return {
                    editorType: EditorType.Roadmap,
                    fullEditorID: currentElement.id,
                    numericEditorID: getNumericSectionID(currentElement.id)!
                };
            }
        }

        const siblings = currentElement.parentElement ? Array.from(currentElement.parentElement.children) : [];
        for(const sibling of siblings) {
            if(sibling.tagName === 'TEXTAREA') {
                if(/^(SectionTextarea)/.test(sibling.id)) {
                    return {
                        editorType: EditorType.Section,
                        fullEditorID: sibling.id,
                        numericEditorID: getNumericSectionID(sibling.id)!
                    };
                } else if(/^(editRoadmapTextarea)/.test(sibling.id)) {
                    return {
                        editorType: EditorType.Roadmap,
                        fullEditorID: sibling.id,
                        numericEditorID: getNumericSectionID(sibling.id)!
                    };
                }
            }
        }

        currentElement = currentElement.parentElement;
    }

    return null;
}

function getNumericSectionID(fullEditorID: string): number | null {
    const match = fullEditorID.match(/(\d+)$/);
    if (!match) {
        console.error(`Could not parse numeric ID`);
        return null;
    }

    return Number(match[1]);
}
