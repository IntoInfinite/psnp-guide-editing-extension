import Swal from "sweetalert2";
import { guideID } from "../index";
import { getFroalaEditor } from "../froalaEditor/froalaHelpers";
import {
    getCustomColors,
    setCustomColors
} from "../storage/customColors";

// The default colors for PSNP. These aren't changing anytime soon, so it's simplest to just
// hardcode them here. These are in the correct order.
//
const defaultColors = [
    "#41A85F",
    "#2C82C9",
    "#9365B8",
    "#F37934",
    "#D14841",
    "#667FB2",
    "#C2903E",
    "#777777",
    "#C46438"
]
const editColorsTitle = "Edit Colors";
const colorPanelColumns = 5;

export function addColorButtonsIfNeeded() {
    const textColorDiv = getTextColorDiv();
    if(!textColorDiv) {
        return;
    }

    const editColorsButton = getEditColorsButton(textColorDiv);

    if(!editColorsButton) {
        rebuildColorPanel(createEditColorsButton(textColorDiv));
    }
}

// Rebuilds the color panel to incorporate custom colors and the edit button.
//
function rebuildColorPanel(createdEditColorsButton: HTMLSpanElement | null = null) {
    const textColorDiv = getTextColorDiv();
    const clearFormattingButton = getClearFormattingButton(textColorDiv);
    const colorButtonTemplate = getColorButton(textColorDiv);
    const editColorsButton = createdEditColorsButton ?? getEditColorsButton(textColorDiv);
    if(!textColorDiv || !editColorsButton || !clearFormattingButton || !colorButtonTemplate || !guideID) {
        return;
    }

    // Remove all buttons to start fresh.
    //
    Array.from(textColorDiv.childNodes).forEach(childNode => childNode.remove());

    const fullColorList = defaultColors.concat(getCustomColors(guideID));

    var currentButtonIndex = 0;
    for(var i = 0; i < fullColorList.length; i++) {
        const newColorButton = createColorButtonForColor(fullColorList[i], colorButtonTemplate);
        textColorDiv.appendChild(newColorButton)

        currentButtonIndex++;

        // The end of the first row should be the edit button
        // The end of the second row should be the clear formatting button
        //
        if(currentButtonIndex == colorPanelColumns - 1) {
            textColorDiv.appendChild(editColorsButton);
            currentButtonIndex++;
        } else if(currentButtonIndex == (colorPanelColumns * 2) - 1) {
            textColorDiv.appendChild(clearFormattingButton);
            currentButtonIndex++;
        }

        if(currentButtonIndex % colorPanelColumns == 0) {
            textColorDiv.appendChild(document.createElement("br"))
        }
    }
}

function openColorPanel(view: HTMLElement) {
    const froalaEditor = getFroalaEditor(view);
    if(!froalaEditor) {
        return;
    }

    froalaEditor.colors.showColorsPopup();
}

function createEditColorsButton(textColorDiv: HTMLDivElement): HTMLSpanElement | null  {
    const clearFormattingButton = getClearFormattingButton(textColorDiv);

    if(!clearFormattingButton) {
        console.log("Could not find Clear Formatting button");
        return null;
    }

    const editColorsButton = clearFormattingButton.cloneNode(true) as HTMLSpanElement;
    editColorsButton.setAttribute("data-cmd", "");
    editColorsButton.title = editColorsTitle;
    editColorsButton.addEventListener('click', _ => {
        showEditColorsPopup(editColorsButton);
    });

    if(editColorsButton.childNodes.length != 2) {
        console.log("Clear Formatting button had unexpected number of child nodes.");
        return null;
    }

    const innerIcon = editColorsButton.childNodes[0] as HTMLHtmlElement;
    innerIcon.className = "fa fa-pencil";

    const innerSpan = editColorsButton.childNodes[1] as HTMLSpanElement;
    innerSpan.innerText = editColorsTitle;

    return editColorsButton;
}

function createColorButtonForColor(color: string, colorButtonTemplate: HTMLSpanElement): HTMLSpanElement {
    const colorButton = colorButtonTemplate.cloneNode(true) as HTMLSpanElement;
    colorButton.style.backgroundColor = color;
    colorButton.setAttribute("data-param1", color.toUpperCase());

    // May be unnecessary, but this follows the pattern for how the other color buttons are laid out.
    //
    const innerSpan = colorButton.childNodes[0] as HTMLSpanElement;
    innerSpan.innerText = `Color ${color.toUpperCase()}   `;

    return colorButton
}

function getTextColorDiv(): HTMLDivElement | null {
    const textColorDivs = Array.from(document.getElementsByClassName('fr-text-color')) as HTMLDivElement[];
    if(textColorDivs.length == 0) {
        return null;
    }

    return textColorDivs[0];
}

function getColorButton(textColorDiv: HTMLDivElement | null): HTMLSpanElement | null {
    return Array.from(textColorDiv?.childNodes ?? [])
        .find(x => !(x as HTMLElement).classList.contains("fr-active-item")) as HTMLSpanElement;
}

function getClearFormattingButton(textColorDiv: HTMLDivElement | null): HTMLSpanElement | null {
    return Array.from(textColorDiv?.childNodes ?? [])
        .map(x => x as HTMLSpanElement)
        .find(x => x.getAttribute("data-param1") === "REMOVE") ?? null;
}

function getEditColorsButton(textColorDiv: HTMLDivElement | null): HTMLSpanElement | null {
    return Array.from(textColorDiv?.childNodes ?? [])
        .map(x => x as HTMLSpanElement)
        .find(x => x.title === editColorsTitle) ?? null;
}

async function showEditColorsPopup(view: HTMLElement) {
    if(!guideID) {
        return;
    }

    const colors = getCustomColors(guideID);

    const { value: updatedColors } = await Swal.fire({
        title: 'Edit Custom Colors',
        html: `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <input type="color" id="colorPicker" value="#ff0000"
                       style="width:100%; height:3rem; border:none; background:none;">
                <button id="addColorBtn" class="swal2-confirm swal2-styled"
                        style="background:#3085d6;">Add Color</button>
                <div id="colorList" style="display:flex; flex-wrap:wrap; gap:0.5rem;"></div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save',
        didOpen: () => {
            const listElement = document.getElementById('colorList')!;
            const picker = document.getElementById('colorPicker') as HTMLInputElement;
            const addColorButton = document.getElementById('addColorBtn')!;

            // Helper to render colors
            const renderColors = () => {
                listElement.innerHTML = colors.map((color, index) => `
                    <div style="
                        display:flex;
                        align-items:center;
                        gap:0.25rem;
                        border:1px solid #ccc;
                        padding:0.25rem 0.5rem;
                        border-radius:4px;
                    ">
                        <div style="width:1.5rem;height:1.5rem;background:${color};border:1px solid #999;"></div>
                        <span>${color}</span>
                        <button data-index="${index}" class="removeColorBtn"
                            style="background:#e74c3c;color:white;border:none;border-radius:3px;padding:0 0.4rem;cursor:pointer;">×</button>
                    </div>
                `).join('');
            };

            renderColors();

            addColorButton.addEventListener('click', () => {
                const newColor = picker.value;
                if (newColor && !colors.includes(newColor)) {
                    colors.push(newColor);
                    renderColors();
                }
            });

            listElement.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('removeColorBtn')) {
                    const index = Number(target.dataset.index);
                    colors.splice(index, 1);
                    renderColors();
                }
            });
        },
        preConfirm: () => {
            return colors;
        }
    });

    if(updatedColors) {
        setCustomColors(guideID, updatedColors);
        rebuildColorPanel();
        openColorPanel(view);
    }
}