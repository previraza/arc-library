/** A file input standing in for expo-document-picker. */
export interface DocumentPickerAsset {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
}

export type DocumentPickerResult = { canceled: true; assets: null } | { canceled: false; assets: DocumentPickerAsset[] };

export function getDocumentAsync(options: { type?: string | string[]; multiple?: boolean } = {}): Promise<DocumentPickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options.multiple ?? false;
    if (options.type) input.accept = [options.type].flat().join(",");
    input.onchange = () => {
      const files = [...(input.files ?? [])];
      resolve(files.length ? { canceled: false, assets: files.map((file) => ({ name: file.name, size: file.size, mimeType: file.type, uri: URL.createObjectURL(file) })) } : { canceled: true, assets: null });
    };
    input.oncancel = () => resolve({ canceled: true, assets: null });
    input.click();
  });
}
