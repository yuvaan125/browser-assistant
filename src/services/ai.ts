export async function explainText(text: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `This is a simulated AI explanation.

Selected text:

"${text}"

Later, this function will call the OpenAI API instead of returning this fake response.`
      );
    }, 1000);
  });
}

export async function summarizeText(text: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `Summary:

${text.slice(0, 120)}...`
      );
    }, 1000);
  });
}