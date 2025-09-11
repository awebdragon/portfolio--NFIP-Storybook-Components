// AOS dependencies
import AOS from 'aos';
import 'aos/dist/aos.css';
// custom AOS animations
import './styles/nfip-aos.scss';
// video styles
import './styles/nfip-animation.scss';

// GSAP dependencies
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
// custom GSAP styles
import './styles/nfip-gsap.scss';

// initialize AOS library
AOS.init();

// register GSAP plugins
gsap.registerPlugin(ScrollTrigger,TextPlugin);

// Custom GSAP animations. Make sure that GSAP and other functions load after Storybook is done loading the content.
// document.addEventListener( "DOMContentLoaded", function(){
// for some reason, waiting for the dom content to load still isn't enough, at least for our Storybook setup, and we need a longer timeout. May be just a storybook issue, or an issue with our setup specifically.
setTimeout(() => {
  // set defaults that can be turned off by using "inherit:false" or by overriding inside the tween
  gsap.defaults({
    ease: "power2.out", // ease out
    duration: 1,
  });

  // scroll trigger should default to replaying the animation if the user scrolls up, then scrolls back down to bring the element in view again.
  ScrollTrigger.defaults({
    normalizeScroll: true,
    toggleActions: "restart none none none",
    once: false,
  });

  // create the base For Each loop that will locate animation instances. This helps each animation load in the correct order.
  const flsmGSAPMainArray = gsap.utils.toArray('.flsm-gsap');
  flsmGSAPMainArray.forEach( element => {
    if ( element.classList.contains('flsm-parallax--slide-up-bottom') ) {
      // this is a section containing multiple sub-sections. "element" is selecting the top-most parent container here
      createSlideUpBottomAnimation(element);
    } else if ( element.classList.contains('flsm-parallax--background-zoom') ) {
      // this is a section containing multiple sub-sections. "element" is selecting the top-most parent container here
      createBackgroundZoomAnimation(element);
    } else if ( element.classList.contains('flsm-parallax--background-fall-away') ) {
      // this is a section containing multiple sub-sections. "element" is selecting the top-most parent container here
      createBackgroundFallAwayAnimation(element);
    } else if ( element.classList.contains('flsm-section--alternating-fixed') ) {
      // this is a section containing multiple sub-sections. "element" is selecting the top-most parent container here
      createAlternatingFixedAnimation(element);
    } else if ( element.classList.contains('flsm-section--fixed-media') ) {
      // this is a section containing multiple sub-sections. "element" is selecting the top-most parent container here
      createFixedMedia(element);
    } else if ( element.classList.contains('flsm-number-counter') ) {
      // flsm-number-counter works best on a span or p tag, since it animates the text immediately inside the element. "element" is selecting that smaller block element here.
      createNumberCounterAnimation(element);
    } else { /* do nothing */ }
  });


  // number counter
  function createNumberCounterAnimation(element){
    let numberCounterTarget = { val: 0 };
    const getNumberCounterValue = element.getAttribute('data-number');
    const numberCounterFormat = (x) => {
    if ( getNumberCounterValue && getNumberCounterValue.includes('.') ) {
      const numberCounterParts = x.toFixed(1).split('.');
      numberCounterParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return numberCounterParts.join('.');
    } else {
      const numberCounterParts = x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      return numberCounterParts;
    }
  }
    const numberCounterAnimation = gsap.to( numberCounterTarget, {
      duration: 3,
      val: element.getAttribute('data-number'),
      onUpdate: () => {
        element.innerText = numberCounterFormat(
          numberCounterTarget.val
        );
      },
    });

    ScrollTrigger.create({
      trigger: element,
      animation: numberCounterAnimation,
    });
  };
  // end number counter


  // flsm-parallax--slide-up-bottom
  function createSlideUpBottomAnimation(element){
    const topper = element.querySelector('.flsm-parallax--slide-up-bottom--topper');
    const topperImg = topper.querySelector('img');

    const trigger = element.querySelector('.flsm-parallax--slide-up-bottom--trigger');

    const takeover = element.querySelector('.flsm-parallax--slide-up-bottom--takeover-container');
    const takeoverContent = element.querySelector('.flsm-parallax--slide-up-bottom--takeover-content');

    const pin = element.querySelector('.flsm-parallax--slide-up-bottom--pin');
    const pinChild = element.querySelector('.flsm-parallax--slide-up-bottom--pin .pin-child');

    const pinEnd = takeover.offsetHeight;

    // remove the display-none class from the trigger element when scaling animation is toggled on; it exists just in case the JS or animation doesn't load properly
    if( element.classList.contains('--animate-image-scale') ){
      topper.classList.add('position-absolute', 'top-2px');

      trigger.classList.remove('display-none');
    };

    // start animating
    gsap.to(pinChild,{
      scrollTrigger: {
        trigger: pin,
        pin: !0,
        pinSpacing: !1,
        start: () => "bottom bottom",
        end: () => `+=${pinEnd}`,
      },
    });

    if( element.classList.contains('--animate-image-scale') ){
      gsap.fromTo(takeoverContent, {
        y: -320,
      }, {
        y: 1,
        ease: "none",
        scrollTrigger: {
          scrub: 0,
          trigger: trigger,
          start: "top bottom",
          end: "bottom bottom",
        },
      });

      gsap.fromTo(topperImg, {
        scale: 0,
        y: 0,
      }, {
        scale: 1,
        y: 320,
        transformOrigin: "bottom center",
        ease: "none",
        scrollTrigger: {
          scrub: 0,
          trigger: trigger,
          start: "top bottom",
          end: "bottom bottom",
        },
      });
    };

    // pausing the slide-up-bottom animated images
    // check if pause button exists first
    const getPauseButton = topper.querySelector('.flsm-parallax--slide-up-bottom--pause');
    let paused = false;
    
    if (getPauseButton !== null){
      const imageOriginal = topperImg.getAttribute('data-original-image');
      const imageFallback = topperImg.getAttribute('data-fallback-image');
      const buttonText = getPauseButton.querySelector('span');

      getPauseButton.addEventListener("click", () => {
        if(paused === false){
          getPauseButton.classList.add("paused");
          buttonText.textContent = "Play";
          topperImg.src = imageFallback;
          paused = true;
        } else {
          getPauseButton.classList.remove("paused");
          buttonText.textContent = "Pause";
          topperImg.src = imageOriginal;
          paused = false;
        };
      });
    };
  };
  // end flsm-parallax--slide-up-bottom
  

  // flsm-parallax--background-zoom
  function createBackgroundZoomAnimation(element){
    const backgroundZoomContent = element.querySelector('.flsm-parallax--background-zoom--content-container');
    const backgroundZoomContentOne = backgroundZoomContent.querySelector('.flsm-parallax--background-zoom--content-one');
    const backgroundZoomContentTwo = backgroundZoomContent.querySelector('.flsm-parallax--background-zoom--content-two');

    const backgroundZoomBGContainer = element.querySelector('.flsm-parallax--background-zoom--bg-container');
    const backgroundZoomBGSecondary = element.querySelector('.flsm-parallax--background-zoom--bg-secondary');
    const backgroundZoomBGSecondaryImage = backgroundZoomBGSecondary.querySelector('img');

    // toggle fallback classes, implemented in case the JS doesn't load
    backgroundZoomBGContainer.classList.remove('display-none');
    backgroundZoomContentTwo.classList.add('flsm-animation-initiated');

    // check whether the overlay isn't toggled off, then whether the light background is toggled, or the dark background, then set the overlay color.
    if( !element.classList.contains('--no-overlay') ) {
      if( element.classList.contains('--dark') ) {
        gsap.set(backgroundZoomContent, {
          backgroundColor: "rgba(0, 43, 71, .5)",
          textShadow: "2px 0px 50px black, 0px 0px 4px rgba(0,0,0,.25)",
        });
      } else { // use the light version
        gsap.set(backgroundZoomContent, {
          backgroundColor: "rgba(214, 233, 242, .5)",
          textShadow: "2px 0px 50px white, 0px 0px 4px rgba(255,255,255,.25)",
        });
      };
    };
    // regardless of overlayt toggle, a dark version needs the usa-dark-background utility class
    if( element.classList.contains('--dark') ) {
      element.classList.add('usa-dark-background');
    };

    ScrollTrigger.create({
      trigger: backgroundZoomBGContainer,
      pin: !0,
      start: "top top",
      end: () => `+=${(window.innerHeight * 1.2) + 480} bottom`,
    });

    gsap.to(backgroundZoomBGSecondaryImage, {
      scale: 2,
      scrollTrigger: {
        trigger: backgroundZoomContent,
        scrub: 0,
        start: () => `+=${window.innerHeight} bottom`,
        end: () => `+=${window.innerHeight * 2}`,
      },
    });

    gsap.fromTo(backgroundZoomContentOne, {
      opacity: 1,
    }, {
      opacity: 0,
      ease: "power3.in",
      scrollTrigger: {
        trigger: backgroundZoomContentOne,
        scrub: 0,
        pin: !0,
        start: "bottom bottom",
        end: () => `+=240`,
      },
    });

    gsap.fromTo(backgroundZoomContentTwo, {
      opacity: 0,
    }, {
      opacity: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: backgroundZoomContentTwo,
        scrub: 0,
        pin: !0,
        start: "center center",
        end: () => `+=240`,
      },
    });

    // check whether the overlay is not toggled off, then if the light background is toggled, or the dark background, then set the overlay animation.
    if( !element.classList.contains('--no-overlay') ) {
      if( element.classList.contains('--dark') ) {
        gsap.to(backgroundZoomContent, {
          backgroundColor: "rgba(0, 43, 71, 1)",
          ease: "none",
          scrollTrigger: {
            trigger: backgroundZoomContentTwo,
            scrub: 0,
            start: "bottom 90%",
            end: () => `+=240`,
          },
        });
      } else { // use the light version
        gsap.to(backgroundZoomContent, {
          backgroundColor: "rgba(214, 233, 242, 1)",
          ease: "none",
          scrollTrigger: {
            trigger: backgroundZoomContentTwo,
            scrub: 0,
            start: "bottom 90%",
            end: () => `+=240`,
          },
        });
      };
    };
  };
  // end flsm-parallax--background-zoom

  // flsm-section--alternating-fixed
  function createAlternatingFixedAnimation(element){
    const alternatingFixedGraphic = element.querySelector('.flsm-section--alternating-fixed--graphic');
    const alternatingFixedPin = alternatingFixedGraphic.querySelector('.flsm-section--alternating-fixed--graphic--pin');
    const alternatingFixedImageElement = alternatingFixedGraphic.querySelector('img');

    const alternatingFixedContentOne = element.querySelector('.flsm-section--alternating-fixed--content-one');
    const alternatingFixedContentTwo = element.querySelector('.flsm-section--alternating-fixed--content-two');

    const alternatingFixedSpacer = alternatingFixedContentTwo.querySelector('[class*="height-"]');

    const alternatingFixedContentOneHeight = alternatingFixedContentOne.offsetHeight;
    const alternatingFixedContentTwoHeight = alternatingFixedContentTwo.offsetHeight;

    // get the width of one content container - they're both the same column size, so it shouldn't matter which one
    const alternatingFixedContentOneWidth = alternatingFixedContentOne.offsetWidth;

    // get height of the image element
    const alternatingFixedImageHeight = alternatingFixedImageElement.clientHeight;

    // do math to get the height at which the pin should stop
    //const pinHeight = (alternatingFixedContentOneHeight + alternatingFixedContentTwoHeight) - (alternatingFixedImageHeight * 2);
    const pinHeight = ((alternatingFixedContentOneHeight + alternatingFixedContentTwoHeight) - alternatingFixedImageHeight);

    // spacer height
    const spacerHeight = alternatingFixedSpacer.offsetHeight;

    ScrollTrigger.create({
      trigger: alternatingFixedPin,
      scrub: 1,
      pin: true,
      pinSpacing: !1,
      start: () => `top +=${(window.innerHeight / 2) - (alternatingFixedImageHeight / 2)}`,
      end: () => `+=${pinHeight}`,
    });

    gsap.to(alternatingFixedImageElement, {
      x: alternatingFixedContentOneWidth * -1,
      scrollTrigger: {
        trigger: alternatingFixedContentTwo,
        scrub: 0,
        start: () => `-=${alternatingFixedImageHeight / 2} +=${(window.innerHeight / 2) - (alternatingFixedImageHeight / 2)}`,
        end: () => `+=${(alternatingFixedImageHeight / 2) + spacerHeight}`,
      },
    });
  };
  // end flsm-section--alternating-fixed

  // flsm-section--fixed-media
  function createFixedMedia(element){
    const fixedMediaGraphic = element.querySelector('.flsm-section--fixed-media--graphic');
    const fixedMediaGraphicPin = fixedMediaGraphic.querySelector('.flsm-section--fixed-Media--graphic--pin');
    const fixedMediaGraphicImageElement = fixedMediaGraphic.querySelector('img');
    const fixedMediaImageHeight = fixedMediaGraphicImageElement.clientHeight;

    const fixedMediaContent = element.querySelector('.flsm-section--fixed-media--content');
    const fixedMediaContentHeight = fixedMediaContent.offsetHeight;

    // do math to get the height at which the pin should stop
    const pinHeight = (fixedMediaContentHeight - fixedMediaImageHeight);

    ScrollTrigger.create({
      trigger: fixedMediaGraphicPin,
      scrub: 1,
      pin: true,
      pinSpacing: !1,
      start: () => `top +=${(window.innerHeight / 2) - (fixedMediaImageHeight / 2)}`,
      end: () => `+=${(pinHeight)}`,
    });
  };
  // end flsm-section--fixed-media

  // flsm-parallax--background-fall-away
  function createBackgroundFallAwayAnimation(element){
    const backgroundFallAwayBGContainer = element.querySelector('.flsm-parallax--background-fall-away--bg-container');

    const backgroundFallAwayColorOverlay = backgroundFallAwayBGContainer.querySelector('.flsm-parallax--background-fall-away--color-overlay');
    const backgroundFallAwayOverlayOne = backgroundFallAwayBGContainer.querySelector('.flsm-parallax--background-fall-away--bg-overlay-1');
    const backgroundFallAwayOverlayTwo = backgroundFallAwayBGContainer.querySelector('.flsm-parallax--background-fall-away--bg-overlay-2');

    const backgroundFallAwayContent = element.querySelector('.flsm-parallax--background-fall-away--content');

    // check whether overlay isn't toggled off, then wether the dark or light version is toggled, then set background colors. 
    if( !element.classList.contains('--no-overlay') ){
      if( element.classList.contains('--dark') ){
        gsap.set(backgroundFallAwayColorOverlay, {
          backgroundColor: "rgba(0, 43, 71, .5)",
        });

        gsap.set(backgroundFallAwayContent, {
          textShadow: "2px 0px 50px black, 0px 0px 4px rgba(0,0,0,.25)",
        });
      } else { // use light version
        gsap.set(backgroundFallAwayColorOverlay, {
          backgroundColor: "rgba(214, 233, 242, .5)",
        });

        gsap.set(backgroundFallAwayContent, {
          textShadow: "2px 0px 50px white, 0px 0px 4px rgba(255,255,255,.25)",
        });
      };
    };
    // Regardless of overlay, the dark version needs the usa-dark-background utility class.
    if( element.classList.contains('--dark') ){
      element.classList.add('usa-dark-background')
    };

    ScrollTrigger.create({
      trigger: element,
      pin: !0,
      pinSpacing: 1,
      start: "bottom bottom",
    });

    gsap.to(backgroundFallAwayOverlayOne, {
      y: `50%`,
      x: `-50%`,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        scrub: 0,
        start: "bottom bottom",
        end: () => `+=100%`,
      },
    });
    gsap.to(backgroundFallAwayOverlayOne, {
      opacity: 0,
      ease: "circ.in",
      scrollTrigger: {
        trigger: element,
        scrub: 0,
        start: "bottom bottom",
        end: () => `+=70%`,
      },
    });

    gsap.to(backgroundFallAwayOverlayTwo, {
      y: `50%`,
      x: `50%`,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        scrub: 0,
        start: "bottom bottom",
        end: () => `+=100%`,
      },
    });
    gsap.to(backgroundFallAwayOverlayTwo, {
      opacity: 0,
      ease: "circ.in",
      scrollTrigger: {
        trigger: element,
        scrub: 0,
        start: "bottom bottom",
        end: () => `+=70%`,
      },
    });

    // check whether overlay isn't toggled off, then wether the dark or light version is toggled, then apply overlay color animation. 
    if( !element.classList.contains('--no-overlay') ){
      if( element.classList.contains('--dark') ){
        gsap.to(backgroundFallAwayColorOverlay, {
          backgroundColor: "rgba(0, 43, 71, 1)",
          ease: "none",
          scrollTrigger: {
            trigger: element,
            scrub: 0,
            start: "bottom 90%",
            end: () => `+=240`,
          },
        });
      } else { // use light version
        gsap.to(backgroundFallAwayColorOverlay, {
          backgroundColor: "rgba(214, 233, 242, 1)",
          ease: "none",
          scrollTrigger: {
            trigger: element,
            scrub: 0,
            start: "bottom 90%",
            end: () => `+=240`,
          },
        });
      };
    };
  };
  // end flsm-parallax--background-fall-away

}, 250);

setTimeout(() => {
  // pausing the video backgrounds
  const videoContainers = document.querySelectorAll(".flsm-video-bg");

  videoContainers.forEach( (container) => {
    const video = container.querySelector(".flsm-video-bg-video");
    const button = container.querySelector(".video-bg-pause");
    const buttonText = button.querySelector("span");

    button.addEventListener("click", () => {
      if (video.paused) {
        video.play();
        buttonText.textContent = "Pause"
      } else {
        video.pause();
        buttonText.textContent = "Play"
      }
      button.classList.toggle("paused");
    });
  } );
}, 1000);