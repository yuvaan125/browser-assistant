const BUTTON_ID = "orbit-selection-button";

let button: HTMLButtonElement | null = null;

export function showFloatingButton(x: number, y: number) {
  if (!button) {
    button = document.createElement("button");
    button.id = BUTTON_ID;
    button.textContent = "✨";

    button.addEventListener("click", () => {
      console.log("Orbit AI clicked");
    });

    document.body.appendChild(button);
  }

  button.style.left = `${x}px`;
  button.style.top = `${y}px`;

  button.style.display = "flex";
}

export function hideFloatingButton() {
  if (button) {
    button.style.display = "none";
  }
}