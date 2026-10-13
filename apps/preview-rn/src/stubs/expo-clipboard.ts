/** The browser's clipboard standing in for expo-clipboard. */
export async function setStringAsync(text: string): Promise<boolean> {
  await navigator.clipboard?.writeText(text);
  return true;
}
