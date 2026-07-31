import { Transform } from 'class-transformer';
import { IsGalleryDocument } from './is-gallery-document.decorator';
import {
  parseGalleryDocumentInput,
  ProseMirrorDocument,
} from '../zod/prosemirror.schema';

export class UpdateGalleryContentDto {
  @Transform(({ value }) => parseGalleryDocumentInput(value))
  @IsGalleryDocument()
  content: ProseMirrorDocument;
}
