import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const fileName = formData.get("fileName") as string;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: "foodrec-images",
      Key: fileName,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    })
  );

  const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;
  return NextResponse.json({ url });
}