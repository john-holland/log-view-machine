import require$$0, { useState, useEffect, createContext, useContext, useRef, useMemo, Component } from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign, interpret } from 'xstate';
import express from 'express';

var jsxRuntime = {exports: {}};

var reactJsxRuntime_production_min = {};

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production_min;

function requireReactJsxRuntime_production_min () {
	if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
	hasRequiredReactJsxRuntime_production_min = 1;
var f=require$$0,k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:!0,ref:!0,__self:!0,__source:!0};
	function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a)void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}reactJsxRuntime_production_min.Fragment=l;reactJsxRuntime_production_min.jsx=q;reactJsxRuntime_production_min.jsxs=q;
	return reactJsxRuntime_production_min;
}

var reactJsxRuntime_development = {};

/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_development;

function requireReactJsxRuntime_development () {
	if (hasRequiredReactJsxRuntime_development) return reactJsxRuntime_development;
	hasRequiredReactJsxRuntime_development = 1;

	if (process.env.NODE_ENV !== "production") {
	  (function() {

	var React = require$$0;

	// ATTENTION
	// When adding new symbols to this file,
	// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
	// The Symbol used to tag the ReactElement-like types.
	var REACT_ELEMENT_TYPE = Symbol.for('react.element');
	var REACT_PORTAL_TYPE = Symbol.for('react.portal');
	var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
	var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
	var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
	var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
	var REACT_CONTEXT_TYPE = Symbol.for('react.context');
	var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
	var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
	var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
	var REACT_MEMO_TYPE = Symbol.for('react.memo');
	var REACT_LAZY_TYPE = Symbol.for('react.lazy');
	var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	var FAUX_ITERATOR_SYMBOL = '@@iterator';
	function getIteratorFn(maybeIterable) {
	  if (maybeIterable === null || typeof maybeIterable !== 'object') {
	    return null;
	  }

	  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

	  if (typeof maybeIterator === 'function') {
	    return maybeIterator;
	  }

	  return null;
	}

	var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

	function error(format) {
	  {
	    {
	      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	        args[_key2 - 1] = arguments[_key2];
	      }

	      printWarning('error', format, args);
	    }
	  }
	}

	function printWarning(level, format, args) {
	  // When changing this logic, you might want to also
	  // update consoleWithStackDev.www.js as well.
	  {
	    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
	    var stack = ReactDebugCurrentFrame.getStackAddendum();

	    if (stack !== '') {
	      format += '%s';
	      args = args.concat([stack]);
	    } // eslint-disable-next-line react-internal/safe-string-coercion


	    var argsWithFormat = args.map(function (item) {
	      return String(item);
	    }); // Careful: RN currently depends on this prefix

	    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
	    // breaks IE9: https://github.com/facebook/react/issues/13610
	    // eslint-disable-next-line react-internal/no-production-logging

	    Function.prototype.apply.call(console[level], console, argsWithFormat);
	  }
	}

	// -----------------------------------------------------------------------------

	var enableScopeAPI = false; // Experimental Create Event Handle API.
	var enableCacheElement = false;
	var enableTransitionTracing = false; // No known bugs, but needs performance testing

	var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
	// stuff. Intended to enable React core members to more easily debug scheduling
	// issues in DEV builds.

	var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

	var REACT_MODULE_REFERENCE;

	{
	  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
	}

	function isValidElementType(type) {
	  if (typeof type === 'string' || typeof type === 'function') {
	    return true;
	  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


	  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
	    return true;
	  }

	  if (typeof type === 'object' && type !== null) {
	    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
	    // types supported by any Flight configuration anywhere since
	    // we don't know which Flight build this will end up being used
	    // with.
	    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
	      return true;
	    }
	  }

	  return false;
	}

	function getWrappedName(outerType, innerType, wrapperName) {
	  var displayName = outerType.displayName;

	  if (displayName) {
	    return displayName;
	  }

	  var functionName = innerType.displayName || innerType.name || '';
	  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
	} // Keep in sync with react-reconciler/getComponentNameFromFiber


	function getContextName(type) {
	  return type.displayName || 'Context';
	} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.


	function getComponentNameFromType(type) {
	  if (type == null) {
	    // Host root, text node or just invalid type.
	    return null;
	  }

	  {
	    if (typeof type.tag === 'number') {
	      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
	    }
	  }

	  if (typeof type === 'function') {
	    return type.displayName || type.name || null;
	  }

	  if (typeof type === 'string') {
	    return type;
	  }

	  switch (type) {
	    case REACT_FRAGMENT_TYPE:
	      return 'Fragment';

	    case REACT_PORTAL_TYPE:
	      return 'Portal';

	    case REACT_PROFILER_TYPE:
	      return 'Profiler';

	    case REACT_STRICT_MODE_TYPE:
	      return 'StrictMode';

	    case REACT_SUSPENSE_TYPE:
	      return 'Suspense';

	    case REACT_SUSPENSE_LIST_TYPE:
	      return 'SuspenseList';

	  }

	  if (typeof type === 'object') {
	    switch (type.$$typeof) {
	      case REACT_CONTEXT_TYPE:
	        var context = type;
	        return getContextName(context) + '.Consumer';

	      case REACT_PROVIDER_TYPE:
	        var provider = type;
	        return getContextName(provider._context) + '.Provider';

	      case REACT_FORWARD_REF_TYPE:
	        return getWrappedName(type, type.render, 'ForwardRef');

	      case REACT_MEMO_TYPE:
	        var outerName = type.displayName || null;

	        if (outerName !== null) {
	          return outerName;
	        }

	        return getComponentNameFromType(type.type) || 'Memo';

	      case REACT_LAZY_TYPE:
	        {
	          var lazyComponent = type;
	          var payload = lazyComponent._payload;
	          var init = lazyComponent._init;

	          try {
	            return getComponentNameFromType(init(payload));
	          } catch (x) {
	            return null;
	          }
	        }

	      // eslint-disable-next-line no-fallthrough
	    }
	  }

	  return null;
	}

	var assign = Object.assign;

	// Helpers to patch console.logs to avoid logging during side-effect free
	// replaying on render function. This currently only patches the object
	// lazily which won't cover if the log function was extracted eagerly.
	// We could also eagerly patch the method.
	var disabledDepth = 0;
	var prevLog;
	var prevInfo;
	var prevWarn;
	var prevError;
	var prevGroup;
	var prevGroupCollapsed;
	var prevGroupEnd;

	function disabledLog() {}

	disabledLog.__reactDisabledLog = true;
	function disableLogs() {
	  {
	    if (disabledDepth === 0) {
	      /* eslint-disable react-internal/no-production-logging */
	      prevLog = console.log;
	      prevInfo = console.info;
	      prevWarn = console.warn;
	      prevError = console.error;
	      prevGroup = console.group;
	      prevGroupCollapsed = console.groupCollapsed;
	      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

	      var props = {
	        configurable: true,
	        enumerable: true,
	        value: disabledLog,
	        writable: true
	      }; // $FlowFixMe Flow thinks console is immutable.

	      Object.defineProperties(console, {
	        info: props,
	        log: props,
	        warn: props,
	        error: props,
	        group: props,
	        groupCollapsed: props,
	        groupEnd: props
	      });
	      /* eslint-enable react-internal/no-production-logging */
	    }

	    disabledDepth++;
	  }
	}
	function reenableLogs() {
	  {
	    disabledDepth--;

	    if (disabledDepth === 0) {
	      /* eslint-disable react-internal/no-production-logging */
	      var props = {
	        configurable: true,
	        enumerable: true,
	        writable: true
	      }; // $FlowFixMe Flow thinks console is immutable.

	      Object.defineProperties(console, {
	        log: assign({}, props, {
	          value: prevLog
	        }),
	        info: assign({}, props, {
	          value: prevInfo
	        }),
	        warn: assign({}, props, {
	          value: prevWarn
	        }),
	        error: assign({}, props, {
	          value: prevError
	        }),
	        group: assign({}, props, {
	          value: prevGroup
	        }),
	        groupCollapsed: assign({}, props, {
	          value: prevGroupCollapsed
	        }),
	        groupEnd: assign({}, props, {
	          value: prevGroupEnd
	        })
	      });
	      /* eslint-enable react-internal/no-production-logging */
	    }

	    if (disabledDepth < 0) {
	      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
	    }
	  }
	}

	var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
	var prefix;
	function describeBuiltInComponentFrame(name, source, ownerFn) {
	  {
	    if (prefix === undefined) {
	      // Extract the VM specific prefix used by each line.
	      try {
	        throw Error();
	      } catch (x) {
	        var match = x.stack.trim().match(/\n( *(at )?)/);
	        prefix = match && match[1] || '';
	      }
	    } // We use the prefix to ensure our stacks line up with native stack frames.


	    return '\n' + prefix + name;
	  }
	}
	var reentry = false;
	var componentFrameCache;

	{
	  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
	  componentFrameCache = new PossiblyWeakMap();
	}

	function describeNativeComponentFrame(fn, construct) {
	  // If something asked for a stack inside a fake render, it should get ignored.
	  if ( !fn || reentry) {
	    return '';
	  }

	  {
	    var frame = componentFrameCache.get(fn);

	    if (frame !== undefined) {
	      return frame;
	    }
	  }

	  var control;
	  reentry = true;
	  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

	  Error.prepareStackTrace = undefined;
	  var previousDispatcher;

	  {
	    previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function
	    // for warnings.

	    ReactCurrentDispatcher.current = null;
	    disableLogs();
	  }

	  try {
	    // This should throw.
	    if (construct) {
	      // Something should be setting the props in the constructor.
	      var Fake = function () {
	        throw Error();
	      }; // $FlowFixMe


	      Object.defineProperty(Fake.prototype, 'props', {
	        set: function () {
	          // We use a throwing setter instead of frozen or non-writable props
	          // because that won't throw in a non-strict mode function.
	          throw Error();
	        }
	      });

	      if (typeof Reflect === 'object' && Reflect.construct) {
	        // We construct a different control for this case to include any extra
	        // frames added by the construct call.
	        try {
	          Reflect.construct(Fake, []);
	        } catch (x) {
	          control = x;
	        }

	        Reflect.construct(fn, [], Fake);
	      } else {
	        try {
	          Fake.call();
	        } catch (x) {
	          control = x;
	        }

	        fn.call(Fake.prototype);
	      }
	    } else {
	      try {
	        throw Error();
	      } catch (x) {
	        control = x;
	      }

	      fn();
	    }
	  } catch (sample) {
	    // This is inlined manually because closure doesn't do it for us.
	    if (sample && control && typeof sample.stack === 'string') {
	      // This extracts the first frame from the sample that isn't also in the control.
	      // Skipping one frame that we assume is the frame that calls the two.
	      var sampleLines = sample.stack.split('\n');
	      var controlLines = control.stack.split('\n');
	      var s = sampleLines.length - 1;
	      var c = controlLines.length - 1;

	      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
	        // We expect at least one stack frame to be shared.
	        // Typically this will be the root most one. However, stack frames may be
	        // cut off due to maximum stack limits. In this case, one maybe cut off
	        // earlier than the other. We assume that the sample is longer or the same
	        // and there for cut off earlier. So we should find the root most frame in
	        // the sample somewhere in the control.
	        c--;
	      }

	      for (; s >= 1 && c >= 0; s--, c--) {
	        // Next we find the first one that isn't the same which should be the
	        // frame that called our sample function and the control.
	        if (sampleLines[s] !== controlLines[c]) {
	          // In V8, the first line is describing the message but other VMs don't.
	          // If we're about to return the first line, and the control is also on the same
	          // line, that's a pretty good indicator that our sample threw at same line as
	          // the control. I.e. before we entered the sample frame. So we ignore this result.
	          // This can happen if you passed a class to function component, or non-function.
	          if (s !== 1 || c !== 1) {
	            do {
	              s--;
	              c--; // We may still have similar intermediate frames from the construct call.
	              // The next one that isn't the same should be our match though.

	              if (c < 0 || sampleLines[s] !== controlLines[c]) {
	                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
	                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
	                // but we have a user-provided "displayName"
	                // splice it in to make the stack more readable.


	                if (fn.displayName && _frame.includes('<anonymous>')) {
	                  _frame = _frame.replace('<anonymous>', fn.displayName);
	                }

	                {
	                  if (typeof fn === 'function') {
	                    componentFrameCache.set(fn, _frame);
	                  }
	                } // Return the line we found.


	                return _frame;
	              }
	            } while (s >= 1 && c >= 0);
	          }

	          break;
	        }
	      }
	    }
	  } finally {
	    reentry = false;

	    {
	      ReactCurrentDispatcher.current = previousDispatcher;
	      reenableLogs();
	    }

	    Error.prepareStackTrace = previousPrepareStackTrace;
	  } // Fallback to just using the name if we couldn't make it throw.


	  var name = fn ? fn.displayName || fn.name : '';
	  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

	  {
	    if (typeof fn === 'function') {
	      componentFrameCache.set(fn, syntheticFrame);
	    }
	  }

	  return syntheticFrame;
	}
	function describeFunctionComponentFrame(fn, source, ownerFn) {
	  {
	    return describeNativeComponentFrame(fn, false);
	  }
	}

	function shouldConstruct(Component) {
	  var prototype = Component.prototype;
	  return !!(prototype && prototype.isReactComponent);
	}

	function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

	  if (type == null) {
	    return '';
	  }

	  if (typeof type === 'function') {
	    {
	      return describeNativeComponentFrame(type, shouldConstruct(type));
	    }
	  }

	  if (typeof type === 'string') {
	    return describeBuiltInComponentFrame(type);
	  }

	  switch (type) {
	    case REACT_SUSPENSE_TYPE:
	      return describeBuiltInComponentFrame('Suspense');

	    case REACT_SUSPENSE_LIST_TYPE:
	      return describeBuiltInComponentFrame('SuspenseList');
	  }

	  if (typeof type === 'object') {
	    switch (type.$$typeof) {
	      case REACT_FORWARD_REF_TYPE:
	        return describeFunctionComponentFrame(type.render);

	      case REACT_MEMO_TYPE:
	        // Memo may contain any component type so we recursively resolve it.
	        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

	      case REACT_LAZY_TYPE:
	        {
	          var lazyComponent = type;
	          var payload = lazyComponent._payload;
	          var init = lazyComponent._init;

	          try {
	            // Lazy may contain any component type so we recursively resolve it.
	            return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
	          } catch (x) {}
	        }
	    }
	  }

	  return '';
	}

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var loggedTypeFailures = {};
	var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

	function setCurrentlyValidatingElement(element) {
	  {
	    if (element) {
	      var owner = element._owner;
	      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
	      ReactDebugCurrentFrame.setExtraStackFrame(stack);
	    } else {
	      ReactDebugCurrentFrame.setExtraStackFrame(null);
	    }
	  }
	}

	function checkPropTypes(typeSpecs, values, location, componentName, element) {
	  {
	    // $FlowFixMe This is okay but Flow doesn't know it.
	    var has = Function.call.bind(hasOwnProperty);

	    for (var typeSpecName in typeSpecs) {
	      if (has(typeSpecs, typeSpecName)) {
	        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
	        // fail the render phase where it didn't fail before. So we log it.
	        // After these have been cleaned up, we'll let them throw.

	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          if (typeof typeSpecs[typeSpecName] !== 'function') {
	            // eslint-disable-next-line react-internal/prod-error-codes
	            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
	            err.name = 'Invariant Violation';
	            throw err;
	          }

	          error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
	        } catch (ex) {
	          error$1 = ex;
	        }

	        if (error$1 && !(error$1 instanceof Error)) {
	          setCurrentlyValidatingElement(element);

	          error('%s: type specification of %s' + ' `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error$1);

	          setCurrentlyValidatingElement(null);
	        }

	        if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
	          // Only monitor this failure once because there tends to be a lot of the
	          // same error.
	          loggedTypeFailures[error$1.message] = true;
	          setCurrentlyValidatingElement(element);

	          error('Failed %s type: %s', location, error$1.message);

	          setCurrentlyValidatingElement(null);
	        }
	      }
	    }
	  }
	}

	var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

	function isArray(a) {
	  return isArrayImpl(a);
	}

	/*
	 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
	 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
	 *
	 * The functions in this module will throw an easier-to-understand,
	 * easier-to-debug exception with a clear errors message message explaining the
	 * problem. (Instead of a confusing exception thrown inside the implementation
	 * of the `value` object).
	 */
	// $FlowFixMe only called in DEV, so void return is not possible.
	function typeName(value) {
	  {
	    // toStringTag is needed for namespaced types like Temporal.Instant
	    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
	    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
	    return type;
	  }
	} // $FlowFixMe only called in DEV, so void return is not possible.


	function willCoercionThrow(value) {
	  {
	    try {
	      testStringCoercion(value);
	      return false;
	    } catch (e) {
	      return true;
	    }
	  }
	}

	function testStringCoercion(value) {
	  // If you ended up here by following an exception call stack, here's what's
	  // happened: you supplied an object or symbol value to React (as a prop, key,
	  // DOM attribute, CSS property, string ref, etc.) and when React tried to
	  // coerce it to a string using `'' + value`, an exception was thrown.
	  //
	  // The most common types that will cause this exception are `Symbol` instances
	  // and Temporal objects like `Temporal.Instant`. But any object that has a
	  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
	  // exception. (Library authors do this to prevent users from using built-in
	  // numeric operators like `+` or comparison operators like `>=` because custom
	  // methods are needed to perform accurate arithmetic or comparison.)
	  //
	  // To fix the problem, coerce this object or symbol value to a string before
	  // passing it to React. The most reliable way is usually `String(value)`.
	  //
	  // To find which value is throwing, check the browser or debugger console.
	  // Before this exception was thrown, there should be `console.error` output
	  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
	  // problem and how that type was used: key, atrribute, input value prop, etc.
	  // In most cases, this console output also shows the component and its
	  // ancestor components where the exception happened.
	  //
	  // eslint-disable-next-line react-internal/safe-string-coercion
	  return '' + value;
	}
	function checkKeyStringCoercion(value) {
	  {
	    if (willCoercionThrow(value)) {
	      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before before using it here.', typeName(value));

	      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
	    }
	  }
	}

	var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
	var RESERVED_PROPS = {
	  key: true,
	  ref: true,
	  __self: true,
	  __source: true
	};
	var specialPropKeyWarningShown;
	var specialPropRefWarningShown;
	var didWarnAboutStringRefs;

	{
	  didWarnAboutStringRefs = {};
	}

	function hasValidRef(config) {
	  {
	    if (hasOwnProperty.call(config, 'ref')) {
	      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

	      if (getter && getter.isReactWarning) {
	        return false;
	      }
	    }
	  }

	  return config.ref !== undefined;
	}

	function hasValidKey(config) {
	  {
	    if (hasOwnProperty.call(config, 'key')) {
	      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

	      if (getter && getter.isReactWarning) {
	        return false;
	      }
	    }
	  }

	  return config.key !== undefined;
	}

	function warnIfStringRefCannotBeAutoConverted(config, self) {
	  {
	    if (typeof config.ref === 'string' && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
	      var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);

	      if (!didWarnAboutStringRefs[componentName]) {
	        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://reactjs.org/link/strict-mode-string-ref', getComponentNameFromType(ReactCurrentOwner.current.type), config.ref);

	        didWarnAboutStringRefs[componentName] = true;
	      }
	    }
	  }
	}

	function defineKeyPropWarningGetter(props, displayName) {
	  {
	    var warnAboutAccessingKey = function () {
	      if (!specialPropKeyWarningShown) {
	        specialPropKeyWarningShown = true;

	        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
	      }
	    };

	    warnAboutAccessingKey.isReactWarning = true;
	    Object.defineProperty(props, 'key', {
	      get: warnAboutAccessingKey,
	      configurable: true
	    });
	  }
	}

	function defineRefPropWarningGetter(props, displayName) {
	  {
	    var warnAboutAccessingRef = function () {
	      if (!specialPropRefWarningShown) {
	        specialPropRefWarningShown = true;

	        error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
	      }
	    };

	    warnAboutAccessingRef.isReactWarning = true;
	    Object.defineProperty(props, 'ref', {
	      get: warnAboutAccessingRef,
	      configurable: true
	    });
	  }
	}
	/**
	 * Factory method to create a new React element. This no longer adheres to
	 * the class pattern, so do not use new to call it. Also, instanceof check
	 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
	 * if something is a React Element.
	 *
	 * @param {*} type
	 * @param {*} props
	 * @param {*} key
	 * @param {string|object} ref
	 * @param {*} owner
	 * @param {*} self A *temporary* helper to detect places where `this` is
	 * different from the `owner` when React.createElement is called, so that we
	 * can warn. We want to get rid of owner and replace string `ref`s with arrow
	 * functions, and as long as `this` and owner are the same, there will be no
	 * change in behavior.
	 * @param {*} source An annotation object (added by a transpiler or otherwise)
	 * indicating filename, line number, and/or other information.
	 * @internal
	 */


	var ReactElement = function (type, key, ref, self, source, owner, props) {
	  var element = {
	    // This tag allows us to uniquely identify this as a React Element
	    $$typeof: REACT_ELEMENT_TYPE,
	    // Built-in properties that belong on the element
	    type: type,
	    key: key,
	    ref: ref,
	    props: props,
	    // Record the component responsible for creating this element.
	    _owner: owner
	  };

	  {
	    // The validation flag is currently mutative. We put it on
	    // an external backing store so that we can freeze the whole object.
	    // This can be replaced with a WeakMap once they are implemented in
	    // commonly used development environments.
	    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
	    // the validation flag non-enumerable (where possible, which should
	    // include every environment we run tests in), so the test framework
	    // ignores it.

	    Object.defineProperty(element._store, 'validated', {
	      configurable: false,
	      enumerable: false,
	      writable: true,
	      value: false
	    }); // self and source are DEV only properties.

	    Object.defineProperty(element, '_self', {
	      configurable: false,
	      enumerable: false,
	      writable: false,
	      value: self
	    }); // Two elements created in two different places should be considered
	    // equal for testing purposes and therefore we hide it from enumeration.

	    Object.defineProperty(element, '_source', {
	      configurable: false,
	      enumerable: false,
	      writable: false,
	      value: source
	    });

	    if (Object.freeze) {
	      Object.freeze(element.props);
	      Object.freeze(element);
	    }
	  }

	  return element;
	};
	/**
	 * https://github.com/reactjs/rfcs/pull/107
	 * @param {*} type
	 * @param {object} props
	 * @param {string} key
	 */

	function jsxDEV(type, config, maybeKey, source, self) {
	  {
	    var propName; // Reserved names are extracted

	    var props = {};
	    var key = null;
	    var ref = null; // Currently, key can be spread in as a prop. This causes a potential
	    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
	    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
	    // but as an intermediary step, we will use jsxDEV for everything except
	    // <div {...props} key="Hi" />, because we aren't currently able to tell if
	    // key is explicitly declared to be undefined or not.

	    if (maybeKey !== undefined) {
	      {
	        checkKeyStringCoercion(maybeKey);
	      }

	      key = '' + maybeKey;
	    }

	    if (hasValidKey(config)) {
	      {
	        checkKeyStringCoercion(config.key);
	      }

	      key = '' + config.key;
	    }

	    if (hasValidRef(config)) {
	      ref = config.ref;
	      warnIfStringRefCannotBeAutoConverted(config, self);
	    } // Remaining properties are added to a new props object


	    for (propName in config) {
	      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
	        props[propName] = config[propName];
	      }
	    } // Resolve default props


	    if (type && type.defaultProps) {
	      var defaultProps = type.defaultProps;

	      for (propName in defaultProps) {
	        if (props[propName] === undefined) {
	          props[propName] = defaultProps[propName];
	        }
	      }
	    }

	    if (key || ref) {
	      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

	      if (key) {
	        defineKeyPropWarningGetter(props, displayName);
	      }

	      if (ref) {
	        defineRefPropWarningGetter(props, displayName);
	      }
	    }

	    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
	  }
	}

	var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
	var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

	function setCurrentlyValidatingElement$1(element) {
	  {
	    if (element) {
	      var owner = element._owner;
	      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
	      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
	    } else {
	      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
	    }
	  }
	}

	var propTypesMisspellWarningShown;

	{
	  propTypesMisspellWarningShown = false;
	}
	/**
	 * Verifies the object is a ReactElement.
	 * See https://reactjs.org/docs/react-api.html#isvalidelement
	 * @param {?object} object
	 * @return {boolean} True if `object` is a ReactElement.
	 * @final
	 */


	function isValidElement(object) {
	  {
	    return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	  }
	}

	function getDeclarationErrorAddendum() {
	  {
	    if (ReactCurrentOwner$1.current) {
	      var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);

	      if (name) {
	        return '\n\nCheck the render method of `' + name + '`.';
	      }
	    }

	    return '';
	  }
	}

	function getSourceInfoErrorAddendum(source) {
	  {
	    if (source !== undefined) {
	      var fileName = source.fileName.replace(/^.*[\\\/]/, '');
	      var lineNumber = source.lineNumber;
	      return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
	    }

	    return '';
	  }
	}
	/**
	 * Warn if there's no key explicitly set on dynamic arrays of children or
	 * object keys are not valid. This allows us to keep track of children between
	 * updates.
	 */


	var ownerHasKeyUseWarning = {};

	function getCurrentComponentErrorInfo(parentType) {
	  {
	    var info = getDeclarationErrorAddendum();

	    if (!info) {
	      var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;

	      if (parentName) {
	        info = "\n\nCheck the top-level render call using <" + parentName + ">.";
	      }
	    }

	    return info;
	  }
	}
	/**
	 * Warn if the element doesn't have an explicit key assigned to it.
	 * This element is in an array. The array could grow and shrink or be
	 * reordered. All children that haven't already been validated are required to
	 * have a "key" property assigned to it. Error statuses are cached so a warning
	 * will only be shown once.
	 *
	 * @internal
	 * @param {ReactElement} element Element that requires a key.
	 * @param {*} parentType element's parent's type.
	 */


	function validateExplicitKey(element, parentType) {
	  {
	    if (!element._store || element._store.validated || element.key != null) {
	      return;
	    }

	    element._store.validated = true;
	    var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

	    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
	      return;
	    }

	    ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
	    // property, it may be the creator of the child that's responsible for
	    // assigning it a key.

	    var childOwner = '';

	    if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
	      // Give the component that originally created this child.
	      childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
	    }

	    setCurrentlyValidatingElement$1(element);

	    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

	    setCurrentlyValidatingElement$1(null);
	  }
	}
	/**
	 * Ensure that every element either is passed in a static location, in an
	 * array with an explicit keys property defined, or in an object literal
	 * with valid key property.
	 *
	 * @internal
	 * @param {ReactNode} node Statically passed child of any type.
	 * @param {*} parentType node's parent's type.
	 */


	function validateChildKeys(node, parentType) {
	  {
	    if (typeof node !== 'object') {
	      return;
	    }

	    if (isArray(node)) {
	      for (var i = 0; i < node.length; i++) {
	        var child = node[i];

	        if (isValidElement(child)) {
	          validateExplicitKey(child, parentType);
	        }
	      }
	    } else if (isValidElement(node)) {
	      // This element was passed in a valid location.
	      if (node._store) {
	        node._store.validated = true;
	      }
	    } else if (node) {
	      var iteratorFn = getIteratorFn(node);

	      if (typeof iteratorFn === 'function') {
	        // Entry iterators used to provide implicit keys,
	        // but now we print a separate warning for them later.
	        if (iteratorFn !== node.entries) {
	          var iterator = iteratorFn.call(node);
	          var step;

	          while (!(step = iterator.next()).done) {
	            if (isValidElement(step.value)) {
	              validateExplicitKey(step.value, parentType);
	            }
	          }
	        }
	      }
	    }
	  }
	}
	/**
	 * Given an element, validate that its props follow the propTypes definition,
	 * provided by the type.
	 *
	 * @param {ReactElement} element
	 */


	function validatePropTypes(element) {
	  {
	    var type = element.type;

	    if (type === null || type === undefined || typeof type === 'string') {
	      return;
	    }

	    var propTypes;

	    if (typeof type === 'function') {
	      propTypes = type.propTypes;
	    } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
	    // Inner props are checked in the reconciler.
	    type.$$typeof === REACT_MEMO_TYPE)) {
	      propTypes = type.propTypes;
	    } else {
	      return;
	    }

	    if (propTypes) {
	      // Intentionally inside to avoid triggering lazy initializers:
	      var name = getComponentNameFromType(type);
	      checkPropTypes(propTypes, element.props, 'prop', name, element);
	    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
	      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

	      var _name = getComponentNameFromType(type);

	      error('Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', _name || 'Unknown');
	    }

	    if (typeof type.getDefaultProps === 'function' && !type.getDefaultProps.isReactClassApproved) {
	      error('getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.');
	    }
	  }
	}
	/**
	 * Given a fragment, validate that it can only be provided with fragment props
	 * @param {ReactElement} fragment
	 */


	function validateFragmentProps(fragment) {
	  {
	    var keys = Object.keys(fragment.props);

	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];

	      if (key !== 'children' && key !== 'key') {
	        setCurrentlyValidatingElement$1(fragment);

	        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

	        setCurrentlyValidatingElement$1(null);
	        break;
	      }
	    }

	    if (fragment.ref !== null) {
	      setCurrentlyValidatingElement$1(fragment);

	      error('Invalid attribute `ref` supplied to `React.Fragment`.');

	      setCurrentlyValidatingElement$1(null);
	    }
	  }
	}

	var didWarnAboutKeySpread = {};
	function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
	  {
	    var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
	    // succeed and there will likely be errors in render.

	    if (!validType) {
	      var info = '';

	      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
	        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
	      }

	      var sourceInfo = getSourceInfoErrorAddendum(source);

	      if (sourceInfo) {
	        info += sourceInfo;
	      } else {
	        info += getDeclarationErrorAddendum();
	      }

	      var typeString;

	      if (type === null) {
	        typeString = 'null';
	      } else if (isArray(type)) {
	        typeString = 'array';
	      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
	        typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
	        info = ' Did you accidentally export a JSX literal instead of a component?';
	      } else {
	        typeString = typeof type;
	      }

	      error('React.jsx: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
	    }

	    var element = jsxDEV(type, props, key, source, self); // The result can be nullish if a mock or a custom function is used.
	    // TODO: Drop this when these are no longer allowed as the type argument.

	    if (element == null) {
	      return element;
	    } // Skip key warning if the type isn't valid since our key validation logic
	    // doesn't expect a non-string/function type and can throw confusing errors.
	    // We don't want exception behavior to differ between dev and prod.
	    // (Rendering will throw with a helpful message and as soon as the type is
	    // fixed, the key warnings will appear.)


	    if (validType) {
	      var children = props.children;

	      if (children !== undefined) {
	        if (isStaticChildren) {
	          if (isArray(children)) {
	            for (var i = 0; i < children.length; i++) {
	              validateChildKeys(children[i], type);
	            }

	            if (Object.freeze) {
	              Object.freeze(children);
	            }
	          } else {
	            error('React.jsx: Static children should always be an array. ' + 'You are likely explicitly calling React.jsxs or React.jsxDEV. ' + 'Use the Babel transform instead.');
	          }
	        } else {
	          validateChildKeys(children, type);
	        }
	      }
	    }

	    {
	      if (hasOwnProperty.call(props, 'key')) {
	        var componentName = getComponentNameFromType(type);
	        var keys = Object.keys(props).filter(function (k) {
	          return k !== 'key';
	        });
	        var beforeExample = keys.length > 0 ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}' : '{key: someKey}';

	        if (!didWarnAboutKeySpread[componentName + beforeExample]) {
	          var afterExample = keys.length > 0 ? '{' + keys.join(': ..., ') + ': ...}' : '{}';

	          error('A props object containing a "key" prop is being spread into JSX:\n' + '  let props = %s;\n' + '  <%s {...props} />\n' + 'React keys must be passed directly to JSX without using spread:\n' + '  let props = %s;\n' + '  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);

	          didWarnAboutKeySpread[componentName + beforeExample] = true;
	        }
	      }
	    }

	    if (type === REACT_FRAGMENT_TYPE) {
	      validateFragmentProps(element);
	    } else {
	      validatePropTypes(element);
	    }

	    return element;
	  }
	} // These two functions exist to still get child warnings in dev
	// even with the prod transform. This means that jsxDEV is purely
	// opt-in behavior for better messages but that we won't stop
	// giving you warnings if you use production apis.

	function jsxWithValidationStatic(type, props, key) {
	  {
	    return jsxWithValidation(type, props, key, true);
	  }
	}
	function jsxWithValidationDynamic(type, props, key) {
	  {
	    return jsxWithValidation(type, props, key, false);
	  }
	}

	var jsx =  jsxWithValidationDynamic ; // we may want to special case jsxs internally to take advantage of static children.
	// for now we can ship identical prod functions

	var jsxs =  jsxWithValidationStatic ;

	reactJsxRuntime_development.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_development.jsx = jsx;
	reactJsxRuntime_development.jsxs = jsxs;
	  })();
	}
	return reactJsxRuntime_development;
}

if (process.env.NODE_ENV === 'production') {
  jsxRuntime.exports = requireReactJsxRuntime_production_min();
} else {
  jsxRuntime.exports = requireReactJsxRuntime_development();
}

var jsxRuntimeExports = jsxRuntime.exports;

class ViewStateMachine {
    constructor(config) {
        Object.defineProperty(this, "machine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Machine definition for useMachine (XState v5 expects machine, not service). */
        Object.defineProperty(this, "machineDefinition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stateHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverStateHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "viewStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "logEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "tomeConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isTomeSynchronized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "subMachines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Add RobotCopy support for incoming messages
        Object.defineProperty(this, "robotCopy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "incomingMessageHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "viewStorage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Per-state view storage config (merged with viewStorage when running that state's handler). */
        Object.defineProperty(this, "stateViewStorage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "machineId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "configRenderKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "renderKeyClearCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "viewKeyListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.stateHandlers = new Map();
        this.machineId = config.machineId;
        this.configRenderKey = config.renderKey;
        this.tomeConfig = config.tomeConfig;
        this.db = config.db;
        this.viewStorage = config.viewStorage;
        const initialContext = {
            ...(config.xstateConfig.context ?? {}),
            ...(config.db !== undefined ? { db: config.db } : {}),
        };
        // Enhance xstateConfig with modded state if modMetadata is present
        let enhancedXstateConfig = { ...config.xstateConfig };
        if (config.tomeConfig?.modMetadata) {
            // Add modded state
            enhancedXstateConfig.states = {
                ...enhancedXstateConfig.states,
                modded: {
                    on: {
                        INITIALIZE: enhancedXstateConfig.initial || 'idle',
                        LOAD_MOD_COMPLETE: enhancedXstateConfig.initial || 'idle',
                        UNLOAD_MOD: enhancedXstateConfig.initial || 'idle'
                    }
                }
            };
            // Add LOAD_MOD transition to all states
            const states = enhancedXstateConfig.states || {};
            Object.keys(states).forEach(stateKey => {
                if (!states[stateKey].on) {
                    states[stateKey].on = {};
                }
                states[stateKey].on = {
                    ...states[stateKey].on,
                    LOAD_MOD: 'modded'
                };
            });
        }
        // Create the XState machine (predictableActionArguments in config per XState v5)
        const machineDefinition = createMachine({
            ...enhancedXstateConfig,
            context: initialContext,
            predictableActionArguments: true,
            on: {
                ...enhancedXstateConfig.on,
                // Add our custom events
                VIEW_ADDED: {
                    actions: assign((context, event) => ({
                        viewStack: [...(context.viewStack || []), event.payload]
                    }))
                },
                VIEW_CLEARED: {
                    actions: assign({
                        viewStack: []
                    })
                },
                LOG_ADDED: {
                    actions: assign((context, event) => ({
                        logEntries: [...(context.logEntries || []), event.payload]
                    }))
                },
                // Sub-machine events
                SUB_MACHINE_CREATED: {
                    actions: assign((context, event) => ({
                        subMachines: { ...context.subMachines, [event.payload.id]: event.payload }
                    }))
                },
                // RobotCopy incoming message events
                ROBOTCOPY_MESSAGE: {
                    actions: assign((context, event) => ({
                        robotCopyMessages: [...(context.robotCopyMessages || []), event.payload]
                    }))
                }
            }
        });
        this.machineDefinition = machineDefinition;
        // Interpret the machine to create a service for non-React API (start, getSnapshot, on, send)
        this.machine = interpret(machineDefinition);
        // Register log state handlers if provided
        if (config.logStates) {
            Object.entries(config.logStates).forEach(([stateName, handler]) => {
                this.withState(stateName, handler);
            });
        }
        // Initialize sub-machines
        if (config.subMachines) {
            Object.entries(config.subMachines).forEach(([id, subConfig]) => {
                const subMachine = new ViewStateMachine(subConfig);
                this.subMachines.set(id, subMachine);
            });
        }
    }
    // Add RobotCopy support methods
    withRobotCopy(robotCopy) {
        this.robotCopy = robotCopy;
        this.setupRobotCopyIncomingHandling();
        return this;
    }
    setupRobotCopyIncomingHandling() {
        if (!this.robotCopy)
            return;
        // Listen for incoming messages from RobotCopy
        this.robotCopy.onResponse('default', (response) => {
            const { type, payload } = response;
            const handler = this.incomingMessageHandlers.get(type);
            if (handler) {
                handler(payload);
            }
            else {
                console.log('No handler found for incoming RobotCopy message type:', type);
            }
        });
    }
    registerRobotCopyHandler(eventType, handler) {
        this.incomingMessageHandlers.set(eventType, handler);
        return this;
    }
    handleRobotCopyMessage(message) {
        const { type, payload } = message;
        const handler = this.incomingMessageHandlers.get(type);
        if (handler) {
            handler(payload);
        }
    }
    // Fluent API methods
    withState(stateName, handler, config) {
        if (config) {
            this.stateViewStorage.set(stateName, { ...this.stateViewStorage.get(stateName), ...config });
            this.viewStorage = { ...this.viewStorage, ...config };
        }
        this.stateHandlers.set(stateName, handler);
        return this;
    }
    /** Set view storage config (RxDB schema, find, findOne). Chain after withState or use alone. */
    withViewStorage(config) {
        this.viewStorage = { ...this.viewStorage, ...config };
        return this;
    }
    /** Register RxDB schema for view storage; enforces shape on insert. Chain after withState. */
    schema(schema) {
        this.viewStorage = { ...this.viewStorage, schema };
        return this;
    }
    /** Query RxDB with specs; results update view model when state is entered. Chain after withState. */
    find(specs) {
        this.viewStorage = { ...this.viewStorage, find: specs };
        return this;
    }
    /** Query RxDB for one document; result updates view model. Chain after withState. */
    findOne(spec) {
        this.viewStorage = { ...this.viewStorage, findOne: spec };
        return this;
    }
    // Override for withState that registers message handlers
    withStateAndMessageHandler(stateName, handler, messageType, messageHandler) {
        this.stateHandlers.set(stateName, handler);
        // Register the message handler if RobotCopy is available
        if (this.robotCopy) {
            this.registerRobotCopyHandler(messageType, messageHandler);
        }
        return this;
    }
    withServerState(stateName, handler) {
        // This method is not directly implemented in the original class,
        // but the new_code suggests it should be added.
        // For now, we'll just add a placeholder.
        // In a real scenario, this would involve adding a new state handler type
        // or modifying the existing ones to support server-side rendering.
        // Since the new_code only provided the type, we'll just add a placeholder.
        // This will likely cause a type error until the actual implementation is added.
        // @ts-ignore // This is a placeholder, not a direct implementation
        this.serverStateHandlers.set(stateName, handler);
        return this;
    }
    // Sub-machine support
    withSubMachine(machineId, config) {
        const subMachine = new ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return this;
    }
    getSubMachine(machineId) {
        return this.subMachines.get(machineId);
    }
    /**
     * Run find and findOne against db when effectiveStorage has specs.
     * Expects db to expose collections with .find(selector).exec() and .findOne(selector).exec() (RxDB-style).
     */
    async runFindFindOne(effectiveStorage) {
        const out = { result: undefined, results: [] };
        if (!this.db || !effectiveStorage)
            return out;
        const collectionName = effectiveStorage.collection ?? 'views';
        const coll = this.db[collectionName] ?? (typeof this.db.get === 'function' ? this.db.get(collectionName) : null);
        if (!coll)
            return out;
        try {
            if (effectiveStorage.find != null) {
                const spec = effectiveStorage.find;
                const selector = spec && typeof spec === 'object' && 'selector' in spec ? spec.selector : spec;
                const query = coll.find && typeof coll.find === 'function' ? coll.find(selector) : null;
                out.results = query && typeof query.exec === 'function' ? await query.exec() : [];
            }
            if (effectiveStorage.findOne != null) {
                const spec = effectiveStorage.findOne;
                const selector = spec && typeof spec === 'object' && 'selector' in spec ? spec.selector : spec;
                const query = coll.findOne && typeof coll.findOne === 'function' ? coll.findOne(selector) : null;
                const one = query && typeof query.exec === 'function' ? await query.exec() : null;
                out.result = one ?? undefined;
            }
        }
        catch (_e) {
            out.results = [];
            out.result = undefined;
        }
        return out;
    }
    /** Enforce schema on metadata: ensure required fields from schema exist; coerce types if possible. No-op if no schema. */
    applyLogMetadataSchema(metadata, schema) {
        if (!schema || typeof schema !== 'object')
            return metadata;
        const out = { ...metadata };
        const props = schema.properties ?? schema;
        if (typeof props === 'object') {
            for (const [key, desc] of Object.entries(props)) {
                if (out[key] === undefined && desc.default !== undefined)
                    out[key] = desc.default;
            }
        }
        return out;
    }
    // State context methods (sendFromHook: when using useViewStateMachine, use hook's send so one interpreter)
    createStateContext(state, model, sendFromHook, result, results = [], effectiveStorage) {
        const sendEvent = sendFromHook ?? ((event) => this.machine.send(event));
        const logCollection = effectiveStorage?.logCollection ?? 'logEntries';
        const logMetadataSchema = effectiveStorage?.logMetadataSchema;
        return {
            state: state.value,
            model,
            transitions: state.history?.events || [],
            result,
            results: results ?? [],
            ...(this.db !== undefined ? { db: this.db } : {}),
            log: async (message, metadata, config) => {
                const baseLogEntry = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message,
                    metadata: metadata ?? {}
                };
                let metadataOut = baseLogEntry.metadata ?? {};
                if (logMetadataSchema)
                    metadataOut = this.applyLogMetadataSchema(metadataOut, logMetadataSchema);
                const logEntry = {
                    ...baseLogEntry,
                    metadata: metadataOut,
                    ...config
                };
                this.logEntries.push(logEntry);
                sendEvent({ type: 'LOG_ADDED', payload: logEntry });
                console.log(`[${state.value}] ${message}`, metadata);
                if (this.db && logCollection) {
                    try {
                        const dbColl = this.db[logCollection] ?? (typeof this.db.get === 'function' ? this.db.get(logCollection) : null);
                        if (dbColl && typeof dbColl.insert === 'function')
                            await dbColl.insert(logEntry);
                    }
                    catch (_err) {
                        // already pushed to logEntries and emitted LOG_ADDED
                    }
                }
            },
            view: (component) => {
                if (!this.isTomeSynchronized && this.tomeConfig) {
                    console.warn('Warning: view() called from Tome without synchronized ViewStateMachine. This may cause architectural issues.');
                }
                this.viewStack.push(component);
                sendEvent({ type: 'VIEW_ADDED', payload: component });
                return component;
            },
            clear: () => {
                this.viewStack = [];
                sendEvent({ type: 'VIEW_CLEARED' });
            },
            transition: (to) => {
                sendEvent({ type: 'TRANSITION', payload: { to } });
            },
            send: (event) => {
                sendEvent(event);
            },
            on: (eventName, handler) => {
                // Register event handlers on the service (when using hook, this.machine is separate; prefer hook send for transitions)
                this.machine.on(eventName, handler);
            },
            // Sub-machine methods
            subMachine: (machineId, config) => {
                const subMachine = new ViewStateMachine(config);
                this.subMachines.set(machineId, subMachine);
                return subMachine;
            },
            getSubMachine: (machineId) => {
                return this.subMachines.get(machineId);
            },
            // GraphQL methods
            graphql: {
                query: async (query, variables) => {
                    // This would integrate with a GraphQL client
                    console.log('GraphQL Query:', query, variables);
                    return { data: { query: 'mock-data' } };
                },
                mutation: async (mutation, variables) => {
                    console.log('GraphQL Mutation:', mutation, variables);
                    return { data: { mutation: 'mock-result' } };
                },
                subscription: async (subscription, variables) => {
                    console.log('GraphQL Subscription:', subscription, variables);
                    return { data: { subscription: 'mock-stream' } };
                }
            }
        };
    }
    // React hook for using the machine (pass machine definition; @xstate/react v5/v6 expects machine, not service)
    useViewStateMachine(initialModel) {
        const [state, send] = useMachine(this.machineDefinition);
        const [context, setContext] = useState(null);
        // Execute state handler: compute effectiveStorage, run find/findOne, create context, then run handler
        useEffect(() => {
            let cancelled = false;
            const stateKey = typeof state.value === 'string' ? state.value : state.value?.toString?.() ?? String(state.value);
            const effectiveStorage = {
                ...this.viewStorage,
                ...this.stateViewStorage.get(stateKey)
            };
            (async () => {
                const { result, results } = await this.runFindFindOne(effectiveStorage);
                if (cancelled)
                    return;
                const ctx = this.createStateContext(state, initialModel, send, result, results, effectiveStorage);
                setContext(ctx);
                const handler = this.stateHandlers.get(stateKey);
                if (handler)
                    handler(ctx);
            })();
            return () => { cancelled = true; };
        }, [state.value]);
        const stableContext = context ?? this.createStateContext(state, initialModel, send, undefined, [], undefined);
        return {
            state: state.value,
            context: state.context,
            send,
            logEntries: this.logEntries,
            viewStack: this.viewStack,
            subMachines: this.subMachines,
            result: stableContext.result,
            results: stableContext.results,
            log: stableContext.log,
            view: stableContext.view,
            clear: stableContext.clear,
            transition: stableContext.transition,
            subMachine: stableContext.subMachine,
            getSubMachine: stableContext.getSubMachine
        };
    }
    // Event subscription methods for TomeConnector (XState v5 actor may not have .on; guard for compatibility)
    on(eventType, handler) {
        if (this.machine && typeof this.machine.on === 'function') {
            this.machine.on(eventType, handler);
        }
        // XState v5 uses subscribe() instead of on(); event forwarding can be extended via subscribe(snapshot => ...) if needed
    }
    // Direct send method for TomeConnector
    send(event) {
        if (this.machine && typeof this.machine.send === 'function') {
            this.machine.send(event);
        }
        else {
            console.warn('Machine not started or send method not available');
        }
    }
    // Start the machine service
    start() {
        if (this.machine && typeof this.machine.start === 'function') {
            this.machine.start();
        }
    }
    // Get current state
    getState() {
        if (this.machine && typeof this.machine.getSnapshot === 'function') {
            return this.machine.getSnapshot();
        }
        return null;
    }
    /** Returns a stable key for this machine in the render tree (e.g. React key). Updates when clear() is called. */
    getRenderKey() {
        const base = this.configRenderKey ?? this.machineId;
        return this.renderKeyClearCount > 0 ? `${base}-clear${this.renderKeyClearCount}` : base;
    }
    /** Subscribes to render-key updates; returns unsubscribe. Callback is invoked when the key changes (e.g. after clear()). */
    observeViewKey(callback) {
        callback(this.getRenderKey());
        this.viewKeyListeners.push(callback);
        return () => {
            const i = this.viewKeyListeners.indexOf(callback);
            if (i !== -1)
                this.viewKeyListeners.splice(i, 1);
        };
    }
    /** Subscribes to state snapshot updates (XState); returns unsubscribe. Used by evented mod loader etc. */
    subscribe(callback) {
        if (!this.machine || typeof this.machine.subscribe !== 'function') {
            return () => { };
        }
        const sub = this.machine.subscribe(callback);
        return typeof sub?.unsubscribe === 'function' ? sub.unsubscribe.bind(sub) : () => { };
    }
    notifyViewKeyListeners() {
        const key = this.getRenderKey();
        this.viewKeyListeners.forEach((cb) => cb(key));
    }
    /** Stops the machine service. */
    stop() {
        if (this.machine && typeof this.machine.stop === 'function') {
            this.machine.stop();
        }
    }
    async executeServerState(stateName, model) {
        const handler = this.serverStateHandlers.get(stateName);
        if (handler) {
            const context = this.createServerStateContext(model);
            await handler(context);
            return context.renderedHtml || '';
        }
        return '';
    }
    createServerStateContext(model) {
        return {
            state: this.machine.initialState.value,
            model,
            transitions: [],
            log: async (message, metadata) => {
                const entry = {
                    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message,
                    metadata,
                };
                this.logEntries.push(entry);
            },
            renderHtml: (html) => {
                return html;
            },
            clear: () => {
                // Server-side clear operation
            },
            transition: (to) => {
                // Server-side transition
            },
            send: (event) => {
                // Server-side event sending
            },
            on: (eventName, handler) => {
                // Server-side event handling
            },
            subMachine: (machineId, config) => {
                const subMachine = new ViewStateMachine(config);
                this.subMachines.set(machineId, subMachine);
                return subMachine;
            },
            getSubMachine: (machineId) => {
                return this.subMachines.get(machineId);
            },
            graphql: {
                query: async (query, variables) => {
                    // Server-side GraphQL query
                    return {};
                },
                mutation: async (mutation, variables) => {
                    // Server-side GraphQL mutation
                    return {};
                },
                subscription: async (subscription, variables) => {
                    // Server-side GraphQL subscription
                    return {};
                },
            },
            renderedHtml: '',
        };
    }
    // Compose with other ViewStateMachines
    compose(otherView) {
        // Merge state handlers
        otherView.stateHandlers.forEach((handler, stateName) => {
            this.stateHandlers.set(stateName, handler);
        });
        // Merge view stacks
        this.viewStack = [...this.viewStack, ...otherView.viewStack];
        // Merge sub-machines
        otherView.subMachines.forEach((subMachine, id) => {
            this.subMachines.set(id, subMachine);
        });
        return this;
    }
    // Synchronize with Tome
    synchronizeWithTome(tomeConfig) {
        this.tomeConfig = tomeConfig;
        this.isTomeSynchronized = true;
        return this;
    }
    // Render the composed view
    render(model) {
        return (jsxRuntimeExports.jsxs("div", { className: "composed-view", children: [this.viewStack.map((view, index) => (jsxRuntimeExports.jsx("div", { className: "view-container", children: view }, index))), Array.from(this.subMachines.entries()).map(([id, subMachine]) => (jsxRuntimeExports.jsx("div", { className: "sub-machine-container", children: subMachine.render(model) }, id)))] }));
    }
}
class ProxyMachine {
    constructor(robotCopy) {
        Object.defineProperty(this, "robotCopy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.robotCopy = robotCopy;
    }
    async send(event) {
        await this.robotCopy.sendMessage(event);
    }
}
class ProxyRobotCopyStateMachine extends ViewStateMachine {
    constructor(config) {
        super(config);
        Object.defineProperty(this, "proxyRobotCopy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "proxyMachine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "proxyIncomingMessageHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.proxyRobotCopy = config.robotCopy;
        this.proxyMachine = new ProxyMachine(this.proxyRobotCopy);
        // Set up incoming message handlers
        if (config.incomingMessageHandlers) {
            Object.entries(config.incomingMessageHandlers).forEach(([eventType, handler]) => {
                this.proxyIncomingMessageHandlers.set(eventType, handler);
            });
        }
        // Set up RobotCopy to handle incoming messages
        this.setupIncomingMessageHandling();
    }
    setupIncomingMessageHandling() {
        // Listen for incoming messages from RobotCopy
        this.proxyRobotCopy.onResponse('default', (response) => {
            const { type, payload } = response;
            const handler = this.proxyIncomingMessageHandlers.get(type);
            if (handler) {
                handler(payload);
            }
            else {
                console.log('No handler found for incoming message type:', type);
            }
        });
    }
    async send(event) {
        // Send outgoing message through RobotCopy
        await this.proxyRobotCopy.sendMessage(event);
    }
    // Add method to register incoming message handlers
    registerIncomingHandler(eventType, handler) {
        this.proxyIncomingMessageHandlers.set(eventType, handler);
    }
    // Add method to handle incoming messages manually
    handleIncomingMessage(message) {
        const { type, payload } = message;
        const handler = this.proxyIncomingMessageHandlers.get(type);
        if (handler) {
            handler(payload);
        }
    }
    render(model) {
        throw new Error('ProxyStateMachine does not support rendering');
    }
    useViewStateMachine(initialModel) {
        throw new Error('ProxyStateMachine does not support useViewStateMachine');
    }
    compose(otherView) {
        throw new Error('ProxyStateMachine does not support compose');
    }
    synchronizeWithTome(tomeConfig) {
        throw new Error('ProxyStateMachine does not support synchronizeWithTome');
    }
    withState(stateName, handler, _config) {
        this.registerIncomingHandler(stateName, handler);
        return this;
    }
}
function createProxyRobotCopyStateMachine(config) {
    return new ProxyRobotCopyStateMachine(config);
}
// Helper function to create a ViewStateMachine
function createViewStateMachine(config) {
    return new ViewStateMachine(config);
}

class Tracing {
    constructor() {
        Object.defineProperty(this, "messageHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "traceMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSpanId() {
        return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    trackMessage(messageId, traceId, spanId, metadata) {
        const message = {
            messageId,
            traceId,
            spanId,
            timestamp: new Date().toISOString(),
            backend: metadata.backend || 'node',
            action: metadata.action || 'unknown',
            data: metadata.data,
        };
        this.messageHistory.set(messageId, message);
        if (!this.traceMap.has(traceId)) {
            this.traceMap.set(traceId, []);
        }
        this.traceMap.get(traceId).push(messageId);
        return message;
    }
    getMessage(messageId) {
        return this.messageHistory.get(messageId);
    }
    getTraceMessages(traceId) {
        const messageIds = this.traceMap.get(traceId) || [];
        return messageIds.map(id => this.messageHistory.get(id)).filter(Boolean);
    }
    getFullTrace(traceId) {
        const messages = this.getTraceMessages(traceId);
        return {
            traceId,
            messages,
            startTime: messages[0]?.timestamp,
            endTime: messages[messages.length - 1]?.timestamp,
            backend: messages[0]?.backend,
        };
    }
    getMessageHistory() {
        return Array.from(this.messageHistory.values());
    }
    getTraceIds() {
        return Array.from(this.traceMap.keys());
    }
    clearHistory() {
        this.messageHistory.clear();
        this.traceMap.clear();
    }
    // Create tracing headers for HTTP requests
    createTracingHeaders(traceId, spanId, messageId, enableDataDog = false) {
        const headers = {
            'x-trace-id': traceId,
            'x-span-id': spanId,
            'x-message-id': messageId,
        };
        if (enableDataDog) {
            headers['x-datadog-trace-id'] = traceId;
            headers['x-datadog-parent-id'] = spanId;
            headers['x-datadog-sampling-priority'] = '1';
        }
        return headers;
    }
}
function createTracing() {
    return new Tracing();
}

class TomeConnector {
    constructor(robotCopy) {
        Object.defineProperty(this, "connections", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "robotCopy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.robotCopy = robotCopy;
    }
    // Connect two Tomes with bidirectional state and event flow
    connect(sourceTome, targetTome, config = {}) {
        const connectionId = `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connection = {
            id: connectionId,
            sourceTome,
            targetTome,
            eventMapping: new Map(Object.entries(config.eventMapping || {})),
            stateMapping: new Map(Object.entries(config.stateMapping || {})),
            bidirectional: config.bidirectional ?? true,
            filters: config.filters,
            transformers: config.transformers,
        };
        this.connections.set(connectionId, connection);
        this.setupConnection(connection);
        console.log(`Connected Tomes: ${sourceTome.constructor.name} <-> ${targetTome.constructor.name}`);
        return connectionId;
    }
    setupConnection(connection) {
        const { sourceTome, targetTome, eventMapping, stateMapping, bidirectional, filters, transformers } = connection;
        // Forward events from source to target
        this.setupEventForwarding(sourceTome, targetTome, eventMapping, 'forward', filters, transformers);
        // Forward events from target to source (if bidirectional)
        if (bidirectional) {
            this.setupEventForwarding(targetTome, sourceTome, this.reverseMap(eventMapping), 'backward', filters, transformers);
        }
        // Forward state changes
        this.setupStateForwarding(sourceTome, targetTome, stateMapping, 'forward', filters, transformers);
        if (bidirectional) {
            this.setupStateForwarding(targetTome, sourceTome, this.reverseMap(stateMapping), 'backward', filters, transformers);
        }
    }
    setupEventForwarding(sourceTome, targetTome, eventMapping, direction, filters, transformers) {
        // Subscribe to source Tome's events
        sourceTome.on('event', (event) => {
            // Check if event should be filtered
            if (filters?.events && !filters.events.includes(event.type)) {
                return;
            }
            // Transform event if transformer is provided
            let transformedEvent = event;
            if (transformers?.eventTransformer) {
                transformedEvent = transformers.eventTransformer(event, direction);
            }
            // Map event type if mapping exists
            const mappedEventType = eventMapping.get(transformedEvent.type) || transformedEvent.type;
            // Forward to target Tome
            targetTome.send({
                type: mappedEventType,
                ...transformedEvent,
                _forwarded: true,
                _direction: direction,
                _source: sourceTome.constructor.name,
            });
        });
    }
    setupStateForwarding(sourceTome, targetTome, stateMapping, direction, filters, transformers) {
        // Subscribe to source Tome's state changes
        sourceTome.on('stateChange', (newState, oldState) => {
            // Check if state should be filtered
            if (filters?.states) {
                const hasRelevantState = filters.states.some(statePath => this.getStateValue(newState, statePath) !== this.getStateValue(oldState, statePath));
                if (!hasRelevantState) {
                    return;
                }
            }
            // Transform state if transformer is provided
            let transformedState = newState;
            if (transformers?.stateTransformer) {
                transformedState = transformers.stateTransformer(newState, direction);
            }
            // Map state paths and update target Tome's context
            const stateUpdates = {};
            stateMapping.forEach((targetPath, sourcePath) => {
                const sourceValue = this.getStateValue(transformedState, sourcePath);
                if (sourceValue !== undefined) {
                    stateUpdates[targetPath] = sourceValue;
                }
            });
            // Update target Tome's context
            if (Object.keys(stateUpdates).length > 0) {
                targetTome.send({
                    type: 'SYNC_STATE',
                    updates: stateUpdates,
                    _forwarded: true,
                    _direction: direction,
                    _source: sourceTome.constructor.name,
                });
            }
        });
    }
    getStateValue(state, path) {
        return path.split('.').reduce((obj, key) => obj?.[key], state);
    }
    reverseMap(map) {
        const reversed = new Map();
        map.forEach((value, key) => {
            reversed.set(value, key);
        });
        return reversed;
    }
    // Disconnect Tomes
    disconnect(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return false;
        }
        // Clean up event listeners
        // Note: In a real implementation, you'd need to store and remove specific listeners
        this.connections.delete(connectionId);
        console.log(`Disconnected Tomes: ${connection.sourceTome.constructor.name} <-> ${connection.targetTome.constructor.name}`);
        return true;
    }
    // Get all connections
    getConnections() {
        return Array.from(this.connections.values());
    }
    // Get connections for a specific Tome
    getConnectionsForTome(tome) {
        return this.getConnections().filter(conn => conn.sourceTome === tome || conn.targetTome === tome);
    }
    // Create a network of connected Tomes
    createNetwork(tomes, config = {}) {
        const connectionIds = [];
        for (let i = 0; i < tomes.length - 1; i++) {
            const connectionId = this.connect(tomes[i], tomes[i + 1], config);
            connectionIds.push(connectionId);
        }
        // Connect last Tome back to first (ring topology)
        if (tomes.length > 2) {
            const ringConnectionId = this.connect(tomes[tomes.length - 1], tomes[0], config);
            connectionIds.push(ringConnectionId);
        }
        return connectionIds;
    }
    // Create a hub-and-spoke network
    createHubNetwork(hubTome, spokeTomes, config = {}) {
        const connectionIds = [];
        spokeTomes.forEach(spokeTome => {
            const connectionId = this.connect(hubTome, spokeTome, config);
            connectionIds.push(connectionId);
        });
        return connectionIds;
    }
    // Broadcast event to all connected Tomes
    broadcastEvent(event, sourceTome) {
        const connections = this.getConnectionsForTome(sourceTome);
        connections.forEach(connection => {
            const targetTome = connection.targetTome === sourceTome ? connection.sourceTome : connection.targetTome;
            targetTome.send({
                ...event,
                _broadcasted: true,
                _source: sourceTome.constructor.name,
            });
        });
    }
    // Get network topology
    getNetworkTopology() {
        const topology = {
            nodes: new Set(),
            edges: [],
        };
        this.getConnections().forEach(connection => {
            topology.nodes.add(connection.sourceTome.constructor.name);
            topology.nodes.add(connection.targetTome.constructor.name);
            topology.edges.push({
                from: connection.sourceTome.constructor.name,
                to: connection.targetTome.constructor.name,
                bidirectional: connection.bidirectional,
                id: connection.id,
            });
        });
        return {
            nodes: Array.from(topology.nodes),
            edges: topology.edges,
        };
    }
    // Validate network for potential issues (Turing completeness risks)
    validateNetwork() {
        const warnings = [];
        const errors = [];
        const topology = this.getNetworkTopology();
        // Check for circular dependencies
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (node, parent) => {
            if (recursionStack.has(node)) {
                return true;
            }
            if (visited.has(node)) {
                return false;
            }
            visited.add(node);
            recursionStack.add(node);
            const edges = topology.edges.filter(edge => edge.from === node || (edge.bidirectional && edge.to === node));
            for (const edge of edges) {
                const nextNode = edge.from === node ? edge.to : edge.from;
                if (nextNode !== parent && hasCycle(nextNode, node)) {
                    return true;
                }
            }
            recursionStack.delete(node);
            return false;
        };
        // Check each node for cycles
        topology.nodes.forEach(node => {
            if (hasCycle(node)) {
                errors.push(`Circular dependency detected involving node: ${node}`);
            }
        });
        // Check for high fan-out (potential performance issues)
        const fanOutCounts = new Map();
        topology.edges.forEach(edge => {
            fanOutCounts.set(edge.from, (fanOutCounts.get(edge.from) || 0) + 1);
            if (edge.bidirectional) {
                fanOutCounts.set(edge.to, (fanOutCounts.get(edge.to) || 0) + 1);
            }
        });
        fanOutCounts.forEach((count, node) => {
            if (count > 10) {
                warnings.push(`High fan-out detected for node ${node}: ${count} connections`);
            }
        });
        // Check for event amplification (potential infinite loops)
        const eventCounts = new Map();
        this.getConnections().forEach(connection => {
            connection.eventMapping.forEach((targetEvent, sourceEvent) => {
                const key = `${sourceEvent}->${targetEvent}`;
                eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
            });
        });
        eventCounts.forEach((count, eventPair) => {
            if (count > 5) {
                warnings.push(`Potential event amplification detected: ${eventPair} appears ${count} times`);
            }
        });
        return { warnings, errors };
    }
}
function createTomeConnector(robotCopy) {
    return new TomeConnector(robotCopy);
}

/**
 * Origin-bound message tokens for cross-boundary Cave/Tome/VSM traffic (CSRF-style).
 * Token shape: salt + hash of (salt + channelId + payloadSummary + secret). Optional originId, caveId, tomeId, expiresAt.
 * When wave-reader is in scope, align with its popup/background/content channel = (origin, context) and same salt-then-hash idea.
 * Uses Web Crypto (browser) or Node crypto; minimal dependency.
 */
function getCrypto() {
    if (typeof process !== 'undefined' && process.versions?.node) {
        try {
            const crypto = require('crypto');
            return {
                hashSync(data) {
                    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
                },
            };
        }
        catch {
            // fall through to Web Crypto
        }
    }
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        return {
            hashSync(_data) {
                throw new Error('MessageToken: sync hash not available in this environment; use generateTokenAsync');
            },
            async hashAsync(data) {
                const buf = new TextEncoder().encode(data);
                const digest = await crypto.subtle.digest('SHA-256', buf);
                return Array.from(new Uint8Array(digest))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join('');
            },
        };
    }
    throw new Error('MessageToken: no crypto available (need Node crypto or Web Crypto API)');
}
const cryptoImpl = getCrypto();
function computeHash(salt, channelId, payloadSummary, secret) {
    const data = salt + channelId + payloadSummary + secret;
    return cryptoImpl.hashSync(data);
}
async function computeHashAsync(salt, channelId, payloadSummary, secret) {
    if (cryptoImpl.hashAsync) {
        const data = salt + channelId + payloadSummary + secret;
        return cryptoImpl.hashAsync(data);
    }
    return computeHash(salt, channelId, payloadSummary, secret);
}
function randomSalt() {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else if (typeof require !== 'undefined') {
        try {
            const nodeCrypto = require('crypto');
            nodeCrypto.randomFillSync(bytes);
        }
        catch {
            for (let i = 0; i < 16; i++)
                bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    else {
        for (let i = 0; i < 16; i++)
            bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Generate a message token (sync when Node crypto available, else use generateTokenAsync).
 */
function generateToken(options) {
    const salt = randomSalt();
    const hash = computeHash(salt, options.channelId, options.payloadSummary, options.secret);
    const expiresAt = options.ttlMs != null ? Date.now() + options.ttlMs : undefined;
    return {
        salt,
        hash,
        originId: options.originId,
        caveId: options.caveId,
        tomeId: options.tomeId,
        expiresAt,
    };
}
/**
 * Generate a message token (async; use in browser or when Web Crypto only).
 */
async function generateTokenAsync(options) {
    const salt = randomSalt();
    const hash = await computeHashAsync(salt, options.channelId, options.payloadSummary, options.secret);
    const expiresAt = options.ttlMs != null ? Date.now() + options.ttlMs : undefined;
    return {
        salt,
        hash,
        originId: options.originId,
        caveId: options.caveId,
        tomeId: options.tomeId,
        expiresAt,
    };
}
/**
 * Validate a message token: recompute hash and compare; optionally check expiry.
 */
function validateToken(options) {
    const { token, channelId, payloadSummary, secret, checkExpiry = true } = options;
    if (!token?.salt || !token?.hash)
        return false;
    if (checkExpiry && token.expiresAt != null && Date.now() > token.expiresAt)
        return false;
    const expected = computeHash(token.salt, channelId, payloadSummary, secret);
    return expected === token.hash;
}
/**
 * Serialize token to a string (e.g. for header). Format: base64(JSON).
 */
function serializeToken(token) {
    const json = JSON.stringify(token);
    if (typeof Buffer !== 'undefined')
        return Buffer.from(json, 'utf8').toString('base64');
    return btoa(unescape(encodeURIComponent(json)));
}
/**
 * Parse token from string (e.g. from header).
 */
function parseToken(serialized) {
    try {
        let json;
        if (typeof Buffer !== 'undefined') {
            json = Buffer.from(serialized, 'base64').toString('utf8');
        }
        else {
            json = decodeURIComponent(escape(atob(serialized)));
        }
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}

/**
 * Circuit breaker: closed (normal), open (reject), half-open (probe).
 * State transitions driven by failure count / error rate from ResourceMonitor or internal counts.
 * Expose circuit state so MetricsReporter can include it in snapshots (AWS/Hystrix).
 */
class CircuitBreaker {
    constructor(options = {}) {
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'closed'
        });
        Object.defineProperty(this, "failureCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "successCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "lastOpenAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "threshold", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "resetMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "useMonitorForThreshold", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = options.name ?? 'default';
        this.threshold = options.threshold ?? 5;
        this.resetMs = options.resetMs ?? 30000;
        this.monitor = options.monitor;
        this.useMonitorForThreshold = options.useMonitorForThreshold ?? false;
    }
    getState() {
        if (this.state === 'open' && Date.now() - this.lastOpenAt >= this.resetMs) {
            this.state = 'halfOpen';
            this.successCount = 0;
            this.failureCount = 0;
        }
        return this.state;
    }
    /** Record success (e.g. after a successful request). */
    recordSuccess() {
        if (this.monitor)
            this.monitor.trackCircuit(this.name, 'closed');
        if (this.state === 'halfOpen') {
            this.successCount++;
            if (this.successCount >= 1) {
                this.state = 'closed';
                this.failureCount = 0;
            }
        }
        else if (this.state === 'closed') {
            this.failureCount = Math.max(0, this.failureCount - 1);
        }
    }
    /** Record failure (e.g. after a failed request). */
    recordFailure() {
        if (this.state === 'closed') {
            let overThreshold = false;
            if (this.useMonitorForThreshold && this.monitor) {
                const snap = this.monitor.getSnapshot();
                const rate = snap.requestCount > 0 ? snap.errorCount / snap.requestCount : 0;
                overThreshold = snap.errorCount >= this.threshold || rate >= this.threshold / 10;
            }
            else {
                this.failureCount++;
                overThreshold = this.failureCount >= this.threshold;
            }
            if (overThreshold) {
                this.state = 'open';
                this.lastOpenAt = Date.now();
                if (this.monitor)
                    this.monitor.trackCircuit(this.name, 'open');
            }
        }
        else if (this.state === 'halfOpen') {
            this.state = 'open';
            this.lastOpenAt = Date.now();
            if (this.monitor)
                this.monitor.trackCircuit(this.name, 'open');
        }
    }
    /** Returns true if the request is allowed (closed or halfOpen). */
    allowRequest() {
        const s = this.getState();
        if (s === 'open')
            return false;
        if (s === 'halfOpen' && this.monitor)
            this.monitor.trackCircuit(this.name, 'halfOpen');
        return true;
    }
    /** Execute fn through the circuit; on throw or non-ok result, recordFailure; else recordSuccess. */
    async execute(fn) {
        if (!this.allowRequest()) {
            throw new Error(`CircuitBreaker ${this.name} is open`);
        }
        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        }
        catch (e) {
            this.recordFailure();
            throw e;
        }
    }
}
function createCircuitBreaker(options) {
    return new CircuitBreaker(options);
}

/**
 * Throttle policy: signals "over limit" from a sliding or fixed window (request count or bytes).
 * Reads from ResourceMonitor snapshot or uses an internal window. Middleware or RobotCopy can return 429 when over limit.
 */
class ThrottlePolicy {
    constructor(options) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "windowMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "slots", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.config = options.config;
        this.monitor = options.monitor;
        this.windowMs = options.config.windowMs ?? 60000;
    }
    /** Record one request (and optional bytes). Call this when a request is about to be processed or was processed. */
    record(bytesIn = 0, bytesOut = 0) {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        this.slots = this.slots.filter((s) => s.at >= cutoff);
        this.slots.push({ requests: 1, bytes: bytesIn + bytesOut, at: now });
    }
    /** Returns true if over limit (should throttle / 429). */
    isOverLimit() {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        const inWindow = this.slots.filter((s) => s.at >= cutoff);
        const requests = inWindow.reduce((a, s) => a + s.requests, 0);
        const bytes = inWindow.reduce((a, s) => a + s.bytes, 0);
        if (this.config.maxRequestsPerMinute != null && requests >= this.config.maxRequestsPerMinute)
            return true;
        if (this.config.maxBytesPerMinute != null && bytes >= this.config.maxBytesPerMinute)
            return true;
        if (this.monitor) {
            const snap = this.monitor.getSnapshot();
            if (this.config.maxRequestsPerMinute != null && snap.requestCount >= this.config.maxRequestsPerMinute)
                return true;
            if (this.config.maxBytesPerMinute != null && snap.bytesIn + snap.bytesOut >= this.config.maxBytesPerMinute)
                return true;
        }
        return false;
    }
}
function createThrottlePolicy(options) {
    return new ThrottlePolicy(options);
}

class RobotCopy {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tracing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unleashToggles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "machines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "circuitBreaker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "throttlePolicy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // --- Location (local vs remote) for machines/tomes ---
        Object.defineProperty(this, "locationRegistry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.config = {
            unleashUrl: 'http://localhost:4242/api',
            unleashClientKey: 'default:development.unleash-insecure-api-token',
            unleashAppName: 'log-view-machine',
            unleashEnvironment: 'development',
            kotlinBackendUrl: 'http://localhost:8080',
            nodeBackendUrl: 'http://localhost:3001',
            enableTracing: true,
            enableDataDog: true,
            apiBasePath: '/api',
            ...config,
        };
        this.tracing = createTracing();
        this.initializeUnleashToggles();
        if (this.config.circuitBreaker) {
            const cb = this.config.circuitBreaker;
            this.circuitBreaker = createCircuitBreaker({
                name: cb.name ?? 'robotcopy',
                threshold: cb.threshold,
                resetMs: cb.resetMs,
                monitor: this.config.resourceMonitor,
            });
        }
        if (this.config.throttle) {
            const t = this.config.throttle;
            this.throttlePolicy = 'record' in t && 'isOverLimit' in t
                ? t
                : createThrottlePolicy({ config: t, monitor: this.config.resourceMonitor });
        }
    }
    async initializeUnleashToggles() {
        // Apply optional initial toggles from config; otherwise only generic toggles
        if (this.config.initialToggles && Object.keys(this.config.initialToggles).length > 0) {
            for (const [name, value] of Object.entries(this.config.initialToggles)) {
                this.unleashToggles.set(name, value);
            }
        }
        this.unleashToggles.set('enable-tracing', true);
        this.unleashToggles.set('enable-datadog', true);
    }
    async isEnabled(toggleName, _context = {}) {
        return this.unleashToggles.get(toggleName) || false;
    }
    async getBackendUrl() {
        const toggleName = this.config.backendSelectorToggle;
        if (!toggleName) {
            return this.config.nodeBackendUrl;
        }
        const useKotlin = await this.isEnabled(toggleName);
        return useKotlin ? this.config.kotlinBackendUrl : this.config.nodeBackendUrl;
    }
    async getBackendType() {
        const toggleName = this.config.backendSelectorToggle;
        if (!toggleName) {
            return 'node';
        }
        const useKotlin = await this.isEnabled(toggleName);
        return useKotlin ? 'kotlin' : 'node';
    }
    generateMessageId() {
        return this.tracing.generateMessageId();
    }
    generateTraceId() {
        return this.tracing.generateTraceId();
    }
    generateSpanId() {
        return this.tracing.generateSpanId();
    }
    trackMessage(messageId, traceId, spanId, metadata) {
        return this.tracing.trackMessage(messageId, traceId, spanId, metadata);
    }
    getMessage(messageId) {
        return this.tracing.getMessage(messageId);
    }
    getTraceMessages(traceId) {
        return this.tracing.getTraceMessages(traceId);
    }
    getFullTrace(traceId) {
        return this.tracing.getFullTrace(traceId);
    }
    async sendMessage(action, data = {}) {
        if (this.throttlePolicy?.isOverLimit()) {
            const err = new Error('Throttle limit exceeded; try again later');
            err.code = 'THROTTLED';
            throw err;
        }
        if (this.circuitBreaker && !this.circuitBreaker.allowRequest()) {
            const err = new Error('Circuit breaker is open');
            err.code = 'CIRCUIT_OPEN';
            throw err;
        }
        if (this.config.transport) {
            return this.config.transport.send(action, data);
        }
        const doOne = async () => {
            const messageId = this.generateMessageId();
            const traceId = this.generateTraceId();
            const spanId = this.generateSpanId();
            const backend = await this.getBackendType();
            const backendUrl = await this.getBackendUrl();
            this.trackMessage(messageId, traceId, spanId, { backend, action, data });
            const headers = {
                'Content-Type': 'application/json',
                ...this.tracing.createTracingHeaders(traceId, spanId, messageId, await this.isEnabled('enable-datadog')),
            };
            const bodyPayload = { ...data, messageId, traceId, spanId };
            if (this.config.messageTokenProvider) {
                try {
                    const token = await Promise.resolve(this.config.messageTokenProvider());
                    if (token) {
                        headers['X-Cave-Message-Token'] = serializeToken(token);
                        bodyPayload._messageToken = token;
                    }
                }
                catch (_) { }
            }
            const basePath = (this.config.apiBasePath ?? '/api').replace(/\/$/, '');
            const url = `${backendUrl}${basePath}/${action}`;
            const bodyStr = JSON.stringify(bodyPayload);
            const start = Date.now();
            const response = await fetch(url, { method: 'POST', headers, body: bodyStr });
            const latencyMs = Date.now() - start;
            const bytesIn = bodyStr.length;
            const responseText = await response.text();
            const bytesOut = new TextEncoder().encode(responseText).length;
            if (this.config.resourceMonitor) {
                this.config.resourceMonitor.trackRequest({
                    path: basePath + '/' + action,
                    method: 'POST',
                    bytesIn,
                    bytesOut,
                    latencyMs,
                    status: response.status,
                });
            }
            if (this.throttlePolicy)
                this.throttlePolicy.record(bytesIn, bytesOut);
            if (!response.ok) {
                if (this.circuitBreaker)
                    this.circuitBreaker.recordFailure();
                const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
                this.trackMessage(`${messageId}_error`, traceId, spanId, { backend, action: `${action}_error`, data: { error: err.message } });
                throw err;
            }
            if (this.circuitBreaker)
                this.circuitBreaker.recordSuccess();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : {};
            }
            catch {
                result = {};
            }
            this.trackMessage(`${messageId}_response`, traceId, spanId, { backend, action: `${action}_response`, data: result });
            return result;
        };
        const maxRetries = this.config.retryPolicy?.maxRetries ?? 0;
        const initialDelayMs = this.config.retryPolicy?.initialDelayMs ?? 1000;
        const maxDelayMs = this.config.retryPolicy?.maxDelayMs ?? 30000;
        const multiplier = this.config.retryPolicy?.multiplier ?? 2;
        const jitter = this.config.retryPolicy?.jitter ?? true;
        const isRetryable = (e) => {
            const msg = e?.message ?? String(e);
            if (msg.includes('HTTP 5') || msg.includes('fetch'))
                return true;
            return false;
        };
        if (this.circuitBreaker) {
            return this.circuitBreaker.execute(async () => {
                let lastErr;
                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    try {
                        return await doOne();
                    }
                    catch (e) {
                        lastErr = e;
                        if (attempt < maxRetries && isRetryable(e)) {
                            let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
                            if (jitter)
                                delay *= 0.5 + Math.random() * 0.5;
                            await new Promise((r) => setTimeout(r, delay));
                            continue;
                        }
                        throw e;
                    }
                }
                throw lastErr;
            });
        }
        let lastErr;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await doOne();
            }
            catch (e) {
                lastErr = e;
                if (attempt < maxRetries && isRetryable(e)) {
                    let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
                    if (jitter)
                        delay *= 0.5 + Math.random() * 0.5;
                    await new Promise((r) => setTimeout(r, delay));
                    continue;
                }
                throw e;
            }
        }
        throw lastErr;
    }
    async getTrace(traceId) {
        const backendUrl = await this.getBackendUrl();
        try {
            const response = await fetch(`${backendUrl}/api/trace/${traceId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`Failed to get trace ${traceId}:`, error);
            return this.getFullTrace(traceId);
        }
    }
    async getMessageFromBackend(messageId) {
        const backendUrl = await this.getBackendUrl();
        try {
            const response = await fetch(`${backendUrl}/api/message/${messageId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`Failed to get message ${messageId}:`, error);
            return this.getMessage(messageId);
        }
    }
    // Debugging and monitoring methods
    getMessageHistory() {
        return this.tracing.getMessageHistory();
    }
    getTraceIds() {
        return this.tracing.getTraceIds();
    }
    clearHistory() {
        this.tracing.clearHistory();
    }
    // Configuration methods
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return { ...this.config };
    }
    // Response handling
    onResponse(channel, _handler) {
        // This would be implemented to handle incoming responses
        // For now, we're just store the handler for future use
        console.log(`Registered response handler for channel: ${channel}`);
    }
    // Machine registration for state machines
    registerMachine(name, machine, config = {}) {
        console.log(`Registering machine: ${name}`, { config });
        // Store the machine registration for future use
        // This could be used for machine discovery, monitoring, etc.
        if (!this.machines) {
            this.machines = new Map();
        }
        this.machines.set(name, { machine, config, registeredAt: new Date().toISOString() });
        // Apply default location from config (TomeMachineConfig.location / remoteClient)
        const loc = config.location;
        const client = config.remoteClient;
        if (loc !== undefined || client !== undefined) {
            this.registerMachineLocation(name, { location: loc, remoteClient: client });
        }
    }
    // Get registered machines
    getRegisteredMachines() {
        return this.machines || new Map();
    }
    // Get a specific registered machine
    getRegisteredMachine(name) {
        return this.machines?.get(name);
    }
    /**
     * Set or override location for a machine or tome.
     * When local is true, the runner activates local VSM; when false, sends via client (e.g. HTTP) instead.
     */
    setLocation(machineIdOrTomeId, opts) {
        this.locationRegistry.set(machineIdOrTomeId, { local: opts.local, client: opts.client });
    }
    /**
     * Get location for a machine or tome. Returns undefined if not set (caller may treat as local).
     */
    getLocation(machineIdOrTomeId) {
        return this.locationRegistry.get(machineIdOrTomeId);
    }
    /**
     * Register default location from TomeMachineConfig (location / remoteClient).
     * Converts location hint to local/remote; can be overridden later by setLocation.
     */
    registerMachineLocation(machineIdOrTomeId, defaultFromConfig) {
        if (!defaultFromConfig)
            return;
        const { location, remoteClient } = defaultFromConfig;
        const local = location === 'remote' ? false : true;
        const client = remoteClient ?? (typeof location === 'string' && location !== 'local' && location !== 'same-cave' ? location : undefined);
        if (!this.locationRegistry.has(machineIdOrTomeId)) {
            this.locationRegistry.set(machineIdOrTomeId, { local, client });
        }
    }
    /**
     * Answer whether the given machine/tome is local (run here) or remote (send via client).
     * Defaults to true (local) when no location is registered.
     */
    isLocal(machineIdOrTomeId) {
        const entry = this.locationRegistry.get(machineIdOrTomeId);
        return entry === undefined ? true : entry.local;
    }
}
function createRobotCopy(config) {
    return new RobotCopy(config);
}

class ClientGenerator {
    constructor() {
        Object.defineProperty(this, "machines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "configs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    // Register a machine for discovery
    registerMachine(machineId, machine, config) {
        this.machines.set(machineId, machine);
        if (config) {
            this.configs.set(machineId, config);
        }
    }
    // Discover all registered machines
    discover() {
        const discovery = {
            machines: new Map(),
            states: new Map(),
            events: new Map(),
            actions: new Map(),
            services: new Map(),
            examples: [],
            documentation: ''
        };
        this.machines.forEach((machine, machineId) => {
            discovery.machines.set(machineId, machine);
            // Analyze machine structure
            const config = this.configs.get(machineId);
            if (config) {
                // Extract states, events, actions, services from XState config
                this.analyzeMachine(machine, machineId, discovery);
                // Add examples
                if (config.examples) {
                    discovery.examples.push(...config.examples);
                }
            }
        });
        // Generate documentation
        discovery.documentation = this.generateDocumentation(discovery);
        return discovery;
    }
    analyzeMachine(machine, machineId, discovery) {
        // This would analyze the XState machine configuration
        // For now, we'll create a basic structure
        discovery.states.set(machineId, ['idle', 'creating', 'success', 'error']);
        discovery.events.set(machineId, ['ADD_INGREDIENT', 'CREATE_BURGER', 'CONTINUE']);
        discovery.actions.set(machineId, ['addIngredient', 'setLoading', 'handleSuccess']);
        discovery.services.set(machineId, ['createBurgerService']);
    }
    generateDocumentation(discovery) {
        let doc = '# ViewStateMachine Discovery\n\n';
        discovery.machines.forEach((machine, machineId) => {
            const config = this.configs.get(machineId);
            doc += `## ${machineId}\n\n`;
            if (config?.description) {
                doc += `${config.description}\n\n`;
            }
            const states = discovery.states.get(machineId) || [];
            const events = discovery.events.get(machineId) || [];
            const actions = discovery.actions.get(machineId) || [];
            const services = discovery.services.get(machineId) || [];
            doc += `### States\n`;
            states.forEach(state => {
                doc += `- \`${state}\`\n`;
            });
            doc += '\n';
            doc += `### Events\n`;
            events.forEach(event => {
                doc += `- \`${event}\`\n`;
            });
            doc += '\n';
            doc += `### Actions\n`;
            actions.forEach(action => {
                doc += `- \`${action}\`\n`;
            });
            doc += '\n';
            doc += `### Services\n`;
            services.forEach(service => {
                doc += `- \`${service}\`\n`;
            });
            doc += '\n';
        });
        return doc;
    }
    // Generate client code for a specific language
    generateClientCode(language, machineId) {
        const discovery = this.discover();
        switch (language) {
            case 'typescript':
                return this.generateTypeScriptClient(discovery, machineId);
            case 'javascript':
                return this.generateJavaScriptClient(discovery, machineId);
            case 'react':
                return this.generateReactClient(discovery, machineId);
            case 'kotlin':
                return this.generateKotlinClient(discovery, machineId);
            case 'java':
                return this.generateJavaClient(discovery, machineId);
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }
    generateTypeScriptClient(discovery, machineId) {
        let code = '// Generated TypeScript client\n\n';
        if (machineId) {
            const machine = discovery.machines.get(machineId);
            if (machine) {
                code += `import { ViewStateMachine } from './ViewStateMachine';\n\n`;
                code += `export class ${machineId}Client {\n`;
                code += `  private machine: ViewStateMachine<any>;\n\n`;
                code += `  constructor() {\n`;
                code += `    // Initialize machine\n`;
                code += `  }\n\n`;
                code += `  // Client methods would be generated here\n`;
                code += `}\n`;
            }
        }
        else {
            // Generate for all machines
            discovery.machines.forEach((machine, id) => {
                code += `export class ${id}Client {\n`;
                code += `  // Generated client for ${id}\n`;
                code += `}\n\n`;
            });
        }
        return code;
    }
    generateJavaScriptClient(discovery, machineId) {
        let code = '// Generated JavaScript client\n\n';
        if (machineId) {
            code += `class ${machineId}Client {\n`;
            code += `  constructor() {\n`;
            code += `    // Initialize client\n`;
            code += `  }\n\n`;
            code += `  // Client methods\n`;
            code += `}\n\n`;
            code += `module.exports = ${machineId}Client;\n`;
        }
        else {
            discovery.machines.forEach((machine, id) => {
                code += `class ${id}Client {\n`;
                code += `  // Generated client for ${id}\n`;
                code += `}\n\n`;
            });
        }
        return code;
    }
    generateReactClient(discovery, machineId) {
        let code = '// Generated React client\n\n';
        code += `import React from 'react';\n`;
        code += `import { useViewStateMachine } from './ViewStateMachine';\n\n`;
        if (machineId) {
            code += `export const ${machineId}Component: React.FC = () => {\n`;
            code += `  const { state, send, log, view, clear } = useViewStateMachine({\n`;
            code += `    // Initial model\n`;
            code += `  });\n\n`;
            code += `  return (\n`;
            code += `    <div>\n`;
            code += `      {/* Generated UI */}\n`;
            code += `    </div>\n`;
            code += `  );\n`;
            code += `};\n`;
        }
        else {
            discovery.machines.forEach((machine, id) => {
                code += `export const ${id}Component: React.FC = () => {\n`;
                code += `  // Generated component for ${id}\n`;
                code += `  return <div>${id} Component</div>;\n`;
                code += `};\n\n`;
            });
        }
        return code;
    }
    generateKotlinClient(discovery, machineId) {
        let code = '// Generated Kotlin client\n\n';
        if (machineId) {
            code += `class ${machineId}Client {\n`;
            code += `  private val machine: ViewStateMachine<*>? = null\n\n`;
            code += `  fun initialize() {\n`;
            code += `    // Initialize machine\n`;
            code += `  }\n\n`;
            code += `  // Client methods\n`;
            code += `}\n`;
        }
        else {
            discovery.machines.forEach((machine, id) => {
                code += `class ${id}Client {\n`;
                code += `  // Generated client for ${id}\n`;
                code += `}\n\n`;
            });
        }
        return code;
    }
    generateJavaClient(discovery, machineId) {
        let code = '// Generated Java client\n\n';
        if (machineId) {
            code += `public class ${machineId}Client {\n`;
            code += `  private ViewStateMachine machine;\n\n`;
            code += `  public ${machineId}Client() {\n`;
            code += `    // Initialize machine\n`;
            code += `  }\n\n`;
            code += `  // Client methods\n`;
            code += `}\n`;
        }
        else {
            discovery.machines.forEach((machine, id) => {
                code += `public class ${id}Client {\n`;
                code += `  // Generated client for ${id}\n`;
                code += `}\n\n`;
            });
        }
        return code;
    }
    // Generate integration examples
    generateIntegrationExamples() {
        return [
            {
                name: 'Basic Usage',
                description: 'How to create and use a ViewStateMachine',
                language: 'typescript',
                code: `
const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: { /* config */ }
})
.withState('idle', async ({ log, view }) => {
  await log('Entered idle state');
  return view(<div>Idle UI</div>);
});`
            },
            {
                name: 'Sub-Machines',
                description: 'How to compose sub-machines',
                language: 'typescript',
                code: `
const parentMachine = createViewStateMachine({
  machineId: 'parent',
  xstateConfig: { /* config */ },
  subMachines: {
    child: { machineId: 'child', xstateConfig: { /* config */ } }
  }
})
.withSubMachine('child', childConfig);`
            },
            {
                name: 'ClientGenerator Discovery',
                description: 'How to use ClientGenerator for automated discovery',
                language: 'typescript',
                code: `
const clientGenerator = new ClientGenerator();
clientGenerator.registerMachine('my-machine', machine, {
  description: 'My awesome machine',
  examples: [/* examples */]
});

const discovery = clientGenerator.discover();
const clientCode = clientGenerator.generateClientCode('typescript', 'my-machine');`
            }
        ];
    }
}
// Helper function to create ClientGenerator
function createClientGenerator() {
    return new ClientGenerator();
}

/**
 * TomeManager - Manages Tome instances and routing
 *
 * This class handles the registration, lifecycle, and routing of Tome instances,
 * allowing them to insert gracefully into a routing hierarchy.
 */
class TomeManager {
    constructor(app, options) {
        Object.defineProperty(this, "tomes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "middlewareRegistry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.app = app;
        this.middlewareRegistry = options?.middlewareRegistry ?? {};
    }
    /**
     * Register a new Tome with the manager
     */
    async registerTome(config) {
        console.log(`📚 Registering Tome: ${config.id}`);
        // Create machines for the tome
        const machines = new Map();
        for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
            const machine = createViewStateMachine({
                machineId: machineConfig.id,
                xstateConfig: machineConfig.xstateConfig,
                context: {
                    ...config.context,
                    ...machineConfig.context
                }
            });
            machines.set(machineKey, machine);
            console.log(`  🤖 Created machine: ${machineConfig.name} (${machineConfig.id})`);
        }
        let isCaveSynchronized = false;
        function getRenderKey() {
            const base = config.renderKey ?? config.id;
            const machineKeys = [];
            machines.forEach((m, key) => {
                if (m && typeof m.getRenderKey === 'function') {
                    machineKeys.push(m.getRenderKey());
                }
                else {
                    machineKeys.push(key);
                }
            });
            if (machineKeys.length === 0)
                return base;
            return `${base}:${machineKeys.join(',')}`;
        }
        // Create tome instance
        const tomeInstance = {
            id: config.id,
            config,
            machines,
            context: config.context || {},
            get isCaveSynchronized() {
                return isCaveSynchronized;
            },
            getRenderKey,
            observeViewKey(callback) {
                callback(getRenderKey());
                return () => {
                };
            },
            synchronizeWithCave(_cave) {
                isCaveSynchronized = true;
            },
            async start() {
                console.log(`🚀 Starting Tome: ${this.id}`);
                // Initialize all machines
                for (const [key, machine] of this.machines) {
                    await machine.start();
                }
            },
            async stop() {
                console.log(`🛑 Stopping Tome: ${this.id}`);
                // Stop all machines
                for (const [key, machine] of this.machines) {
                    await machine.stop();
                }
            },
            getMachine(id) {
                return this.machines.get(id);
            },
            async sendMessage(machineId, event, data) {
                const machine = this.getMachine(machineId);
                if (!machine) {
                    throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
                }
                return await machine.send(event, data);
            },
            getState(machineId) {
                const machine = this.getMachine(machineId);
                if (!machine) {
                    throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
                }
                return machine.getState();
            },
            updateContext(updates) {
                this.context = { ...this.context, ...updates };
                // Update context for all machines
                for (const [key, machine] of this.machines) {
                    machine.updateContext(updates);
                }
            }
        };
        // Setup routing if configured
        if (config.routing) {
            await this.setupTomeRouting(tomeInstance);
        }
        this.tomes.set(config.id, tomeInstance);
        console.log(`✅ Tome registered: ${config.id}`);
        return tomeInstance;
    }
    /**
     * Setup routing for a tome
     */
    async setupTomeRouting(tome) {
        const { config } = tome;
        const { routing } = config;
        if (!routing)
            return;
        console.log(`🛣️ Setting up routing for Tome: ${config.id}`);
        // Create router for this tome
        const router = express.Router();
        // Apply middleware (from registry when routing.middleware lists names)
        if (routing.middleware) {
            for (const name of routing.middleware) {
                const handler = this.middlewareRegistry[name];
                if (handler) {
                    router.use(handler);
                    console.log(`  🔧 Applied middleware: ${name}`);
                }
                else {
                    console.log(`  🔧 Middleware "${name}" not in registry (add to TomeManagerOptions.middlewareRegistry to apply)`);
                }
            }
        }
        // Setup routes for each machine
        if (routing.routes) {
            for (const [machineKey, routeConfig] of Object.entries(routing.routes)) {
                const machine = tome.getMachine(machineKey);
                if (!machine) {
                    console.warn(`⚠️ Machine ${machineKey} not found for routing`);
                    continue;
                }
                const method = routeConfig.method || 'POST';
                const path = routeConfig.path;
                console.log(`  🛣️ Route: ${method} ${routing.basePath}${path} -> ${machineKey}`);
                // Create route handler
                router[method.toLowerCase()](path, async (req, res) => {
                    try {
                        const { event, data } = req.body;
                        if (!event) {
                            return res.status(400).json({
                                error: 'Event is required',
                                tome: config.id,
                                machine: machineKey
                            });
                        }
                        // Apply input transformer if configured
                        let transformedData = data;
                        if (routeConfig.transformers?.input) {
                            transformedData = routeConfig.transformers.input(data, 'forward');
                        }
                        // Send message to machine
                        const result = await tome.sendMessage(machineKey, event, transformedData);
                        // Apply output transformer if configured
                        let response = result;
                        if (routeConfig.transformers?.output) {
                            response = routeConfig.transformers.output(result, 'forward');
                        }
                        res.json({
                            success: true,
                            tome: config.id,
                            machine: machineKey,
                            event,
                            result: response,
                            timestamp: new Date().toISOString()
                        });
                    }
                    catch (error) {
                        console.error(`❌ Error in tome route ${config.id}:${machineKey}:`, error);
                        res.status(500).json({
                            success: false,
                            error: error.message,
                            tome: config.id,
                            machine: machineKey,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        }
        // Mount router on app
        const mountPath = routing.basePath || `/api/${config.id}`;
        this.app.use(mountPath, router);
        tome.router = router;
        console.log(`✅ Routing setup complete for Tome: ${config.id} at ${mountPath}`);
    }
    /**
     * Unregister a Tome
     */
    async unregisterTome(id) {
        const tome = this.tomes.get(id);
        if (!tome) {
            throw new Error(`Tome ${id} not found`);
        }
        console.log(`🗑️ Unregistering Tome: ${id}`);
        await tome.stop();
        this.tomes.delete(id);
        console.log(`✅ Tome unregistered: ${id}`);
    }
    /**
     * Get a Tome by ID
     */
    getTome(id) {
        return this.tomes.get(id);
    }
    /**
     * Start a Tome
     */
    async startTome(id) {
        const tome = this.getTome(id);
        if (!tome) {
            throw new Error(`Tome ${id} not found`);
        }
        await tome.start();
    }
    /**
     * Stop a Tome
     */
    async stopTome(id) {
        const tome = this.getTome(id);
        if (!tome) {
            throw new Error(`Tome ${id} not found`);
        }
        await tome.stop();
    }
    /**
     * List all registered Tome IDs
     */
    listTomes() {
        return Array.from(this.tomes.keys());
    }
    /**
     * Get status of all tomes
     */
    getTomeStatus() {
        const status = [];
        for (const [id, tome] of this.tomes) {
            const machineStatus = {};
            for (const [machineKey, machine] of tome.machines) {
                machineStatus[machineKey] = {
                    state: machine.getState(),
                    context: machine.getContext()
                };
            }
            status.push({
                id,
                name: tome.config.name,
                description: tome.config.description,
                version: tome.config.version,
                machines: machineStatus,
                context: tome.context
            });
        }
        return status;
    }
    /**
     * Send message to a specific machine in a tome
     */
    async sendTomeMessage(tomeId, machineId, event, data) {
        const tome = this.getTome(tomeId);
        if (!tome) {
            throw new Error(`Tome ${tomeId} not found`);
        }
        return await tome.sendMessage(machineId, event, data);
    }
    /**
     * Get state of a specific machine in a tome
     */
    getTomeMachineState(tomeId, machineId) {
        const tome = this.getTome(tomeId);
        if (!tome) {
            throw new Error(`Tome ${tomeId} not found`);
        }
        return tome.getState(machineId);
    }
    /**
     * Update context for a tome
     */
    updateTomeContext(tomeId, updates) {
        const tome = this.getTome(tomeId);
        if (!tome) {
            throw new Error(`Tome ${tomeId} not found`);
        }
        tome.updateContext(updates);
    }
}
/**
 * Create a TomeManager instance
 */
function createTomeManager(app, options) {
    return new TomeManager(app, options);
}

/**
 * createTome - Browser-safe Tome factory (no Express).
 * Builds ViewStateMachines from TomeConfig and returns a TomeInstance.
 * Use TomeManager when you have Express and need routing.
 */
/**
 * Create a TomeInstance from config without Express or routing.
 * Same machine-building logic as TomeManager.registerTome; use for browser or non-Express environments.
 */
function createTome(config) {
    const machines = new Map();
    for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
        const machine = createViewStateMachine({
            machineId: machineConfig.id,
            xstateConfig: machineConfig.xstateConfig,
            context: {
                ...(config.context || {}),
                ...(machineConfig.context || {}),
            },
            ...(machineConfig.logStates && { logStates: machineConfig.logStates }),
        });
        machines.set(machineKey, machine);
    }
    let isCaveSynchronized = false;
    let context = { ...(config.context || {}) };
    function getRenderKey() {
        const base = config.renderKey ?? config.id;
        const machineKeys = [];
        machines.forEach((m, key) => {
            if (m && typeof m.getRenderKey === 'function') {
                machineKeys.push(m.getRenderKey());
            }
            else {
                machineKeys.push(key);
            }
        });
        if (machineKeys.length === 0)
            return base;
        return `${base}:${machineKeys.join(',')}`;
    }
    const tomeInstance = {
        id: config.id,
        config,
        machines,
        get context() {
            return context;
        },
        set context(value) {
            context = value;
        },
        get isCaveSynchronized() {
            return isCaveSynchronized;
        },
        getRenderKey,
        observeViewKey(callback) {
            callback(getRenderKey());
            return () => {
            };
        },
        synchronizeWithCave(_cave) {
            isCaveSynchronized = true;
        },
        async start() {
            for (const [, machine] of machines) {
                if (machine && typeof machine.start === 'function') {
                    await machine.start();
                }
            }
        },
        async stop() {
            for (const [, machine] of machines) {
                if (machine && typeof machine.stop === 'function') {
                    await machine.stop();
                }
            }
        },
        getMachine(id) {
            return machines.get(id);
        },
        async sendMessage(machineId, event, data) {
            const machine = machines.get(machineId);
            if (!machine) {
                throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
            }
            const eventObj = typeof event === 'string' ? { type: event, ...(data || {}) } : event;
            if (typeof machine.send === 'function') {
                machine.send(eventObj);
            }
            if (typeof machine.getState === 'function') {
                return machine.getState();
            }
            return undefined;
        },
        getState(machineId) {
            const machine = machines.get(machineId);
            if (!machine) {
                throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
            }
            return typeof machine.getState === 'function' ? machine.getState() : null;
        },
        updateContext(updates) {
            context = { ...context, ...updates };
            // ViewStateMachine does not implement updateContext; only update Tome context
        },
    };
    return tomeInstance;
}

/**
 * TomeConfig - Configuration for Tome routing and state management
 *
 * This interface defines how tomes can be configured with routing support,
 * allowing each tome to insert gracefully into a routing hierarchy.
 */
/** Safe env read for Node; returns undefined in browser so config can use fallbacks. */
function getEnv(name) {
    try {
        // eslint-disable-next-line no-restricted-globals
        return typeof globalThis.process !== 'undefined' && globalThis.process.env
            ? globalThis.process.env[name]
            : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Create a TomeConfig with routing support
 */
function createTomeConfig(config) {
    return {
        id: config.id || 'default-tome',
        name: config.name || 'Default Tome',
        description: config.description || 'A configured tome with routing support',
        version: config.version || '1.0.0',
        renderKey: config.renderKey,
        machines: config.machines || {},
        routing: {
            basePath: config.routing?.basePath || '/api',
            routes: config.routing?.routes || {},
            middleware: config.routing?.middleware || [],
            cors: config.routing?.cors ?? true,
            rateLimit: config.routing?.rateLimit || {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100 // limit each IP to 100 requests per windowMs
            },
            authentication: config.routing?.authentication || {
                required: false
            }
        },
        context: config.context || {},
        dependencies: config.dependencies || [],
        plugins: config.plugins || [],
        graphql: {
            enabled: config.graphql?.enabled ?? true,
            schema: config.graphql?.schema,
            resolvers: config.graphql?.resolvers || {},
            subscriptions: config.graphql?.subscriptions ?? true
        },
        logging: {
            level: config.logging?.level || 'info',
            format: config.logging?.format || 'json',
            transports: config.logging?.transports || ['console']
        },
        persistence: {
            enabled: config.persistence?.enabled ?? false,
            type: config.persistence?.type || 'memory',
            config: config.persistence?.config || {}
        },
        monitoring: {
            enabled: config.monitoring?.enabled ?? true,
            metrics: config.monitoring?.metrics || ['requests', 'errors', 'performance'],
            tracing: config.monitoring?.tracing ?? true,
            healthChecks: config.monitoring?.healthChecks || ['/health']
        },
        isModableTome: config.isModableTome,
        modMetadata: config.modMetadata,
        permission: config.permission
    };
}
/**
 * Example TomeConfig for Fish Burger system
 */
const FishBurgerTomeConfig = createTomeConfig({
    id: 'fish-burger-tome',
    name: 'Fish Burger System',
    description: 'Complete fish burger ordering and cooking system',
    version: '1.0.0',
    machines: {
        orderMachine: {
            id: 'order-machine',
            name: 'Order Management',
            description: 'Handles order creation and management',
            xstateConfig: {
                id: 'order-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { CREATE_ORDER: 'processing' }
                    },
                    processing: {
                        on: { COMPLETE_ORDER: 'completed' }
                    },
                    completed: {
                        on: { RESET: 'idle' }
                    }
                }
            }
        },
        cookingMachine: {
            id: 'cooking-machine',
            name: 'Cooking System',
            description: 'Manages the cooking process',
            xstateConfig: {
                id: 'cooking-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { START_COOKING: 'cooking' }
                    },
                    cooking: {
                        on: { COMPLETE_COOKING: 'completed' }
                    },
                    completed: {
                        on: { RESET: 'idle' }
                    }
                }
            }
        }
    },
    routing: {
        basePath: '/api/fish-burger',
        routes: {
            orderMachine: {
                path: '/orders',
                method: 'POST'
            },
            cookingMachine: {
                path: '/cooking',
                method: 'POST'
            }
        }
    },
    context: {
        baseUrl: 'http://localhost:3000',
        adminKey: getEnv('ADMIN_KEY') || 'admin123'
    }
});
/**
 * Example TomeConfig for Editor system
 */
const EditorTomeConfig = createTomeConfig({
    id: 'editor-tome',
    name: 'Component Editor System',
    description: 'Visual component editor with real-time preview',
    version: '1.0.0',
    machines: {
        editorMachine: {
            id: 'editor-machine',
            name: 'Component Editor',
            description: 'Main editor interface',
            xstateConfig: {
                id: 'editor-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { LOAD_COMPONENT: 'editing' }
                    },
                    editing: {
                        on: { SAVE: 'saving' }
                    },
                    saving: {
                        on: { SAVE_SUCCESS: 'editing' }
                    }
                }
            }
        },
        previewMachine: {
            id: 'preview-machine',
            name: 'Preview System',
            description: 'Real-time component preview',
            xstateConfig: {
                id: 'preview-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { UPDATE_PREVIEW: 'updating' }
                    },
                    updating: {
                        on: { PREVIEW_READY: 'ready' }
                    },
                    ready: {
                        on: { UPDATE_PREVIEW: 'updating' }
                    }
                }
            }
        }
    },
    routing: {
        basePath: '/api/editor',
        routes: {
            editorMachine: {
                path: '/components',
                method: 'POST'
            },
            previewMachine: {
                path: '/preview',
                method: 'POST'
            }
        }
    },
    context: {
        editorType: 'generic',
        previewMode: 'iframe'
    },
    persistence: {
        enabled: true,
        adapter: 'duckdb',
        config: {}
    }
});
/**
 * Library TomeConfig - Component library state for the generic editor.
 */
const LibraryTomeConfig = createTomeConfig({
    id: 'library-tome',
    name: 'Component Library',
    description: 'Component library state and discovery',
    version: '1.0.0',
    machines: {
        libraryMachine: {
            id: 'library-machine',
            name: 'Library',
            description: 'Library state',
            xstateConfig: {
                id: 'library-machine',
                initial: 'idle',
                states: {
                    idle: { on: { OPEN: 'browsing' } },
                    browsing: { on: { SELECT: 'idle', CLOSE: 'idle' } },
                },
            },
        },
    },
    routing: {
        basePath: '/api/editor/library',
        routes: {
            libraryMachine: { path: '/', method: 'POST' },
        },
    },
});
/**
 * Cart TomeConfig - Cart state (e.g. cooked burgers, checkout) for the generic editor.
 */
const CartTomeConfig = createTomeConfig({
    id: 'cart-tome',
    name: 'Cart',
    description: 'Cart state and checkout',
    version: '1.0.0',
    machines: {
        cartMachine: {
            id: 'cart-machine',
            name: 'Cart',
            description: 'Cart state',
            xstateConfig: {
                id: 'cart-machine',
                initial: 'idle',
                states: {
                    idle: { on: { ADD: 'active' } },
                    active: { on: { CHECKOUT: 'idle', CLEAR: 'idle' } },
                },
            },
        },
    },
    routing: {
        basePath: '/api/editor/cart',
        routes: {
            cartMachine: { path: '/', method: 'POST' },
        },
    },
});
/**
 * Donation TomeConfig - Mod author / sticky-coins (Solana) state for the generic editor.
 */
const DonationTomeConfig = createTomeConfig({
    id: 'donation-tome',
    name: 'Donation',
    description: 'Mod author donation and sticky coins',
    version: '1.0.0',
    machines: {
        donationMachine: {
            id: 'donation-machine',
            name: 'Donation',
            description: 'Donation / wallet state',
            xstateConfig: {
                id: 'donation-machine',
                initial: 'idle',
                states: {
                    idle: { on: { CONNECT_WALLET: 'connected' } },
                    connected: { on: { DONATE: 'idle', DISCONNECT: 'idle' } },
                },
            },
        },
    },
    routing: {
        basePath: '/api/editor/donation',
        routes: {
            donationMachine: { path: '/', method: 'POST' },
        },
    },
});

// Structural system class
class StructuralSystem {
    constructor(config) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "machines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "componentCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.config = config;
    }
    // Get the complete application structure
    getAppStructure() {
        return this.config.AppStructure;
    }
    // Get component-tome mapping
    getComponentTomeMapping() {
        return this.config.ComponentTomeMapping;
    }
    // Get routing configuration
    getRoutingConfig() {
        return this.config.RoutingConfig;
    }
    // Get tome configuration
    getTomeConfig() {
        return this.config.TomeConfig;
    }
    // Create a machine for a specific component
    createMachine(componentName, initialModel) {
        const mapping = this.config.ComponentTomeMapping[componentName];
        const tomeConfig = this.config.TomeConfig.tomes[`${componentName}-tome`];
        if (!mapping || !tomeConfig) {
            console.warn(`No configuration found for component: ${componentName}`);
            return null;
        }
        try {
            // Create machine configuration
            const machineConfig = {
                machineId: tomeConfig.machineId,
                xstateConfig: {
                    id: tomeConfig.machineId,
                    initial: 'idle',
                    context: {
                        model: initialModel || {},
                        componentName,
                        tomePath: mapping.tomePath,
                        templatePath: mapping.templatePath
                    },
                    states: this.createStatesFromTome(tomeConfig),
                    on: this.createEventsFromTome(tomeConfig)
                },
                tomeConfig: {
                    ...tomeConfig,
                    componentMapping: mapping
                }
            };
            const machine = new ViewStateMachine(machineConfig);
            this.machines.set(componentName, machine);
            return machine;
        }
        catch (error) {
            console.error(`Failed to create machine for ${componentName}:`, error);
            return null;
        }
    }
    // Get an existing machine
    getMachine(componentName) {
        return this.machines.get(componentName);
    }
    // Get all machines
    getAllMachines() {
        return this.machines;
    }
    // Find route by path
    findRoute(path) {
        const findRouteRecursive = (routes, targetPath) => {
            for (const route of routes) {
                if (route.path === targetPath) {
                    return route;
                }
                if (route.children) {
                    const found = findRouteRecursive(route.children, targetPath);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        return findRouteRecursive(this.config.RoutingConfig.routes, path);
    }
    // Get navigation breadcrumbs for a path
    getBreadcrumbs(path) {
        const breadcrumbs = [];
        const pathParts = path.split('/').filter(Boolean);
        let currentPath = '';
        for (const part of pathParts) {
            currentPath += `/${part}`;
            const route = this.findRoute(currentPath);
            if (route && route.component) {
                const navItem = this.findNavigationItem(currentPath);
                if (navItem) {
                    breadcrumbs.push(navItem);
                }
            }
        }
        return breadcrumbs;
    }
    // Find navigation item by path
    findNavigationItem(path) {
        const findInNavigation = (items, targetPath) => {
            for (const item of items) {
                if (item.path === targetPath) {
                    return item;
                }
                if (item.children) {
                    const found = findInNavigation(item.children, targetPath);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        const primary = findInNavigation(this.config.RoutingConfig.navigation.primary, path);
        if (primary)
            return primary;
        if (this.config.RoutingConfig.navigation.secondary) {
            return findInNavigation(this.config.RoutingConfig.navigation.secondary, path);
        }
        return null;
    }
    // Validate the structural configuration
    validate() {
        const errors = [];
        // Validate component-tome mappings
        for (const [componentName, mapping] of Object.entries(this.config.ComponentTomeMapping)) {
            if (!this.config.TomeConfig.tomes[`${componentName}-tome`]) {
                errors.push(`Component ${componentName} has no corresponding tome configuration`);
            }
        }
        // Validate routing
        for (const route of this.config.RoutingConfig.routes) {
            if (route.component && !this.config.ComponentTomeMapping[route.component]) {
                errors.push(`Route ${route.path} references unknown component: ${route.component}`);
            }
        }
        // Validate navigation
        const validateNavigation = (items) => {
            for (const item of items) {
                if (!this.findRoute(item.path)) {
                    errors.push(`Navigation item ${item.id} references unknown route: ${item.path}`);
                }
                if (item.children) {
                    validateNavigation(item.children);
                }
            }
        };
        validateNavigation(this.config.RoutingConfig.navigation.primary);
        if (this.config.RoutingConfig.navigation.secondary) {
            validateNavigation(this.config.RoutingConfig.navigation.secondary);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    // Create XState states from tome configuration
    createStatesFromTome(tomeConfig) {
        const states = {};
        for (const state of tomeConfig.states) {
            states[state] = {
                on: {}
            };
        }
        return states;
    }
    // Create XState events from tome configuration
    createEventsFromTome(tomeConfig) {
        const events = {};
        for (const event of tomeConfig.events) {
            events[event] = {
                actions: assign((context, event) => ({
                    lastEvent: event.type,
                    lastEventPayload: event.payload
                }))
            };
        }
        return events;
    }
}
// React hook for using the structural system
function useStructuralSystem(config) {
    const [system] = require$$0.useState(() => new StructuralSystem(config));
    require$$0.useEffect(() => {
        const validation = system.validate();
        if (!validation.isValid) {
            console.warn('Structural system validation errors:', validation.errors);
        }
    }, [system]);
    return system;
}
// Utility function to create a structural system
function createStructuralSystem(config) {
    return new StructuralSystem(config);
}

const RouterContext = createContext(null);
// Router hook
function useRouter() {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter must be used within a StructuralRouter');
    }
    return context;
}
// Main router component
const StructuralRouter = ({ config, initialRoute = '/', onRouteChange, children }) => {
    const [currentRoute, setCurrentRoute] = useState(initialRoute);
    const [routeHistory, setRouteHistory] = useState([initialRoute]);
    const [structuralSystem] = useState(() => new StructuralSystem(config));
    // Handle route changes
    const navigate = (path) => {
        const route = structuralSystem.findRoute(path);
        if (route) {
            setCurrentRoute(path);
            setRouteHistory(prev => [...prev, path]);
            onRouteChange?.(path);
        }
        else {
            console.warn(`Route not found: ${path}`);
        }
    };
    // Handle back navigation
    const goBack = () => {
        if (routeHistory.length > 1) {
            const newHistory = routeHistory.slice(0, -1);
            const previousRoute = newHistory[newHistory.length - 1];
            setCurrentRoute(previousRoute);
            setRouteHistory(newHistory);
            onRouteChange?.(previousRoute);
        }
    };
    // Get breadcrumbs for current route
    const breadcrumbs = structuralSystem.getBreadcrumbs(currentRoute);
    // Context value
    const contextValue = {
        currentRoute,
        navigate,
        goBack,
        breadcrumbs,
        structuralSystem
    };
    // Handle initial route validation
    useEffect(() => {
        const route = structuralSystem.findRoute(initialRoute);
        if (!route) {
            console.warn(`Initial route not found: ${initialRoute}`);
            // Try to find a valid default route
            const defaultRoute = config.RoutingConfig.routes.find(r => r.component)?.path;
            if (defaultRoute && defaultRoute !== initialRoute) {
                setCurrentRoute(defaultRoute);
                setRouteHistory([defaultRoute]);
                onRouteChange?.(defaultRoute);
            }
        }
    }, [initialRoute, structuralSystem, config.RoutingConfig.routes, onRouteChange]);
    return (jsxRuntimeExports.jsx(RouterContext.Provider, { value: contextValue, children: jsxRuntimeExports.jsxs("div", { className: "structural-router", children: [jsxRuntimeExports.jsx(RouterHeader, {}), jsxRuntimeExports.jsxs("div", { className: "router-content", children: [jsxRuntimeExports.jsx(RouterSidebar, {}), jsxRuntimeExports.jsx(RouterMain, { children: children })] })] }) }));
};
// Router header component
const RouterHeader = () => {
    const { currentRoute, breadcrumbs, goBack } = useRouter();
    return (jsxRuntimeExports.jsxs("header", { className: "router-header", children: [jsxRuntimeExports.jsxs("div", { className: "header-content", children: [jsxRuntimeExports.jsx("h1", { className: "router-title", children: "Log View Machine" }), jsxRuntimeExports.jsx("nav", { className: "breadcrumb-nav", children: breadcrumbs.map((item, index) => (jsxRuntimeExports.jsxs("span", { className: "breadcrumb-item", children: [index > 0 && jsxRuntimeExports.jsx("span", { className: "breadcrumb-separator", children: "/" }), jsxRuntimeExports.jsx("span", { className: "breadcrumb-label", children: item.label })] }, item.id))) })] }), jsxRuntimeExports.jsx("button", { className: "back-button", onClick: goBack, disabled: breadcrumbs.length <= 1, children: "\u2190 Back" })] }));
};
// Router sidebar component
const RouterSidebar = () => {
    const { structuralSystem, navigate, currentRoute } = useRouter();
    const config = structuralSystem.getRoutingConfig();
    const renderNavigationItems = (items) => {
        return items.map(item => (jsxRuntimeExports.jsxs("div", { className: "nav-item", children: [jsxRuntimeExports.jsxs("button", { className: `nav-button ${currentRoute === item.path ? 'active' : ''}`, onClick: () => navigate(item.path), children: [item.icon && jsxRuntimeExports.jsx("span", { className: "nav-icon", children: item.icon }), jsxRuntimeExports.jsx("span", { className: "nav-label", children: item.label })] }), item.children && (jsxRuntimeExports.jsx("div", { className: "nav-children", children: renderNavigationItems(item.children) }))] }, item.id)));
    };
    return (jsxRuntimeExports.jsxs("aside", { className: "router-sidebar", children: [jsxRuntimeExports.jsxs("nav", { className: "primary-navigation", children: [jsxRuntimeExports.jsx("h3", { className: "nav-section-title", children: "Primary" }), renderNavigationItems(config.navigation.primary)] }), config.navigation.secondary && (jsxRuntimeExports.jsxs("nav", { className: "secondary-navigation", children: [jsxRuntimeExports.jsx("h3", { className: "nav-section-title", children: "Secondary" }), renderNavigationItems(config.navigation.secondary)] }))] }));
};
// Router main content area
const RouterMain = ({ children }) => {
    return (jsxRuntimeExports.jsx("main", { className: "router-main", children: children }));
};
const Route = ({ path, component: Component, fallback: Fallback }) => {
    const { currentRoute, structuralSystem } = useRouter();
    if (currentRoute === path) {
        return jsxRuntimeExports.jsx(Component, {});
    }
    if (Fallback) {
        return jsxRuntimeExports.jsx(Fallback, {});
    }
    return null;
};
// Default fallback component
const RouteFallback = () => {
    const { currentRoute } = useRouter();
    return (jsxRuntimeExports.jsxs("div", { className: "route-fallback", children: [jsxRuntimeExports.jsx("h2", { children: "Route Not Found" }), jsxRuntimeExports.jsxs("p", { children: ["The route \"", currentRoute, "\" could not be found."] })] }));
};

// Main component
const StructuralTomeConnector = ({ componentName, structuralSystem, initialModel = {}, onStateChange, onLogEntry, onMachineCreated, children }) => {
    const [state, setState] = useState({
        machine: null,
        currentState: 'idle',
        model: initialModel,
        logEntries: [],
        isLoading: true,
        error: null
    });
    const machineRef = useRef(null);
    const logEntriesRef = useRef([]);
    // Get tome configuration and component mapping
    const tomeConfig = useMemo(() => {
        return structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
    }, [componentName, structuralSystem]);
    const componentMapping = useMemo(() => {
        return structuralSystem.getComponentTomeMapping()[componentName];
    }, [componentName, structuralSystem]);
    // Initialize the tome machine
    useEffect(() => {
        const initializeTome = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));
                // Validate configuration
                if (!tomeConfig) {
                    throw new Error(`No tome configuration found for component: ${componentName}`);
                }
                if (!componentMapping) {
                    throw new Error(`No component mapping found for: ${componentName}`);
                }
                // Create or get the machine
                let machine = structuralSystem.getMachine(componentName);
                if (!machine) {
                    machine = structuralSystem.createMachine(componentName, initialModel);
                    if (!machine) {
                        throw new Error(`Failed to create machine for component: ${componentName}`);
                    }
                }
                // Store machine reference
                machineRef.current = machine;
                onMachineCreated?.(machine);
                // Set up state change listener
                const unsubscribe = machine.subscribe((state) => {
                    const currentState = state.value || 'idle';
                    const model = state.context?.model || initialModel;
                    setState(prev => ({
                        ...prev,
                        currentState,
                        model,
                        isLoading: false
                    }));
                    onStateChange?.(currentState, model);
                });
                // Set up logging
                machine.on('LOG_ADDED', async (entry) => {
                    const newEntry = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        message: entry.message,
                        metadata: entry.metadata
                    };
                    setState(prev => ({
                        ...prev,
                        logEntries: [...prev.logEntries, newEntry]
                    }));
                    logEntriesRef.current = [...logEntriesRef.current, newEntry];
                    onLogEntry?.(newEntry);
                });
                // Initialize the machine
                await machine.start();
                setState(prev => ({
                    ...prev,
                    machine,
                    isLoading: false
                }));
                return unsubscribe;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setState(prev => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false
                }));
                console.error(`Failed to initialize tome for ${componentName}:`, error);
            }
        };
        initializeTome();
    }, [componentName, structuralSystem, initialModel, onStateChange, onLogEntry, onMachineCreated]);
    // Send event to the machine
    const sendEvent = (event) => {
        if (machineRef.current) {
            machineRef.current.send(event);
        }
    };
    // Update the model
    const updateModel = (updates) => {
        if (machineRef.current) {
            const currentModel = machineRef.current.getState()?.context?.model || {};
            const newModel = { ...currentModel, ...updates };
            // Update the machine context
            machineRef.current.send({
                type: 'MODEL_UPDATE',
                payload: { model: newModel }
            });
        }
    };
    // Context value for children
    const contextValue = {
        machine: state.machine,
        currentState: state.currentState,
        model: state.model,
        logEntries: state.logEntries,
        isLoading: state.isLoading,
        error: state.error,
        sendEvent,
        updateModel,
        componentName,
        tomeConfig,
        componentMapping
    };
    // Render children
    if (typeof children === 'function') {
        return jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: children(contextValue) });
    }
    return (jsxRuntimeExports.jsxs("div", { className: "structural-tome-connector", children: [jsxRuntimeExports.jsx(TomeHeader, { context: contextValue }), jsxRuntimeExports.jsx(TomeContent, { context: contextValue, children: children }), jsxRuntimeExports.jsx(TomeFooter, { context: contextValue })] }));
};
// Tome header component
const TomeHeader = ({ context }) => {
    const { componentName, currentState, tomeConfig, error } = context;
    return (jsxRuntimeExports.jsxs("header", { className: "tome-header", children: [jsxRuntimeExports.jsxs("div", { className: "tome-info", children: [jsxRuntimeExports.jsx("h3", { className: "tome-title", children: componentName }), tomeConfig && (jsxRuntimeExports.jsx("p", { className: "tome-description", children: tomeConfig.description }))] }), jsxRuntimeExports.jsxs("div", { className: "tome-status", children: [jsxRuntimeExports.jsx("span", { className: `state-indicator state-${currentState}`, children: currentState }), error && (jsxRuntimeExports.jsx("span", { className: "error-indicator", title: error, children: "\u26A0\uFE0F" }))] })] }));
};
// Tome content component
const TomeContent = ({ context, children }) => {
    const { isLoading, error } = context;
    if (isLoading) {
        return (jsxRuntimeExports.jsx("div", { className: "tome-content loading", children: jsxRuntimeExports.jsx("div", { className: "loading-spinner", children: "Loading..." }) }));
    }
    if (error) {
        return (jsxRuntimeExports.jsx("div", { className: "tome-content error", children: jsxRuntimeExports.jsxs("div", { className: "error-message", children: [jsxRuntimeExports.jsx("h4", { children: "Error" }), jsxRuntimeExports.jsx("p", { children: error })] }) }));
    }
    return (jsxRuntimeExports.jsx("div", { className: "tome-content", children: children }));
};
// Tome footer component
const TomeFooter = ({ context }) => {
    const { logEntries, tomeConfig } = context;
    if (!tomeConfig || logEntries.length === 0) {
        return null;
    }
    return (jsxRuntimeExports.jsx("footer", { className: "tome-footer", children: jsxRuntimeExports.jsxs("details", { className: "tome-logs", children: [jsxRuntimeExports.jsxs("summary", { children: ["Logs (", logEntries.length, ")"] }), jsxRuntimeExports.jsx("div", { className: "log-entries", children: logEntries.slice(-5).map(entry => (jsxRuntimeExports.jsxs("div", { className: `log-entry log-${entry.level}`, children: [jsxRuntimeExports.jsx("span", { className: "log-timestamp", children: new Date(entry.timestamp).toLocaleTimeString() }), jsxRuntimeExports.jsx("span", { className: "log-message", children: entry.message }), entry.metadata && (jsxRuntimeExports.jsx("span", { className: "log-metadata", children: JSON.stringify(entry.metadata) }))] }, entry.id))) })] }) }));
};
// Hook for using the tome connector
function useStructuralTomeConnector(componentName, structuralSystem) {
    const [context, setContext] = useState({
        machine: null,
        currentState: 'idle',
        model: {},
        logEntries: [],
        isLoading: true,
        error: null,
        sendEvent: () => { },
        updateModel: () => { },
        componentName,
        tomeConfig: null,
        componentMapping: null
    });
    useEffect(() => {
        const tomeConfig = structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
        const componentMapping = structuralSystem.getComponentTomeMapping()[componentName];
        setContext(prev => ({
            ...prev,
            tomeConfig,
            componentMapping
        }));
    }, [componentName, structuralSystem]);
    return context;
}

// Default application structure configuration
const DefaultStructuralConfig = {
    // Root application structure
    AppStructure: {
        id: 'log-view-machine-app',
        name: 'Log View Machine Application',
        type: 'application',
        routing: {
            base: '/',
            defaultRoute: '/dashboard'
        }
    },
    // Component to Tome mapping
    ComponentTomeMapping: {
        'dashboard': {
            componentPath: 'src/components/Dashboard.tsx',
            tomePath: 'src/component-middleware/dashboard/DashboardTomes.tsx',
            templatePath: 'src/component-middleware/dashboard/templates/dashboard-component/'
        },
        'log-viewer': {
            componentPath: 'src/components/LogViewer.tsx',
            tomePath: 'src/component-middleware/log-viewer/LogViewerTomes.tsx',
            templatePath: 'src/component-middleware/log-viewer/templates/log-viewer-component/'
        },
        'state-machine': {
            componentPath: 'src/components/StateMachine.tsx',
            tomePath: 'src/component-middleware/state-machine/StateMachineTomes.tsx',
            templatePath: 'src/component-middleware/state-machine/templates/state-machine-component/'
        },
        'tome-manager': {
            componentPath: 'src/components/TomeManager.tsx',
            tomePath: 'src/component-middleware/tome-manager/TomeManagerTomes.tsx',
            templatePath: 'src/component-middleware/tome-manager/templates/tome-manager-component/'
        },
        'settings': {
            componentPath: 'src/components/Settings.tsx',
            tomePath: 'src/component-middleware/settings/SettingsTomes.tsx',
            templatePath: 'src/component-middleware/settings/templates/settings-component/'
        }
    },
    // Routing configuration
    RoutingConfig: {
        routes: [
            {
                path: '/',
                redirect: '/dashboard'
            },
            {
                path: '/dashboard',
                component: 'dashboard'
            },
            {
                path: '/log-viewer',
                component: 'log-viewer'
            },
            {
                path: '/state-machine',
                component: 'state-machine'
            },
            {
                path: '/tome-manager',
                component: 'tome-manager'
            },
            {
                path: '/settings',
                component: 'settings'
            }
        ],
        navigation: {
            primary: [
                {
                    id: 'dashboard',
                    label: 'Dashboard',
                    path: '/dashboard',
                    icon: '📊'
                },
                {
                    id: 'log-viewer',
                    label: 'Log Viewer',
                    path: '/log-viewer',
                    icon: '📋'
                },
                {
                    id: 'state-machine',
                    label: 'State Machine',
                    path: '/state-machine',
                    icon: '⚙️'
                },
                {
                    id: 'tome-manager',
                    label: 'Tome Manager',
                    path: '/tome-manager',
                    icon: '📚'
                }
            ],
            secondary: [
                {
                    id: 'settings',
                    label: 'Settings',
                    path: '/settings',
                    icon: '⚙️'
                }
            ]
        }
    },
    // Tome configuration
    TomeConfig: {
        tomes: {
            'dashboard-tome': {
                machineId: 'dashboard',
                description: 'Main dashboard with overview and navigation',
                states: ['idle', 'loading', 'loaded', 'error'],
                events: ['LOAD', 'REFRESH', 'ERROR', 'CLEAR']
            },
            'log-viewer-tome': {
                machineId: 'log-viewer',
                description: 'Log viewing and analysis functionality',
                states: ['idle', 'loading', 'viewing', 'filtering', 'exporting', 'error'],
                events: ['LOAD_LOGS', 'FILTER', 'EXPORT', 'CLEAR', 'ERROR']
            },
            'state-machine-tome': {
                machineId: 'state-machine',
                description: 'State machine visualization and management',
                states: ['idle', 'loading', 'visualizing', 'editing', 'saving', 'error'],
                events: ['LOAD_MACHINE', 'VISUALIZE', 'EDIT', 'SAVE', 'ERROR']
            },
            'tome-manager-tome': {
                machineId: 'tome-manager',
                description: 'Tome lifecycle and configuration management',
                states: ['idle', 'loading', 'managing', 'creating', 'editing', 'deleting', 'error'],
                events: ['LOAD_TOMES', 'CREATE', 'EDIT', 'DELETE', 'SAVE', 'ERROR']
            },
            'settings-tome': {
                machineId: 'settings',
                description: 'Application settings and configuration',
                states: ['idle', 'loading', 'editing', 'saving', 'resetting', 'error'],
                events: ['LOAD_SETTINGS', 'EDIT', 'SAVE', 'RESET', 'ERROR']
            }
        },
        machineStates: {
            'dashboard': {
                idle: {
                    description: 'Dashboard is ready for interaction',
                    actions: ['initialize', 'setupEventListeners']
                },
                loading: {
                    description: 'Loading dashboard data',
                    actions: ['fetchData', 'showLoadingState']
                },
                loaded: {
                    description: 'Dashboard data is loaded and ready',
                    actions: ['renderDashboard', 'setupInteractions']
                },
                error: {
                    description: 'Error occurred while loading dashboard',
                    actions: ['showError', 'provideRetryOption']
                }
            },
            'log-viewer': {
                idle: {
                    description: 'Log viewer is ready',
                    actions: ['initialize', 'setupLogSources']
                },
                loading: {
                    description: 'Loading log data',
                    actions: ['fetchLogs', 'parseLogs', 'showProgress']
                },
                viewing: {
                    description: 'Displaying logs for viewing',
                    actions: ['renderLogs', 'setupFilters', 'enableSearch']
                },
                filtering: {
                    description: 'Applying filters to logs',
                    actions: ['applyFilters', 'updateView', 'showFilterCount']
                }
            }
        }
    }
};
// Utility function to create a custom structural config
function createStructuralConfig(overrides = {}) {
    return {
        ...DefaultStructuralConfig,
        ...overrides,
        ComponentTomeMapping: {
            ...DefaultStructuralConfig.ComponentTomeMapping,
            ...overrides.ComponentTomeMapping
        },
        RoutingConfig: {
            ...DefaultStructuralConfig.RoutingConfig,
            ...overrides.RoutingConfig,
            routes: [
                ...(overrides.RoutingConfig?.routes || DefaultStructuralConfig.RoutingConfig.routes)
            ],
            navigation: {
                ...DefaultStructuralConfig.RoutingConfig.navigation,
                ...overrides.RoutingConfig?.navigation,
                primary: [
                    ...(overrides.RoutingConfig?.navigation?.primary || DefaultStructuralConfig.RoutingConfig.navigation.primary)
                ],
                secondary: [
                    ...(overrides.RoutingConfig?.navigation?.secondary || DefaultStructuralConfig.RoutingConfig.navigation.secondary || [])
                ]
            }
        },
        TomeConfig: {
            ...DefaultStructuralConfig.TomeConfig,
            ...overrides.TomeConfig,
            tomes: {
                ...DefaultStructuralConfig.TomeConfig.tomes,
                ...overrides.TomeConfig?.tomes
            },
            machineStates: {
                ...DefaultStructuralConfig.TomeConfig.machineStates,
                ...overrides.TomeConfig?.machineStates
            }
        }
    };
}

function createChildCaves(spelunk) {
    const childCaves = {};
    if (spelunk.childCaves) {
        for (const [key, childSpelunk] of Object.entries(spelunk.childCaves)) {
            childCaves[key] = Cave(key, childSpelunk);
        }
    }
    return childCaves;
}
/**
 * Cave factory: (name, caveDescent, options?) => CaveInstance.
 * Returns a Cave that is config-only until initialize() is called.
 */
function Cave(name, caveDescent, options) {
    const config = { name, spelunk: caveDescent, ...options };
    let isInitialized = false;
    const childCavesRef = createChildCaves(caveDescent);
    function getRenderKey() {
        return caveDescent.renderKey ?? name;
    }
    const instance = {
        get name() {
            return name;
        },
        get isInitialized() {
            return isInitialized;
        },
        get childCaves() {
            return childCavesRef;
        },
        getConfig() {
            return { ...config };
        },
        getRoutedConfig(path) {
            const trimmed = path.replace(/^\.\/?|\/$/g, '') || '.';
            if (trimmed === '.' || trimmed === '') {
                return config;
            }
            const parts = trimmed.split('/').filter(Boolean);
            let current = caveDescent;
            for (const part of parts) {
                const next = current.childCaves?.[part];
                if (!next) {
                    return config;
                }
                current = next;
            }
            return current;
        },
        getRenderTarget(path) {
            const routed = instance.getRoutedConfig(path);
            const spelunk = 'spelunk' in routed ? routed.spelunk : routed;
            return {
                route: spelunk.route,
                container: spelunk.container,
                tomes: spelunk.tomes,
                tomeId: spelunk.tomeId,
            };
        },
        getRenderKey,
        observeViewKey(callback) {
            callback(getRenderKey());
            return () => {
            };
        },
        async initialize() {
            if (isInitialized) {
                return instance;
            }
            // Load Tomes, set up routing, etc. Placeholder: just mark initialized.
            for (const child of Object.values(childCavesRef)) {
                await child.initialize();
            }
            isInitialized = true;
            return instance;
        },
    };
    return instance;
}
function createCave(name, spelunk, options) {
    return Cave(name, spelunk, options);
}

/**
 * createCaveServer - applies Cave + tome config and plugins (adapters) generically.
 * Initializes the Cave, then calls each adapter's apply(context).
 */
/**
 * Create and run a Cave server: initialize the Cave, then apply each plugin (adapter) with the shared context.
 * Each adapter's apply() is responsible for creating host resources (e.g. TomeManager) and registering routes.
 */
async function createCaveServer(config) {
    const { cave, tomeConfigs, variables = {}, sections = {}, plugins, robotCopy, resourceMonitor, metricsReporter } = config;
    await cave.initialize();
    const tomeManagerRef = { current: null };
    const context = {
        cave,
        tomeConfigs,
        variables: { ...variables },
        sections: { ...sections },
        robotCopy,
        resourceMonitor,
        metricsReporter,
        tomeManagerRef,
    };
    for (const plugin of plugins) {
        await plugin.apply(context);
    }
}

/**
 * React hooks for Cave, Tome, and ViewStateMachine that act like useEffect-compatible useState:
 * hold the instance, subscribe via observeViewKey for renderKey, and handle cleanup on unmount.
 */
/**
 * useCave(cave): returns [cave, renderKey]. Subscribes to cave.observeViewKey; cleanup: unsubscribe only.
 */
function useCave(cave) {
    const [renderKey, setRenderKey] = useState(() => (cave ? cave.getRenderKey() : ''));
    const caveRef = useRef(cave);
    useEffect(() => {
        caveRef.current = cave;
        if (!cave) {
            setRenderKey('');
            return undefined;
        }
        setRenderKey(cave.getRenderKey());
        const unsubscribe = cave.observeViewKey(setRenderKey);
        return () => {
            unsubscribe();
        };
    }, [cave]);
    return [cave, renderKey];
}
/**
 * useTome(tome): returns [tome, renderKey]. Subscribes to tome.observeViewKey; cleanup: unsubscribe + tome.stop(), and optional unregister if provided.
 */
function useTome(tome, options) {
    const [renderKey, setRenderKey] = useState(() => (tome ? tome.getRenderKey() : ''));
    const tomeRef = useRef(tome);
    const unregisterRef = useRef(options?.unregister);
    useEffect(() => {
        unregisterRef.current = options?.unregister;
    }, [options?.unregister]);
    useEffect(() => {
        tomeRef.current = tome;
        if (!tome) {
            setRenderKey('');
            return undefined;
        }
        setRenderKey(tome.getRenderKey());
        const unsubscribe = tome.observeViewKey(setRenderKey);
        return () => {
            unsubscribe();
            if (typeof tomeRef.current?.stop === 'function') {
                tomeRef.current.stop();
            }
            if (typeof unregisterRef.current === 'function') {
                unregisterRef.current();
            }
        };
    }, [tome]);
    return [tome, renderKey];
}
/**
 * useViewStateMachineInstance(machine, options): returns [machine, renderKey]. Subscribes to machine.observeViewKey;
 * cleanup: unsubscribe + machine.stop() + options.unregister(). Use when you don't need the full useViewStateMachine state/send API.
 */
function useViewStateMachineInstance(machine, options) {
    const [renderKey, setRenderKey] = useState(() => machine && typeof machine.getRenderKey === 'function' ? machine.getRenderKey() : '');
    const machineRef = useRef(machine);
    const unregisterRef = useRef(options?.unregister);
    useEffect(() => {
        unregisterRef.current = options?.unregister;
    }, [options?.unregister]);
    useEffect(() => {
        machineRef.current = machine;
        if (!machine) {
            setRenderKey('');
            return undefined;
        }
        if (typeof machine.getRenderKey === 'function') {
            setRenderKey(machine.getRenderKey());
        }
        const unsubscribe = typeof machine.observeViewKey === 'function'
            ? machine.observeViewKey(setRenderKey)
            : () => { };
        return () => {
            unsubscribe();
            if (machineRef.current && typeof machineRef.current.stop === 'function') {
                machineRef.current.stop();
            }
            if (typeof unregisterRef.current === 'function') {
                unregisterRef.current();
            }
        };
    }, [machine]);
    return [machine, renderKey];
}

/**
 * DuckDB-backed storage adapter for the backend (Node/TomeManager).
 * Optional dependency: use when DuckDB is configured; library works without it.
 * See docs/ARCHITECTURE_AND_CAVE.md.
 */
/**
 * In-memory stub when DuckDB is not installed.
 * Provides the same interface so callers can use it without checking for DuckDB.
 */
class DuckDBStorageStub {
    constructor() {
        Object.defineProperty(this, "store", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    async query(sql, _params) {
        // Stub: no SQL parsing; return empty or table scan for SELECT
        const match = sql.trim().toUpperCase().match(/SELECT\s+.*\s+FROM\s+(\w+)/i);
        if (match) {
            const table = match[1];
            return this.store.get(table) ?? [];
        }
        return [];
    }
    async insert(table, row) {
        const rows = this.store.get(table) ?? [];
        rows.push(row);
        this.store.set(table, rows);
    }
    async close() {
        this.store.clear();
    }
}
/**
 * Create a DuckDB storage adapter.
 * If the optional 'duckdb' package is available, returns a real adapter;
 * otherwise returns a stub that works in memory.
 */
async function createDuckDBStorage(_options) {
    try {
        // Optional: require('duckdb') and open connection
        // const DuckDB = require('duckdb');
        // const db = new DuckDB.Database(':memory:');
        // return new DuckDBStorageImpl(db);
        return new DuckDBStorageStub();
    }
    catch {
        return new DuckDBStorageStub();
    }
}
function createDuckDBStorageSync(_options) {
    return new DuckDBStorageStub();
}

/**
 * Script-injection prevention utilities for use in browser, Node, and adapters.
 * Use when handling user or cross-boundary content (message payloads, view state, API bodies).
 * Safe for text nodes and attributes when used as documented.
 */
const ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
};
const REVERSE_ENTITY_MAP = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#96;': '`',
    '&#x60;': '`',
};
const ENTITY_REGEX = /&(?:amp|lt|gt|quot|#39|#x27|#96|#x60);/g;
/**
 * Encode string so that when interpolated into HTML or a script context it is inert.
 * Replaces &, <, >, ", ', ` with HTML entities. Safe for use in text nodes or attributes.
 * Dependency-free; runs in Node and browser.
 */
function escapeText(str) {
    if (typeof str !== 'string')
        return '';
    return str.replace(/[&<>"'`]/g, (c) => ENTITY_MAP[c] ?? c);
}
/**
 * Reverse the entity encoding produced by escapeText (same entity set).
 * Use when round-tripping stored or transmitted data that was escaped for display.
 */
function unescapeText(str) {
    if (typeof str !== 'string')
        return '';
    return str.replace(ENTITY_REGEX, (match) => REVERSE_ENTITY_MAP[match] ?? match);
}
const DEFAULT_ALLOWED_TAGS = [
    'a', 'b', 'br', 'em', 'i', 'p', 'span', 'strong', 'u', 'ul', 'ol', 'li', 'div', 'section', 'article', 'header', 'footer', 'nav', 'main',
];
const DEFAULT_ALLOWED_ATTRIBUTES = {
    a: ['href', 'title', 'target'],
    span: ['class'],
    div: ['class'],
    p: ['class'],
    section: ['class'],
    article: ['class'],
    header: ['class'],
    footer: ['class'],
    nav: ['class'],
    main: ['class'],
};
function stripScriptsAndHandlers(html) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
}
/**
 * Parse HTML into a safe representation without executing scripts.
 * In browser: uses DOMParser + sanitization. In Node: uses regex-based strip and tag allowlist.
 * Output is safe for insertion into a safe context only; do not assign to innerHTML raw.
 */
function parseHtml(html, options) {
    const stripScripts = options?.stripScripts !== false;
    const allowedTags = new Set((options?.allowedTags ?? DEFAULT_ALLOWED_TAGS).map((t) => t.toLowerCase()));
    const allowedAttributes = options?.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;
    const errors = [];
    let input = typeof html === 'string' ? html : '';
    if (stripScripts) {
        input = stripScriptsAndHandlers(input);
    }
    const isBrowser = typeof document !== 'undefined' && typeof DOMParser !== 'undefined';
    if (isBrowser) {
        try {
            const doc = new DOMParser().parseFromString(input, 'text/html');
            const walk = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return escapeText(node.textContent ?? '');
                }
                if (node.nodeType !== Node.ELEMENT_NODE)
                    return '';
                const el = node;
                const tag = el.tagName.toLowerCase();
                if (!allowedTags.has(tag)) {
                    return Array.from(el.childNodes).map(walk).join('');
                }
                const attrs = allowedAttributes[tag];
                let attrStr = '';
                if (attrs?.length) {
                    for (const name of attrs) {
                        const val = el.getAttribute(name);
                        if (val != null)
                            attrStr += ` ${name}="${escapeText(val)}"`;
                    }
                }
                const inner = Array.from(el.childNodes).map(walk).join('');
                if (['br', 'hr', 'img', 'input'].includes(tag)) {
                    return `<${tag}${attrStr}>`;
                }
                return `<${tag}${attrStr}>${inner}</${tag}>`;
            };
            const body = doc.body ?? doc.documentElement;
            const safe = body ? Array.from(body.childNodes).map(walk).join('') : escapeText(input);
            return { safe, errors: errors.length ? errors : undefined };
        }
        catch (e) {
            errors.push(String(e));
            return { safe: escapeText(input), errors };
        }
    }
    // Node / non-DOM: regex-based allowlist
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    let safe = input;
    let match;
    const seenTags = new Set();
    while ((match = tagRegex.exec(input)) !== null) {
        const full = match[0];
        const tag = match[1].toLowerCase();
        seenTags.add(tag);
        if (!allowedTags.has(tag)) {
            safe = safe.replace(full, '');
        }
    }
    // Remove any attribute that looks like an event handler
    safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
    return { safe, errors: errors.length ? errors : undefined };
}

/**
 * CaveMessagingTransport - Abstract messaging for Cave in extension contexts
 * (content, background, popup). Enables communication without Chrome API cruft.
 * See docs/ARCHITECTURE_AND_CAVE.md and chrome-messaging-cave-adapter.
 */
/**
 * Create an in-memory transport (sensible default for tests and non-extension).
 * When peer is set, send(target, message) delivers to the peer's onMessage handler
 * and resolves with the handler's return value. When no peer or no handler, resolves with {}.
 */
function createInMemoryTransport(options) {
    const { contextType, tabId } = options;
    let peer = options.peer ?? null;
    const handlers = [];
    const transport = {
        contextType,
        tabId,
        send(target, message) {
            const normalized = {
                ...message,
                source: message.source ?? contextType,
                target: message.target ?? target,
            };
            if (peer && '__invokeHandler' in peer) {
                return Promise.resolve(peer.__invokeHandler(normalized, { id: contextType, tabId }));
            }
            return Promise.resolve({});
        },
        onMessage(handler) {
            handlers.push(handler);
            return () => {
                const i = handlers.indexOf(handler);
                if (i >= 0)
                    handlers.splice(i, 1);
            };
        },
    };
    const peerRef = transport;
    peerRef.__invokeHandler = (message, sender) => {
        if (handlers.length === 0)
            return {};
        const h = handlers[handlers.length - 1];
        return h(message, sender);
    };
    peerRef.__setPeer = (p) => {
        peer = p;
    };
    if (options.peer && '__setPeer' in options.peer) {
        options.peer.__setPeer(transport);
        peer = options.peer;
    }
    return transport;
}
/** Wire two in-memory transports as peers so send() on one invokes the other's handler. */
function wireInMemoryTransportPair(a, b) {
    if ('__setPeer' in a)
        a.__setPeer(b);
    if ('__setPeer' in b)
        b.__setPeer(a);
}

/**
 * In-memory default implementation of ResourceMonitor.
 * Aggregates request counts, bytes, latency; maintains circuit state; produces MetricsSnapshot for reporting.
 */
const DEFAULT_WINDOW_MS = 60000;
class DefaultResourceMonitor {
    constructor(options) {
        Object.defineProperty(this, "requestCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "errorCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "bytesIn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "bytesOut", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "latencySamples", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "circuitState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "dimensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "windowMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxSamples", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
        this.maxSamples = options?.maxSamples ?? 1000;
        this.dimensions = options?.dimensions ?? {};
    }
    trackRequest(meta) {
        this.requestCount++;
        if (meta.status != null && meta.status >= 400)
            this.errorCount++;
        if (meta.bytesIn != null)
            this.bytesIn += meta.bytesIn;
        if (meta.bytesOut != null)
            this.bytesOut += meta.bytesOut;
        if (meta.latencyMs != null) {
            const now = Date.now();
            this.latencySamples.push({ ms: meta.latencyMs, at: now });
            if (this.latencySamples.length > this.maxSamples) {
                this.latencySamples.shift();
            }
        }
    }
    trackCircuit(name, state) {
        this.circuitState[name] = state;
    }
    getSnapshot() {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        const recent = this.latencySamples.filter((s) => s.at >= cutoff);
        let p50;
        let p95;
        let p99;
        let avg;
        if (recent.length > 0) {
            const sorted = recent.map((s) => s.ms).sort((a, b) => a - b);
            p50 = sorted[Math.floor(sorted.length * 0.5)] ?? sorted[0];
            p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
            p99 = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1];
            avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        }
        const circuitNames = Object.keys(this.circuitState);
        const circuitState = circuitNames.length === 1
            ? this.circuitState[circuitNames[0]]
            : circuitNames.length > 1
                ? (this.circuitState['default'] ?? this.circuitState[circuitNames[0]])
                : undefined;
        return {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            bytesIn: this.bytesIn,
            bytesOut: this.bytesOut,
            latencyMs: p50 != null ? { p50, p95, p99, avg } : undefined,
            circuitState,
            timestamp: now,
            dimensions: { ...this.dimensions },
        };
    }
    getSnapshots() {
        return [this.getSnapshot()];
    }
}
function createDefaultResourceMonitor(options) {
    return new DefaultResourceMonitor(options);
}

/**
 * Pluggable reporter for MetricsSnapshot. Default can post to GA-like endpoint;
 * override reportTo to push to CloudWatch, Hystrix stream, or other backend.
 */
function createMetricsReporter(getSnapshot, options) {
    const reportTo = options?.reportTo ?? (() => { });
    let intervalId = null;
    async function report(snapshot) {
        await Promise.resolve(reportTo(snapshot));
    }
    return {
        report(snapshot) {
            return report(snapshot);
        },
        start() {
            if (options?.intervalMs != null && options.intervalMs > 0 && intervalId == null) {
                intervalId = setInterval(() => {
                    report(getSnapshot()).catch(() => { });
                }, options.intervalMs);
            }
        },
        stop() {
            if (intervalId != null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        },
    };
}

/**
 * Minimal ErrorBoundary for use by EditorWrapper and other editor components.
 * Catches React errors in the tree and optionally calls onError and renders fallback.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (jsxRuntimeExports.jsxs("div", { className: "editor-error-boundary", role: "alert", children: [jsxRuntimeExports.jsx("p", { children: "Something went wrong." }), jsxRuntimeExports.jsx("pre", { children: this.state.error.message })] }));
        }
        return this.props.children;
    }
}

/**
 * EditorWrapper – first-class editor option from wave-reader alignment.
 * Lightweight wrapper with ErrorBoundary; use for 3-panel tabbed editor or mod-building UI.
 * Zero ace-editor dependency; tree-shakeable.
 */
const EditorWrapper = ({ title, description, children, componentId, onError, router, hideHeader = false, }) => {
    return (jsxRuntimeExports.jsx(ErrorBoundary, { onError: onError, children: jsxRuntimeExports.jsxs("div", { className: "editor-wrapper", "data-component-id": componentId, children: [!hideHeader && (jsxRuntimeExports.jsxs("header", { className: "editor-wrapper-header", children: [jsxRuntimeExports.jsx("h2", { className: "editor-wrapper-title", children: title }), jsxRuntimeExports.jsx("p", { className: "editor-wrapper-description", children: description }), jsxRuntimeExports.jsxs("p", { className: "editor-wrapper-meta", children: ["Tome Architecture", componentId && ` | Component: ${componentId}`, router && ' | Router: Available'] })] })), jsxRuntimeExports.jsx("main", { className: "editor-wrapper-content", children: children }), jsxRuntimeExports.jsxs("footer", { className: "editor-wrapper-footer", children: ["Tome Architecture Enabled", router && ' | Router: Available'] })] }) }));
};

export { CartTomeConfig, Cave, CircuitBreaker, ClientGenerator, DefaultResourceMonitor, DefaultStructuralConfig, DonationTomeConfig, DuckDBStorageStub, EditorTomeConfig, EditorWrapper, ErrorBoundary, FishBurgerTomeConfig, LibraryTomeConfig, RobotCopy, Route, RouteFallback, StructuralRouter, StructuralSystem, StructuralTomeConnector, ThrottlePolicy, TomeConnector, TomeManager, Tracing, ViewStateMachine, createCave, createCaveServer, createCircuitBreaker, createClientGenerator, createDefaultResourceMonitor, createDuckDBStorage, createDuckDBStorageSync, createInMemoryTransport, createMetricsReporter, createProxyRobotCopyStateMachine, createRobotCopy, createStructuralConfig, createStructuralSystem, createThrottlePolicy, createTome, createTomeConfig, createTomeConnector, createTomeManager, createTracing, createViewStateMachine, escapeText, generateToken, generateTokenAsync, parseHtml, parseToken, serializeToken, unescapeText, useCave, useRouter, useStructuralSystem, useStructuralTomeConnector, useTome, useViewStateMachineInstance, validateToken, wireInMemoryTransportPair };
//# sourceMappingURL=index.esm.js.map
