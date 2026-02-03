import { config } from 'dotenv';
config({ path: '.env.local' });

import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

async function testR2Connection() {
  console.log('Testing R2 connection...\n');
  console.log('Config:');
  console.log(`  Account ID: ${R2_ACCOUNT_ID}`);
  console.log(`  Bucket: ${R2_BUCKET_NAME}`);
  console.log(`  Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\n`);

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Test: List objects in the specified bucket
    console.log(`1. Listing objects in bucket "${R2_BUCKET_NAME}"...`);
    const objectsResponse = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        MaxKeys: 10,
      })
    );
    console.log(`   Found ${objectsResponse.KeyCount || 0} object(s):`);
    objectsResponse.Contents?.forEach((obj) => {
      console.log(`   - ${obj.Key} (${obj.Size} bytes)`);
    });

    console.log('\n✅ R2 connection successful!');
  } catch (error: any) {
    console.error('\n❌ R2 connection failed!');
    console.error(`   Error: ${error.message}`);
    if (error.Code) {
      console.error(`   Code: ${error.Code}`);
    }
    process.exit(1);
  }
}

testR2Connection();
