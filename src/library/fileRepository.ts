import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  _Object,
} from "@aws-sdk/client-s3";
import { unexpectedError } from "./error";
import { S3_ACCESS_KEY, S3_REGION, S3_SECRET_KEY, S3_URL } from "./env";

const S3Options: S3ClientConfig = {
  endpoint: S3_URL,
  forcePathStyle: true,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
};

const s3Client = new S3Client(S3Options);

export function saveFile(
  bucket: string,
  name: string,
  buffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<unknown> {
  return s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: name,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function deleteFile(bucket: string, name: string) {
  return s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: name }));
}

export async function getFileByName(
  bucket: string,
  name: string
): Promise<Buffer> {
  const fileFromS3 = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: name })
  );
  if (!fileFromS3.Body)
    throw unexpectedError(
      new Error(`File: ${name} seems empty or its body cannot be read.`)
    );
  const byteArray = await fileFromS3.Body.transformToByteArray();
  return Buffer.from(byteArray.buffer);
}

export async function getFileNames(
  bucket: string,
  nextContinuationToken?: string
): Promise<string[]> {
  const res = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: nextContinuationToken,
    })
  );
  const namesChunk = (res.Contents ?? [])
    .map((_) => _.Key)
    .filter((_) => _ != null);
  return res.NextContinuationToken
    ? [
        ...namesChunk,
        ...(await getFileNames(bucket, res.NextContinuationToken)),
      ]
    : namesChunk;
}

export async function changeBucket(
  currentBucket: string,
  newBucket: string,
  fileName: string,
  contentType: string
): Promise<unknown> {
  const file = await getFileByName(currentBucket, fileName);
  return saveFile(newBucket, fileName, file, contentType);
}
