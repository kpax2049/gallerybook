export type GalleryContentMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type GalleryContentNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: GalleryContentNode[];
  marks?: GalleryContentMark[];
  text?: string;
};

export type GalleryDocument = {
  type: 'doc';
  content: GalleryContentNode[];
};

export function createEmptyGalleryDocument(): GalleryDocument {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function normalizeGalleryDocument(value: unknown): GalleryDocument {
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return createEmptyGalleryDocument();
    }
  }

  if (isGalleryDocument(parsed)) return parsed;
  if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isNode)) {
    return { type: 'doc', content: parsed };
  }
  return createEmptyGalleryDocument();
}

function isGalleryDocument(value: unknown): value is GalleryDocument {
  if (!isRecord(value) || value.type !== 'doc') return false;
  return (
    Array.isArray(value.content) &&
    value.content.length > 0 &&
    value.content.every(isNode)
  );
}

function isNode(value: unknown): value is GalleryContentNode {
  if (!isRecord(value) || typeof value.type !== 'string' || !value.type) {
    return false;
  }
  if (value.type === 'text' && typeof value.text !== 'string') return false;
  if (value.type !== 'text' && value.text !== undefined) return false;
  if (value.content !== undefined) {
    if (!Array.isArray(value.content) || !value.content.every(isNode)) {
      return false;
    }
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
