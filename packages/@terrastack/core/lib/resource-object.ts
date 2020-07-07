import { Construct } from 'constructs';
import { TagManager } from '@aws-cdk/core';
import { snakeCase, snakeCaseKeys } from "./_util";


/**
 * Metadata associated with this object.
 */
export interface ResourceObjectMetadata {
  /**
   * The unique, namespace-global, name of this object inside the Terraform
   * stack.
   *
   * Normally, you shouldn't specify names for objects and let the CDK generate
   * a name for you that is application-unique. The names CDK generates are
   * composed from the construct path components, separated by dots and a suffix
   * that is based on a hash of the entire path, to ensure uniqueness.
   *
   * You can supply custom name allocation logic by overriding the
   * `chart.generateObjectName` method.
   *
   * If you use an explicit name here, bear in mind that this reduces the
   * composability of your construct because it won't be possible to include
   * more than one instance in any app. Therefore it is highly recommended to
   * leave this unspecified.
   *
   * @default - an app-unique name generated by the chart
   */
  readonly name?: string;

  /**
   * Arbitrary key/value metadata.
   */
  readonly [key: string]: any;
}

export enum TerraformSchemaType {
  PROVIDER = 'provider',
  RESOURCE = 'resource',
  DATA = 'data',
  TERRAFORM = 'terraform',
  OUTPUT = 'output',
  VARIABLE = 'variable'
}

export interface TerraformMetadata {
  readonly name: string;
  readonly schemaType: TerraformSchemaType;
  readonly providerVersion: string;
  readonly providerName: string;
  readonly rawSchema: string;
}

export interface IReferencableResource {
  logicalId(): string;
}
/**
 * Options for defining API objects.
 */
export interface ResourceObjectProps {
  /**
   * Data associated with the resource.
   */
  readonly data?: any;

  /**
   * Object metadata.
   *
   * If `name` is not specified, an app-unique name will be allocated by the
   * framework based on the path of the construct within thes construct tree.
   */
  readonly metadata?: ResourceObjectMetadata;  

  /**
   * Additional attributes for this API object.
   */
  readonly [key: string]: any;
}

interface TerraformMeta {
  readonly terraform: TerraformMetadata;
}

export class ResourceObject extends Construct implements TerraformMeta, IReferencableResource {  
  /**
   * The app-unique name of the object.
   *
   * The name is allocated based on the path of the object construct within the
   * construct tree.
   * 
   * @internal
   */
  public readonly _name: string;

  /**
   * Defines an API object.
   * 
   * @param scope the construct scope
   * @param ns namespace
   * @param props options
   */
  constructor(scope: Construct, ns: string, private readonly props: ResourceObjectProps, readonly terraform: TerraformMetadata) {
    super(scope, ns);
    this._name = ns;
  }

  public logicalId(): string {
    if (this.terraform.schemaType === TerraformSchemaType.DATA) {
      return `data.${snakeCase(this.terraform.name)}.${snakeCase(this._name)}`
    } else {
      return `${snakeCase(this.terraform.name)}.${snakeCase(this._name)}`
    }
  }

  protected get tfProperties(): { [key: string]: any } {
    const props = this.props || {};
    if (TagManager.isTaggable(this)) {
      const tagsProp: { [key: string]: any } = {};
      tagsProp[this.tags.tagPropertyName] = this.tags.renderTags();
      return deepMerge(props, tagsProp);
    }
    return props;
  }

  /**
   * Renders the object to Terraform config.
   * @internal
   */
  public _render(): any {
    const obj: {[k: string]: any} = {};
    obj[this._name] = snakeCaseKeys(this.tfProperties);
    return obj
  }
}

/**
 * Merges `source` into `target`, overriding any existing values.
 * `null`s will cause a value to be deleted.
 */
function deepMerge(target: any, ...sources: any[]) {
  for (const source of sources) {
    if (typeof(source) !== 'object' || typeof(target) !== 'object') {
      throw new Error(`Invalid usage. Both source (${JSON.stringify(source)}) and target (${JSON.stringify(target)}) must be objects`);
    }

    for (const key of Object.keys(source)) {
      const value = source[key];
      if (typeof(value) === 'object' && value != null && !Array.isArray(value)) {
        // if the value at the target is not an object, override it with an
        // object so we can continue the recursion
        if (typeof(target[key]) !== 'object') {
          target[key] = {};
        }

        deepMerge(target[key], value);

        // if the result of the merge is an empty object, it's because the
        // eventual value we assigned is `undefined`, and there are no
        // sibling concrete values alongside, so we can delete this tree.
        const output = target[key];
        if (typeof(output) === 'object' && Object.keys(output).length === 0) {
          delete target[key];
        }
      } else if (value === undefined) {
        delete target[key];
      } else {
        target[key] = value;
      }
    }
  }

  return target;
}


