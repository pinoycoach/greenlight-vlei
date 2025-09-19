// backend/src/types/qrcode.d.ts
// Minimal ambient types so TS knows the shape we use.
declare module 'qrcode' {
  export function toBuffer(text: string, opts?: any): Promise<Buffer>;
  export function toDataURL(text: string, opts?: any): Promise<string>;
}
