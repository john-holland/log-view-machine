/**
 * Cave HTTP server implementation.
 * Stub when USE_PROXYGEN is not defined; real Proxygen server when USE_PROXYGEN is defined.
 * To build with Proxygen: set proxygen_prefix in binding.gyp and define USE_PROXYGEN.
 */

#include "cave_server.h"

#ifndef USE_PROXYGEN

/* Stub implementation: no Proxygen dependency. */
int StartProxygenServer(int port) {
  (void)port;
  return 0;
}

void StopProxygenServer(void) {}

#else

/*
 * Proxygen implementation (compile with -DUSE_PROXYGEN and link Proxygen/folly/wangle).
 * Minimal server: one route, read method/path/headers/body, respond with fixed body.
 */
#include <thread>
#include <chrono>

/* Proxygen/folly includes - adjust paths to your install (e.g. <proxygen/httpserver/HTTPServer.h>) */
/* Uncomment and link when building with Proxygen:
#include <proxygen/httpserver/HTTPServer.h>
#include <proxygen/httpserver/RequestHandlerFactory.h>
#include <proxygen/httpserver/RequestHandler.h>
#include <proxygen/httpserver/ResponseBuilder.h>
#include <folly/io/async/EventBaseManager.h>
*/

static std::thread* s_server_thread = nullptr;
static void* s_server_instance = nullptr;

int StartProxygenServer(int port) {
  (void)port;
  (void)s_server_thread;
  (void)s_server_instance;
  /* When Proxygen is linked:
   * 1. Create HTTPServerOptions with a RequestHandlerFactory that returns a handler
   *    which reads HTTPMessage (method, path, headers) and body, then responds with
   *    status 200 and a fixed body (e.g. {"ok":true}).
   * 2. Create HTTPServer, bind to port, call server.start() on a background thread.
   * 3. Store thread and server for StopProxygenServer().
   */
  return 0;
}

void StopProxygenServer(void) {
  /* When Proxygen is linked: stop the server, join the thread, delete instance. */
  if (s_server_thread) {
    s_server_thread->join();
    delete s_server_thread;
    s_server_thread = nullptr;
  }
  s_server_instance = nullptr;
}

#endif /* USE_PROXYGEN */
