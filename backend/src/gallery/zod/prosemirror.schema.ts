import { z } from 'zod';

const JsonValueSchema = z.json();
type JsonValue = z.infer<typeof JsonValueSchema>;
const NodeTypeSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim() === value, {
    message: 'Node types cannot contain surrounding whitespace',
  });

export interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, JsonValue>;
}

export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, JsonValue>;
  content?: ProseMirrorNode[];
  marks?: ProseMirrorMark[];
  text?: string;
}

export interface ProseMirrorDocument {
  type: 'doc';
  content: ProseMirrorNode[];
}

const ProseMirrorMarkSchema: z.ZodType<ProseMirrorMark> = z
  .object({
    type: NodeTypeSchema,
    attrs: z.record(z.string(), JsonValueSchema).optional(),
  })
  .strict();

export const ProseMirrorNodeSchema: z.ZodType<ProseMirrorNode> = z.lazy(() =>
  z
    .object({
      type: NodeTypeSchema,
      attrs: z.record(z.string(), JsonValueSchema).optional(),
      content: z.array(ProseMirrorNodeSchema).optional(),
      marks: z.array(ProseMirrorMarkSchema).optional(),
      text: z.string().optional(),
    })
    .strict()
    .superRefine((node, context) => {
      if (node.type === 'text' && node.text === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['text'],
          message: 'Text nodes require text',
        });
      }
      if (node.type !== 'text' && node.text !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['text'],
          message: 'Only text nodes may contain text',
        });
      }
    }),
);

export const ProseMirrorDocSchema: z.ZodType<ProseMirrorDocument> = z
  .object({
    type: z.literal('doc'),
    content: z.array(ProseMirrorNodeSchema).min(1),
  })
  .strict();

export function createEmptyGalleryDocument(): ProseMirrorDocument {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function parseGalleryDocumentInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function normalizeGalleryDocument(value: unknown): ProseMirrorDocument {
  const parsed = parseGalleryDocumentInput(value);
  const document = ProseMirrorDocSchema.safeParse(parsed);
  if (document.success) return document.data;

  const legacyContent = z.array(ProseMirrorNodeSchema).min(1).safeParse(parsed);
  if (legacyContent.success) {
    return { type: 'doc', content: legacyContent.data };
  }

  return createEmptyGalleryDocument();
}
