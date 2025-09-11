setTimeout(() => {
  var linkitems = document.querySelectorAll(".nfip-link-list ul li button");
  linkitems.forEach(function (linkitem) {
    linkitem.addEventListener("click", function () {
      openOverlay(this.getAttribute("class"));
    });
  });
}, 1000);
