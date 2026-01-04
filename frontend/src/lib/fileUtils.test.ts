import { webcrypto } from 'node:crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';

function ensureGlobals() {
  if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (data: string) =>
      Buffer.from(data, 'base64').toString('binary');
  }
  if (typeof globalThis.btoa !== 'function') {
    globalThis.btoa = (data: string) =>
      Buffer.from(data, 'binary').toString('base64');
  }
  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as unknown as Crypto;
  }
  if (typeof File === 'undefined') {
    class PolyfillFile extends Blob {
      name: string;
      lastModified: number;
      constructor(
        bits: BlobPart[],
        name: string,
        options?: FilePropertyBag | undefined
      ) {
        super(bits, options);
        this.name = name;
        this.lastModified = options?.lastModified ?? Date.now();
      }
    }
    Object.assign(globalThis as Record<string, unknown>, {
      File: PolyfillFile,
    });
  }
}

const makeFile = (data: BlobPart, type: string, name = 'file.bin') =>
  new File([data], name, { type });

const base64Png = 'data:image/png;base64,YWJj'; // "abc"

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  delete (globalThis as Record<string, unknown>).window;
  ensureGlobals();
});

describe('shortcut key helpers', () => {
  it('uses mac symbols when navigator reports Mac', async () => {
    vi.stubGlobal('window', { navigator: { platform: 'MacIntel' } } as any);
    const { getShortcutKey } = await import('./fileUtils');

    expect(getShortcutKey('mod')).toEqual({
      symbol: '⌘',
      readable: 'Command',
    });
    expect(getShortcutKey('alt').symbol).toBe('⌥');
  });

  it('falls back to ctrl/alt on non-mac platforms', async () => {
    vi.stubGlobal('window', { navigator: { platform: 'Win32' } } as any);
    const { getShortcutKey } = await import('./fileUtils');

    expect(getShortcutKey('mod')).toEqual({
      symbol: 'Ctrl',
      readable: 'Control',
    });
    expect(getShortcutKey('alt')).toEqual({
      symbol: 'Alt',
      readable: 'Alt',
    });
  });
});

describe('URL helpers', () => {
  it('detects allowed vs blocked URLs', async () => {
    const { isUrl } = await import('./fileUtils');

    expect(isUrl('http://example.com', { requireHostname: true })).toBe(true);
    expect(
      isUrl('data:image/png;base64,YWJj', {
        requireHostname: false,
        allowBase64: true,
      })
    ).toBe(true);
    expect(isUrl('data:image/png;base64,YWJj')).toBe(false);
    expect(isUrl('javascript:alert(1)')).toBe(false);
    expect(isUrl('http://example.com\nalert')).toBe(false);
  });

  it('sanitizes unsafe/partial URLs', async () => {
    const { sanitizeUrl } = await import('./fileUtils');

    expect(sanitizeUrl('example.com')).toBe('https://example.com');
    expect(sanitizeUrl('/safe/path')).toBe('/safe/path');
    expect(
      sanitizeUrl(base64Png, { allowBase64: true })
    ).toBe(base64Png);
  });
});

describe('getOutput', () => {
  it('returns correct shape for each format', async () => {
    const { getOutput } = await import('./fileUtils');
    const editor = {
      isEmpty: false,
      getJSON: () => ({ ok: true }),
      getHTML: () => '<p>hi</p>',
      getText: () => 'plain',
    } as any;

    expect(getOutput(editor, 'json')).toEqual({ ok: true });
    expect(getOutput(editor, 'html')).toBe('<p>hi</p>');
    expect(getOutput(editor, undefined)).toBe('plain');

    const emptyEditor = { ...editor, isEmpty: true };
    expect(getOutput(emptyEditor, 'html')).toBe('');
  });
});

describe('filterFiles', () => {
  it('accepts valid files and base64 strings when allowed', async () => {
    const { filterFiles } = await import('./fileUtils');
    const opts = {
      allowedMimeTypes: ['image/png'],
      maxFileSize: 10,
      allowBase64: true,
    };
    const file = makeFile(new Uint8Array([1, 2, 3]), 'image/png', 'a.png');

    const [valid, errors] = filterFiles([file], opts);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);

    const [validBase64, base64Errors] = filterFiles([{ src: base64Png }], opts);
    expect(validBase64).toHaveLength(1);
    expect(base64Errors).toHaveLength(0);
  });

  it('rejects base64 strings when disallowed', async () => {
    const { filterFiles } = await import('./fileUtils');
    const opts = {
      allowedMimeTypes: ['image/png'],
      allowBase64: false,
    };

    const [valid, errors] = filterFiles([{ src: base64Png }], opts);
    expect(valid).toHaveLength(0);
    expect(errors).toEqual([{ file: base64Png, reason: 'base64NotAllowed' }]);
  });

  it('flags invalid types and oversized files', async () => {
    const { filterFiles } = await import('./fileUtils');
    const wrongType = makeFile('test', 'text/plain', 'note.txt');
    const tooLarge = makeFile(new Uint8Array(12), 'image/png', 'big.png');

    const [, typeErrors] = filterFiles(
      [wrongType],
      { allowedMimeTypes: ['image/png'], allowBase64: true }
    );
    expect(typeErrors).toEqual([{ file: wrongType, reason: 'type' }]);

    const [, sizeErrors] = filterFiles(
      [tooLarge],
      { allowedMimeTypes: ['image/png'], allowBase64: true, maxFileSize: 5 }
    );
    expect(sizeErrors).toEqual([{ file: tooLarge, reason: 'size' }]);
  });
});
