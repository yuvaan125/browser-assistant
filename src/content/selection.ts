import {
  showFloatingButton,
  hideFloatingButton,
} from "./floatingButton";

export function initializeSelectionListener() {
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();

    if (!selection || selection.toString().trim() === "") {
      hideFloatingButton();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    showFloatingButton(
      rect.right + window.scrollX + 8,
      rect.top + window.scrollY - 8
    );
  });
}