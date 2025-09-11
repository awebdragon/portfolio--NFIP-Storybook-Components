setTimeout(() => {
  const bgColors = ["#002231", "#012b46", "#003d67", "#005288", "#3d7ca5"];

  class Tabs {
    activeTab = 0;

    constructor(tabgroup) {
      this.tabgroup = tabgroup;
      this.tabs = tabgroup.querySelectorAll("[role=tab]");
      this.panels = tabgroup.querySelectorAll("[role=tabpanel]");
      this.mobileContainer = tabgroup.querySelector(".nfip-tabs-mobile");
      this.mobileSelect = tabgroup.querySelector(".nfip-tabs-mobile select");

      this.tabs.forEach((tab, index) => {
        if (tab.getAttribute("aria-selected") === "true") {
          this.activeTab = index;
        }

        tab.addEventListener("click", () => {
          this.setSelectedTab(index);
        });
      });

      this.mobileSelect.addEventListener(
        "change",
        this.mobileSelectAction.bind(this)
      );
    }

    setSelectedTab(index) {
      // alert("???");
      this.activeTab = index;

      this.panels.forEach((item) => {
        item.setAttribute("hidden", true);
      });

      this.tabs.forEach((item) => {
        item.setAttribute("aria-selected", "false");
      });

      this.tabs[this.activeTab].setAttribute("aria-selected", "true");
      this.panels[this.activeTab].removeAttribute("hidden");
      this.mobileSelect.value = this.activeTab;

      for (let i = 0; i < this.tabs.length; i++) {
        this.tabgroup.classList.remove(`active-${i}`);
      }

      this.tabgroup.classList.add(`active-${this.activeTab}`);
      // this.mobileContainer.style.backgroundColor = bgColors[this.activeTab];
    }

    mobileSelectAction() {
      //console.log(this.mobileSelect.options[this.mobileSelect.selectedIndex].text);
      this.setSelectedTab(this.mobileSelect.value);
    }
  }

  const nfipTabs = document.querySelectorAll(".nfip-tabs");
  nfipTabs.forEach((tabgroup) => {
    new Tabs(tabgroup);
  });
}, 1000);
