(function () {
  const opening = document.getElementById("opening");
  const openBtn = document.getElementById("openBtn");
  const main = document.getElementById("main");

  const heartBtn = document.getElementById("heartBtn");
  const heartHint = document.getElementById("heartHint");
  const heartReveal = document.getElementById("heartReveal");
  const heartsLayer = document.getElementById("heartsLayer");

  const wishText = document.getElementById("wishText");
  const wishBtn = document.getElementById("wishBtn");

  const blowBtn = document.getElementById("blowBtn");
  const cake = document.getElementById("cake");
  const cakeLabel = document.getElementById("cakeLabel");
  const confetti = document.getElementById("confetti");

  const secretBtn = document.getElementById("secretBtn");
  const secretBox = document.getElementById("secretBox");

  const musicBtn = document.getElementById("musicBtn");

  const DEFAULT_WISHES = [
    "May your days always be filled with peace and happiness.",
    "Semoga Mama selalu sehat, bahagia, dan dikelilingi orang-orang yang menyayangi Mama.",
    "You deserve all the beautiful things in this world.",
    "Semoga tahun ini membawa banyak momen tenang dan indah untuk Mama.",
    "May your heart always feel light and full.",
    "Terima kasih sudah menjadi rumah yang paling hangat.",
    "Semoga setiap langkah Mama dipenuhi keberkahan dan ketenangan.",
    "You are loved more than you know.",
    "Semoga kesehatan dan kebahagiaan selalu menemani Mama.",
    "May this year be gentle with you, Mama.",
    "Doa terbaik selalu untuk Mama — sehat, bahagia, dan damai.",
    "Happy birthday to the kindest soul I know."
  ];

  let wishes = DEFAULT_WISHES.slice();
  let lastWishIndex = -1;
  let heartClicks = 0;

  fetch("data/wishes.json")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (Array.isArray(data) && data.length) wishes = data;
    })
    .catch(function () {});

  // Opening
  openBtn.addEventListener("click", function () {
    opening.classList.add("hide");
    main.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Floating hearts
  function spawnHeart(x, y) {
    const el = document.createElement("span");
    el.className = "float-heart";
    el.textContent = "♡";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.fontSize = 14 + Math.random() * 14 + "px";
    heartsLayer.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  heartBtn.addEventListener("click", function () {
    heartClicks += 1;
    const rect = heartBtn.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      setTimeout(function () {
        spawnHeart(
          rect.left + rect.width / 2 + (Math.random() * 60 - 30),
          rect.top + (Math.random() * 16)
        );
      }, i * 70);
    }
    if (heartClicks >= 5) {
      heartHint.hidden = true;
      heartReveal.hidden = false;
    }
  });

  // Wishes
  function showWish() {
    if (!wishes.length) return;
    let idx = Math.floor(Math.random() * wishes.length);
    if (wishes.length > 1 && idx === lastWishIndex) {
      idx = (idx + 1) % wishes.length;
    }
    lastWishIndex = idx;
    wishText.classList.add("fade");
    setTimeout(function () {
      wishText.textContent = wishes[idx];
      wishText.classList.remove("fade");
    }, 220);
  }
  wishBtn.addEventListener("click", showWish);

  // Cake
  blowBtn.addEventListener("click", function () {
    if (cake.classList.contains("blown")) return;
    cake.classList.add("blown");
    cakeLabel.textContent = "HAPPY BIRTHDAY, MAMA!!! 🎂♡";
    blowBtn.textContent = "PERMINTAAN TERKIRIM ♡";
    blowBtn.disabled = true;
    const colors = ["#F4C7CE", "#D98C9A", "#D4AF37", "#FFFFFF", "#E8B4BC"];
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("i");
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      confetti.appendChild(piece);
    }
    setTimeout(function () { confetti.innerHTML = ""; }, 2800);
  });

  // Secret
  secretBtn.addEventListener("click", function () {
    secretBox.hidden = false;
    secretBtn.hidden = true;
    secretBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* -------------------------------------------------
     Soft happy instrumental via Web Audio API
     (no external file needed)
  ------------------------------------------------- */
  let audioCtx = null;
  let musicOn = false;
  let musicTimer = null;
  let nextNoteTime = 0;

  // Simple warm major motif (C major-ish), gentle tempo
  // note = [freq Hz, duration beats]
  const MELODY = [
    [523.25, 0.5], // C5
    [587.33, 0.5], // D5
    [659.25, 0.75], // E5
    [587.33, 0.25], // D5
    [523.25, 0.5], // C5
    [392.00, 0.5], // G4
    [440.00, 0.75], // A4
    [523.25, 1.0], // C5
    [0, 0.35],
    [523.25, 0.5],
    [587.33, 0.5],
    [659.25, 0.5],
    [698.46, 0.5], // F5
    [659.25, 0.75],
    [587.33, 0.25],
    [523.25, 1.2],
    [0, 0.6]
  ];

  function playTone(freq, start, dur, gainValue) {
    if (!freq) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    // soft triangle + slight sine blend feel via triangle
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function scheduleLoop() {
    if (!musicOn || !audioCtx) return;
    const beat = 0.42; // calm tempo
    const lookAhead = 0.15;
    while (nextNoteTime < audioCtx.currentTime + lookAhead) {
      // play one full phrase then loop
      let t = nextNoteTime;
      MELODY.forEach(function (n) {
        const dur = n[1] * beat;
        playTone(n[0], t, Math.max(0.08, dur * 0.92), 0.045);
        t += dur;
      });
      nextNoteTime = t;
    }
    musicTimer = setTimeout(scheduleLoop, 120);
  }

  function startMusic() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    musicOn = true;
    nextNoteTime = audioCtx.currentTime + 0.05;
    scheduleLoop();
    musicBtn.classList.add("playing");
    musicBtn.setAttribute("title", "Pause music");
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
    musicBtn.classList.remove("playing");
    musicBtn.setAttribute("title", "Play music");
  }

  musicBtn.addEventListener("click", function () {
    if (!musicOn) startMusic();
    else stopMusic();
  });
})();
