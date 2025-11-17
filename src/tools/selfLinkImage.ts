import {
    saveStateToUndoStack,
    triggerContentChangedEvent
} from "../froalaEditor/froalaHelpers";
import { psnpGeeCustomClassName } from "../index"

const selfLinkImageTitle = "Self Link Image";

var selectedImage: HTMLImageElement | null;

// Unfortunately, the DOM does not change to indicate when an image is selected.
// We need to listen for the selected image ourselves.
// Users can edit multiple sections at a time, so we need to hook up events to every editor.
// Only one image can be selected at a time.
//
export function onEditorInitializationForImage(editor: HTMLDivElement) {
    editor.addEventListener('click', e => {
        if (!(e.target instanceof Element)) {
            return;
        }

        const closestImage = e.target.closest('img');
        if(closestImage) {
            selectedImage = closestImage;
        }
    });
}

export function addImageButtonsIfNeeded() {
    const popupContainers = Array.from(document.getElementsByClassName("fr-popup fr-desktop fr-active"));
    if(popupContainers.length == 0) {
        return;
    }
    if(popupContainers.length > 1) {
        console.log("Found more than one popup container");
        return;
    }
    const popupContainer = popupContainers[0] as HTMLDivElement;
    if(popupContainer.childElementCount != 2) {
        return;
    }
    const buttonContainer = popupContainer.lastElementChild as HTMLDivElement;

    // Already have inserted our button
    //
    if(Array.from(buttonContainer.childNodes).some(x => (x as HTMLHtmlElement).classList.contains(psnpGeeCustomClassName))) {
        return;
    }

    const separatorNode = Array
        .from(buttonContainer.childNodes)
        .map(x => x as HTMLDivElement)
        .find(x => x.classList.contains("fr-separator"));

    if(!separatorNode) {
        console.log(`Unable to find separator`);
        return;
    }

    const imageRemoveNode = Array
        .from(buttonContainer.childNodes)
        .map(x => x as HTMLButtonElement)
        .find(x => x.id.startsWith("imageRemove-"));

    if(!imageRemoveNode) {
        return;
    }

    // Append separator and self link button
    //
    const selfLinkButton = imageRemoveNode.cloneNode(true) as HTMLButtonElement;
    selfLinkButton.className = `${selfLinkButton.className} ${psnpGeeCustomClassName}`;
    selfLinkButton.setAttribute("data-cmd", "");
    selfLinkButton.id = selfLinkButton.id.replace("imageRemove-", "selfLink-");
    selfLinkButton.title = selfLinkImageTitle;
    selfLinkButton.addEventListener('click', _ => {
        if(selfLinkButton.classList.contains("fr-selected")) {
            selfLinkButton.className = selfLinkButton.className.replace(" fr-selected", "");
        }
        selfLinkSelectedImage();
    });

    const innerI = selfLinkButton.childNodes[0] as HTMLHtmlElement;
    innerI.className = "fa fa-arrows-alt";

    const innerSpan = selfLinkButton.childNodes[1] as HTMLSpanElement;
    innerSpan.innerText = selfLinkImageTitle;

    buttonContainer.appendChild(separatorNode.cloneNode(true));
    buttonContainer.appendChild(selfLinkButton);
}

function selfLinkSelectedImage() {
    if(!selectedImage) {
        console.error(`No Image Selected!`);
        return;
    }

    const imageURL = selectedImage.getAttribute('src');

    if (!imageURL) {
        console.error('Selected image has no src attribute');
        return;
    }

    // The Friola editor links images by wrapping them in an anchor element.
    // We need to check if the anchor element exists, change it, or create it if needed.
    //
    const parent = selectedImage.parentElement;
    if(!parent) {
        console.error('Image has no parent');
        return;
    }

    saveStateToUndoStack(selectedImage, true);

    if (parent && parent.tagName === 'A') {
        if((parent as HTMLAnchorElement).href === imageURL) {
            parent.parentElement?.replaceChild(selectedImage, parent);
        } else {
            parent.setAttribute('href', imageURL);
        }
    } else {
        // Case 2: not wrapped in a link, so wrap it
        const anchor = document.createElement('a');
        anchor.setAttribute('href', imageURL);
        anchor.setAttribute('target', '_blank');

        parent?.replaceChild(anchor, selectedImage);
        anchor.appendChild(selectedImage);
    }

    saveStateToUndoStack(selectedImage, false);
    triggerContentChangedEvent(selectedImage);

    selectedImage?.click();
}
