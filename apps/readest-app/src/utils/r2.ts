import { AwsClient } from 'aws4fetch';

export const r2Storage = {
  getR2Client: () => {
    return new AwsClient({
      service: 's3',
      region: process.env['R2_REGION'] || 'auto',
      accessKeyId: process.env['R2_ACCESS_KEY_ID']!,
      secretAccessKey: process.env['R2_SECRET_ACCESS_KEY']!,
    });
  },

  getR2Url: () => {
    const R2_ACCOUNT_ID = process.env['R2_ACCOUNT_ID']!;
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  },

  getPathPrefix: () => {
    return process.env['R2_PATH_PREFIX'] || '';
  },

  buildFileKey: (fileKey: string) => {
    const prefix = r2Storage.getPathPrefix();
    return prefix ? `${prefix.replace(/\/$/, '')}/${fileKey}` : fileKey;
  },

  getDownloadSignedUrl: async (bucketName: string, fileKey: string, expiresIn: number) => {
    const prefixedKey = r2Storage.buildFileKey(fileKey);
    return (
      await r2Storage
        .getR2Client()
        .sign(
          new Request(
            `${r2Storage.getR2Url()}/${bucketName}/${prefixedKey}?X-Amz-Expires=${expiresIn}`,
          ),
          {
            aws: { signQuery: true },
          },
        )
    ).url.toString();
  },

  getUploadSignedUrl: async (
    bucketName: string,
    fileKey: string,
    contentLength: number,
    expiresIn: number,
  ) => {
    const prefixedKey = r2Storage.buildFileKey(fileKey);
    return (
      await r2Storage.getR2Client().sign(
        new Request(
          `${r2Storage.getR2Url()}/${bucketName}/${prefixedKey}?X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=content-length`,
          {
            method: 'PUT',
            headers: {
              'Content-Length': contentLength.toString(),
            },
          },
        ),
        {
          aws: { signQuery: true },
        },
      )
    ).url.toString();
  },

  putObject: async (
    bucketName: string,
    fileKey: string,
    body: ArrayBuffer | string,
    contentType: string,
  ) => {
    const prefixedKey = r2Storage.buildFileKey(fileKey);
    return await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${prefixedKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body,
      });
  },

  deleteObject: async (bucketName: string, fileKey: string) => {
    const prefixedKey = r2Storage.buildFileKey(fileKey);
    return await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${prefixedKey}`, {
        method: 'DELETE',
      });
  },

  headObject: async (bucketName: string, fileKey: string) => {
    const prefixedKey = r2Storage.buildFileKey(fileKey);
    const response = await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${prefixedKey}`, {
        method: 'HEAD',
      });
    return response;
  },

  copyObject: async (
    bucketName: string,
    sourceFileKey: string,
    destFileKey: string,
    sourceBucketName?: string,
  ) => {
    const srcBucket = sourceBucketName || bucketName;
    const prefixedSourceKey = r2Storage.buildFileKey(sourceFileKey);
    const prefixedDestKey = r2Storage.buildFileKey(destFileKey);
    // S3 / R2 require the copy-source header to be URL-encoded segment-by-
    // segment. file_key is built from the original filename, so spaces and
    // reserved chars (e.g. `My Book.epub`, `A&B.epub`) are common and would
    // otherwise break the copy. We encode each path segment but keep the
    // separating slashes literal.
    const encodeKey = (key: string): string => key.split('/').map(encodeURIComponent).join('/');
    const copySource = `/${srcBucket}/${encodeKey(prefixedSourceKey)}`;
    const response = await r2Storage
      .getR2Client()
      .fetch(`${r2Storage.getR2Url()}/${bucketName}/${prefixedDestKey}`, {
        method: 'PUT',
        headers: {
          'x-amz-copy-source': copySource,
        },
      });
    return response;
  },
};
