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

},{"../delegate":7,"../delegateAll":8,"object-assign":4}],6:[function(require,module,exports){
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

},{"element-closest":2}],8:[function(require,module,exports){
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

},{"../compose":6,"../delegate":7}],9:[function(require,module,exports){
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

},{"./behavior":5,"./delegate":7,"./delegateAll":8,"./ignore":9,"./keymap":11}],11:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2xhc3NsaXN0LXBvbHlmaWxsL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lbGVtZW50LWNsb3Nlc3QvZWxlbWVudC1jbG9zZXN0LmpzIiwibm9kZV9tb2R1bGVzL2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvYmVoYXZpb3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvY29tcG9zZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9kZWxlZ2F0ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9kZWxlZ2F0ZUFsbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9pZ25vcmUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3Iva2V5bWFwL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlY2VwdG9yL29uY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVzb2x2ZS1pZC1yZWZzL2luZGV4LmpzIiwicGFja2FnZXMvX3VzYS1wYXNzd29yZC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtYWNjb3JkaW9uL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1iYW5uZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWJ1dHRvbi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtY2hhcmFjdGVyLWNvdW50L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1jb21iby1ib3gvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWRhdGUtcGlja2VyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1kYXRlLXJhbmdlLXBpY2tlci9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtZmlsZS1pbnB1dC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtZm9vdGVyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1oZWFkZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWluLXBhZ2UtbmF2aWdhdGlvbi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtaW5wdXQtbWFzay9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtbGFuZ3VhZ2Utc2VsZWN0b3Ivc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLW1vZGFsL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1yYW5nZS9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2Etc2VhcmNoL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1za2lwbmF2L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS10YWJsZS9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtdGltZS1waWNrZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXRvb2x0aXAvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXZhbGlkYXRpb24vc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvaW5kZXguanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9wb2x5ZmlsbHMvY3VzdG9tLWV2ZW50LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL2VsZW1lbnQtaGlkZGVuLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL2luZGV4LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL251bWJlci1pcy1uYW4uanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9wb2x5ZmlsbHMvc3ZnNGV2ZXJ5Ym9keS5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3N0YXJ0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYWN0aXZlLWVsZW1lbnQuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvci5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2RlYm91bmNlLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW9zLWRldmljZS5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplci5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlLWZpZWxkLW1hc2suanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUtZm9ybS1pbnB1dC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZS5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3ZhbGlkYXRlLWlucHV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBLElBQUksVUFBVSxJQUFJLE1B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RSxpQkFBaUIsQ0FBQyxXQUFZLEdBQUU7TUFFekQsSUFBSSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO1FBQ3ZELGVBQWUsSUFBSSxjQUFjO01BQ25DLENBQUMsTUFBTTtRQUNMLGVBQWUsSUFBSSxnQkFBZ0I7TUFDckM7O01BRUE7TUFDQSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQzs7TUFFN0Q7TUFDQSxhQUFhLElBQUssR0FBRSxlQUFnQixJQUFHOztNQUV2QztNQUNBLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxNQUFNO1FBQ3BDLHNCQUFzQixDQUFDLFdBQVcsR0FBRyxhQUFhO01BQ3BELENBQUMsRUFBRSxJQUFJLENBQUM7TUFFUixjQUFjLENBQUMsQ0FBQztJQUNsQjtFQUNGLENBQUMsQ0FBQztBQUNKLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjEuMjAxNzA0MjdcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiB3aW5kb3cuc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmICghKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKSkge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJBbiBpbnZhbGlkIG9yIGlsbGVnYWwgc3RyaW5nIHdhcyBzcGVjaWZpZWRcIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0dG9rZW4gKz0gXCJcIjtcblx0cmV0dXJuIGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikgIT09IC0xO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikgPT09IC0xKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dG9rZW4gKz0gXCJcIjtcblxuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufSh3aW5kb3cuc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufVxuIiwiLy8gZWxlbWVudC1jbG9zZXN0IHwgQ0MwLTEuMCB8IGdpdGh1Yi5jb20vam9uYXRoYW50bmVhbC9jbG9zZXN0XG5cbihmdW5jdGlvbiAoRWxlbWVudFByb3RvKSB7XG5cdGlmICh0eXBlb2YgRWxlbWVudFByb3RvLm1hdGNoZXMgIT09ICdmdW5jdGlvbicpIHtcblx0XHRFbGVtZW50UHJvdG8ubWF0Y2hlcyA9IEVsZW1lbnRQcm90by5tc01hdGNoZXNTZWxlY3RvciB8fCBFbGVtZW50UHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yIHx8IEVsZW1lbnRQcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgZnVuY3Rpb24gbWF0Y2hlcyhzZWxlY3Rvcikge1xuXHRcdFx0dmFyIGVsZW1lbnQgPSB0aGlzO1xuXHRcdFx0dmFyIGVsZW1lbnRzID0gKGVsZW1lbnQuZG9jdW1lbnQgfHwgZWxlbWVudC5vd25lckRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdHZhciBpbmRleCA9IDA7XG5cblx0XHRcdHdoaWxlIChlbGVtZW50c1tpbmRleF0gJiYgZWxlbWVudHNbaW5kZXhdICE9PSBlbGVtZW50KSB7XG5cdFx0XHRcdCsraW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBCb29sZWFuKGVsZW1lbnRzW2luZGV4XSk7XG5cdFx0fTtcblx0fVxuXG5cdGlmICh0eXBlb2YgRWxlbWVudFByb3RvLmNsb3Nlc3QgIT09ICdmdW5jdGlvbicpIHtcblx0XHRFbGVtZW50UHJvdG8uY2xvc2VzdCA9IGZ1bmN0aW9uIGNsb3Nlc3Qoc2VsZWN0b3IpIHtcblx0XHRcdHZhciBlbGVtZW50ID0gdGhpcztcblxuXHRcdFx0d2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSkge1xuXHRcdFx0XHRpZiAoZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKSkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fTtcblx0fVxufSkod2luZG93LkVsZW1lbnQucHJvdG90eXBlKTtcbiIsIi8qIGdsb2JhbCBkZWZpbmUsIEtleWJvYXJkRXZlbnQsIG1vZHVsZSAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwgPSB7XG4gICAgcG9seWZpbGw6IHBvbHlmaWxsLFxuICAgIGtleXM6IHtcbiAgICAgIDM6ICdDYW5jZWwnLFxuICAgICAgNjogJ0hlbHAnLFxuICAgICAgODogJ0JhY2tzcGFjZScsXG4gICAgICA5OiAnVGFiJyxcbiAgICAgIDEyOiAnQ2xlYXInLFxuICAgICAgMTM6ICdFbnRlcicsXG4gICAgICAxNjogJ1NoaWZ0JyxcbiAgICAgIDE3OiAnQ29udHJvbCcsXG4gICAgICAxODogJ0FsdCcsXG4gICAgICAxOTogJ1BhdXNlJyxcbiAgICAgIDIwOiAnQ2Fwc0xvY2snLFxuICAgICAgMjc6ICdFc2NhcGUnLFxuICAgICAgMjg6ICdDb252ZXJ0JyxcbiAgICAgIDI5OiAnTm9uQ29udmVydCcsXG4gICAgICAzMDogJ0FjY2VwdCcsXG4gICAgICAzMTogJ01vZGVDaGFuZ2UnLFxuICAgICAgMzI6ICcgJyxcbiAgICAgIDMzOiAnUGFnZVVwJyxcbiAgICAgIDM0OiAnUGFnZURvd24nLFxuICAgICAgMzU6ICdFbmQnLFxuICAgICAgMzY6ICdIb21lJyxcbiAgICAgIDM3OiAnQXJyb3dMZWZ0JyxcbiAgICAgIDM4OiAnQXJyb3dVcCcsXG4gICAgICAzOTogJ0Fycm93UmlnaHQnLFxuICAgICAgNDA6ICdBcnJvd0Rvd24nLFxuICAgICAgNDE6ICdTZWxlY3QnLFxuICAgICAgNDI6ICdQcmludCcsXG4gICAgICA0MzogJ0V4ZWN1dGUnLFxuICAgICAgNDQ6ICdQcmludFNjcmVlbicsXG4gICAgICA0NTogJ0luc2VydCcsXG4gICAgICA0NjogJ0RlbGV0ZScsXG4gICAgICA0ODogWycwJywgJyknXSxcbiAgICAgIDQ5OiBbJzEnLCAnISddLFxuICAgICAgNTA6IFsnMicsICdAJ10sXG4gICAgICA1MTogWyczJywgJyMnXSxcbiAgICAgIDUyOiBbJzQnLCAnJCddLFxuICAgICAgNTM6IFsnNScsICclJ10sXG4gICAgICA1NDogWyc2JywgJ14nXSxcbiAgICAgIDU1OiBbJzcnLCAnJiddLFxuICAgICAgNTY6IFsnOCcsICcqJ10sXG4gICAgICA1NzogWyc5JywgJygnXSxcbiAgICAgIDkxOiAnT1MnLFxuICAgICAgOTM6ICdDb250ZXh0TWVudScsXG4gICAgICAxNDQ6ICdOdW1Mb2NrJyxcbiAgICAgIDE0NTogJ1Njcm9sbExvY2snLFxuICAgICAgMTgxOiAnVm9sdW1lTXV0ZScsXG4gICAgICAxODI6ICdWb2x1bWVEb3duJyxcbiAgICAgIDE4MzogJ1ZvbHVtZVVwJyxcbiAgICAgIDE4NjogWyc7JywgJzonXSxcbiAgICAgIDE4NzogWyc9JywgJysnXSxcbiAgICAgIDE4ODogWycsJywgJzwnXSxcbiAgICAgIDE4OTogWyctJywgJ18nXSxcbiAgICAgIDE5MDogWycuJywgJz4nXSxcbiAgICAgIDE5MTogWycvJywgJz8nXSxcbiAgICAgIDE5MjogWydgJywgJ34nXSxcbiAgICAgIDIxOTogWydbJywgJ3snXSxcbiAgICAgIDIyMDogWydcXFxcJywgJ3wnXSxcbiAgICAgIDIyMTogWyddJywgJ30nXSxcbiAgICAgIDIyMjogW1wiJ1wiLCAnXCInXSxcbiAgICAgIDIyNDogJ01ldGEnLFxuICAgICAgMjI1OiAnQWx0R3JhcGgnLFxuICAgICAgMjQ2OiAnQXR0bicsXG4gICAgICAyNDc6ICdDclNlbCcsXG4gICAgICAyNDg6ICdFeFNlbCcsXG4gICAgICAyNDk6ICdFcmFzZUVvZicsXG4gICAgICAyNTA6ICdQbGF5JyxcbiAgICAgIDI1MTogJ1pvb21PdXQnXG4gICAgfVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIGtleXMgKEYxLTI0KS5cbiAgdmFyIGk7XG4gIGZvciAoaSA9IDE7IGkgPCAyNTsgaSsrKSB7XG4gICAga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsLmtleXNbMTExICsgaV0gPSAnRicgKyBpO1xuICB9XG5cbiAgLy8gUHJpbnRhYmxlIEFTQ0lJIGNoYXJhY3RlcnMuXG4gIHZhciBsZXR0ZXIgPSAnJztcbiAgZm9yIChpID0gNjU7IGkgPCA5MTsgaSsrKSB7XG4gICAgbGV0dGVyID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcbiAgICBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwua2V5c1tpXSA9IFtsZXR0ZXIudG9Mb3dlckNhc2UoKSwgbGV0dGVyLnRvVXBwZXJDYXNlKCldO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWZpbGwgKCkge1xuICAgIGlmICghKCdLZXlib2FyZEV2ZW50JyBpbiB3aW5kb3cpIHx8XG4gICAgICAgICdrZXknIGluIEtleWJvYXJkRXZlbnQucHJvdG90eXBlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUG9seWZpbGwgYGtleWAgb24gYEtleWJvYXJkRXZlbnRgLlxuICAgIHZhciBwcm90byA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbC5rZXlzW3RoaXMud2hpY2ggfHwgdGhpcy5rZXlDb2RlXTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgICAga2V5ID0ga2V5Wyt0aGlzLnNoaWZ0S2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoS2V5Ym9hcmRFdmVudC5wcm90b3R5cGUsICdrZXknLCBwcm90byk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgna2V5Ym9hcmRldmVudC1rZXktcG9seWZpbGwnLCBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0ga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsO1xuICB9IGVsc2UgaWYgKHdpbmRvdykge1xuICAgIHdpbmRvdy5rZXlib2FyZGV2ZW50S2V5UG9seWZpbGwgPSBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGw7XG4gIH1cblxufSkoKTtcbiIsIi8qXG5vYmplY3QtYXNzaWduXG4oYykgU2luZHJlIFNvcmh1c1xuQGxpY2Vuc2UgTUlUXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGdldE93blByb3BlcnR5U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5jb25zdCBkZWxlZ2F0ZSA9IHJlcXVpcmUoJy4uL2RlbGVnYXRlJyk7XG5jb25zdCBkZWxlZ2F0ZUFsbCA9IHJlcXVpcmUoJy4uL2RlbGVnYXRlQWxsJyk7XG5cbmNvbnN0IERFTEVHQVRFX1BBVFRFUk4gPSAvXiguKyk6ZGVsZWdhdGVcXCgoLispXFwpJC87XG5jb25zdCBTUEFDRSA9ICcgJztcblxuY29uc3QgZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbWF0Y2ggPSB0eXBlLm1hdGNoKERFTEVHQVRFX1BBVFRFUk4pO1xuICB2YXIgc2VsZWN0b3I7XG4gIGlmIChtYXRjaCkge1xuICAgIHR5cGUgPSBtYXRjaFsxXTtcbiAgICBzZWxlY3RvciA9IG1hdGNoWzJdO1xuICB9XG5cbiAgdmFyIG9wdGlvbnM7XG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ29iamVjdCcpIHtcbiAgICBvcHRpb25zID0ge1xuICAgICAgY2FwdHVyZTogcG9wS2V5KGhhbmRsZXIsICdjYXB0dXJlJyksXG4gICAgICBwYXNzaXZlOiBwb3BLZXkoaGFuZGxlciwgJ3Bhc3NpdmUnKVxuICAgIH07XG4gIH1cblxuICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgIGRlbGVnYXRlOiAodHlwZW9mIGhhbmRsZXIgPT09ICdvYmplY3QnKVxuICAgICAgPyBkZWxlZ2F0ZUFsbChoYW5kbGVyKVxuICAgICAgOiBzZWxlY3RvclxuICAgICAgICA/IGRlbGVnYXRlKHNlbGVjdG9yLCBoYW5kbGVyKVxuICAgICAgICA6IGhhbmRsZXIsXG4gICAgb3B0aW9uczogb3B0aW9uc1xuICB9O1xuXG4gIGlmICh0eXBlLmluZGV4T2YoU1BBQ0UpID4gLTEpIHtcbiAgICByZXR1cm4gdHlwZS5zcGxpdChTUEFDRSkubWFwKGZ1bmN0aW9uKF90eXBlKSB7XG4gICAgICByZXR1cm4gYXNzaWduKHt0eXBlOiBfdHlwZX0sIGxpc3RlbmVyKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBsaXN0ZW5lci50eXBlID0gdHlwZTtcbiAgICByZXR1cm4gW2xpc3RlbmVyXTtcbiAgfVxufTtcblxudmFyIHBvcEtleSA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICBkZWxldGUgb2JqW2tleV07XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmVoYXZpb3IoZXZlbnRzLCBwcm9wcykge1xuICBjb25zdCBsaXN0ZW5lcnMgPSBPYmplY3Qua2V5cyhldmVudHMpXG4gICAgLnJlZHVjZShmdW5jdGlvbihtZW1vLCB0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gZ2V0TGlzdGVuZXJzKHR5cGUsIGV2ZW50c1t0eXBlXSk7XG4gICAgICByZXR1cm4gbWVtby5jb25jYXQobGlzdGVuZXJzKTtcbiAgICB9LCBbXSk7XG5cbiAgcmV0dXJuIGFzc2lnbih7XG4gICAgYWRkOiBmdW5jdGlvbiBhZGRCZWhhdmlvcihlbGVtZW50KSB7XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgbGlzdGVuZXIudHlwZSxcbiAgICAgICAgICBsaXN0ZW5lci5kZWxlZ2F0ZSxcbiAgICAgICAgICBsaXN0ZW5lci5vcHRpb25zXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlQmVoYXZpb3IoZWxlbWVudCkge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAgIGxpc3RlbmVyLnR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIuZGVsZWdhdGUsXG4gICAgICAgICAgbGlzdGVuZXIub3B0aW9uc1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCBwcm9wcyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb21wb3NlKGZ1bmN0aW9ucykge1xuICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgIHJldHVybiBmdW5jdGlvbnMuc29tZShmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZSkgPT09IGZhbHNlO1xuICAgIH0sIHRoaXMpO1xuICB9O1xufTtcbiIsIi8vIHBvbHlmaWxsIEVsZW1lbnQucHJvdG90eXBlLmNsb3Nlc3RcbnJlcXVpcmUoJ2VsZW1lbnQtY2xvc2VzdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbGVnYXRlKHNlbGVjdG9yLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gZGVsZWdhdGlvbihldmVudCkge1xuICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQuY2xvc2VzdChzZWxlY3Rvcik7XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGFyZ2V0LCBldmVudCk7XG4gICAgfVxuICB9XG59O1xuIiwiY29uc3QgZGVsZWdhdGUgPSByZXF1aXJlKCcuLi9kZWxlZ2F0ZScpO1xuY29uc3QgY29tcG9zZSA9IHJlcXVpcmUoJy4uL2NvbXBvc2UnKTtcblxuY29uc3QgU1BMQVQgPSAnKic7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVsZWdhdGVBbGwoc2VsZWN0b3JzKSB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzZWxlY3RvcnMpXG5cbiAgLy8gWFhYIG9wdGltaXphdGlvbjogaWYgdGhlcmUgaXMgb25seSBvbmUgaGFuZGxlciBhbmQgaXQgYXBwbGllcyB0b1xuICAvLyBhbGwgZWxlbWVudHMgKHRoZSBcIipcIiBDU1Mgc2VsZWN0b3IpLCB0aGVuIGp1c3QgcmV0dXJuIHRoYXRcbiAgLy8gaGFuZGxlclxuICBpZiAoa2V5cy5sZW5ndGggPT09IDEgJiYga2V5c1swXSA9PT0gU1BMQVQpIHtcbiAgICByZXR1cm4gc2VsZWN0b3JzW1NQTEFUXTtcbiAgfVxuXG4gIGNvbnN0IGRlbGVnYXRlcyA9IGtleXMucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIHNlbGVjdG9yKSB7XG4gICAgbWVtby5wdXNoKGRlbGVnYXRlKHNlbGVjdG9yLCBzZWxlY3RvcnNbc2VsZWN0b3JdKSk7XG4gICAgcmV0dXJuIG1lbW87XG4gIH0sIFtdKTtcbiAgcmV0dXJuIGNvbXBvc2UoZGVsZWdhdGVzKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlnbm9yZShlbGVtZW50LCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gaWdub3JhbmNlKGUpIHtcbiAgICBpZiAoZWxlbWVudCAhPT0gZS50YXJnZXQgJiYgIWVsZW1lbnQuY29udGFpbnMoZS50YXJnZXQpKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBlKTtcbiAgICB9XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJlaGF2aW9yOiAgICAgcmVxdWlyZSgnLi9iZWhhdmlvcicpLFxuICBkZWxlZ2F0ZTogICAgIHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcbiAgZGVsZWdhdGVBbGw6ICByZXF1aXJlKCcuL2RlbGVnYXRlQWxsJyksXG4gIGlnbm9yZTogICAgICAgcmVxdWlyZSgnLi9pZ25vcmUnKSxcbiAga2V5bWFwOiAgICAgICByZXF1aXJlKCcuL2tleW1hcCcpLFxufTtcbiIsInJlcXVpcmUoJ2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsJyk7XG5cbi8vIHRoZXNlIGFyZSB0aGUgb25seSByZWxldmFudCBtb2RpZmllcnMgc3VwcG9ydGVkIG9uIGFsbCBwbGF0Zm9ybXMsXG4vLyBhY2NvcmRpbmcgdG8gTUROOlxuLy8gPGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9LZXlib2FyZEV2ZW50L2dldE1vZGlmaWVyU3RhdGU+XG5jb25zdCBNT0RJRklFUlMgPSB7XG4gICdBbHQnOiAgICAgICdhbHRLZXknLFxuICAnQ29udHJvbCc6ICAnY3RybEtleScsXG4gICdDdHJsJzogICAgICdjdHJsS2V5JyxcbiAgJ1NoaWZ0JzogICAgJ3NoaWZ0S2V5J1xufTtcblxuY29uc3QgTU9ESUZJRVJfU0VQQVJBVE9SID0gJysnO1xuXG5jb25zdCBnZXRFdmVudEtleSA9IGZ1bmN0aW9uKGV2ZW50LCBoYXNNb2RpZmllcnMpIHtcbiAgdmFyIGtleSA9IGV2ZW50LmtleTtcbiAgaWYgKGhhc01vZGlmaWVycykge1xuICAgIGZvciAodmFyIG1vZGlmaWVyIGluIE1PRElGSUVSUykge1xuICAgICAgaWYgKGV2ZW50W01PRElGSUVSU1ttb2RpZmllcl1dID09PSB0cnVlKSB7XG4gICAgICAgIGtleSA9IFttb2RpZmllciwga2V5XS5qb2luKE1PRElGSUVSX1NFUEFSQVRPUik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBrZXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleW1hcChrZXlzKSB7XG4gIGNvbnN0IGhhc01vZGlmaWVycyA9IE9iamVjdC5rZXlzKGtleXMpLnNvbWUoZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGtleS5pbmRleE9mKE1PRElGSUVSX1NFUEFSQVRPUikgPiAtMTtcbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBrZXkgPSBnZXRFdmVudEtleShldmVudCwgaGFzTW9kaWZpZXJzKTtcbiAgICByZXR1cm4gW2tleSwga2V5LnRvTG93ZXJDYXNlKCldXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKHJlc3VsdCwgX2tleSkge1xuICAgICAgICBpZiAoX2tleSBpbiBrZXlzKSB7XG4gICAgICAgICAgcmVzdWx0ID0ga2V5c1trZXldLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCB1bmRlZmluZWQpO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMuTU9ESUZJRVJTID0gTU9ESUZJRVJTO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlKGxpc3RlbmVyLCBvcHRpb25zKSB7XG4gIHZhciB3cmFwcGVkID0gZnVuY3Rpb24gd3JhcHBlZE9uY2UoZSkge1xuICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGUudHlwZSwgd3JhcHBlZCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGxpc3RlbmVyLmNhbGwodGhpcywgZSk7XG4gIH07XG4gIHJldHVybiB3cmFwcGVkO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUkVfVFJJTSA9IC8oXlxccyspfChcXHMrJCkvZztcbnZhciBSRV9TUExJVCA9IC9cXHMrLztcblxudmFyIHRyaW0gPSBTdHJpbmcucHJvdG90eXBlLnRyaW1cbiAgPyBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0ci50cmltKCk7IH1cbiAgOiBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKFJFX1RSSU0sICcnKTsgfTtcblxudmFyIHF1ZXJ5QnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIicgKyBpZC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgKyAnXCJdJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlc29sdmVJZHMoaWRzLCBkb2MpIHtcbiAgaWYgKHR5cGVvZiBpZHMgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBhIHN0cmluZyBidXQgZ290ICcgKyAodHlwZW9mIGlkcykpO1xuICB9XG5cbiAgaWYgKCFkb2MpIHtcbiAgICBkb2MgPSB3aW5kb3cuZG9jdW1lbnQ7XG4gIH1cblxuICB2YXIgZ2V0RWxlbWVudEJ5SWQgPSBkb2MuZ2V0RWxlbWVudEJ5SWRcbiAgICA/IGRvYy5nZXRFbGVtZW50QnlJZC5iaW5kKGRvYylcbiAgICA6IHF1ZXJ5QnlJZC5iaW5kKGRvYyk7XG5cbiAgaWRzID0gdHJpbShpZHMpLnNwbGl0KFJFX1NQTElUKTtcblxuICAvLyBYWFggd2UgY2FuIHNob3J0LWNpcmN1aXQgaGVyZSBiZWNhdXNlIHRyaW1taW5nIGFuZCBzcGxpdHRpbmcgYVxuICAvLyBzdHJpbmcgb2YganVzdCB3aGl0ZXNwYWNlIHByb2R1Y2VzIGFuIGFycmF5IGNvbnRhaW5pbmcgYSBzaW5nbGUsXG4gIC8vIGVtcHR5IHN0cmluZ1xuICBpZiAoaWRzLmxlbmd0aCA9PT0gMSAmJiBpZHNbMF0gPT09ICcnKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGlkc1xuICAgIC5tYXAoZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBlbCA9IGdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBlbGVtZW50IHdpdGggaWQ6IFwiJyArIGlkICsgJ1wiJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWw7XG4gICAgfSk7XG59O1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB0b2dnbGVGb3JtSW5wdXQgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlLWZvcm0taW5wdXRcIik7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBMSU5LID0gYC4ke1BSRUZJWH0tc2hvdy1wYXNzd29yZGA7XG5cbmZ1bmN0aW9uIHRvZ2dsZShldmVudCkge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB0b2dnbGVGb3JtSW5wdXQodGhpcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3Ioe1xuICBbQ0xJQ0tdOiB7XG4gICAgW0xJTktdOiB0b2dnbGUsXG4gIH0sXG59KTtcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XG5jb25zdCBpc0VsZW1lbnRJblZpZXdwb3J0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0XCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEFDQ09SRElPTiA9IGAuJHtQUkVGSVh9LWFjY29yZGlvbiwgLiR7UFJFRklYfS1hY2NvcmRpb24tLWJvcmRlcmVkYDtcbmNvbnN0IEJBTk5FUl9CVVRUT04gPSBgLiR7UFJFRklYfS1iYW5uZXJfX2J1dHRvbmA7XG5jb25zdCBCVVRUT04gPSBgLiR7UFJFRklYfS1hY2NvcmRpb25fX2J1dHRvblthcmlhLWNvbnRyb2xzXTpub3QoJHtCQU5ORVJfQlVUVE9OfSlgO1xuY29uc3QgRVhQQU5ERUQgPSBcImFyaWEtZXhwYW5kZWRcIjtcbmNvbnN0IE1VTFRJU0VMRUNUQUJMRSA9IFwiZGF0YS1hbGxvdy1tdWx0aXBsZVwiO1xuXG4vKipcbiAqIEdldCBhbiBBcnJheSBvZiBidXR0b24gZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogYWNjb3JkaW9uIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBhY2NvcmRpb25cbiAqIEByZXR1cm4ge2FycmF5PEhUTUxCdXR0b25FbGVtZW50Pn1cbiAqL1xuY29uc3QgZ2V0QWNjb3JkaW9uQnV0dG9ucyA9IChhY2NvcmRpb24pID0+IHtcbiAgY29uc3QgYnV0dG9ucyA9IHNlbGVjdChCVVRUT04sIGFjY29yZGlvbik7XG5cbiAgcmV0dXJuIGJ1dHRvbnMuZmlsdGVyKChidXR0b24pID0+IGJ1dHRvbi5jbG9zZXN0KEFDQ09SRElPTikgPT09IGFjY29yZGlvbik7XG59O1xuXG4vKipcbiAqIFRvZ2dsZSBhIGJ1dHRvbidzIFwicHJlc3NlZFwiIHN0YXRlLCBvcHRpb25hbGx5IHByb3ZpZGluZyBhIHRhcmdldFxuICogc3RhdGUuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gYnV0dG9uXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBleHBhbmRlZCBJZiBubyBzdGF0ZSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnRcbiAqIHN0YXRlIHdpbGwgYmUgdG9nZ2xlZCAoZnJvbSBmYWxzZSB0byB0cnVlLCBhbmQgdmljZS12ZXJzYSkuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcmVzdWx0aW5nIHN0YXRlXG4gKi9cbmNvbnN0IHRvZ2dsZUJ1dHRvbiA9IChidXR0b24sIGV4cGFuZGVkKSA9PiB7XG4gIGNvbnN0IGFjY29yZGlvbiA9IGJ1dHRvbi5jbG9zZXN0KEFDQ09SRElPTik7XG4gIGxldCBzYWZlRXhwYW5kZWQgPSBleHBhbmRlZDtcblxuICBpZiAoIWFjY29yZGlvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtCVVRUT059IGlzIG1pc3Npbmcgb3V0ZXIgJHtBQ0NPUkRJT059YCk7XG4gIH1cblxuICBzYWZlRXhwYW5kZWQgPSB0b2dnbGUoYnV0dG9uLCBleHBhbmRlZCk7XG5cbiAgLy8gWFhYIG11bHRpc2VsZWN0YWJsZSBpcyBvcHQtaW4sIHRvIHByZXNlcnZlIGxlZ2FjeSBiZWhhdmlvclxuICBjb25zdCBtdWx0aXNlbGVjdGFibGUgPSBhY2NvcmRpb24uaGFzQXR0cmlidXRlKE1VTFRJU0VMRUNUQUJMRSk7XG5cbiAgaWYgKHNhZmVFeHBhbmRlZCAmJiAhbXVsdGlzZWxlY3RhYmxlKSB7XG4gICAgZ2V0QWNjb3JkaW9uQnV0dG9ucyhhY2NvcmRpb24pLmZvckVhY2goKG90aGVyKSA9PiB7XG4gICAgICBpZiAob3RoZXIgIT09IGJ1dHRvbikge1xuICAgICAgICB0b2dnbGUob3RoZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBidXR0b25cbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWVcbiAqL1xuY29uc3Qgc2hvd0J1dHRvbiA9IChidXR0b24pID0+IHRvZ2dsZUJ1dHRvbihidXR0b24sIHRydWUpO1xuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGJ1dHRvblxuICogQHJldHVybiB7Ym9vbGVhbn0gZmFsc2VcbiAqL1xuY29uc3QgaGlkZUJ1dHRvbiA9IChidXR0b24pID0+IHRvZ2dsZUJ1dHRvbihidXR0b24sIGZhbHNlKTtcblxuY29uc3QgYWNjb3JkaW9uID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbQlVUVE9OXSgpIHtcbiAgICAgICAgdG9nZ2xlQnV0dG9uKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgLy8gV2Ugd2VyZSBqdXN0IGV4cGFuZGVkLCBidXQgaWYgYW5vdGhlciBhY2NvcmRpb24gd2FzIGFsc28ganVzdFxuICAgICAgICAgIC8vIGNvbGxhcHNlZCwgd2UgbWF5IG5vIGxvbmdlciBiZSBpbiB0aGUgdmlld3BvcnQuIFRoaXMgZW5zdXJlc1xuICAgICAgICAgIC8vIHRoYXQgd2UgYXJlIHN0aWxsIHZpc2libGUsIHNvIHRoZSB1c2VyIGlzbid0IGNvbmZ1c2VkLlxuICAgICAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0aGlzKSkgdGhpcy5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdChCVVRUT04sIHJvb3QpLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgICBjb25zdCBleHBhbmRlZCA9IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoRVhQQU5ERUQpID09PSBcInRydWVcIjtcbiAgICAgICAgdG9nZ2xlQnV0dG9uKGJ1dHRvbiwgZXhwYW5kZWQpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBBQ0NPUkRJT04sXG4gICAgQlVUVE9OLFxuICAgIHNob3c6IHNob3dCdXR0b24sXG4gICAgaGlkZTogaGlkZUJ1dHRvbixcbiAgICB0b2dnbGU6IHRvZ2dsZUJ1dHRvbixcbiAgICBnZXRCdXR0b25zOiBnZXRBY2NvcmRpb25CdXR0b25zLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFjY29yZGlvbjtcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3QgdG9nZ2xlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZVwiKTtcblxuY29uc3QgSEVBREVSID0gYC4ke1BSRUZJWH0tYmFubmVyX19oZWFkZXJgO1xuY29uc3QgRVhQQU5ERURfQ0xBU1MgPSBgJHtQUkVGSVh9LWJhbm5lcl9faGVhZGVyLS1leHBhbmRlZGA7XG5jb25zdCBCQU5ORVJfQlVUVE9OID0gYCR7SEVBREVSfSBbYXJpYS1jb250cm9sc11gO1xuXG4vKipcbiAqIFRvZ2dsZSBCYW5uZXIgZGlzcGxheSBhbmQgY2xhc3MuXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5jb25zdCB0b2dnbGVCYW5uZXIgPSBmdW5jdGlvbiB0b2dnbGVFbChldmVudCkge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICBjb25zdCB0cmlnZ2VyID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoQkFOTkVSX0JVVFRPTik7XG5cbiAgdG9nZ2xlKHRyaWdnZXIpO1xuICB0aGlzLmNsb3Nlc3QoSEVBREVSKS5jbGFzc0xpc3QudG9nZ2xlKEVYUEFOREVEX0NMQVNTKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbQkFOTkVSX0JVVFRPTl06IHRvZ2dsZUJhbm5lcixcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICAvLyBzZWxlY3QoQkFOTkVSX0JVVFRPTiwgcm9vdCkuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICAvLyAgIGNvbnN0IGV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRF9DTEFTUykgPT09IFwidHJ1ZVwiO1xuICAgICAgLy8gICB0b2dnbGUoYnV0dG9uLCBleHBhbmRlZCk7XG4gICAgICAvLyB9KTtcbiAgICB9LFxuICB9XG4pO1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuXG5jb25zdCBBTkNIT1JfQlVUVE9OID0gYGFbY2xhc3MqPVwidXNhLWJ1dHRvblwiXWA7XG5cbmNvbnN0IHRvZ2dsZUJ1dHRvbiA9IChldmVudCkgPT4ge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICBldmVudC50YXJnZXQuY2xpY2soKTtcbn07XG5cbmNvbnN0IGFuY2hvckJ1dHRvbiA9IGJlaGF2aW9yKHtcbiAga2V5ZG93bjoge1xuICAgIFtBTkNIT1JfQlVUVE9OXToga2V5bWFwKHtcbiAgICAgIFwiIFwiOiB0b2dnbGVCdXR0b24sXG4gICAgfSksXG4gIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhbmNob3JCdXR0b247XG4iLCJjb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCBkZWJvdW5jZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9kZWJvdW5jZVwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IENIQVJBQ1RFUl9DT1VOVF9DTEFTUyA9IGAke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50YDtcbmNvbnN0IENIQVJBQ1RFUl9DT1VOVCA9IGAuJHtDSEFSQUNURVJfQ09VTlRfQ0xBU1N9YDtcbmNvbnN0IElOUFVUID0gYC4ke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50X19maWVsZGA7XG5jb25zdCBNRVNTQUdFID0gYC4ke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50X19tZXNzYWdlYDtcbmNvbnN0IFZBTElEQVRJT05fTUVTU0FHRSA9IFwiVGhlIGNvbnRlbnQgaXMgdG9vIGxvbmcuXCI7XG5jb25zdCBNRVNTQUdFX0lOVkFMSURfQ0xBU1MgPSBgJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudF9fc3RhdHVzLS1pbnZhbGlkYDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFX0NMQVNTID0gYCR7Q0hBUkFDVEVSX0NPVU5UX0NMQVNTfV9fc3RhdHVzYDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1MgPSBgJHtDSEFSQUNURVJfQ09VTlRfQ0xBU1N9X19zci1zdGF0dXNgO1xuY29uc3QgU1RBVFVTX01FU1NBR0UgPSBgLiR7U1RBVFVTX01FU1NBR0VfQ0xBU1N9YDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFX1NSX09OTFkgPSBgLiR7U1RBVFVTX01FU1NBR0VfU1JfT05MWV9DTEFTU31gO1xuY29uc3QgREVGQVVMVF9TVEFUVVNfTEFCRUwgPSBgY2hhcmFjdGVycyBhbGxvd2VkYDtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByb290IGFuZCBtZXNzYWdlIGVsZW1lbnQgZm9yIGFuIGNoYXJhY3RlciBjb3VudCBpbnB1dFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxuICogQHJldHVybnMge0NoYXJhY3RlckNvdW50RWxlbWVudHN9IGVsZW1lbnRzIFRoZSByb290IGFuZCBtZXNzYWdlIGVsZW1lbnQuXG4gKi9cbmNvbnN0IGdldENoYXJhY3RlckNvdW50RWxlbWVudHMgPSAoaW5wdXRFbCkgPT4ge1xuICBjb25zdCBjaGFyYWN0ZXJDb3VudEVsID0gaW5wdXRFbC5jbG9zZXN0KENIQVJBQ1RFUl9DT1VOVCk7XG5cbiAgaWYgKCFjaGFyYWN0ZXJDb3VudEVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0lOUFVUfSBpcyBtaXNzaW5nIG91dGVyICR7Q0hBUkFDVEVSX0NPVU5UfWApO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZUVsID0gY2hhcmFjdGVyQ291bnRFbC5xdWVyeVNlbGVjdG9yKE1FU1NBR0UpO1xuXG4gIGlmICghbWVzc2FnZUVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0NIQVJBQ1RFUl9DT1VOVH0gaXMgbWlzc2luZyBpbm5lciAke01FU1NBR0V9YCk7XG4gIH1cblxuICByZXR1cm4geyBjaGFyYWN0ZXJDb3VudEVsLCBtZXNzYWdlRWwgfTtcbn07XG5cbi8qKlxuICogTW92ZSBtYXhsZW5ndGggYXR0cmlidXRlIHRvIGEgZGF0YSBhdHRyaWJ1dGUgb24gdXNhLWNoYXJhY3Rlci1jb3VudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxuICovXG5jb25zdCBzZXREYXRhTGVuZ3RoID0gKGlucHV0RWwpID0+IHtcbiAgY29uc3QgeyBjaGFyYWN0ZXJDb3VudEVsIH0gPSBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzKGlucHV0RWwpO1xuXG4gIGNvbnN0IG1heGxlbmd0aCA9IGlucHV0RWwuZ2V0QXR0cmlidXRlKFwibWF4bGVuZ3RoXCIpO1xuXG4gIGlmICghbWF4bGVuZ3RoKSByZXR1cm47XG5cbiAgaW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoXCJtYXhsZW5ndGhcIik7XG4gIGNoYXJhY3RlckNvdW50RWwuc2V0QXR0cmlidXRlKFwiZGF0YS1tYXhsZW5ndGhcIiwgbWF4bGVuZ3RoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBhcHBlbmQgc3RhdHVzIG1lc3NhZ2VzIGZvciB2aXN1YWwgYW5kIHNjcmVlbiByZWFkZXJzXG4gKlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gY2hhcmFjdGVyQ291bnRFbCAtIERpdiB3aXRoIGAudXNhLWNoYXJhY3Rlci1jb3VudGAgY2xhc3NcbiAqIEBkZXNjcmlwdGlvbiAgQ3JlYXRlIHR3byBzdGF0dXMgbWVzc2FnZXMgZm9yIG51bWJlciBvZiBjaGFyYWN0ZXJzIGxlZnQ7XG4gKiBvbmUgdmlzdWFsIHN0YXR1cyBhbmQgYW5vdGhlciBmb3Igc2NyZWVuIHJlYWRlcnNcbiAqL1xuY29uc3QgY3JlYXRlU3RhdHVzTWVzc2FnZXMgPSAoY2hhcmFjdGVyQ291bnRFbCkgPT4ge1xuICBjb25zdCBzdGF0dXNNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3Qgc3JTdGF0dXNNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgbWF4TGVuZ3RoID0gY2hhcmFjdGVyQ291bnRFbC5kYXRhc2V0Lm1heGxlbmd0aDtcbiAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgJHttYXhMZW5ndGh9ICR7REVGQVVMVF9TVEFUVVNfTEFCRUx9YDtcblxuICBzdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoYCR7U1RBVFVTX01FU1NBR0VfQ0xBU1N9YCwgXCJ1c2EtaGludFwiKTtcbiAgc3JTdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoXG4gICAgYCR7U1RBVFVTX01FU1NBR0VfU1JfT05MWV9DTEFTU31gLFxuICAgIFwidXNhLXNyLW9ubHlcIlxuICApO1xuXG4gIHN0YXR1c01lc3NhZ2Uuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSk7XG4gIHNyU3RhdHVzTWVzc2FnZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG5cbiAgc3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IGRlZmF1bHRNZXNzYWdlO1xuICBzclN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBkZWZhdWx0TWVzc2FnZTtcblxuICBjaGFyYWN0ZXJDb3VudEVsLmFwcGVuZChzdGF0dXNNZXNzYWdlLCBzclN0YXR1c01lc3NhZ2UpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIG1lc3NhZ2Ugd2l0aCBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0XG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRMZW5ndGggLSBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdXNlZFxuICogQHBhcmFtIHtudW1iZXJ9IG1heExlbmd0aCAtIFRoZSB0b3RhbCBudW1iZXIgb2YgY2hhcmFjdGVycyBhbGxvd2VkXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIHN0cmluZyBkZXNjcmlwdGlvbiBvZiBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0XG4gKi9cbmNvbnN0IGdldENvdW50TWVzc2FnZSA9IChjdXJyZW50TGVuZ3RoLCBtYXhMZW5ndGgpID0+IHtcbiAgbGV0IG5ld01lc3NhZ2UgPSBcIlwiO1xuXG4gIGlmIChjdXJyZW50TGVuZ3RoID09PSAwKSB7XG4gICAgbmV3TWVzc2FnZSA9IGAke21heExlbmd0aH0gJHtERUZBVUxUX1NUQVRVU19MQUJFTH1gO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpZmZlcmVuY2UgPSBNYXRoLmFicyhtYXhMZW5ndGggLSBjdXJyZW50TGVuZ3RoKTtcbiAgICBjb25zdCBjaGFyYWN0ZXJzID0gYGNoYXJhY3RlciR7ZGlmZmVyZW5jZSA9PT0gMSA/IFwiXCIgOiBcInNcIn1gO1xuICAgIGNvbnN0IGd1aWRhbmNlID0gY3VycmVudExlbmd0aCA+IG1heExlbmd0aCA/IFwib3ZlciBsaW1pdFwiIDogXCJsZWZ0XCI7XG5cbiAgICBuZXdNZXNzYWdlID0gYCR7ZGlmZmVyZW5jZX0gJHtjaGFyYWN0ZXJzfSAke2d1aWRhbmNlfWA7XG4gIH1cblxuICByZXR1cm4gbmV3TWVzc2FnZTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgY2hhcmFjdGVyIGNvdW50IHN0YXR1cyBmb3Igc2NyZWVuIHJlYWRlcnMgYWZ0ZXIgYSAxMDAwbXMgZGVsYXkuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbXNnRWwgLSBUaGUgc2NyZWVuIHJlYWRlciBzdGF0dXMgbWVzc2FnZSBlbGVtZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzTWVzc2FnZSAtIEEgc3RyaW5nIG9mIHRoZSBjdXJyZW50IGNoYXJhY3RlciBzdGF0dXNcbiAqL1xuY29uc3Qgc3JVcGRhdGVTdGF0dXMgPSBkZWJvdW5jZSgobXNnRWwsIHN0YXR1c01lc3NhZ2UpID0+IHtcbiAgY29uc3Qgc3JTdGF0dXNNZXNzYWdlID0gbXNnRWw7XG4gIHNyU3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IHN0YXR1c01lc3NhZ2U7XG59LCAxMDAwKTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGNoYXJhY3RlciBjb3VudCBjb21wb25lbnRcbiAqXG4gKiBAZGVzY3JpcHRpb24gT24gaW5wdXQsIGl0IHdpbGwgdXBkYXRlIHZpc3VhbCBzdGF0dXMsIHNjcmVlbnJlYWRlclxuICogc3RhdHVzIGFuZCB1cGRhdGUgaW5wdXQgdmFsaWRhdGlvbiAoaWYgb3ZlciBjaGFyYWN0ZXIgbGVuZ3RoKVxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fEhUTUxUZXh0QXJlYUVsZW1lbnR9IGlucHV0RWwgVGhlIGNoYXJhY3RlciBjb3VudCBpbnB1dCBlbGVtZW50XG4gKi9cbmNvbnN0IHVwZGF0ZUNvdW50TWVzc2FnZSA9IChpbnB1dEVsKSA9PiB7XG4gIGNvbnN0IHsgY2hhcmFjdGVyQ291bnRFbCB9ID0gZ2V0Q2hhcmFjdGVyQ291bnRFbGVtZW50cyhpbnB1dEVsKTtcbiAgY29uc3QgY3VycmVudExlbmd0aCA9IGlucHV0RWwudmFsdWUubGVuZ3RoO1xuICBjb25zdCBtYXhMZW5ndGggPSBwYXJzZUludChcbiAgICBjaGFyYWN0ZXJDb3VudEVsLmdldEF0dHJpYnV0ZShcImRhdGEtbWF4bGVuZ3RoXCIpLFxuICAgIDEwXG4gICk7XG4gIGNvbnN0IHN0YXR1c01lc3NhZ2UgPSBjaGFyYWN0ZXJDb3VudEVsLnF1ZXJ5U2VsZWN0b3IoU1RBVFVTX01FU1NBR0UpO1xuICBjb25zdCBzclN0YXR1c01lc3NhZ2UgPSBjaGFyYWN0ZXJDb3VudEVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgU1RBVFVTX01FU1NBR0VfU1JfT05MWVxuICApO1xuICBjb25zdCBjdXJyZW50U3RhdHVzTWVzc2FnZSA9IGdldENvdW50TWVzc2FnZShjdXJyZW50TGVuZ3RoLCBtYXhMZW5ndGgpO1xuXG4gIGlmICghbWF4TGVuZ3RoKSByZXR1cm47XG5cbiAgY29uc3QgaXNPdmVyTGltaXQgPSBjdXJyZW50TGVuZ3RoICYmIGN1cnJlbnRMZW5ndGggPiBtYXhMZW5ndGg7XG5cbiAgc3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IGN1cnJlbnRTdGF0dXNNZXNzYWdlO1xuICBzclVwZGF0ZVN0YXR1cyhzclN0YXR1c01lc3NhZ2UsIGN1cnJlbnRTdGF0dXNNZXNzYWdlKTtcblxuICBpZiAoaXNPdmVyTGltaXQgJiYgIWlucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICBpbnB1dEVsLnNldEN1c3RvbVZhbGlkaXR5KFZBTElEQVRJT05fTUVTU0FHRSk7XG4gIH1cblxuICBpZiAoIWlzT3ZlckxpbWl0ICYmIGlucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UgPT09IFZBTElEQVRJT05fTUVTU0FHRSkge1xuICAgIGlucHV0RWwuc2V0Q3VzdG9tVmFsaWRpdHkoXCJcIik7XG4gIH1cblxuICBzdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC50b2dnbGUoTUVTU0FHRV9JTlZBTElEX0NMQVNTLCBpc092ZXJMaW1pdCk7XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgY29tcG9uZW50XG4gKlxuICogQGRlc2NyaXB0aW9uIE9uIGluaXQgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBlbGVtZW50cyBhbmQgdXBkYXRlIGFueVxuICogYXR0cmlidXRlcyBzbyBpdCBjYW4gdGVsbCB0aGUgdXNlciBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0LlxuICogQHBhcmFtICB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIHRoZSBjb21wb25lbnRzIGlucHV0XG4gKi9cbmNvbnN0IGVuaGFuY2VDaGFyYWN0ZXJDb3VudCA9IChpbnB1dEVsKSA9PiB7XG4gIGNvbnN0IHsgY2hhcmFjdGVyQ291bnRFbCwgbWVzc2FnZUVsIH0gPSBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzKGlucHV0RWwpO1xuXG4gIC8vIEhpZGUgaGludCBhbmQgcmVtb3ZlIGFyaWEtbGl2ZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgbWVzc2FnZUVsLmNsYXNzTGlzdC5hZGQoXCJ1c2Etc3Itb25seVwiKTtcbiAgbWVzc2FnZUVsLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtbGl2ZVwiKTtcblxuICBzZXREYXRhTGVuZ3RoKGlucHV0RWwpO1xuICBjcmVhdGVTdGF0dXNNZXNzYWdlcyhjaGFyYWN0ZXJDb3VudEVsKTtcbn07XG5cbmNvbnN0IGNoYXJhY3RlckNvdW50ID0gYmVoYXZpb3IoXG4gIHtcbiAgICBpbnB1dDoge1xuICAgICAgW0lOUFVUXSgpIHtcbiAgICAgICAgdXBkYXRlQ291bnRNZXNzYWdlKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3QoSU5QVVQsIHJvb3QpLmZvckVhY2goKGlucHV0KSA9PiBlbmhhbmNlQ2hhcmFjdGVyQ291bnQoaW5wdXQpKTtcbiAgICB9LFxuICAgIE1FU1NBR0VfSU5WQUxJRF9DTEFTUyxcbiAgICBWQUxJREFUSU9OX01FU1NBR0UsXG4gICAgU1RBVFVTX01FU1NBR0VfQ0xBU1MsXG4gICAgU1RBVFVTX01FU1NBR0VfU1JfT05MWV9DTEFTUyxcbiAgICBERUZBVUxUX1NUQVRVU19MQUJFTCxcbiAgICBjcmVhdGVTdGF0dXNNZXNzYWdlcyxcbiAgICBnZXRDb3VudE1lc3NhZ2UsXG4gICAgdXBkYXRlQ291bnRNZXNzYWdlLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNoYXJhY3RlckNvdW50O1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgU2FuaXRpemVyID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplclwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuXG5jb25zdCBDT01CT19CT1hfQ0xBU1MgPSBgJHtQUkVGSVh9LWNvbWJvLWJveGA7XG5jb25zdCBDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9LS1wcmlzdGluZWA7XG5jb25zdCBTRUxFQ1RfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19zZWxlY3RgO1xuY29uc3QgSU5QVVRfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19pbnB1dGA7XG5jb25zdCBDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19jbGVhci1pbnB1dGA7XG5jb25zdCBDTEVBUl9JTlBVVF9CVVRUT05fV1JBUFBFUl9DTEFTUyA9IGAke0NMRUFSX0lOUFVUX0JVVFRPTl9DTEFTU31fX3dyYXBwZXJgO1xuY29uc3QgSU5QVVRfQlVUVE9OX1NFUEFSQVRPUl9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX2lucHV0LWJ1dHRvbi1zZXBhcmF0b3JgO1xuY29uc3QgVE9HR0xFX0xJU1RfQlVUVE9OX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fdG9nZ2xlLWxpc3RgO1xuY29uc3QgVE9HR0xFX0xJU1RfQlVUVE9OX1dSQVBQRVJfQ0xBU1MgPSBgJHtUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1N9X193cmFwcGVyYDtcbmNvbnN0IExJU1RfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19saXN0YDtcbmNvbnN0IExJU1RfT1BUSU9OX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fbGlzdC1vcHRpb25gO1xuY29uc3QgTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyA9IGAke0xJU1RfT1BUSU9OX0NMQVNTfS0tZm9jdXNlZGA7XG5jb25zdCBMSVNUX09QVElPTl9TRUxFQ1RFRF9DTEFTUyA9IGAke0xJU1RfT1BUSU9OX0NMQVNTfS0tc2VsZWN0ZWRgO1xuY29uc3QgU1RBVFVTX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fc3RhdHVzYDtcblxuY29uc3QgQ09NQk9fQk9YID0gYC4ke0NPTUJPX0JPWF9DTEFTU31gO1xuY29uc3QgU0VMRUNUID0gYC4ke1NFTEVDVF9DTEFTU31gO1xuY29uc3QgSU5QVVQgPSBgLiR7SU5QVVRfQ0xBU1N9YDtcbmNvbnN0IENMRUFSX0lOUFVUX0JVVFRPTiA9IGAuJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IFRPR0dMRV9MSVNUX0JVVFRPTiA9IGAuJHtUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IExJU1QgPSBgLiR7TElTVF9DTEFTU31gO1xuY29uc3QgTElTVF9PUFRJT04gPSBgLiR7TElTVF9PUFRJT05fQ0xBU1N9YDtcbmNvbnN0IExJU1RfT1BUSU9OX0ZPQ1VTRUQgPSBgLiR7TElTVF9PUFRJT05fRk9DVVNFRF9DTEFTU31gO1xuY29uc3QgTElTVF9PUFRJT05fU0VMRUNURUQgPSBgLiR7TElTVF9PUFRJT05fU0VMRUNURURfQ0xBU1N9YDtcbmNvbnN0IFNUQVRVUyA9IGAuJHtTVEFUVVNfQ0xBU1N9YDtcblxuY29uc3QgREVGQVVMVF9GSUxURVIgPSBcIi4qe3txdWVyeX19LipcIjtcblxuY29uc3Qgbm9vcCA9ICgpID0+IHt9O1xuXG4vKipcbiAqIHNldCB0aGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQgYW5kIGRpc3BhdGNoIGEgY2hhbmdlIGV2ZW50XG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fEhUTUxTZWxlY3RFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB0byB1cGRhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBlbGVtZW50XG4gKi9cbmNvbnN0IGNoYW5nZUVsZW1lbnRWYWx1ZSA9IChlbCwgdmFsdWUgPSBcIlwiKSA9PiB7XG4gIGNvbnN0IGVsZW1lbnRUb0NoYW5nZSA9IGVsO1xuICBlbGVtZW50VG9DaGFuZ2UudmFsdWUgPSB2YWx1ZTtcblxuICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudChcImNoYW5nZVwiLCB7XG4gICAgYnViYmxlczogdHJ1ZSxcbiAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgIGRldGFpbDogeyB2YWx1ZSB9LFxuICB9KTtcbiAgZWxlbWVudFRvQ2hhbmdlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuLyoqXG4gKiBUaGUgZWxlbWVudHMgd2l0aGluIHRoZSBjb21ibyBib3guXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDb21ib0JveENvbnRleHRcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IGNvbWJvQm94RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTFNlbGVjdEVsZW1lbnR9IHNlbGVjdEVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTFVMaXN0RWxlbWVudH0gbGlzdEVsXG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBzdGF0dXNFbFxuICogQHByb3BlcnR5IHtIVE1MTElFbGVtZW50fSBmb2N1c2VkT3B0aW9uRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTExJRWxlbWVudH0gc2VsZWN0ZWRPcHRpb25FbFxuICogQHByb3BlcnR5IHtIVE1MQnV0dG9uRWxlbWVudH0gdG9nZ2xlTGlzdEJ0bkVsXG4gKiBAcHJvcGVydHkge0hUTUxCdXR0b25FbGVtZW50fSBjbGVhcklucHV0QnRuRWxcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gaXNQcmlzdGluZVxuICogQHByb3BlcnR5IHtib29sZWFufSBkaXNhYmxlRmlsdGVyaW5nXG4gKi9cblxuLyoqXG4gKiBHZXQgYW4gb2JqZWN0IG9mIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3hcbiAqIEByZXR1cm5zIHtDb21ib0JveENvbnRleHR9IGVsZW1lbnRzXG4gKi9cbmNvbnN0IGdldENvbWJvQm94Q29udGV4dCA9IChlbCkgPT4ge1xuICBjb25zdCBjb21ib0JveEVsID0gZWwuY2xvc2VzdChDT01CT19CT1gpO1xuXG4gIGlmICghY29tYm9Cb3hFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7Q09NQk9fQk9YfWApO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoU0VMRUNUKTtcbiAgY29uc3QgaW5wdXRFbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihJTlBVVCk7XG4gIGNvbnN0IGxpc3RFbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihMSVNUKTtcbiAgY29uc3Qgc3RhdHVzRWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoU1RBVFVTKTtcbiAgY29uc3QgZm9jdXNlZE9wdGlvbkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OX0ZPQ1VTRUQpO1xuICBjb25zdCBzZWxlY3RlZE9wdGlvbkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OX1NFTEVDVEVEKTtcbiAgY29uc3QgdG9nZ2xlTGlzdEJ0bkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFRPR0dMRV9MSVNUX0JVVFRPTik7XG4gIGNvbnN0IGNsZWFySW5wdXRCdG5FbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihDTEVBUl9JTlBVVF9CVVRUT04pO1xuXG4gIGNvbnN0IGlzUHJpc3RpbmUgPSBjb21ib0JveEVsLmNsYXNzTGlzdC5jb250YWlucyhDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuICBjb25zdCBkaXNhYmxlRmlsdGVyaW5nID0gY29tYm9Cb3hFbC5kYXRhc2V0LmRpc2FibGVGaWx0ZXJpbmcgPT09IFwidHJ1ZVwiO1xuXG4gIHJldHVybiB7XG4gICAgY29tYm9Cb3hFbCxcbiAgICBzZWxlY3RFbCxcbiAgICBpbnB1dEVsLFxuICAgIGxpc3RFbCxcbiAgICBzdGF0dXNFbCxcbiAgICBmb2N1c2VkT3B0aW9uRWwsXG4gICAgc2VsZWN0ZWRPcHRpb25FbCxcbiAgICB0b2dnbGVMaXN0QnRuRWwsXG4gICAgY2xlYXJJbnB1dEJ0bkVsLFxuICAgIGlzUHJpc3RpbmUsXG4gICAgZGlzYWJsZUZpbHRlcmluZyxcbiAgfTtcbn07XG5cbi8qKlxuICogRGlzYWJsZSB0aGUgY29tYm8tYm94IGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGlucHV0RWwsIHRvZ2dsZUxpc3RCdG5FbCwgY2xlYXJJbnB1dEJ0bkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIGNsZWFySW5wdXRCdG5FbC5oaWRkZW4gPSB0cnVlO1xuICBjbGVhcklucHV0QnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xuICB0b2dnbGVMaXN0QnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xuICBpbnB1dEVsLmRpc2FibGVkID0gdHJ1ZTtcbn07XG5cbi8qKlxuICogQ2hlY2sgZm9yIGFyaWEtZGlzYWJsZWQgb24gaW5pdGlhbGl6YXRpb25cbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGFyaWFEaXNhYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgaW5wdXRFbCwgdG9nZ2xlTGlzdEJ0bkVsLCBjbGVhcklucHV0QnRuRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgY2xlYXJJbnB1dEJ0bkVsLmhpZGRlbiA9IHRydWU7XG4gIGNsZWFySW5wdXRCdG5FbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIsIHRydWUpO1xuICB0b2dnbGVMaXN0QnRuRWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCB0cnVlKTtcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIsIHRydWUpO1xufTtcblxuLyoqXG4gKiBFbmFibGUgdGhlIGNvbWJvLWJveCBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGVuYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGlucHV0RWwsIHRvZ2dsZUxpc3RCdG5FbCwgY2xlYXJJbnB1dEJ0bkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIGNsZWFySW5wdXRCdG5FbC5oaWRkZW4gPSBmYWxzZTtcbiAgY2xlYXJJbnB1dEJ0bkVsLmRpc2FibGVkID0gZmFsc2U7XG4gIHRvZ2dsZUxpc3RCdG5FbC5kaXNhYmxlZCA9IGZhbHNlO1xuICBpbnB1dEVsLmRpc2FibGVkID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIEVuaGFuY2UgYSBzZWxlY3QgZWxlbWVudCBpbnRvIGEgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBfY29tYm9Cb3hFbCBUaGUgaW5pdGlhbCBlbGVtZW50IG9mIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGVuaGFuY2VDb21ib0JveCA9IChfY29tYm9Cb3hFbCkgPT4ge1xuICBjb25zdCBjb21ib0JveEVsID0gX2NvbWJvQm94RWwuY2xvc2VzdChDT01CT19CT1gpO1xuXG4gIGlmIChjb21ib0JveEVsLmRhdGFzZXQuZW5oYW5jZWQpIHJldHVybjtcblxuICBjb25zdCBzZWxlY3RFbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihcInNlbGVjdFwiKTtcblxuICBpZiAoIXNlbGVjdEVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0NPTUJPX0JPWH0gaXMgbWlzc2luZyBpbm5lciBzZWxlY3RgKTtcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdElkID0gc2VsZWN0RWwuaWQ7XG4gIGNvbnN0IHNlbGVjdExhYmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgbGFiZWxbZm9yPVwiJHtzZWxlY3RJZH1cIl1gKTtcbiAgY29uc3QgbGlzdElkID0gYCR7c2VsZWN0SWR9LS1saXN0YDtcbiAgY29uc3QgbGlzdElkTGFiZWwgPSBgJHtzZWxlY3RJZH0tbGFiZWxgO1xuICBjb25zdCBhc3Npc3RpdmVIaW50SUQgPSBgJHtzZWxlY3RJZH0tLWFzc2lzdGl2ZUhpbnRgO1xuICBjb25zdCBhZGRpdGlvbmFsQXR0cmlidXRlcyA9IFtdO1xuICBjb25zdCB7IGRlZmF1bHRWYWx1ZSB9ID0gY29tYm9Cb3hFbC5kYXRhc2V0O1xuICBjb25zdCB7IHBsYWNlaG9sZGVyIH0gPSBjb21ib0JveEVsLmRhdGFzZXQ7XG4gIGxldCBzZWxlY3RlZE9wdGlvbjtcblxuICBpZiAocGxhY2Vob2xkZXIpIHtcbiAgICBhZGRpdGlvbmFsQXR0cmlidXRlcy5wdXNoKHsgcGxhY2Vob2xkZXIgfSk7XG4gIH1cblxuICBpZiAoZGVmYXVsdFZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHNlbGVjdEVsLm9wdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IG9wdGlvbkVsID0gc2VsZWN0RWwub3B0aW9uc1tpXTtcblxuICAgICAgaWYgKG9wdGlvbkVsLnZhbHVlID09PSBkZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ZWRPcHRpb24gPSBvcHRpb25FbDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRocm93IGVycm9yIGlmIGNvbWJvYm94IGlzIG1pc3NpbmcgYSBsYWJlbCBvciBsYWJlbCBpcyBtaXNzaW5nXG4gICAqIGBmb3JgIGF0dHJpYnV0ZS4gT3RoZXJ3aXNlLCBzZXQgdGhlIElEIHRvIG1hdGNoIHRoZSA8dWw+IGFyaWEtbGFiZWxsZWRieVxuICAgKi9cbiAgaWYgKCFzZWxlY3RMYWJlbCB8fCAhc2VsZWN0TGFiZWwubWF0Y2hlcyhgbGFiZWxbZm9yPVwiJHtzZWxlY3RJZH1cIl1gKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGAke0NPTUJPX0JPWH0gZm9yICR7c2VsZWN0SWR9IGlzIGVpdGhlciBtaXNzaW5nIGEgbGFiZWwgb3IgYSBcImZvclwiIGF0dHJpYnV0ZWBcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHNlbGVjdExhYmVsLnNldEF0dHJpYnV0ZShcImlkXCIsIGxpc3RJZExhYmVsKTtcbiAgfVxuXG4gIHNlbGVjdExhYmVsLnNldEF0dHJpYnV0ZShcImlkXCIsIGxpc3RJZExhYmVsKTtcbiAgc2VsZWN0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICBzZWxlY3RFbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuICBzZWxlY3RFbC5jbGFzc0xpc3QuYWRkKFwidXNhLXNyLW9ubHlcIiwgU0VMRUNUX0NMQVNTKTtcbiAgc2VsZWN0RWwuaWQgPSBcIlwiO1xuICBzZWxlY3RFbC52YWx1ZSA9IFwiXCI7XG5cbiAgW1wicmVxdWlyZWRcIiwgXCJhcmlhLWxhYmVsXCIsIFwiYXJpYS1sYWJlbGxlZGJ5XCJdLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICBpZiAoc2VsZWN0RWwuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHNlbGVjdEVsLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIGFkZGl0aW9uYWxBdHRyaWJ1dGVzLnB1c2goeyBbbmFtZV06IHZhbHVlIH0pO1xuICAgICAgc2VsZWN0RWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gc2FuaXRpemUgZG9lc24ndCBsaWtlIGZ1bmN0aW9ucyBpbiB0ZW1wbGF0ZSBsaXRlcmFsc1xuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiaWRcIiwgc2VsZWN0SWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLW93bnNcIiwgbGlzdElkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBsaXN0SWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWF1dG9jb21wbGV0ZVwiLCBcImxpc3RcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgYXNzaXN0aXZlSGludElEKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcImZhbHNlXCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhdXRvY2FwaXRhbGl6ZVwiLCBcIm9mZlwiKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXV0b2NvbXBsZXRlXCIsIFwib2ZmXCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBJTlBVVF9DTEFTUyk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwiY29tYm9ib3hcIik7XG4gIGFkZGl0aW9uYWxBdHRyaWJ1dGVzLmZvckVhY2goKGF0dHIpID0+XG4gICAgT2JqZWN0LmtleXMoYXR0cikuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7YXR0cltrZXldfWA7XG4gICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG4gICAgfSlcbiAgKTtcblxuICBjb21ib0JveEVsLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBpbnB1dCk7XG5cbiAgY29tYm9Cb3hFbC5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgXCJiZWZvcmVlbmRcIixcbiAgICBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBcbiAgICA8c3BhbiBjbGFzcz1cIiR7Q0xFQVJfSU5QVVRfQlVUVE9OX1dSQVBQRVJfQ0xBU1N9XCIgdGFiaW5kZXg9XCItMVwiPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cIiR7Q0xFQVJfSU5QVVRfQlVUVE9OX0NMQVNTfVwiIGFyaWEtbGFiZWw9XCJDbGVhciB0aGUgc2VsZWN0IGNvbnRlbnRzXCI+Jm5ic3A7PC9idXR0b24+XG4gICAgICA8L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cIiR7SU5QVVRfQlVUVE9OX1NFUEFSQVRPUl9DTEFTU31cIj4mbmJzcDs8L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cIiR7VE9HR0xFX0xJU1RfQlVUVE9OX1dSQVBQRVJfQ0xBU1N9XCIgdGFiaW5kZXg9XCItMVwiPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiB0YWJpbmRleD1cIi0xXCIgY2xhc3M9XCIke1RPR0dMRV9MSVNUX0JVVFRPTl9DTEFTU31cIiBhcmlhLWxhYmVsPVwiVG9nZ2xlIHRoZSBkcm9wZG93biBsaXN0XCI+Jm5ic3A7PC9idXR0b24+XG4gICAgICA8L3NwYW4+XG4gICAgICA8dWxcbiAgICAgICAgdGFiaW5kZXg9XCItMVwiXG4gICAgICAgIGlkPVwiJHtsaXN0SWR9XCJcbiAgICAgICAgY2xhc3M9XCIke0xJU1RfQ0xBU1N9XCJcbiAgICAgICAgcm9sZT1cImxpc3Rib3hcIlxuICAgICAgICBhcmlhLWxhYmVsbGVkYnk9XCIke2xpc3RJZExhYmVsfVwiXG4gICAgICAgIGhpZGRlbj5cbiAgICAgIDwvdWw+XG4gICAgICA8ZGl2IGNsYXNzPVwiJHtTVEFUVVNfQ0xBU1N9IHVzYS1zci1vbmx5XCIgcm9sZT1cInN0YXR1c1wiPjwvZGl2PlxuICAgICAgPHNwYW4gaWQ9XCIke2Fzc2lzdGl2ZUhpbnRJRH1cIiBjbGFzcz1cInVzYS1zci1vbmx5XCI+XG4gICAgICAgIFdoZW4gYXV0b2NvbXBsZXRlIHJlc3VsdHMgYXJlIGF2YWlsYWJsZSB1c2UgdXAgYW5kIGRvd24gYXJyb3dzIHRvIHJldmlldyBhbmQgZW50ZXIgdG8gc2VsZWN0LlxuICAgICAgICBUb3VjaCBkZXZpY2UgdXNlcnMsIGV4cGxvcmUgYnkgdG91Y2ggb3Igd2l0aCBzd2lwZSBnZXN0dXJlcy5cbiAgICAgIDwvc3Bhbj5gXG4gICk7XG5cbiAgaWYgKHNlbGVjdGVkT3B0aW9uKSB7XG4gICAgY29uc3QgeyBpbnB1dEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoY29tYm9Cb3hFbCk7XG4gICAgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsLCBzZWxlY3RlZE9wdGlvbi52YWx1ZSk7XG4gICAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwsIHNlbGVjdGVkT3B0aW9uLnRleHQpO1xuICAgIGNvbWJvQm94RWwuY2xhc3NMaXN0LmFkZChDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuICB9XG5cbiAgaWYgKHNlbGVjdEVsLmRpc2FibGVkKSB7XG4gICAgZGlzYWJsZShjb21ib0JveEVsKTtcbiAgICBzZWxlY3RFbC5kaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHNlbGVjdEVsLmhhc0F0dHJpYnV0ZShcImFyaWEtZGlzYWJsZWRcIikpIHtcbiAgICBhcmlhRGlzYWJsZShjb21ib0JveEVsKTtcbiAgICBzZWxlY3RFbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIpO1xuICB9XG5cbiAgY29tYm9Cb3hFbC5kYXRhc2V0LmVuaGFuY2VkID0gXCJ0cnVlXCI7XG59O1xuXG4vKipcbiAqIE1hbmFnZSB0aGUgZm9jdXNlZCBlbGVtZW50IHdpdGhpbiB0aGUgbGlzdCBvcHRpb25zIHdoZW5cbiAqIG5hdmlnYXRpbmcgdmlhIGtleWJvYXJkLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGFuY2hvciBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbmV4dEVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBvcHRpb25zXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuc2tpcEZvY3VzIHNraXAgZm9jdXMgb2YgaGlnaGxpZ2h0ZWQgaXRlbVxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnByZXZlbnRTY3JvbGwgc2hvdWxkIHNraXAgcHJvY2VkdXJlIHRvIHNjcm9sbCB0byBlbGVtZW50XG4gKi9cbmNvbnN0IGhpZ2hsaWdodE9wdGlvbiA9IChlbCwgbmV4dEVsLCB7IHNraXBGb2N1cywgcHJldmVudFNjcm9sbCB9ID0ge30pID0+IHtcbiAgY29uc3QgeyBpbnB1dEVsLCBsaXN0RWwsIGZvY3VzZWRPcHRpb25FbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBpZiAoZm9jdXNlZE9wdGlvbkVsKSB7XG4gICAgZm9jdXNlZE9wdGlvbkVsLmNsYXNzTGlzdC5yZW1vdmUoTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyk7XG4gICAgZm9jdXNlZE9wdGlvbkVsLnNldEF0dHJpYnV0ZShcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gIH1cblxuICBpZiAobmV4dEVsKSB7XG4gICAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWFjdGl2ZWRlc2NlbmRhbnRcIiwgbmV4dEVsLmlkKTtcbiAgICBuZXh0RWwuc2V0QXR0cmlidXRlKFwidGFiSW5kZXhcIiwgXCIwXCIpO1xuICAgIG5leHRFbC5jbGFzc0xpc3QuYWRkKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xuXG4gICAgaWYgKCFwcmV2ZW50U2Nyb2xsKSB7XG4gICAgICBjb25zdCBvcHRpb25Cb3R0b20gPSBuZXh0RWwub2Zmc2V0VG9wICsgbmV4dEVsLm9mZnNldEhlaWdodDtcbiAgICAgIGNvbnN0IGN1cnJlbnRCb3R0b20gPSBsaXN0RWwuc2Nyb2xsVG9wICsgbGlzdEVsLm9mZnNldEhlaWdodDtcblxuICAgICAgaWYgKG9wdGlvbkJvdHRvbSA+IGN1cnJlbnRCb3R0b20pIHtcbiAgICAgICAgbGlzdEVsLnNjcm9sbFRvcCA9IG9wdGlvbkJvdHRvbSAtIGxpc3RFbC5vZmZzZXRIZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0RWwub2Zmc2V0VG9wIDwgbGlzdEVsLnNjcm9sbFRvcCkge1xuICAgICAgICBsaXN0RWwuc2Nyb2xsVG9wID0gbmV4dEVsLm9mZnNldFRvcDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXNraXBGb2N1cykge1xuICAgICAgbmV4dEVsLmZvY3VzKHsgcHJldmVudFNjcm9sbCB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWFjdGl2ZWRlc2NlbmRhbnRcIiwgXCJcIik7XG4gICAgaW5wdXRFbC5mb2N1cygpO1xuICB9XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgZHluYW1pYyByZWd1bGFyIGV4cHJlc3Npb24gYmFzZWQgb2ZmIG9mIGEgcmVwbGFjZWFibGUgYW5kIHBvc3NpYmx5IGZpbHRlcmVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IFRoZSB2YWx1ZSB0byB1c2UgaW4gdGhlIHJlZ3VsYXIgZXhwcmVzc2lvblxuICogQHBhcmFtIHtvYmplY3R9IGV4dHJhcyBBbiBvYmplY3Qgb2YgcmVndWxhciBleHByZXNzaW9ucyB0byByZXBsYWNlIGFuZCBmaWx0ZXIgdGhlIHF1ZXJ5XG4gKi9cbmNvbnN0IGdlbmVyYXRlRHluYW1pY1JlZ0V4cCA9IChmaWx0ZXIsIHF1ZXJ5ID0gXCJcIiwgZXh0cmFzID0ge30pID0+IHtcbiAgY29uc3QgZXNjYXBlUmVnRXhwID0gKHRleHQpID0+XG4gICAgdGV4dC5yZXBsYWNlKC9bLVtcXF17fSgpKis/LixcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XG5cbiAgbGV0IGZpbmQgPSBmaWx0ZXIucmVwbGFjZSgve3soLio/KX19L2csIChtLCAkMSkgPT4ge1xuICAgIGNvbnN0IGtleSA9ICQxLnRyaW0oKTtcbiAgICBjb25zdCBxdWVyeUZpbHRlciA9IGV4dHJhc1trZXldO1xuICAgIGlmIChrZXkgIT09IFwicXVlcnlcIiAmJiBxdWVyeUZpbHRlcikge1xuICAgICAgY29uc3QgbWF0Y2hlciA9IG5ldyBSZWdFeHAocXVlcnlGaWx0ZXIsIFwiaVwiKTtcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBxdWVyeS5tYXRjaChtYXRjaGVyKTtcblxuICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgcmV0dXJuIGVzY2FwZVJlZ0V4cChtYXRjaGVzWzFdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiBlc2NhcGVSZWdFeHAocXVlcnkpO1xuICB9KTtcblxuICBmaW5kID0gYF4oPzoke2ZpbmR9KSRgO1xuXG4gIHJldHVybiBuZXcgUmVnRXhwKGZpbmQsIFwiaVwiKTtcbn07XG5cbi8qKlxuICogRGlzcGxheSB0aGUgb3B0aW9uIGxpc3Qgb2YgYSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlMaXN0ID0gKGVsKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBjb21ib0JveEVsLFxuICAgIHNlbGVjdEVsLFxuICAgIGlucHV0RWwsXG4gICAgbGlzdEVsLFxuICAgIHN0YXR1c0VsLFxuICAgIGlzUHJpc3RpbmUsXG4gICAgZGlzYWJsZUZpbHRlcmluZyxcbiAgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG4gIGxldCBzZWxlY3RlZEl0ZW1JZDtcbiAgbGV0IGZpcnN0Rm91bmRJZDtcblxuICBjb25zdCBsaXN0T3B0aW9uQmFzZUlkID0gYCR7bGlzdEVsLmlkfS0tb3B0aW9uLWA7XG5cbiAgY29uc3QgaW5wdXRWYWx1ZSA9IChpbnB1dEVsLnZhbHVlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGZpbHRlciA9IGNvbWJvQm94RWwuZGF0YXNldC5maWx0ZXIgfHwgREVGQVVMVF9GSUxURVI7XG4gIGNvbnN0IHJlZ2V4ID0gZ2VuZXJhdGVEeW5hbWljUmVnRXhwKGZpbHRlciwgaW5wdXRWYWx1ZSwgY29tYm9Cb3hFbC5kYXRhc2V0KTtcblxuICBjb25zdCBvcHRpb25zID0gW107XG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBzZWxlY3RFbC5vcHRpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgY29uc3Qgb3B0aW9uRWwgPSBzZWxlY3RFbC5vcHRpb25zW2ldO1xuICAgIGNvbnN0IG9wdGlvbklkID0gYCR7bGlzdE9wdGlvbkJhc2VJZH0ke29wdGlvbnMubGVuZ3RofWA7XG5cbiAgICBpZiAoXG4gICAgICBvcHRpb25FbC52YWx1ZSAmJlxuICAgICAgKGRpc2FibGVGaWx0ZXJpbmcgfHxcbiAgICAgICAgaXNQcmlzdGluZSB8fFxuICAgICAgICAhaW5wdXRWYWx1ZSB8fFxuICAgICAgICByZWdleC50ZXN0KG9wdGlvbkVsLnRleHQpKVxuICAgICkge1xuICAgICAgaWYgKHNlbGVjdEVsLnZhbHVlICYmIG9wdGlvbkVsLnZhbHVlID09PSBzZWxlY3RFbC52YWx1ZSkge1xuICAgICAgICBzZWxlY3RlZEl0ZW1JZCA9IG9wdGlvbklkO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlzYWJsZUZpbHRlcmluZyAmJiAhZmlyc3RGb3VuZElkICYmIHJlZ2V4LnRlc3Qob3B0aW9uRWwudGV4dCkpIHtcbiAgICAgICAgZmlyc3RGb3VuZElkID0gb3B0aW9uSWQ7XG4gICAgICB9XG4gICAgICBvcHRpb25zLnB1c2gob3B0aW9uRWwpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG51bU9wdGlvbnMgPSBvcHRpb25zLmxlbmd0aDtcbiAgY29uc3Qgb3B0aW9uSHRtbCA9IG9wdGlvbnMubWFwKChvcHRpb24sIGluZGV4KSA9PiB7XG4gICAgY29uc3Qgb3B0aW9uSWQgPSBgJHtsaXN0T3B0aW9uQmFzZUlkfSR7aW5kZXh9YDtcbiAgICBjb25zdCBjbGFzc2VzID0gW0xJU1RfT1BUSU9OX0NMQVNTXTtcbiAgICBsZXQgdGFiaW5kZXggPSBcIi0xXCI7XG4gICAgbGV0IGFyaWFTZWxlY3RlZCA9IFwiZmFsc2VcIjtcblxuICAgIGlmIChvcHRpb25JZCA9PT0gc2VsZWN0ZWRJdGVtSWQpIHtcbiAgICAgIGNsYXNzZXMucHVzaChMSVNUX09QVElPTl9TRUxFQ1RFRF9DTEFTUywgTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyk7XG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xuICAgICAgYXJpYVNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgfVxuXG4gICAgaWYgKCFzZWxlY3RlZEl0ZW1JZCAmJiBpbmRleCA9PT0gMCkge1xuICAgICAgY2xhc3Nlcy5wdXNoKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xuICAgICAgdGFiaW5kZXggPSBcIjBcIjtcbiAgICB9XG5cbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcblxuICAgIGxpLnNldEF0dHJpYnV0ZShcImFyaWEtc2V0c2l6ZVwiLCBvcHRpb25zLmxlbmd0aCk7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwiYXJpYS1wb3NpbnNldFwiLCBpbmRleCArIDEpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgYXJpYVNlbGVjdGVkKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBvcHRpb25JZCk7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5qb2luKFwiIFwiKSk7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgdGFiaW5kZXgpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJvcHRpb25cIik7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiLCBvcHRpb24udmFsdWUpO1xuICAgIGxpLnRleHRDb250ZW50ID0gb3B0aW9uLnRleHQ7XG5cbiAgICByZXR1cm4gbGk7XG4gIH0pO1xuXG4gIGNvbnN0IG5vUmVzdWx0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgbm9SZXN1bHRzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGAke0xJU1RfT1BUSU9OX0NMQVNTfS0tbm8tcmVzdWx0c2ApO1xuICBub1Jlc3VsdHMudGV4dENvbnRlbnQgPSBcIk5vIHJlc3VsdHMgZm91bmRcIjtcblxuICBsaXN0RWwuaGlkZGVuID0gZmFsc2U7XG5cbiAgaWYgKG51bU9wdGlvbnMpIHtcbiAgICBsaXN0RWwuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBvcHRpb25IdG1sLmZvckVhY2goKGl0ZW0pID0+XG4gICAgICBsaXN0RWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGl0ZW0pXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBsaXN0RWwuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBsaXN0RWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIG5vUmVzdWx0cyk7XG4gIH1cblxuICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJ0cnVlXCIpO1xuXG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gbnVtT3B0aW9uc1xuICAgID8gYCR7bnVtT3B0aW9uc30gcmVzdWx0JHtudW1PcHRpb25zID4gMSA/IFwic1wiIDogXCJcIn0gYXZhaWxhYmxlLmBcbiAgICA6IFwiTm8gcmVzdWx0cy5cIjtcblxuICBsZXQgaXRlbVRvRm9jdXM7XG5cbiAgaWYgKGlzUHJpc3RpbmUgJiYgc2VsZWN0ZWRJdGVtSWQpIHtcbiAgICBpdGVtVG9Gb2N1cyA9IGxpc3RFbC5xdWVyeVNlbGVjdG9yKGAjJHtzZWxlY3RlZEl0ZW1JZH1gKTtcbiAgfSBlbHNlIGlmIChkaXNhYmxlRmlsdGVyaW5nICYmIGZpcnN0Rm91bmRJZCkge1xuICAgIGl0ZW1Ub0ZvY3VzID0gbGlzdEVsLnF1ZXJ5U2VsZWN0b3IoYCMke2ZpcnN0Rm91bmRJZH1gKTtcbiAgfVxuXG4gIGlmIChpdGVtVG9Gb2N1cykge1xuICAgIGhpZ2hsaWdodE9wdGlvbihsaXN0RWwsIGl0ZW1Ub0ZvY3VzLCB7XG4gICAgICBza2lwRm9jdXM6IHRydWUsXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogSGlkZSB0aGUgb3B0aW9uIGxpc3Qgb2YgYSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhpZGVMaXN0ID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgaW5wdXRFbCwgbGlzdEVsLCBzdGF0dXNFbCwgZm9jdXNlZE9wdGlvbkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIHN0YXR1c0VsLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1hY3RpdmVkZXNjZW5kYW50XCIsIFwiXCIpO1xuXG4gIGlmIChmb2N1c2VkT3B0aW9uRWwpIHtcbiAgICBmb2N1c2VkT3B0aW9uRWwuY2xhc3NMaXN0LnJlbW92ZShMSVNUX09QVElPTl9GT0NVU0VEX0NMQVNTKTtcbiAgfVxuXG4gIGxpc3RFbC5zY3JvbGxUb3AgPSAwO1xuICBsaXN0RWwuaGlkZGVuID0gdHJ1ZTtcbn07XG5cbi8qKlxuICogU2VsZWN0IGFuIG9wdGlvbiBsaXN0IG9mIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGxpc3RPcHRpb25FbCBUaGUgbGlzdCBvcHRpb24gYmVpbmcgc2VsZWN0ZWRcbiAqL1xuY29uc3Qgc2VsZWN0SXRlbSA9IChsaXN0T3B0aW9uRWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBzZWxlY3RFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGxpc3RPcHRpb25FbCk7XG5cbiAgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsLCBsaXN0T3B0aW9uRWwuZGF0YXNldC52YWx1ZSk7XG4gIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnB1dEVsLCBsaXN0T3B0aW9uRWwudGV4dENvbnRlbnQpO1xuICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcbiAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XG4gIGlucHV0RWwuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogQ2xlYXIgdGhlIGlucHV0IG9mIHRoZSBjb21ibyBib3hcbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBjbGVhckJ1dHRvbkVsIFRoZSBjbGVhciBpbnB1dCBidXR0b25cbiAqL1xuY29uc3QgY2xlYXJJbnB1dCA9IChjbGVhckJ1dHRvbkVsKSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgbGlzdEVsLCBzZWxlY3RFbCwgaW5wdXRFbCB9ID1cbiAgICBnZXRDb21ib0JveENvbnRleHQoY2xlYXJCdXR0b25FbCk7XG4gIGNvbnN0IGxpc3RTaG93biA9ICFsaXN0RWwuaGlkZGVuO1xuXG4gIGlmIChzZWxlY3RFbC52YWx1ZSkgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsKTtcbiAgaWYgKGlucHV0RWwudmFsdWUpIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnB1dEVsKTtcbiAgY29tYm9Cb3hFbC5jbGFzc0xpc3QucmVtb3ZlKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG5cbiAgaWYgKGxpc3RTaG93bikgZGlzcGxheUxpc3QoY29tYm9Cb3hFbCk7XG4gIGlucHV0RWwuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIHNlbGVjdCBiYXNlZCBvZmYgb2YgY3VycmVudGx5IHNldCBzZWxlY3QgdmFsdWVcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCByZXNldFNlbGVjdGlvbiA9IChlbCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIHNlbGVjdEVsLCBpbnB1dEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIGNvbnN0IHNlbGVjdFZhbHVlID0gc2VsZWN0RWwudmFsdWU7XG4gIGNvbnN0IGlucHV0VmFsdWUgPSAoaW5wdXRFbC52YWx1ZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChzZWxlY3RWYWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBzZWxlY3RFbC5vcHRpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XG4gICAgICBpZiAob3B0aW9uRWwudmFsdWUgPT09IHNlbGVjdFZhbHVlKSB7XG4gICAgICAgIGlmIChpbnB1dFZhbHVlICE9PSBvcHRpb25FbC50ZXh0KSB7XG4gICAgICAgICAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwsIG9wdGlvbkVsLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbWJvQm94RWwuY2xhc3NMaXN0LmFkZChDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGlucHV0VmFsdWUpIHtcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VsZWN0IGFuIG9wdGlvbiBsaXN0IG9mIHRoZSBjb21ibyBib3ggY29tcG9uZW50IGJhc2VkIG9mZiBvZlxuICogaGF2aW5nIGEgY3VycmVudCBmb2N1c2VkIGxpc3Qgb3B0aW9uIG9yXG4gKiBoYXZpbmcgdGVzdCB0aGF0IGNvbXBsZXRlbHkgbWF0Y2hlcyBhIGxpc3Qgb3B0aW9uLlxuICogT3RoZXJ3aXNlIGl0IGNsZWFycyB0aGUgaW5wdXQgYW5kIHNlbGVjdC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBjb21wbGV0ZVNlbGVjdGlvbiA9IChlbCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIHNlbGVjdEVsLCBpbnB1dEVsLCBzdGF0dXNFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFwiXCI7XG5cbiAgY29uc3QgaW5wdXRWYWx1ZSA9IChpbnB1dEVsLnZhbHVlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgaWYgKGlucHV0VmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gc2VsZWN0RWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgY29uc3Qgb3B0aW9uRWwgPSBzZWxlY3RFbC5vcHRpb25zW2ldO1xuICAgICAgaWYgKG9wdGlvbkVsLnRleHQudG9Mb3dlckNhc2UoKSA9PT0gaW5wdXRWYWx1ZSkge1xuICAgICAgICBjaGFuZ2VFbGVtZW50VmFsdWUoc2VsZWN0RWwsIG9wdGlvbkVsLnZhbHVlKTtcbiAgICAgICAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwsIG9wdGlvbkVsLnRleHQpO1xuICAgICAgICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlc2V0U2VsZWN0aW9uKGNvbWJvQm94RWwpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIGVzY2FwZSBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRXNjYXBlID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGV2ZW50LnRhcmdldCk7XG5cbiAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XG4gIHJlc2V0U2VsZWN0aW9uKGNvbWJvQm94RWwpO1xuICBpbnB1dEVsLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZG93biBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRG93bkZyb21JbnB1dCA9IChldmVudCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGV2ZW50LnRhcmdldCk7XG5cbiAgaWYgKGxpc3RFbC5oaWRkZW4pIHtcbiAgICBkaXNwbGF5TGlzdChjb21ib0JveEVsKTtcbiAgfVxuXG4gIGNvbnN0IG5leHRPcHRpb25FbCA9XG4gICAgbGlzdEVsLnF1ZXJ5U2VsZWN0b3IoTElTVF9PUFRJT05fRk9DVVNFRCkgfHxcbiAgICBsaXN0RWwucXVlcnlTZWxlY3RvcihMSVNUX09QVElPTik7XG5cbiAgaWYgKG5leHRPcHRpb25FbCkge1xuICAgIGhpZ2hsaWdodE9wdGlvbihjb21ib0JveEVsLCBuZXh0T3B0aW9uRWwpO1xuICB9XG5cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSBlbnRlciBldmVudCBmcm9tIGFuIGlucHV0IGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVudGVyRnJvbUlucHV0ID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgbGlzdEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZXZlbnQudGFyZ2V0KTtcbiAgY29uc3QgbGlzdFNob3duID0gIWxpc3RFbC5oaWRkZW47XG5cbiAgY29tcGxldGVTZWxlY3Rpb24oY29tYm9Cb3hFbCk7XG5cbiAgaWYgKGxpc3RTaG93bikge1xuICAgIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xuICB9XG5cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSBkb3duIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVEb3duRnJvbUxpc3RPcHRpb24gPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgZm9jdXNlZE9wdGlvbkVsID0gZXZlbnQudGFyZ2V0O1xuICBjb25zdCBuZXh0T3B0aW9uRWwgPSBmb2N1c2VkT3B0aW9uRWwubmV4dFNpYmxpbmc7XG5cbiAgaWYgKG5leHRPcHRpb25FbCkge1xuICAgIGhpZ2hsaWdodE9wdGlvbihmb2N1c2VkT3B0aW9uRWwsIG5leHRPcHRpb25FbCk7XG4gIH1cblxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIHNwYWNlIGV2ZW50IGZyb20gYW4gbGlzdCBvcHRpb24gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlU3BhY2VGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBzZWxlY3RJdGVtKGV2ZW50LnRhcmdldCk7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZW50ZXIgZXZlbnQgZnJvbSBsaXN0IG9wdGlvbiB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRW50ZXJGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBzZWxlY3RJdGVtKGV2ZW50LnRhcmdldCk7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgdXAgZXZlbnQgZnJvbSBsaXN0IG9wdGlvbiB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlVXBGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgZm9jdXNlZE9wdGlvbkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoXG4gICAgZXZlbnQudGFyZ2V0XG4gICk7XG4gIGNvbnN0IG5leHRPcHRpb25FbCA9IGZvY3VzZWRPcHRpb25FbCAmJiBmb2N1c2VkT3B0aW9uRWwucHJldmlvdXNTaWJsaW5nO1xuICBjb25zdCBsaXN0U2hvd24gPSAhbGlzdEVsLmhpZGRlbjtcblxuICBoaWdobGlnaHRPcHRpb24oY29tYm9Cb3hFbCwgbmV4dE9wdGlvbkVsKTtcblxuICBpZiAobGlzdFNob3duKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIGlmICghbmV4dE9wdGlvbkVsKSB7XG4gICAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VsZWN0IGxpc3Qgb3B0aW9uIG9uIHRoZSBtb3VzZW92ZXIgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgbW91c2VvdmVyIGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxMSUVsZW1lbnR9IGxpc3RPcHRpb25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVNb3VzZW92ZXIgPSAobGlzdE9wdGlvbkVsKSA9PiB7XG4gIGNvbnN0IGlzQ3VycmVudGx5Rm9jdXNlZCA9IGxpc3RPcHRpb25FbC5jbGFzc0xpc3QuY29udGFpbnMoXG4gICAgTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTU1xuICApO1xuXG4gIGlmIChpc0N1cnJlbnRseUZvY3VzZWQpIHJldHVybjtcblxuICBoaWdobGlnaHRPcHRpb24obGlzdE9wdGlvbkVsLCBsaXN0T3B0aW9uRWwsIHtcbiAgICBwcmV2ZW50U2Nyb2xsOiB0cnVlLFxuICB9KTtcbn07XG5cbi8qKlxuICogVG9nZ2xlIHRoZSBsaXN0IHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgdG9nZ2xlTGlzdCA9IChlbCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBpZiAobGlzdEVsLmhpZGRlbikge1xuICAgIGRpc3BsYXlMaXN0KGNvbWJvQm94RWwpO1xuICB9IGVsc2Uge1xuICAgIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xuICB9XG5cbiAgaW5wdXRFbC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgY2xpY2sgZnJvbSBpbnB1dFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlQ2xpY2tGcm9tSW5wdXQgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgaWYgKGxpc3RFbC5oaWRkZW4pIHtcbiAgICBkaXNwbGF5TGlzdChjb21ib0JveEVsKTtcbiAgfVxufTtcblxuY29uc3QgY29tYm9Cb3ggPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtJTlBVVF0oKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIGhhbmRsZUNsaWNrRnJvbUlucHV0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIFtUT0dHTEVfTElTVF9CVVRUT05dKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICB0b2dnbGVMaXN0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIFtMSVNUX09QVElPTl0oKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIHNlbGVjdEl0ZW0odGhpcyk7XG4gICAgICB9LFxuICAgICAgW0NMRUFSX0lOUFVUX0JVVFRPTl0oKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIGNsZWFySW5wdXQodGhpcyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgZm9jdXNvdXQ6IHtcbiAgICAgIFtDT01CT19CT1hdKGV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIHJlc2V0U2VsZWN0aW9uKHRoaXMpO1xuICAgICAgICAgIGhpZGVMaXN0KHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gICAga2V5ZG93bjoge1xuICAgICAgW0NPTUJPX0JPWF06IGtleW1hcCh7XG4gICAgICAgIEVzY2FwZTogaGFuZGxlRXNjYXBlLFxuICAgICAgfSksXG4gICAgICBbSU5QVVRdOiBrZXltYXAoe1xuICAgICAgICBFbnRlcjogaGFuZGxlRW50ZXJGcm9tSW5wdXQsXG4gICAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21JbnB1dCxcbiAgICAgICAgRG93bjogaGFuZGxlRG93bkZyb21JbnB1dCxcbiAgICAgIH0pLFxuICAgICAgW0xJU1RfT1BUSU9OXToga2V5bWFwKHtcbiAgICAgICAgQXJyb3dVcDogaGFuZGxlVXBGcm9tTGlzdE9wdGlvbixcbiAgICAgICAgVXA6IGhhbmRsZVVwRnJvbUxpc3RPcHRpb24sXG4gICAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21MaXN0T3B0aW9uLFxuICAgICAgICBEb3duOiBoYW5kbGVEb3duRnJvbUxpc3RPcHRpb24sXG4gICAgICAgIEVudGVyOiBoYW5kbGVFbnRlckZyb21MaXN0T3B0aW9uLFxuICAgICAgICBcIiBcIjogaGFuZGxlU3BhY2VGcm9tTGlzdE9wdGlvbixcbiAgICAgICAgXCJTaGlmdCtUYWJcIjogbm9vcCxcbiAgICAgIH0pLFxuICAgIH0sXG4gICAgaW5wdXQ6IHtcbiAgICAgIFtJTlBVVF0oKSB7XG4gICAgICAgIGNvbnN0IGNvbWJvQm94RWwgPSB0aGlzLmNsb3Nlc3QoQ09NQk9fQk9YKTtcbiAgICAgICAgY29tYm9Cb3hFbC5jbGFzc0xpc3QucmVtb3ZlKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG4gICAgICAgIGRpc3BsYXlMaXN0KHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIG1vdXNlb3Zlcjoge1xuICAgICAgW0xJU1RfT1BUSU9OXSgpIHtcbiAgICAgICAgaGFuZGxlTW91c2VvdmVyKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoQ09NQk9fQk9YLCByb290KS5mb3JFYWNoKChjb21ib0JveEVsKSA9PiB7XG4gICAgICAgIGVuaGFuY2VDb21ib0JveChjb21ib0JveEVsKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29tYm9Cb3hDb250ZXh0LFxuICAgIGVuaGFuY2VDb21ib0JveCxcbiAgICBnZW5lcmF0ZUR5bmFtaWNSZWdFeHAsXG4gICAgZGlzYWJsZSxcbiAgICBlbmFibGUsXG4gICAgZGlzcGxheUxpc3QsXG4gICAgaGlkZUxpc3QsXG4gICAgQ09NQk9fQk9YX0NMQVNTLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbWJvQm94O1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgYWN0aXZlRWxlbWVudCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9hY3RpdmUtZWxlbWVudFwiKTtcbmNvbnN0IGlzSW9zRGV2aWNlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWlvcy1kZXZpY2VcIik7XG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xuXG5jb25zdCBEQVRFX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tZGF0ZS1waWNrZXJgO1xuY29uc3QgREFURV9QSUNLRVJfV1JBUFBFUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9fd3JhcHBlcmA7XG5jb25zdCBEQVRFX1BJQ0tFUl9JTklUSUFMSVpFRF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfS0taW5pdGlhbGl6ZWRgO1xuY29uc3QgREFURV9QSUNLRVJfQUNUSVZFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9LS1hY3RpdmVgO1xuY29uc3QgREFURV9QSUNLRVJfSU5URVJOQUxfSU5QVVRfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX2ludGVybmFsLWlucHV0YDtcbmNvbnN0IERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19leHRlcm5hbC1pbnB1dGA7XG5jb25zdCBEQVRFX1BJQ0tFUl9CVVRUT05fQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX2J1dHRvbmA7XG5jb25zdCBEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9fY2FsZW5kYXJgO1xuY29uc3QgREFURV9QSUNLRVJfU1RBVFVTX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19zdGF0dXNgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fZGF0ZWA7XG5cbmNvbnN0IENBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1mb2N1c2VkYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfU0VMRUNURURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tc2VsZWN0ZWRgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9QUkVWSU9VU19NT05USF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1wcmV2aW91cy1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tY3VycmVudC1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX05FWFRfTU9OVEhfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tbmV4dC1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1JBTkdFX0RBVEVfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tcmFuZ2UtZGF0ZWA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1RPREFZX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXRvZGF5YDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9TVEFSVF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1yYW5nZS1kYXRlLXN0YXJ0YDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9FTkRfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tcmFuZ2UtZGF0ZS1lbmRgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9XSVRISU5fUkFOR0VfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0td2l0aGluLXJhbmdlYDtcbmNvbnN0IENBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3ByZXZpb3VzLXllYXJgO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEhfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3ByZXZpb3VzLW1vbnRoYDtcbmNvbnN0IENBTEVOREFSX05FWFRfWUVBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbmV4dC15ZWFyYDtcbmNvbnN0IENBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX25leHQtbW9udGhgO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aC1zZWxlY3Rpb25gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXItc2VsZWN0aW9uYDtcbmNvbnN0IENBTEVOREFSX01PTlRIX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aGA7XG5jb25zdCBDQUxFTkRBUl9NT05USF9GT0NVU0VEX0NMQVNTID0gYCR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9LS1mb2N1c2VkYDtcbmNvbnN0IENBTEVOREFSX01PTlRIX1NFTEVDVEVEX0NMQVNTID0gYCR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9LS1zZWxlY3RlZGA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X195ZWFyYDtcbmNvbnN0IENBTEVOREFSX1lFQVJfRk9DVVNFRF9DTEFTUyA9IGAke0NBTEVOREFSX1lFQVJfQ0xBU1N9LS1mb2N1c2VkYDtcbmNvbnN0IENBTEVOREFSX1lFQVJfU0VMRUNURURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9ZRUFSX0NMQVNTfS0tc2VsZWN0ZWRgO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOS19DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcHJldmlvdXMteWVhci1jaHVua2A7XG5jb25zdCBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX25leHQteWVhci1jaHVua2A7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1BJQ0tFUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fZGF0ZS1waWNrZXJgO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfUElDS0VSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aC1waWNrZXJgO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9QSUNLRVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXItcGlja2VyYDtcbmNvbnN0IENBTEVOREFSX1RBQkxFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X190YWJsZWA7XG5jb25zdCBDQUxFTkRBUl9ST1dfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3Jvd2A7XG5jb25zdCBDQUxFTkRBUl9DRUxMX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19jZWxsYDtcbmNvbnN0IENBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTID0gYCR7Q0FMRU5EQVJfQ0VMTF9DTEFTU30tLWNlbnRlci1pdGVtc2A7XG5jb25zdCBDQUxFTkRBUl9NT05USF9MQUJFTF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbW9udGgtbGFiZWxgO1xuY29uc3QgQ0FMRU5EQVJfREFZX09GX1dFRUtfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX2RheS1vZi13ZWVrYDtcblxuY29uc3QgREFURV9QSUNLRVIgPSBgLiR7REFURV9QSUNLRVJfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX0JVVFRPTiA9IGAuJHtEQVRFX1BJQ0tFUl9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUID0gYC4ke0RBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUX0NMQVNTfWA7XG5jb25zdCBEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVCA9IGAuJHtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF9DTEFTU31gO1xuY29uc3QgREFURV9QSUNLRVJfQ0FMRU5EQVIgPSBgLiR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX1NUQVRVUyA9IGAuJHtEQVRFX1BJQ0tFUl9TVEFUVVNfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX0RBVEUgPSBgLiR7Q0FMRU5EQVJfREFURV9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfREFURV9GT0NVU0VEID0gYC4ke0NBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfREFURV9DVVJSRU5UX01PTlRIID0gYC4ke0NBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUiA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19NT05USCA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19NT05USF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTkVYVF9ZRUFSID0gYC4ke0NBTEVOREFSX05FWFRfWUVBUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTkVYVF9NT05USCA9IGAuJHtDQUxFTkRBUl9ORVhUX01PTlRIX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTiA9IGAuJHtDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OID0gYC4ke0NBTEVOREFSX01PTlRIX1NFTEVDVElPTl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEggPSBgLiR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX1lFQVIgPSBgLiR7Q0FMRU5EQVJfWUVBUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOSyA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTksgPSBgLiR7Q0FMRU5EQVJfTkVYVF9ZRUFSX0NIVU5LX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1BJQ0tFUiA9IGAuJHtDQUxFTkRBUl9EQVRFX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfUElDS0VSID0gYC4ke0NBTEVOREFSX01PTlRIX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9QSUNLRVIgPSBgLiR7Q0FMRU5EQVJfWUVBUl9QSUNLRVJfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX01PTlRIX0ZPQ1VTRUQgPSBgLiR7Q0FMRU5EQVJfTU9OVEhfRk9DVVNFRF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9GT0NVU0VEID0gYC4ke0NBTEVOREFSX1lFQVJfRk9DVVNFRF9DTEFTU31gO1xuXG5jb25zdCBWQUxJREFUSU9OX01FU1NBR0UgPSBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGRhdGVcIjtcblxuY29uc3QgTU9OVEhfTEFCRUxTID0gW1xuICBcIkphbnVhcnlcIixcbiAgXCJGZWJydWFyeVwiLFxuICBcIk1hcmNoXCIsXG4gIFwiQXByaWxcIixcbiAgXCJNYXlcIixcbiAgXCJKdW5lXCIsXG4gIFwiSnVseVwiLFxuICBcIkF1Z3VzdFwiLFxuICBcIlNlcHRlbWJlclwiLFxuICBcIk9jdG9iZXJcIixcbiAgXCJOb3ZlbWJlclwiLFxuICBcIkRlY2VtYmVyXCIsXG5dO1xuXG5jb25zdCBEQVlfT0ZfV0VFS19MQUJFTFMgPSBbXG4gIFwiU3VuZGF5XCIsXG4gIFwiTW9uZGF5XCIsXG4gIFwiVHVlc2RheVwiLFxuICBcIldlZG5lc2RheVwiLFxuICBcIlRodXJzZGF5XCIsXG4gIFwiRnJpZGF5XCIsXG4gIFwiU2F0dXJkYXlcIixcbl07XG5cbmNvbnN0IEVOVEVSX0tFWUNPREUgPSAxMztcblxuY29uc3QgWUVBUl9DSFVOSyA9IDEyO1xuXG5jb25zdCBERUZBVUxUX01JTl9EQVRFID0gXCIwMDAwLTAxLTAxXCI7XG5jb25zdCBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUID0gXCJNTS9ERC9ZWVlZXCI7XG5jb25zdCBJTlRFUk5BTF9EQVRFX0ZPUk1BVCA9IFwiWVlZWS1NTS1ERFwiO1xuXG5jb25zdCBOT1RfRElTQUJMRURfU0VMRUNUT1IgPSBcIjpub3QoW2Rpc2FibGVkXSlcIjtcblxuY29uc3QgcHJvY2Vzc0ZvY3VzYWJsZVNlbGVjdG9ycyA9ICguLi5zZWxlY3RvcnMpID0+XG4gIHNlbGVjdG9ycy5tYXAoKHF1ZXJ5KSA9PiBxdWVyeSArIE5PVF9ESVNBQkxFRF9TRUxFQ1RPUikuam9pbihcIiwgXCIpO1xuXG5jb25zdCBEQVRFX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxuICBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSLFxuICBDQUxFTkRBUl9QUkVWSU9VU19NT05USCxcbiAgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT04sXG4gIENBTEVOREFSX01PTlRIX1NFTEVDVElPTixcbiAgQ0FMRU5EQVJfTkVYVF9ZRUFSLFxuICBDQUxFTkRBUl9ORVhUX01PTlRILFxuICBDQUxFTkRBUl9EQVRFX0ZPQ1VTRURcbik7XG5cbmNvbnN0IE1PTlRIX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxuICBDQUxFTkRBUl9NT05USF9GT0NVU0VEXG4pO1xuXG5jb25zdCBZRUFSX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxuICBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LLFxuICBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTkssXG4gIENBTEVOREFSX1lFQVJfRk9DVVNFRFxuKTtcblxuLy8gI3JlZ2lvbiBEYXRlIE1hbmlwdWxhdGlvbiBGdW5jdGlvbnNcblxuLyoqXG4gKiBLZWVwIGRhdGUgd2l0aGluIG1vbnRoLiBNb250aCB3b3VsZCBvbmx5IGJlIG92ZXIgYnkgMSB0byAzIGRheXNcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVUb0NoZWNrIHRoZSBkYXRlIG9iamVjdCB0byBjaGVja1xuICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIHRoZSBjb3JyZWN0IG1vbnRoXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGRhdGUsIGNvcnJlY3RlZCBpZiBuZWVkZWRcbiAqL1xuY29uc3Qga2VlcERhdGVXaXRoaW5Nb250aCA9IChkYXRlVG9DaGVjaywgbW9udGgpID0+IHtcbiAgaWYgKG1vbnRoICE9PSBkYXRlVG9DaGVjay5nZXRNb250aCgpKSB7XG4gICAgZGF0ZVRvQ2hlY2suc2V0RGF0ZSgwKTtcbiAgfVxuXG4gIHJldHVybiBkYXRlVG9DaGVjaztcbn07XG5cbi8qKlxuICogU2V0IGRhdGUgZnJvbSBtb250aCBkYXkgeWVhclxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIHRoZSB5ZWFyIHRvIHNldFxuICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIHRoZSBtb250aCB0byBzZXQgKHplcm8taW5kZXhlZClcbiAqIEBwYXJhbSB7bnVtYmVyfSBkYXRlIHRoZSBkYXRlIHRvIHNldFxuICogQHJldHVybnMge0RhdGV9IHRoZSBzZXQgZGF0ZVxuICovXG5jb25zdCBzZXREYXRlID0gKHllYXIsIG1vbnRoLCBkYXRlKSA9PiB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgwKTtcbiAgbmV3RGF0ZS5zZXRGdWxsWWVhcih5ZWFyLCBtb250aCwgZGF0ZSk7XG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiB0b2RheXMgZGF0ZVxuICpcbiAqIEByZXR1cm5zIHtEYXRlfSB0b2RheXMgZGF0ZVxuICovXG5jb25zdCB0b2RheSA9ICgpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGRheSA9IG5ld0RhdGUuZ2V0RGF0ZSgpO1xuICBjb25zdCBtb250aCA9IG5ld0RhdGUuZ2V0TW9udGgoKTtcbiAgY29uc3QgeWVhciA9IG5ld0RhdGUuZ2V0RnVsbFllYXIoKTtcbiAgcmV0dXJuIHNldERhdGUoeWVhciwgbW9udGgsIGRheSk7XG59O1xuXG4vKipcbiAqIFNldCBkYXRlIHRvIGZpcnN0IGRheSBvZiB0aGUgbW9udGhcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzdGFydE9mTW9udGggPSAoZGF0ZSkgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoMCk7XG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIDEpO1xuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogU2V0IGRhdGUgdG8gbGFzdCBkYXkgb2YgdGhlIG1vbnRoXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGRhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgbGFzdERheU9mTW9udGggPSAoZGF0ZSkgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoMCk7XG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCkgKyAxLCAwKTtcbiAgcmV0dXJuIG5ld0RhdGU7XG59O1xuXG4vKipcbiAqIEFkZCBkYXlzIHRvIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bURheXMgdGhlIGRpZmZlcmVuY2UgaW4gZGF5c1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGFkZERheXMgPSAoX2RhdGUsIG51bURheXMpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG4gIG5ld0RhdGUuc2V0RGF0ZShuZXdEYXRlLmdldERhdGUoKSArIG51bURheXMpO1xuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgZGF5cyBmcm9tIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bURheXMgdGhlIGRpZmZlcmVuY2UgaW4gZGF5c1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN1YkRheXMgPSAoX2RhdGUsIG51bURheXMpID0+IGFkZERheXMoX2RhdGUsIC1udW1EYXlzKTtcblxuLyoqXG4gKiBBZGQgd2Vla3MgdG8gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtV2Vla3MgdGhlIGRpZmZlcmVuY2UgaW4gd2Vla3NcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBhZGRXZWVrcyA9IChfZGF0ZSwgbnVtV2Vla3MpID0+IGFkZERheXMoX2RhdGUsIG51bVdlZWtzICogNyk7XG5cbi8qKlxuICogU3VidHJhY3Qgd2Vla3MgZnJvbSBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1XZWVrcyB0aGUgZGlmZmVyZW5jZSBpbiB3ZWVrc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN1YldlZWtzID0gKF9kYXRlLCBudW1XZWVrcykgPT4gYWRkV2Vla3MoX2RhdGUsIC1udW1XZWVrcyk7XG5cbi8qKlxuICogU2V0IGRhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSB3ZWVrIChTdW5kYXkpXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzdGFydE9mV2VlayA9IChfZGF0ZSkgPT4ge1xuICBjb25zdCBkYXlPZldlZWsgPSBfZGF0ZS5nZXREYXkoKTtcbiAgcmV0dXJuIHN1YkRheXMoX2RhdGUsIGRheU9mV2Vlayk7XG59O1xuXG4vKipcbiAqIFNldCBkYXRlIHRvIHRoZSBlbmQgb2YgdGhlIHdlZWsgKFNhdHVyZGF5KVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtV2Vla3MgdGhlIGRpZmZlcmVuY2UgaW4gd2Vla3NcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBlbmRPZldlZWsgPSAoX2RhdGUpID0+IHtcbiAgY29uc3QgZGF5T2ZXZWVrID0gX2RhdGUuZ2V0RGF5KCk7XG4gIHJldHVybiBhZGREYXlzKF9kYXRlLCA2IC0gZGF5T2ZXZWVrKTtcbn07XG5cbi8qKlxuICogQWRkIG1vbnRocyB0byBkYXRlIGFuZCBrZWVwIGRhdGUgd2l0aGluIG1vbnRoXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1Nb250aHMgdGhlIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgYWRkTW9udGhzID0gKF9kYXRlLCBudW1Nb250aHMpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG5cbiAgY29uc3QgZGF0ZU1vbnRoID0gKG5ld0RhdGUuZ2V0TW9udGgoKSArIDEyICsgbnVtTW9udGhzKSAlIDEyO1xuICBuZXdEYXRlLnNldE1vbnRoKG5ld0RhdGUuZ2V0TW9udGgoKSArIG51bU1vbnRocyk7XG4gIGtlZXBEYXRlV2l0aGluTW9udGgobmV3RGF0ZSwgZGF0ZU1vbnRoKTtcblxuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgbW9udGhzIGZyb20gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtTW9udGhzIHRoZSBkaWZmZXJlbmNlIGluIG1vbnRoc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN1Yk1vbnRocyA9IChfZGF0ZSwgbnVtTW9udGhzKSA9PiBhZGRNb250aHMoX2RhdGUsIC1udW1Nb250aHMpO1xuXG4vKipcbiAqIEFkZCB5ZWFycyB0byBkYXRlIGFuZCBrZWVwIGRhdGUgd2l0aGluIG1vbnRoXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1ZZWFycyB0aGUgZGlmZmVyZW5jZSBpbiB5ZWFyc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGFkZFllYXJzID0gKF9kYXRlLCBudW1ZZWFycykgPT4gYWRkTW9udGhzKF9kYXRlLCBudW1ZZWFycyAqIDEyKTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB5ZWFycyBmcm9tIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bVllYXJzIHRoZSBkaWZmZXJlbmNlIGluIHllYXJzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3Qgc3ViWWVhcnMgPSAoX2RhdGUsIG51bVllYXJzKSA9PiBhZGRZZWFycyhfZGF0ZSwgLW51bVllYXJzKTtcblxuLyoqXG4gKiBTZXQgbW9udGhzIG9mIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIHplcm8taW5kZXhlZCBtb250aCB0byBzZXRcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzZXRNb250aCA9IChfZGF0ZSwgbW9udGgpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG5cbiAgbmV3RGF0ZS5zZXRNb250aChtb250aCk7XG4gIGtlZXBEYXRlV2l0aGluTW9udGgobmV3RGF0ZSwgbW9udGgpO1xuXG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBTZXQgeWVhciBvZiBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIHRoZSB5ZWFyIHRvIHNldFxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHNldFllYXIgPSAoX2RhdGUsIHllYXIpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG5cbiAgY29uc3QgbW9udGggPSBuZXdEYXRlLmdldE1vbnRoKCk7XG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoeWVhcik7XG4gIGtlZXBEYXRlV2l0aGluTW9udGgobmV3RGF0ZSwgbW9udGgpO1xuXG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGVhcmxpZXN0IGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgZWFybGllc3QgZGF0ZVxuICovXG5jb25zdCBtaW4gPSAoZGF0ZUEsIGRhdGVCKSA9PiB7XG4gIGxldCBuZXdEYXRlID0gZGF0ZUE7XG5cbiAgaWYgKGRhdGVCIDwgZGF0ZUEpIHtcbiAgICBuZXdEYXRlID0gZGF0ZUI7XG4gIH1cblxuICByZXR1cm4gbmV3IERhdGUobmV3RGF0ZS5nZXRUaW1lKCkpO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxhdGVzdCBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSBkYXRlIHRvIGNvbXBhcmVcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUIgZGF0ZSB0byBjb21wYXJlXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGxhdGVzdCBkYXRlXG4gKi9cbmNvbnN0IG1heCA9IChkYXRlQSwgZGF0ZUIpID0+IHtcbiAgbGV0IG5ld0RhdGUgPSBkYXRlQTtcblxuICBpZiAoZGF0ZUIgPiBkYXRlQSkge1xuICAgIG5ld0RhdGUgPSBkYXRlQjtcbiAgfVxuXG4gIHJldHVybiBuZXcgRGF0ZShuZXdEYXRlLmdldFRpbWUoKSk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgaW4gdGhlIHNhbWUgeWVhclxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgZGF0ZSB0byBjb21wYXJlXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVCIGRhdGUgdG8gY29tcGFyZVxuICogQHJldHVybnMge2Jvb2xlYW59IGFyZSBkYXRlcyBpbiB0aGUgc2FtZSB5ZWFyXG4gKi9cbmNvbnN0IGlzU2FtZVllYXIgPSAoZGF0ZUEsIGRhdGVCKSA9PlxuICBkYXRlQSAmJiBkYXRlQiAmJiBkYXRlQS5nZXRGdWxsWWVhcigpID09PSBkYXRlQi5nZXRGdWxsWWVhcigpO1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgaW4gdGhlIHNhbWUgbW9udGhcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcbiAqIEByZXR1cm5zIHtib29sZWFufSBhcmUgZGF0ZXMgaW4gdGhlIHNhbWUgbW9udGhcbiAqL1xuY29uc3QgaXNTYW1lTW9udGggPSAoZGF0ZUEsIGRhdGVCKSA9PlxuICBpc1NhbWVZZWFyKGRhdGVBLCBkYXRlQikgJiYgZGF0ZUEuZ2V0TW9udGgoKSA9PT0gZGF0ZUIuZ2V0TW9udGgoKTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyBhcmUgdGhlIHNhbWUgZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgdGhlIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSB0aGUgZGF0ZSB0byBjb21wYXJlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYXJlIGRhdGVzIHRoZSBzYW1lIGRhdGVcbiAqL1xuY29uc3QgaXNTYW1lRGF5ID0gKGRhdGVBLCBkYXRlQikgPT5cbiAgaXNTYW1lTW9udGgoZGF0ZUEsIGRhdGVCKSAmJiBkYXRlQS5nZXREYXRlKCkgPT09IGRhdGVCLmdldERhdGUoKTtcblxuLyoqXG4gKiByZXR1cm4gYSBuZXcgZGF0ZSB3aXRoaW4gbWluaW11bSBhbmQgbWF4aW11bSBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlIGRhdGUgdG8gY2hlY2tcbiAqIEBwYXJhbSB7RGF0ZX0gbWluRGF0ZSBtaW5pbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgZGF0ZSBiZXR3ZWVuIG1pbiBhbmQgbWF4XG4gKi9cbmNvbnN0IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heCA9IChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKSA9PiB7XG4gIGxldCBuZXdEYXRlID0gZGF0ZTtcblxuICBpZiAoZGF0ZSA8IG1pbkRhdGUpIHtcbiAgICBuZXdEYXRlID0gbWluRGF0ZTtcbiAgfSBlbHNlIGlmIChtYXhEYXRlICYmIGRhdGUgPiBtYXhEYXRlKSB7XG4gICAgbmV3RGF0ZSA9IG1heERhdGU7XG4gIH1cblxuICByZXR1cm4gbmV3IERhdGUobmV3RGF0ZS5nZXRUaW1lKCkpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyBpcyB2YWxpZC5cbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGUgZGF0ZSB0byBjaGVja1xuICogQHBhcmFtIHtEYXRlfSBtaW5EYXRlIG1pbmltdW0gZGF0ZSB0byBhbGxvd1xuICogQHBhcmFtIHtEYXRlfSBtYXhEYXRlIG1heGltdW0gZGF0ZSB0byBhbGxvd1xuICogQHJldHVybiB7Ym9vbGVhbn0gaXMgdGhlcmUgYSBkYXkgd2l0aGluIHRoZSBtb250aCB3aXRoaW4gbWluIGFuZCBtYXggZGF0ZXNcbiAqL1xuY29uc3QgaXNEYXRlV2l0aGluTWluQW5kTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XG4gIGRhdGUgPj0gbWluRGF0ZSAmJiAoIW1heERhdGUgfHwgZGF0ZSA8PSBtYXhEYXRlKTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyBtb250aCBpcyBpbnZhbGlkLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSBkYXRlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcGFyYW0ge0RhdGV9IG1heERhdGUgbWF4aW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcmV0dXJuIHtib29sZWFufSBpcyB0aGUgbW9udGggb3V0c2lkZSBtaW4gb3IgbWF4IGRhdGVzXG4gKi9cbmNvbnN0IGlzRGF0ZXNNb250aE91dHNpZGVNaW5Pck1heCA9IChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKSA9PlxuICBsYXN0RGF5T2ZNb250aChkYXRlKSA8IG1pbkRhdGUgfHwgKG1heERhdGUgJiYgc3RhcnRPZk1vbnRoKGRhdGUpID4gbWF4RGF0ZSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgZGF0ZXMgeWVhciBpcyBpbnZhbGlkLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSBkYXRlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcGFyYW0ge0RhdGV9IG1heERhdGUgbWF4aW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcmV0dXJuIHtib29sZWFufSBpcyB0aGUgbW9udGggb3V0c2lkZSBtaW4gb3IgbWF4IGRhdGVzXG4gKi9cbmNvbnN0IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XG4gIGxhc3REYXlPZk1vbnRoKHNldE1vbnRoKGRhdGUsIDExKSkgPCBtaW5EYXRlIHx8XG4gIChtYXhEYXRlICYmIHN0YXJ0T2ZNb250aChzZXRNb250aChkYXRlLCAwKSkgPiBtYXhEYXRlKTtcblxuLyoqXG4gKiBQYXJzZSBhIGRhdGUgd2l0aCBmb3JtYXQgTS1ELVlZXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVTdHJpbmcgdGhlIGRhdGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZUZvcm1hdCB0aGUgZm9ybWF0IG9mIHRoZSBkYXRlIHN0cmluZ1xuICogQHBhcmFtIHtib29sZWFufSBhZGp1c3REYXRlIHNob3VsZCB0aGUgZGF0ZSBiZSBhZGp1c3RlZFxuICogQHJldHVybnMge0RhdGV9IHRoZSBwYXJzZWQgZGF0ZVxuICovXG5jb25zdCBwYXJzZURhdGVTdHJpbmcgPSAoXG4gIGRhdGVTdHJpbmcsXG4gIGRhdGVGb3JtYXQgPSBJTlRFUk5BTF9EQVRFX0ZPUk1BVCxcbiAgYWRqdXN0RGF0ZSA9IGZhbHNlXG4pID0+IHtcbiAgbGV0IGRhdGU7XG4gIGxldCBtb250aDtcbiAgbGV0IGRheTtcbiAgbGV0IHllYXI7XG4gIGxldCBwYXJzZWQ7XG5cbiAgaWYgKGRhdGVTdHJpbmcpIHtcbiAgICBsZXQgbW9udGhTdHI7XG4gICAgbGV0IGRheVN0cjtcbiAgICBsZXQgeWVhclN0cjtcblxuICAgIGlmIChkYXRlRm9ybWF0ID09PSBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUKSB7XG4gICAgICBbbW9udGhTdHIsIGRheVN0ciwgeWVhclN0cl0gPSBkYXRlU3RyaW5nLnNwbGl0KFwiL1wiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgW3llYXJTdHIsIG1vbnRoU3RyLCBkYXlTdHJdID0gZGF0ZVN0cmluZy5zcGxpdChcIi1cIik7XG4gICAgfVxuXG4gICAgaWYgKHllYXJTdHIpIHtcbiAgICAgIHBhcnNlZCA9IHBhcnNlSW50KHllYXJTdHIsIDEwKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgeWVhciA9IHBhcnNlZDtcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcbiAgICAgICAgICB5ZWFyID0gTWF0aC5tYXgoMCwgeWVhcik7XG4gICAgICAgICAgaWYgKHllYXJTdHIubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFllYXIgPSB0b2RheSgpLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50WWVhclN0dWIgPVxuICAgICAgICAgICAgICBjdXJyZW50WWVhciAtIChjdXJyZW50WWVhciAlIDEwICoqIHllYXJTdHIubGVuZ3RoKTtcbiAgICAgICAgICAgIHllYXIgPSBjdXJyZW50WWVhclN0dWIgKyBwYXJzZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1vbnRoU3RyKSB7XG4gICAgICBwYXJzZWQgPSBwYXJzZUludChtb250aFN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICBtb250aCA9IHBhcnNlZDtcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcbiAgICAgICAgICBtb250aCA9IE1hdGgubWF4KDEsIG1vbnRoKTtcbiAgICAgICAgICBtb250aCA9IE1hdGgubWluKDEyLCBtb250aCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobW9udGggJiYgZGF5U3RyICYmIHllYXIgIT0gbnVsbCkge1xuICAgICAgcGFyc2VkID0gcGFyc2VJbnQoZGF5U3RyLCAxMCk7XG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgIGRheSA9IHBhcnNlZDtcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcbiAgICAgICAgICBjb25zdCBsYXN0RGF5T2ZUaGVNb250aCA9IHNldERhdGUoeWVhciwgbW9udGgsIDApLmdldERhdGUoKTtcbiAgICAgICAgICBkYXkgPSBNYXRoLm1heCgxLCBkYXkpO1xuICAgICAgICAgIGRheSA9IE1hdGgubWluKGxhc3REYXlPZlRoZU1vbnRoLCBkYXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1vbnRoICYmIGRheSAmJiB5ZWFyICE9IG51bGwpIHtcbiAgICAgIGRhdGUgPSBzZXREYXRlKHllYXIsIG1vbnRoIC0gMSwgZGF5KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGF0ZTtcbn07XG5cbi8qKlxuICogRm9ybWF0IGEgZGF0ZSB0byBmb3JtYXQgTU0tREQtWVlZWVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSB0aGUgZGF0ZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRlRm9ybWF0IHRoZSBmb3JtYXQgb2YgdGhlIGRhdGUgc3RyaW5nXG4gKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgZm9ybWF0dGVkIGRhdGUgc3RyaW5nXG4gKi9cbmNvbnN0IGZvcm1hdERhdGUgPSAoZGF0ZSwgZGF0ZUZvcm1hdCA9IElOVEVSTkFMX0RBVEVfRk9STUFUKSA9PiB7XG4gIGNvbnN0IHBhZFplcm9zID0gKHZhbHVlLCBsZW5ndGgpID0+IGAwMDAwJHt2YWx1ZX1gLnNsaWNlKC1sZW5ndGgpO1xuXG4gIGNvbnN0IG1vbnRoID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgY29uc3QgZGF5ID0gZGF0ZS5nZXREYXRlKCk7XG4gIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG5cbiAgaWYgKGRhdGVGb3JtYXQgPT09IERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQpIHtcbiAgICByZXR1cm4gW3BhZFplcm9zKG1vbnRoLCAyKSwgcGFkWmVyb3MoZGF5LCAyKSwgcGFkWmVyb3MoeWVhciwgNCldLmpvaW4oXCIvXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtwYWRaZXJvcyh5ZWFyLCA0KSwgcGFkWmVyb3MobW9udGgsIDIpLCBwYWRaZXJvcyhkYXksIDIpXS5qb2luKFwiLVwiKTtcbn07XG5cbi8vICNlbmRyZWdpb24gRGF0ZSBNYW5pcHVsYXRpb24gRnVuY3Rpb25zXG5cbi8qKlxuICogQ3JlYXRlIGEgZ3JpZCBzdHJpbmcgZnJvbSBhbiBhcnJheSBvZiBodG1sIHN0cmluZ3NcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBodG1sQXJyYXkgdGhlIGFycmF5IG9mIGh0bWwgaXRlbXNcbiAqIEBwYXJhbSB7bnVtYmVyfSByb3dTaXplIHRoZSBsZW5ndGggb2YgYSByb3dcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBncmlkIHN0cmluZ1xuICovXG5jb25zdCBsaXN0VG9HcmlkSHRtbCA9IChodG1sQXJyYXksIHJvd1NpemUpID0+IHtcbiAgY29uc3QgZ3JpZCA9IFtdO1xuICBsZXQgcm93ID0gW107XG5cbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGh0bWxBcnJheS5sZW5ndGgpIHtcbiAgICByb3cgPSBbXTtcblxuICAgIGNvbnN0IHRyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xuICAgIHdoaWxlIChpIDwgaHRtbEFycmF5Lmxlbmd0aCAmJiByb3cubGVuZ3RoIDwgcm93U2l6ZSkge1xuICAgICAgY29uc3QgdGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG4gICAgICB0ZC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgaHRtbEFycmF5W2ldKTtcbiAgICAgIHJvdy5wdXNoKHRkKTtcbiAgICAgIGkgKz0gMTtcbiAgICB9XG5cbiAgICByb3cuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgdHIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5wdXNoKHRyKTtcbiAgfVxuXG4gIHJldHVybiBncmlkO1xufTtcblxuY29uc3QgY3JlYXRlVGFibGVCb2R5ID0gKGdyaWQpID0+IHtcbiAgY29uc3QgdGFibGVCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICBncmlkLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICB0YWJsZUJvZHkuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGVsZW1lbnQpO1xuICB9KTtcblxuICByZXR1cm4gdGFibGVCb2R5O1xufTtcblxuLyoqXG4gKiBzZXQgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IGFuZCBkaXNwYXRjaCBhIGNoYW5nZSBldmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgVGhlIGVsZW1lbnQgdG8gdXBkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgZWxlbWVudFxuICovXG5jb25zdCBjaGFuZ2VFbGVtZW50VmFsdWUgPSAoZWwsIHZhbHVlID0gXCJcIikgPT4ge1xuICBjb25zdCBlbGVtZW50VG9DaGFuZ2UgPSBlbDtcbiAgZWxlbWVudFRvQ2hhbmdlLnZhbHVlID0gdmFsdWU7XG5cbiAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoXCJjaGFuZ2VcIiwge1xuICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICBkZXRhaWw6IHsgdmFsdWUgfSxcbiAgfSk7XG4gIGVsZW1lbnRUb0NoYW5nZS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cbi8qKlxuICogVGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEYXRlUGlja2VyQ29udGV4dFxuICogQHByb3BlcnR5IHtIVE1MRGl2RWxlbWVudH0gY2FsZW5kYXJFbFxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZGF0ZVBpY2tlckVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGludGVybmFsSW5wdXRFbFxuICogQHByb3BlcnR5IHtIVE1MSW5wdXRFbGVtZW50fSBleHRlcm5hbElucHV0RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IHN0YXR1c0VsXG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBmaXJzdFllYXJDaHVua0VsXG4gKiBAcHJvcGVydHkge0RhdGV9IGNhbGVuZGFyRGF0ZVxuICogQHByb3BlcnR5IHtEYXRlfSBtaW5EYXRlXG4gKiBAcHJvcGVydHkge0RhdGV9IG1heERhdGVcbiAqIEBwcm9wZXJ0eSB7RGF0ZX0gc2VsZWN0ZWREYXRlXG4gKiBAcHJvcGVydHkge0RhdGV9IHJhbmdlRGF0ZVxuICogQHByb3BlcnR5IHtEYXRlfSBkZWZhdWx0RGF0ZVxuICovXG5cbi8qKlxuICogR2V0IGFuIG9iamVjdCBvZiB0aGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXJcbiAqIEByZXR1cm5zIHtEYXRlUGlja2VyQ29udGV4dH0gZWxlbWVudHNcbiAqL1xuY29uc3QgZ2V0RGF0ZVBpY2tlckNvbnRleHQgPSAoZWwpID0+IHtcbiAgY29uc3QgZGF0ZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1BJQ0tFUik7XG5cbiAgaWYgKCFkYXRlUGlja2VyRWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZW1lbnQgaXMgbWlzc2luZyBvdXRlciAke0RBVEVfUElDS0VSfWApO1xuICB9XG5cbiAgY29uc3QgaW50ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgREFURV9QSUNLRVJfSU5URVJOQUxfSU5QVVRcbiAgKTtcbiAgY29uc3QgZXh0ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRcbiAgKTtcbiAgY29uc3QgY2FsZW5kYXJFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX0NBTEVOREFSKTtcbiAgY29uc3QgdG9nZ2xlQnRuRWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihEQVRFX1BJQ0tFUl9CVVRUT04pO1xuICBjb25zdCBzdGF0dXNFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX1NUQVRVUyk7XG4gIGNvbnN0IGZpcnN0WWVhckNodW5rRWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSKTtcblxuICBjb25zdCBpbnB1dERhdGUgPSBwYXJzZURhdGVTdHJpbmcoXG4gICAgZXh0ZXJuYWxJbnB1dEVsLnZhbHVlLFxuICAgIERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQsXG4gICAgdHJ1ZVxuICApO1xuICBjb25zdCBzZWxlY3RlZERhdGUgPSBwYXJzZURhdGVTdHJpbmcoaW50ZXJuYWxJbnB1dEVsLnZhbHVlKTtcblxuICBjb25zdCBjYWxlbmRhckRhdGUgPSBwYXJzZURhdGVTdHJpbmcoY2FsZW5kYXJFbC5kYXRhc2V0LnZhbHVlKTtcbiAgY29uc3QgbWluRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhkYXRlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlKTtcbiAgY29uc3QgbWF4RGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhkYXRlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlKTtcbiAgY29uc3QgcmFuZ2VEYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0LnJhbmdlRGF0ZSk7XG4gIGNvbnN0IGRlZmF1bHREYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0LmRlZmF1bHREYXRlKTtcblxuICBpZiAobWluRGF0ZSAmJiBtYXhEYXRlICYmIG1pbkRhdGUgPiBtYXhEYXRlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWluaW11bSBkYXRlIGNhbm5vdCBiZSBhZnRlciBtYXhpbXVtIGRhdGVcIik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNhbGVuZGFyRGF0ZSxcbiAgICBtaW5EYXRlLFxuICAgIHRvZ2dsZUJ0bkVsLFxuICAgIHNlbGVjdGVkRGF0ZSxcbiAgICBtYXhEYXRlLFxuICAgIGZpcnN0WWVhckNodW5rRWwsXG4gICAgZGF0ZVBpY2tlckVsLFxuICAgIGlucHV0RGF0ZSxcbiAgICBpbnRlcm5hbElucHV0RWwsXG4gICAgZXh0ZXJuYWxJbnB1dEVsLFxuICAgIGNhbGVuZGFyRWwsXG4gICAgcmFuZ2VEYXRlLFxuICAgIGRlZmF1bHREYXRlLFxuICAgIHN0YXR1c0VsLFxuICB9O1xufTtcblxuLyoqXG4gKiBEaXNhYmxlIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc2FibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwsIHRvZ2dsZUJ0bkVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgdG9nZ2xlQnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xuICBleHRlcm5hbElucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBDaGVjayBmb3IgYXJpYS1kaXNhYmxlZCBvbiBpbml0aWFsaXphdGlvblxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgYXJpYURpc2FibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwsIHRvZ2dsZUJ0bkVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgdG9nZ2xlQnRuRWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCB0cnVlKTtcbiAgZXh0ZXJuYWxJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtZGlzYWJsZWRcIiwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBlbmFibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwsIHRvZ2dsZUJ0bkVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgdG9nZ2xlQnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgZXh0ZXJuYWxJbnB1dEVsLmRpc2FibGVkID0gZmFsc2U7XG59O1xuXG4vLyAjcmVnaW9uIFZhbGlkYXRpb25cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgdmFsdWUgaW4gdGhlIGlucHV0IGFzIGEgdmFsaWQgZGF0ZSBvZiBmb3JtYXQgTS9EL1lZWVlcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGlzRGF0ZUlucHV0SW52YWxpZCA9IChlbCkgPT4ge1xuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgbWluRGF0ZSwgbWF4RGF0ZSB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGNvbnN0IGRhdGVTdHJpbmcgPSBleHRlcm5hbElucHV0RWwudmFsdWU7XG4gIGxldCBpc0ludmFsaWQgPSBmYWxzZTtcblxuICBpZiAoZGF0ZVN0cmluZykge1xuICAgIGlzSW52YWxpZCA9IHRydWU7XG5cbiAgICBjb25zdCBkYXRlU3RyaW5nUGFydHMgPSBkYXRlU3RyaW5nLnNwbGl0KFwiL1wiKTtcbiAgICBjb25zdCBbbW9udGgsIGRheSwgeWVhcl0gPSBkYXRlU3RyaW5nUGFydHMubWFwKChzdHIpID0+IHtcbiAgICAgIGxldCB2YWx1ZTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KHN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkgdmFsdWUgPSBwYXJzZWQ7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBpZiAobW9udGggJiYgZGF5ICYmIHllYXIgIT0gbnVsbCkge1xuICAgICAgY29uc3QgY2hlY2tEYXRlID0gc2V0RGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheSk7XG5cbiAgICAgIGlmIChcbiAgICAgICAgY2hlY2tEYXRlLmdldE1vbnRoKCkgPT09IG1vbnRoIC0gMSAmJlxuICAgICAgICBjaGVja0RhdGUuZ2V0RGF0ZSgpID09PSBkYXkgJiZcbiAgICAgICAgY2hlY2tEYXRlLmdldEZ1bGxZZWFyKCkgPT09IHllYXIgJiZcbiAgICAgICAgZGF0ZVN0cmluZ1BhcnRzWzJdLmxlbmd0aCA9PT0gNCAmJlxuICAgICAgICBpc0RhdGVXaXRoaW5NaW5BbmRNYXgoY2hlY2tEYXRlLCBtaW5EYXRlLCBtYXhEYXRlKVxuICAgICAgKSB7XG4gICAgICAgIGlzSW52YWxpZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc0ludmFsaWQ7XG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIHRoZSB2YWx1ZSBpbiB0aGUgaW5wdXQgYXMgYSB2YWxpZCBkYXRlIG9mIGZvcm1hdCBNL0QvWVlZWVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgdmFsaWRhdGVEYXRlSW5wdXQgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgaXNJbnZhbGlkID0gaXNEYXRlSW5wdXRJbnZhbGlkKGV4dGVybmFsSW5wdXRFbCk7XG5cbiAgaWYgKGlzSW52YWxpZCAmJiAhZXh0ZXJuYWxJbnB1dEVsLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgZXh0ZXJuYWxJbnB1dEVsLnNldEN1c3RvbVZhbGlkaXR5KFZBTElEQVRJT05fTUVTU0FHRSk7XG4gIH1cblxuICBpZiAoIWlzSW52YWxpZCAmJiBleHRlcm5hbElucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UgPT09IFZBTElEQVRJT05fTUVTU0FHRSkge1xuICAgIGV4dGVybmFsSW5wdXRFbC5zZXRDdXN0b21WYWxpZGl0eShcIlwiKTtcbiAgfVxufTtcblxuLy8gI2VuZHJlZ2lvbiBWYWxpZGF0aW9uXG5cbi8qKlxuICogRW5hYmxlIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHJlY29uY2lsZUlucHV0VmFsdWVzID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsLCBpbnB1dERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgbGV0IG5ld1ZhbHVlID0gXCJcIjtcblxuICBpZiAoaW5wdXREYXRlICYmICFpc0RhdGVJbnB1dEludmFsaWQoZWwpKSB7XG4gICAgbmV3VmFsdWUgPSBmb3JtYXREYXRlKGlucHV0RGF0ZSk7XG4gIH1cblxuICBpZiAoaW50ZXJuYWxJbnB1dEVsLnZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnRlcm5hbElucHV0RWwsIG5ld1ZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZWxlY3QgdGhlIHZhbHVlIG9mIHRoZSBkYXRlIHBpY2tlciBpbnB1dHMuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVTdHJpbmcgVGhlIGRhdGUgc3RyaW5nIHRvIHVwZGF0ZSBpbiBZWVlZLU1NLUREIGZvcm1hdFxuICovXG5jb25zdCBzZXRDYWxlbmRhclZhbHVlID0gKGVsLCBkYXRlU3RyaW5nKSA9PiB7XG4gIGNvbnN0IHBhcnNlZERhdGUgPSBwYXJzZURhdGVTdHJpbmcoZGF0ZVN0cmluZyk7XG5cbiAgaWYgKHBhcnNlZERhdGUpIHtcbiAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZShwYXJzZWREYXRlLCBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUKTtcblxuICAgIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBpbnRlcm5hbElucHV0RWwsIGV4dGVybmFsSW5wdXRFbCB9ID1cbiAgICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnRlcm5hbElucHV0RWwsIGRhdGVTdHJpbmcpO1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShleHRlcm5hbElucHV0RWwsIGZvcm1hdHRlZERhdGUpO1xuXG4gICAgdmFsaWRhdGVEYXRlSW5wdXQoZGF0ZVBpY2tlckVsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBFbmhhbmNlIGFuIGlucHV0IHdpdGggdGhlIGRhdGUgcGlja2VyIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgVGhlIGluaXRpYWwgd3JhcHBpbmcgZWxlbWVudCBvZiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGVuaGFuY2VEYXRlUGlja2VyID0gKGVsKSA9PiB7XG4gIGNvbnN0IGRhdGVQaWNrZXJFbCA9IGVsLmNsb3Nlc3QoREFURV9QSUNLRVIpO1xuICBjb25zdCB7IGRlZmF1bHRWYWx1ZSB9ID0gZGF0ZVBpY2tlckVsLmRhdGFzZXQ7XG5cbiAgY29uc3QgaW50ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoYGlucHV0YCk7XG5cbiAgaWYgKCFpbnRlcm5hbElucHV0RWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7REFURV9QSUNLRVJ9IGlzIG1pc3NpbmcgaW5uZXIgaW5wdXRgKTtcbiAgfVxuXG4gIGlmIChpbnRlcm5hbElucHV0RWwudmFsdWUpIHtcbiAgICBpbnRlcm5hbElucHV0RWwudmFsdWUgPSBcIlwiO1xuICB9XG5cbiAgY29uc3QgbWluRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlIHx8IGludGVybmFsSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJtaW5cIilcbiAgKTtcbiAgZGF0ZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSA9IG1pbkRhdGVcbiAgICA/IGZvcm1hdERhdGUobWluRGF0ZSlcbiAgICA6IERFRkFVTFRfTUlOX0RBVEU7XG5cbiAgY29uc3QgbWF4RGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlIHx8IGludGVybmFsSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJtYXhcIilcbiAgKTtcbiAgaWYgKG1heERhdGUpIHtcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlID0gZm9ybWF0RGF0ZShtYXhEYXRlKTtcbiAgfVxuXG4gIGNvbnN0IGNhbGVuZGFyV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNhbGVuZGFyV3JhcHBlci5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX1dSQVBQRVJfQ0xBU1MpO1xuXG4gIGNvbnN0IGV4dGVybmFsSW5wdXRFbCA9IGludGVybmFsSW5wdXRFbC5jbG9uZU5vZGUoKTtcbiAgZXh0ZXJuYWxJbnB1dEVsLmNsYXNzTGlzdC5hZGQoREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRfQ0xBU1MpO1xuICBleHRlcm5hbElucHV0RWwudHlwZSA9IFwidGV4dFwiO1xuXG4gIGNhbGVuZGFyV3JhcHBlci5hcHBlbmRDaGlsZChleHRlcm5hbElucHV0RWwpO1xuICBjYWxlbmRhcldyYXBwZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgXG4gICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCIke0RBVEVfUElDS0VSX0JVVFRPTl9DTEFTU31cIiBhcmlhLWhhc3BvcHVwPVwidHJ1ZVwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgY2FsZW5kYXJcIj48L2J1dHRvbj5cbiAgICA8ZGl2IGNsYXNzPVwiJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31cIiByb2xlPVwiYXBwbGljYXRpb25cIiBoaWRkZW4+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInVzYS1zci1vbmx5ICR7REFURV9QSUNLRVJfU1RBVFVTX0NMQVNTfVwiIHJvbGU9XCJzdGF0dXNcIiBhcmlhLWxpdmU9XCJwb2xpdGVcIj48L2Rpdj5gXG4gICk7XG5cbiAgaW50ZXJuYWxJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XG4gIGludGVybmFsSW5wdXRFbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIGludGVybmFsSW5wdXRFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUX0NMQVNTKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnJlbW92ZUF0dHJpYnV0ZShcImlkXCIpO1xuICBpbnRlcm5hbElucHV0RWwucmVtb3ZlQXR0cmlidXRlKFwibmFtZVwiKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnJlcXVpcmVkID0gZmFsc2U7XG5cbiAgZGF0ZVBpY2tlckVsLmFwcGVuZENoaWxkKGNhbGVuZGFyV3JhcHBlcik7XG4gIGRhdGVQaWNrZXJFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0lOSVRJQUxJWkVEX0NMQVNTKTtcblxuICBpZiAoZGVmYXVsdFZhbHVlKSB7XG4gICAgc2V0Q2FsZW5kYXJWYWx1ZShkYXRlUGlja2VyRWwsIGRlZmF1bHRWYWx1ZSk7XG4gIH1cblxuICBpZiAoaW50ZXJuYWxJbnB1dEVsLmRpc2FibGVkKSB7XG4gICAgZGlzYWJsZShkYXRlUGlja2VyRWwpO1xuICAgIGludGVybmFsSW5wdXRFbC5kaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKGludGVybmFsSW5wdXRFbC5oYXNBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIpKSB7XG4gICAgYXJpYURpc2FibGUoZGF0ZVBpY2tlckVsKTtcbiAgICBpbnRlcm5hbElucHV0RWwucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiKTtcbiAgfVxufTtcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciAtIERhdGUgU2VsZWN0aW9uIFZpZXdcblxuLyoqXG4gKiByZW5kZXIgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGVUb0Rpc3BsYXkgYSBkYXRlIHRvIHJlbmRlciBvbiB0aGUgY2FsZW5kYXJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gYSByZWZlcmVuY2UgdG8gdGhlIG5ldyBjYWxlbmRhciBlbGVtZW50XG4gKi9cbmNvbnN0IHJlbmRlckNhbGVuZGFyID0gKGVsLCBfZGF0ZVRvRGlzcGxheSkgPT4ge1xuICBjb25zdCB7XG4gICAgZGF0ZVBpY2tlckVsLFxuICAgIGNhbGVuZGFyRWwsXG4gICAgc3RhdHVzRWwsXG4gICAgc2VsZWN0ZWREYXRlLFxuICAgIG1heERhdGUsXG4gICAgbWluRGF0ZSxcbiAgICByYW5nZURhdGUsXG4gIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IHRvZGF5c0RhdGUgPSB0b2RheSgpO1xuICBsZXQgZGF0ZVRvRGlzcGxheSA9IF9kYXRlVG9EaXNwbGF5IHx8IHRvZGF5c0RhdGU7XG5cbiAgY29uc3QgY2FsZW5kYXJXYXNIaWRkZW4gPSBjYWxlbmRhckVsLmhpZGRlbjtcblxuICBjb25zdCBmb2N1c2VkRGF0ZSA9IGFkZERheXMoZGF0ZVRvRGlzcGxheSwgMCk7XG4gIGNvbnN0IGZvY3VzZWRNb250aCA9IGRhdGVUb0Rpc3BsYXkuZ2V0TW9udGgoKTtcbiAgY29uc3QgZm9jdXNlZFllYXIgPSBkYXRlVG9EaXNwbGF5LmdldEZ1bGxZZWFyKCk7XG5cbiAgY29uc3QgcHJldk1vbnRoID0gc3ViTW9udGhzKGRhdGVUb0Rpc3BsYXksIDEpO1xuICBjb25zdCBuZXh0TW9udGggPSBhZGRNb250aHMoZGF0ZVRvRGlzcGxheSwgMSk7XG5cbiAgY29uc3QgY3VycmVudEZvcm1hdHRlZERhdGUgPSBmb3JtYXREYXRlKGRhdGVUb0Rpc3BsYXkpO1xuXG4gIGNvbnN0IGZpcnN0T2ZNb250aCA9IHN0YXJ0T2ZNb250aChkYXRlVG9EaXNwbGF5KTtcbiAgY29uc3QgcHJldkJ1dHRvbnNEaXNhYmxlZCA9IGlzU2FtZU1vbnRoKGRhdGVUb0Rpc3BsYXksIG1pbkRhdGUpO1xuICBjb25zdCBuZXh0QnV0dG9uc0Rpc2FibGVkID0gaXNTYW1lTW9udGgoZGF0ZVRvRGlzcGxheSwgbWF4RGF0ZSk7XG5cbiAgY29uc3QgcmFuZ2VDb25jbHVzaW9uRGF0ZSA9IHNlbGVjdGVkRGF0ZSB8fCBkYXRlVG9EaXNwbGF5O1xuICBjb25zdCByYW5nZVN0YXJ0RGF0ZSA9IHJhbmdlRGF0ZSAmJiBtaW4ocmFuZ2VDb25jbHVzaW9uRGF0ZSwgcmFuZ2VEYXRlKTtcbiAgY29uc3QgcmFuZ2VFbmREYXRlID0gcmFuZ2VEYXRlICYmIG1heChyYW5nZUNvbmNsdXNpb25EYXRlLCByYW5nZURhdGUpO1xuXG4gIGNvbnN0IHdpdGhpblJhbmdlU3RhcnREYXRlID0gcmFuZ2VEYXRlICYmIGFkZERheXMocmFuZ2VTdGFydERhdGUsIDEpO1xuICBjb25zdCB3aXRoaW5SYW5nZUVuZERhdGUgPSByYW5nZURhdGUgJiYgc3ViRGF5cyhyYW5nZUVuZERhdGUsIDEpO1xuXG4gIGNvbnN0IG1vbnRoTGFiZWwgPSBNT05USF9MQUJFTFNbZm9jdXNlZE1vbnRoXTtcblxuICBjb25zdCBnZW5lcmF0ZURhdGVIdG1sID0gKGRhdGVUb1JlbmRlcikgPT4ge1xuICAgIGNvbnN0IGNsYXNzZXMgPSBbQ0FMRU5EQVJfREFURV9DTEFTU107XG4gICAgY29uc3QgZGF5ID0gZGF0ZVRvUmVuZGVyLmdldERhdGUoKTtcbiAgICBjb25zdCBtb250aCA9IGRhdGVUb1JlbmRlci5nZXRNb250aCgpO1xuICAgIGNvbnN0IHllYXIgPSBkYXRlVG9SZW5kZXIuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBkYXlPZldlZWsgPSBkYXRlVG9SZW5kZXIuZ2V0RGF5KCk7XG5cbiAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZShkYXRlVG9SZW5kZXIpO1xuXG4gICAgbGV0IHRhYmluZGV4ID0gXCItMVwiO1xuXG4gICAgY29uc3QgaXNEaXNhYmxlZCA9ICFpc0RhdGVXaXRoaW5NaW5BbmRNYXgoZGF0ZVRvUmVuZGVyLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgICBjb25zdCBpc1NlbGVjdGVkID0gaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgc2VsZWN0ZWREYXRlKTtcblxuICAgIGlmIChpc1NhbWVNb250aChkYXRlVG9SZW5kZXIsIHByZXZNb250aCkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1BSRVZJT1VTX01PTlRIX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTYW1lTW9udGgoZGF0ZVRvUmVuZGVyLCBmb2N1c2VkRGF0ZSkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NhbWVNb250aChkYXRlVG9SZW5kZXIsIG5leHRNb250aCkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX05FWFRfTU9OVEhfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NlbGVjdGVkKSB7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9TRUxFQ1RFRF9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHRvZGF5c0RhdGUpKSB7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9UT0RBWV9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKHJhbmdlRGF0ZSkge1xuICAgICAgaWYgKGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHJhbmdlRGF0ZSkpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9DTEFTUyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCByYW5nZVN0YXJ0RGF0ZSkpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9TVEFSVF9DTEFTUyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCByYW5nZUVuZERhdGUpKSB7XG4gICAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1JBTkdFX0RBVEVfRU5EX0NMQVNTKTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBpc0RhdGVXaXRoaW5NaW5BbmRNYXgoXG4gICAgICAgICAgZGF0ZVRvUmVuZGVyLFxuICAgICAgICAgIHdpdGhpblJhbmdlU3RhcnREYXRlLFxuICAgICAgICAgIHdpdGhpblJhbmdlRW5kRGF0ZVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfV0lUSElOX1JBTkdFX0NMQVNTKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgZm9jdXNlZERhdGUpKSB7XG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTUyk7XG4gICAgfVxuXG4gICAgY29uc3QgbW9udGhTdHIgPSBNT05USF9MQUJFTFNbbW9udGhdO1xuICAgIGNvbnN0IGRheVN0ciA9IERBWV9PRl9XRUVLX0xBQkVMU1tkYXlPZldlZWtdO1xuXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgdGFiaW5kZXgpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc2VzLmpvaW4oXCIgXCIpKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1kYXlcIiwgZGF5KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1tb250aFwiLCBtb250aCArIDEpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXllYXJcIiwgeWVhcik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgZm9ybWF0dGVkRGF0ZSk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcbiAgICAgIFwiYXJpYS1sYWJlbFwiLFxuICAgICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtkYXl9ICR7bW9udGhTdHJ9ICR7eWVhcn0gJHtkYXlTdHJ9YFxuICAgICk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgaXNTZWxlY3RlZCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiKTtcbiAgICBpZiAoaXNEaXNhYmxlZCA9PT0gdHJ1ZSkge1xuICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgYnRuLnRleHRDb250ZW50ID0gZGF5O1xuXG4gICAgcmV0dXJuIGJ0bjtcbiAgfTtcblxuICAvLyBzZXQgZGF0ZSB0byBmaXJzdCByZW5kZXJlZCBkYXlcbiAgZGF0ZVRvRGlzcGxheSA9IHN0YXJ0T2ZXZWVrKGZpcnN0T2ZNb250aCk7XG5cbiAgY29uc3QgZGF5cyA9IFtdO1xuXG4gIHdoaWxlIChcbiAgICBkYXlzLmxlbmd0aCA8IDI4IHx8XG4gICAgZGF0ZVRvRGlzcGxheS5nZXRNb250aCgpID09PSBmb2N1c2VkTW9udGggfHxcbiAgICBkYXlzLmxlbmd0aCAlIDcgIT09IDBcbiAgKSB7XG4gICAgZGF5cy5wdXNoKGdlbmVyYXRlRGF0ZUh0bWwoZGF0ZVRvRGlzcGxheSkpO1xuICAgIGRhdGVUb0Rpc3BsYXkgPSBhZGREYXlzKGRhdGVUb0Rpc3BsYXksIDEpO1xuICB9XG5cbiAgY29uc3QgZGF0ZXNHcmlkID0gbGlzdFRvR3JpZEh0bWwoZGF5cywgNyk7XG5cbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBjYWxlbmRhckVsLmNsb25lTm9kZSgpO1xuICBuZXdDYWxlbmRhci5kYXRhc2V0LnZhbHVlID0gY3VycmVudEZvcm1hdHRlZERhdGU7XG4gIG5ld0NhbGVuZGFyLnN0eWxlLnRvcCA9IGAke2RhdGVQaWNrZXJFbC5vZmZzZXRIZWlnaHR9cHhgO1xuICBuZXdDYWxlbmRhci5oaWRkZW4gPSBmYWxzZTtcbiAgbmV3Q2FsZW5kYXIuaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgXG4gICAgPGRpdiB0YWJpbmRleD1cIi0xXCIgY2xhc3M9XCIke0NBTEVOREFSX0RBVEVfUElDS0VSX0NMQVNTfVwiPlxuICAgICAgPGRpdiBjbGFzcz1cIiR7Q0FMRU5EQVJfUk9XX0NMQVNTfVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyXCJcbiAgICAgICAgICAgICR7cHJldkJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cbiAgICAgICAgICA+PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX1BSRVZJT1VTX01PTlRIX0NMQVNTfVwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiTmF2aWdhdGUgYmFjayBvbmUgbW9udGhcIlxuICAgICAgICAgICAgJHtwcmV2QnV0dG9uc0Rpc2FibGVkID8gYGRpc2FibGVkPVwiZGlzYWJsZWRcImAgOiBcIlwifVxuICAgICAgICAgID48L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfTU9OVEhfTEFCRUxfQ0xBU1N9XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OX0NMQVNTfVwiIGFyaWEtbGFiZWw9XCIke21vbnRoTGFiZWx9LiBTZWxlY3QgbW9udGhcIlxuICAgICAgICAgID4ke21vbnRoTGFiZWx9PC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIiR7Zm9jdXNlZFllYXJ9LiBTZWxlY3QgeWVhclwiXG4gICAgICAgICAgPiR7Zm9jdXNlZFllYXJ9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBmb3J3YXJkIG9uZSBtb250aFwiXG4gICAgICAgICAgICAke25leHRCdXR0b25zRGlzYWJsZWQgPyBgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiYCA6IFwiXCJ9XG4gICAgICAgICAgPjwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIiR7Q0FMRU5EQVJfQ0VMTF9DTEFTU30gJHtDQUxFTkRBUl9DRUxMX0NFTlRFUl9JVEVNU19DTEFTU31cIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiJHtDQUxFTkRBUl9ORVhUX1lFQVJfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyXCJcbiAgICAgICAgICAgICR7bmV4dEJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cbiAgICAgICAgICA+PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcblxuICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xuXG4gIGNvbnN0IHRhYmxlSGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgdGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlSGVhZCk7XG4gIGNvbnN0IHRhYmxlSGVhZFJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcbiAgdGFibGVIZWFkLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUhlYWRSb3cpO1xuXG4gIGNvbnN0IGRheXNPZldlZWsgPSB7XG4gICAgU3VuZGF5OiBcIlNcIixcbiAgICBNb25kYXk6IFwiTVwiLFxuICAgIFR1ZXNkYXk6IFwiVFwiLFxuICAgIFdlZG5lc2RheTogXCJXXCIsXG4gICAgVGh1cnNkYXk6IFwiVGhcIixcbiAgICBGcmlkYXk6IFwiRnJcIixcbiAgICBTYXR1cmRheTogXCJTXCIsXG4gIH07XG5cbiAgT2JqZWN0LmtleXMoZGF5c09mV2VlaykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgY29uc3QgdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhcIik7XG4gICAgdGguc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfREFZX09GX1dFRUtfQ0xBU1MpO1xuICAgIHRoLnNldEF0dHJpYnV0ZShcInNjb3BlXCIsIFwiY29sXCIpO1xuICAgIHRoLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwga2V5KTtcbiAgICB0aC50ZXh0Q29udGVudCA9IGRheXNPZldlZWtba2V5XTtcbiAgICB0YWJsZUhlYWRSb3cuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRoKTtcbiAgfSk7XG5cbiAgY29uc3QgdGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KGRhdGVzR3JpZCk7XG4gIHRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUJvZHkpO1xuXG4gIC8vIENvbnRhaW5lciBmb3IgWWVhcnMsIE1vbnRocywgYW5kIERheXNcbiAgY29uc3QgZGF0ZVBpY2tlckNhbGVuZGFyQ29udGFpbmVyID1cbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcblxuICBkYXRlUGlja2VyQ2FsZW5kYXJDb250YWluZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlKTtcblxuICBjYWxlbmRhckVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0NhbGVuZGFyLCBjYWxlbmRhckVsKTtcblxuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MpO1xuXG4gIGNvbnN0IHN0YXR1c2VzID0gW107XG5cbiAgaWYgKGlzU2FtZURheShzZWxlY3RlZERhdGUsIGZvY3VzZWREYXRlKSkge1xuICAgIHN0YXR1c2VzLnB1c2goXCJTZWxlY3RlZCBkYXRlXCIpO1xuICB9XG5cbiAgaWYgKGNhbGVuZGFyV2FzSGlkZGVuKSB7XG4gICAgc3RhdHVzZXMucHVzaChcbiAgICAgIFwiWW91IGNhbiBuYXZpZ2F0ZSBieSBkYXkgdXNpbmcgbGVmdCBhbmQgcmlnaHQgYXJyb3dzXCIsXG4gICAgICBcIldlZWtzIGJ5IHVzaW5nIHVwIGFuZCBkb3duIGFycm93c1wiLFxuICAgICAgXCJNb250aHMgYnkgdXNpbmcgcGFnZSB1cCBhbmQgcGFnZSBkb3duIGtleXNcIixcbiAgICAgIFwiWWVhcnMgYnkgdXNpbmcgc2hpZnQgcGx1cyBwYWdlIHVwIGFuZCBzaGlmdCBwbHVzIHBhZ2UgZG93blwiLFxuICAgICAgXCJIb21lIGFuZCBlbmQga2V5cyBuYXZpZ2F0ZSB0byB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgYSB3ZWVrXCJcbiAgICApO1xuICAgIHN0YXR1c0VsLnRleHRDb250ZW50ID0gXCJcIjtcbiAgfSBlbHNlIHtcbiAgICBzdGF0dXNlcy5wdXNoKGAke21vbnRoTGFiZWx9ICR7Zm9jdXNlZFllYXJ9YCk7XG4gIH1cbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBzdGF0dXNlcy5qb2luKFwiLiBcIik7XG5cbiAgcmV0dXJuIG5ld0NhbGVuZGFyO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5UHJldmlvdXNZZWFyID0gKF9idXR0b25FbCkgPT4ge1xuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KF9idXR0b25FbCk7XG4gIGxldCBkYXRlID0gc3ViWWVhcnMoY2FsZW5kYXJEYXRlLCAxKTtcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcblxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1BSRVZJT1VTX1lFQVIpO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5UHJldmlvdXNNb250aCA9IChfYnV0dG9uRWwpID0+IHtcbiAgaWYgKF9idXR0b25FbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChfYnV0dG9uRWwpO1xuICBsZXQgZGF0ZSA9IHN1Yk1vbnRocyhjYWxlbmRhckRhdGUsIDEpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEgpO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5TmV4dE1vbnRoID0gKF9idXR0b25FbCkgPT4ge1xuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KF9idXR0b25FbCk7XG4gIGxldCBkYXRlID0gYWRkTW9udGhzKGNhbGVuZGFyRGF0ZSwgMSk7XG4gIGRhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZSk7XG5cbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ORVhUX01PTlRIKTtcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcbiAgfVxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5TmV4dFllYXIgPSAoX2J1dHRvbkVsKSA9PiB7XG4gIGlmIChfYnV0dG9uRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoX2J1dHRvbkVsKTtcbiAgbGV0IGRhdGUgPSBhZGRZZWFycyhjYWxlbmRhckRhdGUsIDEpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTkVYVF9ZRUFSKTtcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcbiAgfVxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBIaWRlIHRoZSBjYWxlbmRhciBvZiBhIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhpZGVDYWxlbmRhciA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRhdGVQaWNrZXJFbCwgY2FsZW5kYXJFbCwgc3RhdHVzRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LnJlbW92ZShEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MpO1xuICBjYWxlbmRhckVsLmhpZGRlbiA9IHRydWU7XG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gXCJcIjtcbn07XG5cbi8qKlxuICogU2VsZWN0IGEgZGF0ZSB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBjYWxlbmRhckRhdGVFbCBBIGRhdGUgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBzZWxlY3REYXRlID0gKGNhbGVuZGFyRGF0ZUVsKSA9PiB7XG4gIGlmIChjYWxlbmRhckRhdGVFbC5kaXNhYmxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBleHRlcm5hbElucHV0RWwgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoY2FsZW5kYXJEYXRlRWwpO1xuXG4gIHNldENhbGVuZGFyVmFsdWUoY2FsZW5kYXJEYXRlRWwsIGNhbGVuZGFyRGF0ZUVsLmRhdGFzZXQudmFsdWUpO1xuICBoaWRlQ2FsZW5kYXIoZGF0ZVBpY2tlckVsKTtcblxuICBleHRlcm5hbElucHV0RWwuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogVG9nZ2xlIHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHRvZ2dsZUNhbGVuZGFyID0gKGVsKSA9PiB7XG4gIGlmIChlbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGlucHV0RGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSwgZGVmYXVsdERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGlmIChjYWxlbmRhckVsLmhpZGRlbikge1xuICAgIGNvbnN0IGRhdGVUb0Rpc3BsYXkgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoXG4gICAgICBpbnB1dERhdGUgfHwgZGVmYXVsdERhdGUgfHwgdG9kYXkoKSxcbiAgICAgIG1pbkRhdGUsXG4gICAgICBtYXhEYXRlXG4gICAgKTtcbiAgICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGVUb0Rpc3BsYXkpO1xuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xuICB9IGVsc2Uge1xuICAgIGhpZGVDYWxlbmRhcihlbCk7XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlIHRoZSBjYWxlbmRhciB3aGVuIHZpc2libGUuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgYW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyXG4gKi9cbmNvbnN0IHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgaW5wdXREYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IGNhbGVuZGFyU2hvd24gPSAhY2FsZW5kYXJFbC5oaWRkZW47XG5cbiAgaWYgKGNhbGVuZGFyU2hvd24gJiYgaW5wdXREYXRlKSB7XG4gICAgY29uc3QgZGF0ZVRvRGlzcGxheSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChpbnB1dERhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICAgIHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGVUb0Rpc3BsYXkpO1xuICB9XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIC0gRGF0ZSBTZWxlY3Rpb24gVmlld1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIC0gTW9udGggU2VsZWN0aW9uIFZpZXdcbi8qKlxuICogRGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbiBpbiB0aGUgZGF0ZSBwaWNrZXIuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICogQHJldHVybnMge0hUTUxFbGVtZW50fSBhIHJlZmVyZW5jZSB0byB0aGUgbmV3IGNhbGVuZGFyIGVsZW1lbnRcbiAqL1xuY29uc3QgZGlzcGxheU1vbnRoU2VsZWN0aW9uID0gKGVsLCBtb250aFRvRGlzcGxheSkgPT4ge1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIHN0YXR1c0VsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGNvbnN0IHNlbGVjdGVkTW9udGggPSBjYWxlbmRhckRhdGUuZ2V0TW9udGgoKTtcbiAgY29uc3QgZm9jdXNlZE1vbnRoID0gbW9udGhUb0Rpc3BsYXkgPT0gbnVsbCA/IHNlbGVjdGVkTW9udGggOiBtb250aFRvRGlzcGxheTtcblxuICBjb25zdCBtb250aHMgPSBNT05USF9MQUJFTFMubWFwKChtb250aCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBtb250aFRvQ2hlY2sgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIGluZGV4KTtcblxuICAgIGNvbnN0IGlzRGlzYWJsZWQgPSBpc0RhdGVzTW9udGhPdXRzaWRlTWluT3JNYXgoXG4gICAgICBtb250aFRvQ2hlY2ssXG4gICAgICBtaW5EYXRlLFxuICAgICAgbWF4RGF0ZVxuICAgICk7XG5cbiAgICBsZXQgdGFiaW5kZXggPSBcIi0xXCI7XG5cbiAgICBjb25zdCBjbGFzc2VzID0gW0NBTEVOREFSX01PTlRIX0NMQVNTXTtcbiAgICBjb25zdCBpc1NlbGVjdGVkID0gaW5kZXggPT09IHNlbGVjdGVkTW9udGg7XG5cbiAgICBpZiAoaW5kZXggPT09IGZvY3VzZWRNb250aCkge1xuICAgICAgdGFiaW5kZXggPSBcIjBcIjtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9NT05USF9GT0NVU0VEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX01PTlRIX1NFTEVDVEVEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCB0YWJpbmRleCk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMuam9pbihcIiBcIikpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIsIGluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1sYWJlbFwiLCBtb250aCk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgaXNTZWxlY3RlZCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiKTtcbiAgICBpZiAoaXNEaXNhYmxlZCA9PT0gdHJ1ZSkge1xuICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgYnRuLnRleHRDb250ZW50ID0gbW9udGg7XG5cbiAgICByZXR1cm4gYnRuO1xuICB9KTtcblxuICBjb25zdCBtb250aHNIdG1sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbW9udGhzSHRtbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuICBtb250aHNIdG1sLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX01PTlRIX1BJQ0tFUl9DTEFTUyk7XG5cbiAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gIHRhYmxlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX1RBQkxFX0NMQVNTKTtcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInByZXNlbnRhdGlvblwiKTtcblxuICBjb25zdCBtb250aHNHcmlkID0gbGlzdFRvR3JpZEh0bWwobW9udGhzLCAzKTtcbiAgY29uc3QgdGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KG1vbnRoc0dyaWQpO1xuICB0YWJsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGVCb2R5KTtcbiAgbW9udGhzSHRtbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGUpO1xuXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gY2FsZW5kYXJFbC5jbG9uZU5vZGUoKTtcbiAgbmV3Q2FsZW5kYXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIG1vbnRoc0h0bWwpO1xuICBjYWxlbmRhckVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0NhbGVuZGFyLCBjYWxlbmRhckVsKTtcblxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFwiU2VsZWN0IGEgbW9udGguXCI7XG5cbiAgcmV0dXJuIG5ld0NhbGVuZGFyO1xufTtcblxuLyoqXG4gKiBTZWxlY3QgYSBtb250aCBpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IG1vbnRoRWwgQW4gbW9udGggZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBzZWxlY3RNb250aCA9IChtb250aEVsKSA9PiB7XG4gIGlmIChtb250aEVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KG1vbnRoRWwpO1xuICBjb25zdCBzZWxlY3RlZE1vbnRoID0gcGFyc2VJbnQobW9udGhFbC5kYXRhc2V0LnZhbHVlLCAxMCk7XG4gIGxldCBkYXRlID0gc2V0TW9udGgoY2FsZW5kYXJEYXRlLCBzZWxlY3RlZE1vbnRoKTtcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcbiAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQpLmZvY3VzKCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIC0gTW9udGggU2VsZWN0aW9uIFZpZXdcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciAtIFllYXIgU2VsZWN0aW9uIFZpZXdcblxuLyoqXG4gKiBEaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4gaW4gdGhlIGRhdGUgcGlja2VyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyVG9EaXNwbGF5IHllYXIgdG8gZGlzcGxheSBpbiB5ZWFyIHNlbGVjdGlvblxuICogQHJldHVybnMge0hUTUxFbGVtZW50fSBhIHJlZmVyZW5jZSB0byB0aGUgbmV3IGNhbGVuZGFyIGVsZW1lbnRcbiAqL1xuY29uc3QgZGlzcGxheVllYXJTZWxlY3Rpb24gPSAoZWwsIHllYXJUb0Rpc3BsYXkpID0+IHtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBzdGF0dXNFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICBjb25zdCBzZWxlY3RlZFllYXIgPSBjYWxlbmRhckRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgY29uc3QgZm9jdXNlZFllYXIgPSB5ZWFyVG9EaXNwbGF5ID09IG51bGwgPyBzZWxlY3RlZFllYXIgOiB5ZWFyVG9EaXNwbGF5O1xuXG4gIGxldCB5ZWFyVG9DaHVuayA9IGZvY3VzZWRZZWFyO1xuICB5ZWFyVG9DaHVuayAtPSB5ZWFyVG9DaHVuayAlIFlFQVJfQ0hVTks7XG4gIHllYXJUb0NodW5rID0gTWF0aC5tYXgoMCwgeWVhclRvQ2h1bmspO1xuXG4gIGNvbnN0IHByZXZZZWFyQ2h1bmtEaXNhYmxlZCA9IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4KFxuICAgIHNldFllYXIoY2FsZW5kYXJEYXRlLCB5ZWFyVG9DaHVuayAtIDEpLFxuICAgIG1pbkRhdGUsXG4gICAgbWF4RGF0ZVxuICApO1xuXG4gIGNvbnN0IG5leHRZZWFyQ2h1bmtEaXNhYmxlZCA9IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4KFxuICAgIHNldFllYXIoY2FsZW5kYXJEYXRlLCB5ZWFyVG9DaHVuayArIFlFQVJfQ0hVTkspLFxuICAgIG1pbkRhdGUsXG4gICAgbWF4RGF0ZVxuICApO1xuXG4gIGNvbnN0IHllYXJzID0gW107XG4gIGxldCB5ZWFySW5kZXggPSB5ZWFyVG9DaHVuaztcbiAgd2hpbGUgKHllYXJzLmxlbmd0aCA8IFlFQVJfQ0hVTkspIHtcbiAgICBjb25zdCBpc0Rpc2FibGVkID0gaXNEYXRlc1llYXJPdXRzaWRlTWluT3JNYXgoXG4gICAgICBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgeWVhckluZGV4KSxcbiAgICAgIG1pbkRhdGUsXG4gICAgICBtYXhEYXRlXG4gICAgKTtcblxuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcblxuICAgIGNvbnN0IGNsYXNzZXMgPSBbQ0FMRU5EQVJfWUVBUl9DTEFTU107XG4gICAgY29uc3QgaXNTZWxlY3RlZCA9IHllYXJJbmRleCA9PT0gc2VsZWN0ZWRZZWFyO1xuXG4gICAgaWYgKHllYXJJbmRleCA9PT0gZm9jdXNlZFllYXIpIHtcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfWUVBUl9GT0NVU0VEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX1lFQVJfU0VMRUNURURfQ0xBU1MpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIHRhYmluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5qb2luKFwiIFwiKSk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgeWVhckluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBpc1NlbGVjdGVkID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICAgIGlmIChpc0Rpc2FibGVkID09PSB0cnVlKSB7XG4gICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgICBidG4udGV4dENvbnRlbnQgPSB5ZWFySW5kZXg7XG5cbiAgICB5ZWFycy5wdXNoKGJ0bik7XG4gICAgeWVhckluZGV4ICs9IDE7XG4gIH1cblxuICBjb25zdCBuZXdDYWxlbmRhciA9IGNhbGVuZGFyRWwuY2xvbmVOb2RlKCk7XG5cbiAgLy8gY3JlYXRlIHRoZSB5ZWFycyBjYWxlbmRhciB3cmFwcGVyXG4gIGNvbnN0IHllYXJzQ2FsZW5kYXJXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfWUVBUl9QSUNLRVJfQ0xBU1MpO1xuXG4gIC8vIGNyZWF0ZSB0YWJsZSBwYXJlbnRcbiAgY29uc3QgeWVhcnNUYWJsZVBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgeWVhcnNUYWJsZVBhcmVudC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9UQUJMRV9DTEFTUyk7XG5cbiAgLy8gY3JlYXRlIHRhYmxlIGJvZHkgYW5kIHRhYmxlIHJvd1xuICBjb25zdCB5ZWFyc0hUTUxUYWJsZUJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGJvZHlcIik7XG4gIGNvbnN0IHllYXJzSFRNTFRhYmxlQm9keVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAvLyBjcmVhdGUgcHJldmlvdXMgYnV0dG9uXG4gIGNvbnN0IHByZXZpb3VzWWVhcnNCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBwcmV2aW91c1llYXJzQnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG4gIHByZXZpb3VzWWVhcnNCdG4uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOS19DTEFTUyk7XG4gIHByZXZpb3VzWWVhcnNCdG4uc2V0QXR0cmlidXRlKFxuICAgIFwiYXJpYS1sYWJlbFwiLFxuICAgIGBOYXZpZ2F0ZSBiYWNrICR7WUVBUl9DSFVOS30geWVhcnNgXG4gICk7XG4gIGlmIChwcmV2WWVhckNodW5rRGlzYWJsZWQgPT09IHRydWUpIHtcbiAgICBwcmV2aW91c1llYXJzQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgfVxuICBwcmV2aW91c1llYXJzQnRuLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCZuYnNwYDtcblxuICAvLyBjcmVhdGUgbmV4dCBidXR0b25cbiAgY29uc3QgbmV4dFllYXJzQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgbmV4dFllYXJzQnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG4gIG5leHRZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktfQ0xBU1MpO1xuICBuZXh0WWVhcnNCdG4uc2V0QXR0cmlidXRlKFxuICAgIFwiYXJpYS1sYWJlbFwiLFxuICAgIGBOYXZpZ2F0ZSBmb3J3YXJkICR7WUVBUl9DSFVOS30geWVhcnNgXG4gICk7XG4gIGlmIChuZXh0WWVhckNodW5rRGlzYWJsZWQgPT09IHRydWUpIHtcbiAgICBuZXh0WWVhcnNCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICB9XG4gIG5leHRZZWFyc0J0bi5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAmbmJzcGA7XG5cbiAgLy8gY3JlYXRlIHRoZSBhY3R1YWwgeWVhcnMgdGFibGVcbiAgY29uc3QgeWVhcnNUYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgeWVhcnNUYWJsZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9UQUJMRV9DTEFTUyk7XG4gIHllYXJzVGFibGUuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInByZXNlbnRhdGlvblwiKTtcblxuICAvLyBjcmVhdGUgdGhlIHllYXJzIGNoaWxkIHRhYmxlXG4gIGNvbnN0IHllYXJzR3JpZCA9IGxpc3RUb0dyaWRIdG1sKHllYXJzLCAzKTtcbiAgY29uc3QgeWVhcnNUYWJsZUJvZHkgPSBjcmVhdGVUYWJsZUJvZHkoeWVhcnNHcmlkKTtcblxuICAvLyBhcHBlbmQgdGhlIGdyaWQgdG8gdGhlIHllYXJzIGNoaWxkIHRhYmxlXG4gIHllYXJzVGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzVGFibGVCb2R5KTtcblxuICAvLyBjcmVhdGUgdGhlIHByZXYgYnV0dG9uIHRkIGFuZCBhcHBlbmQgdGhlIHByZXYgYnV0dG9uXG4gIGNvbnN0IHllYXJzSFRNTFRhYmxlQm9keURldGFpbFByZXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG4gIHllYXJzSFRNTFRhYmxlQm9keURldGFpbFByZXYuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgcHJldmlvdXNZZWFyc0J0blxuICApO1xuXG4gIC8vIGNyZWF0ZSB0aGUgeWVhcnMgdGQgYW5kIGFwcGVuZCB0aGUgeWVhcnMgY2hpbGQgdGFibGVcbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG4gIHllYXJzSFRNTFRhYmxlQm9keVllYXJzRGV0YWlsLnNldEF0dHJpYnV0ZShcImNvbHNwYW5cIiwgXCIzXCIpO1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlZZWFyc0RldGFpbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNUYWJsZSk7XG5cbiAgLy8gY3JlYXRlIHRoZSBuZXh0IGJ1dHRvbiB0ZCBhbmQgYXBwZW5kIHRoZSBuZXh0IGJ1dHRvblxuICBjb25zdCB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxOZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxOZXh0Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBuZXh0WWVhcnNCdG4pO1xuXG4gIC8vIGFwcGVuZCB0aGUgdGhyZWUgdGQgdG8gdGhlIHllYXJzIGNoaWxkIHRhYmxlIHJvd1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsUHJldlxuICApO1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWxcbiAgKTtcbiAgeWVhcnNIVE1MVGFibGVCb2R5Um93Lmluc2VydEFkamFjZW50RWxlbWVudChcbiAgICBcImJlZm9yZWVuZFwiLFxuICAgIHllYXJzSFRNTFRhYmxlQm9keURldGFpbE5leHRcbiAgKTtcblxuICAvLyBhcHBlbmQgdGhlIHRhYmxlIHJvdyB0byB0aGUgeWVhcnMgY2hpbGQgdGFibGUgYm9keVxuICB5ZWFyc0hUTUxUYWJsZUJvZHkuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzSFRNTFRhYmxlQm9keVJvdyk7XG5cbiAgLy8gYXBwZW5kIHRoZSB5ZWFycyB0YWJsZSBib2R5IHRvIHRoZSB5ZWFycyBwYXJlbnQgdGFibGVcbiAgeWVhcnNUYWJsZVBhcmVudC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNIVE1MVGFibGVCb2R5KTtcblxuICAvLyBhcHBlbmQgdGhlIHBhcmVudCB0YWJsZSB0byB0aGUgY2FsZW5kYXIgd3JhcHBlclxuICB5ZWFyc0NhbGVuZGFyV3JhcHBlci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNUYWJsZVBhcmVudCk7XG5cbiAgLy8gYXBwZW5kIHRoZSB5ZWFycyBjYWxlbmRlciB0byB0aGUgbmV3IGNhbGVuZGFyXG4gIG5ld0NhbGVuZGFyLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc0NhbGVuZGFyV3JhcHBlcik7XG5cbiAgLy8gcmVwbGFjZSBjYWxlbmRhclxuICBjYWxlbmRhckVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0NhbGVuZGFyLCBjYWxlbmRhckVsKTtcblxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFNhbml0aXplci5lc2NhcGVIVE1MYFNob3dpbmcgeWVhcnMgJHt5ZWFyVG9DaHVua30gdG8gJHtcbiAgICB5ZWFyVG9DaHVuayArIFlFQVJfQ0hVTksgLSAxXG4gIH0uIFNlbGVjdCBhIHllYXIuYDtcblxuICByZXR1cm4gbmV3Q2FsZW5kYXI7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgYnkgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlQcmV2aW91c1llYXJDaHVuayA9IChlbCkgPT4ge1xuICBpZiAoZWwuZGlzYWJsZWQpIHJldHVybjtcblxuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IHllYXJFbCA9IGNhbGVuZGFyRWwucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQpO1xuICBjb25zdCBzZWxlY3RlZFllYXIgPSBwYXJzZUludCh5ZWFyRWwudGV4dENvbnRlbnQsIDEwKTtcblxuICBsZXQgYWRqdXN0ZWRZZWFyID0gc2VsZWN0ZWRZZWFyIC0gWUVBUl9DSFVOSztcbiAgYWRqdXN0ZWRZZWFyID0gTWF0aC5tYXgoMCwgYWRqdXN0ZWRZZWFyKTtcblxuICBjb25zdCBkYXRlID0gc2V0WWVhcihjYWxlbmRhckRhdGUsIGFkanVzdGVkWWVhcik7XG4gIGNvbnN0IGNhcHBlZERhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24oXG4gICAgY2FsZW5kYXJFbCxcbiAgICBjYXBwZWREYXRlLmdldEZ1bGxZZWFyKClcbiAgKTtcblxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0hVTkspO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgYnkgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlOZXh0WWVhckNodW5rID0gKGVsKSA9PiB7XG4gIGlmIChlbC5kaXNhYmxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgeWVhckVsID0gY2FsZW5kYXJFbC5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCk7XG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IHBhcnNlSW50KHllYXJFbC50ZXh0Q29udGVudCwgMTApO1xuXG4gIGxldCBhZGp1c3RlZFllYXIgPSBzZWxlY3RlZFllYXIgKyBZRUFSX0NIVU5LO1xuICBhZGp1c3RlZFllYXIgPSBNYXRoLm1heCgwLCBhZGp1c3RlZFllYXIpO1xuXG4gIGNvbnN0IGRhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgYWRqdXN0ZWRZZWFyKTtcbiAgY29uc3QgY2FwcGVkRGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5WWVhclNlbGVjdGlvbihcbiAgICBjYWxlbmRhckVsLFxuICAgIGNhcHBlZERhdGUuZ2V0RnVsbFllYXIoKVxuICApO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTkVYVF9ZRUFSX0NIVU5LKTtcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfUElDS0VSKTtcbiAgfVxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBTZWxlY3QgYSB5ZWFyIGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0geWVhckVsIEEgeWVhciBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHNlbGVjdFllYXIgPSAoeWVhckVsKSA9PiB7XG4gIGlmICh5ZWFyRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoeWVhckVsKTtcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gcGFyc2VJbnQoeWVhckVsLmlubmVySFRNTCwgMTApO1xuICBsZXQgZGF0ZSA9IHNldFllYXIoY2FsZW5kYXJEYXRlLCBzZWxlY3RlZFllYXIpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgLSBZZWFyIFNlbGVjdGlvbiBWaWV3XG5cbi8vICNyZWdpb24gQ2FsZW5kYXIgRXZlbnQgSGFuZGxpbmdcblxuLyoqXG4gKiBIaWRlIHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVzY2FwZUZyb21DYWxlbmRhciA9IChldmVudCkgPT4ge1xuICBjb25zdCB7IGRhdGVQaWNrZXJFbCwgZXh0ZXJuYWxJbnB1dEVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChldmVudC50YXJnZXQpO1xuXG4gIGhpZGVDYWxlbmRhcihkYXRlUGlja2VyRWwpO1xuICBleHRlcm5hbElucHV0RWwuZm9jdXMoKTtcblxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciBFdmVudCBIYW5kbGluZ1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIERhdGUgRXZlbnQgSGFuZGxpbmdcblxuLyoqXG4gKiBBZGp1c3QgdGhlIGRhdGUgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyIGlmIG5lZWRlZC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBhZGp1c3REYXRlRm4gZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGFkanVzdENhbGVuZGFyID0gKGFkanVzdERhdGVGbikgPT4gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChcbiAgICBldmVudC50YXJnZXRcbiAgKTtcblxuICBjb25zdCBkYXRlID0gYWRqdXN0RGF0ZUZuKGNhbGVuZGFyRGF0ZSk7XG5cbiAgY29uc3QgY2FwcGVkRGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgaWYgKCFpc1NhbWVEYXkoY2FsZW5kYXJEYXRlLCBjYXBwZWREYXRlKSkge1xuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgY2FwcGVkRGF0ZSk7XG4gICAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQpLmZvY3VzKCk7XG4gIH1cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgd2VlayBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVVcEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN1YldlZWtzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZURvd25Gcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBhZGRXZWVrcyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgZGF5IGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUxlZnRGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBzdWJEYXlzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSBkYXkgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUmlnaHRGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBhZGREYXlzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHdlZWsgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlSG9tZUZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN0YXJ0T2ZXZWVrKGRhdGUpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZW5kIG9mIHRoZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVuZEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IGVuZE9mV2VlayhkYXRlKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUGFnZURvd25Gcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBhZGRNb250aHMoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVBhZ2VVcEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN1Yk1vbnRocyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgeWVhciBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVTaGlmdFBhZ2VEb3duRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gYWRkWWVhcnMoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIHllYXIgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlU2hpZnRQYWdlVXBGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBzdWJZZWFycyhkYXRlLCAxKSk7XG5cbi8qKlxuICogZGlzcGxheSB0aGUgY2FsZW5kYXIgZm9yIHRoZSBtb3VzZW92ZXIgZGF0ZS5cbiAqXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBtb3VzZW92ZXIgZXZlbnRcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGRhdGVFbCBBIGRhdGUgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVNb3VzZW92ZXJGcm9tRGF0ZSA9IChkYXRlRWwpID0+IHtcbiAgaWYgKGRhdGVFbC5kaXNhYmxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IGNhbGVuZGFyRWwgPSBkYXRlRWwuY2xvc2VzdChEQVRFX1BJQ0tFUl9DQUxFTkRBUik7XG5cbiAgY29uc3QgY3VycmVudENhbGVuZGFyRGF0ZSA9IGNhbGVuZGFyRWwuZGF0YXNldC52YWx1ZTtcbiAgY29uc3QgaG92ZXJEYXRlID0gZGF0ZUVsLmRhdGFzZXQudmFsdWU7XG5cbiAgaWYgKGhvdmVyRGF0ZSA9PT0gY3VycmVudENhbGVuZGFyRGF0ZSkgcmV0dXJuO1xuXG4gIGNvbnN0IGRhdGVUb0Rpc3BsYXkgPSBwYXJzZURhdGVTdHJpbmcoaG92ZXJEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlVG9EaXNwbGF5KTtcbiAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQpLmZvY3VzKCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIERhdGUgRXZlbnQgSGFuZGxpbmdcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciBNb250aCBFdmVudCBIYW5kbGluZ1xuXG4vKipcbiAqIEFkanVzdCB0aGUgbW9udGggYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4gaWYgbmVlZGVkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGFkanVzdE1vbnRoRm4gZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBhZGp1c3RlZCBtb250aFxuICovXG5jb25zdCBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbiA9IChhZGp1c3RNb250aEZuKSA9PiAoZXZlbnQpID0+IHtcbiAgY29uc3QgbW9udGhFbCA9IGV2ZW50LnRhcmdldDtcbiAgY29uc3Qgc2VsZWN0ZWRNb250aCA9IHBhcnNlSW50KG1vbnRoRWwuZGF0YXNldC52YWx1ZSwgMTApO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChtb250aEVsKTtcbiAgY29uc3QgY3VycmVudERhdGUgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIHNlbGVjdGVkTW9udGgpO1xuXG4gIGxldCBhZGp1c3RlZE1vbnRoID0gYWRqdXN0TW9udGhGbihzZWxlY3RlZE1vbnRoKTtcbiAgYWRqdXN0ZWRNb250aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDExLCBhZGp1c3RlZE1vbnRoKSk7XG5cbiAgY29uc3QgZGF0ZSA9IHNldE1vbnRoKGNhbGVuZGFyRGF0ZSwgYWRqdXN0ZWRNb250aCk7XG4gIGNvbnN0IGNhcHBlZERhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGlmICghaXNTYW1lTW9udGgoY3VycmVudERhdGUsIGNhcHBlZERhdGUpKSB7XG4gICAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5TW9udGhTZWxlY3Rpb24oXG4gICAgICBjYWxlbmRhckVsLFxuICAgICAgY2FwcGVkRGF0ZS5nZXRNb250aCgpXG4gICAgKTtcbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX01PTlRIX0ZPQ1VTRUQpLmZvY3VzKCk7XG4gIH1cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayB0aHJlZSBtb250aHMgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVVcEZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKChtb250aCkgPT4gbW9udGggLSAzKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIHRocmVlIG1vbnRocyBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZURvd25Gcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigobW9udGgpID0+IG1vbnRoICsgMyk7XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVMZWZ0RnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCAtIDEpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUmlnaHRGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigobW9udGgpID0+IG1vbnRoICsgMSk7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb3cgb2YgbW9udGhzIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlSG9tZUZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKFxuICAobW9udGgpID0+IG1vbnRoIC0gKG1vbnRoICUgMylcbik7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIGVuZCBvZiB0aGUgcm93IG9mIG1vbnRocyBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVuZEZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKFxuICAobW9udGgpID0+IG1vbnRoICsgMiAtIChtb250aCAlIDMpXG4pO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBsYXN0IG1vbnRoIChEZWNlbWJlcikgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVQYWdlRG93bkZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKCgpID0+IDExKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZmlyc3QgbW9udGggKEphbnVhcnkpIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUGFnZVVwRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKCkgPT4gMCk7XG5cbi8qKlxuICogdXBkYXRlIHRoZSBmb2N1cyBvbiBhIG1vbnRoIHdoZW4gdGhlIG1vdXNlIG1vdmVzLlxuICpcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgVGhlIG1vdXNlb3ZlciBldmVudFxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gbW9udGhFbCBBIG1vbnRoIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlTW91c2VvdmVyRnJvbU1vbnRoID0gKG1vbnRoRWwpID0+IHtcbiAgaWYgKG1vbnRoRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgaWYgKG1vbnRoRWwuY2xhc3NMaXN0LmNvbnRhaW5zKENBTEVOREFSX01PTlRIX0ZPQ1VTRURfQ0xBU1MpKSByZXR1cm47XG5cbiAgY29uc3QgZm9jdXNNb250aCA9IHBhcnNlSW50KG1vbnRoRWwuZGF0YXNldC52YWx1ZSwgMTApO1xuXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheU1vbnRoU2VsZWN0aW9uKG1vbnRoRWwsIGZvY3VzTW9udGgpO1xuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX01PTlRIX0ZPQ1VTRUQpLmZvY3VzKCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIE1vbnRoIEV2ZW50IEhhbmRsaW5nXG5cbi8vICNyZWdpb24gQ2FsZW5kYXIgWWVhciBFdmVudCBIYW5kbGluZ1xuXG4vKipcbiAqIEFkanVzdCB0aGUgeWVhciBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuIGlmIG5lZWRlZC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBhZGp1c3RZZWFyRm4gZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBhZGp1c3RlZCB5ZWFyXG4gKi9cbmNvbnN0IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4gPSAoYWRqdXN0WWVhckZuKSA9PiAoZXZlbnQpID0+IHtcbiAgY29uc3QgeWVhckVsID0gZXZlbnQudGFyZ2V0O1xuICBjb25zdCBzZWxlY3RlZFllYXIgPSBwYXJzZUludCh5ZWFyRWwuZGF0YXNldC52YWx1ZSwgMTApO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dCh5ZWFyRWwpO1xuICBjb25zdCBjdXJyZW50RGF0ZSA9IHNldFllYXIoY2FsZW5kYXJEYXRlLCBzZWxlY3RlZFllYXIpO1xuXG4gIGxldCBhZGp1c3RlZFllYXIgPSBhZGp1c3RZZWFyRm4oc2VsZWN0ZWRZZWFyKTtcbiAgYWRqdXN0ZWRZZWFyID0gTWF0aC5tYXgoMCwgYWRqdXN0ZWRZZWFyKTtcblxuICBjb25zdCBkYXRlID0gc2V0WWVhcihjYWxlbmRhckRhdGUsIGFkanVzdGVkWWVhcik7XG4gIGNvbnN0IGNhcHBlZERhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGlmICghaXNTYW1lWWVhcihjdXJyZW50RGF0ZSwgY2FwcGVkRGF0ZSkpIHtcbiAgICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKFxuICAgICAgY2FsZW5kYXJFbCxcbiAgICAgIGNhcHBlZERhdGUuZ2V0RnVsbFllYXIoKVxuICAgICk7XG4gICAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQpLmZvY3VzKCk7XG4gIH1cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayB0aHJlZSB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlVXBGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgLSAzKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIHRocmVlIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVEb3duRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKCh5ZWFyKSA9PiB5ZWFyICsgMyk7XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgeWVhciBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlTGVmdEZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbigoeWVhcikgPT4geWVhciAtIDEpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIHllYXIgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVJpZ2h0RnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKCh5ZWFyKSA9PiB5ZWFyICsgMSk7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb3cgb2YgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUhvbWVGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oXG4gICh5ZWFyKSA9PiB5ZWFyIC0gKHllYXIgJSAzKVxuKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZW5kIG9mIHRoZSByb3cgb2YgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVuZEZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbihcbiAgKHllYXIpID0+IHllYXIgKyAyIC0gKHllYXIgJSAzKVxuKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byBiYWNrIDEyIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVQYWdlVXBGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oXG4gICh5ZWFyKSA9PiB5ZWFyIC0gWUVBUl9DSFVOS1xuKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIDEyIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVQYWdlRG93bkZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbihcbiAgKHllYXIpID0+IHllYXIgKyBZRUFSX0NIVU5LXG4pO1xuXG4vKipcbiAqIHVwZGF0ZSB0aGUgZm9jdXMgb24gYSB5ZWFyIHdoZW4gdGhlIG1vdXNlIG1vdmVzLlxuICpcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgVGhlIG1vdXNlb3ZlciBldmVudFxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZGF0ZUVsIEEgeWVhciBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZU1vdXNlb3ZlckZyb21ZZWFyID0gKHllYXJFbCkgPT4ge1xuICBpZiAoeWVhckVsLmRpc2FibGVkKSByZXR1cm47XG4gIGlmICh5ZWFyRWwuY2xhc3NMaXN0LmNvbnRhaW5zKENBTEVOREFSX1lFQVJfRk9DVVNFRF9DTEFTUykpIHJldHVybjtcblxuICBjb25zdCBmb2N1c1llYXIgPSBwYXJzZUludCh5ZWFyRWwuZGF0YXNldC52YWx1ZSwgMTApO1xuXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24oeWVhckVsLCBmb2N1c1llYXIpO1xuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCkuZm9jdXMoKTtcbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgWWVhciBFdmVudCBIYW5kbGluZ1xuXG4vLyAjcmVnaW9uIEZvY3VzIEhhbmRsaW5nIEV2ZW50IEhhbmRsaW5nXG5cbmNvbnN0IHRhYkhhbmRsZXIgPSAoZm9jdXNhYmxlKSA9PiB7XG4gIGNvbnN0IGdldEZvY3VzYWJsZUNvbnRleHQgPSAoZWwpID0+IHtcbiAgICBjb25zdCB7IGNhbGVuZGFyRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgICBjb25zdCBmb2N1c2FibGVFbGVtZW50cyA9IHNlbGVjdChmb2N1c2FibGUsIGNhbGVuZGFyRWwpO1xuXG4gICAgY29uc3QgZmlyc3RUYWJJbmRleCA9IDA7XG4gICAgY29uc3QgbGFzdFRhYkluZGV4ID0gZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoIC0gMTtcbiAgICBjb25zdCBmaXJzdFRhYlN0b3AgPSBmb2N1c2FibGVFbGVtZW50c1tmaXJzdFRhYkluZGV4XTtcbiAgICBjb25zdCBsYXN0VGFiU3RvcCA9IGZvY3VzYWJsZUVsZW1lbnRzW2xhc3RUYWJJbmRleF07XG4gICAgY29uc3QgZm9jdXNJbmRleCA9IGZvY3VzYWJsZUVsZW1lbnRzLmluZGV4T2YoYWN0aXZlRWxlbWVudCgpKTtcblxuICAgIGNvbnN0IGlzTGFzdFRhYiA9IGZvY3VzSW5kZXggPT09IGxhc3RUYWJJbmRleDtcbiAgICBjb25zdCBpc0ZpcnN0VGFiID0gZm9jdXNJbmRleCA9PT0gZmlyc3RUYWJJbmRleDtcbiAgICBjb25zdCBpc05vdEZvdW5kID0gZm9jdXNJbmRleCA9PT0gLTE7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZm9jdXNhYmxlRWxlbWVudHMsXG4gICAgICBpc05vdEZvdW5kLFxuICAgICAgZmlyc3RUYWJTdG9wLFxuICAgICAgaXNGaXJzdFRhYixcbiAgICAgIGxhc3RUYWJTdG9wLFxuICAgICAgaXNMYXN0VGFiLFxuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICB0YWJBaGVhZChldmVudCkge1xuICAgICAgY29uc3QgeyBmaXJzdFRhYlN0b3AsIGlzTGFzdFRhYiwgaXNOb3RGb3VuZCB9ID0gZ2V0Rm9jdXNhYmxlQ29udGV4dChcbiAgICAgICAgZXZlbnQudGFyZ2V0XG4gICAgICApO1xuXG4gICAgICBpZiAoaXNMYXN0VGFiIHx8IGlzTm90Rm91bmQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICB0YWJCYWNrKGV2ZW50KSB7XG4gICAgICBjb25zdCB7IGxhc3RUYWJTdG9wLCBpc0ZpcnN0VGFiLCBpc05vdEZvdW5kIH0gPSBnZXRGb2N1c2FibGVDb250ZXh0KFxuICAgICAgICBldmVudC50YXJnZXRcbiAgICAgICk7XG5cbiAgICAgIGlmIChpc0ZpcnN0VGFiIHx8IGlzTm90Rm91bmQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgbGFzdFRhYlN0b3AuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufTtcblxuY29uc3QgZGF0ZVBpY2tlclRhYkV2ZW50SGFuZGxlciA9IHRhYkhhbmRsZXIoREFURV9QSUNLRVJfRk9DVVNBQkxFKTtcbmNvbnN0IG1vbnRoUGlja2VyVGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihNT05USF9QSUNLRVJfRk9DVVNBQkxFKTtcbmNvbnN0IHllYXJQaWNrZXJUYWJFdmVudEhhbmRsZXIgPSB0YWJIYW5kbGVyKFlFQVJfUElDS0VSX0ZPQ1VTQUJMRSk7XG5cbi8vICNlbmRyZWdpb24gRm9jdXMgSGFuZGxpbmcgRXZlbnQgSGFuZGxpbmdcblxuLy8gI3JlZ2lvbiBEYXRlIFBpY2tlciBFdmVudCBEZWxlZ2F0aW9uIFJlZ2lzdHJhdGlvbiAvIENvbXBvbmVudFxuXG5jb25zdCBkYXRlUGlja2VyRXZlbnRzID0ge1xuICBbQ0xJQ0tdOiB7XG4gICAgW0RBVEVfUElDS0VSX0JVVFRPTl0oKSB7XG4gICAgICB0b2dnbGVDYWxlbmRhcih0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9EQVRFXSgpIHtcbiAgICAgIHNlbGVjdERhdGUodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfTU9OVEhdKCkge1xuICAgICAgc2VsZWN0TW9udGgodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfWUVBUl0oKSB7XG4gICAgICBzZWxlY3RZZWFyKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX1BSRVZJT1VTX01PTlRIXSgpIHtcbiAgICAgIGRpc3BsYXlQcmV2aW91c01vbnRoKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX05FWFRfTU9OVEhdKCkge1xuICAgICAgZGlzcGxheU5leHRNb250aCh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSXSgpIHtcbiAgICAgIGRpc3BsYXlQcmV2aW91c1llYXIodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfTkVYVF9ZRUFSXSgpIHtcbiAgICAgIGRpc3BsYXlOZXh0WWVhcih0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LXSgpIHtcbiAgICAgIGRpc3BsYXlQcmV2aW91c1llYXJDaHVuayh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktdKCkge1xuICAgICAgZGlzcGxheU5leHRZZWFyQ2h1bmsodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OXSgpIHtcbiAgICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheU1vbnRoU2VsZWN0aW9uKHRoaXMpO1xuICAgICAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9NT05USF9GT0NVU0VEKS5mb2N1cygpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX1lFQVJfU0VMRUNUSU9OXSgpIHtcbiAgICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24odGhpcyk7XG4gICAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCkuZm9jdXMoKTtcbiAgICB9LFxuICB9LFxuICBrZXl1cDoge1xuICAgIFtEQVRFX1BJQ0tFUl9DQUxFTkRBUl0oZXZlbnQpIHtcbiAgICAgIGNvbnN0IGtleWRvd24gPSB0aGlzLmRhdGFzZXQua2V5ZG93bktleUNvZGU7XG4gICAgICBpZiAoYCR7ZXZlbnQua2V5Q29kZX1gICE9PSBrZXlkb3duKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgfSxcbiAga2V5ZG93bjoge1xuICAgIFtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF0oZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBFTlRFUl9LRVlDT0RFKSB7XG4gICAgICAgIHZhbGlkYXRlRGF0ZUlucHV0KHRoaXMpO1xuICAgICAgfVxuICAgIH0sXG4gICAgW0NBTEVOREFSX0RBVEVdOiBrZXltYXAoe1xuICAgICAgVXA6IGhhbmRsZVVwRnJvbURhdGUsXG4gICAgICBBcnJvd1VwOiBoYW5kbGVVcEZyb21EYXRlLFxuICAgICAgRG93bjogaGFuZGxlRG93bkZyb21EYXRlLFxuICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbURhdGUsXG4gICAgICBMZWZ0OiBoYW5kbGVMZWZ0RnJvbURhdGUsXG4gICAgICBBcnJvd0xlZnQ6IGhhbmRsZUxlZnRGcm9tRGF0ZSxcbiAgICAgIFJpZ2h0OiBoYW5kbGVSaWdodEZyb21EYXRlLFxuICAgICAgQXJyb3dSaWdodDogaGFuZGxlUmlnaHRGcm9tRGF0ZSxcbiAgICAgIEhvbWU6IGhhbmRsZUhvbWVGcm9tRGF0ZSxcbiAgICAgIEVuZDogaGFuZGxlRW5kRnJvbURhdGUsXG4gICAgICBQYWdlRG93bjogaGFuZGxlUGFnZURvd25Gcm9tRGF0ZSxcbiAgICAgIFBhZ2VVcDogaGFuZGxlUGFnZVVwRnJvbURhdGUsXG4gICAgICBcIlNoaWZ0K1BhZ2VEb3duXCI6IGhhbmRsZVNoaWZ0UGFnZURvd25Gcm9tRGF0ZSxcbiAgICAgIFwiU2hpZnQrUGFnZVVwXCI6IGhhbmRsZVNoaWZ0UGFnZVVwRnJvbURhdGUsXG4gICAgICBUYWI6IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgfSksXG4gICAgW0NBTEVOREFSX0RBVEVfUElDS0VSXToga2V5bWFwKHtcbiAgICAgIFRhYjogZGF0ZVBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcbiAgICAgIFwiU2hpZnQrVGFiXCI6IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQmFjayxcbiAgICB9KSxcbiAgICBbQ0FMRU5EQVJfTU9OVEhdOiBrZXltYXAoe1xuICAgICAgVXA6IGhhbmRsZVVwRnJvbU1vbnRoLFxuICAgICAgQXJyb3dVcDogaGFuZGxlVXBGcm9tTW9udGgsXG4gICAgICBEb3duOiBoYW5kbGVEb3duRnJvbU1vbnRoLFxuICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbU1vbnRoLFxuICAgICAgTGVmdDogaGFuZGxlTGVmdEZyb21Nb250aCxcbiAgICAgIEFycm93TGVmdDogaGFuZGxlTGVmdEZyb21Nb250aCxcbiAgICAgIFJpZ2h0OiBoYW5kbGVSaWdodEZyb21Nb250aCxcbiAgICAgIEFycm93UmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbU1vbnRoLFxuICAgICAgSG9tZTogaGFuZGxlSG9tZUZyb21Nb250aCxcbiAgICAgIEVuZDogaGFuZGxlRW5kRnJvbU1vbnRoLFxuICAgICAgUGFnZURvd246IGhhbmRsZVBhZ2VEb3duRnJvbU1vbnRoLFxuICAgICAgUGFnZVVwOiBoYW5kbGVQYWdlVXBGcm9tTW9udGgsXG4gICAgfSksXG4gICAgW0NBTEVOREFSX01PTlRIX1BJQ0tFUl06IGtleW1hcCh7XG4gICAgICBUYWI6IG1vbnRoUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkFoZWFkLFxuICAgICAgXCJTaGlmdCtUYWJcIjogbW9udGhQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQmFjayxcbiAgICB9KSxcbiAgICBbQ0FMRU5EQVJfWUVBUl06IGtleW1hcCh7XG4gICAgICBVcDogaGFuZGxlVXBGcm9tWWVhcixcbiAgICAgIEFycm93VXA6IGhhbmRsZVVwRnJvbVllYXIsXG4gICAgICBEb3duOiBoYW5kbGVEb3duRnJvbVllYXIsXG4gICAgICBBcnJvd0Rvd246IGhhbmRsZURvd25Gcm9tWWVhcixcbiAgICAgIExlZnQ6IGhhbmRsZUxlZnRGcm9tWWVhcixcbiAgICAgIEFycm93TGVmdDogaGFuZGxlTGVmdEZyb21ZZWFyLFxuICAgICAgUmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbVllYXIsXG4gICAgICBBcnJvd1JpZ2h0OiBoYW5kbGVSaWdodEZyb21ZZWFyLFxuICAgICAgSG9tZTogaGFuZGxlSG9tZUZyb21ZZWFyLFxuICAgICAgRW5kOiBoYW5kbGVFbmRGcm9tWWVhcixcbiAgICAgIFBhZ2VEb3duOiBoYW5kbGVQYWdlRG93bkZyb21ZZWFyLFxuICAgICAgUGFnZVVwOiBoYW5kbGVQYWdlVXBGcm9tWWVhcixcbiAgICB9KSxcbiAgICBbQ0FMRU5EQVJfWUVBUl9QSUNLRVJdOiBrZXltYXAoe1xuICAgICAgVGFiOiB5ZWFyUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkFoZWFkLFxuICAgICAgXCJTaGlmdCtUYWJcIjogeWVhclBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJCYWNrLFxuICAgIH0pLFxuICAgIFtEQVRFX1BJQ0tFUl9DQUxFTkRBUl0oZXZlbnQpIHtcbiAgICAgIHRoaXMuZGF0YXNldC5rZXlkb3duS2V5Q29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgfSxcbiAgICBbREFURV9QSUNLRVJdKGV2ZW50KSB7XG4gICAgICBjb25zdCBrZXlNYXAgPSBrZXltYXAoe1xuICAgICAgICBFc2NhcGU6IGhhbmRsZUVzY2FwZUZyb21DYWxlbmRhcixcbiAgICAgIH0pO1xuXG4gICAgICBrZXlNYXAoZXZlbnQpO1xuICAgIH0sXG4gIH0sXG4gIGZvY3Vzb3V0OiB7XG4gICAgW0RBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUXSgpIHtcbiAgICAgIHZhbGlkYXRlRGF0ZUlucHV0KHRoaXMpO1xuICAgIH0sXG4gICAgW0RBVEVfUElDS0VSXShldmVudCkge1xuICAgICAgaWYgKCF0aGlzLmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgIGhpZGVDYWxlbmRhcih0aGlzKTtcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICBpbnB1dDoge1xuICAgIFtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF0oKSB7XG4gICAgICByZWNvbmNpbGVJbnB1dFZhbHVlcyh0aGlzKTtcbiAgICAgIHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlKHRoaXMpO1xuICAgIH0sXG4gIH0sXG59O1xuXG5pZiAoIWlzSW9zRGV2aWNlKCkpIHtcbiAgZGF0ZVBpY2tlckV2ZW50cy5tb3VzZW92ZXIgPSB7XG4gICAgW0NBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF0oKSB7XG4gICAgICBoYW5kbGVNb3VzZW92ZXJGcm9tRGF0ZSh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9NT05USF0oKSB7XG4gICAgICBoYW5kbGVNb3VzZW92ZXJGcm9tTW9udGgodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfWUVBUl0oKSB7XG4gICAgICBoYW5kbGVNb3VzZW92ZXJGcm9tWWVhcih0aGlzKTtcbiAgICB9LFxuICB9O1xufVxuXG5jb25zdCBkYXRlUGlja2VyID0gYmVoYXZpb3IoZGF0ZVBpY2tlckV2ZW50cywge1xuICBpbml0KHJvb3QpIHtcbiAgICBzZWxlY3RPck1hdGNoZXMoREFURV9QSUNLRVIsIHJvb3QpLmZvckVhY2goKGRhdGVQaWNrZXJFbCkgPT4ge1xuICAgICAgZW5oYW5jZURhdGVQaWNrZXIoZGF0ZVBpY2tlckVsKTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0RGF0ZVBpY2tlckNvbnRleHQsXG4gIGRpc2FibGUsXG4gIGFyaWFEaXNhYmxlLFxuICBlbmFibGUsXG4gIGlzRGF0ZUlucHV0SW52YWxpZCxcbiAgc2V0Q2FsZW5kYXJWYWx1ZSxcbiAgdmFsaWRhdGVEYXRlSW5wdXQsXG4gIHJlbmRlckNhbGVuZGFyLFxuICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZSxcbn0pO1xuXG4vLyAjZW5kcmVnaW9uIERhdGUgUGlja2VyIEV2ZW50IERlbGVnYXRpb24gUmVnaXN0cmF0aW9uIC8gQ29tcG9uZW50XG5cbm1vZHVsZS5leHBvcnRzID0gZGF0ZVBpY2tlcjtcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7XG4gIGdldERhdGVQaWNrZXJDb250ZXh0LFxuICBpc0RhdGVJbnB1dEludmFsaWQsXG4gIHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlLFxufSA9IHJlcXVpcmUoXCIuLi8uLi91c2EtZGF0ZS1waWNrZXIvc3JjL2luZGV4XCIpO1xuXG5jb25zdCBEQVRFX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tZGF0ZS1waWNrZXJgO1xuY29uc3QgREFURV9SQU5HRV9QSUNLRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LWRhdGUtcmFuZ2UtcGlja2VyYDtcbmNvbnN0IERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUX0NMQVNTID0gYCR7REFURV9SQU5HRV9QSUNLRVJfQ0xBU1N9X19yYW5nZS1zdGFydGA7XG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1MgPSBgJHtEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTU31fX3JhbmdlLWVuZGA7XG5cbmNvbnN0IERBVEVfUElDS0VSID0gYC4ke0RBVEVfUElDS0VSX0NMQVNTfWA7XG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUiA9IGAuJHtEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfU1RBUlQgPSBgLiR7REFURV9SQU5HRV9QSUNLRVJfUkFOR0VfU1RBUlRfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX0VORCA9IGAuJHtEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1N9YDtcblxuY29uc3QgREVGQVVMVF9NSU5fREFURSA9IFwiMDAwMC0wMS0wMVwiO1xuXG4vKipcbiAqIFRoZSBwcm9wZXJ0aWVzIGFuZCBlbGVtZW50cyB3aXRoaW4gdGhlIGRhdGUgcmFuZ2UgcGlja2VyLlxuICogQHR5cGVkZWYge09iamVjdH0gRGF0ZVJhbmdlUGlja2VyQ29udGV4dFxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZGF0ZVJhbmdlUGlja2VyRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IHJhbmdlU3RhcnRFbFxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gcmFuZ2VFbmRFbFxuICovXG5cbi8qKlxuICogR2V0IGFuIG9iamVjdCBvZiB0aGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXJcbiAqIEByZXR1cm5zIHtEYXRlUmFuZ2VQaWNrZXJDb250ZXh0fSBlbGVtZW50c1xuICovXG5jb25zdCBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0ID0gKGVsKSA9PiB7XG4gIGNvbnN0IGRhdGVSYW5nZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1JBTkdFX1BJQ0tFUik7XG5cbiAgaWYgKCFkYXRlUmFuZ2VQaWNrZXJFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7REFURV9SQU5HRV9QSUNLRVJ9YCk7XG4gIH1cblxuICBjb25zdCByYW5nZVN0YXJ0RWwgPSBkYXRlUmFuZ2VQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKFxuICAgIERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUXG4gICk7XG4gIGNvbnN0IHJhbmdlRW5kRWwgPSBkYXRlUmFuZ2VQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKFxuICAgIERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX0VORFxuICApO1xuXG4gIHJldHVybiB7XG4gICAgZGF0ZVJhbmdlUGlja2VyRWwsXG4gICAgcmFuZ2VTdGFydEVsLFxuICAgIHJhbmdlRW5kRWwsXG4gIH07XG59O1xuXG4vKipcbiAqIGhhbmRsZSB1cGRhdGUgZnJvbSByYW5nZSBzdGFydCBkYXRlIHBpY2tlclxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHJhbmdlIHBpY2tlclxuICovXG5jb25zdCBoYW5kbGVSYW5nZVN0YXJ0VXBkYXRlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZGF0ZVJhbmdlUGlja2VyRWwsIHJhbmdlU3RhcnRFbCwgcmFuZ2VFbmRFbCB9ID1cbiAgICBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgeyBpbnRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KHJhbmdlU3RhcnRFbCk7XG4gIGNvbnN0IHVwZGF0ZWREYXRlID0gaW50ZXJuYWxJbnB1dEVsLnZhbHVlO1xuXG4gIGlmICh1cGRhdGVkRGF0ZSAmJiAhaXNEYXRlSW5wdXRJbnZhbGlkKGludGVybmFsSW5wdXRFbCkpIHtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQubWluRGF0ZSA9IHVwZGF0ZWREYXRlO1xuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5yYW5nZURhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQuZGVmYXVsdERhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgfSBlbHNlIHtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQubWluRGF0ZSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSB8fCBcIlwiO1xuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5yYW5nZURhdGUgPSBcIlwiO1xuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5kZWZhdWx0RGF0ZSA9IFwiXCI7XG4gIH1cblxuICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZShyYW5nZUVuZEVsKTtcbn07XG5cbi8qKlxuICogaGFuZGxlIHVwZGF0ZSBmcm9tIHJhbmdlIHN0YXJ0IGRhdGUgcGlja2VyXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgYW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcmFuZ2UgcGlja2VyXG4gKi9cbmNvbnN0IGhhbmRsZVJhbmdlRW5kVXBkYXRlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZGF0ZVJhbmdlUGlja2VyRWwsIHJhbmdlU3RhcnRFbCwgcmFuZ2VFbmRFbCB9ID1cbiAgICBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgeyBpbnRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KHJhbmdlRW5kRWwpO1xuICBjb25zdCB1cGRhdGVkRGF0ZSA9IGludGVybmFsSW5wdXRFbC52YWx1ZTtcblxuICBpZiAodXBkYXRlZERhdGUgJiYgIWlzRGF0ZUlucHV0SW52YWxpZChpbnRlcm5hbElucHV0RWwpKSB7XG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQubWF4RGF0ZSA9IHVwZGF0ZWREYXRlO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LnJhbmdlRGF0ZSA9IHVwZGF0ZWREYXRlO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LmRlZmF1bHREYXRlID0gdXBkYXRlZERhdGU7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQubWF4RGF0ZSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWF4RGF0ZSB8fCBcIlwiO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LnJhbmdlRGF0ZSA9IFwiXCI7XG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQuZGVmYXVsdERhdGUgPSBcIlwiO1xuICB9XG5cbiAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUocmFuZ2VTdGFydEVsKTtcbn07XG5cbi8qKlxuICogRW5oYW5jZSBhbiBpbnB1dCB3aXRoIHRoZSBkYXRlIHBpY2tlciBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBpbml0aWFsIHdyYXBwaW5nIGVsZW1lbnQgb2YgdGhlIGRhdGUgcmFuZ2UgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBlbmhhbmNlRGF0ZVJhbmdlUGlja2VyID0gKGVsKSA9PiB7XG4gIGNvbnN0IGRhdGVSYW5nZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1JBTkdFX1BJQ0tFUik7XG5cbiAgY29uc3QgW3JhbmdlU3RhcnQsIHJhbmdlRW5kXSA9IHNlbGVjdChEQVRFX1BJQ0tFUiwgZGF0ZVJhbmdlUGlja2VyRWwpO1xuXG4gIGlmICghcmFuZ2VTdGFydCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGAke0RBVEVfUkFOR0VfUElDS0VSfSBpcyBtaXNzaW5nIGlubmVyIHR3byAnJHtEQVRFX1BJQ0tFUn0nIGVsZW1lbnRzYFxuICAgICk7XG4gIH1cblxuICBpZiAoIXJhbmdlRW5kKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYCR7REFURV9SQU5HRV9QSUNLRVJ9IGlzIG1pc3Npbmcgc2Vjb25kICcke0RBVEVfUElDS0VSfScgZWxlbWVudGBcbiAgICApO1xuICB9XG5cbiAgcmFuZ2VTdGFydC5jbGFzc0xpc3QuYWRkKERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUX0NMQVNTKTtcbiAgcmFuZ2VFbmQuY2xhc3NMaXN0LmFkZChEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1MpO1xuXG4gIGlmICghZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlKSB7XG4gICAgZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlID0gREVGQVVMVF9NSU5fREFURTtcbiAgfVxuXG4gIGNvbnN0IHsgbWluRGF0ZSB9ID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldDtcbiAgcmFuZ2VTdGFydC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlO1xuICByYW5nZUVuZC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlO1xuXG4gIGNvbnN0IHsgbWF4RGF0ZSB9ID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldDtcbiAgaWYgKG1heERhdGUpIHtcbiAgICByYW5nZVN0YXJ0LmRhdGFzZXQubWF4RGF0ZSA9IG1heERhdGU7XG4gICAgcmFuZ2VFbmQuZGF0YXNldC5tYXhEYXRlID0gbWF4RGF0ZTtcbiAgfVxuXG4gIGhhbmRsZVJhbmdlU3RhcnRVcGRhdGUoZGF0ZVJhbmdlUGlja2VyRWwpO1xuICBoYW5kbGVSYW5nZUVuZFVwZGF0ZShkYXRlUmFuZ2VQaWNrZXJFbCk7XG59O1xuXG5jb25zdCBkYXRlUmFuZ2VQaWNrZXIgPSBiZWhhdmlvcihcbiAge1xuICAgIFwiaW5wdXQgY2hhbmdlXCI6IHtcbiAgICAgIFtEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVF0oKSB7XG4gICAgICAgIGhhbmRsZVJhbmdlU3RhcnRVcGRhdGUodGhpcyk7XG4gICAgICB9LFxuICAgICAgW0RBVEVfUkFOR0VfUElDS0VSX1JBTkdFX0VORF0oKSB7XG4gICAgICAgIGhhbmRsZVJhbmdlRW5kVXBkYXRlKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoREFURV9SQU5HRV9QSUNLRVIsIHJvb3QpLmZvckVhY2goKGRhdGVSYW5nZVBpY2tlckVsKSA9PiB7XG4gICAgICAgIGVuaGFuY2VEYXRlUmFuZ2VQaWNrZXIoZGF0ZVJhbmdlUGlja2VyRWwpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBkYXRlUmFuZ2VQaWNrZXI7XG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBEUk9QWk9ORV9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dGA7XG5jb25zdCBEUk9QWk9ORSA9IGAuJHtEUk9QWk9ORV9DTEFTU31gO1xuY29uc3QgSU5QVVRfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2lucHV0YDtcbmNvbnN0IFRBUkdFVF9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fdGFyZ2V0YDtcbmNvbnN0IElOUFVUID0gYC4ke0lOUFVUX0NMQVNTfWA7XG5jb25zdCBCT1hfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2JveGA7XG5jb25zdCBJTlNUUlVDVElPTlNfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2luc3RydWN0aW9uc2A7XG5jb25zdCBQUkVWSUVXX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19wcmV2aWV3YDtcbmNvbnN0IFBSRVZJRVdfSEVBRElOR19DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fcHJldmlldy1oZWFkaW5nYDtcbmNvbnN0IERJU0FCTEVEX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0LS1kaXNhYmxlZGA7XG5jb25zdCBDSE9PU0VfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2Nob29zZWA7XG5jb25zdCBBQ0NFUFRFRF9GSUxFX01FU1NBR0VfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2FjY2VwdGVkLWZpbGVzLW1lc3NhZ2VgO1xuY29uc3QgRFJBR19URVhUX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19kcmFnLXRleHRgO1xuY29uc3QgRFJBR19DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dC0tZHJhZ2A7XG5jb25zdCBMT0FESU5HX0NMQVNTID0gXCJpcy1sb2FkaW5nXCI7XG5jb25zdCBJTlZBTElEX0ZJTEVfQ0xBU1MgPSBcImhhcy1pbnZhbGlkLWZpbGVcIjtcbmNvbnN0IEdFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19wcmV2aWV3LWltYWdlYDtcbmNvbnN0IEdFTkVSSUNfUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0tZ2VuZXJpY2A7XG5jb25zdCBQREZfUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0tcGRmYDtcbmNvbnN0IFdPUkRfUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0td29yZGA7XG5jb25zdCBWSURFT19QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS12aWRlb2A7XG5jb25zdCBFWENFTF9QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS1leGNlbGA7XG5jb25zdCBTUl9PTkxZX0NMQVNTID0gYCR7UFJFRklYfS1zci1vbmx5YDtcbmNvbnN0IFNQQUNFUl9HSUYgPVxuICBcImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQUFBQUFQLy8veUg1QkFFQUFBQUFMQUFBQUFBQkFBRUFBQUlCUkFBN1wiO1xuXG5sZXQgVFlQRV9JU19WQUxJRCA9IEJvb2xlYW4odHJ1ZSk7IC8vIGxvZ2ljIGdhdGUgZm9yIGNoYW5nZSBsaXN0ZW5lclxubGV0IERFRkFVTFRfQVJJQV9MQUJFTF9URVhUID0gXCJcIjtcbmxldCBERUZBVUxUX0ZJTEVfU1RBVFVTX1RFWFQgPSBcIlwiO1xuXG4vKipcbiAqIFRoZSBwcm9wZXJ0aWVzIGFuZCBlbGVtZW50cyB3aXRoaW4gdGhlIGZpbGUgaW5wdXQuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBGaWxlSW5wdXRDb250ZXh0XG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBkcm9wWm9uZUVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0RWxcbiAqL1xuXG4vKipcbiAqIEdldCBhbiBvYmplY3Qgb2YgdGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIGZpbGUgaW5wdXQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dFxuICogQHJldHVybnMge0ZpbGVJbnB1dENvbnRleHR9IGVsZW1lbnRzXG4gKi9cbmNvbnN0IGdldEZpbGVJbnB1dENvbnRleHQgPSAoZWwpID0+IHtcbiAgY29uc3QgZHJvcFpvbmVFbCA9IGVsLmNsb3Nlc3QoRFJPUFpPTkUpO1xuXG4gIGlmICghZHJvcFpvbmVFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7RFJPUFpPTkV9YCk7XG4gIH1cblxuICBjb25zdCBpbnB1dEVsID0gZHJvcFpvbmVFbC5xdWVyeVNlbGVjdG9yKElOUFVUKTtcblxuICByZXR1cm4ge1xuICAgIGRyb3Bab25lRWwsXG4gICAgaW5wdXRFbCxcbiAgfTtcbn07XG5cbi8qKlxuICogRGlzYWJsZSB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRyb3Bab25lRWwsIGlucHV0RWwgfSA9IGdldEZpbGVJbnB1dENvbnRleHQoZWwpO1xuXG4gIGlucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xuICBkcm9wWm9uZUVsLmNsYXNzTGlzdC5hZGQoRElTQUJMRURfQ0xBU1MpO1xufTtcblxuLyoqXG4gKiBTZXQgYXJpYS1kaXNhYmxlZCBhdHRyaWJ1dGUgdG8gZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqL1xuY29uc3QgYXJpYURpc2FibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBkcm9wWm9uZUVsIH0gPSBnZXRGaWxlSW5wdXRDb250ZXh0KGVsKTtcblxuICBkcm9wWm9uZUVsLmNsYXNzTGlzdC5hZGQoRElTQUJMRURfQ0xBU1MpO1xufTtcblxuLyoqXG4gKiBFbmFibGUgdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50XG4gKi9cbmNvbnN0IGVuYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRyb3Bab25lRWwsIGlucHV0RWwgfSA9IGdldEZpbGVJbnB1dENvbnRleHQoZWwpO1xuXG4gIGlucHV0RWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgZHJvcFpvbmVFbC5jbGFzc0xpc3QucmVtb3ZlKERJU0FCTEVEX0NMQVNTKTtcbiAgZHJvcFpvbmVFbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIpO1xufTtcblxuLyoqXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHMgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gKiBAcmV0dXJucyB7U3RyaW5nfSByZXBsYWNlcyBzcGVjaWZpZWQgdmFsdWVzXG4gKi9cbmNvbnN0IHJlcGxhY2VOYW1lID0gKHMpID0+IHtcbiAgY29uc3QgYyA9IHMuY2hhckNvZGVBdCgwKTtcbiAgaWYgKGMgPT09IDMyKSByZXR1cm4gXCItXCI7XG4gIGlmIChjID49IDY1ICYmIGMgPD0gOTApIHJldHVybiBgaW1nXyR7cy50b0xvd2VyQ2FzZSgpfWA7XG4gIHJldHVybiBgX18keyhcIjAwMFwiLCBjLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpfWA7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gSUQgbmFtZSBmb3IgZWFjaCBmaWxlIHRoYXQgc3RyaXBzIGFsbCBpbnZhbGlkIGNoYXJhY3RlcnMuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIGZpbGUgYWRkZWQgdG8gZmlsZSBpbnB1dCAoc2VhcmNodmFsdWUpXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzYW1lIGNoYXJhY3RlcnMgYXMgdGhlIG5hbWUgd2l0aCBpbnZhbGlkIGNoYXJzIHJlbW92ZWQgKG5ld3ZhbHVlKVxuICovXG5jb25zdCBtYWtlU2FmZUZvcklEID0gKG5hbWUpID0+IG5hbWUucmVwbGFjZSgvW15hLXowLTldL2csIHJlcGxhY2VOYW1lKTtcblxuLy8gVGFrZXMgYSBnZW5lcmF0ZWQgc2FmZSBJRCBhbmQgY3JlYXRlcyBhIHVuaXF1ZSBJRC5cbmNvbnN0IGNyZWF0ZVVuaXF1ZUlEID0gKG5hbWUpID0+XG4gIGAke25hbWV9LSR7TWF0aC5mbG9vcihEYXRlLm5vdygpLnRvU3RyaW5nKCkgLyAxMDAwKX1gO1xuXG4vKipcbiAqIERldGVybWluZXMgaWYgdGhlIHNpbmd1bGFyIG9yIHBsdXJhbCBpdGVtIGxhYmVsIHNob3VsZCBiZSB1c2VkXG4gKiBEZXRlcm1pbmF0aW9uIGlzIGJhc2VkIG9uIHRoZSBwcmVzZW5jZSBvZiB0aGUgYG11bHRpcGxlYCBhdHRyaWJ1dGVcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gVGhlIGlucHV0IGVsZW1lbnQuXG4gKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBzaW5ndWxhciBvciBwbHVyYWwgdmVyc2lvbiBvZiBcIml0ZW1cIlxuICovXG5jb25zdCBnZXRJdGVtc0xhYmVsID0gKGZpbGVJbnB1dEVsKSA9PiB7XG4gIGNvbnN0IGFjY2VwdHNNdWx0aXBsZSA9IGZpbGVJbnB1dEVsLmhhc0F0dHJpYnV0ZShcIm11bHRpcGxlXCIpO1xuICBjb25zdCBpdGVtc0xhYmVsID0gYWNjZXB0c011bHRpcGxlID8gXCJmaWxlc1wiIDogXCJmaWxlXCI7XG5cbiAgcmV0dXJuIGl0ZW1zTGFiZWw7XG59O1xuXG4vKipcbiAqIFNjYWZmb2xkIHRoZSBmaWxlIGlucHV0IGNvbXBvbmVudCB3aXRoIGEgcGFyZW50IHdyYXBwZXIgYW5kXG4gKiBDcmVhdGUgYSB0YXJnZXQgYXJlYSBvdmVybGF5IGZvciBkcmFnIGFuZCBkcm9wIGZ1bmN0aW9uYWxpdHlcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gVGhlIGlucHV0IGVsZW1lbnQuXG4gKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBkcmFnIGFuZCBkcm9wIHRhcmdldCBhcmVhLlxuICovXG5jb25zdCBjcmVhdGVUYXJnZXRBcmVhID0gKGZpbGVJbnB1dEVsKSA9PiB7XG4gIGNvbnN0IGZpbGVJbnB1dFBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNvbnN0IGRyb3BUYXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gIC8vIEFkZHMgY2xhc3MgbmFtZXMgYW5kIG90aGVyIGF0dHJpYnV0ZXNcbiAgZmlsZUlucHV0RWwuY2xhc3NMaXN0LnJlbW92ZShEUk9QWk9ORV9DTEFTUyk7XG4gIGZpbGVJbnB1dEVsLmNsYXNzTGlzdC5hZGQoSU5QVVRfQ0xBU1MpO1xuICBmaWxlSW5wdXRQYXJlbnQuY2xhc3NMaXN0LmFkZChEUk9QWk9ORV9DTEFTUyk7XG4gIGJveC5jbGFzc0xpc3QuYWRkKEJPWF9DTEFTUyk7XG4gIGRyb3BUYXJnZXQuY2xhc3NMaXN0LmFkZChUQVJHRVRfQ0xBU1MpO1xuXG4gIC8vIEFkZHMgY2hpbGQgZWxlbWVudHMgdG8gdGhlIERPTVxuICBkcm9wVGFyZ2V0LnByZXBlbmQoYm94KTtcbiAgZmlsZUlucHV0RWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZHJvcFRhcmdldCwgZmlsZUlucHV0RWwpO1xuICBmaWxlSW5wdXRFbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShmaWxlSW5wdXRQYXJlbnQsIGRyb3BUYXJnZXQpO1xuICBkcm9wVGFyZ2V0LmFwcGVuZENoaWxkKGZpbGVJbnB1dEVsKTtcbiAgZmlsZUlucHV0UGFyZW50LmFwcGVuZENoaWxkKGRyb3BUYXJnZXQpO1xuXG4gIHJldHVybiBkcm9wVGFyZ2V0O1xufTtcblxuLyoqXG4gKiBCdWlsZCB0aGUgdmlzaWJsZSBlbGVtZW50IHdpdGggZGVmYXVsdCBpbnRlcmFjdGlvbiBpbnN0cnVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBpbnB1dCBlbGVtZW50LlxuICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBUaGUgY29udGFpbmVyIGZvciB2aXNpYmxlIGludGVyYWN0aW9uIGluc3RydWN0aW9ucy5cbiAqL1xuY29uc3QgY3JlYXRlVmlzaWJsZUluc3RydWN0aW9ucyA9IChmaWxlSW5wdXRFbCkgPT4ge1xuICBjb25zdCBmaWxlSW5wdXRQYXJlbnQgPSBmaWxlSW5wdXRFbC5jbG9zZXN0KERST1BaT05FKTtcbiAgY29uc3QgaXRlbXNMYWJlbCA9IGdldEl0ZW1zTGFiZWwoZmlsZUlucHV0RWwpO1xuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBkcmFnVGV4dCA9IGBEcmFnICR7aXRlbXNMYWJlbH0gaGVyZSBvcmA7XG4gIGNvbnN0IGNob29zZVRleHQgPSBcImNob29zZSBmcm9tIGZvbGRlclwiO1xuXG4gIC8vIENyZWF0ZSBpbnN0cnVjdGlvbnMgdGV4dCBmb3IgYXJpYS1sYWJlbFxuICBERUZBVUxUX0FSSUFfTEFCRUxfVEVYVCA9IGAke2RyYWdUZXh0fSAke2Nob29zZVRleHR9YDtcblxuICAvLyBBZGRzIGNsYXNzIG5hbWVzIGFuZCBvdGhlciBhdHRyaWJ1dGVzXG4gIGluc3RydWN0aW9ucy5jbGFzc0xpc3QuYWRkKElOU1RSVUNUSU9OU19DTEFTUyk7XG4gIGluc3RydWN0aW9ucy5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG5cbiAgLy8gQWRkIGluaXRpYWwgaW5zdHJ1Y3Rpb25zIGZvciBpbnB1dCB1c2FnZVxuICBmaWxlSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIERFRkFVTFRfQVJJQV9MQUJFTF9URVhUKTtcbiAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYDxzcGFuIGNsYXNzPVwiJHtEUkFHX1RFWFRfQ0xBU1N9XCI+JHtkcmFnVGV4dH08L3NwYW4+IDxzcGFuIGNsYXNzPVwiJHtDSE9PU0VfQ0xBU1N9XCI+JHtjaG9vc2VUZXh0fTwvc3Bhbj5gO1xuXG4gIC8vIEFkZCB0aGUgaW5zdHJ1Y3Rpb25zIGVsZW1lbnQgdG8gdGhlIERPTVxuICBmaWxlSW5wdXRFbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnN0cnVjdGlvbnMsIGZpbGVJbnB1dEVsKTtcblxuICAvLyBJRTExIGFuZCBFZGdlIGRvIG5vdCBzdXBwb3J0IGRyb3AgZmlsZXMgb24gZmlsZSBpbnB1dHMsIHNvIHdlJ3ZlIHJlbW92ZWQgdGV4dCB0aGF0IGluZGljYXRlcyB0aGF0XG4gIGlmIChcbiAgICAvcnY6MTEuMC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAvRWRnZVxcL1xcZC4vaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpXG4gICkge1xuICAgIGZpbGVJbnB1dFBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtEUkFHX1RFWFRfQ0xBU1N9YCkub3V0ZXJIVE1MID0gXCJcIjtcbiAgfVxuXG4gIHJldHVybiBpbnN0cnVjdGlvbnM7XG59O1xuXG4vKipcbiAqIEJ1aWxkIGEgc2NyZWVuIHJlYWRlci1vbmx5IG1lc3NhZ2UgZWxlbWVudCB0aGF0IGNvbnRhaW5zIGZpbGUgc3RhdHVzIHVwZGF0ZXMgYW5kXG4gKiBDcmVhdGUgYW5kIHNldCB0aGUgZGVmYXVsdCBmaWxlIHN0YXR1cyBtZXNzYWdlXG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBpbnB1dCBlbGVtZW50LlxuICovXG5jb25zdCBjcmVhdGVTUk9ubHlTdGF0dXMgPSAoZmlsZUlucHV0RWwpID0+IHtcbiAgY29uc3Qgc3RhdHVzRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBpdGVtc0xhYmVsID0gZ2V0SXRlbXNMYWJlbChmaWxlSW5wdXRFbCk7XG4gIGNvbnN0IGZpbGVJbnB1dFBhcmVudCA9IGZpbGVJbnB1dEVsLmNsb3Nlc3QoRFJPUFpPTkUpO1xuICBjb25zdCBmaWxlSW5wdXRUYXJnZXQgPSBmaWxlSW5wdXRFbC5jbG9zZXN0KGAuJHtUQVJHRVRfQ0xBU1N9YCk7XG5cbiAgREVGQVVMVF9GSUxFX1NUQVRVU19URVhUID0gYE5vICR7aXRlbXNMYWJlbH0gc2VsZWN0ZWQuYDtcblxuICAvLyBBZGRzIGNsYXNzIG5hbWVzIGFuZCBvdGhlciBhdHRyaWJ1dGVzXG4gIHN0YXR1c0VsLmNsYXNzTGlzdC5hZGQoU1JfT05MWV9DTEFTUyk7XG4gIHN0YXR1c0VsLnNldEF0dHJpYnV0ZShcImFyaWEtbGl2ZVwiLCBcInBvbGl0ZVwiKTtcblxuICAvLyBBZGQgaW5pdGlhbCBmaWxlIHN0YXR1cyBtZXNzYWdlXG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gREVGQVVMVF9GSUxFX1NUQVRVU19URVhUO1xuXG4gIC8vIEFkZCB0aGUgc3RhdHVzIGVsZW1lbnQgdG8gdGhlIERPTVxuICBmaWxlSW5wdXRQYXJlbnQuaW5zZXJ0QmVmb3JlKHN0YXR1c0VsLCBmaWxlSW5wdXRUYXJnZXQpO1xufTtcblxuLyoqXG4gKiBTY2FmZm9sZCB0aGUgY29tcG9uZW50IHdpdGggYWxsIHJlcXVpcmVkIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBvcmlnaW5hbCBpbnB1dCBlbGVtZW50LlxuICovXG5jb25zdCBlbmhhbmNlRmlsZUlucHV0ID0gKGZpbGVJbnB1dEVsKSA9PiB7XG4gIGNvbnN0IGlzSW5wdXREaXNhYmxlZCA9XG4gICAgZmlsZUlucHV0RWwuaGFzQXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiKSB8fFxuICAgIGZpbGVJbnB1dEVsLmhhc0F0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xuICBjb25zdCBkcm9wVGFyZ2V0ID0gY3JlYXRlVGFyZ2V0QXJlYShmaWxlSW5wdXRFbCk7XG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGNyZWF0ZVZpc2libGVJbnN0cnVjdGlvbnMoZmlsZUlucHV0RWwpO1xuICBjb25zdCB7IGRyb3Bab25lRWwgfSA9IGdldEZpbGVJbnB1dENvbnRleHQoZmlsZUlucHV0RWwpO1xuXG4gIGlmIChpc0lucHV0RGlzYWJsZWQpIHtcbiAgICBkcm9wWm9uZUVsLmNsYXNzTGlzdC5hZGQoRElTQUJMRURfQ0xBU1MpO1xuICB9IGVsc2Uge1xuICAgIGNyZWF0ZVNST25seVN0YXR1cyhmaWxlSW5wdXRFbCk7XG4gIH1cblxuICByZXR1cm4geyBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQgfTtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBpbWFnZSBwcmV2aWV3c1xuICogV2Ugd2FudCB0byBzdGFydCB3aXRoIGEgY2xlYW4gbGlzdCBldmVyeSB0aW1lIGZpbGVzIGFyZSBhZGRlZCB0byB0aGUgZmlsZSBpbnB1dFxuICpcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGRyb3BUYXJnZXQgLSBUaGUgZHJhZyBhbmQgZHJvcCB0YXJnZXQgYXJlYS5cbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGluc3RydWN0aW9ucyAtIFRoZSBjb250YWluZXIgZm9yIHZpc2libGUgaW50ZXJhY3Rpb24gaW5zdHJ1Y3Rpb25zLlxuICovXG5jb25zdCByZW1vdmVPbGRQcmV2aWV3cyA9IChkcm9wVGFyZ2V0LCBpbnN0cnVjdGlvbnMpID0+IHtcbiAgY29uc3QgZmlsZVByZXZpZXdzID0gZHJvcFRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtQUkVWSUVXX0NMQVNTfWApO1xuICBjb25zdCBjdXJyZW50UHJldmlld0hlYWRpbmcgPSBkcm9wVGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoXG4gICAgYC4ke1BSRVZJRVdfSEVBRElOR19DTEFTU31gXG4gICk7XG4gIGNvbnN0IGN1cnJlbnRFcnJvck1lc3NhZ2UgPSBkcm9wVGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoXG4gICAgYC4ke0FDQ0VQVEVEX0ZJTEVfTUVTU0FHRV9DTEFTU31gXG4gICk7XG5cbiAgLyoqXG4gICAqIGZpbmRzIHRoZSBwYXJlbnQgb2YgdGhlIHBhc3NlZCBub2RlIGFuZCByZW1vdmVzIHRoZSBjaGlsZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXG4gICAqL1xuICBjb25zdCByZW1vdmVJbWFnZXMgPSAobm9kZSkgPT4ge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgfTtcblxuICAvLyBSZW1vdmUgdGhlIGhlYWRpbmcgYWJvdmUgdGhlIHByZXZpZXdzXG4gIGlmIChjdXJyZW50UHJldmlld0hlYWRpbmcpIHtcbiAgICBjdXJyZW50UHJldmlld0hlYWRpbmcub3V0ZXJIVE1MID0gXCJcIjtcbiAgfVxuXG4gIC8vIFJlbW92ZSBleGlzdGluZyBlcnJvciBtZXNzYWdlc1xuICBpZiAoY3VycmVudEVycm9yTWVzc2FnZSkge1xuICAgIGN1cnJlbnRFcnJvck1lc3NhZ2Uub3V0ZXJIVE1MID0gXCJcIjtcbiAgICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoSU5WQUxJRF9GSUxFX0NMQVNTKTtcbiAgfVxuXG4gIC8vIEdldCByaWQgb2YgZXhpc3RpbmcgcHJldmlld3MgaWYgdGhleSBleGlzdCwgc2hvdyBpbnN0cnVjdGlvbnNcbiAgaWYgKGZpbGVQcmV2aWV3cyAhPT0gbnVsbCkge1xuICAgIGlmIChpbnN0cnVjdGlvbnMpIHtcbiAgICAgIGluc3RydWN0aW9ucy5yZW1vdmVBdHRyaWJ1dGUoXCJoaWRkZW5cIik7XG4gICAgfVxuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZmlsZVByZXZpZXdzLCByZW1vdmVJbWFnZXMpO1xuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgc2NyZWVuIHJlYWRlci1vbmx5IHN0YXR1cyBtZXNzYWdlIGFmdGVyIGludGVyYWN0aW9uXG4gKlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gc3RhdHVzRWxlbWVudCAtIFRoZSBzY3JlZW4gcmVhZGVyLW9ubHkgY29udGFpbmVyIGZvciBmaWxlIHN0YXR1cyB1cGRhdGVzLlxuICogQHBhcmFtIHtPYmplY3R9IGZpbGVOYW1lcyAtIFRoZSBzZWxlY3RlZCBmaWxlcyBmb3VuZCBpbiB0aGUgZmlsZUxpc3Qgb2JqZWN0LlxuICogQHBhcmFtIHtBcnJheX0gZmlsZVN0b3JlIC0gVGhlIGFycmF5IG9mIHVwbG9hZGVkIGZpbGUgbmFtZXMgY3JlYXRlZCBmcm9tIHRoZSBmaWxlTmFtZXMgb2JqZWN0LlxuICovXG5jb25zdCB1cGRhdGVTdGF0dXNNZXNzYWdlID0gKHN0YXR1c0VsZW1lbnQsIGZpbGVOYW1lcywgZmlsZVN0b3JlKSA9PiB7XG4gIGNvbnN0IHN0YXR1c0VsID0gc3RhdHVzRWxlbWVudDtcbiAgbGV0IHN0YXR1c01lc3NhZ2UgPSBERUZBVUxUX0ZJTEVfU1RBVFVTX1RFWFQ7XG5cbiAgLy8gSWYgZmlsZXMgYWRkZWQsIHVwZGF0ZSB0aGUgc3RhdHVzIG1lc3NhZ2Ugd2l0aCBmaWxlIG5hbWUocylcbiAgaWYgKGZpbGVOYW1lcy5sZW5ndGggPT09IDEpIHtcbiAgICBzdGF0dXNNZXNzYWdlID0gYFlvdSBoYXZlIHNlbGVjdGVkIHRoZSBmaWxlOiAke2ZpbGVTdG9yZX1gO1xuICB9IGVsc2UgaWYgKGZpbGVOYW1lcy5sZW5ndGggPiAxKSB7XG4gICAgc3RhdHVzTWVzc2FnZSA9IGBZb3UgaGF2ZSBzZWxlY3RlZCAke1xuICAgICAgZmlsZU5hbWVzLmxlbmd0aFxuICAgIH0gZmlsZXM6ICR7ZmlsZVN0b3JlLmpvaW4oXCIsIFwiKX1gO1xuICB9XG5cbiAgLy8gQWRkIGRlbGF5IHRvIGVuY291cmFnZSBzY3JlZW4gcmVhZGVyIHJlYWRvdXRcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBzdGF0dXNNZXNzYWdlO1xuICB9LCAxMDAwKTtcbn07XG5cbi8qKlxuICogU2hvdyB0aGUgcHJldmlldyBoZWFkaW5nLCBoaWRlIHRoZSBpbml0aWFsIGluc3RydWN0aW9ucyBhbmRcbiAqIFVwZGF0ZSB0aGUgYXJpYS1sYWJlbCB3aXRoIG5ldyBpbnN0cnVjdGlvbnMgdGV4dFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZmlsZUlucHV0RWwgLSBUaGUgaW5wdXQgZWxlbWVudC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlTmFtZXMgLSBUaGUgc2VsZWN0ZWQgZmlsZXMgZm91bmQgaW4gdGhlIGZpbGVMaXN0IG9iamVjdC5cbiAqL1xuY29uc3QgYWRkUHJldmlld0hlYWRpbmcgPSAoZmlsZUlucHV0RWwsIGZpbGVOYW1lcykgPT4ge1xuICBjb25zdCBmaWxlUHJldmlld3NIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgZHJvcFRhcmdldCA9IGZpbGVJbnB1dEVsLmNsb3Nlc3QoYC4ke1RBUkdFVF9DTEFTU31gKTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZHJvcFRhcmdldC5xdWVyeVNlbGVjdG9yKGAuJHtJTlNUUlVDVElPTlNfQ0xBU1N9YCk7XG4gIGxldCBjaGFuZ2VJdGVtVGV4dCA9IFwiQ2hhbmdlIGZpbGVcIjtcbiAgbGV0IHByZXZpZXdIZWFkaW5nVGV4dCA9IFwiXCI7XG5cbiAgaWYgKGZpbGVOYW1lcy5sZW5ndGggPT09IDEpIHtcbiAgICBwcmV2aWV3SGVhZGluZ1RleHQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBTZWxlY3RlZCBmaWxlIDxzcGFuIGNsYXNzPVwidXNhLWZpbGUtaW5wdXRfX2Nob29zZVwiPiR7Y2hhbmdlSXRlbVRleHR9PC9zcGFuPmA7XG4gIH0gZWxzZSBpZiAoZmlsZU5hbWVzLmxlbmd0aCA+IDEpIHtcbiAgICBjaGFuZ2VJdGVtVGV4dCA9IFwiQ2hhbmdlIGZpbGVzXCI7XG4gICAgcHJldmlld0hlYWRpbmdUZXh0ID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtmaWxlTmFtZXMubGVuZ3RofSBmaWxlcyBzZWxlY3RlZCA8c3BhbiBjbGFzcz1cInVzYS1maWxlLWlucHV0X19jaG9vc2VcIj4ke2NoYW5nZUl0ZW1UZXh0fTwvc3Bhbj5gO1xuICB9XG5cbiAgLy8gSGlkZXMgbnVsbCBzdGF0ZSBjb250ZW50IGFuZCBzZXRzIHByZXZpZXcgaGVhZGluZ1xuICBpbnN0cnVjdGlvbnMuc2V0QXR0cmlidXRlKFwiaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgZmlsZVByZXZpZXdzSGVhZGluZy5jbGFzc0xpc3QuYWRkKFBSRVZJRVdfSEVBRElOR19DTEFTUyk7XG4gIGZpbGVQcmV2aWV3c0hlYWRpbmcuaW5uZXJIVE1MID0gcHJldmlld0hlYWRpbmdUZXh0O1xuICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZShmaWxlUHJldmlld3NIZWFkaW5nLCBpbnN0cnVjdGlvbnMpO1xuXG4gIC8vIFVwZGF0ZSBhcmlhIGxhYmVsIHRvIG1hdGNoIHRoZSB2aXNpYmxlIGFjdGlvbiB0ZXh0XG4gIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgY2hhbmdlSXRlbVRleHQpO1xufTtcblxuLyoqXG4gKiBXaGVuIG5ldyBmaWxlcyBhcmUgYXBwbGllZCB0byBmaWxlIGlucHV0LCB0aGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyBwcmV2aWV3c1xuICogYW5kIHJlbW92ZXMgb2xkIG9uZXMuXG4gKlxuICogQHBhcmFtIHtldmVudH0gZVxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBpbnB1dCBlbGVtZW50LlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gaW5zdHJ1Y3Rpb25zIC0gVGhlIGNvbnRhaW5lciBmb3IgdmlzaWJsZSBpbnRlcmFjdGlvbiBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBkcm9wVGFyZ2V0IC0gVGhlIGRyYWcgYW5kIGRyb3AgdGFyZ2V0IGFyZWEuXG4gKi9cblxuY29uc3QgaGFuZGxlQ2hhbmdlID0gKGUsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpID0+IHtcbiAgY29uc3QgZmlsZU5hbWVzID0gZS50YXJnZXQuZmlsZXM7XG4gIGNvbnN0IGlucHV0UGFyZW50ID0gZHJvcFRhcmdldC5jbG9zZXN0KGAuJHtEUk9QWk9ORV9DTEFTU31gKTtcbiAgY29uc3Qgc3RhdHVzRWxlbWVudCA9IGlucHV0UGFyZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke1NSX09OTFlfQ0xBU1N9YCk7XG4gIGNvbnN0IGZpbGVTdG9yZSA9IFtdO1xuXG4gIC8vIEZpcnN0LCBnZXQgcmlkIG9mIGV4aXN0aW5nIHByZXZpZXdzXG4gIHJlbW92ZU9sZFByZXZpZXdzKGRyb3BUYXJnZXQsIGluc3RydWN0aW9ucyk7XG5cbiAgLy8gVGhlbiwgaXRlcmF0ZSB0aHJvdWdoIGZpbGVzIGxpc3QgYW5kIGNyZWF0ZSBwcmV2aWV3c1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVOYW1lcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlTmFtZXNbaV0ubmFtZTtcbiAgICBsZXQgaW1hZ2VJZDtcblxuICAgIC8vIFB1c2ggdXBkYXRlZCBmaWxlIG5hbWVzIGludG8gdGhlIHN0b3JlIGFycmF5XG4gICAgZmlsZVN0b3JlLnB1c2goZmlsZU5hbWUpO1xuXG4gICAgLy8gU3RhcnRzIHdpdGggYSBsb2FkaW5nIGltYWdlIHdoaWxlIHByZXZpZXcgaXMgY3JlYXRlZFxuICAgIHJlYWRlci5vbmxvYWRzdGFydCA9IGZ1bmN0aW9uIGNyZWF0ZUxvYWRpbmdJbWFnZSgpIHtcbiAgICAgIGltYWdlSWQgPSBjcmVhdGVVbmlxdWVJRChtYWtlU2FmZUZvcklEKGZpbGVOYW1lKSk7XG5cbiAgICAgIGluc3RydWN0aW9ucy5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgIFwiYWZ0ZXJlbmRcIixcbiAgICAgICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgPGRpdiBjbGFzcz1cIiR7UFJFVklFV19DTEFTU31cIiBhcmlhLWhpZGRlbj1cInRydWVcIj5cbiAgICAgICAgICA8aW1nIGlkPVwiJHtpbWFnZUlkfVwiIHNyYz1cIiR7U1BBQ0VSX0dJRn1cIiBhbHQ9XCJcIiBjbGFzcz1cIiR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9ICR7TE9BRElOR19DTEFTU31cIi8+JHtmaWxlTmFtZX1cbiAgICAgICAgPGRpdj5gXG4gICAgICApO1xuICAgIH07XG5cbiAgICAvLyBOb3QgYWxsIGZpbGVzIHdpbGwgYmUgYWJsZSB0byBnZW5lcmF0ZSBwcmV2aWV3cy4gSW4gY2FzZSB0aGlzIGhhcHBlbnMsIHdlIHByb3ZpZGUgc2V2ZXJhbCB0eXBlcyBcImdlbmVyaWMgcHJldmlld3NcIiBiYXNlZCBvbiB0aGUgZmlsZSBleHRlbnNpb24uXG4gICAgcmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uIGNyZWF0ZUZpbGVQcmV2aWV3KCkge1xuICAgICAgY29uc3QgcHJldmlld0ltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaW1hZ2VJZCk7XG4gICAgICBpZiAoZmlsZU5hbWUuaW5kZXhPZihcIi5wZGZcIikgPiAwKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1BERl9QUkVWSUVXX0NMQVNTfVwiKWBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGZpbGVOYW1lLmluZGV4T2YoXCIuZG9jXCIpID4gMCB8fFxuICAgICAgICBmaWxlTmFtZS5pbmRleE9mKFwiLnBhZ2VzXCIpID4gMFxuICAgICAgKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1dPUkRfUFJFVklFV19DTEFTU31cIilgXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBmaWxlTmFtZS5pbmRleE9mKFwiLnhsc1wiKSA+IDAgfHxcbiAgICAgICAgZmlsZU5hbWUuaW5kZXhPZihcIi5udW1iZXJzXCIpID4gMFxuICAgICAgKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke0VYQ0VMX1BSRVZJRVdfQ0xBU1N9XCIpYFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChmaWxlTmFtZS5pbmRleE9mKFwiLm1vdlwiKSA+IDAgfHwgZmlsZU5hbWUuaW5kZXhPZihcIi5tcDRcIikgPiAwKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1ZJREVPX1BSRVZJRVdfQ0xBU1N9XCIpYFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlld0ltYWdlLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICBcIm9uZXJyb3JcIixcbiAgICAgICAgICBgdGhpcy5vbmVycm9yPW51bGw7dGhpcy5zcmM9XCIke1NQQUNFUl9HSUZ9XCI7IHRoaXMuY2xhc3NMaXN0LmFkZChcIiR7R0VORVJJQ19QUkVWSUVXX0NMQVNTfVwiKWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlcyBsb2FkZXIgYW5kIGRpc3BsYXlzIHByZXZpZXdcbiAgICAgIHByZXZpZXdJbWFnZS5jbGFzc0xpc3QucmVtb3ZlKExPQURJTkdfQ0xBU1MpO1xuICAgICAgcHJldmlld0ltYWdlLnNyYyA9IHJlYWRlci5yZXN1bHQ7XG4gICAgfTtcblxuICAgIGlmIChmaWxlTmFtZXNbaV0pIHtcbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVOYW1lc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpbGVOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAvLyBSZXNldCBpbnB1dCBhcmlhLWxhYmVsIHdpdGggZGVmYXVsdCBtZXNzYWdlXG4gICAgZmlsZUlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBERUZBVUxUX0FSSUFfTEFCRUxfVEVYVCk7XG4gIH0gZWxzZSB7XG4gICAgYWRkUHJldmlld0hlYWRpbmcoZmlsZUlucHV0RWwsIGZpbGVOYW1lcyk7XG4gIH1cblxuICB1cGRhdGVTdGF0dXNNZXNzYWdlKHN0YXR1c0VsZW1lbnQsIGZpbGVOYW1lcywgZmlsZVN0b3JlKTtcbn07XG5cbi8qKlxuICogV2hlbiB1c2luZyBhbiBBY2NlcHQgYXR0cmlidXRlLCBpbnZhbGlkIGZpbGVzIHdpbGwgYmUgaGlkZGVuIGZyb21cbiAqIGZpbGUgYnJvd3NlciwgYnV0IHRoZXkgY2FuIHN0aWxsIGJlIGRyYWdnZWQgdG8gdGhlIGlucHV0LiBUaGlzXG4gKiBmdW5jdGlvbiBwcmV2ZW50cyB0aGVtIGZyb20gYmVpbmcgZHJhZ2dlZCBhbmQgcmVtb3ZlcyBlcnJvciBzdGF0ZXNcbiAqIHdoZW4gY29ycmVjdCBmaWxlcyBhcmUgYWRkZWQuXG4gKlxuICogQHBhcmFtIHtldmVudH0gZVxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBmaWxlSW5wdXRFbCAtIFRoZSBpbnB1dCBlbGVtZW50LlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gaW5zdHJ1Y3Rpb25zIC0gVGhlIGNvbnRhaW5lciBmb3IgdmlzaWJsZSBpbnRlcmFjdGlvbiBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBkcm9wVGFyZ2V0IC0gVGhlIGRyYWcgYW5kIGRyb3AgdGFyZ2V0IGFyZWEuXG4gKi9cbmNvbnN0IHByZXZlbnRJbnZhbGlkRmlsZXMgPSAoZSwgZmlsZUlucHV0RWwsIGluc3RydWN0aW9ucywgZHJvcFRhcmdldCkgPT4ge1xuICBjb25zdCBhY2NlcHRlZEZpbGVzQXR0ciA9IGZpbGVJbnB1dEVsLmdldEF0dHJpYnV0ZShcImFjY2VwdFwiKTtcbiAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKElOVkFMSURfRklMRV9DTEFTUyk7XG5cbiAgLyoqXG4gICAqIFdlIGNhbiBwcm9iYWJseSBtb3ZlIGF3YXkgZnJvbSB0aGlzIG9uY2UgSUUxMSBzdXBwb3J0IHN0b3BzLCBhbmQgcmVwbGFjZVxuICAgKiB3aXRoIGEgc2ltcGxlIGVzIGAuaW5jbHVkZXNgXG4gICAqIGNoZWNrIGlmIGVsZW1lbnQgaXMgaW4gYXJyYXlcbiAgICogY2hlY2sgaWYgMSBvciBtb3JlIGFscGhhYmV0cyBhcmUgaW4gc3RyaW5nXG4gICAqIGlmIGVsZW1lbnQgaXMgcHJlc2VudCByZXR1cm4gdGhlIHBvc2l0aW9uIHZhbHVlIGFuZCAtMSBvdGhlcndpc2VcbiAgICogQHBhcmFtIHtPYmplY3R9IGZpbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgY29uc3QgaXNJbmNsdWRlZCA9IChmaWxlLCB2YWx1ZSkgPT4ge1xuICAgIGxldCByZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIGNvbnN0IHBvcyA9IGZpbGUuaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKHBvcyA+PSAwKSB7XG4gICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgfTtcblxuICAvLyBSdW5zIGlmIG9ubHkgc3BlY2lmaWMgZmlsZXMgYXJlIGFjY2VwdGVkXG4gIGlmIChhY2NlcHRlZEZpbGVzQXR0cikge1xuICAgIGNvbnN0IGFjY2VwdGVkRmlsZXMgPSBhY2NlcHRlZEZpbGVzQXR0ci5zcGxpdChcIixcIik7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgIC8vIElmIG11bHRpcGxlIGZpbGVzIGFyZSBkcmFnZ2VkLCB0aGlzIGl0ZXJhdGVzIHRocm91Z2ggdGhlbSBhbmQgbG9vayBmb3IgYW55IGZpbGVzIHRoYXQgYXJlIG5vdCBhY2NlcHRlZC5cbiAgICBsZXQgYWxsRmlsZXNBbGxvd2VkID0gdHJ1ZTtcbiAgICBjb25zdCBzY2FubmVkRmlsZXMgPSBlLnRhcmdldC5maWxlcyB8fCBlLmRhdGFUcmFuc2Zlci5maWxlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjYW5uZWRGaWxlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3QgZmlsZSA9IHNjYW5uZWRGaWxlc1tpXTtcbiAgICAgIGlmIChhbGxGaWxlc0FsbG93ZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhY2NlcHRlZEZpbGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgY29uc3QgZmlsZVR5cGUgPSBhY2NlcHRlZEZpbGVzW2pdO1xuICAgICAgICAgIGFsbEZpbGVzQWxsb3dlZCA9XG4gICAgICAgICAgICBmaWxlLm5hbWUuaW5kZXhPZihmaWxlVHlwZSkgPiAwIHx8XG4gICAgICAgICAgICBpc0luY2x1ZGVkKGZpbGUudHlwZSwgZmlsZVR5cGUucmVwbGFjZSgvXFwqL2csIFwiXCIpKTtcbiAgICAgICAgICBpZiAoYWxsRmlsZXNBbGxvd2VkKSB7XG4gICAgICAgICAgICBUWVBFX0lTX1ZBTElEID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIElmIGRyYWdnZWQgZmlsZXMgYXJlIG5vdCBhY2NlcHRlZCwgdGhpcyByZW1vdmVzIHRoZW0gZnJvbSB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IGFuZCBjcmVhdGVzIGFuZCBlcnJvciBzdGF0ZVxuICAgIGlmICghYWxsRmlsZXNBbGxvd2VkKSB7XG4gICAgICByZW1vdmVPbGRQcmV2aWV3cyhkcm9wVGFyZ2V0LCBpbnN0cnVjdGlvbnMpO1xuICAgICAgZmlsZUlucHV0RWwudmFsdWUgPSBcIlwiOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZShlcnJvck1lc3NhZ2UsIGZpbGVJbnB1dEVsKTtcbiAgICAgIGVycm9yTWVzc2FnZS50ZXh0Q29udGVudCA9XG4gICAgICAgIGZpbGVJbnB1dEVsLmRhdGFzZXQuZXJyb3JtZXNzYWdlIHx8IGBUaGlzIGlzIG5vdCBhIHZhbGlkIGZpbGUgdHlwZS5gO1xuICAgICAgZXJyb3JNZXNzYWdlLmNsYXNzTGlzdC5hZGQoQUNDRVBURURfRklMRV9NRVNTQUdFX0NMQVNTKTtcbiAgICAgIGRyb3BUYXJnZXQuY2xhc3NMaXN0LmFkZChJTlZBTElEX0ZJTEVfQ0xBU1MpO1xuICAgICAgVFlQRV9JU19WQUxJRCA9IGZhbHNlO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogMS4gcGFzc2VzIHRocm91Z2ggZ2F0ZSBmb3IgcHJldmVudGluZyBpbnZhbGlkIGZpbGVzXG4gKiAyLiBoYW5kbGVzIHVwZGF0ZXMgaWYgZmlsZSBpcyB2YWxpZFxuICpcbiAqIEBwYXJhbSB7ZXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gVGhlIGlucHV0IGVsZW1lbnQuXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBpbnN0cnVjdGlvbnMgLSBUaGUgY29udGFpbmVyIGZvciB2aXNpYmxlIGludGVyYWN0aW9uIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGRyb3BUYXJnZXQgLSBUaGUgZHJhZyBhbmQgZHJvcCB0YXJnZXQgYXJlYS5cbiAqL1xuY29uc3QgaGFuZGxlVXBsb2FkID0gKGV2ZW50LCBmaWxlSW5wdXRFbCwgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0KSA9PiB7XG4gIHByZXZlbnRJbnZhbGlkRmlsZXMoZXZlbnQsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpO1xuICBpZiAoVFlQRV9JU19WQUxJRCA9PT0gdHJ1ZSkge1xuICAgIGhhbmRsZUNoYW5nZShldmVudCwgZmlsZUlucHV0RWwsIGluc3RydWN0aW9ucywgZHJvcFRhcmdldCk7XG4gIH1cbn07XG5cbmNvbnN0IGZpbGVJbnB1dCA9IGJlaGF2aW9yKFxuICB7fSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKERST1BaT05FLCByb290KS5mb3JFYWNoKChmaWxlSW5wdXRFbCkgPT4ge1xuICAgICAgICBjb25zdCB7IGluc3RydWN0aW9ucywgZHJvcFRhcmdldCB9ID0gZW5oYW5jZUZpbGVJbnB1dChmaWxlSW5wdXRFbCk7XG5cbiAgICAgICAgZHJvcFRhcmdldC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiZHJhZ292ZXJcIixcbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVEcmFnT3ZlcigpIHtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChEUkFHX0NMQVNTKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG5cbiAgICAgICAgZHJvcFRhcmdldC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiZHJhZ2xlYXZlXCIsXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlRHJhZ0xlYXZlKCkge1xuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKERSQUdfQ0xBU1MpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcblxuICAgICAgICBkcm9wVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgXCJkcm9wXCIsXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlRHJvcCgpIHtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShEUkFHX0NMQVNTKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG5cbiAgICAgICAgZmlsZUlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBcImNoYW5nZVwiLFxuICAgICAgICAgIChlKSA9PiBoYW5kbGVVcGxvYWQoZSwgZmlsZUlucHV0RWwsIGluc3RydWN0aW9ucywgZHJvcFRhcmdldCksXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdGVhcmRvd24ocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKElOUFVULCByb290KS5mb3JFYWNoKChmaWxlSW5wdXRFbCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlSW5wdXRUb3BFbGVtZW50ID0gZmlsZUlucHV0RWwucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICBmaWxlSW5wdXRUb3BFbGVtZW50LnBhcmVudEVsZW1lbnQucmVwbGFjZUNoaWxkKFxuICAgICAgICAgIGZpbGVJbnB1dEVsLFxuICAgICAgICAgIGZpbGVJbnB1dFRvcEVsZW1lbnRcbiAgICAgICAgKTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgIGZpbGVJbnB1dEVsLmNsYXNzTmFtZSA9IERST1BaT05FX0NMQVNTO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRGaWxlSW5wdXRDb250ZXh0LFxuICAgIGRpc2FibGUsXG4gICAgYXJpYURpc2FibGUsXG4gICAgZW5hYmxlLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZpbGVJbnB1dDtcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IFNDT1BFID0gYC4ke1BSRUZJWH0tZm9vdGVyLS1iaWdgO1xuY29uc3QgTkFWID0gYCR7U0NPUEV9IG5hdmA7XG5jb25zdCBCVVRUT04gPSBgJHtOQVZ9IC4ke1BSRUZJWH0tZm9vdGVyX19wcmltYXJ5LWxpbmtgO1xuY29uc3QgSElERV9NQVhfV0lEVEggPSA0ODA7XG5cbi8qKlxuICogRXhwYW5kcyBzZWxlY3RlZCBmb290ZXIgbWVudSBwYW5lbCwgd2hpbGUgY29sbGFwc2luZyBvdGhlcnNcbiAqL1xuZnVuY3Rpb24gc2hvd1BhbmVsKCkge1xuICBpZiAod2luZG93LmlubmVyV2lkdGggPCBISURFX01BWF9XSURUSCkge1xuICAgIGNvbnN0IGlzT3BlbiA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKSA9PT0gXCJ0cnVlXCI7XG4gICAgY29uc3QgdGhpc0Zvb3RlciA9IHRoaXMuY2xvc2VzdChTQ09QRSk7XG5cbiAgICAvLyBDbG9zZSBhbGwgb3RoZXIgbWVudXNcbiAgICB0aGlzRm9vdGVyLnF1ZXJ5U2VsZWN0b3JBbGwoQlVUVE9OKS5mb3JFYWNoKChidXR0b24pID0+IHtcbiAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCAhaXNPcGVuKTtcbiAgfVxufVxuXG4vKipcbiAqIFN3YXBzIHRoZSA8aDQ+IGVsZW1lbnQgZm9yIGEgPGJ1dHRvbj4gZWxlbWVudCAoYW5kIHZpY2UtdmVyc2EpIGFuZCBzZXRzIGlkXG4gKiBvZiBtZW51IGxpc3RcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzTW9iaWxlIC0gSWYgdGhlIGZvb3RlciBpcyBpbiBtb2JpbGUgY29uZmlndXJhdGlvblxuICovXG5mdW5jdGlvbiB0b2dnbGVIdG1sVGFnKGlzTW9iaWxlKSB7XG4gIGNvbnN0IGJpZ0Zvb3RlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoU0NPUEUpO1xuXG4gIGlmICghYmlnRm9vdGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcHJpbWFyeUxpbmtzID0gYmlnRm9vdGVyLnF1ZXJ5U2VsZWN0b3JBbGwoQlVUVE9OKTtcblxuICBwcmltYXJ5TGlua3MuZm9yRWFjaCgoY3VycmVudEVsZW1lbnQpID0+IHtcbiAgICBjb25zdCBjdXJyZW50RWxlbWVudENsYXNzZXMgPSBjdXJyZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcbiAgICBjb25zdCBwcmVzZXJ2ZWRIdG1sVGFnID1cbiAgICAgIGN1cnJlbnRFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtdGFnXCIpIHx8IGN1cnJlbnRFbGVtZW50LnRhZ05hbWU7XG5cbiAgICBjb25zdCBuZXdFbGVtZW50VHlwZSA9IGlzTW9iaWxlID8gXCJidXR0b25cIiA6IHByZXNlcnZlZEh0bWxUYWc7XG5cbiAgICAvLyBDcmVhdGUgdGhlIG5ldyBlbGVtZW50XG4gICAgY29uc3QgbmV3RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmV3RWxlbWVudFR5cGUpO1xuICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY3VycmVudEVsZW1lbnRDbGFzc2VzKTtcbiAgICBuZXdFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXG4gICAgICBgJHtQUkVGSVh9LWZvb3Rlcl9fcHJpbWFyeS1saW5rLS1idXR0b25gLFxuICAgICAgaXNNb2JpbGVcbiAgICApO1xuICAgIG5ld0VsZW1lbnQudGV4dENvbnRlbnQgPSBjdXJyZW50RWxlbWVudC50ZXh0Q29udGVudDtcblxuICAgIGlmIChpc01vYmlsZSkge1xuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRhZ1wiLCBjdXJyZW50RWxlbWVudC50YWdOYW1lKTtcbiAgICAgIGNvbnN0IG1lbnVJZCA9IGAke1BSRUZJWH0tZm9vdGVyLW1lbnUtbGlzdC0ke01hdGguZmxvb3IoXG4gICAgICAgIE1hdGgucmFuZG9tKCkgKiAxMDAwMDBcbiAgICAgICl9YDtcblxuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIsIG1lbnVJZCk7XG4gICAgICBuZXdFbGVtZW50LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcbiAgICAgIGN1cnJlbnRFbGVtZW50Lm5leHRFbGVtZW50U2libGluZy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBtZW51SWQpO1xuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICAgIH1cblxuICAgIC8vIEluc2VydCB0aGUgbmV3IGVsZW1lbnQgYW5kIGRlbGV0ZSB0aGUgb2xkXG4gICAgY3VycmVudEVsZW1lbnQuYWZ0ZXIobmV3RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQucmVtb3ZlKCk7XG4gIH0pO1xufVxuXG5jb25zdCByZXNpemUgPSAoZXZlbnQpID0+IHtcbiAgdG9nZ2xlSHRtbFRhZyhldmVudC5tYXRjaGVzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbQlVUVE9OXTogc2hvd1BhbmVsLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICAvLyBleHBvcnQgZm9yIHVzZSBlbHNld2hlcmVcbiAgICBISURFX01BWF9XSURUSCxcblxuICAgIGluaXQoKSB7XG4gICAgICB0b2dnbGVIdG1sVGFnKHdpbmRvdy5pbm5lcldpZHRoIDwgSElERV9NQVhfV0lEVEgpO1xuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdCA9IHdpbmRvdy5tYXRjaE1lZGlhKFxuICAgICAgICBgKG1heC13aWR0aDogJHtISURFX01BWF9XSURUSCAtIDAuMX1weClgXG4gICAgICApO1xuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdC5hZGRMaXN0ZW5lcihyZXNpemUpO1xuICAgIH0sXG5cbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIHRoaXMubWVkaWFRdWVyeUxpc3QucmVtb3ZlTGlzdGVuZXIocmVzaXplKTtcbiAgICB9LFxuICB9XG4pO1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcbmNvbnN0IGFjY29yZGlvbiA9IHJlcXVpcmUoXCIuLi8uLi91c2EtYWNjb3JkaW9uL3NyYy9pbmRleFwiKTtcbmNvbnN0IFNjcm9sbEJhcldpZHRoID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEJPRFkgPSBcImJvZHlcIjtcbmNvbnN0IEhFQURFUiA9IGAuJHtQUkVGSVh9LWhlYWRlcmA7XG5jb25zdCBOQVYgPSBgLiR7UFJFRklYfS1uYXZgO1xuY29uc3QgTkFWX0NPTlRBSU5FUiA9IGAuJHtQUkVGSVh9LW5hdi1jb250YWluZXJgO1xuY29uc3QgTkFWX1BSSU1BUlkgPSBgLiR7UFJFRklYfS1uYXZfX3ByaW1hcnlgO1xuY29uc3QgTkFWX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LW5hdl9fcHJpbWFyeS1pdGVtYDtcbmNvbnN0IE5BVl9DT05UUk9MID0gYGJ1dHRvbi4ke1BSRUZJWH0tbmF2X19saW5rYDtcbmNvbnN0IE5BVl9MSU5LUyA9IGAke05BVn0gYWA7XG5jb25zdCBOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUgPSBgZGF0YS1uYXYtaGlkZGVuYDtcbmNvbnN0IE9QRU5FUlMgPSBgLiR7UFJFRklYfS1tZW51LWJ0bmA7XG5jb25zdCBDTE9TRV9CVVRUT04gPSBgLiR7UFJFRklYfS1uYXZfX2Nsb3NlYDtcbmNvbnN0IE9WRVJMQVkgPSBgLiR7UFJFRklYfS1vdmVybGF5YDtcbmNvbnN0IENMT1NFUlMgPSBgJHtDTE9TRV9CVVRUT059LCAuJHtQUkVGSVh9LW92ZXJsYXlgO1xuY29uc3QgVE9HR0xFUyA9IFtOQVYsIE9WRVJMQVldLmpvaW4oXCIsIFwiKTtcbmNvbnN0IE5PTl9OQVZfRUxFTUVOVFMgPSBgYm9keSAqOm5vdCgke0hFQURFUn0sICR7TkFWX0NPTlRBSU5FUn0sICR7TkFWfSwgJHtOQVZ9ICopOm5vdChbYXJpYS1oaWRkZW5dKWA7XG5jb25zdCBOT05fTkFWX0hJRERFTiA9IGBbJHtOT05fTkFWX0hJRERFTl9BVFRSSUJVVEV9XWA7XG5cbmNvbnN0IEFDVElWRV9DTEFTUyA9IFwidXNhLWpzLW1vYmlsZS1uYXYtLWFjdGl2ZVwiO1xuY29uc3QgVklTSUJMRV9DTEFTUyA9IFwiaXMtdmlzaWJsZVwiO1xuXG5sZXQgbmF2aWdhdGlvbjtcbmxldCBuYXZBY3RpdmU7XG5sZXQgbm9uTmF2RWxlbWVudHM7XG5cbmNvbnN0IGlzQWN0aXZlID0gKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoQUNUSVZFX0NMQVNTKTtcbi8vIERldGVjdCBTYWZhcmlcbi8vIE5vdGU6IENocm9tZSBhbHNvIHJlcG9ydHMgdGhlIFNhZmFyaSB1c2VyQWdlbnQgc28gdGhpcyBzcGVjaWZpY2FsbHkgZXhjbHVkZXMgQ2hyb21lLlxuY29uc3QgaXNTYWZhcmkgPVxuICBuYXZpZ2F0b3IudXNlckFnZW50LmluY2x1ZGVzKFwiU2FmYXJpXCIpICYmXG4gICFuYXZpZ2F0b3IudXNlckFnZW50LmluY2x1ZGVzKFwiQ2hyb21lXCIpO1xuY29uc3QgU0NST0xMQkFSX1dJRFRIID0gU2Nyb2xsQmFyV2lkdGgoKTtcbmNvbnN0IElOSVRJQUxfUEFERElORyA9IHdpbmRvd1xuICAuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KVxuICAuZ2V0UHJvcGVydHlWYWx1ZShcInBhZGRpbmctcmlnaHRcIik7XG5jb25zdCBURU1QT1JBUllfUEFERElORyA9IGAke1xuICBwYXJzZUludChJTklUSUFMX1BBRERJTkcucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApICtcbiAgcGFyc2VJbnQoU0NST0xMQkFSX1dJRFRILnJlcGxhY2UoL3B4LywgXCJcIiksIDEwKVxufXB4YDtcblxuY29uc3QgaGlkZU5vbk5hdkl0ZW1zID0gKCkgPT4ge1xuICBjb25zdCBoZWFkZXJQYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAke0hFQURFUn1gKS5wYXJlbnROb2RlO1xuICBub25OYXZFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX05BVl9FTEVNRU5UUyk7XG5cbiAgbm9uTmF2RWxlbWVudHMuZm9yRWFjaCgobm9uTmF2RWxlbWVudCkgPT4ge1xuICAgIGlmIChub25OYXZFbGVtZW50ICE9PSBoZWFkZXJQYXJlbnQpIHtcbiAgICAgIG5vbk5hdkVsZW1lbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSk7XG4gICAgICBub25OYXZFbGVtZW50LnNldEF0dHJpYnV0ZShOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUsIFwiXCIpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5jb25zdCBzaG93Tm9uTmF2SXRlbXMgPSAoKSA9PiB7XG4gIG5vbk5hdkVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChOT05fTkFWX0hJRERFTik7XG5cbiAgaWYgKCFub25OYXZFbGVtZW50cykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFJlbW92ZSBhcmlhLWhpZGRlbiBmcm9tIG5vbi1oZWFkZXIgZWxlbWVudHNcbiAgbm9uTmF2RWxlbWVudHMuZm9yRWFjaCgobm9uTmF2RWxlbWVudCkgPT4ge1xuICAgIG5vbk5hdkVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIik7XG4gICAgbm9uTmF2RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoTk9OX05BVl9ISURERU5fQVRUUklCVVRFKTtcbiAgfSk7XG59O1xuXG4vLyBUb2dnbGUgYWxsIG5vbi1oZWFkZXIgZWxlbWVudHMgIzM1MjcuXG5jb25zdCB0b2dnbGVOb25OYXZJdGVtcyA9IChhY3RpdmUpID0+IHtcbiAgaWYgKGFjdGl2ZSkge1xuICAgIGhpZGVOb25OYXZJdGVtcygpO1xuICB9IGVsc2Uge1xuICAgIHNob3dOb25OYXZJdGVtcygpO1xuICB9XG59O1xuXG4vKipcbiAqIERldGVjdCBTYWZhcmkgYW5kIGFkZCBib2R5IGNsYXNzIGZvciBhIFNhZmFyaS1vbmx5IENTUyBidWcgZml4LlxuICogTW9yZSBkZXRhaWxzIGluIGh0dHBzOi8vZ2l0aHViLmNvbS91c3dkcy91c3dkcy9wdWxsLzU0NDNcbiAqL1xuY29uc3QgYWRkU2FmYXJpQ2xhc3MgPSAoKSA9PiB7XG4gIGlmIChpc1NhZmFyaSkge1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChcImlzLXNhZmFyaVwiKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZXQgdGhlIHZhbHVlIGZvciB0aGUgLS1zY3JvbGx0b3AgQ1NTIHZhciB3aGVuIHRoZSBtb2JpbGUgbWVudSBpcyBvcGVuLlxuICogVGhpcyBhbGxvd3MgdGhlIENTUyB0byBsb2NrIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBpbiBTYWZhcmlcbiAqIHdoZW4gb3ZlcmZsb3cteSBpcyBzZXQgdG8gc2Nyb2xsLlxuICogTW9yZSBkZXRhaWxzIGluIGh0dHBzOi8vZ2l0aHViLmNvbS91c3dkcy91c3dkcy9wdWxsLzU0NDNcbiAqL1xuY29uc3Qgc2V0U2FmYXJpU2Nyb2xsUG9zaXRpb24gPSAoYm9keSkgPT4ge1xuICBjb25zdCBjdXJyZW50U2Nyb2xsUG9zaXRpb24gPSBgLSR7d2luZG93LnNjcm9sbFl9cHhgO1xuICBpZiAoaXNTYWZhcmkpIHtcbiAgICBib2R5LnN0eWxlLnNldFByb3BlcnR5KFwiLS1zY3JvbGx0b3BcIiwgY3VycmVudFNjcm9sbFBvc2l0aW9uKTtcbiAgfVxufTtcblxuY29uc3QgdG9nZ2xlTmF2ID0gKGFjdGl2ZSkgPT4ge1xuICBjb25zdCB7IGJvZHkgfSA9IGRvY3VtZW50O1xuICBjb25zdCBzYWZlQWN0aXZlID0gdHlwZW9mIGFjdGl2ZSA9PT0gXCJib29sZWFuXCIgPyBhY3RpdmUgOiAhaXNBY3RpdmUoKTtcblxuICBzZXRTYWZhcmlTY3JvbGxQb3NpdGlvbihib2R5KTtcblxuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoQUNUSVZFX0NMQVNTLCBzYWZlQWN0aXZlKTtcblxuICBzZWxlY3QoVE9HR0xFUykuZm9yRWFjaCgoZWwpID0+XG4gICAgZWwuY2xhc3NMaXN0LnRvZ2dsZShWSVNJQkxFX0NMQVNTLCBzYWZlQWN0aXZlKVxuICApO1xuXG4gIG5hdmlnYXRpb24uZm9jdXNUcmFwLnVwZGF0ZShzYWZlQWN0aXZlKTtcblxuICBjb25zdCBjbG9zZUJ1dHRvbiA9IGJvZHkucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xuICBjb25zdCBtZW51QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihPUEVORVJTKTtcblxuICBib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9XG4gICAgYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPT09IFRFTVBPUkFSWV9QQURESU5HXG4gICAgICA/IElOSVRJQUxfUEFERElOR1xuICAgICAgOiBURU1QT1JBUllfUEFERElORztcblxuICB0b2dnbGVOb25OYXZJdGVtcyhzYWZlQWN0aXZlKTtcblxuICBpZiAoc2FmZUFjdGl2ZSAmJiBjbG9zZUJ1dHRvbikge1xuICAgIC8vIFRoZSBtb2JpbGUgbmF2IHdhcyBqdXN0IGFjdGl2YXRlZC4gRm9jdXMgb24gdGhlIGNsb3NlIGJ1dHRvbiwgd2hpY2ggaXNcbiAgICAvLyBqdXN0IGJlZm9yZSBhbGwgdGhlIG5hdiBlbGVtZW50cyBpbiB0aGUgdGFiIG9yZGVyLlxuICAgIGNsb3NlQnV0dG9uLmZvY3VzKCk7XG4gIH0gZWxzZSBpZiAoXG4gICAgIXNhZmVBY3RpdmUgJiZcbiAgICBtZW51QnV0dG9uICYmXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZShtZW51QnV0dG9uKS5kaXNwbGF5ICE9PSBcIm5vbmVcIlxuICApIHtcbiAgICAvLyBUaGUgbW9iaWxlIG5hdiB3YXMganVzdCBkZWFjdGl2YXRlZC4gV2UgZG9uJ3Qgd2FudCB0aGUgZm9jdXMgdG9cbiAgICAvLyBkaXNhcHBlYXIgaW50byB0aGUgdm9pZCwgc28gZm9jdXMgb24gdGhlIG1lbnUgYnV0dG9uIGlmIGl0J3NcbiAgICAvLyB2aXNpYmxlICh0aGlzIG1heSBoYXZlIGJlZW4gd2hhdCB0aGUgdXNlciB3YXMganVzdCBmb2N1c2VkIG9uLFxuICAgIC8vIGlmIHRoZXkgdHJpZ2dlcmVkIHRoZSBtb2JpbGUgbmF2IGJ5IG1pc3Rha2UpLlxuICAgIG1lbnVCdXR0b24uZm9jdXMoKTtcbiAgfVxuXG4gIHJldHVybiBzYWZlQWN0aXZlO1xufTtcblxuY29uc3QgcmVzaXplID0gKCkgPT4ge1xuICBjb25zdCBjbG9zZXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoQ0xPU0VfQlVUVE9OKTtcblxuICBpZiAoaXNBY3RpdmUoKSAmJiBjbG9zZXIgJiYgY2xvc2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoID09PSAwKSB7XG4gICAgLy8gV2hlbiB0aGUgbW9iaWxlIG5hdiBpcyBhY3RpdmUsIGFuZCB0aGUgY2xvc2UgYm94IGlzbid0IHZpc2libGUsXG4gICAgLy8gd2Uga25vdyB0aGUgdXNlcidzIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQgdG8gYmUgbGFyZ2VyLlxuICAgIC8vIExldCdzIG1ha2UgdGhlIHBhZ2Ugc3RhdGUgY29uc2lzdGVudCBieSBkZWFjdGl2YXRpbmcgdGhlIG1vYmlsZSBuYXYuXG4gICAgbmF2aWdhdGlvbi50b2dnbGVOYXYuY2FsbChjbG9zZXIsIGZhbHNlKTtcbiAgfVxufTtcblxuY29uc3Qgb25NZW51Q2xvc2UgPSAoKSA9PiBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcblxuY29uc3QgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duID0gKCkgPT4ge1xuICBpZiAoIW5hdkFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRvZ2dsZShuYXZBY3RpdmUsIGZhbHNlKTtcbiAgbmF2QWN0aXZlID0gbnVsbDtcbn07XG5cbmNvbnN0IGZvY3VzTmF2QnV0dG9uID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHBhcmVudE5hdkl0ZW0gPSBldmVudC50YXJnZXQuY2xvc2VzdChOQVZfUFJJTUFSWV9JVEVNKTtcblxuICAvLyBPbmx5IHNoaWZ0IGZvY3VzIGlmIHdpdGhpbiBkcm9wZG93blxuICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKE5BVl9DT05UUk9MKSkge1xuICAgIGNvbnN0IG5hdkNvbnRyb2wgPSBwYXJlbnROYXZJdGVtLnF1ZXJ5U2VsZWN0b3IoTkFWX0NPTlRST0wpO1xuICAgIGlmIChuYXZDb250cm9sKSB7XG4gICAgICBuYXZDb250cm9sLmZvY3VzKCk7XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcbiAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gIGZvY3VzTmF2QnV0dG9uKGV2ZW50KTtcbn07XG5cbm5hdmlnYXRpb24gPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtOQVZfQ09OVFJPTF0oKSB7XG4gICAgICAgIC8vIElmIGFub3RoZXIgbmF2IGlzIG9wZW4sIGNsb3NlIGl0XG4gICAgICAgIGlmIChuYXZBY3RpdmUgIT09IHRoaXMpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdCBjbGlja2VkIG5hdiBsaW5rIGVsZW1lbnQsIHNvIHdlXG4gICAgICAgIC8vIGNhbiBoaWRlIHRoZSBkcm9wZG93biBpZiBhbm90aGVyIGVsZW1lbnQgb24gdGhlIHBhZ2UgaXMgY2xpY2tlZFxuICAgICAgICBpZiAoIW5hdkFjdGl2ZSkge1xuICAgICAgICAgIG5hdkFjdGl2ZSA9IHRoaXM7XG4gICAgICAgICAgdG9nZ2xlKG5hdkFjdGl2ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyB0aGlzIHNvIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSBib2R5IGRvZXNuJ3QgZmlyZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgW0JPRFldOiBoaWRlQWN0aXZlTmF2RHJvcGRvd24sXG4gICAgICBbT1BFTkVSU106IHRvZ2dsZU5hdixcbiAgICAgIFtDTE9TRVJTXTogdG9nZ2xlTmF2LFxuICAgICAgW05BVl9MSU5LU10oKSB7XG4gICAgICAgIC8vIEEgbmF2aWdhdGlvbiBsaW5rIGhhcyBiZWVuIGNsaWNrZWQhIFdlIHdhbnQgdG8gY29sbGFwc2UgYW55XG4gICAgICAgIC8vIGhpZXJhcmNoaWNhbCBuYXZpZ2F0aW9uIFVJIGl0J3MgYSBwYXJ0IG9mLCBzbyB0aGF0IHRoZSB1c2VyXG4gICAgICAgIC8vIGNhbiBmb2N1cyBvbiB3aGF0ZXZlciB0aGV5J3ZlIGp1c3Qgc2VsZWN0ZWQuXG5cbiAgICAgICAgLy8gU29tZSBuYXZpZ2F0aW9uIGxpbmtzIGFyZSBpbnNpZGUgYWNjb3JkaW9uczsgd2hlbiB0aGV5J3JlXG4gICAgICAgIC8vIGNsaWNrZWQsIHdlIHdhbnQgdG8gY29sbGFwc2UgdGhvc2UgYWNjb3JkaW9ucy5cbiAgICAgICAgY29uc3QgYWNjID0gdGhpcy5jbG9zZXN0KGFjY29yZGlvbi5BQ0NPUkRJT04pO1xuXG4gICAgICAgIGlmIChhY2MpIHtcbiAgICAgICAgICBhY2NvcmRpb24uZ2V0QnV0dG9ucyhhY2MpLmZvckVhY2goKGJ0bikgPT4gYWNjb3JkaW9uLmhpZGUoYnRuKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgbW9iaWxlIG5hdmlnYXRpb24gbWVudSBpcyBhY3RpdmUsIHdlIHdhbnQgdG8gaGlkZSBpdC5cbiAgICAgICAgaWYgKGlzQWN0aXZlKCkpIHtcbiAgICAgICAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIGtleWRvd246IHtcbiAgICAgIFtOQVZfUFJJTUFSWV06IGtleW1hcCh7IEVzY2FwZTogaGFuZGxlRXNjYXBlIH0pLFxuICAgIH0sXG4gICAgZm9jdXNvdXQ6IHtcbiAgICAgIFtOQVZfUFJJTUFSWV0oZXZlbnQpIHtcbiAgICAgICAgY29uc3QgbmF2ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTkFWX1BSSU1BUlkpO1xuXG4gICAgICAgIGlmICghbmF2LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgY29uc3QgdHJhcENvbnRhaW5lciA9IHJvb3QubWF0Y2hlcyhOQVYpID8gcm9vdCA6IHJvb3QucXVlcnlTZWxlY3RvcihOQVYpO1xuXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xuICAgICAgICBuYXZpZ2F0aW9uLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0cmFwQ29udGFpbmVyLCB7XG4gICAgICAgICAgRXNjYXBlOiBvbk1lbnVDbG9zZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGFkZFNhZmFyaUNsYXNzKCk7XG4gICAgICByZXNpemUoKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlc2l6ZSwgZmFsc2UpO1xuICAgIH0sXG4gICAgdGVhcmRvd24oKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCByZXNpemUsIGZhbHNlKTtcbiAgICAgIG5hdkFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgZm9jdXNUcmFwOiBudWxsLFxuICAgIHRvZ2dsZU5hdixcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXZpZ2F0aW9uO1xuIiwiY29uc3Qgb25jZSA9IHJlcXVpcmUoXCJyZWNlcHRvci9vbmNlXCIpO1xuY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xuXG5jb25zdCBDVVJSRU5UX0NMQVNTID0gYCR7UFJFRklYfS1jdXJyZW50YDtcbmNvbnN0IElOX1BBR0VfTkFWX1RJVExFX1RFWFQgPSBcIk9uIHRoaXMgcGFnZVwiO1xuY29uc3QgSU5fUEFHRV9OQVZfVElUTEVfSEVBRElOR19MRVZFTCA9IFwiaDRcIjtcbmNvbnN0IElOX1BBR0VfTkFWX1NDUk9MTF9PRkZTRVQgPSAwO1xuY29uc3QgSU5fUEFHRV9OQVZfUk9PVF9NQVJHSU4gPSBcIjBweCAwcHggMHB4IDBweFwiO1xuY29uc3QgSU5fUEFHRV9OQVZfVEhSRVNIT0xEID0gXCIxXCI7XG5jb25zdCBJTl9QQUdFX05BVl9DTEFTUyA9IGAke1BSRUZJWH0taW4tcGFnZS1uYXZgO1xuY29uc3QgSU5fUEFHRV9OQVZfQU5DSE9SX0NMQVNTID0gYCR7UFJFRklYfS1hbmNob3JgO1xuY29uc3QgSU5fUEFHRV9OQVZfTkFWX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19uYXZgO1xuY29uc3QgSU5fUEFHRV9OQVZfTElTVF9DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0NMQVNTfV9fbGlzdGA7XG5jb25zdCBJTl9QQUdFX05BVl9JVEVNX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19pdGVtYDtcbmNvbnN0IElOX1BBR0VfTkFWX0xJTktfQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX2xpbmtgO1xuY29uc3QgSU5fUEFHRV9OQVZfVElUTEVfQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX2hlYWRpbmdgO1xuY29uc3QgU1VCX0lURU1fQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9JVEVNX0NMQVNTfS0tc3ViLWl0ZW1gO1xuY29uc3QgTUFJTl9FTEVNRU5UID0gXCJtYWluXCI7XG5cbi8qKlxuICogU2V0IHRoZSBhY3RpdmUgbGluayBzdGF0ZSBmb3IgdGhlIGN1cnJlbnRseSBvYnNlcnZlZCBzZWN0aW9uXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGluLXBhZ2UgbmF2IGNvbXBvbmVudFxuICovXG5jb25zdCBzZXRBY3RpdmUgPSAoZWwpID0+IHtcbiAgY29uc3QgYWxsTGlua3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtJTl9QQUdFX05BVl9MSU5LX0NMQVNTfWApO1xuICBlbC5tYXAoKGkpID0+IHtcbiAgICBpZiAoaS5pc0ludGVyc2VjdGluZyA9PT0gdHJ1ZSAmJiBpLmludGVyc2VjdGlvblJhdGlvID49IDEpIHtcbiAgICAgIGFsbExpbmtzLmZvckVhY2goKGxpbmspID0+IGxpbmsuY2xhc3NMaXN0LnJlbW92ZShDVVJSRU5UX0NMQVNTKSk7XG4gICAgICBkb2N1bWVudFxuICAgICAgICAucXVlcnlTZWxlY3RvcihgYVtocmVmPVwiIyR7aS50YXJnZXQuaWR9XCJdYClcbiAgICAgICAgLmNsYXNzTGlzdC5hZGQoQ1VSUkVOVF9DTEFTUyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IG9mIGFsbCB2aXNpYmxlIGgyIGFuZCBoMyBoZWFkaW5ncyBmcm9tIHRoZSBkZXNpZ25hdGVkIG1haW4gY29udGVudCByZWdpb24uXG4gKiBUaGVzZSB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb21wb25lbnQgbGluayBsaXN0LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG1haW5Db250ZW50U2VsZWN0b3IgVGhlIGRlc2lnbmF0ZWQgbWFpbiBjb250ZW50IHJlZ2lvblxuICpcbiAqIEByZXR1cm4ge0FycmF5fSAtIEFuIGFycmF5IG9mIHZpc2libGUgaGVhZGluZ3MgZnJvbSB0aGUgZGVzaWduYXRlZCBjb250ZW50IHJlZ2lvblxuICovXG5jb25zdCBnZXRTZWN0aW9uSGVhZGluZ3MgPSAobWFpbkNvbnRlbnRTZWxlY3RvcikgPT4ge1xuICBjb25zdCBzZWN0aW9uSGVhZGluZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgIGAke21haW5Db250ZW50U2VsZWN0b3J9IGgyLCAke21haW5Db250ZW50U2VsZWN0b3J9IGgzYFxuICApO1xuXG4gIC8vIENvbnZlcnQgbm9kZUxpc3QgdG8gYW4gYXJyYXkgdG8gYWxsb3cgZm9yIGZpbHRlcmluZ1xuICBjb25zdCBoZWFkaW5nQXJyYXkgPSBBcnJheS5mcm9tKHNlY3Rpb25IZWFkaW5ncyk7XG5cbiAgLy8gRmluZCBhbGwgaGVhZGluZ3Mgd2l0aCBoaWRkZW4gc3R5bGluZyBhbmQgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgYXJyYXlcbiAgY29uc3QgdmlzaWJsZUhlYWRpbmdBcnJheSA9IGhlYWRpbmdBcnJheS5maWx0ZXIoKGhlYWRpbmcpID0+IHtcbiAgICBjb25zdCBoZWFkaW5nU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShoZWFkaW5nKTtcbiAgICBjb25zdCB2aXNpYmxlSGVhZGluZyA9XG4gICAgICBoZWFkaW5nU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShcImRpc3BsYXlcIikgIT09IFwibm9uZVwiICYmXG4gICAgICBoZWFkaW5nU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShcInZpc2liaWxpdHlcIikgIT09IFwiaGlkZGVuXCI7XG5cbiAgICByZXR1cm4gdmlzaWJsZUhlYWRpbmc7XG4gIH0pO1xuXG4gIHJldHVybiB2aXNpYmxlSGVhZGluZ0FycmF5O1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBub2RlIGxpc3Qgb2Ygc2VjdGlvbiBhbmNob3IgdGFnc1xuICpcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzXG4gKi9cbmNvbnN0IGdldFNlY3Rpb25BbmNob3JzID0gKCkgPT4ge1xuICBjb25zdCBzZWN0aW9uQW5jaG9ycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgYC4ke0lOX1BBR0VfTkFWX0FOQ0hPUl9DTEFTU31gXG4gICk7XG4gIHJldHVybiBzZWN0aW9uQW5jaG9ycztcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgdW5pcXVlIElEIGZvciB0aGUgZ2l2ZW4gaGVhZGluZyBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEhlYWRpbmdFbGVtZW50fSBoZWFkaW5nXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSAtIFVuaXF1ZSBJRFxuICovXG5jb25zdCBnZXRIZWFkaW5nSWQgPSAoaGVhZGluZykgPT4ge1xuICBjb25zdCBiYXNlSWQgPSBoZWFkaW5nLnRleHRDb250ZW50XG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAvLyBSZXBsYWNlIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVycyB3aXRoIGRhc2hlc1xuICAgIC5yZXBsYWNlKC9bXmEtelxcZF0vZywgXCItXCIpXG4gICAgLy8gUmVwbGFjZSBhIHNlcXVlbmNlIG9mIHR3byBvciBtb3JlIGRhc2hlcyB3aXRoIGEgc2luZ2xlIGRhc2hcbiAgICAucmVwbGFjZSgvLXsyLH0vZywgXCItXCIpXG4gICAgLy8gVHJpbSBsZWFkaW5nIG9yIHRyYWlsaW5nIGRhc2ggKHRoZXJlIHNob3VsZCBvbmx5IGV2ZXIgYmUgb25lKVxuICAgIC5yZXBsYWNlKC9eLXwtJC9nLCBcIlwiKTtcblxuICBsZXQgaWQ7XG4gIGxldCBzdWZmaXggPSAwO1xuICBkbyB7XG4gICAgaWQgPSBiYXNlSWQ7XG5cbiAgICAvLyBUbyBhdm9pZCBjb25mbGljdHMgd2l0aCBleGlzdGluZyBJRHMgb24gdGhlIHBhZ2UsIGxvb3AgYW5kIGFwcGVuZCBhblxuICAgIC8vIGluY3JlbWVudGVkIHN1ZmZpeCB1bnRpbCBhIHVuaXF1ZSBJRCBpcyBmb3VuZC5cbiAgICBzdWZmaXggKz0gMTtcbiAgICBpZiAoc3VmZml4ID4gMSkge1xuICAgICAgaWQgKz0gYC0ke3N1ZmZpeH1gO1xuICAgIH1cbiAgfSB3aGlsZSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIHNlY3Rpb24gaWQvYW5jaG9yIGhhc2ggd2l0aG91dCB0aGUgbnVtYmVyIHNpZ25cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IC0gSWQgdmFsdWUgd2l0aCB0aGUgbnVtYmVyIHNpZ24gcmVtb3ZlZFxuICovXG5jb25zdCBnZXRTZWN0aW9uSWQgPSAodmFsdWUpID0+IHtcbiAgbGV0IGlkO1xuXG4gIC8vIENoZWNrIGlmIHZhbHVlIGlzIGFuIGV2ZW50IG9yIGVsZW1lbnQgYW5kIGdldCB0aGUgY2xlYW5lZCB1cCBpZFxuICBpZiAodmFsdWUgJiYgdmFsdWUubm9kZVR5cGUgPT09IDEpIHtcbiAgICBpZCA9IHZhbHVlLmdldEF0dHJpYnV0ZShcImhyZWZcIikucmVwbGFjZShcIiNcIiwgXCJcIik7XG4gIH0gZWxzZSB7XG4gICAgaWQgPSB2YWx1ZS50YXJnZXQuaGFzaC5yZXBsYWNlKFwiI1wiLCBcIlwiKTtcbiAgfVxuXG4gIHJldHVybiBpZDtcbn07XG5cbi8qKlxuICogU2Nyb2xsIHNtb290aGx5IHRvIGEgc2VjdGlvbiBiYXNlZCBvbiB0aGUgcGFzc2VkIGluIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAtIElkIHZhbHVlIHdpdGggdGhlIG51bWJlciBzaWduIHJlbW92ZWRcbiAqL1xuY29uc3QgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uID0gKGVsKSA9PiB7XG4gIGNvbnN0IGluUGFnZU5hdkVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7SU5fUEFHRV9OQVZfQ0xBU1N9YCk7XG4gIGNvbnN0IGluUGFnZU5hdlNjcm9sbE9mZnNldCA9XG4gICAgaW5QYWdlTmF2RWwuZGF0YXNldC5zY3JvbGxPZmZzZXQgfHwgSU5fUEFHRV9OQVZfU0NST0xMX09GRlNFVDtcblxuICB3aW5kb3cuc2Nyb2xsKHtcbiAgICBiZWhhdmlvcjogXCJzbW9vdGhcIixcbiAgICB0b3A6IGVsLm9mZnNldFRvcCAtIGluUGFnZU5hdlNjcm9sbE9mZnNldCxcbiAgICBibG9jazogXCJzdGFydFwiLFxuICB9KTtcblxuICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSkgIT09IGVsLmlkKSB7XG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIFwiXCIsIGAjJHtlbC5pZH1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTY3JvbGxzIHRoZSBwYWdlIHRvIHRoZSBzZWN0aW9uIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGN1cnJlbnQgaGFzaCBmcmFnbWVudCwgaWYgb25lIGV4aXN0cy5cbiAqL1xuY29uc3Qgc2Nyb2xsVG9DdXJyZW50U2VjdGlvbiA9ICgpID0+IHtcbiAgY29uc3QgaGFzaEZyYWdtZW50ID0gd2luZG93LmxvY2F0aW9uLmhhc2guc2xpY2UoMSk7XG4gIGlmIChoYXNoRnJhZ21lbnQpIHtcbiAgICBjb25zdCBhbmNob3JUYWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChoYXNoRnJhZ21lbnQpO1xuICAgIGlmIChhbmNob3JUYWcpIHtcbiAgICAgIGhhbmRsZVNjcm9sbFRvU2VjdGlvbihhbmNob3JUYWcpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIGluLXBhZ2UgbmF2aWdhdGlvbiBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpblBhZ2VOYXZFbCBUaGUgaW4tcGFnZSBuYXYgZWxlbWVudFxuICovXG5jb25zdCBjcmVhdGVJblBhZ2VOYXYgPSAoaW5QYWdlTmF2RWwpID0+IHtcbiAgY29uc3QgaW5QYWdlTmF2VGl0bGVUZXh0ID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnRpdGxlVGV4dCB8fCBJTl9QQUdFX05BVl9USVRMRV9URVhUXG4gIH1gO1xuICBjb25zdCBpblBhZ2VOYXZUaXRsZUhlYWRpbmdMZXZlbCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XG4gICAgaW5QYWdlTmF2RWwuZGF0YXNldC50aXRsZUhlYWRpbmdMZXZlbCB8fCBJTl9QQUdFX05BVl9USVRMRV9IRUFESU5HX0xFVkVMXG4gIH1gO1xuICBjb25zdCBpblBhZ2VOYXZSb290TWFyZ2luID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnJvb3RNYXJnaW4gfHwgSU5fUEFHRV9OQVZfUk9PVF9NQVJHSU5cbiAgfWA7XG4gIGNvbnN0IGluUGFnZU5hdlRocmVzaG9sZCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XG4gICAgaW5QYWdlTmF2RWwuZGF0YXNldC50aHJlc2hvbGQgfHwgSU5fUEFHRV9OQVZfVEhSRVNIT0xEXG4gIH1gO1xuICBjb25zdCBpblBhZ2VOYXZDb250ZW50U2VsZWN0b3IgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke1xuICAgIGluUGFnZU5hdkVsLmRhdGFzZXQubWFpbkNvbnRlbnRTZWxlY3RvciB8fCBNQUlOX0VMRU1FTlRcbiAgfWA7XG5cbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICByb290OiBudWxsLFxuICAgIHJvb3RNYXJnaW46IGluUGFnZU5hdlJvb3RNYXJnaW4sXG4gICAgdGhyZXNob2xkOiBbaW5QYWdlTmF2VGhyZXNob2xkXSxcbiAgfTtcblxuICBjb25zdCBzZWN0aW9uSGVhZGluZ3MgPSBnZXRTZWN0aW9uSGVhZGluZ3MoaW5QYWdlTmF2Q29udGVudFNlbGVjdG9yKTtcbiAgY29uc3QgaW5QYWdlTmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm5hdlwiKTtcbiAgaW5QYWdlTmF2LnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgaW5QYWdlTmF2VGl0bGVUZXh0KTtcbiAgaW5QYWdlTmF2LmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfTkFWX0NMQVNTKTtcblxuICBjb25zdCBpblBhZ2VOYXZUaXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaW5QYWdlTmF2VGl0bGVIZWFkaW5nTGV2ZWwpO1xuICBpblBhZ2VOYXZUaXRsZS5jbGFzc0xpc3QuYWRkKElOX1BBR0VfTkFWX1RJVExFX0NMQVNTKTtcbiAgaW5QYWdlTmF2VGl0bGUuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCIwXCIpO1xuICBpblBhZ2VOYXZUaXRsZS50ZXh0Q29udGVudCA9IGluUGFnZU5hdlRpdGxlVGV4dDtcbiAgaW5QYWdlTmF2LmFwcGVuZENoaWxkKGluUGFnZU5hdlRpdGxlKTtcblxuICBjb25zdCBpblBhZ2VOYXZMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuICBpblBhZ2VOYXZMaXN0LmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfTElTVF9DTEFTUyk7XG4gIGluUGFnZU5hdi5hcHBlbmRDaGlsZChpblBhZ2VOYXZMaXN0KTtcblxuICBzZWN0aW9uSGVhZGluZ3MuZm9yRWFjaCgoZWwpID0+IHtcbiAgICBjb25zdCBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICBjb25zdCBuYXZMaW5rcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGNvbnN0IGFuY2hvclRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGNvbnN0IHRleHRDb250ZW50T2ZMaW5rID0gZWwudGV4dENvbnRlbnQ7XG4gICAgY29uc3QgdGFnID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChJTl9QQUdFX05BVl9JVEVNX0NMQVNTKTtcbiAgICBpZiAodGFnID09PSBcImgzXCIpIHtcbiAgICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoU1VCX0lURU1fQ0xBU1MpO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmdJZCA9IGdldEhlYWRpbmdJZChlbCk7XG5cbiAgICBuYXZMaW5rcy5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIGAjJHtoZWFkaW5nSWR9YCk7XG4gICAgbmF2TGlua3Muc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgSU5fUEFHRV9OQVZfTElOS19DTEFTUyk7XG4gICAgbmF2TGlua3MudGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudE9mTGluaztcblxuICAgIGFuY2hvclRhZy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBoZWFkaW5nSWQpO1xuICAgIGFuY2hvclRhZy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBJTl9QQUdFX05BVl9BTkNIT1JfQ0xBU1MpO1xuICAgIGVsLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyYmVnaW5cIiwgYW5jaG9yVGFnKTtcblxuICAgIGluUGFnZU5hdkxpc3QuYXBwZW5kQ2hpbGQobGlzdEl0ZW0pO1xuICAgIGxpc3RJdGVtLmFwcGVuZENoaWxkKG5hdkxpbmtzKTtcbiAgfSk7XG5cbiAgaW5QYWdlTmF2RWwuYXBwZW5kQ2hpbGQoaW5QYWdlTmF2KTtcblxuICBjb25zdCBhbmNob3JUYWdzID0gZ2V0U2VjdGlvbkFuY2hvcnMoKTtcbiAgY29uc3Qgb2JzZXJ2ZVNlY3Rpb25zID0gbmV3IHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlcihzZXRBY3RpdmUsIG9wdGlvbnMpO1xuXG4gIGFuY2hvclRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgb2JzZXJ2ZVNlY3Rpb25zLm9ic2VydmUodGFnKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSBjbGljayBmcm9tIGxpbmtcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgaW4tcGFnZSBuYXYgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZUNsaWNrRnJvbUxpbmsgPSAoZWwpID0+IHtcbiAgY29uc3QgZWxlbWVudFRvU2Nyb2xsVG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbC5oYXNoLnNsaWNlKDEpKTtcbiAgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uKGVsZW1lbnRUb1Njcm9sbFRvKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSBlbnRlciBldmVudCBmcm9tIGEgbGluayB3aXRoaW4gdGhlIGluLXBhZ2UgbmF2IGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBpbi1wYWdlIG5hdiBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRW50ZXJGcm9tTGluayA9IChldmVudCkgPT4ge1xuICBjb25zdCBpZCA9IGdldFNlY3Rpb25JZChldmVudCk7XG4gIGNvbnN0IHRhcmdldEFuY2hvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0QW5jaG9yLnBhcmVudEVsZW1lbnQ7XG5cbiAgaWYgKHRhcmdldCkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAwKTtcbiAgICB0YXJnZXQuZm9jdXMoKTtcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgIFwiYmx1clwiLFxuICAgICAgb25jZSgoKSA9PiB7XG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XG4gICAgICB9KVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdGhyb3cgYW4gZXJyb3I/XG4gIH1cbiAgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uKHRhcmdldEFuY2hvcik7XG59O1xuXG5jb25zdCBpblBhZ2VOYXZpZ2F0aW9uID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbYC4ke0lOX1BBR0VfTkFWX0xJTktfQ0xBU1N9YF0oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcbiAgICAgICAgaGFuZGxlQ2xpY2tGcm9tTGluayh0aGlzKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBrZXlkb3duOiB7XG4gICAgICBbYC4ke0lOX1BBR0VfTkFWX0xJTktfQ0xBU1N9YF06IGtleW1hcCh7XG4gICAgICAgIEVudGVyOiBoYW5kbGVFbnRlckZyb21MaW5rLFxuICAgICAgfSksXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKGAuJHtJTl9QQUdFX05BVl9DTEFTU31gLCByb290KS5mb3JFYWNoKChpblBhZ2VOYXZFbCkgPT4ge1xuICAgICAgICBjcmVhdGVJblBhZ2VOYXYoaW5QYWdlTmF2RWwpO1xuICAgICAgICBzY3JvbGxUb0N1cnJlbnRTZWN0aW9uKCk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluUGFnZU5hdmlnYXRpb247XG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IE1BU0tFRF9DTEFTUyA9IGAke1BSRUZJWH0tbWFza2VkYDtcbmNvbnN0IE1BU0tFRCA9IGAuJHtNQVNLRURfQ0xBU1N9YDtcbmNvbnN0IE1BU0sgPSBgJHtQUkVGSVh9LWlucHV0LW1hc2tgO1xuY29uc3QgTUFTS19DT05URU5UID0gYCR7TUFTS30tLWNvbnRlbnRgO1xuY29uc3QgUExBQ0VIT0xERVIgPSBcInBsYWNlaG9sZGVyXCI7XG5jb25zdCBDT05URVhUID0gXCJmb3JtXCI7XG5cbi8vIFVzZXIgZGVmaW5lZCBWYWx1ZXNcbmNvbnN0IG1hc2tlZE51bWJlciA9IFwiXyNkRG1NeVk5XCI7XG5jb25zdCBtYXNrZWRMZXR0ZXIgPSBcIkFcIjtcblxuLy8gcmVwbGFjZXMgZWFjaCBtYXNrZWQgaW5wdXQgd2l0aCBhIHNoZWxsIGNvbnRhaW5pbmcgdGhlIGlucHV0IGFuZCBpdCdzIG1hc2suXG5jb25zdCBjcmVhdGVNYXNrZWRJbnB1dFNoZWxsID0gKGlucHV0KSA9PiB7XG4gIGNvbnN0IHBsYWNlaG9sZGVyID0gaW5wdXQuZ2V0QXR0cmlidXRlKGAke1BMQUNFSE9MREVSfWApO1xuICBpZiAocGxhY2Vob2xkZXIpIHtcbiAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJtYXhsZW5ndGhcIiwgcGxhY2Vob2xkZXIubGVuZ3RoKTtcbiAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXBsYWNlaG9sZGVyXCIsIHBsYWNlaG9sZGVyKTtcbiAgICBpbnB1dC5yZW1vdmVBdHRyaWJ1dGUoYCR7UExBQ0VIT0xERVJ9YCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2hlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgc2hlbGwuY2xhc3NMaXN0LmFkZChNQVNLKTtcbiAgc2hlbGwuc2V0QXR0cmlidXRlKFwiZGF0YS1tYXNrXCIsIHBsYWNlaG9sZGVyKTtcblxuICBjb25zdCBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGNvbnRlbnQuY2xhc3NMaXN0LmFkZChNQVNLX0NPTlRFTlQpO1xuICBjb250ZW50LnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgY29udGVudC5pZCA9IGAke2lucHV0LmlkfU1hc2tgO1xuICBjb250ZW50LnRleHRDb250ZW50ID0gcGxhY2Vob2xkZXI7XG5cbiAgc2hlbGwuYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gIGlucHV0LmNsb3Nlc3QoQ09OVEVYVCkuaW5zZXJ0QmVmb3JlKHNoZWxsLCBpbnB1dCk7XG4gIHNoZWxsLmFwcGVuZENoaWxkKGlucHV0KTtcbn07XG5cbmNvbnN0IHNldFZhbHVlT2ZNYXNrID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgdmFsdWUgfSA9IGVsO1xuICBjb25zdCBwbGFjZWhvbGRlclZhbCA9IGAke2VsLmRhdGFzZXQucGxhY2Vob2xkZXIuc3Vic3RyKHZhbHVlLmxlbmd0aCl9YDtcblxuICBjb25zdCB0aGVJRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgdGhlSUVsLnRleHRDb250ZW50ID0gdmFsdWU7XG4gIHJldHVybiBbdGhlSUVsLCBwbGFjZWhvbGRlclZhbF07XG59O1xuXG5jb25zdCBzdHJpcHBlZFZhbHVlID0gKGlzQ2hhcnNldFByZXNlbnQsIHZhbHVlKSA9PlxuICBpc0NoYXJzZXRQcmVzZW50ID8gdmFsdWUucmVwbGFjZSgvXFxXL2csIFwiXCIpIDogdmFsdWUucmVwbGFjZSgvXFxEL2csIFwiXCIpO1xuXG5jb25zdCBpc0ludGVnZXIgPSAodmFsdWUpID0+ICFOdW1iZXIuaXNOYU4ocGFyc2VJbnQodmFsdWUsIDEwKSk7XG5cbmNvbnN0IGlzTGV0dGVyID0gKHZhbHVlKSA9PiAodmFsdWUgPyB2YWx1ZS5tYXRjaCgvW0EtWl0vaSkgOiBmYWxzZSk7XG5cbmNvbnN0IGhhbmRsZUN1cnJlbnRWYWx1ZSA9IChlbCkgPT4ge1xuICBjb25zdCBpc0NoYXJzZXRQcmVzZW50ID0gZWwuZGF0YXNldC5jaGFyc2V0O1xuICBjb25zdCBwbGFjZWhvbGRlciA9IGlzQ2hhcnNldFByZXNlbnQgfHwgZWwuZGF0YXNldC5wbGFjZWhvbGRlcjtcbiAgY29uc3QgeyB2YWx1ZSB9ID0gZWw7XG4gIGNvbnN0IGxlbiA9IHBsYWNlaG9sZGVyLmxlbmd0aDtcbiAgbGV0IG5ld1ZhbHVlID0gXCJcIjtcbiAgbGV0IGk7XG4gIGxldCBjaGFySW5kZXg7XG5cbiAgY29uc3Qgc3RyaXBwZWRWYWwgPSBzdHJpcHBlZFZhbHVlKGlzQ2hhcnNldFByZXNlbnQsIHZhbHVlKTtcblxuICBmb3IgKGkgPSAwLCBjaGFySW5kZXggPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICBjb25zdCBpc0ludCA9IGlzSW50ZWdlcihzdHJpcHBlZFZhbFtjaGFySW5kZXhdKTtcbiAgICBjb25zdCBpc0xldCA9IGlzTGV0dGVyKHN0cmlwcGVkVmFsW2NoYXJJbmRleF0pO1xuICAgIGNvbnN0IG1hdGNoZXNOdW1iZXIgPSBtYXNrZWROdW1iZXIuaW5kZXhPZihwbGFjZWhvbGRlcltpXSkgPj0gMDtcbiAgICBjb25zdCBtYXRjaGVzTGV0dGVyID0gbWFza2VkTGV0dGVyLmluZGV4T2YocGxhY2Vob2xkZXJbaV0pID49IDA7XG5cbiAgICBpZiAoXG4gICAgICAobWF0Y2hlc051bWJlciAmJiBpc0ludCkgfHxcbiAgICAgIChpc0NoYXJzZXRQcmVzZW50ICYmIG1hdGNoZXNMZXR0ZXIgJiYgaXNMZXQpXG4gICAgKSB7XG4gICAgICBuZXdWYWx1ZSArPSBzdHJpcHBlZFZhbFtjaGFySW5kZXhdO1xuICAgICAgY2hhckluZGV4ICs9IDE7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICghaXNDaGFyc2V0UHJlc2VudCAmJiAhaXNJbnQgJiYgbWF0Y2hlc051bWJlcikgfHxcbiAgICAgIChpc0NoYXJzZXRQcmVzZW50ICYmXG4gICAgICAgICgobWF0Y2hlc0xldHRlciAmJiAhaXNMZXQpIHx8IChtYXRjaGVzTnVtYmVyICYmICFpc0ludCkpKVxuICAgICkge1xuICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdWYWx1ZSArPSBwbGFjZWhvbGRlcltpXTtcbiAgICB9XG4gICAgLy8gYnJlYWsgaWYgbm8gY2hhcmFjdGVycyBsZWZ0IGFuZCB0aGUgcGF0dGVybiBpcyBub24tc3BlY2lhbCBjaGFyYWN0ZXJcbiAgICBpZiAoc3RyaXBwZWRWYWxbY2hhckluZGV4XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3VmFsdWU7XG59O1xuXG5jb25zdCBoYW5kbGVWYWx1ZUNoYW5nZSA9IChlbCkgPT4ge1xuICBjb25zdCBpbnB1dEVsID0gZWw7XG4gIGNvbnN0IGlkID0gaW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgaW5wdXRFbC52YWx1ZSA9IGhhbmRsZUN1cnJlbnRWYWx1ZShpbnB1dEVsKTtcblxuICBjb25zdCBtYXNrVmFsID0gc2V0VmFsdWVPZk1hc2soZWwpO1xuICBjb25zdCBtYXNrRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgJHtpZH1NYXNrYCk7XG4gIG1hc2tFbC50ZXh0Q29udGVudCA9IFwiXCI7XG4gIG1hc2tFbC5yZXBsYWNlQ2hpbGRyZW4obWFza1ZhbFswXSwgbWFza1ZhbFsxXSk7XG59O1xuXG5jb25zdCBpbnB1dE1hc2tFdmVudHMgPSB7XG4gIGtleXVwOiB7XG4gICAgW01BU0tFRF0oKSB7XG4gICAgICBoYW5kbGVWYWx1ZUNoYW5nZSh0aGlzKTtcbiAgICB9LFxuICB9LFxufTtcblxuY29uc3QgaW5wdXRNYXNrID0gYmVoYXZpb3IoaW5wdXRNYXNrRXZlbnRzLCB7XG4gIGluaXQocm9vdCkge1xuICAgIHNlbGVjdE9yTWF0Y2hlcyhNQVNLRUQsIHJvb3QpLmZvckVhY2goKG1hc2tlZElucHV0KSA9PiB7XG4gICAgICBjcmVhdGVNYXNrZWRJbnB1dFNoZWxsKG1hc2tlZElucHV0KTtcbiAgICB9KTtcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlucHV0TWFzaztcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcbmNvbnN0IGFjY29yZGlvbiA9IHJlcXVpcmUoXCIuLi8uLi91c2EtYWNjb3JkaW9uL3NyYy9pbmRleFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEJPRFkgPSBcImJvZHlcIjtcbmNvbnN0IExBTkdVQUdFID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VgO1xuY29uc3QgTEFOR1VBR0VfU1VCID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VfX3N1Ym1lbnVgO1xuY29uc3QgTEFOR1VBR0VfUFJJTUFSWSA9IGAuJHtQUkVGSVh9LWxhbmd1YWdlX19wcmltYXJ5YDtcbmNvbnN0IExBTkdVQUdFX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LWxhbmd1YWdlX19wcmltYXJ5LWl0ZW1gO1xuY29uc3QgTEFOR1VBR0VfQ09OVFJPTCA9IGBidXR0b24uJHtQUkVGSVh9LWxhbmd1YWdlX19saW5rYDtcbmNvbnN0IExBTkdVQUdFX0xJTktTID0gYCR7TEFOR1VBR0V9IGFgO1xuXG5sZXQgbGFuZ3VhZ2VTZWxlY3RvcjtcbmxldCBsYW5ndWFnZUFjdGl2ZTtcblxuY29uc3Qgb25MYW5ndWFnZUNsb3NlID0gKCkgPT5cbiAgbGFuZ3VhZ2VTZWxlY3Rvci50b2dnbGVMYW5ndWFnZS5jYWxsKGxhbmd1YWdlU2VsZWN0b3IsIGZhbHNlKTtcblxuY29uc3QgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24gPSAoKSA9PiB7XG4gIGlmICghbGFuZ3VhZ2VBY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0b2dnbGUobGFuZ3VhZ2VBY3RpdmUsIGZhbHNlKTtcbiAgbGFuZ3VhZ2VBY3RpdmUgPSBudWxsO1xufTtcblxuY29uc3QgZm9jdXNMYW5ndWFnZUJ1dHRvbiA9IChldmVudCkgPT4ge1xuICBjb25zdCBwYXJlbnRMYW5ndWFnZUl0ZW0gPSBldmVudC50YXJnZXQuY2xvc2VzdChMQU5HVUFHRV9QUklNQVJZX0lURU0pO1xuXG4gIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXMoTEFOR1VBR0VfQ09OVFJPTCkpIHtcbiAgICBwYXJlbnRMYW5ndWFnZUl0ZW0ucXVlcnlTZWxlY3RvcihMQU5HVUFHRV9DT05UUk9MKS5mb2N1cygpO1xuICB9XG59O1xuXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcbiAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcbiAgZm9jdXNMYW5ndWFnZUJ1dHRvbihldmVudCk7XG59O1xuXG5sYW5ndWFnZVNlbGVjdG9yID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbTEFOR1VBR0VfQ09OVFJPTF0oKSB7XG4gICAgICAgIGlmIChsYW5ndWFnZUFjdGl2ZSAhPT0gdGhpcykge1xuICAgICAgICAgIGhpZGVBY3RpdmVMYW5ndWFnZURyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhbmd1YWdlQWN0aXZlID09PSB0aGlzKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsYW5ndWFnZUFjdGl2ZSkge1xuICAgICAgICAgIGxhbmd1YWdlQWN0aXZlID0gdGhpcztcbiAgICAgICAgICB0b2dnbGUobGFuZ3VhZ2VBY3RpdmUsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIFtCT0RZXTogaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24sXG4gICAgICBbTEFOR1VBR0VfTElOS1NdKCkge1xuICAgICAgICBjb25zdCBhY2MgPSB0aGlzLmNsb3Nlc3QoYWNjb3JkaW9uLkFDQ09SRElPTik7XG5cbiAgICAgICAgaWYgKGFjYykge1xuICAgICAgICAgIGFjY29yZGlvbi5nZXRCdXR0b25zKGFjYykuZm9yRWFjaCgoYnRuKSA9PiBhY2NvcmRpb24uaGlkZShidG4pKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIGtleWRvd246IHtcbiAgICAgIFtMQU5HVUFHRV9QUklNQVJZXToga2V5bWFwKHsgRXNjYXBlOiBoYW5kbGVFc2NhcGUgfSksXG4gICAgfSxcbiAgICBmb2N1c291dDoge1xuICAgICAgW0xBTkdVQUdFX1BSSU1BUlldKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGxhbmd1YWdlID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTEFOR1VBR0VfUFJJTUFSWSk7XG5cbiAgICAgICAgaWYgKCFsYW5ndWFnZS5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIGhpZGVBY3RpdmVMYW5ndWFnZURyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgY29uc3QgdHJhcENvbnRhaW5lciA9IHJvb3QubWF0Y2hlcyhMQU5HVUFHRV9TVUIpXG4gICAgICAgID8gcm9vdFxuICAgICAgICA6IHJvb3QucXVlcnlTZWxlY3RvcihMQU5HVUFHRV9TVUIpO1xuXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xuICAgICAgICBsYW5ndWFnZVNlbGVjdG9yLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0cmFwQ29udGFpbmVyLCB7XG4gICAgICAgICAgRXNjYXBlOiBvbkxhbmd1YWdlQ2xvc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgdGVhcmRvd24oKSB7XG4gICAgICBsYW5ndWFnZUFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgZm9jdXNUcmFwOiBudWxsLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxhbmd1YWdlU2VsZWN0b3I7XG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcbmNvbnN0IFNjcm9sbEJhcldpZHRoID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBNT0RBTF9DTEFTU05BTUUgPSBgJHtQUkVGSVh9LW1vZGFsYDtcbmNvbnN0IE9WRVJMQVlfQ0xBU1NOQU1FID0gYCR7TU9EQUxfQ0xBU1NOQU1FfS1vdmVybGF5YDtcbmNvbnN0IFdSQVBQRVJfQ0xBU1NOQU1FID0gYCR7TU9EQUxfQ0xBU1NOQU1FfS13cmFwcGVyYDtcbmNvbnN0IE9QRU5FUl9BVFRSSUJVVEUgPSBcImRhdGEtb3Blbi1tb2RhbFwiO1xuY29uc3QgQ0xPU0VSX0FUVFJJQlVURSA9IFwiZGF0YS1jbG9zZS1tb2RhbFwiO1xuY29uc3QgRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSA9IFwiZGF0YS1mb3JjZS1hY3Rpb25cIjtcbmNvbnN0IE5PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFID0gYGRhdGEtbW9kYWwtaGlkZGVuYDtcbmNvbnN0IE1PREFMID0gYC4ke01PREFMX0NMQVNTTkFNRX1gO1xuY29uc3QgSU5JVElBTF9GT0NVUyA9IGAuJHtXUkFQUEVSX0NMQVNTTkFNRX0gKltkYXRhLWZvY3VzXWA7XG5jb25zdCBDTE9TRV9CVVRUT04gPSBgJHtXUkFQUEVSX0NMQVNTTkFNRX0gKlske0NMT1NFUl9BVFRSSUJVVEV9XWA7XG5jb25zdCBPUEVORVJTID0gYCpbJHtPUEVORVJfQVRUUklCVVRFfV1bYXJpYS1jb250cm9sc11gO1xuY29uc3QgQ0xPU0VSUyA9IGAke0NMT1NFX0JVVFRPTn0sIC4ke09WRVJMQVlfQ0xBU1NOQU1FfTpub3QoWyR7Rk9SQ0VfQUNUSU9OX0FUVFJJQlVURX1dKWA7XG5jb25zdCBOT05fTU9EQUxTID0gYGJvZHkgPiAqOm5vdCguJHtXUkFQUEVSX0NMQVNTTkFNRX0pOm5vdChbYXJpYS1oaWRkZW5dKWA7XG5jb25zdCBOT05fTU9EQUxTX0hJRERFTiA9IGBbJHtOT05fTU9EQUxfSElEREVOX0FUVFJJQlVURX1dYDtcblxuY29uc3QgQUNUSVZFX0NMQVNTID0gXCJ1c2EtanMtbW9kYWwtLWFjdGl2ZVwiO1xuY29uc3QgUFJFVkVOVF9DTElDS19DTEFTUyA9IFwidXNhLWpzLW5vLWNsaWNrXCI7XG5jb25zdCBWSVNJQkxFX0NMQVNTID0gXCJpcy12aXNpYmxlXCI7XG5jb25zdCBISURERU5fQ0xBU1MgPSBcImlzLWhpZGRlblwiO1xuXG5sZXQgbW9kYWw7XG5sZXQgSU5JVElBTF9CT0RZX1BBRERJTkc7XG5sZXQgVEVNUE9SQVJZX0JPRFlfUEFERElORztcblxuY29uc3QgaXNBY3RpdmUgPSAoKSA9PiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhBQ1RJVkVfQ0xBU1MpO1xuY29uc3QgU0NST0xMQkFSX1dJRFRIID0gU2Nyb2xsQmFyV2lkdGgoKTtcblxuLyoqXG4gKiAgQ2xvc2VzIG1vZGFsIHdoZW4gYm91bmQgdG8gYSBidXR0b24gYW5kIHByZXNzZWQuXG4gKi9cbmNvbnN0IG9uTWVudUNsb3NlID0gKCkgPT4ge1xuICBtb2RhbC50b2dnbGVNb2RhbC5jYWxsKG1vZGFsLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgdmFsdWUgZm9yIHRlbXBvcmFyeSBib2R5IHBhZGRpbmcgdGhhdCB3aWxsIGJlIGFwcGxpZWQgd2hlbiB0aGUgbW9kYWwgaXMgb3Blbi5cbiAqIFZhbHVlIGlzIGNyZWF0ZWQgYnkgY2hlY2tpbmcgZm9yIGluaXRpYWwgYm9keSBwYWRkaW5nIGFuZCBhZGRpbmcgdGhlIHdpZHRoIG9mIHRoZSBzY3JvbGxiYXIuXG4gKi9cbmNvbnN0IHNldFRlbXBvcmFyeUJvZHlQYWRkaW5nID0gKCkgPT4ge1xuICBJTklUSUFMX0JPRFlfUEFERElORyA9IHdpbmRvd1xuICAgIC5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpXG4gICAgLmdldFByb3BlcnR5VmFsdWUoXCJwYWRkaW5nLXJpZ2h0XCIpO1xuICBURU1QT1JBUllfQk9EWV9QQURESU5HID0gYCR7XG4gICAgcGFyc2VJbnQoSU5JVElBTF9CT0RZX1BBRERJTkcucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApICtcbiAgICBwYXJzZUludChTQ1JPTExCQVJfV0lEVEgucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApXG4gIH1weGA7XG59O1xuXG4vKipcbiAqICBUb2dnbGUgdGhlIHZpc2liaWxpdHkgb2YgYSBtb2RhbCB3aW5kb3dcbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50LlxuICogQHJldHVybnMge2Jvb2xlYW59IHNhZmVBY3RpdmUgaWYgbW9iaWxlIGlzIG9wZW4uXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZU1vZGFsKGV2ZW50KSB7XG4gIGxldCBvcmlnaW5hbE9wZW5lcjtcbiAgbGV0IGNsaWNrZWRFbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuICBjb25zdCB7IGJvZHkgfSA9IGRvY3VtZW50O1xuICBjb25zdCBzYWZlQWN0aXZlID0gIWlzQWN0aXZlKCk7XG4gIGNvbnN0IG1vZGFsSWQgPSBjbGlja2VkRWxlbWVudFxuICAgID8gY2xpY2tlZEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiKVxuICAgIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi51c2EtbW9kYWwtd3JhcHBlci5pcy12aXNpYmxlXCIpO1xuICBjb25zdCB0YXJnZXRNb2RhbCA9IHNhZmVBY3RpdmVcbiAgICA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1vZGFsSWQpXG4gICAgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnVzYS1tb2RhbC13cmFwcGVyLmlzLXZpc2libGVcIik7XG5cbiAgLy8gaWYgdGhlcmUgaXMgbm8gbW9kYWwgd2UgcmV0dXJuIGVhcmx5XG4gIGlmICghdGFyZ2V0TW9kYWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBvcGVuRm9jdXNFbCA9IHRhcmdldE1vZGFsLnF1ZXJ5U2VsZWN0b3IoSU5JVElBTF9GT0NVUylcbiAgICA/IHRhcmdldE1vZGFsLnF1ZXJ5U2VsZWN0b3IoSU5JVElBTF9GT0NVUylcbiAgICA6IHRhcmdldE1vZGFsLnF1ZXJ5U2VsZWN0b3IoXCIudXNhLW1vZGFsXCIpO1xuICBjb25zdCByZXR1cm5Gb2N1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFxuICAgIHRhcmdldE1vZGFsLmdldEF0dHJpYnV0ZShcImRhdGEtb3BlbmVyXCIpXG4gICk7XG4gIGNvbnN0IG1lbnVCdXR0b24gPSBib2R5LnF1ZXJ5U2VsZWN0b3IoT1BFTkVSUyk7XG4gIGNvbnN0IGZvcmNlVXNlckFjdGlvbiA9IHRhcmdldE1vZGFsLmdldEF0dHJpYnV0ZShGT1JDRV9BQ1RJT05fQVRUUklCVVRFKTtcblxuICAvLyBTZXRzIHRoZSBjbGlja2VkIGVsZW1lbnQgdG8gdGhlIGNsb3NlIGJ1dHRvblxuICAvLyBzbyBlc2Mga2V5IGFsd2F5cyBjbG9zZXMgbW9kYWxcbiAgaWYgKGV2ZW50LnR5cGUgPT09IFwia2V5ZG93blwiICYmIHRhcmdldE1vZGFsICE9PSBudWxsKSB7XG4gICAgY2xpY2tlZEVsZW1lbnQgPSB0YXJnZXRNb2RhbC5xdWVyeVNlbGVjdG9yKENMT1NFX0JVVFRPTik7XG4gIH1cblxuICAvLyBXaGVuIHdlJ3JlIG5vdCBoaXR0aW5nIHRoZSBlc2NhcGUga2V54oCmXG4gIGlmIChjbGlja2VkRWxlbWVudCkge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSBjbGljayB0aGUgb3BlbmVyXG4gICAgLy8gSWYgaXQgZG9lc24ndCBoYXZlIGFuIElELCBtYWtlIG9uZVxuICAgIC8vIFN0b3JlIGlkIGFzIGRhdGEgYXR0cmlidXRlIG9uIG1vZGFsXG4gICAgaWYgKGNsaWNrZWRFbGVtZW50Lmhhc0F0dHJpYnV0ZShPUEVORVJfQVRUUklCVVRFKSkge1xuICAgICAgaWYgKHRoaXMuZ2V0QXR0cmlidXRlKFwiaWRcIikgPT09IG51bGwpIHtcbiAgICAgICAgb3JpZ2luYWxPcGVuZXIgPSBgbW9kYWwtJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5MDAwMDApICsgMTAwMDAwfWA7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiaWRcIiwgb3JpZ2luYWxPcGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3JpZ2luYWxPcGVuZXIgPSB0aGlzLmdldEF0dHJpYnV0ZShcImlkXCIpO1xuICAgICAgfVxuICAgICAgdGFyZ2V0TW9kYWwuc2V0QXR0cmlidXRlKFwiZGF0YS1vcGVuZXJcIiwgb3JpZ2luYWxPcGVuZXIpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgYmFzaWNhbGx5IHN0b3BzIHRoZSBwcm9wYWdhdGlvbiBpZiB0aGUgZWxlbWVudFxuICAgIC8vIGlzIGluc2lkZSB0aGUgbW9kYWwgYW5kIG5vdCBhIGNsb3NlIGJ1dHRvbiBvclxuICAgIC8vIGVsZW1lbnQgaW5zaWRlIGEgY2xvc2UgYnV0dG9uXG4gICAgaWYgKGNsaWNrZWRFbGVtZW50LmNsb3Nlc3QoYC4ke01PREFMX0NMQVNTTkFNRX1gKSkge1xuICAgICAgaWYgKFxuICAgICAgICBjbGlja2VkRWxlbWVudC5oYXNBdHRyaWJ1dGUoQ0xPU0VSX0FUVFJJQlVURSkgfHxcbiAgICAgICAgY2xpY2tlZEVsZW1lbnQuY2xvc2VzdChgWyR7Q0xPU0VSX0FUVFJJQlVURX1dYClcbiAgICAgICkge1xuICAgICAgICAvLyBkbyBub3RoaW5nLiBtb3ZlIG9uLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZShBQ1RJVkVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuICB0YXJnZXRNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFZJU0lCTEVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuICB0YXJnZXRNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKEhJRERFTl9DTEFTUywgIXNhZmVBY3RpdmUpO1xuXG4gIC8vIElmIHVzZXIgaXMgZm9yY2VkIHRvIHRha2UgYW4gYWN0aW9uLCBhZGRpbmdcbiAgLy8gYSBjbGFzcyB0byB0aGUgYm9keSB0aGF0IHByZXZlbnRzIGNsaWNraW5nIHVuZGVybmVhdGhcbiAgLy8gb3ZlcmxheVxuICBpZiAoZm9yY2VVc2VyQWN0aW9uKSB7XG4gICAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKFBSRVZFTlRfQ0xJQ0tfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuICB9XG5cbiAgLy8gVGVtcG9yYXJpbHkgaW5jcmVhc2UgYm9keSBwYWRkaW5nIHRvIGluY2x1ZGUgdGhlIHdpZHRoIG9mIHRoZSBzY3JvbGxiYXIuXG4gIC8vIFRoaXMgYWNjb3VudHMgZm9yIHRoZSBjb250ZW50IHNoaWZ0IHdoZW4gdGhlIHNjcm9sbGJhciBpcyByZW1vdmVkIG9uIG1vZGFsIG9wZW4uXG4gIGlmIChib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9PT0gVEVNUE9SQVJZX0JPRFlfUEFERElORykge1xuICAgIGJvZHkuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCJwYWRkaW5nLXJpZ2h0XCIpO1xuICB9IGVsc2Uge1xuICAgIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gVEVNUE9SQVJZX0JPRFlfUEFERElORztcbiAgfVxuXG4gIC8vIEhhbmRsZSB0aGUgZm9jdXMgYWN0aW9uc1xuICBpZiAoc2FmZUFjdGl2ZSAmJiBvcGVuRm9jdXNFbCkge1xuICAgIC8vIFRoZSBtb2RhbCB3aW5kb3cgaXMgb3BlbmVkLiBGb2N1cyBpcyBzZXQgdG8gY2xvc2UgYnV0dG9uLlxuXG4gICAgLy8gQmluZHMgZXNjYXBlIGtleSBpZiB3ZSdyZSBub3QgZm9yY2luZ1xuICAgIC8vIHRoZSB1c2VyIHRvIHRha2UgYW4gYWN0aW9uXG4gICAgaWYgKGZvcmNlVXNlckFjdGlvbikge1xuICAgICAgbW9kYWwuZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRhcmdldE1vZGFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kYWwuZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRhcmdldE1vZGFsLCB7XG4gICAgICAgIEVzY2FwZTogb25NZW51Q2xvc2UsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGVzIGZvY3VzIHNldHRpbmcgYW5kIGludGVyYWN0aW9uc1xuICAgIG1vZGFsLmZvY3VzVHJhcC51cGRhdGUoc2FmZUFjdGl2ZSk7XG4gICAgb3BlbkZvY3VzRWwuZm9jdXMoKTtcblxuICAgIC8vIEhpZGVzIGV2ZXJ5dGhpbmcgdGhhdCBpcyBub3QgdGhlIG1vZGFsIGZyb20gc2NyZWVuIHJlYWRlcnNcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKE5PTl9NT0RBTFMpLmZvckVhY2goKG5vbk1vZGFsKSA9PiB7XG4gICAgICBub25Nb2RhbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgICBub25Nb2RhbC5zZXRBdHRyaWJ1dGUoTk9OX01PREFMX0hJRERFTl9BVFRSSUJVVEUsIFwiXCIpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCFzYWZlQWN0aXZlICYmIG1lbnVCdXR0b24gJiYgcmV0dXJuRm9jdXMpIHtcbiAgICAvLyBUaGUgbW9kYWwgd2luZG93IGlzIGNsb3NlZC5cbiAgICAvLyBOb24tbW9kYWxzIG5vdyBhY2Nlc2libGUgdG8gc2NyZWVuIHJlYWRlclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX01PREFMU19ISURERU4pLmZvckVhY2goKG5vbk1vZGFsKSA9PiB7XG4gICAgICBub25Nb2RhbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiKTtcbiAgICAgIG5vbk1vZGFsLnJlbW92ZUF0dHJpYnV0ZShOT05fTU9EQUxfSElEREVOX0FUVFJJQlVURSk7XG4gICAgfSk7XG5cbiAgICAvLyBGb2N1cyBpcyByZXR1cm5lZCB0byB0aGUgb3BlbmVyXG4gICAgcmV0dXJuRm9jdXMuZm9jdXMoKTtcbiAgICBtb2RhbC5mb2N1c1RyYXAudXBkYXRlKHNhZmVBY3RpdmUpO1xuICB9XG5cbiAgcmV0dXJuIHNhZmVBY3RpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHBsYWNlaG9sZGVyIHdpdGggZGF0YSBhdHRyaWJ1dGVzIGZvciBjbGVhbnVwIGZ1bmN0aW9uLlxuICogVGhlIGNsZWFudXAgZnVuY3Rpb24gdXNlcyB0aGlzIHBsYWNlaG9sZGVyIHRvIGVhc2lseSByZXN0b3JlIHRoZSBvcmlnaW5hbCBNb2RhbCBIVE1MIG9uIHRlYXJkb3duLlxuICpcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGJhc2VDb21wb25lbnQgLSBNb2RhbCBIVE1MIGZyb20gdGhlIERPTS5cbiAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH0gUGxhY2Vob2xkZXIgdXNlZCBmb3IgY2xlYW51cCBmdW5jdGlvbi5cbiAqL1xuY29uc3QgY3JlYXRlUGxhY2VIb2xkZXIgPSAoYmFzZUNvbXBvbmVudCkgPT4ge1xuICBjb25zdCBtb2RhbElEID0gYmFzZUNvbXBvbmVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgY29uc3Qgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgbW9kYWxBdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShiYXNlQ29tcG9uZW50LmF0dHJpYnV0ZXMpO1xuXG4gIHNldFRlbXBvcmFyeUJvZHlQYWRkaW5nKCk7XG5cbiAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLnNldEF0dHJpYnV0ZShgZGF0YS1wbGFjZWhvbGRlci1mb3JgLCBtb2RhbElEKTtcbiAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcblxuICBtb2RhbEF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlKSA9PiB7XG4gICAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLnNldEF0dHJpYnV0ZShcbiAgICAgIGBkYXRhLW9yaWdpbmFsLSR7YXR0cmlidXRlLm5hbWV9YCxcbiAgICAgIGF0dHJpYnV0ZS52YWx1ZVxuICAgICk7XG4gIH0pO1xuXG4gIHJldHVybiBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXI7XG59O1xuXG4vKipcbiAqIE1vdmVzIG5lY2Vzc2FyeSBhdHRyaWJ1dGVzIGZyb20gTW9kYWwgSFRNTCB0byB3cmFwcGVyIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gYmFzZUNvbXBvbmVudCAtIE1vZGFsIEhUTUwgaW4gdGhlIERPTS5cbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IG1vZGFsQ29udGVudFdyYXBwZXIgLSBNb2RhbCBjb21wb25lbnQgd3JhcHBlciBlbGVtZW50LlxuICogQHJldHVybnMgTW9kYWwgd3JhcHBlciB3aXRoIGNvcnJlY3QgYXR0cmlidXRlcy5cbiAqL1xuY29uc3Qgc2V0TW9kYWxBdHRyaWJ1dGVzID0gKGJhc2VDb21wb25lbnQsIG1vZGFsQ29udGVudFdyYXBwZXIpID0+IHtcbiAgY29uc3QgbW9kYWxJRCA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG4gIGNvbnN0IGFyaWFMYWJlbGxlZEJ5ID0gYmFzZUNvbXBvbmVudC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsbGVkYnlcIik7XG4gIGNvbnN0IGFyaWFEZXNjcmliZWRCeSA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiKTtcbiAgY29uc3QgZm9yY2VVc2VyQWN0aW9uID0gYmFzZUNvbXBvbmVudC5oYXNBdHRyaWJ1dGUoRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSk7XG5cbiAgaWYgKCFhcmlhTGFiZWxsZWRCeSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kYWxJRH0gaXMgbWlzc2luZyBhcmlhLWxhYmVsbGVkYnkgYXR0cmlidXRlYCk7XG5cbiAgaWYgKCFhcmlhRGVzY3JpYmVkQnkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke21vZGFsSUR9IGlzIG1pc3NpbmcgYXJpYS1kZXNyaWJlZGJ5IGF0dHJpYnV0ZWApO1xuXG4gIC8vIFNldCBhdHRyaWJ1dGVzXG4gIG1vZGFsQ29udGVudFdyYXBwZXIuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImRpYWxvZ1wiKTtcbiAgbW9kYWxDb250ZW50V3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBtb2RhbElEKTtcbiAgbW9kYWxDb250ZW50V3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsbGVkYnlcIiwgYXJpYUxhYmVsbGVkQnkpO1xuICBtb2RhbENvbnRlbnRXcmFwcGVyLnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgYXJpYURlc2NyaWJlZEJ5KTtcblxuICBpZiAoZm9yY2VVc2VyQWN0aW9uKSB7XG4gICAgbW9kYWxDb250ZW50V3JhcHBlci5zZXRBdHRyaWJ1dGUoRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSwgZm9yY2VVc2VyQWN0aW9uKTtcbiAgfVxuXG4gIC8vIEFkZCBhcmlhLWNvbnRyb2xzXG4gIGNvbnN0IG1vZGFsQ2xvc2VycyA9IG1vZGFsQ29udGVudFdyYXBwZXIucXVlcnlTZWxlY3RvckFsbChDTE9TRVJTKTtcbiAgbW9kYWxDbG9zZXJzLmZvckVhY2goKGVsKSA9PiB7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBtb2RhbElEKTtcbiAgfSk7XG5cbiAgLy8gVXBkYXRlIHRoZSBiYXNlIGVsZW1lbnQgSFRNTFxuICBiYXNlQ29tcG9uZW50LnJlbW92ZUF0dHJpYnV0ZShcImlkXCIpO1xuICBiYXNlQ29tcG9uZW50LnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtbGFiZWxsZWRieVwiKTtcbiAgYmFzZUNvbXBvbmVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWRlc2NyaWJlZGJ5XCIpO1xuICBiYXNlQ29tcG9uZW50LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XG5cbiAgcmV0dXJuIG1vZGFsQ29udGVudFdyYXBwZXI7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBoaWRkZW4gbW9kYWwgY29udGVudCB3cmFwcGVyLlxuICogUmVidWlsZHMgdGhlIG9yaWdpbmFsIE1vZGFsIEhUTUwgaW4gdGhlIG5ldyB3cmFwcGVyIGFuZCBhZGRzIGEgcGFnZSBvdmVybGF5LlxuICogVGhlbiBtb3ZlcyBvcmlnaW5hbCBNb2RhbCBIVE1MIGF0dHJpYnV0ZXMgdG8gdGhlIG5ldyB3cmFwcGVyLlxuICpcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGJhc2VDb21wb25lbnQgLSBPcmlnaW5hbCBNb2RhbCBIVE1MIGluIHRoZSBET00uXG4gKiBAcmV0dXJucyBNb2RhbCBjb21wb25lbnQgLSBNb2RhbCB3cmFwcGVyIHcvIG5lc3RlZCBPdmVybGF5IGFuZCBNb2RhbCBDb250ZW50LlxuICovXG5jb25zdCByZWJ1aWxkTW9kYWwgPSAoYmFzZUNvbXBvbmVudCkgPT4ge1xuICBjb25zdCBtb2RhbENvbnRlbnQgPSBiYXNlQ29tcG9uZW50O1xuICBjb25zdCBtb2RhbENvbnRlbnRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3Qgb3ZlcmxheURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgLy8gQWRkIGNsYXNzZXNcbiAgbW9kYWxDb250ZW50V3JhcHBlci5jbGFzc0xpc3QuYWRkKEhJRERFTl9DTEFTUywgV1JBUFBFUl9DTEFTU05BTUUpO1xuICBvdmVybGF5RGl2LmNsYXNzTGlzdC5hZGQoT1ZFUkxBWV9DTEFTU05BTUUpO1xuXG4gIC8vIFJlYnVpbGQgdGhlIG1vZGFsIGVsZW1lbnRcbiAgbW9kYWxDb250ZW50V3JhcHBlci5hcHBlbmQob3ZlcmxheURpdik7XG4gIG92ZXJsYXlEaXYuYXBwZW5kKG1vZGFsQ29udGVudCk7XG5cbiAgLy8gQWRkIGF0dHJpYnV0ZXNcbiAgc2V0TW9kYWxBdHRyaWJ1dGVzKG1vZGFsQ29udGVudCwgbW9kYWxDb250ZW50V3JhcHBlcik7XG5cbiAgcmV0dXJuIG1vZGFsQ29udGVudFdyYXBwZXI7XG59O1xuXG4vKipcbiAqICBCdWlsZHMgbW9kYWwgd2luZG93IGZyb20gYmFzZSBIVE1MIGFuZCBhcHBlbmRzIHRvIHRoZSBlbmQgb2YgdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0ge0hUTUxEaXZFbGVtZW50fSBiYXNlQ29tcG9uZW50IC0gVGhlIG1vZGFsIGRpdiBlbGVtZW50IGluIHRoZSBET00uXG4gKi9cbmNvbnN0IHNldFVwTW9kYWwgPSAoYmFzZUNvbXBvbmVudCkgPT4ge1xuICBjb25zdCBtb2RhbElEID0gYmFzZUNvbXBvbmVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcblxuICBpZiAoIW1vZGFsSUQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE1vZGFsIG1hcmt1cCBpcyBtaXNzaW5nIElEYCk7XG4gIH1cblxuICAvLyBDcmVhdGUgcGxhY2Vob2xkZXIgd2hlcmUgbW9kYWwgaXMgZm9yIGNsZWFudXBcbiAgY29uc3Qgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyID0gY3JlYXRlUGxhY2VIb2xkZXIoYmFzZUNvbXBvbmVudCk7XG4gIGJhc2VDb21wb25lbnQuYWZ0ZXIob3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyKTtcblxuICAvLyBCdWlsZCBtb2RhbCBjb21wb25lbnRcbiAgY29uc3QgbW9kYWxDb21wb25lbnQgPSByZWJ1aWxkTW9kYWwoYmFzZUNvbXBvbmVudCk7XG5cbiAgLy8gTW92ZSBhbGwgbW9kYWxzIHRvIHRoZSBlbmQgb2YgdGhlIERPTS4gRG9pbmcgdGhpcyBhbGxvd3MgdXMgdG9cbiAgLy8gbW9yZSBlYXNpbHkgZmluZCB0aGUgZWxlbWVudHMgdG8gaGlkZSBmcm9tIHNjcmVlbiByZWFkZXJzXG4gIC8vIHdoZW4gdGhlIG1vZGFsIGlzIG9wZW4uXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobW9kYWxDb21wb25lbnQpO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGR5bmFtaWNhbGx5IGNyZWF0ZWQgTW9kYWwgYW5kIFdyYXBwZXIgZWxlbWVudHMgYW5kIHJlc3RvcmVzIG9yaWdpbmFsIE1vZGFsIEhUTUwuXG4gKlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gYmFzZUNvbXBvbmVudCAtIFRoZSBtb2RhbCBkaXYgZWxlbWVudCBpbiB0aGUgRE9NLlxuICovXG5jb25zdCBjbGVhblVwTW9kYWwgPSAoYmFzZUNvbXBvbmVudCkgPT4ge1xuICBjb25zdCBtb2RhbENvbnRlbnQgPSBiYXNlQ29tcG9uZW50O1xuICBjb25zdCBtb2RhbENvbnRlbnRXcmFwcGVyID0gbW9kYWxDb250ZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgY29uc3QgbW9kYWxJRCA9IG1vZGFsQ29udGVudFdyYXBwZXIuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG5cbiAgLy8gaWYgdGhlcmUgaXMgbm8gbW9kYWxJRCwgcmV0dXJuIGVhcmx5XG4gIGlmICghbW9kYWxJRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgYFtkYXRhLXBsYWNlaG9sZGVyLWZvcj1cIiR7bW9kYWxJRH1cIl1gXG4gICk7XG5cbiAgaWYgKG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlcikge1xuICAgIGNvbnN0IG1vZGFsQXR0cmlidXRlcyA9IEFycmF5LmZyb20ob3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLmF0dHJpYnV0ZXMpO1xuICAgIG1vZGFsQXR0cmlidXRlcy5mb3JFYWNoKChhdHRyaWJ1dGUpID0+IHtcbiAgICAgIGlmIChhdHRyaWJ1dGUubmFtZS5zdGFydHNXaXRoKFwiZGF0YS1vcmlnaW5hbC1cIikpIHtcbiAgICAgICAgLy8gZGF0YS1vcmlnaW5hbC0gaXMgMTQgbG9uZ1xuICAgICAgICBtb2RhbENvbnRlbnQuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lLnN1YnN0cigxNCksIGF0dHJpYnV0ZS52YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuYWZ0ZXIobW9kYWxDb250ZW50KTtcbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChcbiAgICAgIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlclxuICAgICk7XG4gIH1cblxuICBtb2RhbENvbnRlbnRXcmFwcGVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQobW9kYWxDb250ZW50V3JhcHBlcik7XG59O1xuXG5tb2RhbCA9IGJlaGF2aW9yKFxuICB7fSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKE1PREFMLCByb290KS5mb3JFYWNoKChtb2RhbFdpbmRvdykgPT4ge1xuICAgICAgICBjb25zdCBtb2RhbElkID0gbW9kYWxXaW5kb3cuaWQ7XG5cbiAgICAgICAgc2V0VXBNb2RhbChtb2RhbFdpbmRvdyk7XG5cbiAgICAgICAgLy8gUXVlcnkgYWxsIG9wZW5lcnMgYW5kIGNsb3NlcnMgaW5jbHVkaW5nIHRoZSBvdmVybGF5XG4gICAgICAgIHNlbGVjdE9yTWF0Y2hlcyhgW2FyaWEtY29udHJvbHM9XCIke21vZGFsSWR9XCJdYCwgZG9jdW1lbnQpLmZvckVhY2goXG4gICAgICAgICAgKG1vZGFsVHJpZ2dlcikgPT4ge1xuICAgICAgICAgICAgLy8gSWYgbW9kYWxUcmlnZ2VyIGlzIGFuIGFuY2hvci4uLlxuICAgICAgICAgICAgaWYgKG1vZGFsVHJpZ2dlci5ub2RlTmFtZSA9PT0gXCJBXCIpIHtcbiAgICAgICAgICAgICAgLy8gVHVybiBhbmNob3IgbGlua3MgaW50byBidXR0b25zIGZvciBzY3JlZW4gcmVhZGVyc1xuICAgICAgICAgICAgICBtb2RhbFRyaWdnZXIuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImJ1dHRvblwiKTtcblxuICAgICAgICAgICAgICAvLyBQcmV2ZW50IG1vZGFsIHRyaWdnZXJzIGZyb20gYWN0aW5nIGxpa2UgbGlua3NcbiAgICAgICAgICAgICAgbW9kYWxUcmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2FuIHVuY29tbWVudCB3aGVuIGFyaWEtaGFzcG9wdXA9XCJkaWFsb2dcIiBpcyBzdXBwb3J0ZWRcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vYTExeXN1cHBvcnQuaW8vdGVjaC9hcmlhL2FyaWEtaGFzcG9wdXBfYXR0cmlidXRlXG4gICAgICAgICAgICAvLyBNb3N0IHNjcmVlbiByZWFkZXJzIHN1cHBvcnQgYXJpYS1oYXNwb3B1cCwgYnV0IG1pZ2h0IGFubm91bmNlXG4gICAgICAgICAgICAvLyBhcyBvcGVuaW5nIGEgbWVudSBpZiBcImRpYWxvZ1wiIGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgICAgICAgICAvLyBtb2RhbFRyaWdnZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1oYXNwb3B1cFwiLCBcImRpYWxvZ1wiKTtcblxuICAgICAgICAgICAgbW9kYWxUcmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0b2dnbGVNb2RhbCk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0ZWFyZG93bihyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoTU9EQUwsIHJvb3QpLmZvckVhY2goKG1vZGFsV2luZG93KSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZGFsSWQgPSBtb2RhbFdpbmRvdy5pZDtcbiAgICAgICAgY2xlYW5VcE1vZGFsKG1vZGFsV2luZG93KTtcblxuICAgICAgICBzZWxlY3RPck1hdGNoZXMoYFthcmlhLWNvbnRyb2xzPVwiJHttb2RhbElkfVwiXWAsIGRvY3VtZW50KS5mb3JFYWNoKFxuICAgICAgICAgIChtb2RhbFRyaWdnZXIpID0+XG4gICAgICAgICAgICBtb2RhbFRyaWdnZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRvZ2dsZU1vZGFsKVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBmb2N1c1RyYXA6IG51bGwsXG4gICAgdG9nZ2xlTW9kYWwsXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWw7XG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcblxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgUkFOR0VfQ0xBU1NOQU1FID0gYCR7UFJFRklYfS1yYW5nZWA7XG5jb25zdCBSQU5HRSA9IGAuJHtSQU5HRV9DTEFTU05BTUV9YDtcblxuLyoqXG4gKiBVcGRhdGUgcmFuZ2UgY2FsbG91dCBmb3Igc2NyZWVuIHJlYWRlcnMgdXNpbmcgdGhlIG9wdGlvbmFsIGRhdGEgYXR0cmlidXRlcy5cbiAqXG4gKiBHZXQgb3B0aW9uYWwgZGF0YSBhdHRyaWJ1dGVzLCBjb25zdHJ1Y3QgYW5kIGFwcGVuZHMgYXJpYS12YWx1ZXRleHQgYXR0cmlidXRlLlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogPGlucHV0IGlkPVwidXNhLXJhbmdlXCIgY2xhc3M9XCJ1c2EtcmFuZ2VcIiB0eXBlPVwicmFuZ2VcIiBtaW49XCIwXCIgbWF4PVwiMTAwXCIgc3RlcD1cIjEwXCIgdmFsdWU9XCIyMFwiIGRhdGEtdGV4dC11bml0PVwiZGVncmVlc1wiPlxuICpcbiAqIENhbGxvdXQgcmV0dXJucyBcIjIwIGRlZ3JlZXMgb2YgMTAwLlwiXG4gKlxuICogPGlucHV0IGlkPVwidXNhLXJhbmdlXCIgY2xhc3M9XCJ1c2EtcmFuZ2VcIiB0eXBlPVwicmFuZ2VcIiBtaW49XCIwXCIgbWF4PVwiMTAwXCIgc3RlcD1cIjEwXCIgdmFsdWU9XCIyMFwiIGRhdGEtdGV4dC1wcmVwb3NpdGlvbj1cImRlXCI+XG4gKlxuICogQ2FsbG91dCByZXR1cm5zIFwiMjAgZGUgMTAwLlwiXG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSB0YXJnZXRSYW5nZSAtIFRoZSByYW5nZSBzbGlkZXIgaW5wdXQgZWxlbWVudFxuICovXG5jb25zdCB1cGRhdGVDYWxsb3V0ID0gKHRhcmdldFJhbmdlKSA9PiB7XG4gIGNvbnN0IHJhbmdlU2xpZGVyID0gdGFyZ2V0UmFuZ2U7XG4gIGNvbnN0IGRlZmF1bHRQcmVwID0gXCJvZlwiO1xuICBjb25zdCBvcHRpb25hbFByZXAgPSByYW5nZVNsaWRlci5kYXRhc2V0LnRleHRQcmVwb3NpdGlvbjtcbiAgY29uc3QgcHJlcCA9IG9wdGlvbmFsUHJlcCB8fCBkZWZhdWx0UHJlcDtcbiAgY29uc3QgdW5pdCA9IHJhbmdlU2xpZGVyLmRhdGFzZXQudGV4dFVuaXQ7XG4gIGNvbnN0IHZhbCA9IHJhbmdlU2xpZGVyLnZhbHVlO1xuICAvLyBOb3RlOiAxMDAgaXMgdGhlIG1heCBhdHRyaWJ1dGUncyBuYXRpdmUgZGVmYXVsdCB2YWx1ZSBvbiByYW5nZSBpbnB1dHNcbiAgLy8gUmVmZXJlbmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0VsZW1lbnQvaW5wdXQvcmFuZ2UjdmFsaWRhdGlvblxuICBjb25zdCBtYXggPSByYW5nZVNsaWRlci5nZXRBdHRyaWJ1dGUoXCJtYXhcIikgfHwgMTAwO1xuXG4gIGxldCBjYWxsb3V0O1xuXG4gIGlmICh1bml0KSB7XG4gICAgY2FsbG91dCA9IGAke3ZhbH0gJHt1bml0fSAke3ByZXB9ICR7bWF4fWA7XG4gIH0gZWxzZSB7XG4gICAgY2FsbG91dCA9IGAke3ZhbH0gJHtwcmVwfSAke21heH1gO1xuICB9XG5cbiAgcmFuZ2VTbGlkZXIuc2V0QXR0cmlidXRlKFwiYXJpYS12YWx1ZXRleHRcIiwgY2FsbG91dCk7XG59O1xuXG5jb25zdCByYW5nZUV2ZW50cyA9IHtcbiAgY2hhbmdlOiB7XG4gICAgW1JBTkdFXSgpIHtcbiAgICAgIHVwZGF0ZUNhbGxvdXQodGhpcyk7XG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IHJhbmdlID0gYmVoYXZpb3IocmFuZ2VFdmVudHMsIHtcbiAgaW5pdChyb290KSB7XG4gICAgc2VsZWN0T3JNYXRjaGVzKFJBTkdFLCByb290KS5mb3JFYWNoKChyYW5nZVNsaWRlcikgPT4ge1xuICAgICAgdXBkYXRlQ2FsbG91dChyYW5nZVNsaWRlcik7XG4gICAgfSk7XG4gIH0sXG4gIHVwZGF0ZUNhbGxvdXQsXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSByYW5nZTtcbiIsImNvbnN0IGlnbm9yZSA9IHJlcXVpcmUoXCJyZWNlcHRvci9pZ25vcmVcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5cbmNvbnN0IEJVVFRPTiA9IFwiLmpzLXNlYXJjaC1idXR0b25cIjtcbmNvbnN0IEZPUk0gPSBcIi5qcy1zZWFyY2gtZm9ybVwiO1xuY29uc3QgSU5QVVQgPSBcIlt0eXBlPXNlYXJjaF1cIjtcbmNvbnN0IENPTlRFWFQgPSBcImhlYWRlclwiOyAvLyBYWFhcblxubGV0IGxhc3RCdXR0b247XG5cbmNvbnN0IGdldEZvcm0gPSAoYnV0dG9uKSA9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSBidXR0b24uY2xvc2VzdChDT05URVhUKTtcbiAgcmV0dXJuIGNvbnRleHQgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3IoRk9STSkgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKEZPUk0pO1xufTtcblxuY29uc3QgdG9nZ2xlU2VhcmNoID0gKGJ1dHRvbiwgYWN0aXZlKSA9PiB7XG4gIGNvbnN0IGZvcm0gPSBnZXRGb3JtKGJ1dHRvbik7XG5cbiAgaWYgKCFmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyAke0ZPUk19IGZvdW5kIGZvciBzZWFyY2ggdG9nZ2xlIGluICR7Q09OVEVYVH0hYCk7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICBidXR0b24uaGlkZGVuID0gYWN0aXZlO1xuICBmb3JtLmhpZGRlbiA9ICFhY3RpdmU7XG4gIC8qIGVzbGludC1lbmFibGUgKi9cblxuICBpZiAoIWFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGlucHV0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKElOUFVUKTtcblxuICBpZiAoaW5wdXQpIHtcbiAgICBpbnB1dC5mb2N1cygpO1xuICB9XG4gIC8vIHdoZW4gdGhlIHVzZXIgY2xpY2tzIF9vdXRzaWRlXyBvZiB0aGUgZm9ybSB3L2lnbm9yZSgpOiBoaWRlIHRoZVxuICAvLyBzZWFyY2gsIHRoZW4gcmVtb3ZlIHRoZSBsaXN0ZW5lclxuICBjb25zdCBsaXN0ZW5lciA9IGlnbm9yZShmb3JtLCAoKSA9PiB7XG4gICAgaWYgKGxhc3RCdXR0b24pIHtcbiAgICAgIGhpZGVTZWFyY2guY2FsbChsYXN0QnV0dG9uKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICAgIH1cblxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihDTElDSywgbGlzdGVuZXIpO1xuICB9KTtcblxuICAvLyBOb3JtYWxseSB3ZSB3b3VsZCBqdXN0IHJ1biB0aGlzIGNvZGUgd2l0aG91dCBhIHRpbWVvdXQsIGJ1dFxuICAvLyBJRTExIGFuZCBFZGdlIHdpbGwgYWN0dWFsbHkgY2FsbCB0aGUgbGlzdGVuZXIgKmltbWVkaWF0ZWx5KiBiZWNhdXNlXG4gIC8vIHRoZXkgYXJlIGN1cnJlbnRseSBoYW5kbGluZyB0aGlzIGV4YWN0IHR5cGUgb2YgZXZlbnQsIHNvIHdlJ2xsXG4gIC8vIG1ha2Ugc3VyZSB0aGUgYnJvd3NlciBpcyBkb25lIGhhbmRsaW5nIHRoZSBjdXJyZW50IGNsaWNrIGV2ZW50LFxuICAvLyBpZiBhbnksIGJlZm9yZSB3ZSBhdHRhY2ggdGhlIGxpc3RlbmVyLlxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoQ0xJQ0ssIGxpc3RlbmVyKTtcbiAgfSwgMCk7XG59O1xuXG5mdW5jdGlvbiBzaG93U2VhcmNoKCkge1xuICB0b2dnbGVTZWFyY2godGhpcywgdHJ1ZSk7XG4gIGxhc3RCdXR0b24gPSB0aGlzO1xufVxuXG5mdW5jdGlvbiBoaWRlU2VhcmNoKCkge1xuICB0b2dnbGVTZWFyY2godGhpcywgZmFsc2UpO1xuICBsYXN0QnV0dG9uID0gdW5kZWZpbmVkO1xufVxuXG5jb25zdCBzZWFyY2ggPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtCVVRUT05dOiBzaG93U2VhcmNoLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHRhcmdldCkge1xuICAgICAgc2VsZWN0KEJVVFRPTiwgdGFyZ2V0KS5mb3JFYWNoKChidXR0b24pID0+IHtcbiAgICAgICAgdG9nZ2xlU2VhcmNoKGJ1dHRvbiwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIC8vIGZvcmdldCB0aGUgbGFzdCBidXR0b24gY2xpY2tlZFxuICAgICAgbGFzdEJ1dHRvbiA9IHVuZGVmaW5lZDtcbiAgICB9LFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlYXJjaDtcbiIsImNvbnN0IG9uY2UgPSByZXF1aXJlKFwicmVjZXB0b3Ivb25jZVwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IExJTksgPSBgLiR7UFJFRklYfS1za2lwbmF2W2hyZWZePVwiI1wiXSwgLiR7UFJFRklYfS1mb290ZXJfX3JldHVybi10by10b3AgW2hyZWZePVwiI1wiXWA7XG5jb25zdCBNQUlOQ09OVEVOVCA9IFwibWFpbi1jb250ZW50XCI7XG5cbmZ1bmN0aW9uIHNldFRhYmluZGV4KCkge1xuICAvLyBOQjogd2Uga25vdyBiZWNhdXNlIG9mIHRoZSBzZWxlY3RvciB3ZSdyZSBkZWxlZ2F0aW5nIHRvIGJlbG93IHRoYXQgdGhlXG4gIC8vIGhyZWYgYWxyZWFkeSBiZWdpbnMgd2l0aCAnIydcbiAgY29uc3QgaWQgPSBlbmNvZGVVUkkodGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpKTtcbiAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gICAgaWQgPT09IFwiI1wiID8gTUFJTkNPTlRFTlQgOiBpZC5zbGljZSgxKVxuICApO1xuXG4gIGlmICh0YXJnZXQpIHtcbiAgICB0YXJnZXQuc3R5bGUub3V0bGluZSA9IFwiMFwiO1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAwKTtcbiAgICB0YXJnZXQuZm9jdXMoKTtcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgIFwiYmx1clwiLFxuICAgICAgb25jZSgoKSA9PiB7XG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XG4gICAgICB9KVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdGhyb3cgYW4gZXJyb3I/XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiZWhhdmlvcih7XG4gIFtDTElDS106IHtcbiAgICBbTElOS106IHNldFRhYmluZGV4LFxuICB9LFxufSk7XG4iLCJjb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XG5cbmNvbnN0IFRBQkxFID0gYC4ke1BSRUZJWH0tdGFibGVgO1xuY29uc3QgU09SVEVEID0gXCJhcmlhLXNvcnRcIjtcbmNvbnN0IEFTQ0VORElORyA9IFwiYXNjZW5kaW5nXCI7XG5jb25zdCBERVNDRU5ESU5HID0gXCJkZXNjZW5kaW5nXCI7XG5jb25zdCBTT1JUX09WRVJSSURFID0gXCJkYXRhLXNvcnQtdmFsdWVcIjtcbmNvbnN0IFNPUlRfQlVUVE9OX0NMQVNTID0gYCR7UFJFRklYfS10YWJsZV9faGVhZGVyX19idXR0b25gO1xuY29uc3QgU09SVF9CVVRUT04gPSBgLiR7U09SVF9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IFNPUlRBQkxFX0hFQURFUiA9IGB0aFtkYXRhLXNvcnRhYmxlXWA7XG5jb25zdCBBTk5PVU5DRU1FTlRfUkVHSU9OID0gYC4ke1BSRUZJWH0tdGFibGVfX2Fubm91bmNlbWVudC1yZWdpb25bYXJpYS1saXZlPVwicG9saXRlXCJdYDtcblxuLyoqIEdldHMgdGhlIGRhdGEtc29ydC12YWx1ZSBhdHRyaWJ1dGUgdmFsdWUsIGlmIHByb3ZpZGVkIOKAlCBvdGhlcndpc2UsIGdldHNcbiAqIHRoZSBpbm5lclRleHQgb3IgdGV4dENvbnRlbnQg4oCUIG9mIHRoZSBjaGlsZCBlbGVtZW50IChIVE1MVGFibGVDZWxsRWxlbWVudClcbiAqIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggb2YgdGhlIGdpdmVuIHRhYmxlIHJvd1xuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHthcnJheTxIVE1MVGFibGVSb3dFbGVtZW50Pn0gdHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGdldENlbGxWYWx1ZSA9ICh0ciwgaW5kZXgpID0+XG4gIHRyLmNoaWxkcmVuW2luZGV4XS5nZXRBdHRyaWJ1dGUoU09SVF9PVkVSUklERSkgfHxcbiAgdHIuY2hpbGRyZW5baW5kZXhdLmlubmVyVGV4dCB8fFxuICB0ci5jaGlsZHJlbltpbmRleF0udGV4dENvbnRlbnQ7XG5cbi8qKlxuICogQ29tcGFyZXMgdGhlIHZhbHVlcyBvZiB0d28gcm93IGFycmF5IGl0ZW1zIGF0IHRoZSBnaXZlbiBpbmRleCwgdGhlbiBzb3J0cyBieSB0aGUgZ2l2ZW4gZGlyZWN0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb25cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGNvbXBhcmVGdW5jdGlvbiA9IChpbmRleCwgaXNBc2NlbmRpbmcpID0+ICh0aGlzUm93LCBuZXh0Um93KSA9PiB7XG4gIC8vIGdldCB2YWx1ZXMgdG8gY29tcGFyZSBmcm9tIGRhdGEgYXR0cmlidXRlIG9yIGNlbGwgY29udGVudFxuICBjb25zdCB2YWx1ZTEgPSBnZXRDZWxsVmFsdWUoaXNBc2NlbmRpbmcgPyB0aGlzUm93IDogbmV4dFJvdywgaW5kZXgpO1xuICBjb25zdCB2YWx1ZTIgPSBnZXRDZWxsVmFsdWUoaXNBc2NlbmRpbmcgPyBuZXh0Um93IDogdGhpc1JvdywgaW5kZXgpO1xuXG4gIC8vIGlmIG5laXRoZXIgdmFsdWUgaXMgZW1wdHksIGFuZCBpZiBib3RoIHZhbHVlcyBhcmUgYWxyZWFkeSBudW1iZXJzLCBjb21wYXJlIG51bWVyaWNhbGx5XG4gIGlmIChcbiAgICB2YWx1ZTEgJiZcbiAgICB2YWx1ZTIgJiZcbiAgICAhTnVtYmVyLmlzTmFOKE51bWJlcih2YWx1ZTEpKSAmJlxuICAgICFOdW1iZXIuaXNOYU4oTnVtYmVyKHZhbHVlMikpXG4gICkge1xuICAgIHJldHVybiB2YWx1ZTEgLSB2YWx1ZTI7XG4gIH1cbiAgLy8gT3RoZXJ3aXNlLCBjb21wYXJlIGFscGhhYmV0aWNhbGx5IGJhc2VkIG9uIGN1cnJlbnQgdXNlciBsb2NhbGVcbiAgcmV0dXJuIHZhbHVlMS50b1N0cmluZygpLmxvY2FsZUNvbXBhcmUodmFsdWUyLCBuYXZpZ2F0b3IubGFuZ3VhZ2UsIHtcbiAgICBudW1lcmljOiB0cnVlLFxuICAgIGlnbm9yZVB1bmN0dWF0aW9uOiB0cnVlLFxuICB9KTtcbn07XG5cbi8qKlxuICogR2V0IGFuIEFycmF5IG9mIGNvbHVtbiBoZWFkZXJzIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIHRhYmxlIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUVsZW1lbnR9IHRhYmxlXG4gKiBAcmV0dXJuIHthcnJheTxIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudD59XG4gKi9cbmNvbnN0IGdldENvbHVtbkhlYWRlcnMgPSAodGFibGUpID0+IHtcbiAgY29uc3QgaGVhZGVycyA9IHNlbGVjdChTT1JUQUJMRV9IRUFERVIsIHRhYmxlKTtcbiAgcmV0dXJuIGhlYWRlcnMuZmlsdGVyKChoZWFkZXIpID0+IGhlYWRlci5jbG9zZXN0KFRBQkxFKSA9PT0gdGFibGUpO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGJ1dHRvbiBsYWJlbCB3aXRoaW4gdGhlIGdpdmVuIGhlYWRlciBlbGVtZW50LCByZXNldHRpbmcgaXRcbiAqIHRvIHRoZSBkZWZhdWx0IHN0YXRlIChyZWFkeSB0byBzb3J0IGFzY2VuZGluZykgaWYgaXQncyBubyBsb25nZXIgc29ydGVkXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50fSBoZWFkZXJcbiAqL1xuY29uc3QgdXBkYXRlU29ydExhYmVsID0gKGhlYWRlcikgPT4ge1xuICBjb25zdCBoZWFkZXJOYW1lID0gaGVhZGVyLmlubmVyVGV4dDtcbiAgY29uc3Qgc29ydGVkQXNjZW5kaW5nID0gaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkc7XG4gIGNvbnN0IGlzU29ydGVkID1cbiAgICBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IEFTQ0VORElORyB8fFxuICAgIGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gREVTQ0VORElORyB8fFxuICAgIGZhbHNlO1xuICBjb25zdCBoZWFkZXJMYWJlbCA9IGAke2hlYWRlck5hbWV9LCBzb3J0YWJsZSBjb2x1bW4sIGN1cnJlbnRseSAke1xuICAgIGlzU29ydGVkXG4gICAgICA/IGAke3NvcnRlZEFzY2VuZGluZyA/IGBzb3J0ZWQgJHtBU0NFTkRJTkd9YCA6IGBzb3J0ZWQgJHtERVNDRU5ESU5HfWB9YFxuICAgICAgOiBcInVuc29ydGVkXCJcbiAgfWA7XG4gIGNvbnN0IGhlYWRlckJ1dHRvbkxhYmVsID0gYENsaWNrIHRvIHNvcnQgYnkgJHtoZWFkZXJOYW1lfSBpbiAke1xuICAgIHNvcnRlZEFzY2VuZGluZyA/IERFU0NFTkRJTkcgOiBBU0NFTkRJTkdcbiAgfSBvcmRlci5gO1xuICBoZWFkZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBoZWFkZXJMYWJlbCk7XG4gIGhlYWRlci5xdWVyeVNlbGVjdG9yKFNPUlRfQlVUVE9OKS5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCBoZWFkZXJCdXR0b25MYWJlbCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgYXJpYS1zb3J0IGF0dHJpYnV0ZSBvbiB0aGUgZ2l2ZW4gaGVhZGVyIGVsZW1lbnQsIGFuZCByZXNldCB0aGUgbGFiZWwgYW5kIGJ1dHRvbiBpY29uXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50fSBoZWFkZXJcbiAqL1xuY29uc3QgdW5zZXRTb3J0ID0gKGhlYWRlcikgPT4ge1xuICBoZWFkZXIucmVtb3ZlQXR0cmlidXRlKFNPUlRFRCk7XG4gIHVwZGF0ZVNvcnRMYWJlbChoZWFkZXIpO1xufTtcblxuLyoqXG4gKiBTb3J0IHJvd3MgZWl0aGVyIGFzY2VuZGluZyBvciBkZXNjZW5kaW5nLCBiYXNlZCBvbiBhIGdpdmVuIGhlYWRlcidzIGFyaWEtc29ydCBhdHRyaWJ1dGVcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxuICogQHBhcmFtIHtib29sZWFufSBpc0FzY2VuZGluZ1xuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZVxuICovXG5jb25zdCBzb3J0Um93cyA9IChoZWFkZXIsIGlzQXNjZW5kaW5nKSA9PiB7XG4gIGhlYWRlci5zZXRBdHRyaWJ1dGUoU09SVEVELCBpc0FzY2VuZGluZyA9PT0gdHJ1ZSA/IERFU0NFTkRJTkcgOiBBU0NFTkRJTkcpO1xuICB1cGRhdGVTb3J0TGFiZWwoaGVhZGVyKTtcblxuICBjb25zdCB0Ym9keSA9IGhlYWRlci5jbG9zZXN0KFRBQkxFKS5xdWVyeVNlbGVjdG9yKFwidGJvZHlcIik7XG5cbiAgLy8gV2UgY2FuIHVzZSBBcnJheS5mcm9tKCkgYW5kIEFycmF5LnNvcnQoKSBpbnN0ZWFkIG9uY2Ugd2UgZHJvcCBJRTExIHN1cHBvcnQsIGxpa2VseSBpbiB0aGUgc3VtbWVyIG9mIDIwMjFcbiAgLy9cbiAgLy8gQXJyYXkuZnJvbSh0Ym9keS5xdWVyeVNlbGVjdG9yQWxsKCd0cicpLnNvcnQoXG4gIC8vICAgY29tcGFyZUZ1bmN0aW9uKFxuICAvLyAgICAgQXJyYXkuZnJvbShoZWFkZXIucGFyZW50Tm9kZS5jaGlsZHJlbikuaW5kZXhPZihoZWFkZXIpLFxuICAvLyAgICAgIWlzQXNjZW5kaW5nKVxuICAvLyAgIClcbiAgLy8gLmZvckVhY2godHIgPT4gdGJvZHkuYXBwZW5kQ2hpbGQodHIpICk7XG5cbiAgLy8gW10uc2xpY2UuY2FsbCgpIHR1cm5zIGFycmF5LWxpa2Ugc2V0cyBpbnRvIHRydWUgYXJyYXlzIHNvIHRoYXQgd2UgY2FuIHNvcnQgdGhlbVxuICBjb25zdCBhbGxSb3dzID0gW10uc2xpY2UuY2FsbCh0Ym9keS5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIikpO1xuICBjb25zdCBhbGxIZWFkZXJzID0gW10uc2xpY2UuY2FsbChoZWFkZXIucGFyZW50Tm9kZS5jaGlsZHJlbik7XG4gIGNvbnN0IHRoaXNIZWFkZXJJbmRleCA9IGFsbEhlYWRlcnMuaW5kZXhPZihoZWFkZXIpO1xuICBhbGxSb3dzLnNvcnQoY29tcGFyZUZ1bmN0aW9uKHRoaXNIZWFkZXJJbmRleCwgIWlzQXNjZW5kaW5nKSkuZm9yRWFjaCgodHIpID0+IHtcbiAgICBbXS5zbGljZVxuICAgICAgLmNhbGwodHIuY2hpbGRyZW4pXG4gICAgICAuZm9yRWFjaCgodGQpID0+IHRkLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc29ydC1hY3RpdmVcIikpO1xuICAgIHRyLmNoaWxkcmVuW3RoaXNIZWFkZXJJbmRleF0uc2V0QXR0cmlidXRlKFwiZGF0YS1zb3J0LWFjdGl2ZVwiLCB0cnVlKTtcbiAgICB0Ym9keS5hcHBlbmRDaGlsZCh0cik7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGxpdmUgcmVnaW9uIGltbWVkaWF0ZWx5IGZvbGxvd2luZyB0aGUgdGFibGUgd2hlbmV2ZXIgc29ydCBjaGFuZ2VzLlxuICogQHBhcmFtIHtIVE1MVGFibGVFbGVtZW50fSB0YWJsZVxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gc29ydGVkSGVhZGVyXG4gKi9cblxuY29uc3QgdXBkYXRlTGl2ZVJlZ2lvbiA9ICh0YWJsZSwgc29ydGVkSGVhZGVyKSA9PiB7XG4gIGNvbnN0IGNhcHRpb24gPSB0YWJsZS5xdWVyeVNlbGVjdG9yKFwiY2FwdGlvblwiKS5pbm5lclRleHQ7XG4gIGNvbnN0IHNvcnRlZEFzY2VuZGluZyA9IHNvcnRlZEhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gQVNDRU5ESU5HO1xuICBjb25zdCBoZWFkZXJMYWJlbCA9IHNvcnRlZEhlYWRlci5pbm5lclRleHQ7XG4gIGNvbnN0IGxpdmVSZWdpb24gPSB0YWJsZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gIGlmIChsaXZlUmVnaW9uICYmIGxpdmVSZWdpb24ubWF0Y2hlcyhBTk5PVU5DRU1FTlRfUkVHSU9OKSkge1xuICAgIGNvbnN0IHNvcnRBbm5vdW5jZW1lbnQgPSBgVGhlIHRhYmxlIG5hbWVkIFwiJHtjYXB0aW9ufVwiIGlzIG5vdyBzb3J0ZWQgYnkgJHtoZWFkZXJMYWJlbH0gaW4gJHtcbiAgICAgIHNvcnRlZEFzY2VuZGluZyA/IEFTQ0VORElORyA6IERFU0NFTkRJTkdcbiAgICB9IG9yZGVyLmA7XG4gICAgbGl2ZVJlZ2lvbi5pbm5lclRleHQgPSBzb3J0QW5ub3VuY2VtZW50O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBUYWJsZSBjb250YWluaW5nIGEgc29ydGFibGUgY29sdW1uIGhlYWRlciBpcyBub3QgZm9sbG93ZWQgYnkgYW4gYXJpYS1saXZlIHJlZ2lvbi5gXG4gICAgKTtcbiAgfVxufTtcblxuLyoqXG4gKiBUb2dnbGUgYSBoZWFkZXIncyBzb3J0IHN0YXRlLCBvcHRpb25hbGx5IHByb3ZpZGluZyBhIHRhcmdldFxuICogc3RhdGUuXG4gKlxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBpc0FzY2VuZGluZyBJZiBubyBzdGF0ZSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnRcbiAqIHN0YXRlIHdpbGwgYmUgdG9nZ2xlZCAoZnJvbSBmYWxzZSB0byB0cnVlLCBhbmQgdmljZS12ZXJzYSkuXG4gKi9cbmNvbnN0IHRvZ2dsZVNvcnQgPSAoaGVhZGVyLCBpc0FzY2VuZGluZykgPT4ge1xuICBjb25zdCB0YWJsZSA9IGhlYWRlci5jbG9zZXN0KFRBQkxFKTtcbiAgbGV0IHNhZmVBc2NlbmRpbmcgPSBpc0FzY2VuZGluZztcbiAgaWYgKHR5cGVvZiBzYWZlQXNjZW5kaW5nICE9PSBcImJvb2xlYW5cIikge1xuICAgIHNhZmVBc2NlbmRpbmcgPSBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IEFTQ0VORElORztcbiAgfVxuXG4gIGlmICghdGFibGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7U09SVEFCTEVfSEVBREVSfSBpcyBtaXNzaW5nIG91dGVyICR7VEFCTEV9YCk7XG4gIH1cblxuICBzYWZlQXNjZW5kaW5nID0gc29ydFJvd3MoaGVhZGVyLCBpc0FzY2VuZGluZyk7XG5cbiAgaWYgKHNhZmVBc2NlbmRpbmcpIHtcbiAgICBnZXRDb2x1bW5IZWFkZXJzKHRhYmxlKS5mb3JFYWNoKChvdGhlckhlYWRlcikgPT4ge1xuICAgICAgaWYgKG90aGVySGVhZGVyICE9PSBoZWFkZXIpIHtcbiAgICAgICAgdW5zZXRTb3J0KG90aGVySGVhZGVyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB1cGRhdGVMaXZlUmVnaW9uKHRhYmxlLCBoZWFkZXIpO1xuICB9XG59O1xuXG4vKipcbiAqKiBJbnNlcnRzIGEgYnV0dG9uIHdpdGggaWNvbiBpbnNpZGUgYSBzb3J0YWJsZSBoZWFkZXJcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxuICovXG5cbmNvbnN0IGNyZWF0ZUhlYWRlckJ1dHRvbiA9IChoZWFkZXIpID0+IHtcbiAgY29uc3QgYnV0dG9uRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidXR0b25FbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gIGJ1dHRvbkVsLmNsYXNzTGlzdC5hZGQoU09SVF9CVVRUT05fQ0xBU1MpO1xuICAvLyBJQ09OX1NPVVJDRVxuICBidXR0b25FbC5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBcbiAgPHN2ZyBjbGFzcz1cIiR7UFJFRklYfS1pY29uXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8ZyBjbGFzcz1cImRlc2NlbmRpbmdcIiBmaWxsPVwidHJhbnNwYXJlbnRcIj5cbiAgICAgIDxwYXRoIGQ9XCJNMTcgMTdMMTUuNTkgMTUuNTlMMTIuOTk5OSAxOC4xN1YySDEwLjk5OTlWMTguMTdMOC40MSAxNS41OEw3IDE3TDExLjk5OTkgMjJMMTcgMTdaXCIgLz5cbiAgICA8L2c+XG4gICAgPGcgY2xhc3M9XCJhc2NlbmRpbmdcIiBmaWxsPVwidHJhbnNwYXJlbnRcIj5cbiAgICAgIDxwYXRoIHRyYW5zZm9ybT1cInJvdGF0ZSgxODAsIDEyLCAxMilcIiBkPVwiTTE3IDE3TDE1LjU5IDE1LjU5TDEyLjk5OTkgMTguMTdWMkgxMC45OTk5VjE4LjE3TDguNDEgMTUuNThMNyAxN0wxMS45OTk5IDIyTDE3IDE3WlwiIC8+XG4gICAgPC9nPlxuICAgIDxnIGNsYXNzPVwidW5zb3J0ZWRcIiBmaWxsPVwidHJhbnNwYXJlbnRcIj5cbiAgICAgIDxwb2x5Z29uIHBvaW50cz1cIjE1LjE3IDE1IDEzIDE3LjE3IDEzIDYuODMgMTUuMTcgOSAxNi41OCA3LjU5IDEyIDMgNy40MSA3LjU5IDguODMgOSAxMSA2LjgzIDExIDE3LjE3IDguODMgMTUgNy40MiAxNi40MSAxMiAyMSAxNi41OSAxNi40MSAxNS4xNyAxNVwiLz5cbiAgICA8L2c+XG4gIDwvc3ZnPlxuICBgO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQoYnV0dG9uRWwpO1xuICB1cGRhdGVTb3J0TGFiZWwoaGVhZGVyKTtcbn07XG5cbmNvbnN0IHRhYmxlID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbU09SVF9CVVRUT05dKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRvZ2dsZVNvcnQoXG4gICAgICAgICAgZXZlbnQudGFyZ2V0LmNsb3Nlc3QoU09SVEFCTEVfSEVBREVSKSxcbiAgICAgICAgICBldmVudC50YXJnZXQuY2xvc2VzdChTT1JUQUJMRV9IRUFERVIpLmdldEF0dHJpYnV0ZShTT1JURUQpID09PVxuICAgICAgICAgICAgQVNDRU5ESU5HXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIGNvbnN0IHNvcnRhYmxlSGVhZGVycyA9IHNlbGVjdChTT1JUQUJMRV9IRUFERVIsIHJvb3QpO1xuICAgICAgc29ydGFibGVIZWFkZXJzLmZvckVhY2goKGhlYWRlcikgPT4gY3JlYXRlSGVhZGVyQnV0dG9uKGhlYWRlcikpO1xuXG4gICAgICBjb25zdCBmaXJzdFNvcnRlZCA9IHNvcnRhYmxlSGVhZGVycy5maWx0ZXIoXG4gICAgICAgIChoZWFkZXIpID0+XG4gICAgICAgICAgaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkcgfHxcbiAgICAgICAgICBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IERFU0NFTkRJTkdcbiAgICAgIClbMF07XG4gICAgICBpZiAodHlwZW9mIGZpcnN0U29ydGVkID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG5vIHNvcnRhYmxlIGhlYWRlcnMgZm91bmRcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qgc29ydERpciA9IGZpcnN0U29ydGVkLmdldEF0dHJpYnV0ZShTT1JURUQpO1xuICAgICAgaWYgKHNvcnREaXIgPT09IEFTQ0VORElORykge1xuICAgICAgICB0b2dnbGVTb3J0KGZpcnN0U29ydGVkLCB0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc29ydERpciA9PT0gREVTQ0VORElORykge1xuICAgICAgICB0b2dnbGVTb3J0KGZpcnN0U29ydGVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBUQUJMRSxcbiAgICBTT1JUQUJMRV9IRUFERVIsXG4gICAgU09SVF9CVVRUT04sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gdGFibGU7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7XG4gIENPTUJPX0JPWF9DTEFTUyxcbiAgZW5oYW5jZUNvbWJvQm94LFxufSA9IHJlcXVpcmUoXCIuLi8uLi91c2EtY29tYm8tYm94L3NyYy9pbmRleFwiKTtcblxuY29uc3QgVElNRV9QSUNLRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LXRpbWUtcGlja2VyYDtcbmNvbnN0IFRJTUVfUElDS0VSID0gYC4ke1RJTUVfUElDS0VSX0NMQVNTfWA7XG5jb25zdCBNQVhfVElNRSA9IDYwICogMjQgLSAxO1xuY29uc3QgTUlOX1RJTUUgPSAwO1xuY29uc3QgREVGQVVMVF9TVEVQID0gMzA7XG5jb25zdCBNSU5fU1RFUCA9IDE7XG5cbmNvbnN0IEZJTFRFUl9EQVRBU0VUID0ge1xuICBmaWx0ZXI6XG4gICAgXCIwP3t7IGhvdXJRdWVyeUZpbHRlciB9fTp7e21pbnV0ZVF1ZXJ5RmlsdGVyfX0uKnt7IGFwUXVlcnlGaWx0ZXIgfX1tP1wiLFxuICBhcFF1ZXJ5RmlsdGVyOiBcIihbYXBdKVwiLFxuICBob3VyUXVlcnlGaWx0ZXI6IFwiKFsxLTldWzAtMl0/KVwiLFxuICBtaW51dGVRdWVyeUZpbHRlcjogXCJbXFxcXGRdKzooWzAtOV17MCwyfSlcIixcbn07XG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgb2YgaGg6bW0gaW50byBtaW51dGVzXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRpbWVTdHIgdGhlIHRpbWUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgbnVtYmVyIG9mIG1pbnV0ZXNcbiAqL1xuY29uc3QgcGFyc2VUaW1lU3RyaW5nID0gKHRpbWVTdHIpID0+IHtcbiAgbGV0IG1pbnV0ZXM7XG5cbiAgaWYgKHRpbWVTdHIpIHtcbiAgICBjb25zdCBbaG91cnMsIG1pbnNdID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKChzdHIpID0+IHtcbiAgICAgIGxldCB2YWx1ZTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KHN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkgdmFsdWUgPSBwYXJzZWQ7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBpZiAoaG91cnMgIT0gbnVsbCAmJiBtaW5zICE9IG51bGwpIHtcbiAgICAgIG1pbnV0ZXMgPSBob3VycyAqIDYwICsgbWlucztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWludXRlcztcbn07XG5cbi8qKlxuICogRW5oYW5jZSBhbiBpbnB1dCB3aXRoIHRoZSBkYXRlIHBpY2tlciBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBpbml0aWFsIHdyYXBwaW5nIGVsZW1lbnQgb2YgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCB0cmFuc2Zvcm1UaW1lUGlja2VyID0gKGVsKSA9PiB7XG4gIGNvbnN0IHRpbWVQaWNrZXJFbCA9IGVsLmNsb3Nlc3QoVElNRV9QSUNLRVIpO1xuXG4gIGNvbnN0IGluaXRpYWxJbnB1dEVsID0gdGltZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoYGlucHV0YCk7XG5cbiAgaWYgKCFpbml0aWFsSW5wdXRFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtUSU1FX1BJQ0tFUn0gaXMgbWlzc2luZyBpbm5lciBpbnB1dGApO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpO1xuXG4gIFtcbiAgICBcImlkXCIsXG4gICAgXCJuYW1lXCIsXG4gICAgXCJyZXF1aXJlZFwiLFxuICAgIFwiYXJpYS1sYWJlbFwiLFxuICAgIFwiYXJpYS1sYWJlbGxlZGJ5XCIsXG4gICAgXCJkaXNhYmxlZFwiLFxuICAgIFwiYXJpYS1kaXNhYmxlZFwiLFxuICBdLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICBpZiAoaW5pdGlhbElucHV0RWwuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxJbnB1dEVsLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIHNlbGVjdEVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICBpbml0aWFsSW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBwYWRaZXJvcyA9ICh2YWx1ZSwgbGVuZ3RoKSA9PiBgMDAwMCR7dmFsdWV9YC5zbGljZSgtbGVuZ3RoKTtcblxuICBjb25zdCBnZXRUaW1lQ29udGV4dCA9IChtaW51dGVzKSA9PiB7XG4gICAgY29uc3QgbWludXRlID0gbWludXRlcyAlIDYwO1xuICAgIGNvbnN0IGhvdXIyNCA9IE1hdGguZmxvb3IobWludXRlcyAvIDYwKTtcbiAgICBjb25zdCBob3VyMTIgPSBob3VyMjQgJSAxMiB8fCAxMjtcbiAgICBjb25zdCBhbXBtID0gaG91cjI0IDwgMTIgPyBcImFtXCIgOiBcInBtXCI7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWludXRlLFxuICAgICAgaG91cjI0LFxuICAgICAgaG91cjEyLFxuICAgICAgYW1wbSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IG1pblRpbWUgPSBNYXRoLm1heChcbiAgICBNSU5fVElNRSxcbiAgICBwYXJzZVRpbWVTdHJpbmcodGltZVBpY2tlckVsLmRhdGFzZXQubWluVGltZSkgfHwgTUlOX1RJTUVcbiAgKTtcbiAgY29uc3QgbWF4VGltZSA9IE1hdGgubWluKFxuICAgIE1BWF9USU1FLFxuICAgIHBhcnNlVGltZVN0cmluZyh0aW1lUGlja2VyRWwuZGF0YXNldC5tYXhUaW1lKSB8fCBNQVhfVElNRVxuICApO1xuICBjb25zdCBzdGVwID0gTWF0aC5mbG9vcihcbiAgICBNYXRoLm1heChNSU5fU1RFUCwgdGltZVBpY2tlckVsLmRhdGFzZXQuc3RlcCB8fCBERUZBVUxUX1NURVApXG4gICk7XG5cbiAgbGV0IGRlZmF1bHRWYWx1ZTtcbiAgZm9yIChsZXQgdGltZSA9IG1pblRpbWU7IHRpbWUgPD0gbWF4VGltZTsgdGltZSArPSBzdGVwKSB7XG4gICAgY29uc3QgeyBtaW51dGUsIGhvdXIyNCwgaG91cjEyLCBhbXBtIH0gPSBnZXRUaW1lQ29udGV4dCh0aW1lKTtcblxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XG4gICAgb3B0aW9uLnZhbHVlID0gYCR7cGFkWmVyb3MoaG91cjI0LCAyKX06JHtwYWRaZXJvcyhtaW51dGUsIDIpfWA7XG4gICAgb3B0aW9uLnRleHQgPSBgJHtob3VyMTJ9OiR7cGFkWmVyb3MobWludXRlLCAyKX0ke2FtcG19YDtcbiAgICBpZiAob3B0aW9uLnRleHQgPT09IGluaXRpYWxJbnB1dEVsLnZhbHVlKSB7XG4gICAgICBkZWZhdWx0VmFsdWUgPSBvcHRpb24udmFsdWU7XG4gICAgfVxuICAgIHNlbGVjdEVsLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cblxuICB0aW1lUGlja2VyRWwuY2xhc3NMaXN0LmFkZChDT01CT19CT1hfQ0xBU1MpO1xuXG4gIC8vIGNvbWJvIGJveCBwcm9wZXJ0aWVzXG4gIE9iamVjdC5rZXlzKEZJTFRFUl9EQVRBU0VUKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICB0aW1lUGlja2VyRWwuZGF0YXNldFtrZXldID0gRklMVEVSX0RBVEFTRVRba2V5XTtcbiAgfSk7XG4gIHRpbWVQaWNrZXJFbC5kYXRhc2V0LmRpc2FibGVGaWx0ZXJpbmcgPSBcInRydWVcIjtcbiAgdGltZVBpY2tlckVsLmRhdGFzZXQuZGVmYXVsdFZhbHVlID0gZGVmYXVsdFZhbHVlO1xuXG4gIHRpbWVQaWNrZXJFbC5hcHBlbmRDaGlsZChzZWxlY3RFbCk7XG4gIGluaXRpYWxJbnB1dEVsLnJlbW92ZSgpO1xufTtcblxuY29uc3QgdGltZVBpY2tlciA9IGJlaGF2aW9yKFxuICB7fSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKFRJTUVfUElDS0VSLCByb290KS5mb3JFYWNoKCh0aW1lUGlja2VyRWwpID0+IHtcbiAgICAgICAgdHJhbnNmb3JtVGltZVBpY2tlcih0aW1lUGlja2VyRWwpO1xuICAgICAgICBlbmhhbmNlQ29tYm9Cb3godGltZVBpY2tlckVsKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgRklMVEVSX0RBVEFTRVQsXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gdGltZVBpY2tlcjtcbiIsIi8vIFRvb2x0aXBzXG5jb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCBpc0VsZW1lbnRJblZpZXdwb3J0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0XCIpO1xuXG5jb25zdCBUT09MVElQID0gYC4ke1BSRUZJWH0tdG9vbHRpcGA7XG5jb25zdCBUT09MVElQX1RSSUdHRVIgPSBgLiR7UFJFRklYfS10b29sdGlwX190cmlnZ2VyYDtcbmNvbnN0IFRPT0xUSVBfVFJJR0dFUl9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcF9fdHJpZ2dlcmA7XG5jb25zdCBUT09MVElQX0NMQVNTID0gYCR7UFJFRklYfS10b29sdGlwYDtcbmNvbnN0IFRPT0xUSVBfQk9EWV9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcF9fYm9keWA7XG5jb25zdCBTRVRfQ0xBU1MgPSBcImlzLXNldFwiO1xuY29uc3QgVklTSUJMRV9DTEFTUyA9IFwiaXMtdmlzaWJsZVwiO1xuY29uc3QgVFJJQU5HTEVfU0laRSA9IDU7XG5jb25zdCBBREpVU1RfV0lEVEhfQ0xBU1MgPSBgJHtQUkVGSVh9LXRvb2x0aXBfX2JvZHktLXdyYXBgO1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IHRyaWdnZXIgLSBUaGUgdG9vbHRpcCB0cmlnZ2VyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBFbGVtZW50cyBmb3IgaW5pdGlhbGl6ZWQgdG9vbHRpcDsgaW5jbHVkZXMgdHJpZ2dlciwgd3JhcHBlciwgYW5kIGJvZHlcbiAqL1xuY29uc3QgZ2V0VG9vbHRpcEVsZW1lbnRzID0gKHRyaWdnZXIpID0+IHtcbiAgY29uc3Qgd3JhcHBlciA9IHRyaWdnZXIucGFyZW50Tm9kZTtcbiAgY29uc3QgYm9keSA9IHdyYXBwZXIucXVlcnlTZWxlY3RvcihgLiR7VE9PTFRJUF9CT0RZX0NMQVNTfWApO1xuXG4gIHJldHVybiB7IHRyaWdnZXIsIHdyYXBwZXIsIGJvZHkgfTtcbn07XG5cbi8qKlxuICogU2hvd3MgdGhlIHRvb2x0aXBcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRvb2x0aXBUcmlnZ2VyIC0gdGhlIGVsZW1lbnQgdGhhdCBpbml0aWFsaXplcyB0aGUgdG9vbHRpcFxuICovXG5jb25zdCBzaG93VG9vbFRpcCA9ICh0b29sdGlwQm9keSwgdG9vbHRpcFRyaWdnZXIsIHBvc2l0aW9uKSA9PiB7XG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwiZmFsc2VcIik7XG5cbiAgLy8gVGhpcyBzZXRzIHVwIHRoZSB0b29sdGlwIGJvZHkuIFRoZSBvcGFjaXR5IGlzIDAsIGJ1dFxuICAvLyB3ZSBjYW4gYmVnaW4gcnVubmluZyB0aGUgY2FsY3VsYXRpb25zIGJlbG93LlxuICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKFNFVF9DTEFTUyk7XG5cbiAgLyoqXG4gICAqIFBvc2l0aW9uIHRoZSB0b29sdGlwIGJvZHkgd2hlbiB0aGUgdHJpZ2dlciBpcyBob3ZlcmVkXG4gICAqIFJlbW92ZXMgb2xkIHBvc2l0aW9uaW5nIGNsYXNzbmFtZXMgYW5kIHJlYXBwbGllcy4gVGhpcyBhbGxvd3NcbiAgICogcG9zaXRpb25pbmcgdG8gY2hhbmdlIGluIGNhc2UgdGhlIHVzZXIgcmVzaXplcyBicm93c2VyIG9yIERPTSBtYW5pcHVsYXRpb25cbiAgICogY2F1c2VzIHRvb2x0aXAgdG8gZ2V0IGNsaXBwZWQgZnJvbSB2aWV3cG9ydFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2V0UG9zIC0gY2FuIGJlIFwidG9wXCIsIFwiYm90dG9tXCIsIFwicmlnaHRcIiwgXCJsZWZ0XCJcbiAgICovXG4gIGNvbnN0IHNldFBvc2l0aW9uQ2xhc3MgPSAoc2V0UG9zKSA9PiB7XG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS10b3BgKTtcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLWJvdHRvbWApO1xuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoYCR7VE9PTFRJUF9CT0RZX0NMQVNTfS0tcmlnaHRgKTtcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLWxlZnRgKTtcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLSR7c2V0UG9zfWApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIG9sZCBwb3NpdGlvbmluZyBzdHlsZXMuIFRoaXMgYWxsb3dzXG4gICAqIHJlLXBvc2l0aW9uaW5nIHRvIGNoYW5nZSB3aXRob3V0IGluaGVyaXRpbmcgb3RoZXJcbiAgICogZHluYW1pYyBzdHlsZXNcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKi9cbiAgY29uc3QgcmVzZXRQb3NpdGlvblN0eWxlcyA9IChlKSA9PiB7XG4gICAgLy8gd2UgZG9uJ3Qgb3ZlcnJpZGUgYW55dGhpbmcgaW4gdGhlIHN0eWxlc2hlZXQgd2hlbiBmaW5kaW5nIGFsdCBwb3NpdGlvbnNcbiAgICBlLnN0eWxlLnRvcCA9IG51bGw7XG4gICAgZS5zdHlsZS5ib3R0b20gPSBudWxsO1xuICAgIGUuc3R5bGUucmlnaHQgPSBudWxsO1xuICAgIGUuc3R5bGUubGVmdCA9IG51bGw7XG4gICAgZS5zdHlsZS5tYXJnaW4gPSBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBnZXQgbWFyZ2luIG9mZnNldCBjYWxjdWxhdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVZhbHVlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqL1xuXG4gIGNvbnN0IG9mZnNldE1hcmdpbiA9ICh0YXJnZXQsIHByb3BlcnR5VmFsdWUpID0+XG4gICAgcGFyc2VJbnQoXG4gICAgICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpLmdldFByb3BlcnR5VmFsdWUocHJvcGVydHlWYWx1ZSksXG4gICAgICAxMFxuICAgICk7XG5cbiAgLy8gb2Zmc2V0TGVmdCA9IHRoZSBsZWZ0IHBvc2l0aW9uLCBhbmQgbWFyZ2luIG9mIHRoZSBlbGVtZW50LCB0aGUgbGVmdFxuICAvLyBwYWRkaW5nLCBzY3JvbGxiYXIgYW5kIGJvcmRlciBvZiB0aGUgb2Zmc2V0UGFyZW50IGVsZW1lbnRcbiAgLy8gb2Zmc2V0V2lkdGggPSBUaGUgb2Zmc2V0V2lkdGggcHJvcGVydHkgcmV0dXJucyB0aGUgdmlld2FibGUgd2lkdGggb2YgYW5cbiAgLy8gZWxlbWVudCBpbiBwaXhlbHMsIGluY2x1ZGluZyBwYWRkaW5nLCBib3JkZXIgYW5kIHNjcm9sbGJhciwgYnV0IG5vdFxuICAvLyB0aGUgbWFyZ2luLlxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgbWFyZ2luIG9mZnNldFxuICAgKiB0b29sdGlwIHRyaWdnZXIgbWFyZ2luKHBvc2l0aW9uKSBvZmZzZXQgKyB0b29sdGlwQm9keSBvZmZzZXRXaWR0aFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWFyZ2luUG9zaXRpb25cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRvb2x0aXBCb2R5T2Zmc2V0XG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRyaWdnZXJcbiAgICovXG4gIGNvbnN0IGNhbGN1bGF0ZU1hcmdpbk9mZnNldCA9IChcbiAgICBtYXJnaW5Qb3NpdGlvbixcbiAgICB0b29sdGlwQm9keU9mZnNldCxcbiAgICB0cmlnZ2VyXG4gICkgPT4ge1xuICAgIGNvbnN0IG9mZnNldCA9XG4gICAgICBvZmZzZXRNYXJnaW4odHJpZ2dlciwgYG1hcmdpbi0ke21hcmdpblBvc2l0aW9ufWApID4gMFxuICAgICAgICA/IHRvb2x0aXBCb2R5T2Zmc2V0IC0gb2Zmc2V0TWFyZ2luKHRyaWdnZXIsIGBtYXJnaW4tJHttYXJnaW5Qb3NpdGlvbn1gKVxuICAgICAgICA6IHRvb2x0aXBCb2R5T2Zmc2V0O1xuXG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfTtcblxuICAvKipcbiAgICogUG9zaXRpb25zIHRvb2x0aXAgYXQgdGhlIHRvcFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqL1xuICBjb25zdCBwb3NpdGlvblRvcCA9IChlKSA9PiB7XG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTsgLy8gZW5zdXJlcyB3ZSBzdGFydCBmcm9tIHRoZSBzYW1lIHBvaW50XG4gICAgLy8gZ2V0IGRldGFpbHMgb24gdGhlIGVsZW1lbnRzIG9iamVjdCB3aXRoXG5cbiAgICBjb25zdCB0b3BNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXG4gICAgICBcInRvcFwiLFxuICAgICAgZS5vZmZzZXRIZWlnaHQsXG4gICAgICB0b29sdGlwVHJpZ2dlclxuICAgICk7XG5cbiAgICBjb25zdCBsZWZ0TWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxuICAgICAgXCJsZWZ0XCIsXG4gICAgICBlLm9mZnNldFdpZHRoLFxuICAgICAgdG9vbHRpcFRyaWdnZXJcbiAgICApO1xuXG4gICAgc2V0UG9zaXRpb25DbGFzcyhcInRvcFwiKTtcbiAgICBlLnN0eWxlLmxlZnQgPSBgNTAlYDsgLy8gY2VudGVyIHRoZSBlbGVtZW50XG4gICAgZS5zdHlsZS50b3AgPSBgLSR7VFJJQU5HTEVfU0laRX1weGA7IC8vIGNvbnNpZGVyIHRoZSBwc2V1ZG8gZWxlbWVudFxuICAgIC8vIGFwcGx5IG91ciBtYXJnaW5zIGJhc2VkIG9uIHRoZSBvZmZzZXRcbiAgICBlLnN0eWxlLm1hcmdpbiA9IGAtJHt0b3BNYXJnaW59cHggMCAwIC0ke2xlZnRNYXJnaW4gLyAyfXB4YDtcbiAgfTtcblxuICAvKipcbiAgICogUG9zaXRpb25zIHRvb2x0aXAgYXQgdGhlIGJvdHRvbVxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqL1xuICBjb25zdCBwb3NpdGlvbkJvdHRvbSA9IChlKSA9PiB7XG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTtcblxuICAgIGNvbnN0IGxlZnRNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXG4gICAgICBcImxlZnRcIixcbiAgICAgIGUub2Zmc2V0V2lkdGgsXG4gICAgICB0b29sdGlwVHJpZ2dlclxuICAgICk7XG5cbiAgICBzZXRQb3NpdGlvbkNsYXNzKFwiYm90dG9tXCIpO1xuICAgIGUuc3R5bGUubGVmdCA9IGA1MCVgO1xuICAgIGUuc3R5bGUubWFyZ2luID0gYCR7VFJJQU5HTEVfU0laRX1weCAwIDAgLSR7bGVmdE1hcmdpbiAvIDJ9cHhgO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQb3NpdGlvbnMgdG9vbHRpcCBhdCB0aGUgcmlnaHRcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKi9cbiAgY29uc3QgcG9zaXRpb25SaWdodCA9IChlKSA9PiB7XG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTtcblxuICAgIGNvbnN0IHRvcE1hcmdpbiA9IGNhbGN1bGF0ZU1hcmdpbk9mZnNldChcbiAgICAgIFwidG9wXCIsXG4gICAgICBlLm9mZnNldEhlaWdodCxcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXG4gICAgKTtcblxuICAgIHNldFBvc2l0aW9uQ2xhc3MoXCJyaWdodFwiKTtcbiAgICBlLnN0eWxlLnRvcCA9IGA1MCVgO1xuICAgIGUuc3R5bGUubGVmdCA9IGAke1xuICAgICAgdG9vbHRpcFRyaWdnZXIub2Zmc2V0TGVmdCArIHRvb2x0aXBUcmlnZ2VyLm9mZnNldFdpZHRoICsgVFJJQU5HTEVfU0laRVxuICAgIH1weGA7XG4gICAgZS5zdHlsZS5tYXJnaW4gPSBgLSR7dG9wTWFyZ2luIC8gMn1weCAwIDAgMGA7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBvc2l0aW9ucyB0b29sdGlwIGF0IHRoZSByaWdodFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqL1xuICBjb25zdCBwb3NpdGlvbkxlZnQgPSAoZSkgPT4ge1xuICAgIHJlc2V0UG9zaXRpb25TdHlsZXMoZSk7XG5cbiAgICBjb25zdCB0b3BNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXG4gICAgICBcInRvcFwiLFxuICAgICAgZS5vZmZzZXRIZWlnaHQsXG4gICAgICB0b29sdGlwVHJpZ2dlclxuICAgICk7XG5cbiAgICAvLyB3ZSBoYXZlIHRvIGNoZWNrIGZvciBzb21lIHV0aWxpdHkgbWFyZ2luc1xuICAgIGNvbnN0IGxlZnRNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXG4gICAgICBcImxlZnRcIixcbiAgICAgIHRvb2x0aXBUcmlnZ2VyLm9mZnNldExlZnQgPiBlLm9mZnNldFdpZHRoXG4gICAgICAgID8gdG9vbHRpcFRyaWdnZXIub2Zmc2V0TGVmdCAtIGUub2Zmc2V0V2lkdGhcbiAgICAgICAgOiBlLm9mZnNldFdpZHRoLFxuICAgICAgdG9vbHRpcFRyaWdnZXJcbiAgICApO1xuXG4gICAgc2V0UG9zaXRpb25DbGFzcyhcImxlZnRcIik7XG4gICAgZS5zdHlsZS50b3AgPSBgNTAlYDtcbiAgICBlLnN0eWxlLmxlZnQgPSBgLSR7VFJJQU5HTEVfU0laRX1weGA7XG4gICAgZS5zdHlsZS5tYXJnaW4gPSBgLSR7dG9wTWFyZ2luIC8gMn1weCAwIDAgJHtcbiAgICAgIHRvb2x0aXBUcmlnZ2VyLm9mZnNldExlZnQgPiBlLm9mZnNldFdpZHRoID8gbGVmdE1hcmdpbiA6IC1sZWZ0TWFyZ2luXG4gICAgfXB4YDsgLy8gYWRqdXN0IHRoZSBtYXJnaW5cbiAgfTtcblxuICAvKipcbiAgICogV2UgdHJ5IHRvIHNldCB0aGUgcG9zaXRpb24gYmFzZWQgb24gdGhlXG4gICAqIG9yaWdpbmFsIGludGVudGlvbiwgYnV0IG1ha2UgYWRqdXN0bWVudHNcbiAgICogaWYgdGhlIGVsZW1lbnQgaXMgY2xpcHBlZCBvdXQgb2YgdGhlIHZpZXdwb3J0XG4gICAqIHdlIGNvbnN0cmFpbiB0aGUgd2lkdGggb25seSBhcyBhIGxhc3QgcmVzb3J0XG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQoYWxpYXMgdG9vbHRpcEJvZHkpXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBhdHRlbXB0ICgtLWZsYWcpXG4gICAqL1xuXG4gIGNvbnN0IG1heEF0dGVtcHRzID0gMjtcblxuICBmdW5jdGlvbiBmaW5kQmVzdFBvc2l0aW9uKGVsZW1lbnQsIGF0dGVtcHQgPSAxKSB7XG4gICAgLy8gY3JlYXRlIGFycmF5IG9mIG9wdGlvbmFsIHBvc2l0aW9uc1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtcbiAgICAgIHBvc2l0aW9uVG9wLFxuICAgICAgcG9zaXRpb25Cb3R0b20sXG4gICAgICBwb3NpdGlvblJpZ2h0LFxuICAgICAgcG9zaXRpb25MZWZ0LFxuICAgIF07XG5cbiAgICBsZXQgaGFzVmlzaWJsZVBvc2l0aW9uID0gZmFsc2U7XG5cbiAgICAvLyB3ZSB0YWtlIGEgcmVjdXJzaXZlIGFwcHJvYWNoXG4gICAgZnVuY3Rpb24gdHJ5UG9zaXRpb25zKGkpIHtcbiAgICAgIGlmIChpIDwgcG9zaXRpb25zLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwb3MgPSBwb3NpdGlvbnNbaV07XG4gICAgICAgIHBvcyhlbGVtZW50KTtcblxuICAgICAgICBpZiAoIWlzRWxlbWVudEluVmlld3BvcnQoZWxlbWVudCkpIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICB0cnlQb3NpdGlvbnMoKGkgKz0gMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhhc1Zpc2libGVQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnlQb3NpdGlvbnMoMCk7XG4gICAgLy8gaWYgd2UgY2FuJ3QgZmluZCBhIHBvc2l0aW9uIHdlIGNvbXByZXNzIGl0IGFuZCB0cnkgYWdhaW5cbiAgICBpZiAoIWhhc1Zpc2libGVQb3NpdGlvbikge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKEFESlVTVF9XSURUSF9DTEFTUyk7XG4gICAgICBpZiAoYXR0ZW1wdCA8PSBtYXhBdHRlbXB0cykge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgZmluZEJlc3RQb3NpdGlvbihlbGVtZW50LCAoYXR0ZW1wdCArPSAxKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3dpdGNoIChwb3NpdGlvbikge1xuICAgIGNhc2UgXCJ0b3BcIjpcbiAgICAgIHBvc2l0aW9uVG9wKHRvb2x0aXBCb2R5KTtcbiAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0b29sdGlwQm9keSkpIHtcbiAgICAgICAgZmluZEJlc3RQb3NpdGlvbih0b29sdGlwQm9keSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiYm90dG9tXCI6XG4gICAgICBwb3NpdGlvbkJvdHRvbSh0b29sdGlwQm9keSk7XG4gICAgICBpZiAoIWlzRWxlbWVudEluVmlld3BvcnQodG9vbHRpcEJvZHkpKSB7XG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInJpZ2h0XCI6XG4gICAgICBwb3NpdGlvblJpZ2h0KHRvb2x0aXBCb2R5KTtcbiAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0b29sdGlwQm9keSkpIHtcbiAgICAgICAgZmluZEJlc3RQb3NpdGlvbih0b29sdGlwQm9keSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwibGVmdFwiOlxuICAgICAgcG9zaXRpb25MZWZ0KHRvb2x0aXBCb2R5KTtcbiAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0b29sdGlwQm9keSkpIHtcbiAgICAgICAgZmluZEJlc3RQb3NpdGlvbih0b29sdGlwQm9keSk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBza2lwIGRlZmF1bHQgY2FzZVxuICAgICAgYnJlYWs7XG4gIH1cblxuICAvKipcbiAgICogQWN0dWFsbHkgc2hvdyB0aGUgdG9vbHRpcC4gVGhlIFZJU0lCTEVfQ0xBU1NcbiAgICogd2lsbCBjaGFuZ2UgdGhlIG9wYWNpdHkgdG8gMVxuICAgKi9cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LmFkZChWSVNJQkxFX0NMQVNTKTtcbiAgfSwgMjApO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGFsbCB0aGUgcHJvcGVydGllcyB0byBzaG93IGFuZCBwb3NpdGlvbiB0aGUgdG9vbHRpcCxcbiAqIGFuZCByZXNldHMgdGhlIHRvb2x0aXAgcG9zaXRpb24gdG8gdGhlIG9yaWdpbmFsIGludGVudGlvblxuICogaW4gY2FzZSB0aGUgd2luZG93IGlzIHJlc2l6ZWQgb3IgdGhlIGVsZW1lbnQgaXMgbW92ZWQgdGhyb3VnaFxuICogRE9NIG1hbmlwdWxhdGlvbi5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRvb2x0aXBCb2R5IC0gVGhlIGJvZHkgb2YgdGhlIHRvb2x0aXBcbiAqL1xuY29uc3QgaGlkZVRvb2xUaXAgPSAodG9vbHRpcEJvZHkpID0+IHtcbiAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShWSVNJQkxFX0NMQVNTKTtcbiAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShTRVRfQ0xBU1MpO1xuICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKEFESlVTVF9XSURUSF9DTEFTUyk7XG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbn07XG5cbi8qKlxuICogU2V0dXAgdGhlIHRvb2x0aXAgY29tcG9uZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0b29sdGlwVHJpZ2dlciBUaGUgZWxlbWVudCB0aGF0IGNyZWF0ZXMgdGhlIHRvb2x0aXBcbiAqL1xuY29uc3Qgc2V0VXBBdHRyaWJ1dGVzID0gKHRvb2x0aXBUcmlnZ2VyKSA9PiB7XG4gIGNvbnN0IHRvb2x0aXBJRCA9IGB0b29sdGlwLSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogOTAwMDAwKSArIDEwMDAwMH1gO1xuICBjb25zdCB0b29sdGlwQ29udGVudCA9IHRvb2x0aXBUcmlnZ2VyLmdldEF0dHJpYnV0ZShcInRpdGxlXCIpO1xuICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGNvbnN0IHRvb2x0aXBCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGNvbnN0IGFkZGl0aW9uYWxDbGFzc2VzID0gdG9vbHRpcFRyaWdnZXIuZ2V0QXR0cmlidXRlKFwiZGF0YS1jbGFzc2VzXCIpO1xuICBsZXQgcG9zaXRpb24gPSB0b29sdGlwVHJpZ2dlci5nZXRBdHRyaWJ1dGUoXCJkYXRhLXBvc2l0aW9uXCIpO1xuXG4gIC8vIEFwcGx5IGRlZmF1bHQgcG9zaXRpb24gaWYgbm90IHNldCBhcyBhdHRyaWJ1dGVcbiAgaWYgKCFwb3NpdGlvbikge1xuICAgIHBvc2l0aW9uID0gXCJ0b3BcIjtcbiAgICB0b29sdGlwVHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJkYXRhLXBvc2l0aW9uXCIsIHBvc2l0aW9uKTtcbiAgfVxuXG4gIC8vIFNldCB1cCB0b29sdGlwIGF0dHJpYnV0ZXNcbiAgdG9vbHRpcFRyaWdnZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCB0b29sdGlwSUQpO1xuICB0b29sdGlwVHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gIHRvb2x0aXBUcmlnZ2VyLnJlbW92ZUF0dHJpYnV0ZShcInRpdGxlXCIpO1xuICB0b29sdGlwVHJpZ2dlci5jbGFzc0xpc3QucmVtb3ZlKFRPT0xUSVBfQ0xBU1MpO1xuICB0b29sdGlwVHJpZ2dlci5jbGFzc0xpc3QuYWRkKFRPT0xUSVBfVFJJR0dFUl9DTEFTUyk7XG5cbiAgLy8gaW5zZXJ0IHdyYXBwZXIgYmVmb3JlIGVsIGluIHRoZSBET00gdHJlZVxuICB0b29sdGlwVHJpZ2dlci5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh3cmFwcGVyLCB0b29sdGlwVHJpZ2dlcik7XG5cbiAgLy8gc2V0IHVwIHRoZSB3cmFwcGVyXG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQodG9vbHRpcFRyaWdnZXIpO1xuICB3cmFwcGVyLmNsYXNzTGlzdC5hZGQoVE9PTFRJUF9DTEFTUyk7XG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQodG9vbHRpcEJvZHkpO1xuXG4gIC8vIEFwcGx5IGFkZGl0aW9uYWwgY2xhc3MgbmFtZXMgdG8gd3JhcHBlciBlbGVtZW50XG4gIGlmIChhZGRpdGlvbmFsQ2xhc3Nlcykge1xuICAgIGNvbnN0IGNsYXNzZXNBcnJheSA9IGFkZGl0aW9uYWxDbGFzc2VzLnNwbGl0KFwiIFwiKTtcbiAgICBjbGFzc2VzQXJyYXkuZm9yRWFjaCgoY2xhc3NuYW1lKSA9PiB3cmFwcGVyLmNsYXNzTGlzdC5hZGQoY2xhc3NuYW1lKSk7XG4gIH1cblxuICAvLyBzZXQgdXAgdGhlIHRvb2x0aXAgYm9keVxuICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKFRPT0xUSVBfQk9EWV9DTEFTUyk7XG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcImlkXCIsIHRvb2x0aXBJRCk7XG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJ0b29sdGlwXCIpO1xuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG5cbiAgLy8gcGxhY2UgdGhlIHRleHQgaW4gdGhlIHRvb2x0aXBcbiAgdG9vbHRpcEJvZHkudGV4dENvbnRlbnQgPSB0b29sdGlwQ29udGVudDtcblxuICByZXR1cm4geyB0b29sdGlwQm9keSwgcG9zaXRpb24sIHRvb2x0aXBDb250ZW50LCB3cmFwcGVyIH07XG59O1xuXG4vLyBTZXR1cCBvdXIgZnVuY3Rpb24gdG8gcnVuIG9uIHZhcmlvdXMgZXZlbnRzXG5jb25zdCB0b29sdGlwID0gYmVoYXZpb3IoXG4gIHtcbiAgICBcIm1vdXNlb3ZlciBmb2N1c2luXCI6IHtcbiAgICAgIFtUT09MVElQXShlKSB7XG4gICAgICAgIGNvbnN0IHRyaWdnZXIgPSBlLnRhcmdldDtcbiAgICAgICAgY29uc3QgZWxlbWVudFR5cGUgPSB0cmlnZ2VyLm5vZGVOYW1lO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdG9vbHRpcCBpZiBpdCBoYXNuJ3QgYWxyZWFkeVxuICAgICAgICBpZiAoZWxlbWVudFR5cGUgPT09IFwiQlVUVE9OXCIgJiYgdHJpZ2dlci5oYXNBdHRyaWJ1dGUoXCJ0aXRsZVwiKSkge1xuICAgICAgICAgIHNldFVwQXR0cmlidXRlcyh0cmlnZ2VyKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFtUT09MVElQX1RSSUdHRVJdKGUpIHtcbiAgICAgICAgY29uc3QgeyB0cmlnZ2VyLCBib2R5IH0gPSBnZXRUb29sdGlwRWxlbWVudHMoZS50YXJnZXQpO1xuXG4gICAgICAgIHNob3dUb29sVGlwKGJvZHksIHRyaWdnZXIsIHRyaWdnZXIuZGF0YXNldC5wb3NpdGlvbik7XG4gICAgICB9LFxuICAgIH0sXG4gICAgXCJtb3VzZW91dCBmb2N1c291dFwiOiB7XG4gICAgICBbVE9PTFRJUF9UUklHR0VSXShlKSB7XG4gICAgICAgIGNvbnN0IHsgYm9keSB9ID0gZ2V0VG9vbHRpcEVsZW1lbnRzKGUudGFyZ2V0KTtcblxuICAgICAgICBoaWRlVG9vbFRpcChib2R5KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKFRPT0xUSVAsIHJvb3QpLmZvckVhY2goKHRvb2x0aXBUcmlnZ2VyKSA9PiB7XG4gICAgICAgIHNldFVwQXR0cmlidXRlcyh0b29sdGlwVHJpZ2dlcik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHNldHVwOiBzZXRVcEF0dHJpYnV0ZXMsXG4gICAgZ2V0VG9vbHRpcEVsZW1lbnRzLFxuICAgIHNob3c6IHNob3dUb29sVGlwLFxuICAgIGhpZGU6IGhpZGVUb29sVGlwLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvb2x0aXA7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3ZhbGlkYXRlLWlucHV0XCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcblxuY29uc3QgVkFMSURBVEVfSU5QVVQgPSBcImlucHV0W2RhdGEtdmFsaWRhdGlvbi1lbGVtZW50XVwiO1xuY29uc3QgQ0hFQ0tMSVNUX0lURU0gPSBgLiR7UFJFRklYfS1jaGVja2xpc3RfX2l0ZW1gO1xuXG4vLyBUcmlnZ2VyIHZhbGlkYXRpb24gb24gaW5wdXQgY2hhbmdlXG5jb25zdCBoYW5kbGVDaGFuZ2UgPSAoZWwpID0+IHZhbGlkYXRlKGVsKTtcblxuLy8gQ3JlYXRlIGNvbnRhaW5lciB0byBob2xkIGFyaWEgcmVhZG91dFxuY29uc3QgY3JlYXRlU3RhdHVzRWxlbWVudCA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB2YWxpZGF0aW9uQ29udGFpbmVyID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgY29uc3QgaW5wdXRJRCA9IGlucHV0LmdldEF0dHJpYnV0ZShcImlkXCIpO1xuICBjb25zdCBzdGF0dXNTdW1tYXJ5SUQgPSBgJHtpbnB1dElEfS1zci1zdW1tYXJ5YDtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCBzdGF0dXNTdW1tYXJ5SUQpO1xuXG4gIGNvbnN0IHN0YXR1c1N1bW1hcnlDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcblxuICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1zdGF0dXNcIiwgXCJcIik7XG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuY2xhc3NMaXN0LmFkZChcInVzYS1zci1vbmx5XCIpO1xuICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLnNldEF0dHJpYnV0ZShcImFyaWEtbGl2ZVwiLCBcInBvbGl0ZVwiKTtcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWF0b21pY1wiLCB0cnVlKTtcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBzdGF0dXNTdW1tYXJ5SUQpO1xuICB2YWxpZGF0aW9uQ29udGFpbmVyLmFwcGVuZChzdGF0dXNTdW1tYXJ5Q29udGFpbmVyKTtcbn07XG5cbi8vIFNldCB1cCBjaGVja2xpc3QgaXRlbXMgd2l0aCBpbml0aWFsIGFyaWEtbGFiZWwgKGluY29tcGxldGUpIHZhbHVlc1xuY29uc3QgY3JlYXRlSW5pdGlhbFN0YXR1cyA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB2YWxpZGF0aW9uQ29udGFpbmVyID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgY29uc3QgY2hlY2tsaXN0SXRlbXMgPSB2YWxpZGF0aW9uQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoQ0hFQ0tMSVNUX0lURU0pO1xuICBjb25zdCB2YWxpZGF0aW9uRWxlbWVudCA9IGlucHV0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1lbGVtZW50XCIpO1xuXG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtY29udHJvbHNcIiwgdmFsaWRhdGlvbkVsZW1lbnQpO1xuXG4gIGNoZWNrbGlzdEl0ZW1zLmZvckVhY2goKGxpc3RJdGVtKSA9PiB7XG4gICAgbGV0IGN1cnJlbnRTdGF0dXMgPSBcInN0YXR1cyBpbmNvbXBsZXRlXCI7XG4gICAgaWYgKGlucHV0Lmhhc0F0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1pbmNvbXBsZXRlXCIpKSB7XG4gICAgICBjdXJyZW50U3RhdHVzID0gaW5wdXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWxpZGF0aW9uLWluY29tcGxldGVcIik7XG4gICAgfVxuICAgIGNvbnN0IGl0ZW1TdGF0dXMgPSBgJHtsaXN0SXRlbS50ZXh0Q29udGVudH0gJHtjdXJyZW50U3RhdHVzfSBgO1xuICAgIGxpc3RJdGVtLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcbiAgICBsaXN0SXRlbS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGl0ZW1TdGF0dXMpO1xuICB9KTtcbn07XG5cbmNvbnN0IGVuaGFuY2VWYWxpZGF0aW9uID0gKGlucHV0KSA9PiB7XG4gIGNyZWF0ZVN0YXR1c0VsZW1lbnQoaW5wdXQpO1xuICBjcmVhdGVJbml0aWFsU3RhdHVzKGlucHV0KTtcbn07XG5cbmNvbnN0IHZhbGlkYXRvciA9IGJlaGF2aW9yKFxuICB7XG4gICAgXCJpbnB1dCBjaGFuZ2VcIjoge1xuICAgICAgW1ZBTElEQVRFX0lOUFVUXShldmVudCkge1xuICAgICAgICBoYW5kbGVDaGFuZ2UoZXZlbnQudGFyZ2V0KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKFZBTElEQVRFX0lOUFVULCByb290KS5mb3JFYWNoKChpbnB1dCkgPT5cbiAgICAgICAgZW5oYW5jZVZhbGlkYXRpb24oaW5wdXQpXG4gICAgICApO1xuICAgIH0sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByZWZpeDogXCJ1c2FcIixcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gVGhpcyB1c2VkIHRvIGJlIGNvbmRpdGlvbmFsbHkgZGVwZW5kZW50IG9uIHdoZXRoZXIgdGhlXG4gIC8vIGJyb3dzZXIgc3VwcG9ydGVkIHRvdWNoIGV2ZW50czsgaWYgaXQgZGlkLCBgQ0xJQ0tgIHdhcyBzZXQgdG9cbiAgLy8gYHRvdWNoc3RhcnRgLiAgSG93ZXZlciwgdGhpcyBoYWQgZG93bnNpZGVzOlxuICAvL1xuICAvLyAqIEl0IHByZS1lbXB0ZWQgbW9iaWxlIGJyb3dzZXJzJyBkZWZhdWx0IGJlaGF2aW9yIG9mIGRldGVjdGluZ1xuICAvLyAgIHdoZXRoZXIgYSB0b3VjaCB0dXJuZWQgaW50byBhIHNjcm9sbCwgdGhlcmVieSBwcmV2ZW50aW5nXG4gIC8vICAgdXNlcnMgZnJvbSB1c2luZyBzb21lIG9mIG91ciBjb21wb25lbnRzIGFzIHNjcm9sbCBzdXJmYWNlcy5cbiAgLy9cbiAgLy8gKiBTb21lIGRldmljZXMsIHN1Y2ggYXMgdGhlIE1pY3Jvc29mdCBTdXJmYWNlIFBybywgc3VwcG9ydCAqYm90aCpcbiAgLy8gICB0b3VjaCBhbmQgY2xpY2tzLiBUaGlzIG1lYW50IHRoZSBjb25kaXRpb25hbCBlZmZlY3RpdmVseSBkcm9wcGVkXG4gIC8vICAgc3VwcG9ydCBmb3IgdGhlIHVzZXIncyBtb3VzZSwgZnJ1c3RyYXRpbmcgdXNlcnMgd2hvIHByZWZlcnJlZFxuICAvLyAgIGl0IG9uIHRob3NlIHN5c3RlbXMuXG4gIENMSUNLOiBcImNsaWNrXCIsXG59O1xuIiwiY29uc3QgYWNjb3JkaW9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1hY2NvcmRpb24vc3JjL2luZGV4XCIpO1xuY29uc3QgYmFubmVyID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1iYW5uZXIvc3JjL2luZGV4XCIpO1xuY29uc3QgYnV0dG9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1idXR0b24vc3JjL2luZGV4XCIpO1xuY29uc3QgY2hhcmFjdGVyQ291bnQgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWNoYXJhY3Rlci1jb3VudC9zcmMvaW5kZXhcIik7XG5jb25zdCBjb21ib0JveCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtY29tYm8tYm94L3NyYy9pbmRleFwiKTtcbmNvbnN0IGRhdGVQaWNrZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWRhdGUtcGlja2VyL3NyYy9pbmRleFwiKTtcbmNvbnN0IGRhdGVSYW5nZVBpY2tlciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZGF0ZS1yYW5nZS1waWNrZXIvc3JjL2luZGV4XCIpO1xuY29uc3QgZmlsZUlucHV0ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1maWxlLWlucHV0L3NyYy9pbmRleFwiKTtcbmNvbnN0IGZvb3RlciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZm9vdGVyL3NyYy9pbmRleFwiKTtcbmNvbnN0IGluUGFnZU5hdmlnYXRpb24gPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWluLXBhZ2UtbmF2aWdhdGlvbi9zcmMvaW5kZXhcIik7XG5jb25zdCBpbnB1dE1hc2sgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWlucHV0LW1hc2svc3JjL2luZGV4XCIpO1xuY29uc3QgbGFuZ3VhZ2VTZWxlY3RvciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtbGFuZ3VhZ2Utc2VsZWN0b3Ivc3JjL2luZGV4XCIpO1xuY29uc3QgbW9kYWwgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLW1vZGFsL3NyYy9pbmRleFwiKTtcbmNvbnN0IG5hdmlnYXRpb24gPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWhlYWRlci9zcmMvaW5kZXhcIik7XG5jb25zdCBwYXNzd29yZCA9IHJlcXVpcmUoXCIuLi8uLi8uLi9fdXNhLXBhc3N3b3JkL3NyYy9pbmRleFwiKTtcbmNvbnN0IHJhbmdlID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1yYW5nZS9zcmMvaW5kZXhcIik7XG5jb25zdCBzZWFyY2ggPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXNlYXJjaC9zcmMvaW5kZXhcIik7XG5jb25zdCBza2lwbmF2ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1za2lwbmF2L3NyYy9pbmRleFwiKTtcbmNvbnN0IHRhYmxlID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10YWJsZS9zcmMvaW5kZXhcIik7XG5jb25zdCB0aW1lUGlja2VyID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10aW1lLXBpY2tlci9zcmMvaW5kZXhcIik7XG5jb25zdCB0b29sdGlwID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10b29sdGlwL3NyYy9pbmRleFwiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtdmFsaWRhdGlvbi9zcmMvaW5kZXhcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY2NvcmRpb24sXG4gIGJhbm5lcixcbiAgYnV0dG9uLFxuICBjaGFyYWN0ZXJDb3VudCxcbiAgY29tYm9Cb3gsXG4gIGRhdGVQaWNrZXIsXG4gIGRhdGVSYW5nZVBpY2tlcixcbiAgZmlsZUlucHV0LFxuICBmb290ZXIsXG4gIGluUGFnZU5hdmlnYXRpb24sXG4gIGlucHV0TWFzayxcbiAgbGFuZ3VhZ2VTZWxlY3RvcixcbiAgbW9kYWwsXG4gIG5hdmlnYXRpb24sXG4gIHBhc3N3b3JkLFxuICByYW5nZSxcbiAgc2VhcmNoLFxuICBza2lwbmF2LFxuICB0YWJsZSxcbiAgdGltZVBpY2tlcixcbiAgdG9vbHRpcCxcbiAgdmFsaWRhdG9yLFxufTtcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBmdW5jLW5hbWVzICovXG4oZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cbiAgZnVuY3Rpb24gQ3VzdG9tRXZlbnQoZXZlbnQsIF9wYXJhbXMpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBfcGFyYW1zIHx8IHtcbiAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXG4gICAgICBkZXRhaWw6IG51bGwsXG4gICAgfTtcbiAgICBjb25zdCBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoXG4gICAgICBldmVudCxcbiAgICAgIHBhcmFtcy5idWJibGVzLFxuICAgICAgcGFyYW1zLmNhbmNlbGFibGUsXG4gICAgICBwYXJhbXMuZGV0YWlsXG4gICAgKTtcbiAgICByZXR1cm4gZXZ0O1xuICB9XG5cbiAgd2luZG93LkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG59KSgpO1xuIiwiY29uc3QgZWxwcm90byA9IHdpbmRvdy5IVE1MRWxlbWVudC5wcm90b3R5cGU7XG5jb25zdCBISURERU4gPSBcImhpZGRlblwiO1xuXG5pZiAoIShISURERU4gaW4gZWxwcm90bykpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVscHJvdG8sIEhJRERFTiwge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShISURERU4pO1xuICAgIH0sXG4gICAgc2V0KHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSElEREVOLCBcIlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhJRERFTik7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG4iLCIvLyBwb2x5ZmlsbHMgSFRNTEVsZW1lbnQucHJvdG90eXBlLmNsYXNzTGlzdCBhbmQgRE9NVG9rZW5MaXN0XG5yZXF1aXJlKFwiY2xhc3NsaXN0LXBvbHlmaWxsXCIpO1xuLy8gcG9seWZpbGxzIEhUTUxFbGVtZW50LnByb3RvdHlwZS5oaWRkZW5cbnJlcXVpcmUoXCIuL2VsZW1lbnQtaGlkZGVuXCIpO1xuLy8gcG9seWZpbGxzIE51bWJlci5pc05hTigpXG5yZXF1aXJlKFwiLi9udW1iZXItaXMtbmFuXCIpO1xuLy8gcG9seWZpbGxzIEN1c3RvbUV2ZW50XG5yZXF1aXJlKFwiLi9jdXN0b20tZXZlbnRcIik7XG4vLyBwb2x5ZmlsbHMgc3ZnNGV2ZXJ5Ym9keVxucmVxdWlyZShcIi4vc3ZnNGV2ZXJ5Ym9keVwiKTtcbiIsIk51bWJlci5pc05hTiA9XG4gIE51bWJlci5pc05hTiB8fFxuICBmdW5jdGlvbiBpc05hTihpbnB1dCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zZWxmLWNvbXBhcmVcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSBcIm51bWJlclwiICYmIGlucHV0ICE9PSBpbnB1dDtcbiAgfTtcbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG4hKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xufSkoZnVuY3Rpb24gKCkge1xuICAvKiEgc3ZnNGV2ZXJ5Ym9keSB2Mi4xLjkgfCBnaXRodWIuY29tL2pvbmF0aGFudG5lYWwvc3ZnNGV2ZXJ5Ym9keSAqL1xuICBmdW5jdGlvbiBlbWJlZChwYXJlbnQsIHN2ZywgdGFyZ2V0LCB1c2UpIHtcbiAgICAvLyBpZiB0aGUgdGFyZ2V0IGV4aXN0c1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIC8vIGNyZWF0ZSBhIGRvY3VtZW50IGZyYWdtZW50IHRvIGhvbGQgdGhlIGNvbnRlbnRzIG9mIHRoZSB0YXJnZXRcbiAgICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgdmlld0JveCA9XG4gICAgICAgICAgIXN2Zy5oYXNBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIpICYmIHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIpO1xuICAgICAgLy8gY29uZGl0aW9uYWxseSBzZXQgdGhlIHZpZXdCb3ggb24gdGhlIHN2Z1xuICAgICAgdmlld0JveCAmJiBzdmcuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCB2aWV3Qm94KTtcbiAgICAgIC8vIGNvcHkgdGhlIGNvbnRlbnRzIG9mIHRoZSBjbG9uZSBpbnRvIHRoZSBmcmFnbWVudFxuICAgICAgZm9yIChcbiAgICAgICAgLy8gY2xvbmUgdGhlIHRhcmdldFxuICAgICAgICB2YXIgY2xvbmUgPSBkb2N1bWVudC5pbXBvcnROb2RlXG4gICAgICAgICAgICA/IGRvY3VtZW50LmltcG9ydE5vZGUodGFyZ2V0LCAhMClcbiAgICAgICAgICAgIDogdGFyZ2V0LmNsb25lTm9kZSghMCksXG4gICAgICAgICAgZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcbiAgICAgICAgICAgIHN2Zy5uYW1lc3BhY2VVUkkgfHwgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxuICAgICAgICAgICAgXCJnXCJcbiAgICAgICAgICApO1xuICAgICAgICBjbG9uZS5jaGlsZE5vZGVzLmxlbmd0aDtcblxuICAgICAgKSB7XG4gICAgICAgIGcuYXBwZW5kQ2hpbGQoY2xvbmUuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgICBpZiAodXNlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyB1c2UuYXR0cmlidXRlcy5sZW5ndGggPiBpOyBpKyspIHtcbiAgICAgICAgICB2YXIgYXR0ciA9IHVzZS5hdHRyaWJ1dGVzW2ldO1xuICAgICAgICAgIFwieGxpbms6aHJlZlwiICE9PSBhdHRyLm5hbWUgJiZcbiAgICAgICAgICAgIFwiaHJlZlwiICE9PSBhdHRyLm5hbWUgJiZcbiAgICAgICAgICAgIGcuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGcpLCAvLyBhcHBlbmQgdGhlIGZyYWdtZW50IGludG8gdGhlIHN2Z1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBsb2FkcmVhZHlzdGF0ZWNoYW5nZSh4aHIsIHVzZSkge1xuICAgIC8vIGxpc3RlbiB0byBjaGFuZ2VzIGluIHRoZSByZXF1ZXN0XG4gICAgKHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBpZiB0aGUgcmVxdWVzdCBpcyByZWFkeVxuICAgICAgaWYgKDQgPT09IHhoci5yZWFkeVN0YXRlKSB7XG4gICAgICAgIC8vIGdldCB0aGUgY2FjaGVkIGh0bWwgZG9jdW1lbnRcbiAgICAgICAgdmFyIGNhY2hlZERvY3VtZW50ID0geGhyLl9jYWNoZWREb2N1bWVudDtcbiAgICAgICAgLy8gZW5zdXJlIHRoZSBjYWNoZWQgaHRtbCBkb2N1bWVudCBiYXNlZCBvbiB0aGUgeGhyIHJlc3BvbnNlXG4gICAgICAgIGNhY2hlZERvY3VtZW50IHx8XG4gICAgICAgICAgKChjYWNoZWREb2N1bWVudCA9IHhoci5fY2FjaGVkRG9jdW1lbnQgPVxuICAgICAgICAgICAgZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KFwiXCIpKSxcbiAgICAgICAgICAoY2FjaGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB4aHIucmVzcG9uc2VUZXh0KSwgLy8gZW5zdXJlIGRvbWFpbnMgYXJlIHRoZSBzYW1lLCBvdGhlcndpc2Ugd2UnbGwgaGF2ZSBpc3N1ZXMgYXBwZW5kaW5nIHRoZVxuICAgICAgICAgIC8vIGVsZW1lbnQgaW4gSUUgMTFcbiAgICAgICAgICBjYWNoZWREb2N1bWVudC5kb21haW4gIT09IGRvY3VtZW50LmRvbWFpbiAmJlxuICAgICAgICAgICAgKGNhY2hlZERvY3VtZW50LmRvbWFpbiA9IGRvY3VtZW50LmRvbWFpbiksXG4gICAgICAgICAgKHhoci5fY2FjaGVkVGFyZ2V0ID0ge30pKSwgLy8gY2xlYXIgdGhlIHhociBlbWJlZHMgbGlzdCBhbmQgZW1iZWQgZWFjaCBpdGVtXG4gICAgICAgICAgeGhyLl9lbWJlZHMuc3BsaWNlKDApLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSBjYWNoZWQgdGFyZ2V0XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0geGhyLl9jYWNoZWRUYXJnZXRbaXRlbS5pZF07XG4gICAgICAgICAgICAvLyBlbnN1cmUgdGhlIGNhY2hlZCB0YXJnZXRcbiAgICAgICAgICAgIHRhcmdldCB8fFxuICAgICAgICAgICAgICAodGFyZ2V0ID0geGhyLl9jYWNoZWRUYXJnZXRbaXRlbS5pZF0gPVxuICAgICAgICAgICAgICAgIGNhY2hlZERvY3VtZW50LmdldEVsZW1lbnRCeUlkKGl0ZW0uaWQpKSxcbiAgICAgICAgICAgICAgLy8gZW1iZWQgdGhlIHRhcmdldCBpbnRvIHRoZSBzdmdcbiAgICAgICAgICAgICAgZW1iZWQoaXRlbS5wYXJlbnQsIGl0ZW0uc3ZnLCB0YXJnZXQsIHVzZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSksIC8vIHRlc3QgdGhlIHJlYWR5IHN0YXRlIGNoYW5nZSBpbW1lZGlhdGVseVxuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSgpO1xuICB9XG4gIGZ1bmN0aW9uIHN2ZzRldmVyeWJvZHkocmF3b3B0cykge1xuICAgIGZ1bmN0aW9uIG9uaW50ZXJ2YWwoKSB7XG4gICAgICAvLyBpZiBhbGwgPHVzZT5zIGluIHRoZSBhcnJheSBhcmUgYmVpbmcgYnlwYXNzZWQsIGRvbid0IHByb2NlZWQuXG4gICAgICBpZiAoXG4gICAgICAgIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyAmJlxuICAgICAgICB1c2VzLmxlbmd0aCAtIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyA8PSAwXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG9uaW50ZXJ2YWwsIDY3KTtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZXJlIGFyZSA8dXNlPnMgdG8gcHJvY2VzcywgcHJvY2VlZC5cbiAgICAgIC8vIHJlc2V0IHRoZSBieXBhc3MgY291bnRlciwgc2luY2UgdGhlIGNvdW50ZXIgd2lsbCBiZSBpbmNyZW1lbnRlZCBmb3IgZXZlcnkgYnlwYXNzZWQgZWxlbWVudCxcbiAgICAgIC8vIGV2ZW4gb25lcyB0aGF0IHdlcmUgY291bnRlZCBiZWZvcmUuXG4gICAgICBudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3MgPSAwO1xuICAgICAgLy8gd2hpbGUgdGhlIGluZGV4IGV4aXN0cyBpbiB0aGUgbGl2ZSA8dXNlPiBjb2xsZWN0aW9uXG4gICAgICBmb3IgKFxuICAgICAgICAvLyBnZXQgdGhlIGNhY2hlZCA8dXNlPiBpbmRleFxuICAgICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgICBpbmRleCA8IHVzZXMubGVuZ3RoO1xuXG4gICAgICApIHtcbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IDx1c2U+XG4gICAgICAgIHZhciB1c2UgPSB1c2VzW2luZGV4XSxcbiAgICAgICAgICBwYXJlbnQgPSB1c2UucGFyZW50Tm9kZSxcbiAgICAgICAgICBzdmcgPSBnZXRTVkdBbmNlc3RvcihwYXJlbnQpLFxuICAgICAgICAgIHNyYyA9IHVzZS5nZXRBdHRyaWJ1dGUoXCJ4bGluazpocmVmXCIpIHx8IHVzZS5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKCFzcmMgJiZcbiAgICAgICAgICAgIG9wdHMuYXR0cmlidXRlTmFtZSAmJlxuICAgICAgICAgICAgKHNyYyA9IHVzZS5nZXRBdHRyaWJ1dGUob3B0cy5hdHRyaWJ1dGVOYW1lKSksXG4gICAgICAgICAgc3ZnICYmIHNyYylcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKHBvbHlmaWxsKSB7XG4gICAgICAgICAgICBpZiAoIW9wdHMudmFsaWRhdGUgfHwgb3B0cy52YWxpZGF0ZShzcmMsIHN2ZywgdXNlKSkge1xuICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIDx1c2U+IGVsZW1lbnRcbiAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHVzZSk7XG4gICAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBzcmMgYW5kIGdldCB0aGUgdXJsIGFuZCBpZFxuICAgICAgICAgICAgICB2YXIgc3JjU3BsaXQgPSBzcmMuc3BsaXQoXCIjXCIpLFxuICAgICAgICAgICAgICAgIHVybCA9IHNyY1NwbGl0LnNoaWZ0KCksXG4gICAgICAgICAgICAgICAgaWQgPSBzcmNTcGxpdC5qb2luKFwiI1wiKTtcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIGxpbmsgaXMgZXh0ZXJuYWxcbiAgICAgICAgICAgICAgaWYgKHVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGNhY2hlZCB4aHIgcmVxdWVzdFxuICAgICAgICAgICAgICAgIHZhciB4aHIgPSByZXF1ZXN0c1t1cmxdO1xuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgeGhyIHJlcXVlc3QgZXhpc3RzXG4gICAgICAgICAgICAgICAgeGhyIHx8XG4gICAgICAgICAgICAgICAgICAoKHhociA9IHJlcXVlc3RzW3VybF0gPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSksXG4gICAgICAgICAgICAgICAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwpLFxuICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoKSxcbiAgICAgICAgICAgICAgICAgICh4aHIuX2VtYmVkcyA9IFtdKSksIC8vIGFkZCB0aGUgc3ZnIGFuZCBpZCBhcyBhbiBpdGVtIHRvIHRoZSB4aHIgZW1iZWRzIGxpc3RcbiAgICAgICAgICAgICAgICAgIHhoci5fZW1iZWRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgc3ZnOiBzdmcsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICAgIH0pLCAvLyBwcmVwYXJlIHRoZSB4aHIgcmVhZHkgc3RhdGUgY2hhbmdlIGV2ZW50XG4gICAgICAgICAgICAgICAgICBsb2FkcmVhZHlzdGF0ZWNoYW5nZSh4aHIsIHVzZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZW1iZWQgdGhlIGxvY2FsIGlkIGludG8gdGhlIHN2Z1xuICAgICAgICAgICAgICAgIGVtYmVkKHBhcmVudCwgc3ZnLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCksIHVzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGluY3JlYXNlIHRoZSBpbmRleCB3aGVuIHRoZSBwcmV2aW91cyB2YWx1ZSB3YXMgbm90IFwidmFsaWRcIlxuICAgICAgICAgICAgICArK2luZGV4LCArK251bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaW5jcmVhc2UgdGhlIGluZGV4IHdoZW4gdGhlIHByZXZpb3VzIHZhbHVlIHdhcyBub3QgXCJ2YWxpZFwiXG4gICAgICAgICAgKytpbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gY29udGludWUgdGhlIGludGVydmFsXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUob25pbnRlcnZhbCwgNjcpO1xuICAgIH1cbiAgICB2YXIgcG9seWZpbGwsXG4gICAgICBvcHRzID0gT2JqZWN0KHJhd29wdHMpLFxuICAgICAgbmV3ZXJJRVVBID0gL1xcYlRyaWRlbnRcXC9bNTY3XVxcYnxcXGJNU0lFICg/Ojl8MTApXFwuMFxcYi8sXG4gICAgICB3ZWJraXRVQSA9IC9cXGJBcHBsZVdlYktpdFxcLyhcXGQrKVxcYi8sXG4gICAgICBvbGRlckVkZ2VVQSA9IC9cXGJFZGdlXFwvMTJcXC4oXFxkKylcXGIvLFxuICAgICAgZWRnZVVBID0gL1xcYkVkZ2VcXC8uKFxcZCspXFxiLyxcbiAgICAgIGluSWZyYW1lID0gd2luZG93LnRvcCAhPT0gd2luZG93LnNlbGY7XG4gICAgcG9seWZpbGwgPVxuICAgICAgXCJwb2x5ZmlsbFwiIGluIG9wdHNcbiAgICAgICAgPyBvcHRzLnBvbHlmaWxsXG4gICAgICAgIDogbmV3ZXJJRVVBLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAgICAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChvbGRlckVkZ2VVQSkgfHwgW10pWzFdIDwgMTA1NDcgfHxcbiAgICAgICAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCh3ZWJraXRVQSkgfHwgW10pWzFdIDwgNTM3IHx8XG4gICAgICAgICAgKGVkZ2VVQS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmIGluSWZyYW1lKTtcbiAgICAvLyBjcmVhdGUgeGhyIHJlcXVlc3RzIG9iamVjdFxuICAgIHZhciByZXF1ZXN0cyA9IHt9LFxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBzZXRUaW1lb3V0LFxuICAgICAgdXNlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidXNlXCIpLFxuICAgICAgbnVtYmVyT2ZTdmdVc2VFbGVtZW50c1RvQnlwYXNzID0gMDtcbiAgICAvLyBjb25kaXRpb25hbGx5IHN0YXJ0IHRoZSBpbnRlcnZhbCBpZiB0aGUgcG9seWZpbGwgaXMgYWN0aXZlXG4gICAgcG9seWZpbGwgJiYgb25pbnRlcnZhbCgpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFNWR0FuY2VzdG9yKG5vZGUpIHtcbiAgICBmb3IgKFxuICAgICAgdmFyIHN2ZyA9IG5vZGU7XG4gICAgICBcInN2Z1wiICE9PSBzdmcubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAmJiAoc3ZnID0gc3ZnLnBhcmVudE5vZGUpO1xuXG4gICAgKSB7fVxuICAgIHJldHVybiBzdmc7XG4gIH1cbiAgcmV0dXJuIHN2ZzRldmVyeWJvZHk7XG59KTtcbiIsIndpbmRvdy51c3dkc1ByZXNlbnQgPSB0cnVlOyAvLyBHTE9CQUwgdmFyaWFibGUgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXN3ZHMuanMgaGFzIGxvYWRlZCBpbiB0aGUgRE9NLlxuXG4vKipcbiAqIFRoZSAncG9seWZpbGxzJyBkZWZpbmUga2V5IEVDTUFTY3JpcHQgNSBtZXRob2RzIHRoYXQgbWF5IGJlIG1pc3NpbmcgZnJvbVxuICogb2xkZXIgYnJvd3NlcnMsIHNvIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICovXG5yZXF1aXJlKFwiLi9wb2x5ZmlsbHNcIik7XG5cbmNvbnN0IHVzd2RzID0gcmVxdWlyZShcIi4vY29uZmlnXCIpO1xuXG5jb25zdCBjb21wb25lbnRzID0gcmVxdWlyZShcIi4vaW5kZXhcIik7XG5jb25zdCBzdmc0ZXZlcnlib2R5ID0gcmVxdWlyZShcIi4vcG9seWZpbGxzL3N2ZzRldmVyeWJvZHlcIik7XG5cbnVzd2RzLmNvbXBvbmVudHMgPSBjb21wb25lbnRzO1xuXG5jb25zdCBpbml0Q29tcG9uZW50cyA9ICgpID0+IHtcbiAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcbiAgT2JqZWN0LmtleXMoY29tcG9uZW50cykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgY29uc3QgYmVoYXZpb3IgPSBjb21wb25lbnRzW2tleV07XG4gICAgYmVoYXZpb3Iub24odGFyZ2V0KTtcbiAgfSk7XG4gIHN2ZzRldmVyeWJvZHkoKTtcbn07XG5cbmlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBpbml0Q29tcG9uZW50cywgeyBvbmNlOiB0cnVlIH0pO1xufSBlbHNlIHtcbiAgaW5pdENvbXBvbmVudHMoKTtcbn1cblxuZXhwb3J0cy5kZWZhdWx0ID0gdXN3ZHM7XG5leHBvcnRzLmluaXRDb21wb25lbnRzID0gaW5pdENvbXBvbmVudHM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChodG1sRG9jdW1lbnQgPSBkb2N1bWVudCkgPT4gaHRtbERvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKFwib2JqZWN0LWFzc2lnblwiKTtcbmNvbnN0IEJlaGF2aW9yID0gcmVxdWlyZShcInJlY2VwdG9yL2JlaGF2aW9yXCIpO1xuXG4vKipcbiAqIEBuYW1lIHNlcXVlbmNlXG4gKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBzZXEgYW4gYXJyYXkgb2YgZnVuY3Rpb25zXG4gKiBAcmV0dXJuIHsgY2xvc3VyZSB9IGNhbGxIb29rc1xuICovXG4vLyBXZSB1c2UgYSBuYW1lZCBmdW5jdGlvbiBoZXJlIGJlY2F1c2Ugd2Ugd2FudCBpdCB0byBpbmhlcml0IGl0cyBsZXhpY2FsIHNjb3BlXG4vLyBmcm9tIHRoZSBiZWhhdmlvciBwcm9wcyBvYmplY3QsIG5vdCBmcm9tIHRoZSBtb2R1bGVcbmNvbnN0IHNlcXVlbmNlID0gKC4uLnNlcSkgPT5cbiAgZnVuY3Rpb24gY2FsbEhvb2tzKHRhcmdldCA9IGRvY3VtZW50LmJvZHkpIHtcbiAgICBzZXEuZm9yRWFjaCgobWV0aG9kKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRoaXNbbWV0aG9kXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXNbbWV0aG9kXS5jYWxsKHRoaXMsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbi8qKlxuICogQG5hbWUgYmVoYXZpb3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNcbiAqIEBwYXJhbSB7b2JqZWN0P30gcHJvcHNcbiAqIEByZXR1cm4ge3JlY2VwdG9yLmJlaGF2aW9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudHMsIHByb3BzKSA9PlxuICBCZWhhdmlvcihcbiAgICBldmVudHMsXG4gICAgYXNzaWduKFxuICAgICAge1xuICAgICAgICBvbjogc2VxdWVuY2UoXCJpbml0XCIsIFwiYWRkXCIpLFxuICAgICAgICBvZmY6IHNlcXVlbmNlKFwidGVhcmRvd25cIiwgXCJyZW1vdmVcIiksXG4gICAgICB9LFxuICAgICAgcHJvcHNcbiAgICApXG4gICk7XG4iLCIvKipcbiAqIENhbGwgYSBmdW5jdGlvbiBldmVyeSBYIGFtb3VudCBvZiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBkZWJvdW5jZWRcbiAqIEBwYXJhbSAge251bWJlcn0gZGVsYXkgLSBNaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgY2FsbGluZyBmdW5jdGlvblxuICogQHJldHVybnMge0Z1bmN0aW9ufSBBIGRlYm91bmNlZCBmdW5jdGlvblxuICogQGV4YW1wbGUgY29uc3QgdXBkYXRlU3RhdHVzID0gZGVib3VuY2UoKHN0cmluZykgPT4gY29uc29sZS5sb2coc3RyaW5nKSwgMjAwMClcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlKGNhbGxiYWNrLCBkZWxheSA9IDUwMCkge1xuICBsZXQgdGltZXIgPSBudWxsO1xuICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0sIGRlbGF5KTtcbiAgfTtcbn07XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKFwib2JqZWN0LWFzc2lnblwiKTtcbmNvbnN0IHsga2V5bWFwIH0gPSByZXF1aXJlKFwicmVjZXB0b3JcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4vc2VsZWN0XCIpO1xuY29uc3QgYWN0aXZlRWxlbWVudCA9IHJlcXVpcmUoXCIuL2FjdGl2ZS1lbGVtZW50XCIpO1xuXG5jb25zdCBGT0NVU0FCTEUgPVxuICAnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgW3RhYmluZGV4PVwiMFwiXSwgW2NvbnRlbnRlZGl0YWJsZV0nO1xuXG5jb25zdCB0YWJIYW5kbGVyID0gKGNvbnRleHQpID0+IHtcbiAgY29uc3QgZm9jdXNhYmxlRWxlbWVudHMgPSBzZWxlY3QoRk9DVVNBQkxFLCBjb250ZXh0KTtcbiAgY29uc3QgZmlyc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbMF07XG4gIGNvbnN0IGxhc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoIC0gMV07XG5cbiAgLy8gU3BlY2lhbCBydWxlcyBmb3Igd2hlbiB0aGUgdXNlciBpcyB0YWJiaW5nIGZvcndhcmQgZnJvbSB0aGUgbGFzdCBmb2N1c2FibGUgZWxlbWVudCxcbiAgLy8gb3Igd2hlbiB0YWJiaW5nIGJhY2t3YXJkcyBmcm9tIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudFxuICBmdW5jdGlvbiB0YWJBaGVhZChldmVudCkge1xuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGxhc3RUYWJTdG9wKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdGFiQmFjayhldmVudCkge1xuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGZpcnN0VGFiU3RvcCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxhc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICAgIC8vIFRoaXMgY2hlY2tzIGlmIHlvdSB3YW50IHRvIHNldCB0aGUgaW5pdGlhbCBmb2N1cyB0byBhIGNvbnRhaW5lclxuICAgIC8vIGluc3RlYWQgb2YgYW4gZWxlbWVudCB3aXRoaW4sIGFuZCB0aGUgdXNlciB0YWJzIGJhY2suXG4gICAgLy8gVGhlbiB3ZSBzZXQgdGhlIGZvY3VzIHRvIHRoZSBmaXJzdFxuICAgIGVsc2UgaWYgKCFmb2N1c2FibGVFbGVtZW50cy5pbmNsdWRlcyhhY3RpdmVFbGVtZW50KCkpKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBmaXJzdFRhYlN0b3AsXG4gICAgbGFzdFRhYlN0b3AsXG4gICAgdGFiQWhlYWQsXG4gICAgdGFiQmFjayxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKGNvbnRleHQsIGFkZGl0aW9uYWxLZXlCaW5kaW5ncyA9IHt9KSA9PiB7XG4gIGNvbnN0IHRhYkV2ZW50SGFuZGxlciA9IHRhYkhhbmRsZXIoY29udGV4dCk7XG4gIGNvbnN0IGJpbmRpbmdzID0gYWRkaXRpb25hbEtleUJpbmRpbmdzO1xuICBjb25zdCB7IEVzYywgRXNjYXBlIH0gPSBiaW5kaW5ncztcblxuICBpZiAoRXNjYXBlICYmICFFc2MpIGJpbmRpbmdzLkVzYyA9IEVzY2FwZTtcblxuICAvLyAgVE9ETzogSW4gdGhlIGZ1dHVyZSwgbG9vcCBvdmVyIGFkZGl0aW9uYWwga2V5YmluZGluZ3MgYW5kIHBhc3MgYW4gYXJyYXlcbiAgLy8gb2YgZnVuY3Rpb25zLCBpZiBuZWNlc3NhcnksIHRvIHRoZSBtYXAga2V5cy4gVGhlbiBwZW9wbGUgaW1wbGVtZW50aW5nXG4gIC8vIHRoZSBmb2N1cyB0cmFwIGNvdWxkIHBhc3MgY2FsbGJhY2tzIHRvIGZpcmUgd2hlbiB0YWJiaW5nXG4gIGNvbnN0IGtleU1hcHBpbmdzID0ga2V5bWFwKFxuICAgIGFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgVGFiOiB0YWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgICAgIFwiU2hpZnQrVGFiXCI6IHRhYkV2ZW50SGFuZGxlci50YWJCYWNrLFxuICAgICAgfSxcbiAgICAgIGFkZGl0aW9uYWxLZXlCaW5kaW5nc1xuICAgIClcbiAgKTtcblxuICBjb25zdCBmb2N1c1RyYXAgPSBiZWhhdmlvcihcbiAgICB7XG4gICAgICBrZXlkb3duOiBrZXlNYXBwaW5ncyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGluaXQoKSB7XG4gICAgICAgIC8vIFRPRE86IGlzIHRoaXMgZGVzaXJlYWJsZSBiZWhhdmlvcj8gU2hvdWxkIHRoZSB0cmFwIGFsd2F5cyBkbyB0aGlzIGJ5IGRlZmF1bHQgb3Igc2hvdWxkXG4gICAgICAgIC8vIHRoZSBjb21wb25lbnQgZ2V0dGluZyBkZWNvcmF0ZWQgaGFuZGxlIHRoaXM/XG4gICAgICAgIGlmICh0YWJFdmVudEhhbmRsZXIuZmlyc3RUYWJTdG9wKSB7XG4gICAgICAgICAgdGFiRXZlbnRIYW5kbGVyLmZpcnN0VGFiU3RvcC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdXBkYXRlKGlzQWN0aXZlKSB7XG4gICAgICAgIGlmIChpc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMub24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1cbiAgKTtcblxuICByZXR1cm4gZm9jdXNUcmFwO1xufTtcbiIsIi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS83NTU3NDMzXG5mdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0KFxuICBlbCxcbiAgd2luID0gd2luZG93LFxuICBkb2NFbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuKSB7XG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICByZXR1cm4gKFxuICAgIHJlY3QudG9wID49IDAgJiZcbiAgICByZWN0LmxlZnQgPj0gMCAmJlxuICAgIHJlY3QuYm90dG9tIDw9ICh3aW4uaW5uZXJIZWlnaHQgfHwgZG9jRWwuY2xpZW50SGVpZ2h0KSAmJlxuICAgIHJlY3QucmlnaHQgPD0gKHdpbi5pbm5lcldpZHRoIHx8IGRvY0VsLmNsaWVudFdpZHRoKVxuICApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRWxlbWVudEluVmlld3BvcnQ7XG4iLCIvLyBpT1MgZGV0ZWN0aW9uIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzkwMzk4ODUvMTc3NzEwXG5mdW5jdGlvbiBpc0lvc0RldmljZSgpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goLyhpUG9kfGlQaG9uZXxpUGFkKS9nKSB8fFxuICAgICAgKG5hdmlnYXRvci5wbGF0Zm9ybSA9PT0gXCJNYWNJbnRlbFwiICYmIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDEpKSAmJlxuICAgICF3aW5kb3cuTVNTdHJlYW1cbiAgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0lvc0RldmljZTtcbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG4vKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlICovXG5cbi8qKlxuICogQSBzaW1wbGUgbGlicmFyeSB0byBoZWxwIHlvdSBlc2NhcGUgSFRNTCB1c2luZyB0ZW1wbGF0ZSBzdHJpbmdzLlxuICpcbiAqIEl0J3MgdGhlIGNvdW50ZXJwYXJ0IHRvIG91ciBlc2xpbnQgXCJuby11bnNhZmUtaW5uZXJodG1sXCIgcGx1Z2luIHRoYXQgaGVscHMgdXNcbiAqIGF2b2lkIHVuc2FmZSBjb2RpbmcgcHJhY3RpY2VzLlxuICogQSBmdWxsIHdyaXRlLXVwIG9mIHRoZSBIb3dzIGFuZCBXaHlzIGFyZSBkb2N1bWVudGVkXG4gKiBmb3IgZGV2ZWxvcGVycyBhdFxuICogIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL0ZpcmVmb3hfT1MvU2VjdXJpdHkvU2VjdXJpdHlfQXV0b21hdGlvblxuICogd2l0aCBhZGRpdGlvbmFsIGJhY2tncm91bmQgaW5mb3JtYXRpb24gYW5kIGRlc2lnbiBkb2NzIGF0XG4gKiAgaHR0cHM6Ly93aWtpLm1vemlsbGEub3JnL1VzZXI6RmJyYXVuL0dhaWEvU2FmZWlubmVySFRNTFJvYWRtYXBcbiAqXG4gKi9cblxuIShmdW5jdGlvbiAoZmFjdG9yeSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbn0pKGZ1bmN0aW9uICgpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmFyIFNhbml0aXplciA9IHtcbiAgICBfZW50aXR5OiAvWyY8PlwiJy9dL2csXG5cbiAgICBfZW50aXRpZXM6IHtcbiAgICAgIFwiJlwiOiBcIiZhbXA7XCIsXG4gICAgICBcIjxcIjogXCImbHQ7XCIsXG4gICAgICBcIj5cIjogXCImZ3Q7XCIsXG4gICAgICAnXCInOiBcIiZxdW90O1wiLFxuICAgICAgXCInXCI6IFwiJmFwb3M7XCIsXG4gICAgICBcIi9cIjogXCImI3gyRjtcIixcbiAgICB9LFxuXG4gICAgZ2V0RW50aXR5OiBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIFNhbml0aXplci5fZW50aXRpZXNbc107XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgSFRNTCBmb3IgYWxsIHZhbHVlcyBpbiBhIHRhZ2dlZCB0ZW1wbGF0ZSBzdHJpbmcuXG4gICAgICovXG4gICAgZXNjYXBlSFRNTDogZnVuY3Rpb24gKHN0cmluZ3MpIHtcbiAgICAgIHZhciByZXN1bHQgPSBcIlwiO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVzdWx0ICs9IHN0cmluZ3NbaV07XG4gICAgICAgIGlmIChpICsgMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBhcmd1bWVudHNbaSArIDFdIHx8IFwiXCI7XG4gICAgICAgICAgcmVzdWx0ICs9IFN0cmluZyh2YWx1ZSkucmVwbGFjZShcbiAgICAgICAgICAgIFNhbml0aXplci5fZW50aXR5LFxuICAgICAgICAgICAgU2FuaXRpemVyLmdldEVudGl0eVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgSFRNTCBhbmQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRvIGJlIHVzZWQgZHVyaW5nIERPTSBpbnNlcnRpb25cbiAgICAgKi9cbiAgICBjcmVhdGVTYWZlSFRNTDogZnVuY3Rpb24gKHN0cmluZ3MpIHtcbiAgICAgIHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApO1xuICAgICAgZm9yICh2YXIgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgdmFsdWVzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgIH1cblxuICAgICAgdmFyIGVzY2FwZWQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTC5hcHBseShcbiAgICAgICAgU2FuaXRpemVyLFxuICAgICAgICBbc3RyaW5nc10uY29uY2F0KHZhbHVlcylcbiAgICAgICk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBfX2h0bWw6IGVzY2FwZWQsXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIFwiW29iamVjdCBXcmFwcGVkSFRNTE9iamVjdF1cIjtcbiAgICAgICAgfSxcbiAgICAgICAgaW5mbzpcbiAgICAgICAgICBcIlRoaXMgaXMgYSB3cmFwcGVkIEhUTUwgb2JqZWN0LiBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vclwiICtcbiAgICAgICAgICBcImcvZW4tVVMvRmlyZWZveF9PUy9TZWN1cml0eS9TZWN1cml0eV9BdXRvbWF0aW9uIGZvciBtb3JlLlwiLFxuICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFVud3JhcCBzYWZlIEhUTUwgY3JlYXRlZCBieSBjcmVhdGVTYWZlSFRNTCBvciBhIGN1c3RvbSByZXBsYWNlbWVudCB0aGF0XG4gICAgICogdW5kZXJ3ZW50IHNlY3VyaXR5IHJldmlldy5cbiAgICAgKi9cbiAgICB1bndyYXBTYWZlSFRNTDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgdmFyIGh0bWxPYmplY3RzID0gbmV3IEFycmF5KF9sZW4pO1xuICAgICAgZm9yICh2YXIgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgaHRtbE9iamVjdHNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICB9XG5cbiAgICAgIHZhciBtYXJrdXBMaXN0ID0gaHRtbE9iamVjdHMubWFwKGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iai5fX2h0bWw7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXJrdXBMaXN0LmpvaW4oXCJcIik7XG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gU2FuaXRpemVyO1xufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFNjcm9sbGJhcldpZHRoKCkge1xuICAvLyBDcmVhdGluZyBpbnZpc2libGUgY29udGFpbmVyXG4gIGNvbnN0IG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjsgLy8gZm9yY2luZyBzY3JvbGxiYXIgdG8gYXBwZWFyXG4gIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9IFwic2Nyb2xsYmFyXCI7IC8vIG5lZWRlZCBmb3IgV2luSlMgYXBwc1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcblxuICAvLyBDcmVhdGluZyBpbm5lciBlbGVtZW50IGFuZCBwbGFjaW5nIGl0IGluIHRoZSBjb250YWluZXJcbiAgY29uc3QgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgLy8gQ2FsY3VsYXRpbmcgZGlmZmVyZW5jZSBiZXR3ZWVuIGNvbnRhaW5lcidzIGZ1bGwgd2lkdGggYW5kIHRoZSBjaGlsZCB3aWR0aFxuICBjb25zdCBzY3JvbGxiYXJXaWR0aCA9IGAke291dGVyLm9mZnNldFdpZHRoIC0gaW5uZXIub2Zmc2V0V2lkdGh9cHhgO1xuXG4gIC8vIFJlbW92aW5nIHRlbXBvcmFyeSBlbGVtZW50cyBmcm9tIHRoZSBET01cbiAgb3V0ZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdXRlcik7XG5cbiAgcmV0dXJuIHNjcm9sbGJhcldpZHRoO1xufTtcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuL3NlbGVjdFwiKTtcbi8qKlxuICogQG5hbWUgaXNFbGVtZW50XG4gKiBAZGVzYyByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIERPTSBlbGVtZW50LlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBpc0VsZW1lbnQgPSAodmFsdWUpID0+XG4gIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMTtcblxuLyoqXG4gKiBAbmFtZSBzZWxlY3RPck1hdGNoZXNcbiAqIEBkZXNjIHNlbGVjdHMgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGJ5IGNsYXNzIHNlbGVjdG9yIG9yIElEIHNlbGVjdG9yLlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIC0gVGhlIHNlbGVjdG9yIHRvIHRyYXZlcnNlIHRoZSBET00gd2l0aC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR8SFRNTEVsZW1lbnQ/fSBjb250ZXh0IC0gVGhlIGNvbnRleHQgdG8gdHJhdmVyc2UgdGhlIERPTVxuICogICBpbi4gSWYgbm90IHByb3ZpZGVkLCBpdCBkZWZhdWx0cyB0byB0aGUgZG9jdW1lbnQuXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudFtdfSAtIEFuIGFycmF5IG9mIERPTSBub2RlcyBvciBhbiBlbXB0eSBhcnJheS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoc2VsZWN0b3IsIGNvbnRleHQpID0+IHtcbiAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0KHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cblxuICBpZiAoaXNFbGVtZW50KGNvbnRleHQpICYmIGNvbnRleHQubWF0Y2hlcyhzZWxlY3RvcikpIHtcbiAgICBzZWxlY3Rpb24ucHVzaChjb250ZXh0KTtcbiAgfVxuXG4gIHJldHVybiBzZWxlY3Rpb247XG59O1xuIiwiLyoqXG4gKiBAbmFtZSBpc0VsZW1lbnRcbiAqIEBkZXNjIHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgRE9NIGVsZW1lbnQuXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzRWxlbWVudCA9ICh2YWx1ZSkgPT5cbiAgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlLm5vZGVUeXBlID09PSAxO1xuXG4vKipcbiAqIEBuYW1lIHNlbGVjdFxuICogQGRlc2Mgc2VsZWN0cyBlbGVtZW50cyBmcm9tIHRoZSBET00gYnkgY2xhc3Mgc2VsZWN0b3Igb3IgSUQgc2VsZWN0b3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgLSBUaGUgc2VsZWN0b3IgdG8gdHJhdmVyc2UgdGhlIERPTSB3aXRoLlxuICogQHBhcmFtIHtEb2N1bWVudHxIVE1MRWxlbWVudD99IGNvbnRleHQgLSBUaGUgY29udGV4dCB0byB0cmF2ZXJzZSB0aGUgRE9NXG4gKiAgIGluLiBJZiBub3QgcHJvdmlkZWQsIGl0IGRlZmF1bHRzIHRvIHRoZSBkb2N1bWVudC5cbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzIG9yIGFuIGVtcHR5IGFycmF5LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChzZWxlY3RvciwgY29udGV4dCkgPT4ge1xuICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgaWYgKCFjb250ZXh0IHx8ICFpc0VsZW1lbnQoY29udGV4dCkpIHtcbiAgICBjb250ZXh0ID0gd2luZG93LmRvY3VtZW50OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gIH1cblxuICBjb25zdCBzZWxlY3Rpb24gPSBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoc2VsZWN0aW9uKTtcbn07XG4iLCIvKipcbiAqIEZsaXBzIGdpdmVuIElOUFVUIGVsZW1lbnRzIGJldHdlZW4gbWFza2VkIChoaWRpbmcgdGhlIGZpZWxkIHZhbHVlKSBhbmQgdW5tYXNrZWRcbiAqIEBwYXJhbSB7QXJyYXkuSFRNTEVsZW1lbnR9IGZpZWxkcyAtIEFuIGFycmF5IG9mIElOUFVUIGVsZW1lbnRzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG1hc2sgLSBXaGV0aGVyIHRoZSBtYXNrIHNob3VsZCBiZSBhcHBsaWVkLCBoaWRpbmcgdGhlIGZpZWxkIHZhbHVlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZpZWxkLCBtYXNrKSA9PiB7XG4gIGZpZWxkLnNldEF0dHJpYnV0ZShcImF1dG9jYXBpdGFsaXplXCIsIFwib2ZmXCIpO1xuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29ycmVjdFwiLCBcIm9mZlwiKTtcbiAgZmllbGQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBtYXNrID8gXCJwYXNzd29yZFwiIDogXCJ0ZXh0XCIpO1xufTtcbiIsImNvbnN0IHJlc29sdmVJZFJlZnMgPSByZXF1aXJlKFwicmVzb2x2ZS1pZC1yZWZzXCIpO1xuY29uc3QgdG9nZ2xlRmllbGRNYXNrID0gcmVxdWlyZShcIi4vdG9nZ2xlLWZpZWxkLW1hc2tcIik7XG5cbmNvbnN0IENPTlRST0xTID0gXCJhcmlhLWNvbnRyb2xzXCI7XG5jb25zdCBQUkVTU0VEID0gXCJhcmlhLXByZXNzZWRcIjtcbmNvbnN0IFNIT1dfQVRUUiA9IFwiZGF0YS1zaG93LXRleHRcIjtcbmNvbnN0IEhJREVfQVRUUiA9IFwiZGF0YS1oaWRlLXRleHRcIjtcblxuLyoqXG4gKiBSZXBsYWNlIHRoZSB3b3JkIFwiU2hvd1wiIChvciBcInNob3dcIikgd2l0aCBcIkhpZGVcIiAob3IgXCJoaWRlXCIpIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHNob3dUZXh0XG4gKiBAcmV0dXJuIHtzdHJvbmd9IGhpZGVUZXh0XG4gKi9cbmNvbnN0IGdldEhpZGVUZXh0ID0gKHNob3dUZXh0KSA9PlxuICBzaG93VGV4dC5yZXBsYWNlKC9cXGJTaG93XFxiL2ksIChzaG93KSA9PiBgJHtzaG93WzBdID09PSBcIlNcIiA/IFwiSFwiIDogXCJoXCJ9aWRlYCk7XG5cbi8qKlxuICogQ29tcG9uZW50IHRoYXQgZGVjb3JhdGVzIGFuIEhUTUwgZWxlbWVudCB3aXRoIHRoZSBhYmlsaXR5IHRvIHRvZ2dsZSB0aGVcbiAqIG1hc2tlZCBzdGF0ZSBvZiBhbiBpbnB1dCBmaWVsZCAobGlrZSBhIHBhc3N3b3JkKSB3aGVuIGNsaWNrZWQuXG4gKiBUaGUgaWRzIG9mIHRoZSBmaWVsZHMgdG8gYmUgbWFza2VkIHdpbGwgYmUgcHVsbGVkIGRpcmVjdGx5IGZyb20gdGhlIGJ1dHRvbidzXG4gKiBgYXJpYS1jb250cm9sc2AgYXR0cmlidXRlLlxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICBQYXJlbnQgZWxlbWVudCBjb250YWluaW5nIHRoZSBmaWVsZHMgdG8gYmUgbWFza2VkXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChlbCkgPT4ge1xuICAvLyB0aGlzIGlzIHRoZSAqdGFyZ2V0KiBzdGF0ZTpcbiAgLy8gKiBpZiB0aGUgZWxlbWVudCBoYXMgdGhlIGF0dHIgYW5kIGl0J3MgIT09IFwidHJ1ZVwiLCBwcmVzc2VkIGlzIHRydWVcbiAgLy8gKiBvdGhlcndpc2UsIHByZXNzZWQgaXMgZmFsc2VcbiAgY29uc3QgcHJlc3NlZCA9XG4gICAgZWwuaGFzQXR0cmlidXRlKFBSRVNTRUQpICYmIGVsLmdldEF0dHJpYnV0ZShQUkVTU0VEKSAhPT0gXCJ0cnVlXCI7XG5cbiAgY29uc3QgZmllbGRzID0gcmVzb2x2ZUlkUmVmcyhlbC5nZXRBdHRyaWJ1dGUoQ09OVFJPTFMpKTtcbiAgZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB0b2dnbGVGaWVsZE1hc2soZmllbGQsIHByZXNzZWQpKTtcblxuICBpZiAoIWVsLmhhc0F0dHJpYnV0ZShTSE9XX0FUVFIpKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKFNIT1dfQVRUUiwgZWwudGV4dENvbnRlbnQpO1xuICB9XG5cbiAgY29uc3Qgc2hvd1RleHQgPSBlbC5nZXRBdHRyaWJ1dGUoU0hPV19BVFRSKTtcbiAgY29uc3QgaGlkZVRleHQgPSBlbC5nZXRBdHRyaWJ1dGUoSElERV9BVFRSKSB8fCBnZXRIaWRlVGV4dChzaG93VGV4dCk7XG5cbiAgZWwudGV4dENvbnRlbnQgPSBwcmVzc2VkID8gc2hvd1RleHQgOiBoaWRlVGV4dDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICBlbC5zZXRBdHRyaWJ1dGUoUFJFU1NFRCwgcHJlc3NlZCk7XG4gIHJldHVybiBwcmVzc2VkO1xufTtcbiIsImNvbnN0IEVYUEFOREVEID0gXCJhcmlhLWV4cGFuZGVkXCI7XG5jb25zdCBDT05UUk9MUyA9IFwiYXJpYS1jb250cm9sc1wiO1xuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcblxubW9kdWxlLmV4cG9ydHMgPSAoYnV0dG9uLCBleHBhbmRlZCkgPT4ge1xuICBsZXQgc2FmZUV4cGFuZGVkID0gZXhwYW5kZWQ7XG5cbiAgaWYgKHR5cGVvZiBzYWZlRXhwYW5kZWQgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgc2FmZUV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwiZmFsc2VcIjtcbiAgfVxuXG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoRVhQQU5ERUQsIHNhZmVFeHBhbmRlZCk7XG5cbiAgY29uc3QgaWQgPSBidXR0b24uZ2V0QXR0cmlidXRlKENPTlRST0xTKTtcbiAgY29uc3QgY29udHJvbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghY29udHJvbHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHRvZ2dsZSB0YXJnZXQgZm91bmQgd2l0aCBpZDogXCIke2lkfVwiYCk7XG4gIH1cblxuICBpZiAoc2FmZUV4cGFuZGVkKSB7XG4gICAgY29udHJvbHMucmVtb3ZlQXR0cmlidXRlKEhJRERFTik7XG4gIH0gZWxzZSB7XG4gICAgY29udHJvbHMuc2V0QXR0cmlidXRlKEhJRERFTiwgXCJcIik7XG4gIH1cblxuICByZXR1cm4gc2FmZUV4cGFuZGVkO1xufTtcbiIsImNvbnN0IGRlYm91bmNlID0gcmVxdWlyZShcIi4vZGVib3VuY2VcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBDSEVDS0VEX0NMQVNTID0gYCR7UFJFRklYfS1jaGVja2xpc3RfX2l0ZW0tLWNoZWNrZWRgO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHZhbGlkYXRlKGVsKSB7XG4gIGNvbnN0IGlkID0gZWwuZGF0YXNldC52YWxpZGF0aW9uRWxlbWVudDtcbiAgY29uc3QgY2hlY2tMaXN0ID1cbiAgICBpZC5jaGFyQXQoMCkgPT09IFwiI1wiXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaWQpXG4gICAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblxuICBpZiAoIWNoZWNrTGlzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm8gdmFsaWRhdGlvbiBlbGVtZW50IGZvdW5kIHdpdGggaWQ6IFwiJHtpZH1cImApO1xuICB9XG5cbiAgbGV0IHN0YXR1c1N1bW1hcnkgPSBcIlwiO1xuICBPYmplY3QuZW50cmllcyhlbC5kYXRhc2V0KS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoXCJ2YWxpZGF0ZVwiKSkge1xuICAgICAgY29uc3QgdmFsaWRhdG9yTmFtZSA9IGtleS5zdWJzdHIoXCJ2YWxpZGF0ZVwiLmxlbmd0aCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IHZhbGlkYXRvclBhdHRlcm4gPSBuZXcgUmVnRXhwKHZhbHVlKTtcbiAgICAgIGNvbnN0IHZhbGlkYXRvclNlbGVjdG9yID0gYFtkYXRhLXZhbGlkYXRvcj1cIiR7dmFsaWRhdG9yTmFtZX1cIl1gO1xuICAgICAgY29uc3QgdmFsaWRhdG9yQ2hlY2tib3ggPSBjaGVja0xpc3QucXVlcnlTZWxlY3Rvcih2YWxpZGF0b3JTZWxlY3Rvcik7XG4gICAgICBjb25zdCB2YWxpZGF0b3JQYXJlbnQgPSBlbC5wYXJlbnROb2RlO1xuICAgICAgY29uc3Qgc3RhdHVzU3VtbWFyeUNvbnRhaW5lciA9IHZhbGlkYXRvclBhcmVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBgW2RhdGEtdmFsaWRhdGlvbi1zdGF0dXNdYFxuICAgICAgKTtcblxuICAgICAgY29uc3QgY2hlY2tlZCA9IHZhbGlkYXRvclBhdHRlcm4udGVzdChlbC52YWx1ZSk7XG4gICAgICB2YWxpZGF0b3JDaGVja2JveC5jbGFzc0xpc3QudG9nZ2xlKENIRUNLRURfQ0xBU1MsIGNoZWNrZWQpO1xuXG4gICAgICBpZiAoIXZhbGlkYXRvckNoZWNrYm94KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gdmFsaWRhdG9yIGNoZWNrYm94IGZvdW5kIGZvcjogXCIke3ZhbGlkYXRvck5hbWV9XCJgKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIHN0YXR1cyByZXBvcnRzIGZvciBjaGVja2xpc3QgaXRlbXNcbiAgICAgIGNvbnN0IHN0YXR1c0NvbXBsZXRlID0gZWwuZGF0YXNldC52YWxpZGF0aW9uQ29tcGxldGUgfHwgXCJzdGF0dXMgY29tcGxldGVcIjtcbiAgICAgIGNvbnN0IHN0YXR1c0luY29tcGxldGUgPVxuICAgICAgICBlbC5kYXRhc2V0LnZhbGlkYXRpb25JbmNvbXBsZXRlIHx8IFwic3RhdHVzIGluY29tcGxldGVcIjtcbiAgICAgIGxldCBjaGVja2JveENvbnRlbnQgPSBgJHt2YWxpZGF0b3JDaGVja2JveC50ZXh0Q29udGVudH0gYDtcblxuICAgICAgaWYgKHZhbGlkYXRvckNoZWNrYm94LmNsYXNzTGlzdC5jb250YWlucyhDSEVDS0VEX0NMQVNTKSkge1xuICAgICAgICBjaGVja2JveENvbnRlbnQgKz0gc3RhdHVzQ29tcGxldGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGVja2JveENvbnRlbnQgKz0gc3RhdHVzSW5jb21wbGV0ZTtcbiAgICAgIH1cblxuICAgICAgLy8gbW92ZSBzdGF0dXMgdXBkYXRlcyB0byBhcmlhLWxhYmVsIG9uIGNoZWNrbGlzdCBpdGVtXG4gICAgICB2YWxpZGF0b3JDaGVja2JveC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGNoZWNrYm94Q29udGVudCk7XG5cbiAgICAgIC8vIENyZWF0ZSBhIHN1bW1hcnkgb2Ygc3RhdHVzIGZvciBhbGwgY2hlY2tsaXN0IGl0ZW1zXG4gICAgICBzdGF0dXNTdW1tYXJ5ICs9IGAke2NoZWNrYm94Q29udGVudH0uIGA7XG5cbiAgICAgIC8vIEFkZCBzdW1tYXJ5IHRvIHNjcmVlbiByZWFkZXIgc3VtbWFyeSBjb250YWluZXIsIGFmdGVyIGEgZGVsYXlcbiAgICAgIGNvbnN0IHNyVXBkYXRlU3RhdHVzID0gZGVib3VuY2UoKCkgPT4ge1xuICAgICAgICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLnRleHRDb250ZW50ID0gc3RhdHVzU3VtbWFyeTtcbiAgICAgIH0sIDEwMDApO1xuXG4gICAgICBzclVwZGF0ZVN0YXR1cygpO1xuICAgIH1cbiAgfSk7XG59O1xuIl19
