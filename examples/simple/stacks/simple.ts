import { Construct } from 'constructs';
//import { Tag } from "@aws-cdk/core";
import * as tsk from '../../../packages/@terrastack/core';
import { AwsProvider, AwsS3Bucket, AwsIamPolicy } from '../.generated/aws';
import { PolicyDocument, PolicyStatement, AnyPrincipal, Effect } from "@aws-cdk/aws-iam"

const app = new tsk.App();

class MyBucketStack extends tsk.Stack {
  constructor(scope: Construct, ns: string) {
    super(scope, ns);

    new tsk.Terraform(this, {
      requiredVersion: '>= 0.12.0',
      requiredProviders: {
        aws: '>= 2.52.0'
      },
      experiments: ['example'],
      backend: new tsk.S3Backend({
        bucket: 'mybucket',
        key: 'path/to/my/key',
        region: 'eu-central-1',
        accessKey: 'access'
      })
    })

    new AwsProvider(this, 'aws', {
     region: 'eu-central-1'
    })

    const bucketVar = new tsk.Variable(this, 'bucket_name', {
      type: tsk.PrimitiveVariableType.STRING,
      description: "The name of a bucket"
    })

    const bucket = new AwsS3Bucket(this, 'hello', {
      bucket: bucketVar.value,
      forceDestroy: false
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

    const remoteState = new tsk.TerraformRemoteState(this, 'rs', {
      backend: new tsk.S3Backend({
        bucket: 'otherBucket',
        key: 'akey'
      }),
      workspace: 'aworkspace',
      defaults: {
        test: 'hi'
      }
    });

    const aModule = new tsk.Module(this, 'aModule', {
        source: "hashicorp/consul/azurerm",
        version: "= 1.0.0",
        providers: {
          aws: "aws.usw1"
        },
        param1: 3,
        param2: "Test"
    });

    new AwsS3Bucket(this, 'another', {
      bucket: remoteState.get('name'),
      forceDestroy: false,
      region: aModule.getString("region")
    });

    const aLocal = new tsk.Local(this, 'local_val', {
      expression: bucket.arn
    });

    new tsk.Output(this, 'bucket_arn', {
      value: aLocal.value,
      description: "A bucket arn"
    })

    new tsk.Variable(this, 'collection', {
      type: new tsk.CollectionVariableType(tsk.CollectionType.LIST, tsk.PrimitiveVariableType.NUMBER)
    })

    new tsk.Variable(this, 'tuple', {
      type: new tsk.TupleVariableType([tsk.PrimitiveVariableType.BOOL, new tsk.CollectionVariableType(tsk.CollectionType.LIST, tsk.PrimitiveVariableType.NUMBER)])
    })

    new tsk.Variable(this, 'object', {
      type: new tsk.ObjectVariableType({internal: tsk.PrimitiveVariableType.NUMBER, protocol: tsk.PrimitiveVariableType.STRING}),
      default: {internal: 8300, protocol: "tcp"}
    })
  }
}

new MyBucketStack(app, 'my-s3-bucket-stack');
// Tag.add(stack, 'StackType', 'Terraform');
app.synth();