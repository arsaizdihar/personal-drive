import AWS from "aws-sdk";

export const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
});

export async function deleteRecursive(
  bucket: string,
  dir: string
): Promise<number> {
  let count: number = 0;
  while (true) {
    // list objects
    const listedObjects = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: dir,
      })
      .promise();
    if (listedObjects.Contents === undefined) {
      throw new Error("Listing S3 returns no contents");
    }
    if (listedObjects.Contents.length !== 0) {
      // prepare delete request
      const deleteParams = {
        Bucket: bucket,
        Delete: {
          Objects: listedObjects.Contents.map((obj) => ({
            Key: obj.Key as string,
          })),
        },
      };
      // listedObjects.Contents.forEach(({ Key }) => {
      //     deleteParams.Delete.Objects.push({ Key as string });
      // });
      const deleteOutput = await s3.deleteObjects(deleteParams).promise();
      // count or list
      count += (deleteOutput.Deleted as AWS.S3.DeletedObjects).length;
    }
    if (!listedObjects.IsTruncated) {
      return count;
    }
  }
}
