import { ResourceObject, TerraformSchemaType } from './resource-object';
import { TfReference } from './tf-reference';
import { Construct } from 'constructs';

export class Output extends ResourceObject {
    value: any;
    description?: string;
    sensitive?: boolean;

    public constructor(scope: Construct, ns: string, options: OutputProps) {
        super(scope, ns, { ...options }, {
            name: "output",
            schemaType: TerraformSchemaType.OUTPUT,
            providerVersion: "1.0",
            providerName: "terraform",
            rawSchema: ""
        });

        this.value = TfReference.for(this, 'value', null);
        this.description = options.description;
        this.sensitive = options.sensitive;
    }
}

export interface OutputProps {
    readonly value: any;
    readonly description?: string;
    readonly sensitive?: boolean;
}