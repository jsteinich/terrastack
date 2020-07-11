import { ResourceObject, TerraformSchemaType } from './resource-object';
import { Construct } from 'constructs';

export class Local extends ResourceObject {
    value: any;

    constructor(scope: Construct, ns: string, options: LocalProps) {
        super(scope, ns, { ...options }, {
            name: "local",
            schemaType: TerraformSchemaType.LOCALS,
            providerVersion: "1.0",
            providerName: "terraform",
            rawSchema: ""
        });

        this.value = `\$\{local.${this._name}\}`
    }

    public get stringValue(): string {
        return this.value;
    }

    public get numberValue(): number {
        return this.value;
    }

    /**
     * Renders the object to Terraform config.
     * @internal
     */
    public _render(): any {
        const obj: {[k: string]: any} = {};
        obj[this._name] = this.tfProperties.expression
        return obj;
    }
}

export interface LocalProps {
    readonly expression: any;
}