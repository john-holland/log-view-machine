/**
 * N-API marshalling for NormalizedRequest and NormalizedResponse.
 * Builds JS request object from C++ request data; reads response from JS (or Promise result).
 */

#ifndef PROXYGEN_CAVE_ADAPTER_NORMALIZED_MARSHAL_H_
#define PROXYGEN_CAVE_ADAPTER_NORMALIZED_MARSHAL_H_

#include <napi.h>
#include <functional>
#include <map>
#include <string>

namespace proxygen_cave {

/** C++ representation of normalized response for writing back to HTTP. */
struct NormalizedResponseCpp {
  int status = 200;
  std::map<std::string, std::string> headers;
  std::string body;  /* JSON or raw string */
};

/**
 * Build a JS object matching NormalizedRequest: { url, path, method, query, headers, body }.
 */
napi_value ToJsRequest(
    napi_env env,
    const std::string& url,
    const std::string& path,
    const std::string& method,
    const std::map<std::string, std::string>& query,
    const std::map<std::string, std::string>& headers,
    const std::string& body);

/**
 * Read NormalizedResponse from a JS object (status, headers?, body?).
 * Returns true if conversion succeeded.
 */
bool FromJsResponse(napi_env env, napi_value value, NormalizedResponseCpp* out);

/**
 * If value is a Promise, attach then/catch and call callback with resolved value or default error response.
 * If not a Promise, call callback immediately with value.
 * Callback is invoked with (env, response_value) so caller can FromJsResponse.
 * Used to support async handlers that return Promise<NormalizedResponse>.
 */
void UnwrapPromiseOrValue(
    napi_env env,
    napi_value value,
    std::function<void(napi_env, napi_value)> callback);

}  // namespace proxygen_cave

#endif /* PROXYGEN_CAVE_ADAPTER_NORMALIZED_MARSHAL_H_ */
