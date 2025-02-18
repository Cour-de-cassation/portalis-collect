import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  _Object,
} from "@aws-sdk/client-s3";
import { missingValue, unexpectedError } from "./error";

if (process.env.S3_URL == null)
  throw missingValue("process.env.S3_URL", new Error());
if (process.env.S3_REGION == null)
  throw missingValue("process.env.S3_REGION", new Error());
if (process.env.S3_ACCESS_KEY == null)
  throw missingValue("process.env.S3_ACCESS_KEY", new Error());
if (process.env.S3_SECRET_KEY == null)
  throw missingValue("process.env.S3_SECRET_KEY", new Error());

const { S3_URL, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;

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
) {
  return s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: name,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function deleteFile(
  bucket: string,
  name: string,
) {
  return s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: name }));
}

export async function getFileByName(
  bucket: string,
  name: string,
): Promise<Uint8Array> {
  const fileFromS3 = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: name })
  );
  if (!fileFromS3.Body) throw unexpectedError(new Error(`File: ${name} seems empty or its body cannot be read.`))
  return fileFromS3.Body.transformToByteArray();
}

export async function getFileNames(
  bucket: string,
  startAfterFileName?: string,
  nextContinuationToken?: string
): Promise<string[]> {
  const res = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      StartAfter: startAfterFileName,
      ContinuationToken: nextContinuationToken,
    })
  );
  const namesChunk = (res.Contents ?? []).map(_ => _.Key).filter(_ => _ != null)
  return res.NextContinuationToken
    ? [
        ...namesChunk,
        ...(await getFileNames(
          bucket,
          startAfterFileName,
          res.NextContinuationToken
        )),
      ]
    : namesChunk;
}
