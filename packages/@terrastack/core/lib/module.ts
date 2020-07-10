import { ResourceObject, TerraformSchemaType } from './resource-object';
import { Construct } from 'constructs';
import { snakeCase } from "./_util";

export class Module extends ResourceObject {
    constructor(scope: Construct, ns: string, options: ModuleProps) {
        super(scope, ns, { ...options }, {
            name: "module",
            schemaType: TerraformSchemaType.MODULE,
            providerVersion: "1.0",
            providerName: "terraform",
            rawSchema: ""
        });
    }

    public get(output: string) :any {
        return `\$\{${this.logicalId()}.${snakeCase(output)}\}`
    }

    public getString(output: string) :string {
        return this.get(output);
    }

    public getNumber(output: string) :number {
        return this.get(output);
    }

}

export interface ModuleProps {
    readonly source: string;
    readonly version?: string;
    readonly providers?: {[key: string]: string}
    readonly [key: string]: any
}