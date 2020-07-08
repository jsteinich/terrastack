import { ResourceObject, TerraformSchemaType } from './resource-object';
import { ITerraformBackend } from './terraform';
import { Construct } from 'constructs';
import { snakeCase, snakeCaseKeys } from "./_util";

export class TerraformRemoteState extends ResourceObject {

    public constructor(scope: Construct, ns: string, options: RemoteStateProps) {
        super(scope, ns, { ...options }, {
            name: "terraform_remote_state",
            schemaType: TerraformSchemaType.DATA,
            providerVersion: "1.0",
            providerName: "terraform",
            rawSchema: ""
        });
    }

    public get(output: string) :any {
        return `\$\{${this.logicalId()}.outputs.${snakeCase(output)}\}`
    }

    public getString(output: string) :string {
        return this.get(output);
    }

    public getNumber(output: string) :number {
        return this.get(output);
    }

    /**
     * Renders the object to Terraform config.
     * @internal
    */
    public _render(): any {
        const obj: {[k: string]: any} = snakeCaseKeys({ ...this.tfProperties });
        if(obj.backend) {
            const name = obj.backend.name;
            const backendObj = snakeCaseKeys({ ...obj.backend });
            delete backendObj.name;
            obj.backend = name;
            obj.config = backendObj;
        }
        return obj;
    }
}

export interface RemoteStateProps {
    readonly backend: ITerraformBackend;
    readonly workspace?: string;
    readonly defaults?: { [key: string]: any };
}