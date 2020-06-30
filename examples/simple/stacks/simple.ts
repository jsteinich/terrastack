import { Construct } from 'constructs';
//import { Tag } from "@aws-cdk/core";
import { App, Stack, Terraform, S3Backend } from '../../../packages/@terrastack/core';
import { AwsProvider, AwsS3Bucket, AwsIamPolicy } from '../.generated/aws';
import { PolicyDocument, PolicyStatement, AnyPrincipal, Effect } from "@aws-cdk/aws-iam"

const app = new App();

class MyBucketStack extends Stack {
  constructor(scope: Construct, ns: string) {
    super(scope, ns);

    new Terraform(this, {
      requiredVersion: '>= 0.12.0',
      requiredProviders: {
        aws: '>= 2.52.0'
      },
      experiments: ['example'],
      backend: new S3Backend({
        bucket: 'mybucket',
        key: 'path/to/my/key',
        region: 'eu-central-1',
        accessKey: 'access'
      })
    })

    new AwsProvider(this, 'aws', {
     region: 'eu-central-1'
    })

    const bucket = new AwsS3Bucket(this, 'hello', {
      bucket: 'world'
    });

    const bucketPolicyDocument = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          principals: [new AnyPrincipal()],
          actions: [
            "s3:Get*"
          ],
          resources: [bucket.arn]
        })
      ] 
    })

    new AwsIamPolicy(this, "helloPolicy", {
      name: "hello-bucket",
      policy: JSON.stringify(bucketPolicyDocument.toJSON())
    })
  }
}

new MyBucketStack(app, 'my-s3-bucket-stack');
// Tag.add(stack, 'StackType', 'Terraform');
app.synth();