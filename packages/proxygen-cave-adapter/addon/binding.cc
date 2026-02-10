/**
 * Proxygen Cave adapter - N-API addon.
 * Route table (method, path) -> handlerId; dispatcher callback for JS handlers.
 */

#include <napi.h>
#include <string>
#include <map>
#include "cave_server.h"
#include "normalized_marshal.h"

static const char* ADAPTER_VERSION = "1.0.0";

static int s_nextHandlerId = 0;
static std::map<std::string, int> s_routeTable;  /* key = method + "\t" + path */

static Napi::FunctionReference s_dispatcherRef;

namespace {

Napi::Value GetVersion(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::String::New(env, ADAPTER_VERSION);
}

Napi::Value StartServer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected port (number)").ThrowAsJavaScriptException();
    return env.Null();
  }
  int port = info[0].As<Napi::Number>().Int32Value();
  int r = StartProxygenServer(port);
  return Napi::Number::New(env, r);
}

Napi::Value StopServer(const Napi::CallbackInfo& info) {
  StopProxygenServer();
  return info.Env().Undefined();
}

Napi::Value AddRoute(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected (method: string, path: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  std::string method = info[0].As<Napi::String>().Utf8Value();
  std::string path = info[1].As<Napi::String>().Utf8Value();
  std::string key = method + "\t" + path;
  int id = ++s_nextHandlerId;
  s_routeTable[key] = id;
  return Napi::Number::New(env, id);
}

Napi::Value SetDispatcher(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "Expected dispatcher function (handlerId, req) => response").ThrowAsJavaScriptException();
    return env.Null();
  }
  s_dispatcherRef = Napi::Persistent(info[0].As<Napi::Function>());
  return env.Undefined();
}

/* Look up handlerId for (method, path). Returns 0 if not found. */
int GetHandlerId(const std::string& method, const std::string& path) {
  std::string key = method + "\t" + path;
  auto it = s_routeTable.find(key);
  return it != s_routeTable.end() ? it->second : 0;
}

}  // namespace

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports.Set("getVersion", Napi::Function::New(env, GetVersion));
  exports.Set("startServer", Napi::Function::New(env, StartServer));
  exports.Set("stopServer", Napi::Function::New(env, StopServer));
  exports.Set("addRoute", Napi::Function::New(env, AddRoute));
  exports.Set("setDispatcher", Napi::Function::New(env, SetDispatcher));
  return exports;
}

NODE_API_MODULE(proxygen_cave_native, InitAll)
