import {
  DEFAULT_OPTIONS as IMAGE_DEFAULT_OPTIONS,
  Image as BaseImage,
} from 'reactjs-tiptap-editor/image';
import Link from '@tiptap/extension-link';
import { Paragraph } from '@tiptap/extension-paragraph';
import { mergeAttributes, type CommandProps } from '@tiptap/core';
import { fileToBase64 } from '@/lib/fileUtils';

export type StoryImageAlign = 'left' | 'center' | 'right';
export type StoryImageSize = 'measure' | 'wide' | 'bleed';

export type StoryImageAttrs = {
  src?: string;
  alt?: string;
  title?: string;
  align?: StoryImageAlign;
  size?: StoryImageSize;
  width?: number | string | null;
  height?: number | string | null;
  inline?: boolean;
  flipX?: boolean;
  flipY?: boolean;
};

const toNumber = (value: unknown) => {
  const numeric =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const storyImageFrameAttrs = (attrs: StoryImageAttrs) => {
  const align = attrs.align ?? 'center';
  const size = attrs.size ?? 'measure';
  const width = toNumber(attrs.width);
  const height = toNumber(attrs.height);
  const style = width && height ? `--gb-image-ratio:${width}/${height};` : '';

  return {
    class: `gb-story-image gb-story-image--${align} gb-story-image--${size}`,
    'data-align': align,
    'data-size': size,
    style,
  };
};

export const StoryParagraph = Paragraph.extend({
  addAttributes() {
    return {
      caption: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-caption') === 'true',
        renderHTML: (attributes) =>
          attributes.caption
            ? {
                'data-caption': 'true',
                class: 'gb-story-caption',
              }
            : {},
      },
    };
  },
});

export const StoryLink = Link.configure({
  openOnClick: false,
  HTMLAttributes: {
    class: 'gb-story-link',
  },
});

export const StoryImage = BaseImage.extend({
  addOptions() {
    return {
      ...IMAGE_DEFAULT_OPTIONS,
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
      acceptMimes: ['image/jpeg', 'image/gif', 'image/png', 'image/jpg', 'image/webp'],
      maxSize: 10 * 1024 * 1024,
      multiple: true,
      resourceImage: 'upload',
      defaultInline: false,
      enableAlt: true,
      upload: async (file: File) => fileToBase64(file),
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element) =>
          element.getAttribute('data-align') ||
          element.closest('figure')?.getAttribute('data-align') ||
          'center',
        renderHTML: () => ({}),
      },
      size: {
        default: 'measure',
        parseHTML: (element) =>
          element.getAttribute('data-size') ||
          element.closest('figure')?.getAttribute('data-size') ||
          'measure',
        renderHTML: () => ({}),
      },
      width: {
        default: null,
        parseHTML: (element) =>
          toNumber((element as HTMLElement).style?.width) ??
          toNumber(element.getAttribute('width')) ??
          toNumber(element.getAttribute('data-width')),
        renderHTML: (attributes) => ({
          width: attributes.width ?? undefined,
        }),
      },
      height: {
        default: null,
        parseHTML: (element) =>
          toNumber((element as HTMLElement).style?.height) ??
          toNumber(element.getAttribute('height')) ??
          toNumber(element.getAttribute('data-height')),
        renderHTML: (attributes) => ({
          height: attributes.height ?? undefined,
        }),
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageInline:
        (options: Partial<StoryImageAttrs>) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt,
              title: options.title,
              align: options.align ?? 'center',
              size: options.size ?? 'measure',
              width: options.width,
              height: options.height ?? null,
              inline: options.inline ?? false,
              flipX: options.flipX ?? false,
              flipY: options.flipY ?? false,
            },
          }),
      updateImage:
        (options: Partial<StoryImageAttrs>) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes(this.name, options),
      setAlignImage:
        (align: StoryImageAlign) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes(this.name, { align }),
    };
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as StoryImageAttrs;
    const width = toNumber(attrs.width);
    const height = toNumber(attrs.height);
    const transforms = [
      attrs.flipX ? 'rotateX(180deg)' : '',
      attrs.flipY ? 'rotateY(180deg)' : '',
    ].filter(Boolean);
    const imgAttrs = mergeAttributes(HTMLAttributes, {
      class: 'gb-story-image-photo',
      loading: 'lazy',
      'data-width': width ?? undefined,
      'data-height': height ?? undefined,
      style: [
        width && height ? `aspect-ratio:${width}/${height};` : '',
        transforms.length ? `transform:${transforms.join(' ')};` : '',
      ]
        .filter(Boolean)
        .join('') || undefined,
    });

    delete imgAttrs.align;
    delete imgAttrs.size;
    delete imgAttrs.inline;
    delete imgAttrs.flipX;
    delete imgAttrs.flipY;

    return [
      'figure',
      storyImageFrameAttrs(attrs),
      [
        'div',
        { class: 'gb-story-image-mat' },
        ['img', imgAttrs],
        ['span', { class: 'gb-story-corner gb-story-corner--tl' }],
        ['span', { class: 'gb-story-corner gb-story-corner--tr' }],
        ['span', { class: 'gb-story-corner gb-story-corner--bl' }],
        ['span', { class: 'gb-story-corner gb-story-corner--br' }],
      ],
    ];
  },
});

export async function readImageDimensions(src: string) {
  return await new Promise<{ width: number | null; height: number | null }>(
    (resolve) => {
      const image = new window.Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth || null,
          height: image.naturalHeight || null,
        });
      };
      image.onerror = () => resolve({ width: null, height: null });
      image.src = src;
    }
  );
}

export function hasStoryProse(nodes: unknown): boolean {
  const root = Array.isArray(nodes) ? nodes : [];
  let hasText = false;

  const walk = (node: unknown) => {
    if (hasText || !node || typeof node !== 'object') return;
    const current = node as { type?: string; text?: string; content?: unknown[] };
    if (current.type !== 'image' && current.text?.trim()) {
      hasText = true;
      return;
    }
    if (Array.isArray(current.content)) current.content.forEach(walk);
  };

  root.forEach(walk);
  return hasText;
}
