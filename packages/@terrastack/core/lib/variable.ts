import { ResourceObject, TerraformSchemaType } from './resource-object';
import { Construct } from 'constructs';
import { snakeCaseKeys } from "./_util";

export class Variable extends ResourceObject {
    value: any;

    public constructor(scope: Construct, ns: string, options: VariableProps) {
        super(scope, ns, { ...options }, {
            name: "variable",
            schemaType: TerraformSchemaType.VARIABLE,
            providerVersion: "1.0",
            providerName: "terraform",
            rawSchema: ""
        });

        this.value = `\$\{var.${this._name}\}`
    }

    public stringValue(): string {
        return this.value;
    }

    public numberValue(): number {
        return this.value;
    }

    /**
     * Renders the object to Terraform config.
     * @internal
     */
    public _render(): any {
        const obj: {[k: string]: any} = snakeCaseKeys({ ...this.tfProperties });
        if(obj.type && obj.type._render) {
            obj.type = obj.type._render();
        }

        const retObj: {[k: string]: any} = {};
        retObj[this._name] = obj;
        return retObj;
    }
}

export interface VariableProps {
    readonly default?: any;
    readonly description?: string;
    readonly type?: VariableType;
}

export interface IRenderableVariableType {
    /**
     * @internal
     */
    _render(): string;
}

function renderVariableType(type: VariableType): string {
    if((type as any)._render) {
        return (type as IRenderableVariableType)._render();
    }
    else {
        return type.toString();
    }
}

export type VariableType = PrimitiveVariableType | CollectionVariableType | TupleVariableType | ObjectVariableType;

export enum PrimitiveVariableType {
    STRING = 'string',
    NUMBER = 'number',
    BOOL = 'bool',
    ANY = 'any'
}

export enum CollectionType {
    LIST = 'list',
    MAP = 'map',
    SET = 'set'
}

export class CollectionVariableType implements IRenderableVariableType {
    constructor(public readonly collectionType: CollectionType, public readonly elementType: VariableType) {
    }
    
    /**
     * @internal
     */
    _render(): string {
        return `list(${renderVariableType(this.elementType)})`;
    }
}

export class TupleVariableType implements IRenderableVariableType {
    constructor(public readonly elements: VariableType[]) {

    }
    
    /**
     * @internal
     */
    _render(): string {
        return `tuple(${this.elements.map(e => renderVariableType(e)) .join(", ")})`;
    }
}

export class ObjectVariableType implements IRenderableVariableType {
    constructor(public readonly attributes: {[k: string]: VariableType}) {

    }

    /**
     * @internal
     */
    _render(): string {
        return `object({${Object.keys(this.attributes).map(k => k + "=" + renderVariableType(this.attributes[k])).join(", ")}})`;
    }
}