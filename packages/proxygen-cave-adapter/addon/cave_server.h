/**
 * Cave HTTP server abstraction.
 * When USE_PROXYGEN is defined, implemented with Proxygen; otherwise no-op stubs.
 */

#ifndef PROXYGEN_CAVE_ADAPTER_CAVE_SERVER_H_
#define PROXYGEN_CAVE_ADAPTER_CAVE_SERVER_H_

#ifdef __cplusplus
extern "C" {
#endif

/** Start HTTP server on port. No-op if USE_PROXYGEN not defined. Returns 0 on success. */
int StartProxygenServer(int port);

/** Stop the server. No-op if not started or USE_PROXYGEN not defined. */
void StopProxygenServer(void);

#ifdef __cplusplus
}
#endif

#endif /* PROXYGEN_CAVE_ADAPTER_CAVE_SERVER_H_ */
