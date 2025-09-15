(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20170427
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in window.self) {
  // Full polyfill for browsers with no classList support
  // Including IE < Edge missing SVGElement.classList
  if (!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {
    (function (view) {
      "use strict";

      if (!('Element' in view)) return;
      var classListProp = "classList",
        protoProp = "prototype",
        elemCtrProto = view.Element[protoProp],
        objCtr = Object,
        strTrim = String[protoProp].trim || function () {
          return this.replace(/^\s+|\s+$/g, "");
        },
        arrIndexOf = Array[protoProp].indexOf || function (item) {
          var i = 0,
            len = this.length;
          for (; i < len; i++) {
            if (i in this && this[i] === item) {
              return i;
            }
          }
          return -1;
        }
        // Vendors: please allow content code to instantiate DOMExceptions
        ,
        DOMEx = function (type, message) {
          this.name = type;
          this.code = DOMException[type];
          this.message = message;
        },
        checkTokenAndGetIndex = function (classList, token) {
          if (token === "") {
            throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
          }
          if (/\s/.test(token)) {
            throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
          }
          return arrIndexOf.call(classList, token);
        },
        ClassList = function (elem) {
          var trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
            classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
            i = 0,
            len = classes.length;
          for (; i < len; i++) {
            this.push(classes[i]);
          }
          this._updateClassName = function () {
            elem.setAttribute("class", this.toString());
          };
        },
        classListProto = ClassList[protoProp] = [],
        classListGetter = function () {
          return new ClassList(this);
        };
      // Most DOMException implementations don't allow calling DOMException's toString()
      // on non-DOMExceptions. Error's toString() is sufficient here.
      DOMEx[protoProp] = Error[protoProp];
      classListProto.item = function (i) {
        return this[i] || null;
      };
      classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
      };
      classListProto.add = function () {
        var tokens = arguments,
          i = 0,
          l = tokens.length,
          token,
          updated = false;
        do {
          token = tokens[i] + "";
          if (checkTokenAndGetIndex(this, token) === -1) {
            this.push(token);
            updated = true;
          }
        } while (++i < l);
        if (updated) {
          this._updateClassName();
        }
      };
      classListProto.remove = function () {
        var tokens = arguments,
          i = 0,
          l = tokens.length,
          token,
          updated = false,
          index;
        do {
          token = tokens[i] + "";
          index = checkTokenAndGetIndex(this, token);
          while (index !== -1) {
            this.splice(index, 1);
            updated = true;
            index = checkTokenAndGetIndex(this, token);
          }
        } while (++i < l);
        if (updated) {
          this._updateClassName();
        }
      };
      classListProto.toggle = function (token, force) {
        token += "";
        var result = this.contains(token),
          method = result ? force !== true && "remove" : force !== false && "add";
        if (method) {
          this[method](token);
        }
        if (force === true || force === false) {
          return force;
        } else {
          return !result;
        }
      };
      classListProto.toString = function () {
        return this.join(" ");
      };
      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: classListGetter,
          enumerable: true,
          configurable: true
        };
        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) {
          // IE 8 doesn't support enumerable:true
          // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
          // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
          if (ex.number === undefined || ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
      }
    })(window.self);
  }

  // There is full or partial native classList support, so just check if we need
  // to normalize the add/remove and toggle APIs.

  (function () {
    "use strict";

    var testElement = document.createElement("_");
    testElement.classList.add("c1", "c2");

    // Polyfill for IE 10/11 and Firefox <26, where classList.add and
    // classList.remove exist but support only one argument at a time.
    if (!testElement.classList.contains("c2")) {
      var createMethod = function (method) {
        var original = DOMTokenList.prototype[method];
        DOMTokenList.prototype[method] = function (token) {
          var i,
            len = arguments.length;
          for (i = 0; i < len; i++) {
            token = arguments[i];
            original.call(this, token);
          }
        };
      };
      createMethod('add');
      createMethod('remove');
    }
    testElement.classList.toggle("c3", false);

    // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
    // support the second argument.
    if (testElement.classList.contains("c3")) {
      var _toggle = DOMTokenList.prototype.toggle;
      DOMTokenList.prototype.toggle = function (token, force) {
        if (1 in arguments && !this.contains(token) === !force) {
          return force;
        } else {
          return _toggle.call(this, token);
        }
      };
    }
    testElement = null;
  })();
}

},{}],2:[function(require,module,exports){
"use strict";

// element-closest | CC0-1.0 | github.com/jonathantneal/closest

(function (ElementProto) {
  if (typeof ElementProto.matches !== 'function') {
    ElementProto.matches = ElementProto.msMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.webkitMatchesSelector || function matches(selector) {
      var element = this;
      var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
      var index = 0;
      while (elements[index] && elements[index] !== element) {
        ++index;
      }
      return Boolean(elements[index]);
    };
  }
  if (typeof ElementProto.closest !== 'function') {
    ElementProto.closest = function closest(selector) {
      var element = this;
      while (element && element.nodeType === 1) {
        if (element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
      }
      return null;
    };
  }
})(window.Element.prototype);

},{}],3:[function(require,module,exports){
"use strict";

/* global define, KeyboardEvent, module */

(function () {
  var keyboardeventKeyPolyfill = {
    polyfill: polyfill,
    keys: {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    }
  };

  // Function keys (F1-24).
  var i;
  for (i = 1; i < 25; i++) {
    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
  }

  // Printable ASCII characters.
  var letter = '';
  for (i = 65; i < 91; i++) {
    letter = String.fromCharCode(i);
    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
  }
  function polyfill() {
    if (!('KeyboardEvent' in window) || 'key' in KeyboardEvent.prototype) {
      return false;
    }

    // Polyfill `key` on `KeyboardEvent`.
    var proto = {
      get: function (x) {
        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];
        if (Array.isArray(key)) {
          key = key[+this.shiftKey];
        }
        return key;
      }
    };
    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
    return proto;
  }
  if (typeof define === 'function' && define.amd) {
    define('keyboardevent-key-polyfill', keyboardeventKeyPolyfill);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    module.exports = keyboardeventKeyPolyfill;
  } else if (window) {
    window.keyboardeventKeyPolyfill = keyboardeventKeyPolyfill;
  }
})();

},{}],4:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;
function toObject(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
}
function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }

    // Detect buggy property enumeration order in older V8 versions.

    // https://bugs.chromium.org/p/v8/issues/detail?id=4118
    var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test2 = {};
    for (var i = 0; i < 10; i++) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test3 = {};
    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (err) {
    // We don't expect any of the above to throw, but better to be safe.
    return false;
  }
}
module.exports = shouldUseNative() ? Object.assign : function (target, source) {
  var from;
  var to = toObject(target);
  var symbols;
  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);
    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }
  return to;
};

},{}],5:[function(require,module,exports){
"use strict";

const assign = require('object-assign');
const delegate = require('../delegate');
const delegateAll = require('../delegateAll');
const DELEGATE_PATTERN = /^(.+):delegate\((.+)\)$/;
const SPACE = ' ';
const getListeners = function (type, handler) {
  var match = type.match(DELEGATE_PATTERN);
  var selector;
  if (match) {
    type = match[1];
    selector = match[2];
  }
  var options;
  if (typeof handler === 'object') {
    options = {
      capture: popKey(handler, 'capture'),
      passive: popKey(handler, 'passive')
    };
  }
  var listener = {
    selector: selector,
    delegate: typeof handler === 'object' ? delegateAll(handler) : selector ? delegate(selector, handler) : handler,
    options: options
  };
  if (type.indexOf(SPACE) > -1) {
    return type.split(SPACE).map(function (_type) {
      return assign({
        type: _type
      }, listener);
    });
  } else {
    listener.type = type;
    return [listener];
  }
};
var popKey = function (obj, key) {
  var value = obj[key];
  delete obj[key];
  return value;
};
module.exports = function behavior(events, props) {
  const listeners = Object.keys(events).reduce(function (memo, type) {
    var listeners = getListeners(type, events[type]);
    return memo.concat(listeners);
  }, []);
  return assign({
    add: function addBehavior(element) {
      listeners.forEach(function (listener) {
        element.addEventListener(listener.type, listener.delegate, listener.options);
      });
    },
    remove: function removeBehavior(element) {
      listeners.forEach(function (listener) {
        element.removeEventListener(listener.type, listener.delegate, listener.options);
      });
    }
  }, props);
};

},{"../delegate":8,"../delegateAll":7,"object-assign":4}],6:[function(require,module,exports){
"use strict";

module.exports = function compose(functions) {
  return function (e) {
    return functions.some(function (fn) {
      return fn.call(this, e) === false;
    }, this);
  };
};

},{}],7:[function(require,module,exports){
"use strict";

const delegate = require('../delegate');
const compose = require('../compose');
const SPLAT = '*';
module.exports = function delegateAll(selectors) {
  const keys = Object.keys(selectors);

  // XXX optimization: if there is only one handler and it applies to
  // all elements (the "*" CSS selector), then just return that
  // handler
  if (keys.length === 1 && keys[0] === SPLAT) {
    return selectors[SPLAT];
  }
  const delegates = keys.reduce(function (memo, selector) {
    memo.push(delegate(selector, selectors[selector]));
    return memo;
  }, []);
  return compose(delegates);
};

},{"../compose":6,"../delegate":8}],8:[function(require,module,exports){
"use strict";

// polyfill Element.prototype.closest
require('element-closest');
module.exports = function delegate(selector, fn) {
  return function delegation(event) {
    var target = event.target.closest(selector);
    if (target) {
      return fn.call(target, event);
    }
  };
};

},{"element-closest":2}],9:[function(require,module,exports){
"use strict";

module.exports = function ignore(element, fn) {
  return function ignorance(e) {
    if (element !== e.target && !element.contains(e.target)) {
      return fn.call(this, e);
    }
  };
};

},{}],10:[function(require,module,exports){
"use strict";

module.exports = {
  behavior: require('./behavior'),
  delegate: require('./delegate'),
  delegateAll: require('./delegateAll'),
  ignore: require('./ignore'),
  keymap: require('./keymap')
};

},{"./behavior":5,"./delegate":8,"./delegateAll":7,"./ignore":9,"./keymap":11}],11:[function(require,module,exports){
"use strict";

require('keyboardevent-key-polyfill');

// these are the only relevant modifiers supported on all platforms,
// according to MDN:
// <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState>
const MODIFIERS = {
  'Alt': 'altKey',
  'Control': 'ctrlKey',
  'Ctrl': 'ctrlKey',
  'Shift': 'shiftKey'
};
const MODIFIER_SEPARATOR = '+';
const getEventKey = function (event, hasModifiers) {
  var key = event.key;
  if (hasModifiers) {
    for (var modifier in MODIFIERS) {
      if (event[MODIFIERS[modifier]] === true) {
        key = [modifier, key].join(MODIFIER_SEPARATOR);
      }
    }
  }
  return key;
};
module.exports = function keymap(keys) {
  const hasModifiers = Object.keys(keys).some(function (key) {
    return key.indexOf(MODIFIER_SEPARATOR) > -1;
  });
  return function (event) {
    var key = getEventKey(event, hasModifiers);
    return [key, key.toLowerCase()].reduce(function (result, _key) {
      if (_key in keys) {
        result = keys[key].call(this, event);
      }
      return result;
    }, undefined);
  };
};
module.exports.MODIFIERS = MODIFIERS;

},{"keyboardevent-key-polyfill":3}],12:[function(require,module,exports){
"use strict";

module.exports = function once(listener, options) {
  var wrapped = function wrappedOnce(e) {
    e.currentTarget.removeEventListener(e.type, wrapped, options);
    return listener.call(this, e);
  };
  return wrapped;
};

},{}],13:[function(require,module,exports){
'use strict';

var RE_TRIM = /(^\s+)|(\s+$)/g;
var RE_SPLIT = /\s+/;
var trim = String.prototype.trim ? function (str) {
  return str.trim();
} : function (str) {
  return str.replace(RE_TRIM, '');
};
var queryById = function (id) {
  return this.querySelector('[id="' + id.replace(/"/g, '\\"') + '"]');
};
module.exports = function resolveIds(ids, doc) {
  if (typeof ids !== 'string') {
    throw new Error('Expected a string but got ' + typeof ids);
  }
  if (!doc) {
    doc = window.document;
  }
  var getElementById = doc.getElementById ? doc.getElementById.bind(doc) : queryById.bind(doc);
  ids = trim(ids).split(RE_SPLIT);

  // XXX we can short-circuit here because trimming and splitting a
  // string of just whitespace produces an array containing a single,
  // empty string
  if (ids.length === 1 && ids[0] === '') {
    return [];
  }
  return ids.map(function (id) {
    var el = getElementById(id);
    if (!el) {
      throw new Error('no element with id: "' + id + '"');
    }
    return el;
  });
};

},{}],14:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const toggleFormInput = require("../../uswds-core/src/js/utils/toggle-form-input");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const LINK = `.${PREFIX}-show-password`;
function toggle(event) {
  event.preventDefault();
  toggleFormInput(this);
}
module.exports = behavior({
  [CLICK]: {
    [LINK]: toggle
  }
});

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/toggle-form-input":56}],15:[function(require,module,exports){
"use strict";

const select = require("../../uswds-core/src/js/utils/select");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const isElementInViewport = require("../../uswds-core/src/js/utils/is-in-viewport");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const ACCORDION = `.${PREFIX}-accordion, .${PREFIX}-accordion--bordered`;
const BANNER_BUTTON = `.${PREFIX}-banner__button`;
const BUTTON = `.${PREFIX}-accordion__button[aria-controls]:not(${BANNER_BUTTON})`;
const EXPANDED = "aria-expanded";
const MULTISELECTABLE = "data-allow-multiple";

/**
 * Get an Array of button elements belonging directly to the given
 * accordion element.
 * @param {HTMLElement} accordion
 * @return {array<HTMLButtonElement>}
 */
const getAccordionButtons = accordion => {
  const buttons = select(BUTTON, accordion);
  return buttons.filter(button => button.closest(ACCORDION) === accordion);
};

/**
 * Toggle a button's "pressed" state, optionally providing a target
 * state.
 *
 * @param {HTMLButtonElement} button
 * @param {boolean?} expanded If no state is provided, the current
 * state will be toggled (from false to true, and vice-versa).
 * @return {boolean} the resulting state
 */
const toggleButton = (button, expanded) => {
  const accordion = button.closest(ACCORDION);
  let safeExpanded = expanded;
  if (!accordion) {
    throw new Error(`${BUTTON} is missing outer ${ACCORDION}`);
  }
  safeExpanded = toggle(button, expanded);

  // XXX multiselectable is opt-in, to preserve legacy behavior
  const multiselectable = accordion.hasAttribute(MULTISELECTABLE);
  if (safeExpanded && !multiselectable) {
    getAccordionButtons(accordion).forEach(other => {
      if (other !== button) {
        toggle(other, false);
      }
    });
  }
};

/**
 * @param {HTMLButtonElement} button
 * @return {boolean} true
 */
const showButton = button => toggleButton(button, true);

/**
 * @param {HTMLButtonElement} button
 * @return {boolean} false
 */
const hideButton = button => toggleButton(button, false);
const accordion = behavior({
  [CLICK]: {
    [BUTTON]() {
      toggleButton(this);
      if (this.getAttribute(EXPANDED) === "true") {
        // We were just expanded, but if another accordion was also just
        // collapsed, we may no longer be in the viewport. This ensures
        // that we are still visible, so the user isn't confused.
        if (!isElementInViewport(this)) this.scrollIntoView();
      }
    }
  }
}, {
  init(root) {
    select(BUTTON, root).forEach(button => {
      const expanded = button.getAttribute(EXPANDED) === "true";
      toggleButton(button, expanded);
    });
  },
  ACCORDION,
  BUTTON,
  show: showButton,
  hide: hideButton,
  toggle: toggleButton,
  getButtons: getAccordionButtons
});
module.exports = accordion;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/is-in-viewport":49,"../../uswds-core/src/js/utils/select":54,"../../uswds-core/src/js/utils/toggle":57}],16:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const HEADER = `.${PREFIX}-banner__header`;
const EXPANDED_CLASS = `${PREFIX}-banner__header--expanded`;
const BANNER_BUTTON = `${HEADER} [aria-controls]`;

/**
 * Toggle Banner display and class.
 * @param {Event} event
 */
const toggleBanner = function toggleEl(event) {
  event.preventDefault();
  const trigger = event.target.closest(BANNER_BUTTON);
  toggle(trigger);
  this.closest(HEADER).classList.toggle(EXPANDED_CLASS);
};
module.exports = behavior({
  [CLICK]: {
    [BANNER_BUTTON]: toggleBanner
  }
}, {
  init(root) {
    // select(BANNER_BUTTON, root).forEach((button) => {
    //   const expanded = button.getAttribute(EXPANDED_CLASS) === "true";
    //   toggle(button, expanded);
    // });
  }
});

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select":54,"../../uswds-core/src/js/utils/toggle":57}],17:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const ANCHOR_BUTTON = `a[class*="usa-button"]`;
const toggleButton = event => {
  event.preventDefault();
  event.target.click();
};
const anchorButton = behavior({
  keydown: {
    [ANCHOR_BUTTON]: keymap({
      " ": toggleButton
    })
  }
});
module.exports = anchorButton;

},{"../../uswds-core/src/js/utils/behavior":46,"receptor/keymap":11}],18:[function(require,module,exports){
"use strict";

const select = require("../../uswds-core/src/js/utils/select");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const debounce = require("../../uswds-core/src/js/utils/debounce");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const CHARACTER_COUNT_CLASS = `${PREFIX}-character-count`;
const CHARACTER_COUNT = `.${CHARACTER_COUNT_CLASS}`;
const INPUT = `.${PREFIX}-character-count__field`;
const MESSAGE = `.${PREFIX}-character-count__message`;
const VALIDATION_MESSAGE = "The content is too long.";
const MESSAGE_INVALID_CLASS = `${PREFIX}-character-count__status--invalid`;
const STATUS_MESSAGE_CLASS = `${CHARACTER_COUNT_CLASS}__status`;
const STATUS_MESSAGE_SR_ONLY_CLASS = `${CHARACTER_COUNT_CLASS}__sr-status`;
const STATUS_MESSAGE = `.${STATUS_MESSAGE_CLASS}`;
const STATUS_MESSAGE_SR_ONLY = `.${STATUS_MESSAGE_SR_ONLY_CLASS}`;
const DEFAULT_STATUS_LABEL = `characters allowed`;

/**
 * Returns the root and message element for an character count input
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl The character count input element
 * @returns {CharacterCountElements} elements The root and message element.
 */
const getCharacterCountElements = inputEl => {
  const characterCountEl = inputEl.closest(CHARACTER_COUNT);
  if (!characterCountEl) {
    throw new Error(`${INPUT} is missing outer ${CHARACTER_COUNT}`);
  }
  const messageEl = characterCountEl.querySelector(MESSAGE);
  if (!messageEl) {
    throw new Error(`${CHARACTER_COUNT} is missing inner ${MESSAGE}`);
  }
  return {
    characterCountEl,
    messageEl
  };
};

/**
 * Move maxlength attribute to a data attribute on usa-character-count
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl The character count input element
 */
const setDataLength = inputEl => {
  const {
    characterCountEl
  } = getCharacterCountElements(inputEl);
  const maxlength = inputEl.getAttribute("maxlength");
  if (!maxlength) return;
  inputEl.removeAttribute("maxlength");
  characterCountEl.setAttribute("data-maxlength", maxlength);
};

/**
 * Create and append status messages for visual and screen readers
 *
 * @param {HTMLDivElement} characterCountEl - Div with `.usa-character-count` class
 * @description  Create two status messages for number of characters left;
 * one visual status and another for screen readers
 */
const createStatusMessages = characterCountEl => {
  const statusMessage = document.createElement("div");
  const srStatusMessage = document.createElement("div");
  const maxLength = characterCountEl.dataset.maxlength;
  const defaultMessage = `${maxLength} ${DEFAULT_STATUS_LABEL}`;
  statusMessage.classList.add(`${STATUS_MESSAGE_CLASS}`, "usa-hint");
  srStatusMessage.classList.add(`${STATUS_MESSAGE_SR_ONLY_CLASS}`, "usa-sr-only");
  statusMessage.setAttribute("aria-hidden", true);
  srStatusMessage.setAttribute("aria-live", "polite");
  statusMessage.textContent = defaultMessage;
  srStatusMessage.textContent = defaultMessage;
  characterCountEl.append(statusMessage, srStatusMessage);
};

/**
 * Returns message with how many characters are left
 *
 * @param {number} currentLength - The number of characters used
 * @param {number} maxLength - The total number of characters allowed
 * @returns {string} A string description of how many characters are left
 */
const getCountMessage = (currentLength, maxLength) => {
  let newMessage = "";
  if (currentLength === 0) {
    newMessage = `${maxLength} ${DEFAULT_STATUS_LABEL}`;
  } else {
    const difference = Math.abs(maxLength - currentLength);
    const characters = `character${difference === 1 ? "" : "s"}`;
    const guidance = currentLength > maxLength ? "over limit" : "left";
    newMessage = `${difference} ${characters} ${guidance}`;
  }
  return newMessage;
};

/**
 * Updates the character count status for screen readers after a 1000ms delay.
 *
 * @param {HTMLElement} msgEl - The screen reader status message element
 * @param {string} statusMessage - A string of the current character status
 */
const srUpdateStatus = debounce((msgEl, statusMessage) => {
  const srStatusMessage = msgEl;
  srStatusMessage.textContent = statusMessage;
}, 1000);

/**
 * Update the character count component
 *
 * @description On input, it will update visual status, screenreader
 * status and update input validation (if over character length)
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl The character count input element
 */
const updateCountMessage = inputEl => {
  const {
    characterCountEl
  } = getCharacterCountElements(inputEl);
  const currentLength = inputEl.value.length;
  const maxLength = parseInt(characterCountEl.getAttribute("data-maxlength"), 10);
  const statusMessage = characterCountEl.querySelector(STATUS_MESSAGE);
  const srStatusMessage = characterCountEl.querySelector(STATUS_MESSAGE_SR_ONLY);
  const currentStatusMessage = getCountMessage(currentLength, maxLength);
  if (!maxLength) return;
  const isOverLimit = currentLength && currentLength > maxLength;
  statusMessage.textContent = currentStatusMessage;
  srUpdateStatus(srStatusMessage, currentStatusMessage);
  if (isOverLimit && !inputEl.validationMessage) {
    inputEl.setCustomValidity(VALIDATION_MESSAGE);
  }
  if (!isOverLimit && inputEl.validationMessage === VALIDATION_MESSAGE) {
    inputEl.setCustomValidity("");
  }
  statusMessage.classList.toggle(MESSAGE_INVALID_CLASS, isOverLimit);
};

/**
 * Initialize component
 *
 * @description On init this function will create elements and update any
 * attributes so it can tell the user how many characters are left.
 * @param  {HTMLInputElement|HTMLTextAreaElement} inputEl the components input
 */
const enhanceCharacterCount = inputEl => {
  const {
    characterCountEl,
    messageEl
  } = getCharacterCountElements(inputEl);

  // Hide hint and remove aria-live for backwards compatibility
  messageEl.classList.add("usa-sr-only");
  messageEl.removeAttribute("aria-live");
  setDataLength(inputEl);
  createStatusMessages(characterCountEl);
};
const characterCount = behavior({
  input: {
    [INPUT]() {
      updateCountMessage(this);
    }
  }
}, {
  init(root) {
    select(INPUT, root).forEach(input => enhanceCharacterCount(input));
  },
  MESSAGE_INVALID_CLASS,
  VALIDATION_MESSAGE,
  STATUS_MESSAGE_CLASS,
  STATUS_MESSAGE_SR_ONLY_CLASS,
  DEFAULT_STATUS_LABEL,
  createStatusMessages,
  getCountMessage,
  updateCountMessage
});
module.exports = characterCount;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/debounce":47,"../../uswds-core/src/js/utils/select":54}],19:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const COMBO_BOX_CLASS = `${PREFIX}-combo-box`;
const COMBO_BOX_PRISTINE_CLASS = `${COMBO_BOX_CLASS}--pristine`;
const SELECT_CLASS = `${COMBO_BOX_CLASS}__select`;
const INPUT_CLASS = `${COMBO_BOX_CLASS}__input`;
const CLEAR_INPUT_BUTTON_CLASS = `${COMBO_BOX_CLASS}__clear-input`;
const CLEAR_INPUT_BUTTON_WRAPPER_CLASS = `${CLEAR_INPUT_BUTTON_CLASS}__wrapper`;
const INPUT_BUTTON_SEPARATOR_CLASS = `${COMBO_BOX_CLASS}__input-button-separator`;
const TOGGLE_LIST_BUTTON_CLASS = `${COMBO_BOX_CLASS}__toggle-list`;
const TOGGLE_LIST_BUTTON_WRAPPER_CLASS = `${TOGGLE_LIST_BUTTON_CLASS}__wrapper`;
const LIST_CLASS = `${COMBO_BOX_CLASS}__list`;
const LIST_OPTION_CLASS = `${COMBO_BOX_CLASS}__list-option`;
const LIST_OPTION_FOCUSED_CLASS = `${LIST_OPTION_CLASS}--focused`;
const LIST_OPTION_SELECTED_CLASS = `${LIST_OPTION_CLASS}--selected`;
const STATUS_CLASS = `${COMBO_BOX_CLASS}__status`;
const COMBO_BOX = `.${COMBO_BOX_CLASS}`;
const SELECT = `.${SELECT_CLASS}`;
const INPUT = `.${INPUT_CLASS}`;
const CLEAR_INPUT_BUTTON = `.${CLEAR_INPUT_BUTTON_CLASS}`;
const TOGGLE_LIST_BUTTON = `.${TOGGLE_LIST_BUTTON_CLASS}`;
const LIST = `.${LIST_CLASS}`;
const LIST_OPTION = `.${LIST_OPTION_CLASS}`;
const LIST_OPTION_FOCUSED = `.${LIST_OPTION_FOCUSED_CLASS}`;
const LIST_OPTION_SELECTED = `.${LIST_OPTION_SELECTED_CLASS}`;
const STATUS = `.${STATUS_CLASS}`;
const DEFAULT_FILTER = ".*{{query}}.*";
const noop = () => {};

/**
 * set the value of the element and dispatch a change event
 *
 * @param {HTMLInputElement|HTMLSelectElement} el The element to update
 * @param {string} value The new value of the element
 */
const changeElementValue = (el, value = "") => {
  const elementToChange = el;
  elementToChange.value = value;
  const event = new CustomEvent("change", {
    bubbles: true,
    cancelable: true,
    detail: {
      value
    }
  });
  elementToChange.dispatchEvent(event);
};

/**
 * The elements within the combo box.
 * @typedef {Object} ComboBoxContext
 * @property {HTMLElement} comboBoxEl
 * @property {HTMLSelectElement} selectEl
 * @property {HTMLInputElement} inputEl
 * @property {HTMLUListElement} listEl
 * @property {HTMLDivElement} statusEl
 * @property {HTMLLIElement} focusedOptionEl
 * @property {HTMLLIElement} selectedOptionEl
 * @property {HTMLButtonElement} toggleListBtnEl
 * @property {HTMLButtonElement} clearInputBtnEl
 * @property {boolean} isPristine
 * @property {boolean} disableFiltering
 */

/**
 * Get an object of elements belonging directly to the given
 * combo box component.
 *
 * @param {HTMLElement} el the element within the combo box
 * @returns {ComboBoxContext} elements
 */
const getComboBoxContext = el => {
  const comboBoxEl = el.closest(COMBO_BOX);
  if (!comboBoxEl) {
    throw new Error(`Element is missing outer ${COMBO_BOX}`);
  }
  const selectEl = comboBoxEl.querySelector(SELECT);
  const inputEl = comboBoxEl.querySelector(INPUT);
  const listEl = comboBoxEl.querySelector(LIST);
  const statusEl = comboBoxEl.querySelector(STATUS);
  const focusedOptionEl = comboBoxEl.querySelector(LIST_OPTION_FOCUSED);
  const selectedOptionEl = comboBoxEl.querySelector(LIST_OPTION_SELECTED);
  const toggleListBtnEl = comboBoxEl.querySelector(TOGGLE_LIST_BUTTON);
  const clearInputBtnEl = comboBoxEl.querySelector(CLEAR_INPUT_BUTTON);
  const isPristine = comboBoxEl.classList.contains(COMBO_BOX_PRISTINE_CLASS);
  const disableFiltering = comboBoxEl.dataset.disableFiltering === "true";
  return {
    comboBoxEl,
    selectEl,
    inputEl,
    listEl,
    statusEl,
    focusedOptionEl,
    selectedOptionEl,
    toggleListBtnEl,
    clearInputBtnEl,
    isPristine,
    disableFiltering
  };
};

/**
 * Disable the combo-box component
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const disable = el => {
  const {
    inputEl,
    toggleListBtnEl,
    clearInputBtnEl
  } = getComboBoxContext(el);
  clearInputBtnEl.hidden = true;
  clearInputBtnEl.disabled = true;
  toggleListBtnEl.disabled = true;
  inputEl.disabled = true;
};

/**
 * Check for aria-disabled on initialization
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const ariaDisable = el => {
  const {
    inputEl,
    toggleListBtnEl,
    clearInputBtnEl
  } = getComboBoxContext(el);
  clearInputBtnEl.hidden = true;
  clearInputBtnEl.setAttribute("aria-disabled", true);
  toggleListBtnEl.setAttribute("aria-disabled", true);
  inputEl.setAttribute("aria-disabled", true);
};

/**
 * Enable the combo-box component
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const enable = el => {
  const {
    inputEl,
    toggleListBtnEl,
    clearInputBtnEl
  } = getComboBoxContext(el);
  clearInputBtnEl.hidden = false;
  clearInputBtnEl.disabled = false;
  toggleListBtnEl.disabled = false;
  inputEl.disabled = false;
};

/**
 * Enhance a select element into a combo box component.
 *
 * @param {HTMLElement} _comboBoxEl The initial element of the combo box component
 */
const enhanceComboBox = _comboBoxEl => {
  const comboBoxEl = _comboBoxEl.closest(COMBO_BOX);
  if (comboBoxEl.dataset.enhanced) return;
  const selectEl = comboBoxEl.querySelector("select");
  if (!selectEl) {
    throw new Error(`${COMBO_BOX} is missing inner select`);
  }
  const selectId = selectEl.id;
  const selectLabel = document.querySelector(`label[for="${selectId}"]`);
  const listId = `${selectId}--list`;
  const listIdLabel = `${selectId}-label`;
  const assistiveHintID = `${selectId}--assistiveHint`;
  const additionalAttributes = [];
  const {
    defaultValue
  } = comboBoxEl.dataset;
  const {
    placeholder
  } = comboBoxEl.dataset;
  let selectedOption;
  if (placeholder) {
    additionalAttributes.push({
      placeholder
    });
  }
  if (defaultValue) {
    for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
      const optionEl = selectEl.options[i];
      if (optionEl.value === defaultValue) {
        selectedOption = optionEl;
        break;
      }
    }
  }

  /**
   * Throw error if combobox is missing a label or label is missing
   * `for` attribute. Otherwise, set the ID to match the <ul> aria-labelledby
   */
  if (!selectLabel || !selectLabel.matches(`label[for="${selectId}"]`)) {
    throw new Error(`${COMBO_BOX} for ${selectId} is either missing a label or a "for" attribute`);
  } else {
    selectLabel.setAttribute("id", listIdLabel);
  }
  selectLabel.setAttribute("id", listIdLabel);
  selectEl.setAttribute("aria-hidden", "true");
  selectEl.setAttribute("tabindex", "-1");
  selectEl.classList.add("usa-sr-only", SELECT_CLASS);
  selectEl.id = "";
  selectEl.value = "";
  ["required", "aria-label", "aria-labelledby"].forEach(name => {
    if (selectEl.hasAttribute(name)) {
      const value = selectEl.getAttribute(name);
      additionalAttributes.push({
        [name]: value
      });
      selectEl.removeAttribute(name);
    }
  });

  // sanitize doesn't like functions in template literals
  const input = document.createElement("input");
  input.setAttribute("id", selectId);
  input.setAttribute("aria-owns", listId);
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-describedby", assistiveHintID);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("class", INPUT_CLASS);
  input.setAttribute("type", "text");
  input.setAttribute("role", "combobox");
  additionalAttributes.forEach(attr => Object.keys(attr).forEach(key => {
    const value = Sanitizer.escapeHTML`${attr[key]}`;
    input.setAttribute(key, value);
  }));
  comboBoxEl.insertAdjacentElement("beforeend", input);
  comboBoxEl.insertAdjacentHTML("beforeend", Sanitizer.escapeHTML`
    <span class="${CLEAR_INPUT_BUTTON_WRAPPER_CLASS}" tabindex="-1">
        <button type="button" class="${CLEAR_INPUT_BUTTON_CLASS}" aria-label="Clear the select contents">&nbsp;</button>
      </span>
      <span class="${INPUT_BUTTON_SEPARATOR_CLASS}">&nbsp;</span>
      <span class="${TOGGLE_LIST_BUTTON_WRAPPER_CLASS}" tabindex="-1">
        <button type="button" tabindex="-1" class="${TOGGLE_LIST_BUTTON_CLASS}" aria-label="Toggle the dropdown list">&nbsp;</button>
      </span>
      <ul
        tabindex="-1"
        id="${listId}"
        class="${LIST_CLASS}"
        role="listbox"
        aria-labelledby="${listIdLabel}"
        hidden>
      </ul>
      <div class="${STATUS_CLASS} usa-sr-only" role="status"></div>
      <span id="${assistiveHintID}" class="usa-sr-only">
        When autocomplete results are available use up and down arrows to review and enter to select.
        Touch device users, explore by touch or with swipe gestures.
      </span>`);
  if (selectedOption) {
    const {
      inputEl
    } = getComboBoxContext(comboBoxEl);
    changeElementValue(selectEl, selectedOption.value);
    changeElementValue(inputEl, selectedOption.text);
    comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
  }
  if (selectEl.disabled) {
    disable(comboBoxEl);
    selectEl.disabled = false;
  }
  if (selectEl.hasAttribute("aria-disabled")) {
    ariaDisable(comboBoxEl);
    selectEl.removeAttribute("aria-disabled");
  }
  comboBoxEl.dataset.enhanced = "true";
};

/**
 * Manage the focused element within the list options when
 * navigating via keyboard.
 *
 * @param {HTMLElement} el An anchor element within the combo box component
 * @param {HTMLElement} nextEl An element within the combo box component
 * @param {Object} options options
 * @param {boolean} options.skipFocus skip focus of highlighted item
 * @param {boolean} options.preventScroll should skip procedure to scroll to element
 */
const highlightOption = (el, nextEl, {
  skipFocus,
  preventScroll
} = {}) => {
  const {
    inputEl,
    listEl,
    focusedOptionEl
  } = getComboBoxContext(el);
  if (focusedOptionEl) {
    focusedOptionEl.classList.remove(LIST_OPTION_FOCUSED_CLASS);
    focusedOptionEl.setAttribute("tabIndex", "-1");
  }
  if (nextEl) {
    inputEl.setAttribute("aria-activedescendant", nextEl.id);
    nextEl.setAttribute("tabIndex", "0");
    nextEl.classList.add(LIST_OPTION_FOCUSED_CLASS);
    if (!preventScroll) {
      const optionBottom = nextEl.offsetTop + nextEl.offsetHeight;
      const currentBottom = listEl.scrollTop + listEl.offsetHeight;
      if (optionBottom > currentBottom) {
        listEl.scrollTop = optionBottom - listEl.offsetHeight;
      }
      if (nextEl.offsetTop < listEl.scrollTop) {
        listEl.scrollTop = nextEl.offsetTop;
      }
    }
    if (!skipFocus) {
      nextEl.focus({
        preventScroll
      });
    }
  } else {
    inputEl.setAttribute("aria-activedescendant", "");
    inputEl.focus();
  }
};

/**
 * Generate a dynamic regular expression based off of a replaceable and possibly filtered value.
 *
 * @param {string} el An element within the combo box component
 * @param {string} query The value to use in the regular expression
 * @param {object} extras An object of regular expressions to replace and filter the query
 */
const generateDynamicRegExp = (filter, query = "", extras = {}) => {
  const escapeRegExp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  let find = filter.replace(/{{(.*?)}}/g, (m, $1) => {
    const key = $1.trim();
    const queryFilter = extras[key];
    if (key !== "query" && queryFilter) {
      const matcher = new RegExp(queryFilter, "i");
      const matches = query.match(matcher);
      if (matches) {
        return escapeRegExp(matches[1]);
      }
      return "";
    }
    return escapeRegExp(query);
  });
  find = `^(?:${find})$`;
  return new RegExp(find, "i");
};

/**
 * Display the option list of a combo box component.
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const displayList = el => {
  const {
    comboBoxEl,
    selectEl,
    inputEl,
    listEl,
    statusEl,
    isPristine,
    disableFiltering
  } = getComboBoxContext(el);
  let selectedItemId;
  let firstFoundId;
  const listOptionBaseId = `${listEl.id}--option-`;
  const inputValue = (inputEl.value || "").toLowerCase();
  const filter = comboBoxEl.dataset.filter || DEFAULT_FILTER;
  const regex = generateDynamicRegExp(filter, inputValue, comboBoxEl.dataset);
  const options = [];
  for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
    const optionEl = selectEl.options[i];
    const optionId = `${listOptionBaseId}${options.length}`;
    if (optionEl.value && (disableFiltering || isPristine || !inputValue || regex.test(optionEl.text))) {
      if (selectEl.value && optionEl.value === selectEl.value) {
        selectedItemId = optionId;
      }
      if (disableFiltering && !firstFoundId && regex.test(optionEl.text)) {
        firstFoundId = optionId;
      }
      options.push(optionEl);
    }
  }
  const numOptions = options.length;
  const optionHtml = options.map((option, index) => {
    const optionId = `${listOptionBaseId}${index}`;
    const classes = [LIST_OPTION_CLASS];
    let tabindex = "-1";
    let ariaSelected = "false";
    if (optionId === selectedItemId) {
      classes.push(LIST_OPTION_SELECTED_CLASS, LIST_OPTION_FOCUSED_CLASS);
      tabindex = "0";
      ariaSelected = "true";
    }
    if (!selectedItemId && index === 0) {
      classes.push(LIST_OPTION_FOCUSED_CLASS);
      tabindex = "0";
    }
    const li = document.createElement("li");
    li.setAttribute("aria-setsize", options.length);
    li.setAttribute("aria-posinset", index + 1);
    li.setAttribute("aria-selected", ariaSelected);
    li.setAttribute("id", optionId);
    li.setAttribute("class", classes.join(" "));
    li.setAttribute("tabindex", tabindex);
    li.setAttribute("role", "option");
    li.setAttribute("data-value", option.value);
    li.textContent = option.text;
    return li;
  });
  const noResults = document.createElement("li");
  noResults.setAttribute("class", `${LIST_OPTION_CLASS}--no-results`);
  noResults.textContent = "No results found";
  listEl.hidden = false;
  if (numOptions) {
    listEl.innerHTML = "";
    optionHtml.forEach(item => listEl.insertAdjacentElement("beforeend", item));
  } else {
    listEl.innerHTML = "";
    listEl.insertAdjacentElement("beforeend", noResults);
  }
  inputEl.setAttribute("aria-expanded", "true");
  statusEl.textContent = numOptions ? `${numOptions} result${numOptions > 1 ? "s" : ""} available.` : "No results.";
  let itemToFocus;
  if (isPristine && selectedItemId) {
    itemToFocus = listEl.querySelector(`#${selectedItemId}`);
  } else if (disableFiltering && firstFoundId) {
    itemToFocus = listEl.querySelector(`#${firstFoundId}`);
  }
  if (itemToFocus) {
    highlightOption(listEl, itemToFocus, {
      skipFocus: true
    });
  }
};

/**
 * Hide the option list of a combo box component.
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const hideList = el => {
  const {
    inputEl,
    listEl,
    statusEl,
    focusedOptionEl
  } = getComboBoxContext(el);
  statusEl.innerHTML = "";
  inputEl.setAttribute("aria-expanded", "false");
  inputEl.setAttribute("aria-activedescendant", "");
  if (focusedOptionEl) {
    focusedOptionEl.classList.remove(LIST_OPTION_FOCUSED_CLASS);
  }
  listEl.scrollTop = 0;
  listEl.hidden = true;
};

/**
 * Select an option list of the combo box component.
 *
 * @param {HTMLElement} listOptionEl The list option being selected
 */
const selectItem = listOptionEl => {
  const {
    comboBoxEl,
    selectEl,
    inputEl
  } = getComboBoxContext(listOptionEl);
  changeElementValue(selectEl, listOptionEl.dataset.value);
  changeElementValue(inputEl, listOptionEl.textContent);
  comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
  hideList(comboBoxEl);
  inputEl.focus();
};

/**
 * Clear the input of the combo box
 *
 * @param {HTMLButtonElement} clearButtonEl The clear input button
 */
const clearInput = clearButtonEl => {
  const {
    comboBoxEl,
    listEl,
    selectEl,
    inputEl
  } = getComboBoxContext(clearButtonEl);
  const listShown = !listEl.hidden;
  if (selectEl.value) changeElementValue(selectEl);
  if (inputEl.value) changeElementValue(inputEl);
  comboBoxEl.classList.remove(COMBO_BOX_PRISTINE_CLASS);
  if (listShown) displayList(comboBoxEl);
  inputEl.focus();
};

/**
 * Reset the select based off of currently set select value
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const resetSelection = el => {
  const {
    comboBoxEl,
    selectEl,
    inputEl
  } = getComboBoxContext(el);
  const selectValue = selectEl.value;
  const inputValue = (inputEl.value || "").toLowerCase();
  if (selectValue) {
    for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
      const optionEl = selectEl.options[i];
      if (optionEl.value === selectValue) {
        if (inputValue !== optionEl.text) {
          changeElementValue(inputEl, optionEl.text);
        }
        comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
        return;
      }
    }
  }
  if (inputValue) {
    changeElementValue(inputEl);
  }
};

/**
 * Select an option list of the combo box component based off of
 * having a current focused list option or
 * having test that completely matches a list option.
 * Otherwise it clears the input and select.
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const completeSelection = el => {
  const {
    comboBoxEl,
    selectEl,
    inputEl,
    statusEl
  } = getComboBoxContext(el);
  statusEl.textContent = "";
  const inputValue = (inputEl.value || "").toLowerCase();
  if (inputValue) {
    for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
      const optionEl = selectEl.options[i];
      if (optionEl.text.toLowerCase() === inputValue) {
        changeElementValue(selectEl, optionEl.value);
        changeElementValue(inputEl, optionEl.text);
        comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
        return;
      }
    }
  }
  resetSelection(comboBoxEl);
};

/**
 * Handle the escape event within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleEscape = event => {
  const {
    comboBoxEl,
    inputEl
  } = getComboBoxContext(event.target);
  hideList(comboBoxEl);
  resetSelection(comboBoxEl);
  inputEl.focus();
};

/**
 * Handle the down event within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleDownFromInput = event => {
  const {
    comboBoxEl,
    listEl
  } = getComboBoxContext(event.target);
  if (listEl.hidden) {
    displayList(comboBoxEl);
  }
  const nextOptionEl = listEl.querySelector(LIST_OPTION_FOCUSED) || listEl.querySelector(LIST_OPTION);
  if (nextOptionEl) {
    highlightOption(comboBoxEl, nextOptionEl);
  }
  event.preventDefault();
};

/**
 * Handle the enter event from an input element within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleEnterFromInput = event => {
  const {
    comboBoxEl,
    listEl
  } = getComboBoxContext(event.target);
  const listShown = !listEl.hidden;
  completeSelection(comboBoxEl);
  if (listShown) {
    hideList(comboBoxEl);
  }
  event.preventDefault();
};

/**
 * Handle the down event within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleDownFromListOption = event => {
  const focusedOptionEl = event.target;
  const nextOptionEl = focusedOptionEl.nextSibling;
  if (nextOptionEl) {
    highlightOption(focusedOptionEl, nextOptionEl);
  }
  event.preventDefault();
};

/**
 * Handle the space event from an list option element within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleSpaceFromListOption = event => {
  selectItem(event.target);
  event.preventDefault();
};

/**
 * Handle the enter event from list option within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleEnterFromListOption = event => {
  selectItem(event.target);
  event.preventDefault();
};

/**
 * Handle the up event from list option within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleUpFromListOption = event => {
  const {
    comboBoxEl,
    listEl,
    focusedOptionEl
  } = getComboBoxContext(event.target);
  const nextOptionEl = focusedOptionEl && focusedOptionEl.previousSibling;
  const listShown = !listEl.hidden;
  highlightOption(comboBoxEl, nextOptionEl);
  if (listShown) {
    event.preventDefault();
  }
  if (!nextOptionEl) {
    hideList(comboBoxEl);
  }
};

/**
 * Select list option on the mouseover event.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLLIElement} listOptionEl An element within the combo box component
 */
const handleMouseover = listOptionEl => {
  const isCurrentlyFocused = listOptionEl.classList.contains(LIST_OPTION_FOCUSED_CLASS);
  if (isCurrentlyFocused) return;
  highlightOption(listOptionEl, listOptionEl, {
    preventScroll: true
  });
};

/**
 * Toggle the list when the button is clicked
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const toggleList = el => {
  const {
    comboBoxEl,
    listEl,
    inputEl
  } = getComboBoxContext(el);
  if (listEl.hidden) {
    displayList(comboBoxEl);
  } else {
    hideList(comboBoxEl);
  }
  inputEl.focus();
};

/**
 * Handle click from input
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const handleClickFromInput = el => {
  const {
    comboBoxEl,
    listEl
  } = getComboBoxContext(el);
  if (listEl.hidden) {
    displayList(comboBoxEl);
  }
};
const comboBox = behavior({
  [CLICK]: {
    [INPUT]() {
      if (this.disabled) return;
      handleClickFromInput(this);
    },
    [TOGGLE_LIST_BUTTON]() {
      if (this.disabled) return;
      toggleList(this);
    },
    [LIST_OPTION]() {
      if (this.disabled) return;
      selectItem(this);
    },
    [CLEAR_INPUT_BUTTON]() {
      if (this.disabled) return;
      clearInput(this);
    }
  },
  focusout: {
    [COMBO_BOX](event) {
      if (!this.contains(event.relatedTarget)) {
        resetSelection(this);
        hideList(this);
      }
    }
  },
  keydown: {
    [COMBO_BOX]: keymap({
      Escape: handleEscape
    }),
    [INPUT]: keymap({
      Enter: handleEnterFromInput,
      ArrowDown: handleDownFromInput,
      Down: handleDownFromInput
    }),
    [LIST_OPTION]: keymap({
      ArrowUp: handleUpFromListOption,
      Up: handleUpFromListOption,
      ArrowDown: handleDownFromListOption,
      Down: handleDownFromListOption,
      Enter: handleEnterFromListOption,
      " ": handleSpaceFromListOption,
      "Shift+Tab": noop
    })
  },
  input: {
    [INPUT]() {
      const comboBoxEl = this.closest(COMBO_BOX);
      comboBoxEl.classList.remove(COMBO_BOX_PRISTINE_CLASS);
      displayList(this);
    }
  },
  mouseover: {
    [LIST_OPTION]() {
      handleMouseover(this);
    }
  }
}, {
  init(root) {
    selectOrMatches(COMBO_BOX, root).forEach(comboBoxEl => {
      enhanceComboBox(comboBoxEl);
    });
  },
  getComboBoxContext,
  enhanceComboBox,
  generateDynamicRegExp,
  disable,
  enable,
  displayList,
  hideList,
  COMBO_BOX_CLASS
});
module.exports = comboBox;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/sanitizer":51,"../../uswds-core/src/js/utils/select-or-matches":53,"receptor/keymap":11}],20:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const activeElement = require("../../uswds-core/src/js/utils/active-element");
const isIosDevice = require("../../uswds-core/src/js/utils/is-ios-device");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const DATE_PICKER_CLASS = `${PREFIX}-date-picker`;
const DATE_PICKER_WRAPPER_CLASS = `${DATE_PICKER_CLASS}__wrapper`;
const DATE_PICKER_INITIALIZED_CLASS = `${DATE_PICKER_CLASS}--initialized`;
const DATE_PICKER_ACTIVE_CLASS = `${DATE_PICKER_CLASS}--active`;
const DATE_PICKER_INTERNAL_INPUT_CLASS = `${DATE_PICKER_CLASS}__internal-input`;
const DATE_PICKER_EXTERNAL_INPUT_CLASS = `${DATE_PICKER_CLASS}__external-input`;
const DATE_PICKER_BUTTON_CLASS = `${DATE_PICKER_CLASS}__button`;
const DATE_PICKER_CALENDAR_CLASS = `${DATE_PICKER_CLASS}__calendar`;
const DATE_PICKER_STATUS_CLASS = `${DATE_PICKER_CLASS}__status`;
const CALENDAR_DATE_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__date`;
const CALENDAR_DATE_FOCUSED_CLASS = `${CALENDAR_DATE_CLASS}--focused`;
const CALENDAR_DATE_SELECTED_CLASS = `${CALENDAR_DATE_CLASS}--selected`;
const CALENDAR_DATE_PREVIOUS_MONTH_CLASS = `${CALENDAR_DATE_CLASS}--previous-month`;
const CALENDAR_DATE_CURRENT_MONTH_CLASS = `${CALENDAR_DATE_CLASS}--current-month`;
const CALENDAR_DATE_NEXT_MONTH_CLASS = `${CALENDAR_DATE_CLASS}--next-month`;
const CALENDAR_DATE_RANGE_DATE_CLASS = `${CALENDAR_DATE_CLASS}--range-date`;
const CALENDAR_DATE_TODAY_CLASS = `${CALENDAR_DATE_CLASS}--today`;
const CALENDAR_DATE_RANGE_DATE_START_CLASS = `${CALENDAR_DATE_CLASS}--range-date-start`;
const CALENDAR_DATE_RANGE_DATE_END_CLASS = `${CALENDAR_DATE_CLASS}--range-date-end`;
const CALENDAR_DATE_WITHIN_RANGE_CLASS = `${CALENDAR_DATE_CLASS}--within-range`;
const CALENDAR_PREVIOUS_YEAR_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__previous-year`;
const CALENDAR_PREVIOUS_MONTH_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__previous-month`;
const CALENDAR_NEXT_YEAR_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__next-year`;
const CALENDAR_NEXT_MONTH_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__next-month`;
const CALENDAR_MONTH_SELECTION_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month-selection`;
const CALENDAR_YEAR_SELECTION_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__year-selection`;
const CALENDAR_MONTH_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month`;
const CALENDAR_MONTH_FOCUSED_CLASS = `${CALENDAR_MONTH_CLASS}--focused`;
const CALENDAR_MONTH_SELECTED_CLASS = `${CALENDAR_MONTH_CLASS}--selected`;
const CALENDAR_YEAR_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__year`;
const CALENDAR_YEAR_FOCUSED_CLASS = `${CALENDAR_YEAR_CLASS}--focused`;
const CALENDAR_YEAR_SELECTED_CLASS = `${CALENDAR_YEAR_CLASS}--selected`;
const CALENDAR_PREVIOUS_YEAR_CHUNK_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__previous-year-chunk`;
const CALENDAR_NEXT_YEAR_CHUNK_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__next-year-chunk`;
const CALENDAR_DATE_PICKER_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__date-picker`;
const CALENDAR_MONTH_PICKER_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month-picker`;
const CALENDAR_YEAR_PICKER_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__year-picker`;
const CALENDAR_TABLE_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__table`;
const CALENDAR_ROW_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__row`;
const CALENDAR_CELL_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__cell`;
const CALENDAR_CELL_CENTER_ITEMS_CLASS = `${CALENDAR_CELL_CLASS}--center-items`;
const CALENDAR_MONTH_LABEL_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month-label`;
const CALENDAR_DAY_OF_WEEK_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__day-of-week`;
const DATE_PICKER = `.${DATE_PICKER_CLASS}`;
const DATE_PICKER_BUTTON = `.${DATE_PICKER_BUTTON_CLASS}`;
const DATE_PICKER_INTERNAL_INPUT = `.${DATE_PICKER_INTERNAL_INPUT_CLASS}`;
const DATE_PICKER_EXTERNAL_INPUT = `.${DATE_PICKER_EXTERNAL_INPUT_CLASS}`;
const DATE_PICKER_CALENDAR = `.${DATE_PICKER_CALENDAR_CLASS}`;
const DATE_PICKER_STATUS = `.${DATE_PICKER_STATUS_CLASS}`;
const CALENDAR_DATE = `.${CALENDAR_DATE_CLASS}`;
const CALENDAR_DATE_FOCUSED = `.${CALENDAR_DATE_FOCUSED_CLASS}`;
const CALENDAR_DATE_CURRENT_MONTH = `.${CALENDAR_DATE_CURRENT_MONTH_CLASS}`;
const CALENDAR_PREVIOUS_YEAR = `.${CALENDAR_PREVIOUS_YEAR_CLASS}`;
const CALENDAR_PREVIOUS_MONTH = `.${CALENDAR_PREVIOUS_MONTH_CLASS}`;
const CALENDAR_NEXT_YEAR = `.${CALENDAR_NEXT_YEAR_CLASS}`;
const CALENDAR_NEXT_MONTH = `.${CALENDAR_NEXT_MONTH_CLASS}`;
const CALENDAR_YEAR_SELECTION = `.${CALENDAR_YEAR_SELECTION_CLASS}`;
const CALENDAR_MONTH_SELECTION = `.${CALENDAR_MONTH_SELECTION_CLASS}`;
const CALENDAR_MONTH = `.${CALENDAR_MONTH_CLASS}`;
const CALENDAR_YEAR = `.${CALENDAR_YEAR_CLASS}`;
const CALENDAR_PREVIOUS_YEAR_CHUNK = `.${CALENDAR_PREVIOUS_YEAR_CHUNK_CLASS}`;
const CALENDAR_NEXT_YEAR_CHUNK = `.${CALENDAR_NEXT_YEAR_CHUNK_CLASS}`;
const CALENDAR_DATE_PICKER = `.${CALENDAR_DATE_PICKER_CLASS}`;
const CALENDAR_MONTH_PICKER = `.${CALENDAR_MONTH_PICKER_CLASS}`;
const CALENDAR_YEAR_PICKER = `.${CALENDAR_YEAR_PICKER_CLASS}`;
const CALENDAR_MONTH_FOCUSED = `.${CALENDAR_MONTH_FOCUSED_CLASS}`;
const CALENDAR_YEAR_FOCUSED = `.${CALENDAR_YEAR_FOCUSED_CLASS}`;
const VALIDATION_MESSAGE = "Please enter a valid date";
const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_OF_WEEK_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ENTER_KEYCODE = 13;
const YEAR_CHUNK = 12;
const DEFAULT_MIN_DATE = "0000-01-01";
const DEFAULT_EXTERNAL_DATE_FORMAT = "MM/DD/YYYY";
const INTERNAL_DATE_FORMAT = "YYYY-MM-DD";
const NOT_DISABLED_SELECTOR = ":not([disabled])";
const processFocusableSelectors = (...selectors) => selectors.map(query => query + NOT_DISABLED_SELECTOR).join(", ");
const DATE_PICKER_FOCUSABLE = processFocusableSelectors(CALENDAR_PREVIOUS_YEAR, CALENDAR_PREVIOUS_MONTH, CALENDAR_YEAR_SELECTION, CALENDAR_MONTH_SELECTION, CALENDAR_NEXT_YEAR, CALENDAR_NEXT_MONTH, CALENDAR_DATE_FOCUSED);
const MONTH_PICKER_FOCUSABLE = processFocusableSelectors(CALENDAR_MONTH_FOCUSED);
const YEAR_PICKER_FOCUSABLE = processFocusableSelectors(CALENDAR_PREVIOUS_YEAR_CHUNK, CALENDAR_NEXT_YEAR_CHUNK, CALENDAR_YEAR_FOCUSED);

// #region Date Manipulation Functions

/**
 * Keep date within month. Month would only be over by 1 to 3 days
 *
 * @param {Date} dateToCheck the date object to check
 * @param {number} month the correct month
 * @returns {Date} the date, corrected if needed
 */
const keepDateWithinMonth = (dateToCheck, month) => {
  if (month !== dateToCheck.getMonth()) {
    dateToCheck.setDate(0);
  }
  return dateToCheck;
};

/**
 * Set date from month day year
 *
 * @param {number} year the year to set
 * @param {number} month the month to set (zero-indexed)
 * @param {number} date the date to set
 * @returns {Date} the set date
 */
const setDate = (year, month, date) => {
  const newDate = new Date(0);
  newDate.setFullYear(year, month, date);
  return newDate;
};

/**
 * todays date
 *
 * @returns {Date} todays date
 */
const today = () => {
  const newDate = new Date();
  const day = newDate.getDate();
  const month = newDate.getMonth();
  const year = newDate.getFullYear();
  return setDate(year, month, day);
};

/**
 * Set date to first day of the month
 *
 * @param {number} date the date to adjust
 * @returns {Date} the adjusted date
 */
const startOfMonth = date => {
  const newDate = new Date(0);
  newDate.setFullYear(date.getFullYear(), date.getMonth(), 1);
  return newDate;
};

/**
 * Set date to last day of the month
 *
 * @param {number} date the date to adjust
 * @returns {Date} the adjusted date
 */
const lastDayOfMonth = date => {
  const newDate = new Date(0);
  newDate.setFullYear(date.getFullYear(), date.getMonth() + 1, 0);
  return newDate;
};

/**
 * Add days to date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numDays the difference in days
 * @returns {Date} the adjusted date
 */
const addDays = (_date, numDays) => {
  const newDate = new Date(_date.getTime());
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
};

/**
 * Subtract days from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numDays the difference in days
 * @returns {Date} the adjusted date
 */
const subDays = (_date, numDays) => addDays(_date, -numDays);

/**
 * Add weeks to date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numWeeks the difference in weeks
 * @returns {Date} the adjusted date
 */
const addWeeks = (_date, numWeeks) => addDays(_date, numWeeks * 7);

/**
 * Subtract weeks from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numWeeks the difference in weeks
 * @returns {Date} the adjusted date
 */
const subWeeks = (_date, numWeeks) => addWeeks(_date, -numWeeks);

/**
 * Set date to the start of the week (Sunday)
 *
 * @param {Date} _date the date to adjust
 * @returns {Date} the adjusted date
 */
const startOfWeek = _date => {
  const dayOfWeek = _date.getDay();
  return subDays(_date, dayOfWeek);
};

/**
 * Set date to the end of the week (Saturday)
 *
 * @param {Date} _date the date to adjust
 * @param {number} numWeeks the difference in weeks
 * @returns {Date} the adjusted date
 */
const endOfWeek = _date => {
  const dayOfWeek = _date.getDay();
  return addDays(_date, 6 - dayOfWeek);
};

/**
 * Add months to date and keep date within month
 *
 * @param {Date} _date the date to adjust
 * @param {number} numMonths the difference in months
 * @returns {Date} the adjusted date
 */
const addMonths = (_date, numMonths) => {
  const newDate = new Date(_date.getTime());
  const dateMonth = (newDate.getMonth() + 12 + numMonths) % 12;
  newDate.setMonth(newDate.getMonth() + numMonths);
  keepDateWithinMonth(newDate, dateMonth);
  return newDate;
};

/**
 * Subtract months from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numMonths the difference in months
 * @returns {Date} the adjusted date
 */
const subMonths = (_date, numMonths) => addMonths(_date, -numMonths);

/**
 * Add years to date and keep date within month
 *
 * @param {Date} _date the date to adjust
 * @param {number} numYears the difference in years
 * @returns {Date} the adjusted date
 */
const addYears = (_date, numYears) => addMonths(_date, numYears * 12);

/**
 * Subtract years from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numYears the difference in years
 * @returns {Date} the adjusted date
 */
const subYears = (_date, numYears) => addYears(_date, -numYears);

/**
 * Set months of date
 *
 * @param {Date} _date the date to adjust
 * @param {number} month zero-indexed month to set
 * @returns {Date} the adjusted date
 */
const setMonth = (_date, month) => {
  const newDate = new Date(_date.getTime());
  newDate.setMonth(month);
  keepDateWithinMonth(newDate, month);
  return newDate;
};

/**
 * Set year of date
 *
 * @param {Date} _date the date to adjust
 * @param {number} year the year to set
 * @returns {Date} the adjusted date
 */
const setYear = (_date, year) => {
  const newDate = new Date(_date.getTime());
  const month = newDate.getMonth();
  newDate.setFullYear(year);
  keepDateWithinMonth(newDate, month);
  return newDate;
};

/**
 * Return the earliest date
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {Date} the earliest date
 */
const min = (dateA, dateB) => {
  let newDate = dateA;
  if (dateB < dateA) {
    newDate = dateB;
  }
  return new Date(newDate.getTime());
};

/**
 * Return the latest date
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {Date} the latest date
 */
const max = (dateA, dateB) => {
  let newDate = dateA;
  if (dateB > dateA) {
    newDate = dateB;
  }
  return new Date(newDate.getTime());
};

/**
 * Check if dates are the in the same year
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {boolean} are dates in the same year
 */
const isSameYear = (dateA, dateB) => dateA && dateB && dateA.getFullYear() === dateB.getFullYear();

/**
 * Check if dates are the in the same month
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {boolean} are dates in the same month
 */
const isSameMonth = (dateA, dateB) => isSameYear(dateA, dateB) && dateA.getMonth() === dateB.getMonth();

/**
 * Check if dates are the same date
 *
 * @param {Date} dateA the date to compare
 * @param {Date} dateA the date to compare
 * @returns {boolean} are dates the same date
 */
const isSameDay = (dateA, dateB) => isSameMonth(dateA, dateB) && dateA.getDate() === dateB.getDate();

/**
 * return a new date within minimum and maximum date
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @returns {Date} the date between min and max
 */
const keepDateBetweenMinAndMax = (date, minDate, maxDate) => {
  let newDate = date;
  if (date < minDate) {
    newDate = minDate;
  } else if (maxDate && date > maxDate) {
    newDate = maxDate;
  }
  return new Date(newDate.getTime());
};

/**
 * Check if dates is valid.
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @return {boolean} is there a day within the month within min and max dates
 */
const isDateWithinMinAndMax = (date, minDate, maxDate) => date >= minDate && (!maxDate || date <= maxDate);

/**
 * Check if dates month is invalid.
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @return {boolean} is the month outside min or max dates
 */
const isDatesMonthOutsideMinOrMax = (date, minDate, maxDate) => lastDayOfMonth(date) < minDate || maxDate && startOfMonth(date) > maxDate;

/**
 * Check if dates year is invalid.
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @return {boolean} is the month outside min or max dates
 */
const isDatesYearOutsideMinOrMax = (date, minDate, maxDate) => lastDayOfMonth(setMonth(date, 11)) < minDate || maxDate && startOfMonth(setMonth(date, 0)) > maxDate;

/**
 * Parse a date with format M-D-YY
 *
 * @param {string} dateString the date string to parse
 * @param {string} dateFormat the format of the date string
 * @param {boolean} adjustDate should the date be adjusted
 * @returns {Date} the parsed date
 */
const parseDateString = (dateString, dateFormat = INTERNAL_DATE_FORMAT, adjustDate = false) => {
  let date;
  let month;
  let day;
  let year;
  let parsed;
  if (dateString) {
    let monthStr;
    let dayStr;
    let yearStr;
    if (dateFormat === DEFAULT_EXTERNAL_DATE_FORMAT) {
      [monthStr, dayStr, yearStr] = dateString.split("/");
    } else {
      [yearStr, monthStr, dayStr] = dateString.split("-");
    }
    if (yearStr) {
      parsed = parseInt(yearStr, 10);
      if (!Number.isNaN(parsed)) {
        year = parsed;
        if (adjustDate) {
          year = Math.max(0, year);
          if (yearStr.length < 3) {
            const currentYear = today().getFullYear();
            const currentYearStub = currentYear - currentYear % 10 ** yearStr.length;
            year = currentYearStub + parsed;
          }
        }
      }
    }
    if (monthStr) {
      parsed = parseInt(monthStr, 10);
      if (!Number.isNaN(parsed)) {
        month = parsed;
        if (adjustDate) {
          month = Math.max(1, month);
          month = Math.min(12, month);
        }
      }
    }
    if (month && dayStr && year != null) {
      parsed = parseInt(dayStr, 10);
      if (!Number.isNaN(parsed)) {
        day = parsed;
        if (adjustDate) {
          const lastDayOfTheMonth = setDate(year, month, 0).getDate();
          day = Math.max(1, day);
          day = Math.min(lastDayOfTheMonth, day);
        }
      }
    }
    if (month && day && year != null) {
      date = setDate(year, month - 1, day);
    }
  }
  return date;
};

/**
 * Format a date to format MM-DD-YYYY
 *
 * @param {Date} date the date to format
 * @param {string} dateFormat the format of the date string
 * @returns {string} the formatted date string
 */
const formatDate = (date, dateFormat = INTERNAL_DATE_FORMAT) => {
  const padZeros = (value, length) => `0000${value}`.slice(-length);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  if (dateFormat === DEFAULT_EXTERNAL_DATE_FORMAT) {
    return [padZeros(month, 2), padZeros(day, 2), padZeros(year, 4)].join("/");
  }
  return [padZeros(year, 4), padZeros(month, 2), padZeros(day, 2)].join("-");
};

// #endregion Date Manipulation Functions

/**
 * Create a grid string from an array of html strings
 *
 * @param {string[]} htmlArray the array of html items
 * @param {number} rowSize the length of a row
 * @returns {string} the grid string
 */
const listToGridHtml = (htmlArray, rowSize) => {
  const grid = [];
  let row = [];
  let i = 0;
  while (i < htmlArray.length) {
    row = [];
    const tr = document.createElement("tr");
    while (i < htmlArray.length && row.length < rowSize) {
      const td = document.createElement("td");
      td.insertAdjacentElement("beforeend", htmlArray[i]);
      row.push(td);
      i += 1;
    }
    row.forEach(element => {
      tr.insertAdjacentElement("beforeend", element);
    });
    grid.push(tr);
  }
  return grid;
};
const createTableBody = grid => {
  const tableBody = document.createElement("tbody");
  grid.forEach(element => {
    tableBody.insertAdjacentElement("beforeend", element);
  });
  return tableBody;
};

/**
 * set the value of the element and dispatch a change event
 *
 * @param {HTMLInputElement} el The element to update
 * @param {string} value The new value of the element
 */
const changeElementValue = (el, value = "") => {
  const elementToChange = el;
  elementToChange.value = value;
  const event = new CustomEvent("change", {
    bubbles: true,
    cancelable: true,
    detail: {
      value
    }
  });
  elementToChange.dispatchEvent(event);
};

/**
 * The properties and elements within the date picker.
 * @typedef {Object} DatePickerContext
 * @property {HTMLDivElement} calendarEl
 * @property {HTMLElement} datePickerEl
 * @property {HTMLInputElement} internalInputEl
 * @property {HTMLInputElement} externalInputEl
 * @property {HTMLDivElement} statusEl
 * @property {HTMLDivElement} firstYearChunkEl
 * @property {Date} calendarDate
 * @property {Date} minDate
 * @property {Date} maxDate
 * @property {Date} selectedDate
 * @property {Date} rangeDate
 * @property {Date} defaultDate
 */

/**
 * Get an object of the properties and elements belonging directly to the given
 * date picker component.
 *
 * @param {HTMLElement} el the element within the date picker
 * @returns {DatePickerContext} elements
 */
const getDatePickerContext = el => {
  const datePickerEl = el.closest(DATE_PICKER);
  if (!datePickerEl) {
    throw new Error(`Element is missing outer ${DATE_PICKER}`);
  }
  const internalInputEl = datePickerEl.querySelector(DATE_PICKER_INTERNAL_INPUT);
  const externalInputEl = datePickerEl.querySelector(DATE_PICKER_EXTERNAL_INPUT);
  const calendarEl = datePickerEl.querySelector(DATE_PICKER_CALENDAR);
  const toggleBtnEl = datePickerEl.querySelector(DATE_PICKER_BUTTON);
  const statusEl = datePickerEl.querySelector(DATE_PICKER_STATUS);
  const firstYearChunkEl = datePickerEl.querySelector(CALENDAR_YEAR);
  const inputDate = parseDateString(externalInputEl.value, DEFAULT_EXTERNAL_DATE_FORMAT, true);
  const selectedDate = parseDateString(internalInputEl.value);
  const calendarDate = parseDateString(calendarEl.dataset.value);
  const minDate = parseDateString(datePickerEl.dataset.minDate);
  const maxDate = parseDateString(datePickerEl.dataset.maxDate);
  const rangeDate = parseDateString(datePickerEl.dataset.rangeDate);
  const defaultDate = parseDateString(datePickerEl.dataset.defaultDate);
  if (minDate && maxDate && minDate > maxDate) {
    throw new Error("Minimum date cannot be after maximum date");
  }
  return {
    calendarDate,
    minDate,
    toggleBtnEl,
    selectedDate,
    maxDate,
    firstYearChunkEl,
    datePickerEl,
    inputDate,
    internalInputEl,
    externalInputEl,
    calendarEl,
    rangeDate,
    defaultDate,
    statusEl
  };
};

/**
 * Disable the date picker component
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const disable = el => {
  const {
    externalInputEl,
    toggleBtnEl
  } = getDatePickerContext(el);
  toggleBtnEl.disabled = true;
  externalInputEl.disabled = true;
};

/**
 * Check for aria-disabled on initialization
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const ariaDisable = el => {
  const {
    externalInputEl,
    toggleBtnEl
  } = getDatePickerContext(el);
  toggleBtnEl.setAttribute("aria-disabled", true);
  externalInputEl.setAttribute("aria-disabled", true);
};

/**
 * Enable the date picker component
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const enable = el => {
  const {
    externalInputEl,
    toggleBtnEl
  } = getDatePickerContext(el);
  toggleBtnEl.disabled = false;
  externalInputEl.disabled = false;
};

// #region Validation

/**
 * Validate the value in the input as a valid date of format M/D/YYYY
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const isDateInputInvalid = el => {
  const {
    externalInputEl,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const dateString = externalInputEl.value;
  let isInvalid = false;
  if (dateString) {
    isInvalid = true;
    const dateStringParts = dateString.split("/");
    const [month, day, year] = dateStringParts.map(str => {
      let value;
      const parsed = parseInt(str, 10);
      if (!Number.isNaN(parsed)) value = parsed;
      return value;
    });
    if (month && day && year != null) {
      const checkDate = setDate(year, month - 1, day);
      if (checkDate.getMonth() === month - 1 && checkDate.getDate() === day && checkDate.getFullYear() === year && dateStringParts[2].length === 4 && isDateWithinMinAndMax(checkDate, minDate, maxDate)) {
        isInvalid = false;
      }
    }
  }
  return isInvalid;
};

/**
 * Validate the value in the input as a valid date of format M/D/YYYY
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const validateDateInput = el => {
  const {
    externalInputEl
  } = getDatePickerContext(el);
  const isInvalid = isDateInputInvalid(externalInputEl);
  if (isInvalid && !externalInputEl.validationMessage) {
    externalInputEl.setCustomValidity(VALIDATION_MESSAGE);
  }
  if (!isInvalid && externalInputEl.validationMessage === VALIDATION_MESSAGE) {
    externalInputEl.setCustomValidity("");
  }
};

// #endregion Validation

/**
 * Enable the date picker component
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const reconcileInputValues = el => {
  const {
    internalInputEl,
    inputDate
  } = getDatePickerContext(el);
  let newValue = "";
  if (inputDate && !isDateInputInvalid(el)) {
    newValue = formatDate(inputDate);
  }
  if (internalInputEl.value !== newValue) {
    changeElementValue(internalInputEl, newValue);
  }
};

/**
 * Select the value of the date picker inputs.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 * @param {string} dateString The date string to update in YYYY-MM-DD format
 */
const setCalendarValue = (el, dateString) => {
  const parsedDate = parseDateString(dateString);
  if (parsedDate) {
    const formattedDate = formatDate(parsedDate, DEFAULT_EXTERNAL_DATE_FORMAT);
    const {
      datePickerEl,
      internalInputEl,
      externalInputEl
    } = getDatePickerContext(el);
    changeElementValue(internalInputEl, dateString);
    changeElementValue(externalInputEl, formattedDate);
    validateDateInput(datePickerEl);
  }
};

/**
 * Enhance an input with the date picker elements
 *
 * @param {HTMLElement} el The initial wrapping element of the date picker component
 */
const enhanceDatePicker = el => {
  const datePickerEl = el.closest(DATE_PICKER);
  const {
    defaultValue
  } = datePickerEl.dataset;
  const internalInputEl = datePickerEl.querySelector(`input`);
  if (!internalInputEl) {
    throw new Error(`${DATE_PICKER} is missing inner input`);
  }
  if (internalInputEl.value) {
    internalInputEl.value = "";
  }
  const minDate = parseDateString(datePickerEl.dataset.minDate || internalInputEl.getAttribute("min"));
  datePickerEl.dataset.minDate = minDate ? formatDate(minDate) : DEFAULT_MIN_DATE;
  const maxDate = parseDateString(datePickerEl.dataset.maxDate || internalInputEl.getAttribute("max"));
  if (maxDate) {
    datePickerEl.dataset.maxDate = formatDate(maxDate);
  }
  const calendarWrapper = document.createElement("div");
  calendarWrapper.classList.add(DATE_PICKER_WRAPPER_CLASS);
  const externalInputEl = internalInputEl.cloneNode();
  externalInputEl.classList.add(DATE_PICKER_EXTERNAL_INPUT_CLASS);
  externalInputEl.type = "text";
  calendarWrapper.appendChild(externalInputEl);
  calendarWrapper.insertAdjacentHTML("beforeend", Sanitizer.escapeHTML`
    <button type="button" class="${DATE_PICKER_BUTTON_CLASS}" aria-haspopup="true" aria-label="Toggle calendar"></button>
    <div class="${DATE_PICKER_CALENDAR_CLASS}" role="application" hidden></div>
    <div class="usa-sr-only ${DATE_PICKER_STATUS_CLASS}" role="status" aria-live="polite"></div>`);
  internalInputEl.setAttribute("aria-hidden", "true");
  internalInputEl.setAttribute("tabindex", "-1");
  internalInputEl.style.display = "none";
  internalInputEl.classList.add(DATE_PICKER_INTERNAL_INPUT_CLASS);
  internalInputEl.removeAttribute("id");
  internalInputEl.removeAttribute("name");
  internalInputEl.required = false;
  datePickerEl.appendChild(calendarWrapper);
  datePickerEl.classList.add(DATE_PICKER_INITIALIZED_CLASS);
  if (defaultValue) {
    setCalendarValue(datePickerEl, defaultValue);
  }
  if (internalInputEl.disabled) {
    disable(datePickerEl);
    internalInputEl.disabled = false;
  }
  if (internalInputEl.hasAttribute("aria-disabled")) {
    ariaDisable(datePickerEl);
    internalInputEl.removeAttribute("aria-disabled");
  }
};

// #region Calendar - Date Selection View

/**
 * render the calendar.
 *
 * @param {HTMLElement} el An element within the date picker component
 * @param {Date} _dateToDisplay a date to render on the calendar
 * @returns {HTMLElement} a reference to the new calendar element
 */
const renderCalendar = (el, _dateToDisplay) => {
  const {
    datePickerEl,
    calendarEl,
    statusEl,
    selectedDate,
    maxDate,
    minDate,
    rangeDate
  } = getDatePickerContext(el);
  const todaysDate = today();
  let dateToDisplay = _dateToDisplay || todaysDate;
  const calendarWasHidden = calendarEl.hidden;
  const focusedDate = addDays(dateToDisplay, 0);
  const focusedMonth = dateToDisplay.getMonth();
  const focusedYear = dateToDisplay.getFullYear();
  const prevMonth = subMonths(dateToDisplay, 1);
  const nextMonth = addMonths(dateToDisplay, 1);
  const currentFormattedDate = formatDate(dateToDisplay);
  const firstOfMonth = startOfMonth(dateToDisplay);
  const prevButtonsDisabled = isSameMonth(dateToDisplay, minDate);
  const nextButtonsDisabled = isSameMonth(dateToDisplay, maxDate);
  const rangeConclusionDate = selectedDate || dateToDisplay;
  const rangeStartDate = rangeDate && min(rangeConclusionDate, rangeDate);
  const rangeEndDate = rangeDate && max(rangeConclusionDate, rangeDate);
  const withinRangeStartDate = rangeDate && addDays(rangeStartDate, 1);
  const withinRangeEndDate = rangeDate && subDays(rangeEndDate, 1);
  const monthLabel = MONTH_LABELS[focusedMonth];
  const generateDateHtml = dateToRender => {
    const classes = [CALENDAR_DATE_CLASS];
    const day = dateToRender.getDate();
    const month = dateToRender.getMonth();
    const year = dateToRender.getFullYear();
    const dayOfWeek = dateToRender.getDay();
    const formattedDate = formatDate(dateToRender);
    let tabindex = "-1";
    const isDisabled = !isDateWithinMinAndMax(dateToRender, minDate, maxDate);
    const isSelected = isSameDay(dateToRender, selectedDate);
    if (isSameMonth(dateToRender, prevMonth)) {
      classes.push(CALENDAR_DATE_PREVIOUS_MONTH_CLASS);
    }
    if (isSameMonth(dateToRender, focusedDate)) {
      classes.push(CALENDAR_DATE_CURRENT_MONTH_CLASS);
    }
    if (isSameMonth(dateToRender, nextMonth)) {
      classes.push(CALENDAR_DATE_NEXT_MONTH_CLASS);
    }
    if (isSelected) {
      classes.push(CALENDAR_DATE_SELECTED_CLASS);
    }
    if (isSameDay(dateToRender, todaysDate)) {
      classes.push(CALENDAR_DATE_TODAY_CLASS);
    }
    if (rangeDate) {
      if (isSameDay(dateToRender, rangeDate)) {
        classes.push(CALENDAR_DATE_RANGE_DATE_CLASS);
      }
      if (isSameDay(dateToRender, rangeStartDate)) {
        classes.push(CALENDAR_DATE_RANGE_DATE_START_CLASS);
      }
      if (isSameDay(dateToRender, rangeEndDate)) {
        classes.push(CALENDAR_DATE_RANGE_DATE_END_CLASS);
      }
      if (isDateWithinMinAndMax(dateToRender, withinRangeStartDate, withinRangeEndDate)) {
        classes.push(CALENDAR_DATE_WITHIN_RANGE_CLASS);
      }
    }
    if (isSameDay(dateToRender, focusedDate)) {
      tabindex = "0";
      classes.push(CALENDAR_DATE_FOCUSED_CLASS);
    }
    const monthStr = MONTH_LABELS[month];
    const dayStr = DAY_OF_WEEK_LABELS[dayOfWeek];
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("tabindex", tabindex);
    btn.setAttribute("class", classes.join(" "));
    btn.setAttribute("data-day", day);
    btn.setAttribute("data-month", month + 1);
    btn.setAttribute("data-year", year);
    btn.setAttribute("data-value", formattedDate);
    btn.setAttribute("aria-label", Sanitizer.escapeHTML`${day} ${monthStr} ${year} ${dayStr}`);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isDisabled === true) {
      btn.disabled = true;
    }
    btn.textContent = day;
    return btn;
  };

  // set date to first rendered day
  dateToDisplay = startOfWeek(firstOfMonth);
  const days = [];
  while (days.length < 28 || dateToDisplay.getMonth() === focusedMonth || days.length % 7 !== 0) {
    days.push(generateDateHtml(dateToDisplay));
    dateToDisplay = addDays(dateToDisplay, 1);
  }
  const datesGrid = listToGridHtml(days, 7);
  const newCalendar = calendarEl.cloneNode();
  newCalendar.dataset.value = currentFormattedDate;
  newCalendar.style.top = `${datePickerEl.offsetHeight}px`;
  newCalendar.hidden = false;
  newCalendar.innerHTML = Sanitizer.escapeHTML`
    <div tabindex="-1" class="${CALENDAR_DATE_PICKER_CLASS}">
      <div class="${CALENDAR_ROW_CLASS}">
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_PREVIOUS_YEAR_CLASS}"
            aria-label="Navigate back one year"
            ${prevButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_PREVIOUS_MONTH_CLASS}"
            aria-label="Navigate back one month"
            ${prevButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_MONTH_LABEL_CLASS}">
          <button
            type="button"
            class="${CALENDAR_MONTH_SELECTION_CLASS}" aria-label="${monthLabel}. Select month"
          >${monthLabel}</button>
          <button
            type="button"
            class="${CALENDAR_YEAR_SELECTION_CLASS}" aria-label="${focusedYear}. Select year"
          >${focusedYear}</button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_NEXT_MONTH_CLASS}"
            aria-label="Navigate forward one month"
            ${nextButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_NEXT_YEAR_CLASS}"
            aria-label="Navigate forward one year"
            ${nextButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
      </div>
    </div>
    `;
  const table = document.createElement("table");
  table.setAttribute("class", CALENDAR_TABLE_CLASS);
  const tableHead = document.createElement("thead");
  table.insertAdjacentElement("beforeend", tableHead);
  const tableHeadRow = document.createElement("tr");
  tableHead.insertAdjacentElement("beforeend", tableHeadRow);
  const daysOfWeek = {
    Sunday: "S",
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "Th",
    Friday: "Fr",
    Saturday: "S"
  };
  Object.keys(daysOfWeek).forEach(key => {
    const th = document.createElement("th");
    th.setAttribute("class", CALENDAR_DAY_OF_WEEK_CLASS);
    th.setAttribute("scope", "col");
    th.setAttribute("aria-label", key);
    th.textContent = daysOfWeek[key];
    tableHeadRow.insertAdjacentElement("beforeend", th);
  });
  const tableBody = createTableBody(datesGrid);
  table.insertAdjacentElement("beforeend", tableBody);

  // Container for Years, Months, and Days
  const datePickerCalendarContainer = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  datePickerCalendarContainer.insertAdjacentElement("beforeend", table);
  calendarEl.parentNode.replaceChild(newCalendar, calendarEl);
  datePickerEl.classList.add(DATE_PICKER_ACTIVE_CLASS);
  const statuses = [];
  if (isSameDay(selectedDate, focusedDate)) {
    statuses.push("Selected date");
  }
  if (calendarWasHidden) {
    statuses.push("You can navigate by day using left and right arrows", "Weeks by using up and down arrows", "Months by using page up and page down keys", "Years by using shift plus page up and shift plus page down", "Home and end keys navigate to the beginning and end of a week");
    statusEl.textContent = "";
  } else {
    statuses.push(`${monthLabel} ${focusedYear}`);
  }
  statusEl.textContent = statuses.join(". ");
  return newCalendar;
};

/**
 * Navigate back one year and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayPreviousYear = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = subYears(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_PREVIOUS_YEAR);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate back one month and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayPreviousMonth = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = subMonths(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_PREVIOUS_MONTH);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate forward one month and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayNextMonth = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = addMonths(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_NEXT_MONTH);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate forward one year and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayNextYear = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = addYears(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_NEXT_YEAR);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Hide the calendar of a date picker component.
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const hideCalendar = el => {
  const {
    datePickerEl,
    calendarEl,
    statusEl
  } = getDatePickerContext(el);
  datePickerEl.classList.remove(DATE_PICKER_ACTIVE_CLASS);
  calendarEl.hidden = true;
  statusEl.textContent = "";
};

/**
 * Select a date within the date picker component.
 *
 * @param {HTMLButtonElement} calendarDateEl A date element within the date picker component
 */
const selectDate = calendarDateEl => {
  if (calendarDateEl.disabled) return;
  const {
    datePickerEl,
    externalInputEl
  } = getDatePickerContext(calendarDateEl);
  setCalendarValue(calendarDateEl, calendarDateEl.dataset.value);
  hideCalendar(datePickerEl);
  externalInputEl.focus();
};

/**
 * Toggle the calendar.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 */
const toggleCalendar = el => {
  if (el.disabled) return;
  const {
    calendarEl,
    inputDate,
    minDate,
    maxDate,
    defaultDate
  } = getDatePickerContext(el);
  if (calendarEl.hidden) {
    const dateToDisplay = keepDateBetweenMinAndMax(inputDate || defaultDate || today(), minDate, maxDate);
    const newCalendar = renderCalendar(calendarEl, dateToDisplay);
    newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
  } else {
    hideCalendar(el);
  }
};

/**
 * Update the calendar when visible.
 *
 * @param {HTMLElement} el an element within the date picker
 */
const updateCalendarIfVisible = el => {
  const {
    calendarEl,
    inputDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const calendarShown = !calendarEl.hidden;
  if (calendarShown && inputDate) {
    const dateToDisplay = keepDateBetweenMinAndMax(inputDate, minDate, maxDate);
    renderCalendar(calendarEl, dateToDisplay);
  }
};

// #endregion Calendar - Date Selection View

// #region Calendar - Month Selection View
/**
 * Display the month selection screen in the date picker.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 * @returns {HTMLElement} a reference to the new calendar element
 */
const displayMonthSelection = (el, monthToDisplay) => {
  const {
    calendarEl,
    statusEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const selectedMonth = calendarDate.getMonth();
  const focusedMonth = monthToDisplay == null ? selectedMonth : monthToDisplay;
  const months = MONTH_LABELS.map((month, index) => {
    const monthToCheck = setMonth(calendarDate, index);
    const isDisabled = isDatesMonthOutsideMinOrMax(monthToCheck, minDate, maxDate);
    let tabindex = "-1";
    const classes = [CALENDAR_MONTH_CLASS];
    const isSelected = index === selectedMonth;
    if (index === focusedMonth) {
      tabindex = "0";
      classes.push(CALENDAR_MONTH_FOCUSED_CLASS);
    }
    if (isSelected) {
      classes.push(CALENDAR_MONTH_SELECTED_CLASS);
    }
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("tabindex", tabindex);
    btn.setAttribute("class", classes.join(" "));
    btn.setAttribute("data-value", index);
    btn.setAttribute("data-label", month);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isDisabled === true) {
      btn.disabled = true;
    }
    btn.textContent = month;
    return btn;
  });
  const monthsHtml = document.createElement("div");
  monthsHtml.setAttribute("tabindex", "-1");
  monthsHtml.setAttribute("class", CALENDAR_MONTH_PICKER_CLASS);
  const table = document.createElement("table");
  table.setAttribute("class", CALENDAR_TABLE_CLASS);
  table.setAttribute("role", "presentation");
  const monthsGrid = listToGridHtml(months, 3);
  const tableBody = createTableBody(monthsGrid);
  table.insertAdjacentElement("beforeend", tableBody);
  monthsHtml.insertAdjacentElement("beforeend", table);
  const newCalendar = calendarEl.cloneNode();
  newCalendar.insertAdjacentElement("beforeend", monthsHtml);
  calendarEl.parentNode.replaceChild(newCalendar, calendarEl);
  statusEl.textContent = "Select a month.";
  return newCalendar;
};

/**
 * Select a month in the date picker component.
 *
 * @param {HTMLButtonElement} monthEl An month element within the date picker component
 */
const selectMonth = monthEl => {
  if (monthEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(monthEl);
  const selectedMonth = parseInt(monthEl.dataset.value, 10);
  let date = setMonth(calendarDate, selectedMonth);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
};

// #endregion Calendar - Month Selection View

// #region Calendar - Year Selection View

/**
 * Display the year selection screen in the date picker.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 * @param {number} yearToDisplay year to display in year selection
 * @returns {HTMLElement} a reference to the new calendar element
 */
const displayYearSelection = (el, yearToDisplay) => {
  const {
    calendarEl,
    statusEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const selectedYear = calendarDate.getFullYear();
  const focusedYear = yearToDisplay == null ? selectedYear : yearToDisplay;
  let yearToChunk = focusedYear;
  yearToChunk -= yearToChunk % YEAR_CHUNK;
  yearToChunk = Math.max(0, yearToChunk);
  const prevYearChunkDisabled = isDatesYearOutsideMinOrMax(setYear(calendarDate, yearToChunk - 1), minDate, maxDate);
  const nextYearChunkDisabled = isDatesYearOutsideMinOrMax(setYear(calendarDate, yearToChunk + YEAR_CHUNK), minDate, maxDate);
  const years = [];
  let yearIndex = yearToChunk;
  while (years.length < YEAR_CHUNK) {
    const isDisabled = isDatesYearOutsideMinOrMax(setYear(calendarDate, yearIndex), minDate, maxDate);
    let tabindex = "-1";
    const classes = [CALENDAR_YEAR_CLASS];
    const isSelected = yearIndex === selectedYear;
    if (yearIndex === focusedYear) {
      tabindex = "0";
      classes.push(CALENDAR_YEAR_FOCUSED_CLASS);
    }
    if (isSelected) {
      classes.push(CALENDAR_YEAR_SELECTED_CLASS);
    }
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("tabindex", tabindex);
    btn.setAttribute("class", classes.join(" "));
    btn.setAttribute("data-value", yearIndex);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isDisabled === true) {
      btn.disabled = true;
    }
    btn.textContent = yearIndex;
    years.push(btn);
    yearIndex += 1;
  }
  const newCalendar = calendarEl.cloneNode();

  // create the years calendar wrapper
  const yearsCalendarWrapper = document.createElement("div");
  yearsCalendarWrapper.setAttribute("tabindex", "-1");
  yearsCalendarWrapper.setAttribute("class", CALENDAR_YEAR_PICKER_CLASS);

  // create table parent
  const yearsTableParent = document.createElement("table");
  yearsTableParent.setAttribute("class", CALENDAR_TABLE_CLASS);

  // create table body and table row
  const yearsHTMLTableBody = document.createElement("tbody");
  const yearsHTMLTableBodyRow = document.createElement("tr");

  // create previous button
  const previousYearsBtn = document.createElement("button");
  previousYearsBtn.setAttribute("type", "button");
  previousYearsBtn.setAttribute("class", CALENDAR_PREVIOUS_YEAR_CHUNK_CLASS);
  previousYearsBtn.setAttribute("aria-label", `Navigate back ${YEAR_CHUNK} years`);
  if (prevYearChunkDisabled === true) {
    previousYearsBtn.disabled = true;
  }
  previousYearsBtn.innerHTML = Sanitizer.escapeHTML`&nbsp`;

  // create next button
  const nextYearsBtn = document.createElement("button");
  nextYearsBtn.setAttribute("type", "button");
  nextYearsBtn.setAttribute("class", CALENDAR_NEXT_YEAR_CHUNK_CLASS);
  nextYearsBtn.setAttribute("aria-label", `Navigate forward ${YEAR_CHUNK} years`);
  if (nextYearChunkDisabled === true) {
    nextYearsBtn.disabled = true;
  }
  nextYearsBtn.innerHTML = Sanitizer.escapeHTML`&nbsp`;

  // create the actual years table
  const yearsTable = document.createElement("table");
  yearsTable.setAttribute("class", CALENDAR_TABLE_CLASS);
  yearsTable.setAttribute("role", "presentation");

  // create the years child table
  const yearsGrid = listToGridHtml(years, 3);
  const yearsTableBody = createTableBody(yearsGrid);

  // append the grid to the years child table
  yearsTable.insertAdjacentElement("beforeend", yearsTableBody);

  // create the prev button td and append the prev button
  const yearsHTMLTableBodyDetailPrev = document.createElement("td");
  yearsHTMLTableBodyDetailPrev.insertAdjacentElement("beforeend", previousYearsBtn);

  // create the years td and append the years child table
  const yearsHTMLTableBodyYearsDetail = document.createElement("td");
  yearsHTMLTableBodyYearsDetail.setAttribute("colspan", "3");
  yearsHTMLTableBodyYearsDetail.insertAdjacentElement("beforeend", yearsTable);

  // create the next button td and append the next button
  const yearsHTMLTableBodyDetailNext = document.createElement("td");
  yearsHTMLTableBodyDetailNext.insertAdjacentElement("beforeend", nextYearsBtn);

  // append the three td to the years child table row
  yearsHTMLTableBodyRow.insertAdjacentElement("beforeend", yearsHTMLTableBodyDetailPrev);
  yearsHTMLTableBodyRow.insertAdjacentElement("beforeend", yearsHTMLTableBodyYearsDetail);
  yearsHTMLTableBodyRow.insertAdjacentElement("beforeend", yearsHTMLTableBodyDetailNext);

  // append the table row to the years child table body
  yearsHTMLTableBody.insertAdjacentElement("beforeend", yearsHTMLTableBodyRow);

  // append the years table body to the years parent table
  yearsTableParent.insertAdjacentElement("beforeend", yearsHTMLTableBody);

  // append the parent table to the calendar wrapper
  yearsCalendarWrapper.insertAdjacentElement("beforeend", yearsTableParent);

  // append the years calender to the new calendar
  newCalendar.insertAdjacentElement("beforeend", yearsCalendarWrapper);

  // replace calendar
  calendarEl.parentNode.replaceChild(newCalendar, calendarEl);
  statusEl.textContent = Sanitizer.escapeHTML`Showing years ${yearToChunk} to ${yearToChunk + YEAR_CHUNK - 1}. Select a year.`;
  return newCalendar;
};

/**
 * Navigate back by years and display the year selection screen.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 */
const displayPreviousYearChunk = el => {
  if (el.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const yearEl = calendarEl.querySelector(CALENDAR_YEAR_FOCUSED);
  const selectedYear = parseInt(yearEl.textContent, 10);
  let adjustedYear = selectedYear - YEAR_CHUNK;
  adjustedYear = Math.max(0, adjustedYear);
  const date = setYear(calendarDate, adjustedYear);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = displayYearSelection(calendarEl, cappedDate.getFullYear());
  let nextToFocus = newCalendar.querySelector(CALENDAR_PREVIOUS_YEAR_CHUNK);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_YEAR_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate forward by years and display the year selection screen.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 */
const displayNextYearChunk = el => {
  if (el.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const yearEl = calendarEl.querySelector(CALENDAR_YEAR_FOCUSED);
  const selectedYear = parseInt(yearEl.textContent, 10);
  let adjustedYear = selectedYear + YEAR_CHUNK;
  adjustedYear = Math.max(0, adjustedYear);
  const date = setYear(calendarDate, adjustedYear);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = displayYearSelection(calendarEl, cappedDate.getFullYear());
  let nextToFocus = newCalendar.querySelector(CALENDAR_NEXT_YEAR_CHUNK);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_YEAR_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Select a year in the date picker component.
 *
 * @param {HTMLButtonElement} yearEl A year element within the date picker component
 */
const selectYear = yearEl => {
  if (yearEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(yearEl);
  const selectedYear = parseInt(yearEl.innerHTML, 10);
  let date = setYear(calendarDate, selectedYear);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
};

// #endregion Calendar - Year Selection View

// #region Calendar Event Handling

/**
 * Hide the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEscapeFromCalendar = event => {
  const {
    datePickerEl,
    externalInputEl
  } = getDatePickerContext(event.target);
  hideCalendar(datePickerEl);
  externalInputEl.focus();
  event.preventDefault();
};

// #endregion Calendar Event Handling

// #region Calendar Date Event Handling

/**
 * Adjust the date and display the calendar if needed.
 *
 * @param {function} adjustDateFn function that returns the adjusted date
 */
const adjustCalendar = adjustDateFn => event => {
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(event.target);
  const date = adjustDateFn(calendarDate);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  if (!isSameDay(calendarDate, cappedDate)) {
    const newCalendar = renderCalendar(calendarEl, cappedDate);
    newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
  }
  event.preventDefault();
};

/**
 * Navigate back one week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleUpFromDate = adjustCalendar(date => subWeeks(date, 1));

/**
 * Navigate forward one week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleDownFromDate = adjustCalendar(date => addWeeks(date, 1));

/**
 * Navigate back one day and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleLeftFromDate = adjustCalendar(date => subDays(date, 1));

/**
 * Navigate forward one day and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleRightFromDate = adjustCalendar(date => addDays(date, 1));

/**
 * Navigate to the start of the week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleHomeFromDate = adjustCalendar(date => startOfWeek(date));

/**
 * Navigate to the end of the week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEndFromDate = adjustCalendar(date => endOfWeek(date));

/**
 * Navigate forward one month and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageDownFromDate = adjustCalendar(date => addMonths(date, 1));

/**
 * Navigate back one month and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageUpFromDate = adjustCalendar(date => subMonths(date, 1));

/**
 * Navigate forward one year and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleShiftPageDownFromDate = adjustCalendar(date => addYears(date, 1));

/**
 * Navigate back one year and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleShiftPageUpFromDate = adjustCalendar(date => subYears(date, 1));

/**
 * display the calendar for the mouseover date.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLButtonElement} dateEl A date element within the date picker component
 */
const handleMouseoverFromDate = dateEl => {
  if (dateEl.disabled) return;
  const calendarEl = dateEl.closest(DATE_PICKER_CALENDAR);
  const currentCalendarDate = calendarEl.dataset.value;
  const hoverDate = dateEl.dataset.value;
  if (hoverDate === currentCalendarDate) return;
  const dateToDisplay = parseDateString(hoverDate);
  const newCalendar = renderCalendar(calendarEl, dateToDisplay);
  newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
};

// #endregion Calendar Date Event Handling

// #region Calendar Month Event Handling

/**
 * Adjust the month and display the month selection screen if needed.
 *
 * @param {function} adjustMonthFn function that returns the adjusted month
 */
const adjustMonthSelectionScreen = adjustMonthFn => event => {
  const monthEl = event.target;
  const selectedMonth = parseInt(monthEl.dataset.value, 10);
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(monthEl);
  const currentDate = setMonth(calendarDate, selectedMonth);
  let adjustedMonth = adjustMonthFn(selectedMonth);
  adjustedMonth = Math.max(0, Math.min(11, adjustedMonth));
  const date = setMonth(calendarDate, adjustedMonth);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  if (!isSameMonth(currentDate, cappedDate)) {
    const newCalendar = displayMonthSelection(calendarEl, cappedDate.getMonth());
    newCalendar.querySelector(CALENDAR_MONTH_FOCUSED).focus();
  }
  event.preventDefault();
};

/**
 * Navigate back three months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleUpFromMonth = adjustMonthSelectionScreen(month => month - 3);

/**
 * Navigate forward three months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleDownFromMonth = adjustMonthSelectionScreen(month => month + 3);

/**
 * Navigate back one month and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleLeftFromMonth = adjustMonthSelectionScreen(month => month - 1);

/**
 * Navigate forward one month and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleRightFromMonth = adjustMonthSelectionScreen(month => month + 1);

/**
 * Navigate to the start of the row of months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleHomeFromMonth = adjustMonthSelectionScreen(month => month - month % 3);

/**
 * Navigate to the end of the row of months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEndFromMonth = adjustMonthSelectionScreen(month => month + 2 - month % 3);

/**
 * Navigate to the last month (December) and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageDownFromMonth = adjustMonthSelectionScreen(() => 11);

/**
 * Navigate to the first month (January) and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageUpFromMonth = adjustMonthSelectionScreen(() => 0);

/**
 * update the focus on a month when the mouse moves.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLButtonElement} monthEl A month element within the date picker component
 */
const handleMouseoverFromMonth = monthEl => {
  if (monthEl.disabled) return;
  if (monthEl.classList.contains(CALENDAR_MONTH_FOCUSED_CLASS)) return;
  const focusMonth = parseInt(monthEl.dataset.value, 10);
  const newCalendar = displayMonthSelection(monthEl, focusMonth);
  newCalendar.querySelector(CALENDAR_MONTH_FOCUSED).focus();
};

// #endregion Calendar Month Event Handling

// #region Calendar Year Event Handling

/**
 * Adjust the year and display the year selection screen if needed.
 *
 * @param {function} adjustYearFn function that returns the adjusted year
 */
const adjustYearSelectionScreen = adjustYearFn => event => {
  const yearEl = event.target;
  const selectedYear = parseInt(yearEl.dataset.value, 10);
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(yearEl);
  const currentDate = setYear(calendarDate, selectedYear);
  let adjustedYear = adjustYearFn(selectedYear);
  adjustedYear = Math.max(0, adjustedYear);
  const date = setYear(calendarDate, adjustedYear);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  if (!isSameYear(currentDate, cappedDate)) {
    const newCalendar = displayYearSelection(calendarEl, cappedDate.getFullYear());
    newCalendar.querySelector(CALENDAR_YEAR_FOCUSED).focus();
  }
  event.preventDefault();
};

/**
 * Navigate back three years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleUpFromYear = adjustYearSelectionScreen(year => year - 3);

/**
 * Navigate forward three years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleDownFromYear = adjustYearSelectionScreen(year => year + 3);

/**
 * Navigate back one year and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleLeftFromYear = adjustYearSelectionScreen(year => year - 1);

/**
 * Navigate forward one year and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleRightFromYear = adjustYearSelectionScreen(year => year + 1);

/**
 * Navigate to the start of the row of years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleHomeFromYear = adjustYearSelectionScreen(year => year - year % 3);

/**
 * Navigate to the end of the row of years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEndFromYear = adjustYearSelectionScreen(year => year + 2 - year % 3);

/**
 * Navigate to back 12 years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageUpFromYear = adjustYearSelectionScreen(year => year - YEAR_CHUNK);

/**
 * Navigate forward 12 years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageDownFromYear = adjustYearSelectionScreen(year => year + YEAR_CHUNK);

/**
 * update the focus on a year when the mouse moves.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLButtonElement} dateEl A year element within the date picker component
 */
const handleMouseoverFromYear = yearEl => {
  if (yearEl.disabled) return;
  if (yearEl.classList.contains(CALENDAR_YEAR_FOCUSED_CLASS)) return;
  const focusYear = parseInt(yearEl.dataset.value, 10);
  const newCalendar = displayYearSelection(yearEl, focusYear);
  newCalendar.querySelector(CALENDAR_YEAR_FOCUSED).focus();
};

// #endregion Calendar Year Event Handling

// #region Focus Handling Event Handling

const tabHandler = focusable => {
  const getFocusableContext = el => {
    const {
      calendarEl
    } = getDatePickerContext(el);
    const focusableElements = select(focusable, calendarEl);
    const firstTabIndex = 0;
    const lastTabIndex = focusableElements.length - 1;
    const firstTabStop = focusableElements[firstTabIndex];
    const lastTabStop = focusableElements[lastTabIndex];
    const focusIndex = focusableElements.indexOf(activeElement());
    const isLastTab = focusIndex === lastTabIndex;
    const isFirstTab = focusIndex === firstTabIndex;
    const isNotFound = focusIndex === -1;
    return {
      focusableElements,
      isNotFound,
      firstTabStop,
      isFirstTab,
      lastTabStop,
      isLastTab
    };
  };
  return {
    tabAhead(event) {
      const {
        firstTabStop,
        isLastTab,
        isNotFound
      } = getFocusableContext(event.target);
      if (isLastTab || isNotFound) {
        event.preventDefault();
        firstTabStop.focus();
      }
    },
    tabBack(event) {
      const {
        lastTabStop,
        isFirstTab,
        isNotFound
      } = getFocusableContext(event.target);
      if (isFirstTab || isNotFound) {
        event.preventDefault();
        lastTabStop.focus();
      }
    }
  };
};
const datePickerTabEventHandler = tabHandler(DATE_PICKER_FOCUSABLE);
const monthPickerTabEventHandler = tabHandler(MONTH_PICKER_FOCUSABLE);
const yearPickerTabEventHandler = tabHandler(YEAR_PICKER_FOCUSABLE);

// #endregion Focus Handling Event Handling

// #region Date Picker Event Delegation Registration / Component

const datePickerEvents = {
  [CLICK]: {
    [DATE_PICKER_BUTTON]() {
      toggleCalendar(this);
    },
    [CALENDAR_DATE]() {
      selectDate(this);
    },
    [CALENDAR_MONTH]() {
      selectMonth(this);
    },
    [CALENDAR_YEAR]() {
      selectYear(this);
    },
    [CALENDAR_PREVIOUS_MONTH]() {
      displayPreviousMonth(this);
    },
    [CALENDAR_NEXT_MONTH]() {
      displayNextMonth(this);
    },
    [CALENDAR_PREVIOUS_YEAR]() {
      displayPreviousYear(this);
    },
    [CALENDAR_NEXT_YEAR]() {
      displayNextYear(this);
    },
    [CALENDAR_PREVIOUS_YEAR_CHUNK]() {
      displayPreviousYearChunk(this);
    },
    [CALENDAR_NEXT_YEAR_CHUNK]() {
      displayNextYearChunk(this);
    },
    [CALENDAR_MONTH_SELECTION]() {
      const newCalendar = displayMonthSelection(this);
      newCalendar.querySelector(CALENDAR_MONTH_FOCUSED).focus();
    },
    [CALENDAR_YEAR_SELECTION]() {
      const newCalendar = displayYearSelection(this);
      newCalendar.querySelector(CALENDAR_YEAR_FOCUSED).focus();
    }
  },
  keyup: {
    [DATE_PICKER_CALENDAR](event) {
      const keydown = this.dataset.keydownKeyCode;
      if (`${event.keyCode}` !== keydown) {
        event.preventDefault();
      }
    }
  },
  keydown: {
    [DATE_PICKER_EXTERNAL_INPUT](event) {
      if (event.keyCode === ENTER_KEYCODE) {
        validateDateInput(this);
      }
    },
    [CALENDAR_DATE]: keymap({
      Up: handleUpFromDate,
      ArrowUp: handleUpFromDate,
      Down: handleDownFromDate,
      ArrowDown: handleDownFromDate,
      Left: handleLeftFromDate,
      ArrowLeft: handleLeftFromDate,
      Right: handleRightFromDate,
      ArrowRight: handleRightFromDate,
      Home: handleHomeFromDate,
      End: handleEndFromDate,
      PageDown: handlePageDownFromDate,
      PageUp: handlePageUpFromDate,
      "Shift+PageDown": handleShiftPageDownFromDate,
      "Shift+PageUp": handleShiftPageUpFromDate,
      Tab: datePickerTabEventHandler.tabAhead
    }),
    [CALENDAR_DATE_PICKER]: keymap({
      Tab: datePickerTabEventHandler.tabAhead,
      "Shift+Tab": datePickerTabEventHandler.tabBack
    }),
    [CALENDAR_MONTH]: keymap({
      Up: handleUpFromMonth,
      ArrowUp: handleUpFromMonth,
      Down: handleDownFromMonth,
      ArrowDown: handleDownFromMonth,
      Left: handleLeftFromMonth,
      ArrowLeft: handleLeftFromMonth,
      Right: handleRightFromMonth,
      ArrowRight: handleRightFromMonth,
      Home: handleHomeFromMonth,
      End: handleEndFromMonth,
      PageDown: handlePageDownFromMonth,
      PageUp: handlePageUpFromMonth
    }),
    [CALENDAR_MONTH_PICKER]: keymap({
      Tab: monthPickerTabEventHandler.tabAhead,
      "Shift+Tab": monthPickerTabEventHandler.tabBack
    }),
    [CALENDAR_YEAR]: keymap({
      Up: handleUpFromYear,
      ArrowUp: handleUpFromYear,
      Down: handleDownFromYear,
      ArrowDown: handleDownFromYear,
      Left: handleLeftFromYear,
      ArrowLeft: handleLeftFromYear,
      Right: handleRightFromYear,
      ArrowRight: handleRightFromYear,
      Home: handleHomeFromYear,
      End: handleEndFromYear,
      PageDown: handlePageDownFromYear,
      PageUp: handlePageUpFromYear
    }),
    [CALENDAR_YEAR_PICKER]: keymap({
      Tab: yearPickerTabEventHandler.tabAhead,
      "Shift+Tab": yearPickerTabEventHandler.tabBack
    }),
    [DATE_PICKER_CALENDAR](event) {
      this.dataset.keydownKeyCode = event.keyCode;
    },
    [DATE_PICKER](event) {
      const keyMap = keymap({
        Escape: handleEscapeFromCalendar
      });
      keyMap(event);
    }
  },
  focusout: {
    [DATE_PICKER_EXTERNAL_INPUT]() {
      validateDateInput(this);
    },
    [DATE_PICKER](event) {
      if (!this.contains(event.relatedTarget)) {
        hideCalendar(this);
      }
    }
  },
  input: {
    [DATE_PICKER_EXTERNAL_INPUT]() {
      reconcileInputValues(this);
      updateCalendarIfVisible(this);
    }
  }
};
if (!isIosDevice()) {
  datePickerEvents.mouseover = {
    [CALENDAR_DATE_CURRENT_MONTH]() {
      handleMouseoverFromDate(this);
    },
    [CALENDAR_MONTH]() {
      handleMouseoverFromMonth(this);
    },
    [CALENDAR_YEAR]() {
      handleMouseoverFromYear(this);
    }
  };
}
const datePicker = behavior(datePickerEvents, {
  init(root) {
    selectOrMatches(DATE_PICKER, root).forEach(datePickerEl => {
      enhanceDatePicker(datePickerEl);
    });
  },
  getDatePickerContext,
  disable,
  ariaDisable,
  enable,
  isDateInputInvalid,
  setCalendarValue,
  validateDateInput,
  renderCalendar,
  updateCalendarIfVisible
});

// #endregion Date Picker Event Delegation Registration / Component

module.exports = datePicker;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/active-element":45,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/is-ios-device":50,"../../uswds-core/src/js/utils/sanitizer":51,"../../uswds-core/src/js/utils/select":54,"../../uswds-core/src/js/utils/select-or-matches":53,"receptor/keymap":11}],21:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  getDatePickerContext,
  isDateInputInvalid,
  updateCalendarIfVisible
} = require("../../usa-date-picker/src/index");
const DATE_PICKER_CLASS = `${PREFIX}-date-picker`;
const DATE_RANGE_PICKER_CLASS = `${PREFIX}-date-range-picker`;
const DATE_RANGE_PICKER_RANGE_START_CLASS = `${DATE_RANGE_PICKER_CLASS}__range-start`;
const DATE_RANGE_PICKER_RANGE_END_CLASS = `${DATE_RANGE_PICKER_CLASS}__range-end`;
const DATE_PICKER = `.${DATE_PICKER_CLASS}`;
const DATE_RANGE_PICKER = `.${DATE_RANGE_PICKER_CLASS}`;
const DATE_RANGE_PICKER_RANGE_START = `.${DATE_RANGE_PICKER_RANGE_START_CLASS}`;
const DATE_RANGE_PICKER_RANGE_END = `.${DATE_RANGE_PICKER_RANGE_END_CLASS}`;
const DEFAULT_MIN_DATE = "0000-01-01";

/**
 * The properties and elements within the date range picker.
 * @typedef {Object} DateRangePickerContext
 * @property {HTMLElement} dateRangePickerEl
 * @property {HTMLElement} rangeStartEl
 * @property {HTMLElement} rangeEndEl
 */

/**
 * Get an object of the properties and elements belonging directly to the given
 * date picker component.
 *
 * @param {HTMLElement} el the element within the date picker
 * @returns {DateRangePickerContext} elements
 */
const getDateRangePickerContext = el => {
  const dateRangePickerEl = el.closest(DATE_RANGE_PICKER);
  if (!dateRangePickerEl) {
    throw new Error(`Element is missing outer ${DATE_RANGE_PICKER}`);
  }
  const rangeStartEl = dateRangePickerEl.querySelector(DATE_RANGE_PICKER_RANGE_START);
  const rangeEndEl = dateRangePickerEl.querySelector(DATE_RANGE_PICKER_RANGE_END);
  return {
    dateRangePickerEl,
    rangeStartEl,
    rangeEndEl
  };
};

/**
 * handle update from range start date picker
 *
 * @param {HTMLElement} el an element within the date range picker
 */
const handleRangeStartUpdate = el => {
  const {
    dateRangePickerEl,
    rangeStartEl,
    rangeEndEl
  } = getDateRangePickerContext(el);
  const {
    internalInputEl
  } = getDatePickerContext(rangeStartEl);
  const updatedDate = internalInputEl.value;
  if (updatedDate && !isDateInputInvalid(internalInputEl)) {
    rangeEndEl.dataset.minDate = updatedDate;
    rangeEndEl.dataset.rangeDate = updatedDate;
    rangeEndEl.dataset.defaultDate = updatedDate;
  } else {
    rangeEndEl.dataset.minDate = dateRangePickerEl.dataset.minDate || "";
    rangeEndEl.dataset.rangeDate = "";
    rangeEndEl.dataset.defaultDate = "";
  }
  updateCalendarIfVisible(rangeEndEl);
};

/**
 * handle update from range start date picker
 *
 * @param {HTMLElement} el an element within the date range picker
 */
const handleRangeEndUpdate = el => {
  const {
    dateRangePickerEl,
    rangeStartEl,
    rangeEndEl
  } = getDateRangePickerContext(el);
  const {
    internalInputEl
  } = getDatePickerContext(rangeEndEl);
  const updatedDate = internalInputEl.value;
  if (updatedDate && !isDateInputInvalid(internalInputEl)) {
    rangeStartEl.dataset.maxDate = updatedDate;
    rangeStartEl.dataset.rangeDate = updatedDate;
    rangeStartEl.dataset.defaultDate = updatedDate;
  } else {
    rangeStartEl.dataset.maxDate = dateRangePickerEl.dataset.maxDate || "";
    rangeStartEl.dataset.rangeDate = "";
    rangeStartEl.dataset.defaultDate = "";
  }
  updateCalendarIfVisible(rangeStartEl);
};

/**
 * Enhance an input with the date picker elements
 *
 * @param {HTMLElement} el The initial wrapping element of the date range picker component
 */
const enhanceDateRangePicker = el => {
  const dateRangePickerEl = el.closest(DATE_RANGE_PICKER);
  const [rangeStart, rangeEnd] = select(DATE_PICKER, dateRangePickerEl);
  if (!rangeStart) {
    throw new Error(`${DATE_RANGE_PICKER} is missing inner two '${DATE_PICKER}' elements`);
  }
  if (!rangeEnd) {
    throw new Error(`${DATE_RANGE_PICKER} is missing second '${DATE_PICKER}' element`);
  }
  rangeStart.classList.add(DATE_RANGE_PICKER_RANGE_START_CLASS);
  rangeEnd.classList.add(DATE_RANGE_PICKER_RANGE_END_CLASS);
  if (!dateRangePickerEl.dataset.minDate) {
    dateRangePickerEl.dataset.minDate = DEFAULT_MIN_DATE;
  }
  const {
    minDate
  } = dateRangePickerEl.dataset;
  rangeStart.dataset.minDate = minDate;
  rangeEnd.dataset.minDate = minDate;
  const {
    maxDate
  } = dateRangePickerEl.dataset;
  if (maxDate) {
    rangeStart.dataset.maxDate = maxDate;
    rangeEnd.dataset.maxDate = maxDate;
  }
  handleRangeStartUpdate(dateRangePickerEl);
  handleRangeEndUpdate(dateRangePickerEl);
};
const dateRangePicker = behavior({
  "input change": {
    [DATE_RANGE_PICKER_RANGE_START]() {
      handleRangeStartUpdate(this);
    },
    [DATE_RANGE_PICKER_RANGE_END]() {
      handleRangeEndUpdate(this);
    }
  }
}, {
  init(root) {
    selectOrMatches(DATE_RANGE_PICKER, root).forEach(dateRangePickerEl => {
      enhanceDateRangePicker(dateRangePickerEl);
    });
  }
});
module.exports = dateRangePicker;

},{"../../usa-date-picker/src/index":20,"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select":54,"../../uswds-core/src/js/utils/select-or-matches":53}],22:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const DROPZONE_CLASS = `${PREFIX}-file-input`;
const DROPZONE = `.${DROPZONE_CLASS}`;
const INPUT_CLASS = `${PREFIX}-file-input__input`;
const TARGET_CLASS = `${PREFIX}-file-input__target`;
const INPUT = `.${INPUT_CLASS}`;
const BOX_CLASS = `${PREFIX}-file-input__box`;
const INSTRUCTIONS_CLASS = `${PREFIX}-file-input__instructions`;
const PREVIEW_CLASS = `${PREFIX}-file-input__preview`;
const PREVIEW_HEADING_CLASS = `${PREFIX}-file-input__preview-heading`;
const DISABLED_CLASS = `${PREFIX}-file-input--disabled`;
const CHOOSE_CLASS = `${PREFIX}-file-input__choose`;
const ACCEPTED_FILE_MESSAGE_CLASS = `${PREFIX}-file-input__accepted-files-message`;
const DRAG_TEXT_CLASS = `${PREFIX}-file-input__drag-text`;
const DRAG_CLASS = `${PREFIX}-file-input--drag`;
const LOADING_CLASS = "is-loading";
const INVALID_FILE_CLASS = "has-invalid-file";
const GENERIC_PREVIEW_CLASS_NAME = `${PREFIX}-file-input__preview-image`;
const GENERIC_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--generic`;
const PDF_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--pdf`;
const WORD_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--word`;
const VIDEO_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--video`;
const EXCEL_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--excel`;
const SR_ONLY_CLASS = `${PREFIX}-sr-only`;
const SPACER_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
let TYPE_IS_VALID = Boolean(true); // logic gate for change listener
let DEFAULT_ARIA_LABEL_TEXT = "";
let DEFAULT_FILE_STATUS_TEXT = "";

/**
 * The properties and elements within the file input.
 * @typedef {Object} FileInputContext
 * @property {HTMLDivElement} dropZoneEl
 * @property {HTMLInputElement} inputEl
 */

/**
 * Get an object of the properties and elements belonging directly to the given
 * file input component.
 *
 * @param {HTMLElement} el the element within the file input
 * @returns {FileInputContext} elements
 */
const getFileInputContext = el => {
  const dropZoneEl = el.closest(DROPZONE);
  if (!dropZoneEl) {
    throw new Error(`Element is missing outer ${DROPZONE}`);
  }
  const inputEl = dropZoneEl.querySelector(INPUT);
  return {
    dropZoneEl,
    inputEl
  };
};

/**
 * Disable the file input component
 *
 * @param {HTMLElement} el An element within the file input component
 */
const disable = el => {
  const {
    dropZoneEl,
    inputEl
  } = getFileInputContext(el);
  inputEl.disabled = true;
  dropZoneEl.classList.add(DISABLED_CLASS);
};

/**
 * Set aria-disabled attribute to file input component
 *
 * @param {HTMLElement} el An element within the file input component
 */
const ariaDisable = el => {
  const {
    dropZoneEl
  } = getFileInputContext(el);
  dropZoneEl.classList.add(DISABLED_CLASS);
};

/**
 * Enable the file input component
 *
 * @param {HTMLElement} el An element within the file input component
 */
const enable = el => {
  const {
    dropZoneEl,
    inputEl
  } = getFileInputContext(el);
  inputEl.disabled = false;
  dropZoneEl.classList.remove(DISABLED_CLASS);
  dropZoneEl.removeAttribute("aria-disabled");
};

/**
 *
 * @param {String} s special characters
 * @returns {String} replaces specified values
 */
const replaceName = s => {
  const c = s.charCodeAt(0);
  if (c === 32) return "-";
  if (c >= 65 && c <= 90) return `img_${s.toLowerCase()}`;
  return `__${("000", c.toString(16)).slice(-4)}`;
};

/**
 * Creates an ID name for each file that strips all invalid characters.
 * @param {String} name - name of the file added to file input (searchvalue)
 * @returns {String} same characters as the name with invalid chars removed (newvalue)
 */
const makeSafeForID = name => name.replace(/[^a-z0-9]/g, replaceName);

// Takes a generated safe ID and creates a unique ID.
const createUniqueID = name => `${name}-${Math.floor(Date.now().toString() / 1000)}`;

/**
 * Determines if the singular or plural item label should be used
 * Determination is based on the presence of the `multiple` attribute
 *
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @returns {HTMLDivElement} The singular or plural version of "item"
 */
const getItemsLabel = fileInputEl => {
  const acceptsMultiple = fileInputEl.hasAttribute("multiple");
  const itemsLabel = acceptsMultiple ? "files" : "file";
  return itemsLabel;
};

/**
 * Scaffold the file input component with a parent wrapper and
 * Create a target area overlay for drag and drop functionality
 *
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @returns {HTMLDivElement} The drag and drop target area.
 */
const createTargetArea = fileInputEl => {
  const fileInputParent = document.createElement("div");
  const dropTarget = document.createElement("div");
  const box = document.createElement("div");

  // Adds class names and other attributes
  fileInputEl.classList.remove(DROPZONE_CLASS);
  fileInputEl.classList.add(INPUT_CLASS);
  fileInputParent.classList.add(DROPZONE_CLASS);
  box.classList.add(BOX_CLASS);
  dropTarget.classList.add(TARGET_CLASS);

  // Adds child elements to the DOM
  dropTarget.prepend(box);
  fileInputEl.parentNode.insertBefore(dropTarget, fileInputEl);
  fileInputEl.parentNode.insertBefore(fileInputParent, dropTarget);
  dropTarget.appendChild(fileInputEl);
  fileInputParent.appendChild(dropTarget);
  return dropTarget;
};

/**
 * Build the visible element with default interaction instructions.
 *
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @returns {HTMLDivElement} The container for visible interaction instructions.
 */
const createVisibleInstructions = fileInputEl => {
  const fileInputParent = fileInputEl.closest(DROPZONE);
  const itemsLabel = getItemsLabel(fileInputEl);
  const instructions = document.createElement("div");
  const dragText = `Drag ${itemsLabel} here or`;
  const chooseText = "choose from folder";

  // Create instructions text for aria-label
  DEFAULT_ARIA_LABEL_TEXT = `${dragText} ${chooseText}`;

  // Adds class names and other attributes
  instructions.classList.add(INSTRUCTIONS_CLASS);
  instructions.setAttribute("aria-hidden", "true");

  // Add initial instructions for input usage
  fileInputEl.setAttribute("aria-label", DEFAULT_ARIA_LABEL_TEXT);
  instructions.innerHTML = Sanitizer.escapeHTML`<span class="${DRAG_TEXT_CLASS}">${dragText}</span> <span class="${CHOOSE_CLASS}">${chooseText}</span>`;

  // Add the instructions element to the DOM
  fileInputEl.parentNode.insertBefore(instructions, fileInputEl);

  // IE11 and Edge do not support drop files on file inputs, so we've removed text that indicates that
  if (/rv:11.0/i.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent)) {
    fileInputParent.querySelector(`.${DRAG_TEXT_CLASS}`).outerHTML = "";
  }
  return instructions;
};

/**
 * Build a screen reader-only message element that contains file status updates and
 * Create and set the default file status message
 *
 * @param {HTMLInputElement} fileInputEl - The input element.
 */
const createSROnlyStatus = fileInputEl => {
  const statusEl = document.createElement("div");
  const itemsLabel = getItemsLabel(fileInputEl);
  const fileInputParent = fileInputEl.closest(DROPZONE);
  const fileInputTarget = fileInputEl.closest(`.${TARGET_CLASS}`);
  DEFAULT_FILE_STATUS_TEXT = `No ${itemsLabel} selected.`;

  // Adds class names and other attributes
  statusEl.classList.add(SR_ONLY_CLASS);
  statusEl.setAttribute("aria-live", "polite");

  // Add initial file status message
  statusEl.textContent = DEFAULT_FILE_STATUS_TEXT;

  // Add the status element to the DOM
  fileInputParent.insertBefore(statusEl, fileInputTarget);
};

/**
 * Scaffold the component with all required elements
 *
 * @param {HTMLInputElement} fileInputEl - The original input element.
 */
const enhanceFileInput = fileInputEl => {
  const isInputDisabled = fileInputEl.hasAttribute("aria-disabled") || fileInputEl.hasAttribute("disabled");
  const dropTarget = createTargetArea(fileInputEl);
  const instructions = createVisibleInstructions(fileInputEl);
  const {
    dropZoneEl
  } = getFileInputContext(fileInputEl);
  if (isInputDisabled) {
    dropZoneEl.classList.add(DISABLED_CLASS);
  } else {
    createSROnlyStatus(fileInputEl);
  }
  return {
    instructions,
    dropTarget
  };
};

/**
 * Removes image previews
 * We want to start with a clean list every time files are added to the file input
 *
 * @param {HTMLDivElement} dropTarget - The drag and drop target area.
 * @param {HTMLDivElement} instructions - The container for visible interaction instructions.
 */
const removeOldPreviews = (dropTarget, instructions) => {
  const filePreviews = dropTarget.querySelectorAll(`.${PREVIEW_CLASS}`);
  const currentPreviewHeading = dropTarget.querySelector(`.${PREVIEW_HEADING_CLASS}`);
  const currentErrorMessage = dropTarget.querySelector(`.${ACCEPTED_FILE_MESSAGE_CLASS}`);

  /**
   * finds the parent of the passed node and removes the child
   * @param {HTMLElement} node
   */
  const removeImages = node => {
    node.parentNode.removeChild(node);
  };

  // Remove the heading above the previews
  if (currentPreviewHeading) {
    currentPreviewHeading.outerHTML = "";
  }

  // Remove existing error messages
  if (currentErrorMessage) {
    currentErrorMessage.outerHTML = "";
    dropTarget.classList.remove(INVALID_FILE_CLASS);
  }

  // Get rid of existing previews if they exist, show instructions
  if (filePreviews !== null) {
    if (instructions) {
      instructions.removeAttribute("hidden");
    }
    Array.prototype.forEach.call(filePreviews, removeImages);
  }
};

/**
 * Update the screen reader-only status message after interaction
 *
 * @param {HTMLDivElement} statusElement - The screen reader-only container for file status updates.
 * @param {Object} fileNames - The selected files found in the fileList object.
 * @param {Array} fileStore - The array of uploaded file names created from the fileNames object.
 */
const updateStatusMessage = (statusElement, fileNames, fileStore) => {
  const statusEl = statusElement;
  let statusMessage = DEFAULT_FILE_STATUS_TEXT;

  // If files added, update the status message with file name(s)
  if (fileNames.length === 1) {
    statusMessage = `You have selected the file: ${fileStore}`;
  } else if (fileNames.length > 1) {
    statusMessage = `You have selected ${fileNames.length} files: ${fileStore.join(", ")}`;
  }

  // Add delay to encourage screen reader readout
  setTimeout(() => {
    statusEl.textContent = statusMessage;
  }, 1000);
};

/**
 * Show the preview heading, hide the initial instructions and
 * Update the aria-label with new instructions text
 *
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @param {Object} fileNames - The selected files found in the fileList object.
 */
const addPreviewHeading = (fileInputEl, fileNames) => {
  const filePreviewsHeading = document.createElement("div");
  const dropTarget = fileInputEl.closest(`.${TARGET_CLASS}`);
  const instructions = dropTarget.querySelector(`.${INSTRUCTIONS_CLASS}`);
  let changeItemText = "Change file";
  let previewHeadingText = "";
  if (fileNames.length === 1) {
    previewHeadingText = Sanitizer.escapeHTML`Selected file <span class="usa-file-input__choose">${changeItemText}</span>`;
  } else if (fileNames.length > 1) {
    changeItemText = "Change files";
    previewHeadingText = Sanitizer.escapeHTML`${fileNames.length} files selected <span class="usa-file-input__choose">${changeItemText}</span>`;
  }

  // Hides null state content and sets preview heading
  instructions.setAttribute("hidden", "true");
  filePreviewsHeading.classList.add(PREVIEW_HEADING_CLASS);
  filePreviewsHeading.innerHTML = previewHeadingText;
  dropTarget.insertBefore(filePreviewsHeading, instructions);

  // Update aria label to match the visible action text
  fileInputEl.setAttribute("aria-label", changeItemText);
};

/**
 * When new files are applied to file input, this function generates previews
 * and removes old ones.
 *
 * @param {event} e
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @param {HTMLDivElement} instructions - The container for visible interaction instructions.
 * @param {HTMLDivElement} dropTarget - The drag and drop target area.
 */

const handleChange = (e, fileInputEl, instructions, dropTarget) => {
  const fileNames = e.target.files;
  const inputParent = dropTarget.closest(`.${DROPZONE_CLASS}`);
  const statusElement = inputParent.querySelector(`.${SR_ONLY_CLASS}`);
  const fileStore = [];

  // First, get rid of existing previews
  removeOldPreviews(dropTarget, instructions);

  // Then, iterate through files list and create previews
  for (let i = 0; i < fileNames.length; i += 1) {
    const reader = new FileReader();
    const fileName = fileNames[i].name;
    let imageId;

    // Push updated file names into the store array
    fileStore.push(fileName);

    // Starts with a loading image while preview is created
    reader.onloadstart = function createLoadingImage() {
      imageId = createUniqueID(makeSafeForID(fileName));
      instructions.insertAdjacentHTML("afterend", Sanitizer.escapeHTML`<div class="${PREVIEW_CLASS}" aria-hidden="true">
          <img id="${imageId}" src="${SPACER_GIF}" alt="" class="${GENERIC_PREVIEW_CLASS_NAME} ${LOADING_CLASS}"/>${fileName}
        <div>`);
    };

    // Not all files will be able to generate previews. In case this happens, we provide several types "generic previews" based on the file extension.
    reader.onloadend = function createFilePreview() {
      const previewImage = document.getElementById(imageId);
      if (fileName.indexOf(".pdf") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${PDF_PREVIEW_CLASS}")`);
      } else if (fileName.indexOf(".doc") > 0 || fileName.indexOf(".pages") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${WORD_PREVIEW_CLASS}")`);
      } else if (fileName.indexOf(".xls") > 0 || fileName.indexOf(".numbers") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${EXCEL_PREVIEW_CLASS}")`);
      } else if (fileName.indexOf(".mov") > 0 || fileName.indexOf(".mp4") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${VIDEO_PREVIEW_CLASS}")`);
      } else {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${GENERIC_PREVIEW_CLASS}")`);
      }

      // Removes loader and displays preview
      previewImage.classList.remove(LOADING_CLASS);
      previewImage.src = reader.result;
    };
    if (fileNames[i]) {
      reader.readAsDataURL(fileNames[i]);
    }
  }
  if (fileNames.length === 0) {
    // Reset input aria-label with default message
    fileInputEl.setAttribute("aria-label", DEFAULT_ARIA_LABEL_TEXT);
  } else {
    addPreviewHeading(fileInputEl, fileNames);
  }
  updateStatusMessage(statusElement, fileNames, fileStore);
};

/**
 * When using an Accept attribute, invalid files will be hidden from
 * file browser, but they can still be dragged to the input. This
 * function prevents them from being dragged and removes error states
 * when correct files are added.
 *
 * @param {event} e
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @param {HTMLDivElement} instructions - The container for visible interaction instructions.
 * @param {HTMLDivElement} dropTarget - The drag and drop target area.
 */
const preventInvalidFiles = (e, fileInputEl, instructions, dropTarget) => {
  const acceptedFilesAttr = fileInputEl.getAttribute("accept");
  dropTarget.classList.remove(INVALID_FILE_CLASS);

  /**
   * We can probably move away from this once IE11 support stops, and replace
   * with a simple es `.includes`
   * check if element is in array
   * check if 1 or more alphabets are in string
   * if element is present return the position value and -1 otherwise
   * @param {Object} file
   * @param {String} value
   * @returns {Boolean}
   */
  const isIncluded = (file, value) => {
    let returnValue = false;
    const pos = file.indexOf(value);
    if (pos >= 0) {
      returnValue = true;
    }
    return returnValue;
  };

  // Runs if only specific files are accepted
  if (acceptedFilesAttr) {
    const acceptedFiles = acceptedFilesAttr.split(",");
    const errorMessage = document.createElement("div");

    // If multiple files are dragged, this iterates through them and look for any files that are not accepted.
    let allFilesAllowed = true;
    const scannedFiles = e.target.files || e.dataTransfer.files;
    for (let i = 0; i < scannedFiles.length; i += 1) {
      const file = scannedFiles[i];
      if (allFilesAllowed) {
        for (let j = 0; j < acceptedFiles.length; j += 1) {
          const fileType = acceptedFiles[j];
          allFilesAllowed = file.name.indexOf(fileType) > 0 || isIncluded(file.type, fileType.replace(/\*/g, ""));
          if (allFilesAllowed) {
            TYPE_IS_VALID = true;
            break;
          }
        }
      } else break;
    }

    // If dragged files are not accepted, this removes them from the value of the input and creates and error state
    if (!allFilesAllowed) {
      removeOldPreviews(dropTarget, instructions);
      fileInputEl.value = ""; // eslint-disable-line no-param-reassign
      dropTarget.insertBefore(errorMessage, fileInputEl);
      errorMessage.textContent = fileInputEl.dataset.errormessage || `This is not a valid file type.`;
      errorMessage.classList.add(ACCEPTED_FILE_MESSAGE_CLASS);
      dropTarget.classList.add(INVALID_FILE_CLASS);
      TYPE_IS_VALID = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }
};

/**
 * 1. passes through gate for preventing invalid files
 * 2. handles updates if file is valid
 *
 * @param {event} event
 * @param {HTMLInputElement} fileInputEl - The input element.
 * @param {HTMLDivElement} instructions - The container for visible interaction instructions.
 * @param {HTMLDivElement} dropTarget - The drag and drop target area.
 */
const handleUpload = (event, fileInputEl, instructions, dropTarget) => {
  preventInvalidFiles(event, fileInputEl, instructions, dropTarget);
  if (TYPE_IS_VALID === true) {
    handleChange(event, fileInputEl, instructions, dropTarget);
  }
};
const fileInput = behavior({}, {
  init(root) {
    selectOrMatches(DROPZONE, root).forEach(fileInputEl => {
      const {
        instructions,
        dropTarget
      } = enhanceFileInput(fileInputEl);
      dropTarget.addEventListener("dragover", function handleDragOver() {
        this.classList.add(DRAG_CLASS);
      }, false);
      dropTarget.addEventListener("dragleave", function handleDragLeave() {
        this.classList.remove(DRAG_CLASS);
      }, false);
      dropTarget.addEventListener("drop", function handleDrop() {
        this.classList.remove(DRAG_CLASS);
      }, false);
      fileInputEl.addEventListener("change", e => handleUpload(e, fileInputEl, instructions, dropTarget), false);
    });
  },
  teardown(root) {
    selectOrMatches(INPUT, root).forEach(fileInputEl => {
      const fileInputTopElement = fileInputEl.parentElement.parentElement;
      fileInputTopElement.parentElement.replaceChild(fileInputEl, fileInputTopElement);
      // eslint-disable-next-line no-param-reassign
      fileInputEl.className = DROPZONE_CLASS;
    });
  },
  getFileInputContext,
  disable,
  ariaDisable,
  enable
});
module.exports = fileInput;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/sanitizer":51,"../../uswds-core/src/js/utils/select-or-matches":53}],23:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const SCOPE = `.${PREFIX}-footer--big`;
const NAV = `${SCOPE} nav`;
const BUTTON = `${NAV} .${PREFIX}-footer__primary-link`;
const HIDE_MAX_WIDTH = 480;

/**
 * Expands selected footer menu panel, while collapsing others
 */
function showPanel() {
  if (window.innerWidth < HIDE_MAX_WIDTH) {
    const isOpen = this.getAttribute("aria-expanded") === "true";
    const thisFooter = this.closest(SCOPE);

    // Close all other menus
    thisFooter.querySelectorAll(BUTTON).forEach(button => {
      button.setAttribute("aria-expanded", false);
    });
    this.setAttribute("aria-expanded", !isOpen);
  }
}

/**
 * Swaps the <h4> element for a <button> element (and vice-versa) and sets id
 * of menu list
 *
 * @param {Boolean} isMobile - If the footer is in mobile configuration
 */
function toggleHtmlTag(isMobile) {
  const bigFooter = document.querySelector(SCOPE);
  if (!bigFooter) {
    return;
  }
  const primaryLinks = bigFooter.querySelectorAll(BUTTON);
  primaryLinks.forEach(currentElement => {
    const currentElementClasses = currentElement.getAttribute("class");
    const preservedHtmlTag = currentElement.getAttribute("data-tag") || currentElement.tagName;
    const newElementType = isMobile ? "button" : preservedHtmlTag;

    // Create the new element
    const newElement = document.createElement(newElementType);
    newElement.setAttribute("class", currentElementClasses);
    newElement.classList.toggle(`${PREFIX}-footer__primary-link--button`, isMobile);
    newElement.textContent = currentElement.textContent;
    if (isMobile) {
      newElement.setAttribute("data-tag", currentElement.tagName);
      const menuId = `${PREFIX}-footer-menu-list-${Math.floor(Math.random() * 100000)}`;
      newElement.setAttribute("aria-controls", menuId);
      newElement.setAttribute("aria-expanded", "false");
      currentElement.nextElementSibling.setAttribute("id", menuId);
      newElement.setAttribute("type", "button");
    }

    // Insert the new element and delete the old
    currentElement.after(newElement);
    currentElement.remove();
  });
}
const resize = event => {
  toggleHtmlTag(event.matches);
};
module.exports = behavior({
  [CLICK]: {
    [BUTTON]: showPanel
  }
}, {
  // export for use elsewhere
  HIDE_MAX_WIDTH,
  init() {
    toggleHtmlTag(window.innerWidth < HIDE_MAX_WIDTH);
    this.mediaQueryList = window.matchMedia(`(max-width: ${HIDE_MAX_WIDTH - 0.1}px)`);
    this.mediaQueryList.addListener(resize);
  },
  teardown() {
    this.mediaQueryList.removeListener(resize);
  }
});

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46}],24:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const FocusTrap = require("../../uswds-core/src/js/utils/focus-trap");
const accordion = require("../../usa-accordion/src/index");
const ScrollBarWidth = require("../../uswds-core/src/js/utils/scrollbar-width");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const BODY = "body";
const HEADER = `.${PREFIX}-header`;
const NAV = `.${PREFIX}-nav`;
const NAV_CONTAINER = `.${PREFIX}-nav-container`;
const NAV_PRIMARY = `.${PREFIX}-nav__primary`;
const NAV_PRIMARY_ITEM = `.${PREFIX}-nav__primary-item`;
const NAV_CONTROL = `button.${PREFIX}-nav__link`;
const NAV_LINKS = `${NAV} a`;
const NON_NAV_HIDDEN_ATTRIBUTE = `data-nav-hidden`;
const OPENERS = `.${PREFIX}-menu-btn`;
const CLOSE_BUTTON = `.${PREFIX}-nav__close`;
const OVERLAY = `.${PREFIX}-overlay`;
const CLOSERS = `${CLOSE_BUTTON}, .${PREFIX}-overlay`;
const TOGGLES = [NAV, OVERLAY].join(", ");
const NON_NAV_ELEMENTS = `body *:not(${HEADER}, ${NAV_CONTAINER}, ${NAV}, ${NAV} *):not([aria-hidden])`;
const NON_NAV_HIDDEN = `[${NON_NAV_HIDDEN_ATTRIBUTE}]`;
const ACTIVE_CLASS = "usa-js-mobile-nav--active";
const VISIBLE_CLASS = "is-visible";
let navigation;
let navActive;
let nonNavElements;
const isActive = () => document.body.classList.contains(ACTIVE_CLASS);
// Detect Safari
// Note: Chrome also reports the Safari userAgent so this specifically excludes Chrome.
const isSafari = navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome");
const SCROLLBAR_WIDTH = ScrollBarWidth();
const INITIAL_PADDING = window.getComputedStyle(document.body).getPropertyValue("padding-right");
const TEMPORARY_PADDING = `${parseInt(INITIAL_PADDING.replace(/px/, ""), 10) + parseInt(SCROLLBAR_WIDTH.replace(/px/, ""), 10)}px`;
const hideNonNavItems = () => {
  const headerParent = document.querySelector(`${HEADER}`).parentNode;
  nonNavElements = document.querySelectorAll(NON_NAV_ELEMENTS);
  nonNavElements.forEach(nonNavElement => {
    if (nonNavElement !== headerParent) {
      nonNavElement.setAttribute("aria-hidden", true);
      nonNavElement.setAttribute(NON_NAV_HIDDEN_ATTRIBUTE, "");
    }
  });
};
const showNonNavItems = () => {
  nonNavElements = document.querySelectorAll(NON_NAV_HIDDEN);
  if (!nonNavElements) {
    return;
  }

  // Remove aria-hidden from non-header elements
  nonNavElements.forEach(nonNavElement => {
    nonNavElement.removeAttribute("aria-hidden");
    nonNavElement.removeAttribute(NON_NAV_HIDDEN_ATTRIBUTE);
  });
};

// Toggle all non-header elements #3527.
const toggleNonNavItems = active => {
  if (active) {
    hideNonNavItems();
  } else {
    showNonNavItems();
  }
};

/**
 * Detect Safari and add body class for a Safari-only CSS bug fix.
 * More details in https://github.com/uswds/uswds/pull/5443
 */
const addSafariClass = () => {
  if (isSafari) {
    document.body.classList.add("is-safari");
  }
};

/**
 * Set the value for the --scrolltop CSS var when the mobile menu is open.
 * This allows the CSS to lock the current scroll position in Safari
 * when overflow-y is set to scroll.
 * More details in https://github.com/uswds/uswds/pull/5443
 */
const setSafariScrollPosition = body => {
  const currentScrollPosition = `-${window.scrollY}px`;
  if (isSafari) {
    body.style.setProperty("--scrolltop", currentScrollPosition);
  }
};
const toggleNav = active => {
  const {
    body
  } = document;
  const safeActive = typeof active === "boolean" ? active : !isActive();
  setSafariScrollPosition(body);
  body.classList.toggle(ACTIVE_CLASS, safeActive);
  select(TOGGLES).forEach(el => el.classList.toggle(VISIBLE_CLASS, safeActive));
  navigation.focusTrap.update(safeActive);
  const closeButton = body.querySelector(CLOSE_BUTTON);
  const menuButton = document.querySelector(OPENERS);
  body.style.paddingRight = body.style.paddingRight === TEMPORARY_PADDING ? INITIAL_PADDING : TEMPORARY_PADDING;
  toggleNonNavItems(safeActive);
  if (safeActive && closeButton) {
    // The mobile nav was just activated. Focus on the close button, which is
    // just before all the nav elements in the tab order.
    closeButton.focus();
  } else if (!safeActive && menuButton && getComputedStyle(menuButton).display !== "none") {
    // The mobile nav was just deactivated. We don't want the focus to
    // disappear into the void, so focus on the menu button if it's
    // visible (this may have been what the user was just focused on,
    // if they triggered the mobile nav by mistake).
    menuButton.focus();
  }
  return safeActive;
};
const resize = () => {
  const closer = document.body.querySelector(CLOSE_BUTTON);
  if (isActive() && closer && closer.getBoundingClientRect().width === 0) {
    // When the mobile nav is active, and the close box isn't visible,
    // we know the user's viewport has been resized to be larger.
    // Let's make the page state consistent by deactivating the mobile nav.
    navigation.toggleNav.call(closer, false);
  }
};
const onMenuClose = () => navigation.toggleNav.call(navigation, false);
const hideActiveNavDropdown = () => {
  if (!navActive) {
    return;
  }
  toggle(navActive, false);
  navActive = null;
};
const focusNavButton = event => {
  const parentNavItem = event.target.closest(NAV_PRIMARY_ITEM);

  // Only shift focus if within dropdown
  if (!event.target.matches(NAV_CONTROL)) {
    const navControl = parentNavItem.querySelector(NAV_CONTROL);
    if (navControl) {
      navControl.focus();
    }
  }
};
const handleEscape = event => {
  hideActiveNavDropdown();
  focusNavButton(event);
};
navigation = behavior({
  [CLICK]: {
    [NAV_CONTROL]() {
      // If another nav is open, close it
      if (navActive !== this) {
        hideActiveNavDropdown();
      }
      // store a reference to the last clicked nav link element, so we
      // can hide the dropdown if another element on the page is clicked
      if (!navActive) {
        navActive = this;
        toggle(navActive, true);
      }

      // Do this so the event handler on the body doesn't fire
      return false;
    },
    [BODY]: hideActiveNavDropdown,
    [OPENERS]: toggleNav,
    [CLOSERS]: toggleNav,
    [NAV_LINKS]() {
      // A navigation link has been clicked! We want to collapse any
      // hierarchical navigation UI it's a part of, so that the user
      // can focus on whatever they've just selected.

      // Some navigation links are inside accordions; when they're
      // clicked, we want to collapse those accordions.
      const acc = this.closest(accordion.ACCORDION);
      if (acc) {
        accordion.getButtons(acc).forEach(btn => accordion.hide(btn));
      }

      // If the mobile navigation menu is active, we want to hide it.
      if (isActive()) {
        navigation.toggleNav.call(navigation, false);
      }
    }
  },
  keydown: {
    [NAV_PRIMARY]: keymap({
      Escape: handleEscape
    })
  },
  focusout: {
    [NAV_PRIMARY](event) {
      const nav = event.target.closest(NAV_PRIMARY);
      if (!nav.contains(event.relatedTarget)) {
        hideActiveNavDropdown();
      }
    }
  }
}, {
  init(root) {
    const trapContainer = root.matches(NAV) ? root : root.querySelector(NAV);
    if (trapContainer) {
      navigation.focusTrap = FocusTrap(trapContainer, {
        Escape: onMenuClose
      });
    }
    addSafariClass();
    resize();
    window.addEventListener("resize", resize, false);
  },
  teardown() {
    window.removeEventListener("resize", resize, false);
    navActive = false;
  },
  focusTrap: null,
  toggleNav
});
module.exports = navigation;

},{"../../usa-accordion/src/index":15,"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/focus-trap":48,"../../uswds-core/src/js/utils/scrollbar-width":52,"../../uswds-core/src/js/utils/select":54,"../../uswds-core/src/js/utils/toggle":57,"receptor/keymap":11}],25:[function(require,module,exports){
"use strict";

const once = require("receptor/once");
const keymap = require("receptor/keymap");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const CURRENT_CLASS = `${PREFIX}-current`;
const IN_PAGE_NAV_TITLE_TEXT = "On this page";
const IN_PAGE_NAV_TITLE_HEADING_LEVEL = "h4";
const IN_PAGE_NAV_SCROLL_OFFSET = 0;
const IN_PAGE_NAV_ROOT_MARGIN = "0px 0px 0px 0px";
const IN_PAGE_NAV_THRESHOLD = "1";
const IN_PAGE_NAV_CLASS = `${PREFIX}-in-page-nav`;
const IN_PAGE_NAV_ANCHOR_CLASS = `${PREFIX}-anchor`;
const IN_PAGE_NAV_NAV_CLASS = `${IN_PAGE_NAV_CLASS}__nav`;
const IN_PAGE_NAV_LIST_CLASS = `${IN_PAGE_NAV_CLASS}__list`;
const IN_PAGE_NAV_ITEM_CLASS = `${IN_PAGE_NAV_CLASS}__item`;
const IN_PAGE_NAV_LINK_CLASS = `${IN_PAGE_NAV_CLASS}__link`;
const IN_PAGE_NAV_TITLE_CLASS = `${IN_PAGE_NAV_CLASS}__heading`;
const SUB_ITEM_CLASS = `${IN_PAGE_NAV_ITEM_CLASS}--sub-item`;
const MAIN_ELEMENT = "main";

/**
 * Set the active link state for the currently observed section
 *
 * @param {HTMLElement} el An element within the in-page nav component
 */
const setActive = el => {
  const allLinks = document.querySelectorAll(`.${IN_PAGE_NAV_LINK_CLASS}`);
  el.map(i => {
    if (i.isIntersecting === true && i.intersectionRatio >= 1) {
      allLinks.forEach(link => link.classList.remove(CURRENT_CLASS));
      document.querySelector(`a[href="#${i.target.id}"]`).classList.add(CURRENT_CLASS);
      return true;
    }
    return false;
  });
};

/**
 * Return an array of all visible h2 and h3 headings from the designated main content region.
 * These will be added to the component link list.
 *
 * @param {HTMLElement} mainContentSelector The designated main content region
 *
 * @return {Array} - An array of visible headings from the designated content region
 */
const getSectionHeadings = mainContentSelector => {
  const sectionHeadings = document.querySelectorAll(`${mainContentSelector} h2, ${mainContentSelector} h3`);

  // Convert nodeList to an array to allow for filtering
  const headingArray = Array.from(sectionHeadings);

  // Find all headings with hidden styling and remove them from the array
  const visibleHeadingArray = headingArray.filter(heading => {
    const headingStyle = window.getComputedStyle(heading);
    const visibleHeading = headingStyle.getPropertyValue("display") !== "none" && headingStyle.getPropertyValue("visibility") !== "hidden";
    return visibleHeading;
  });
  return visibleHeadingArray;
};

/**
 * Return a node list of section anchor tags
 *
 * @return {HTMLElement[]} - An array of DOM nodes
 */
const getSectionAnchors = () => {
  const sectionAnchors = document.querySelectorAll(`.${IN_PAGE_NAV_ANCHOR_CLASS}`);
  return sectionAnchors;
};

/**
 * Generates a unique ID for the given heading element.
 *
 * @param {HTMLHeadingElement} heading
 *
 * @return {string} - Unique ID
 */
const getHeadingId = heading => {
  const baseId = heading.textContent.toLowerCase()
  // Replace non-alphanumeric characters with dashes
  .replace(/[^a-z\d]/g, "-")
  // Replace a sequence of two or more dashes with a single dash
  .replace(/-{2,}/g, "-")
  // Trim leading or trailing dash (there should only ever be one)
  .replace(/^-|-$/g, "");
  let id;
  let suffix = 0;
  do {
    id = baseId;

    // To avoid conflicts with existing IDs on the page, loop and append an
    // incremented suffix until a unique ID is found.
    suffix += 1;
    if (suffix > 1) {
      id += `-${suffix}`;
    }
  } while (document.getElementById(id));
  return id;
};

/**
 * Return a section id/anchor hash without the number sign
 *
 * @return {String} - Id value with the number sign removed
 */
const getSectionId = value => {
  let id;

  // Check if value is an event or element and get the cleaned up id
  if (value && value.nodeType === 1) {
    id = value.getAttribute("href").replace("#", "");
  } else {
    id = value.target.hash.replace("#", "");
  }
  return id;
};

/**
 * Scroll smoothly to a section based on the passed in element
 *
 * @param {HTMLElement} - Id value with the number sign removed
 */
const handleScrollToSection = el => {
  const inPageNavEl = document.querySelector(`.${IN_PAGE_NAV_CLASS}`);
  const inPageNavScrollOffset = inPageNavEl.dataset.scrollOffset || IN_PAGE_NAV_SCROLL_OFFSET;
  window.scroll({
    behavior: "smooth",
    top: el.offsetTop - inPageNavScrollOffset,
    block: "start"
  });
  if (window.location.hash.slice(1) !== el.id) {
    window.history.pushState(null, "", `#${el.id}`);
  }
};

/**
 * Scrolls the page to the section corresponding to the current hash fragment, if one exists.
 */
const scrollToCurrentSection = () => {
  const hashFragment = window.location.hash.slice(1);
  if (hashFragment) {
    const anchorTag = document.getElementById(hashFragment);
    if (anchorTag) {
      handleScrollToSection(anchorTag);
    }
  }
};

/**
 * Create the in-page navigation component
 *
 * @param {HTMLElement} inPageNavEl The in-page nav element
 */
const createInPageNav = inPageNavEl => {
  const inPageNavTitleText = Sanitizer.escapeHTML`${inPageNavEl.dataset.titleText || IN_PAGE_NAV_TITLE_TEXT}`;
  const inPageNavTitleHeadingLevel = Sanitizer.escapeHTML`${inPageNavEl.dataset.titleHeadingLevel || IN_PAGE_NAV_TITLE_HEADING_LEVEL}`;
  const inPageNavRootMargin = Sanitizer.escapeHTML`${inPageNavEl.dataset.rootMargin || IN_PAGE_NAV_ROOT_MARGIN}`;
  const inPageNavThreshold = Sanitizer.escapeHTML`${inPageNavEl.dataset.threshold || IN_PAGE_NAV_THRESHOLD}`;
  const inPageNavContentSelector = Sanitizer.escapeHTML`${inPageNavEl.dataset.mainContentSelector || MAIN_ELEMENT}`;
  const options = {
    root: null,
    rootMargin: inPageNavRootMargin,
    threshold: [inPageNavThreshold]
  };
  const sectionHeadings = getSectionHeadings(inPageNavContentSelector);
  const inPageNav = document.createElement("nav");
  inPageNav.setAttribute("aria-label", inPageNavTitleText);
  inPageNav.classList.add(IN_PAGE_NAV_NAV_CLASS);
  const inPageNavTitle = document.createElement(inPageNavTitleHeadingLevel);
  inPageNavTitle.classList.add(IN_PAGE_NAV_TITLE_CLASS);
  inPageNavTitle.setAttribute("tabindex", "0");
  inPageNavTitle.textContent = inPageNavTitleText;
  inPageNav.appendChild(inPageNavTitle);
  const inPageNavList = document.createElement("ul");
  inPageNavList.classList.add(IN_PAGE_NAV_LIST_CLASS);
  inPageNav.appendChild(inPageNavList);
  sectionHeadings.forEach(el => {
    const listItem = document.createElement("li");
    const navLinks = document.createElement("a");
    const anchorTag = document.createElement("a");
    const textContentOfLink = el.textContent;
    const tag = el.tagName.toLowerCase();
    listItem.classList.add(IN_PAGE_NAV_ITEM_CLASS);
    if (tag === "h3") {
      listItem.classList.add(SUB_ITEM_CLASS);
    }
    const headingId = getHeadingId(el);
    navLinks.setAttribute("href", `#${headingId}`);
    navLinks.setAttribute("class", IN_PAGE_NAV_LINK_CLASS);
    navLinks.textContent = textContentOfLink;
    anchorTag.setAttribute("id", headingId);
    anchorTag.setAttribute("class", IN_PAGE_NAV_ANCHOR_CLASS);
    el.insertAdjacentElement("afterbegin", anchorTag);
    inPageNavList.appendChild(listItem);
    listItem.appendChild(navLinks);
  });
  inPageNavEl.appendChild(inPageNav);
  const anchorTags = getSectionAnchors();
  const observeSections = new window.IntersectionObserver(setActive, options);
  anchorTags.forEach(tag => {
    observeSections.observe(tag);
  });
};

/**
 * Handle click from link
 *
 * @param {HTMLElement} el An element within the in-page nav component
 */
const handleClickFromLink = el => {
  const elementToScrollTo = document.getElementById(el.hash.slice(1));
  handleScrollToSection(elementToScrollTo);
};

/**
 * Handle the enter event from a link within the in-page nav component
 *
 * @param {KeyboardEvent} event An event within the in-page nav component
 */
const handleEnterFromLink = event => {
  const id = getSectionId(event);
  const targetAnchor = document.getElementById(id);
  const target = targetAnchor.parentElement;
  if (target) {
    target.setAttribute("tabindex", 0);
    target.focus();
    target.addEventListener("blur", once(() => {
      target.setAttribute("tabindex", -1);
    }));
  } else {
    // throw an error?
  }
  handleScrollToSection(targetAnchor);
};
const inPageNavigation = behavior({
  [CLICK]: {
    [`.${IN_PAGE_NAV_LINK_CLASS}`](event) {
      event.preventDefault();
      if (this.disabled) return;
      handleClickFromLink(this);
    }
  },
  keydown: {
    [`.${IN_PAGE_NAV_LINK_CLASS}`]: keymap({
      Enter: handleEnterFromLink
    })
  }
}, {
  init(root) {
    selectOrMatches(`.${IN_PAGE_NAV_CLASS}`, root).forEach(inPageNavEl => {
      createInPageNav(inPageNavEl);
      scrollToCurrentSection();
    });
  }
});
module.exports = inPageNavigation;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/sanitizer":51,"../../uswds-core/src/js/utils/select-or-matches":53,"receptor/keymap":11,"receptor/once":12}],26:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const MASKED_CLASS = `${PREFIX}-masked`;
const MASKED = `.${MASKED_CLASS}`;
const MASK = `${PREFIX}-input-mask`;
const MASK_CONTENT = `${MASK}--content`;
const PLACEHOLDER = "placeholder";
const CONTEXT = "form";

// User defined Values
const maskedNumber = "_#dDmMyY9";
const maskedLetter = "A";

// replaces each masked input with a shell containing the input and it's mask.
const createMaskedInputShell = input => {
  const placeholder = input.getAttribute(`${PLACEHOLDER}`);
  if (placeholder) {
    input.setAttribute("maxlength", placeholder.length);
    input.setAttribute("data-placeholder", placeholder);
    input.removeAttribute(`${PLACEHOLDER}`);
  } else {
    return;
  }
  const shell = document.createElement("span");
  shell.classList.add(MASK);
  shell.setAttribute("data-mask", placeholder);
  const content = document.createElement("span");
  content.classList.add(MASK_CONTENT);
  content.setAttribute("aria-hidden", "true");
  content.id = `${input.id}Mask`;
  content.textContent = placeholder;
  shell.appendChild(content);
  input.closest(CONTEXT).insertBefore(shell, input);
  shell.appendChild(input);
};
const setValueOfMask = el => {
  const {
    value
  } = el;
  const placeholderVal = `${el.dataset.placeholder.substr(value.length)}`;
  const theIEl = document.createElement("i");
  theIEl.textContent = value;
  return [theIEl, placeholderVal];
};
const strippedValue = (isCharsetPresent, value) => isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");
const isInteger = value => !Number.isNaN(parseInt(value, 10));
const isLetter = value => value ? value.match(/[A-Z]/i) : false;
const handleCurrentValue = el => {
  const isCharsetPresent = el.dataset.charset;
  const placeholder = isCharsetPresent || el.dataset.placeholder;
  const {
    value
  } = el;
  const len = placeholder.length;
  let newValue = "";
  let i;
  let charIndex;
  const strippedVal = strippedValue(isCharsetPresent, value);
  for (i = 0, charIndex = 0; i < len; i += 1) {
    const isInt = isInteger(strippedVal[charIndex]);
    const isLet = isLetter(strippedVal[charIndex]);
    const matchesNumber = maskedNumber.indexOf(placeholder[i]) >= 0;
    const matchesLetter = maskedLetter.indexOf(placeholder[i]) >= 0;
    if (matchesNumber && isInt || isCharsetPresent && matchesLetter && isLet) {
      newValue += strippedVal[charIndex];
      charIndex += 1;
    } else if (!isCharsetPresent && !isInt && matchesNumber || isCharsetPresent && (matchesLetter && !isLet || matchesNumber && !isInt)) {
      return newValue;
    } else {
      newValue += placeholder[i];
    }
    // break if no characters left and the pattern is non-special character
    if (strippedVal[charIndex] === undefined) {
      break;
    }
  }
  return newValue;
};
const handleValueChange = el => {
  const inputEl = el;
  const id = inputEl.getAttribute("id");
  inputEl.value = handleCurrentValue(inputEl);
  const maskVal = setValueOfMask(el);
  const maskEl = document.getElementById(`${id}Mask`);
  maskEl.textContent = "";
  maskEl.replaceChildren(maskVal[0], maskVal[1]);
};
const inputMaskEvents = {
  keyup: {
    [MASKED]() {
      handleValueChange(this);
    }
  }
};
const inputMask = behavior(inputMaskEvents, {
  init(root) {
    selectOrMatches(MASKED, root).forEach(maskedInput => {
      createMaskedInputShell(maskedInput);
    });
  }
});
module.exports = inputMask;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select-or-matches":53}],27:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const FocusTrap = require("../../uswds-core/src/js/utils/focus-trap");
const accordion = require("../../usa-accordion/src/index");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const BODY = "body";
const LANGUAGE = `.${PREFIX}-language`;
const LANGUAGE_SUB = `.${PREFIX}-language__submenu`;
const LANGUAGE_PRIMARY = `.${PREFIX}-language__primary`;
const LANGUAGE_PRIMARY_ITEM = `.${PREFIX}-language__primary-item`;
const LANGUAGE_CONTROL = `button.${PREFIX}-language__link`;
const LANGUAGE_LINKS = `${LANGUAGE} a`;
let languageSelector;
let languageActive;
const onLanguageClose = () => languageSelector.toggleLanguage.call(languageSelector, false);
const hideActiveLanguageDropdown = () => {
  if (!languageActive) {
    return;
  }
  toggle(languageActive, false);
  languageActive = null;
};
const focusLanguageButton = event => {
  const parentLanguageItem = event.target.closest(LANGUAGE_PRIMARY_ITEM);
  if (!event.target.matches(LANGUAGE_CONTROL)) {
    parentLanguageItem.querySelector(LANGUAGE_CONTROL).focus();
  }
};
const handleEscape = event => {
  hideActiveLanguageDropdown();
  focusLanguageButton(event);
};
languageSelector = behavior({
  [CLICK]: {
    [LANGUAGE_CONTROL]() {
      if (languageActive !== this) {
        hideActiveLanguageDropdown();
      }
      if (languageActive === this) {
        hideActiveLanguageDropdown();
        return false;
      }
      if (!languageActive) {
        languageActive = this;
        toggle(languageActive, true);
      }
      return false;
    },
    [BODY]: hideActiveLanguageDropdown,
    [LANGUAGE_LINKS]() {
      const acc = this.closest(accordion.ACCORDION);
      if (acc) {
        accordion.getButtons(acc).forEach(btn => accordion.hide(btn));
      }
    }
  },
  keydown: {
    [LANGUAGE_PRIMARY]: keymap({
      Escape: handleEscape
    })
  },
  focusout: {
    [LANGUAGE_PRIMARY](event) {
      const language = event.target.closest(LANGUAGE_PRIMARY);
      if (!language.contains(event.relatedTarget)) {
        hideActiveLanguageDropdown();
      }
    }
  }
}, {
  init(root) {
    const trapContainer = root.matches(LANGUAGE_SUB) ? root : root.querySelector(LANGUAGE_SUB);
    if (trapContainer) {
      languageSelector.focusTrap = FocusTrap(trapContainer, {
        Escape: onLanguageClose
      });
    }
  },
  teardown() {
    languageActive = false;
  },
  focusTrap: null
});
module.exports = languageSelector;

},{"../../usa-accordion/src/index":15,"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/focus-trap":48,"../../uswds-core/src/js/utils/toggle":57,"receptor/keymap":11}],28:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const FocusTrap = require("../../uswds-core/src/js/utils/focus-trap");
const ScrollBarWidth = require("../../uswds-core/src/js/utils/scrollbar-width");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const MODAL_CLASSNAME = `${PREFIX}-modal`;
const OVERLAY_CLASSNAME = `${MODAL_CLASSNAME}-overlay`;
const WRAPPER_CLASSNAME = `${MODAL_CLASSNAME}-wrapper`;
const OPENER_ATTRIBUTE = "data-open-modal";
const CLOSER_ATTRIBUTE = "data-close-modal";
const FORCE_ACTION_ATTRIBUTE = "data-force-action";
const NON_MODAL_HIDDEN_ATTRIBUTE = `data-modal-hidden`;
const MODAL = `.${MODAL_CLASSNAME}`;
const INITIAL_FOCUS = `.${WRAPPER_CLASSNAME} *[data-focus]`;
const CLOSE_BUTTON = `${WRAPPER_CLASSNAME} *[${CLOSER_ATTRIBUTE}]`;
const OPENERS = `*[${OPENER_ATTRIBUTE}][aria-controls]`;
const CLOSERS = `${CLOSE_BUTTON}, .${OVERLAY_CLASSNAME}:not([${FORCE_ACTION_ATTRIBUTE}])`;
const NON_MODALS = `body > *:not(.${WRAPPER_CLASSNAME}):not([aria-hidden])`;
const NON_MODALS_HIDDEN = `[${NON_MODAL_HIDDEN_ATTRIBUTE}]`;
const ACTIVE_CLASS = "usa-js-modal--active";
const PREVENT_CLICK_CLASS = "usa-js-no-click";
const VISIBLE_CLASS = "is-visible";
const HIDDEN_CLASS = "is-hidden";
let modal;
let INITIAL_BODY_PADDING;
let TEMPORARY_BODY_PADDING;
const isActive = () => document.body.classList.contains(ACTIVE_CLASS);
const SCROLLBAR_WIDTH = ScrollBarWidth();

/**
 *  Closes modal when bound to a button and pressed.
 */
const onMenuClose = () => {
  modal.toggleModal.call(modal, false);
};

/**
 * Set the value for temporary body padding that will be applied when the modal is open.
 * Value is created by checking for initial body padding and adding the width of the scrollbar.
 */
const setTemporaryBodyPadding = () => {
  INITIAL_BODY_PADDING = window.getComputedStyle(document.body).getPropertyValue("padding-right");
  TEMPORARY_BODY_PADDING = `${parseInt(INITIAL_BODY_PADDING.replace(/px/, ""), 10) + parseInt(SCROLLBAR_WIDTH.replace(/px/, ""), 10)}px`;
};

/**
 *  Toggle the visibility of a modal window
 *
 * @param {KeyboardEvent} event the keydown event.
 * @returns {boolean} safeActive if mobile is open.
 */
function toggleModal(event) {
  let originalOpener;
  let clickedElement = event.target;
  const {
    body
  } = document;
  const safeActive = !isActive();
  const modalId = clickedElement ? clickedElement.getAttribute("aria-controls") : document.querySelector(".usa-modal-wrapper.is-visible");
  const targetModal = safeActive ? document.getElementById(modalId) : document.querySelector(".usa-modal-wrapper.is-visible");

  // if there is no modal we return early
  if (!targetModal) {
    return false;
  }
  const openFocusEl = targetModal.querySelector(INITIAL_FOCUS) ? targetModal.querySelector(INITIAL_FOCUS) : targetModal.querySelector(".usa-modal");
  const returnFocus = document.getElementById(targetModal.getAttribute("data-opener"));
  const menuButton = body.querySelector(OPENERS);
  const forceUserAction = targetModal.getAttribute(FORCE_ACTION_ATTRIBUTE);

  // Sets the clicked element to the close button
  // so esc key always closes modal
  if (event.type === "keydown" && targetModal !== null) {
    clickedElement = targetModal.querySelector(CLOSE_BUTTON);
  }

  // When we're not hitting the escape key…
  if (clickedElement) {
    // Make sure we click the opener
    // If it doesn't have an ID, make one
    // Store id as data attribute on modal
    if (clickedElement.hasAttribute(OPENER_ATTRIBUTE)) {
      if (this.getAttribute("id") === null) {
        originalOpener = `modal-${Math.floor(Math.random() * 900000) + 100000}`;
        this.setAttribute("id", originalOpener);
      } else {
        originalOpener = this.getAttribute("id");
      }
      targetModal.setAttribute("data-opener", originalOpener);
    }

    // This basically stops the propagation if the element
    // is inside the modal and not a close button or
    // element inside a close button
    if (clickedElement.closest(`.${MODAL_CLASSNAME}`)) {
      if (clickedElement.hasAttribute(CLOSER_ATTRIBUTE) || clickedElement.closest(`[${CLOSER_ATTRIBUTE}]`)) {
        // do nothing. move on.
      } else {
        return false;
      }
    }
  }
  body.classList.toggle(ACTIVE_CLASS, safeActive);
  targetModal.classList.toggle(VISIBLE_CLASS, safeActive);
  targetModal.classList.toggle(HIDDEN_CLASS, !safeActive);

  // If user is forced to take an action, adding
  // a class to the body that prevents clicking underneath
  // overlay
  if (forceUserAction) {
    body.classList.toggle(PREVENT_CLICK_CLASS, safeActive);
  }

  // Temporarily increase body padding to include the width of the scrollbar.
  // This accounts for the content shift when the scrollbar is removed on modal open.
  if (body.style.paddingRight === TEMPORARY_BODY_PADDING) {
    body.style.removeProperty("padding-right");
  } else {
    body.style.paddingRight = TEMPORARY_BODY_PADDING;
  }

  // Handle the focus actions
  if (safeActive && openFocusEl) {
    // The modal window is opened. Focus is set to close button.

    // Binds escape key if we're not forcing
    // the user to take an action
    if (forceUserAction) {
      modal.focusTrap = FocusTrap(targetModal);
    } else {
      modal.focusTrap = FocusTrap(targetModal, {
        Escape: onMenuClose
      });
    }

    // Handles focus setting and interactions
    modal.focusTrap.update(safeActive);
    openFocusEl.focus();

    // Hides everything that is not the modal from screen readers
    document.querySelectorAll(NON_MODALS).forEach(nonModal => {
      nonModal.setAttribute("aria-hidden", "true");
      nonModal.setAttribute(NON_MODAL_HIDDEN_ATTRIBUTE, "");
    });
  } else if (!safeActive && menuButton && returnFocus) {
    // The modal window is closed.
    // Non-modals now accesible to screen reader
    document.querySelectorAll(NON_MODALS_HIDDEN).forEach(nonModal => {
      nonModal.removeAttribute("aria-hidden");
      nonModal.removeAttribute(NON_MODAL_HIDDEN_ATTRIBUTE);
    });

    // Focus is returned to the opener
    returnFocus.focus();
    modal.focusTrap.update(safeActive);
  }
  return safeActive;
}

/**
 * Creates a placeholder with data attributes for cleanup function.
 * The cleanup function uses this placeholder to easily restore the original Modal HTML on teardown.
 *
 * @param {HTMLDivElement} baseComponent - Modal HTML from the DOM.
 * @returns {HTMLDivElement} Placeholder used for cleanup function.
 */
const createPlaceHolder = baseComponent => {
  const modalID = baseComponent.getAttribute("id");
  const originalLocationPlaceHolder = document.createElement("div");
  const modalAttributes = Array.from(baseComponent.attributes);
  setTemporaryBodyPadding();
  originalLocationPlaceHolder.setAttribute(`data-placeholder-for`, modalID);
  originalLocationPlaceHolder.style.display = "none";
  originalLocationPlaceHolder.setAttribute("aria-hidden", "true");
  modalAttributes.forEach(attribute => {
    originalLocationPlaceHolder.setAttribute(`data-original-${attribute.name}`, attribute.value);
  });
  return originalLocationPlaceHolder;
};

/**
 * Moves necessary attributes from Modal HTML to wrapper element.
 *
 * @param {HTMLDivElement} baseComponent - Modal HTML in the DOM.
 * @param {HTMLDivElement} modalContentWrapper - Modal component wrapper element.
 * @returns Modal wrapper with correct attributes.
 */
const setModalAttributes = (baseComponent, modalContentWrapper) => {
  const modalID = baseComponent.getAttribute("id");
  const ariaLabelledBy = baseComponent.getAttribute("aria-labelledby");
  const ariaDescribedBy = baseComponent.getAttribute("aria-describedby");
  const forceUserAction = baseComponent.hasAttribute(FORCE_ACTION_ATTRIBUTE);
  if (!ariaLabelledBy) throw new Error(`${modalID} is missing aria-labelledby attribute`);
  if (!ariaDescribedBy) throw new Error(`${modalID} is missing aria-desribedby attribute`);

  // Set attributes
  modalContentWrapper.setAttribute("role", "dialog");
  modalContentWrapper.setAttribute("id", modalID);
  modalContentWrapper.setAttribute("aria-labelledby", ariaLabelledBy);
  modalContentWrapper.setAttribute("aria-describedby", ariaDescribedBy);
  if (forceUserAction) {
    modalContentWrapper.setAttribute(FORCE_ACTION_ATTRIBUTE, forceUserAction);
  }

  // Add aria-controls
  const modalClosers = modalContentWrapper.querySelectorAll(CLOSERS);
  modalClosers.forEach(el => {
    el.setAttribute("aria-controls", modalID);
  });

  // Update the base element HTML
  baseComponent.removeAttribute("id");
  baseComponent.removeAttribute("aria-labelledby");
  baseComponent.removeAttribute("aria-describedby");
  baseComponent.setAttribute("tabindex", "-1");
  return modalContentWrapper;
};

/**
 * Creates a hidden modal content wrapper.
 * Rebuilds the original Modal HTML in the new wrapper and adds a page overlay.
 * Then moves original Modal HTML attributes to the new wrapper.
 *
 * @param {HTMLDivElement} baseComponent - Original Modal HTML in the DOM.
 * @returns Modal component - Modal wrapper w/ nested Overlay and Modal Content.
 */
const rebuildModal = baseComponent => {
  const modalContent = baseComponent;
  const modalContentWrapper = document.createElement("div");
  const overlayDiv = document.createElement("div");

  // Add classes
  modalContentWrapper.classList.add(HIDDEN_CLASS, WRAPPER_CLASSNAME);
  overlayDiv.classList.add(OVERLAY_CLASSNAME);

  // Rebuild the modal element
  modalContentWrapper.append(overlayDiv);
  overlayDiv.append(modalContent);

  // Add attributes
  setModalAttributes(modalContent, modalContentWrapper);
  return modalContentWrapper;
};

/**
 *  Builds modal window from base HTML and appends to the end of the DOM.
 *
 * @param {HTMLDivElement} baseComponent - The modal div element in the DOM.
 */
const setUpModal = baseComponent => {
  const modalID = baseComponent.getAttribute("id");
  if (!modalID) {
    throw new Error(`Modal markup is missing ID`);
  }

  // Create placeholder where modal is for cleanup
  const originalLocationPlaceHolder = createPlaceHolder(baseComponent);
  baseComponent.after(originalLocationPlaceHolder);

  // Build modal component
  const modalComponent = rebuildModal(baseComponent);

  // Move all modals to the end of the DOM. Doing this allows us to
  // more easily find the elements to hide from screen readers
  // when the modal is open.
  document.body.appendChild(modalComponent);
};

/**
 * Removes dynamically created Modal and Wrapper elements and restores original Modal HTML.
 *
 * @param {HTMLDivElement} baseComponent - The modal div element in the DOM.
 */
const cleanUpModal = baseComponent => {
  const modalContent = baseComponent;
  const modalContentWrapper = modalContent.parentElement.parentElement;
  const modalID = modalContentWrapper.getAttribute("id");

  // if there is no modalID, return early
  if (!modalID) {
    return;
  }
  const originalLocationPlaceHolder = document.querySelector(`[data-placeholder-for="${modalID}"]`);
  if (originalLocationPlaceHolder) {
    const modalAttributes = Array.from(originalLocationPlaceHolder.attributes);
    modalAttributes.forEach(attribute => {
      if (attribute.name.startsWith("data-original-")) {
        // data-original- is 14 long
        modalContent.setAttribute(attribute.name.substr(14), attribute.value);
      }
    });
    originalLocationPlaceHolder.after(modalContent);
    originalLocationPlaceHolder.parentElement.removeChild(originalLocationPlaceHolder);
  }
  modalContentWrapper.parentElement.removeChild(modalContentWrapper);
};
modal = behavior({}, {
  init(root) {
    selectOrMatches(MODAL, root).forEach(modalWindow => {
      const modalId = modalWindow.id;
      setUpModal(modalWindow);

      // Query all openers and closers including the overlay
      selectOrMatches(`[aria-controls="${modalId}"]`, document).forEach(modalTrigger => {
        // If modalTrigger is an anchor...
        if (modalTrigger.nodeName === "A") {
          // Turn anchor links into buttons for screen readers
          modalTrigger.setAttribute("role", "button");

          // Prevent modal triggers from acting like links
          modalTrigger.addEventListener("click", e => e.preventDefault());
        }

        // Can uncomment when aria-haspopup="dialog" is supported
        // https://a11ysupport.io/tech/aria/aria-haspopup_attribute
        // Most screen readers support aria-haspopup, but might announce
        // as opening a menu if "dialog" is not supported.
        // modalTrigger.setAttribute("aria-haspopup", "dialog");

        modalTrigger.addEventListener("click", toggleModal);
      });
    });
  },
  teardown(root) {
    selectOrMatches(MODAL, root).forEach(modalWindow => {
      const modalId = modalWindow.id;
      cleanUpModal(modalWindow);
      selectOrMatches(`[aria-controls="${modalId}"]`, document).forEach(modalTrigger => modalTrigger.removeEventListener("click", toggleModal));
    });
  },
  focusTrap: null,
  toggleModal
});
module.exports = modal;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/focus-trap":48,"../../uswds-core/src/js/utils/scrollbar-width":52,"../../uswds-core/src/js/utils/select-or-matches":53}],29:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const RANGE_CLASSNAME = `${PREFIX}-range`;
const RANGE = `.${RANGE_CLASSNAME}`;

/**
 * Update range callout for screen readers using the optional data attributes.
 *
 * Get optional data attributes, construct and appends aria-valuetext attribute.
 *
 * @example
 *
 * <input id="usa-range" class="usa-range" type="range" min="0" max="100" step="10" value="20" data-text-unit="degrees">
 *
 * Callout returns "20 degrees of 100."
 *
 * <input id="usa-range" class="usa-range" type="range" min="0" max="100" step="10" value="20" data-text-preposition="de">
 *
 * Callout returns "20 de 100."
 *
 * @param {HTMLInputElement} targetRange - The range slider input element
 */
const updateCallout = targetRange => {
  const rangeSlider = targetRange;
  const defaultPrep = "of";
  const optionalPrep = rangeSlider.dataset.textPreposition;
  const prep = optionalPrep || defaultPrep;
  const unit = rangeSlider.dataset.textUnit;
  const val = rangeSlider.value;
  // Note: 100 is the max attribute's native default value on range inputs
  // Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#validation
  const max = rangeSlider.getAttribute("max") || 100;
  let callout;
  if (unit) {
    callout = `${val} ${unit} ${prep} ${max}`;
  } else {
    callout = `${val} ${prep} ${max}`;
  }
  rangeSlider.setAttribute("aria-valuetext", callout);
};
const rangeEvents = {
  change: {
    [RANGE]() {
      updateCallout(this);
    }
  }
};
const range = behavior(rangeEvents, {
  init(root) {
    selectOrMatches(RANGE, root).forEach(rangeSlider => {
      updateCallout(rangeSlider);
    });
  },
  updateCallout
});
module.exports = range;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select-or-matches":53}],30:[function(require,module,exports){
"use strict";

const ignore = require("receptor/ignore");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const BUTTON = ".js-search-button";
const FORM = ".js-search-form";
const INPUT = "[type=search]";
const CONTEXT = "header"; // XXX

let lastButton;
const getForm = button => {
  const context = button.closest(CONTEXT);
  return context ? context.querySelector(FORM) : document.querySelector(FORM);
};
const toggleSearch = (button, active) => {
  const form = getForm(button);
  if (!form) {
    throw new Error(`No ${FORM} found for search toggle in ${CONTEXT}!`);
  }

  /* eslint-disable no-param-reassign */
  button.hidden = active;
  form.hidden = !active;
  /* eslint-enable */

  if (!active) {
    return;
  }
  const input = form.querySelector(INPUT);
  if (input) {
    input.focus();
  }
  // when the user clicks _outside_ of the form w/ignore(): hide the
  // search, then remove the listener
  const listener = ignore(form, () => {
    if (lastButton) {
      hideSearch.call(lastButton); // eslint-disable-line no-use-before-define
    }
    document.body.removeEventListener(CLICK, listener);
  });

  // Normally we would just run this code without a timeout, but
  // IE11 and Edge will actually call the listener *immediately* because
  // they are currently handling this exact type of event, so we'll
  // make sure the browser is done handling the current click event,
  // if any, before we attach the listener.
  setTimeout(() => {
    document.body.addEventListener(CLICK, listener);
  }, 0);
};
function showSearch() {
  toggleSearch(this, true);
  lastButton = this;
}
function hideSearch() {
  toggleSearch(this, false);
  lastButton = undefined;
}
const search = behavior({
  [CLICK]: {
    [BUTTON]: showSearch
  }
}, {
  init(target) {
    select(BUTTON, target).forEach(button => {
      toggleSearch(button, false);
    });
  },
  teardown() {
    // forget the last button clicked
    lastButton = undefined;
  }
});
module.exports = search;

},{"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select":54,"receptor/ignore":9}],31:[function(require,module,exports){
"use strict";

const once = require("receptor/once");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const LINK = `.${PREFIX}-skipnav[href^="#"], .${PREFIX}-footer__return-to-top [href^="#"]`;
const MAINCONTENT = "main-content";
function setTabindex() {
  // NB: we know because of the selector we're delegating to below that the
  // href already begins with '#'
  const id = encodeURI(this.getAttribute("href"));
  const target = document.getElementById(id === "#" ? MAINCONTENT : id.slice(1));
  if (target) {
    target.style.outline = "0";
    target.setAttribute("tabindex", 0);
    target.focus();
    target.addEventListener("blur", once(() => {
      target.setAttribute("tabindex", -1);
    }));
  } else {
    // throw an error?
  }
}
module.exports = behavior({
  [CLICK]: {
    [LINK]: setTabindex
  }
});

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"receptor/once":12}],32:[function(require,module,exports){
"use strict";

const select = require("../../uswds-core/src/js/utils/select");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const TABLE = `.${PREFIX}-table`;
const SORTED = "aria-sort";
const ASCENDING = "ascending";
const DESCENDING = "descending";
const SORT_OVERRIDE = "data-sort-value";
const SORT_BUTTON_CLASS = `${PREFIX}-table__header__button`;
const SORT_BUTTON = `.${SORT_BUTTON_CLASS}`;
const SORTABLE_HEADER = `th[data-sortable]`;
const ANNOUNCEMENT_REGION = `.${PREFIX}-table__announcement-region[aria-live="polite"]`;

/** Gets the data-sort-value attribute value, if provided — otherwise, gets
 * the innerText or textContent — of the child element (HTMLTableCellElement)
 * at the specified index of the given table row
 *
 * @param {number} index
 * @param {array<HTMLTableRowElement>} tr
 * @return {boolean}
 */
const getCellValue = (tr, index) => tr.children[index].getAttribute(SORT_OVERRIDE) || tr.children[index].innerText || tr.children[index].textContent;

/**
 * Compares the values of two row array items at the given index, then sorts by the given direction
 * @param {number} index
 * @param {string} direction
 * @return {boolean}
 */
const compareFunction = (index, isAscending) => (thisRow, nextRow) => {
  // get values to compare from data attribute or cell content
  const value1 = getCellValue(isAscending ? thisRow : nextRow, index);
  const value2 = getCellValue(isAscending ? nextRow : thisRow, index);

  // if neither value is empty, and if both values are already numbers, compare numerically
  if (value1 && value2 && !Number.isNaN(Number(value1)) && !Number.isNaN(Number(value2))) {
    return value1 - value2;
  }
  // Otherwise, compare alphabetically based on current user locale
  return value1.toString().localeCompare(value2, navigator.language, {
    numeric: true,
    ignorePunctuation: true
  });
};

/**
 * Get an Array of column headers elements belonging directly to the given
 * table element.
 * @param {HTMLTableElement} table
 * @return {array<HTMLTableHeaderCellElement>}
 */
const getColumnHeaders = table => {
  const headers = select(SORTABLE_HEADER, table);
  return headers.filter(header => header.closest(TABLE) === table);
};

/**
 * Update the button label within the given header element, resetting it
 * to the default state (ready to sort ascending) if it's no longer sorted
 * @param {HTMLTableHeaderCellElement} header
 */
const updateSortLabel = header => {
  const headerName = header.innerText;
  const sortedAscending = header.getAttribute(SORTED) === ASCENDING;
  const isSorted = header.getAttribute(SORTED) === ASCENDING || header.getAttribute(SORTED) === DESCENDING || false;
  const headerLabel = `${headerName}, sortable column, currently ${isSorted ? `${sortedAscending ? `sorted ${ASCENDING}` : `sorted ${DESCENDING}`}` : "unsorted"}`;
  const headerButtonLabel = `Click to sort by ${headerName} in ${sortedAscending ? DESCENDING : ASCENDING} order.`;
  header.setAttribute("aria-label", headerLabel);
  header.querySelector(SORT_BUTTON).setAttribute("title", headerButtonLabel);
};

/**
 * Remove the aria-sort attribute on the given header element, and reset the label and button icon
 * @param {HTMLTableHeaderCellElement} header
 */
const unsetSort = header => {
  header.removeAttribute(SORTED);
  updateSortLabel(header);
};

/**
 * Sort rows either ascending or descending, based on a given header's aria-sort attribute
 * @param {HTMLTableHeaderCellElement} header
 * @param {boolean} isAscending
 * @return {boolean} true
 */
const sortRows = (header, isAscending) => {
  header.setAttribute(SORTED, isAscending === true ? DESCENDING : ASCENDING);
  updateSortLabel(header);
  const tbody = header.closest(TABLE).querySelector("tbody");

  // We can use Array.from() and Array.sort() instead once we drop IE11 support, likely in the summer of 2021
  //
  // Array.from(tbody.querySelectorAll('tr').sort(
  //   compareFunction(
  //     Array.from(header.parentNode.children).indexOf(header),
  //     !isAscending)
  //   )
  // .forEach(tr => tbody.appendChild(tr) );

  // [].slice.call() turns array-like sets into true arrays so that we can sort them
  const allRows = [].slice.call(tbody.querySelectorAll("tr"));
  const allHeaders = [].slice.call(header.parentNode.children);
  const thisHeaderIndex = allHeaders.indexOf(header);
  allRows.sort(compareFunction(thisHeaderIndex, !isAscending)).forEach(tr => {
    [].slice.call(tr.children).forEach(td => td.removeAttribute("data-sort-active"));
    tr.children[thisHeaderIndex].setAttribute("data-sort-active", true);
    tbody.appendChild(tr);
  });
  return true;
};

/**
 * Update the live region immediately following the table whenever sort changes.
 * @param {HTMLTableElement} table
 * @param {HTMLTableHeaderCellElement} sortedHeader
 */

const updateLiveRegion = (table, sortedHeader) => {
  const caption = table.querySelector("caption").innerText;
  const sortedAscending = sortedHeader.getAttribute(SORTED) === ASCENDING;
  const headerLabel = sortedHeader.innerText;
  const liveRegion = table.nextElementSibling;
  if (liveRegion && liveRegion.matches(ANNOUNCEMENT_REGION)) {
    const sortAnnouncement = `The table named "${caption}" is now sorted by ${headerLabel} in ${sortedAscending ? ASCENDING : DESCENDING} order.`;
    liveRegion.innerText = sortAnnouncement;
  } else {
    throw new Error(`Table containing a sortable column header is not followed by an aria-live region.`);
  }
};

/**
 * Toggle a header's sort state, optionally providing a target
 * state.
 *
 * @param {HTMLTableHeaderCellElement} header
 * @param {boolean?} isAscending If no state is provided, the current
 * state will be toggled (from false to true, and vice-versa).
 */
const toggleSort = (header, isAscending) => {
  const table = header.closest(TABLE);
  let safeAscending = isAscending;
  if (typeof safeAscending !== "boolean") {
    safeAscending = header.getAttribute(SORTED) === ASCENDING;
  }
  if (!table) {
    throw new Error(`${SORTABLE_HEADER} is missing outer ${TABLE}`);
  }
  safeAscending = sortRows(header, isAscending);
  if (safeAscending) {
    getColumnHeaders(table).forEach(otherHeader => {
      if (otherHeader !== header) {
        unsetSort(otherHeader);
      }
    });
    updateLiveRegion(table, header);
  }
};

/**
 ** Inserts a button with icon inside a sortable header
 * @param {HTMLTableHeaderCellElement} header
 */

const createHeaderButton = header => {
  const buttonEl = document.createElement("button");
  buttonEl.setAttribute("tabindex", "0");
  buttonEl.classList.add(SORT_BUTTON_CLASS);
  // ICON_SOURCE
  buttonEl.innerHTML = Sanitizer.escapeHTML`
  <svg class="${PREFIX}-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g class="descending" fill="transparent">
      <path d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z" />
    </g>
    <g class="ascending" fill="transparent">
      <path transform="rotate(180, 12, 12)" d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z" />
    </g>
    <g class="unsorted" fill="transparent">
      <polygon points="15.17 15 13 17.17 13 6.83 15.17 9 16.58 7.59 12 3 7.41 7.59 8.83 9 11 6.83 11 17.17 8.83 15 7.42 16.41 12 21 16.59 16.41 15.17 15"/>
    </g>
  </svg>
  `;
  header.appendChild(buttonEl);
  updateSortLabel(header);
};
const table = behavior({
  [CLICK]: {
    [SORT_BUTTON](event) {
      event.preventDefault();
      toggleSort(event.target.closest(SORTABLE_HEADER), event.target.closest(SORTABLE_HEADER).getAttribute(SORTED) === ASCENDING);
    }
  }
}, {
  init(root) {
    const sortableHeaders = select(SORTABLE_HEADER, root);
    sortableHeaders.forEach(header => createHeaderButton(header));
    const firstSorted = sortableHeaders.filter(header => header.getAttribute(SORTED) === ASCENDING || header.getAttribute(SORTED) === DESCENDING)[0];
    if (typeof firstSorted === "undefined") {
      // no sortable headers found
      return;
    }
    const sortDir = firstSorted.getAttribute(SORTED);
    if (sortDir === ASCENDING) {
      toggleSort(firstSorted, true);
    } else if (sortDir === DESCENDING) {
      toggleSort(firstSorted, false);
    }
  },
  TABLE,
  SORTABLE_HEADER,
  SORT_BUTTON
});
module.exports = table;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/events":37,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/sanitizer":51,"../../uswds-core/src/js/utils/select":54}],33:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  COMBO_BOX_CLASS,
  enhanceComboBox
} = require("../../usa-combo-box/src/index");
const TIME_PICKER_CLASS = `${PREFIX}-time-picker`;
const TIME_PICKER = `.${TIME_PICKER_CLASS}`;
const MAX_TIME = 60 * 24 - 1;
const MIN_TIME = 0;
const DEFAULT_STEP = 30;
const MIN_STEP = 1;
const FILTER_DATASET = {
  filter: "0?{{ hourQueryFilter }}:{{minuteQueryFilter}}.*{{ apQueryFilter }}m?",
  apQueryFilter: "([ap])",
  hourQueryFilter: "([1-9][0-2]?)",
  minuteQueryFilter: "[\\d]+:([0-9]{0,2})"
};

/**
 * Parse a string of hh:mm into minutes
 *
 * @param {string} timeStr the time string to parse
 * @returns {number} the number of minutes
 */
const parseTimeString = timeStr => {
  let minutes;
  if (timeStr) {
    const [hours, mins] = timeStr.split(":").map(str => {
      let value;
      const parsed = parseInt(str, 10);
      if (!Number.isNaN(parsed)) value = parsed;
      return value;
    });
    if (hours != null && mins != null) {
      minutes = hours * 60 + mins;
    }
  }
  return minutes;
};

/**
 * Enhance an input with the date picker elements
 *
 * @param {HTMLElement} el The initial wrapping element of the date picker component
 */
const transformTimePicker = el => {
  const timePickerEl = el.closest(TIME_PICKER);
  const initialInputEl = timePickerEl.querySelector(`input`);
  if (!initialInputEl) {
    throw new Error(`${TIME_PICKER} is missing inner input`);
  }
  const selectEl = document.createElement("select");
  ["id", "name", "required", "aria-label", "aria-labelledby", "disabled", "aria-disabled"].forEach(name => {
    if (initialInputEl.hasAttribute(name)) {
      const value = initialInputEl.getAttribute(name);
      selectEl.setAttribute(name, value);
      initialInputEl.removeAttribute(name);
    }
  });
  const padZeros = (value, length) => `0000${value}`.slice(-length);
  const getTimeContext = minutes => {
    const minute = minutes % 60;
    const hour24 = Math.floor(minutes / 60);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 < 12 ? "am" : "pm";
    return {
      minute,
      hour24,
      hour12,
      ampm
    };
  };
  const minTime = Math.max(MIN_TIME, parseTimeString(timePickerEl.dataset.minTime) || MIN_TIME);
  const maxTime = Math.min(MAX_TIME, parseTimeString(timePickerEl.dataset.maxTime) || MAX_TIME);
  const step = Math.floor(Math.max(MIN_STEP, timePickerEl.dataset.step || DEFAULT_STEP));
  let defaultValue;
  for (let time = minTime; time <= maxTime; time += step) {
    const {
      minute,
      hour24,
      hour12,
      ampm
    } = getTimeContext(time);
    const option = document.createElement("option");
    option.value = `${padZeros(hour24, 2)}:${padZeros(minute, 2)}`;
    option.text = `${hour12}:${padZeros(minute, 2)}${ampm}`;
    if (option.text === initialInputEl.value) {
      defaultValue = option.value;
    }
    selectEl.appendChild(option);
  }
  timePickerEl.classList.add(COMBO_BOX_CLASS);

  // combo box properties
  Object.keys(FILTER_DATASET).forEach(key => {
    timePickerEl.dataset[key] = FILTER_DATASET[key];
  });
  timePickerEl.dataset.disableFiltering = "true";
  timePickerEl.dataset.defaultValue = defaultValue;
  timePickerEl.appendChild(selectEl);
  initialInputEl.remove();
};
const timePicker = behavior({}, {
  init(root) {
    selectOrMatches(TIME_PICKER, root).forEach(timePickerEl => {
      transformTimePicker(timePickerEl);
      enhanceComboBox(timePickerEl);
    });
  },
  FILTER_DATASET
});
module.exports = timePicker;

},{"../../usa-combo-box/src/index":19,"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select-or-matches":53}],34:[function(require,module,exports){
"use strict";

// Tooltips
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const isElementInViewport = require("../../uswds-core/src/js/utils/is-in-viewport");
const TOOLTIP = `.${PREFIX}-tooltip`;
const TOOLTIP_TRIGGER = `.${PREFIX}-tooltip__trigger`;
const TOOLTIP_TRIGGER_CLASS = `${PREFIX}-tooltip__trigger`;
const TOOLTIP_CLASS = `${PREFIX}-tooltip`;
const TOOLTIP_BODY_CLASS = `${PREFIX}-tooltip__body`;
const SET_CLASS = "is-set";
const VISIBLE_CLASS = "is-visible";
const TRIANGLE_SIZE = 5;
const ADJUST_WIDTH_CLASS = `${PREFIX}-tooltip__body--wrap`;

/**
 *
 * @param {DOMElement} trigger - The tooltip trigger
 * @returns {object} Elements for initialized tooltip; includes trigger, wrapper, and body
 */
const getTooltipElements = trigger => {
  const wrapper = trigger.parentNode;
  const body = wrapper.querySelector(`.${TOOLTIP_BODY_CLASS}`);
  return {
    trigger,
    wrapper,
    body
  };
};

/**
 * Shows the tooltip
 * @param {HTMLElement} tooltipTrigger - the element that initializes the tooltip
 */
const showToolTip = (tooltipBody, tooltipTrigger, position) => {
  tooltipBody.setAttribute("aria-hidden", "false");

  // This sets up the tooltip body. The opacity is 0, but
  // we can begin running the calculations below.
  tooltipBody.classList.add(SET_CLASS);

  /**
   * Position the tooltip body when the trigger is hovered
   * Removes old positioning classnames and reapplies. This allows
   * positioning to change in case the user resizes browser or DOM manipulation
   * causes tooltip to get clipped from viewport
   *
   * @param {string} setPos - can be "top", "bottom", "right", "left"
   */
  const setPositionClass = setPos => {
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--top`);
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--bottom`);
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--right`);
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--left`);
    tooltipBody.classList.add(`${TOOLTIP_BODY_CLASS}--${setPos}`);
  };

  /**
   * Removes old positioning styles. This allows
   * re-positioning to change without inheriting other
   * dynamic styles
   *
   * @param {HTMLElement} e - this is the tooltip body
   */
  const resetPositionStyles = e => {
    // we don't override anything in the stylesheet when finding alt positions
    e.style.top = null;
    e.style.bottom = null;
    e.style.right = null;
    e.style.left = null;
    e.style.margin = null;
  };

  /**
   * get margin offset calculations
   *
   * @param {HTMLElement} target - this is the tooltip body
   * @param {String} propertyValue - this is the tooltip body
   */

  const offsetMargin = (target, propertyValue) => parseInt(window.getComputedStyle(target).getPropertyValue(propertyValue), 10);

  // offsetLeft = the left position, and margin of the element, the left
  // padding, scrollbar and border of the offsetParent element
  // offsetWidth = The offsetWidth property returns the viewable width of an
  // element in pixels, including padding, border and scrollbar, but not
  // the margin.

  /**
   * Calculate margin offset
   * tooltip trigger margin(position) offset + tooltipBody offsetWidth
   * @param {String} marginPosition
   * @param {Number} tooltipBodyOffset
   * @param {HTMLElement} trigger
   */
  const calculateMarginOffset = (marginPosition, tooltipBodyOffset, trigger) => {
    const offset = offsetMargin(trigger, `margin-${marginPosition}`) > 0 ? tooltipBodyOffset - offsetMargin(trigger, `margin-${marginPosition}`) : tooltipBodyOffset;
    return offset;
  };

  /**
   * Positions tooltip at the top
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionTop = e => {
    resetPositionStyles(e); // ensures we start from the same point
    // get details on the elements object with

    const topMargin = calculateMarginOffset("top", e.offsetHeight, tooltipTrigger);
    const leftMargin = calculateMarginOffset("left", e.offsetWidth, tooltipTrigger);
    setPositionClass("top");
    e.style.left = `50%`; // center the element
    e.style.top = `-${TRIANGLE_SIZE}px`; // consider the pseudo element
    // apply our margins based on the offset
    e.style.margin = `-${topMargin}px 0 0 -${leftMargin / 2}px`;
  };

  /**
   * Positions tooltip at the bottom
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionBottom = e => {
    resetPositionStyles(e);
    const leftMargin = calculateMarginOffset("left", e.offsetWidth, tooltipTrigger);
    setPositionClass("bottom");
    e.style.left = `50%`;
    e.style.margin = `${TRIANGLE_SIZE}px 0 0 -${leftMargin / 2}px`;
  };

  /**
   * Positions tooltip at the right
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionRight = e => {
    resetPositionStyles(e);
    const topMargin = calculateMarginOffset("top", e.offsetHeight, tooltipTrigger);
    setPositionClass("right");
    e.style.top = `50%`;
    e.style.left = `${tooltipTrigger.offsetLeft + tooltipTrigger.offsetWidth + TRIANGLE_SIZE}px`;
    e.style.margin = `-${topMargin / 2}px 0 0 0`;
  };

  /**
   * Positions tooltip at the right
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionLeft = e => {
    resetPositionStyles(e);
    const topMargin = calculateMarginOffset("top", e.offsetHeight, tooltipTrigger);

    // we have to check for some utility margins
    const leftMargin = calculateMarginOffset("left", tooltipTrigger.offsetLeft > e.offsetWidth ? tooltipTrigger.offsetLeft - e.offsetWidth : e.offsetWidth, tooltipTrigger);
    setPositionClass("left");
    e.style.top = `50%`;
    e.style.left = `-${TRIANGLE_SIZE}px`;
    e.style.margin = `-${topMargin / 2}px 0 0 ${tooltipTrigger.offsetLeft > e.offsetWidth ? leftMargin : -leftMargin}px`; // adjust the margin
  };

  /**
   * We try to set the position based on the
   * original intention, but make adjustments
   * if the element is clipped out of the viewport
   * we constrain the width only as a last resort
   * @param {HTMLElement} element(alias tooltipBody)
   * @param {Number} attempt (--flag)
   */

  const maxAttempts = 2;
  function findBestPosition(element, attempt = 1) {
    // create array of optional positions
    const positions = [positionTop, positionBottom, positionRight, positionLeft];
    let hasVisiblePosition = false;

    // we take a recursive approach
    function tryPositions(i) {
      if (i < positions.length) {
        const pos = positions[i];
        pos(element);
        if (!isElementInViewport(element)) {
          // eslint-disable-next-line no-param-reassign
          tryPositions(i += 1);
        } else {
          hasVisiblePosition = true;
        }
      }
    }
    tryPositions(0);
    // if we can't find a position we compress it and try again
    if (!hasVisiblePosition) {
      element.classList.add(ADJUST_WIDTH_CLASS);
      if (attempt <= maxAttempts) {
        // eslint-disable-next-line no-param-reassign
        findBestPosition(element, attempt += 1);
      }
    }
  }
  switch (position) {
    case "top":
      positionTop(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    case "bottom":
      positionBottom(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    case "right":
      positionRight(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    case "left":
      positionLeft(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    default:
      // skip default case
      break;
  }

  /**
   * Actually show the tooltip. The VISIBLE_CLASS
   * will change the opacity to 1
   */
  setTimeout(() => {
    tooltipBody.classList.add(VISIBLE_CLASS);
  }, 20);
};

/**
 * Removes all the properties to show and position the tooltip,
 * and resets the tooltip position to the original intention
 * in case the window is resized or the element is moved through
 * DOM manipulation.
 * @param {HTMLElement} tooltipBody - The body of the tooltip
 */
const hideToolTip = tooltipBody => {
  tooltipBody.classList.remove(VISIBLE_CLASS);
  tooltipBody.classList.remove(SET_CLASS);
  tooltipBody.classList.remove(ADJUST_WIDTH_CLASS);
  tooltipBody.setAttribute("aria-hidden", "true");
};

/**
 * Setup the tooltip component
 * @param {HTMLElement} tooltipTrigger The element that creates the tooltip
 */
const setUpAttributes = tooltipTrigger => {
  const tooltipID = `tooltip-${Math.floor(Math.random() * 900000) + 100000}`;
  const tooltipContent = tooltipTrigger.getAttribute("title");
  const wrapper = document.createElement("span");
  const tooltipBody = document.createElement("span");
  const additionalClasses = tooltipTrigger.getAttribute("data-classes");
  let position = tooltipTrigger.getAttribute("data-position");

  // Apply default position if not set as attribute
  if (!position) {
    position = "top";
    tooltipTrigger.setAttribute("data-position", position);
  }

  // Set up tooltip attributes
  tooltipTrigger.setAttribute("aria-describedby", tooltipID);
  tooltipTrigger.setAttribute("tabindex", "0");
  tooltipTrigger.removeAttribute("title");
  tooltipTrigger.classList.remove(TOOLTIP_CLASS);
  tooltipTrigger.classList.add(TOOLTIP_TRIGGER_CLASS);

  // insert wrapper before el in the DOM tree
  tooltipTrigger.parentNode.insertBefore(wrapper, tooltipTrigger);

  // set up the wrapper
  wrapper.appendChild(tooltipTrigger);
  wrapper.classList.add(TOOLTIP_CLASS);
  wrapper.appendChild(tooltipBody);

  // Apply additional class names to wrapper element
  if (additionalClasses) {
    const classesArray = additionalClasses.split(" ");
    classesArray.forEach(classname => wrapper.classList.add(classname));
  }

  // set up the tooltip body
  tooltipBody.classList.add(TOOLTIP_BODY_CLASS);
  tooltipBody.setAttribute("id", tooltipID);
  tooltipBody.setAttribute("role", "tooltip");
  tooltipBody.setAttribute("aria-hidden", "true");

  // place the text in the tooltip
  tooltipBody.textContent = tooltipContent;
  return {
    tooltipBody,
    position,
    tooltipContent,
    wrapper
  };
};

// Setup our function to run on various events
const tooltip = behavior({
  "mouseover focusin": {
    [TOOLTIP](e) {
      const trigger = e.target;
      const elementType = trigger.nodeName;

      // Initialize tooltip if it hasn't already
      if (elementType === "BUTTON" && trigger.hasAttribute("title")) {
        setUpAttributes(trigger);
      }
    },
    [TOOLTIP_TRIGGER](e) {
      const {
        trigger,
        body
      } = getTooltipElements(e.target);
      showToolTip(body, trigger, trigger.dataset.position);
    }
  },
  "mouseout focusout": {
    [TOOLTIP_TRIGGER](e) {
      const {
        body
      } = getTooltipElements(e.target);
      hideToolTip(body);
    }
  }
}, {
  init(root) {
    selectOrMatches(TOOLTIP, root).forEach(tooltipTrigger => {
      setUpAttributes(tooltipTrigger);
    });
  },
  setup: setUpAttributes,
  getTooltipElements,
  show: showToolTip,
  hide: hideToolTip
});
module.exports = tooltip;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/is-in-viewport":49,"../../uswds-core/src/js/utils/select-or-matches":53}],35:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const validate = require("../../uswds-core/src/js/utils/validate-input");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const VALIDATE_INPUT = "input[data-validation-element]";
const CHECKLIST_ITEM = `.${PREFIX}-checklist__item`;

// Trigger validation on input change
const handleChange = el => validate(el);

// Create container to hold aria readout
const createStatusElement = input => {
  const validationContainer = input.parentNode;
  const inputID = input.getAttribute("id");
  const statusSummaryID = `${inputID}-sr-summary`;
  input.setAttribute("aria-describedby", statusSummaryID);
  const statusSummaryContainer = document.createElement("span");
  statusSummaryContainer.setAttribute("data-validation-status", "");
  statusSummaryContainer.classList.add("usa-sr-only");
  statusSummaryContainer.setAttribute("aria-live", "polite");
  statusSummaryContainer.setAttribute("aria-atomic", true);
  statusSummaryContainer.setAttribute("id", statusSummaryID);
  validationContainer.append(statusSummaryContainer);
};

// Set up checklist items with initial aria-label (incomplete) values
const createInitialStatus = input => {
  const validationContainer = input.parentNode;
  const checklistItems = validationContainer.querySelectorAll(CHECKLIST_ITEM);
  const validationElement = input.getAttribute("data-validation-element");
  input.setAttribute("aria-controls", validationElement);
  checklistItems.forEach(listItem => {
    let currentStatus = "status incomplete";
    if (input.hasAttribute("data-validation-incomplete")) {
      currentStatus = input.getAttribute("data-validation-incomplete");
    }
    const itemStatus = `${listItem.textContent} ${currentStatus} `;
    listItem.setAttribute("tabindex", "0");
    listItem.setAttribute("aria-label", itemStatus);
  });
};
const enhanceValidation = input => {
  createStatusElement(input);
  createInitialStatus(input);
};
const validator = behavior({
  "input change": {
    [VALIDATE_INPUT](event) {
      handleChange(event.target);
    }
  }
}, {
  init(root) {
    selectOrMatches(VALIDATE_INPUT, root).forEach(input => enhanceValidation(input));
  }
});
module.exports = validator;

},{"../../uswds-core/src/js/config":36,"../../uswds-core/src/js/utils/behavior":46,"../../uswds-core/src/js/utils/select-or-matches":53,"../../uswds-core/src/js/utils/validate-input":58}],36:[function(require,module,exports){
"use strict";

module.exports = {
  prefix: "usa"
};

},{}],37:[function(require,module,exports){
"use strict";

module.exports = {
  // This used to be conditionally dependent on whether the
  // browser supported touch events; if it did, `CLICK` was set to
  // `touchstart`.  However, this had downsides:
  //
  // * It pre-empted mobile browsers' default behavior of detecting
  //   whether a touch turned into a scroll, thereby preventing
  //   users from using some of our components as scroll surfaces.
  //
  // * Some devices, such as the Microsoft Surface Pro, support *both*
  //   touch and clicks. This meant the conditional effectively dropped
  //   support for the user's mouse, frustrating users who preferred
  //   it on those systems.
  CLICK: "click"
};

},{}],38:[function(require,module,exports){
"use strict";

const accordion = require("../../../usa-accordion/src/index");
const banner = require("../../../usa-banner/src/index");
const button = require("../../../usa-button/src/index");
const characterCount = require("../../../usa-character-count/src/index");
const comboBox = require("../../../usa-combo-box/src/index");
const datePicker = require("../../../usa-date-picker/src/index");
const dateRangePicker = require("../../../usa-date-range-picker/src/index");
const fileInput = require("../../../usa-file-input/src/index");
const footer = require("../../../usa-footer/src/index");
const inPageNavigation = require("../../../usa-in-page-navigation/src/index");
const inputMask = require("../../../usa-input-mask/src/index");
const languageSelector = require("../../../usa-language-selector/src/index");
const modal = require("../../../usa-modal/src/index");
const navigation = require("../../../usa-header/src/index");
const password = require("../../../_usa-password/src/index");
const range = require("../../../usa-range/src/index");
const search = require("../../../usa-search/src/index");
const skipnav = require("../../../usa-skipnav/src/index");
const table = require("../../../usa-table/src/index");
const timePicker = require("../../../usa-time-picker/src/index");
const tooltip = require("../../../usa-tooltip/src/index");
const validator = require("../../../usa-validation/src/index");
module.exports = {
  accordion,
  banner,
  button,
  characterCount,
  comboBox,
  datePicker,
  dateRangePicker,
  fileInput,
  footer,
  inPageNavigation,
  inputMask,
  languageSelector,
  modal,
  navigation,
  password,
  range,
  search,
  skipnav,
  table,
  timePicker,
  tooltip,
  validator
};

},{"../../../_usa-password/src/index":14,"../../../usa-accordion/src/index":15,"../../../usa-banner/src/index":16,"../../../usa-button/src/index":17,"../../../usa-character-count/src/index":18,"../../../usa-combo-box/src/index":19,"../../../usa-date-picker/src/index":20,"../../../usa-date-range-picker/src/index":21,"../../../usa-file-input/src/index":22,"../../../usa-footer/src/index":23,"../../../usa-header/src/index":24,"../../../usa-in-page-navigation/src/index":25,"../../../usa-input-mask/src/index":26,"../../../usa-language-selector/src/index":27,"../../../usa-modal/src/index":28,"../../../usa-range/src/index":29,"../../../usa-search/src/index":30,"../../../usa-skipnav/src/index":31,"../../../usa-table/src/index":32,"../../../usa-time-picker/src/index":33,"../../../usa-tooltip/src/index":34,"../../../usa-validation/src/index":35}],39:[function(require,module,exports){
"use strict";

/* eslint-disable consistent-return */
/* eslint-disable func-names */
(function () {
  if (typeof window.CustomEvent === "function") return false;
  function CustomEvent(event, _params) {
    const params = _params || {
      bubbles: false,
      cancelable: false,
      detail: null
    };
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  window.CustomEvent = CustomEvent;
})();

},{}],40:[function(require,module,exports){
"use strict";

const elproto = window.HTMLElement.prototype;
const HIDDEN = "hidden";
if (!(HIDDEN in elproto)) {
  Object.defineProperty(elproto, HIDDEN, {
    get() {
      return this.hasAttribute(HIDDEN);
    },
    set(value) {
      if (value) {
        this.setAttribute(HIDDEN, "");
      } else {
        this.removeAttribute(HIDDEN);
      }
    }
  });
}

},{}],41:[function(require,module,exports){
"use strict";

// polyfills HTMLElement.prototype.classList and DOMTokenList
require("classlist-polyfill");
// polyfills HTMLElement.prototype.hidden
require("./element-hidden");
// polyfills Number.isNaN()
require("./number-is-nan");
// polyfills CustomEvent
require("./custom-event");
// polyfills svg4everybody
require("./svg4everybody");

},{"./custom-event":39,"./element-hidden":40,"./number-is-nan":42,"./svg4everybody":43,"classlist-polyfill":1}],42:[function(require,module,exports){
"use strict";

Number.isNaN = Number.isNaN || function isNaN(input) {
  // eslint-disable-next-line no-self-compare
  return typeof input === "number" && input !== input;
};

},{}],43:[function(require,module,exports){
"use strict";

/* eslint-disable */
!function (factory) {
  module.exports = factory();
}(function () {
  /*! svg4everybody v2.1.9 | github.com/jonathantneal/svg4everybody */
  function embed(parent, svg, target, use) {
    // if the target exists
    if (target) {
      // create a document fragment to hold the contents of the target
      var fragment = document.createDocumentFragment(),
        viewBox = !svg.hasAttribute("viewBox") && target.getAttribute("viewBox");
      // conditionally set the viewBox on the svg
      viewBox && svg.setAttribute("viewBox", viewBox);
      // copy the contents of the clone into the fragment
      for (
      // clone the target
      var clone = document.importNode ? document.importNode(target, !0) : target.cloneNode(!0), g = document.createElementNS(svg.namespaceURI || "http://www.w3.org/2000/svg", "g"); clone.childNodes.length;) {
        g.appendChild(clone.firstChild);
      }
      if (use) {
        for (var i = 0; use.attributes.length > i; i++) {
          var attr = use.attributes[i];
          "xlink:href" !== attr.name && "href" !== attr.name && g.setAttribute(attr.name, attr.value);
        }
      }
      fragment.appendChild(g),
      // append the fragment into the svg
      parent.appendChild(fragment);
    }
  }
  function loadreadystatechange(xhr, use) {
    // listen to changes in the request
    xhr.onreadystatechange = function () {
      // if the request is ready
      if (4 === xhr.readyState) {
        // get the cached html document
        var cachedDocument = xhr._cachedDocument;
        // ensure the cached html document based on the xhr response
        cachedDocument || (cachedDocument = xhr._cachedDocument = document.implementation.createHTMLDocument(""), cachedDocument.body.innerHTML = xhr.responseText,
        // ensure domains are the same, otherwise we'll have issues appending the
        // element in IE 11
        cachedDocument.domain !== document.domain && (cachedDocument.domain = document.domain), xhr._cachedTarget = {}),
        // clear the xhr embeds list and embed each item
        xhr._embeds.splice(0).map(function (item) {
          // get the cached target
          var target = xhr._cachedTarget[item.id];
          // ensure the cached target
          target || (target = xhr._cachedTarget[item.id] = cachedDocument.getElementById(item.id)),
          // embed the target into the svg
          embed(item.parent, item.svg, target, use);
        });
      }
    },
    // test the ready state change immediately
    xhr.onreadystatechange();
  }
  function svg4everybody(rawopts) {
    function oninterval() {
      // if all <use>s in the array are being bypassed, don't proceed.
      if (numberOfSvgUseElementsToBypass && uses.length - numberOfSvgUseElementsToBypass <= 0) {
        return void requestAnimationFrame(oninterval, 67);
      }
      // if there are <use>s to process, proceed.
      // reset the bypass counter, since the counter will be incremented for every bypassed element,
      // even ones that were counted before.
      numberOfSvgUseElementsToBypass = 0;
      // while the index exists in the live <use> collection
      for (
      // get the cached <use> index
      var index = 0; index < uses.length;) {
        // get the current <use>
        var use = uses[index],
          parent = use.parentNode,
          svg = getSVGAncestor(parent),
          src = use.getAttribute("xlink:href") || use.getAttribute("href");
        if (!src && opts.attributeName && (src = use.getAttribute(opts.attributeName)), svg && src) {
          if (polyfill) {
            if (!opts.validate || opts.validate(src, svg, use)) {
              // remove the <use> element
              parent.removeChild(use);
              // parse the src and get the url and id
              var srcSplit = src.split("#"),
                url = srcSplit.shift(),
                id = srcSplit.join("#");
              // if the link is external
              if (url.length) {
                // get the cached xhr request
                var xhr = requests[url];
                // ensure the xhr request exists
                xhr || (xhr = requests[url] = new XMLHttpRequest(), xhr.open("GET", url), xhr.send(), xhr._embeds = []),
                // add the svg and id as an item to the xhr embeds list
                xhr._embeds.push({
                  parent: parent,
                  svg: svg,
                  id: id
                }),
                // prepare the xhr ready state change event
                loadreadystatechange(xhr, use);
              } else {
                // embed the local id into the svg
                embed(parent, svg, document.getElementById(id), use);
              }
            } else {
              // increase the index when the previous value was not "valid"
              ++index, ++numberOfSvgUseElementsToBypass;
            }
          }
        } else {
          // increase the index when the previous value was not "valid"
          ++index;
        }
      }
      // continue the interval
      requestAnimationFrame(oninterval, 67);
    }
    var polyfill,
      opts = Object(rawopts),
      newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/,
      webkitUA = /\bAppleWebKit\/(\d+)\b/,
      olderEdgeUA = /\bEdge\/12\.(\d+)\b/,
      edgeUA = /\bEdge\/.(\d+)\b/,
      inIframe = window.top !== window.self;
    polyfill = "polyfill" in opts ? opts.polyfill : newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537 || edgeUA.test(navigator.userAgent) && inIframe;
    // create xhr requests object
    var requests = {},
      requestAnimationFrame = window.requestAnimationFrame || setTimeout,
      uses = document.getElementsByTagName("use"),
      numberOfSvgUseElementsToBypass = 0;
    // conditionally start the interval if the polyfill is active
    polyfill && oninterval();
  }
  function getSVGAncestor(node) {
    for (var svg = node; "svg" !== svg.nodeName.toLowerCase() && (svg = svg.parentNode);) {}
    return svg;
  }
  return svg4everybody;
});

},{}],44:[function(require,module,exports){
"use strict";

window.uswdsPresent = true; // GLOBAL variable to indicate that the uswds.js has loaded in the DOM.

/**
 * The 'polyfills' define key ECMAScript 5 methods that may be missing from
 * older browsers, so must be loaded first.
 */
require("./polyfills");
const uswds = require("./config");
const components = require("./index");
const svg4everybody = require("./polyfills/svg4everybody");
uswds.components = components;
const initComponents = () => {
  const target = document.body;
  Object.keys(components).forEach(key => {
    const behavior = components[key];
    behavior.on(target);
  });
  svg4everybody();
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initComponents, {
    once: true
  });
} else {
  initComponents();
}
exports.default = uswds;
exports.initComponents = initComponents;

},{"./config":36,"./index":38,"./polyfills":41,"./polyfills/svg4everybody":43}],45:[function(require,module,exports){
"use strict";

module.exports = (htmlDocument = document) => htmlDocument.activeElement;

},{}],46:[function(require,module,exports){
"use strict";

const assign = require("object-assign");
const Behavior = require("receptor/behavior");

/**
 * @name sequence
 * @param {...Function} seq an array of functions
 * @return { closure } callHooks
 */
// We use a named function here because we want it to inherit its lexical scope
// from the behavior props object, not from the module
const sequence = (...seq) => function callHooks(target = document.body) {
  seq.forEach(method => {
    if (typeof this[method] === "function") {
      this[method].call(this, target);
    }
  });
};

/**
 * @name behavior
 * @param {object} events
 * @param {object?} props
 * @return {receptor.behavior}
 */
module.exports = (events, props) => Behavior(events, assign({
  on: sequence("init", "add"),
  off: sequence("teardown", "remove")
}, props));

},{"object-assign":4,"receptor/behavior":5}],47:[function(require,module,exports){
"use strict";

/**
 * Call a function every X amount of milliseconds.
 *
 * @param  {Function} callback - A callback function to be debounced
 * @param  {number} delay - Milliseconds to wait before calling function
 * @returns {Function} A debounced function
 * @example const updateStatus = debounce((string) => console.log(string), 2000)
 */

module.exports = function debounce(callback, delay = 500) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
};

},{}],48:[function(require,module,exports){
"use strict";

const assign = require("object-assign");
const {
  keymap
} = require("receptor");
const behavior = require("./behavior");
const select = require("./select");
const activeElement = require("./active-element");
const FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
const tabHandler = context => {
  const focusableElements = select(FOCUSABLE, context);
  const firstTabStop = focusableElements[0];
  const lastTabStop = focusableElements[focusableElements.length - 1];

  // Special rules for when the user is tabbing forward from the last focusable element,
  // or when tabbing backwards from the first focusable element
  function tabAhead(event) {
    if (activeElement() === lastTabStop) {
      event.preventDefault();
      firstTabStop.focus();
    }
  }
  function tabBack(event) {
    if (activeElement() === firstTabStop) {
      event.preventDefault();
      lastTabStop.focus();
    }
    // This checks if you want to set the initial focus to a container
    // instead of an element within, and the user tabs back.
    // Then we set the focus to the first
    else if (!focusableElements.includes(activeElement())) {
      event.preventDefault();
      firstTabStop.focus();
    }
  }
  return {
    firstTabStop,
    lastTabStop,
    tabAhead,
    tabBack
  };
};
module.exports = (context, additionalKeyBindings = {}) => {
  const tabEventHandler = tabHandler(context);
  const bindings = additionalKeyBindings;
  const {
    Esc,
    Escape
  } = bindings;
  if (Escape && !Esc) bindings.Esc = Escape;

  //  TODO: In the future, loop over additional keybindings and pass an array
  // of functions, if necessary, to the map keys. Then people implementing
  // the focus trap could pass callbacks to fire when tabbing
  const keyMappings = keymap(assign({
    Tab: tabEventHandler.tabAhead,
    "Shift+Tab": tabEventHandler.tabBack
  }, additionalKeyBindings));
  const focusTrap = behavior({
    keydown: keyMappings
  }, {
    init() {
      // TODO: is this desireable behavior? Should the trap always do this by default or should
      // the component getting decorated handle this?
      if (tabEventHandler.firstTabStop) {
        tabEventHandler.firstTabStop.focus();
      }
    },
    update(isActive) {
      if (isActive) {
        this.on();
      } else {
        this.off();
      }
    }
  });
  return focusTrap;
};

},{"./active-element":45,"./behavior":46,"./select":54,"object-assign":4,"receptor":10}],49:[function(require,module,exports){
"use strict";

// https://stackoverflow.com/a/7557433
function isElementInViewport(el, win = window, docEl = document.documentElement) {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (win.innerHeight || docEl.clientHeight) && rect.right <= (win.innerWidth || docEl.clientWidth);
}
module.exports = isElementInViewport;

},{}],50:[function(require,module,exports){
"use strict";

// iOS detection from: http://stackoverflow.com/a/9039885/177710
function isIosDevice() {
  return typeof navigator !== "undefined" && (navigator.userAgent.match(/(iPod|iPhone|iPad)/g) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) && !window.MSStream;
}
module.exports = isIosDevice;

},{}],51:[function(require,module,exports){
"use strict";

/* eslint-disable */
/* globals define, module */

/**
 * A simple library to help you escape HTML using template strings.
 *
 * It's the counterpart to our eslint "no-unsafe-innerhtml" plugin that helps us
 * avoid unsafe coding practices.
 * A full write-up of the Hows and Whys are documented
 * for developers at
 *  https://developer.mozilla.org/en-US/Firefox_OS/Security/Security_Automation
 * with additional background information and design docs at
 *  https://wiki.mozilla.org/User:Fbraun/Gaia/SafeinnerHTMLRoadmap
 *
 */

!function (factory) {
  module.exports = factory();
}(function () {
  "use strict";

  var Sanitizer = {
    _entity: /[&<>"'/]/g,
    _entities: {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
      "/": "&#x2F;"
    },
    getEntity: function (s) {
      return Sanitizer._entities[s];
    },
    /**
     * Escapes HTML for all values in a tagged template string.
     */
    escapeHTML: function (strings) {
      var result = "";
      for (var i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i + 1 < arguments.length) {
          var value = arguments[i + 1] || "";
          result += String(value).replace(Sanitizer._entity, Sanitizer.getEntity);
        }
      }
      return result;
    },
    /**
     * Escapes HTML and returns a wrapped object to be used during DOM insertion
     */
    createSafeHTML: function (strings) {
      var _len = arguments.length;
      var values = new Array(_len > 1 ? _len - 1 : 0);
      for (var _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
      }
      var escaped = Sanitizer.escapeHTML.apply(Sanitizer, [strings].concat(values));
      return {
        __html: escaped,
        toString: function () {
          return "[object WrappedHTMLObject]";
        },
        info: "This is a wrapped HTML object. See https://developer.mozilla.or" + "g/en-US/Firefox_OS/Security/Security_Automation for more."
      };
    },
    /**
     * Unwrap safe HTML created by createSafeHTML or a custom replacement that
     * underwent security review.
     */
    unwrapSafeHTML: function () {
      var _len = arguments.length;
      var htmlObjects = new Array(_len);
      for (var _key = 0; _key < _len; _key++) {
        htmlObjects[_key] = arguments[_key];
      }
      var markupList = htmlObjects.map(function (obj) {
        return obj.__html;
      });
      return markupList.join("");
    }
  };
  return Sanitizer;
});

},{}],52:[function(require,module,exports){
"use strict";

module.exports = function getScrollbarWidth() {
  // Creating invisible container
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll"; // forcing scrollbar to appear
  outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement("div");
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = `${outer.offsetWidth - inner.offsetWidth}px`;

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);
  return scrollbarWidth;
};

},{}],53:[function(require,module,exports){
"use strict";

const select = require("./select");
/**
 * @name isElement
 * @desc returns whether or not the given argument is a DOM element.
 * @param {any} value
 * @return {boolean}
 */
const isElement = value => value && typeof value === "object" && value.nodeType === 1;

/**
 * @name selectOrMatches
 * @desc selects elements from the DOM by class selector or ID selector.
 * @param {string} selector - The selector to traverse the DOM with.
 * @param {Document|HTMLElement?} context - The context to traverse the DOM
 *   in. If not provided, it defaults to the document.
 * @return {HTMLElement[]} - An array of DOM nodes or an empty array.
 */
module.exports = (selector, context) => {
  const selection = select(selector, context);
  if (typeof selector !== "string") {
    return selection;
  }
  if (isElement(context) && context.matches(selector)) {
    selection.push(context);
  }
  return selection;
};

},{"./select":54}],54:[function(require,module,exports){
"use strict";

/**
 * @name isElement
 * @desc returns whether or not the given argument is a DOM element.
 * @param {any} value
 * @return {boolean}
 */
const isElement = value => value && typeof value === "object" && value.nodeType === 1;

/**
 * @name select
 * @desc selects elements from the DOM by class selector or ID selector.
 * @param {string} selector - The selector to traverse the DOM with.
 * @param {Document|HTMLElement?} context - The context to traverse the DOM
 *   in. If not provided, it defaults to the document.
 * @return {HTMLElement[]} - An array of DOM nodes or an empty array.
 */
module.exports = (selector, context) => {
  if (typeof selector !== "string") {
    return [];
  }
  if (!context || !isElement(context)) {
    context = window.document; // eslint-disable-line no-param-reassign
  }
  const selection = context.querySelectorAll(selector);
  return Array.prototype.slice.call(selection);
};

},{}],55:[function(require,module,exports){
"use strict";

/**
 * Flips given INPUT elements between masked (hiding the field value) and unmasked
 * @param {Array.HTMLElement} fields - An array of INPUT elements
 * @param {Boolean} mask - Whether the mask should be applied, hiding the field value
 */
module.exports = (field, mask) => {
  field.setAttribute("autocapitalize", "off");
  field.setAttribute("autocorrect", "off");
  field.setAttribute("type", mask ? "password" : "text");
};

},{}],56:[function(require,module,exports){
"use strict";

const resolveIdRefs = require("resolve-id-refs");
const toggleFieldMask = require("./toggle-field-mask");
const CONTROLS = "aria-controls";
const PRESSED = "aria-pressed";
const SHOW_ATTR = "data-show-text";
const HIDE_ATTR = "data-hide-text";

/**
 * Replace the word "Show" (or "show") with "Hide" (or "hide") in a string.
 * @param {string} showText
 * @return {strong} hideText
 */
const getHideText = showText => showText.replace(/\bShow\b/i, show => `${show[0] === "S" ? "H" : "h"}ide`);

/**
 * Component that decorates an HTML element with the ability to toggle the
 * masked state of an input field (like a password) when clicked.
 * The ids of the fields to be masked will be pulled directly from the button's
 * `aria-controls` attribute.
 *
 * @param  {HTMLElement} el    Parent element containing the fields to be masked
 * @return {boolean}
 */
module.exports = el => {
  // this is the *target* state:
  // * if the element has the attr and it's !== "true", pressed is true
  // * otherwise, pressed is false
  const pressed = el.hasAttribute(PRESSED) && el.getAttribute(PRESSED) !== "true";
  const fields = resolveIdRefs(el.getAttribute(CONTROLS));
  fields.forEach(field => toggleFieldMask(field, pressed));
  if (!el.hasAttribute(SHOW_ATTR)) {
    el.setAttribute(SHOW_ATTR, el.textContent);
  }
  const showText = el.getAttribute(SHOW_ATTR);
  const hideText = el.getAttribute(HIDE_ATTR) || getHideText(showText);
  el.textContent = pressed ? showText : hideText; // eslint-disable-line no-param-reassign
  el.setAttribute(PRESSED, pressed);
  return pressed;
};

},{"./toggle-field-mask":55,"resolve-id-refs":13}],57:[function(require,module,exports){
"use strict";

const EXPANDED = "aria-expanded";
const CONTROLS = "aria-controls";
const HIDDEN = "hidden";
module.exports = (button, expanded) => {
  let safeExpanded = expanded;
  if (typeof safeExpanded !== "boolean") {
    safeExpanded = button.getAttribute(EXPANDED) === "false";
  }
  button.setAttribute(EXPANDED, safeExpanded);
  const id = button.getAttribute(CONTROLS);
  const controls = document.getElementById(id);
  if (!controls) {
    throw new Error(`No toggle target found with id: "${id}"`);
  }
  if (safeExpanded) {
    controls.removeAttribute(HIDDEN);
  } else {
    controls.setAttribute(HIDDEN, "");
  }
  return safeExpanded;
};

},{}],58:[function(require,module,exports){
"use strict";

const debounce = require("./debounce");
const {
  prefix: PREFIX
} = require("../config");
const CHECKED_CLASS = `${PREFIX}-checklist__item--checked`;
module.exports = function validate(el) {
  const id = el.dataset.validationElement;
  const checkList = id.charAt(0) === "#" ? document.querySelector(id) : document.getElementById(id);
  if (!checkList) {
    throw new Error(`No validation element found with id: "${id}"`);
  }
  let statusSummary = "";
  Object.entries(el.dataset).forEach(([key, value]) => {
    if (key.startsWith("validate")) {
      const validatorName = key.substr("validate".length).toLowerCase();
      const validatorPattern = new RegExp(value);
      const validatorSelector = `[data-validator="${validatorName}"]`;
      const validatorCheckbox = checkList.querySelector(validatorSelector);
      const validatorParent = el.parentNode;
      const statusSummaryContainer = validatorParent.querySelector(`[data-validation-status]`);
      const checked = validatorPattern.test(el.value);
      validatorCheckbox.classList.toggle(CHECKED_CLASS, checked);
      if (!validatorCheckbox) {
        throw new Error(`No validator checkbox found for: "${validatorName}"`);
      }

      // Create status reports for checklist items
      const statusComplete = el.dataset.validationComplete || "status complete";
      const statusIncomplete = el.dataset.validationIncomplete || "status incomplete";
      let checkboxContent = `${validatorCheckbox.textContent} `;
      if (validatorCheckbox.classList.contains(CHECKED_CLASS)) {
        checkboxContent += statusComplete;
      } else {
        checkboxContent += statusIncomplete;
      }

      // move status updates to aria-label on checklist item
      validatorCheckbox.setAttribute("aria-label", checkboxContent);

      // Create a summary of status for all checklist items
      statusSummary += `${checkboxContent}. `;

      // Add summary to screen reader summary container, after a delay
      const srUpdateStatus = debounce(() => {
        statusSummaryContainer.textContent = statusSummary;
      }, 1000);
      srUpdateStatus();
    }
  });
};

},{"../config":36,"./debounce":47}]},{},[44])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2xhc3NsaXN0LXBvbHlmaWxsL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lbGVtZW50LWNsb3Nlc3QvZWxlbWVudC1jbG9zZXN0LmpzIiwibm9kZV9tb2R1bGVzL2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvYmVoYXZpb3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvY29tcG9zZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9kZWxlZ2F0ZUFsbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9kZWxlZ2F0ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9pZ25vcmUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3Iva2V5bWFwL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlY2VwdG9yL29uY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVzb2x2ZS1pZC1yZWZzL2luZGV4LmpzIiwicGFja2FnZXMvX3VzYS1wYXNzd29yZC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtYWNjb3JkaW9uL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1iYW5uZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWJ1dHRvbi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtY2hhcmFjdGVyLWNvdW50L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1jb21iby1ib3gvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWRhdGUtcGlja2VyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1kYXRlLXJhbmdlLXBpY2tlci9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtZmlsZS1pbnB1dC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtZm9vdGVyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1oZWFkZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWluLXBhZ2UtbmF2aWdhdGlvbi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtaW5wdXQtbWFzay9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtbGFuZ3VhZ2Utc2VsZWN0b3Ivc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLW1vZGFsL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1yYW5nZS9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2Etc2VhcmNoL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1za2lwbmF2L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS10YWJsZS9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtdGltZS1waWNrZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXRvb2x0aXAvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXZhbGlkYXRpb24vc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvaW5kZXguanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9wb2x5ZmlsbHMvY3VzdG9tLWV2ZW50LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL2VsZW1lbnQtaGlkZGVuLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL2luZGV4LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL251bWJlci1pcy1uYW4uanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9wb2x5ZmlsbHMvc3ZnNGV2ZXJ5Ym9keS5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3N0YXJ0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYWN0aXZlLWVsZW1lbnQuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvci5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2RlYm91bmNlLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW9zLWRldmljZS5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplci5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlLWZpZWxkLW1hc2suanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUtZm9ybS1pbnB1dC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZS5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3ZhbGlkYXRlLWlucHV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBLElBQUksVUFBVSxJQUFJLE1B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RSxpQkFBaUIsQ0FBQyxXQUFZLEdBQUU7TUFFekQsSUFBSSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO1FBQ3ZELGVBQWUsSUFBSSxjQUFjO01BQ25DLENBQUMsTUFBTTtRQUNMLGVBQWUsSUFBSSxnQkFBZ0I7TUFDckM7O01BRUE7TUFDQSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQzs7TUFFN0Q7TUFDQSxhQUFhLElBQUssR0FBRSxlQUFnQixJQUFHOztNQUV2QztNQUNBLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxNQUFNO1FBQ3BDLHNCQUFzQixDQUFDLFdBQVcsR0FBRyxhQUFhO01BQ3BELENBQUMsRUFBRSxJQUFJLENBQUM7TUFFUixjQUFjLENBQUMsQ0FBQztJQUNsQjtFQUNGLENBQUMsQ0FBQztBQUNKLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjEuMjAxNzA0MjdcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiB3aW5kb3cuc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmICghKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKSkge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJBbiBpbnZhbGlkIG9yIGlsbGVnYWwgc3RyaW5nIHdhcyBzcGVjaWZpZWRcIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0dG9rZW4gKz0gXCJcIjtcblx0cmV0dXJuIGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikgIT09IC0xO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikgPT09IC0xKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dG9rZW4gKz0gXCJcIjtcblxuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufSh3aW5kb3cuc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufVxuIiwiLy8gZWxlbWVudC1jbG9zZXN0IHwgQ0MwLTEuMCB8IGdpdGh1Yi5jb20vam9uYXRoYW50bmVhbC9jbG9zZXN0XG5cbihmdW5jdGlvbiAoRWxlbWVudFByb3RvKSB7XG5cdGlmICh0eXBlb2YgRWxlbWVudFByb3RvLm1hdGNoZXMgIT09ICdmdW5jdGlvbicpIHtcblx0XHRFbGVtZW50UHJvdG8ubWF0Y2hlcyA9IEVsZW1lbnRQcm90by5tc01hdGNoZXNTZWxlY3RvciB8fCBFbGVtZW50UHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yIHx8IEVsZW1lbnRQcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgZnVuY3Rpb24gbWF0Y2hlcyhzZWxlY3Rvcikge1xuXHRcdFx0dmFyIGVsZW1lbnQgPSB0aGlzO1xuXHRcdFx0dmFyIGVsZW1lbnRzID0gKGVsZW1lbnQuZG9jdW1lbnQgfHwgZWxlbWVudC5vd25lckRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdHZhciBpbmRleCA9IDA7XG5cblx0XHRcdHdoaWxlIChlbGVtZW50c1tpbmRleF0gJiYgZWxlbWVudHNbaW5kZXhdICE9PSBlbGVtZW50KSB7XG5cdFx0XHRcdCsraW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBCb29sZWFuKGVsZW1lbnRzW2luZGV4XSk7XG5cdFx0fTtcblx0fVxuXG5cdGlmICh0eXBlb2YgRWxlbWVudFByb3RvLmNsb3Nlc3QgIT09ICdmdW5jdGlvbicpIHtcblx0XHRFbGVtZW50UHJvdG8uY2xvc2VzdCA9IGZ1bmN0aW9uIGNsb3Nlc3Qoc2VsZWN0b3IpIHtcblx0XHRcdHZhciBlbGVtZW50ID0gdGhpcztcblxuXHRcdFx0d2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSkge1xuXHRcdFx0XHRpZiAoZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKSkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fTtcblx0fVxufSkod2luZG93LkVsZW1lbnQucHJvdG90eXBlKTtcbiIsIi8qIGdsb2JhbCBkZWZpbmUsIEtleWJvYXJkRXZlbnQsIG1vZHVsZSAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwgPSB7XG4gICAgcG9seWZpbGw6IHBvbHlmaWxsLFxuICAgIGtleXM6IHtcbiAgICAgIDM6ICdDYW5jZWwnLFxuICAgICAgNjogJ0hlbHAnLFxuICAgICAgODogJ0JhY2tzcGFjZScsXG4gICAgICA5OiAnVGFiJyxcbiAgICAgIDEyOiAnQ2xlYXInLFxuICAgICAgMTM6ICdFbnRlcicsXG4gICAgICAxNjogJ1NoaWZ0JyxcbiAgICAgIDE3OiAnQ29udHJvbCcsXG4gICAgICAxODogJ0FsdCcsXG4gICAgICAxOTogJ1BhdXNlJyxcbiAgICAgIDIwOiAnQ2Fwc0xvY2snLFxuICAgICAgMjc6ICdFc2NhcGUnLFxuICAgICAgMjg6ICdDb252ZXJ0JyxcbiAgICAgIDI5OiAnTm9uQ29udmVydCcsXG4gICAgICAzMDogJ0FjY2VwdCcsXG4gICAgICAzMTogJ01vZGVDaGFuZ2UnLFxuICAgICAgMzI6ICcgJyxcbiAgICAgIDMzOiAnUGFnZVVwJyxcbiAgICAgIDM0OiAnUGFnZURvd24nLFxuICAgICAgMzU6ICdFbmQnLFxuICAgICAgMzY6ICdIb21lJyxcbiAgICAgIDM3OiAnQXJyb3dMZWZ0JyxcbiAgICAgIDM4OiAnQXJyb3dVcCcsXG4gICAgICAzOTogJ0Fycm93UmlnaHQnLFxuICAgICAgNDA6ICdBcnJvd0Rvd24nLFxuICAgICAgNDE6ICdTZWxlY3QnLFxuICAgICAgNDI6ICdQcmludCcsXG4gICAgICA0MzogJ0V4ZWN1dGUnLFxuICAgICAgNDQ6ICdQcmludFNjcmVlbicsXG4gICAgICA0NTogJ0luc2VydCcsXG4gICAgICA0NjogJ0RlbGV0ZScsXG4gICAgICA0ODogWycwJywgJyknXSxcbiAgICAgIDQ5OiBbJzEnLCAnISddLFxuICAgICAgNTA6IFsnMicsICdAJ10sXG4gICAgICA1MTogWyczJywgJyMnXSxcbiAgICAgIDUyOiBbJzQnLCAnJCddLFxuICAgICAgNTM6IFsnNScsICclJ10sXG4gICAgICA1NDogWyc2JywgJ14nXSxcbiAgICAgIDU1OiBbJzcnLCAnJiddLFxuICAgICAgNTY6IFsnOCcsICcqJ10sXG4gICAgICA1NzogWyc5JywgJygnXSxcbiAgICAgIDkxOiAnT1MnLFxuICAgICAgOTM6ICdDb250ZXh0TWVudScsXG4gICAgICAxNDQ6ICdOdW1Mb2NrJyxcbiAgICAgIDE0NTogJ1Njcm9sbExvY2snLFxuICAgICAgMTgxOiAnVm9sdW1lTXV0ZScsXG4gICAgICAxODI6ICdWb2x1bWVEb3duJyxcbiAgICAgIDE4MzogJ1ZvbHVtZVVwJyxcbiAgICAgIDE4NjogWyc7JywgJzonXSxcbiAgICAgIDE4NzogWyc9JywgJysnXSxcbiAgICAgIDE4ODogWycsJywgJzwnXSxcbiAgICAgIDE4OTogWyctJywgJ18nXSxcbiAgICAgIDE5MDogWycuJywgJz4nXSxcbiAgICAgIDE5MTogWycvJywgJz8nXSxcbiAgICAgIDE5MjogWydgJywgJ34nXSxcbiAgICAgIDIxOTogWydbJywgJ3snXSxcbiAgICAgIDIyMDogWydcXFxcJywgJ3wnXSxcbiAgICAgIDIyMTogWyddJywgJ30nXSxcbiAgICAgIDIyMjogW1wiJ1wiLCAnXCInXSxcbiAgICAgIDIyNDogJ01ldGEnLFxuICAgICAgMjI1OiAnQWx0R3JhcGgnLFxuICAgICAgMjQ2OiAnQXR0bicsXG4gICAgICAyNDc6ICdDclNlbCcsXG4gICAgICAyNDg6ICdFeFNlbCcsXG4gICAgICAyNDk6ICdFcmFzZUVvZicsXG4gICAgICAyNTA6ICdQbGF5JyxcbiAgICAgIDI1MTogJ1pvb21PdXQnXG4gICAgfVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIGtleXMgKEYxLTI0KS5cbiAgdmFyIGk7XG4gIGZvciAoaSA9IDE7IGkgPCAyNTsgaSsrKSB7XG4gICAga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsLmtleXNbMTExICsgaV0gPSAnRicgKyBpO1xuICB9XG5cbiAgLy8gUHJpbnRhYmxlIEFTQ0lJIGNoYXJhY3RlcnMuXG4gIHZhciBsZXR0ZXIgPSAnJztcbiAgZm9yIChpID0gNjU7IGkgPCA5MTsgaSsrKSB7XG4gICAgbGV0dGVyID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcbiAgICBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwua2V5c1tpXSA9IFtsZXR0ZXIudG9Mb3dlckNhc2UoKSwgbGV0dGVyLnRvVXBwZXJDYXNlKCldO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWZpbGwgKCkge1xuICAgIGlmICghKCdLZXlib2FyZEV2ZW50JyBpbiB3aW5kb3cpIHx8XG4gICAgICAgICdrZXknIGluIEtleWJvYXJkRXZlbnQucHJvdG90eXBlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUG9seWZpbGwgYGtleWAgb24gYEtleWJvYXJkRXZlbnRgLlxuICAgIHZhciBwcm90byA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbC5rZXlzW3RoaXMud2hpY2ggfHwgdGhpcy5rZXlDb2RlXTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgICAga2V5ID0ga2V5Wyt0aGlzLnNoaWZ0S2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoS2V5Ym9hcmRFdmVudC5wcm90b3R5cGUsICdrZXknLCBwcm90byk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgna2V5Ym9hcmRldmVudC1rZXktcG9seWZpbGwnLCBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0ga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsO1xuICB9IGVsc2UgaWYgKHdpbmRvdykge1xuICAgIHdpbmRvdy5rZXlib2FyZGV2ZW50S2V5UG9seWZpbGwgPSBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGw7XG4gIH1cblxufSkoKTtcbiIsIi8qXG5vYmplY3QtYXNzaWduXG4oYykgU2luZHJlIFNvcmh1c1xuQGxpY2Vuc2UgTUlUXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGdldE93blByb3BlcnR5U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5jb25zdCBkZWxlZ2F0ZSA9IHJlcXVpcmUoJy4uL2RlbGVnYXRlJyk7XG5jb25zdCBkZWxlZ2F0ZUFsbCA9IHJlcXVpcmUoJy4uL2RlbGVnYXRlQWxsJyk7XG5cbmNvbnN0IERFTEVHQVRFX1BBVFRFUk4gPSAvXiguKyk6ZGVsZWdhdGVcXCgoLispXFwpJC87XG5jb25zdCBTUEFDRSA9ICcgJztcblxuY29uc3QgZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbWF0Y2ggPSB0eXBlLm1hdGNoKERFTEVHQVRFX1BBVFRFUk4pO1xuICB2YXIgc2VsZWN0b3I7XG4gIGlmIChtYXRjaCkge1xuICAgIHR5cGUgPSBtYXRjaFsxXTtcbiAgICBzZWxlY3RvciA9IG1hdGNoWzJdO1xuICB9XG5cbiAgdmFyIG9wdGlvbnM7XG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ29iamVjdCcpIHtcbiAgICBvcHRpb25zID0ge1xuICAgICAgY2FwdHVyZTogcG9wS2V5KGhhbmRsZXIsICdjYXB0dXJlJyksXG4gICAgICBwYXNzaXZlOiBwb3BLZXkoaGFuZGxlciwgJ3Bhc3NpdmUnKVxuICAgIH07XG4gIH1cblxuICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgIGRlbGVnYXRlOiAodHlwZW9mIGhhbmRsZXIgPT09ICdvYmplY3QnKVxuICAgICAgPyBkZWxlZ2F0ZUFsbChoYW5kbGVyKVxuICAgICAgOiBzZWxlY3RvclxuICAgICAgICA/IGRlbGVnYXRlKHNlbGVjdG9yLCBoYW5kbGVyKVxuICAgICAgICA6IGhhbmRsZXIsXG4gICAgb3B0aW9uczogb3B0aW9uc1xuICB9O1xuXG4gIGlmICh0eXBlLmluZGV4T2YoU1BBQ0UpID4gLTEpIHtcbiAgICByZXR1cm4gdHlwZS5zcGxpdChTUEFDRSkubWFwKGZ1bmN0aW9uKF90eXBlKSB7XG4gICAgICByZXR1cm4gYXNzaWduKHt0eXBlOiBfdHlwZX0sIGxpc3RlbmVyKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBsaXN0ZW5lci50eXBlID0gdHlwZTtcbiAgICByZXR1cm4gW2xpc3RlbmVyXTtcbiAgfVxufTtcblxudmFyIHBvcEtleSA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICBkZWxldGUgb2JqW2tleV07XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmVoYXZpb3IoZXZlbnRzLCBwcm9wcykge1xuICBjb25zdCBsaXN0ZW5lcnMgPSBPYmplY3Qua2V5cyhldmVudHMpXG4gICAgLnJlZHVjZShmdW5jdGlvbihtZW1vLCB0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gZ2V0TGlzdGVuZXJzKHR5cGUsIGV2ZW50c1t0eXBlXSk7XG4gICAgICByZXR1cm4gbWVtby5jb25jYXQobGlzdGVuZXJzKTtcbiAgICB9LCBbXSk7XG5cbiAgcmV0dXJuIGFzc2lnbih7XG4gICAgYWRkOiBmdW5jdGlvbiBhZGRCZWhhdmlvcihlbGVtZW50KSB7XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgbGlzdGVuZXIudHlwZSxcbiAgICAgICAgICBsaXN0ZW5lci5kZWxlZ2F0ZSxcbiAgICAgICAgICBsaXN0ZW5lci5vcHRpb25zXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlQmVoYXZpb3IoZWxlbWVudCkge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAgIGxpc3RlbmVyLnR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIuZGVsZWdhdGUsXG4gICAgICAgICAgbGlzdGVuZXIub3B0aW9uc1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCBwcm9wcyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb21wb3NlKGZ1bmN0aW9ucykge1xuICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgIHJldHVybiBmdW5jdGlvbnMuc29tZShmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZSkgPT09IGZhbHNlO1xuICAgIH0sIHRoaXMpO1xuICB9O1xufTtcbiIsImNvbnN0IGRlbGVnYXRlID0gcmVxdWlyZSgnLi4vZGVsZWdhdGUnKTtcbmNvbnN0IGNvbXBvc2UgPSByZXF1aXJlKCcuLi9jb21wb3NlJyk7XG5cbmNvbnN0IFNQTEFUID0gJyonO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbGVnYXRlQWxsKHNlbGVjdG9ycykge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc2VsZWN0b3JzKVxuXG4gIC8vIFhYWCBvcHRpbWl6YXRpb246IGlmIHRoZXJlIGlzIG9ubHkgb25lIGhhbmRsZXIgYW5kIGl0IGFwcGxpZXMgdG9cbiAgLy8gYWxsIGVsZW1lbnRzICh0aGUgXCIqXCIgQ1NTIHNlbGVjdG9yKSwgdGhlbiBqdXN0IHJldHVybiB0aGF0XG4gIC8vIGhhbmRsZXJcbiAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFNQTEFUKSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yc1tTUExBVF07XG4gIH1cblxuICBjb25zdCBkZWxlZ2F0ZXMgPSBrZXlzLnJlZHVjZShmdW5jdGlvbihtZW1vLCBzZWxlY3Rvcikge1xuICAgIG1lbW8ucHVzaChkZWxlZ2F0ZShzZWxlY3Rvciwgc2VsZWN0b3JzW3NlbGVjdG9yXSkpO1xuICAgIHJldHVybiBtZW1vO1xuICB9LCBbXSk7XG4gIHJldHVybiBjb21wb3NlKGRlbGVnYXRlcyk7XG59O1xuIiwiLy8gcG9seWZpbGwgRWxlbWVudC5wcm90b3R5cGUuY2xvc2VzdFxucmVxdWlyZSgnZWxlbWVudC1jbG9zZXN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVsZWdhdGUoc2VsZWN0b3IsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBkZWxlZ2F0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KHNlbGVjdG9yKTtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0YXJnZXQsIGV2ZW50KTtcbiAgICB9XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlnbm9yZShlbGVtZW50LCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gaWdub3JhbmNlKGUpIHtcbiAgICBpZiAoZWxlbWVudCAhPT0gZS50YXJnZXQgJiYgIWVsZW1lbnQuY29udGFpbnMoZS50YXJnZXQpKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBlKTtcbiAgICB9XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJlaGF2aW9yOiAgICAgcmVxdWlyZSgnLi9iZWhhdmlvcicpLFxuICBkZWxlZ2F0ZTogICAgIHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcbiAgZGVsZWdhdGVBbGw6ICByZXF1aXJlKCcuL2RlbGVnYXRlQWxsJyksXG4gIGlnbm9yZTogICAgICAgcmVxdWlyZSgnLi9pZ25vcmUnKSxcbiAga2V5bWFwOiAgICAgICByZXF1aXJlKCcuL2tleW1hcCcpLFxufTtcbiIsInJlcXVpcmUoJ2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsJyk7XG5cbi8vIHRoZXNlIGFyZSB0aGUgb25seSByZWxldmFudCBtb2RpZmllcnMgc3VwcG9ydGVkIG9uIGFsbCBwbGF0Zm9ybXMsXG4vLyBhY2NvcmRpbmcgdG8gTUROOlxuLy8gPGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9LZXlib2FyZEV2ZW50L2dldE1vZGlmaWVyU3RhdGU+XG5jb25zdCBNT0RJRklFUlMgPSB7XG4gICdBbHQnOiAgICAgICdhbHRLZXknLFxuICAnQ29udHJvbCc6ICAnY3RybEtleScsXG4gICdDdHJsJzogICAgICdjdHJsS2V5JyxcbiAgJ1NoaWZ0JzogICAgJ3NoaWZ0S2V5J1xufTtcblxuY29uc3QgTU9ESUZJRVJfU0VQQVJBVE9SID0gJysnO1xuXG5jb25zdCBnZXRFdmVudEtleSA9IGZ1bmN0aW9uKGV2ZW50LCBoYXNNb2RpZmllcnMpIHtcbiAgdmFyIGtleSA9IGV2ZW50LmtleTtcbiAgaWYgKGhhc01vZGlmaWVycykge1xuICAgIGZvciAodmFyIG1vZGlmaWVyIGluIE1PRElGSUVSUykge1xuICAgICAgaWYgKGV2ZW50W01PRElGSUVSU1ttb2RpZmllcl1dID09PSB0cnVlKSB7XG4gICAgICAgIGtleSA9IFttb2RpZmllciwga2V5XS5qb2luKE1PRElGSUVSX1NFUEFSQVRPUik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBrZXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleW1hcChrZXlzKSB7XG4gIGNvbnN0IGhhc01vZGlmaWVycyA9IE9iamVjdC5rZXlzKGtleXMpLnNvbWUoZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGtleS5pbmRleE9mKE1PRElGSUVSX1NFUEFSQVRPUikgPiAtMTtcbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBrZXkgPSBnZXRFdmVudEtleShldmVudCwgaGFzTW9kaWZpZXJzKTtcbiAgICByZXR1cm4gW2tleSwga2V5LnRvTG93ZXJDYXNlKCldXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKHJlc3VsdCwgX2tleSkge1xuICAgICAgICBpZiAoX2tleSBpbiBrZXlzKSB7XG4gICAgICAgICAgcmVzdWx0ID0ga2V5c1trZXldLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCB1bmRlZmluZWQpO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMuTU9ESUZJRVJTID0gTU9ESUZJRVJTO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlKGxpc3RlbmVyLCBvcHRpb25zKSB7XG4gIHZhciB3cmFwcGVkID0gZnVuY3Rpb24gd3JhcHBlZE9uY2UoZSkge1xuICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGUudHlwZSwgd3JhcHBlZCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGxpc3RlbmVyLmNhbGwodGhpcywgZSk7XG4gIH07XG4gIHJldHVybiB3cmFwcGVkO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUkVfVFJJTSA9IC8oXlxccyspfChcXHMrJCkvZztcbnZhciBSRV9TUExJVCA9IC9cXHMrLztcblxudmFyIHRyaW0gPSBTdHJpbmcucHJvdG90eXBlLnRyaW1cbiAgPyBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0ci50cmltKCk7IH1cbiAgOiBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKFJFX1RSSU0sICcnKTsgfTtcblxudmFyIHF1ZXJ5QnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIicgKyBpZC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgKyAnXCJdJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlc29sdmVJZHMoaWRzLCBkb2MpIHtcbiAgaWYgKHR5cGVvZiBpZHMgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBhIHN0cmluZyBidXQgZ290ICcgKyAodHlwZW9mIGlkcykpO1xuICB9XG5cbiAgaWYgKCFkb2MpIHtcbiAgICBkb2MgPSB3aW5kb3cuZG9jdW1lbnQ7XG4gIH1cblxuICB2YXIgZ2V0RWxlbWVudEJ5SWQgPSBkb2MuZ2V0RWxlbWVudEJ5SWRcbiAgICA/IGRvYy5nZXRFbGVtZW50QnlJZC5iaW5kKGRvYylcbiAgICA6IHF1ZXJ5QnlJZC5iaW5kKGRvYyk7XG5cbiAgaWRzID0gdHJpbShpZHMpLnNwbGl0KFJFX1NQTElUKTtcblxuICAvLyBYWFggd2UgY2FuIHNob3J0LWNpcmN1aXQgaGVyZSBiZWNhdXNlIHRyaW1taW5nIGFuZCBzcGxpdHRpbmcgYVxuICAvLyBzdHJpbmcgb2YganVzdCB3aGl0ZXNwYWNlIHByb2R1Y2VzIGFuIGFycmF5IGNvbnRhaW5pbmcgYSBzaW5nbGUsXG4gIC8vIGVtcHR5IHN0cmluZ1xuICBpZiAoaWRzLmxlbmd0aCA9PT0gMSAmJiBpZHNbMF0gPT09ICcnKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGlkc1xuICAgIC5tYXAoZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBlbCA9IGdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBlbGVtZW50IHdpdGggaWQ6IFwiJyArIGlkICsgJ1wiJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWw7XG4gICAgfSk7XG59O1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XHJcbmNvbnN0IHRvZ2dsZUZvcm1JbnB1dCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUtZm9ybS1pbnB1dFwiKTtcclxuXHJcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcblxyXG5jb25zdCBMSU5LID0gYC4ke1BSRUZJWH0tc2hvdy1wYXNzd29yZGA7XHJcblxyXG5mdW5jdGlvbiB0b2dnbGUoZXZlbnQpIHtcclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIHRvZ2dsZUZvcm1JbnB1dCh0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBiZWhhdmlvcih7XHJcbiAgW0NMSUNLXToge1xyXG4gICAgW0xJTktdOiB0b2dnbGUsXHJcbiAgfSxcclxufSk7XHJcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XHJcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5jb25zdCB0b2dnbGUgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlXCIpO1xyXG5jb25zdCBpc0VsZW1lbnRJblZpZXdwb3J0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0XCIpO1xyXG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xyXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xyXG5cclxuY29uc3QgQUNDT1JESU9OID0gYC4ke1BSRUZJWH0tYWNjb3JkaW9uLCAuJHtQUkVGSVh9LWFjY29yZGlvbi0tYm9yZGVyZWRgO1xyXG5jb25zdCBCQU5ORVJfQlVUVE9OID0gYC4ke1BSRUZJWH0tYmFubmVyX19idXR0b25gO1xyXG5jb25zdCBCVVRUT04gPSBgLiR7UFJFRklYfS1hY2NvcmRpb25fX2J1dHRvblthcmlhLWNvbnRyb2xzXTpub3QoJHtCQU5ORVJfQlVUVE9OfSlgO1xyXG5jb25zdCBFWFBBTkRFRCA9IFwiYXJpYS1leHBhbmRlZFwiO1xyXG5jb25zdCBNVUxUSVNFTEVDVEFCTEUgPSBcImRhdGEtYWxsb3ctbXVsdGlwbGVcIjtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYW4gQXJyYXkgb2YgYnV0dG9uIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cclxuICogYWNjb3JkaW9uIGVsZW1lbnQuXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGFjY29yZGlvblxyXG4gKiBAcmV0dXJuIHthcnJheTxIVE1MQnV0dG9uRWxlbWVudD59XHJcbiAqL1xyXG5jb25zdCBnZXRBY2NvcmRpb25CdXR0b25zID0gKGFjY29yZGlvbikgPT4ge1xyXG4gIGNvbnN0IGJ1dHRvbnMgPSBzZWxlY3QoQlVUVE9OLCBhY2NvcmRpb24pO1xyXG5cclxuICByZXR1cm4gYnV0dG9ucy5maWx0ZXIoKGJ1dHRvbikgPT4gYnV0dG9uLmNsb3Nlc3QoQUNDT1JESU9OKSA9PT0gYWNjb3JkaW9uKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUb2dnbGUgYSBidXR0b24ncyBcInByZXNzZWRcIiBzdGF0ZSwgb3B0aW9uYWxseSBwcm92aWRpbmcgYSB0YXJnZXRcclxuICogc3RhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGJ1dHRvblxyXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBleHBhbmRlZCBJZiBubyBzdGF0ZSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnRcclxuICogc3RhdGUgd2lsbCBiZSB0b2dnbGVkIChmcm9tIGZhbHNlIHRvIHRydWUsIGFuZCB2aWNlLXZlcnNhKS5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHJlc3VsdGluZyBzdGF0ZVxyXG4gKi9cclxuY29uc3QgdG9nZ2xlQnV0dG9uID0gKGJ1dHRvbiwgZXhwYW5kZWQpID0+IHtcclxuICBjb25zdCBhY2NvcmRpb24gPSBidXR0b24uY2xvc2VzdChBQ0NPUkRJT04pO1xyXG4gIGxldCBzYWZlRXhwYW5kZWQgPSBleHBhbmRlZDtcclxuXHJcbiAgaWYgKCFhY2NvcmRpb24pIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgJHtCVVRUT059IGlzIG1pc3Npbmcgb3V0ZXIgJHtBQ0NPUkRJT059YCk7XHJcbiAgfVxyXG5cclxuICBzYWZlRXhwYW5kZWQgPSB0b2dnbGUoYnV0dG9uLCBleHBhbmRlZCk7XHJcblxyXG4gIC8vIFhYWCBtdWx0aXNlbGVjdGFibGUgaXMgb3B0LWluLCB0byBwcmVzZXJ2ZSBsZWdhY3kgYmVoYXZpb3JcclxuICBjb25zdCBtdWx0aXNlbGVjdGFibGUgPSBhY2NvcmRpb24uaGFzQXR0cmlidXRlKE1VTFRJU0VMRUNUQUJMRSk7XHJcblxyXG4gIGlmIChzYWZlRXhwYW5kZWQgJiYgIW11bHRpc2VsZWN0YWJsZSkge1xyXG4gICAgZ2V0QWNjb3JkaW9uQnV0dG9ucyhhY2NvcmRpb24pLmZvckVhY2goKG90aGVyKSA9PiB7XHJcbiAgICAgIGlmIChvdGhlciAhPT0gYnV0dG9uKSB7XHJcbiAgICAgICAgdG9nZ2xlKG90aGVyLCBmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBidXR0b25cclxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZVxyXG4gKi9cclxuY29uc3Qgc2hvd0J1dHRvbiA9IChidXR0b24pID0+IHRvZ2dsZUJ1dHRvbihidXR0b24sIHRydWUpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGJ1dHRvblxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBmYWxzZVxyXG4gKi9cclxuY29uc3QgaGlkZUJ1dHRvbiA9IChidXR0b24pID0+IHRvZ2dsZUJ1dHRvbihidXR0b24sIGZhbHNlKTtcclxuXHJcbmNvbnN0IGFjY29yZGlvbiA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIFtDTElDS106IHtcclxuICAgICAgW0JVVFRPTl0oKSB7XHJcbiAgICAgICAgdG9nZ2xlQnV0dG9uKHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5nZXRBdHRyaWJ1dGUoRVhQQU5ERUQpID09PSBcInRydWVcIikge1xyXG4gICAgICAgICAgLy8gV2Ugd2VyZSBqdXN0IGV4cGFuZGVkLCBidXQgaWYgYW5vdGhlciBhY2NvcmRpb24gd2FzIGFsc28ganVzdFxyXG4gICAgICAgICAgLy8gY29sbGFwc2VkLCB3ZSBtYXkgbm8gbG9uZ2VyIGJlIGluIHRoZSB2aWV3cG9ydC4gVGhpcyBlbnN1cmVzXHJcbiAgICAgICAgICAvLyB0aGF0IHdlIGFyZSBzdGlsbCB2aXNpYmxlLCBzbyB0aGUgdXNlciBpc24ndCBjb25mdXNlZC5cclxuICAgICAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0aGlzKSkgdGhpcy5zY3JvbGxJbnRvVmlldygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpbml0KHJvb3QpIHtcclxuICAgICAgc2VsZWN0KEJVVFRPTiwgcm9vdCkuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZXhwYW5kZWQgPSBidXR0b24uZ2V0QXR0cmlidXRlKEVYUEFOREVEKSA9PT0gXCJ0cnVlXCI7XHJcbiAgICAgICAgdG9nZ2xlQnV0dG9uKGJ1dHRvbiwgZXhwYW5kZWQpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBBQ0NPUkRJT04sXHJcbiAgICBCVVRUT04sXHJcbiAgICBzaG93OiBzaG93QnV0dG9uLFxyXG4gICAgaGlkZTogaGlkZUJ1dHRvbixcclxuICAgIHRvZ2dsZTogdG9nZ2xlQnV0dG9uLFxyXG4gICAgZ2V0QnV0dG9uczogZ2V0QWNjb3JkaW9uQnV0dG9ucyxcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFjY29yZGlvbjtcclxuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XHJcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XHJcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XHJcblxyXG5jb25zdCBIRUFERVIgPSBgLiR7UFJFRklYfS1iYW5uZXJfX2hlYWRlcmA7XHJcbmNvbnN0IEVYUEFOREVEX0NMQVNTID0gYCR7UFJFRklYfS1iYW5uZXJfX2hlYWRlci0tZXhwYW5kZWRgO1xyXG5jb25zdCBCQU5ORVJfQlVUVE9OID0gYCR7SEVBREVSfSBbYXJpYS1jb250cm9sc11gO1xyXG5cclxuLyoqXHJcbiAqIFRvZ2dsZSBCYW5uZXIgZGlzcGxheSBhbmQgY2xhc3MuXHJcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XHJcbiAqL1xyXG5jb25zdCB0b2dnbGVCYW5uZXIgPSBmdW5jdGlvbiB0b2dnbGVFbChldmVudCkge1xyXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgY29uc3QgdHJpZ2dlciA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KEJBTk5FUl9CVVRUT04pO1xyXG5cclxuICB0b2dnbGUodHJpZ2dlcik7XHJcbiAgdGhpcy5jbG9zZXN0KEhFQURFUikuY2xhc3NMaXN0LnRvZ2dsZShFWFBBTkRFRF9DTEFTUyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIFtDTElDS106IHtcclxuICAgICAgW0JBTk5FUl9CVVRUT05dOiB0b2dnbGVCYW5uZXIsXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaW5pdChyb290KSB7XHJcbiAgICAgIC8vIHNlbGVjdChCQU5ORVJfQlVUVE9OLCByb290KS5mb3JFYWNoKChidXR0b24pID0+IHtcclxuICAgICAgLy8gICBjb25zdCBleHBhbmRlZCA9IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoRVhQQU5ERURfQ0xBU1MpID09PSBcInRydWVcIjtcclxuICAgICAgLy8gICB0b2dnbGUoYnV0dG9uLCBleHBhbmRlZCk7XHJcbiAgICAgIC8vIH0pO1xyXG4gICAgfSxcclxuICB9XHJcbik7XHJcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XHJcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5cclxuY29uc3QgQU5DSE9SX0JVVFRPTiA9IGBhW2NsYXNzKj1cInVzYS1idXR0b25cIl1gO1xyXG5cclxuY29uc3QgdG9nZ2xlQnV0dG9uID0gKGV2ZW50KSA9PiB7XHJcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICBldmVudC50YXJnZXQuY2xpY2soKTtcclxufTtcclxuXHJcbmNvbnN0IGFuY2hvckJ1dHRvbiA9IGJlaGF2aW9yKHtcclxuICBrZXlkb3duOiB7XHJcbiAgICBbQU5DSE9SX0JVVFRPTl06IGtleW1hcCh7XHJcbiAgICAgIFwiIFwiOiB0b2dnbGVCdXR0b24sXHJcbiAgICB9KSxcclxuICB9LFxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYW5jaG9yQnV0dG9uO1xyXG4iLCJjb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgZGVib3VuY2UgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZGVib3VuY2VcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcblxyXG5jb25zdCBDSEFSQUNURVJfQ09VTlRfQ0xBU1MgPSBgJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudGA7XHJcbmNvbnN0IENIQVJBQ1RFUl9DT1VOVCA9IGAuJHtDSEFSQUNURVJfQ09VTlRfQ0xBU1N9YDtcclxuY29uc3QgSU5QVVQgPSBgLiR7UFJFRklYfS1jaGFyYWN0ZXItY291bnRfX2ZpZWxkYDtcclxuY29uc3QgTUVTU0FHRSA9IGAuJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudF9fbWVzc2FnZWA7XHJcbmNvbnN0IFZBTElEQVRJT05fTUVTU0FHRSA9IFwiVGhlIGNvbnRlbnQgaXMgdG9vIGxvbmcuXCI7XHJcbmNvbnN0IE1FU1NBR0VfSU5WQUxJRF9DTEFTUyA9IGAke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50X19zdGF0dXMtLWludmFsaWRgO1xyXG5jb25zdCBTVEFUVVNfTUVTU0FHRV9DTEFTUyA9IGAke0NIQVJBQ1RFUl9DT1VOVF9DTEFTU31fX3N0YXR1c2A7XHJcbmNvbnN0IFNUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1MgPSBgJHtDSEFSQUNURVJfQ09VTlRfQ0xBU1N9X19zci1zdGF0dXNgO1xyXG5jb25zdCBTVEFUVVNfTUVTU0FHRSA9IGAuJHtTVEFUVVNfTUVTU0FHRV9DTEFTU31gO1xyXG5jb25zdCBTVEFUVVNfTUVTU0FHRV9TUl9PTkxZID0gYC4ke1NUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1N9YDtcclxuY29uc3QgREVGQVVMVF9TVEFUVVNfTEFCRUwgPSBgY2hhcmFjdGVycyBhbGxvd2VkYDtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSByb290IGFuZCBtZXNzYWdlIGVsZW1lbnQgZm9yIGFuIGNoYXJhY3RlciBjb3VudCBpbnB1dFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR8SFRNTFRleHRBcmVhRWxlbWVudH0gaW5wdXRFbCBUaGUgY2hhcmFjdGVyIGNvdW50IGlucHV0IGVsZW1lbnRcclxuICogQHJldHVybnMge0NoYXJhY3RlckNvdW50RWxlbWVudHN9IGVsZW1lbnRzIFRoZSByb290IGFuZCBtZXNzYWdlIGVsZW1lbnQuXHJcbiAqL1xyXG5jb25zdCBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzID0gKGlucHV0RWwpID0+IHtcclxuICBjb25zdCBjaGFyYWN0ZXJDb3VudEVsID0gaW5wdXRFbC5jbG9zZXN0KENIQVJBQ1RFUl9DT1VOVCk7XHJcblxyXG4gIGlmICghY2hhcmFjdGVyQ291bnRFbCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0lOUFVUfSBpcyBtaXNzaW5nIG91dGVyICR7Q0hBUkFDVEVSX0NPVU5UfWApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbWVzc2FnZUVsID0gY2hhcmFjdGVyQ291bnRFbC5xdWVyeVNlbGVjdG9yKE1FU1NBR0UpO1xyXG5cclxuICBpZiAoIW1lc3NhZ2VFbCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0NIQVJBQ1RFUl9DT1VOVH0gaXMgbWlzc2luZyBpbm5lciAke01FU1NBR0V9YCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBjaGFyYWN0ZXJDb3VudEVsLCBtZXNzYWdlRWwgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNb3ZlIG1heGxlbmd0aCBhdHRyaWJ1dGUgdG8gYSBkYXRhIGF0dHJpYnV0ZSBvbiB1c2EtY2hhcmFjdGVyLWNvdW50XHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxyXG4gKi9cclxuY29uc3Qgc2V0RGF0YUxlbmd0aCA9IChpbnB1dEVsKSA9PiB7XHJcbiAgY29uc3QgeyBjaGFyYWN0ZXJDb3VudEVsIH0gPSBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzKGlucHV0RWwpO1xyXG5cclxuICBjb25zdCBtYXhsZW5ndGggPSBpbnB1dEVsLmdldEF0dHJpYnV0ZShcIm1heGxlbmd0aFwiKTtcclxuXHJcbiAgaWYgKCFtYXhsZW5ndGgpIHJldHVybjtcclxuXHJcbiAgaW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoXCJtYXhsZW5ndGhcIik7XHJcbiAgY2hhcmFjdGVyQ291bnRFbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1heGxlbmd0aFwiLCBtYXhsZW5ndGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbmQgYXBwZW5kIHN0YXR1cyBtZXNzYWdlcyBmb3IgdmlzdWFsIGFuZCBzY3JlZW4gcmVhZGVyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBjaGFyYWN0ZXJDb3VudEVsIC0gRGl2IHdpdGggYC51c2EtY2hhcmFjdGVyLWNvdW50YCBjbGFzc1xyXG4gKiBAZGVzY3JpcHRpb24gIENyZWF0ZSB0d28gc3RhdHVzIG1lc3NhZ2VzIGZvciBudW1iZXIgb2YgY2hhcmFjdGVycyBsZWZ0O1xyXG4gKiBvbmUgdmlzdWFsIHN0YXR1cyBhbmQgYW5vdGhlciBmb3Igc2NyZWVuIHJlYWRlcnNcclxuICovXHJcbmNvbnN0IGNyZWF0ZVN0YXR1c01lc3NhZ2VzID0gKGNoYXJhY3RlckNvdW50RWwpID0+IHtcclxuICBjb25zdCBzdGF0dXNNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjb25zdCBzclN0YXR1c01lc3NhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGNvbnN0IG1heExlbmd0aCA9IGNoYXJhY3RlckNvdW50RWwuZGF0YXNldC5tYXhsZW5ndGg7XHJcbiAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgJHttYXhMZW5ndGh9ICR7REVGQVVMVF9TVEFUVVNfTEFCRUx9YDtcclxuXHJcbiAgc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QuYWRkKGAke1NUQVRVU19NRVNTQUdFX0NMQVNTfWAsIFwidXNhLWhpbnRcIik7XHJcbiAgc3JTdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoXHJcbiAgICBgJHtTVEFUVVNfTUVTU0FHRV9TUl9PTkxZX0NMQVNTfWAsXHJcbiAgICBcInVzYS1zci1vbmx5XCJcclxuICApO1xyXG5cclxuICBzdGF0dXNNZXNzYWdlLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIHRydWUpO1xyXG4gIHNyU3RhdHVzTWVzc2FnZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XHJcblxyXG4gIHN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBkZWZhdWx0TWVzc2FnZTtcclxuICBzclN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBkZWZhdWx0TWVzc2FnZTtcclxuXHJcbiAgY2hhcmFjdGVyQ291bnRFbC5hcHBlbmQoc3RhdHVzTWVzc2FnZSwgc3JTdGF0dXNNZXNzYWdlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIG1lc3NhZ2Ugd2l0aCBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0XHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50TGVuZ3RoIC0gVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIHVzZWRcclxuICogQHBhcmFtIHtudW1iZXJ9IG1heExlbmd0aCAtIFRoZSB0b3RhbCBudW1iZXIgb2YgY2hhcmFjdGVycyBhbGxvd2VkXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEEgc3RyaW5nIGRlc2NyaXB0aW9uIG9mIGhvdyBtYW55IGNoYXJhY3RlcnMgYXJlIGxlZnRcclxuICovXHJcbmNvbnN0IGdldENvdW50TWVzc2FnZSA9IChjdXJyZW50TGVuZ3RoLCBtYXhMZW5ndGgpID0+IHtcclxuICBsZXQgbmV3TWVzc2FnZSA9IFwiXCI7XHJcblxyXG4gIGlmIChjdXJyZW50TGVuZ3RoID09PSAwKSB7XHJcbiAgICBuZXdNZXNzYWdlID0gYCR7bWF4TGVuZ3RofSAke0RFRkFVTFRfU1RBVFVTX0xBQkVMfWA7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IGRpZmZlcmVuY2UgPSBNYXRoLmFicyhtYXhMZW5ndGggLSBjdXJyZW50TGVuZ3RoKTtcclxuICAgIGNvbnN0IGNoYXJhY3RlcnMgPSBgY2hhcmFjdGVyJHtkaWZmZXJlbmNlID09PSAxID8gXCJcIiA6IFwic1wifWA7XHJcbiAgICBjb25zdCBndWlkYW5jZSA9IGN1cnJlbnRMZW5ndGggPiBtYXhMZW5ndGggPyBcIm92ZXIgbGltaXRcIiA6IFwibGVmdFwiO1xyXG5cclxuICAgIG5ld01lc3NhZ2UgPSBgJHtkaWZmZXJlbmNlfSAke2NoYXJhY3RlcnN9ICR7Z3VpZGFuY2V9YDtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXdNZXNzYWdlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZXMgdGhlIGNoYXJhY3RlciBjb3VudCBzdGF0dXMgZm9yIHNjcmVlbiByZWFkZXJzIGFmdGVyIGEgMTAwMG1zIGRlbGF5LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBtc2dFbCAtIFRoZSBzY3JlZW4gcmVhZGVyIHN0YXR1cyBtZXNzYWdlIGVsZW1lbnRcclxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c01lc3NhZ2UgLSBBIHN0cmluZyBvZiB0aGUgY3VycmVudCBjaGFyYWN0ZXIgc3RhdHVzXHJcbiAqL1xyXG5jb25zdCBzclVwZGF0ZVN0YXR1cyA9IGRlYm91bmNlKChtc2dFbCwgc3RhdHVzTWVzc2FnZSkgPT4ge1xyXG4gIGNvbnN0IHNyU3RhdHVzTWVzc2FnZSA9IG1zZ0VsO1xyXG4gIHNyU3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IHN0YXR1c01lc3NhZ2U7XHJcbn0sIDEwMDApO1xyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSB0aGUgY2hhcmFjdGVyIGNvdW50IGNvbXBvbmVudFxyXG4gKlxyXG4gKiBAZGVzY3JpcHRpb24gT24gaW5wdXQsIGl0IHdpbGwgdXBkYXRlIHZpc3VhbCBzdGF0dXMsIHNjcmVlbnJlYWRlclxyXG4gKiBzdGF0dXMgYW5kIHVwZGF0ZSBpbnB1dCB2YWxpZGF0aW9uIChpZiBvdmVyIGNoYXJhY3RlciBsZW5ndGgpXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxyXG4gKi9cclxuY29uc3QgdXBkYXRlQ291bnRNZXNzYWdlID0gKGlucHV0RWwpID0+IHtcclxuICBjb25zdCB7IGNoYXJhY3RlckNvdW50RWwgfSA9IGdldENoYXJhY3RlckNvdW50RWxlbWVudHMoaW5wdXRFbCk7XHJcbiAgY29uc3QgY3VycmVudExlbmd0aCA9IGlucHV0RWwudmFsdWUubGVuZ3RoO1xyXG4gIGNvbnN0IG1heExlbmd0aCA9IHBhcnNlSW50KFxyXG4gICAgY2hhcmFjdGVyQ291bnRFbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLW1heGxlbmd0aFwiKSxcclxuICAgIDEwXHJcbiAgKTtcclxuICBjb25zdCBzdGF0dXNNZXNzYWdlID0gY2hhcmFjdGVyQ291bnRFbC5xdWVyeVNlbGVjdG9yKFNUQVRVU19NRVNTQUdFKTtcclxuICBjb25zdCBzclN0YXR1c01lc3NhZ2UgPSBjaGFyYWN0ZXJDb3VudEVsLnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBTVEFUVVNfTUVTU0FHRV9TUl9PTkxZXHJcbiAgKTtcclxuICBjb25zdCBjdXJyZW50U3RhdHVzTWVzc2FnZSA9IGdldENvdW50TWVzc2FnZShjdXJyZW50TGVuZ3RoLCBtYXhMZW5ndGgpO1xyXG5cclxuICBpZiAoIW1heExlbmd0aCkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBpc092ZXJMaW1pdCA9IGN1cnJlbnRMZW5ndGggJiYgY3VycmVudExlbmd0aCA+IG1heExlbmd0aDtcclxuXHJcbiAgc3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IGN1cnJlbnRTdGF0dXNNZXNzYWdlO1xyXG4gIHNyVXBkYXRlU3RhdHVzKHNyU3RhdHVzTWVzc2FnZSwgY3VycmVudFN0YXR1c01lc3NhZ2UpO1xyXG5cclxuICBpZiAoaXNPdmVyTGltaXQgJiYgIWlucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgIGlucHV0RWwuc2V0Q3VzdG9tVmFsaWRpdHkoVkFMSURBVElPTl9NRVNTQUdFKTtcclxuICB9XHJcblxyXG4gIGlmICghaXNPdmVyTGltaXQgJiYgaW5wdXRFbC52YWxpZGF0aW9uTWVzc2FnZSA9PT0gVkFMSURBVElPTl9NRVNTQUdFKSB7XHJcbiAgICBpbnB1dEVsLnNldEN1c3RvbVZhbGlkaXR5KFwiXCIpO1xyXG4gIH1cclxuXHJcbiAgc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QudG9nZ2xlKE1FU1NBR0VfSU5WQUxJRF9DTEFTUywgaXNPdmVyTGltaXQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgY29tcG9uZW50XHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvbiBPbiBpbml0IHRoaXMgZnVuY3Rpb24gd2lsbCBjcmVhdGUgZWxlbWVudHMgYW5kIHVwZGF0ZSBhbnlcclxuICogYXR0cmlidXRlcyBzbyBpdCBjYW4gdGVsbCB0aGUgdXNlciBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0LlxyXG4gKiBAcGFyYW0gIHtIVE1MSW5wdXRFbGVtZW50fEhUTUxUZXh0QXJlYUVsZW1lbnR9IGlucHV0RWwgdGhlIGNvbXBvbmVudHMgaW5wdXRcclxuICovXHJcbmNvbnN0IGVuaGFuY2VDaGFyYWN0ZXJDb3VudCA9IChpbnB1dEVsKSA9PiB7XHJcbiAgY29uc3QgeyBjaGFyYWN0ZXJDb3VudEVsLCBtZXNzYWdlRWwgfSA9IGdldENoYXJhY3RlckNvdW50RWxlbWVudHMoaW5wdXRFbCk7XHJcblxyXG4gIC8vIEhpZGUgaGludCBhbmQgcmVtb3ZlIGFyaWEtbGl2ZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcclxuICBtZXNzYWdlRWwuY2xhc3NMaXN0LmFkZChcInVzYS1zci1vbmx5XCIpO1xyXG4gIG1lc3NhZ2VFbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIik7XHJcblxyXG4gIHNldERhdGFMZW5ndGgoaW5wdXRFbCk7XHJcbiAgY3JlYXRlU3RhdHVzTWVzc2FnZXMoY2hhcmFjdGVyQ291bnRFbCk7XHJcbn07XHJcblxyXG5jb25zdCBjaGFyYWN0ZXJDb3VudCA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIGlucHV0OiB7XHJcbiAgICAgIFtJTlBVVF0oKSB7XHJcbiAgICAgICAgdXBkYXRlQ291bnRNZXNzYWdlKHRoaXMpO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHtcclxuICAgIGluaXQocm9vdCkge1xyXG4gICAgICBzZWxlY3QoSU5QVVQsIHJvb3QpLmZvckVhY2goKGlucHV0KSA9PiBlbmhhbmNlQ2hhcmFjdGVyQ291bnQoaW5wdXQpKTtcclxuICAgIH0sXHJcbiAgICBNRVNTQUdFX0lOVkFMSURfQ0xBU1MsXHJcbiAgICBWQUxJREFUSU9OX01FU1NBR0UsXHJcbiAgICBTVEFUVVNfTUVTU0FHRV9DTEFTUyxcclxuICAgIFNUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1MsXHJcbiAgICBERUZBVUxUX1NUQVRVU19MQUJFTCxcclxuICAgIGNyZWF0ZVN0YXR1c01lc3NhZ2VzLFxyXG4gICAgZ2V0Q291bnRNZXNzYWdlLFxyXG4gICAgdXBkYXRlQ291bnRNZXNzYWdlLFxyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gY2hhcmFjdGVyQ291bnQ7XHJcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XHJcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcclxuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XHJcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XHJcblxyXG5jb25zdCBDT01CT19CT1hfQ0xBU1MgPSBgJHtQUkVGSVh9LWNvbWJvLWJveGA7XHJcbmNvbnN0IENPTUJPX0JPWF9QUklTVElORV9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU30tLXByaXN0aW5lYDtcclxuY29uc3QgU0VMRUNUX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fc2VsZWN0YDtcclxuY29uc3QgSU5QVVRfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19pbnB1dGA7XHJcbmNvbnN0IENMRUFSX0lOUFVUX0JVVFRPTl9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX2NsZWFyLWlucHV0YDtcclxuY29uc3QgQ0xFQVJfSU5QVVRfQlVUVE9OX1dSQVBQRVJfQ0xBU1MgPSBgJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9X193cmFwcGVyYDtcclxuY29uc3QgSU5QVVRfQlVUVE9OX1NFUEFSQVRPUl9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX2lucHV0LWJ1dHRvbi1zZXBhcmF0b3JgO1xyXG5jb25zdCBUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X190b2dnbGUtbGlzdGA7XHJcbmNvbnN0IFRPR0dMRV9MSVNUX0JVVFRPTl9XUkFQUEVSX0NMQVNTID0gYCR7VE9HR0xFX0xJU1RfQlVUVE9OX0NMQVNTfV9fd3JhcHBlcmA7XHJcbmNvbnN0IExJU1RfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19saXN0YDtcclxuY29uc3QgTElTVF9PUFRJT05fQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19saXN0LW9wdGlvbmA7XHJcbmNvbnN0IExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MgPSBgJHtMSVNUX09QVElPTl9DTEFTU30tLWZvY3VzZWRgO1xyXG5jb25zdCBMSVNUX09QVElPTl9TRUxFQ1RFRF9DTEFTUyA9IGAke0xJU1RfT1BUSU9OX0NMQVNTfS0tc2VsZWN0ZWRgO1xyXG5jb25zdCBTVEFUVVNfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19zdGF0dXNgO1xyXG5cclxuY29uc3QgQ09NQk9fQk9YID0gYC4ke0NPTUJPX0JPWF9DTEFTU31gO1xyXG5jb25zdCBTRUxFQ1QgPSBgLiR7U0VMRUNUX0NMQVNTfWA7XHJcbmNvbnN0IElOUFVUID0gYC4ke0lOUFVUX0NMQVNTfWA7XHJcbmNvbnN0IENMRUFSX0lOUFVUX0JVVFRPTiA9IGAuJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9YDtcclxuY29uc3QgVE9HR0xFX0xJU1RfQlVUVE9OID0gYC4ke1RPR0dMRV9MSVNUX0JVVFRPTl9DTEFTU31gO1xyXG5jb25zdCBMSVNUID0gYC4ke0xJU1RfQ0xBU1N9YDtcclxuY29uc3QgTElTVF9PUFRJT04gPSBgLiR7TElTVF9PUFRJT05fQ0xBU1N9YDtcclxuY29uc3QgTElTVF9PUFRJT05fRk9DVVNFRCA9IGAuJHtMSVNUX09QVElPTl9GT0NVU0VEX0NMQVNTfWA7XHJcbmNvbnN0IExJU1RfT1BUSU9OX1NFTEVDVEVEID0gYC4ke0xJU1RfT1BUSU9OX1NFTEVDVEVEX0NMQVNTfWA7XHJcbmNvbnN0IFNUQVRVUyA9IGAuJHtTVEFUVVNfQ0xBU1N9YDtcclxuXHJcbmNvbnN0IERFRkFVTFRfRklMVEVSID0gXCIuKnt7cXVlcnl9fS4qXCI7XHJcblxyXG5jb25zdCBub29wID0gKCkgPT4ge307XHJcblxyXG4vKipcclxuICogc2V0IHRoZSB2YWx1ZSBvZiB0aGUgZWxlbWVudCBhbmQgZGlzcGF0Y2ggYSBjaGFuZ2UgZXZlbnRcclxuICpcclxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fEhUTUxTZWxlY3RFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB0byB1cGRhdGVcclxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGVsZW1lbnRcclxuICovXHJcbmNvbnN0IGNoYW5nZUVsZW1lbnRWYWx1ZSA9IChlbCwgdmFsdWUgPSBcIlwiKSA9PiB7XHJcbiAgY29uc3QgZWxlbWVudFRvQ2hhbmdlID0gZWw7XHJcbiAgZWxlbWVudFRvQ2hhbmdlLnZhbHVlID0gdmFsdWU7XHJcblxyXG4gIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KFwiY2hhbmdlXCIsIHtcclxuICAgIGJ1YmJsZXM6IHRydWUsXHJcbiAgICBjYW5jZWxhYmxlOiB0cnVlLFxyXG4gICAgZGV0YWlsOiB7IHZhbHVlIH0sXHJcbiAgfSk7XHJcbiAgZWxlbWVudFRvQ2hhbmdlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoZSBlbGVtZW50cyB3aXRoaW4gdGhlIGNvbWJvIGJveC5cclxuICogQHR5cGVkZWYge09iamVjdH0gQ29tYm9Cb3hDb250ZXh0XHJcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IGNvbWJvQm94RWxcclxuICogQHByb3BlcnR5IHtIVE1MU2VsZWN0RWxlbWVudH0gc2VsZWN0RWxcclxuICogQHByb3BlcnR5IHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dEVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTFVMaXN0RWxlbWVudH0gbGlzdEVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IHN0YXR1c0VsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTExJRWxlbWVudH0gZm9jdXNlZE9wdGlvbkVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTExJRWxlbWVudH0gc2VsZWN0ZWRPcHRpb25FbFxyXG4gKiBAcHJvcGVydHkge0hUTUxCdXR0b25FbGVtZW50fSB0b2dnbGVMaXN0QnRuRWxcclxuICogQHByb3BlcnR5IHtIVE1MQnV0dG9uRWxlbWVudH0gY2xlYXJJbnB1dEJ0bkVsXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gaXNQcmlzdGluZVxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGRpc2FibGVGaWx0ZXJpbmdcclxuICovXHJcblxyXG4vKipcclxuICogR2V0IGFuIG9iamVjdCBvZiBlbGVtZW50cyBiZWxvbmdpbmcgZGlyZWN0bHkgdG8gdGhlIGdpdmVuXHJcbiAqIGNvbWJvIGJveCBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94XHJcbiAqIEByZXR1cm5zIHtDb21ib0JveENvbnRleHR9IGVsZW1lbnRzXHJcbiAqL1xyXG5jb25zdCBnZXRDb21ib0JveENvbnRleHQgPSAoZWwpID0+IHtcclxuICBjb25zdCBjb21ib0JveEVsID0gZWwuY2xvc2VzdChDT01CT19CT1gpO1xyXG5cclxuICBpZiAoIWNvbWJvQm94RWwpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7Q09NQk9fQk9YfWApO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VsZWN0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoU0VMRUNUKTtcclxuICBjb25zdCBpbnB1dEVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKElOUFVUKTtcclxuICBjb25zdCBsaXN0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoTElTVCk7XHJcbiAgY29uc3Qgc3RhdHVzRWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoU1RBVFVTKTtcclxuICBjb25zdCBmb2N1c2VkT3B0aW9uRWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoTElTVF9PUFRJT05fRk9DVVNFRCk7XHJcbiAgY29uc3Qgc2VsZWN0ZWRPcHRpb25FbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihMSVNUX09QVElPTl9TRUxFQ1RFRCk7XHJcbiAgY29uc3QgdG9nZ2xlTGlzdEJ0bkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFRPR0dMRV9MSVNUX0JVVFRPTik7XHJcbiAgY29uc3QgY2xlYXJJbnB1dEJ0bkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKENMRUFSX0lOUFVUX0JVVFRPTik7XHJcblxyXG4gIGNvbnN0IGlzUHJpc3RpbmUgPSBjb21ib0JveEVsLmNsYXNzTGlzdC5jb250YWlucyhDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xyXG4gIGNvbnN0IGRpc2FibGVGaWx0ZXJpbmcgPSBjb21ib0JveEVsLmRhdGFzZXQuZGlzYWJsZUZpbHRlcmluZyA9PT0gXCJ0cnVlXCI7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBjb21ib0JveEVsLFxyXG4gICAgc2VsZWN0RWwsXHJcbiAgICBpbnB1dEVsLFxyXG4gICAgbGlzdEVsLFxyXG4gICAgc3RhdHVzRWwsXHJcbiAgICBmb2N1c2VkT3B0aW9uRWwsXHJcbiAgICBzZWxlY3RlZE9wdGlvbkVsLFxyXG4gICAgdG9nZ2xlTGlzdEJ0bkVsLFxyXG4gICAgY2xlYXJJbnB1dEJ0bkVsLFxyXG4gICAgaXNQcmlzdGluZSxcclxuICAgIGRpc2FibGVGaWx0ZXJpbmcsXHJcbiAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEaXNhYmxlIHRoZSBjb21iby1ib3ggY29tcG9uZW50XHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGRpc2FibGUgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGlucHV0RWwsIHRvZ2dsZUxpc3RCdG5FbCwgY2xlYXJJbnB1dEJ0bkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xyXG5cclxuICBjbGVhcklucHV0QnRuRWwuaGlkZGVuID0gdHJ1ZTtcclxuICBjbGVhcklucHV0QnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xyXG4gIHRvZ2dsZUxpc3RCdG5FbC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgaW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2sgZm9yIGFyaWEtZGlzYWJsZWQgb24gaW5pdGlhbGl6YXRpb25cclxuICpcclxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgYXJpYURpc2FibGUgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGlucHV0RWwsIHRvZ2dsZUxpc3RCdG5FbCwgY2xlYXJJbnB1dEJ0bkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xyXG5cclxuICBjbGVhcklucHV0QnRuRWwuaGlkZGVuID0gdHJ1ZTtcclxuICBjbGVhcklucHV0QnRuRWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCB0cnVlKTtcclxuICB0b2dnbGVMaXN0QnRuRWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCB0cnVlKTtcclxuICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtZGlzYWJsZWRcIiwgdHJ1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRW5hYmxlIHRoZSBjb21iby1ib3ggY29tcG9uZW50XHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGVuYWJsZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgaW5wdXRFbCwgdG9nZ2xlTGlzdEJ0bkVsLCBjbGVhcklucHV0QnRuRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XHJcblxyXG4gIGNsZWFySW5wdXRCdG5FbC5oaWRkZW4gPSBmYWxzZTtcclxuICBjbGVhcklucHV0QnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcclxuICB0b2dnbGVMaXN0QnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcclxuICBpbnB1dEVsLmRpc2FibGVkID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogRW5oYW5jZSBhIHNlbGVjdCBlbGVtZW50IGludG8gYSBjb21ibyBib3ggY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBfY29tYm9Cb3hFbCBUaGUgaW5pdGlhbCBlbGVtZW50IG9mIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBlbmhhbmNlQ29tYm9Cb3ggPSAoX2NvbWJvQm94RWwpID0+IHtcclxuICBjb25zdCBjb21ib0JveEVsID0gX2NvbWJvQm94RWwuY2xvc2VzdChDT01CT19CT1gpO1xyXG5cclxuICBpZiAoY29tYm9Cb3hFbC5kYXRhc2V0LmVuaGFuY2VkKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IHNlbGVjdEVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFwic2VsZWN0XCIpO1xyXG5cclxuICBpZiAoIXNlbGVjdEVsKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7Q09NQk9fQk9YfSBpcyBtaXNzaW5nIGlubmVyIHNlbGVjdGApO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VsZWN0SWQgPSBzZWxlY3RFbC5pZDtcclxuICBjb25zdCBzZWxlY3RMYWJlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxhYmVsW2Zvcj1cIiR7c2VsZWN0SWR9XCJdYCk7XHJcbiAgY29uc3QgbGlzdElkID0gYCR7c2VsZWN0SWR9LS1saXN0YDtcclxuICBjb25zdCBsaXN0SWRMYWJlbCA9IGAke3NlbGVjdElkfS1sYWJlbGA7XHJcbiAgY29uc3QgYXNzaXN0aXZlSGludElEID0gYCR7c2VsZWN0SWR9LS1hc3Npc3RpdmVIaW50YDtcclxuICBjb25zdCBhZGRpdGlvbmFsQXR0cmlidXRlcyA9IFtdO1xyXG4gIGNvbnN0IHsgZGVmYXVsdFZhbHVlIH0gPSBjb21ib0JveEVsLmRhdGFzZXQ7XHJcbiAgY29uc3QgeyBwbGFjZWhvbGRlciB9ID0gY29tYm9Cb3hFbC5kYXRhc2V0O1xyXG4gIGxldCBzZWxlY3RlZE9wdGlvbjtcclxuXHJcbiAgaWYgKHBsYWNlaG9sZGVyKSB7XHJcbiAgICBhZGRpdGlvbmFsQXR0cmlidXRlcy5wdXNoKHsgcGxhY2Vob2xkZXIgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAoZGVmYXVsdFZhbHVlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gc2VsZWN0RWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xyXG4gICAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XHJcblxyXG4gICAgICBpZiAob3B0aW9uRWwudmFsdWUgPT09IGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgIHNlbGVjdGVkT3B0aW9uID0gb3B0aW9uRWw7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRocm93IGVycm9yIGlmIGNvbWJvYm94IGlzIG1pc3NpbmcgYSBsYWJlbCBvciBsYWJlbCBpcyBtaXNzaW5nXHJcbiAgICogYGZvcmAgYXR0cmlidXRlLiBPdGhlcndpc2UsIHNldCB0aGUgSUQgdG8gbWF0Y2ggdGhlIDx1bD4gYXJpYS1sYWJlbGxlZGJ5XHJcbiAgICovXHJcbiAgaWYgKCFzZWxlY3RMYWJlbCB8fCAhc2VsZWN0TGFiZWwubWF0Y2hlcyhgbGFiZWxbZm9yPVwiJHtzZWxlY3RJZH1cIl1gKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgJHtDT01CT19CT1h9IGZvciAke3NlbGVjdElkfSBpcyBlaXRoZXIgbWlzc2luZyBhIGxhYmVsIG9yIGEgXCJmb3JcIiBhdHRyaWJ1dGVgXHJcbiAgICApO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZWxlY3RMYWJlbC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBsaXN0SWRMYWJlbCk7XHJcbiAgfVxyXG5cclxuICBzZWxlY3RMYWJlbC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBsaXN0SWRMYWJlbCk7XHJcbiAgc2VsZWN0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG4gIHNlbGVjdEVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgc2VsZWN0RWwuY2xhc3NMaXN0LmFkZChcInVzYS1zci1vbmx5XCIsIFNFTEVDVF9DTEFTUyk7XHJcbiAgc2VsZWN0RWwuaWQgPSBcIlwiO1xyXG4gIHNlbGVjdEVsLnZhbHVlID0gXCJcIjtcclxuXHJcbiAgW1wicmVxdWlyZWRcIiwgXCJhcmlhLWxhYmVsXCIsIFwiYXJpYS1sYWJlbGxlZGJ5XCJdLmZvckVhY2goKG5hbWUpID0+IHtcclxuICAgIGlmIChzZWxlY3RFbC5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBzZWxlY3RFbC5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgIGFkZGl0aW9uYWxBdHRyaWJ1dGVzLnB1c2goeyBbbmFtZV06IHZhbHVlIH0pO1xyXG4gICAgICBzZWxlY3RFbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIHNhbml0aXplIGRvZXNuJ3QgbGlrZSBmdW5jdGlvbnMgaW4gdGVtcGxhdGUgbGl0ZXJhbHNcclxuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcclxuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBzZWxlY3RJZCk7XHJcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1vd25zXCIsIGxpc3RJZCk7XHJcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBsaXN0SWQpO1xyXG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtYXV0b2NvbXBsZXRlXCIsIFwibGlzdFwiKTtcclxuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIGFzc2lzdGl2ZUhpbnRJRCk7XHJcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcImZhbHNlXCIpO1xyXG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImF1dG9jYXBpdGFsaXplXCIsIFwib2ZmXCIpO1xyXG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiKTtcclxuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBJTlBVVF9DTEFTUyk7XHJcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XHJcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImNvbWJvYm94XCIpO1xyXG4gIGFkZGl0aW9uYWxBdHRyaWJ1dGVzLmZvckVhY2goKGF0dHIpID0+XHJcbiAgICBPYmplY3Qua2V5cyhhdHRyKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke2F0dHJba2V5XX1gO1xyXG4gICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XHJcbiAgICB9KVxyXG4gICk7XHJcblxyXG4gIGNvbWJvQm94RWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGlucHV0KTtcclxuXHJcbiAgY29tYm9Cb3hFbC5pbnNlcnRBZGphY2VudEhUTUwoXHJcbiAgICBcImJlZm9yZWVuZFwiLFxyXG4gICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgXHJcbiAgICA8c3BhbiBjbGFzcz1cIiR7Q0xFQVJfSU5QVVRfQlVUVE9OX1dSQVBQRVJfQ0xBU1N9XCIgdGFiaW5kZXg9XCItMVwiPlxyXG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIkNsZWFyIHRoZSBzZWxlY3QgY29udGVudHNcIj4mbmJzcDs8L2J1dHRvbj5cclxuICAgICAgPC9zcGFuPlxyXG4gICAgICA8c3BhbiBjbGFzcz1cIiR7SU5QVVRfQlVUVE9OX1NFUEFSQVRPUl9DTEFTU31cIj4mbmJzcDs8L3NwYW4+XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwiJHtUT0dHTEVfTElTVF9CVVRUT05fV1JBUFBFUl9DTEFTU31cIiB0YWJpbmRleD1cIi0xXCI+XHJcbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdGFiaW5kZXg9XCItMVwiIGNsYXNzPVwiJHtUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSB0aGUgZHJvcGRvd24gbGlzdFwiPiZuYnNwOzwvYnV0dG9uPlxyXG4gICAgICA8L3NwYW4+XHJcbiAgICAgIDx1bFxyXG4gICAgICAgIHRhYmluZGV4PVwiLTFcIlxyXG4gICAgICAgIGlkPVwiJHtsaXN0SWR9XCJcclxuICAgICAgICBjbGFzcz1cIiR7TElTVF9DTEFTU31cIlxyXG4gICAgICAgIHJvbGU9XCJsaXN0Ym94XCJcclxuICAgICAgICBhcmlhLWxhYmVsbGVkYnk9XCIke2xpc3RJZExhYmVsfVwiXHJcbiAgICAgICAgaGlkZGVuPlxyXG4gICAgICA8L3VsPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwiJHtTVEFUVVNfQ0xBU1N9IHVzYS1zci1vbmx5XCIgcm9sZT1cInN0YXR1c1wiPjwvZGl2PlxyXG4gICAgICA8c3BhbiBpZD1cIiR7YXNzaXN0aXZlSGludElEfVwiIGNsYXNzPVwidXNhLXNyLW9ubHlcIj5cclxuICAgICAgICBXaGVuIGF1dG9jb21wbGV0ZSByZXN1bHRzIGFyZSBhdmFpbGFibGUgdXNlIHVwIGFuZCBkb3duIGFycm93cyB0byByZXZpZXcgYW5kIGVudGVyIHRvIHNlbGVjdC5cclxuICAgICAgICBUb3VjaCBkZXZpY2UgdXNlcnMsIGV4cGxvcmUgYnkgdG91Y2ggb3Igd2l0aCBzd2lwZSBnZXN0dXJlcy5cclxuICAgICAgPC9zcGFuPmBcclxuICApO1xyXG5cclxuICBpZiAoc2VsZWN0ZWRPcHRpb24pIHtcclxuICAgIGNvbnN0IHsgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGNvbWJvQm94RWwpO1xyXG4gICAgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsLCBzZWxlY3RlZE9wdGlvbi52YWx1ZSk7XHJcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCwgc2VsZWN0ZWRPcHRpb24udGV4dCk7XHJcbiAgICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcclxuICB9XHJcblxyXG4gIGlmIChzZWxlY3RFbC5kaXNhYmxlZCkge1xyXG4gICAgZGlzYWJsZShjb21ib0JveEVsKTtcclxuICAgIHNlbGVjdEVsLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAoc2VsZWN0RWwuaGFzQXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiKSkge1xyXG4gICAgYXJpYURpc2FibGUoY29tYm9Cb3hFbCk7XHJcbiAgICBzZWxlY3RFbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIpO1xyXG4gIH1cclxuXHJcbiAgY29tYm9Cb3hFbC5kYXRhc2V0LmVuaGFuY2VkID0gXCJ0cnVlXCI7XHJcbn07XHJcblxyXG4vKipcclxuICogTWFuYWdlIHRoZSBmb2N1c2VkIGVsZW1lbnQgd2l0aGluIHRoZSBsaXN0IG9wdGlvbnMgd2hlblxyXG4gKiBuYXZpZ2F0aW5nIHZpYSBrZXlib2FyZC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gYW5jaG9yIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5leHRFbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBvcHRpb25zXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5za2lwRm9jdXMgc2tpcCBmb2N1cyBvZiBoaWdobGlnaHRlZCBpdGVtXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5wcmV2ZW50U2Nyb2xsIHNob3VsZCBza2lwIHByb2NlZHVyZSB0byBzY3JvbGwgdG8gZWxlbWVudFxyXG4gKi9cclxuY29uc3QgaGlnaGxpZ2h0T3B0aW9uID0gKGVsLCBuZXh0RWwsIHsgc2tpcEZvY3VzLCBwcmV2ZW50U2Nyb2xsIH0gPSB7fSkgPT4ge1xyXG4gIGNvbnN0IHsgaW5wdXRFbCwgbGlzdEVsLCBmb2N1c2VkT3B0aW9uRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XHJcblxyXG4gIGlmIChmb2N1c2VkT3B0aW9uRWwpIHtcclxuICAgIGZvY3VzZWRPcHRpb25FbC5jbGFzc0xpc3QucmVtb3ZlKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xyXG4gICAgZm9jdXNlZE9wdGlvbkVsLnNldEF0dHJpYnV0ZShcInRhYkluZGV4XCIsIFwiLTFcIik7XHJcbiAgfVxyXG5cclxuICBpZiAobmV4dEVsKSB7XHJcbiAgICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBuZXh0RWwuaWQpO1xyXG4gICAgbmV4dEVsLnNldEF0dHJpYnV0ZShcInRhYkluZGV4XCIsIFwiMFwiKTtcclxuICAgIG5leHRFbC5jbGFzc0xpc3QuYWRkKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xyXG5cclxuICAgIGlmICghcHJldmVudFNjcm9sbCkge1xyXG4gICAgICBjb25zdCBvcHRpb25Cb3R0b20gPSBuZXh0RWwub2Zmc2V0VG9wICsgbmV4dEVsLm9mZnNldEhlaWdodDtcclxuICAgICAgY29uc3QgY3VycmVudEJvdHRvbSA9IGxpc3RFbC5zY3JvbGxUb3AgKyBsaXN0RWwub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgICAgaWYgKG9wdGlvbkJvdHRvbSA+IGN1cnJlbnRCb3R0b20pIHtcclxuICAgICAgICBsaXN0RWwuc2Nyb2xsVG9wID0gb3B0aW9uQm90dG9tIC0gbGlzdEVsLm9mZnNldEhlaWdodDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5leHRFbC5vZmZzZXRUb3AgPCBsaXN0RWwuc2Nyb2xsVG9wKSB7XHJcbiAgICAgICAgbGlzdEVsLnNjcm9sbFRvcCA9IG5leHRFbC5vZmZzZXRUb3A7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNraXBGb2N1cykge1xyXG4gICAgICBuZXh0RWwuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsIH0pO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBcIlwiKTtcclxuICAgIGlucHV0RWwuZm9jdXMoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2VuZXJhdGUgYSBkeW5hbWljIHJlZ3VsYXIgZXhwcmVzc2lvbiBiYXNlZCBvZmYgb2YgYSByZXBsYWNlYWJsZSBhbmQgcG9zc2libHkgZmlsdGVyZWQgdmFsdWUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgVGhlIHZhbHVlIHRvIHVzZSBpbiB0aGUgcmVndWxhciBleHByZXNzaW9uXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBleHRyYXMgQW4gb2JqZWN0IG9mIHJlZ3VsYXIgZXhwcmVzc2lvbnMgdG8gcmVwbGFjZSBhbmQgZmlsdGVyIHRoZSBxdWVyeVxyXG4gKi9cclxuY29uc3QgZ2VuZXJhdGVEeW5hbWljUmVnRXhwID0gKGZpbHRlciwgcXVlcnkgPSBcIlwiLCBleHRyYXMgPSB7fSkgPT4ge1xyXG4gIGNvbnN0IGVzY2FwZVJlZ0V4cCA9ICh0ZXh0KSA9PlxyXG4gICAgdGV4dC5yZXBsYWNlKC9bLVtcXF17fSgpKis/LixcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XHJcblxyXG4gIGxldCBmaW5kID0gZmlsdGVyLnJlcGxhY2UoL3t7KC4qPyl9fS9nLCAobSwgJDEpID0+IHtcclxuICAgIGNvbnN0IGtleSA9ICQxLnRyaW0oKTtcclxuICAgIGNvbnN0IHF1ZXJ5RmlsdGVyID0gZXh0cmFzW2tleV07XHJcbiAgICBpZiAoa2V5ICE9PSBcInF1ZXJ5XCIgJiYgcXVlcnlGaWx0ZXIpIHtcclxuICAgICAgY29uc3QgbWF0Y2hlciA9IG5ldyBSZWdFeHAocXVlcnlGaWx0ZXIsIFwiaVwiKTtcclxuICAgICAgY29uc3QgbWF0Y2hlcyA9IHF1ZXJ5Lm1hdGNoKG1hdGNoZXIpO1xyXG5cclxuICAgICAgaWYgKG1hdGNoZXMpIHtcclxuICAgICAgICByZXR1cm4gZXNjYXBlUmVnRXhwKG1hdGNoZXNbMV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gXCJcIjtcclxuICAgIH1cclxuICAgIHJldHVybiBlc2NhcGVSZWdFeHAocXVlcnkpO1xyXG4gIH0pO1xyXG5cclxuICBmaW5kID0gYF4oPzoke2ZpbmR9KSRgO1xyXG5cclxuICByZXR1cm4gbmV3IFJlZ0V4cChmaW5kLCBcImlcIik7XHJcbn07XHJcblxyXG4vKipcclxuICogRGlzcGxheSB0aGUgb3B0aW9uIGxpc3Qgb2YgYSBjb21ibyBib3ggY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgZGlzcGxheUxpc3QgPSAoZWwpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBjb21ib0JveEVsLFxyXG4gICAgc2VsZWN0RWwsXHJcbiAgICBpbnB1dEVsLFxyXG4gICAgbGlzdEVsLFxyXG4gICAgc3RhdHVzRWwsXHJcbiAgICBpc1ByaXN0aW5lLFxyXG4gICAgZGlzYWJsZUZpbHRlcmluZyxcclxuICB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcclxuICBsZXQgc2VsZWN0ZWRJdGVtSWQ7XHJcbiAgbGV0IGZpcnN0Rm91bmRJZDtcclxuXHJcbiAgY29uc3QgbGlzdE9wdGlvbkJhc2VJZCA9IGAke2xpc3RFbC5pZH0tLW9wdGlvbi1gO1xyXG5cclxuICBjb25zdCBpbnB1dFZhbHVlID0gKGlucHV0RWwudmFsdWUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcclxuICBjb25zdCBmaWx0ZXIgPSBjb21ib0JveEVsLmRhdGFzZXQuZmlsdGVyIHx8IERFRkFVTFRfRklMVEVSO1xyXG4gIGNvbnN0IHJlZ2V4ID0gZ2VuZXJhdGVEeW5hbWljUmVnRXhwKGZpbHRlciwgaW5wdXRWYWx1ZSwgY29tYm9Cb3hFbC5kYXRhc2V0KTtcclxuXHJcbiAgY29uc3Qgb3B0aW9ucyA9IFtdO1xyXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBzZWxlY3RFbC5vcHRpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcbiAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XHJcbiAgICBjb25zdCBvcHRpb25JZCA9IGAke2xpc3RPcHRpb25CYXNlSWR9JHtvcHRpb25zLmxlbmd0aH1gO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgb3B0aW9uRWwudmFsdWUgJiZcclxuICAgICAgKGRpc2FibGVGaWx0ZXJpbmcgfHxcclxuICAgICAgICBpc1ByaXN0aW5lIHx8XHJcbiAgICAgICAgIWlucHV0VmFsdWUgfHxcclxuICAgICAgICByZWdleC50ZXN0KG9wdGlvbkVsLnRleHQpKVxyXG4gICAgKSB7XHJcbiAgICAgIGlmIChzZWxlY3RFbC52YWx1ZSAmJiBvcHRpb25FbC52YWx1ZSA9PT0gc2VsZWN0RWwudmFsdWUpIHtcclxuICAgICAgICBzZWxlY3RlZEl0ZW1JZCA9IG9wdGlvbklkO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGlzYWJsZUZpbHRlcmluZyAmJiAhZmlyc3RGb3VuZElkICYmIHJlZ2V4LnRlc3Qob3B0aW9uRWwudGV4dCkpIHtcclxuICAgICAgICBmaXJzdEZvdW5kSWQgPSBvcHRpb25JZDtcclxuICAgICAgfVxyXG4gICAgICBvcHRpb25zLnB1c2gob3B0aW9uRWwpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgbnVtT3B0aW9ucyA9IG9wdGlvbnMubGVuZ3RoO1xyXG4gIGNvbnN0IG9wdGlvbkh0bWwgPSBvcHRpb25zLm1hcCgob3B0aW9uLCBpbmRleCkgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uSWQgPSBgJHtsaXN0T3B0aW9uQmFzZUlkfSR7aW5kZXh9YDtcclxuICAgIGNvbnN0IGNsYXNzZXMgPSBbTElTVF9PUFRJT05fQ0xBU1NdO1xyXG4gICAgbGV0IHRhYmluZGV4ID0gXCItMVwiO1xyXG4gICAgbGV0IGFyaWFTZWxlY3RlZCA9IFwiZmFsc2VcIjtcclxuXHJcbiAgICBpZiAob3B0aW9uSWQgPT09IHNlbGVjdGVkSXRlbUlkKSB7XHJcbiAgICAgIGNsYXNzZXMucHVzaChMSVNUX09QVElPTl9TRUxFQ1RFRF9DTEFTUywgTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyk7XHJcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XHJcbiAgICAgIGFyaWFTZWxlY3RlZCA9IFwidHJ1ZVwiO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc2VsZWN0ZWRJdGVtSWQgJiYgaW5kZXggPT09IDApIHtcclxuICAgICAgY2xhc3Nlcy5wdXNoKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xyXG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5cclxuICAgIGxpLnNldEF0dHJpYnV0ZShcImFyaWEtc2V0c2l6ZVwiLCBvcHRpb25zLmxlbmd0aCk7XHJcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXBvc2luc2V0XCIsIGluZGV4ICsgMSk7XHJcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIsIGFyaWFTZWxlY3RlZCk7XHJcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBvcHRpb25JZCk7XHJcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc2VzLmpvaW4oXCIgXCIpKTtcclxuICAgIGxpLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIHRhYmluZGV4KTtcclxuICAgIGxpLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJvcHRpb25cIik7XHJcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIsIG9wdGlvbi52YWx1ZSk7XHJcbiAgICBsaS50ZXh0Q29udGVudCA9IG9wdGlvbi50ZXh0O1xyXG5cclxuICAgIHJldHVybiBsaTtcclxuICB9KTtcclxuXHJcbiAgY29uc3Qgbm9SZXN1bHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG4gIG5vUmVzdWx0cy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgJHtMSVNUX09QVElPTl9DTEFTU30tLW5vLXJlc3VsdHNgKTtcclxuICBub1Jlc3VsdHMudGV4dENvbnRlbnQgPSBcIk5vIHJlc3VsdHMgZm91bmRcIjtcclxuXHJcbiAgbGlzdEVsLmhpZGRlbiA9IGZhbHNlO1xyXG5cclxuICBpZiAobnVtT3B0aW9ucykge1xyXG4gICAgbGlzdEVsLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICBvcHRpb25IdG1sLmZvckVhY2goKGl0ZW0pID0+XHJcbiAgICAgIGxpc3RFbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgaXRlbSlcclxuICAgICk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGxpc3RFbC5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgbGlzdEVsLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBub1Jlc3VsdHMpO1xyXG4gIH1cclxuXHJcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwidHJ1ZVwiKTtcclxuXHJcbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBudW1PcHRpb25zXHJcbiAgICA/IGAke251bU9wdGlvbnN9IHJlc3VsdCR7bnVtT3B0aW9ucyA+IDEgPyBcInNcIiA6IFwiXCJ9IGF2YWlsYWJsZS5gXHJcbiAgICA6IFwiTm8gcmVzdWx0cy5cIjtcclxuXHJcbiAgbGV0IGl0ZW1Ub0ZvY3VzO1xyXG5cclxuICBpZiAoaXNQcmlzdGluZSAmJiBzZWxlY3RlZEl0ZW1JZCkge1xyXG4gICAgaXRlbVRvRm9jdXMgPSBsaXN0RWwucXVlcnlTZWxlY3RvcihgIyR7c2VsZWN0ZWRJdGVtSWR9YCk7XHJcbiAgfSBlbHNlIGlmIChkaXNhYmxlRmlsdGVyaW5nICYmIGZpcnN0Rm91bmRJZCkge1xyXG4gICAgaXRlbVRvRm9jdXMgPSBsaXN0RWwucXVlcnlTZWxlY3RvcihgIyR7Zmlyc3RGb3VuZElkfWApO1xyXG4gIH1cclxuXHJcbiAgaWYgKGl0ZW1Ub0ZvY3VzKSB7XHJcbiAgICBoaWdobGlnaHRPcHRpb24obGlzdEVsLCBpdGVtVG9Gb2N1cywge1xyXG4gICAgICBza2lwRm9jdXM6IHRydWUsXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogSGlkZSB0aGUgb3B0aW9uIGxpc3Qgb2YgYSBjb21ibyBib3ggY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgaGlkZUxpc3QgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGlucHV0RWwsIGxpc3RFbCwgc3RhdHVzRWwsIGZvY3VzZWRPcHRpb25FbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcclxuXHJcbiAgc3RhdHVzRWwuaW5uZXJIVE1MID0gXCJcIjtcclxuXHJcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XHJcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWFjdGl2ZWRlc2NlbmRhbnRcIiwgXCJcIik7XHJcblxyXG4gIGlmIChmb2N1c2VkT3B0aW9uRWwpIHtcclxuICAgIGZvY3VzZWRPcHRpb25FbC5jbGFzc0xpc3QucmVtb3ZlKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xyXG4gIH1cclxuXHJcbiAgbGlzdEVsLnNjcm9sbFRvcCA9IDA7XHJcbiAgbGlzdEVsLmhpZGRlbiA9IHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VsZWN0IGFuIG9wdGlvbiBsaXN0IG9mIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBsaXN0T3B0aW9uRWwgVGhlIGxpc3Qgb3B0aW9uIGJlaW5nIHNlbGVjdGVkXHJcbiAqL1xyXG5jb25zdCBzZWxlY3RJdGVtID0gKGxpc3RPcHRpb25FbCkgPT4ge1xyXG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgc2VsZWN0RWwsIGlucHV0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChsaXN0T3B0aW9uRWwpO1xyXG5cclxuICBjaGFuZ2VFbGVtZW50VmFsdWUoc2VsZWN0RWwsIGxpc3RPcHRpb25FbC5kYXRhc2V0LnZhbHVlKTtcclxuICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCwgbGlzdE9wdGlvbkVsLnRleHRDb250ZW50KTtcclxuICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcclxuICBoaWRlTGlzdChjb21ib0JveEVsKTtcclxuICBpbnB1dEVsLmZvY3VzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2xlYXIgdGhlIGlucHV0IG9mIHRoZSBjb21ibyBib3hcclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gY2xlYXJCdXR0b25FbCBUaGUgY2xlYXIgaW5wdXQgYnV0dG9uXHJcbiAqL1xyXG5jb25zdCBjbGVhcklucHV0ID0gKGNsZWFyQnV0dG9uRWwpID0+IHtcclxuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgc2VsZWN0RWwsIGlucHV0RWwgfSA9XHJcbiAgICBnZXRDb21ib0JveENvbnRleHQoY2xlYXJCdXR0b25FbCk7XHJcbiAgY29uc3QgbGlzdFNob3duID0gIWxpc3RFbC5oaWRkZW47XHJcblxyXG4gIGlmIChzZWxlY3RFbC52YWx1ZSkgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsKTtcclxuICBpZiAoaW5wdXRFbC52YWx1ZSkgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwpO1xyXG4gIGNvbWJvQm94RWwuY2xhc3NMaXN0LnJlbW92ZShDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xyXG5cclxuICBpZiAobGlzdFNob3duKSBkaXNwbGF5TGlzdChjb21ib0JveEVsKTtcclxuICBpbnB1dEVsLmZvY3VzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXQgdGhlIHNlbGVjdCBiYXNlZCBvZmYgb2YgY3VycmVudGx5IHNldCBzZWxlY3QgdmFsdWVcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IHJlc2V0U2VsZWN0aW9uID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgeyBjb21ib0JveEVsLCBzZWxlY3RFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcclxuXHJcbiAgY29uc3Qgc2VsZWN0VmFsdWUgPSBzZWxlY3RFbC52YWx1ZTtcclxuICBjb25zdCBpbnB1dFZhbHVlID0gKGlucHV0RWwudmFsdWUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgaWYgKHNlbGVjdFZhbHVlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gc2VsZWN0RWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xyXG4gICAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XHJcbiAgICAgIGlmIChvcHRpb25FbC52YWx1ZSA9PT0gc2VsZWN0VmFsdWUpIHtcclxuICAgICAgICBpZiAoaW5wdXRWYWx1ZSAhPT0gb3B0aW9uRWwudGV4dCkge1xyXG4gICAgICAgICAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwsIG9wdGlvbkVsLnRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChpbnB1dFZhbHVlKSB7XHJcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNlbGVjdCBhbiBvcHRpb24gbGlzdCBvZiB0aGUgY29tYm8gYm94IGNvbXBvbmVudCBiYXNlZCBvZmYgb2ZcclxuICogaGF2aW5nIGEgY3VycmVudCBmb2N1c2VkIGxpc3Qgb3B0aW9uIG9yXHJcbiAqIGhhdmluZyB0ZXN0IHRoYXQgY29tcGxldGVseSBtYXRjaGVzIGEgbGlzdCBvcHRpb24uXHJcbiAqIE90aGVyd2lzZSBpdCBjbGVhcnMgdGhlIGlucHV0IGFuZCBzZWxlY3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBjb21wbGV0ZVNlbGVjdGlvbiA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgc2VsZWN0RWwsIGlucHV0RWwsIHN0YXR1c0VsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xyXG5cclxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFwiXCI7XHJcblxyXG4gIGNvbnN0IGlucHV0VmFsdWUgPSAoaW5wdXRFbC52YWx1ZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICBpZiAoaW5wdXRWYWx1ZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHNlbGVjdEVsLm9wdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcclxuICAgICAgY29uc3Qgb3B0aW9uRWwgPSBzZWxlY3RFbC5vcHRpb25zW2ldO1xyXG4gICAgICBpZiAob3B0aW9uRWwudGV4dC50b0xvd2VyQ2FzZSgpID09PSBpbnB1dFZhbHVlKSB7XHJcbiAgICAgICAgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsLCBvcHRpb25FbC52YWx1ZSk7XHJcbiAgICAgICAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwsIG9wdGlvbkVsLnRleHQpO1xyXG4gICAgICAgIGNvbWJvQm94RWwuY2xhc3NMaXN0LmFkZChDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVzZXRTZWxlY3Rpb24oY29tYm9Cb3hFbCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSGFuZGxlIHRoZSBlc2NhcGUgZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlRXNjYXBlID0gKGV2ZW50KSA9PiB7XHJcbiAgY29uc3QgeyBjb21ib0JveEVsLCBpbnB1dEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZXZlbnQudGFyZ2V0KTtcclxuXHJcbiAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XHJcbiAgcmVzZXRTZWxlY3Rpb24oY29tYm9Cb3hFbCk7XHJcbiAgaW5wdXRFbC5mb2N1cygpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhhbmRsZSB0aGUgZG93biBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVEb3duRnJvbUlucHV0ID0gKGV2ZW50KSA9PiB7XHJcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChldmVudC50YXJnZXQpO1xyXG5cclxuICBpZiAobGlzdEVsLmhpZGRlbikge1xyXG4gICAgZGlzcGxheUxpc3QoY29tYm9Cb3hFbCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBuZXh0T3B0aW9uRWwgPVxyXG4gICAgbGlzdEVsLnF1ZXJ5U2VsZWN0b3IoTElTVF9PUFRJT05fRk9DVVNFRCkgfHxcclxuICAgIGxpc3RFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OKTtcclxuXHJcbiAgaWYgKG5leHRPcHRpb25FbCkge1xyXG4gICAgaGlnaGxpZ2h0T3B0aW9uKGNvbWJvQm94RWwsIG5leHRPcHRpb25FbCk7XHJcbiAgfVxyXG5cclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhhbmRsZSB0aGUgZW50ZXIgZXZlbnQgZnJvbSBhbiBpbnB1dCBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZUVudGVyRnJvbUlucHV0ID0gKGV2ZW50KSA9PiB7XHJcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChldmVudC50YXJnZXQpO1xyXG4gIGNvbnN0IGxpc3RTaG93biA9ICFsaXN0RWwuaGlkZGVuO1xyXG5cclxuICBjb21wbGV0ZVNlbGVjdGlvbihjb21ib0JveEVsKTtcclxuXHJcbiAgaWYgKGxpc3RTaG93bikge1xyXG4gICAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XHJcbiAgfVxyXG5cclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhhbmRsZSB0aGUgZG93biBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVEb3duRnJvbUxpc3RPcHRpb24gPSAoZXZlbnQpID0+IHtcclxuICBjb25zdCBmb2N1c2VkT3B0aW9uRWwgPSBldmVudC50YXJnZXQ7XHJcbiAgY29uc3QgbmV4dE9wdGlvbkVsID0gZm9jdXNlZE9wdGlvbkVsLm5leHRTaWJsaW5nO1xyXG5cclxuICBpZiAobmV4dE9wdGlvbkVsKSB7XHJcbiAgICBoaWdobGlnaHRPcHRpb24oZm9jdXNlZE9wdGlvbkVsLCBuZXh0T3B0aW9uRWwpO1xyXG4gIH1cclxuXHJcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGUgdGhlIHNwYWNlIGV2ZW50IGZyb20gYW4gbGlzdCBvcHRpb24gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVTcGFjZUZyb21MaXN0T3B0aW9uID0gKGV2ZW50KSA9PiB7XHJcbiAgc2VsZWN0SXRlbShldmVudC50YXJnZXQpO1xyXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSGFuZGxlIHRoZSBlbnRlciBldmVudCBmcm9tIGxpc3Qgb3B0aW9uIHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZUVudGVyRnJvbUxpc3RPcHRpb24gPSAoZXZlbnQpID0+IHtcclxuICBzZWxlY3RJdGVtKGV2ZW50LnRhcmdldCk7XHJcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGUgdGhlIHVwIGV2ZW50IGZyb20gbGlzdCBvcHRpb24gd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlVXBGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xyXG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgbGlzdEVsLCBmb2N1c2VkT3B0aW9uRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChcclxuICAgIGV2ZW50LnRhcmdldFxyXG4gICk7XHJcbiAgY29uc3QgbmV4dE9wdGlvbkVsID0gZm9jdXNlZE9wdGlvbkVsICYmIGZvY3VzZWRPcHRpb25FbC5wcmV2aW91c1NpYmxpbmc7XHJcbiAgY29uc3QgbGlzdFNob3duID0gIWxpc3RFbC5oaWRkZW47XHJcblxyXG4gIGhpZ2hsaWdodE9wdGlvbihjb21ib0JveEVsLCBuZXh0T3B0aW9uRWwpO1xyXG5cclxuICBpZiAobGlzdFNob3duKSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCFuZXh0T3B0aW9uRWwpIHtcclxuICAgIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZWxlY3QgbGlzdCBvcHRpb24gb24gdGhlIG1vdXNlb3ZlciBldmVudC5cclxuICpcclxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgbW91c2VvdmVyIGV2ZW50XHJcbiAqIEBwYXJhbSB7SFRNTExJRWxlbWVudH0gbGlzdE9wdGlvbkVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVNb3VzZW92ZXIgPSAobGlzdE9wdGlvbkVsKSA9PiB7XHJcbiAgY29uc3QgaXNDdXJyZW50bHlGb2N1c2VkID0gbGlzdE9wdGlvbkVsLmNsYXNzTGlzdC5jb250YWlucyhcclxuICAgIExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1NcclxuICApO1xyXG5cclxuICBpZiAoaXNDdXJyZW50bHlGb2N1c2VkKSByZXR1cm47XHJcblxyXG4gIGhpZ2hsaWdodE9wdGlvbihsaXN0T3B0aW9uRWwsIGxpc3RPcHRpb25FbCwge1xyXG4gICAgcHJldmVudFNjcm9sbDogdHJ1ZSxcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUb2dnbGUgdGhlIGxpc3Qgd2hlbiB0aGUgYnV0dG9uIGlzIGNsaWNrZWRcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IHRvZ2dsZUxpc3QgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcclxuXHJcbiAgaWYgKGxpc3RFbC5oaWRkZW4pIHtcclxuICAgIGRpc3BsYXlMaXN0KGNvbWJvQm94RWwpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBoaWRlTGlzdChjb21ib0JveEVsKTtcclxuICB9XHJcblxyXG4gIGlucHV0RWwuZm9jdXMoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGUgY2xpY2sgZnJvbSBpbnB1dFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVDbGlja0Zyb21JbnB1dCA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgbGlzdEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xyXG5cclxuICBpZiAobGlzdEVsLmhpZGRlbikge1xyXG4gICAgZGlzcGxheUxpc3QoY29tYm9Cb3hFbCk7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgY29tYm9Cb3ggPSBiZWhhdmlvcihcclxuICB7XHJcbiAgICBbQ0xJQ0tdOiB7XHJcbiAgICAgIFtJTlBVVF0oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICBoYW5kbGVDbGlja0Zyb21JbnB1dCh0aGlzKTtcclxuICAgICAgfSxcclxuICAgICAgW1RPR0dMRV9MSVNUX0JVVFRPTl0oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICB0b2dnbGVMaXN0KHRoaXMpO1xyXG4gICAgICB9LFxyXG4gICAgICBbTElTVF9PUFRJT05dKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XHJcbiAgICAgICAgc2VsZWN0SXRlbSh0aGlzKTtcclxuICAgICAgfSxcclxuICAgICAgW0NMRUFSX0lOUFVUX0JVVFRPTl0oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICBjbGVhcklucHV0KHRoaXMpO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGZvY3Vzb3V0OiB7XHJcbiAgICAgIFtDT01CT19CT1hdKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XHJcbiAgICAgICAgICByZXNldFNlbGVjdGlvbih0aGlzKTtcclxuICAgICAgICAgIGhpZGVMaXN0KHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBrZXlkb3duOiB7XHJcbiAgICAgIFtDT01CT19CT1hdOiBrZXltYXAoe1xyXG4gICAgICAgIEVzY2FwZTogaGFuZGxlRXNjYXBlLFxyXG4gICAgICB9KSxcclxuICAgICAgW0lOUFVUXToga2V5bWFwKHtcclxuICAgICAgICBFbnRlcjogaGFuZGxlRW50ZXJGcm9tSW5wdXQsXHJcbiAgICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbUlucHV0LFxyXG4gICAgICAgIERvd246IGhhbmRsZURvd25Gcm9tSW5wdXQsXHJcbiAgICAgIH0pLFxyXG4gICAgICBbTElTVF9PUFRJT05dOiBrZXltYXAoe1xyXG4gICAgICAgIEFycm93VXA6IGhhbmRsZVVwRnJvbUxpc3RPcHRpb24sXHJcbiAgICAgICAgVXA6IGhhbmRsZVVwRnJvbUxpc3RPcHRpb24sXHJcbiAgICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbUxpc3RPcHRpb24sXHJcbiAgICAgICAgRG93bjogaGFuZGxlRG93bkZyb21MaXN0T3B0aW9uLFxyXG4gICAgICAgIEVudGVyOiBoYW5kbGVFbnRlckZyb21MaXN0T3B0aW9uLFxyXG4gICAgICAgIFwiIFwiOiBoYW5kbGVTcGFjZUZyb21MaXN0T3B0aW9uLFxyXG4gICAgICAgIFwiU2hpZnQrVGFiXCI6IG5vb3AsXHJcbiAgICAgIH0pLFxyXG4gICAgfSxcclxuICAgIGlucHV0OiB7XHJcbiAgICAgIFtJTlBVVF0oKSB7XHJcbiAgICAgICAgY29uc3QgY29tYm9Cb3hFbCA9IHRoaXMuY2xvc2VzdChDT01CT19CT1gpO1xyXG4gICAgICAgIGNvbWJvQm94RWwuY2xhc3NMaXN0LnJlbW92ZShDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xyXG4gICAgICAgIGRpc3BsYXlMaXN0KHRoaXMpO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIG1vdXNlb3Zlcjoge1xyXG4gICAgICBbTElTVF9PUFRJT05dKCkge1xyXG4gICAgICAgIGhhbmRsZU1vdXNlb3Zlcih0aGlzKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpbml0KHJvb3QpIHtcclxuICAgICAgc2VsZWN0T3JNYXRjaGVzKENPTUJPX0JPWCwgcm9vdCkuZm9yRWFjaCgoY29tYm9Cb3hFbCkgPT4ge1xyXG4gICAgICAgIGVuaGFuY2VDb21ib0JveChjb21ib0JveEVsKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0Q29tYm9Cb3hDb250ZXh0LFxyXG4gICAgZW5oYW5jZUNvbWJvQm94LFxyXG4gICAgZ2VuZXJhdGVEeW5hbWljUmVnRXhwLFxyXG4gICAgZGlzYWJsZSxcclxuICAgIGVuYWJsZSxcclxuICAgIGRpc3BsYXlMaXN0LFxyXG4gICAgaGlkZUxpc3QsXHJcbiAgICBDT01CT19CT1hfQ0xBU1MsXHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb21ib0JveDtcclxuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcclxuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XHJcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XHJcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcclxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcclxuY29uc3QgYWN0aXZlRWxlbWVudCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9hY3RpdmUtZWxlbWVudFwiKTtcclxuY29uc3QgaXNJb3NEZXZpY2UgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW9zLWRldmljZVwiKTtcclxuY29uc3QgU2FuaXRpemVyID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplclwiKTtcclxuXHJcbmNvbnN0IERBVEVfUElDS0VSX0NMQVNTID0gYCR7UFJFRklYfS1kYXRlLXBpY2tlcmA7XHJcbmNvbnN0IERBVEVfUElDS0VSX1dSQVBQRVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX3dyYXBwZXJgO1xyXG5jb25zdCBEQVRFX1BJQ0tFUl9JTklUSUFMSVpFRF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfS0taW5pdGlhbGl6ZWRgO1xyXG5jb25zdCBEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU30tLWFjdGl2ZWA7XHJcbmNvbnN0IERBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19pbnRlcm5hbC1pbnB1dGA7XHJcbmNvbnN0IERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19leHRlcm5hbC1pbnB1dGA7XHJcbmNvbnN0IERBVEVfUElDS0VSX0JVVFRPTl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9fYnV0dG9uYDtcclxuY29uc3QgREFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX2NhbGVuZGFyYDtcclxuY29uc3QgREFURV9QSUNLRVJfU1RBVFVTX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19zdGF0dXNgO1xyXG5jb25zdCBDQUxFTkRBUl9EQVRFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19kYXRlYDtcclxuXHJcbmNvbnN0IENBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1mb2N1c2VkYDtcclxuY29uc3QgQ0FMRU5EQVJfREFURV9TRUxFQ1RFRF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1zZWxlY3RlZGA7XHJcbmNvbnN0IENBTEVOREFSX0RBVEVfUFJFVklPVVNfTU9OVEhfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tcHJldmlvdXMtbW9udGhgO1xyXG5jb25zdCBDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tY3VycmVudC1tb250aGA7XHJcbmNvbnN0IENBTEVOREFSX0RBVEVfTkVYVF9NT05USF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1uZXh0LW1vbnRoYDtcclxuY29uc3QgQ0FMRU5EQVJfREFURV9SQU5HRV9EQVRFX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXJhbmdlLWRhdGVgO1xyXG5jb25zdCBDQUxFTkRBUl9EQVRFX1RPREFZX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXRvZGF5YDtcclxuY29uc3QgQ0FMRU5EQVJfREFURV9SQU5HRV9EQVRFX1NUQVJUX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXJhbmdlLWRhdGUtc3RhcnRgO1xyXG5jb25zdCBDQUxFTkRBUl9EQVRFX1JBTkdFX0RBVEVfRU5EX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXJhbmdlLWRhdGUtZW5kYDtcclxuY29uc3QgQ0FMRU5EQVJfREFURV9XSVRISU5fUkFOR0VfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0td2l0aGluLXJhbmdlYDtcclxuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcHJldmlvdXMteWVhcmA7XHJcbmNvbnN0IENBTEVOREFSX1BSRVZJT1VTX01PTlRIX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19wcmV2aW91cy1tb250aGA7XHJcbmNvbnN0IENBTEVOREFSX05FWFRfWUVBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbmV4dC15ZWFyYDtcclxuY29uc3QgQ0FMRU5EQVJfTkVYVF9NT05USF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbmV4dC1tb250aGA7XHJcbmNvbnN0IENBTEVOREFSX01PTlRIX1NFTEVDVElPTl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbW9udGgtc2VsZWN0aW9uYDtcclxuY29uc3QgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXItc2VsZWN0aW9uYDtcclxuY29uc3QgQ0FMRU5EQVJfTU9OVEhfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX21vbnRoYDtcclxuY29uc3QgQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRF9DTEFTUyA9IGAke0NBTEVOREFSX01PTlRIX0NMQVNTfS0tZm9jdXNlZGA7XHJcbmNvbnN0IENBTEVOREFSX01PTlRIX1NFTEVDVEVEX0NMQVNTID0gYCR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9LS1zZWxlY3RlZGA7XHJcbmNvbnN0IENBTEVOREFSX1lFQVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXJgO1xyXG5jb25zdCBDQUxFTkRBUl9ZRUFSX0ZPQ1VTRURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9ZRUFSX0NMQVNTfS0tZm9jdXNlZGA7XHJcbmNvbnN0IENBTEVOREFSX1lFQVJfU0VMRUNURURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9ZRUFSX0NMQVNTfS0tc2VsZWN0ZWRgO1xyXG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19wcmV2aW91cy15ZWFyLWNodW5rYDtcclxuY29uc3QgQ0FMRU5EQVJfTkVYVF9ZRUFSX0NIVU5LX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19uZXh0LXllYXItY2h1bmtgO1xyXG5jb25zdCBDQUxFTkRBUl9EQVRFX1BJQ0tFUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fZGF0ZS1waWNrZXJgO1xyXG5jb25zdCBDQUxFTkRBUl9NT05USF9QSUNLRVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX21vbnRoLXBpY2tlcmA7XHJcbmNvbnN0IENBTEVOREFSX1lFQVJfUElDS0VSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X195ZWFyLXBpY2tlcmA7XHJcbmNvbnN0IENBTEVOREFSX1RBQkxFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X190YWJsZWA7XHJcbmNvbnN0IENBTEVOREFSX1JPV19DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcm93YDtcclxuY29uc3QgQ0FMRU5EQVJfQ0VMTF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fY2VsbGA7XHJcbmNvbnN0IENBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTID0gYCR7Q0FMRU5EQVJfQ0VMTF9DTEFTU30tLWNlbnRlci1pdGVtc2A7XHJcbmNvbnN0IENBTEVOREFSX01PTlRIX0xBQkVMX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aC1sYWJlbGA7XHJcbmNvbnN0IENBTEVOREFSX0RBWV9PRl9XRUVLX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19kYXktb2Ytd2Vla2A7XHJcblxyXG5jb25zdCBEQVRFX1BJQ0tFUiA9IGAuJHtEQVRFX1BJQ0tFUl9DTEFTU31gO1xyXG5jb25zdCBEQVRFX1BJQ0tFUl9CVVRUT04gPSBgLiR7REFURV9QSUNLRVJfQlVUVE9OX0NMQVNTfWA7XHJcbmNvbnN0IERBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUID0gYC4ke0RBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUX0NMQVNTfWA7XHJcbmNvbnN0IERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUID0gYC4ke0RBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTfWA7XHJcbmNvbnN0IERBVEVfUElDS0VSX0NBTEVOREFSID0gYC4ke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfWA7XHJcbmNvbnN0IERBVEVfUElDS0VSX1NUQVRVUyA9IGAuJHtEQVRFX1BJQ0tFUl9TVEFUVVNfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfREFURSA9IGAuJHtDQUxFTkRBUl9EQVRFX0NMQVNTfWA7XHJcbmNvbnN0IENBTEVOREFSX0RBVEVfRk9DVVNFRCA9IGAuJHtDQUxFTkRBUl9EQVRFX0ZPQ1VTRURfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfREFURV9DVVJSRU5UX01PTlRIID0gYC4ke0NBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF9DTEFTU31gO1xyXG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSID0gYC4ke0NBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEggPSBgLiR7Q0FMRU5EQVJfUFJFVklPVVNfTU9OVEhfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfTkVYVF9ZRUFSID0gYC4ke0NBTEVOREFSX05FWFRfWUVBUl9DTEFTU31gO1xyXG5jb25zdCBDQUxFTkRBUl9ORVhUX01PTlRIID0gYC4ke0NBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT04gPSBgLiR7Q0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OID0gYC4ke0NBTEVOREFSX01PTlRIX1NFTEVDVElPTl9DTEFTU31gO1xyXG5jb25zdCBDQUxFTkRBUl9NT05USCA9IGAuJHtDQUxFTkRBUl9NT05USF9DTEFTU31gO1xyXG5jb25zdCBDQUxFTkRBUl9ZRUFSID0gYC4ke0NBTEVOREFSX1lFQVJfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOSyA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LX0NMQVNTfWA7XHJcbmNvbnN0IENBTEVOREFSX05FWFRfWUVBUl9DSFVOSyA9IGAuJHtDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfREFURV9QSUNLRVIgPSBgLiR7Q0FMRU5EQVJfREFURV9QSUNLRVJfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfTU9OVEhfUElDS0VSID0gYC4ke0NBTEVOREFSX01PTlRIX1BJQ0tFUl9DTEFTU31gO1xyXG5jb25zdCBDQUxFTkRBUl9ZRUFSX1BJQ0tFUiA9IGAuJHtDQUxFTkRBUl9ZRUFSX1BJQ0tFUl9DTEFTU31gO1xyXG5jb25zdCBDQUxFTkRBUl9NT05USF9GT0NVU0VEID0gYC4ke0NBTEVOREFSX01PTlRIX0ZPQ1VTRURfQ0xBU1N9YDtcclxuY29uc3QgQ0FMRU5EQVJfWUVBUl9GT0NVU0VEID0gYC4ke0NBTEVOREFSX1lFQVJfRk9DVVNFRF9DTEFTU31gO1xyXG5cclxuY29uc3QgVkFMSURBVElPTl9NRVNTQUdFID0gXCJQbGVhc2UgZW50ZXIgYSB2YWxpZCBkYXRlXCI7XHJcblxyXG5jb25zdCBNT05USF9MQUJFTFMgPSBbXHJcbiAgXCJKYW51YXJ5XCIsXHJcbiAgXCJGZWJydWFyeVwiLFxyXG4gIFwiTWFyY2hcIixcclxuICBcIkFwcmlsXCIsXHJcbiAgXCJNYXlcIixcclxuICBcIkp1bmVcIixcclxuICBcIkp1bHlcIixcclxuICBcIkF1Z3VzdFwiLFxyXG4gIFwiU2VwdGVtYmVyXCIsXHJcbiAgXCJPY3RvYmVyXCIsXHJcbiAgXCJOb3ZlbWJlclwiLFxyXG4gIFwiRGVjZW1iZXJcIixcclxuXTtcclxuXHJcbmNvbnN0IERBWV9PRl9XRUVLX0xBQkVMUyA9IFtcclxuICBcIlN1bmRheVwiLFxyXG4gIFwiTW9uZGF5XCIsXHJcbiAgXCJUdWVzZGF5XCIsXHJcbiAgXCJXZWRuZXNkYXlcIixcclxuICBcIlRodXJzZGF5XCIsXHJcbiAgXCJGcmlkYXlcIixcclxuICBcIlNhdHVyZGF5XCIsXHJcbl07XHJcblxyXG5jb25zdCBFTlRFUl9LRVlDT0RFID0gMTM7XHJcblxyXG5jb25zdCBZRUFSX0NIVU5LID0gMTI7XHJcblxyXG5jb25zdCBERUZBVUxUX01JTl9EQVRFID0gXCIwMDAwLTAxLTAxXCI7XHJcbmNvbnN0IERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQgPSBcIk1NL0REL1lZWVlcIjtcclxuY29uc3QgSU5URVJOQUxfREFURV9GT1JNQVQgPSBcIllZWVktTU0tRERcIjtcclxuXHJcbmNvbnN0IE5PVF9ESVNBQkxFRF9TRUxFQ1RPUiA9IFwiOm5vdChbZGlzYWJsZWRdKVwiO1xyXG5cclxuY29uc3QgcHJvY2Vzc0ZvY3VzYWJsZVNlbGVjdG9ycyA9ICguLi5zZWxlY3RvcnMpID0+XHJcbiAgc2VsZWN0b3JzLm1hcCgocXVlcnkpID0+IHF1ZXJ5ICsgTk9UX0RJU0FCTEVEX1NFTEVDVE9SKS5qb2luKFwiLCBcIik7XHJcblxyXG5jb25zdCBEQVRFX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxyXG4gIENBTEVOREFSX1BSRVZJT1VTX1lFQVIsXHJcbiAgQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEgsXHJcbiAgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT04sXHJcbiAgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OLFxyXG4gIENBTEVOREFSX05FWFRfWUVBUixcclxuICBDQUxFTkRBUl9ORVhUX01PTlRILFxyXG4gIENBTEVOREFSX0RBVEVfRk9DVVNFRFxyXG4pO1xyXG5cclxuY29uc3QgTU9OVEhfUElDS0VSX0ZPQ1VTQUJMRSA9IHByb2Nlc3NGb2N1c2FibGVTZWxlY3RvcnMoXHJcbiAgQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRFxyXG4pO1xyXG5cclxuY29uc3QgWUVBUl9QSUNLRVJfRk9DVVNBQkxFID0gcHJvY2Vzc0ZvY3VzYWJsZVNlbGVjdG9ycyhcclxuICBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LLFxyXG4gIENBTEVOREFSX05FWFRfWUVBUl9DSFVOSyxcclxuICBDQUxFTkRBUl9ZRUFSX0ZPQ1VTRURcclxuKTtcclxuXHJcbi8vICNyZWdpb24gRGF0ZSBNYW5pcHVsYXRpb24gRnVuY3Rpb25zXHJcblxyXG4vKipcclxuICogS2VlcCBkYXRlIHdpdGhpbiBtb250aC4gTW9udGggd291bGQgb25seSBiZSBvdmVyIGJ5IDEgdG8gMyBkYXlzXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZVRvQ2hlY2sgdGhlIGRhdGUgb2JqZWN0IHRvIGNoZWNrXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBtb250aCB0aGUgY29ycmVjdCBtb250aFxyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGRhdGUsIGNvcnJlY3RlZCBpZiBuZWVkZWRcclxuICovXHJcbmNvbnN0IGtlZXBEYXRlV2l0aGluTW9udGggPSAoZGF0ZVRvQ2hlY2ssIG1vbnRoKSA9PiB7XHJcbiAgaWYgKG1vbnRoICE9PSBkYXRlVG9DaGVjay5nZXRNb250aCgpKSB7XHJcbiAgICBkYXRlVG9DaGVjay5zZXREYXRlKDApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRhdGVUb0NoZWNrO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBkYXRlIGZyb20gbW9udGggZGF5IHllYXJcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IHllYXIgdGhlIHllYXIgdG8gc2V0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBtb250aCB0aGUgbW9udGggdG8gc2V0ICh6ZXJvLWluZGV4ZWQpXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkYXRlIHRoZSBkYXRlIHRvIHNldFxyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIHNldCBkYXRlXHJcbiAqL1xyXG5jb25zdCBzZXREYXRlID0gKHllYXIsIG1vbnRoLCBkYXRlKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKDApO1xyXG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoeWVhciwgbW9udGgsIGRhdGUpO1xyXG4gIHJldHVybiBuZXdEYXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIHRvZGF5cyBkYXRlXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtEYXRlfSB0b2RheXMgZGF0ZVxyXG4gKi9cclxuY29uc3QgdG9kYXkgPSAoKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgY29uc3QgZGF5ID0gbmV3RGF0ZS5nZXREYXRlKCk7XHJcbiAgY29uc3QgbW9udGggPSBuZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgY29uc3QgeWVhciA9IG5ld0RhdGUuZ2V0RnVsbFllYXIoKTtcclxuICByZXR1cm4gc2V0RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgZGF0ZSB0byBmaXJzdCBkYXkgb2YgdGhlIG1vbnRoXHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcclxuICovXHJcbmNvbnN0IHN0YXJ0T2ZNb250aCA9IChkYXRlKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKDApO1xyXG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIDEpO1xyXG4gIHJldHVybiBuZXdEYXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBkYXRlIHRvIGxhc3QgZGF5IG9mIHRoZSBtb250aFxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0gZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcclxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXHJcbiAqL1xyXG5jb25zdCBsYXN0RGF5T2ZNb250aCA9IChkYXRlKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKDApO1xyXG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCkgKyAxLCAwKTtcclxuICByZXR1cm4gbmV3RGF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGQgZGF5cyB0byBkYXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1EYXlzIHRoZSBkaWZmZXJlbmNlIGluIGRheXNcclxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXHJcbiAqL1xyXG5jb25zdCBhZGREYXlzID0gKF9kYXRlLCBudW1EYXlzKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XHJcbiAgbmV3RGF0ZS5zZXREYXRlKG5ld0RhdGUuZ2V0RGF0ZSgpICsgbnVtRGF5cyk7XHJcbiAgcmV0dXJuIG5ld0RhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU3VidHJhY3QgZGF5cyBmcm9tIGRhdGVcclxuICpcclxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcclxuICogQHBhcmFtIHtudW1iZXJ9IG51bURheXMgdGhlIGRpZmZlcmVuY2UgaW4gZGF5c1xyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcclxuICovXHJcbmNvbnN0IHN1YkRheXMgPSAoX2RhdGUsIG51bURheXMpID0+IGFkZERheXMoX2RhdGUsIC1udW1EYXlzKTtcclxuXHJcbi8qKlxyXG4gKiBBZGQgd2Vla3MgdG8gZGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtV2Vla3MgdGhlIGRpZmZlcmVuY2UgaW4gd2Vla3NcclxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXHJcbiAqL1xyXG5jb25zdCBhZGRXZWVrcyA9IChfZGF0ZSwgbnVtV2Vla3MpID0+IGFkZERheXMoX2RhdGUsIG51bVdlZWtzICogNyk7XHJcblxyXG4vKipcclxuICogU3VidHJhY3Qgd2Vla3MgZnJvbSBkYXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1XZWVrcyB0aGUgZGlmZmVyZW5jZSBpbiB3ZWVrc1xyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcclxuICovXHJcbmNvbnN0IHN1YldlZWtzID0gKF9kYXRlLCBudW1XZWVrcykgPT4gYWRkV2Vla3MoX2RhdGUsIC1udW1XZWVrcyk7XHJcblxyXG4vKipcclxuICogU2V0IGRhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSB3ZWVrIChTdW5kYXkpXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XHJcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxyXG4gKi9cclxuY29uc3Qgc3RhcnRPZldlZWsgPSAoX2RhdGUpID0+IHtcclxuICBjb25zdCBkYXlPZldlZWsgPSBfZGF0ZS5nZXREYXkoKTtcclxuICByZXR1cm4gc3ViRGF5cyhfZGF0ZSwgZGF5T2ZXZWVrKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgZGF0ZSB0byB0aGUgZW5kIG9mIHRoZSB3ZWVrIChTYXR1cmRheSlcclxuICpcclxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcclxuICogQHBhcmFtIHtudW1iZXJ9IG51bVdlZWtzIHRoZSBkaWZmZXJlbmNlIGluIHdlZWtzXHJcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxyXG4gKi9cclxuY29uc3QgZW5kT2ZXZWVrID0gKF9kYXRlKSA9PiB7XHJcbiAgY29uc3QgZGF5T2ZXZWVrID0gX2RhdGUuZ2V0RGF5KCk7XHJcbiAgcmV0dXJuIGFkZERheXMoX2RhdGUsIDYgLSBkYXlPZldlZWspO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZCBtb250aHMgdG8gZGF0ZSBhbmQga2VlcCBkYXRlIHdpdGhpbiBtb250aFxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtTW9udGhzIHRoZSBkaWZmZXJlbmNlIGluIG1vbnRoc1xyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcclxuICovXHJcbmNvbnN0IGFkZE1vbnRocyA9IChfZGF0ZSwgbnVtTW9udGhzKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XHJcblxyXG4gIGNvbnN0IGRhdGVNb250aCA9IChuZXdEYXRlLmdldE1vbnRoKCkgKyAxMiArIG51bU1vbnRocykgJSAxMjtcclxuICBuZXdEYXRlLnNldE1vbnRoKG5ld0RhdGUuZ2V0TW9udGgoKSArIG51bU1vbnRocyk7XHJcbiAga2VlcERhdGVXaXRoaW5Nb250aChuZXdEYXRlLCBkYXRlTW9udGgpO1xyXG5cclxuICByZXR1cm4gbmV3RGF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdWJ0cmFjdCBtb250aHMgZnJvbSBkYXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1Nb250aHMgdGhlIGRpZmZlcmVuY2UgaW4gbW9udGhzXHJcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxyXG4gKi9cclxuY29uc3Qgc3ViTW9udGhzID0gKF9kYXRlLCBudW1Nb250aHMpID0+IGFkZE1vbnRocyhfZGF0ZSwgLW51bU1vbnRocyk7XHJcblxyXG4vKipcclxuICogQWRkIHllYXJzIHRvIGRhdGUgYW5kIGtlZXAgZGF0ZSB3aXRoaW4gbW9udGhcclxuICpcclxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcclxuICogQHBhcmFtIHtudW1iZXJ9IG51bVllYXJzIHRoZSBkaWZmZXJlbmNlIGluIHllYXJzXHJcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxyXG4gKi9cclxuY29uc3QgYWRkWWVhcnMgPSAoX2RhdGUsIG51bVllYXJzKSA9PiBhZGRNb250aHMoX2RhdGUsIG51bVllYXJzICogMTIpO1xyXG5cclxuLyoqXHJcbiAqIFN1YnRyYWN0IHllYXJzIGZyb20gZGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtWWVhcnMgdGhlIGRpZmZlcmVuY2UgaW4geWVhcnNcclxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXHJcbiAqL1xyXG5jb25zdCBzdWJZZWFycyA9IChfZGF0ZSwgbnVtWWVhcnMpID0+IGFkZFllYXJzKF9kYXRlLCAtbnVtWWVhcnMpO1xyXG5cclxuLyoqXHJcbiAqIFNldCBtb250aHMgb2YgZGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbW9udGggemVyby1pbmRleGVkIG1vbnRoIHRvIHNldFxyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcclxuICovXHJcbmNvbnN0IHNldE1vbnRoID0gKF9kYXRlLCBtb250aCkgPT4ge1xyXG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZShfZGF0ZS5nZXRUaW1lKCkpO1xyXG5cclxuICBuZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICBrZWVwRGF0ZVdpdGhpbk1vbnRoKG5ld0RhdGUsIG1vbnRoKTtcclxuXHJcbiAgcmV0dXJuIG5ld0RhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHllYXIgb2YgZGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxyXG4gKiBAcGFyYW0ge251bWJlcn0geWVhciB0aGUgeWVhciB0byBzZXRcclxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXHJcbiAqL1xyXG5jb25zdCBzZXRZZWFyID0gKF9kYXRlLCB5ZWFyKSA9PiB7XHJcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XHJcblxyXG4gIGNvbnN0IG1vbnRoID0gbmV3RGF0ZS5nZXRNb250aCgpO1xyXG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoeWVhcik7XHJcbiAga2VlcERhdGVXaXRoaW5Nb250aChuZXdEYXRlLCBtb250aCk7XHJcblxyXG4gIHJldHVybiBuZXdEYXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiB0aGUgZWFybGllc3QgZGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIGRhdGUgdG8gY29tcGFyZVxyXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVCIGRhdGUgdG8gY29tcGFyZVxyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGVhcmxpZXN0IGRhdGVcclxuICovXHJcbmNvbnN0IG1pbiA9IChkYXRlQSwgZGF0ZUIpID0+IHtcclxuICBsZXQgbmV3RGF0ZSA9IGRhdGVBO1xyXG5cclxuICBpZiAoZGF0ZUIgPCBkYXRlQSkge1xyXG4gICAgbmV3RGF0ZSA9IGRhdGVCO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBEYXRlKG5ld0RhdGUuZ2V0VGltZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gdGhlIGxhdGVzdCBkYXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgZGF0ZSB0byBjb21wYXJlXHJcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUIgZGF0ZSB0byBjb21wYXJlXHJcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgbGF0ZXN0IGRhdGVcclxuICovXHJcbmNvbnN0IG1heCA9IChkYXRlQSwgZGF0ZUIpID0+IHtcclxuICBsZXQgbmV3RGF0ZSA9IGRhdGVBO1xyXG5cclxuICBpZiAoZGF0ZUIgPiBkYXRlQSkge1xyXG4gICAgbmV3RGF0ZSA9IGRhdGVCO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBEYXRlKG5ld0RhdGUuZ2V0VGltZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiBkYXRlcyBhcmUgdGhlIGluIHRoZSBzYW1lIHllYXJcclxuICpcclxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSBkYXRlIHRvIGNvbXBhcmVcclxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcclxuICogQHJldHVybnMge2Jvb2xlYW59IGFyZSBkYXRlcyBpbiB0aGUgc2FtZSB5ZWFyXHJcbiAqL1xyXG5jb25zdCBpc1NhbWVZZWFyID0gKGRhdGVBLCBkYXRlQikgPT5cclxuICBkYXRlQSAmJiBkYXRlQiAmJiBkYXRlQS5nZXRGdWxsWWVhcigpID09PSBkYXRlQi5nZXRGdWxsWWVhcigpO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgaW4gdGhlIHNhbWUgbW9udGhcclxuICpcclxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSBkYXRlIHRvIGNvbXBhcmVcclxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcclxuICogQHJldHVybnMge2Jvb2xlYW59IGFyZSBkYXRlcyBpbiB0aGUgc2FtZSBtb250aFxyXG4gKi9cclxuY29uc3QgaXNTYW1lTW9udGggPSAoZGF0ZUEsIGRhdGVCKSA9PlxyXG4gIGlzU2FtZVllYXIoZGF0ZUEsIGRhdGVCKSAmJiBkYXRlQS5nZXRNb250aCgpID09PSBkYXRlQi5nZXRNb250aCgpO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgc2FtZSBkYXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgdGhlIGRhdGUgdG8gY29tcGFyZVxyXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIHRoZSBkYXRlIHRvIGNvbXBhcmVcclxuICogQHJldHVybnMge2Jvb2xlYW59IGFyZSBkYXRlcyB0aGUgc2FtZSBkYXRlXHJcbiAqL1xyXG5jb25zdCBpc1NhbWVEYXkgPSAoZGF0ZUEsIGRhdGVCKSA9PlxyXG4gIGlzU2FtZU1vbnRoKGRhdGVBLCBkYXRlQikgJiYgZGF0ZUEuZ2V0RGF0ZSgpID09PSBkYXRlQi5nZXREYXRlKCk7XHJcblxyXG4vKipcclxuICogcmV0dXJuIGEgbmV3IGRhdGUgd2l0aGluIG1pbmltdW0gYW5kIG1heGltdW0gZGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGUgZGF0ZSB0byBjaGVja1xyXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XHJcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcclxuICogQHJldHVybnMge0RhdGV9IHRoZSBkYXRlIGJldHdlZW4gbWluIGFuZCBtYXhcclxuICovXHJcbmNvbnN0IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heCA9IChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKSA9PiB7XHJcbiAgbGV0IG5ld0RhdGUgPSBkYXRlO1xyXG5cclxuICBpZiAoZGF0ZSA8IG1pbkRhdGUpIHtcclxuICAgIG5ld0RhdGUgPSBtaW5EYXRlO1xyXG4gIH0gZWxzZSBpZiAobWF4RGF0ZSAmJiBkYXRlID4gbWF4RGF0ZSkge1xyXG4gICAgbmV3RGF0ZSA9IG1heERhdGU7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3IERhdGUobmV3RGF0ZS5nZXRUaW1lKCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIGRhdGVzIGlzIHZhbGlkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGUgZGF0ZSB0byBjaGVja1xyXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XHJcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcclxuICogQHJldHVybiB7Ym9vbGVhbn0gaXMgdGhlcmUgYSBkYXkgd2l0aGluIHRoZSBtb250aCB3aXRoaW4gbWluIGFuZCBtYXggZGF0ZXNcclxuICovXHJcbmNvbnN0IGlzRGF0ZVdpdGhpbk1pbkFuZE1heCA9IChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKSA9PlxyXG4gIGRhdGUgPj0gbWluRGF0ZSAmJiAoIW1heERhdGUgfHwgZGF0ZSA8PSBtYXhEYXRlKTtcclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiBkYXRlcyBtb250aCBpcyBpbnZhbGlkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGUgZGF0ZSB0byBjaGVja1xyXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XHJcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcclxuICogQHJldHVybiB7Ym9vbGVhbn0gaXMgdGhlIG1vbnRoIG91dHNpZGUgbWluIG9yIG1heCBkYXRlc1xyXG4gKi9cclxuY29uc3QgaXNEYXRlc01vbnRoT3V0c2lkZU1pbk9yTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XHJcbiAgbGFzdERheU9mTW9udGgoZGF0ZSkgPCBtaW5EYXRlIHx8IChtYXhEYXRlICYmIHN0YXJ0T2ZNb250aChkYXRlKSA+IG1heERhdGUpO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIGRhdGVzIHllYXIgaXMgaW52YWxpZC5cclxuICpcclxuICogQHBhcmFtIHtEYXRlfSBkYXRlIGRhdGUgdG8gY2hlY2tcclxuICogQHBhcmFtIHtEYXRlfSBtaW5EYXRlIG1pbmltdW0gZGF0ZSB0byBhbGxvd1xyXG4gKiBAcGFyYW0ge0RhdGV9IG1heERhdGUgbWF4aW11bSBkYXRlIHRvIGFsbG93XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IGlzIHRoZSBtb250aCBvdXRzaWRlIG1pbiBvciBtYXggZGF0ZXNcclxuICovXHJcbmNvbnN0IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XHJcbiAgbGFzdERheU9mTW9udGgoc2V0TW9udGgoZGF0ZSwgMTEpKSA8IG1pbkRhdGUgfHxcclxuICAobWF4RGF0ZSAmJiBzdGFydE9mTW9udGgoc2V0TW9udGgoZGF0ZSwgMCkpID4gbWF4RGF0ZSk7XHJcblxyXG4vKipcclxuICogUGFyc2UgYSBkYXRlIHdpdGggZm9ybWF0IE0tRC1ZWVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZVN0cmluZyB0aGUgZGF0ZSBzdHJpbmcgdG8gcGFyc2VcclxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVGb3JtYXQgdGhlIGZvcm1hdCBvZiB0aGUgZGF0ZSBzdHJpbmdcclxuICogQHBhcmFtIHtib29sZWFufSBhZGp1c3REYXRlIHNob3VsZCB0aGUgZGF0ZSBiZSBhZGp1c3RlZFxyXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIHBhcnNlZCBkYXRlXHJcbiAqL1xyXG5jb25zdCBwYXJzZURhdGVTdHJpbmcgPSAoXHJcbiAgZGF0ZVN0cmluZyxcclxuICBkYXRlRm9ybWF0ID0gSU5URVJOQUxfREFURV9GT1JNQVQsXHJcbiAgYWRqdXN0RGF0ZSA9IGZhbHNlXHJcbikgPT4ge1xyXG4gIGxldCBkYXRlO1xyXG4gIGxldCBtb250aDtcclxuICBsZXQgZGF5O1xyXG4gIGxldCB5ZWFyO1xyXG4gIGxldCBwYXJzZWQ7XHJcblxyXG4gIGlmIChkYXRlU3RyaW5nKSB7XHJcbiAgICBsZXQgbW9udGhTdHI7XHJcbiAgICBsZXQgZGF5U3RyO1xyXG4gICAgbGV0IHllYXJTdHI7XHJcblxyXG4gICAgaWYgKGRhdGVGb3JtYXQgPT09IERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQpIHtcclxuICAgICAgW21vbnRoU3RyLCBkYXlTdHIsIHllYXJTdHJdID0gZGF0ZVN0cmluZy5zcGxpdChcIi9cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBbeWVhclN0ciwgbW9udGhTdHIsIGRheVN0cl0gPSBkYXRlU3RyaW5nLnNwbGl0KFwiLVwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoeWVhclN0cikge1xyXG4gICAgICBwYXJzZWQgPSBwYXJzZUludCh5ZWFyU3RyLCAxMCk7XHJcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcclxuICAgICAgICB5ZWFyID0gcGFyc2VkO1xyXG4gICAgICAgIGlmIChhZGp1c3REYXRlKSB7XHJcbiAgICAgICAgICB5ZWFyID0gTWF0aC5tYXgoMCwgeWVhcik7XHJcbiAgICAgICAgICBpZiAoeWVhclN0ci5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRZZWFyID0gdG9kYXkoKS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50WWVhclN0dWIgPVxyXG4gICAgICAgICAgICAgIGN1cnJlbnRZZWFyIC0gKGN1cnJlbnRZZWFyICUgMTAgKiogeWVhclN0ci5sZW5ndGgpO1xyXG4gICAgICAgICAgICB5ZWFyID0gY3VycmVudFllYXJTdHViICsgcGFyc2VkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtb250aFN0cikge1xyXG4gICAgICBwYXJzZWQgPSBwYXJzZUludChtb250aFN0ciwgMTApO1xyXG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB7XHJcbiAgICAgICAgbW9udGggPSBwYXJzZWQ7XHJcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcclxuICAgICAgICAgIG1vbnRoID0gTWF0aC5tYXgoMSwgbW9udGgpO1xyXG4gICAgICAgICAgbW9udGggPSBNYXRoLm1pbigxMiwgbW9udGgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtb250aCAmJiBkYXlTdHIgJiYgeWVhciAhPSBudWxsKSB7XHJcbiAgICAgIHBhcnNlZCA9IHBhcnNlSW50KGRheVN0ciwgMTApO1xyXG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB7XHJcbiAgICAgICAgZGF5ID0gcGFyc2VkO1xyXG4gICAgICAgIGlmIChhZGp1c3REYXRlKSB7XHJcbiAgICAgICAgICBjb25zdCBsYXN0RGF5T2ZUaGVNb250aCA9IHNldERhdGUoeWVhciwgbW9udGgsIDApLmdldERhdGUoKTtcclxuICAgICAgICAgIGRheSA9IE1hdGgubWF4KDEsIGRheSk7XHJcbiAgICAgICAgICBkYXkgPSBNYXRoLm1pbihsYXN0RGF5T2ZUaGVNb250aCwgZGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAobW9udGggJiYgZGF5ICYmIHllYXIgIT0gbnVsbCkge1xyXG4gICAgICBkYXRlID0gc2V0RGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGF0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGb3JtYXQgYSBkYXRlIHRvIGZvcm1hdCBNTS1ERC1ZWVlZXHJcbiAqXHJcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSB0aGUgZGF0ZSB0byBmb3JtYXRcclxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVGb3JtYXQgdGhlIGZvcm1hdCBvZiB0aGUgZGF0ZSBzdHJpbmdcclxuICogQHJldHVybnMge3N0cmluZ30gdGhlIGZvcm1hdHRlZCBkYXRlIHN0cmluZ1xyXG4gKi9cclxuY29uc3QgZm9ybWF0RGF0ZSA9IChkYXRlLCBkYXRlRm9ybWF0ID0gSU5URVJOQUxfREFURV9GT1JNQVQpID0+IHtcclxuICBjb25zdCBwYWRaZXJvcyA9ICh2YWx1ZSwgbGVuZ3RoKSA9PiBgMDAwMCR7dmFsdWV9YC5zbGljZSgtbGVuZ3RoKTtcclxuXHJcbiAgY29uc3QgbW9udGggPSBkYXRlLmdldE1vbnRoKCkgKyAxO1xyXG4gIGNvbnN0IGRheSA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG4gIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XHJcblxyXG4gIGlmIChkYXRlRm9ybWF0ID09PSBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUKSB7XHJcbiAgICByZXR1cm4gW3BhZFplcm9zKG1vbnRoLCAyKSwgcGFkWmVyb3MoZGF5LCAyKSwgcGFkWmVyb3MoeWVhciwgNCldLmpvaW4oXCIvXCIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFtwYWRaZXJvcyh5ZWFyLCA0KSwgcGFkWmVyb3MobW9udGgsIDIpLCBwYWRaZXJvcyhkYXksIDIpXS5qb2luKFwiLVwiKTtcclxufTtcclxuXHJcbi8vICNlbmRyZWdpb24gRGF0ZSBNYW5pcHVsYXRpb24gRnVuY3Rpb25zXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgZ3JpZCBzdHJpbmcgZnJvbSBhbiBhcnJheSBvZiBodG1sIHN0cmluZ3NcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmdbXX0gaHRtbEFycmF5IHRoZSBhcnJheSBvZiBodG1sIGl0ZW1zXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSByb3dTaXplIHRoZSBsZW5ndGggb2YgYSByb3dcclxuICogQHJldHVybnMge3N0cmluZ30gdGhlIGdyaWQgc3RyaW5nXHJcbiAqL1xyXG5jb25zdCBsaXN0VG9HcmlkSHRtbCA9IChodG1sQXJyYXksIHJvd1NpemUpID0+IHtcclxuICBjb25zdCBncmlkID0gW107XHJcbiAgbGV0IHJvdyA9IFtdO1xyXG5cclxuICBsZXQgaSA9IDA7XHJcbiAgd2hpbGUgKGkgPCBodG1sQXJyYXkubGVuZ3RoKSB7XHJcbiAgICByb3cgPSBbXTtcclxuXHJcbiAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcclxuICAgIHdoaWxlIChpIDwgaHRtbEFycmF5Lmxlbmd0aCAmJiByb3cubGVuZ3RoIDwgcm93U2l6ZSkge1xyXG4gICAgICBjb25zdCB0ZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcclxuICAgICAgdGQuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGh0bWxBcnJheVtpXSk7XHJcbiAgICAgIHJvdy5wdXNoKHRkKTtcclxuICAgICAgaSArPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIHJvdy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XHJcbiAgICAgIHRyLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBlbGVtZW50KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGdyaWQucHVzaCh0cik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZ3JpZDtcclxufTtcclxuXHJcbmNvbnN0IGNyZWF0ZVRhYmxlQm9keSA9IChncmlkKSA9PiB7XHJcbiAgY29uc3QgdGFibGVCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xyXG4gIGdyaWQuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG4gICAgdGFibGVCb2R5Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBlbGVtZW50KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRhYmxlQm9keTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBzZXQgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IGFuZCBkaXNwYXRjaCBhIGNoYW5nZSBldmVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsIFRoZSBlbGVtZW50IHRvIHVwZGF0ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgZWxlbWVudFxyXG4gKi9cclxuY29uc3QgY2hhbmdlRWxlbWVudFZhbHVlID0gKGVsLCB2YWx1ZSA9IFwiXCIpID0+IHtcclxuICBjb25zdCBlbGVtZW50VG9DaGFuZ2UgPSBlbDtcclxuICBlbGVtZW50VG9DaGFuZ2UudmFsdWUgPSB2YWx1ZTtcclxuXHJcbiAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoXCJjaGFuZ2VcIiwge1xyXG4gICAgYnViYmxlczogdHJ1ZSxcclxuICAgIGNhbmNlbGFibGU6IHRydWUsXHJcbiAgICBkZXRhaWw6IHsgdmFsdWUgfSxcclxuICB9KTtcclxuICBlbGVtZW50VG9DaGFuZ2UuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIuXHJcbiAqIEB0eXBlZGVmIHtPYmplY3R9IERhdGVQaWNrZXJDb250ZXh0XHJcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IGNhbGVuZGFyRWxcclxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZGF0ZVBpY2tlckVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTElucHV0RWxlbWVudH0gaW50ZXJuYWxJbnB1dEVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTElucHV0RWxlbWVudH0gZXh0ZXJuYWxJbnB1dEVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IHN0YXR1c0VsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IGZpcnN0WWVhckNodW5rRWxcclxuICogQHByb3BlcnR5IHtEYXRlfSBjYWxlbmRhckRhdGVcclxuICogQHByb3BlcnR5IHtEYXRlfSBtaW5EYXRlXHJcbiAqIEBwcm9wZXJ0eSB7RGF0ZX0gbWF4RGF0ZVxyXG4gKiBAcHJvcGVydHkge0RhdGV9IHNlbGVjdGVkRGF0ZVxyXG4gKiBAcHJvcGVydHkge0RhdGV9IHJhbmdlRGF0ZVxyXG4gKiBAcHJvcGVydHkge0RhdGV9IGRlZmF1bHREYXRlXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEdldCBhbiBvYmplY3Qgb2YgdGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cclxuICogZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyXHJcbiAqIEByZXR1cm5zIHtEYXRlUGlja2VyQ29udGV4dH0gZWxlbWVudHNcclxuICovXHJcbmNvbnN0IGdldERhdGVQaWNrZXJDb250ZXh0ID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgZGF0ZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1BJQ0tFUik7XHJcblxyXG4gIGlmICghZGF0ZVBpY2tlckVsKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZW1lbnQgaXMgbWlzc2luZyBvdXRlciAke0RBVEVfUElDS0VSfWApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW50ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBEQVRFX1BJQ0tFUl9JTlRFUk5BTF9JTlBVVFxyXG4gICk7XHJcbiAgY29uc3QgZXh0ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVFxyXG4gICk7XHJcbiAgY29uc3QgY2FsZW5kYXJFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX0NBTEVOREFSKTtcclxuICBjb25zdCB0b2dnbGVCdG5FbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX0JVVFRPTik7XHJcbiAgY29uc3Qgc3RhdHVzRWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihEQVRFX1BJQ0tFUl9TVEFUVVMpO1xyXG4gIGNvbnN0IGZpcnN0WWVhckNodW5rRWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSKTtcclxuXHJcbiAgY29uc3QgaW5wdXREYXRlID0gcGFyc2VEYXRlU3RyaW5nKFxyXG4gICAgZXh0ZXJuYWxJbnB1dEVsLnZhbHVlLFxyXG4gICAgREVGQVVMVF9FWFRFUk5BTF9EQVRFX0ZPUk1BVCxcclxuICAgIHRydWVcclxuICApO1xyXG4gIGNvbnN0IHNlbGVjdGVkRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhpbnRlcm5hbElucHV0RWwudmFsdWUpO1xyXG5cclxuICBjb25zdCBjYWxlbmRhckRhdGUgPSBwYXJzZURhdGVTdHJpbmcoY2FsZW5kYXJFbC5kYXRhc2V0LnZhbHVlKTtcclxuICBjb25zdCBtaW5EYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1pbkRhdGUpO1xyXG4gIGNvbnN0IG1heERhdGUgPSBwYXJzZURhdGVTdHJpbmcoZGF0ZVBpY2tlckVsLmRhdGFzZXQubWF4RGF0ZSk7XHJcbiAgY29uc3QgcmFuZ2VEYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0LnJhbmdlRGF0ZSk7XHJcbiAgY29uc3QgZGVmYXVsdERhdGUgPSBwYXJzZURhdGVTdHJpbmcoZGF0ZVBpY2tlckVsLmRhdGFzZXQuZGVmYXVsdERhdGUpO1xyXG5cclxuICBpZiAobWluRGF0ZSAmJiBtYXhEYXRlICYmIG1pbkRhdGUgPiBtYXhEYXRlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaW5pbXVtIGRhdGUgY2Fubm90IGJlIGFmdGVyIG1heGltdW0gZGF0ZVwiKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBjYWxlbmRhckRhdGUsXHJcbiAgICBtaW5EYXRlLFxyXG4gICAgdG9nZ2xlQnRuRWwsXHJcbiAgICBzZWxlY3RlZERhdGUsXHJcbiAgICBtYXhEYXRlLFxyXG4gICAgZmlyc3RZZWFyQ2h1bmtFbCxcclxuICAgIGRhdGVQaWNrZXJFbCxcclxuICAgIGlucHV0RGF0ZSxcclxuICAgIGludGVybmFsSW5wdXRFbCxcclxuICAgIGV4dGVybmFsSW5wdXRFbCxcclxuICAgIGNhbGVuZGFyRWwsXHJcbiAgICByYW5nZURhdGUsXHJcbiAgICBkZWZhdWx0RGF0ZSxcclxuICAgIHN0YXR1c0VsLFxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogRGlzYWJsZSB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGRpc2FibGUgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgdG9nZ2xlQnRuRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuXHJcbiAgdG9nZ2xlQnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xyXG4gIGV4dGVybmFsSW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2sgZm9yIGFyaWEtZGlzYWJsZWQgb24gaW5pdGlhbGl6YXRpb25cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgYXJpYURpc2FibGUgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgdG9nZ2xlQnRuRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuXHJcbiAgdG9nZ2xlQnRuRWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCB0cnVlKTtcclxuICBleHRlcm5hbElucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCB0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbmFibGUgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBlbmFibGUgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgdG9nZ2xlQnRuRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuXHJcbiAgdG9nZ2xlQnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcclxuICBleHRlcm5hbElucHV0RWwuZGlzYWJsZWQgPSBmYWxzZTtcclxufTtcclxuXHJcbi8vICNyZWdpb24gVmFsaWRhdGlvblxyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlIHRoZSB2YWx1ZSBpbiB0aGUgaW5wdXQgYXMgYSB2YWxpZCBkYXRlIG9mIGZvcm1hdCBNL0QvWVlZWVxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBpc0RhdGVJbnB1dEludmFsaWQgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgbWluRGF0ZSwgbWF4RGF0ZSB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xyXG5cclxuICBjb25zdCBkYXRlU3RyaW5nID0gZXh0ZXJuYWxJbnB1dEVsLnZhbHVlO1xyXG4gIGxldCBpc0ludmFsaWQgPSBmYWxzZTtcclxuXHJcbiAgaWYgKGRhdGVTdHJpbmcpIHtcclxuICAgIGlzSW52YWxpZCA9IHRydWU7XHJcblxyXG4gICAgY29uc3QgZGF0ZVN0cmluZ1BhcnRzID0gZGF0ZVN0cmluZy5zcGxpdChcIi9cIik7XHJcbiAgICBjb25zdCBbbW9udGgsIGRheSwgeWVhcl0gPSBkYXRlU3RyaW5nUGFydHMubWFwKChzdHIpID0+IHtcclxuICAgICAgbGV0IHZhbHVlO1xyXG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChzdHIsIDEwKTtcclxuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkgdmFsdWUgPSBwYXJzZWQ7XHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtb250aCAmJiBkYXkgJiYgeWVhciAhPSBudWxsKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrRGF0ZSA9IHNldERhdGUoeWVhciwgbW9udGggLSAxLCBkYXkpO1xyXG5cclxuICAgICAgaWYgKFxyXG4gICAgICAgIGNoZWNrRGF0ZS5nZXRNb250aCgpID09PSBtb250aCAtIDEgJiZcclxuICAgICAgICBjaGVja0RhdGUuZ2V0RGF0ZSgpID09PSBkYXkgJiZcclxuICAgICAgICBjaGVja0RhdGUuZ2V0RnVsbFllYXIoKSA9PT0geWVhciAmJlxyXG4gICAgICAgIGRhdGVTdHJpbmdQYXJ0c1syXS5sZW5ndGggPT09IDQgJiZcclxuICAgICAgICBpc0RhdGVXaXRoaW5NaW5BbmRNYXgoY2hlY2tEYXRlLCBtaW5EYXRlLCBtYXhEYXRlKVxyXG4gICAgICApIHtcclxuICAgICAgICBpc0ludmFsaWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGlzSW52YWxpZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZSB0aGUgdmFsdWUgaW4gdGhlIGlucHV0IGFzIGEgdmFsaWQgZGF0ZSBvZiBmb3JtYXQgTS9EL1lZWVlcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgdmFsaWRhdGVEYXRlSW5wdXQgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xyXG4gIGNvbnN0IGlzSW52YWxpZCA9IGlzRGF0ZUlucHV0SW52YWxpZChleHRlcm5hbElucHV0RWwpO1xyXG5cclxuICBpZiAoaXNJbnZhbGlkICYmICFleHRlcm5hbElucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UpIHtcclxuICAgIGV4dGVybmFsSW5wdXRFbC5zZXRDdXN0b21WYWxpZGl0eShWQUxJREFUSU9OX01FU1NBR0UpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCFpc0ludmFsaWQgJiYgZXh0ZXJuYWxJbnB1dEVsLnZhbGlkYXRpb25NZXNzYWdlID09PSBWQUxJREFUSU9OX01FU1NBR0UpIHtcclxuICAgIGV4dGVybmFsSW5wdXRFbC5zZXRDdXN0b21WYWxpZGl0eShcIlwiKTtcclxuICB9XHJcbn07XHJcblxyXG4vLyAjZW5kcmVnaW9uIFZhbGlkYXRpb25cclxuXHJcbi8qKlxyXG4gKiBFbmFibGUgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCByZWNvbmNpbGVJbnB1dFZhbHVlcyA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsLCBpbnB1dERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuICBsZXQgbmV3VmFsdWUgPSBcIlwiO1xyXG5cclxuICBpZiAoaW5wdXREYXRlICYmICFpc0RhdGVJbnB1dEludmFsaWQoZWwpKSB7XHJcbiAgICBuZXdWYWx1ZSA9IGZvcm1hdERhdGUoaW5wdXREYXRlKTtcclxuICB9XHJcblxyXG4gIGlmIChpbnRlcm5hbElucHV0RWwudmFsdWUgIT09IG5ld1ZhbHVlKSB7XHJcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW50ZXJuYWxJbnB1dEVsLCBuZXdWYWx1ZSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNlbGVjdCB0aGUgdmFsdWUgb2YgdGhlIGRhdGUgcGlja2VyIGlucHV0cy5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZVN0cmluZyBUaGUgZGF0ZSBzdHJpbmcgdG8gdXBkYXRlIGluIFlZWVktTU0tREQgZm9ybWF0XHJcbiAqL1xyXG5jb25zdCBzZXRDYWxlbmRhclZhbHVlID0gKGVsLCBkYXRlU3RyaW5nKSA9PiB7XHJcbiAgY29uc3QgcGFyc2VkRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhkYXRlU3RyaW5nKTtcclxuXHJcbiAgaWYgKHBhcnNlZERhdGUpIHtcclxuICAgIGNvbnN0IGZvcm1hdHRlZERhdGUgPSBmb3JtYXREYXRlKHBhcnNlZERhdGUsIERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQpO1xyXG5cclxuICAgIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBpbnRlcm5hbElucHV0RWwsIGV4dGVybmFsSW5wdXRFbCB9ID1cclxuICAgICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xyXG5cclxuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnRlcm5hbElucHV0RWwsIGRhdGVTdHJpbmcpO1xyXG4gICAgY2hhbmdlRWxlbWVudFZhbHVlKGV4dGVybmFsSW5wdXRFbCwgZm9ybWF0dGVkRGF0ZSk7XHJcblxyXG4gICAgdmFsaWRhdGVEYXRlSW5wdXQoZGF0ZVBpY2tlckVsKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRW5oYW5jZSBhbiBpbnB1dCB3aXRoIHRoZSBkYXRlIHBpY2tlciBlbGVtZW50c1xyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBUaGUgaW5pdGlhbCB3cmFwcGluZyBlbGVtZW50IG9mIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGVuaGFuY2VEYXRlUGlja2VyID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgZGF0ZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1BJQ0tFUik7XHJcbiAgY29uc3QgeyBkZWZhdWx0VmFsdWUgfSA9IGRhdGVQaWNrZXJFbC5kYXRhc2V0O1xyXG5cclxuICBjb25zdCBpbnRlcm5hbElucHV0RWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihgaW5wdXRgKTtcclxuXHJcbiAgaWYgKCFpbnRlcm5hbElucHV0RWwpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgJHtEQVRFX1BJQ0tFUn0gaXMgbWlzc2luZyBpbm5lciBpbnB1dGApO1xyXG4gIH1cclxuXHJcbiAgaWYgKGludGVybmFsSW5wdXRFbC52YWx1ZSkge1xyXG4gICAgaW50ZXJuYWxJbnB1dEVsLnZhbHVlID0gXCJcIjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1pbkRhdGUgPSBwYXJzZURhdGVTdHJpbmcoXHJcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlIHx8IGludGVybmFsSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJtaW5cIilcclxuICApO1xyXG4gIGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlXHJcbiAgICA/IGZvcm1hdERhdGUobWluRGF0ZSlcclxuICAgIDogREVGQVVMVF9NSU5fREFURTtcclxuXHJcbiAgY29uc3QgbWF4RGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhcclxuICAgIGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1heERhdGUgfHwgaW50ZXJuYWxJbnB1dEVsLmdldEF0dHJpYnV0ZShcIm1heFwiKVxyXG4gICk7XHJcbiAgaWYgKG1heERhdGUpIHtcclxuICAgIGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1heERhdGUgPSBmb3JtYXREYXRlKG1heERhdGUpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY2FsZW5kYXJXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjYWxlbmRhcldyYXBwZXIuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9XUkFQUEVSX0NMQVNTKTtcclxuXHJcbiAgY29uc3QgZXh0ZXJuYWxJbnB1dEVsID0gaW50ZXJuYWxJbnB1dEVsLmNsb25lTm9kZSgpO1xyXG4gIGV4dGVybmFsSW5wdXRFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTKTtcclxuICBleHRlcm5hbElucHV0RWwudHlwZSA9IFwidGV4dFwiO1xyXG5cclxuICBjYWxlbmRhcldyYXBwZXIuYXBwZW5kQ2hpbGQoZXh0ZXJuYWxJbnB1dEVsKTtcclxuICBjYWxlbmRhcldyYXBwZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFxyXG4gICAgXCJiZWZvcmVlbmRcIixcclxuICAgIFNhbml0aXplci5lc2NhcGVIVE1MYFxyXG4gICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCIke0RBVEVfUElDS0VSX0JVVFRPTl9DTEFTU31cIiBhcmlhLWhhc3BvcHVwPVwidHJ1ZVwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgY2FsZW5kYXJcIj48L2J1dHRvbj5cclxuICAgIDxkaXYgY2xhc3M9XCIke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfVwiIHJvbGU9XCJhcHBsaWNhdGlvblwiIGhpZGRlbj48L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ1c2Etc3Itb25seSAke0RBVEVfUElDS0VSX1NUQVRVU19DTEFTU31cIiByb2xlPVwic3RhdHVzXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PC9kaXY+YFxyXG4gICk7XHJcblxyXG4gIGludGVybmFsSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XHJcbiAgaW50ZXJuYWxJbnB1dEVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgaW50ZXJuYWxJbnB1dEVsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICBpbnRlcm5hbElucHV0RWwuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9JTlRFUk5BTF9JTlBVVF9DTEFTUyk7XHJcbiAgaW50ZXJuYWxJbnB1dEVsLnJlbW92ZUF0dHJpYnV0ZShcImlkXCIpO1xyXG4gIGludGVybmFsSW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoXCJuYW1lXCIpO1xyXG4gIGludGVybmFsSW5wdXRFbC5yZXF1aXJlZCA9IGZhbHNlO1xyXG5cclxuICBkYXRlUGlja2VyRWwuYXBwZW5kQ2hpbGQoY2FsZW5kYXJXcmFwcGVyKTtcclxuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9JTklUSUFMSVpFRF9DTEFTUyk7XHJcblxyXG4gIGlmIChkZWZhdWx0VmFsdWUpIHtcclxuICAgIHNldENhbGVuZGFyVmFsdWUoZGF0ZVBpY2tlckVsLCBkZWZhdWx0VmFsdWUpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGludGVybmFsSW5wdXRFbC5kaXNhYmxlZCkge1xyXG4gICAgZGlzYWJsZShkYXRlUGlja2VyRWwpO1xyXG4gICAgaW50ZXJuYWxJbnB1dEVsLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAoaW50ZXJuYWxJbnB1dEVsLmhhc0F0dHJpYnV0ZShcImFyaWEtZGlzYWJsZWRcIikpIHtcclxuICAgIGFyaWFEaXNhYmxlKGRhdGVQaWNrZXJFbCk7XHJcbiAgICBpbnRlcm5hbElucHV0RWwucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiKTtcclxuICB9XHJcbn07XHJcblxyXG4vLyAjcmVnaW9uIENhbGVuZGFyIC0gRGF0ZSBTZWxlY3Rpb24gVmlld1xyXG5cclxuLyoqXHJcbiAqIHJlbmRlciB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZVRvRGlzcGxheSBhIGRhdGUgdG8gcmVuZGVyIG9uIHRoZSBjYWxlbmRhclxyXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IGEgcmVmZXJlbmNlIHRvIHRoZSBuZXcgY2FsZW5kYXIgZWxlbWVudFxyXG4gKi9cclxuY29uc3QgcmVuZGVyQ2FsZW5kYXIgPSAoZWwsIF9kYXRlVG9EaXNwbGF5KSA9PiB7XHJcbiAgY29uc3Qge1xyXG4gICAgZGF0ZVBpY2tlckVsLFxyXG4gICAgY2FsZW5kYXJFbCxcclxuICAgIHN0YXR1c0VsLFxyXG4gICAgc2VsZWN0ZWREYXRlLFxyXG4gICAgbWF4RGF0ZSxcclxuICAgIG1pbkRhdGUsXHJcbiAgICByYW5nZURhdGUsXHJcbiAgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuICBjb25zdCB0b2RheXNEYXRlID0gdG9kYXkoKTtcclxuICBsZXQgZGF0ZVRvRGlzcGxheSA9IF9kYXRlVG9EaXNwbGF5IHx8IHRvZGF5c0RhdGU7XHJcblxyXG4gIGNvbnN0IGNhbGVuZGFyV2FzSGlkZGVuID0gY2FsZW5kYXJFbC5oaWRkZW47XHJcblxyXG4gIGNvbnN0IGZvY3VzZWREYXRlID0gYWRkRGF5cyhkYXRlVG9EaXNwbGF5LCAwKTtcclxuICBjb25zdCBmb2N1c2VkTW9udGggPSBkYXRlVG9EaXNwbGF5LmdldE1vbnRoKCk7XHJcbiAgY29uc3QgZm9jdXNlZFllYXIgPSBkYXRlVG9EaXNwbGF5LmdldEZ1bGxZZWFyKCk7XHJcblxyXG4gIGNvbnN0IHByZXZNb250aCA9IHN1Yk1vbnRocyhkYXRlVG9EaXNwbGF5LCAxKTtcclxuICBjb25zdCBuZXh0TW9udGggPSBhZGRNb250aHMoZGF0ZVRvRGlzcGxheSwgMSk7XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRGb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZShkYXRlVG9EaXNwbGF5KTtcclxuXHJcbiAgY29uc3QgZmlyc3RPZk1vbnRoID0gc3RhcnRPZk1vbnRoKGRhdGVUb0Rpc3BsYXkpO1xyXG4gIGNvbnN0IHByZXZCdXR0b25zRGlzYWJsZWQgPSBpc1NhbWVNb250aChkYXRlVG9EaXNwbGF5LCBtaW5EYXRlKTtcclxuICBjb25zdCBuZXh0QnV0dG9uc0Rpc2FibGVkID0gaXNTYW1lTW9udGgoZGF0ZVRvRGlzcGxheSwgbWF4RGF0ZSk7XHJcblxyXG4gIGNvbnN0IHJhbmdlQ29uY2x1c2lvbkRhdGUgPSBzZWxlY3RlZERhdGUgfHwgZGF0ZVRvRGlzcGxheTtcclxuICBjb25zdCByYW5nZVN0YXJ0RGF0ZSA9IHJhbmdlRGF0ZSAmJiBtaW4ocmFuZ2VDb25jbHVzaW9uRGF0ZSwgcmFuZ2VEYXRlKTtcclxuICBjb25zdCByYW5nZUVuZERhdGUgPSByYW5nZURhdGUgJiYgbWF4KHJhbmdlQ29uY2x1c2lvbkRhdGUsIHJhbmdlRGF0ZSk7XHJcblxyXG4gIGNvbnN0IHdpdGhpblJhbmdlU3RhcnREYXRlID0gcmFuZ2VEYXRlICYmIGFkZERheXMocmFuZ2VTdGFydERhdGUsIDEpO1xyXG4gIGNvbnN0IHdpdGhpblJhbmdlRW5kRGF0ZSA9IHJhbmdlRGF0ZSAmJiBzdWJEYXlzKHJhbmdlRW5kRGF0ZSwgMSk7XHJcblxyXG4gIGNvbnN0IG1vbnRoTGFiZWwgPSBNT05USF9MQUJFTFNbZm9jdXNlZE1vbnRoXTtcclxuXHJcbiAgY29uc3QgZ2VuZXJhdGVEYXRlSHRtbCA9IChkYXRlVG9SZW5kZXIpID0+IHtcclxuICAgIGNvbnN0IGNsYXNzZXMgPSBbQ0FMRU5EQVJfREFURV9DTEFTU107XHJcbiAgICBjb25zdCBkYXkgPSBkYXRlVG9SZW5kZXIuZ2V0RGF0ZSgpO1xyXG4gICAgY29uc3QgbW9udGggPSBkYXRlVG9SZW5kZXIuZ2V0TW9udGgoKTtcclxuICAgIGNvbnN0IHllYXIgPSBkYXRlVG9SZW5kZXIuZ2V0RnVsbFllYXIoKTtcclxuICAgIGNvbnN0IGRheU9mV2VlayA9IGRhdGVUb1JlbmRlci5nZXREYXkoKTtcclxuXHJcbiAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZShkYXRlVG9SZW5kZXIpO1xyXG5cclxuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcclxuXHJcbiAgICBjb25zdCBpc0Rpc2FibGVkID0gIWlzRGF0ZVdpdGhpbk1pbkFuZE1heChkYXRlVG9SZW5kZXIsIG1pbkRhdGUsIG1heERhdGUpO1xyXG4gICAgY29uc3QgaXNTZWxlY3RlZCA9IGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHNlbGVjdGVkRGF0ZSk7XHJcblxyXG4gICAgaWYgKGlzU2FtZU1vbnRoKGRhdGVUb1JlbmRlciwgcHJldk1vbnRoKSkge1xyXG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9QUkVWSU9VU19NT05USF9DTEFTUyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzU2FtZU1vbnRoKGRhdGVUb1JlbmRlciwgZm9jdXNlZERhdGUpKSB7XHJcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhfQ0xBU1MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc1NhbWVNb250aChkYXRlVG9SZW5kZXIsIG5leHRNb250aCkpIHtcclxuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfTkVYVF9NT05USF9DTEFTUyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcclxuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfU0VMRUNURURfQ0xBU1MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCB0b2RheXNEYXRlKSkge1xyXG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9UT0RBWV9DTEFTUyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJhbmdlRGF0ZSkge1xyXG4gICAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgcmFuZ2VEYXRlKSkge1xyXG4gICAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1JBTkdFX0RBVEVfQ0xBU1MpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgcmFuZ2VTdGFydERhdGUpKSB7XHJcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9TVEFSVF9DTEFTUyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCByYW5nZUVuZERhdGUpKSB7XHJcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9FTkRfQ0xBU1MpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgaXNEYXRlV2l0aGluTWluQW5kTWF4KFxyXG4gICAgICAgICAgZGF0ZVRvUmVuZGVyLFxyXG4gICAgICAgICAgd2l0aGluUmFuZ2VTdGFydERhdGUsXHJcbiAgICAgICAgICB3aXRoaW5SYW5nZUVuZERhdGVcclxuICAgICAgICApXHJcbiAgICAgICkge1xyXG4gICAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1dJVEhJTl9SQU5HRV9DTEFTUyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgZm9jdXNlZERhdGUpKSB7XHJcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XHJcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX0ZPQ1VTRURfQ0xBU1MpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1vbnRoU3RyID0gTU9OVEhfTEFCRUxTW21vbnRoXTtcclxuICAgIGNvbnN0IGRheVN0ciA9IERBWV9PRl9XRUVLX0xBQkVMU1tkYXlPZldlZWtdO1xyXG5cclxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcclxuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCB0YWJpbmRleCk7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5qb2luKFwiIFwiKSk7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1kYXlcIiwgZGF5KTtcclxuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1vbnRoXCIsIG1vbnRoICsgMSk7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS15ZWFyXCIsIHllYXIpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgZm9ybWF0dGVkRGF0ZSk7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFxyXG4gICAgICBcImFyaWEtbGFiZWxcIixcclxuICAgICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtkYXl9ICR7bW9udGhTdHJ9ICR7eWVhcn0gJHtkYXlTdHJ9YFxyXG4gICAgKTtcclxuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIsIGlzU2VsZWN0ZWQgPyBcInRydWVcIiA6IFwiZmFsc2VcIik7XHJcbiAgICBpZiAoaXNEaXNhYmxlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgYnRuLnRleHRDb250ZW50ID0gZGF5O1xyXG5cclxuICAgIHJldHVybiBidG47XHJcbiAgfTtcclxuXHJcbiAgLy8gc2V0IGRhdGUgdG8gZmlyc3QgcmVuZGVyZWQgZGF5XHJcbiAgZGF0ZVRvRGlzcGxheSA9IHN0YXJ0T2ZXZWVrKGZpcnN0T2ZNb250aCk7XHJcblxyXG4gIGNvbnN0IGRheXMgPSBbXTtcclxuXHJcbiAgd2hpbGUgKFxyXG4gICAgZGF5cy5sZW5ndGggPCAyOCB8fFxyXG4gICAgZGF0ZVRvRGlzcGxheS5nZXRNb250aCgpID09PSBmb2N1c2VkTW9udGggfHxcclxuICAgIGRheXMubGVuZ3RoICUgNyAhPT0gMFxyXG4gICkge1xyXG4gICAgZGF5cy5wdXNoKGdlbmVyYXRlRGF0ZUh0bWwoZGF0ZVRvRGlzcGxheSkpO1xyXG4gICAgZGF0ZVRvRGlzcGxheSA9IGFkZERheXMoZGF0ZVRvRGlzcGxheSwgMSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkYXRlc0dyaWQgPSBsaXN0VG9HcmlkSHRtbChkYXlzLCA3KTtcclxuXHJcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBjYWxlbmRhckVsLmNsb25lTm9kZSgpO1xyXG4gIG5ld0NhbGVuZGFyLmRhdGFzZXQudmFsdWUgPSBjdXJyZW50Rm9ybWF0dGVkRGF0ZTtcclxuICBuZXdDYWxlbmRhci5zdHlsZS50b3AgPSBgJHtkYXRlUGlja2VyRWwub2Zmc2V0SGVpZ2h0fXB4YDtcclxuICBuZXdDYWxlbmRhci5oaWRkZW4gPSBmYWxzZTtcclxuICBuZXdDYWxlbmRhci5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBcclxuICAgIDxkaXYgdGFiaW5kZXg9XCItMVwiIGNsYXNzPVwiJHtDQUxFTkRBUl9EQVRFX1BJQ0tFUl9DTEFTU31cIj5cclxuICAgICAgPGRpdiBjbGFzcz1cIiR7Q0FMRU5EQVJfUk9XX0NMQVNTfVwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfQ0VMTF9DRU5URVJfSVRFTVNfQ0xBU1N9XCI+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DTEFTU31cIlxyXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiTmF2aWdhdGUgYmFjayBvbmUgeWVhclwiXHJcbiAgICAgICAgICAgICR7cHJldkJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cclxuICAgICAgICAgID48L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxyXG4gICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX1BSRVZJT1VTX01PTlRIX0NMQVNTfVwiXHJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBiYWNrIG9uZSBtb250aFwiXHJcbiAgICAgICAgICAgICR7cHJldkJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cclxuICAgICAgICAgID48L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX01PTlRIX0xBQkVMX0NMQVNTfVwiPlxyXG4gICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX01PTlRIX1NFTEVDVElPTl9DTEFTU31cIiBhcmlhLWxhYmVsPVwiJHttb250aExhYmVsfS4gU2VsZWN0IG1vbnRoXCJcclxuICAgICAgICAgID4ke21vbnRoTGFiZWx9PC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIiR7Zm9jdXNlZFllYXJ9LiBTZWxlY3QgeWVhclwiXHJcbiAgICAgICAgICA+JHtmb2N1c2VkWWVhcn08L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxyXG4gICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1N9XCJcclxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoXCJcclxuICAgICAgICAgICAgJHtuZXh0QnV0dG9uc0Rpc2FibGVkID8gYGRpc2FibGVkPVwiZGlzYWJsZWRcImAgOiBcIlwifVxyXG4gICAgICAgICAgPjwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfQ0VMTF9DRU5URVJfSVRFTVNfQ0xBU1N9XCI+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfTkVYVF9ZRUFSX0NMQVNTfVwiXHJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyXCJcclxuICAgICAgICAgICAgJHtuZXh0QnV0dG9uc0Rpc2FibGVkID8gYGRpc2FibGVkPVwiZGlzYWJsZWRcImAgOiBcIlwifVxyXG4gICAgICAgICAgPjwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICAgYDtcclxuXHJcbiAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XHJcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xyXG5cclxuICBjb25zdCB0YWJsZUhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhlYWRcIik7XHJcbiAgdGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlSGVhZCk7XHJcbiAgY29uc3QgdGFibGVIZWFkUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xyXG4gIHRhYmxlSGVhZC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGVIZWFkUm93KTtcclxuXHJcbiAgY29uc3QgZGF5c09mV2VlayA9IHtcclxuICAgIFN1bmRheTogXCJTXCIsXHJcbiAgICBNb25kYXk6IFwiTVwiLFxyXG4gICAgVHVlc2RheTogXCJUXCIsXHJcbiAgICBXZWRuZXNkYXk6IFwiV1wiLFxyXG4gICAgVGh1cnNkYXk6IFwiVGhcIixcclxuICAgIEZyaWRheTogXCJGclwiLFxyXG4gICAgU2F0dXJkYXk6IFwiU1wiLFxyXG4gIH07XHJcblxyXG4gIE9iamVjdC5rZXlzKGRheXNPZldlZWspLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgY29uc3QgdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhcIik7XHJcbiAgICB0aC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9EQVlfT0ZfV0VFS19DTEFTUyk7XHJcbiAgICB0aC5zZXRBdHRyaWJ1dGUoXCJzY29wZVwiLCBcImNvbFwiKTtcclxuICAgIHRoLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwga2V5KTtcclxuICAgIHRoLnRleHRDb250ZW50ID0gZGF5c09mV2Vla1trZXldO1xyXG4gICAgdGFibGVIZWFkUm93Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0aCk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHRhYmxlQm9keSA9IGNyZWF0ZVRhYmxlQm9keShkYXRlc0dyaWQpO1xyXG4gIHRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUJvZHkpO1xyXG5cclxuICAvLyBDb250YWluZXIgZm9yIFllYXJzLCBNb250aHMsIGFuZCBEYXlzXHJcbiAgY29uc3QgZGF0ZVBpY2tlckNhbGVuZGFyQ29udGFpbmVyID1cclxuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xyXG5cclxuICBkYXRlUGlja2VyQ2FsZW5kYXJDb250YWluZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlKTtcclxuXHJcbiAgY2FsZW5kYXJFbC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdDYWxlbmRhciwgY2FsZW5kYXJFbCk7XHJcblxyXG4gIGRhdGVQaWNrZXJFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0FDVElWRV9DTEFTUyk7XHJcblxyXG4gIGNvbnN0IHN0YXR1c2VzID0gW107XHJcblxyXG4gIGlmIChpc1NhbWVEYXkoc2VsZWN0ZWREYXRlLCBmb2N1c2VkRGF0ZSkpIHtcclxuICAgIHN0YXR1c2VzLnB1c2goXCJTZWxlY3RlZCBkYXRlXCIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGNhbGVuZGFyV2FzSGlkZGVuKSB7XHJcbiAgICBzdGF0dXNlcy5wdXNoKFxyXG4gICAgICBcIllvdSBjYW4gbmF2aWdhdGUgYnkgZGF5IHVzaW5nIGxlZnQgYW5kIHJpZ2h0IGFycm93c1wiLFxyXG4gICAgICBcIldlZWtzIGJ5IHVzaW5nIHVwIGFuZCBkb3duIGFycm93c1wiLFxyXG4gICAgICBcIk1vbnRocyBieSB1c2luZyBwYWdlIHVwIGFuZCBwYWdlIGRvd24ga2V5c1wiLFxyXG4gICAgICBcIlllYXJzIGJ5IHVzaW5nIHNoaWZ0IHBsdXMgcGFnZSB1cCBhbmQgc2hpZnQgcGx1cyBwYWdlIGRvd25cIixcclxuICAgICAgXCJIb21lIGFuZCBlbmQga2V5cyBuYXZpZ2F0ZSB0byB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgYSB3ZWVrXCJcclxuICAgICk7XHJcbiAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFwiXCI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHN0YXR1c2VzLnB1c2goYCR7bW9udGhMYWJlbH0gJHtmb2N1c2VkWWVhcn1gKTtcclxuICB9XHJcbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBzdGF0dXNlcy5qb2luKFwiLiBcIik7XHJcblxyXG4gIHJldHVybiBuZXdDYWxlbmRhcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gX2J1dHRvbkVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGRpc3BsYXlQcmV2aW91c1llYXIgPSAoX2J1dHRvbkVsKSA9PiB7XHJcbiAgaWYgKF9idXR0b25FbC5kaXNhYmxlZCkgcmV0dXJuO1xyXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxyXG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoX2J1dHRvbkVsKTtcclxuICBsZXQgZGF0ZSA9IHN1YlllYXJzKGNhbGVuZGFyRGF0ZSwgMSk7XHJcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcclxuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xyXG5cclxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1BSRVZJT1VTX1lFQVIpO1xyXG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xyXG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcclxuICB9XHJcbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IF9idXR0b25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBkaXNwbGF5UHJldmlvdXNNb250aCA9IChfYnV0dG9uRWwpID0+IHtcclxuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XHJcbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChfYnV0dG9uRWwpO1xyXG4gIGxldCBkYXRlID0gc3ViTW9udGhzKGNhbGVuZGFyRGF0ZSwgMSk7XHJcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcclxuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xyXG5cclxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1BSRVZJT1VTX01PTlRIKTtcclxuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcclxuICAgIG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX1BJQ0tFUik7XHJcbiAgfVxyXG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgZGlzcGxheU5leHRNb250aCA9IChfYnV0dG9uRWwpID0+IHtcclxuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XHJcbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChfYnV0dG9uRWwpO1xyXG4gIGxldCBkYXRlID0gYWRkTW9udGhzKGNhbGVuZGFyRGF0ZSwgMSk7XHJcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcclxuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xyXG5cclxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX05FWFRfTU9OVEgpO1xyXG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xyXG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcclxuICB9XHJcbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gX2J1dHRvbkVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGRpc3BsYXlOZXh0WWVhciA9IChfYnV0dG9uRWwpID0+IHtcclxuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XHJcbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChfYnV0dG9uRWwpO1xyXG4gIGxldCBkYXRlID0gYWRkWWVhcnMoY2FsZW5kYXJEYXRlLCAxKTtcclxuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xyXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZSk7XHJcblxyXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTkVYVF9ZRUFSKTtcclxuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcclxuICAgIG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX1BJQ0tFUik7XHJcbiAgfVxyXG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSGlkZSB0aGUgY2FsZW5kYXIgb2YgYSBkYXRlIHBpY2tlciBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGhpZGVDYWxlbmRhciA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBjYWxlbmRhckVsLCBzdGF0dXNFbCB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xyXG5cclxuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LnJlbW92ZShEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MpO1xyXG4gIGNhbGVuZGFyRWwuaGlkZGVuID0gdHJ1ZTtcclxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFwiXCI7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VsZWN0IGEgZGF0ZSB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gY2FsZW5kYXJEYXRlRWwgQSBkYXRlIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IHNlbGVjdERhdGUgPSAoY2FsZW5kYXJEYXRlRWwpID0+IHtcclxuICBpZiAoY2FsZW5kYXJEYXRlRWwuZGlzYWJsZWQpIHJldHVybjtcclxuXHJcbiAgY29uc3QgeyBkYXRlUGlja2VyRWwsIGV4dGVybmFsSW5wdXRFbCB9ID1cclxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGNhbGVuZGFyRGF0ZUVsKTtcclxuXHJcbiAgc2V0Q2FsZW5kYXJWYWx1ZShjYWxlbmRhckRhdGVFbCwgY2FsZW5kYXJEYXRlRWwuZGF0YXNldC52YWx1ZSk7XHJcbiAgaGlkZUNhbGVuZGFyKGRhdGVQaWNrZXJFbCk7XHJcblxyXG4gIGV4dGVybmFsSW5wdXRFbC5mb2N1cygpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRvZ2dsZSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IHRvZ2dsZUNhbGVuZGFyID0gKGVsKSA9PiB7XHJcbiAgaWYgKGVsLmRpc2FibGVkKSByZXR1cm47XHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBpbnB1dERhdGUsIG1pbkRhdGUsIG1heERhdGUsIGRlZmF1bHREYXRlIH0gPVxyXG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xyXG5cclxuICBpZiAoY2FsZW5kYXJFbC5oaWRkZW4pIHtcclxuICAgIGNvbnN0IGRhdGVUb0Rpc3BsYXkgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoXHJcbiAgICAgIGlucHV0RGF0ZSB8fCBkZWZhdWx0RGF0ZSB8fCB0b2RheSgpLFxyXG4gICAgICBtaW5EYXRlLFxyXG4gICAgICBtYXhEYXRlXHJcbiAgICApO1xyXG4gICAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlVG9EaXNwbGF5KTtcclxuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBoaWRlQ2FsZW5kYXIoZWwpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgdGhlIGNhbGVuZGFyIHdoZW4gdmlzaWJsZS5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgYW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyXHJcbiAqL1xyXG5jb25zdCB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgaW5wdXREYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XHJcbiAgY29uc3QgY2FsZW5kYXJTaG93biA9ICFjYWxlbmRhckVsLmhpZGRlbjtcclxuXHJcbiAgaWYgKGNhbGVuZGFyU2hvd24gJiYgaW5wdXREYXRlKSB7XHJcbiAgICBjb25zdCBkYXRlVG9EaXNwbGF5ID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGlucHV0RGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XHJcbiAgICByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlVG9EaXNwbGF5KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIC0gRGF0ZSBTZWxlY3Rpb24gVmlld1xyXG5cclxuLy8gI3JlZ2lvbiBDYWxlbmRhciAtIE1vbnRoIFNlbGVjdGlvbiBWaWV3XHJcbi8qKlxyXG4gKiBEaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuIGluIHRoZSBkYXRlIHBpY2tlci5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IGEgcmVmZXJlbmNlIHRvIHRoZSBuZXcgY2FsZW5kYXIgZWxlbWVudFxyXG4gKi9cclxuY29uc3QgZGlzcGxheU1vbnRoU2VsZWN0aW9uID0gKGVsLCBtb250aFRvRGlzcGxheSkgPT4ge1xyXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgc3RhdHVzRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cclxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuXHJcbiAgY29uc3Qgc2VsZWN0ZWRNb250aCA9IGNhbGVuZGFyRGF0ZS5nZXRNb250aCgpO1xyXG4gIGNvbnN0IGZvY3VzZWRNb250aCA9IG1vbnRoVG9EaXNwbGF5ID09IG51bGwgPyBzZWxlY3RlZE1vbnRoIDogbW9udGhUb0Rpc3BsYXk7XHJcblxyXG4gIGNvbnN0IG1vbnRocyA9IE1PTlRIX0xBQkVMUy5tYXAoKG1vbnRoLCBpbmRleCkgPT4ge1xyXG4gICAgY29uc3QgbW9udGhUb0NoZWNrID0gc2V0TW9udGgoY2FsZW5kYXJEYXRlLCBpbmRleCk7XHJcblxyXG4gICAgY29uc3QgaXNEaXNhYmxlZCA9IGlzRGF0ZXNNb250aE91dHNpZGVNaW5Pck1heChcclxuICAgICAgbW9udGhUb0NoZWNrLFxyXG4gICAgICBtaW5EYXRlLFxyXG4gICAgICBtYXhEYXRlXHJcbiAgICApO1xyXG5cclxuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcclxuXHJcbiAgICBjb25zdCBjbGFzc2VzID0gW0NBTEVOREFSX01PTlRIX0NMQVNTXTtcclxuICAgIGNvbnN0IGlzU2VsZWN0ZWQgPSBpbmRleCA9PT0gc2VsZWN0ZWRNb250aDtcclxuXHJcbiAgICBpZiAoaW5kZXggPT09IGZvY3VzZWRNb250aCkge1xyXG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xyXG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRF9DTEFTUyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcclxuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX01PTlRIX1NFTEVDVEVEX0NMQVNTKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgdGFiaW5kZXgpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMuam9pbihcIiBcIikpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgaW5kZXgpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtbGFiZWxcIiwgbW9udGgpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgaXNTZWxlY3RlZCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiKTtcclxuICAgIGlmIChpc0Rpc2FibGVkID09PSB0cnVlKSB7XHJcbiAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBidG4udGV4dENvbnRlbnQgPSBtb250aDtcclxuXHJcbiAgICByZXR1cm4gYnRuO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtb250aHNIdG1sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBtb250aHNIdG1sLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XHJcbiAgbW9udGhzSHRtbC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9NT05USF9QSUNLRVJfQ0xBU1MpO1xyXG5cclxuICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcclxuICB0YWJsZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9UQUJMRV9DTEFTUyk7XHJcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInByZXNlbnRhdGlvblwiKTtcclxuXHJcbiAgY29uc3QgbW9udGhzR3JpZCA9IGxpc3RUb0dyaWRIdG1sKG1vbnRocywgMyk7XHJcbiAgY29uc3QgdGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KG1vbnRoc0dyaWQpO1xyXG4gIHRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUJvZHkpO1xyXG4gIG1vbnRoc0h0bWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlKTtcclxuXHJcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBjYWxlbmRhckVsLmNsb25lTm9kZSgpO1xyXG4gIG5ld0NhbGVuZGFyLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBtb250aHNIdG1sKTtcclxuICBjYWxlbmRhckVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0NhbGVuZGFyLCBjYWxlbmRhckVsKTtcclxuXHJcbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBcIlNlbGVjdCBhIG1vbnRoLlwiO1xyXG5cclxuICByZXR1cm4gbmV3Q2FsZW5kYXI7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VsZWN0IGEgbW9udGggaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gbW9udGhFbCBBbiBtb250aCBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBzZWxlY3RNb250aCA9IChtb250aEVsKSA9PiB7XHJcbiAgaWYgKG1vbnRoRWwuZGlzYWJsZWQpIHJldHVybjtcclxuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cclxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KG1vbnRoRWwpO1xyXG4gIGNvbnN0IHNlbGVjdGVkTW9udGggPSBwYXJzZUludChtb250aEVsLmRhdGFzZXQudmFsdWUsIDEwKTtcclxuICBsZXQgZGF0ZSA9IHNldE1vbnRoKGNhbGVuZGFyRGF0ZSwgc2VsZWN0ZWRNb250aCk7XHJcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcclxuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xyXG4gIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xyXG59O1xyXG5cclxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciAtIE1vbnRoIFNlbGVjdGlvbiBWaWV3XHJcblxyXG4vLyAjcmVnaW9uIENhbGVuZGFyIC0gWWVhciBTZWxlY3Rpb24gVmlld1xyXG5cclxuLyoqXHJcbiAqIERpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbiBpbiB0aGUgZGF0ZSBwaWNrZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICogQHBhcmFtIHtudW1iZXJ9IHllYXJUb0Rpc3BsYXkgeWVhciB0byBkaXNwbGF5IGluIHllYXIgc2VsZWN0aW9uXHJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gYSByZWZlcmVuY2UgdG8gdGhlIG5ldyBjYWxlbmRhciBlbGVtZW50XHJcbiAqL1xyXG5jb25zdCBkaXNwbGF5WWVhclNlbGVjdGlvbiA9IChlbCwgeWVhclRvRGlzcGxheSkgPT4ge1xyXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgc3RhdHVzRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cclxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuXHJcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gY2FsZW5kYXJEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgY29uc3QgZm9jdXNlZFllYXIgPSB5ZWFyVG9EaXNwbGF5ID09IG51bGwgPyBzZWxlY3RlZFllYXIgOiB5ZWFyVG9EaXNwbGF5O1xyXG5cclxuICBsZXQgeWVhclRvQ2h1bmsgPSBmb2N1c2VkWWVhcjtcclxuICB5ZWFyVG9DaHVuayAtPSB5ZWFyVG9DaHVuayAlIFlFQVJfQ0hVTks7XHJcbiAgeWVhclRvQ2h1bmsgPSBNYXRoLm1heCgwLCB5ZWFyVG9DaHVuayk7XHJcblxyXG4gIGNvbnN0IHByZXZZZWFyQ2h1bmtEaXNhYmxlZCA9IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4KFxyXG4gICAgc2V0WWVhcihjYWxlbmRhckRhdGUsIHllYXJUb0NodW5rIC0gMSksXHJcbiAgICBtaW5EYXRlLFxyXG4gICAgbWF4RGF0ZVxyXG4gICk7XHJcblxyXG4gIGNvbnN0IG5leHRZZWFyQ2h1bmtEaXNhYmxlZCA9IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4KFxyXG4gICAgc2V0WWVhcihjYWxlbmRhckRhdGUsIHllYXJUb0NodW5rICsgWUVBUl9DSFVOSyksXHJcbiAgICBtaW5EYXRlLFxyXG4gICAgbWF4RGF0ZVxyXG4gICk7XHJcblxyXG4gIGNvbnN0IHllYXJzID0gW107XHJcbiAgbGV0IHllYXJJbmRleCA9IHllYXJUb0NodW5rO1xyXG4gIHdoaWxlICh5ZWFycy5sZW5ndGggPCBZRUFSX0NIVU5LKSB7XHJcbiAgICBjb25zdCBpc0Rpc2FibGVkID0gaXNEYXRlc1llYXJPdXRzaWRlTWluT3JNYXgoXHJcbiAgICAgIHNldFllYXIoY2FsZW5kYXJEYXRlLCB5ZWFySW5kZXgpLFxyXG4gICAgICBtaW5EYXRlLFxyXG4gICAgICBtYXhEYXRlXHJcbiAgICApO1xyXG5cclxuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcclxuXHJcbiAgICBjb25zdCBjbGFzc2VzID0gW0NBTEVOREFSX1lFQVJfQ0xBU1NdO1xyXG4gICAgY29uc3QgaXNTZWxlY3RlZCA9IHllYXJJbmRleCA9PT0gc2VsZWN0ZWRZZWFyO1xyXG5cclxuICAgIGlmICh5ZWFySW5kZXggPT09IGZvY3VzZWRZZWFyKSB7XHJcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XHJcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9ZRUFSX0ZPQ1VTRURfQ0xBU1MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc1NlbGVjdGVkKSB7XHJcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9ZRUFSX1NFTEVDVEVEX0NMQVNTKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XHJcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgdGFiaW5kZXgpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMuam9pbihcIiBcIikpO1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgeWVhckluZGV4KTtcclxuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIsIGlzU2VsZWN0ZWQgPyBcInRydWVcIiA6IFwiZmFsc2VcIik7XHJcbiAgICBpZiAoaXNEaXNhYmxlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgYnRuLnRleHRDb250ZW50ID0geWVhckluZGV4O1xyXG5cclxuICAgIHllYXJzLnB1c2goYnRuKTtcclxuICAgIHllYXJJbmRleCArPSAxO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBjYWxlbmRhckVsLmNsb25lTm9kZSgpO1xyXG5cclxuICAvLyBjcmVhdGUgdGhlIHllYXJzIGNhbGVuZGFyIHdyYXBwZXJcclxuICBjb25zdCB5ZWFyc0NhbGVuZGFyV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcclxuICB5ZWFyc0NhbGVuZGFyV3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9ZRUFSX1BJQ0tFUl9DTEFTUyk7XHJcblxyXG4gIC8vIGNyZWF0ZSB0YWJsZSBwYXJlbnRcclxuICBjb25zdCB5ZWFyc1RhYmxlUGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xyXG4gIHllYXJzVGFibGVQYXJlbnQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xyXG5cclxuICAvLyBjcmVhdGUgdGFibGUgYm9keSBhbmQgdGFibGUgcm93XHJcbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xyXG4gIGNvbnN0IHllYXJzSFRNTFRhYmxlQm9keVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcclxuXHJcbiAgLy8gY3JlYXRlIHByZXZpb3VzIGJ1dHRvblxyXG4gIGNvbnN0IHByZXZpb3VzWWVhcnNCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gIHByZXZpb3VzWWVhcnNCdG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcclxuICBwcmV2aW91c1llYXJzQnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0hVTktfQ0xBU1MpO1xyXG4gIHByZXZpb3VzWWVhcnNCdG4uc2V0QXR0cmlidXRlKFxyXG4gICAgXCJhcmlhLWxhYmVsXCIsXHJcbiAgICBgTmF2aWdhdGUgYmFjayAke1lFQVJfQ0hVTkt9IHllYXJzYFxyXG4gICk7XHJcbiAgaWYgKHByZXZZZWFyQ2h1bmtEaXNhYmxlZCA9PT0gdHJ1ZSkge1xyXG4gICAgcHJldmlvdXNZZWFyc0J0bi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgfVxyXG4gIHByZXZpb3VzWWVhcnNCdG4uaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJm5ic3BgO1xyXG5cclxuICAvLyBjcmVhdGUgbmV4dCBidXR0b25cclxuICBjb25zdCBuZXh0WWVhcnNCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gIG5leHRZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xyXG4gIG5leHRZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktfQ0xBU1MpO1xyXG4gIG5leHRZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXHJcbiAgICBcImFyaWEtbGFiZWxcIixcclxuICAgIGBOYXZpZ2F0ZSBmb3J3YXJkICR7WUVBUl9DSFVOS30geWVhcnNgXHJcbiAgKTtcclxuICBpZiAobmV4dFllYXJDaHVua0Rpc2FibGVkID09PSB0cnVlKSB7XHJcbiAgICBuZXh0WWVhcnNCdG4uZGlzYWJsZWQgPSB0cnVlO1xyXG4gIH1cclxuICBuZXh0WWVhcnNCdG4uaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJm5ic3BgO1xyXG5cclxuICAvLyBjcmVhdGUgdGhlIGFjdHVhbCB5ZWFycyB0YWJsZVxyXG4gIGNvbnN0IHllYXJzVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XHJcbiAgeWVhcnNUYWJsZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9UQUJMRV9DTEFTUyk7XHJcbiAgeWVhcnNUYWJsZS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCIpO1xyXG5cclxuICAvLyBjcmVhdGUgdGhlIHllYXJzIGNoaWxkIHRhYmxlXHJcbiAgY29uc3QgeWVhcnNHcmlkID0gbGlzdFRvR3JpZEh0bWwoeWVhcnMsIDMpO1xyXG4gIGNvbnN0IHllYXJzVGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KHllYXJzR3JpZCk7XHJcblxyXG4gIC8vIGFwcGVuZCB0aGUgZ3JpZCB0byB0aGUgeWVhcnMgY2hpbGQgdGFibGVcclxuICB5ZWFyc1RhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc1RhYmxlQm9keSk7XHJcblxyXG4gIC8vIGNyZWF0ZSB0aGUgcHJldiBidXR0b24gdGQgYW5kIGFwcGVuZCB0aGUgcHJldiBidXR0b25cclxuICBjb25zdCB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxQcmV2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xyXG4gIHllYXJzSFRNTFRhYmxlQm9keURldGFpbFByZXYuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFxyXG4gICAgXCJiZWZvcmVlbmRcIixcclxuICAgIHByZXZpb3VzWWVhcnNCdG5cclxuICApO1xyXG5cclxuICAvLyBjcmVhdGUgdGhlIHllYXJzIHRkIGFuZCBhcHBlbmQgdGhlIHllYXJzIGNoaWxkIHRhYmxlXHJcbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XHJcbiAgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWwuc2V0QXR0cmlidXRlKFwiY29sc3BhblwiLCBcIjNcIik7XHJcbiAgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzVGFibGUpO1xyXG5cclxuICAvLyBjcmVhdGUgdGhlIG5leHQgYnV0dG9uIHRkIGFuZCBhcHBlbmQgdGhlIG5leHQgYnV0dG9uXHJcbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsTmV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcclxuICB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxOZXh0Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBuZXh0WWVhcnNCdG4pO1xyXG5cclxuICAvLyBhcHBlbmQgdGhlIHRocmVlIHRkIHRvIHRoZSB5ZWFycyBjaGlsZCB0YWJsZSByb3dcclxuICB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFxyXG4gICAgXCJiZWZvcmVlbmRcIixcclxuICAgIHllYXJzSFRNTFRhYmxlQm9keURldGFpbFByZXZcclxuICApO1xyXG4gIHllYXJzSFRNTFRhYmxlQm9keVJvdy5pbnNlcnRBZGphY2VudEVsZW1lbnQoXHJcbiAgICBcImJlZm9yZWVuZFwiLFxyXG4gICAgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWxcclxuICApO1xyXG4gIHllYXJzSFRNTFRhYmxlQm9keVJvdy5pbnNlcnRBZGphY2VudEVsZW1lbnQoXHJcbiAgICBcImJlZm9yZWVuZFwiLFxyXG4gICAgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsTmV4dFxyXG4gICk7XHJcblxyXG4gIC8vIGFwcGVuZCB0aGUgdGFibGUgcm93IHRvIHRoZSB5ZWFycyBjaGlsZCB0YWJsZSBib2R5XHJcbiAgeWVhcnNIVE1MVGFibGVCb2R5Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cpO1xyXG5cclxuICAvLyBhcHBlbmQgdGhlIHllYXJzIHRhYmxlIGJvZHkgdG8gdGhlIHllYXJzIHBhcmVudCB0YWJsZVxyXG4gIHllYXJzVGFibGVQYXJlbnQuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzSFRNTFRhYmxlQm9keSk7XHJcblxyXG4gIC8vIGFwcGVuZCB0aGUgcGFyZW50IHRhYmxlIHRvIHRoZSBjYWxlbmRhciB3cmFwcGVyXHJcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzVGFibGVQYXJlbnQpO1xyXG5cclxuICAvLyBhcHBlbmQgdGhlIHllYXJzIGNhbGVuZGVyIHRvIHRoZSBuZXcgY2FsZW5kYXJcclxuICBuZXdDYWxlbmRhci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNDYWxlbmRhcldyYXBwZXIpO1xyXG5cclxuICAvLyByZXBsYWNlIGNhbGVuZGFyXHJcbiAgY2FsZW5kYXJFbC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdDYWxlbmRhciwgY2FsZW5kYXJFbCk7XHJcblxyXG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgU2hvd2luZyB5ZWFycyAke3llYXJUb0NodW5rfSB0byAke1xyXG4gICAgeWVhclRvQ2h1bmsgKyBZRUFSX0NIVU5LIC0gMVxyXG4gIH0uIFNlbGVjdCBhIHllYXIuYDtcclxuXHJcbiAgcmV0dXJuIG5ld0NhbGVuZGFyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGJhY2sgYnkgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgZGlzcGxheVByZXZpb3VzWWVhckNodW5rID0gKGVsKSA9PiB7XHJcbiAgaWYgKGVsLmRpc2FibGVkKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxyXG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xyXG4gIGNvbnN0IHllYXJFbCA9IGNhbGVuZGFyRWwucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQpO1xyXG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IHBhcnNlSW50KHllYXJFbC50ZXh0Q29udGVudCwgMTApO1xyXG5cclxuICBsZXQgYWRqdXN0ZWRZZWFyID0gc2VsZWN0ZWRZZWFyIC0gWUVBUl9DSFVOSztcclxuICBhZGp1c3RlZFllYXIgPSBNYXRoLm1heCgwLCBhZGp1c3RlZFllYXIpO1xyXG5cclxuICBjb25zdCBkYXRlID0gc2V0WWVhcihjYWxlbmRhckRhdGUsIGFkanVzdGVkWWVhcik7XHJcbiAgY29uc3QgY2FwcGVkRGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcclxuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKFxyXG4gICAgY2FsZW5kYXJFbCxcclxuICAgIGNhcHBlZERhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICk7XHJcblxyXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOSyk7XHJcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XHJcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9QSUNLRVIpO1xyXG4gIH1cclxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGZvcndhcmQgYnkgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgZGlzcGxheU5leHRZZWFyQ2h1bmsgPSAoZWwpID0+IHtcclxuICBpZiAoZWwuZGlzYWJsZWQpIHJldHVybjtcclxuXHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XHJcbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XHJcbiAgY29uc3QgeWVhckVsID0gY2FsZW5kYXJFbC5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCk7XHJcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gcGFyc2VJbnQoeWVhckVsLnRleHRDb250ZW50LCAxMCk7XHJcblxyXG4gIGxldCBhZGp1c3RlZFllYXIgPSBzZWxlY3RlZFllYXIgKyBZRUFSX0NIVU5LO1xyXG4gIGFkanVzdGVkWWVhciA9IE1hdGgubWF4KDAsIGFkanVzdGVkWWVhcik7XHJcblxyXG4gIGNvbnN0IGRhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgYWRqdXN0ZWRZZWFyKTtcclxuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xyXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24oXHJcbiAgICBjYWxlbmRhckVsLFxyXG4gICAgY2FwcGVkRGF0ZS5nZXRGdWxsWWVhcigpXHJcbiAgKTtcclxuXHJcbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTkspO1xyXG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xyXG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfUElDS0VSKTtcclxuICB9XHJcbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZWxlY3QgYSB5ZWFyIGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IHllYXJFbCBBIHllYXIgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3Qgc2VsZWN0WWVhciA9ICh5ZWFyRWwpID0+IHtcclxuICBpZiAoeWVhckVsLmRpc2FibGVkKSByZXR1cm47XHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XHJcbiAgICBnZXREYXRlUGlja2VyQ29udGV4dCh5ZWFyRWwpO1xyXG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IHBhcnNlSW50KHllYXJFbC5pbm5lckhUTUwsIDEwKTtcclxuICBsZXQgZGF0ZSA9IHNldFllYXIoY2FsZW5kYXJEYXRlLCBzZWxlY3RlZFllYXIpO1xyXG4gIGRhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XHJcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcclxuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcclxufTtcclxuXHJcbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgLSBZZWFyIFNlbGVjdGlvbiBWaWV3XHJcblxyXG4vLyAjcmVnaW9uIENhbGVuZGFyIEV2ZW50IEhhbmRsaW5nXHJcblxyXG4vKipcclxuICogSGlkZSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZUVzY2FwZUZyb21DYWxlbmRhciA9IChldmVudCkgPT4ge1xyXG4gIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBleHRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGV2ZW50LnRhcmdldCk7XHJcblxyXG4gIGhpZGVDYWxlbmRhcihkYXRlUGlja2VyRWwpO1xyXG4gIGV4dGVybmFsSW5wdXRFbC5mb2N1cygpO1xyXG5cclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59O1xyXG5cclxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciBFdmVudCBIYW5kbGluZ1xyXG5cclxuLy8gI3JlZ2lvbiBDYWxlbmRhciBEYXRlIEV2ZW50IEhhbmRsaW5nXHJcblxyXG4vKipcclxuICogQWRqdXN0IHRoZSBkYXRlIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhciBpZiBuZWVkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGFkanVzdERhdGVGbiBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGFkanVzdGVkIGRhdGVcclxuICovXHJcbmNvbnN0IGFkanVzdENhbGVuZGFyID0gKGFkanVzdERhdGVGbikgPT4gKGV2ZW50KSA9PiB7XHJcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KFxyXG4gICAgZXZlbnQudGFyZ2V0XHJcbiAgKTtcclxuXHJcbiAgY29uc3QgZGF0ZSA9IGFkanVzdERhdGVGbihjYWxlbmRhckRhdGUpO1xyXG5cclxuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xyXG4gIGlmICghaXNTYW1lRGF5KGNhbGVuZGFyRGF0ZSwgY2FwcGVkRGF0ZSkpIHtcclxuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgY2FwcGVkRGF0ZSk7XHJcbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcclxuICB9XHJcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlVXBGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBzdWJXZWVrcyhkYXRlLCAxKSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgd2VlayBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZURvd25Gcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBhZGRXZWVrcyhkYXRlLCAxKSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgYmFjayBvbmUgZGF5IGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlTGVmdEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN1YkRheXMoZGF0ZSwgMSkpO1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIGRheSBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVJpZ2h0RnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gYWRkRGF5cyhkYXRlLCAxKSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlSG9tZUZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN0YXJ0T2ZXZWVrKGRhdGUpKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZW5kIG9mIHRoZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlRW5kRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gZW5kT2ZXZWVrKGRhdGUpKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVBhZ2VEb3duRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gYWRkTW9udGhzKGRhdGUsIDEpKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVBhZ2VVcEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN1Yk1vbnRocyhkYXRlLCAxKSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgeWVhciBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVNoaWZ0UGFnZURvd25Gcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBhZGRZZWFycyhkYXRlLCAxKSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgYmFjayBvbmUgeWVhciBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVNoaWZ0UGFnZVVwRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gc3ViWWVhcnMoZGF0ZSwgMSkpO1xyXG5cclxuLyoqXHJcbiAqIGRpc3BsYXkgdGhlIGNhbGVuZGFyIGZvciB0aGUgbW91c2VvdmVyIGRhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgVGhlIG1vdXNlb3ZlciBldmVudFxyXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBkYXRlRWwgQSBkYXRlIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZU1vdXNlb3ZlckZyb21EYXRlID0gKGRhdGVFbCkgPT4ge1xyXG4gIGlmIChkYXRlRWwuZGlzYWJsZWQpIHJldHVybjtcclxuXHJcbiAgY29uc3QgY2FsZW5kYXJFbCA9IGRhdGVFbC5jbG9zZXN0KERBVEVfUElDS0VSX0NBTEVOREFSKTtcclxuXHJcbiAgY29uc3QgY3VycmVudENhbGVuZGFyRGF0ZSA9IGNhbGVuZGFyRWwuZGF0YXNldC52YWx1ZTtcclxuICBjb25zdCBob3ZlckRhdGUgPSBkYXRlRWwuZGF0YXNldC52YWx1ZTtcclxuXHJcbiAgaWYgKGhvdmVyRGF0ZSA9PT0gY3VycmVudENhbGVuZGFyRGF0ZSkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBkYXRlVG9EaXNwbGF5ID0gcGFyc2VEYXRlU3RyaW5nKGhvdmVyRGF0ZSk7XHJcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlVG9EaXNwbGF5KTtcclxuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcclxufTtcclxuXHJcbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgRGF0ZSBFdmVudCBIYW5kbGluZ1xyXG5cclxuLy8gI3JlZ2lvbiBDYWxlbmRhciBNb250aCBFdmVudCBIYW5kbGluZ1xyXG5cclxuLyoqXHJcbiAqIEFkanVzdCB0aGUgbW9udGggYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4gaWYgbmVlZGVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBhZGp1c3RNb250aEZuIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgYWRqdXN0ZWQgbW9udGhcclxuICovXHJcbmNvbnN0IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuID0gKGFkanVzdE1vbnRoRm4pID0+IChldmVudCkgPT4ge1xyXG4gIGNvbnN0IG1vbnRoRWwgPSBldmVudC50YXJnZXQ7XHJcbiAgY29uc3Qgc2VsZWN0ZWRNb250aCA9IHBhcnNlSW50KG1vbnRoRWwuZGF0YXNldC52YWx1ZSwgMTApO1xyXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxyXG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQobW9udGhFbCk7XHJcbiAgY29uc3QgY3VycmVudERhdGUgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIHNlbGVjdGVkTW9udGgpO1xyXG5cclxuICBsZXQgYWRqdXN0ZWRNb250aCA9IGFkanVzdE1vbnRoRm4oc2VsZWN0ZWRNb250aCk7XHJcbiAgYWRqdXN0ZWRNb250aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDExLCBhZGp1c3RlZE1vbnRoKSk7XHJcblxyXG4gIGNvbnN0IGRhdGUgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIGFkanVzdGVkTW9udGgpO1xyXG4gIGNvbnN0IGNhcHBlZERhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XHJcbiAgaWYgKCFpc1NhbWVNb250aChjdXJyZW50RGF0ZSwgY2FwcGVkRGF0ZSkpIHtcclxuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheU1vbnRoU2VsZWN0aW9uKFxyXG4gICAgICBjYWxlbmRhckVsLFxyXG4gICAgICBjYXBwZWREYXRlLmdldE1vbnRoKClcclxuICAgICk7XHJcbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX01PTlRIX0ZPQ1VTRUQpLmZvY3VzKCk7XHJcbiAgfVxyXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbn07XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgYmFjayB0aHJlZSBtb250aHMgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVVwRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCAtIDMpO1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGZvcndhcmQgdGhyZWUgbW9udGhzIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVEb3duRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCArIDMpO1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGJhY2sgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVMZWZ0RnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCAtIDEpO1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVSaWdodEZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKChtb250aCkgPT4gbW9udGggKyAxKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHJvdyBvZiBtb250aHMgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZUhvbWVGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbihcclxuICAobW9udGgpID0+IG1vbnRoIC0gKG1vbnRoICUgMylcclxuKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZW5kIG9mIHRoZSByb3cgb2YgbW9udGhzIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVFbmRGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbihcclxuICAobW9udGgpID0+IG1vbnRoICsgMiAtIChtb250aCAlIDMpXHJcbik7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgdG8gdGhlIGxhc3QgbW9udGggKERlY2VtYmVyKSBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlUGFnZURvd25Gcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigoKSA9PiAxMSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgdG8gdGhlIGZpcnN0IG1vbnRoIChKYW51YXJ5KSBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlUGFnZVVwRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKCkgPT4gMCk7XHJcblxyXG4vKipcclxuICogdXBkYXRlIHRoZSBmb2N1cyBvbiBhIG1vbnRoIHdoZW4gdGhlIG1vdXNlIG1vdmVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBtb3VzZW92ZXIgZXZlbnRcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gbW9udGhFbCBBIG1vbnRoIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZU1vdXNlb3ZlckZyb21Nb250aCA9IChtb250aEVsKSA9PiB7XHJcbiAgaWYgKG1vbnRoRWwuZGlzYWJsZWQpIHJldHVybjtcclxuICBpZiAobW9udGhFbC5jbGFzc0xpc3QuY29udGFpbnMoQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRF9DTEFTUykpIHJldHVybjtcclxuXHJcbiAgY29uc3QgZm9jdXNNb250aCA9IHBhcnNlSW50KG1vbnRoRWwuZGF0YXNldC52YWx1ZSwgMTApO1xyXG5cclxuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlNb250aFNlbGVjdGlvbihtb250aEVsLCBmb2N1c01vbnRoKTtcclxuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX01PTlRIX0ZPQ1VTRUQpLmZvY3VzKCk7XHJcbn07XHJcblxyXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIE1vbnRoIEV2ZW50IEhhbmRsaW5nXHJcblxyXG4vLyAjcmVnaW9uIENhbGVuZGFyIFllYXIgRXZlbnQgSGFuZGxpbmdcclxuXHJcbi8qKlxyXG4gKiBBZGp1c3QgdGhlIHllYXIgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbiBpZiBuZWVkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGFkanVzdFllYXJGbiBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGFkanVzdGVkIHllYXJcclxuICovXHJcbmNvbnN0IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4gPSAoYWRqdXN0WWVhckZuKSA9PiAoZXZlbnQpID0+IHtcclxuICBjb25zdCB5ZWFyRWwgPSBldmVudC50YXJnZXQ7XHJcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gcGFyc2VJbnQoeWVhckVsLmRhdGFzZXQudmFsdWUsIDEwKTtcclxuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cclxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KHllYXJFbCk7XHJcbiAgY29uc3QgY3VycmVudERhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgc2VsZWN0ZWRZZWFyKTtcclxuXHJcbiAgbGV0IGFkanVzdGVkWWVhciA9IGFkanVzdFllYXJGbihzZWxlY3RlZFllYXIpO1xyXG4gIGFkanVzdGVkWWVhciA9IE1hdGgubWF4KDAsIGFkanVzdGVkWWVhcik7XHJcblxyXG4gIGNvbnN0IGRhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgYWRqdXN0ZWRZZWFyKTtcclxuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xyXG4gIGlmICghaXNTYW1lWWVhcihjdXJyZW50RGF0ZSwgY2FwcGVkRGF0ZSkpIHtcclxuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24oXHJcbiAgICAgIGNhbGVuZGFyRWwsXHJcbiAgICAgIGNhcHBlZERhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgKTtcclxuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEKS5mb2N1cygpO1xyXG4gIH1cclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE5hdmlnYXRlIGJhY2sgdGhyZWUgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlVXBGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgLSAzKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIHRocmVlIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZURvd25Gcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgKyAzKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZUxlZnRGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgLSAxKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVJpZ2h0RnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKCh5ZWFyKSA9PiB5ZWFyICsgMSk7XHJcblxyXG4vKipcclxuICogTmF2aWdhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb3cgb2YgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlSG9tZUZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbihcclxuICAoeWVhcikgPT4geWVhciAtICh5ZWFyICUgMylcclxuKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZW5kIG9mIHRoZSByb3cgb2YgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cclxuICpcclxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxyXG4gKi9cclxuY29uc3QgaGFuZGxlRW5kRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKFxyXG4gICh5ZWFyKSA9PiB5ZWFyICsgMiAtICh5ZWFyICUgMylcclxuKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSB0byBiYWNrIDEyIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVBhZ2VVcEZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbihcclxuICAoeWVhcikgPT4geWVhciAtIFlFQVJfQ0hVTktcclxuKTtcclxuXHJcbi8qKlxyXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIDEyIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZVBhZ2VEb3duRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKFxyXG4gICh5ZWFyKSA9PiB5ZWFyICsgWUVBUl9DSFVOS1xyXG4pO1xyXG5cclxuLyoqXHJcbiAqIHVwZGF0ZSB0aGUgZm9jdXMgb24gYSB5ZWFyIHdoZW4gdGhlIG1vdXNlIG1vdmVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBtb3VzZW92ZXIgZXZlbnRcclxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZGF0ZUVsIEEgeWVhciBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVNb3VzZW92ZXJGcm9tWWVhciA9ICh5ZWFyRWwpID0+IHtcclxuICBpZiAoeWVhckVsLmRpc2FibGVkKSByZXR1cm47XHJcbiAgaWYgKHllYXJFbC5jbGFzc0xpc3QuY29udGFpbnMoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEX0NMQVNTKSkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBmb2N1c1llYXIgPSBwYXJzZUludCh5ZWFyRWwuZGF0YXNldC52YWx1ZSwgMTApO1xyXG5cclxuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKHllYXJFbCwgZm9jdXNZZWFyKTtcclxuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCkuZm9jdXMoKTtcclxufTtcclxuXHJcbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgWWVhciBFdmVudCBIYW5kbGluZ1xyXG5cclxuLy8gI3JlZ2lvbiBGb2N1cyBIYW5kbGluZyBFdmVudCBIYW5kbGluZ1xyXG5cclxuY29uc3QgdGFiSGFuZGxlciA9IChmb2N1c2FibGUpID0+IHtcclxuICBjb25zdCBnZXRGb2N1c2FibGVDb250ZXh0ID0gKGVsKSA9PiB7XHJcbiAgICBjb25zdCB7IGNhbGVuZGFyRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcclxuICAgIGNvbnN0IGZvY3VzYWJsZUVsZW1lbnRzID0gc2VsZWN0KGZvY3VzYWJsZSwgY2FsZW5kYXJFbCk7XHJcblxyXG4gICAgY29uc3QgZmlyc3RUYWJJbmRleCA9IDA7XHJcbiAgICBjb25zdCBsYXN0VGFiSW5kZXggPSBmb2N1c2FibGVFbGVtZW50cy5sZW5ndGggLSAxO1xyXG4gICAgY29uc3QgZmlyc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbZmlyc3RUYWJJbmRleF07XHJcbiAgICBjb25zdCBsYXN0VGFiU3RvcCA9IGZvY3VzYWJsZUVsZW1lbnRzW2xhc3RUYWJJbmRleF07XHJcbiAgICBjb25zdCBmb2N1c0luZGV4ID0gZm9jdXNhYmxlRWxlbWVudHMuaW5kZXhPZihhY3RpdmVFbGVtZW50KCkpO1xyXG5cclxuICAgIGNvbnN0IGlzTGFzdFRhYiA9IGZvY3VzSW5kZXggPT09IGxhc3RUYWJJbmRleDtcclxuICAgIGNvbnN0IGlzRmlyc3RUYWIgPSBmb2N1c0luZGV4ID09PSBmaXJzdFRhYkluZGV4O1xyXG4gICAgY29uc3QgaXNOb3RGb3VuZCA9IGZvY3VzSW5kZXggPT09IC0xO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGZvY3VzYWJsZUVsZW1lbnRzLFxyXG4gICAgICBpc05vdEZvdW5kLFxyXG4gICAgICBmaXJzdFRhYlN0b3AsXHJcbiAgICAgIGlzRmlyc3RUYWIsXHJcbiAgICAgIGxhc3RUYWJTdG9wLFxyXG4gICAgICBpc0xhc3RUYWIsXHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB0YWJBaGVhZChldmVudCkge1xyXG4gICAgICBjb25zdCB7IGZpcnN0VGFiU3RvcCwgaXNMYXN0VGFiLCBpc05vdEZvdW5kIH0gPSBnZXRGb2N1c2FibGVDb250ZXh0KFxyXG4gICAgICAgIGV2ZW50LnRhcmdldFxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKGlzTGFzdFRhYiB8fCBpc05vdEZvdW5kKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBmaXJzdFRhYlN0b3AuZm9jdXMoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHRhYkJhY2soZXZlbnQpIHtcclxuICAgICAgY29uc3QgeyBsYXN0VGFiU3RvcCwgaXNGaXJzdFRhYiwgaXNOb3RGb3VuZCB9ID0gZ2V0Rm9jdXNhYmxlQ29udGV4dChcclxuICAgICAgICBldmVudC50YXJnZXRcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChpc0ZpcnN0VGFiIHx8IGlzTm90Rm91bmQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGxhc3RUYWJTdG9wLmZvY3VzKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfTtcclxufTtcclxuXHJcbmNvbnN0IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIgPSB0YWJIYW5kbGVyKERBVEVfUElDS0VSX0ZPQ1VTQUJMRSk7XHJcbmNvbnN0IG1vbnRoUGlja2VyVGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihNT05USF9QSUNLRVJfRk9DVVNBQkxFKTtcclxuY29uc3QgeWVhclBpY2tlclRhYkV2ZW50SGFuZGxlciA9IHRhYkhhbmRsZXIoWUVBUl9QSUNLRVJfRk9DVVNBQkxFKTtcclxuXHJcbi8vICNlbmRyZWdpb24gRm9jdXMgSGFuZGxpbmcgRXZlbnQgSGFuZGxpbmdcclxuXHJcbi8vICNyZWdpb24gRGF0ZSBQaWNrZXIgRXZlbnQgRGVsZWdhdGlvbiBSZWdpc3RyYXRpb24gLyBDb21wb25lbnRcclxuXHJcbmNvbnN0IGRhdGVQaWNrZXJFdmVudHMgPSB7XHJcbiAgW0NMSUNLXToge1xyXG4gICAgW0RBVEVfUElDS0VSX0JVVFRPTl0oKSB7XHJcbiAgICAgIHRvZ2dsZUNhbGVuZGFyKHRoaXMpO1xyXG4gICAgfSxcclxuICAgIFtDQUxFTkRBUl9EQVRFXSgpIHtcclxuICAgICAgc2VsZWN0RGF0ZSh0aGlzKTtcclxuICAgIH0sXHJcbiAgICBbQ0FMRU5EQVJfTU9OVEhdKCkge1xyXG4gICAgICBzZWxlY3RNb250aCh0aGlzKTtcclxuICAgIH0sXHJcbiAgICBbQ0FMRU5EQVJfWUVBUl0oKSB7XHJcbiAgICAgIHNlbGVjdFllYXIodGhpcyk7XHJcbiAgICB9LFxyXG4gICAgW0NBTEVOREFSX1BSRVZJT1VTX01PTlRIXSgpIHtcclxuICAgICAgZGlzcGxheVByZXZpb3VzTW9udGgodGhpcyk7XHJcbiAgICB9LFxyXG4gICAgW0NBTEVOREFSX05FWFRfTU9OVEhdKCkge1xyXG4gICAgICBkaXNwbGF5TmV4dE1vbnRoKHRoaXMpO1xyXG4gICAgfSxcclxuICAgIFtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSXSgpIHtcclxuICAgICAgZGlzcGxheVByZXZpb3VzWWVhcih0aGlzKTtcclxuICAgIH0sXHJcbiAgICBbQ0FMRU5EQVJfTkVYVF9ZRUFSXSgpIHtcclxuICAgICAgZGlzcGxheU5leHRZZWFyKHRoaXMpO1xyXG4gICAgfSxcclxuICAgIFtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LXSgpIHtcclxuICAgICAgZGlzcGxheVByZXZpb3VzWWVhckNodW5rKHRoaXMpO1xyXG4gICAgfSxcclxuICAgIFtDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktdKCkge1xyXG4gICAgICBkaXNwbGF5TmV4dFllYXJDaHVuayh0aGlzKTtcclxuICAgIH0sXHJcbiAgICBbQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OXSgpIHtcclxuICAgICAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5TW9udGhTZWxlY3Rpb24odGhpcyk7XHJcbiAgICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRCkuZm9jdXMoKTtcclxuICAgIH0sXHJcbiAgICBbQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05dKCkge1xyXG4gICAgICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKHRoaXMpO1xyXG4gICAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCkuZm9jdXMoKTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBrZXl1cDoge1xyXG4gICAgW0RBVEVfUElDS0VSX0NBTEVOREFSXShldmVudCkge1xyXG4gICAgICBjb25zdCBrZXlkb3duID0gdGhpcy5kYXRhc2V0LmtleWRvd25LZXlDb2RlO1xyXG4gICAgICBpZiAoYCR7ZXZlbnQua2V5Q29kZX1gICE9PSBrZXlkb3duKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICB9LFxyXG4gIGtleWRvd246IHtcclxuICAgIFtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF0oZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IEVOVEVSX0tFWUNPREUpIHtcclxuICAgICAgICB2YWxpZGF0ZURhdGVJbnB1dCh0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFtDQUxFTkRBUl9EQVRFXToga2V5bWFwKHtcclxuICAgICAgVXA6IGhhbmRsZVVwRnJvbURhdGUsXHJcbiAgICAgIEFycm93VXA6IGhhbmRsZVVwRnJvbURhdGUsXHJcbiAgICAgIERvd246IGhhbmRsZURvd25Gcm9tRGF0ZSxcclxuICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbURhdGUsXHJcbiAgICAgIExlZnQ6IGhhbmRsZUxlZnRGcm9tRGF0ZSxcclxuICAgICAgQXJyb3dMZWZ0OiBoYW5kbGVMZWZ0RnJvbURhdGUsXHJcbiAgICAgIFJpZ2h0OiBoYW5kbGVSaWdodEZyb21EYXRlLFxyXG4gICAgICBBcnJvd1JpZ2h0OiBoYW5kbGVSaWdodEZyb21EYXRlLFxyXG4gICAgICBIb21lOiBoYW5kbGVIb21lRnJvbURhdGUsXHJcbiAgICAgIEVuZDogaGFuZGxlRW5kRnJvbURhdGUsXHJcbiAgICAgIFBhZ2VEb3duOiBoYW5kbGVQYWdlRG93bkZyb21EYXRlLFxyXG4gICAgICBQYWdlVXA6IGhhbmRsZVBhZ2VVcEZyb21EYXRlLFxyXG4gICAgICBcIlNoaWZ0K1BhZ2VEb3duXCI6IGhhbmRsZVNoaWZ0UGFnZURvd25Gcm9tRGF0ZSxcclxuICAgICAgXCJTaGlmdCtQYWdlVXBcIjogaGFuZGxlU2hpZnRQYWdlVXBGcm9tRGF0ZSxcclxuICAgICAgVGFiOiBkYXRlUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkFoZWFkLFxyXG4gICAgfSksXHJcbiAgICBbQ0FMRU5EQVJfREFURV9QSUNLRVJdOiBrZXltYXAoe1xyXG4gICAgICBUYWI6IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXHJcbiAgICAgIFwiU2hpZnQrVGFiXCI6IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQmFjayxcclxuICAgIH0pLFxyXG4gICAgW0NBTEVOREFSX01PTlRIXToga2V5bWFwKHtcclxuICAgICAgVXA6IGhhbmRsZVVwRnJvbU1vbnRoLFxyXG4gICAgICBBcnJvd1VwOiBoYW5kbGVVcEZyb21Nb250aCxcclxuICAgICAgRG93bjogaGFuZGxlRG93bkZyb21Nb250aCxcclxuICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbU1vbnRoLFxyXG4gICAgICBMZWZ0OiBoYW5kbGVMZWZ0RnJvbU1vbnRoLFxyXG4gICAgICBBcnJvd0xlZnQ6IGhhbmRsZUxlZnRGcm9tTW9udGgsXHJcbiAgICAgIFJpZ2h0OiBoYW5kbGVSaWdodEZyb21Nb250aCxcclxuICAgICAgQXJyb3dSaWdodDogaGFuZGxlUmlnaHRGcm9tTW9udGgsXHJcbiAgICAgIEhvbWU6IGhhbmRsZUhvbWVGcm9tTW9udGgsXHJcbiAgICAgIEVuZDogaGFuZGxlRW5kRnJvbU1vbnRoLFxyXG4gICAgICBQYWdlRG93bjogaGFuZGxlUGFnZURvd25Gcm9tTW9udGgsXHJcbiAgICAgIFBhZ2VVcDogaGFuZGxlUGFnZVVwRnJvbU1vbnRoLFxyXG4gICAgfSksXHJcbiAgICBbQ0FMRU5EQVJfTU9OVEhfUElDS0VSXToga2V5bWFwKHtcclxuICAgICAgVGFiOiBtb250aFBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcclxuICAgICAgXCJTaGlmdCtUYWJcIjogbW9udGhQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQmFjayxcclxuICAgIH0pLFxyXG4gICAgW0NBTEVOREFSX1lFQVJdOiBrZXltYXAoe1xyXG4gICAgICBVcDogaGFuZGxlVXBGcm9tWWVhcixcclxuICAgICAgQXJyb3dVcDogaGFuZGxlVXBGcm9tWWVhcixcclxuICAgICAgRG93bjogaGFuZGxlRG93bkZyb21ZZWFyLFxyXG4gICAgICBBcnJvd0Rvd246IGhhbmRsZURvd25Gcm9tWWVhcixcclxuICAgICAgTGVmdDogaGFuZGxlTGVmdEZyb21ZZWFyLFxyXG4gICAgICBBcnJvd0xlZnQ6IGhhbmRsZUxlZnRGcm9tWWVhcixcclxuICAgICAgUmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbVllYXIsXHJcbiAgICAgIEFycm93UmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbVllYXIsXHJcbiAgICAgIEhvbWU6IGhhbmRsZUhvbWVGcm9tWWVhcixcclxuICAgICAgRW5kOiBoYW5kbGVFbmRGcm9tWWVhcixcclxuICAgICAgUGFnZURvd246IGhhbmRsZVBhZ2VEb3duRnJvbVllYXIsXHJcbiAgICAgIFBhZ2VVcDogaGFuZGxlUGFnZVVwRnJvbVllYXIsXHJcbiAgICB9KSxcclxuICAgIFtDQUxFTkRBUl9ZRUFSX1BJQ0tFUl06IGtleW1hcCh7XHJcbiAgICAgIFRhYjogeWVhclBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcclxuICAgICAgXCJTaGlmdCtUYWJcIjogeWVhclBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJCYWNrLFxyXG4gICAgfSksXHJcbiAgICBbREFURV9QSUNLRVJfQ0FMRU5EQVJdKGV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZGF0YXNldC5rZXlkb3duS2V5Q29kZSA9IGV2ZW50LmtleUNvZGU7XHJcbiAgICB9LFxyXG4gICAgW0RBVEVfUElDS0VSXShldmVudCkge1xyXG4gICAgICBjb25zdCBrZXlNYXAgPSBrZXltYXAoe1xyXG4gICAgICAgIEVzY2FwZTogaGFuZGxlRXNjYXBlRnJvbUNhbGVuZGFyLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGtleU1hcChldmVudCk7XHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgZm9jdXNvdXQ6IHtcclxuICAgIFtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF0oKSB7XHJcbiAgICAgIHZhbGlkYXRlRGF0ZUlucHV0KHRoaXMpO1xyXG4gICAgfSxcclxuICAgIFtEQVRFX1BJQ0tFUl0oZXZlbnQpIHtcclxuICAgICAgaWYgKCF0aGlzLmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XHJcbiAgICAgICAgaGlkZUNhbGVuZGFyKHRoaXMpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgaW5wdXQ6IHtcclxuICAgIFtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF0oKSB7XHJcbiAgICAgIHJlY29uY2lsZUlucHV0VmFsdWVzKHRoaXMpO1xyXG4gICAgICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZSh0aGlzKTtcclxuICAgIH0sXHJcbiAgfSxcclxufTtcclxuXHJcbmlmICghaXNJb3NEZXZpY2UoKSkge1xyXG4gIGRhdGVQaWNrZXJFdmVudHMubW91c2VvdmVyID0ge1xyXG4gICAgW0NBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF0oKSB7XHJcbiAgICAgIGhhbmRsZU1vdXNlb3ZlckZyb21EYXRlKHRoaXMpO1xyXG4gICAgfSxcclxuICAgIFtDQUxFTkRBUl9NT05USF0oKSB7XHJcbiAgICAgIGhhbmRsZU1vdXNlb3ZlckZyb21Nb250aCh0aGlzKTtcclxuICAgIH0sXHJcbiAgICBbQ0FMRU5EQVJfWUVBUl0oKSB7XHJcbiAgICAgIGhhbmRsZU1vdXNlb3ZlckZyb21ZZWFyKHRoaXMpO1xyXG4gICAgfSxcclxuICB9O1xyXG59XHJcblxyXG5jb25zdCBkYXRlUGlja2VyID0gYmVoYXZpb3IoZGF0ZVBpY2tlckV2ZW50cywge1xyXG4gIGluaXQocm9vdCkge1xyXG4gICAgc2VsZWN0T3JNYXRjaGVzKERBVEVfUElDS0VSLCByb290KS5mb3JFYWNoKChkYXRlUGlja2VyRWwpID0+IHtcclxuICAgICAgZW5oYW5jZURhdGVQaWNrZXIoZGF0ZVBpY2tlckVsKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgZ2V0RGF0ZVBpY2tlckNvbnRleHQsXHJcbiAgZGlzYWJsZSxcclxuICBhcmlhRGlzYWJsZSxcclxuICBlbmFibGUsXHJcbiAgaXNEYXRlSW5wdXRJbnZhbGlkLFxyXG4gIHNldENhbGVuZGFyVmFsdWUsXHJcbiAgdmFsaWRhdGVEYXRlSW5wdXQsXHJcbiAgcmVuZGVyQ2FsZW5kYXIsXHJcbiAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUsXHJcbn0pO1xyXG5cclxuLy8gI2VuZHJlZ2lvbiBEYXRlIFBpY2tlciBFdmVudCBEZWxlZ2F0aW9uIFJlZ2lzdHJhdGlvbiAvIENvbXBvbmVudFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkYXRlUGlja2VyO1xyXG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcclxuY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xyXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xyXG5jb25zdCB7XHJcbiAgZ2V0RGF0ZVBpY2tlckNvbnRleHQsXHJcbiAgaXNEYXRlSW5wdXRJbnZhbGlkLFxyXG4gIHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlLFxyXG59ID0gcmVxdWlyZShcIi4uLy4uL3VzYS1kYXRlLXBpY2tlci9zcmMvaW5kZXhcIik7XHJcblxyXG5jb25zdCBEQVRFX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tZGF0ZS1waWNrZXJgO1xyXG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tZGF0ZS1yYW5nZS1waWNrZXJgO1xyXG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVF9DTEFTUyA9IGAke0RBVEVfUkFOR0VfUElDS0VSX0NMQVNTfV9fcmFuZ2Utc3RhcnRgO1xyXG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1MgPSBgJHtEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTU31fX3JhbmdlLWVuZGA7XHJcblxyXG5jb25zdCBEQVRFX1BJQ0tFUiA9IGAuJHtEQVRFX1BJQ0tFUl9DTEFTU31gO1xyXG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUiA9IGAuJHtEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTU31gO1xyXG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVCA9IGAuJHtEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVF9DTEFTU31gO1xyXG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkQgPSBgLiR7REFURV9SQU5HRV9QSUNLRVJfUkFOR0VfRU5EX0NMQVNTfWA7XHJcblxyXG5jb25zdCBERUZBVUxUX01JTl9EQVRFID0gXCIwMDAwLTAxLTAxXCI7XHJcblxyXG4vKipcclxuICogVGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIHdpdGhpbiB0aGUgZGF0ZSByYW5nZSBwaWNrZXIuXHJcbiAqIEB0eXBlZGVmIHtPYmplY3R9IERhdGVSYW5nZVBpY2tlckNvbnRleHRcclxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZGF0ZVJhbmdlUGlja2VyRWxcclxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gcmFuZ2VTdGFydEVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IHJhbmdlRW5kRWxcclxuICovXHJcblxyXG4vKipcclxuICogR2V0IGFuIG9iamVjdCBvZiB0aGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxyXG4gKiBkYXRlIHBpY2tlciBjb21wb25lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXJcclxuICogQHJldHVybnMge0RhdGVSYW5nZVBpY2tlckNvbnRleHR9IGVsZW1lbnRzXHJcbiAqL1xyXG5jb25zdCBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0ID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgZGF0ZVJhbmdlUGlja2VyRWwgPSBlbC5jbG9zZXN0KERBVEVfUkFOR0VfUElDS0VSKTtcclxuXHJcbiAgaWYgKCFkYXRlUmFuZ2VQaWNrZXJFbCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBFbGVtZW50IGlzIG1pc3Npbmcgb3V0ZXIgJHtEQVRFX1JBTkdFX1BJQ0tFUn1gKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJhbmdlU3RhcnRFbCA9IGRhdGVSYW5nZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVFxyXG4gICk7XHJcbiAgY29uc3QgcmFuZ2VFbmRFbCA9IGRhdGVSYW5nZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRcclxuICApO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZGF0ZVJhbmdlUGlja2VyRWwsXHJcbiAgICByYW5nZVN0YXJ0RWwsXHJcbiAgICByYW5nZUVuZEVsLFxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogaGFuZGxlIHVwZGF0ZSBmcm9tIHJhbmdlIHN0YXJ0IGRhdGUgcGlja2VyXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHJhbmdlIHBpY2tlclxyXG4gKi9cclxuY29uc3QgaGFuZGxlUmFuZ2VTdGFydFVwZGF0ZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgZGF0ZVJhbmdlUGlja2VyRWwsIHJhbmdlU3RhcnRFbCwgcmFuZ2VFbmRFbCB9ID1cclxuICAgIGdldERhdGVSYW5nZVBpY2tlckNvbnRleHQoZWwpO1xyXG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChyYW5nZVN0YXJ0RWwpO1xyXG4gIGNvbnN0IHVwZGF0ZWREYXRlID0gaW50ZXJuYWxJbnB1dEVsLnZhbHVlO1xyXG5cclxuICBpZiAodXBkYXRlZERhdGUgJiYgIWlzRGF0ZUlucHV0SW52YWxpZChpbnRlcm5hbElucHV0RWwpKSB7XHJcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQubWluRGF0ZSA9IHVwZGF0ZWREYXRlO1xyXG4gICAgcmFuZ2VFbmRFbC5kYXRhc2V0LnJhbmdlRGF0ZSA9IHVwZGF0ZWREYXRlO1xyXG4gICAgcmFuZ2VFbmRFbC5kYXRhc2V0LmRlZmF1bHREYXRlID0gdXBkYXRlZERhdGU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5taW5EYXRlID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlIHx8IFwiXCI7XHJcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQucmFuZ2VEYXRlID0gXCJcIjtcclxuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5kZWZhdWx0RGF0ZSA9IFwiXCI7XHJcbiAgfVxyXG5cclxuICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZShyYW5nZUVuZEVsKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBoYW5kbGUgdXBkYXRlIGZyb20gcmFuZ2Ugc3RhcnQgZGF0ZSBwaWNrZXJcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgYW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcmFuZ2UgcGlja2VyXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVSYW5nZUVuZFVwZGF0ZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgZGF0ZVJhbmdlUGlja2VyRWwsIHJhbmdlU3RhcnRFbCwgcmFuZ2VFbmRFbCB9ID1cclxuICAgIGdldERhdGVSYW5nZVBpY2tlckNvbnRleHQoZWwpO1xyXG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChyYW5nZUVuZEVsKTtcclxuICBjb25zdCB1cGRhdGVkRGF0ZSA9IGludGVybmFsSW5wdXRFbC52YWx1ZTtcclxuXHJcbiAgaWYgKHVwZGF0ZWREYXRlICYmICFpc0RhdGVJbnB1dEludmFsaWQoaW50ZXJuYWxJbnB1dEVsKSkge1xyXG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQubWF4RGF0ZSA9IHVwZGF0ZWREYXRlO1xyXG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQucmFuZ2VEYXRlID0gdXBkYXRlZERhdGU7XHJcbiAgICByYW5nZVN0YXJ0RWwuZGF0YXNldC5kZWZhdWx0RGF0ZSA9IHVwZGF0ZWREYXRlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByYW5nZVN0YXJ0RWwuZGF0YXNldC5tYXhEYXRlID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlIHx8IFwiXCI7XHJcbiAgICByYW5nZVN0YXJ0RWwuZGF0YXNldC5yYW5nZURhdGUgPSBcIlwiO1xyXG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQuZGVmYXVsdERhdGUgPSBcIlwiO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUocmFuZ2VTdGFydEVsKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbmhhbmNlIGFuIGlucHV0IHdpdGggdGhlIGRhdGUgcGlja2VyIGVsZW1lbnRzXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBpbml0aWFsIHdyYXBwaW5nIGVsZW1lbnQgb2YgdGhlIGRhdGUgcmFuZ2UgcGlja2VyIGNvbXBvbmVudFxyXG4gKi9cclxuY29uc3QgZW5oYW5jZURhdGVSYW5nZVBpY2tlciA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IGRhdGVSYW5nZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1JBTkdFX1BJQ0tFUik7XHJcblxyXG4gIGNvbnN0IFtyYW5nZVN0YXJ0LCByYW5nZUVuZF0gPSBzZWxlY3QoREFURV9QSUNLRVIsIGRhdGVSYW5nZVBpY2tlckVsKTtcclxuXHJcbiAgaWYgKCFyYW5nZVN0YXJ0KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIGAke0RBVEVfUkFOR0VfUElDS0VSfSBpcyBtaXNzaW5nIGlubmVyIHR3byAnJHtEQVRFX1BJQ0tFUn0nIGVsZW1lbnRzYFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGlmICghcmFuZ2VFbmQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgYCR7REFURV9SQU5HRV9QSUNLRVJ9IGlzIG1pc3Npbmcgc2Vjb25kICcke0RBVEVfUElDS0VSfScgZWxlbWVudGBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByYW5nZVN0YXJ0LmNsYXNzTGlzdC5hZGQoREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfU1RBUlRfQ0xBU1MpO1xyXG4gIHJhbmdlRW5kLmNsYXNzTGlzdC5hZGQoREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfRU5EX0NMQVNTKTtcclxuXHJcbiAgaWYgKCFkYXRlUmFuZ2VQaWNrZXJFbC5kYXRhc2V0Lm1pbkRhdGUpIHtcclxuICAgIGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSA9IERFRkFVTFRfTUlOX0RBVEU7XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IG1pbkRhdGUgfSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQ7XHJcbiAgcmFuZ2VTdGFydC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlO1xyXG4gIHJhbmdlRW5kLmRhdGFzZXQubWluRGF0ZSA9IG1pbkRhdGU7XHJcblxyXG4gIGNvbnN0IHsgbWF4RGF0ZSB9ID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldDtcclxuICBpZiAobWF4RGF0ZSkge1xyXG4gICAgcmFuZ2VTdGFydC5kYXRhc2V0Lm1heERhdGUgPSBtYXhEYXRlO1xyXG4gICAgcmFuZ2VFbmQuZGF0YXNldC5tYXhEYXRlID0gbWF4RGF0ZTtcclxuICB9XHJcblxyXG4gIGhhbmRsZVJhbmdlU3RhcnRVcGRhdGUoZGF0ZVJhbmdlUGlja2VyRWwpO1xyXG4gIGhhbmRsZVJhbmdlRW5kVXBkYXRlKGRhdGVSYW5nZVBpY2tlckVsKTtcclxufTtcclxuXHJcbmNvbnN0IGRhdGVSYW5nZVBpY2tlciA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIFwiaW5wdXQgY2hhbmdlXCI6IHtcclxuICAgICAgW0RBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUXSgpIHtcclxuICAgICAgICBoYW5kbGVSYW5nZVN0YXJ0VXBkYXRlKHRoaXMpO1xyXG4gICAgICB9LFxyXG4gICAgICBbREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfRU5EXSgpIHtcclxuICAgICAgICBoYW5kbGVSYW5nZUVuZFVwZGF0ZSh0aGlzKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpbml0KHJvb3QpIHtcclxuICAgICAgc2VsZWN0T3JNYXRjaGVzKERBVEVfUkFOR0VfUElDS0VSLCByb290KS5mb3JFYWNoKChkYXRlUmFuZ2VQaWNrZXJFbCkgPT4ge1xyXG4gICAgICAgIGVuaGFuY2VEYXRlUmFuZ2VQaWNrZXIoZGF0ZVJhbmdlUGlja2VyRWwpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkYXRlUmFuZ2VQaWNrZXI7XHJcbiIsImNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcclxuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XHJcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcblxyXG5jb25zdCBEUk9QWk9ORV9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dGA7XHJcbmNvbnN0IERST1BaT05FID0gYC4ke0RST1BaT05FX0NMQVNTfWA7XHJcbmNvbnN0IElOUFVUX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19pbnB1dGA7XHJcbmNvbnN0IFRBUkdFVF9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fdGFyZ2V0YDtcclxuY29uc3QgSU5QVVQgPSBgLiR7SU5QVVRfQ0xBU1N9YDtcclxuY29uc3QgQk9YX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19ib3hgO1xyXG5jb25zdCBJTlNUUlVDVElPTlNfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2luc3RydWN0aW9uc2A7XHJcbmNvbnN0IFBSRVZJRVdfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX3ByZXZpZXdgO1xyXG5jb25zdCBQUkVWSUVXX0hFQURJTkdfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX3ByZXZpZXctaGVhZGluZ2A7XHJcbmNvbnN0IERJU0FCTEVEX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0LS1kaXNhYmxlZGA7XHJcbmNvbnN0IENIT09TRV9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fY2hvb3NlYDtcclxuY29uc3QgQUNDRVBURURfRklMRV9NRVNTQUdFX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19hY2NlcHRlZC1maWxlcy1tZXNzYWdlYDtcclxuY29uc3QgRFJBR19URVhUX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19kcmFnLXRleHRgO1xyXG5jb25zdCBEUkFHX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0LS1kcmFnYDtcclxuY29uc3QgTE9BRElOR19DTEFTUyA9IFwiaXMtbG9hZGluZ1wiO1xyXG5jb25zdCBJTlZBTElEX0ZJTEVfQ0xBU1MgPSBcImhhcy1pbnZhbGlkLWZpbGVcIjtcclxuY29uc3QgR0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUUgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX3ByZXZpZXctaW1hZ2VgO1xyXG5jb25zdCBHRU5FUklDX1BSRVZJRVdfQ0xBU1MgPSBgJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0tLWdlbmVyaWNgO1xyXG5jb25zdCBQREZfUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0tcGRmYDtcclxuY29uc3QgV09SRF9QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS13b3JkYDtcclxuY29uc3QgVklERU9fUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0tdmlkZW9gO1xyXG5jb25zdCBFWENFTF9QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS1leGNlbGA7XHJcbmNvbnN0IFNSX09OTFlfQ0xBU1MgPSBgJHtQUkVGSVh9LXNyLW9ubHlgO1xyXG5jb25zdCBTUEFDRVJfR0lGID1cclxuICBcImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQUFBQUFQLy8veUg1QkFFQUFBQUFMQUFBQUFBQkFBRUFBQUlCUkFBN1wiO1xyXG5cclxubGV0IFRZUEVfSVNfVkFMSUQgPSBCb29sZWFuKHRydWUpOyAvLyBsb2dpYyBnYXRlIGZvciBjaGFuZ2UgbGlzdGVuZXJcclxubGV0IERFRkFVTFRfQVJJQV9MQUJFTF9URVhUID0gXCJcIjtcclxubGV0IERFRkFVTFRfRklMRV9TVEFUVVNfVEVYVCA9IFwiXCI7XHJcblxyXG4vKipcclxuICogVGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIHdpdGhpbiB0aGUgZmlsZSBpbnB1dC5cclxuICogQHR5cGVkZWYge09iamVjdH0gRmlsZUlucHV0Q29udGV4dFxyXG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBkcm9wWm9uZUVsXHJcbiAqIEBwcm9wZXJ0eSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRFbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBHZXQgYW4gb2JqZWN0IG9mIHRoZSBwcm9wZXJ0aWVzIGFuZCBlbGVtZW50cyBiZWxvbmdpbmcgZGlyZWN0bHkgdG8gdGhlIGdpdmVuXHJcbiAqIGZpbGUgaW5wdXQgY29tcG9uZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGZpbGUgaW5wdXRcclxuICogQHJldHVybnMge0ZpbGVJbnB1dENvbnRleHR9IGVsZW1lbnRzXHJcbiAqL1xyXG5jb25zdCBnZXRGaWxlSW5wdXRDb250ZXh0ID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgZHJvcFpvbmVFbCA9IGVsLmNsb3Nlc3QoRFJPUFpPTkUpO1xyXG5cclxuICBpZiAoIWRyb3Bab25lRWwpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7RFJPUFpPTkV9YCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnB1dEVsID0gZHJvcFpvbmVFbC5xdWVyeVNlbGVjdG9yKElOUFVUKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRyb3Bab25lRWwsXHJcbiAgICBpbnB1dEVsLFxyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogRGlzYWJsZSB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBkaXNhYmxlID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgeyBkcm9wWm9uZUVsLCBpbnB1dEVsIH0gPSBnZXRGaWxlSW5wdXRDb250ZXh0KGVsKTtcclxuXHJcbiAgaW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgZHJvcFpvbmVFbC5jbGFzc0xpc3QuYWRkKERJU0FCTEVEX0NMQVNTKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgYXJpYS1kaXNhYmxlZCBhdHRyaWJ1dGUgdG8gZmlsZSBpbnB1dCBjb21wb25lbnRcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBhcmlhRGlzYWJsZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgZHJvcFpvbmVFbCB9ID0gZ2V0RmlsZUlucHV0Q29udGV4dChlbCk7XHJcblxyXG4gIGRyb3Bab25lRWwuY2xhc3NMaXN0LmFkZChESVNBQkxFRF9DTEFTUyk7XHJcbn07XHJcblxyXG4vKipcclxuICogRW5hYmxlIHRoZSBmaWxlIGlucHV0IGNvbXBvbmVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGVuYWJsZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IHsgZHJvcFpvbmVFbCwgaW5wdXRFbCB9ID0gZ2V0RmlsZUlucHV0Q29udGV4dChlbCk7XHJcblxyXG4gIGlucHV0RWwuZGlzYWJsZWQgPSBmYWxzZTtcclxuICBkcm9wWm9uZUVsLmNsYXNzTGlzdC5yZW1vdmUoRElTQUJMRURfQ0xBU1MpO1xyXG4gIGRyb3Bab25lRWwucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gcyBzcGVjaWFsIGNoYXJhY3RlcnNcclxuICogQHJldHVybnMge1N0cmluZ30gcmVwbGFjZXMgc3BlY2lmaWVkIHZhbHVlc1xyXG4gKi9cclxuY29uc3QgcmVwbGFjZU5hbWUgPSAocykgPT4ge1xyXG4gIGNvbnN0IGMgPSBzLmNoYXJDb2RlQXQoMCk7XHJcbiAgaWYgKGMgPT09IDMyKSByZXR1cm4gXCItXCI7XHJcbiAgaWYgKGMgPj0gNjUgJiYgYyA8PSA5MCkgcmV0dXJuIGBpbWdfJHtzLnRvTG93ZXJDYXNlKCl9YDtcclxuICByZXR1cm4gYF9fJHsoXCIwMDBcIiwgYy50b1N0cmluZygxNikpLnNsaWNlKC00KX1gO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gSUQgbmFtZSBmb3IgZWFjaCBmaWxlIHRoYXQgc3RyaXBzIGFsbCBpbnZhbGlkIGNoYXJhY3RlcnMuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgZmlsZSBhZGRlZCB0byBmaWxlIGlucHV0IChzZWFyY2h2YWx1ZSlcclxuICogQHJldHVybnMge1N0cmluZ30gc2FtZSBjaGFyYWN0ZXJzIGFzIHRoZSBuYW1lIHdpdGggaW52YWxpZCBjaGFycyByZW1vdmVkIChuZXd2YWx1ZSlcclxuICovXHJcbmNvbnN0IG1ha2VTYWZlRm9ySUQgPSAobmFtZSkgPT4gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV0vZywgcmVwbGFjZU5hbWUpO1xyXG5cclxuLy8gVGFrZXMgYSBnZW5lcmF0ZWQgc2FmZSBJRCBhbmQgY3JlYXRlcyBhIHVuaXF1ZSBJRC5cclxuY29uc3QgY3JlYXRlVW5pcXVlSUQgPSAobmFtZSkgPT5cclxuICBgJHtuYW1lfS0ke01hdGguZmxvb3IoRGF0ZS5ub3coKS50b1N0cmluZygpIC8gMTAwMCl9YDtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIGlmIHRoZSBzaW5ndWxhciBvciBwbHVyYWwgaXRlbSBsYWJlbCBzaG91bGQgYmUgdXNlZFxyXG4gKiBEZXRlcm1pbmF0aW9uIGlzIGJhc2VkIG9uIHRoZSBwcmVzZW5jZSBvZiB0aGUgYG11bHRpcGxlYCBhdHRyaWJ1dGVcclxuICpcclxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBpbnB1dCBlbGVtZW50LlxyXG4gKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBzaW5ndWxhciBvciBwbHVyYWwgdmVyc2lvbiBvZiBcIml0ZW1cIlxyXG4gKi9cclxuY29uc3QgZ2V0SXRlbXNMYWJlbCA9IChmaWxlSW5wdXRFbCkgPT4ge1xyXG4gIGNvbnN0IGFjY2VwdHNNdWx0aXBsZSA9IGZpbGVJbnB1dEVsLmhhc0F0dHJpYnV0ZShcIm11bHRpcGxlXCIpO1xyXG4gIGNvbnN0IGl0ZW1zTGFiZWwgPSBhY2NlcHRzTXVsdGlwbGUgPyBcImZpbGVzXCIgOiBcImZpbGVcIjtcclxuXHJcbiAgcmV0dXJuIGl0ZW1zTGFiZWw7XHJcbn07XHJcblxyXG4vKipcclxuICogU2NhZmZvbGQgdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50IHdpdGggYSBwYXJlbnQgd3JhcHBlciBhbmRcclxuICogQ3JlYXRlIGEgdGFyZ2V0IGFyZWEgb3ZlcmxheSBmb3IgZHJhZyBhbmQgZHJvcCBmdW5jdGlvbmFsaXR5XHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZmlsZUlucHV0RWwgLSBUaGUgaW5wdXQgZWxlbWVudC5cclxuICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBUaGUgZHJhZyBhbmQgZHJvcCB0YXJnZXQgYXJlYS5cclxuICovXHJcbmNvbnN0IGNyZWF0ZVRhcmdldEFyZWEgPSAoZmlsZUlucHV0RWwpID0+IHtcclxuICBjb25zdCBmaWxlSW5wdXRQYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGNvbnN0IGRyb3BUYXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGNvbnN0IGJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblxyXG4gIC8vIEFkZHMgY2xhc3MgbmFtZXMgYW5kIG90aGVyIGF0dHJpYnV0ZXNcclxuICBmaWxlSW5wdXRFbC5jbGFzc0xpc3QucmVtb3ZlKERST1BaT05FX0NMQVNTKTtcclxuICBmaWxlSW5wdXRFbC5jbGFzc0xpc3QuYWRkKElOUFVUX0NMQVNTKTtcclxuICBmaWxlSW5wdXRQYXJlbnQuY2xhc3NMaXN0LmFkZChEUk9QWk9ORV9DTEFTUyk7XHJcbiAgYm94LmNsYXNzTGlzdC5hZGQoQk9YX0NMQVNTKTtcclxuICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5hZGQoVEFSR0VUX0NMQVNTKTtcclxuXHJcbiAgLy8gQWRkcyBjaGlsZCBlbGVtZW50cyB0byB0aGUgRE9NXHJcbiAgZHJvcFRhcmdldC5wcmVwZW5kKGJveCk7XHJcbiAgZmlsZUlucHV0RWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZHJvcFRhcmdldCwgZmlsZUlucHV0RWwpO1xyXG4gIGZpbGVJbnB1dEVsLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGZpbGVJbnB1dFBhcmVudCwgZHJvcFRhcmdldCk7XHJcbiAgZHJvcFRhcmdldC5hcHBlbmRDaGlsZChmaWxlSW5wdXRFbCk7XHJcbiAgZmlsZUlucHV0UGFyZW50LmFwcGVuZENoaWxkKGRyb3BUYXJnZXQpO1xyXG5cclxuICByZXR1cm4gZHJvcFRhcmdldDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBCdWlsZCB0aGUgdmlzaWJsZSBlbGVtZW50IHdpdGggZGVmYXVsdCBpbnRlcmFjdGlvbiBpbnN0cnVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZmlsZUlucHV0RWwgLSBUaGUgaW5wdXQgZWxlbWVudC5cclxuICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBUaGUgY29udGFpbmVyIGZvciB2aXNpYmxlIGludGVyYWN0aW9uIGluc3RydWN0aW9ucy5cclxuICovXHJcbmNvbnN0IGNyZWF0ZVZpc2libGVJbnN0cnVjdGlvbnMgPSAoZmlsZUlucHV0RWwpID0+IHtcclxuICBjb25zdCBmaWxlSW5wdXRQYXJlbnQgPSBmaWxlSW5wdXRFbC5jbG9zZXN0KERST1BaT05FKTtcclxuICBjb25zdCBpdGVtc0xhYmVsID0gZ2V0SXRlbXNMYWJlbChmaWxlSW5wdXRFbCk7XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjb25zdCBkcmFnVGV4dCA9IGBEcmFnICR7aXRlbXNMYWJlbH0gaGVyZSBvcmA7XHJcbiAgY29uc3QgY2hvb3NlVGV4dCA9IFwiY2hvb3NlIGZyb20gZm9sZGVyXCI7XHJcblxyXG4gIC8vIENyZWF0ZSBpbnN0cnVjdGlvbnMgdGV4dCBmb3IgYXJpYS1sYWJlbFxyXG4gIERFRkFVTFRfQVJJQV9MQUJFTF9URVhUID0gYCR7ZHJhZ1RleHR9ICR7Y2hvb3NlVGV4dH1gO1xyXG5cclxuICAvLyBBZGRzIGNsYXNzIG5hbWVzIGFuZCBvdGhlciBhdHRyaWJ1dGVzXHJcbiAgaW5zdHJ1Y3Rpb25zLmNsYXNzTGlzdC5hZGQoSU5TVFJVQ1RJT05TX0NMQVNTKTtcclxuICBpbnN0cnVjdGlvbnMuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG5cclxuICAvLyBBZGQgaW5pdGlhbCBpbnN0cnVjdGlvbnMgZm9yIGlucHV0IHVzYWdlXHJcbiAgZmlsZUlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBERUZBVUxUX0FSSUFfTEFCRUxfVEVYVCk7XHJcbiAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYDxzcGFuIGNsYXNzPVwiJHtEUkFHX1RFWFRfQ0xBU1N9XCI+JHtkcmFnVGV4dH08L3NwYW4+IDxzcGFuIGNsYXNzPVwiJHtDSE9PU0VfQ0xBU1N9XCI+JHtjaG9vc2VUZXh0fTwvc3Bhbj5gO1xyXG5cclxuICAvLyBBZGQgdGhlIGluc3RydWN0aW9ucyBlbGVtZW50IHRvIHRoZSBET01cclxuICBmaWxlSW5wdXRFbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnN0cnVjdGlvbnMsIGZpbGVJbnB1dEVsKTtcclxuXHJcbiAgLy8gSUUxMSBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBkcm9wIGZpbGVzIG9uIGZpbGUgaW5wdXRzLCBzbyB3ZSd2ZSByZW1vdmVkIHRleHQgdGhhdCBpbmRpY2F0ZXMgdGhhdFxyXG4gIGlmIChcclxuICAgIC9ydjoxMS4wL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSB8fFxyXG4gICAgL0VkZ2VcXC9cXGQuL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KVxyXG4gICkge1xyXG4gICAgZmlsZUlucHV0UGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke0RSQUdfVEVYVF9DTEFTU31gKS5vdXRlckhUTUwgPSBcIlwiO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGluc3RydWN0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBCdWlsZCBhIHNjcmVlbiByZWFkZXItb25seSBtZXNzYWdlIGVsZW1lbnQgdGhhdCBjb250YWlucyBmaWxlIHN0YXR1cyB1cGRhdGVzIGFuZFxyXG4gKiBDcmVhdGUgYW5kIHNldCB0aGUgZGVmYXVsdCBmaWxlIHN0YXR1cyBtZXNzYWdlXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZmlsZUlucHV0RWwgLSBUaGUgaW5wdXQgZWxlbWVudC5cclxuICovXHJcbmNvbnN0IGNyZWF0ZVNST25seVN0YXR1cyA9IChmaWxlSW5wdXRFbCkgPT4ge1xyXG4gIGNvbnN0IHN0YXR1c0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjb25zdCBpdGVtc0xhYmVsID0gZ2V0SXRlbXNMYWJlbChmaWxlSW5wdXRFbCk7XHJcbiAgY29uc3QgZmlsZUlucHV0UGFyZW50ID0gZmlsZUlucHV0RWwuY2xvc2VzdChEUk9QWk9ORSk7XHJcbiAgY29uc3QgZmlsZUlucHV0VGFyZ2V0ID0gZmlsZUlucHV0RWwuY2xvc2VzdChgLiR7VEFSR0VUX0NMQVNTfWApO1xyXG5cclxuICBERUZBVUxUX0ZJTEVfU1RBVFVTX1RFWFQgPSBgTm8gJHtpdGVtc0xhYmVsfSBzZWxlY3RlZC5gO1xyXG5cclxuICAvLyBBZGRzIGNsYXNzIG5hbWVzIGFuZCBvdGhlciBhdHRyaWJ1dGVzXHJcbiAgc3RhdHVzRWwuY2xhc3NMaXN0LmFkZChTUl9PTkxZX0NMQVNTKTtcclxuICBzdGF0dXNFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XHJcblxyXG4gIC8vIEFkZCBpbml0aWFsIGZpbGUgc3RhdHVzIG1lc3NhZ2VcclxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IERFRkFVTFRfRklMRV9TVEFUVVNfVEVYVDtcclxuXHJcbiAgLy8gQWRkIHRoZSBzdGF0dXMgZWxlbWVudCB0byB0aGUgRE9NXHJcbiAgZmlsZUlucHV0UGFyZW50Lmluc2VydEJlZm9yZShzdGF0dXNFbCwgZmlsZUlucHV0VGFyZ2V0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY2FmZm9sZCB0aGUgY29tcG9uZW50IHdpdGggYWxsIHJlcXVpcmVkIGVsZW1lbnRzXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZmlsZUlucHV0RWwgLSBUaGUgb3JpZ2luYWwgaW5wdXQgZWxlbWVudC5cclxuICovXHJcbmNvbnN0IGVuaGFuY2VGaWxlSW5wdXQgPSAoZmlsZUlucHV0RWwpID0+IHtcclxuICBjb25zdCBpc0lucHV0RGlzYWJsZWQgPVxyXG4gICAgZmlsZUlucHV0RWwuaGFzQXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiKSB8fFxyXG4gICAgZmlsZUlucHV0RWwuaGFzQXR0cmlidXRlKFwiZGlzYWJsZWRcIik7XHJcbiAgY29uc3QgZHJvcFRhcmdldCA9IGNyZWF0ZVRhcmdldEFyZWEoZmlsZUlucHV0RWwpO1xyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGNyZWF0ZVZpc2libGVJbnN0cnVjdGlvbnMoZmlsZUlucHV0RWwpO1xyXG4gIGNvbnN0IHsgZHJvcFpvbmVFbCB9ID0gZ2V0RmlsZUlucHV0Q29udGV4dChmaWxlSW5wdXRFbCk7XHJcblxyXG4gIGlmIChpc0lucHV0RGlzYWJsZWQpIHtcclxuICAgIGRyb3Bab25lRWwuY2xhc3NMaXN0LmFkZChESVNBQkxFRF9DTEFTUyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNyZWF0ZVNST25seVN0YXR1cyhmaWxlSW5wdXRFbCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGltYWdlIHByZXZpZXdzXHJcbiAqIFdlIHdhbnQgdG8gc3RhcnQgd2l0aCBhIGNsZWFuIGxpc3QgZXZlcnkgdGltZSBmaWxlcyBhcmUgYWRkZWQgdG8gdGhlIGZpbGUgaW5wdXRcclxuICpcclxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gZHJvcFRhcmdldCAtIFRoZSBkcmFnIGFuZCBkcm9wIHRhcmdldCBhcmVhLlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBpbnN0cnVjdGlvbnMgLSBUaGUgY29udGFpbmVyIGZvciB2aXNpYmxlIGludGVyYWN0aW9uIGluc3RydWN0aW9ucy5cclxuICovXHJcbmNvbnN0IHJlbW92ZU9sZFByZXZpZXdzID0gKGRyb3BUYXJnZXQsIGluc3RydWN0aW9ucykgPT4ge1xyXG4gIGNvbnN0IGZpbGVQcmV2aWV3cyA9IGRyb3BUYXJnZXQucXVlcnlTZWxlY3RvckFsbChgLiR7UFJFVklFV19DTEFTU31gKTtcclxuICBjb25zdCBjdXJyZW50UHJldmlld0hlYWRpbmcgPSBkcm9wVGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBgLiR7UFJFVklFV19IRUFESU5HX0NMQVNTfWBcclxuICApO1xyXG4gIGNvbnN0IGN1cnJlbnRFcnJvck1lc3NhZ2UgPSBkcm9wVGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBgLiR7QUNDRVBURURfRklMRV9NRVNTQUdFX0NMQVNTfWBcclxuICApO1xyXG5cclxuICAvKipcclxuICAgKiBmaW5kcyB0aGUgcGFyZW50IG9mIHRoZSBwYXNzZWQgbm9kZSBhbmQgcmVtb3ZlcyB0aGUgY2hpbGRcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXHJcbiAgICovXHJcbiAgY29uc3QgcmVtb3ZlSW1hZ2VzID0gKG5vZGUpID0+IHtcclxuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcclxuICB9O1xyXG5cclxuICAvLyBSZW1vdmUgdGhlIGhlYWRpbmcgYWJvdmUgdGhlIHByZXZpZXdzXHJcbiAgaWYgKGN1cnJlbnRQcmV2aWV3SGVhZGluZykge1xyXG4gICAgY3VycmVudFByZXZpZXdIZWFkaW5nLm91dGVySFRNTCA9IFwiXCI7XHJcbiAgfVxyXG5cclxuICAvLyBSZW1vdmUgZXhpc3RpbmcgZXJyb3IgbWVzc2FnZXNcclxuICBpZiAoY3VycmVudEVycm9yTWVzc2FnZSkge1xyXG4gICAgY3VycmVudEVycm9yTWVzc2FnZS5vdXRlckhUTUwgPSBcIlwiO1xyXG4gICAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKElOVkFMSURfRklMRV9DTEFTUyk7XHJcbiAgfVxyXG5cclxuICAvLyBHZXQgcmlkIG9mIGV4aXN0aW5nIHByZXZpZXdzIGlmIHRoZXkgZXhpc3QsIHNob3cgaW5zdHJ1Y3Rpb25zXHJcbiAgaWYgKGZpbGVQcmV2aWV3cyAhPT0gbnVsbCkge1xyXG4gICAgaWYgKGluc3RydWN0aW9ucykge1xyXG4gICAgICBpbnN0cnVjdGlvbnMucmVtb3ZlQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xyXG4gICAgfVxyXG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChmaWxlUHJldmlld3MsIHJlbW92ZUltYWdlcyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSB0aGUgc2NyZWVuIHJlYWRlci1vbmx5IHN0YXR1cyBtZXNzYWdlIGFmdGVyIGludGVyYWN0aW9uXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IHN0YXR1c0VsZW1lbnQgLSBUaGUgc2NyZWVuIHJlYWRlci1vbmx5IGNvbnRhaW5lciBmb3IgZmlsZSBzdGF0dXMgdXBkYXRlcy5cclxuICogQHBhcmFtIHtPYmplY3R9IGZpbGVOYW1lcyAtIFRoZSBzZWxlY3RlZCBmaWxlcyBmb3VuZCBpbiB0aGUgZmlsZUxpc3Qgb2JqZWN0LlxyXG4gKiBAcGFyYW0ge0FycmF5fSBmaWxlU3RvcmUgLSBUaGUgYXJyYXkgb2YgdXBsb2FkZWQgZmlsZSBuYW1lcyBjcmVhdGVkIGZyb20gdGhlIGZpbGVOYW1lcyBvYmplY3QuXHJcbiAqL1xyXG5jb25zdCB1cGRhdGVTdGF0dXNNZXNzYWdlID0gKHN0YXR1c0VsZW1lbnQsIGZpbGVOYW1lcywgZmlsZVN0b3JlKSA9PiB7XHJcbiAgY29uc3Qgc3RhdHVzRWwgPSBzdGF0dXNFbGVtZW50O1xyXG4gIGxldCBzdGF0dXNNZXNzYWdlID0gREVGQVVMVF9GSUxFX1NUQVRVU19URVhUO1xyXG5cclxuICAvLyBJZiBmaWxlcyBhZGRlZCwgdXBkYXRlIHRoZSBzdGF0dXMgbWVzc2FnZSB3aXRoIGZpbGUgbmFtZShzKVxyXG4gIGlmIChmaWxlTmFtZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICBzdGF0dXNNZXNzYWdlID0gYFlvdSBoYXZlIHNlbGVjdGVkIHRoZSBmaWxlOiAke2ZpbGVTdG9yZX1gO1xyXG4gIH0gZWxzZSBpZiAoZmlsZU5hbWVzLmxlbmd0aCA+IDEpIHtcclxuICAgIHN0YXR1c01lc3NhZ2UgPSBgWW91IGhhdmUgc2VsZWN0ZWQgJHtcclxuICAgICAgZmlsZU5hbWVzLmxlbmd0aFxyXG4gICAgfSBmaWxlczogJHtmaWxlU3RvcmUuam9pbihcIiwgXCIpfWA7XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgZGVsYXkgdG8gZW5jb3VyYWdlIHNjcmVlbiByZWFkZXIgcmVhZG91dFxyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBzdGF0dXNNZXNzYWdlO1xyXG4gIH0sIDEwMDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNob3cgdGhlIHByZXZpZXcgaGVhZGluZywgaGlkZSB0aGUgaW5pdGlhbCBpbnN0cnVjdGlvbnMgYW5kXHJcbiAqIFVwZGF0ZSB0aGUgYXJpYS1sYWJlbCB3aXRoIG5ldyBpbnN0cnVjdGlvbnMgdGV4dFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gVGhlIGlucHV0IGVsZW1lbnQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlTmFtZXMgLSBUaGUgc2VsZWN0ZWQgZmlsZXMgZm91bmQgaW4gdGhlIGZpbGVMaXN0IG9iamVjdC5cclxuICovXHJcbmNvbnN0IGFkZFByZXZpZXdIZWFkaW5nID0gKGZpbGVJbnB1dEVsLCBmaWxlTmFtZXMpID0+IHtcclxuICBjb25zdCBmaWxlUHJldmlld3NIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjb25zdCBkcm9wVGFyZ2V0ID0gZmlsZUlucHV0RWwuY2xvc2VzdChgLiR7VEFSR0VUX0NMQVNTfWApO1xyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGRyb3BUYXJnZXQucXVlcnlTZWxlY3RvcihgLiR7SU5TVFJVQ1RJT05TX0NMQVNTfWApO1xyXG4gIGxldCBjaGFuZ2VJdGVtVGV4dCA9IFwiQ2hhbmdlIGZpbGVcIjtcclxuICBsZXQgcHJldmlld0hlYWRpbmdUZXh0ID0gXCJcIjtcclxuXHJcbiAgaWYgKGZpbGVOYW1lcy5sZW5ndGggPT09IDEpIHtcclxuICAgIHByZXZpZXdIZWFkaW5nVGV4dCA9IFNhbml0aXplci5lc2NhcGVIVE1MYFNlbGVjdGVkIGZpbGUgPHNwYW4gY2xhc3M9XCJ1c2EtZmlsZS1pbnB1dF9fY2hvb3NlXCI+JHtjaGFuZ2VJdGVtVGV4dH08L3NwYW4+YDtcclxuICB9IGVsc2UgaWYgKGZpbGVOYW1lcy5sZW5ndGggPiAxKSB7XHJcbiAgICBjaGFuZ2VJdGVtVGV4dCA9IFwiQ2hhbmdlIGZpbGVzXCI7XHJcbiAgICBwcmV2aWV3SGVhZGluZ1RleHQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke2ZpbGVOYW1lcy5sZW5ndGh9IGZpbGVzIHNlbGVjdGVkIDxzcGFuIGNsYXNzPVwidXNhLWZpbGUtaW5wdXRfX2Nob29zZVwiPiR7Y2hhbmdlSXRlbVRleHR9PC9zcGFuPmA7XHJcbiAgfVxyXG5cclxuICAvLyBIaWRlcyBudWxsIHN0YXRlIGNvbnRlbnQgYW5kIHNldHMgcHJldmlldyBoZWFkaW5nXHJcbiAgaW5zdHJ1Y3Rpb25zLnNldEF0dHJpYnV0ZShcImhpZGRlblwiLCBcInRydWVcIik7XHJcbiAgZmlsZVByZXZpZXdzSGVhZGluZy5jbGFzc0xpc3QuYWRkKFBSRVZJRVdfSEVBRElOR19DTEFTUyk7XHJcbiAgZmlsZVByZXZpZXdzSGVhZGluZy5pbm5lckhUTUwgPSBwcmV2aWV3SGVhZGluZ1RleHQ7XHJcbiAgZHJvcFRhcmdldC5pbnNlcnRCZWZvcmUoZmlsZVByZXZpZXdzSGVhZGluZywgaW5zdHJ1Y3Rpb25zKTtcclxuXHJcbiAgLy8gVXBkYXRlIGFyaWEgbGFiZWwgdG8gbWF0Y2ggdGhlIHZpc2libGUgYWN0aW9uIHRleHRcclxuICBmaWxlSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGNoYW5nZUl0ZW1UZXh0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXaGVuIG5ldyBmaWxlcyBhcmUgYXBwbGllZCB0byBmaWxlIGlucHV0LCB0aGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyBwcmV2aWV3c1xyXG4gKiBhbmQgcmVtb3ZlcyBvbGQgb25lcy5cclxuICpcclxuICogQHBhcmFtIHtldmVudH0gZVxyXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gVGhlIGlucHV0IGVsZW1lbnQuXHJcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGluc3RydWN0aW9ucyAtIFRoZSBjb250YWluZXIgZm9yIHZpc2libGUgaW50ZXJhY3Rpb24gaW5zdHJ1Y3Rpb25zLlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBkcm9wVGFyZ2V0IC0gVGhlIGRyYWcgYW5kIGRyb3AgdGFyZ2V0IGFyZWEuXHJcbiAqL1xyXG5cclxuY29uc3QgaGFuZGxlQ2hhbmdlID0gKGUsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpID0+IHtcclxuICBjb25zdCBmaWxlTmFtZXMgPSBlLnRhcmdldC5maWxlcztcclxuICBjb25zdCBpbnB1dFBhcmVudCA9IGRyb3BUYXJnZXQuY2xvc2VzdChgLiR7RFJPUFpPTkVfQ0xBU1N9YCk7XHJcbiAgY29uc3Qgc3RhdHVzRWxlbWVudCA9IGlucHV0UGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke1NSX09OTFlfQ0xBU1N9YCk7XHJcbiAgY29uc3QgZmlsZVN0b3JlID0gW107XHJcblxyXG4gIC8vIEZpcnN0LCBnZXQgcmlkIG9mIGV4aXN0aW5nIHByZXZpZXdzXHJcbiAgcmVtb3ZlT2xkUHJldmlld3MoZHJvcFRhcmdldCwgaW5zdHJ1Y3Rpb25zKTtcclxuXHJcbiAgLy8gVGhlbiwgaXRlcmF0ZSB0aHJvdWdoIGZpbGVzIGxpc3QgYW5kIGNyZWF0ZSBwcmV2aWV3c1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZU5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlTmFtZXNbaV0ubmFtZTtcclxuICAgIGxldCBpbWFnZUlkO1xyXG5cclxuICAgIC8vIFB1c2ggdXBkYXRlZCBmaWxlIG5hbWVzIGludG8gdGhlIHN0b3JlIGFycmF5XHJcbiAgICBmaWxlU3RvcmUucHVzaChmaWxlTmFtZSk7XHJcblxyXG4gICAgLy8gU3RhcnRzIHdpdGggYSBsb2FkaW5nIGltYWdlIHdoaWxlIHByZXZpZXcgaXMgY3JlYXRlZFxyXG4gICAgcmVhZGVyLm9ubG9hZHN0YXJ0ID0gZnVuY3Rpb24gY3JlYXRlTG9hZGluZ0ltYWdlKCkge1xyXG4gICAgICBpbWFnZUlkID0gY3JlYXRlVW5pcXVlSUQobWFrZVNhZmVGb3JJRChmaWxlTmFtZSkpO1xyXG5cclxuICAgICAgaW5zdHJ1Y3Rpb25zLmluc2VydEFkamFjZW50SFRNTChcclxuICAgICAgICBcImFmdGVyZW5kXCIsXHJcbiAgICAgICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgPGRpdiBjbGFzcz1cIiR7UFJFVklFV19DTEFTU31cIiBhcmlhLWhpZGRlbj1cInRydWVcIj5cclxuICAgICAgICAgIDxpbWcgaWQ9XCIke2ltYWdlSWR9XCIgc3JjPVwiJHtTUEFDRVJfR0lGfVwiIGFsdD1cIlwiIGNsYXNzPVwiJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0gJHtMT0FESU5HX0NMQVNTfVwiLz4ke2ZpbGVOYW1lfVxyXG4gICAgICAgIDxkaXY+YFxyXG4gICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBOb3QgYWxsIGZpbGVzIHdpbGwgYmUgYWJsZSB0byBnZW5lcmF0ZSBwcmV2aWV3cy4gSW4gY2FzZSB0aGlzIGhhcHBlbnMsIHdlIHByb3ZpZGUgc2V2ZXJhbCB0eXBlcyBcImdlbmVyaWMgcHJldmlld3NcIiBiYXNlZCBvbiB0aGUgZmlsZSBleHRlbnNpb24uXHJcbiAgICByZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24gY3JlYXRlRmlsZVByZXZpZXcoKSB7XHJcbiAgICAgIGNvbnN0IHByZXZpZXdJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGltYWdlSWQpO1xyXG4gICAgICBpZiAoZmlsZU5hbWUuaW5kZXhPZihcIi5wZGZcIikgPiAwKSB7XHJcbiAgICAgICAgcHJldmlld0ltYWdlLnNldEF0dHJpYnV0ZShcclxuICAgICAgICAgIFwib25lcnJvclwiLFxyXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1BERl9QUkVWSUVXX0NMQVNTfVwiKWBcclxuICAgICAgICApO1xyXG4gICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgIGZpbGVOYW1lLmluZGV4T2YoXCIuZG9jXCIpID4gMCB8fFxyXG4gICAgICAgIGZpbGVOYW1lLmluZGV4T2YoXCIucGFnZXNcIikgPiAwXHJcbiAgICAgICkge1xyXG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXHJcbiAgICAgICAgICBcIm9uZXJyb3JcIixcclxuICAgICAgICAgIGB0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnNyYz1cIiR7U1BBQ0VSX0dJRn1cIjsgdGhpcy5jbGFzc0xpc3QuYWRkKFwiJHtXT1JEX1BSRVZJRVdfQ0xBU1N9XCIpYFxyXG4gICAgICAgICk7XHJcbiAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgZmlsZU5hbWUuaW5kZXhPZihcIi54bHNcIikgPiAwIHx8XHJcbiAgICAgICAgZmlsZU5hbWUuaW5kZXhPZihcIi5udW1iZXJzXCIpID4gMFxyXG4gICAgICApIHtcclxuICAgICAgICBwcmV2aWV3SW1hZ2Uuc2V0QXR0cmlidXRlKFxyXG4gICAgICAgICAgXCJvbmVycm9yXCIsXHJcbiAgICAgICAgICBgdGhpcy5vbmVycm9yPW51bGw7dGhpcy5zcmM9XCIke1NQQUNFUl9HSUZ9XCI7IHRoaXMuY2xhc3NMaXN0LmFkZChcIiR7RVhDRUxfUFJFVklFV19DTEFTU31cIilgXHJcbiAgICAgICAgKTtcclxuICAgICAgfSBlbHNlIGlmIChmaWxlTmFtZS5pbmRleE9mKFwiLm1vdlwiKSA+IDAgfHwgZmlsZU5hbWUuaW5kZXhPZihcIi5tcDRcIikgPiAwKSB7XHJcbiAgICAgICAgcHJldmlld0ltYWdlLnNldEF0dHJpYnV0ZShcclxuICAgICAgICAgIFwib25lcnJvclwiLFxyXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1ZJREVPX1BSRVZJRVdfQ0xBU1N9XCIpYFxyXG4gICAgICAgICk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldmlld0ltYWdlLnNldEF0dHJpYnV0ZShcclxuICAgICAgICAgIFwib25lcnJvclwiLFxyXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke0dFTkVSSUNfUFJFVklFV19DTEFTU31cIilgXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlcyBsb2FkZXIgYW5kIGRpc3BsYXlzIHByZXZpZXdcclxuICAgICAgcHJldmlld0ltYWdlLmNsYXNzTGlzdC5yZW1vdmUoTE9BRElOR19DTEFTUyk7XHJcbiAgICAgIHByZXZpZXdJbWFnZS5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoZmlsZU5hbWVzW2ldKSB7XHJcbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVOYW1lc1tpXSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoZmlsZU5hbWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgLy8gUmVzZXQgaW5wdXQgYXJpYS1sYWJlbCB3aXRoIGRlZmF1bHQgbWVzc2FnZVxyXG4gICAgZmlsZUlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBERUZBVUxUX0FSSUFfTEFCRUxfVEVYVCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGFkZFByZXZpZXdIZWFkaW5nKGZpbGVJbnB1dEVsLCBmaWxlTmFtZXMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlU3RhdHVzTWVzc2FnZShzdGF0dXNFbGVtZW50LCBmaWxlTmFtZXMsIGZpbGVTdG9yZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV2hlbiB1c2luZyBhbiBBY2NlcHQgYXR0cmlidXRlLCBpbnZhbGlkIGZpbGVzIHdpbGwgYmUgaGlkZGVuIGZyb21cclxuICogZmlsZSBicm93c2VyLCBidXQgdGhleSBjYW4gc3RpbGwgYmUgZHJhZ2dlZCB0byB0aGUgaW5wdXQuIFRoaXNcclxuICogZnVuY3Rpb24gcHJldmVudHMgdGhlbSBmcm9tIGJlaW5nIGRyYWdnZWQgYW5kIHJlbW92ZXMgZXJyb3Igc3RhdGVzXHJcbiAqIHdoZW4gY29ycmVjdCBmaWxlcyBhcmUgYWRkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7ZXZlbnR9IGVcclxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBpbnB1dCBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBpbnN0cnVjdGlvbnMgLSBUaGUgY29udGFpbmVyIGZvciB2aXNpYmxlIGludGVyYWN0aW9uIGluc3RydWN0aW9ucy5cclxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gZHJvcFRhcmdldCAtIFRoZSBkcmFnIGFuZCBkcm9wIHRhcmdldCBhcmVhLlxyXG4gKi9cclxuY29uc3QgcHJldmVudEludmFsaWRGaWxlcyA9IChlLCBmaWxlSW5wdXRFbCwgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0KSA9PiB7XHJcbiAgY29uc3QgYWNjZXB0ZWRGaWxlc0F0dHIgPSBmaWxlSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJhY2NlcHRcIik7XHJcbiAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKElOVkFMSURfRklMRV9DTEFTUyk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFdlIGNhbiBwcm9iYWJseSBtb3ZlIGF3YXkgZnJvbSB0aGlzIG9uY2UgSUUxMSBzdXBwb3J0IHN0b3BzLCBhbmQgcmVwbGFjZVxyXG4gICAqIHdpdGggYSBzaW1wbGUgZXMgYC5pbmNsdWRlc2BcclxuICAgKiBjaGVjayBpZiBlbGVtZW50IGlzIGluIGFycmF5XHJcbiAgICogY2hlY2sgaWYgMSBvciBtb3JlIGFscGhhYmV0cyBhcmUgaW4gc3RyaW5nXHJcbiAgICogaWYgZWxlbWVudCBpcyBwcmVzZW50IHJldHVybiB0aGUgcG9zaXRpb24gdmFsdWUgYW5kIC0xIG90aGVyd2lzZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgY29uc3QgaXNJbmNsdWRlZCA9IChmaWxlLCB2YWx1ZSkgPT4ge1xyXG4gICAgbGV0IHJldHVyblZhbHVlID0gZmFsc2U7XHJcbiAgICBjb25zdCBwb3MgPSBmaWxlLmluZGV4T2YodmFsdWUpO1xyXG4gICAgaWYgKHBvcyA+PSAwKSB7XHJcbiAgICAgIHJldHVyblZhbHVlID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICB9O1xyXG5cclxuICAvLyBSdW5zIGlmIG9ubHkgc3BlY2lmaWMgZmlsZXMgYXJlIGFjY2VwdGVkXHJcbiAgaWYgKGFjY2VwdGVkRmlsZXNBdHRyKSB7XHJcbiAgICBjb25zdCBhY2NlcHRlZEZpbGVzID0gYWNjZXB0ZWRGaWxlc0F0dHIuc3BsaXQoXCIsXCIpO1xyXG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbiAgICAvLyBJZiBtdWx0aXBsZSBmaWxlcyBhcmUgZHJhZ2dlZCwgdGhpcyBpdGVyYXRlcyB0aHJvdWdoIHRoZW0gYW5kIGxvb2sgZm9yIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgYWNjZXB0ZWQuXHJcbiAgICBsZXQgYWxsRmlsZXNBbGxvd2VkID0gdHJ1ZTtcclxuICAgIGNvbnN0IHNjYW5uZWRGaWxlcyA9IGUudGFyZ2V0LmZpbGVzIHx8IGUuZGF0YVRyYW5zZmVyLmZpbGVzO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2FubmVkRmlsZXMubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgY29uc3QgZmlsZSA9IHNjYW5uZWRGaWxlc1tpXTtcclxuICAgICAgaWYgKGFsbEZpbGVzQWxsb3dlZCkge1xyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYWNjZXB0ZWRGaWxlcy5sZW5ndGg7IGogKz0gMSkge1xyXG4gICAgICAgICAgY29uc3QgZmlsZVR5cGUgPSBhY2NlcHRlZEZpbGVzW2pdO1xyXG4gICAgICAgICAgYWxsRmlsZXNBbGxvd2VkID1cclxuICAgICAgICAgICAgZmlsZS5uYW1lLmluZGV4T2YoZmlsZVR5cGUpID4gMCB8fFxyXG4gICAgICAgICAgICBpc0luY2x1ZGVkKGZpbGUudHlwZSwgZmlsZVR5cGUucmVwbGFjZSgvXFwqL2csIFwiXCIpKTtcclxuICAgICAgICAgIGlmIChhbGxGaWxlc0FsbG93ZWQpIHtcclxuICAgICAgICAgICAgVFlQRV9JU19WQUxJRCA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIGRyYWdnZWQgZmlsZXMgYXJlIG5vdCBhY2NlcHRlZCwgdGhpcyByZW1vdmVzIHRoZW0gZnJvbSB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IGFuZCBjcmVhdGVzIGFuZCBlcnJvciBzdGF0ZVxyXG4gICAgaWYgKCFhbGxGaWxlc0FsbG93ZWQpIHtcclxuICAgICAgcmVtb3ZlT2xkUHJldmlld3MoZHJvcFRhcmdldCwgaW5zdHJ1Y3Rpb25zKTtcclxuICAgICAgZmlsZUlucHV0RWwudmFsdWUgPSBcIlwiOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXHJcbiAgICAgIGRyb3BUYXJnZXQuaW5zZXJ0QmVmb3JlKGVycm9yTWVzc2FnZSwgZmlsZUlucHV0RWwpO1xyXG4gICAgICBlcnJvck1lc3NhZ2UudGV4dENvbnRlbnQgPVxyXG4gICAgICAgIGZpbGVJbnB1dEVsLmRhdGFzZXQuZXJyb3JtZXNzYWdlIHx8IGBUaGlzIGlzIG5vdCBhIHZhbGlkIGZpbGUgdHlwZS5gO1xyXG4gICAgICBlcnJvck1lc3NhZ2UuY2xhc3NMaXN0LmFkZChBQ0NFUFRFRF9GSUxFX01FU1NBR0VfQ0xBU1MpO1xyXG4gICAgICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5hZGQoSU5WQUxJRF9GSUxFX0NMQVNTKTtcclxuICAgICAgVFlQRV9JU19WQUxJRCA9IGZhbHNlO1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIDEuIHBhc3NlcyB0aHJvdWdoIGdhdGUgZm9yIHByZXZlbnRpbmcgaW52YWxpZCBmaWxlc1xyXG4gKiAyLiBoYW5kbGVzIHVwZGF0ZXMgaWYgZmlsZSBpcyB2YWxpZFxyXG4gKlxyXG4gKiBAcGFyYW0ge2V2ZW50fSBldmVudFxyXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gVGhlIGlucHV0IGVsZW1lbnQuXHJcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGluc3RydWN0aW9ucyAtIFRoZSBjb250YWluZXIgZm9yIHZpc2libGUgaW50ZXJhY3Rpb24gaW5zdHJ1Y3Rpb25zLlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBkcm9wVGFyZ2V0IC0gVGhlIGRyYWcgYW5kIGRyb3AgdGFyZ2V0IGFyZWEuXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVVcGxvYWQgPSAoZXZlbnQsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpID0+IHtcclxuICBwcmV2ZW50SW52YWxpZEZpbGVzKGV2ZW50LCBmaWxlSW5wdXRFbCwgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0KTtcclxuICBpZiAoVFlQRV9JU19WQUxJRCA9PT0gdHJ1ZSkge1xyXG4gICAgaGFuZGxlQ2hhbmdlKGV2ZW50LCBmaWxlSW5wdXRFbCwgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0KTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBmaWxlSW5wdXQgPSBiZWhhdmlvcihcclxuICB7fSxcclxuICB7XHJcbiAgICBpbml0KHJvb3QpIHtcclxuICAgICAgc2VsZWN0T3JNYXRjaGVzKERST1BaT05FLCByb290KS5mb3JFYWNoKChmaWxlSW5wdXRFbCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHsgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0IH0gPSBlbmhhbmNlRmlsZUlucHV0KGZpbGVJbnB1dEVsKTtcclxuXHJcbiAgICAgICAgZHJvcFRhcmdldC5hZGRFdmVudExpc3RlbmVyKFxyXG4gICAgICAgICAgXCJkcmFnb3ZlclwiLFxyXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlRHJhZ092ZXIoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChEUkFHX0NMQVNTKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGRyb3BUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcclxuICAgICAgICAgIFwiZHJhZ2xlYXZlXCIsXHJcbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVEcmFnTGVhdmUoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShEUkFHX0NMQVNTKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGRyb3BUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcclxuICAgICAgICAgIFwiZHJvcFwiLFxyXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlRHJvcCgpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKERSQUdfQ0xBU1MpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZmlsZUlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcclxuICAgICAgICAgIFwiY2hhbmdlXCIsXHJcbiAgICAgICAgICAoZSkgPT4gaGFuZGxlVXBsb2FkKGUsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpLFxyXG4gICAgICAgICAgZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICB0ZWFyZG93bihyb290KSB7XHJcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhJTlBVVCwgcm9vdCkuZm9yRWFjaCgoZmlsZUlucHV0RWwpID0+IHtcclxuICAgICAgICBjb25zdCBmaWxlSW5wdXRUb3BFbGVtZW50ID0gZmlsZUlucHV0RWwucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIGZpbGVJbnB1dFRvcEVsZW1lbnQucGFyZW50RWxlbWVudC5yZXBsYWNlQ2hpbGQoXHJcbiAgICAgICAgICBmaWxlSW5wdXRFbCxcclxuICAgICAgICAgIGZpbGVJbnB1dFRvcEVsZW1lbnRcclxuICAgICAgICApO1xyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxyXG4gICAgICAgIGZpbGVJbnB1dEVsLmNsYXNzTmFtZSA9IERST1BaT05FX0NMQVNTO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBnZXRGaWxlSW5wdXRDb250ZXh0LFxyXG4gICAgZGlzYWJsZSxcclxuICAgIGFyaWFEaXNhYmxlLFxyXG4gICAgZW5hYmxlLFxyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZmlsZUlucHV0O1xyXG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcclxuXHJcbmNvbnN0IFNDT1BFID0gYC4ke1BSRUZJWH0tZm9vdGVyLS1iaWdgO1xyXG5jb25zdCBOQVYgPSBgJHtTQ09QRX0gbmF2YDtcclxuY29uc3QgQlVUVE9OID0gYCR7TkFWfSAuJHtQUkVGSVh9LWZvb3Rlcl9fcHJpbWFyeS1saW5rYDtcclxuY29uc3QgSElERV9NQVhfV0lEVEggPSA0ODA7XHJcblxyXG4vKipcclxuICogRXhwYW5kcyBzZWxlY3RlZCBmb290ZXIgbWVudSBwYW5lbCwgd2hpbGUgY29sbGFwc2luZyBvdGhlcnNcclxuICovXHJcbmZ1bmN0aW9uIHNob3dQYW5lbCgpIHtcclxuICBpZiAod2luZG93LmlubmVyV2lkdGggPCBISURFX01BWF9XSURUSCkge1xyXG4gICAgY29uc3QgaXNPcGVuID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpID09PSBcInRydWVcIjtcclxuICAgIGNvbnN0IHRoaXNGb290ZXIgPSB0aGlzLmNsb3Nlc3QoU0NPUEUpO1xyXG5cclxuICAgIC8vIENsb3NlIGFsbCBvdGhlciBtZW51c1xyXG4gICAgdGhpc0Zvb3Rlci5xdWVyeVNlbGVjdG9yQWxsKEJVVFRPTikuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XHJcbiAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIGZhbHNlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCAhaXNPcGVuKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTd2FwcyB0aGUgPGg0PiBlbGVtZW50IGZvciBhIDxidXR0b24+IGVsZW1lbnQgKGFuZCB2aWNlLXZlcnNhKSBhbmQgc2V0cyBpZFxyXG4gKiBvZiBtZW51IGxpc3RcclxuICpcclxuICogQHBhcmFtIHtCb29sZWFufSBpc01vYmlsZSAtIElmIHRoZSBmb290ZXIgaXMgaW4gbW9iaWxlIGNvbmZpZ3VyYXRpb25cclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZUh0bWxUYWcoaXNNb2JpbGUpIHtcclxuICBjb25zdCBiaWdGb290ZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFNDT1BFKTtcclxuXHJcbiAgaWYgKCFiaWdGb290ZXIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHByaW1hcnlMaW5rcyA9IGJpZ0Zvb3Rlci5xdWVyeVNlbGVjdG9yQWxsKEJVVFRPTik7XHJcblxyXG4gIHByaW1hcnlMaW5rcy5mb3JFYWNoKChjdXJyZW50RWxlbWVudCkgPT4ge1xyXG4gICAgY29uc3QgY3VycmVudEVsZW1lbnRDbGFzc2VzID0gY3VycmVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIik7XHJcbiAgICBjb25zdCBwcmVzZXJ2ZWRIdG1sVGFnID1cclxuICAgICAgY3VycmVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS10YWdcIikgfHwgY3VycmVudEVsZW1lbnQudGFnTmFtZTtcclxuXHJcbiAgICBjb25zdCBuZXdFbGVtZW50VHlwZSA9IGlzTW9iaWxlID8gXCJidXR0b25cIiA6IHByZXNlcnZlZEh0bWxUYWc7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgY29uc3QgbmV3RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmV3RWxlbWVudFR5cGUpO1xyXG4gICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjdXJyZW50RWxlbWVudENsYXNzZXMpO1xyXG4gICAgbmV3RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFxyXG4gICAgICBgJHtQUkVGSVh9LWZvb3Rlcl9fcHJpbWFyeS1saW5rLS1idXR0b25gLFxyXG4gICAgICBpc01vYmlsZVxyXG4gICAgKTtcclxuICAgIG5ld0VsZW1lbnQudGV4dENvbnRlbnQgPSBjdXJyZW50RWxlbWVudC50ZXh0Q29udGVudDtcclxuXHJcbiAgICBpZiAoaXNNb2JpbGUpIHtcclxuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRhZ1wiLCBjdXJyZW50RWxlbWVudC50YWdOYW1lKTtcclxuICAgICAgY29uc3QgbWVudUlkID0gYCR7UFJFRklYfS1mb290ZXItbWVudS1saXN0LSR7TWF0aC5mbG9vcihcclxuICAgICAgICBNYXRoLnJhbmRvbSgpICogMTAwMDAwXHJcbiAgICAgICl9YDtcclxuXHJcbiAgICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBtZW51SWQpO1xyXG4gICAgICBuZXdFbGVtZW50LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgY3VycmVudEVsZW1lbnQubmV4dEVsZW1lbnRTaWJsaW5nLnNldEF0dHJpYnV0ZShcImlkXCIsIG1lbnVJZCk7XHJcbiAgICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbnNlcnQgdGhlIG5ldyBlbGVtZW50IGFuZCBkZWxldGUgdGhlIG9sZFxyXG4gICAgY3VycmVudEVsZW1lbnQuYWZ0ZXIobmV3RWxlbWVudCk7XHJcbiAgICBjdXJyZW50RWxlbWVudC5yZW1vdmUoKTtcclxuICB9KTtcclxufVxyXG5cclxuY29uc3QgcmVzaXplID0gKGV2ZW50KSA9PiB7XHJcbiAgdG9nZ2xlSHRtbFRhZyhldmVudC5tYXRjaGVzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3IoXHJcbiAge1xyXG4gICAgW0NMSUNLXToge1xyXG4gICAgICBbQlVUVE9OXTogc2hvd1BhbmVsLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHtcclxuICAgIC8vIGV4cG9ydCBmb3IgdXNlIGVsc2V3aGVyZVxyXG4gICAgSElERV9NQVhfV0lEVEgsXHJcblxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgdG9nZ2xlSHRtbFRhZyh3aW5kb3cuaW5uZXJXaWR0aCA8IEhJREVfTUFYX1dJRFRIKTtcclxuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdCA9IHdpbmRvdy5tYXRjaE1lZGlhKFxyXG4gICAgICAgIGAobWF4LXdpZHRoOiAke0hJREVfTUFYX1dJRFRIIC0gMC4xfXB4KWBcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdC5hZGRMaXN0ZW5lcihyZXNpemUpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZWFyZG93bigpIHtcclxuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdC5yZW1vdmVMaXN0ZW5lcihyZXNpemUpO1xyXG4gICAgfSxcclxuICB9XHJcbik7XHJcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XHJcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xyXG5jb25zdCB0b2dnbGUgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlXCIpO1xyXG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcclxuY29uc3QgYWNjb3JkaW9uID0gcmVxdWlyZShcIi4uLy4uL3VzYS1hY2NvcmRpb24vc3JjL2luZGV4XCIpO1xyXG5jb25zdCBTY3JvbGxCYXJXaWR0aCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zY3JvbGxiYXItd2lkdGhcIik7XHJcblxyXG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xyXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xyXG5cclxuY29uc3QgQk9EWSA9IFwiYm9keVwiO1xyXG5jb25zdCBIRUFERVIgPSBgLiR7UFJFRklYfS1oZWFkZXJgO1xyXG5jb25zdCBOQVYgPSBgLiR7UFJFRklYfS1uYXZgO1xyXG5jb25zdCBOQVZfQ09OVEFJTkVSID0gYC4ke1BSRUZJWH0tbmF2LWNvbnRhaW5lcmA7XHJcbmNvbnN0IE5BVl9QUklNQVJZID0gYC4ke1BSRUZJWH0tbmF2X19wcmltYXJ5YDtcclxuY29uc3QgTkFWX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LW5hdl9fcHJpbWFyeS1pdGVtYDtcclxuY29uc3QgTkFWX0NPTlRST0wgPSBgYnV0dG9uLiR7UFJFRklYfS1uYXZfX2xpbmtgO1xyXG5jb25zdCBOQVZfTElOS1MgPSBgJHtOQVZ9IGFgO1xyXG5jb25zdCBOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUgPSBgZGF0YS1uYXYtaGlkZGVuYDtcclxuY29uc3QgT1BFTkVSUyA9IGAuJHtQUkVGSVh9LW1lbnUtYnRuYDtcclxuY29uc3QgQ0xPU0VfQlVUVE9OID0gYC4ke1BSRUZJWH0tbmF2X19jbG9zZWA7XHJcbmNvbnN0IE9WRVJMQVkgPSBgLiR7UFJFRklYfS1vdmVybGF5YDtcclxuY29uc3QgQ0xPU0VSUyA9IGAke0NMT1NFX0JVVFRPTn0sIC4ke1BSRUZJWH0tb3ZlcmxheWA7XHJcbmNvbnN0IFRPR0dMRVMgPSBbTkFWLCBPVkVSTEFZXS5qb2luKFwiLCBcIik7XHJcbmNvbnN0IE5PTl9OQVZfRUxFTUVOVFMgPSBgYm9keSAqOm5vdCgke0hFQURFUn0sICR7TkFWX0NPTlRBSU5FUn0sICR7TkFWfSwgJHtOQVZ9ICopOm5vdChbYXJpYS1oaWRkZW5dKWA7XHJcbmNvbnN0IE5PTl9OQVZfSElEREVOID0gYFske05PTl9OQVZfSElEREVOX0FUVFJJQlVURX1dYDtcclxuXHJcbmNvbnN0IEFDVElWRV9DTEFTUyA9IFwidXNhLWpzLW1vYmlsZS1uYXYtLWFjdGl2ZVwiO1xyXG5jb25zdCBWSVNJQkxFX0NMQVNTID0gXCJpcy12aXNpYmxlXCI7XHJcblxyXG5sZXQgbmF2aWdhdGlvbjtcclxubGV0IG5hdkFjdGl2ZTtcclxubGV0IG5vbk5hdkVsZW1lbnRzO1xyXG5cclxuY29uc3QgaXNBY3RpdmUgPSAoKSA9PiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhBQ1RJVkVfQ0xBU1MpO1xyXG4vLyBEZXRlY3QgU2FmYXJpXHJcbi8vIE5vdGU6IENocm9tZSBhbHNvIHJlcG9ydHMgdGhlIFNhZmFyaSB1c2VyQWdlbnQgc28gdGhpcyBzcGVjaWZpY2FsbHkgZXhjbHVkZXMgQ2hyb21lLlxyXG5jb25zdCBpc1NhZmFyaSA9XHJcbiAgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmNsdWRlcyhcIlNhZmFyaVwiKSAmJlxyXG4gICFuYXZpZ2F0b3IudXNlckFnZW50LmluY2x1ZGVzKFwiQ2hyb21lXCIpO1xyXG5jb25zdCBTQ1JPTExCQVJfV0lEVEggPSBTY3JvbGxCYXJXaWR0aCgpO1xyXG5jb25zdCBJTklUSUFMX1BBRERJTkcgPSB3aW5kb3dcclxuICAuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KVxyXG4gIC5nZXRQcm9wZXJ0eVZhbHVlKFwicGFkZGluZy1yaWdodFwiKTtcclxuY29uc3QgVEVNUE9SQVJZX1BBRERJTkcgPSBgJHtcclxuICBwYXJzZUludChJTklUSUFMX1BBRERJTkcucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApICtcclxuICBwYXJzZUludChTQ1JPTExCQVJfV0lEVEgucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApXHJcbn1weGA7XHJcblxyXG5jb25zdCBoaWRlTm9uTmF2SXRlbXMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVhZGVyUGFyZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgJHtIRUFERVJ9YCkucGFyZW50Tm9kZTtcclxuICBub25OYXZFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX05BVl9FTEVNRU5UUyk7XHJcblxyXG4gIG5vbk5hdkVsZW1lbnRzLmZvckVhY2goKG5vbk5hdkVsZW1lbnQpID0+IHtcclxuICAgIGlmIChub25OYXZFbGVtZW50ICE9PSBoZWFkZXJQYXJlbnQpIHtcclxuICAgICAgbm9uTmF2RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCB0cnVlKTtcclxuICAgICAgbm9uTmF2RWxlbWVudC5zZXRBdHRyaWJ1dGUoTk9OX05BVl9ISURERU5fQVRUUklCVVRFLCBcIlwiKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbmNvbnN0IHNob3dOb25OYXZJdGVtcyA9ICgpID0+IHtcclxuICBub25OYXZFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX05BVl9ISURERU4pO1xyXG5cclxuICBpZiAoIW5vbk5hdkVsZW1lbnRzKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBSZW1vdmUgYXJpYS1oaWRkZW4gZnJvbSBub24taGVhZGVyIGVsZW1lbnRzXHJcbiAgbm9uTmF2RWxlbWVudHMuZm9yRWFjaCgobm9uTmF2RWxlbWVudCkgPT4ge1xyXG4gICAgbm9uTmF2RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiKTtcclxuICAgIG5vbk5hdkVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKE5PTl9OQVZfSElEREVOX0FUVFJJQlVURSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vLyBUb2dnbGUgYWxsIG5vbi1oZWFkZXIgZWxlbWVudHMgIzM1MjcuXHJcbmNvbnN0IHRvZ2dsZU5vbk5hdkl0ZW1zID0gKGFjdGl2ZSkgPT4ge1xyXG4gIGlmIChhY3RpdmUpIHtcclxuICAgIGhpZGVOb25OYXZJdGVtcygpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzaG93Tm9uTmF2SXRlbXMoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0ZWN0IFNhZmFyaSBhbmQgYWRkIGJvZHkgY2xhc3MgZm9yIGEgU2FmYXJpLW9ubHkgQ1NTIGJ1ZyBmaXguXHJcbiAqIE1vcmUgZGV0YWlscyBpbiBodHRwczovL2dpdGh1Yi5jb20vdXN3ZHMvdXN3ZHMvcHVsbC81NDQzXHJcbiAqL1xyXG5jb25zdCBhZGRTYWZhcmlDbGFzcyA9ICgpID0+IHtcclxuICBpZiAoaXNTYWZhcmkpIHtcclxuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChcImlzLXNhZmFyaVwiKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSB2YWx1ZSBmb3IgdGhlIC0tc2Nyb2xsdG9wIENTUyB2YXIgd2hlbiB0aGUgbW9iaWxlIG1lbnUgaXMgb3Blbi5cclxuICogVGhpcyBhbGxvd3MgdGhlIENTUyB0byBsb2NrIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBpbiBTYWZhcmlcclxuICogd2hlbiBvdmVyZmxvdy15IGlzIHNldCB0byBzY3JvbGwuXHJcbiAqIE1vcmUgZGV0YWlscyBpbiBodHRwczovL2dpdGh1Yi5jb20vdXN3ZHMvdXN3ZHMvcHVsbC81NDQzXHJcbiAqL1xyXG5jb25zdCBzZXRTYWZhcmlTY3JvbGxQb3NpdGlvbiA9IChib2R5KSA9PiB7XHJcbiAgY29uc3QgY3VycmVudFNjcm9sbFBvc2l0aW9uID0gYC0ke3dpbmRvdy5zY3JvbGxZfXB4YDtcclxuICBpZiAoaXNTYWZhcmkpIHtcclxuICAgIGJvZHkuc3R5bGUuc2V0UHJvcGVydHkoXCItLXNjcm9sbHRvcFwiLCBjdXJyZW50U2Nyb2xsUG9zaXRpb24pO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IHRvZ2dsZU5hdiA9IChhY3RpdmUpID0+IHtcclxuICBjb25zdCB7IGJvZHkgfSA9IGRvY3VtZW50O1xyXG4gIGNvbnN0IHNhZmVBY3RpdmUgPSB0eXBlb2YgYWN0aXZlID09PSBcImJvb2xlYW5cIiA/IGFjdGl2ZSA6ICFpc0FjdGl2ZSgpO1xyXG5cclxuICBzZXRTYWZhcmlTY3JvbGxQb3NpdGlvbihib2R5KTtcclxuXHJcbiAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKEFDVElWRV9DTEFTUywgc2FmZUFjdGl2ZSk7XHJcblxyXG4gIHNlbGVjdChUT0dHTEVTKS5mb3JFYWNoKChlbCkgPT5cclxuICAgIGVsLmNsYXNzTGlzdC50b2dnbGUoVklTSUJMRV9DTEFTUywgc2FmZUFjdGl2ZSlcclxuICApO1xyXG5cclxuICBuYXZpZ2F0aW9uLmZvY3VzVHJhcC51cGRhdGUoc2FmZUFjdGl2ZSk7XHJcblxyXG4gIGNvbnN0IGNsb3NlQnV0dG9uID0gYm9keS5xdWVyeVNlbGVjdG9yKENMT1NFX0JVVFRPTik7XHJcbiAgY29uc3QgbWVudUJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoT1BFTkVSUyk7XHJcblxyXG4gIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID1cclxuICAgIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID09PSBURU1QT1JBUllfUEFERElOR1xyXG4gICAgICA/IElOSVRJQUxfUEFERElOR1xyXG4gICAgICA6IFRFTVBPUkFSWV9QQURESU5HO1xyXG5cclxuICB0b2dnbGVOb25OYXZJdGVtcyhzYWZlQWN0aXZlKTtcclxuXHJcbiAgaWYgKHNhZmVBY3RpdmUgJiYgY2xvc2VCdXR0b24pIHtcclxuICAgIC8vIFRoZSBtb2JpbGUgbmF2IHdhcyBqdXN0IGFjdGl2YXRlZC4gRm9jdXMgb24gdGhlIGNsb3NlIGJ1dHRvbiwgd2hpY2ggaXNcclxuICAgIC8vIGp1c3QgYmVmb3JlIGFsbCB0aGUgbmF2IGVsZW1lbnRzIGluIHRoZSB0YWIgb3JkZXIuXHJcbiAgICBjbG9zZUJ1dHRvbi5mb2N1cygpO1xyXG4gIH0gZWxzZSBpZiAoXHJcbiAgICAhc2FmZUFjdGl2ZSAmJlxyXG4gICAgbWVudUJ1dHRvbiAmJlxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZShtZW51QnV0dG9uKS5kaXNwbGF5ICE9PSBcIm5vbmVcIlxyXG4gICkge1xyXG4gICAgLy8gVGhlIG1vYmlsZSBuYXYgd2FzIGp1c3QgZGVhY3RpdmF0ZWQuIFdlIGRvbid0IHdhbnQgdGhlIGZvY3VzIHRvXHJcbiAgICAvLyBkaXNhcHBlYXIgaW50byB0aGUgdm9pZCwgc28gZm9jdXMgb24gdGhlIG1lbnUgYnV0dG9uIGlmIGl0J3NcclxuICAgIC8vIHZpc2libGUgKHRoaXMgbWF5IGhhdmUgYmVlbiB3aGF0IHRoZSB1c2VyIHdhcyBqdXN0IGZvY3VzZWQgb24sXHJcbiAgICAvLyBpZiB0aGV5IHRyaWdnZXJlZCB0aGUgbW9iaWxlIG5hdiBieSBtaXN0YWtlKS5cclxuICAgIG1lbnVCdXR0b24uZm9jdXMoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzYWZlQWN0aXZlO1xyXG59O1xyXG5cclxuY29uc3QgcmVzaXplID0gKCkgPT4ge1xyXG4gIGNvbnN0IGNsb3NlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xyXG5cclxuICBpZiAoaXNBY3RpdmUoKSAmJiBjbG9zZXIgJiYgY2xvc2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoID09PSAwKSB7XHJcbiAgICAvLyBXaGVuIHRoZSBtb2JpbGUgbmF2IGlzIGFjdGl2ZSwgYW5kIHRoZSBjbG9zZSBib3ggaXNuJ3QgdmlzaWJsZSxcclxuICAgIC8vIHdlIGtub3cgdGhlIHVzZXIncyB2aWV3cG9ydCBoYXMgYmVlbiByZXNpemVkIHRvIGJlIGxhcmdlci5cclxuICAgIC8vIExldCdzIG1ha2UgdGhlIHBhZ2Ugc3RhdGUgY29uc2lzdGVudCBieSBkZWFjdGl2YXRpbmcgdGhlIG1vYmlsZSBuYXYuXHJcbiAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKGNsb3NlciwgZmFsc2UpO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IG9uTWVudUNsb3NlID0gKCkgPT4gbmF2aWdhdGlvbi50b2dnbGVOYXYuY2FsbChuYXZpZ2F0aW9uLCBmYWxzZSk7XHJcblxyXG5jb25zdCBoaWRlQWN0aXZlTmF2RHJvcGRvd24gPSAoKSA9PiB7XHJcbiAgaWYgKCFuYXZBY3RpdmUpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRvZ2dsZShuYXZBY3RpdmUsIGZhbHNlKTtcclxuICBuYXZBY3RpdmUgPSBudWxsO1xyXG59O1xyXG5cclxuY29uc3QgZm9jdXNOYXZCdXR0b24gPSAoZXZlbnQpID0+IHtcclxuICBjb25zdCBwYXJlbnROYXZJdGVtID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTkFWX1BSSU1BUllfSVRFTSk7XHJcblxyXG4gIC8vIE9ubHkgc2hpZnQgZm9jdXMgaWYgd2l0aGluIGRyb3Bkb3duXHJcbiAgaWYgKCFldmVudC50YXJnZXQubWF0Y2hlcyhOQVZfQ09OVFJPTCkpIHtcclxuICAgIGNvbnN0IG5hdkNvbnRyb2wgPSBwYXJlbnROYXZJdGVtLnF1ZXJ5U2VsZWN0b3IoTkFWX0NPTlRST0wpO1xyXG4gICAgaWYgKG5hdkNvbnRyb2wpIHtcclxuICAgICAgbmF2Q29udHJvbC5mb2N1cygpO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IGhhbmRsZUVzY2FwZSA9IChldmVudCkgPT4ge1xyXG4gIGhpZGVBY3RpdmVOYXZEcm9wZG93bigpO1xyXG4gIGZvY3VzTmF2QnV0dG9uKGV2ZW50KTtcclxufTtcclxuXHJcbm5hdmlnYXRpb24gPSBiZWhhdmlvcihcclxuICB7XHJcbiAgICBbQ0xJQ0tdOiB7XHJcbiAgICAgIFtOQVZfQ09OVFJPTF0oKSB7XHJcbiAgICAgICAgLy8gSWYgYW5vdGhlciBuYXYgaXMgb3BlbiwgY2xvc2UgaXRcclxuICAgICAgICBpZiAobmF2QWN0aXZlICE9PSB0aGlzKSB7XHJcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgY2xpY2tlZCBuYXYgbGluayBlbGVtZW50LCBzbyB3ZVxyXG4gICAgICAgIC8vIGNhbiBoaWRlIHRoZSBkcm9wZG93biBpZiBhbm90aGVyIGVsZW1lbnQgb24gdGhlIHBhZ2UgaXMgY2xpY2tlZFxyXG4gICAgICAgIGlmICghbmF2QWN0aXZlKSB7XHJcbiAgICAgICAgICBuYXZBY3RpdmUgPSB0aGlzO1xyXG4gICAgICAgICAgdG9nZ2xlKG5hdkFjdGl2ZSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEbyB0aGlzIHNvIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSBib2R5IGRvZXNuJ3QgZmlyZVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgW0JPRFldOiBoaWRlQWN0aXZlTmF2RHJvcGRvd24sXHJcbiAgICAgIFtPUEVORVJTXTogdG9nZ2xlTmF2LFxyXG4gICAgICBbQ0xPU0VSU106IHRvZ2dsZU5hdixcclxuICAgICAgW05BVl9MSU5LU10oKSB7XHJcbiAgICAgICAgLy8gQSBuYXZpZ2F0aW9uIGxpbmsgaGFzIGJlZW4gY2xpY2tlZCEgV2Ugd2FudCB0byBjb2xsYXBzZSBhbnlcclxuICAgICAgICAvLyBoaWVyYXJjaGljYWwgbmF2aWdhdGlvbiBVSSBpdCdzIGEgcGFydCBvZiwgc28gdGhhdCB0aGUgdXNlclxyXG4gICAgICAgIC8vIGNhbiBmb2N1cyBvbiB3aGF0ZXZlciB0aGV5J3ZlIGp1c3Qgc2VsZWN0ZWQuXHJcblxyXG4gICAgICAgIC8vIFNvbWUgbmF2aWdhdGlvbiBsaW5rcyBhcmUgaW5zaWRlIGFjY29yZGlvbnM7IHdoZW4gdGhleSdyZVxyXG4gICAgICAgIC8vIGNsaWNrZWQsIHdlIHdhbnQgdG8gY29sbGFwc2UgdGhvc2UgYWNjb3JkaW9ucy5cclxuICAgICAgICBjb25zdCBhY2MgPSB0aGlzLmNsb3Nlc3QoYWNjb3JkaW9uLkFDQ09SRElPTik7XHJcblxyXG4gICAgICAgIGlmIChhY2MpIHtcclxuICAgICAgICAgIGFjY29yZGlvbi5nZXRCdXR0b25zKGFjYykuZm9yRWFjaCgoYnRuKSA9PiBhY2NvcmRpb24uaGlkZShidG4pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBtb2JpbGUgbmF2aWdhdGlvbiBtZW51IGlzIGFjdGl2ZSwgd2Ugd2FudCB0byBoaWRlIGl0LlxyXG4gICAgICAgIGlmIChpc0FjdGl2ZSgpKSB7XHJcbiAgICAgICAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAga2V5ZG93bjoge1xyXG4gICAgICBbTkFWX1BSSU1BUlldOiBrZXltYXAoeyBFc2NhcGU6IGhhbmRsZUVzY2FwZSB9KSxcclxuICAgIH0sXHJcbiAgICBmb2N1c291dDoge1xyXG4gICAgICBbTkFWX1BSSU1BUlldKGV2ZW50KSB7XHJcbiAgICAgICAgY29uc3QgbmF2ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTkFWX1BSSU1BUlkpO1xyXG5cclxuICAgICAgICBpZiAoIW5hdi5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xyXG4gICAgICAgICAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHtcclxuICAgIGluaXQocm9vdCkge1xyXG4gICAgICBjb25zdCB0cmFwQ29udGFpbmVyID0gcm9vdC5tYXRjaGVzKE5BVikgPyByb290IDogcm9vdC5xdWVyeVNlbGVjdG9yKE5BVik7XHJcblxyXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xyXG4gICAgICAgIG5hdmlnYXRpb24uZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRyYXBDb250YWluZXIsIHtcclxuICAgICAgICAgIEVzY2FwZTogb25NZW51Q2xvc2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFkZFNhZmFyaUNsYXNzKCk7XHJcbiAgICAgIHJlc2l6ZSgpO1xyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCByZXNpemUsIGZhbHNlKTtcclxuICAgIH0sXHJcbiAgICB0ZWFyZG93bigpIHtcclxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVzaXplLCBmYWxzZSk7XHJcbiAgICAgIG5hdkFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVHJhcDogbnVsbCxcclxuICAgIHRvZ2dsZU5hdixcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5hdmlnYXRpb247XHJcbiIsImNvbnN0IG9uY2UgPSByZXF1aXJlKFwicmVjZXB0b3Ivb25jZVwiKTtcclxuY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcclxuY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcclxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcclxuY29uc3QgU2FuaXRpemVyID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplclwiKTtcclxuXHJcbmNvbnN0IENVUlJFTlRfQ0xBU1MgPSBgJHtQUkVGSVh9LWN1cnJlbnRgO1xyXG5jb25zdCBJTl9QQUdFX05BVl9USVRMRV9URVhUID0gXCJPbiB0aGlzIHBhZ2VcIjtcclxuY29uc3QgSU5fUEFHRV9OQVZfVElUTEVfSEVBRElOR19MRVZFTCA9IFwiaDRcIjtcclxuY29uc3QgSU5fUEFHRV9OQVZfU0NST0xMX09GRlNFVCA9IDA7XHJcbmNvbnN0IElOX1BBR0VfTkFWX1JPT1RfTUFSR0lOID0gXCIwcHggMHB4IDBweCAwcHhcIjtcclxuY29uc3QgSU5fUEFHRV9OQVZfVEhSRVNIT0xEID0gXCIxXCI7XHJcbmNvbnN0IElOX1BBR0VfTkFWX0NMQVNTID0gYCR7UFJFRklYfS1pbi1wYWdlLW5hdmA7XHJcbmNvbnN0IElOX1BBR0VfTkFWX0FOQ0hPUl9DTEFTUyA9IGAke1BSRUZJWH0tYW5jaG9yYDtcclxuY29uc3QgSU5fUEFHRV9OQVZfTkFWX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19uYXZgO1xyXG5jb25zdCBJTl9QQUdFX05BVl9MSVNUX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19saXN0YDtcclxuY29uc3QgSU5fUEFHRV9OQVZfSVRFTV9DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0NMQVNTfV9faXRlbWA7XHJcbmNvbnN0IElOX1BBR0VfTkFWX0xJTktfQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX2xpbmtgO1xyXG5jb25zdCBJTl9QQUdFX05BVl9USVRMRV9DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0NMQVNTfV9faGVhZGluZ2A7XHJcbmNvbnN0IFNVQl9JVEVNX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfSVRFTV9DTEFTU30tLXN1Yi1pdGVtYDtcclxuY29uc3QgTUFJTl9FTEVNRU5UID0gXCJtYWluXCI7XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBhY3RpdmUgbGluayBzdGF0ZSBmb3IgdGhlIGN1cnJlbnRseSBvYnNlcnZlZCBzZWN0aW9uXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBpbi1wYWdlIG5hdiBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IHNldEFjdGl2ZSA9IChlbCkgPT4ge1xyXG4gIGNvbnN0IGFsbExpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7SU5fUEFHRV9OQVZfTElOS19DTEFTU31gKTtcclxuICBlbC5tYXAoKGkpID0+IHtcclxuICAgIGlmIChpLmlzSW50ZXJzZWN0aW5nID09PSB0cnVlICYmIGkuaW50ZXJzZWN0aW9uUmF0aW8gPj0gMSkge1xyXG4gICAgICBhbGxMaW5rcy5mb3JFYWNoKChsaW5rKSA9PiBsaW5rLmNsYXNzTGlzdC5yZW1vdmUoQ1VSUkVOVF9DTEFTUykpO1xyXG4gICAgICBkb2N1bWVudFxyXG4gICAgICAgIC5xdWVyeVNlbGVjdG9yKGBhW2hyZWY9XCIjJHtpLnRhcmdldC5pZH1cIl1gKVxyXG4gICAgICAgIC5jbGFzc0xpc3QuYWRkKENVUlJFTlRfQ0xBU1MpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYW4gYXJyYXkgb2YgYWxsIHZpc2libGUgaDIgYW5kIGgzIGhlYWRpbmdzIGZyb20gdGhlIGRlc2lnbmF0ZWQgbWFpbiBjb250ZW50IHJlZ2lvbi5cclxuICogVGhlc2Ugd2lsbCBiZSBhZGRlZCB0byB0aGUgY29tcG9uZW50IGxpbmsgbGlzdC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbWFpbkNvbnRlbnRTZWxlY3RvciBUaGUgZGVzaWduYXRlZCBtYWluIGNvbnRlbnQgcmVnaW9uXHJcbiAqXHJcbiAqIEByZXR1cm4ge0FycmF5fSAtIEFuIGFycmF5IG9mIHZpc2libGUgaGVhZGluZ3MgZnJvbSB0aGUgZGVzaWduYXRlZCBjb250ZW50IHJlZ2lvblxyXG4gKi9cclxuY29uc3QgZ2V0U2VjdGlvbkhlYWRpbmdzID0gKG1haW5Db250ZW50U2VsZWN0b3IpID0+IHtcclxuICBjb25zdCBzZWN0aW9uSGVhZGluZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxyXG4gICAgYCR7bWFpbkNvbnRlbnRTZWxlY3Rvcn0gaDIsICR7bWFpbkNvbnRlbnRTZWxlY3Rvcn0gaDNgXHJcbiAgKTtcclxuXHJcbiAgLy8gQ29udmVydCBub2RlTGlzdCB0byBhbiBhcnJheSB0byBhbGxvdyBmb3IgZmlsdGVyaW5nXHJcbiAgY29uc3QgaGVhZGluZ0FycmF5ID0gQXJyYXkuZnJvbShzZWN0aW9uSGVhZGluZ3MpO1xyXG5cclxuICAvLyBGaW5kIGFsbCBoZWFkaW5ncyB3aXRoIGhpZGRlbiBzdHlsaW5nIGFuZCByZW1vdmUgdGhlbSBmcm9tIHRoZSBhcnJheVxyXG4gIGNvbnN0IHZpc2libGVIZWFkaW5nQXJyYXkgPSBoZWFkaW5nQXJyYXkuZmlsdGVyKChoZWFkaW5nKSA9PiB7XHJcbiAgICBjb25zdCBoZWFkaW5nU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShoZWFkaW5nKTtcclxuICAgIGNvbnN0IHZpc2libGVIZWFkaW5nID1cclxuICAgICAgaGVhZGluZ1N0eWxlLmdldFByb3BlcnR5VmFsdWUoXCJkaXNwbGF5XCIpICE9PSBcIm5vbmVcIiAmJlxyXG4gICAgICBoZWFkaW5nU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShcInZpc2liaWxpdHlcIikgIT09IFwiaGlkZGVuXCI7XHJcblxyXG4gICAgcmV0dXJuIHZpc2libGVIZWFkaW5nO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdmlzaWJsZUhlYWRpbmdBcnJheTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYSBub2RlIGxpc3Qgb2Ygc2VjdGlvbiBhbmNob3IgdGFnc1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudFtdfSAtIEFuIGFycmF5IG9mIERPTSBub2Rlc1xyXG4gKi9cclxuY29uc3QgZ2V0U2VjdGlvbkFuY2hvcnMgPSAoKSA9PiB7XHJcbiAgY29uc3Qgc2VjdGlvbkFuY2hvcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxyXG4gICAgYC4ke0lOX1BBR0VfTkFWX0FOQ0hPUl9DTEFTU31gXHJcbiAgKTtcclxuICByZXR1cm4gc2VjdGlvbkFuY2hvcnM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGEgdW5pcXVlIElEIGZvciB0aGUgZ2l2ZW4gaGVhZGluZyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxIZWFkaW5nRWxlbWVudH0gaGVhZGluZ1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gVW5pcXVlIElEXHJcbiAqL1xyXG5jb25zdCBnZXRIZWFkaW5nSWQgPSAoaGVhZGluZykgPT4ge1xyXG4gIGNvbnN0IGJhc2VJZCA9IGhlYWRpbmcudGV4dENvbnRlbnRcclxuICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAvLyBSZXBsYWNlIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVycyB3aXRoIGRhc2hlc1xyXG4gICAgLnJlcGxhY2UoL1teYS16XFxkXS9nLCBcIi1cIilcclxuICAgIC8vIFJlcGxhY2UgYSBzZXF1ZW5jZSBvZiB0d28gb3IgbW9yZSBkYXNoZXMgd2l0aCBhIHNpbmdsZSBkYXNoXHJcbiAgICAucmVwbGFjZSgvLXsyLH0vZywgXCItXCIpXHJcbiAgICAvLyBUcmltIGxlYWRpbmcgb3IgdHJhaWxpbmcgZGFzaCAodGhlcmUgc2hvdWxkIG9ubHkgZXZlciBiZSBvbmUpXHJcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XHJcblxyXG4gIGxldCBpZDtcclxuICBsZXQgc3VmZml4ID0gMDtcclxuICBkbyB7XHJcbiAgICBpZCA9IGJhc2VJZDtcclxuXHJcbiAgICAvLyBUbyBhdm9pZCBjb25mbGljdHMgd2l0aCBleGlzdGluZyBJRHMgb24gdGhlIHBhZ2UsIGxvb3AgYW5kIGFwcGVuZCBhblxyXG4gICAgLy8gaW5jcmVtZW50ZWQgc3VmZml4IHVudGlsIGEgdW5pcXVlIElEIGlzIGZvdW5kLlxyXG4gICAgc3VmZml4ICs9IDE7XHJcbiAgICBpZiAoc3VmZml4ID4gMSkge1xyXG4gICAgICBpZCArPSBgLSR7c3VmZml4fWA7XHJcbiAgICB9XHJcbiAgfSB3aGlsZSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKTtcclxuXHJcbiAgcmV0dXJuIGlkO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhIHNlY3Rpb24gaWQvYW5jaG9yIGhhc2ggd2l0aG91dCB0aGUgbnVtYmVyIHNpZ25cclxuICpcclxuICogQHJldHVybiB7U3RyaW5nfSAtIElkIHZhbHVlIHdpdGggdGhlIG51bWJlciBzaWduIHJlbW92ZWRcclxuICovXHJcbmNvbnN0IGdldFNlY3Rpb25JZCA9ICh2YWx1ZSkgPT4ge1xyXG4gIGxldCBpZDtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgdmFsdWUgaXMgYW4gZXZlbnQgb3IgZWxlbWVudCBhbmQgZ2V0IHRoZSBjbGVhbmVkIHVwIGlkXHJcbiAgaWYgKHZhbHVlICYmIHZhbHVlLm5vZGVUeXBlID09PSAxKSB7XHJcbiAgICBpZCA9IHZhbHVlLmdldEF0dHJpYnV0ZShcImhyZWZcIikucmVwbGFjZShcIiNcIiwgXCJcIik7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlkID0gdmFsdWUudGFyZ2V0Lmhhc2gucmVwbGFjZShcIiNcIiwgXCJcIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaWQ7XHJcbn07XHJcblxyXG4vKipcclxuICogU2Nyb2xsIHNtb290aGx5IHRvIGEgc2VjdGlvbiBiYXNlZCBvbiB0aGUgcGFzc2VkIGluIGVsZW1lbnRcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gLSBJZCB2YWx1ZSB3aXRoIHRoZSBudW1iZXIgc2lnbiByZW1vdmVkXHJcbiAqL1xyXG5jb25zdCBoYW5kbGVTY3JvbGxUb1NlY3Rpb24gPSAoZWwpID0+IHtcclxuICBjb25zdCBpblBhZ2VOYXZFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke0lOX1BBR0VfTkFWX0NMQVNTfWApO1xyXG4gIGNvbnN0IGluUGFnZU5hdlNjcm9sbE9mZnNldCA9XHJcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnNjcm9sbE9mZnNldCB8fCBJTl9QQUdFX05BVl9TQ1JPTExfT0ZGU0VUO1xyXG5cclxuICB3aW5kb3cuc2Nyb2xsKHtcclxuICAgIGJlaGF2aW9yOiBcInNtb290aFwiLFxyXG4gICAgdG9wOiBlbC5vZmZzZXRUb3AgLSBpblBhZ2VOYXZTY3JvbGxPZmZzZXQsXHJcbiAgICBibG9jazogXCJzdGFydFwiLFxyXG4gIH0pO1xyXG5cclxuICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSkgIT09IGVsLmlkKSB7XHJcbiAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgXCJcIiwgYCMke2VsLmlkfWApO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTY3JvbGxzIHRoZSBwYWdlIHRvIHRoZSBzZWN0aW9uIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGN1cnJlbnQgaGFzaCBmcmFnbWVudCwgaWYgb25lIGV4aXN0cy5cclxuICovXHJcbmNvbnN0IHNjcm9sbFRvQ3VycmVudFNlY3Rpb24gPSAoKSA9PiB7XHJcbiAgY29uc3QgaGFzaEZyYWdtZW50ID0gd2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSk7XHJcbiAgaWYgKGhhc2hGcmFnbWVudCkge1xyXG4gICAgY29uc3QgYW5jaG9yVGFnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaGFzaEZyYWdtZW50KTtcclxuICAgIGlmIChhbmNob3JUYWcpIHtcclxuICAgICAgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uKGFuY2hvclRhZyk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSB0aGUgaW4tcGFnZSBuYXZpZ2F0aW9uIGNvbXBvbmVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpblBhZ2VOYXZFbCBUaGUgaW4tcGFnZSBuYXYgZWxlbWVudFxyXG4gKi9cclxuY29uc3QgY3JlYXRlSW5QYWdlTmF2ID0gKGluUGFnZU5hdkVsKSA9PiB7XHJcbiAgY29uc3QgaW5QYWdlTmF2VGl0bGVUZXh0ID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcclxuICAgIGluUGFnZU5hdkVsLmRhdGFzZXQudGl0bGVUZXh0IHx8IElOX1BBR0VfTkFWX1RJVExFX1RFWFRcclxuICB9YDtcclxuICBjb25zdCBpblBhZ2VOYXZUaXRsZUhlYWRpbmdMZXZlbCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XHJcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnRpdGxlSGVhZGluZ0xldmVsIHx8IElOX1BBR0VfTkFWX1RJVExFX0hFQURJTkdfTEVWRUxcclxuICB9YDtcclxuICBjb25zdCBpblBhZ2VOYXZSb290TWFyZ2luID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcclxuICAgIGluUGFnZU5hdkVsLmRhdGFzZXQucm9vdE1hcmdpbiB8fCBJTl9QQUdFX05BVl9ST09UX01BUkdJTlxyXG4gIH1gO1xyXG4gIGNvbnN0IGluUGFnZU5hdlRocmVzaG9sZCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XHJcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnRocmVzaG9sZCB8fCBJTl9QQUdFX05BVl9USFJFU0hPTERcclxuICB9YDtcclxuICBjb25zdCBpblBhZ2VOYXZDb250ZW50U2VsZWN0b3IgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke1xyXG4gICAgaW5QYWdlTmF2RWwuZGF0YXNldC5tYWluQ29udGVudFNlbGVjdG9yIHx8IE1BSU5fRUxFTUVOVFxyXG4gIH1gO1xyXG5cclxuICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgcm9vdDogbnVsbCxcclxuICAgIHJvb3RNYXJnaW46IGluUGFnZU5hdlJvb3RNYXJnaW4sXHJcbiAgICB0aHJlc2hvbGQ6IFtpblBhZ2VOYXZUaHJlc2hvbGRdLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNlY3Rpb25IZWFkaW5ncyA9IGdldFNlY3Rpb25IZWFkaW5ncyhpblBhZ2VOYXZDb250ZW50U2VsZWN0b3IpO1xyXG4gIGNvbnN0IGluUGFnZU5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJuYXZcIik7XHJcbiAgaW5QYWdlTmF2LnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgaW5QYWdlTmF2VGl0bGVUZXh0KTtcclxuICBpblBhZ2VOYXYuY2xhc3NMaXN0LmFkZChJTl9QQUdFX05BVl9OQVZfQ0xBU1MpO1xyXG5cclxuICBjb25zdCBpblBhZ2VOYXZUaXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaW5QYWdlTmF2VGl0bGVIZWFkaW5nTGV2ZWwpO1xyXG4gIGluUGFnZU5hdlRpdGxlLmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfVElUTEVfQ0xBU1MpO1xyXG4gIGluUGFnZU5hdlRpdGxlLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcclxuICBpblBhZ2VOYXZUaXRsZS50ZXh0Q29udGVudCA9IGluUGFnZU5hdlRpdGxlVGV4dDtcclxuICBpblBhZ2VOYXYuYXBwZW5kQ2hpbGQoaW5QYWdlTmF2VGl0bGUpO1xyXG5cclxuICBjb25zdCBpblBhZ2VOYXZMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xyXG4gIGluUGFnZU5hdkxpc3QuY2xhc3NMaXN0LmFkZChJTl9QQUdFX05BVl9MSVNUX0NMQVNTKTtcclxuICBpblBhZ2VOYXYuYXBwZW5kQ2hpbGQoaW5QYWdlTmF2TGlzdCk7XHJcblxyXG4gIHNlY3Rpb25IZWFkaW5ncy5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgY29uc3QgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICBjb25zdCBuYXZMaW5rcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgY29uc3QgYW5jaG9yVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBjb25zdCB0ZXh0Q29udGVudE9mTGluayA9IGVsLnRleHRDb250ZW50O1xyXG4gICAgY29uc3QgdGFnID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfSVRFTV9DTEFTUyk7XHJcbiAgICBpZiAodGFnID09PSBcImgzXCIpIHtcclxuICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChTVUJfSVRFTV9DTEFTUyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaGVhZGluZ0lkID0gZ2V0SGVhZGluZ0lkKGVsKTtcclxuXHJcbiAgICBuYXZMaW5rcy5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIGAjJHtoZWFkaW5nSWR9YCk7XHJcbiAgICBuYXZMaW5rcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBJTl9QQUdFX05BVl9MSU5LX0NMQVNTKTtcclxuICAgIG5hdkxpbmtzLnRleHRDb250ZW50ID0gdGV4dENvbnRlbnRPZkxpbms7XHJcblxyXG4gICAgYW5jaG9yVGFnLnNldEF0dHJpYnV0ZShcImlkXCIsIGhlYWRpbmdJZCk7XHJcbiAgICBhbmNob3JUYWcuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgSU5fUEFHRV9OQVZfQU5DSE9SX0NMQVNTKTtcclxuICAgIGVsLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyYmVnaW5cIiwgYW5jaG9yVGFnKTtcclxuXHJcbiAgICBpblBhZ2VOYXZMaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcclxuICAgIGxpc3RJdGVtLmFwcGVuZENoaWxkKG5hdkxpbmtzKTtcclxuICB9KTtcclxuXHJcbiAgaW5QYWdlTmF2RWwuYXBwZW5kQ2hpbGQoaW5QYWdlTmF2KTtcclxuXHJcbiAgY29uc3QgYW5jaG9yVGFncyA9IGdldFNlY3Rpb25BbmNob3JzKCk7XHJcbiAgY29uc3Qgb2JzZXJ2ZVNlY3Rpb25zID0gbmV3IHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlcihzZXRBY3RpdmUsIG9wdGlvbnMpO1xyXG5cclxuICBhbmNob3JUYWdzLmZvckVhY2goKHRhZykgPT4ge1xyXG4gICAgb2JzZXJ2ZVNlY3Rpb25zLm9ic2VydmUodGFnKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGUgY2xpY2sgZnJvbSBsaW5rXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBpbi1wYWdlIG5hdiBjb21wb25lbnRcclxuICovXHJcbmNvbnN0IGhhbmRsZUNsaWNrRnJvbUxpbmsgPSAoZWwpID0+IHtcclxuICBjb25zdCBlbGVtZW50VG9TY3JvbGxUbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsLmhhc2guc2xpY2UoMSkpO1xyXG4gIGhhbmRsZVNjcm9sbFRvU2VjdGlvbihlbGVtZW50VG9TY3JvbGxUbyk7XHJcbn07XHJcblxyXG4vKipcclxuICogSGFuZGxlIHRoZSBlbnRlciBldmVudCBmcm9tIGEgbGluayB3aXRoaW4gdGhlIGluLXBhZ2UgbmF2IGNvbXBvbmVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgaW4tcGFnZSBuYXYgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVFbnRlckZyb21MaW5rID0gKGV2ZW50KSA9PiB7XHJcbiAgY29uc3QgaWQgPSBnZXRTZWN0aW9uSWQoZXZlbnQpO1xyXG4gIGNvbnN0IHRhcmdldEFuY2hvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICBjb25zdCB0YXJnZXQgPSB0YXJnZXRBbmNob3IucGFyZW50RWxlbWVudDtcclxuXHJcbiAgaWYgKHRhcmdldCkge1xyXG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDApO1xyXG4gICAgdGFyZ2V0LmZvY3VzKCk7XHJcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcclxuICAgICAgXCJibHVyXCIsXHJcbiAgICAgIG9uY2UoKCkgPT4ge1xyXG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyB0aHJvdyBhbiBlcnJvcj9cclxuICB9XHJcbiAgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uKHRhcmdldEFuY2hvcik7XHJcbn07XHJcblxyXG5jb25zdCBpblBhZ2VOYXZpZ2F0aW9uID0gYmVoYXZpb3IoXHJcbiAge1xyXG4gICAgW0NMSUNLXToge1xyXG4gICAgICBbYC4ke0lOX1BBR0VfTkFWX0xJTktfQ0xBU1N9YF0oZXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XHJcbiAgICAgICAgaGFuZGxlQ2xpY2tGcm9tTGluayh0aGlzKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBrZXlkb3duOiB7XHJcbiAgICAgIFtgLiR7SU5fUEFHRV9OQVZfTElOS19DTEFTU31gXToga2V5bWFwKHtcclxuICAgICAgICBFbnRlcjogaGFuZGxlRW50ZXJGcm9tTGluayxcclxuICAgICAgfSksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaW5pdChyb290KSB7XHJcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhgLiR7SU5fUEFHRV9OQVZfQ0xBU1N9YCwgcm9vdCkuZm9yRWFjaCgoaW5QYWdlTmF2RWwpID0+IHtcclxuICAgICAgICBjcmVhdGVJblBhZ2VOYXYoaW5QYWdlTmF2RWwpO1xyXG4gICAgICAgIHNjcm9sbFRvQ3VycmVudFNlY3Rpb24oKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW5QYWdlTmF2aWdhdGlvbjtcclxuIiwiY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcclxuXHJcbmNvbnN0IE1BU0tFRF9DTEFTUyA9IGAke1BSRUZJWH0tbWFza2VkYDtcclxuY29uc3QgTUFTS0VEID0gYC4ke01BU0tFRF9DTEFTU31gO1xyXG5jb25zdCBNQVNLID0gYCR7UFJFRklYfS1pbnB1dC1tYXNrYDtcclxuY29uc3QgTUFTS19DT05URU5UID0gYCR7TUFTS30tLWNvbnRlbnRgO1xyXG5jb25zdCBQTEFDRUhPTERFUiA9IFwicGxhY2Vob2xkZXJcIjtcclxuY29uc3QgQ09OVEVYVCA9IFwiZm9ybVwiO1xyXG5cclxuLy8gVXNlciBkZWZpbmVkIFZhbHVlc1xyXG5jb25zdCBtYXNrZWROdW1iZXIgPSBcIl8jZERtTXlZOVwiO1xyXG5jb25zdCBtYXNrZWRMZXR0ZXIgPSBcIkFcIjtcclxuXHJcbi8vIHJlcGxhY2VzIGVhY2ggbWFza2VkIGlucHV0IHdpdGggYSBzaGVsbCBjb250YWluaW5nIHRoZSBpbnB1dCBhbmQgaXQncyBtYXNrLlxyXG5jb25zdCBjcmVhdGVNYXNrZWRJbnB1dFNoZWxsID0gKGlucHV0KSA9PiB7XHJcbiAgY29uc3QgcGxhY2Vob2xkZXIgPSBpbnB1dC5nZXRBdHRyaWJ1dGUoYCR7UExBQ0VIT0xERVJ9YCk7XHJcbiAgaWYgKHBsYWNlaG9sZGVyKSB7XHJcbiAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJtYXhsZW5ndGhcIiwgcGxhY2Vob2xkZXIubGVuZ3RoKTtcclxuICAgIGlucHV0LnNldEF0dHJpYnV0ZShcImRhdGEtcGxhY2Vob2xkZXJcIiwgcGxhY2Vob2xkZXIpO1xyXG4gICAgaW5wdXQucmVtb3ZlQXR0cmlidXRlKGAke1BMQUNFSE9MREVSfWApO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzaGVsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIHNoZWxsLmNsYXNzTGlzdC5hZGQoTUFTSyk7XHJcbiAgc2hlbGwuc2V0QXR0cmlidXRlKFwiZGF0YS1tYXNrXCIsIHBsYWNlaG9sZGVyKTtcclxuXHJcbiAgY29uc3QgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIGNvbnRlbnQuY2xhc3NMaXN0LmFkZChNQVNLX0NPTlRFTlQpO1xyXG4gIGNvbnRlbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG4gIGNvbnRlbnQuaWQgPSBgJHtpbnB1dC5pZH1NYXNrYDtcclxuICBjb250ZW50LnRleHRDb250ZW50ID0gcGxhY2Vob2xkZXI7XHJcblxyXG4gIHNoZWxsLmFwcGVuZENoaWxkKGNvbnRlbnQpO1xyXG4gIGlucHV0LmNsb3Nlc3QoQ09OVEVYVCkuaW5zZXJ0QmVmb3JlKHNoZWxsLCBpbnB1dCk7XHJcbiAgc2hlbGwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG59O1xyXG5cclxuY29uc3Qgc2V0VmFsdWVPZk1hc2sgPSAoZWwpID0+IHtcclxuICBjb25zdCB7IHZhbHVlIH0gPSBlbDtcclxuICBjb25zdCBwbGFjZWhvbGRlclZhbCA9IGAke2VsLmRhdGFzZXQucGxhY2Vob2xkZXIuc3Vic3RyKHZhbHVlLmxlbmd0aCl9YDtcclxuXHJcbiAgY29uc3QgdGhlSUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XHJcbiAgdGhlSUVsLnRleHRDb250ZW50ID0gdmFsdWU7XHJcbiAgcmV0dXJuIFt0aGVJRWwsIHBsYWNlaG9sZGVyVmFsXTtcclxufTtcclxuXHJcbmNvbnN0IHN0cmlwcGVkVmFsdWUgPSAoaXNDaGFyc2V0UHJlc2VudCwgdmFsdWUpID0+XHJcbiAgaXNDaGFyc2V0UHJlc2VudCA/IHZhbHVlLnJlcGxhY2UoL1xcVy9nLCBcIlwiKSA6IHZhbHVlLnJlcGxhY2UoL1xcRC9nLCBcIlwiKTtcclxuXHJcbmNvbnN0IGlzSW50ZWdlciA9ICh2YWx1ZSkgPT4gIU51bWJlci5pc05hTihwYXJzZUludCh2YWx1ZSwgMTApKTtcclxuXHJcbmNvbnN0IGlzTGV0dGVyID0gKHZhbHVlKSA9PiAodmFsdWUgPyB2YWx1ZS5tYXRjaCgvW0EtWl0vaSkgOiBmYWxzZSk7XHJcblxyXG5jb25zdCBoYW5kbGVDdXJyZW50VmFsdWUgPSAoZWwpID0+IHtcclxuICBjb25zdCBpc0NoYXJzZXRQcmVzZW50ID0gZWwuZGF0YXNldC5jaGFyc2V0O1xyXG4gIGNvbnN0IHBsYWNlaG9sZGVyID0gaXNDaGFyc2V0UHJlc2VudCB8fCBlbC5kYXRhc2V0LnBsYWNlaG9sZGVyO1xyXG4gIGNvbnN0IHsgdmFsdWUgfSA9IGVsO1xyXG4gIGNvbnN0IGxlbiA9IHBsYWNlaG9sZGVyLmxlbmd0aDtcclxuICBsZXQgbmV3VmFsdWUgPSBcIlwiO1xyXG4gIGxldCBpO1xyXG4gIGxldCBjaGFySW5kZXg7XHJcblxyXG4gIGNvbnN0IHN0cmlwcGVkVmFsID0gc3RyaXBwZWRWYWx1ZShpc0NoYXJzZXRQcmVzZW50LCB2YWx1ZSk7XHJcblxyXG4gIGZvciAoaSA9IDAsIGNoYXJJbmRleCA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xyXG4gICAgY29uc3QgaXNJbnQgPSBpc0ludGVnZXIoc3RyaXBwZWRWYWxbY2hhckluZGV4XSk7XHJcbiAgICBjb25zdCBpc0xldCA9IGlzTGV0dGVyKHN0cmlwcGVkVmFsW2NoYXJJbmRleF0pO1xyXG4gICAgY29uc3QgbWF0Y2hlc051bWJlciA9IG1hc2tlZE51bWJlci5pbmRleE9mKHBsYWNlaG9sZGVyW2ldKSA+PSAwO1xyXG4gICAgY29uc3QgbWF0Y2hlc0xldHRlciA9IG1hc2tlZExldHRlci5pbmRleE9mKHBsYWNlaG9sZGVyW2ldKSA+PSAwO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgKG1hdGNoZXNOdW1iZXIgJiYgaXNJbnQpIHx8XHJcbiAgICAgIChpc0NoYXJzZXRQcmVzZW50ICYmIG1hdGNoZXNMZXR0ZXIgJiYgaXNMZXQpXHJcbiAgICApIHtcclxuICAgICAgbmV3VmFsdWUgKz0gc3RyaXBwZWRWYWxbY2hhckluZGV4XTtcclxuICAgICAgY2hhckluZGV4ICs9IDE7XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAoIWlzQ2hhcnNldFByZXNlbnQgJiYgIWlzSW50ICYmIG1hdGNoZXNOdW1iZXIpIHx8XHJcbiAgICAgIChpc0NoYXJzZXRQcmVzZW50ICYmXHJcbiAgICAgICAgKChtYXRjaGVzTGV0dGVyICYmICFpc0xldCkgfHwgKG1hdGNoZXNOdW1iZXIgJiYgIWlzSW50KSkpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbmV3VmFsdWUgKz0gcGxhY2Vob2xkZXJbaV07XHJcbiAgICB9XHJcbiAgICAvLyBicmVhayBpZiBubyBjaGFyYWN0ZXJzIGxlZnQgYW5kIHRoZSBwYXR0ZXJuIGlzIG5vbi1zcGVjaWFsIGNoYXJhY3RlclxyXG4gICAgaWYgKHN0cmlwcGVkVmFsW2NoYXJJbmRleF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBuZXdWYWx1ZTtcclxufTtcclxuXHJcbmNvbnN0IGhhbmRsZVZhbHVlQ2hhbmdlID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgaW5wdXRFbCA9IGVsO1xyXG4gIGNvbnN0IGlkID0gaW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcclxuICBpbnB1dEVsLnZhbHVlID0gaGFuZGxlQ3VycmVudFZhbHVlKGlucHV0RWwpO1xyXG5cclxuICBjb25zdCBtYXNrVmFsID0gc2V0VmFsdWVPZk1hc2soZWwpO1xyXG4gIGNvbnN0IG1hc2tFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGAke2lkfU1hc2tgKTtcclxuICBtYXNrRWwudGV4dENvbnRlbnQgPSBcIlwiO1xyXG4gIG1hc2tFbC5yZXBsYWNlQ2hpbGRyZW4obWFza1ZhbFswXSwgbWFza1ZhbFsxXSk7XHJcbn07XHJcblxyXG5jb25zdCBpbnB1dE1hc2tFdmVudHMgPSB7XHJcbiAga2V5dXA6IHtcclxuICAgIFtNQVNLRURdKCkge1xyXG4gICAgICBoYW5kbGVWYWx1ZUNoYW5nZSh0aGlzKTtcclxuICAgIH0sXHJcbiAgfSxcclxufTtcclxuXHJcbmNvbnN0IGlucHV0TWFzayA9IGJlaGF2aW9yKGlucHV0TWFza0V2ZW50cywge1xyXG4gIGluaXQocm9vdCkge1xyXG4gICAgc2VsZWN0T3JNYXRjaGVzKE1BU0tFRCwgcm9vdCkuZm9yRWFjaCgobWFza2VkSW5wdXQpID0+IHtcclxuICAgICAgY3JlYXRlTWFza2VkSW5wdXRTaGVsbChtYXNrZWRJbnB1dCk7XHJcbiAgICB9KTtcclxuICB9LFxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW5wdXRNYXNrO1xyXG4iLCJjb25zdCBrZXltYXAgPSByZXF1aXJlKFwicmVjZXB0b3Iva2V5bWFwXCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgdG9nZ2xlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZVwiKTtcclxuY29uc3QgRm9jdXNUcmFwID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2ZvY3VzLXRyYXBcIik7XHJcbmNvbnN0IGFjY29yZGlvbiA9IHJlcXVpcmUoXCIuLi8uLi91c2EtYWNjb3JkaW9uL3NyYy9pbmRleFwiKTtcclxuXHJcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcblxyXG5jb25zdCBCT0RZID0gXCJib2R5XCI7XHJcbmNvbnN0IExBTkdVQUdFID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VgO1xyXG5jb25zdCBMQU5HVUFHRV9TVUIgPSBgLiR7UFJFRklYfS1sYW5ndWFnZV9fc3VibWVudWA7XHJcbmNvbnN0IExBTkdVQUdFX1BSSU1BUlkgPSBgLiR7UFJFRklYfS1sYW5ndWFnZV9fcHJpbWFyeWA7XHJcbmNvbnN0IExBTkdVQUdFX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LWxhbmd1YWdlX19wcmltYXJ5LWl0ZW1gO1xyXG5jb25zdCBMQU5HVUFHRV9DT05UUk9MID0gYGJ1dHRvbi4ke1BSRUZJWH0tbGFuZ3VhZ2VfX2xpbmtgO1xyXG5jb25zdCBMQU5HVUFHRV9MSU5LUyA9IGAke0xBTkdVQUdFfSBhYDtcclxuXHJcbmxldCBsYW5ndWFnZVNlbGVjdG9yO1xyXG5sZXQgbGFuZ3VhZ2VBY3RpdmU7XHJcblxyXG5jb25zdCBvbkxhbmd1YWdlQ2xvc2UgPSAoKSA9PlxyXG4gIGxhbmd1YWdlU2VsZWN0b3IudG9nZ2xlTGFuZ3VhZ2UuY2FsbChsYW5ndWFnZVNlbGVjdG9yLCBmYWxzZSk7XHJcblxyXG5jb25zdCBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93biA9ICgpID0+IHtcclxuICBpZiAoIWxhbmd1YWdlQWN0aXZlKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB0b2dnbGUobGFuZ3VhZ2VBY3RpdmUsIGZhbHNlKTtcclxuICBsYW5ndWFnZUFjdGl2ZSA9IG51bGw7XHJcbn07XHJcblxyXG5jb25zdCBmb2N1c0xhbmd1YWdlQnV0dG9uID0gKGV2ZW50KSA9PiB7XHJcbiAgY29uc3QgcGFyZW50TGFuZ3VhZ2VJdGVtID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTEFOR1VBR0VfUFJJTUFSWV9JVEVNKTtcclxuXHJcbiAgaWYgKCFldmVudC50YXJnZXQubWF0Y2hlcyhMQU5HVUFHRV9DT05UUk9MKSkge1xyXG4gICAgcGFyZW50TGFuZ3VhZ2VJdGVtLnF1ZXJ5U2VsZWN0b3IoTEFOR1VBR0VfQ09OVFJPTCkuZm9jdXMoKTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcclxuICBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93bigpO1xyXG4gIGZvY3VzTGFuZ3VhZ2VCdXR0b24oZXZlbnQpO1xyXG59O1xyXG5cclxubGFuZ3VhZ2VTZWxlY3RvciA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIFtDTElDS106IHtcclxuICAgICAgW0xBTkdVQUdFX0NPTlRST0xdKCkge1xyXG4gICAgICAgIGlmIChsYW5ndWFnZUFjdGl2ZSAhPT0gdGhpcykge1xyXG4gICAgICAgICAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxhbmd1YWdlQWN0aXZlID09PSB0aGlzKSB7XHJcbiAgICAgICAgICBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93bigpO1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWxhbmd1YWdlQWN0aXZlKSB7XHJcbiAgICAgICAgICBsYW5ndWFnZUFjdGl2ZSA9IHRoaXM7XHJcbiAgICAgICAgICB0b2dnbGUobGFuZ3VhZ2VBY3RpdmUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgICBbQk9EWV06IGhpZGVBY3RpdmVMYW5ndWFnZURyb3Bkb3duLFxyXG4gICAgICBbTEFOR1VBR0VfTElOS1NdKCkge1xyXG4gICAgICAgIGNvbnN0IGFjYyA9IHRoaXMuY2xvc2VzdChhY2NvcmRpb24uQUNDT1JESU9OKTtcclxuXHJcbiAgICAgICAgaWYgKGFjYykge1xyXG4gICAgICAgICAgYWNjb3JkaW9uLmdldEJ1dHRvbnMoYWNjKS5mb3JFYWNoKChidG4pID0+IGFjY29yZGlvbi5oaWRlKGJ0bikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBrZXlkb3duOiB7XHJcbiAgICAgIFtMQU5HVUFHRV9QUklNQVJZXToga2V5bWFwKHsgRXNjYXBlOiBoYW5kbGVFc2NhcGUgfSksXHJcbiAgICB9LFxyXG4gICAgZm9jdXNvdXQ6IHtcclxuICAgICAgW0xBTkdVQUdFX1BSSU1BUlldKGV2ZW50KSB7XHJcbiAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBldmVudC50YXJnZXQuY2xvc2VzdChMQU5HVUFHRV9QUklNQVJZKTtcclxuXHJcbiAgICAgICAgaWYgKCFsYW5ndWFnZS5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xyXG4gICAgICAgICAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaW5pdChyb290KSB7XHJcbiAgICAgIGNvbnN0IHRyYXBDb250YWluZXIgPSByb290Lm1hdGNoZXMoTEFOR1VBR0VfU1VCKVxyXG4gICAgICAgID8gcm9vdFxyXG4gICAgICAgIDogcm9vdC5xdWVyeVNlbGVjdG9yKExBTkdVQUdFX1NVQik7XHJcblxyXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xyXG4gICAgICAgIGxhbmd1YWdlU2VsZWN0b3IuZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRyYXBDb250YWluZXIsIHtcclxuICAgICAgICAgIEVzY2FwZTogb25MYW5ndWFnZUNsb3NlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgdGVhcmRvd24oKSB7XHJcbiAgICAgIGxhbmd1YWdlQWN0aXZlID0gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUcmFwOiBudWxsLFxyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbGFuZ3VhZ2VTZWxlY3RvcjtcclxuIiwiY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xyXG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcclxuY29uc3QgU2Nyb2xsQmFyV2lkdGggPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2Nyb2xsYmFyLXdpZHRoXCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuXHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcblxyXG5jb25zdCBNT0RBTF9DTEFTU05BTUUgPSBgJHtQUkVGSVh9LW1vZGFsYDtcclxuY29uc3QgT1ZFUkxBWV9DTEFTU05BTUUgPSBgJHtNT0RBTF9DTEFTU05BTUV9LW92ZXJsYXlgO1xyXG5jb25zdCBXUkFQUEVSX0NMQVNTTkFNRSA9IGAke01PREFMX0NMQVNTTkFNRX0td3JhcHBlcmA7XHJcbmNvbnN0IE9QRU5FUl9BVFRSSUJVVEUgPSBcImRhdGEtb3Blbi1tb2RhbFwiO1xyXG5jb25zdCBDTE9TRVJfQVRUUklCVVRFID0gXCJkYXRhLWNsb3NlLW1vZGFsXCI7XHJcbmNvbnN0IEZPUkNFX0FDVElPTl9BVFRSSUJVVEUgPSBcImRhdGEtZm9yY2UtYWN0aW9uXCI7XHJcbmNvbnN0IE5PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFID0gYGRhdGEtbW9kYWwtaGlkZGVuYDtcclxuY29uc3QgTU9EQUwgPSBgLiR7TU9EQUxfQ0xBU1NOQU1FfWA7XHJcbmNvbnN0IElOSVRJQUxfRk9DVVMgPSBgLiR7V1JBUFBFUl9DTEFTU05BTUV9ICpbZGF0YS1mb2N1c11gO1xyXG5jb25zdCBDTE9TRV9CVVRUT04gPSBgJHtXUkFQUEVSX0NMQVNTTkFNRX0gKlske0NMT1NFUl9BVFRSSUJVVEV9XWA7XHJcbmNvbnN0IE9QRU5FUlMgPSBgKlske09QRU5FUl9BVFRSSUJVVEV9XVthcmlhLWNvbnRyb2xzXWA7XHJcbmNvbnN0IENMT1NFUlMgPSBgJHtDTE9TRV9CVVRUT059LCAuJHtPVkVSTEFZX0NMQVNTTkFNRX06bm90KFske0ZPUkNFX0FDVElPTl9BVFRSSUJVVEV9XSlgO1xyXG5jb25zdCBOT05fTU9EQUxTID0gYGJvZHkgPiAqOm5vdCguJHtXUkFQUEVSX0NMQVNTTkFNRX0pOm5vdChbYXJpYS1oaWRkZW5dKWA7XHJcbmNvbnN0IE5PTl9NT0RBTFNfSElEREVOID0gYFske05PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFfV1gO1xyXG5cclxuY29uc3QgQUNUSVZFX0NMQVNTID0gXCJ1c2EtanMtbW9kYWwtLWFjdGl2ZVwiO1xyXG5jb25zdCBQUkVWRU5UX0NMSUNLX0NMQVNTID0gXCJ1c2EtanMtbm8tY2xpY2tcIjtcclxuY29uc3QgVklTSUJMRV9DTEFTUyA9IFwiaXMtdmlzaWJsZVwiO1xyXG5jb25zdCBISURERU5fQ0xBU1MgPSBcImlzLWhpZGRlblwiO1xyXG5cclxubGV0IG1vZGFsO1xyXG5sZXQgSU5JVElBTF9CT0RZX1BBRERJTkc7XHJcbmxldCBURU1QT1JBUllfQk9EWV9QQURESU5HO1xyXG5cclxuY29uc3QgaXNBY3RpdmUgPSAoKSA9PiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhBQ1RJVkVfQ0xBU1MpO1xyXG5jb25zdCBTQ1JPTExCQVJfV0lEVEggPSBTY3JvbGxCYXJXaWR0aCgpO1xyXG5cclxuLyoqXHJcbiAqICBDbG9zZXMgbW9kYWwgd2hlbiBib3VuZCB0byBhIGJ1dHRvbiBhbmQgcHJlc3NlZC5cclxuICovXHJcbmNvbnN0IG9uTWVudUNsb3NlID0gKCkgPT4ge1xyXG4gIG1vZGFsLnRvZ2dsZU1vZGFsLmNhbGwobW9kYWwsIGZhbHNlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHZhbHVlIGZvciB0ZW1wb3JhcnkgYm9keSBwYWRkaW5nIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHdoZW4gdGhlIG1vZGFsIGlzIG9wZW4uXHJcbiAqIFZhbHVlIGlzIGNyZWF0ZWQgYnkgY2hlY2tpbmcgZm9yIGluaXRpYWwgYm9keSBwYWRkaW5nIGFuZCBhZGRpbmcgdGhlIHdpZHRoIG9mIHRoZSBzY3JvbGxiYXIuXHJcbiAqL1xyXG5jb25zdCBzZXRUZW1wb3JhcnlCb2R5UGFkZGluZyA9ICgpID0+IHtcclxuICBJTklUSUFMX0JPRFlfUEFERElORyA9IHdpbmRvd1xyXG4gICAgLmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSlcclxuICAgIC5nZXRQcm9wZXJ0eVZhbHVlKFwicGFkZGluZy1yaWdodFwiKTtcclxuICBURU1QT1JBUllfQk9EWV9QQURESU5HID0gYCR7XHJcbiAgICBwYXJzZUludChJTklUSUFMX0JPRFlfUEFERElORy5yZXBsYWNlKC9weC8sIFwiXCIpLCAxMCkgK1xyXG4gICAgcGFyc2VJbnQoU0NST0xMQkFSX1dJRFRILnJlcGxhY2UoL3B4LywgXCJcIiksIDEwKVxyXG4gIH1weGA7XHJcbn07XHJcblxyXG4vKipcclxuICogIFRvZ2dsZSB0aGUgdmlzaWJpbGl0eSBvZiBhIG1vZGFsIHdpbmRvd1xyXG4gKlxyXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50LlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gc2FmZUFjdGl2ZSBpZiBtb2JpbGUgaXMgb3Blbi5cclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1vZGFsKGV2ZW50KSB7XHJcbiAgbGV0IG9yaWdpbmFsT3BlbmVyO1xyXG4gIGxldCBjbGlja2VkRWxlbWVudCA9IGV2ZW50LnRhcmdldDtcclxuICBjb25zdCB7IGJvZHkgfSA9IGRvY3VtZW50O1xyXG4gIGNvbnN0IHNhZmVBY3RpdmUgPSAhaXNBY3RpdmUoKTtcclxuICBjb25zdCBtb2RhbElkID0gY2xpY2tlZEVsZW1lbnRcclxuICAgID8gY2xpY2tlZEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiKVxyXG4gICAgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnVzYS1tb2RhbC13cmFwcGVyLmlzLXZpc2libGVcIik7XHJcbiAgY29uc3QgdGFyZ2V0TW9kYWwgPSBzYWZlQWN0aXZlXHJcbiAgICA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1vZGFsSWQpXHJcbiAgICA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIudXNhLW1vZGFsLXdyYXBwZXIuaXMtdmlzaWJsZVwiKTtcclxuXHJcbiAgLy8gaWYgdGhlcmUgaXMgbm8gbW9kYWwgd2UgcmV0dXJuIGVhcmx5XHJcbiAgaWYgKCF0YXJnZXRNb2RhbCkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgb3BlbkZvY3VzRWwgPSB0YXJnZXRNb2RhbC5xdWVyeVNlbGVjdG9yKElOSVRJQUxfRk9DVVMpXHJcbiAgICA/IHRhcmdldE1vZGFsLnF1ZXJ5U2VsZWN0b3IoSU5JVElBTF9GT0NVUylcclxuICAgIDogdGFyZ2V0TW9kYWwucXVlcnlTZWxlY3RvcihcIi51c2EtbW9kYWxcIik7XHJcbiAgY29uc3QgcmV0dXJuRm9jdXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcclxuICAgIHRhcmdldE1vZGFsLmdldEF0dHJpYnV0ZShcImRhdGEtb3BlbmVyXCIpXHJcbiAgKTtcclxuICBjb25zdCBtZW51QnV0dG9uID0gYm9keS5xdWVyeVNlbGVjdG9yKE9QRU5FUlMpO1xyXG4gIGNvbnN0IGZvcmNlVXNlckFjdGlvbiA9IHRhcmdldE1vZGFsLmdldEF0dHJpYnV0ZShGT1JDRV9BQ1RJT05fQVRUUklCVVRFKTtcclxuXHJcbiAgLy8gU2V0cyB0aGUgY2xpY2tlZCBlbGVtZW50IHRvIHRoZSBjbG9zZSBidXR0b25cclxuICAvLyBzbyBlc2Mga2V5IGFsd2F5cyBjbG9zZXMgbW9kYWxcclxuICBpZiAoZXZlbnQudHlwZSA9PT0gXCJrZXlkb3duXCIgJiYgdGFyZ2V0TW9kYWwgIT09IG51bGwpIHtcclxuICAgIGNsaWNrZWRFbGVtZW50ID0gdGFyZ2V0TW9kYWwucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xyXG4gIH1cclxuXHJcbiAgLy8gV2hlbiB3ZSdyZSBub3QgaGl0dGluZyB0aGUgZXNjYXBlIGtleeKAplxyXG4gIGlmIChjbGlja2VkRWxlbWVudCkge1xyXG4gICAgLy8gTWFrZSBzdXJlIHdlIGNsaWNrIHRoZSBvcGVuZXJcclxuICAgIC8vIElmIGl0IGRvZXNuJ3QgaGF2ZSBhbiBJRCwgbWFrZSBvbmVcclxuICAgIC8vIFN0b3JlIGlkIGFzIGRhdGEgYXR0cmlidXRlIG9uIG1vZGFsXHJcbiAgICBpZiAoY2xpY2tlZEVsZW1lbnQuaGFzQXR0cmlidXRlKE9QRU5FUl9BVFRSSUJVVEUpKSB7XHJcbiAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZShcImlkXCIpID09PSBudWxsKSB7XHJcbiAgICAgICAgb3JpZ2luYWxPcGVuZXIgPSBgbW9kYWwtJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5MDAwMDApICsgMTAwMDAwfWA7XHJcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBvcmlnaW5hbE9wZW5lcik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb3JpZ2luYWxPcGVuZXIgPSB0aGlzLmdldEF0dHJpYnV0ZShcImlkXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIHRhcmdldE1vZGFsLnNldEF0dHJpYnV0ZShcImRhdGEtb3BlbmVyXCIsIG9yaWdpbmFsT3BlbmVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGlzIGJhc2ljYWxseSBzdG9wcyB0aGUgcHJvcGFnYXRpb24gaWYgdGhlIGVsZW1lbnRcclxuICAgIC8vIGlzIGluc2lkZSB0aGUgbW9kYWwgYW5kIG5vdCBhIGNsb3NlIGJ1dHRvbiBvclxyXG4gICAgLy8gZWxlbWVudCBpbnNpZGUgYSBjbG9zZSBidXR0b25cclxuICAgIGlmIChjbGlja2VkRWxlbWVudC5jbG9zZXN0KGAuJHtNT0RBTF9DTEFTU05BTUV9YCkpIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIGNsaWNrZWRFbGVtZW50Lmhhc0F0dHJpYnV0ZShDTE9TRVJfQVRUUklCVVRFKSB8fFxyXG4gICAgICAgIGNsaWNrZWRFbGVtZW50LmNsb3Nlc3QoYFske0NMT1NFUl9BVFRSSUJVVEV9XWApXHJcbiAgICAgICkge1xyXG4gICAgICAgIC8vIGRvIG5vdGhpbmcuIG1vdmUgb24uXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoQUNUSVZFX0NMQVNTLCBzYWZlQWN0aXZlKTtcclxuICB0YXJnZXRNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFZJU0lCTEVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xyXG4gIHRhcmdldE1vZGFsLmNsYXNzTGlzdC50b2dnbGUoSElEREVOX0NMQVNTLCAhc2FmZUFjdGl2ZSk7XHJcblxyXG4gIC8vIElmIHVzZXIgaXMgZm9yY2VkIHRvIHRha2UgYW4gYWN0aW9uLCBhZGRpbmdcclxuICAvLyBhIGNsYXNzIHRvIHRoZSBib2R5IHRoYXQgcHJldmVudHMgY2xpY2tpbmcgdW5kZXJuZWF0aFxyXG4gIC8vIG92ZXJsYXlcclxuICBpZiAoZm9yY2VVc2VyQWN0aW9uKSB7XHJcbiAgICBib2R5LmNsYXNzTGlzdC50b2dnbGUoUFJFVkVOVF9DTElDS19DTEFTUywgc2FmZUFjdGl2ZSk7XHJcbiAgfVxyXG5cclxuICAvLyBUZW1wb3JhcmlseSBpbmNyZWFzZSBib2R5IHBhZGRpbmcgdG8gaW5jbHVkZSB0aGUgd2lkdGggb2YgdGhlIHNjcm9sbGJhci5cclxuICAvLyBUaGlzIGFjY291bnRzIGZvciB0aGUgY29udGVudCBzaGlmdCB3aGVuIHRoZSBzY3JvbGxiYXIgaXMgcmVtb3ZlZCBvbiBtb2RhbCBvcGVuLlxyXG4gIGlmIChib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9PT0gVEVNUE9SQVJZX0JPRFlfUEFERElORykge1xyXG4gICAgYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcInBhZGRpbmctcmlnaHRcIik7XHJcbiAgfSBlbHNlIHtcclxuICAgIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gVEVNUE9SQVJZX0JPRFlfUEFERElORztcclxuICB9XHJcblxyXG4gIC8vIEhhbmRsZSB0aGUgZm9jdXMgYWN0aW9uc1xyXG4gIGlmIChzYWZlQWN0aXZlICYmIG9wZW5Gb2N1c0VsKSB7XHJcbiAgICAvLyBUaGUgbW9kYWwgd2luZG93IGlzIG9wZW5lZC4gRm9jdXMgaXMgc2V0IHRvIGNsb3NlIGJ1dHRvbi5cclxuXHJcbiAgICAvLyBCaW5kcyBlc2NhcGUga2V5IGlmIHdlJ3JlIG5vdCBmb3JjaW5nXHJcbiAgICAvLyB0aGUgdXNlciB0byB0YWtlIGFuIGFjdGlvblxyXG4gICAgaWYgKGZvcmNlVXNlckFjdGlvbikge1xyXG4gICAgICBtb2RhbC5mb2N1c1RyYXAgPSBGb2N1c1RyYXAodGFyZ2V0TW9kYWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbW9kYWwuZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRhcmdldE1vZGFsLCB7XHJcbiAgICAgICAgRXNjYXBlOiBvbk1lbnVDbG9zZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBmb2N1cyBzZXR0aW5nIGFuZCBpbnRlcmFjdGlvbnNcclxuICAgIG1vZGFsLmZvY3VzVHJhcC51cGRhdGUoc2FmZUFjdGl2ZSk7XHJcbiAgICBvcGVuRm9jdXNFbC5mb2N1cygpO1xyXG5cclxuICAgIC8vIEhpZGVzIGV2ZXJ5dGhpbmcgdGhhdCBpcyBub3QgdGhlIG1vZGFsIGZyb20gc2NyZWVuIHJlYWRlcnNcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX01PREFMUykuZm9yRWFjaCgobm9uTW9kYWwpID0+IHtcclxuICAgICAgbm9uTW9kYWwuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG4gICAgICBub25Nb2RhbC5zZXRBdHRyaWJ1dGUoTk9OX01PREFMX0hJRERFTl9BVFRSSUJVVEUsIFwiXCIpO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIGlmICghc2FmZUFjdGl2ZSAmJiBtZW51QnV0dG9uICYmIHJldHVybkZvY3VzKSB7XHJcbiAgICAvLyBUaGUgbW9kYWwgd2luZG93IGlzIGNsb3NlZC5cclxuICAgIC8vIE5vbi1tb2RhbHMgbm93IGFjY2VzaWJsZSB0byBzY3JlZW4gcmVhZGVyXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKE5PTl9NT0RBTFNfSElEREVOKS5mb3JFYWNoKChub25Nb2RhbCkgPT4ge1xyXG4gICAgICBub25Nb2RhbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiKTtcclxuICAgICAgbm9uTW9kYWwucmVtb3ZlQXR0cmlidXRlKE5PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEZvY3VzIGlzIHJldHVybmVkIHRvIHRoZSBvcGVuZXJcclxuICAgIHJldHVybkZvY3VzLmZvY3VzKCk7XHJcbiAgICBtb2RhbC5mb2N1c1RyYXAudXBkYXRlKHNhZmVBY3RpdmUpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNhZmVBY3RpdmU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgcGxhY2Vob2xkZXIgd2l0aCBkYXRhIGF0dHJpYnV0ZXMgZm9yIGNsZWFudXAgZnVuY3Rpb24uXHJcbiAqIFRoZSBjbGVhbnVwIGZ1bmN0aW9uIHVzZXMgdGhpcyBwbGFjZWhvbGRlciB0byBlYXNpbHkgcmVzdG9yZSB0aGUgb3JpZ2luYWwgTW9kYWwgSFRNTCBvbiB0ZWFyZG93bi5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gYmFzZUNvbXBvbmVudCAtIE1vZGFsIEhUTUwgZnJvbSB0aGUgRE9NLlxyXG4gKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFBsYWNlaG9sZGVyIHVzZWQgZm9yIGNsZWFudXAgZnVuY3Rpb24uXHJcbiAqL1xyXG5jb25zdCBjcmVhdGVQbGFjZUhvbGRlciA9IChiYXNlQ29tcG9uZW50KSA9PiB7XHJcbiAgY29uc3QgbW9kYWxJRCA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIik7XHJcbiAgY29uc3Qgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjb25zdCBtb2RhbEF0dHJpYnV0ZXMgPSBBcnJheS5mcm9tKGJhc2VDb21wb25lbnQuYXR0cmlidXRlcyk7XHJcblxyXG4gIHNldFRlbXBvcmFyeUJvZHlQYWRkaW5nKCk7XHJcblxyXG4gIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5zZXRBdHRyaWJ1dGUoYGRhdGEtcGxhY2Vob2xkZXItZm9yYCwgbW9kYWxJRCk7XHJcbiAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG5cclxuICBtb2RhbEF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlKSA9PiB7XHJcbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuc2V0QXR0cmlidXRlKFxyXG4gICAgICBgZGF0YS1vcmlnaW5hbC0ke2F0dHJpYnV0ZS5uYW1lfWAsXHJcbiAgICAgIGF0dHJpYnV0ZS52YWx1ZVxyXG4gICAgKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlcjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNb3ZlcyBuZWNlc3NhcnkgYXR0cmlidXRlcyBmcm9tIE1vZGFsIEhUTUwgdG8gd3JhcHBlciBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBiYXNlQ29tcG9uZW50IC0gTW9kYWwgSFRNTCBpbiB0aGUgRE9NLlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBtb2RhbENvbnRlbnRXcmFwcGVyIC0gTW9kYWwgY29tcG9uZW50IHdyYXBwZXIgZWxlbWVudC5cclxuICogQHJldHVybnMgTW9kYWwgd3JhcHBlciB3aXRoIGNvcnJlY3QgYXR0cmlidXRlcy5cclxuICovXHJcbmNvbnN0IHNldE1vZGFsQXR0cmlidXRlcyA9IChiYXNlQ29tcG9uZW50LCBtb2RhbENvbnRlbnRXcmFwcGVyKSA9PiB7XHJcbiAgY29uc3QgbW9kYWxJRCA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIik7XHJcbiAgY29uc3QgYXJpYUxhYmVsbGVkQnkgPSBiYXNlQ29tcG9uZW50LmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxsZWRieVwiKTtcclxuICBjb25zdCBhcmlhRGVzY3JpYmVkQnkgPSBiYXNlQ29tcG9uZW50LmdldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIik7XHJcbiAgY29uc3QgZm9yY2VVc2VyQWN0aW9uID0gYmFzZUNvbXBvbmVudC5oYXNBdHRyaWJ1dGUoRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSk7XHJcblxyXG4gIGlmICghYXJpYUxhYmVsbGVkQnkpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kYWxJRH0gaXMgbWlzc2luZyBhcmlhLWxhYmVsbGVkYnkgYXR0cmlidXRlYCk7XHJcblxyXG4gIGlmICghYXJpYURlc2NyaWJlZEJ5KVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke21vZGFsSUR9IGlzIG1pc3NpbmcgYXJpYS1kZXNyaWJlZGJ5IGF0dHJpYnV0ZWApO1xyXG5cclxuICAvLyBTZXQgYXR0cmlidXRlc1xyXG4gIG1vZGFsQ29udGVudFdyYXBwZXIuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImRpYWxvZ1wiKTtcclxuICBtb2RhbENvbnRlbnRXcmFwcGVyLnNldEF0dHJpYnV0ZShcImlkXCIsIG1vZGFsSUQpO1xyXG4gIG1vZGFsQ29udGVudFdyYXBwZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbGxlZGJ5XCIsIGFyaWFMYWJlbGxlZEJ5KTtcclxuICBtb2RhbENvbnRlbnRXcmFwcGVyLnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgYXJpYURlc2NyaWJlZEJ5KTtcclxuXHJcbiAgaWYgKGZvcmNlVXNlckFjdGlvbikge1xyXG4gICAgbW9kYWxDb250ZW50V3JhcHBlci5zZXRBdHRyaWJ1dGUoRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSwgZm9yY2VVc2VyQWN0aW9uKTtcclxuICB9XHJcblxyXG4gIC8vIEFkZCBhcmlhLWNvbnRyb2xzXHJcbiAgY29uc3QgbW9kYWxDbG9zZXJzID0gbW9kYWxDb250ZW50V3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKENMT1NFUlMpO1xyXG4gIG1vZGFsQ2xvc2Vycy5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBtb2RhbElEKTtcclxuICB9KTtcclxuXHJcbiAgLy8gVXBkYXRlIHRoZSBiYXNlIGVsZW1lbnQgSFRNTFxyXG4gIGJhc2VDb21wb25lbnQucmVtb3ZlQXR0cmlidXRlKFwiaWRcIik7XHJcbiAgYmFzZUNvbXBvbmVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsbGVkYnlcIik7XHJcbiAgYmFzZUNvbXBvbmVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWRlc2NyaWJlZGJ5XCIpO1xyXG4gIGJhc2VDb21wb25lbnQuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcclxuXHJcbiAgcmV0dXJuIG1vZGFsQ29udGVudFdyYXBwZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGhpZGRlbiBtb2RhbCBjb250ZW50IHdyYXBwZXIuXHJcbiAqIFJlYnVpbGRzIHRoZSBvcmlnaW5hbCBNb2RhbCBIVE1MIGluIHRoZSBuZXcgd3JhcHBlciBhbmQgYWRkcyBhIHBhZ2Ugb3ZlcmxheS5cclxuICogVGhlbiBtb3ZlcyBvcmlnaW5hbCBNb2RhbCBIVE1MIGF0dHJpYnV0ZXMgdG8gdGhlIG5ldyB3cmFwcGVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBiYXNlQ29tcG9uZW50IC0gT3JpZ2luYWwgTW9kYWwgSFRNTCBpbiB0aGUgRE9NLlxyXG4gKiBAcmV0dXJucyBNb2RhbCBjb21wb25lbnQgLSBNb2RhbCB3cmFwcGVyIHcvIG5lc3RlZCBPdmVybGF5IGFuZCBNb2RhbCBDb250ZW50LlxyXG4gKi9cclxuY29uc3QgcmVidWlsZE1vZGFsID0gKGJhc2VDb21wb25lbnQpID0+IHtcclxuICBjb25zdCBtb2RhbENvbnRlbnQgPSBiYXNlQ29tcG9uZW50O1xyXG4gIGNvbnN0IG1vZGFsQ29udGVudFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGNvbnN0IG92ZXJsYXlEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cclxuICAvLyBBZGQgY2xhc3Nlc1xyXG4gIG1vZGFsQ29udGVudFdyYXBwZXIuY2xhc3NMaXN0LmFkZChISURERU5fQ0xBU1MsIFdSQVBQRVJfQ0xBU1NOQU1FKTtcclxuICBvdmVybGF5RGl2LmNsYXNzTGlzdC5hZGQoT1ZFUkxBWV9DTEFTU05BTUUpO1xyXG5cclxuICAvLyBSZWJ1aWxkIHRoZSBtb2RhbCBlbGVtZW50XHJcbiAgbW9kYWxDb250ZW50V3JhcHBlci5hcHBlbmQob3ZlcmxheURpdik7XHJcbiAgb3ZlcmxheURpdi5hcHBlbmQobW9kYWxDb250ZW50KTtcclxuXHJcbiAgLy8gQWRkIGF0dHJpYnV0ZXNcclxuICBzZXRNb2RhbEF0dHJpYnV0ZXMobW9kYWxDb250ZW50LCBtb2RhbENvbnRlbnRXcmFwcGVyKTtcclxuXHJcbiAgcmV0dXJuIG1vZGFsQ29udGVudFdyYXBwZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogIEJ1aWxkcyBtb2RhbCB3aW5kb3cgZnJvbSBiYXNlIEhUTUwgYW5kIGFwcGVuZHMgdG8gdGhlIGVuZCBvZiB0aGUgRE9NLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBiYXNlQ29tcG9uZW50IC0gVGhlIG1vZGFsIGRpdiBlbGVtZW50IGluIHRoZSBET00uXHJcbiAqL1xyXG5jb25zdCBzZXRVcE1vZGFsID0gKGJhc2VDb21wb25lbnQpID0+IHtcclxuICBjb25zdCBtb2RhbElEID0gYmFzZUNvbXBvbmVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcclxuXHJcbiAgaWYgKCFtb2RhbElEKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE1vZGFsIG1hcmt1cCBpcyBtaXNzaW5nIElEYCk7XHJcbiAgfVxyXG5cclxuICAvLyBDcmVhdGUgcGxhY2Vob2xkZXIgd2hlcmUgbW9kYWwgaXMgZm9yIGNsZWFudXBcclxuICBjb25zdCBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIgPSBjcmVhdGVQbGFjZUhvbGRlcihiYXNlQ29tcG9uZW50KTtcclxuICBiYXNlQ29tcG9uZW50LmFmdGVyKG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlcik7XHJcblxyXG4gIC8vIEJ1aWxkIG1vZGFsIGNvbXBvbmVudFxyXG4gIGNvbnN0IG1vZGFsQ29tcG9uZW50ID0gcmVidWlsZE1vZGFsKGJhc2VDb21wb25lbnQpO1xyXG5cclxuICAvLyBNb3ZlIGFsbCBtb2RhbHMgdG8gdGhlIGVuZCBvZiB0aGUgRE9NLiBEb2luZyB0aGlzIGFsbG93cyB1cyB0b1xyXG4gIC8vIG1vcmUgZWFzaWx5IGZpbmQgdGhlIGVsZW1lbnRzIHRvIGhpZGUgZnJvbSBzY3JlZW4gcmVhZGVyc1xyXG4gIC8vIHdoZW4gdGhlIG1vZGFsIGlzIG9wZW4uXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtb2RhbENvbXBvbmVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBkeW5hbWljYWxseSBjcmVhdGVkIE1vZGFsIGFuZCBXcmFwcGVyIGVsZW1lbnRzIGFuZCByZXN0b3JlcyBvcmlnaW5hbCBNb2RhbCBIVE1MLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBiYXNlQ29tcG9uZW50IC0gVGhlIG1vZGFsIGRpdiBlbGVtZW50IGluIHRoZSBET00uXHJcbiAqL1xyXG5jb25zdCBjbGVhblVwTW9kYWwgPSAoYmFzZUNvbXBvbmVudCkgPT4ge1xyXG4gIGNvbnN0IG1vZGFsQ29udGVudCA9IGJhc2VDb21wb25lbnQ7XHJcbiAgY29uc3QgbW9kYWxDb250ZW50V3JhcHBlciA9IG1vZGFsQ29udGVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XHJcbiAgY29uc3QgbW9kYWxJRCA9IG1vZGFsQ29udGVudFdyYXBwZXIuZ2V0QXR0cmlidXRlKFwiaWRcIik7XHJcblxyXG4gIC8vIGlmIHRoZXJlIGlzIG5vIG1vZGFsSUQsIHJldHVybiBlYXJseVxyXG4gIGlmICghbW9kYWxJRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcclxuICAgIGBbZGF0YS1wbGFjZWhvbGRlci1mb3I9XCIke21vZGFsSUR9XCJdYFxyXG4gICk7XHJcblxyXG4gIGlmIChvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIpIHtcclxuICAgIGNvbnN0IG1vZGFsQXR0cmlidXRlcyA9IEFycmF5LmZyb20ob3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLmF0dHJpYnV0ZXMpO1xyXG4gICAgbW9kYWxBdHRyaWJ1dGVzLmZvckVhY2goKGF0dHJpYnV0ZSkgPT4ge1xyXG4gICAgICBpZiAoYXR0cmlidXRlLm5hbWUuc3RhcnRzV2l0aChcImRhdGEtb3JpZ2luYWwtXCIpKSB7XHJcbiAgICAgICAgLy8gZGF0YS1vcmlnaW5hbC0gaXMgMTQgbG9uZ1xyXG4gICAgICAgIG1vZGFsQ29udGVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUuc3Vic3RyKDE0KSwgYXR0cmlidXRlLnZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLmFmdGVyKG1vZGFsQ29udGVudCk7XHJcbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChcclxuICAgICAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgbW9kYWxDb250ZW50V3JhcHBlci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKG1vZGFsQ29udGVudFdyYXBwZXIpO1xyXG59O1xyXG5cclxubW9kYWwgPSBiZWhhdmlvcihcclxuICB7fSxcclxuICB7XHJcbiAgICBpbml0KHJvb3QpIHtcclxuICAgICAgc2VsZWN0T3JNYXRjaGVzKE1PREFMLCByb290KS5mb3JFYWNoKChtb2RhbFdpbmRvdykgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1vZGFsSWQgPSBtb2RhbFdpbmRvdy5pZDtcclxuXHJcbiAgICAgICAgc2V0VXBNb2RhbChtb2RhbFdpbmRvdyk7XHJcblxyXG4gICAgICAgIC8vIFF1ZXJ5IGFsbCBvcGVuZXJzIGFuZCBjbG9zZXJzIGluY2x1ZGluZyB0aGUgb3ZlcmxheVxyXG4gICAgICAgIHNlbGVjdE9yTWF0Y2hlcyhgW2FyaWEtY29udHJvbHM9XCIke21vZGFsSWR9XCJdYCwgZG9jdW1lbnQpLmZvckVhY2goXHJcbiAgICAgICAgICAobW9kYWxUcmlnZ2VyKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIElmIG1vZGFsVHJpZ2dlciBpcyBhbiBhbmNob3IuLi5cclxuICAgICAgICAgICAgaWYgKG1vZGFsVHJpZ2dlci5ub2RlTmFtZSA9PT0gXCJBXCIpIHtcclxuICAgICAgICAgICAgICAvLyBUdXJuIGFuY2hvciBsaW5rcyBpbnRvIGJ1dHRvbnMgZm9yIHNjcmVlbiByZWFkZXJzXHJcbiAgICAgICAgICAgICAgbW9kYWxUcmlnZ2VyLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJidXR0b25cIik7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFByZXZlbnQgbW9kYWwgdHJpZ2dlcnMgZnJvbSBhY3RpbmcgbGlrZSBsaW5rc1xyXG4gICAgICAgICAgICAgIG1vZGFsVHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IGUucHJldmVudERlZmF1bHQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENhbiB1bmNvbW1lbnQgd2hlbiBhcmlhLWhhc3BvcHVwPVwiZGlhbG9nXCIgaXMgc3VwcG9ydGVkXHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vYTExeXN1cHBvcnQuaW8vdGVjaC9hcmlhL2FyaWEtaGFzcG9wdXBfYXR0cmlidXRlXHJcbiAgICAgICAgICAgIC8vIE1vc3Qgc2NyZWVuIHJlYWRlcnMgc3VwcG9ydCBhcmlhLWhhc3BvcHVwLCBidXQgbWlnaHQgYW5ub3VuY2VcclxuICAgICAgICAgICAgLy8gYXMgb3BlbmluZyBhIG1lbnUgaWYgXCJkaWFsb2dcIiBpcyBub3Qgc3VwcG9ydGVkLlxyXG4gICAgICAgICAgICAvLyBtb2RhbFRyaWdnZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1oYXNwb3B1cFwiLCBcImRpYWxvZ1wiKTtcclxuXHJcbiAgICAgICAgICAgIG1vZGFsVHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdG9nZ2xlTW9kYWwpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIHRlYXJkb3duKHJvb3QpIHtcclxuICAgICAgc2VsZWN0T3JNYXRjaGVzKE1PREFMLCByb290KS5mb3JFYWNoKChtb2RhbFdpbmRvdykgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1vZGFsSWQgPSBtb2RhbFdpbmRvdy5pZDtcclxuICAgICAgICBjbGVhblVwTW9kYWwobW9kYWxXaW5kb3cpO1xyXG5cclxuICAgICAgICBzZWxlY3RPck1hdGNoZXMoYFthcmlhLWNvbnRyb2xzPVwiJHttb2RhbElkfVwiXWAsIGRvY3VtZW50KS5mb3JFYWNoKFxyXG4gICAgICAgICAgKG1vZGFsVHJpZ2dlcikgPT5cclxuICAgICAgICAgICAgbW9kYWxUcmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0b2dnbGVNb2RhbClcclxuICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RyYXA6IG51bGwsXHJcbiAgICB0b2dnbGVNb2RhbCxcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsO1xyXG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XHJcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5cclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcclxuXHJcbmNvbnN0IFJBTkdFX0NMQVNTTkFNRSA9IGAke1BSRUZJWH0tcmFuZ2VgO1xyXG5jb25zdCBSQU5HRSA9IGAuJHtSQU5HRV9DTEFTU05BTUV9YDtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgcmFuZ2UgY2FsbG91dCBmb3Igc2NyZWVuIHJlYWRlcnMgdXNpbmcgdGhlIG9wdGlvbmFsIGRhdGEgYXR0cmlidXRlcy5cclxuICpcclxuICogR2V0IG9wdGlvbmFsIGRhdGEgYXR0cmlidXRlcywgY29uc3RydWN0IGFuZCBhcHBlbmRzIGFyaWEtdmFsdWV0ZXh0IGF0dHJpYnV0ZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICpcclxuICogPGlucHV0IGlkPVwidXNhLXJhbmdlXCIgY2xhc3M9XCJ1c2EtcmFuZ2VcIiB0eXBlPVwicmFuZ2VcIiBtaW49XCIwXCIgbWF4PVwiMTAwXCIgc3RlcD1cIjEwXCIgdmFsdWU9XCIyMFwiIGRhdGEtdGV4dC11bml0PVwiZGVncmVlc1wiPlxyXG4gKlxyXG4gKiBDYWxsb3V0IHJldHVybnMgXCIyMCBkZWdyZWVzIG9mIDEwMC5cIlxyXG4gKlxyXG4gKiA8aW5wdXQgaWQ9XCJ1c2EtcmFuZ2VcIiBjbGFzcz1cInVzYS1yYW5nZVwiIHR5cGU9XCJyYW5nZVwiIG1pbj1cIjBcIiBtYXg9XCIxMDBcIiBzdGVwPVwiMTBcIiB2YWx1ZT1cIjIwXCIgZGF0YS10ZXh0LXByZXBvc2l0aW9uPVwiZGVcIj5cclxuICpcclxuICogQ2FsbG91dCByZXR1cm5zIFwiMjAgZGUgMTAwLlwiXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gdGFyZ2V0UmFuZ2UgLSBUaGUgcmFuZ2Ugc2xpZGVyIGlucHV0IGVsZW1lbnRcclxuICovXHJcbmNvbnN0IHVwZGF0ZUNhbGxvdXQgPSAodGFyZ2V0UmFuZ2UpID0+IHtcclxuICBjb25zdCByYW5nZVNsaWRlciA9IHRhcmdldFJhbmdlO1xyXG4gIGNvbnN0IGRlZmF1bHRQcmVwID0gXCJvZlwiO1xyXG4gIGNvbnN0IG9wdGlvbmFsUHJlcCA9IHJhbmdlU2xpZGVyLmRhdGFzZXQudGV4dFByZXBvc2l0aW9uO1xyXG4gIGNvbnN0IHByZXAgPSBvcHRpb25hbFByZXAgfHwgZGVmYXVsdFByZXA7XHJcbiAgY29uc3QgdW5pdCA9IHJhbmdlU2xpZGVyLmRhdGFzZXQudGV4dFVuaXQ7XHJcbiAgY29uc3QgdmFsID0gcmFuZ2VTbGlkZXIudmFsdWU7XHJcbiAgLy8gTm90ZTogMTAwIGlzIHRoZSBtYXggYXR0cmlidXRlJ3MgbmF0aXZlIGRlZmF1bHQgdmFsdWUgb24gcmFuZ2UgaW5wdXRzXHJcbiAgLy8gUmVmZXJlbmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0VsZW1lbnQvaW5wdXQvcmFuZ2UjdmFsaWRhdGlvblxyXG4gIGNvbnN0IG1heCA9IHJhbmdlU2xpZGVyLmdldEF0dHJpYnV0ZShcIm1heFwiKSB8fCAxMDA7XHJcblxyXG4gIGxldCBjYWxsb3V0O1xyXG5cclxuICBpZiAodW5pdCkge1xyXG4gICAgY2FsbG91dCA9IGAke3ZhbH0gJHt1bml0fSAke3ByZXB9ICR7bWF4fWA7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNhbGxvdXQgPSBgJHt2YWx9ICR7cHJlcH0gJHttYXh9YDtcclxuICB9XHJcblxyXG4gIHJhbmdlU2xpZGVyLnNldEF0dHJpYnV0ZShcImFyaWEtdmFsdWV0ZXh0XCIsIGNhbGxvdXQpO1xyXG59O1xyXG5cclxuY29uc3QgcmFuZ2VFdmVudHMgPSB7XHJcbiAgY2hhbmdlOiB7XHJcbiAgICBbUkFOR0VdKCkge1xyXG4gICAgICB1cGRhdGVDYWxsb3V0KHRoaXMpO1xyXG4gICAgfSxcclxuICB9LFxyXG59O1xyXG5cclxuY29uc3QgcmFuZ2UgPSBiZWhhdmlvcihyYW5nZUV2ZW50cywge1xyXG4gIGluaXQocm9vdCkge1xyXG4gICAgc2VsZWN0T3JNYXRjaGVzKFJBTkdFLCByb290KS5mb3JFYWNoKChyYW5nZVNsaWRlcikgPT4ge1xyXG4gICAgICB1cGRhdGVDYWxsb3V0KHJhbmdlU2xpZGVyKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgdXBkYXRlQ2FsbG91dCxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJhbmdlO1xyXG4iLCJjb25zdCBpZ25vcmUgPSByZXF1aXJlKFwicmVjZXB0b3IvaWdub3JlXCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcclxuXHJcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XHJcblxyXG5jb25zdCBCVVRUT04gPSBcIi5qcy1zZWFyY2gtYnV0dG9uXCI7XHJcbmNvbnN0IEZPUk0gPSBcIi5qcy1zZWFyY2gtZm9ybVwiO1xyXG5jb25zdCBJTlBVVCA9IFwiW3R5cGU9c2VhcmNoXVwiO1xyXG5jb25zdCBDT05URVhUID0gXCJoZWFkZXJcIjsgLy8gWFhYXHJcblxyXG5sZXQgbGFzdEJ1dHRvbjtcclxuXHJcbmNvbnN0IGdldEZvcm0gPSAoYnV0dG9uKSA9PiB7XHJcbiAgY29uc3QgY29udGV4dCA9IGJ1dHRvbi5jbG9zZXN0KENPTlRFWFQpO1xyXG4gIHJldHVybiBjb250ZXh0ID8gY29udGV4dC5xdWVyeVNlbGVjdG9yKEZPUk0pIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcihGT1JNKTtcclxufTtcclxuXHJcbmNvbnN0IHRvZ2dsZVNlYXJjaCA9IChidXR0b24sIGFjdGl2ZSkgPT4ge1xyXG4gIGNvbnN0IGZvcm0gPSBnZXRGb3JtKGJ1dHRvbik7XHJcblxyXG4gIGlmICghZm9ybSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyAke0ZPUk19IGZvdW5kIGZvciBzZWFyY2ggdG9nZ2xlIGluICR7Q09OVEVYVH0hYCk7XHJcbiAgfVxyXG5cclxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xyXG4gIGJ1dHRvbi5oaWRkZW4gPSBhY3RpdmU7XHJcbiAgZm9ybS5oaWRkZW4gPSAhYWN0aXZlO1xyXG4gIC8qIGVzbGludC1lbmFibGUgKi9cclxuXHJcbiAgaWYgKCFhY3RpdmUpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGlucHV0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKElOUFVUKTtcclxuXHJcbiAgaWYgKGlucHV0KSB7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG4gIH1cclxuICAvLyB3aGVuIHRoZSB1c2VyIGNsaWNrcyBfb3V0c2lkZV8gb2YgdGhlIGZvcm0gdy9pZ25vcmUoKTogaGlkZSB0aGVcclxuICAvLyBzZWFyY2gsIHRoZW4gcmVtb3ZlIHRoZSBsaXN0ZW5lclxyXG4gIGNvbnN0IGxpc3RlbmVyID0gaWdub3JlKGZvcm0sICgpID0+IHtcclxuICAgIGlmIChsYXN0QnV0dG9uKSB7XHJcbiAgICAgIGhpZGVTZWFyY2guY2FsbChsYXN0QnV0dG9uKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxyXG4gICAgfVxyXG5cclxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihDTElDSywgbGlzdGVuZXIpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBOb3JtYWxseSB3ZSB3b3VsZCBqdXN0IHJ1biB0aGlzIGNvZGUgd2l0aG91dCBhIHRpbWVvdXQsIGJ1dFxyXG4gIC8vIElFMTEgYW5kIEVkZ2Ugd2lsbCBhY3R1YWxseSBjYWxsIHRoZSBsaXN0ZW5lciAqaW1tZWRpYXRlbHkqIGJlY2F1c2VcclxuICAvLyB0aGV5IGFyZSBjdXJyZW50bHkgaGFuZGxpbmcgdGhpcyBleGFjdCB0eXBlIG9mIGV2ZW50LCBzbyB3ZSdsbFxyXG4gIC8vIG1ha2Ugc3VyZSB0aGUgYnJvd3NlciBpcyBkb25lIGhhbmRsaW5nIHRoZSBjdXJyZW50IGNsaWNrIGV2ZW50LFxyXG4gIC8vIGlmIGFueSwgYmVmb3JlIHdlIGF0dGFjaCB0aGUgbGlzdGVuZXIuXHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoQ0xJQ0ssIGxpc3RlbmVyKTtcclxuICB9LCAwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNob3dTZWFyY2goKSB7XHJcbiAgdG9nZ2xlU2VhcmNoKHRoaXMsIHRydWUpO1xyXG4gIGxhc3RCdXR0b24gPSB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoaWRlU2VhcmNoKCkge1xyXG4gIHRvZ2dsZVNlYXJjaCh0aGlzLCBmYWxzZSk7XHJcbiAgbGFzdEJ1dHRvbiA9IHVuZGVmaW5lZDtcclxufVxyXG5cclxuY29uc3Qgc2VhcmNoID0gYmVoYXZpb3IoXHJcbiAge1xyXG4gICAgW0NMSUNLXToge1xyXG4gICAgICBbQlVUVE9OXTogc2hvd1NlYXJjaCxcclxuICAgIH0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpbml0KHRhcmdldCkge1xyXG4gICAgICBzZWxlY3QoQlVUVE9OLCB0YXJnZXQpLmZvckVhY2goKGJ1dHRvbikgPT4ge1xyXG4gICAgICAgIHRvZ2dsZVNlYXJjaChidXR0b24sIGZhbHNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgdGVhcmRvd24oKSB7XHJcbiAgICAgIC8vIGZvcmdldCB0aGUgbGFzdCBidXR0b24gY2xpY2tlZFxyXG4gICAgICBsYXN0QnV0dG9uID0gdW5kZWZpbmVkO1xyXG4gICAgfSxcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNlYXJjaDtcclxuIiwiY29uc3Qgb25jZSA9IHJlcXVpcmUoXCJyZWNlcHRvci9vbmNlXCIpO1xyXG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcclxuXHJcbmNvbnN0IExJTksgPSBgLiR7UFJFRklYfS1za2lwbmF2W2hyZWZePVwiI1wiXSwgLiR7UFJFRklYfS1mb290ZXJfX3JldHVybi10by10b3AgW2hyZWZePVwiI1wiXWA7XHJcbmNvbnN0IE1BSU5DT05URU5UID0gXCJtYWluLWNvbnRlbnRcIjtcclxuXHJcbmZ1bmN0aW9uIHNldFRhYmluZGV4KCkge1xyXG4gIC8vIE5COiB3ZSBrbm93IGJlY2F1c2Ugb2YgdGhlIHNlbGVjdG9yIHdlJ3JlIGRlbGVnYXRpbmcgdG8gYmVsb3cgdGhhdCB0aGVcclxuICAvLyBocmVmIGFscmVhZHkgYmVnaW5zIHdpdGggJyMnXHJcbiAgY29uc3QgaWQgPSBlbmNvZGVVUkkodGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpKTtcclxuICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcclxuICAgIGlkID09PSBcIiNcIiA/IE1BSU5DT05URU5UIDogaWQuc2xpY2UoMSlcclxuICApO1xyXG5cclxuICBpZiAodGFyZ2V0KSB7XHJcbiAgICB0YXJnZXQuc3R5bGUub3V0bGluZSA9IFwiMFwiO1xyXG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDApO1xyXG4gICAgdGFyZ2V0LmZvY3VzKCk7XHJcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcclxuICAgICAgXCJibHVyXCIsXHJcbiAgICAgIG9uY2UoKCkgPT4ge1xyXG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyB0aHJvdyBhbiBlcnJvcj9cclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3Ioe1xyXG4gIFtDTElDS106IHtcclxuICAgIFtMSU5LXTogc2V0VGFiaW5kZXgsXHJcbiAgfSxcclxufSk7XHJcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XHJcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xyXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xyXG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xyXG5cclxuY29uc3QgVEFCTEUgPSBgLiR7UFJFRklYfS10YWJsZWA7XHJcbmNvbnN0IFNPUlRFRCA9IFwiYXJpYS1zb3J0XCI7XHJcbmNvbnN0IEFTQ0VORElORyA9IFwiYXNjZW5kaW5nXCI7XHJcbmNvbnN0IERFU0NFTkRJTkcgPSBcImRlc2NlbmRpbmdcIjtcclxuY29uc3QgU09SVF9PVkVSUklERSA9IFwiZGF0YS1zb3J0LXZhbHVlXCI7XHJcbmNvbnN0IFNPUlRfQlVUVE9OX0NMQVNTID0gYCR7UFJFRklYfS10YWJsZV9faGVhZGVyX19idXR0b25gO1xyXG5jb25zdCBTT1JUX0JVVFRPTiA9IGAuJHtTT1JUX0JVVFRPTl9DTEFTU31gO1xyXG5jb25zdCBTT1JUQUJMRV9IRUFERVIgPSBgdGhbZGF0YS1zb3J0YWJsZV1gO1xyXG5jb25zdCBBTk5PVU5DRU1FTlRfUkVHSU9OID0gYC4ke1BSRUZJWH0tdGFibGVfX2Fubm91bmNlbWVudC1yZWdpb25bYXJpYS1saXZlPVwicG9saXRlXCJdYDtcclxuXHJcbi8qKiBHZXRzIHRoZSBkYXRhLXNvcnQtdmFsdWUgYXR0cmlidXRlIHZhbHVlLCBpZiBwcm92aWRlZCDigJQgb3RoZXJ3aXNlLCBnZXRzXHJcbiAqIHRoZSBpbm5lclRleHQgb3IgdGV4dENvbnRlbnQg4oCUIG9mIHRoZSBjaGlsZCBlbGVtZW50IChIVE1MVGFibGVDZWxsRWxlbWVudClcclxuICogYXQgdGhlIHNwZWNpZmllZCBpbmRleCBvZiB0aGUgZ2l2ZW4gdGFibGUgcm93XHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxyXG4gKiBAcGFyYW0ge2FycmF5PEhUTUxUYWJsZVJvd0VsZW1lbnQ+fSB0clxyXG4gKiBAcmV0dXJuIHtib29sZWFufVxyXG4gKi9cclxuY29uc3QgZ2V0Q2VsbFZhbHVlID0gKHRyLCBpbmRleCkgPT5cclxuICB0ci5jaGlsZHJlbltpbmRleF0uZ2V0QXR0cmlidXRlKFNPUlRfT1ZFUlJJREUpIHx8XHJcbiAgdHIuY2hpbGRyZW5baW5kZXhdLmlubmVyVGV4dCB8fFxyXG4gIHRyLmNoaWxkcmVuW2luZGV4XS50ZXh0Q29udGVudDtcclxuXHJcbi8qKlxyXG4gKiBDb21wYXJlcyB0aGUgdmFsdWVzIG9mIHR3byByb3cgYXJyYXkgaXRlbXMgYXQgdGhlIGdpdmVuIGluZGV4LCB0aGVuIHNvcnRzIGJ5IHRoZSBnaXZlbiBkaXJlY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb25cclxuICogQHJldHVybiB7Ym9vbGVhbn1cclxuICovXHJcbmNvbnN0IGNvbXBhcmVGdW5jdGlvbiA9IChpbmRleCwgaXNBc2NlbmRpbmcpID0+ICh0aGlzUm93LCBuZXh0Um93KSA9PiB7XHJcbiAgLy8gZ2V0IHZhbHVlcyB0byBjb21wYXJlIGZyb20gZGF0YSBhdHRyaWJ1dGUgb3IgY2VsbCBjb250ZW50XHJcbiAgY29uc3QgdmFsdWUxID0gZ2V0Q2VsbFZhbHVlKGlzQXNjZW5kaW5nID8gdGhpc1JvdyA6IG5leHRSb3csIGluZGV4KTtcclxuICBjb25zdCB2YWx1ZTIgPSBnZXRDZWxsVmFsdWUoaXNBc2NlbmRpbmcgPyBuZXh0Um93IDogdGhpc1JvdywgaW5kZXgpO1xyXG5cclxuICAvLyBpZiBuZWl0aGVyIHZhbHVlIGlzIGVtcHR5LCBhbmQgaWYgYm90aCB2YWx1ZXMgYXJlIGFscmVhZHkgbnVtYmVycywgY29tcGFyZSBudW1lcmljYWxseVxyXG4gIGlmIChcclxuICAgIHZhbHVlMSAmJlxyXG4gICAgdmFsdWUyICYmXHJcbiAgICAhTnVtYmVyLmlzTmFOKE51bWJlcih2YWx1ZTEpKSAmJlxyXG4gICAgIU51bWJlci5pc05hTihOdW1iZXIodmFsdWUyKSlcclxuICApIHtcclxuICAgIHJldHVybiB2YWx1ZTEgLSB2YWx1ZTI7XHJcbiAgfVxyXG4gIC8vIE90aGVyd2lzZSwgY29tcGFyZSBhbHBoYWJldGljYWxseSBiYXNlZCBvbiBjdXJyZW50IHVzZXIgbG9jYWxlXHJcbiAgcmV0dXJuIHZhbHVlMS50b1N0cmluZygpLmxvY2FsZUNvbXBhcmUodmFsdWUyLCBuYXZpZ2F0b3IubGFuZ3VhZ2UsIHtcclxuICAgIG51bWVyaWM6IHRydWUsXHJcbiAgICBpZ25vcmVQdW5jdHVhdGlvbjogdHJ1ZSxcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYW4gQXJyYXkgb2YgY29sdW1uIGhlYWRlcnMgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxyXG4gKiB0YWJsZSBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUVsZW1lbnR9IHRhYmxlXHJcbiAqIEByZXR1cm4ge2FycmF5PEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50Pn1cclxuICovXHJcbmNvbnN0IGdldENvbHVtbkhlYWRlcnMgPSAodGFibGUpID0+IHtcclxuICBjb25zdCBoZWFkZXJzID0gc2VsZWN0KFNPUlRBQkxFX0hFQURFUiwgdGFibGUpO1xyXG4gIHJldHVybiBoZWFkZXJzLmZpbHRlcigoaGVhZGVyKSA9PiBoZWFkZXIuY2xvc2VzdChUQUJMRSkgPT09IHRhYmxlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgdGhlIGJ1dHRvbiBsYWJlbCB3aXRoaW4gdGhlIGdpdmVuIGhlYWRlciBlbGVtZW50LCByZXNldHRpbmcgaXRcclxuICogdG8gdGhlIGRlZmF1bHQgc3RhdGUgKHJlYWR5IHRvIHNvcnQgYXNjZW5kaW5nKSBpZiBpdCdzIG5vIGxvbmdlciBzb3J0ZWRcclxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXHJcbiAqL1xyXG5jb25zdCB1cGRhdGVTb3J0TGFiZWwgPSAoaGVhZGVyKSA9PiB7XHJcbiAgY29uc3QgaGVhZGVyTmFtZSA9IGhlYWRlci5pbm5lclRleHQ7XHJcbiAgY29uc3Qgc29ydGVkQXNjZW5kaW5nID0gaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkc7XHJcbiAgY29uc3QgaXNTb3J0ZWQgPVxyXG4gICAgaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkcgfHxcclxuICAgIGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gREVTQ0VORElORyB8fFxyXG4gICAgZmFsc2U7XHJcbiAgY29uc3QgaGVhZGVyTGFiZWwgPSBgJHtoZWFkZXJOYW1lfSwgc29ydGFibGUgY29sdW1uLCBjdXJyZW50bHkgJHtcclxuICAgIGlzU29ydGVkXHJcbiAgICAgID8gYCR7c29ydGVkQXNjZW5kaW5nID8gYHNvcnRlZCAke0FTQ0VORElOR31gIDogYHNvcnRlZCAke0RFU0NFTkRJTkd9YH1gXHJcbiAgICAgIDogXCJ1bnNvcnRlZFwiXHJcbiAgfWA7XHJcbiAgY29uc3QgaGVhZGVyQnV0dG9uTGFiZWwgPSBgQ2xpY2sgdG8gc29ydCBieSAke2hlYWRlck5hbWV9IGluICR7XHJcbiAgICBzb3J0ZWRBc2NlbmRpbmcgPyBERVNDRU5ESU5HIDogQVNDRU5ESU5HXHJcbiAgfSBvcmRlci5gO1xyXG4gIGhlYWRlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGhlYWRlckxhYmVsKTtcclxuICBoZWFkZXIucXVlcnlTZWxlY3RvcihTT1JUX0JVVFRPTikuc2V0QXR0cmlidXRlKFwidGl0bGVcIiwgaGVhZGVyQnV0dG9uTGFiZWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZSB0aGUgYXJpYS1zb3J0IGF0dHJpYnV0ZSBvbiB0aGUgZ2l2ZW4gaGVhZGVyIGVsZW1lbnQsIGFuZCByZXNldCB0aGUgbGFiZWwgYW5kIGJ1dHRvbiBpY29uXHJcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxyXG4gKi9cclxuY29uc3QgdW5zZXRTb3J0ID0gKGhlYWRlcikgPT4ge1xyXG4gIGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoU09SVEVEKTtcclxuICB1cGRhdGVTb3J0TGFiZWwoaGVhZGVyKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0IHJvd3MgZWl0aGVyIGFzY2VuZGluZyBvciBkZXNjZW5kaW5nLCBiYXNlZCBvbiBhIGdpdmVuIGhlYWRlcidzIGFyaWEtc29ydCBhdHRyaWJ1dGVcclxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNBc2NlbmRpbmdcclxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZVxyXG4gKi9cclxuY29uc3Qgc29ydFJvd3MgPSAoaGVhZGVyLCBpc0FzY2VuZGluZykgPT4ge1xyXG4gIGhlYWRlci5zZXRBdHRyaWJ1dGUoU09SVEVELCBpc0FzY2VuZGluZyA9PT0gdHJ1ZSA/IERFU0NFTkRJTkcgOiBBU0NFTkRJTkcpO1xyXG4gIHVwZGF0ZVNvcnRMYWJlbChoZWFkZXIpO1xyXG5cclxuICBjb25zdCB0Ym9keSA9IGhlYWRlci5jbG9zZXN0KFRBQkxFKS5xdWVyeVNlbGVjdG9yKFwidGJvZHlcIik7XHJcblxyXG4gIC8vIFdlIGNhbiB1c2UgQXJyYXkuZnJvbSgpIGFuZCBBcnJheS5zb3J0KCkgaW5zdGVhZCBvbmNlIHdlIGRyb3AgSUUxMSBzdXBwb3J0LCBsaWtlbHkgaW4gdGhlIHN1bW1lciBvZiAyMDIxXHJcbiAgLy9cclxuICAvLyBBcnJheS5mcm9tKHRib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RyJykuc29ydChcclxuICAvLyAgIGNvbXBhcmVGdW5jdGlvbihcclxuICAvLyAgICAgQXJyYXkuZnJvbShoZWFkZXIucGFyZW50Tm9kZS5jaGlsZHJlbikuaW5kZXhPZihoZWFkZXIpLFxyXG4gIC8vICAgICAhaXNBc2NlbmRpbmcpXHJcbiAgLy8gICApXHJcbiAgLy8gLmZvckVhY2godHIgPT4gdGJvZHkuYXBwZW5kQ2hpbGQodHIpICk7XHJcblxyXG4gIC8vIFtdLnNsaWNlLmNhbGwoKSB0dXJucyBhcnJheS1saWtlIHNldHMgaW50byB0cnVlIGFycmF5cyBzbyB0aGF0IHdlIGNhbiBzb3J0IHRoZW1cclxuICBjb25zdCBhbGxSb3dzID0gW10uc2xpY2UuY2FsbCh0Ym9keS5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIikpO1xyXG4gIGNvbnN0IGFsbEhlYWRlcnMgPSBbXS5zbGljZS5jYWxsKGhlYWRlci5wYXJlbnROb2RlLmNoaWxkcmVuKTtcclxuICBjb25zdCB0aGlzSGVhZGVySW5kZXggPSBhbGxIZWFkZXJzLmluZGV4T2YoaGVhZGVyKTtcclxuICBhbGxSb3dzLnNvcnQoY29tcGFyZUZ1bmN0aW9uKHRoaXNIZWFkZXJJbmRleCwgIWlzQXNjZW5kaW5nKSkuZm9yRWFjaCgodHIpID0+IHtcclxuICAgIFtdLnNsaWNlXHJcbiAgICAgIC5jYWxsKHRyLmNoaWxkcmVuKVxyXG4gICAgICAuZm9yRWFjaCgodGQpID0+IHRkLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc29ydC1hY3RpdmVcIikpO1xyXG4gICAgdHIuY2hpbGRyZW5bdGhpc0hlYWRlckluZGV4XS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXNvcnQtYWN0aXZlXCIsIHRydWUpO1xyXG4gICAgdGJvZHkuYXBwZW5kQ2hpbGQodHIpO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgdGhlIGxpdmUgcmVnaW9uIGltbWVkaWF0ZWx5IGZvbGxvd2luZyB0aGUgdGFibGUgd2hlbmV2ZXIgc29ydCBjaGFuZ2VzLlxyXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUVsZW1lbnR9IHRhYmxlXHJcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IHNvcnRlZEhlYWRlclxyXG4gKi9cclxuXHJcbmNvbnN0IHVwZGF0ZUxpdmVSZWdpb24gPSAodGFibGUsIHNvcnRlZEhlYWRlcikgPT4ge1xyXG4gIGNvbnN0IGNhcHRpb24gPSB0YWJsZS5xdWVyeVNlbGVjdG9yKFwiY2FwdGlvblwiKS5pbm5lclRleHQ7XHJcbiAgY29uc3Qgc29ydGVkQXNjZW5kaW5nID0gc29ydGVkSGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkc7XHJcbiAgY29uc3QgaGVhZGVyTGFiZWwgPSBzb3J0ZWRIZWFkZXIuaW5uZXJUZXh0O1xyXG4gIGNvbnN0IGxpdmVSZWdpb24gPSB0YWJsZS5uZXh0RWxlbWVudFNpYmxpbmc7XHJcbiAgaWYgKGxpdmVSZWdpb24gJiYgbGl2ZVJlZ2lvbi5tYXRjaGVzKEFOTk9VTkNFTUVOVF9SRUdJT04pKSB7XHJcbiAgICBjb25zdCBzb3J0QW5ub3VuY2VtZW50ID0gYFRoZSB0YWJsZSBuYW1lZCBcIiR7Y2FwdGlvbn1cIiBpcyBub3cgc29ydGVkIGJ5ICR7aGVhZGVyTGFiZWx9IGluICR7XHJcbiAgICAgIHNvcnRlZEFzY2VuZGluZyA/IEFTQ0VORElORyA6IERFU0NFTkRJTkdcclxuICAgIH0gb3JkZXIuYDtcclxuICAgIGxpdmVSZWdpb24uaW5uZXJUZXh0ID0gc29ydEFubm91bmNlbWVudDtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgVGFibGUgY29udGFpbmluZyBhIHNvcnRhYmxlIGNvbHVtbiBoZWFkZXIgaXMgbm90IGZvbGxvd2VkIGJ5IGFuIGFyaWEtbGl2ZSByZWdpb24uYFxyXG4gICAgKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVG9nZ2xlIGEgaGVhZGVyJ3Mgc29ydCBzdGF0ZSwgb3B0aW9uYWxseSBwcm92aWRpbmcgYSB0YXJnZXRcclxuICogc3RhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxyXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBpc0FzY2VuZGluZyBJZiBubyBzdGF0ZSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnRcclxuICogc3RhdGUgd2lsbCBiZSB0b2dnbGVkIChmcm9tIGZhbHNlIHRvIHRydWUsIGFuZCB2aWNlLXZlcnNhKS5cclxuICovXHJcbmNvbnN0IHRvZ2dsZVNvcnQgPSAoaGVhZGVyLCBpc0FzY2VuZGluZykgPT4ge1xyXG4gIGNvbnN0IHRhYmxlID0gaGVhZGVyLmNsb3Nlc3QoVEFCTEUpO1xyXG4gIGxldCBzYWZlQXNjZW5kaW5nID0gaXNBc2NlbmRpbmc7XHJcbiAgaWYgKHR5cGVvZiBzYWZlQXNjZW5kaW5nICE9PSBcImJvb2xlYW5cIikge1xyXG4gICAgc2FmZUFzY2VuZGluZyA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gQVNDRU5ESU5HO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF0YWJsZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke1NPUlRBQkxFX0hFQURFUn0gaXMgbWlzc2luZyBvdXRlciAke1RBQkxFfWApO1xyXG4gIH1cclxuXHJcbiAgc2FmZUFzY2VuZGluZyA9IHNvcnRSb3dzKGhlYWRlciwgaXNBc2NlbmRpbmcpO1xyXG5cclxuICBpZiAoc2FmZUFzY2VuZGluZykge1xyXG4gICAgZ2V0Q29sdW1uSGVhZGVycyh0YWJsZSkuZm9yRWFjaCgob3RoZXJIZWFkZXIpID0+IHtcclxuICAgICAgaWYgKG90aGVySGVhZGVyICE9PSBoZWFkZXIpIHtcclxuICAgICAgICB1bnNldFNvcnQob3RoZXJIZWFkZXIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZUxpdmVSZWdpb24odGFibGUsIGhlYWRlcik7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqKiBJbnNlcnRzIGEgYnV0dG9uIHdpdGggaWNvbiBpbnNpZGUgYSBzb3J0YWJsZSBoZWFkZXJcclxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXHJcbiAqL1xyXG5cclxuY29uc3QgY3JlYXRlSGVhZGVyQnV0dG9uID0gKGhlYWRlcikgPT4ge1xyXG4gIGNvbnN0IGJ1dHRvbkVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICBidXR0b25FbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XHJcbiAgYnV0dG9uRWwuY2xhc3NMaXN0LmFkZChTT1JUX0JVVFRPTl9DTEFTUyk7XHJcbiAgLy8gSUNPTl9TT1VSQ0VcclxuICBidXR0b25FbC5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBcclxuICA8c3ZnIGNsYXNzPVwiJHtQUkVGSVh9LWljb25cIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxyXG4gICAgPGcgY2xhc3M9XCJkZXNjZW5kaW5nXCIgZmlsbD1cInRyYW5zcGFyZW50XCI+XHJcbiAgICAgIDxwYXRoIGQ9XCJNMTcgMTdMMTUuNTkgMTUuNTlMMTIuOTk5OSAxOC4xN1YySDEwLjk5OTlWMTguMTdMOC40MSAxNS41OEw3IDE3TDExLjk5OTkgMjJMMTcgMTdaXCIgLz5cclxuICAgIDwvZz5cclxuICAgIDxnIGNsYXNzPVwiYXNjZW5kaW5nXCIgZmlsbD1cInRyYW5zcGFyZW50XCI+XHJcbiAgICAgIDxwYXRoIHRyYW5zZm9ybT1cInJvdGF0ZSgxODAsIDEyLCAxMilcIiBkPVwiTTE3IDE3TDE1LjU5IDE1LjU5TDEyLjk5OTkgMTguMTdWMkgxMC45OTk5VjE4LjE3TDguNDEgMTUuNThMNyAxN0wxMS45OTk5IDIyTDE3IDE3WlwiIC8+XHJcbiAgICA8L2c+XHJcbiAgICA8ZyBjbGFzcz1cInVuc29ydGVkXCIgZmlsbD1cInRyYW5zcGFyZW50XCI+XHJcbiAgICAgIDxwb2x5Z29uIHBvaW50cz1cIjE1LjE3IDE1IDEzIDE3LjE3IDEzIDYuODMgMTUuMTcgOSAxNi41OCA3LjU5IDEyIDMgNy40MSA3LjU5IDguODMgOSAxMSA2LjgzIDExIDE3LjE3IDguODMgMTUgNy40MiAxNi40MSAxMiAyMSAxNi41OSAxNi40MSAxNS4xNyAxNVwiLz5cclxuICAgIDwvZz5cclxuICA8L3N2Zz5cclxuICBgO1xyXG4gIGhlYWRlci5hcHBlbmRDaGlsZChidXR0b25FbCk7XHJcbiAgdXBkYXRlU29ydExhYmVsKGhlYWRlcik7XHJcbn07XHJcblxyXG5jb25zdCB0YWJsZSA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIFtDTElDS106IHtcclxuICAgICAgW1NPUlRfQlVUVE9OXShldmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdG9nZ2xlU29ydChcclxuICAgICAgICAgIGV2ZW50LnRhcmdldC5jbG9zZXN0KFNPUlRBQkxFX0hFQURFUiksXHJcbiAgICAgICAgICBldmVudC50YXJnZXQuY2xvc2VzdChTT1JUQUJMRV9IRUFERVIpLmdldEF0dHJpYnV0ZShTT1JURUQpID09PVxyXG4gICAgICAgICAgICBBU0NFTkRJTkdcclxuICAgICAgICApO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHtcclxuICAgIGluaXQocm9vdCkge1xyXG4gICAgICBjb25zdCBzb3J0YWJsZUhlYWRlcnMgPSBzZWxlY3QoU09SVEFCTEVfSEVBREVSLCByb290KTtcclxuICAgICAgc29ydGFibGVIZWFkZXJzLmZvckVhY2goKGhlYWRlcikgPT4gY3JlYXRlSGVhZGVyQnV0dG9uKGhlYWRlcikpO1xyXG5cclxuICAgICAgY29uc3QgZmlyc3RTb3J0ZWQgPSBzb3J0YWJsZUhlYWRlcnMuZmlsdGVyKFxyXG4gICAgICAgIChoZWFkZXIpID0+XHJcbiAgICAgICAgICBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IEFTQ0VORElORyB8fFxyXG4gICAgICAgICAgaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBERVNDRU5ESU5HXHJcbiAgICAgIClbMF07XHJcbiAgICAgIGlmICh0eXBlb2YgZmlyc3RTb3J0ZWQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAvLyBubyBzb3J0YWJsZSBoZWFkZXJzIGZvdW5kXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHNvcnREaXIgPSBmaXJzdFNvcnRlZC5nZXRBdHRyaWJ1dGUoU09SVEVEKTtcclxuICAgICAgaWYgKHNvcnREaXIgPT09IEFTQ0VORElORykge1xyXG4gICAgICAgIHRvZ2dsZVNvcnQoZmlyc3RTb3J0ZWQsIHRydWUpO1xyXG4gICAgICB9IGVsc2UgaWYgKHNvcnREaXIgPT09IERFU0NFTkRJTkcpIHtcclxuICAgICAgICB0b2dnbGVTb3J0KGZpcnN0U29ydGVkLCBmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBUQUJMRSxcclxuICAgIFNPUlRBQkxFX0hFQURFUixcclxuICAgIFNPUlRfQlVUVE9OLFxyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdGFibGU7XHJcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5jb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcbmNvbnN0IHtcclxuICBDT01CT19CT1hfQ0xBU1MsXHJcbiAgZW5oYW5jZUNvbWJvQm94LFxyXG59ID0gcmVxdWlyZShcIi4uLy4uL3VzYS1jb21iby1ib3gvc3JjL2luZGV4XCIpO1xyXG5cclxuY29uc3QgVElNRV9QSUNLRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LXRpbWUtcGlja2VyYDtcclxuY29uc3QgVElNRV9QSUNLRVIgPSBgLiR7VElNRV9QSUNLRVJfQ0xBU1N9YDtcclxuY29uc3QgTUFYX1RJTUUgPSA2MCAqIDI0IC0gMTtcclxuY29uc3QgTUlOX1RJTUUgPSAwO1xyXG5jb25zdCBERUZBVUxUX1NURVAgPSAzMDtcclxuY29uc3QgTUlOX1NURVAgPSAxO1xyXG5cclxuY29uc3QgRklMVEVSX0RBVEFTRVQgPSB7XHJcbiAgZmlsdGVyOlxyXG4gICAgXCIwP3t7IGhvdXJRdWVyeUZpbHRlciB9fTp7e21pbnV0ZVF1ZXJ5RmlsdGVyfX0uKnt7IGFwUXVlcnlGaWx0ZXIgfX1tP1wiLFxyXG4gIGFwUXVlcnlGaWx0ZXI6IFwiKFthcF0pXCIsXHJcbiAgaG91clF1ZXJ5RmlsdGVyOiBcIihbMS05XVswLTJdPylcIixcclxuICBtaW51dGVRdWVyeUZpbHRlcjogXCJbXFxcXGRdKzooWzAtOV17MCwyfSlcIixcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQYXJzZSBhIHN0cmluZyBvZiBoaDptbSBpbnRvIG1pbnV0ZXNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHRpbWVTdHIgdGhlIHRpbWUgc3RyaW5nIHRvIHBhcnNlXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgbWludXRlc1xyXG4gKi9cclxuY29uc3QgcGFyc2VUaW1lU3RyaW5nID0gKHRpbWVTdHIpID0+IHtcclxuICBsZXQgbWludXRlcztcclxuXHJcbiAgaWYgKHRpbWVTdHIpIHtcclxuICAgIGNvbnN0IFtob3VycywgbWluc10gPSB0aW1lU3RyLnNwbGl0KFwiOlwiKS5tYXAoKHN0cikgPT4ge1xyXG4gICAgICBsZXQgdmFsdWU7XHJcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KHN0ciwgMTApO1xyXG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB2YWx1ZSA9IHBhcnNlZDtcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGhvdXJzICE9IG51bGwgJiYgbWlucyAhPSBudWxsKSB7XHJcbiAgICAgIG1pbnV0ZXMgPSBob3VycyAqIDYwICsgbWlucztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBtaW51dGVzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVuaGFuY2UgYW4gaW5wdXQgd2l0aCB0aGUgZGF0ZSBwaWNrZXIgZWxlbWVudHNcclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgVGhlIGluaXRpYWwgd3JhcHBpbmcgZWxlbWVudCBvZiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XHJcbiAqL1xyXG5jb25zdCB0cmFuc2Zvcm1UaW1lUGlja2VyID0gKGVsKSA9PiB7XHJcbiAgY29uc3QgdGltZVBpY2tlckVsID0gZWwuY2xvc2VzdChUSU1FX1BJQ0tFUik7XHJcblxyXG4gIGNvbnN0IGluaXRpYWxJbnB1dEVsID0gdGltZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoYGlucHV0YCk7XHJcblxyXG4gIGlmICghaW5pdGlhbElucHV0RWwpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgJHtUSU1FX1BJQ0tFUn0gaXMgbWlzc2luZyBpbm5lciBpbnB1dGApO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VsZWN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpO1xyXG5cclxuICBbXHJcbiAgICBcImlkXCIsXHJcbiAgICBcIm5hbWVcIixcclxuICAgIFwicmVxdWlyZWRcIixcclxuICAgIFwiYXJpYS1sYWJlbFwiLFxyXG4gICAgXCJhcmlhLWxhYmVsbGVkYnlcIixcclxuICAgIFwiZGlzYWJsZWRcIixcclxuICAgIFwiYXJpYS1kaXNhYmxlZFwiLFxyXG4gIF0uZm9yRWFjaCgobmFtZSkgPT4ge1xyXG4gICAgaWYgKGluaXRpYWxJbnB1dEVsLmhhc0F0dHJpYnV0ZShuYW1lKSkge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxJbnB1dEVsLmdldEF0dHJpYnV0ZShuYW1lKTtcclxuICAgICAgc2VsZWN0RWwuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcclxuICAgICAgaW5pdGlhbElucHV0RWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBwYWRaZXJvcyA9ICh2YWx1ZSwgbGVuZ3RoKSA9PiBgMDAwMCR7dmFsdWV9YC5zbGljZSgtbGVuZ3RoKTtcclxuXHJcbiAgY29uc3QgZ2V0VGltZUNvbnRleHQgPSAobWludXRlcykgPT4ge1xyXG4gICAgY29uc3QgbWludXRlID0gbWludXRlcyAlIDYwO1xyXG4gICAgY29uc3QgaG91cjI0ID0gTWF0aC5mbG9vcihtaW51dGVzIC8gNjApO1xyXG4gICAgY29uc3QgaG91cjEyID0gaG91cjI0ICUgMTIgfHwgMTI7XHJcbiAgICBjb25zdCBhbXBtID0gaG91cjI0IDwgMTIgPyBcImFtXCIgOiBcInBtXCI7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbWludXRlLFxyXG4gICAgICBob3VyMjQsXHJcbiAgICAgIGhvdXIxMixcclxuICAgICAgYW1wbSxcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWluVGltZSA9IE1hdGgubWF4KFxyXG4gICAgTUlOX1RJTUUsXHJcbiAgICBwYXJzZVRpbWVTdHJpbmcodGltZVBpY2tlckVsLmRhdGFzZXQubWluVGltZSkgfHwgTUlOX1RJTUVcclxuICApO1xyXG4gIGNvbnN0IG1heFRpbWUgPSBNYXRoLm1pbihcclxuICAgIE1BWF9USU1FLFxyXG4gICAgcGFyc2VUaW1lU3RyaW5nKHRpbWVQaWNrZXJFbC5kYXRhc2V0Lm1heFRpbWUpIHx8IE1BWF9USU1FXHJcbiAgKTtcclxuICBjb25zdCBzdGVwID0gTWF0aC5mbG9vcihcclxuICAgIE1hdGgubWF4KE1JTl9TVEVQLCB0aW1lUGlja2VyRWwuZGF0YXNldC5zdGVwIHx8IERFRkFVTFRfU1RFUClcclxuICApO1xyXG5cclxuICBsZXQgZGVmYXVsdFZhbHVlO1xyXG4gIGZvciAobGV0IHRpbWUgPSBtaW5UaW1lOyB0aW1lIDw9IG1heFRpbWU7IHRpbWUgKz0gc3RlcCkge1xyXG4gICAgY29uc3QgeyBtaW51dGUsIGhvdXIyNCwgaG91cjEyLCBhbXBtIH0gPSBnZXRUaW1lQ29udGV4dCh0aW1lKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xyXG4gICAgb3B0aW9uLnZhbHVlID0gYCR7cGFkWmVyb3MoaG91cjI0LCAyKX06JHtwYWRaZXJvcyhtaW51dGUsIDIpfWA7XHJcbiAgICBvcHRpb24udGV4dCA9IGAke2hvdXIxMn06JHtwYWRaZXJvcyhtaW51dGUsIDIpfSR7YW1wbX1gO1xyXG4gICAgaWYgKG9wdGlvbi50ZXh0ID09PSBpbml0aWFsSW5wdXRFbC52YWx1ZSkge1xyXG4gICAgICBkZWZhdWx0VmFsdWUgPSBvcHRpb24udmFsdWU7XHJcbiAgICB9XHJcbiAgICBzZWxlY3RFbC5hcHBlbmRDaGlsZChvcHRpb24pO1xyXG4gIH1cclxuXHJcbiAgdGltZVBpY2tlckVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX0NMQVNTKTtcclxuXHJcbiAgLy8gY29tYm8gYm94IHByb3BlcnRpZXNcclxuICBPYmplY3Qua2V5cyhGSUxURVJfREFUQVNFVCkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICB0aW1lUGlja2VyRWwuZGF0YXNldFtrZXldID0gRklMVEVSX0RBVEFTRVRba2V5XTtcclxuICB9KTtcclxuICB0aW1lUGlja2VyRWwuZGF0YXNldC5kaXNhYmxlRmlsdGVyaW5nID0gXCJ0cnVlXCI7XHJcbiAgdGltZVBpY2tlckVsLmRhdGFzZXQuZGVmYXVsdFZhbHVlID0gZGVmYXVsdFZhbHVlO1xyXG5cclxuICB0aW1lUGlja2VyRWwuYXBwZW5kQ2hpbGQoc2VsZWN0RWwpO1xyXG4gIGluaXRpYWxJbnB1dEVsLnJlbW92ZSgpO1xyXG59O1xyXG5cclxuY29uc3QgdGltZVBpY2tlciA9IGJlaGF2aW9yKFxyXG4gIHt9LFxyXG4gIHtcclxuICAgIGluaXQocm9vdCkge1xyXG4gICAgICBzZWxlY3RPck1hdGNoZXMoVElNRV9QSUNLRVIsIHJvb3QpLmZvckVhY2goKHRpbWVQaWNrZXJFbCkgPT4ge1xyXG4gICAgICAgIHRyYW5zZm9ybVRpbWVQaWNrZXIodGltZVBpY2tlckVsKTtcclxuICAgICAgICBlbmhhbmNlQ29tYm9Cb3godGltZVBpY2tlckVsKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgRklMVEVSX0RBVEFTRVQsXHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0aW1lUGlja2VyO1xyXG4iLCIvLyBUb29sdGlwc1xyXG5jb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XHJcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xyXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xyXG5jb25zdCBpc0VsZW1lbnRJblZpZXdwb3J0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0XCIpO1xyXG5cclxuY29uc3QgVE9PTFRJUCA9IGAuJHtQUkVGSVh9LXRvb2x0aXBgO1xyXG5jb25zdCBUT09MVElQX1RSSUdHRVIgPSBgLiR7UFJFRklYfS10b29sdGlwX190cmlnZ2VyYDtcclxuY29uc3QgVE9PTFRJUF9UUklHR0VSX0NMQVNTID0gYCR7UFJFRklYfS10b29sdGlwX190cmlnZ2VyYDtcclxuY29uc3QgVE9PTFRJUF9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcGA7XHJcbmNvbnN0IFRPT0xUSVBfQk9EWV9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcF9fYm9keWA7XHJcbmNvbnN0IFNFVF9DTEFTUyA9IFwiaXMtc2V0XCI7XHJcbmNvbnN0IFZJU0lCTEVfQ0xBU1MgPSBcImlzLXZpc2libGVcIjtcclxuY29uc3QgVFJJQU5HTEVfU0laRSA9IDU7XHJcbmNvbnN0IEFESlVTVF9XSURUSF9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcF9fYm9keS0td3JhcGA7XHJcblxyXG4vKipcclxuICpcclxuICogQHBhcmFtIHtET01FbGVtZW50fSB0cmlnZ2VyIC0gVGhlIHRvb2x0aXAgdHJpZ2dlclxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBFbGVtZW50cyBmb3IgaW5pdGlhbGl6ZWQgdG9vbHRpcDsgaW5jbHVkZXMgdHJpZ2dlciwgd3JhcHBlciwgYW5kIGJvZHlcclxuICovXHJcbmNvbnN0IGdldFRvb2x0aXBFbGVtZW50cyA9ICh0cmlnZ2VyKSA9PiB7XHJcbiAgY29uc3Qgd3JhcHBlciA9IHRyaWdnZXIucGFyZW50Tm9kZTtcclxuICBjb25zdCBib2R5ID0gd3JhcHBlci5xdWVyeVNlbGVjdG9yKGAuJHtUT09MVElQX0JPRFlfQ0xBU1N9YCk7XHJcblxyXG4gIHJldHVybiB7IHRyaWdnZXIsIHdyYXBwZXIsIGJvZHkgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTaG93cyB0aGUgdG9vbHRpcFxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0b29sdGlwVHJpZ2dlciAtIHRoZSBlbGVtZW50IHRoYXQgaW5pdGlhbGl6ZXMgdGhlIHRvb2x0aXBcclxuICovXHJcbmNvbnN0IHNob3dUb29sVGlwID0gKHRvb2x0aXBCb2R5LCB0b29sdGlwVHJpZ2dlciwgcG9zaXRpb24pID0+IHtcclxuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcImZhbHNlXCIpO1xyXG5cclxuICAvLyBUaGlzIHNldHMgdXAgdGhlIHRvb2x0aXAgYm9keS4gVGhlIG9wYWNpdHkgaXMgMCwgYnV0XHJcbiAgLy8gd2UgY2FuIGJlZ2luIHJ1bm5pbmcgdGhlIGNhbGN1bGF0aW9ucyBiZWxvdy5cclxuICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKFNFVF9DTEFTUyk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvc2l0aW9uIHRoZSB0b29sdGlwIGJvZHkgd2hlbiB0aGUgdHJpZ2dlciBpcyBob3ZlcmVkXHJcbiAgICogUmVtb3ZlcyBvbGQgcG9zaXRpb25pbmcgY2xhc3NuYW1lcyBhbmQgcmVhcHBsaWVzLiBUaGlzIGFsbG93c1xyXG4gICAqIHBvc2l0aW9uaW5nIHRvIGNoYW5nZSBpbiBjYXNlIHRoZSB1c2VyIHJlc2l6ZXMgYnJvd3NlciBvciBET00gbWFuaXB1bGF0aW9uXHJcbiAgICogY2F1c2VzIHRvb2x0aXAgdG8gZ2V0IGNsaXBwZWQgZnJvbSB2aWV3cG9ydFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNldFBvcyAtIGNhbiBiZSBcInRvcFwiLCBcImJvdHRvbVwiLCBcInJpZ2h0XCIsIFwibGVmdFwiXHJcbiAgICovXHJcbiAgY29uc3Qgc2V0UG9zaXRpb25DbGFzcyA9IChzZXRQb3MpID0+IHtcclxuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoYCR7VE9PTFRJUF9CT0RZX0NMQVNTfS0tdG9wYCk7XHJcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLWJvdHRvbWApO1xyXG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS1yaWdodGApO1xyXG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS1sZWZ0YCk7XHJcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLSR7c2V0UG9zfWApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgb2xkIHBvc2l0aW9uaW5nIHN0eWxlcy4gVGhpcyBhbGxvd3NcclxuICAgKiByZS1wb3NpdGlvbmluZyB0byBjaGFuZ2Ugd2l0aG91dCBpbmhlcml0aW5nIG90aGVyXHJcbiAgICogZHluYW1pYyBzdHlsZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcclxuICAgKi9cclxuICBjb25zdCByZXNldFBvc2l0aW9uU3R5bGVzID0gKGUpID0+IHtcclxuICAgIC8vIHdlIGRvbid0IG92ZXJyaWRlIGFueXRoaW5nIGluIHRoZSBzdHlsZXNoZWV0IHdoZW4gZmluZGluZyBhbHQgcG9zaXRpb25zXHJcbiAgICBlLnN0eWxlLnRvcCA9IG51bGw7XHJcbiAgICBlLnN0eWxlLmJvdHRvbSA9IG51bGw7XHJcbiAgICBlLnN0eWxlLnJpZ2h0ID0gbnVsbDtcclxuICAgIGUuc3R5bGUubGVmdCA9IG51bGw7XHJcbiAgICBlLnN0eWxlLm1hcmdpbiA9IG51bGw7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogZ2V0IG1hcmdpbiBvZmZzZXQgY2FsY3VsYXRpb25zXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlWYWx1ZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxyXG4gICAqL1xyXG5cclxuICBjb25zdCBvZmZzZXRNYXJnaW4gPSAodGFyZ2V0LCBwcm9wZXJ0eVZhbHVlKSA9PlxyXG4gICAgcGFyc2VJbnQoXHJcbiAgICAgIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eVZhbHVlKSxcclxuICAgICAgMTBcclxuICAgICk7XHJcblxyXG4gIC8vIG9mZnNldExlZnQgPSB0aGUgbGVmdCBwb3NpdGlvbiwgYW5kIG1hcmdpbiBvZiB0aGUgZWxlbWVudCwgdGhlIGxlZnRcclxuICAvLyBwYWRkaW5nLCBzY3JvbGxiYXIgYW5kIGJvcmRlciBvZiB0aGUgb2Zmc2V0UGFyZW50IGVsZW1lbnRcclxuICAvLyBvZmZzZXRXaWR0aCA9IFRoZSBvZmZzZXRXaWR0aCBwcm9wZXJ0eSByZXR1cm5zIHRoZSB2aWV3YWJsZSB3aWR0aCBvZiBhblxyXG4gIC8vIGVsZW1lbnQgaW4gcGl4ZWxzLCBpbmNsdWRpbmcgcGFkZGluZywgYm9yZGVyIGFuZCBzY3JvbGxiYXIsIGJ1dCBub3RcclxuICAvLyB0aGUgbWFyZ2luLlxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUgbWFyZ2luIG9mZnNldFxyXG4gICAqIHRvb2x0aXAgdHJpZ2dlciBtYXJnaW4ocG9zaXRpb24pIG9mZnNldCArIHRvb2x0aXBCb2R5IG9mZnNldFdpZHRoXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1hcmdpblBvc2l0aW9uXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRvb2x0aXBCb2R5T2Zmc2V0XHJcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdHJpZ2dlclxyXG4gICAqL1xyXG4gIGNvbnN0IGNhbGN1bGF0ZU1hcmdpbk9mZnNldCA9IChcclxuICAgIG1hcmdpblBvc2l0aW9uLFxyXG4gICAgdG9vbHRpcEJvZHlPZmZzZXQsXHJcbiAgICB0cmlnZ2VyXHJcbiAgKSA9PiB7XHJcbiAgICBjb25zdCBvZmZzZXQgPVxyXG4gICAgICBvZmZzZXRNYXJnaW4odHJpZ2dlciwgYG1hcmdpbi0ke21hcmdpblBvc2l0aW9ufWApID4gMFxyXG4gICAgICAgID8gdG9vbHRpcEJvZHlPZmZzZXQgLSBvZmZzZXRNYXJnaW4odHJpZ2dlciwgYG1hcmdpbi0ke21hcmdpblBvc2l0aW9ufWApXHJcbiAgICAgICAgOiB0b29sdGlwQm9keU9mZnNldDtcclxuXHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvc2l0aW9ucyB0b29sdGlwIGF0IHRoZSB0b3BcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XHJcbiAgICovXHJcbiAgY29uc3QgcG9zaXRpb25Ub3AgPSAoZSkgPT4ge1xyXG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTsgLy8gZW5zdXJlcyB3ZSBzdGFydCBmcm9tIHRoZSBzYW1lIHBvaW50XHJcbiAgICAvLyBnZXQgZGV0YWlscyBvbiB0aGUgZWxlbWVudHMgb2JqZWN0IHdpdGhcclxuXHJcbiAgICBjb25zdCB0b3BNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXHJcbiAgICAgIFwidG9wXCIsXHJcbiAgICAgIGUub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICB0b29sdGlwVHJpZ2dlclxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBsZWZ0TWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxyXG4gICAgICBcImxlZnRcIixcclxuICAgICAgZS5vZmZzZXRXaWR0aCxcclxuICAgICAgdG9vbHRpcFRyaWdnZXJcclxuICAgICk7XHJcblxyXG4gICAgc2V0UG9zaXRpb25DbGFzcyhcInRvcFwiKTtcclxuICAgIGUuc3R5bGUubGVmdCA9IGA1MCVgOyAvLyBjZW50ZXIgdGhlIGVsZW1lbnRcclxuICAgIGUuc3R5bGUudG9wID0gYC0ke1RSSUFOR0xFX1NJWkV9cHhgOyAvLyBjb25zaWRlciB0aGUgcHNldWRvIGVsZW1lbnRcclxuICAgIC8vIGFwcGx5IG91ciBtYXJnaW5zIGJhc2VkIG9uIHRoZSBvZmZzZXRcclxuICAgIGUuc3R5bGUubWFyZ2luID0gYC0ke3RvcE1hcmdpbn1weCAwIDAgLSR7bGVmdE1hcmdpbiAvIDJ9cHhgO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvc2l0aW9ucyB0b29sdGlwIGF0IHRoZSBib3R0b21cclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XHJcbiAgICovXHJcbiAgY29uc3QgcG9zaXRpb25Cb3R0b20gPSAoZSkgPT4ge1xyXG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTtcclxuXHJcbiAgICBjb25zdCBsZWZ0TWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxyXG4gICAgICBcImxlZnRcIixcclxuICAgICAgZS5vZmZzZXRXaWR0aCxcclxuICAgICAgdG9vbHRpcFRyaWdnZXJcclxuICAgICk7XHJcblxyXG4gICAgc2V0UG9zaXRpb25DbGFzcyhcImJvdHRvbVwiKTtcclxuICAgIGUuc3R5bGUubGVmdCA9IGA1MCVgO1xyXG4gICAgZS5zdHlsZS5tYXJnaW4gPSBgJHtUUklBTkdMRV9TSVpFfXB4IDAgMCAtJHtsZWZ0TWFyZ2luIC8gMn1weGA7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUG9zaXRpb25zIHRvb2x0aXAgYXQgdGhlIHJpZ2h0XHJcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxyXG4gICAqL1xyXG4gIGNvbnN0IHBvc2l0aW9uUmlnaHQgPSAoZSkgPT4ge1xyXG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTtcclxuXHJcbiAgICBjb25zdCB0b3BNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXHJcbiAgICAgIFwidG9wXCIsXHJcbiAgICAgIGUub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICB0b29sdGlwVHJpZ2dlclxyXG4gICAgKTtcclxuXHJcbiAgICBzZXRQb3NpdGlvbkNsYXNzKFwicmlnaHRcIik7XHJcbiAgICBlLnN0eWxlLnRvcCA9IGA1MCVgO1xyXG4gICAgZS5zdHlsZS5sZWZ0ID0gYCR7XHJcbiAgICAgIHRvb2x0aXBUcmlnZ2VyLm9mZnNldExlZnQgKyB0b29sdGlwVHJpZ2dlci5vZmZzZXRXaWR0aCArIFRSSUFOR0xFX1NJWkVcclxuICAgIH1weGA7XHJcbiAgICBlLnN0eWxlLm1hcmdpbiA9IGAtJHt0b3BNYXJnaW4gLyAyfXB4IDAgMCAwYDtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBQb3NpdGlvbnMgdG9vbHRpcCBhdCB0aGUgcmlnaHRcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XHJcbiAgICovXHJcbiAgY29uc3QgcG9zaXRpb25MZWZ0ID0gKGUpID0+IHtcclxuICAgIHJlc2V0UG9zaXRpb25TdHlsZXMoZSk7XHJcblxyXG4gICAgY29uc3QgdG9wTWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxyXG4gICAgICBcInRvcFwiLFxyXG4gICAgICBlLm9mZnNldEhlaWdodCxcclxuICAgICAgdG9vbHRpcFRyaWdnZXJcclxuICAgICk7XHJcblxyXG4gICAgLy8gd2UgaGF2ZSB0byBjaGVjayBmb3Igc29tZSB1dGlsaXR5IG1hcmdpbnNcclxuICAgIGNvbnN0IGxlZnRNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXHJcbiAgICAgIFwibGVmdFwiLFxyXG4gICAgICB0b29sdGlwVHJpZ2dlci5vZmZzZXRMZWZ0ID4gZS5vZmZzZXRXaWR0aFxyXG4gICAgICAgID8gdG9vbHRpcFRyaWdnZXIub2Zmc2V0TGVmdCAtIGUub2Zmc2V0V2lkdGhcclxuICAgICAgICA6IGUub2Zmc2V0V2lkdGgsXHJcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXHJcbiAgICApO1xyXG5cclxuICAgIHNldFBvc2l0aW9uQ2xhc3MoXCJsZWZ0XCIpO1xyXG4gICAgZS5zdHlsZS50b3AgPSBgNTAlYDtcclxuICAgIGUuc3R5bGUubGVmdCA9IGAtJHtUUklBTkdMRV9TSVpFfXB4YDtcclxuICAgIGUuc3R5bGUubWFyZ2luID0gYC0ke3RvcE1hcmdpbiAvIDJ9cHggMCAwICR7XHJcbiAgICAgIHRvb2x0aXBUcmlnZ2VyLm9mZnNldExlZnQgPiBlLm9mZnNldFdpZHRoID8gbGVmdE1hcmdpbiA6IC1sZWZ0TWFyZ2luXHJcbiAgICB9cHhgOyAvLyBhZGp1c3QgdGhlIG1hcmdpblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFdlIHRyeSB0byBzZXQgdGhlIHBvc2l0aW9uIGJhc2VkIG9uIHRoZVxyXG4gICAqIG9yaWdpbmFsIGludGVudGlvbiwgYnV0IG1ha2UgYWRqdXN0bWVudHNcclxuICAgKiBpZiB0aGUgZWxlbWVudCBpcyBjbGlwcGVkIG91dCBvZiB0aGUgdmlld3BvcnRcclxuICAgKiB3ZSBjb25zdHJhaW4gdGhlIHdpZHRoIG9ubHkgYXMgYSBsYXN0IHJlc29ydFxyXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQoYWxpYXMgdG9vbHRpcEJvZHkpXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGF0dGVtcHQgKC0tZmxhZylcclxuICAgKi9cclxuXHJcbiAgY29uc3QgbWF4QXR0ZW1wdHMgPSAyO1xyXG5cclxuICBmdW5jdGlvbiBmaW5kQmVzdFBvc2l0aW9uKGVsZW1lbnQsIGF0dGVtcHQgPSAxKSB7XHJcbiAgICAvLyBjcmVhdGUgYXJyYXkgb2Ygb3B0aW9uYWwgcG9zaXRpb25zXHJcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBbXHJcbiAgICAgIHBvc2l0aW9uVG9wLFxyXG4gICAgICBwb3NpdGlvbkJvdHRvbSxcclxuICAgICAgcG9zaXRpb25SaWdodCxcclxuICAgICAgcG9zaXRpb25MZWZ0LFxyXG4gICAgXTtcclxuXHJcbiAgICBsZXQgaGFzVmlzaWJsZVBvc2l0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgLy8gd2UgdGFrZSBhIHJlY3Vyc2l2ZSBhcHByb2FjaFxyXG4gICAgZnVuY3Rpb24gdHJ5UG9zaXRpb25zKGkpIHtcclxuICAgICAgaWYgKGkgPCBwb3NpdGlvbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc3QgcG9zID0gcG9zaXRpb25zW2ldO1xyXG4gICAgICAgIHBvcyhlbGVtZW50KTtcclxuXHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cclxuICAgICAgICAgIHRyeVBvc2l0aW9ucygoaSArPSAxKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGhhc1Zpc2libGVQb3NpdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5UG9zaXRpb25zKDApO1xyXG4gICAgLy8gaWYgd2UgY2FuJ3QgZmluZCBhIHBvc2l0aW9uIHdlIGNvbXByZXNzIGl0IGFuZCB0cnkgYWdhaW5cclxuICAgIGlmICghaGFzVmlzaWJsZVBvc2l0aW9uKSB7XHJcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChBREpVU1RfV0lEVEhfQ0xBU1MpO1xyXG4gICAgICBpZiAoYXR0ZW1wdCA8PSBtYXhBdHRlbXB0cykge1xyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxyXG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24oZWxlbWVudCwgKGF0dGVtcHQgKz0gMSkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XHJcbiAgICBjYXNlIFwidG9wXCI6XHJcbiAgICAgIHBvc2l0aW9uVG9wKHRvb2x0aXBCb2R5KTtcclxuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xyXG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImJvdHRvbVwiOlxyXG4gICAgICBwb3NpdGlvbkJvdHRvbSh0b29sdGlwQm9keSk7XHJcbiAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0b29sdGlwQm9keSkpIHtcclxuICAgICAgICBmaW5kQmVzdFBvc2l0aW9uKHRvb2x0aXBCb2R5KTtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJyaWdodFwiOlxyXG4gICAgICBwb3NpdGlvblJpZ2h0KHRvb2x0aXBCb2R5KTtcclxuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xyXG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImxlZnRcIjpcclxuICAgICAgcG9zaXRpb25MZWZ0KHRvb2x0aXBCb2R5KTtcclxuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xyXG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vIHNraXAgZGVmYXVsdCBjYXNlXHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWN0dWFsbHkgc2hvdyB0aGUgdG9vbHRpcC4gVGhlIFZJU0lCTEVfQ0xBU1NcclxuICAgKiB3aWxsIGNoYW5nZSB0aGUgb3BhY2l0eSB0byAxXHJcbiAgICovXHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKFZJU0lCTEVfQ0xBU1MpO1xyXG4gIH0sIDIwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCB0aGUgcHJvcGVydGllcyB0byBzaG93IGFuZCBwb3NpdGlvbiB0aGUgdG9vbHRpcCxcclxuICogYW5kIHJlc2V0cyB0aGUgdG9vbHRpcCBwb3NpdGlvbiB0byB0aGUgb3JpZ2luYWwgaW50ZW50aW9uXHJcbiAqIGluIGNhc2UgdGhlIHdpbmRvdyBpcyByZXNpemVkIG9yIHRoZSBlbGVtZW50IGlzIG1vdmVkIHRocm91Z2hcclxuICogRE9NIG1hbmlwdWxhdGlvbi5cclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdG9vbHRpcEJvZHkgLSBUaGUgYm9keSBvZiB0aGUgdG9vbHRpcFxyXG4gKi9cclxuY29uc3QgaGlkZVRvb2xUaXAgPSAodG9vbHRpcEJvZHkpID0+IHtcclxuICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKFZJU0lCTEVfQ0xBU1MpO1xyXG4gIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoU0VUX0NMQVNTKTtcclxuICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKEFESlVTVF9XSURUSF9DTEFTUyk7XHJcbiAgdG9vbHRpcEJvZHkuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHVwIHRoZSB0b29sdGlwIGNvbXBvbmVudFxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0b29sdGlwVHJpZ2dlciBUaGUgZWxlbWVudCB0aGF0IGNyZWF0ZXMgdGhlIHRvb2x0aXBcclxuICovXHJcbmNvbnN0IHNldFVwQXR0cmlidXRlcyA9ICh0b29sdGlwVHJpZ2dlcikgPT4ge1xyXG4gIGNvbnN0IHRvb2x0aXBJRCA9IGB0b29sdGlwLSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogOTAwMDAwKSArIDEwMDAwMH1gO1xyXG4gIGNvbnN0IHRvb2x0aXBDb250ZW50ID0gdG9vbHRpcFRyaWdnZXIuZ2V0QXR0cmlidXRlKFwidGl0bGVcIik7XHJcbiAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIGNvbnN0IHRvb2x0aXBCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgY29uc3QgYWRkaXRpb25hbENsYXNzZXMgPSB0b29sdGlwVHJpZ2dlci5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNsYXNzZXNcIik7XHJcbiAgbGV0IHBvc2l0aW9uID0gdG9vbHRpcFRyaWdnZXIuZ2V0QXR0cmlidXRlKFwiZGF0YS1wb3NpdGlvblwiKTtcclxuXHJcbiAgLy8gQXBwbHkgZGVmYXVsdCBwb3NpdGlvbiBpZiBub3Qgc2V0IGFzIGF0dHJpYnV0ZVxyXG4gIGlmICghcG9zaXRpb24pIHtcclxuICAgIHBvc2l0aW9uID0gXCJ0b3BcIjtcclxuICAgIHRvb2x0aXBUcmlnZ2VyLnNldEF0dHJpYnV0ZShcImRhdGEtcG9zaXRpb25cIiwgcG9zaXRpb24pO1xyXG4gIH1cclxuXHJcbiAgLy8gU2V0IHVwIHRvb2x0aXAgYXR0cmlidXRlc1xyXG4gIHRvb2x0aXBUcmlnZ2VyLnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgdG9vbHRpcElEKTtcclxuICB0b29sdGlwVHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XHJcbiAgdG9vbHRpcFRyaWdnZXIucmVtb3ZlQXR0cmlidXRlKFwidGl0bGVcIik7XHJcbiAgdG9vbHRpcFRyaWdnZXIuY2xhc3NMaXN0LnJlbW92ZShUT09MVElQX0NMQVNTKTtcclxuICB0b29sdGlwVHJpZ2dlci5jbGFzc0xpc3QuYWRkKFRPT0xUSVBfVFJJR0dFUl9DTEFTUyk7XHJcblxyXG4gIC8vIGluc2VydCB3cmFwcGVyIGJlZm9yZSBlbCBpbiB0aGUgRE9NIHRyZWVcclxuICB0b29sdGlwVHJpZ2dlci5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh3cmFwcGVyLCB0b29sdGlwVHJpZ2dlcik7XHJcblxyXG4gIC8vIHNldCB1cCB0aGUgd3JhcHBlclxyXG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQodG9vbHRpcFRyaWdnZXIpO1xyXG4gIHdyYXBwZXIuY2xhc3NMaXN0LmFkZChUT09MVElQX0NMQVNTKTtcclxuICB3cmFwcGVyLmFwcGVuZENoaWxkKHRvb2x0aXBCb2R5KTtcclxuXHJcbiAgLy8gQXBwbHkgYWRkaXRpb25hbCBjbGFzcyBuYW1lcyB0byB3cmFwcGVyIGVsZW1lbnRcclxuICBpZiAoYWRkaXRpb25hbENsYXNzZXMpIHtcclxuICAgIGNvbnN0IGNsYXNzZXNBcnJheSA9IGFkZGl0aW9uYWxDbGFzc2VzLnNwbGl0KFwiIFwiKTtcclxuICAgIGNsYXNzZXNBcnJheS5mb3JFYWNoKChjbGFzc25hbWUpID0+IHdyYXBwZXIuY2xhc3NMaXN0LmFkZChjbGFzc25hbWUpKTtcclxuICB9XHJcblxyXG4gIC8vIHNldCB1cCB0aGUgdG9vbHRpcCBib2R5XHJcbiAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LmFkZChUT09MVElQX0JPRFlfQ0xBU1MpO1xyXG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcImlkXCIsIHRvb2x0aXBJRCk7XHJcbiAgdG9vbHRpcEJvZHkuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInRvb2x0aXBcIik7XHJcbiAgdG9vbHRpcEJvZHkuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG5cclxuICAvLyBwbGFjZSB0aGUgdGV4dCBpbiB0aGUgdG9vbHRpcFxyXG4gIHRvb2x0aXBCb2R5LnRleHRDb250ZW50ID0gdG9vbHRpcENvbnRlbnQ7XHJcblxyXG4gIHJldHVybiB7IHRvb2x0aXBCb2R5LCBwb3NpdGlvbiwgdG9vbHRpcENvbnRlbnQsIHdyYXBwZXIgfTtcclxufTtcclxuXHJcbi8vIFNldHVwIG91ciBmdW5jdGlvbiB0byBydW4gb24gdmFyaW91cyBldmVudHNcclxuY29uc3QgdG9vbHRpcCA9IGJlaGF2aW9yKFxyXG4gIHtcclxuICAgIFwibW91c2VvdmVyIGZvY3VzaW5cIjoge1xyXG4gICAgICBbVE9PTFRJUF0oZSkge1xyXG4gICAgICAgIGNvbnN0IHRyaWdnZXIgPSBlLnRhcmdldDtcclxuICAgICAgICBjb25zdCBlbGVtZW50VHlwZSA9IHRyaWdnZXIubm9kZU5hbWU7XHJcblxyXG4gICAgICAgIC8vIEluaXRpYWxpemUgdG9vbHRpcCBpZiBpdCBoYXNuJ3QgYWxyZWFkeVxyXG4gICAgICAgIGlmIChlbGVtZW50VHlwZSA9PT0gXCJCVVRUT05cIiAmJiB0cmlnZ2VyLmhhc0F0dHJpYnV0ZShcInRpdGxlXCIpKSB7XHJcbiAgICAgICAgICBzZXRVcEF0dHJpYnV0ZXModHJpZ2dlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBbVE9PTFRJUF9UUklHR0VSXShlKSB7XHJcbiAgICAgICAgY29uc3QgeyB0cmlnZ2VyLCBib2R5IH0gPSBnZXRUb29sdGlwRWxlbWVudHMoZS50YXJnZXQpO1xyXG5cclxuICAgICAgICBzaG93VG9vbFRpcChib2R5LCB0cmlnZ2VyLCB0cmlnZ2VyLmRhdGFzZXQucG9zaXRpb24pO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIFwibW91c2VvdXQgZm9jdXNvdXRcIjoge1xyXG4gICAgICBbVE9PTFRJUF9UUklHR0VSXShlKSB7XHJcbiAgICAgICAgY29uc3QgeyBib2R5IH0gPSBnZXRUb29sdGlwRWxlbWVudHMoZS50YXJnZXQpO1xyXG5cclxuICAgICAgICBoaWRlVG9vbFRpcChib2R5KTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpbml0KHJvb3QpIHtcclxuICAgICAgc2VsZWN0T3JNYXRjaGVzKFRPT0xUSVAsIHJvb3QpLmZvckVhY2goKHRvb2x0aXBUcmlnZ2VyKSA9PiB7XHJcbiAgICAgICAgc2V0VXBBdHRyaWJ1dGVzKHRvb2x0aXBUcmlnZ2VyKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgc2V0dXA6IHNldFVwQXR0cmlidXRlcyxcclxuICAgIGdldFRvb2x0aXBFbGVtZW50cyxcclxuICAgIHNob3c6IHNob3dUb29sVGlwLFxyXG4gICAgaGlkZTogaGlkZVRvb2xUaXAsXHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0b29sdGlwO1xyXG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcclxuY29uc3QgdmFsaWRhdGUgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdmFsaWRhdGUtaW5wdXRcIik7XHJcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XHJcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcclxuXHJcbmNvbnN0IFZBTElEQVRFX0lOUFVUID0gXCJpbnB1dFtkYXRhLXZhbGlkYXRpb24tZWxlbWVudF1cIjtcclxuY29uc3QgQ0hFQ0tMSVNUX0lURU0gPSBgLiR7UFJFRklYfS1jaGVja2xpc3RfX2l0ZW1gO1xyXG5cclxuLy8gVHJpZ2dlciB2YWxpZGF0aW9uIG9uIGlucHV0IGNoYW5nZVxyXG5jb25zdCBoYW5kbGVDaGFuZ2UgPSAoZWwpID0+IHZhbGlkYXRlKGVsKTtcclxuXHJcbi8vIENyZWF0ZSBjb250YWluZXIgdG8gaG9sZCBhcmlhIHJlYWRvdXRcclxuY29uc3QgY3JlYXRlU3RhdHVzRWxlbWVudCA9IChpbnB1dCkgPT4ge1xyXG4gIGNvbnN0IHZhbGlkYXRpb25Db250YWluZXIgPSBpbnB1dC5wYXJlbnROb2RlO1xyXG4gIGNvbnN0IGlucHV0SUQgPSBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcclxuICBjb25zdCBzdGF0dXNTdW1tYXJ5SUQgPSBgJHtpbnB1dElEfS1zci1zdW1tYXJ5YDtcclxuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIHN0YXR1c1N1bW1hcnlJRCk7XHJcblxyXG4gIGNvbnN0IHN0YXR1c1N1bW1hcnlDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuXHJcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbGlkYXRpb24tc3RhdHVzXCIsIFwiXCIpO1xyXG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuY2xhc3NMaXN0LmFkZChcInVzYS1zci1vbmx5XCIpO1xyXG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1saXZlXCIsIFwicG9saXRlXCIpO1xyXG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1hdG9taWNcIiwgdHJ1ZSk7XHJcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBzdGF0dXNTdW1tYXJ5SUQpO1xyXG4gIHZhbGlkYXRpb25Db250YWluZXIuYXBwZW5kKHN0YXR1c1N1bW1hcnlDb250YWluZXIpO1xyXG59O1xyXG5cclxuLy8gU2V0IHVwIGNoZWNrbGlzdCBpdGVtcyB3aXRoIGluaXRpYWwgYXJpYS1sYWJlbCAoaW5jb21wbGV0ZSkgdmFsdWVzXHJcbmNvbnN0IGNyZWF0ZUluaXRpYWxTdGF0dXMgPSAoaW5wdXQpID0+IHtcclxuICBjb25zdCB2YWxpZGF0aW9uQ29udGFpbmVyID0gaW5wdXQucGFyZW50Tm9kZTtcclxuICBjb25zdCBjaGVja2xpc3RJdGVtcyA9IHZhbGlkYXRpb25Db250YWluZXIucXVlcnlTZWxlY3RvckFsbChDSEVDS0xJU1RfSVRFTSk7XHJcbiAgY29uc3QgdmFsaWRhdGlvbkVsZW1lbnQgPSBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbGlkYXRpb24tZWxlbWVudFwiKTtcclxuXHJcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCB2YWxpZGF0aW9uRWxlbWVudCk7XHJcblxyXG4gIGNoZWNrbGlzdEl0ZW1zLmZvckVhY2goKGxpc3RJdGVtKSA9PiB7XHJcbiAgICBsZXQgY3VycmVudFN0YXR1cyA9IFwic3RhdHVzIGluY29tcGxldGVcIjtcclxuICAgIGlmIChpbnB1dC5oYXNBdHRyaWJ1dGUoXCJkYXRhLXZhbGlkYXRpb24taW5jb21wbGV0ZVwiKSkge1xyXG4gICAgICBjdXJyZW50U3RhdHVzID0gaW5wdXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWxpZGF0aW9uLWluY29tcGxldGVcIik7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpdGVtU3RhdHVzID0gYCR7bGlzdEl0ZW0udGV4dENvbnRlbnR9ICR7Y3VycmVudFN0YXR1c30gYDtcclxuICAgIGxpc3RJdGVtLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcclxuICAgIGxpc3RJdGVtLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgaXRlbVN0YXR1cyk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5jb25zdCBlbmhhbmNlVmFsaWRhdGlvbiA9IChpbnB1dCkgPT4ge1xyXG4gIGNyZWF0ZVN0YXR1c0VsZW1lbnQoaW5wdXQpO1xyXG4gIGNyZWF0ZUluaXRpYWxTdGF0dXMoaW5wdXQpO1xyXG59O1xyXG5cclxuY29uc3QgdmFsaWRhdG9yID0gYmVoYXZpb3IoXHJcbiAge1xyXG4gICAgXCJpbnB1dCBjaGFuZ2VcIjoge1xyXG4gICAgICBbVkFMSURBVEVfSU5QVVRdKGV2ZW50KSB7XHJcbiAgICAgICAgaGFuZGxlQ2hhbmdlKGV2ZW50LnRhcmdldCk7XHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaW5pdChyb290KSB7XHJcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhWQUxJREFURV9JTlBVVCwgcm9vdCkuZm9yRWFjaCgoaW5wdXQpID0+XHJcbiAgICAgICAgZW5oYW5jZVZhbGlkYXRpb24oaW5wdXQpXHJcbiAgICAgICk7XHJcbiAgICB9LFxyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICBwcmVmaXg6IFwidXNhXCIsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIC8vIFRoaXMgdXNlZCB0byBiZSBjb25kaXRpb25hbGx5IGRlcGVuZGVudCBvbiB3aGV0aGVyIHRoZVxyXG4gIC8vIGJyb3dzZXIgc3VwcG9ydGVkIHRvdWNoIGV2ZW50czsgaWYgaXQgZGlkLCBgQ0xJQ0tgIHdhcyBzZXQgdG9cclxuICAvLyBgdG91Y2hzdGFydGAuICBIb3dldmVyLCB0aGlzIGhhZCBkb3duc2lkZXM6XHJcbiAgLy9cclxuICAvLyAqIEl0IHByZS1lbXB0ZWQgbW9iaWxlIGJyb3dzZXJzJyBkZWZhdWx0IGJlaGF2aW9yIG9mIGRldGVjdGluZ1xyXG4gIC8vICAgd2hldGhlciBhIHRvdWNoIHR1cm5lZCBpbnRvIGEgc2Nyb2xsLCB0aGVyZWJ5IHByZXZlbnRpbmdcclxuICAvLyAgIHVzZXJzIGZyb20gdXNpbmcgc29tZSBvZiBvdXIgY29tcG9uZW50cyBhcyBzY3JvbGwgc3VyZmFjZXMuXHJcbiAgLy9cclxuICAvLyAqIFNvbWUgZGV2aWNlcywgc3VjaCBhcyB0aGUgTWljcm9zb2Z0IFN1cmZhY2UgUHJvLCBzdXBwb3J0ICpib3RoKlxyXG4gIC8vICAgdG91Y2ggYW5kIGNsaWNrcy4gVGhpcyBtZWFudCB0aGUgY29uZGl0aW9uYWwgZWZmZWN0aXZlbHkgZHJvcHBlZFxyXG4gIC8vICAgc3VwcG9ydCBmb3IgdGhlIHVzZXIncyBtb3VzZSwgZnJ1c3RyYXRpbmcgdXNlcnMgd2hvIHByZWZlcnJlZFxyXG4gIC8vICAgaXQgb24gdGhvc2Ugc3lzdGVtcy5cclxuICBDTElDSzogXCJjbGlja1wiLFxyXG59O1xyXG4iLCJjb25zdCBhY2NvcmRpb24gPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWFjY29yZGlvbi9zcmMvaW5kZXhcIik7XHJcbmNvbnN0IGJhbm5lciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtYmFubmVyL3NyYy9pbmRleFwiKTtcclxuY29uc3QgYnV0dG9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1idXR0b24vc3JjL2luZGV4XCIpO1xyXG5jb25zdCBjaGFyYWN0ZXJDb3VudCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtY2hhcmFjdGVyLWNvdW50L3NyYy9pbmRleFwiKTtcclxuY29uc3QgY29tYm9Cb3ggPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWNvbWJvLWJveC9zcmMvaW5kZXhcIik7XHJcbmNvbnN0IGRhdGVQaWNrZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWRhdGUtcGlja2VyL3NyYy9pbmRleFwiKTtcclxuY29uc3QgZGF0ZVJhbmdlUGlja2VyID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1kYXRlLXJhbmdlLXBpY2tlci9zcmMvaW5kZXhcIik7XHJcbmNvbnN0IGZpbGVJbnB1dCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZmlsZS1pbnB1dC9zcmMvaW5kZXhcIik7XHJcbmNvbnN0IGZvb3RlciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZm9vdGVyL3NyYy9pbmRleFwiKTtcclxuY29uc3QgaW5QYWdlTmF2aWdhdGlvbiA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtaW4tcGFnZS1uYXZpZ2F0aW9uL3NyYy9pbmRleFwiKTtcclxuY29uc3QgaW5wdXRNYXNrID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1pbnB1dC1tYXNrL3NyYy9pbmRleFwiKTtcclxuY29uc3QgbGFuZ3VhZ2VTZWxlY3RvciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtbGFuZ3VhZ2Utc2VsZWN0b3Ivc3JjL2luZGV4XCIpO1xyXG5jb25zdCBtb2RhbCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtbW9kYWwvc3JjL2luZGV4XCIpO1xyXG5jb25zdCBuYXZpZ2F0aW9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1oZWFkZXIvc3JjL2luZGV4XCIpO1xyXG5jb25zdCBwYXNzd29yZCA9IHJlcXVpcmUoXCIuLi8uLi8uLi9fdXNhLXBhc3N3b3JkL3NyYy9pbmRleFwiKTtcclxuY29uc3QgcmFuZ2UgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXJhbmdlL3NyYy9pbmRleFwiKTtcclxuY29uc3Qgc2VhcmNoID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1zZWFyY2gvc3JjL2luZGV4XCIpO1xyXG5jb25zdCBza2lwbmF2ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1za2lwbmF2L3NyYy9pbmRleFwiKTtcclxuY29uc3QgdGFibGUgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXRhYmxlL3NyYy9pbmRleFwiKTtcclxuY29uc3QgdGltZVBpY2tlciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtdGltZS1waWNrZXIvc3JjL2luZGV4XCIpO1xyXG5jb25zdCB0b29sdGlwID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10b29sdGlwL3NyYy9pbmRleFwiKTtcclxuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS12YWxpZGF0aW9uL3NyYy9pbmRleFwiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGFjY29yZGlvbixcclxuICBiYW5uZXIsXHJcbiAgYnV0dG9uLFxyXG4gIGNoYXJhY3RlckNvdW50LFxyXG4gIGNvbWJvQm94LFxyXG4gIGRhdGVQaWNrZXIsXHJcbiAgZGF0ZVJhbmdlUGlja2VyLFxyXG4gIGZpbGVJbnB1dCxcclxuICBmb290ZXIsXHJcbiAgaW5QYWdlTmF2aWdhdGlvbixcclxuICBpbnB1dE1hc2ssXHJcbiAgbGFuZ3VhZ2VTZWxlY3RvcixcclxuICBtb2RhbCxcclxuICBuYXZpZ2F0aW9uLFxyXG4gIHBhc3N3b3JkLFxyXG4gIHJhbmdlLFxyXG4gIHNlYXJjaCxcclxuICBza2lwbmF2LFxyXG4gIHRhYmxlLFxyXG4gIHRpbWVQaWNrZXIsXHJcbiAgdG9vbHRpcCxcclxuICB2YWxpZGF0b3IsXHJcbn07XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXHJcbi8qIGVzbGludC1kaXNhYmxlIGZ1bmMtbmFtZXMgKi9cclxuKGZ1bmN0aW9uICgpIHtcclxuICBpZiAodHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGZ1bmN0aW9uIEN1c3RvbUV2ZW50KGV2ZW50LCBfcGFyYW1zKSB7XHJcbiAgICBjb25zdCBwYXJhbXMgPSBfcGFyYW1zIHx8IHtcclxuICAgICAgYnViYmxlczogZmFsc2UsXHJcbiAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxyXG4gICAgICBkZXRhaWw6IG51bGwsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcclxuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoXHJcbiAgICAgIGV2ZW50LFxyXG4gICAgICBwYXJhbXMuYnViYmxlcyxcclxuICAgICAgcGFyYW1zLmNhbmNlbGFibGUsXHJcbiAgICAgIHBhcmFtcy5kZXRhaWxcclxuICAgICk7XHJcbiAgICByZXR1cm4gZXZ0O1xyXG4gIH1cclxuXHJcbiAgd2luZG93LkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XHJcbn0pKCk7XHJcbiIsImNvbnN0IGVscHJvdG8gPSB3aW5kb3cuSFRNTEVsZW1lbnQucHJvdG90eXBlO1xyXG5jb25zdCBISURERU4gPSBcImhpZGRlblwiO1xyXG5cclxuaWYgKCEoSElEREVOIGluIGVscHJvdG8pKSB7XHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVscHJvdG8sIEhJRERFTiwge1xyXG4gICAgZ2V0KCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoSElEREVOKTtcclxuICAgIH0sXHJcbiAgICBzZXQodmFsdWUpIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSElEREVOLCBcIlwiKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShISURERU4pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH0pO1xyXG59XHJcbiIsIi8vIHBvbHlmaWxscyBIVE1MRWxlbWVudC5wcm90b3R5cGUuY2xhc3NMaXN0IGFuZCBET01Ub2tlbkxpc3RcclxucmVxdWlyZShcImNsYXNzbGlzdC1wb2x5ZmlsbFwiKTtcclxuLy8gcG9seWZpbGxzIEhUTUxFbGVtZW50LnByb3RvdHlwZS5oaWRkZW5cclxucmVxdWlyZShcIi4vZWxlbWVudC1oaWRkZW5cIik7XHJcbi8vIHBvbHlmaWxscyBOdW1iZXIuaXNOYU4oKVxyXG5yZXF1aXJlKFwiLi9udW1iZXItaXMtbmFuXCIpO1xyXG4vLyBwb2x5ZmlsbHMgQ3VzdG9tRXZlbnRcclxucmVxdWlyZShcIi4vY3VzdG9tLWV2ZW50XCIpO1xyXG4vLyBwb2x5ZmlsbHMgc3ZnNGV2ZXJ5Ym9keVxyXG5yZXF1aXJlKFwiLi9zdmc0ZXZlcnlib2R5XCIpO1xyXG4iLCJOdW1iZXIuaXNOYU4gPVxyXG4gIE51bWJlci5pc05hTiB8fFxyXG4gIGZ1bmN0aW9uIGlzTmFOKGlucHV0KSB7XHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2VsZi1jb21wYXJlXHJcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSBcIm51bWJlclwiICYmIGlucHV0ICE9PSBpbnB1dDtcclxuICB9O1xyXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG4hKGZ1bmN0aW9uIChmYWN0b3J5KSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XHJcbn0pKGZ1bmN0aW9uICgpIHtcclxuICAvKiEgc3ZnNGV2ZXJ5Ym9keSB2Mi4xLjkgfCBnaXRodWIuY29tL2pvbmF0aGFudG5lYWwvc3ZnNGV2ZXJ5Ym9keSAqL1xyXG4gIGZ1bmN0aW9uIGVtYmVkKHBhcmVudCwgc3ZnLCB0YXJnZXQsIHVzZSkge1xyXG4gICAgLy8gaWYgdGhlIHRhcmdldCBleGlzdHNcclxuICAgIGlmICh0YXJnZXQpIHtcclxuICAgICAgLy8gY3JlYXRlIGEgZG9jdW1lbnQgZnJhZ21lbnQgdG8gaG9sZCB0aGUgY29udGVudHMgb2YgdGhlIHRhcmdldFxyXG4gICAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXHJcbiAgICAgICAgdmlld0JveCA9XHJcbiAgICAgICAgICAhc3ZnLmhhc0F0dHJpYnV0ZShcInZpZXdCb3hcIikgJiYgdGFyZ2V0LmdldEF0dHJpYnV0ZShcInZpZXdCb3hcIik7XHJcbiAgICAgIC8vIGNvbmRpdGlvbmFsbHkgc2V0IHRoZSB2aWV3Qm94IG9uIHRoZSBzdmdcclxuICAgICAgdmlld0JveCAmJiBzdmcuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCB2aWV3Qm94KTtcclxuICAgICAgLy8gY29weSB0aGUgY29udGVudHMgb2YgdGhlIGNsb25lIGludG8gdGhlIGZyYWdtZW50XHJcbiAgICAgIGZvciAoXHJcbiAgICAgICAgLy8gY2xvbmUgdGhlIHRhcmdldFxyXG4gICAgICAgIHZhciBjbG9uZSA9IGRvY3VtZW50LmltcG9ydE5vZGVcclxuICAgICAgICAgICAgPyBkb2N1bWVudC5pbXBvcnROb2RlKHRhcmdldCwgITApXHJcbiAgICAgICAgICAgIDogdGFyZ2V0LmNsb25lTm9kZSghMCksXHJcbiAgICAgICAgICBnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFxyXG4gICAgICAgICAgICBzdmcubmFtZXNwYWNlVVJJIHx8IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcclxuICAgICAgICAgICAgXCJnXCJcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgY2xvbmUuY2hpbGROb2Rlcy5sZW5ndGg7XHJcblxyXG4gICAgICApIHtcclxuICAgICAgICBnLmFwcGVuZENoaWxkKGNsb25lLmZpcnN0Q2hpbGQpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh1c2UpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgdXNlLmF0dHJpYnV0ZXMubGVuZ3RoID4gaTsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgYXR0ciA9IHVzZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgXCJ4bGluazpocmVmXCIgIT09IGF0dHIubmFtZSAmJlxyXG4gICAgICAgICAgICBcImhyZWZcIiAhPT0gYXR0ci5uYW1lICYmXHJcbiAgICAgICAgICAgIGcuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGcpLCAvLyBhcHBlbmQgdGhlIGZyYWdtZW50IGludG8gdGhlIHN2Z1xyXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIGxvYWRyZWFkeXN0YXRlY2hhbmdlKHhociwgdXNlKSB7XHJcbiAgICAvLyBsaXN0ZW4gdG8gY2hhbmdlcyBpbiB0aGUgcmVxdWVzdFxyXG4gICAgKHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIGlmIHRoZSByZXF1ZXN0IGlzIHJlYWR5XHJcbiAgICAgIGlmICg0ID09PSB4aHIucmVhZHlTdGF0ZSkge1xyXG4gICAgICAgIC8vIGdldCB0aGUgY2FjaGVkIGh0bWwgZG9jdW1lbnRcclxuICAgICAgICB2YXIgY2FjaGVkRG9jdW1lbnQgPSB4aHIuX2NhY2hlZERvY3VtZW50O1xyXG4gICAgICAgIC8vIGVuc3VyZSB0aGUgY2FjaGVkIGh0bWwgZG9jdW1lbnQgYmFzZWQgb24gdGhlIHhociByZXNwb25zZVxyXG4gICAgICAgIGNhY2hlZERvY3VtZW50IHx8XHJcbiAgICAgICAgICAoKGNhY2hlZERvY3VtZW50ID0geGhyLl9jYWNoZWREb2N1bWVudCA9XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudChcIlwiKSksXHJcbiAgICAgICAgICAoY2FjaGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB4aHIucmVzcG9uc2VUZXh0KSwgLy8gZW5zdXJlIGRvbWFpbnMgYXJlIHRoZSBzYW1lLCBvdGhlcndpc2Ugd2UnbGwgaGF2ZSBpc3N1ZXMgYXBwZW5kaW5nIHRoZVxyXG4gICAgICAgICAgLy8gZWxlbWVudCBpbiBJRSAxMVxyXG4gICAgICAgICAgY2FjaGVkRG9jdW1lbnQuZG9tYWluICE9PSBkb2N1bWVudC5kb21haW4gJiZcclxuICAgICAgICAgICAgKGNhY2hlZERvY3VtZW50LmRvbWFpbiA9IGRvY3VtZW50LmRvbWFpbiksXHJcbiAgICAgICAgICAoeGhyLl9jYWNoZWRUYXJnZXQgPSB7fSkpLCAvLyBjbGVhciB0aGUgeGhyIGVtYmVkcyBsaXN0IGFuZCBlbWJlZCBlYWNoIGl0ZW1cclxuICAgICAgICAgIHhoci5fZW1iZWRzLnNwbGljZSgwKS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBjYWNoZWQgdGFyZ2V0XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB4aHIuX2NhY2hlZFRhcmdldFtpdGVtLmlkXTtcclxuICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBjYWNoZWQgdGFyZ2V0XHJcbiAgICAgICAgICAgIHRhcmdldCB8fFxyXG4gICAgICAgICAgICAgICh0YXJnZXQgPSB4aHIuX2NhY2hlZFRhcmdldFtpdGVtLmlkXSA9XHJcbiAgICAgICAgICAgICAgICBjYWNoZWREb2N1bWVudC5nZXRFbGVtZW50QnlJZChpdGVtLmlkKSksXHJcbiAgICAgICAgICAgICAgLy8gZW1iZWQgdGhlIHRhcmdldCBpbnRvIHRoZSBzdmdcclxuICAgICAgICAgICAgICBlbWJlZChpdGVtLnBhcmVudCwgaXRlbS5zdmcsIHRhcmdldCwgdXNlKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KSwgLy8gdGVzdCB0aGUgcmVhZHkgc3RhdGUgY2hhbmdlIGltbWVkaWF0ZWx5XHJcbiAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UoKTtcclxuICB9XHJcbiAgZnVuY3Rpb24gc3ZnNGV2ZXJ5Ym9keShyYXdvcHRzKSB7XHJcbiAgICBmdW5jdGlvbiBvbmludGVydmFsKCkge1xyXG4gICAgICAvLyBpZiBhbGwgPHVzZT5zIGluIHRoZSBhcnJheSBhcmUgYmVpbmcgYnlwYXNzZWQsIGRvbid0IHByb2NlZWQuXHJcbiAgICAgIGlmIChcclxuICAgICAgICBudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3MgJiZcclxuICAgICAgICB1c2VzLmxlbmd0aCAtIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyA8PSAwXHJcbiAgICAgICkge1xyXG4gICAgICAgIHJldHVybiB2b2lkIHJlcXVlc3RBbmltYXRpb25GcmFtZShvbmludGVydmFsLCA2Nyk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gaWYgdGhlcmUgYXJlIDx1c2U+cyB0byBwcm9jZXNzLCBwcm9jZWVkLlxyXG4gICAgICAvLyByZXNldCB0aGUgYnlwYXNzIGNvdW50ZXIsIHNpbmNlIHRoZSBjb3VudGVyIHdpbGwgYmUgaW5jcmVtZW50ZWQgZm9yIGV2ZXJ5IGJ5cGFzc2VkIGVsZW1lbnQsXHJcbiAgICAgIC8vIGV2ZW4gb25lcyB0aGF0IHdlcmUgY291bnRlZCBiZWZvcmUuXHJcbiAgICAgIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyA9IDA7XHJcbiAgICAgIC8vIHdoaWxlIHRoZSBpbmRleCBleGlzdHMgaW4gdGhlIGxpdmUgPHVzZT4gY29sbGVjdGlvblxyXG4gICAgICBmb3IgKFxyXG4gICAgICAgIC8vIGdldCB0aGUgY2FjaGVkIDx1c2U+IGluZGV4XHJcbiAgICAgICAgdmFyIGluZGV4ID0gMDtcclxuICAgICAgICBpbmRleCA8IHVzZXMubGVuZ3RoO1xyXG5cclxuICAgICAgKSB7XHJcbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IDx1c2U+XHJcbiAgICAgICAgdmFyIHVzZSA9IHVzZXNbaW5kZXhdLFxyXG4gICAgICAgICAgcGFyZW50ID0gdXNlLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICBzdmcgPSBnZXRTVkdBbmNlc3RvcihwYXJlbnQpLFxyXG4gICAgICAgICAgc3JjID0gdXNlLmdldEF0dHJpYnV0ZShcInhsaW5rOmhyZWZcIikgfHwgdXNlLmdldEF0dHJpYnV0ZShcImhyZWZcIik7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgKCFzcmMgJiZcclxuICAgICAgICAgICAgb3B0cy5hdHRyaWJ1dGVOYW1lICYmXHJcbiAgICAgICAgICAgIChzcmMgPSB1c2UuZ2V0QXR0cmlidXRlKG9wdHMuYXR0cmlidXRlTmFtZSkpLFxyXG4gICAgICAgICAgc3ZnICYmIHNyYylcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGlmIChwb2x5ZmlsbCkge1xyXG4gICAgICAgICAgICBpZiAoIW9wdHMudmFsaWRhdGUgfHwgb3B0cy52YWxpZGF0ZShzcmMsIHN2ZywgdXNlKSkge1xyXG4gICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgPHVzZT4gZWxlbWVudFxyXG4gICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh1c2UpO1xyXG4gICAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBzcmMgYW5kIGdldCB0aGUgdXJsIGFuZCBpZFxyXG4gICAgICAgICAgICAgIHZhciBzcmNTcGxpdCA9IHNyYy5zcGxpdChcIiNcIiksXHJcbiAgICAgICAgICAgICAgICB1cmwgPSBzcmNTcGxpdC5zaGlmdCgpLFxyXG4gICAgICAgICAgICAgICAgaWQgPSBzcmNTcGxpdC5qb2luKFwiI1wiKTtcclxuICAgICAgICAgICAgICAvLyBpZiB0aGUgbGluayBpcyBleHRlcm5hbFxyXG4gICAgICAgICAgICAgIGlmICh1cmwubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGNhY2hlZCB4aHIgcmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgdmFyIHhociA9IHJlcXVlc3RzW3VybF07XHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlIHhociByZXF1ZXN0IGV4aXN0c1xyXG4gICAgICAgICAgICAgICAgeGhyIHx8XHJcbiAgICAgICAgICAgICAgICAgICgoeGhyID0gcmVxdWVzdHNbdXJsXSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpKSxcclxuICAgICAgICAgICAgICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsKSxcclxuICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoKSxcclxuICAgICAgICAgICAgICAgICAgKHhoci5fZW1iZWRzID0gW10pKSwgLy8gYWRkIHRoZSBzdmcgYW5kIGlkIGFzIGFuIGl0ZW0gdG8gdGhlIHhociBlbWJlZHMgbGlzdFxyXG4gICAgICAgICAgICAgICAgICB4aHIuX2VtYmVkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCxcclxuICAgICAgICAgICAgICAgICAgICBzdmc6IHN2ZyxcclxuICAgICAgICAgICAgICAgICAgICBpZDogaWQsXHJcbiAgICAgICAgICAgICAgICAgIH0pLCAvLyBwcmVwYXJlIHRoZSB4aHIgcmVhZHkgc3RhdGUgY2hhbmdlIGV2ZW50XHJcbiAgICAgICAgICAgICAgICAgIGxvYWRyZWFkeXN0YXRlY2hhbmdlKHhociwgdXNlKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gZW1iZWQgdGhlIGxvY2FsIGlkIGludG8gdGhlIHN2Z1xyXG4gICAgICAgICAgICAgICAgZW1iZWQocGFyZW50LCBzdmcsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSwgdXNlKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gaW5jcmVhc2UgdGhlIGluZGV4IHdoZW4gdGhlIHByZXZpb3VzIHZhbHVlIHdhcyBub3QgXCJ2YWxpZFwiXHJcbiAgICAgICAgICAgICAgKytpbmRleCwgKytudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3M7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gaW5jcmVhc2UgdGhlIGluZGV4IHdoZW4gdGhlIHByZXZpb3VzIHZhbHVlIHdhcyBub3QgXCJ2YWxpZFwiXHJcbiAgICAgICAgICArK2luZGV4O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyBjb250aW51ZSB0aGUgaW50ZXJ2YWxcclxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG9uaW50ZXJ2YWwsIDY3KTtcclxuICAgIH1cclxuICAgIHZhciBwb2x5ZmlsbCxcclxuICAgICAgb3B0cyA9IE9iamVjdChyYXdvcHRzKSxcclxuICAgICAgbmV3ZXJJRVVBID0gL1xcYlRyaWRlbnRcXC9bNTY3XVxcYnxcXGJNU0lFICg/Ojl8MTApXFwuMFxcYi8sXHJcbiAgICAgIHdlYmtpdFVBID0gL1xcYkFwcGxlV2ViS2l0XFwvKFxcZCspXFxiLyxcclxuICAgICAgb2xkZXJFZGdlVUEgPSAvXFxiRWRnZVxcLzEyXFwuKFxcZCspXFxiLyxcclxuICAgICAgZWRnZVVBID0gL1xcYkVkZ2VcXC8uKFxcZCspXFxiLyxcclxuICAgICAgaW5JZnJhbWUgPSB3aW5kb3cudG9wICE9PSB3aW5kb3cuc2VsZjtcclxuICAgIHBvbHlmaWxsID1cclxuICAgICAgXCJwb2x5ZmlsbFwiIGluIG9wdHNcclxuICAgICAgICA/IG9wdHMucG9seWZpbGxcclxuICAgICAgICA6IG5ld2VySUVVQS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpIHx8XHJcbiAgICAgICAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChvbGRlckVkZ2VVQSkgfHwgW10pWzFdIDwgMTA1NDcgfHxcclxuICAgICAgICAgIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKHdlYmtpdFVBKSB8fCBbXSlbMV0gPCA1MzcgfHxcclxuICAgICAgICAgIChlZGdlVUEudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiBpbklmcmFtZSk7XHJcbiAgICAvLyBjcmVhdGUgeGhyIHJlcXVlc3RzIG9iamVjdFxyXG4gICAgdmFyIHJlcXVlc3RzID0ge30sXHJcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgc2V0VGltZW91dCxcclxuICAgICAgdXNlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidXNlXCIpLFxyXG4gICAgICBudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3MgPSAwO1xyXG4gICAgLy8gY29uZGl0aW9uYWxseSBzdGFydCB0aGUgaW50ZXJ2YWwgaWYgdGhlIHBvbHlmaWxsIGlzIGFjdGl2ZVxyXG4gICAgcG9seWZpbGwgJiYgb25pbnRlcnZhbCgpO1xyXG4gIH1cclxuICBmdW5jdGlvbiBnZXRTVkdBbmNlc3Rvcihub2RlKSB7XHJcbiAgICBmb3IgKFxyXG4gICAgICB2YXIgc3ZnID0gbm9kZTtcclxuICAgICAgXCJzdmdcIiAhPT0gc3ZnLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgJiYgKHN2ZyA9IHN2Zy5wYXJlbnROb2RlKTtcclxuXHJcbiAgICApIHt9XHJcbiAgICByZXR1cm4gc3ZnO1xyXG4gIH1cclxuICByZXR1cm4gc3ZnNGV2ZXJ5Ym9keTtcclxufSk7XHJcbiIsIndpbmRvdy51c3dkc1ByZXNlbnQgPSB0cnVlOyAvLyBHTE9CQUwgdmFyaWFibGUgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXN3ZHMuanMgaGFzIGxvYWRlZCBpbiB0aGUgRE9NLlxyXG5cclxuLyoqXHJcbiAqIFRoZSAncG9seWZpbGxzJyBkZWZpbmUga2V5IEVDTUFTY3JpcHQgNSBtZXRob2RzIHRoYXQgbWF5IGJlIG1pc3NpbmcgZnJvbVxyXG4gKiBvbGRlciBicm93c2Vycywgc28gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXHJcbiAqL1xyXG5yZXF1aXJlKFwiLi9wb2x5ZmlsbHNcIik7XHJcblxyXG5jb25zdCB1c3dkcyA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKTtcclxuXHJcbmNvbnN0IGNvbXBvbmVudHMgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcclxuY29uc3Qgc3ZnNGV2ZXJ5Ym9keSA9IHJlcXVpcmUoXCIuL3BvbHlmaWxscy9zdmc0ZXZlcnlib2R5XCIpO1xyXG5cclxudXN3ZHMuY29tcG9uZW50cyA9IGNvbXBvbmVudHM7XHJcblxyXG5jb25zdCBpbml0Q29tcG9uZW50cyA9ICgpID0+IHtcclxuICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xyXG4gIE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgY29uc3QgYmVoYXZpb3IgPSBjb21wb25lbnRzW2tleV07XHJcbiAgICBiZWhhdmlvci5vbih0YXJnZXQpO1xyXG4gIH0pO1xyXG4gIHN2ZzRldmVyeWJvZHkoKTtcclxufTtcclxuXHJcbmlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGluaXRDb21wb25lbnRzLCB7IG9uY2U6IHRydWUgfSk7XHJcbn0gZWxzZSB7XHJcbiAgaW5pdENvbXBvbmVudHMoKTtcclxufVxyXG5cclxuZXhwb3J0cy5kZWZhdWx0ID0gdXN3ZHM7XHJcbmV4cG9ydHMuaW5pdENvbXBvbmVudHMgPSBpbml0Q29tcG9uZW50cztcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoaHRtbERvY3VtZW50ID0gZG9jdW1lbnQpID0+IGh0bWxEb2N1bWVudC5hY3RpdmVFbGVtZW50O1xyXG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKFwib2JqZWN0LWFzc2lnblwiKTtcclxuY29uc3QgQmVoYXZpb3IgPSByZXF1aXJlKFwicmVjZXB0b3IvYmVoYXZpb3JcIik7XHJcblxyXG4vKipcclxuICogQG5hbWUgc2VxdWVuY2VcclxuICogQHBhcmFtIHsuLi5GdW5jdGlvbn0gc2VxIGFuIGFycmF5IG9mIGZ1bmN0aW9uc1xyXG4gKiBAcmV0dXJuIHsgY2xvc3VyZSB9IGNhbGxIb29rc1xyXG4gKi9cclxuLy8gV2UgdXNlIGEgbmFtZWQgZnVuY3Rpb24gaGVyZSBiZWNhdXNlIHdlIHdhbnQgaXQgdG8gaW5oZXJpdCBpdHMgbGV4aWNhbCBzY29wZVxyXG4vLyBmcm9tIHRoZSBiZWhhdmlvciBwcm9wcyBvYmplY3QsIG5vdCBmcm9tIHRoZSBtb2R1bGVcclxuY29uc3Qgc2VxdWVuY2UgPSAoLi4uc2VxKSA9PlxyXG4gIGZ1bmN0aW9uIGNhbGxIb29rcyh0YXJnZXQgPSBkb2N1bWVudC5ib2R5KSB7XHJcbiAgICBzZXEuZm9yRWFjaCgobWV0aG9kKSA9PiB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpc1ttZXRob2RdID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICB0aGlzW21ldGhvZF0uY2FsbCh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lIGJlaGF2aW9yXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNcclxuICogQHBhcmFtIHtvYmplY3Q/fSBwcm9wc1xyXG4gKiBAcmV0dXJuIHtyZWNlcHRvci5iZWhhdmlvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gKGV2ZW50cywgcHJvcHMpID0+XHJcbiAgQmVoYXZpb3IoXHJcbiAgICBldmVudHMsXHJcbiAgICBhc3NpZ24oXHJcbiAgICAgIHtcclxuICAgICAgICBvbjogc2VxdWVuY2UoXCJpbml0XCIsIFwiYWRkXCIpLFxyXG4gICAgICAgIG9mZjogc2VxdWVuY2UoXCJ0ZWFyZG93blwiLCBcInJlbW92ZVwiKSxcclxuICAgICAgfSxcclxuICAgICAgcHJvcHNcclxuICAgIClcclxuICApO1xyXG4iLCIvKipcclxuICogQ2FsbCBhIGZ1bmN0aW9uIGV2ZXJ5IFggYW1vdW50IG9mIG1pbGxpc2Vjb25kcy5cclxuICpcclxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBkZWJvdW5jZWRcclxuICogQHBhcmFtICB7bnVtYmVyfSBkZWxheSAtIE1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBjYWxsaW5nIGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBkZWJvdW5jZWQgZnVuY3Rpb25cclxuICogQGV4YW1wbGUgY29uc3QgdXBkYXRlU3RhdHVzID0gZGVib3VuY2UoKHN0cmluZykgPT4gY29uc29sZS5sb2coc3RyaW5nKSwgMjAwMClcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlKGNhbGxiYWNrLCBkZWxheSA9IDUwMCkge1xyXG4gIGxldCB0aW1lciA9IG51bGw7XHJcbiAgcmV0dXJuICguLi5hcmdzKSA9PiB7XHJcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH0sIGRlbGF5KTtcclxuICB9O1xyXG59O1xyXG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKFwib2JqZWN0LWFzc2lnblwiKTtcclxuY29uc3QgeyBrZXltYXAgfSA9IHJlcXVpcmUoXCJyZWNlcHRvclwiKTtcclxuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi9iZWhhdmlvclwiKTtcclxuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4vc2VsZWN0XCIpO1xyXG5jb25zdCBhY3RpdmVFbGVtZW50ID0gcmVxdWlyZShcIi4vYWN0aXZlLWVsZW1lbnRcIik7XHJcblxyXG5jb25zdCBGT0NVU0FCTEUgPVxyXG4gICdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCBbdGFiaW5kZXg9XCIwXCJdLCBbY29udGVudGVkaXRhYmxlXSc7XHJcblxyXG5jb25zdCB0YWJIYW5kbGVyID0gKGNvbnRleHQpID0+IHtcclxuICBjb25zdCBmb2N1c2FibGVFbGVtZW50cyA9IHNlbGVjdChGT0NVU0FCTEUsIGNvbnRleHQpO1xyXG4gIGNvbnN0IGZpcnN0VGFiU3RvcCA9IGZvY3VzYWJsZUVsZW1lbnRzWzBdO1xyXG4gIGNvbnN0IGxhc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoIC0gMV07XHJcblxyXG4gIC8vIFNwZWNpYWwgcnVsZXMgZm9yIHdoZW4gdGhlIHVzZXIgaXMgdGFiYmluZyBmb3J3YXJkIGZyb20gdGhlIGxhc3QgZm9jdXNhYmxlIGVsZW1lbnQsXHJcbiAgLy8gb3Igd2hlbiB0YWJiaW5nIGJhY2t3YXJkcyBmcm9tIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudFxyXG4gIGZ1bmN0aW9uIHRhYkFoZWFkKGV2ZW50KSB7XHJcbiAgICBpZiAoYWN0aXZlRWxlbWVudCgpID09PSBsYXN0VGFiU3RvcCkge1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICBmaXJzdFRhYlN0b3AuZm9jdXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRhYkJhY2soZXZlbnQpIHtcclxuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGZpcnN0VGFiU3RvcCkge1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICBsYXN0VGFiU3RvcC5mb2N1cygpO1xyXG4gICAgfVxyXG4gICAgLy8gVGhpcyBjaGVja3MgaWYgeW91IHdhbnQgdG8gc2V0IHRoZSBpbml0aWFsIGZvY3VzIHRvIGEgY29udGFpbmVyXHJcbiAgICAvLyBpbnN0ZWFkIG9mIGFuIGVsZW1lbnQgd2l0aGluLCBhbmQgdGhlIHVzZXIgdGFicyBiYWNrLlxyXG4gICAgLy8gVGhlbiB3ZSBzZXQgdGhlIGZvY3VzIHRvIHRoZSBmaXJzdFxyXG4gICAgZWxzZSBpZiAoIWZvY3VzYWJsZUVsZW1lbnRzLmluY2x1ZGVzKGFjdGl2ZUVsZW1lbnQoKSkpIHtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZmlyc3RUYWJTdG9wLFxyXG4gICAgbGFzdFRhYlN0b3AsXHJcbiAgICB0YWJBaGVhZCxcclxuICAgIHRhYkJhY2ssXHJcbiAgfTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGNvbnRleHQsIGFkZGl0aW9uYWxLZXlCaW5kaW5ncyA9IHt9KSA9PiB7XHJcbiAgY29uc3QgdGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihjb250ZXh0KTtcclxuICBjb25zdCBiaW5kaW5ncyA9IGFkZGl0aW9uYWxLZXlCaW5kaW5ncztcclxuICBjb25zdCB7IEVzYywgRXNjYXBlIH0gPSBiaW5kaW5ncztcclxuXHJcbiAgaWYgKEVzY2FwZSAmJiAhRXNjKSBiaW5kaW5ncy5Fc2MgPSBFc2NhcGU7XHJcblxyXG4gIC8vICBUT0RPOiBJbiB0aGUgZnV0dXJlLCBsb29wIG92ZXIgYWRkaXRpb25hbCBrZXliaW5kaW5ncyBhbmQgcGFzcyBhbiBhcnJheVxyXG4gIC8vIG9mIGZ1bmN0aW9ucywgaWYgbmVjZXNzYXJ5LCB0byB0aGUgbWFwIGtleXMuIFRoZW4gcGVvcGxlIGltcGxlbWVudGluZ1xyXG4gIC8vIHRoZSBmb2N1cyB0cmFwIGNvdWxkIHBhc3MgY2FsbGJhY2tzIHRvIGZpcmUgd2hlbiB0YWJiaW5nXHJcbiAgY29uc3Qga2V5TWFwcGluZ3MgPSBrZXltYXAoXHJcbiAgICBhc3NpZ24oXHJcbiAgICAgIHtcclxuICAgICAgICBUYWI6IHRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcclxuICAgICAgICBcIlNoaWZ0K1RhYlwiOiB0YWJFdmVudEhhbmRsZXIudGFiQmFjayxcclxuICAgICAgfSxcclxuICAgICAgYWRkaXRpb25hbEtleUJpbmRpbmdzXHJcbiAgICApXHJcbiAgKTtcclxuXHJcbiAgY29uc3QgZm9jdXNUcmFwID0gYmVoYXZpb3IoXHJcbiAgICB7XHJcbiAgICAgIGtleWRvd246IGtleU1hcHBpbmdzLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgaW5pdCgpIHtcclxuICAgICAgICAvLyBUT0RPOiBpcyB0aGlzIGRlc2lyZWFibGUgYmVoYXZpb3I/IFNob3VsZCB0aGUgdHJhcCBhbHdheXMgZG8gdGhpcyBieSBkZWZhdWx0IG9yIHNob3VsZFxyXG4gICAgICAgIC8vIHRoZSBjb21wb25lbnQgZ2V0dGluZyBkZWNvcmF0ZWQgaGFuZGxlIHRoaXM/XHJcbiAgICAgICAgaWYgKHRhYkV2ZW50SGFuZGxlci5maXJzdFRhYlN0b3ApIHtcclxuICAgICAgICAgIHRhYkV2ZW50SGFuZGxlci5maXJzdFRhYlN0b3AuZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHVwZGF0ZShpc0FjdGl2ZSkge1xyXG4gICAgICAgIGlmIChpc0FjdGl2ZSkge1xyXG4gICAgICAgICAgdGhpcy5vbigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLm9mZigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH1cclxuICApO1xyXG5cclxuICByZXR1cm4gZm9jdXNUcmFwO1xyXG59O1xyXG4iLCIvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNzU1NzQzM1xyXG5mdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0KFxyXG4gIGVsLFxyXG4gIHdpbiA9IHdpbmRvdyxcclxuICBkb2NFbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxyXG4pIHtcclxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICByZWN0LnRvcCA+PSAwICYmXHJcbiAgICByZWN0LmxlZnQgPj0gMCAmJlxyXG4gICAgcmVjdC5ib3R0b20gPD0gKHdpbi5pbm5lckhlaWdodCB8fCBkb2NFbC5jbGllbnRIZWlnaHQpICYmXHJcbiAgICByZWN0LnJpZ2h0IDw9ICh3aW4uaW5uZXJXaWR0aCB8fCBkb2NFbC5jbGllbnRXaWR0aClcclxuICApO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGlzRWxlbWVudEluVmlld3BvcnQ7XHJcbiIsIi8vIGlPUyBkZXRlY3Rpb24gZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvOTAzOTg4NS8xNzc3MTBcclxuZnVuY3Rpb24gaXNJb3NEZXZpY2UoKSB7XHJcbiAgcmV0dXJuIChcclxuICAgIHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC8oaVBvZHxpUGhvbmV8aVBhZCkvZykgfHxcclxuICAgICAgKG5hdmlnYXRvci5wbGF0Zm9ybSA9PT0gXCJNYWNJbnRlbFwiICYmIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDEpKSAmJlxyXG4gICAgIXdpbmRvdy5NU1N0cmVhbVxyXG4gICk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaXNJb3NEZXZpY2U7XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlICovXHJcbi8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cclxuXHJcbi8qKlxyXG4gKiBBIHNpbXBsZSBsaWJyYXJ5IHRvIGhlbHAgeW91IGVzY2FwZSBIVE1MIHVzaW5nIHRlbXBsYXRlIHN0cmluZ3MuXHJcbiAqXHJcbiAqIEl0J3MgdGhlIGNvdW50ZXJwYXJ0IHRvIG91ciBlc2xpbnQgXCJuby11bnNhZmUtaW5uZXJodG1sXCIgcGx1Z2luIHRoYXQgaGVscHMgdXNcclxuICogYXZvaWQgdW5zYWZlIGNvZGluZyBwcmFjdGljZXMuXHJcbiAqIEEgZnVsbCB3cml0ZS11cCBvZiB0aGUgSG93cyBhbmQgV2h5cyBhcmUgZG9jdW1lbnRlZFxyXG4gKiBmb3IgZGV2ZWxvcGVycyBhdFxyXG4gKiAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvRmlyZWZveF9PUy9TZWN1cml0eS9TZWN1cml0eV9BdXRvbWF0aW9uXHJcbiAqIHdpdGggYWRkaXRpb25hbCBiYWNrZ3JvdW5kIGluZm9ybWF0aW9uIGFuZCBkZXNpZ24gZG9jcyBhdFxyXG4gKiAgaHR0cHM6Ly93aWtpLm1vemlsbGEub3JnL1VzZXI6RmJyYXVuL0dhaWEvU2FmZWlubmVySFRNTFJvYWRtYXBcclxuICpcclxuICovXHJcblxyXG4hKGZ1bmN0aW9uIChmYWN0b3J5KSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XHJcbn0pKGZ1bmN0aW9uICgpIHtcclxuICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgdmFyIFNhbml0aXplciA9IHtcclxuICAgIF9lbnRpdHk6IC9bJjw+XCInL10vZyxcclxuXHJcbiAgICBfZW50aXRpZXM6IHtcclxuICAgICAgXCImXCI6IFwiJmFtcDtcIixcclxuICAgICAgXCI8XCI6IFwiJmx0O1wiLFxyXG4gICAgICBcIj5cIjogXCImZ3Q7XCIsXHJcbiAgICAgICdcIic6IFwiJnF1b3Q7XCIsXHJcbiAgICAgIFwiJ1wiOiBcIiZhcG9zO1wiLFxyXG4gICAgICBcIi9cIjogXCImI3gyRjtcIixcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RW50aXR5OiBmdW5jdGlvbiAocykge1xyXG4gICAgICByZXR1cm4gU2FuaXRpemVyLl9lbnRpdGllc1tzXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFc2NhcGVzIEhUTUwgZm9yIGFsbCB2YWx1ZXMgaW4gYSB0YWdnZWQgdGVtcGxhdGUgc3RyaW5nLlxyXG4gICAgICovXHJcbiAgICBlc2NhcGVIVE1MOiBmdW5jdGlvbiAoc3RyaW5ncykge1xyXG4gICAgICB2YXIgcmVzdWx0ID0gXCJcIjtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHJlc3VsdCArPSBzdHJpbmdzW2ldO1xyXG4gICAgICAgIGlmIChpICsgMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgIHZhciB2YWx1ZSA9IGFyZ3VtZW50c1tpICsgMV0gfHwgXCJcIjtcclxuICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcodmFsdWUpLnJlcGxhY2UoXHJcbiAgICAgICAgICAgIFNhbml0aXplci5fZW50aXR5LFxyXG4gICAgICAgICAgICBTYW5pdGl6ZXIuZ2V0RW50aXR5XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIEVzY2FwZXMgSFRNTCBhbmQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRvIGJlIHVzZWQgZHVyaW5nIERPTSBpbnNlcnRpb25cclxuICAgICAqL1xyXG4gICAgY3JlYXRlU2FmZUhUTUw6IGZ1bmN0aW9uIChzdHJpbmdzKSB7XHJcbiAgICAgIHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCk7XHJcbiAgICAgIGZvciAodmFyIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XHJcbiAgICAgICAgdmFsdWVzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGVzY2FwZWQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTC5hcHBseShcclxuICAgICAgICBTYW5pdGl6ZXIsXHJcbiAgICAgICAgW3N0cmluZ3NdLmNvbmNhdCh2YWx1ZXMpXHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgX19odG1sOiBlc2NhcGVkLFxyXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICByZXR1cm4gXCJbb2JqZWN0IFdyYXBwZWRIVE1MT2JqZWN0XVwiO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5mbzpcclxuICAgICAgICAgIFwiVGhpcyBpcyBhIHdyYXBwZWQgSFRNTCBvYmplY3QuIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yXCIgK1xyXG4gICAgICAgICAgXCJnL2VuLVVTL0ZpcmVmb3hfT1MvU2VjdXJpdHkvU2VjdXJpdHlfQXV0b21hdGlvbiBmb3IgbW9yZS5cIixcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFVud3JhcCBzYWZlIEhUTUwgY3JlYXRlZCBieSBjcmVhdGVTYWZlSFRNTCBvciBhIGN1c3RvbSByZXBsYWNlbWVudCB0aGF0XHJcbiAgICAgKiB1bmRlcndlbnQgc2VjdXJpdHkgcmV2aWV3LlxyXG4gICAgICovXHJcbiAgICB1bndyYXBTYWZlSFRNTDogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICAgIHZhciBodG1sT2JqZWN0cyA9IG5ldyBBcnJheShfbGVuKTtcclxuICAgICAgZm9yICh2YXIgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcclxuICAgICAgICBodG1sT2JqZWN0c1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIG1hcmt1cExpc3QgPSBodG1sT2JqZWN0cy5tYXAoZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiBvYmouX19odG1sO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIG1hcmt1cExpc3Quam9pbihcIlwiKTtcclxuICAgIH0sXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIFNhbml0aXplcjtcclxufSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0U2Nyb2xsYmFyV2lkdGgoKSB7XHJcbiAgLy8gQ3JlYXRpbmcgaW52aXNpYmxlIGNvbnRhaW5lclxyXG4gIGNvbnN0IG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBvdXRlci5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcclxuICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9IFwic2Nyb2xsXCI7IC8vIGZvcmNpbmcgc2Nyb2xsYmFyIHRvIGFwcGVhclxyXG4gIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9IFwic2Nyb2xsYmFyXCI7IC8vIG5lZWRlZCBmb3IgV2luSlMgYXBwc1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xyXG5cclxuICAvLyBDcmVhdGluZyBpbm5lciBlbGVtZW50IGFuZCBwbGFjaW5nIGl0IGluIHRoZSBjb250YWluZXJcclxuICBjb25zdCBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xyXG5cclxuICAvLyBDYWxjdWxhdGluZyBkaWZmZXJlbmNlIGJldHdlZW4gY29udGFpbmVyJ3MgZnVsbCB3aWR0aCBhbmQgdGhlIGNoaWxkIHdpZHRoXHJcbiAgY29uc3Qgc2Nyb2xsYmFyV2lkdGggPSBgJHtvdXRlci5vZmZzZXRXaWR0aCAtIGlubmVyLm9mZnNldFdpZHRofXB4YDtcclxuXHJcbiAgLy8gUmVtb3ZpbmcgdGVtcG9yYXJ5IGVsZW1lbnRzIGZyb20gdGhlIERPTVxyXG4gIG91dGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3V0ZXIpO1xyXG5cclxuICByZXR1cm4gc2Nyb2xsYmFyV2lkdGg7XHJcbn07XHJcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuL3NlbGVjdFwiKTtcclxuLyoqXHJcbiAqIEBuYW1lIGlzRWxlbWVudFxyXG4gKiBAZGVzYyByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIERPTSBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcclxuICogQHJldHVybiB7Ym9vbGVhbn1cclxuICovXHJcbmNvbnN0IGlzRWxlbWVudCA9ICh2YWx1ZSkgPT5cclxuICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUubm9kZVR5cGUgPT09IDE7XHJcblxyXG4vKipcclxuICogQG5hbWUgc2VsZWN0T3JNYXRjaGVzXHJcbiAqIEBkZXNjIHNlbGVjdHMgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGJ5IGNsYXNzIHNlbGVjdG9yIG9yIElEIHNlbGVjdG9yLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgLSBUaGUgc2VsZWN0b3IgdG8gdHJhdmVyc2UgdGhlIERPTSB3aXRoLlxyXG4gKiBAcGFyYW0ge0RvY3VtZW50fEhUTUxFbGVtZW50P30gY29udGV4dCAtIFRoZSBjb250ZXh0IHRvIHRyYXZlcnNlIHRoZSBET01cclxuICogICBpbi4gSWYgbm90IHByb3ZpZGVkLCBpdCBkZWZhdWx0cyB0byB0aGUgZG9jdW1lbnQuXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzIG9yIGFuIGVtcHR5IGFycmF5LlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoc2VsZWN0b3IsIGNvbnRleHQpID0+IHtcclxuICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Qoc2VsZWN0b3IsIGNvbnRleHQpO1xyXG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHtcclxuICAgIHJldHVybiBzZWxlY3Rpb247XHJcbiAgfVxyXG5cclxuICBpZiAoaXNFbGVtZW50KGNvbnRleHQpICYmIGNvbnRleHQubWF0Y2hlcyhzZWxlY3RvcikpIHtcclxuICAgIHNlbGVjdGlvbi5wdXNoKGNvbnRleHQpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNlbGVjdGlvbjtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBuYW1lIGlzRWxlbWVudFxyXG4gKiBAZGVzYyByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIERPTSBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcclxuICogQHJldHVybiB7Ym9vbGVhbn1cclxuICovXHJcbmNvbnN0IGlzRWxlbWVudCA9ICh2YWx1ZSkgPT5cclxuICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUubm9kZVR5cGUgPT09IDE7XHJcblxyXG4vKipcclxuICogQG5hbWUgc2VsZWN0XHJcbiAqIEBkZXNjIHNlbGVjdHMgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGJ5IGNsYXNzIHNlbGVjdG9yIG9yIElEIHNlbGVjdG9yLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgLSBUaGUgc2VsZWN0b3IgdG8gdHJhdmVyc2UgdGhlIERPTSB3aXRoLlxyXG4gKiBAcGFyYW0ge0RvY3VtZW50fEhUTUxFbGVtZW50P30gY29udGV4dCAtIFRoZSBjb250ZXh0IHRvIHRyYXZlcnNlIHRoZSBET01cclxuICogICBpbi4gSWYgbm90IHByb3ZpZGVkLCBpdCBkZWZhdWx0cyB0byB0aGUgZG9jdW1lbnQuXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzIG9yIGFuIGVtcHR5IGFycmF5LlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoc2VsZWN0b3IsIGNvbnRleHQpID0+IHtcclxuICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICBpZiAoIWNvbnRleHQgfHwgIWlzRWxlbWVudChjb250ZXh0KSkge1xyXG4gICAgY29udGV4dCA9IHdpbmRvdy5kb2N1bWVudDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VsZWN0aW9uID0gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoc2VsZWN0aW9uKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEZsaXBzIGdpdmVuIElOUFVUIGVsZW1lbnRzIGJldHdlZW4gbWFza2VkIChoaWRpbmcgdGhlIGZpZWxkIHZhbHVlKSBhbmQgdW5tYXNrZWRcclxuICogQHBhcmFtIHtBcnJheS5IVE1MRWxlbWVudH0gZmllbGRzIC0gQW4gYXJyYXkgb2YgSU5QVVQgZWxlbWVudHNcclxuICogQHBhcmFtIHtCb29sZWFufSBtYXNrIC0gV2hldGhlciB0aGUgbWFzayBzaG91bGQgYmUgYXBwbGllZCwgaGlkaW5nIHRoZSBmaWVsZCB2YWx1ZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSAoZmllbGQsIG1hc2spID0+IHtcclxuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY2FwaXRhbGl6ZVwiLCBcIm9mZlwiKTtcclxuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29ycmVjdFwiLCBcIm9mZlwiKTtcclxuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIG1hc2sgPyBcInBhc3N3b3JkXCIgOiBcInRleHRcIik7XHJcbn07XHJcbiIsImNvbnN0IHJlc29sdmVJZFJlZnMgPSByZXF1aXJlKFwicmVzb2x2ZS1pZC1yZWZzXCIpO1xyXG5jb25zdCB0b2dnbGVGaWVsZE1hc2sgPSByZXF1aXJlKFwiLi90b2dnbGUtZmllbGQtbWFza1wiKTtcclxuXHJcbmNvbnN0IENPTlRST0xTID0gXCJhcmlhLWNvbnRyb2xzXCI7XHJcbmNvbnN0IFBSRVNTRUQgPSBcImFyaWEtcHJlc3NlZFwiO1xyXG5jb25zdCBTSE9XX0FUVFIgPSBcImRhdGEtc2hvdy10ZXh0XCI7XHJcbmNvbnN0IEhJREVfQVRUUiA9IFwiZGF0YS1oaWRlLXRleHRcIjtcclxuXHJcbi8qKlxyXG4gKiBSZXBsYWNlIHRoZSB3b3JkIFwiU2hvd1wiIChvciBcInNob3dcIikgd2l0aCBcIkhpZGVcIiAob3IgXCJoaWRlXCIpIGluIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2hvd1RleHRcclxuICogQHJldHVybiB7c3Ryb25nfSBoaWRlVGV4dFxyXG4gKi9cclxuY29uc3QgZ2V0SGlkZVRleHQgPSAoc2hvd1RleHQpID0+XHJcbiAgc2hvd1RleHQucmVwbGFjZSgvXFxiU2hvd1xcYi9pLCAoc2hvdykgPT4gYCR7c2hvd1swXSA9PT0gXCJTXCIgPyBcIkhcIiA6IFwiaFwifWlkZWApO1xyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudCB0aGF0IGRlY29yYXRlcyBhbiBIVE1MIGVsZW1lbnQgd2l0aCB0aGUgYWJpbGl0eSB0byB0b2dnbGUgdGhlXHJcbiAqIG1hc2tlZCBzdGF0ZSBvZiBhbiBpbnB1dCBmaWVsZCAobGlrZSBhIHBhc3N3b3JkKSB3aGVuIGNsaWNrZWQuXHJcbiAqIFRoZSBpZHMgb2YgdGhlIGZpZWxkcyB0byBiZSBtYXNrZWQgd2lsbCBiZSBwdWxsZWQgZGlyZWN0bHkgZnJvbSB0aGUgYnV0dG9uJ3NcclxuICogYGFyaWEtY29udHJvbHNgIGF0dHJpYnV0ZS5cclxuICpcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsICAgIFBhcmVudCBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIGZpZWxkcyB0byBiZSBtYXNrZWRcclxuICogQHJldHVybiB7Ym9vbGVhbn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsKSA9PiB7XHJcbiAgLy8gdGhpcyBpcyB0aGUgKnRhcmdldCogc3RhdGU6XHJcbiAgLy8gKiBpZiB0aGUgZWxlbWVudCBoYXMgdGhlIGF0dHIgYW5kIGl0J3MgIT09IFwidHJ1ZVwiLCBwcmVzc2VkIGlzIHRydWVcclxuICAvLyAqIG90aGVyd2lzZSwgcHJlc3NlZCBpcyBmYWxzZVxyXG4gIGNvbnN0IHByZXNzZWQgPVxyXG4gICAgZWwuaGFzQXR0cmlidXRlKFBSRVNTRUQpICYmIGVsLmdldEF0dHJpYnV0ZShQUkVTU0VEKSAhPT0gXCJ0cnVlXCI7XHJcblxyXG4gIGNvbnN0IGZpZWxkcyA9IHJlc29sdmVJZFJlZnMoZWwuZ2V0QXR0cmlidXRlKENPTlRST0xTKSk7XHJcbiAgZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB0b2dnbGVGaWVsZE1hc2soZmllbGQsIHByZXNzZWQpKTtcclxuXHJcbiAgaWYgKCFlbC5oYXNBdHRyaWJ1dGUoU0hPV19BVFRSKSkge1xyXG4gICAgZWwuc2V0QXR0cmlidXRlKFNIT1dfQVRUUiwgZWwudGV4dENvbnRlbnQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2hvd1RleHQgPSBlbC5nZXRBdHRyaWJ1dGUoU0hPV19BVFRSKTtcclxuICBjb25zdCBoaWRlVGV4dCA9IGVsLmdldEF0dHJpYnV0ZShISURFX0FUVFIpIHx8IGdldEhpZGVUZXh0KHNob3dUZXh0KTtcclxuXHJcbiAgZWwudGV4dENvbnRlbnQgPSBwcmVzc2VkID8gc2hvd1RleHQgOiBoaWRlVGV4dDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxyXG4gIGVsLnNldEF0dHJpYnV0ZShQUkVTU0VELCBwcmVzc2VkKTtcclxuICByZXR1cm4gcHJlc3NlZDtcclxufTtcclxuIiwiY29uc3QgRVhQQU5ERUQgPSBcImFyaWEtZXhwYW5kZWRcIjtcclxuY29uc3QgQ09OVFJPTFMgPSBcImFyaWEtY29udHJvbHNcIjtcclxuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGJ1dHRvbiwgZXhwYW5kZWQpID0+IHtcclxuICBsZXQgc2FmZUV4cGFuZGVkID0gZXhwYW5kZWQ7XHJcblxyXG4gIGlmICh0eXBlb2Ygc2FmZUV4cGFuZGVkICE9PSBcImJvb2xlYW5cIikge1xyXG4gICAgc2FmZUV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwiZmFsc2VcIjtcclxuICB9XHJcblxyXG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoRVhQQU5ERUQsIHNhZmVFeHBhbmRlZCk7XHJcblxyXG4gIGNvbnN0IGlkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShDT05UUk9MUyk7XHJcbiAgY29uc3QgY29udHJvbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgaWYgKCFjb250cm9scykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyB0b2dnbGUgdGFyZ2V0IGZvdW5kIHdpdGggaWQ6IFwiJHtpZH1cImApO1xyXG4gIH1cclxuXHJcbiAgaWYgKHNhZmVFeHBhbmRlZCkge1xyXG4gICAgY29udHJvbHMucmVtb3ZlQXR0cmlidXRlKEhJRERFTik7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnRyb2xzLnNldEF0dHJpYnV0ZShISURERU4sIFwiXCIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNhZmVFeHBhbmRlZDtcclxufTtcclxuIiwiY29uc3QgZGVib3VuY2UgPSByZXF1aXJlKFwiLi9kZWJvdW5jZVwiKTtcclxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uL2NvbmZpZ1wiKTtcclxuXHJcbmNvbnN0IENIRUNLRURfQ0xBU1MgPSBgJHtQUkVGSVh9LWNoZWNrbGlzdF9faXRlbS0tY2hlY2tlZGA7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHZhbGlkYXRlKGVsKSB7XHJcbiAgY29uc3QgaWQgPSBlbC5kYXRhc2V0LnZhbGlkYXRpb25FbGVtZW50O1xyXG4gIGNvbnN0IGNoZWNrTGlzdCA9XHJcbiAgICBpZC5jaGFyQXQoMCkgPT09IFwiI1wiXHJcbiAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpZClcclxuICAgICAgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblxyXG4gIGlmICghY2hlY2tMaXN0KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHZhbGlkYXRpb24gZWxlbWVudCBmb3VuZCB3aXRoIGlkOiBcIiR7aWR9XCJgKTtcclxuICB9XHJcblxyXG4gIGxldCBzdGF0dXNTdW1tYXJ5ID0gXCJcIjtcclxuICBPYmplY3QuZW50cmllcyhlbC5kYXRhc2V0KS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgIGlmIChrZXkuc3RhcnRzV2l0aChcInZhbGlkYXRlXCIpKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvck5hbWUgPSBrZXkuc3Vic3RyKFwidmFsaWRhdGVcIi5sZW5ndGgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvclBhdHRlcm4gPSBuZXcgUmVnRXhwKHZhbHVlKTtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yU2VsZWN0b3IgPSBgW2RhdGEtdmFsaWRhdG9yPVwiJHt2YWxpZGF0b3JOYW1lfVwiXWA7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvckNoZWNrYm94ID0gY2hlY2tMaXN0LnF1ZXJ5U2VsZWN0b3IodmFsaWRhdG9yU2VsZWN0b3IpO1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3JQYXJlbnQgPSBlbC5wYXJlbnROb2RlO1xyXG4gICAgICBjb25zdCBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyID0gdmFsaWRhdG9yUGFyZW50LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgICAgYFtkYXRhLXZhbGlkYXRpb24tc3RhdHVzXWBcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IGNoZWNrZWQgPSB2YWxpZGF0b3JQYXR0ZXJuLnRlc3QoZWwudmFsdWUpO1xyXG4gICAgICB2YWxpZGF0b3JDaGVja2JveC5jbGFzc0xpc3QudG9nZ2xlKENIRUNLRURfQ0xBU1MsIGNoZWNrZWQpO1xyXG5cclxuICAgICAgaWYgKCF2YWxpZGF0b3JDaGVja2JveCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gdmFsaWRhdG9yIGNoZWNrYm94IGZvdW5kIGZvcjogXCIke3ZhbGlkYXRvck5hbWV9XCJgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ3JlYXRlIHN0YXR1cyByZXBvcnRzIGZvciBjaGVja2xpc3QgaXRlbXNcclxuICAgICAgY29uc3Qgc3RhdHVzQ29tcGxldGUgPSBlbC5kYXRhc2V0LnZhbGlkYXRpb25Db21wbGV0ZSB8fCBcInN0YXR1cyBjb21wbGV0ZVwiO1xyXG4gICAgICBjb25zdCBzdGF0dXNJbmNvbXBsZXRlID1cclxuICAgICAgICBlbC5kYXRhc2V0LnZhbGlkYXRpb25JbmNvbXBsZXRlIHx8IFwic3RhdHVzIGluY29tcGxldGVcIjtcclxuICAgICAgbGV0IGNoZWNrYm94Q29udGVudCA9IGAke3ZhbGlkYXRvckNoZWNrYm94LnRleHRDb250ZW50fSBgO1xyXG5cclxuICAgICAgaWYgKHZhbGlkYXRvckNoZWNrYm94LmNsYXNzTGlzdC5jb250YWlucyhDSEVDS0VEX0NMQVNTKSkge1xyXG4gICAgICAgIGNoZWNrYm94Q29udGVudCArPSBzdGF0dXNDb21wbGV0ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjaGVja2JveENvbnRlbnQgKz0gc3RhdHVzSW5jb21wbGV0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbW92ZSBzdGF0dXMgdXBkYXRlcyB0byBhcmlhLWxhYmVsIG9uIGNoZWNrbGlzdCBpdGVtXHJcbiAgICAgIHZhbGlkYXRvckNoZWNrYm94LnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgY2hlY2tib3hDb250ZW50KTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSBhIHN1bW1hcnkgb2Ygc3RhdHVzIGZvciBhbGwgY2hlY2tsaXN0IGl0ZW1zXHJcbiAgICAgIHN0YXR1c1N1bW1hcnkgKz0gYCR7Y2hlY2tib3hDb250ZW50fS4gYDtcclxuXHJcbiAgICAgIC8vIEFkZCBzdW1tYXJ5IHRvIHNjcmVlbiByZWFkZXIgc3VtbWFyeSBjb250YWluZXIsIGFmdGVyIGEgZGVsYXlcclxuICAgICAgY29uc3Qgc3JVcGRhdGVTdGF0dXMgPSBkZWJvdW5jZSgoKSA9PiB7XHJcbiAgICAgICAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci50ZXh0Q29udGVudCA9IHN0YXR1c1N1bW1hcnk7XHJcbiAgICAgIH0sIDEwMDApO1xyXG5cclxuICAgICAgc3JVcGRhdGVTdGF0dXMoKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuIl19
