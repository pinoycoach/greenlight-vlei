declare module 'qrcode' {
  export function toBuffer(text: string, opts?: any): Promise<Buffer>;
  export function toDataURL(text: string, opts?: any): Promise<string>;
}
