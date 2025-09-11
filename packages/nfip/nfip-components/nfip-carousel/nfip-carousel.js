setTimeout(() => {
  // (() => {
  class NFIPCarousel {
    constructor(carousel) {
      this.carousel = carousel;
      this.nextPrev = carousel.querySelectorAll(".nfip-carousel__controls");
      this.slides = carousel.querySelectorAll(".nfip-carousel__slider > div");
      this.navButtons = [];
      this.currentSlide = 0;

      this.nextPrev.forEach((btn) => {
        btn.addEventListener("click", this.nexPrevAction.bind(this));
      });

      this.options = JSON.parse(this.carousel.dataset.options);

      if (this.options.show_nav) {
        this.buildNavigation();
      }

      this.carousel.addEventListener("keydown", this.handleKeydown.bind(this));
      this.handleScroll();
      this.updateUI();
    }

    buildNavigation() {
      const controlGroup = this.carousel.querySelector(
        ".nfip-carousel__controlgroup"
      );
      const navigation = document.createElement("div");
      this.slides.forEach((slide, index) => {
        const navbutton = document.createElement("button");

        if (index === 0) navbutton.classList.add("active");
        navbutton.innerHTML = `<span class="usa-sr-only">${slide.dataset.slideNumber}</span>`;

        // Adding functionality to the button
        this.navButtons.push(navbutton);
        navbutton.dataset.toSlide = index;
        navbutton.setAttribute(
          "aria-label",
          `Show slide ${index + 1} of ${this.slides.length}`
        );
        navbutton.setAttribute("aria-disabled", index ? false : true);
        navbutton.addEventListener("click", this.navButtonAction.bind(this));

        navigation.appendChild(navbutton);
      });

      navigation.setAttribute(
        "class",
        `grid-row flex-justify-end add-list-reset${
          this.carousel.classList.contains("nav-center")
            ? " desktop:flex-justify-start"
            : ""
        }`
      );
      navigation.classList.add("nfip-carousel__navigation");
      this.carousel.appendChild(navigation);
    }

    advanceSlider(dir) {
      this.currentSlide += dir;
      if (this.currentSlide >= this.slides.length)
        this.currentSlide = this.slides.length - 1;
      if (this.currentSlide < 0) this.currentSlide = 0;

      console.log(this.currentSlide, this.slides.length, this.slides);
      this.slideTo();
    }

    slideTo() {
      this.slides[this.currentSlide].scrollIntoView();
    }

    updateUI() {
      this.slides.forEach((slide, index) => {
        slide.setAttribute("tabindex", this.currentSlide === index ? 0 : -1);
      });

      this.navButtons.forEach((navbutton, index) => {
        if (index === this.currentSlide) {
          navbutton.setAttribute("aria-disabled", true);
          navbutton.classList.add("active");
        } else {
          navbutton.setAttribute("aria-disabled", false);
          navbutton.classList.remove("active");
        }
      });

      switch (this.currentSlide) {
        case 0:
          this.nextPrev[0].setAttribute("disabled", true);
          break;
        case this.slides.length - 1:
          this.nextPrev[1].setAttribute("disabled", true);
          break;
        default:
          this.nextPrev[0].removeAttribute("disabled");
          this.nextPrev[1].removeAttribute("disabled");
          break;
      }
    }

    nexPrevAction(el) {
      const btn = el.target.closest("button");
      const dir = parseInt(btn.dataset.direction);
      this.advanceSlider(dir);
    }

    navButtonAction(el) {
      const slide = parseInt(el.target.closest("button").dataset.toSlide);
      this.currentSlide = slide;
      this.slideTo();
    }

    handleKeydown(e) {
      let dir;
      if (e.key === "ArrowLeft" || e.keyCode === 37) {
        this.advanceSlider(-1);
      } else if (e.key === "ArrowRight" || e.keyCode === 39) {
        this.advanceSlider(1);
      } else {
        return;
      }
      e.preventDefault();
    }

    handleScroll() {
      // Detecting active slide on scroll
      this.slides.forEach((slide, index) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.currentSlide = index;
                this.updateUI();
              }
            });
          },
          {
            threshold: 0.5,
          }
        );
        observer.observe(slide);
      });
    }
  }

  const carousels = document.querySelectorAll(".nfip-carousel");
  carousels.forEach((carousel) => {
    new NFIPCarousel(carousel);
  });
}, 500);
// })();
