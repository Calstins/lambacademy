// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/server';
// import { UploadThingError } from "uploadthing/server"; // if you want custom errors

const f = createUploadthing();

/** Allow exactly one PDF up to 10MB */
export const uploadRouter = {
  pdfUploader: f({ pdf: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      // TODO: auth if you want (throw to block)
      return {}; // metadata passed to onUploadComplete
    })
    .onUploadComplete(async ({ file }) => {
      // Whatever you return here is available in onClientUploadComplete
      return {
        url: file.url, // public URL
        name: file.name, // original filename
        key: file.key, // storage key
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
