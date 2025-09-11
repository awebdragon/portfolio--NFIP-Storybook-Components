setTimeout(() => {
  const wavePause = document.querySelector(".waves-inner .waves-pause");
  const waveInner = document.querySelectorAll(".waves-inner");
  let paused = false;

  if (wavePause) {
    wavePause.addEventListener("click", (e) => {
      waveInner.forEach((el) => {
        el.classList.toggle("paused");
        paused = paused ? false : true;
        wavePause.innerHTML = `<span>${paused ? "Play" : "Pause"}</span>`;
      });
    });
  }
}, 1000);
