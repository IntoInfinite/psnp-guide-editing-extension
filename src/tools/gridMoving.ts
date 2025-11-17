import {
    saveStateToUndoStack,
    triggerContentChangedEvent
} from "../froalaEditor/froalaHelpers";

export function addGridToolbarButtonsIfNeeded() {
    const toolbars = Array.from(document.getElementsByClassName('fr-buttons')) as HTMLDivElement[];

    toolbars.forEach(toolbar => {
        const firstButton = toolbar.firstChild as HTMLButtonElement;
        if(!firstButton?.id.startsWith("tableHeader-")) {
            return;
        }

        const dropDownMenus = Array.from(toolbar.getElementsByClassName('fr-dropdown-menu')) as HTMLDivElement[];
        dropDownMenus.forEach(menu => processGridDropdownMenu(menu));
    });
}

function processGridDropdownMenu(menu: HTMLDivElement) {
    const ariaLabel = menu.getAttribute("aria-labelledby");
    if(!ariaLabel) {
        return;
    }

    const listElement = getDropdownList(menu);
    if(!listElement) {
        return;
    }

    // Already added the new buttons in.
    //
    if(listElement.childNodes.length > 3) {
        return;
    }

    if(ariaLabel.startsWith("tableRows-")) {
        appendRowButtons(listElement);
    } else if(ariaLabel.startsWith("tableColumns-")) {
        appendColumnButtons(listElement);
    }
}

function getDropdownList(menu: HTMLDivElement): HTMLUListElement | null {
    const ul = menu.querySelector('ul');
    if(!ul) {
        return null;
    }
    return ul as HTMLUListElement;
}

function appendRowButtons(list: HTMLUListElement) {
    const moveUpNode = cloneButton(list.children[0] as HTMLElement, "Move row up", () => moveSelectedRow(true));
    const moveDownNode = cloneButton(list.children[0] as HTMLElement, "Move row down", () => moveSelectedRow(false));
    list.append(moveUpNode, moveDownNode);
}

function appendColumnButtons(list: HTMLUListElement) {
    const moveLeftNode = cloneButton(list.children[0] as HTMLElement, "Move column left", () => moveSelectedColumn(true));
    const moveRightNode = cloneButton(list.children[0] as HTMLElement, "Move column right", () => moveSelectedColumn(false));
    list.append(moveLeftNode, moveRightNode);
}

function cloneButton(node: HTMLElement, title: string, onClick: () => void): HTMLElement {
    const clone = node.cloneNode(true) as HTMLElement;
    const inner = clone.firstElementChild as HTMLElement;
    if(inner) {
        inner.title = title;
        inner.innerText = title;
        inner.setAttribute("data-cmd", "");
    }
    clone.addEventListener('click', onClick);
    return clone;
}

function moveSelectedRow(up: boolean) {
    const selectedCell = getSelectedCell();
    if(!selectedCell) {
        return;
    }

    // Ignore when the user asks to move a header row.
    //
    if(selectedCell.tagName === "TH") {
        return;
    }

    const row = selectedCell.parentElement as HTMLTableRowElement;
    const tbody = row.parentElement;

    if(up && tbody?.firstChild === row) {
        return;
    }

    if(!up && tbody?.lastChild === row) {
        return;
    }

    saveStateToUndoStack(selectedCell, true);

    if(up) {
        const prev = row.previousElementSibling;
        if(prev) {
            tbody?.insertBefore(row, prev);
        }
    } else {
        const next = row.nextElementSibling;
        if(next) {
            tbody?.insertBefore(next, row);
        }
    }

    saveStateToUndoStack(selectedCell, false);
    triggerContentChangedEvent(selectedCell);
}

function moveSelectedColumn(left: boolean) {
    const selectedCell = getSelectedCell();
    if(!selectedCell) {
        return;
    }

    const row = selectedCell.parentElement;
    const tbody = row?.parentElement;
    const table = tbody?.parentElement as HTMLTableElement;

    if(!tbody) {
        return;
    }

    if(!table) {
        return;
    }

    const columnIndex = selectedCell.cellIndex;
    const targetIndex = columnIndex + (left ? -1 : 1);

    if(targetIndex < 0 || targetIndex >= row.childNodes.length) {
        return;
    }

    moveTableCell(table, tbody, columnIndex, targetIndex);
}

function moveTableCell(table: HTMLTableElement, tbody: HTMLElement, from: number, to: number) {
    saveStateToUndoStack(table, true);

    const headerRow = table.tHead?.rows[0];
    if(headerRow) {
        headerRow.insertBefore(
            headerRow.cells[from],
            to < from ? headerRow.cells[to] : headerRow.cells[to].nextSibling
        );
    }

    Array.from(tbody.children).forEach(r => {
        const row = r as HTMLTableRowElement;
        row.insertBefore(
            row.cells[from],
            to < from ? row.cells[to] : row.cells[to].nextSibling
        );
    });

    saveStateToUndoStack(table, false);
    triggerContentChangedEvent(table);
}

function getSelectedCell(): HTMLTableCellElement | null {
    const selectedCells = document.getElementsByClassName("fr-selected-cell");
    if(selectedCells.length !== 1) {
        return null;
    }

    return selectedCells.item(0) as HTMLTableCellElement;
}