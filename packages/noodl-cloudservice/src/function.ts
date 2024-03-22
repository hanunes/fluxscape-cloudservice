import { getCachedContext, scheduleContextCachePurge } from './cfcontext';
import { CFVersion } from './function-deploy';
import { Logger } from './logger';
import { NoodlParseServerResult } from './parse';

// The logger that is needed by the cloud functions
// it passes the logs to the parse server logger
export class FunctionLogger {
  noodlParseServer: any;

  constructor(noodlParseServer) {
    this.noodlParseServer = noodlParseServer;
  }

  log(level, message) {
    setImmediate(function () {
      this.noodlParseServer.logger._log(level, message)
    });
  }
}

export type ExecuteFunctionOptions = {
  noodlServer: NoodlParseServerResult;
  version: CFVersion;
  logger: Logger;
  headers: Record<string, unknown>
  functionId: string;
  body: string;
}

export async function executeFunction({
  noodlServer,
  version,
  logger,
  headers,
  functionId,
  body,
}: ExecuteFunctionOptions) {
  const appId = noodlServer.options.appId;
  const masterKey = noodlServer.options.masterKey;
  const timeOut = noodlServer.functionOptions.timeOut || 15;
  const memoryLimit = noodlServer.functionOptions.memoryLimit || 256;
  const serverUrl = noodlServer.options.serverURL;

  // Prepare the context
  let cachedContext = await getCachedContext({
    backendEndpoint: serverUrl,
    appId,
    masterKey,
    version,
    logger,
    timeout: timeOut * 1000,
    memoryLimit,
  })

  scheduleContextCachePurge();

  // Execute the request
  const response = await cachedContext.handleRequest({
    functionId,
    headers,
    body: JSON.stringify(body),
  });

  return response
}
