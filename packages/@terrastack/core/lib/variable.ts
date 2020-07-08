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
        const obj: {[k: string]: any} = snakeCaseKeys({ ...this.tfProperties });
        if(obj.type) {
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
    readonly type?: IVariableType;
}

export interface IVariableType {
    /**
     * @internal
     */
    _render(): string;
}

export class PrimitiveVariableType implements IVariableType {
    public static readonly STRING = new PrimitiveVariableType('string');
    public static readonly NUMBER = new PrimitiveVariableType('number');
    public static readonly BOOL = new PrimitiveVariableType('bool');
    public static readonly ANY = new PrimitiveVariableType('any');

    constructor(private readonly type: string) {

    }

    /**
     * @internal
     */
    _render(): string {
        return this.type;
    }
}

export enum CollectionType {
    LIST = 'list',
    MAP = 'map',
    SET = 'set'
}

export class CollectionVariableType implements IVariableType {
    constructor(public readonly collectionType: CollectionType, public readonly elementType: IVariableType) {
    }
    
    /**
     * @internal
     */
    _render(): string {
        return `list(${this.elementType._render()})`;
    }
}

export class TupleVariableType implements IVariableType {
    constructor(public readonly elements: IVariableType[]) {

    }
    
    /**
     * @internal
     */
    _render(): string {
        return `tuple(${this.elements.map(e => e._render()).join(", ")})`;
    }
}

export class ObjectVariableType implements IVariableType {
    constructor(public readonly attributes: {[k: string]: IVariableType}) {

    }

    /**
     * @internal
     */
    _render(): string {
        return `object({${Object.keys(this.attributes).map(k => k + "=" + this.attributes[k]._render()).join(", ")}})`;
    }
}