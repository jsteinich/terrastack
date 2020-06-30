import { ResourceObject, TerraformSchemaType } from './resource-object';
import { Construct } from 'constructs';
import { snakeCase } from "./_util";

export class Terraform extends ResourceObject {
    public constructor(scope: Construct, options: TerraformProps) {
        super(scope, 'terraform', { ...options }, {
            name: "terraform",
            schemaType: TerraformSchemaType.TERRAFORM,
            providerVersion: "1.0",
            providerName: "terraform",
            rawSchema: ""
        });
    }

    /**
     * Renders the object to Terraform config.
     * @internal
    */
    public _render(): any {
        const obj: {[k: string]: any} = { ...this.tfProperties };
        if(obj.backend) {
            const name = obj.backend.name;
            const backendObj = { ...obj.backend };
            for (const key in backendObj) {
                const snakeKey = snakeCase(key);
                if(snakeKey !== key) {
                    backendObj[snakeKey] = backendObj[key];
                    delete backendObj[key];
                }
            }
            delete backendObj.name;
            obj.backend = {};
            obj.backend[name] = backendObj;
        }
        return obj;
    }
}

export interface TerraformProps {
    readonly requiredVersion?: string;

    readonly requiredProviders?: { [key:string]:string; };

    readonly experiments?: string[];

    readonly backend?: ITerraformBackend;
}

export interface ITerraformBackend {
    readonly name: string;

    readonly [key: string]: any;
}