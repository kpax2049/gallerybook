/* eslint-disable @typescript-eslint/no-explicit-any */
const S3_DOMAIN = import.meta.env.VITE_S3_DOMAIN;
const CLOUDFRONT_DOMAIN = import.meta.env.VITE_CLOUDFRONT_DOMAIN;
const TRANSFORM_PARAMS = import.meta.env.VITE_TRANSFORM_PARAMS;

export function rewriteImageSrcs(node: any): any {
  if (Array.isArray(node)) {
    return node.map(rewriteImageSrcs);
  }
  if (typeof node === 'object' && node !== null) {
    const newNode = { ...node };
    // If it's an image node with S3 src
    if (newNode.type === 'image' && newNode.attrs?.src?.startsWith(S3_DOMAIN)) {
      const s3Key = newNode.attrs.src.replace(`${S3_DOMAIN}/`, '');
      newNode.attrs.src = `${CLOUDFRONT_DOMAIN}/${s3Key}${TRANSFORM_PARAMS}`;
    }
    if (newNode.content) {
      newNode.content = rewriteImageSrcs(newNode.content);
    }
    return newNode;
  }
  return node;
}
