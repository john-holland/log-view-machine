'use strict';

var require$$0 = require('react');
var react = require('@xstate/react');
var xstate = require('xstate');

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
        Object.defineProperty(this, "stateHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
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
        this.stateHandlers = new Map();
        this.tomeConfig = config.tomeConfig;
        // Create the XState machine
        this.machine = xstate.createMachine({
            ...config.xstateConfig,
            on: {
                ...config.xstateConfig.on,
                // Add our custom events
                VIEW_ADDED: {
                    actions: xstate.assign((context, event) => ({
                        viewStack: [...(context.viewStack || []), event.payload]
                    }))
                },
                VIEW_CLEARED: {
                    actions: xstate.assign({
                        viewStack: []
                    })
                },
                LOG_ADDED: {
                    actions: xstate.assign((context, event) => ({
                        logEntries: [...(context.logEntries || []), event.payload]
                    }))
                },
                // Sub-machine events
                SUB_MACHINE_CREATED: {
                    actions: xstate.assign((context, event) => ({
                        subMachines: { ...context.subMachines, [event.payload.id]: event.payload }
                    }))
                },
                // RobotCopy incoming message events
                ROBOTCOPY_MESSAGE: {
                    actions: xstate.assign((context, event) => ({
                        robotCopyMessages: [...(context.robotCopyMessages || []), event.payload]
                    }))
                }
            }
        });
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
    withState(stateName, handler) {
        this.stateHandlers.set(stateName, handler);
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
    // Sub-machine support
    withSubMachine(machineId, config) {
        const subMachine = new ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return this;
    }
    getSubMachine(machineId) {
        return this.subMachines.get(machineId);
    }
    // State context methods
    createStateContext(state, model) {
        return {
            state: state.value,
            model,
            transitions: state.history?.events || [],
            log: async (message, metadata) => {
                const logEntry = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message,
                    metadata: metadata || {}
                };
                this.logEntries.push(logEntry);
                this.machine.send({ type: 'LOG_ADDED', payload: logEntry });
                console.log(`[${state.value}] ${message}`, metadata);
            },
            view: (component) => {
                if (!this.isTomeSynchronized && this.tomeConfig) {
                    console.warn('Warning: view() called from Tome without synchronized ViewStateMachine. This may cause architectural issues.');
                }
                this.viewStack.push(component);
                this.machine.send({ type: 'VIEW_ADDED', payload: component });
                return component;
            },
            clear: () => {
                this.viewStack = [];
                this.machine.send({ type: 'VIEW_CLEARED' });
            },
            transition: (to) => {
                this.machine.send({ type: 'TRANSITION', payload: { to } });
            },
            send: (event) => {
                this.machine.send(event);
            },
            on: (eventName, handler) => {
                // Register event handlers for state activations
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
    // React hook for using the machine
    useViewStateMachine(initialModel) {
        const [state, send] = react.useMachine(this.machine);
        const context = this.createStateContext(state, initialModel);
        // Execute state handler if exists
        require$$0.useEffect(() => {
            const handler = this.stateHandlers.get(state.value);
            if (handler) {
                handler(context);
            }
        }, [state.value]);
        return {
            state: state.value,
            context: state.context,
            send,
            logEntries: this.logEntries,
            viewStack: this.viewStack,
            subMachines: this.subMachines,
            // Expose fluent API methods
            log: context.log,
            view: context.view,
            clear: context.clear,
            transition: context.transition,
            subMachine: context.subMachine,
            getSubMachine: context.getSubMachine
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
    withState(stateName, handler) {
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

class RobotCopy {
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
        Object.defineProperty(this, "messageBrokers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "messageQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "responseHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.initializeDefaultBrokers();
    }
    initializeDefaultBrokers() {
        // Initialize default message brokers
        this.registerMessageBroker('window-intercom', new WindowIntercomBroker());
        this.registerMessageBroker('chrome-message', new ChromeMessageBroker());
        this.registerMessageBroker('http-api', new HttpApiBroker());
        this.registerMessageBroker('graphql', new GraphQLBroker());
    }
    // Register a machine with RobotCopy
    registerMachine(machineId, machine, config) {
        this.machines.set(machineId, machine);
        this.configs.set(machineId, config);
        // Set up message brokers for this machine
        config.messageBrokers.forEach(brokerConfig => {
            const broker = this.messageBrokers.get(brokerConfig.type);
            if (broker) {
                broker.configure(brokerConfig.config);
            }
        });
    }
    // Register a custom message broker
    registerMessageBroker(type, broker) {
        this.messageBrokers.set(type, broker);
    }
    // Send a message through the appropriate broker
    async sendMessage(message) {
        const fullMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: new Date()
        };
        // Add to queue
        this.messageQueue.push(fullMessage);
        // Find the appropriate broker
        const broker = this.messageBrokers.get(message.broker);
        if (!broker) {
            throw new Error(`No message broker found for type: ${message.broker}`);
        }
        try {
            const response = await broker.send(fullMessage);
            this.handleResponse(response);
            return response;
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                messageId: fullMessage.id
            };
            this.handleResponse(errorResponse);
            return errorResponse;
        }
    }
    // Post message to window (intercom)
    async postToWindow(message, targetOrigin = '*') {
        return this.sendMessage({
            type: 'window-post',
            payload: message,
            source: 'robotcopy',
            target: 'window',
            broker: 'window-intercom'
        });
    }
    // Post message to Chrome extension
    async postToChrome(message, extensionId) {
        return this.sendMessage({
            type: 'chrome-post',
            payload: message,
            source: 'robotcopy',
            target: extensionId || 'chrome-extension',
            broker: 'chrome-message'
        });
    }
    // Post to HTTP API
    async postToHttp(message, endpoint) {
        return this.sendMessage({
            type: 'http-post',
            payload: message,
            source: 'robotcopy',
            target: endpoint,
            broker: 'http-api'
        });
    }
    // Post to GraphQL
    async postToGraphQL(query, variables) {
        return this.sendMessage({
            type: 'graphql-query',
            payload: { query, variables },
            source: 'robotcopy',
            target: 'graphql-endpoint',
            broker: 'graphql'
        });
    }
    // Discover all registered machines and their capabilities
    discover() {
        const discovery = {
            machines: new Map(),
            messageBrokers: Array.from(this.messageBrokers.keys()),
            configurations: new Map(),
            capabilities: new Map()
        };
        this.machines.forEach((machine, machineId) => {
            discovery.machines.set(machineId, machine);
            const config = this.configs.get(machineId);
            if (config) {
                discovery.configurations.set(machineId, config);
                // Analyze machine capabilities
                const capabilities = this.analyzeMachineCapabilities(machine, config);
                discovery.capabilities.set(machineId, capabilities);
            }
        });
        return discovery;
    }
    analyzeMachineCapabilities(machine, config) {
        return {
            supportedBrokers: config.messageBrokers.map(b => b.type),
            autoDiscovery: config.autoDiscovery || false,
            clientSpecification: config.clientSpecification,
            messageTypes: ['state-change', 'event-send', 'log-entry', 'view-update'],
            graphQLStates: this.extractGraphQLStates(machine)
        };
    }
    extractGraphQLStates(machine) {
        // This would analyze the machine for GraphQL states
        // For now, return a basic structure
        return [
            {
                name: 'query',
                operation: 'query',
                query: 'query GetBurger($id: ID!) { burger(id: $id) { id ingredients } }',
                variables: { id: 'string' }
            },
            {
                name: 'mutation',
                operation: 'mutation',
                query: 'mutation CreateBurger($input: BurgerInput!) { createBurger(input: $input) { id } }',
                variables: { input: 'BurgerInput' }
            }
        ];
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    handleResponse(response) {
        const handler = this.responseHandlers.get(response.messageId);
        if (handler) {
            handler(response);
            this.responseHandlers.delete(response.messageId);
        }
    }
    // Set up response handler for async operations
    onResponse(messageId, handler) {
        this.responseHandlers.set(messageId, handler);
    }
    // Get message queue
    getMessageQueue() {
        return [...this.messageQueue];
    }
    // Clear message queue
    clearMessageQueue() {
        this.messageQueue = [];
    }
}
// Window Intercom Broker
class WindowIntercomBroker {
    constructor() {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    configure(config) {
        this.config = config;
    }
    async send(message) {
        if (!this.config) {
            throw new Error('WindowIntercomBroker not configured');
        }
        return new Promise((resolve, reject) => {
            try {
                window.postMessage(message.payload, this.config.targetOrigin);
                // Set up response handler
                const responseHandler = (event) => {
                    if (event.data && event.data.messageId === message.id) {
                        window.removeEventListener('message', responseHandler);
                        resolve({
                            success: true,
                            data: event.data,
                            timestamp: new Date(),
                            messageId: message.id
                        });
                    }
                };
                window.addEventListener('message', responseHandler);
                // Timeout
                setTimeout(() => {
                    window.removeEventListener('message', responseHandler);
                    reject(new Error('Window message timeout'));
                }, this.config.timeout || 5000);
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
// Chrome Message Broker
class ChromeMessageBroker {
    constructor() {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    configure(config) {
        this.config = config;
    }
    async send(message) {
        if (!this.config) {
            throw new Error('ChromeMessageBroker not configured');
        }
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage(this.config.extensionId, message.payload, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        }
                        else {
                            resolve({
                                success: true,
                                data: response,
                                timestamp: new Date(),
                                messageId: message.id
                            });
                        }
                    });
                }
                else {
                    reject(new Error('Chrome runtime not available'));
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
// HTTP API Broker
class HttpApiBroker {
    constructor() {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    configure(config) {
        this.config = config;
    }
    async send(message) {
        if (!this.config) {
            throw new Error('HttpApiBroker not configured');
        }
        try {
            const response = await fetch(`${this.config.baseUrl}${message.target}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers
                },
                body: JSON.stringify(message.payload),
                signal: AbortSignal.timeout(this.config.timeout || 10000)
            });
            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                error: response.ok ? undefined : data.error || 'HTTP request failed',
                timestamp: new Date(),
                messageId: message.id
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'HTTP request failed',
                timestamp: new Date(),
                messageId: message.id
            };
        }
    }
}
// GraphQL Broker
class GraphQLBroker {
    constructor() {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    configure(config) {
        this.config = config;
    }
    async send(message) {
        if (!this.config) {
            throw new Error('GraphQLBroker not configured');
        }
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers
                },
                body: JSON.stringify({
                    query: message.payload.query,
                    variables: message.payload.variables
                }),
                signal: AbortSignal.timeout(this.config.timeout || 10000)
            });
            const data = await response.json();
            return {
                success: !data.errors,
                data: data.data,
                error: data.errors ? data.errors[0].message : undefined,
                timestamp: new Date(),
                messageId: message.id
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'GraphQL request failed',
                timestamp: new Date(),
                messageId: message.id
            };
        }
    }
}
// Helper function to create RobotCopy
function createRobotCopy() {
    return new RobotCopy();
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

exports.ChromeMessageBroker = ChromeMessageBroker;
exports.ClientGenerator = ClientGenerator;
exports.GraphQLBroker = GraphQLBroker;
exports.HttpApiBroker = HttpApiBroker;
exports.RobotCopy = RobotCopy;
exports.ViewStateMachine = ViewStateMachine;
exports.WindowIntercomBroker = WindowIntercomBroker;
exports.createClientGenerator = createClientGenerator;
exports.createProxyRobotCopyStateMachine = createProxyRobotCopyStateMachine;
exports.createRobotCopy = createRobotCopy;
exports.createViewStateMachine = createViewStateMachine;
//# sourceMappingURL=index.js.map
