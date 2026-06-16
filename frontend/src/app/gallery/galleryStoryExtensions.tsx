import * as React from 'react';
import BaseImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Paragraph } from '@tiptap/extension-paragraph';
import { mergeAttributes, type CommandProps } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Image as ImageIcon,
  Maximize2,
  MessageSquareText,
  Trash2,
} from 'lucide-react';
import { fileToBase64 } from '@/lib/fileUtils';
import { cn } from '@/lib/utils';

export type StoryImageAlign = 'left' | 'center' | 'right';
export type StoryImageSize = 'measure' | 'wide' | 'bleed';

export type StoryImageAttrs = {
  src?: string;
  alt?: string;
  title?: string;
  align?: StoryImageAlign;
  size?: StoryImageSize;
  width?: number | null;
  height?: number | null;
};

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const aspectRatioStyle = (
  width?: number | null,
  height?: number | null
): React.CSSProperties | undefined => {
  if (!width || !height) return undefined;
  return { aspectRatio: `${width} / ${height}` };
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
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
      resize: false,
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
          toNumber(element.getAttribute('width')) ??
          toNumber(element.getAttribute('data-width')),
        renderHTML: () => ({}),
      },
      height: {
        default: null,
        parseHTML: (element) =>
          toNumber(element.getAttribute('height')) ??
          toNumber(element.getAttribute('data-height')),
        renderHTML: () => ({}),
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageInline:
        (options: StoryImageAttrs & { inline?: boolean }) =>
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
              height: options.height,
            },
          }),
    };
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as StoryImageAttrs;
    const width = toNumber(attrs.width);
    const height = toNumber(attrs.height);
    const imgAttrs = mergeAttributes(HTMLAttributes, {
      class: 'gb-story-image-photo',
      loading: 'lazy',
      'data-width': width ?? undefined,
      'data-height': height ?? undefined,
      style: width && height ? `aspect-ratio:${width}/${height};` : undefined,
    });

    delete imgAttrs.align;
    delete imgAttrs.size;

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

  addNodeView() {
    return ReactNodeViewRenderer(StoryImageNodeView);
  },
});

function StoryImageNodeView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs as StoryImageAttrs;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const align = attrs.align ?? 'center';
  const size = attrs.size ?? 'measure';

  const replaceImage = async (file?: File) => {
    if (!file) return;
    const src = await fileToBase64(file);
    const dimensions = await readImageDimensions(src);
    updateAttributes({
      src,
      alt: attrs.alt || file.name,
      title: attrs.title || file.name,
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  const toggleCaption = () => {
    if (typeof getPos !== 'function') return;
    const pos = getPos();
    if (typeof pos !== 'number') return;
    const nextPos = pos + node.nodeSize;
    const nextNode = editor.state.doc.nodeAt(nextPos);

    if (nextNode?.type.name === 'paragraph' && nextNode.attrs.caption) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: nextPos, to: nextPos + nextNode.nodeSize })
        .run();
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt(nextPos, {
        type: 'paragraph',
        attrs: { caption: true },
        content: [{ type: 'text', text: 'Add a caption...' }],
      })
      .run();
  };

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        'gb-story-image gb-story-image-editor',
        `gb-story-image--${align}`,
        `gb-story-image--${size}`,
        selected && 'is-selected'
      )}
      data-align={align}
      data-size={size}
      style={aspectRatioStyle(toNumber(attrs.width), toNumber(attrs.height))}
    >
      <div className="gb-story-image-mat">
        <img
          src={attrs.src}
          alt={attrs.alt ?? attrs.title ?? ''}
          className="gb-story-image-photo"
          draggable={false}
        />
        <span className="gb-story-corner gb-story-corner--tl" />
        <span className="gb-story-corner gb-story-corner--tr" />
        <span className="gb-story-corner gb-story-corner--bl" />
        <span className="gb-story-corner gb-story-corner--br" />
      </div>

      {selected && (
        <div className="gb-image-node-toolbar" contentEditable={false}>
          <ImageNodeButton
            label="Align left"
            active={align === 'left'}
            onClick={() => updateAttributes({ align: 'left', size: 'measure' })}
          >
            <AlignLeft className="h-4 w-4" />
          </ImageNodeButton>
          <ImageNodeButton
            label="Align center"
            active={align === 'center' && size === 'measure'}
            onClick={() => updateAttributes({ align: 'center', size: 'measure' })}
          >
            <AlignCenter className="h-4 w-4" />
          </ImageNodeButton>
          <ImageNodeButton
            label="Align right"
            active={align === 'right'}
            onClick={() => updateAttributes({ align: 'right', size: 'measure' })}
          >
            <AlignRight className="h-4 w-4" />
          </ImageNodeButton>
          <ImageNodeButton
            label="Wide image"
            active={size === 'wide'}
            onClick={() => updateAttributes({ align: 'center', size: 'wide' })}
          >
            <Maximize2 className="h-4 w-4" />
          </ImageNodeButton>
          <ImageNodeButton
            label="Replace image"
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </ImageNodeButton>
          <ImageNodeButton label="Toggle caption" onClick={toggleCaption}>
            <MessageSquareText className="h-4 w-4" />
          </ImageNodeButton>
          <ImageNodeButton label="Delete image" danger onClick={deleteNode}>
            <Trash2 className="h-4 w-4" />
          </ImageNodeButton>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void replaceImage(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}

function ImageNodeButton({
  label,
  active,
  danger,
  children,
  onClick,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={cn(active && 'is-active', danger && 'is-danger')}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

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
