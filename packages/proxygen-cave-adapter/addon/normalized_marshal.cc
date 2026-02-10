/**
 * N-API marshalling implementation for NormalizedRequest / NormalizedResponse.
 */

#include "normalized_marshal.h"
#include <cstring>

namespace proxygen_cave {

static napi_value StringFromUtf8(napi_env env, const std::string& s) {
  napi_value out;
  if (napi_create_string_utf8(env, s.c_str(), s.size(), &out) != napi_ok)
    return napi_value();
  return out;
}

static void SetProperty(napi_env env, napi_value obj, const char* key, napi_value val) {
  napi_value keyVal;
  napi_create_string_utf8(env, key, NAPI_AUTO_LENGTH, &keyVal);
  napi_set_property(env, obj, keyVal, val);
}

static void SetPropertyString(napi_env env, napi_value obj, const char* key, const std::string& s) {
  SetProperty(env, obj, key, StringFromUtf8(env, s));
}

napi_value ToJsRequest(
    napi_env env,
    const std::string& url,
    const std::string& path,
    const std::string& method,
    const std::map<std::string, std::string>& query,
    const std::map<std::string, std::string>& headers,
    const std::string& body) {
  napi_value req;
  napi_create_object(env, &req);
  SetPropertyString(env, req, "url", url);
  SetPropertyString(env, req, "path", path);
  SetPropertyString(env, req, "method", method);

  napi_value queryObj;
  napi_create_object(env, &queryObj);
  for (const auto& p : query)
    SetPropertyString(env, queryObj, p.first.c_str(), p.second);
  SetProperty(env, req, "query", queryObj);

  napi_value headersObj;
  napi_create_object(env, &headersObj);
  for (const auto& p : headers)
    SetPropertyString(env, headersObj, p.first.c_str(), p.second);
  SetProperty(env, req, "headers", headersObj);

  if (!body.empty())
    SetPropertyString(env, req, "body", body);

  return req;
}

static bool GetInt32(napi_env env, napi_value obj, const char* key, int32_t* out) {
  napi_value v;
  napi_value keyVal;
  napi_create_string_utf8(env, key, NAPI_AUTO_LENGTH, &keyVal);
  if (napi_get_property(env, obj, keyVal, &v) != napi_ok) return false;
  return napi_get_value_int32(env, v, out) == napi_ok;
}

static bool GetString(napi_env env, napi_value obj, const char* key, std::string* out) {
  napi_value v;
  napi_value keyVal;
  napi_create_string_utf8(env, key, NAPI_AUTO_LENGTH, &keyVal);
  if (napi_get_property(env, obj, keyVal, &v) != napi_ok) return false;
  size_t len = 0;
  if (napi_get_value_string_utf8(env, v, nullptr, 0, &len) != napi_ok) return false;
  out->resize(len);
  if (napi_get_value_string_utf8(env, v, &(*out)[0], len + 1, &len) != napi_ok) return false;
  return true;
}

static void CopyObjectToStringMap(napi_env env, napi_value obj, std::map<std::string, std::string>* out) {
  napi_value keys;
  if (napi_get_property_names(env, obj, &keys) != napi_ok) return;
  uint32_t n;
  if (napi_get_array_length(env, keys, &n) != napi_ok) return;
  for (uint32_t i = 0; i < n; i++) {
    napi_value keyVal, valueVal;
    napi_get_element(env, keys, i, &keyVal);
    if (napi_get_property(env, obj, keyVal, &valueVal) != napi_ok) continue;
    size_t klen = 0;
    napi_get_value_string_utf8(env, keyVal, nullptr, 0, &klen);
    std::string k(klen + 1, '\0');
    napi_get_value_string_utf8(env, keyVal, &k[0], klen + 1, &klen);
    k.resize(klen);
    size_t vlen = 0;
    napi_get_value_string_utf8(env, valueVal, nullptr, 0, &vlen);
    std::string v(vlen + 1, '\0');
    napi_get_value_string_utf8(env, valueVal, &v[0], vlen + 1, &vlen);
    v.resize(vlen);
    (*out)[k] = v;
  }
}

bool FromJsResponse(napi_env env, napi_value value, NormalizedResponseCpp* out) {
  if (!out) return false;
  napi_valuetype t;
  if (napi_typeof(env, value, &t) != napi_ok || t != napi_object) return false;
  int32_t status = 200;
  GetInt32(env, value, "status", &status);
  out->status = status;
  napi_value headersVal;
  napi_value keyVal;
  napi_create_string_utf8(env, "headers", NAPI_AUTO_LENGTH, &keyVal);
  if (napi_get_property(env, value, keyVal, &headersVal) == napi_ok)
    CopyObjectToStringMap(env, headersVal, &out->headers);
  napi_create_string_utf8(env, "body", NAPI_AUTO_LENGTH, &keyVal);
  napi_value bodyVal;
  if (napi_get_property(env, value, keyVal, &bodyVal) == napi_ok) {
    napi_valuetype bt;
    napi_typeof(env, bodyVal, &bt);
    if (bt == napi_string) {
      size_t len = 0;
      napi_get_value_string_utf8(env, bodyVal, nullptr, 0, &len);
      out->body.resize(len + 1);
      napi_get_value_string_utf8(env, bodyVal, &out->body[0], len + 1, &len);
      out->body.resize(len);
    }
    /* If body is object/other, JS layer can JSON.stringify before returning; for now leave body empty */
  }
  return true;
}

struct ThenData {
  std::function<void(napi_env, napi_value)> cb;
};

void UnwrapPromiseOrValue(
    napi_env env,
    napi_value value,
    std::function<void(napi_env, napi_value)> callback) {
  napi_valuetype t;
  if (napi_typeof(env, value, &t) != napi_ok) {
    callback(env, value);
    return;
  }
  if (t != napi_object) {
    callback(env, value);
    return;
  }
  bool isPromise = false;
  napi_is_promise(env, value, &isPromise);
  if (!isPromise) {
    callback(env, value);
    return;
  }
  napi_value thenStr, thenFn, catchStr, catchFn;
  napi_create_string_utf8(env, "then", NAPI_AUTO_LENGTH, &thenStr);
  napi_get_property(env, value, thenStr, &thenFn);
  napi_create_string_utf8(env, "catch", NAPI_AUTO_LENGTH, &catchStr);
  napi_get_property(env, value, catchStr, &catchFn);

  ThenData* thenData = new ThenData{std::move(callback)};
  napi_value thenCallback;
  napi_create_function(env, "thenCb", NAPI_AUTO_LENGTH,
      [](napi_env env, napi_callback_info info) -> napi_value {
        napi_value argv[1];
        size_t argc = 1;
        void* data;
        napi_get_cb_info(env, info, &argc, argv, nullptr, &data);
        auto* td = static_cast<ThenData*>(data);
        td->cb(env, argv[0]);
        delete td;
        return argv[0];
      },
      thenData, &thenCallback);

  ThenData* catchData = new ThenData{[callback](napi_env env, napi_value err) {
    (void)err;
    napi_value errResp;
    napi_create_object(env, &errResp);
    napi_value statusVal;
    napi_create_int32(env, 500, &statusVal);
    napi_set_named_property(env, errResp, "status", statusVal);
    napi_value bodyVal = StringFromUtf8(env, "{\"error\":\"Handler threw\"}");
    napi_set_named_property(env, errResp, "body", bodyVal);
    callback(env, errResp);
  }};
  napi_value catchCallback;
  napi_create_function(env, "catchCb", NAPI_AUTO_LENGTH,
      [](napi_env env, napi_callback_info info) -> napi_value {
        napi_value argv[1];
        size_t argc = 1;
        void* data;
        napi_get_cb_info(env, info, &argc, argv, nullptr, &data);
        auto* td = static_cast<ThenData*>(data);
        td->cb(env, argv[0]);
        delete td;
        return argv[0];
      },
      catchData, &catchCallback);

  napi_value thenResult;
  napi_call_function(env, value, thenFn, 1, &thenCallback, &thenResult);
  napi_value catchResult;
  napi_call_function(env, thenResult, catchFn, 1, &catchCallback, &catchResult);
  (void)catchResult;
}

}  // namespace proxygen_cave
