/**
 * aws-node-cave-adapter: Cave server adapter for AWS Node (EC2, ECS, Elastic Beanstalk).
 * Wraps Express + express-cave-adapter and exposes getApp() for http.createServer(app) or ALB.
 * Optional: loadConfigFromAws() to merge SSM Parameter Store / Secrets Manager into process.env before createCaveServer.
 */
import { type Application } from 'express';
import { type ExpressCaveAdapterOptions } from 'express-cave-adapter';
import type { CaveServerAdapter } from 'log-view-machine';
export type { ExpressCaveAdapterOptions } from 'express-cave-adapter';
export interface AwsNodeCaveAdapterOptions extends ExpressCaveAdapterOptions {
    /** Optional: use an existing Express app. If not provided, one is created. */
    app?: Application;
}
export interface LoadConfigFromAwsOptions {
    /** AWS region (default from AWS_REGION env). */
    region?: string;
    /** SSM Parameter Store path prefix; parameters under this path are loaded as env (e.g. /myapp/prod). */
    parameterStorePath?: string;
    /** Secrets Manager secret ARN; secret string (JSON) is parsed and merged as env keys. */
    secretsArn?: string;
}
/**
 * Load config from AWS SSM Parameter Store and/or Secrets Manager and merge into process.env.
 * Call this before createCaveServer() so Cave and adapters see the merged env.
 * Requires optional deps: @aws-sdk/client-ssm, @aws-sdk/client-secrets-manager.
 */
export declare function loadConfigFromAws(options: LoadConfigFromAwsOptions): Promise<Record<string, string>>;
/**
 * Create the AWS Node Cave adapter. Uses Express + express-cave-adapter under the hood.
 * apply(context) delegates to express-cave-adapter. Use getApp() for http.createServer(adapter.getApp()) or ALB.
 */
export declare function awsNodeCaveAdapter(options?: AwsNodeCaveAdapterOptions): CaveServerAdapter & {
    getApp(): Application;
};
