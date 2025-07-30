export function extractS3KeysFromContent(content: any): string[] {
  const keys: Set<string> = new Set();

  function walk(node: any) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'image' && typeof node.attrs?.src === 'string') {
      const src = node.attrs.src;
      if (src.startsWith('uploads/')) {
        keys.add(decodeURIComponent(src));
      }
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    } else if (typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  }

  walk(content);
  return Array.from(keys);
}
