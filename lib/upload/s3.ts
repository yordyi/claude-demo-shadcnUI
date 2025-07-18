import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null

// Upload file to S3
export async function uploadToS3(
  file: Express.Multer.File,
  key: string
): Promise<string> {
  if (!s3Client || !process.env.AWS_S3_BUCKET) {
    throw new Error('S3 is not configured')
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  })

  await s3Client.send(command)

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}

// Delete file from S3
export async function deleteFromS3(key: string): Promise<void> {
  if (!s3Client || !process.env.AWS_S3_BUCKET) {
    throw new Error('S3 is not configured')
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  })

  await s3Client.send(command)
}