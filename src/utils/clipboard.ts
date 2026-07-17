export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (text === '') return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to the local fallback.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.append(textarea);
  textarea.select();

  try {
    const legacyCopy = Reflect.get(document, 'execCommand') as
      ((commandId: string) => boolean) | undefined;
    return legacyCopy?.call(document, 'copy') ?? false;
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};
