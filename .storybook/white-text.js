"use strict";

module.exports = whiteTextExtension;

function whiteTextExtension(Twig) {
  Twig.extendFunction("whitetext", function (content) {
    return content;
  });
}
