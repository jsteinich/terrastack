import { ITerraformBackend } from '../terraform';

export class RemoteBackend implements ITerraformBackend {
    readonly name: string = "remote";
    hostname?: string;
    organization: string;
    token?: string;
    workspaces: { readonly name?: string, readonly prefix?: string };

    public constructor(options: RemoteBackendProps) {
        this.hostname = options.hostname;
        this.organization = options.organization;
        this.token = options.token;
        this.workspaces = options.workspaces;
    }
}

export interface RemoteBackendProps {
    readonly hostname?: string;
    readonly organization: string;
    readonly token?: string;
    readonly workspaces: { readonly name?: string, readonly prefix?: string };
}