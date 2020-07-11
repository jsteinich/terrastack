import { Construct, ISynthesisSession, Node } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import { ResourceObject, TerraformSchemaType } from './resource-object';
import { resolve } from './_tokens';
import { removeEmpty } from './_util';
import { Names } from './names';
import {  
  snakeCase,
} from "./_util";


export class Stack extends Construct {

  /**
   * Finds the stack in which a node is defined.
   * @param c a construct node
   */
  public static of(c: Construct): Stack {
    if (c instanceof Stack) {
      return c;
    }

    const parent = Node.of(c).scope as Construct;
    if (!parent) {
      throw new Error(`cannot find a parent chart (directly or indirectly)`);
    }

    return Stack.of(parent);
  }

  /**
   * The name of the stack's YAML file as emitted into the cloud assembly
   * directory during synthesis.
   */
  public readonly manifestFile: string;

  constructor(scope: Construct, ns: string) {
    super(scope, ns);
    this.manifestFile = `${Node.of(this).uniqueId}.tf.json`;
  }

  /**
   * Generates a app-unique name for an object given it's construct node path.
   *
   * @param resourceObject The API object to generate a name for.
   */
  public generateObjectName(resourceObject: ResourceObject) {
    return Names.toDnsLabel(Node.of(resourceObject).path);
  }

  protected onSynthesize(session: ISynthesisSession) {
    const doc: {[k: string]: {[k: string]: any}} = {};

    for (const resource of Node.of(this).findAll()) {
      if (!(resource instanceof ResourceObject)) {
        continue;
      }
      const resourceName = snakeCase(resource.terraform.name)
      const type = snakeCase(resource.terraform.schemaType)
      

      if (!doc[type]) {
        const obj: {[k: string]: any} = {};
        doc[type] = obj
      }

      switch(type) {
        case TerraformSchemaType.PROVIDER:
        case TerraformSchemaType.TERRAFORM:
        case TerraformSchemaType.OUTPUT:
        case TerraformSchemaType.VARIABLE:
        case TerraformSchemaType.MODULE:
        case TerraformSchemaType.LOCALS: {
          const manifest = removeEmpty(resolve(this, resource._render()));
          const merged = {...doc[type], ...manifest}
          doc[type] = merged

          break;
        }
        default: {
          if (!doc[type][resourceName]) {
            const obj: {[k: string]: any} = {};
            doc[type][resourceName] = obj
          }
          
          const manifest = removeEmpty(resolve(this, resource._render()));
          const merged = {...doc[type][resourceName], ...manifest}
          doc[type][resourceName] = merged

          break;
       }
      }
    }
    fs.writeFileSync(path.join(session.outdir, this.manifestFile), JSON.stringify(doc, null, 2));
  }
}