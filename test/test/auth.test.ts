import { assert } from "console";
import { AuthServices } from "./AuthServices";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";

async function testAuth() {
  const authServices = new AuthServices();

  const signInOutput = await authServices.login("Batman", "Batman13579!");
  console.log(signInOutput);

  const idToken = await authServices.getIdToken();
  console.log(idToken);

  const credetnials = await authServices.generateTemporaryCredentials();

  const buckets = await ListBuckets(credetnials);
  console.log(buckets)
}

async function ListBuckets(credentials: any) {
  const client = new S3Client({
    credentials: credentials,
  });
  const command = new ListBucketsCommand({});
  const result = await client.send(command);
  return result;
}
testAuth();
