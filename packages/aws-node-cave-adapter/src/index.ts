/**
 * aws-node-cave-adapter: Cave server adapter for AWS Node (EC2, ECS, Elastic Beanstalk).
 * Wraps Express + express-cave-adapter and exposes getApp() for http.createServer(app) or ALB.
 * Optional: loadConfigFromAws() to merge SSM Parameter Store / Secrets Manager into process.env before createCaveServer.
 */

import express, { type Application } from 'express';
import { expressCaveAdapter, type ExpressCaveAdapterOptions } from 'express-cave-adapter';
import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';

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
export async function loadConfigFromAws(options: LoadConfigFromAwsOptions): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  const region = options.region ?? process.env.AWS_REGION ?? 'us-east-1';

  if (options.parameterStorePath) {
    try {
      const ssm = await import('@aws-sdk/client-ssm').catch(() => null);
      if (!ssm) return env;
      const { SSMClient, GetParametersByPathCommand } = ssm;
      const client = new SSMClient({ region });
      let nextToken: string | undefined;
      do {
        const res = await client.send(
          new GetParametersByPathCommand({
            Path: options.parameterStorePath,
            Recursive: true,
            WithDecryption: true,
            NextToken: nextToken,
          })
        ) as { Parameters?: Array<{ Name?: string; Value?: string }>; NextToken?: string };
        for (const p of res.Parameters ?? []) {
          if (p.Name && p.Value !== undefined) {
            const key = p.Name.split('/').pop() ?? p.Name;
            env[key] = p.Value;
          }
        }
        nextToken = res.NextToken;
      } while (nextToken);
    } catch (e) {
      console.warn('aws-node-cave-adapter: SSM load failed', e);
    }
  }

  if (options.secretsArn) {
    try {
      const sm = await import('@aws-sdk/client-secrets-manager').catch(() => null);
      if (!sm) return env;
      const { SecretsManagerClient, GetSecretValueCommand } = sm;
      const client = new SecretsManagerClient({ region });
      const res = await client.send(new GetSecretValueCommand({ SecretId: options.secretsArn }));
      const raw = res.SecretString;
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        Object.assign(env, parsed);
      }
    } catch (e) {
      console.warn('aws-node-cave-adapter: Secrets Manager load failed', e);
    }
  }

  for (const [k, v] of Object.entries(env)) {
    if (typeof process !== 'undefined' && process.env) {
      process.env[k] = v;
    }
  }
  return env;
}

/**
 * Create the AWS Node Cave adapter. Uses Express + express-cave-adapter under the hood.
 * apply(context) delegates to express-cave-adapter. Use getApp() for http.createServer(adapter.getApp()) or ALB.
 */
export function awsNodeCaveAdapter(options: AwsNodeCaveAdapterOptions = {}): CaveServerAdapter & { getApp(): Application } {
  const app: Application = options.app ?? express();
  if (!options.app) {
    app.use(express.json());
  }
  const expressAdapter = expressCaveAdapter({ ...options, app });
  return {
    registerRoute: expressAdapter.registerRoute?.bind(expressAdapter),
    mount: expressAdapter.mount?.bind(expressAdapter),
    use: expressAdapter.use?.bind(expressAdapter),
    async apply(context: CaveServerContext): Promise<void> {
      await expressAdapter.apply(context);
    },
    getApp(): Application {
      return (expressAdapter as { getApp(): Application }).getApp();
    },
  };
}
