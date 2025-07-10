import { z } from 'zod';

// Only allow known node types
const ImageNode = z.object({
  type: z.literal('image'),
  attrs: z.object({
    src: z.string().url(), // Only allow URLs now
    alt: z.string().optional(),
    title: z.string().optional(),
  }),
});

const TextNode = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(z.any()).optional(),
});

const ParagraphNode = z.object({
  type: z.literal('paragraph'),
  content: z.array(z.union([TextNode])).optional(),
});

const Node = z.union([ImageNode, ParagraphNode, TextNode]);

export const ProseMirrorDocSchema = z.object({
  type: z.literal('content'),
  content: z.array(Node),
});
