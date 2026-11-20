const gifts = [
  {
    id: "nino", number: "I", short: "Una voz inolvidable", title: "Libre, el musical de Nino Bravo",
    place: "Sevilla · Cartuja Center · domingo 3 de enero de 2027",
    description: "Cuatro voces, arreglos a capela y las canciones de toda la vida. Un homenaje para cantar por dentro (o por fuera).",
    image: "assets/images/nino.webp", audio: "assets/audio/nino.m4a", alt: "Cartel del musical Libre dedicado a Nino Bravo",
    hints: {
      25: ["La cita es en Sevilla, a comienzos de enero.", "Cuatro intérpretes comparten el escenario."],
      50: ["Las canciones se interpretan con arreglos a capela.", "Es un homenaje a una voz española que marcó generaciones."],
      200: ["El título es también una conocida canción de Nino Bravo.", "Es un musical sobre Nino Bravo y su título empieza por «Libre»."]
    }
  },
  {
    id: "magia", number: "II", short: "Nada es lo que parece", title: "Gala Internacional de Magia",
    place: "Madrid · Teatro Circo Price · 17 de febrero o 14 de marzo de 2027",
    description: "Ilusionistas de todo el mundo dirigidos por Jorge Blass. Una escapada a Madrid de las que os gustan tanto.",
    image: "assets/images/magia.avif", audio: "assets/audio/magia.mp3", alt: "Imagen de la Gala Internacional de Magia en el Teatro Circo Price",
    hints: {
      25: ["Este plan os lleva a Madrid.", "Participan artistas llegados de distintos países."],
      50: ["La función será en el Teatro Circo Price.", "Jorge Blass dirige una noche llena de ilusiones."],
      200: ["Es una gala de ilusionistas internacionales.", "El título empieza por «Gala Internacional» y termina con el arte de los ilusionistas."]
    }
  },
  {
    id: "secretos", number: "III", short: "Canciones para recordar", title: "Los Secretos en concierto",
    place: "Sevilla · Teatro de la Maestranza · 19 de junio de 2027",
    description: "Vuelven a los escenarios después de casi 50 años de canciones. Para recordar «Déjame», «Pero a tu lado» y tantas otras.",
    image: "assets/images/los-secretos.jpg", audio: "assets/audio/los-secretos.wav", alt: "Fotografía de los integrantes de Los Secretos",
    hints: {
      25: ["La cita es en Sevilla, ya entrado el verano.", "Casi medio siglo de canciones acompaña este plan."],
      50: ["En su repertorio está «Pero a tu lado».", "Una banda española vuelve al Teatro de la Maestranza."],
      200: ["También cantaron «Déjame»; su nombre alude a cosas que no se cuentan.", "El nombre del grupo empieza por «Los» y termina con algo que se guarda."]
    }
  },
  {
    id: "rigoletto", number: "IV", short: "Una historia de ópera", title: "Rigoletto, de Verdi",
    place: "Sevilla · Teatro de la Maestranza · finales de junio y principios de julio de 2027",
    description: "Una nueva producción de Miguel del Arco que trae a nuestros días la gran ópera de pasiones, amor y venganza.",
    image: "assets/images/rigoletto.webp", audio: "assets/audio/rigoletto.wav", alt: "Cartel de la ópera Rigoletto en el Teatro de la Maestranza",
    hints: {
      25: ["Una historia de amor y venganza en Sevilla.", "Se representa entre finales de junio y comienzos de julio."],
      50: ["La música es de Giuseppe Verdi.", "Miguel del Arco trae al presente una ópera clásica."],
      200: ["La ópera lleva el nombre de su protagonista, un bufón.", "«La donna è mobile» pertenece a esta obra, cuyo título empieza por R."]
    }
  }
];

const players = ["guillermo", "inma"];
const playerNames = { guillermo: "Guillermo", inma: "Inma" };
const alphabet = [..."ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"];
const screens = ["inicio", "juego", "revelacion", "eleccion"];
const storageKey = "regalo-navidad-2026-v4";
const sealedWhatsapp = Object.freeze({ iv: "0h9M63D4_sR2fU8b", data: "LFsH8lsyAJDpHFgYsNrgTP3_zjljn8FXxEeR" });
let whatsappNumber = null;

function emptyState() {
  return {
    version: 4,
    currentRound: null,
    rounds: Object.fromEntries(gifts.map(gift => [gift.id, {
      status: "unstarted", guessed: [], banks: { guillermo: 200, inma: 200 },
      turn: "guillermo", winner: null, message: "", lettersPlayed: { guillermo: 0, inma: 0 },
      hints: { guillermo: { 25: [], 50: [], 200: [] }, inma: { 25: [], 50: [], 200: [] } }
    }]))
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved?.version === 4 && gifts.every(gift => saved.rounds?.[gift.id]?.hints && saved.rounds?.[gift.id]?.lettersPlayed)) return saved;
  } catch {}
  return emptyState();
}

let state = loadState();
let privateHint = null;
let revealAfterHint = null;
const audio = document.getElementById("gift-audio");
const backgroundAudio = document.getElementById("background-audio");
const backgroundMusicButton = document.getElementById("background-music-button");
const musicToggle = document.getElementById("music-toggle");
const musicStatus = document.getElementById("music-status");
const hintDialog = document.getElementById("hint-dialog");
let backgroundUserPaused = false;
let backgroundHasPlayed = false;

function completedCount() {
  return gifts.filter(gift => ["won", "auto"].includes(state.rounds[gift.id].status)).length;
}

function scores() {
  return Object.fromEntries(players.map(player => [player,
    gifts.filter(gift => state.rounds[gift.id].winner === player).length]));
}

function saveProgress() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  updateStartActions();
}

function updateStartActions() {
  const started = gifts.some(gift => state.rounds[gift.id].status !== "unstarted");
  document.getElementById("start-button").textContent = started ? "Continuar la aventura" : "Abrir la lista de regalos";
  document.getElementById("restart-button").classList.toggle("hidden", !started);
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
  musicToggle.textContent = "▶";
  musicToggle.setAttribute("aria-label", "Reproducir música");
  musicStatus.textContent = "Pulsa para escuchar";
}

backgroundAudio.volume = 0.35;

function updateBackgroundMusicButton() {
  const giftOpen = !document.getElementById("revelacion").classList.contains("hidden");
  backgroundMusicButton.classList.toggle("hidden", giftOpen);
  if (!giftOpen) backgroundMusicButton.textContent = backgroundAudio.paused
    ? (backgroundHasPlayed ? "Reanudar música navideña" : "Activar música navideña")
    : "Pausar música navideña";
}

async function playBackgroundMusic() {
  if (backgroundUserPaused || !document.getElementById("revelacion").classList.contains("hidden")) {
    updateBackgroundMusicButton();
    return;
  }
  try {
    await backgroundAudio.play();
    if (backgroundUserPaused || !document.getElementById("revelacion").classList.contains("hidden")) {
      backgroundAudio.pause();
      updateBackgroundMusicButton();
      return;
    }
    backgroundHasPlayed = true;
  } catch {}
  updateBackgroundMusicButton();
}

function showScreen(name) {
  if (name !== "revelacion") stopAudio();
  screens.forEach(id => document.getElementById(id).classList.toggle("hidden", id !== name));
  if (name === "revelacion") {
    backgroundAudio.pause();
    updateBackgroundMusicButton();
  } else {
    playBackgroundMusic();
  }
  document.body.classList.toggle("scene-intro", name === "inicio");
  document.body.classList.toggle("scene-reveal", name === "revelacion");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function resetProgress() {
  state = emptyState();
  try { localStorage.removeItem(storageKey); localStorage.removeItem("regalo-navidad-2026-v3"); localStorage.removeItem("regalo-navidad-2026-v2"); localStorage.removeItem("regalo-navidad-2026"); } catch {}
  updateStartActions();
  renderGame();
  showScreen("juego");
}

function renderScoreboards() {
  const tally = scores();
  const markup = players.map(player => `<div class="score-player"><span>${playerNames[player]}</span><strong>${tally[player]}</strong></div>`).join("");
  document.getElementById("scoreboard").innerHTML = markup;
  document.getElementById("final-scoreboard").innerHTML = markup;
}

function renderGame() {
  const count = completedCount();
  document.getElementById("progress-text").textContent = `${count} de 4 planes descubiertos`;
  document.getElementById("progress-fill").style.width = `${count * 25}%`;
  renderScoreboards();
  document.getElementById("envelope-grid").innerHTML = gifts.map(gift => {
    const round = state.rounds[gift.id];
    const done = round.status === "won" || round.status === "auto";
    const active = state.currentRound === gift.id;
    const blocked = state.currentRound && !active;
    const label = done ? gift.title : gift.short;
    const status = done ? (round.winner ? `Punto para ${playerNames[round.winner]}` : "Sin punto") : active ? "En juego" : "Sobre cerrado";
    return `<button class="envelope-card ${done ? "revealed" : ""} ${active ? "playing" : ""}" type="button" data-gift="${gift.id}" ${blocked ? "disabled" : ""} aria-label="${done ? `Volver a ver ${gift.title}` : active ? `Continuar el sobre ${gift.number}` : `Jugar el sobre ${gift.number}`}"><span class="card-number">${gift.number}</span><span class="card-bottom">${label}<span class="card-status">${status}</span></span></button>`;
  }).join("");
  document.getElementById("to-final").classList.toggle("hidden", count !== gifts.length);
  document.getElementById("restart-game-button").classList.toggle("hidden", !gifts.some(gift => state.rounds[gift.id].status !== "unstarted"));
  renderRound();
}

function normalizedLetter(char) {
  const upper = char.toLocaleUpperCase("es-ES");
  if (upper === "Ñ") return "Ñ";
  return upper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isLetter(char) {
  return /^[A-ZÁÉÍÓÚÜÑ]$/i.test(char);
}

function normalizedTitle(title) {
  return [...title].filter(isLetter).map(normalizedLetter).join("");
}

function allLettersShown(gift, round) {
  return [...gift.title].filter(isLetter).every(char => round.guessed.includes(normalizedLetter(char)));
}

function boardMarkup(gift, round) {
  return gift.title.split(" ").map(word => `<span class="board-word">${[...word].map(char => {
    if (!isLetter(char)) return `<span class="board-mark" aria-hidden="true">${char}</span>`;
    const shown = round.guessed.includes(normalizedLetter(char));
    return `<span class="board-tile ${shown ? "shown" : ""}" aria-hidden="true">${shown ? char.toLocaleUpperCase("es-ES") : ""}</span>`;
  }).join("")}</span>`).join("");
}

function renderRound() {
  const panel = document.getElementById("round-panel");
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift) { panel.classList.add("hidden"); panel.innerHTML = ""; return; }
  const round = state.rounds[gift.id];
  panel.classList.remove("hidden");
  const remaining = [...gift.title].filter(char => isLetter(char) && !round.guessed.includes(normalizedLetter(char))).length;
  panel.innerHTML = `<div class="round-header"><div><p class="handwritten">El nombre oculto</p><h3>Sobre ${gift.number}</h3></div><p class="turn-label">Turno de <strong>${playerNames[round.turn]}</strong></p></div>
    <div class="banks"><div class="bank ${round.turn === "guillermo" ? "active" : ""}"><span>Guillermo</span><strong>${round.banks.guillermo} €</strong></div><div class="bank ${round.turn === "inma" ? "active" : ""}"><span>Inma</span><strong>${round.banks.inma} €</strong></div></div>
    <div class="letter-board" role="group" aria-label="Nombre oculto: ${gift.title.split(" ").length} palabras, ${remaining} ${remaining === 1 ? "letra" : "letras"} por descubrir">${boardMarkup(gift, round)}</div>
    <p class="round-rule">${round.banks[round.turn] >= 50 ? "Elegid una letra. Si aparece, seguís jugando; si falla, perdéis 50 € y pasa el turno." : "Con menos de 50 € no podéis arriesgar una letra. Podéis intentar resolver el nombre, comprar una pista disponible o pasar el turno."}</p>
    <section class="hint-shop" aria-label="Comprar pistas privadas"><div class="hint-shop-heading"><h4>Pistas solo para ti</h4><p>${round.lettersPlayed[round.turn] === 0 ? "Primero elige una letra en esta ronda para desbloquear tus pistas." : "Se elige al azar una de las dos pistas de cada nivel que aún no hayas visto. El otro jugador puede comprar las mismas."}</p></div><div class="hint-tiers">${[25, 50, 200].map(tier => { const bought = round.hints[round.turn][tier].length; const label = tier === 25 ? "Sutil" : tier === 50 ? "Intermedia" : "Reveladora"; return `<button class="hint-buy" type="button" data-buy-hint="${tier}" ${round.lettersPlayed[round.turn] === 0 || bought === 2 || round.banks[round.turn] < tier ? "disabled" : ""}><span>${label}</span><strong>${tier} €</strong><small>${tier === 200 ? "Una de dos al azar" : `${2 - bought} de 2 disponibles`}</small></button>`; }).join("")}</div><div class="hint-owned">${[25, 50, 200].filter(tier => round.hints[round.turn][tier].length).map(tier => `<button class="text-button" type="button" data-view-hints="${tier}">Volver a ver tus pistas de ${tier} € (${round.hints[round.turn][tier].length})</button>`).join("")}</div></section>
    <div class="alphabet" role="group" aria-label="Letras disponibles">${alphabet.map(letter => `<button type="button" data-letter="${letter}" ${round.guessed.includes(letter) || round.banks[round.turn] < 50 ? "disabled" : ""} aria-label="Elegir la letra ${letter}">${letter}</button>`).join("")}</div>
    <form id="solve-form" class="solve-form"><label for="solve-input">¿Sabéis el nombre completo?</label><div><input id="solve-input" name="solution" type="text" autocomplete="off" spellcheck="false" placeholder="Escribidlo aquí" required><button class="button button-dark" type="submit">Resolver</button></div></form><button class="text-button pass-turn" type="button" data-pass-turn ${round.banks[round.turn === "guillermo" ? "inma" : "guillermo"] === 0 ? "disabled" : ""}>Pasar turno</button>
    <p id="round-status" class="round-status" role="status" aria-live="polite"></p>`;
  document.getElementById("round-status").textContent = round.message || `${playerNames[round.turn]}, te toca elegir una letra.`;
}

function nextTurn(round) {
  const other = round.turn === "guillermo" ? "inma" : "guillermo";
  if (round.banks[other] > 0) round.turn = other;
}

function openPrivateHint(player, tier, indexes) {
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift) return;
  privateHint = { player, tier, indexes, giftId: gift.id };
  document.getElementById("hint-owner").textContent = `Pista de ${tier} € para ${playerNames[player]}.`;
  document.getElementById("hint-text").textContent = "";
  document.getElementById("hint-text").classList.add("hidden");
  document.getElementById("hint-show").classList.remove("hidden");
  hintDialog.showModal();
  document.getElementById("hint-show").focus();
}

function buyHint(tier) {
  if (![25, 50, 200].includes(tier)) return;
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift) return;
  const round = state.rounds[gift.id];
  const buyer = round.turn;
  const owned = round.hints[buyer][tier];
  if (round.status !== "active" || round.lettersPlayed[buyer] === 0 || round.banks[buyer] < tier || owned.length >= 2) return;
  const remaining = [0, 1].filter(index => !owned.includes(index));
  const selected = remaining[Math.floor(Math.random() * remaining.length)];
  owned.push(selected);
  round.banks[buyer] -= tier;
  round.message = `${playerNames[buyer]} compró una pista privada por ${tier} €.`;
  if (players.every(player => round.banks[player] === 0)) revealAfterHint = gift.id;
  else if (round.banks[buyer] === 0) nextTurn(round);
  saveProgress();
  renderRound();
  openPrivateHint(buyer, tier, [selected]);
}

function viewHints(tier) {
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift || ![25, 50, 200].includes(tier)) return;
  const buyer = state.rounds[gift.id].turn;
  const owned = state.rounds[gift.id].hints[buyer][tier];
  if (owned.length) openPrivateHint(buyer, tier, owned);
}

function passTurn() {
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift) return;
  const round = state.rounds[gift.id];
  const previous = round.turn;
  const other = previous === "guillermo" ? "inma" : "guillermo";
  if (round.banks[other] === 0) return;
  round.turn = other;
  round.message = `${playerNames[previous]} pasa. Turno de ${playerNames[other]}.`;
  saveProgress();
  renderRound();
}

function finishRound(giftId, winner) {
  const round = state.rounds[giftId];
  round.status = winner ? "won" : "auto";
  round.winner = winner;
  state.currentRound = null;
  saveProgress();
  renderGame();
  revealGift(giftId);
}

function chooseLetter(letter) {
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift || !alphabet.includes(letter)) return;
  const round = state.rounds[gift.id];
  if (round.status !== "active" || round.guessed.includes(letter) || round.banks[round.turn] < 50) return;
  const player = round.turn;
  round.lettersPlayed[player] += 1;
  round.guessed.push(letter);
  const hits = [...gift.title].filter(char => isLetter(char) && normalizedLetter(char) === letter).length;
  if (hits && allLettersShown(gift, round)) { finishRound(gift.id, player); return; }
  if (hits) {
    round.message = `${letter} aparece ${hits} ${hits === 1 ? "vez" : "veces"}. ${playerNames[player]} conserva el turno.`;
  } else {
    round.banks[player] -= 50;
    if (players.every(name => round.banks[name] === 0)) { finishRound(gift.id, null); return; }
    nextTurn(round);
    round.message = `${letter} no aparece. ${playerNames[player]} pierde 50 €. Turno de ${playerNames[round.turn]}.`;
  }
  saveProgress();
  renderRound();
}

function solveName(guess) {
  const gift = gifts.find(item => item.id === state.currentRound);
  if (!gift) return;
  const round = state.rounds[gift.id];
  const player = round.turn;
  if (normalizedTitle(guess) === normalizedTitle(gift.title)) { finishRound(gift.id, player); return; }
  nextTurn(round);
  round.message = `No es el nombre completo. Pierde el turno ${playerNames[player]}; ahora juega ${playerNames[round.turn]}.`;
  saveProgress();
  renderRound();
}

function openEnvelope(id) {
  const gift = gifts.find(item => item.id === id);
  if (!gift) return;
  const round = state.rounds[id];
  if (["won", "auto"].includes(round.status)) { revealGift(id); return; }
  if (state.currentRound && state.currentRound !== id) return;
  if (round.status === "unstarted") {
    const started = gifts.filter(item => state.rounds[item.id].status !== "unstarted").length;
    round.status = "active";
    round.turn = started % 2 === 0 ? "guillermo" : "inma";
    round.message = `${playerNames[round.turn]} empieza esta ronda.`;
    state.currentRound = id;
    saveProgress();
  }
  renderGame();
  document.getElementById("round-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function revealGift(id) {
  const gift = gifts.find(item => item.id === id);
  if (!gift) return;
  const round = state.rounds[id];
  document.getElementById("reveal-image").src = gift.image;
  document.getElementById("reveal-image").alt = gift.alt;
  document.getElementById("reveal-title").textContent = gift.title;
  document.getElementById("reveal-result").textContent = round.winner ? `${playerNames[round.winner]} gana esta ronda y suma 1 punto.` : "Sin punto: los dos os quedasteis sin dinero.";
  document.getElementById("reveal-place").textContent = gift.place;
  document.getElementById("reveal-description").textContent = gift.description;
  document.getElementById("reveal-count").textContent = `${completedCount()} de 4 descubiertos · Guillermo ${scores().guillermo} – Inma ${scores().inma}`;
  document.getElementById("next-button").textContent = completedCount() === gifts.length ? "Elegir nuestro regalo" : "Seguir jugando";
  audio.src = gift.audio;
  showScreen("revelacion");
  try {
    await audio.play();
    musicToggle.textContent = "Ⅱ";
    musicToggle.setAttribute("aria-label", "Pausar música");
    musicStatus.textContent = "Sonando ahora";
  } catch { musicStatus.textContent = "Pulsa para escuchar"; }
}

function renderChoices() {
  renderScoreboards();
  document.getElementById("choice-list").innerHTML = gifts.map(gift => `<label class="choice-item"><input type="radio" name="gift" value="${gift.id}"><img src="${gift.image}" alt=""><span><strong>${gift.title}</strong><small>${gift.place}</small></span></label>`).join("");
  updateShareAvailability();
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), char => char.charCodeAt(0));
}

function updateShareAvailability() {
  const selected = !!document.querySelector('input[name="gift"]:checked');
  document.getElementById("whatsapp-button").disabled = !selected || !whatsappNumber;
  document.getElementById("copy-button").disabled = !selected;
  const status = document.getElementById("share-status");
  if (!whatsappNumber) status.textContent = "Para abrir WhatsApp, entrad desde el QR de la carta.";
  else status.textContent = "Se abrirá WhatsApp con el mensaje listo para enviarme.";
}

async function unlockWhatsapp() {
  whatsappNumber = null;
  const keyFromQr = new URLSearchParams(location.hash.slice(1)).get("k");
  if (!keyFromQr || !crypto.subtle) { updateShareAvailability(); return; }
  try {
    const keyBytes = decodeBase64Url(keyFromQr);
    if (keyBytes.length !== 32) throw new Error("Clave no válida");
    const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decodeBase64Url(sealedWhatsapp.iv) }, key, decodeBase64Url(sealedWhatsapp.data));
    const number = new TextDecoder().decode(plain);
    if (!/^\d{10,15}$/.test(number)) throw new Error("Número no válido");
    whatsappNumber = number;
  } catch {}
  updateShareAvailability();
}

function selectedMessage() {
  const id = document.querySelector('input[name="gift"]:checked')?.value;
  const gift = gifts.find(item => item.id === id);
  return gift ? `¡Hola! Somos Guillermo e Inma. Ya hemos descubierto los cuatro planes de Navidad y elegimos: ${gift.title}. ¡Qué ilusión!` : "";
}

document.getElementById("start-button").addEventListener("click", () => { renderGame(); showScreen("juego"); });
document.getElementById("restart-button").addEventListener("click", resetProgress);
document.getElementById("restart-game-button").addEventListener("click", resetProgress);
document.getElementById("envelope-grid").addEventListener("click", event => {
  const button = event.target.closest("[data-gift]");
  if (button && !button.disabled) openEnvelope(button.dataset.gift);
});
document.getElementById("round-panel").addEventListener("click", event => {
  const buy = event.target.closest("[data-buy-hint]");
  if (buy) { buyHint(Number(buy.dataset.buyHint)); return; }
  const view = event.target.closest("[data-view-hints]");
  if (view) { viewHints(Number(view.dataset.viewHints)); return; }
  if (event.target.closest("[data-pass-turn]")) { passTurn(); return; }
  const button = event.target.closest("[data-letter]");
  if (button) chooseLetter(button.dataset.letter);
});
document.getElementById("hint-show").addEventListener("click", () => {
  if (!privateHint) return;
  const gift = gifts.find(item => item.id === privateHint.giftId);
  document.getElementById("hint-text").textContent = privateHint.indexes.map(index => gift.hints[privateHint.tier][index]).join("\n\n");
  document.getElementById("hint-text").classList.remove("hidden");
  document.getElementById("hint-show").classList.add("hidden");
  document.getElementById("hint-close").focus();
});
document.getElementById("hint-close").addEventListener("click", () => hintDialog.close());
hintDialog.addEventListener("close", () => {
  privateHint = null;
  document.getElementById("hint-text").textContent = "";
  document.getElementById("hint-text").classList.add("hidden");
  if (revealAfterHint) {
    const id = revealAfterHint;
    revealAfterHint = null;
    finishRound(id, null);
  }
});
document.getElementById("round-panel").addEventListener("submit", event => {
  if (event.target.id !== "solve-form") return;
  event.preventDefault();
  solveName(event.target.elements.solution.value.trim());
});
document.getElementById("back-to-game").addEventListener("click", () => { renderGame(); showScreen("juego"); });
document.getElementById("next-button").addEventListener("click", () => {
  if (completedCount() === gifts.length) { renderChoices(); showScreen("eleccion"); }
  else { renderGame(); showScreen("juego"); }
});
document.getElementById("to-final").addEventListener("click", () => { renderChoices(); showScreen("eleccion"); });
musicToggle.addEventListener("click", async () => {
  if (!audio.paused) { audio.pause(); musicToggle.textContent = "▶"; musicToggle.setAttribute("aria-label", "Reproducir música"); musicStatus.textContent = "En pausa"; return; }
  try { await audio.play(); musicToggle.textContent = "Ⅱ"; musicToggle.setAttribute("aria-label", "Pausar música"); musicStatus.textContent = "Sonando ahora"; }
  catch { musicStatus.textContent = "No se pudo reproducir. Inténtalo de nuevo."; }
});
audio.addEventListener("ended", () => { musicToggle.textContent = "▶"; musicToggle.setAttribute("aria-label", "Reproducir música"); musicStatus.textContent = "Volver a escuchar"; });
document.getElementById("choice-list").addEventListener("change", updateShareAvailability);
document.getElementById("choice-form").addEventListener("submit", event => { event.preventDefault(); const message = selectedMessage(); if (message && whatsappNumber) window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); });
document.getElementById("copy-button").addEventListener("click", async () => { try { await navigator.clipboard.writeText(selectedMessage()); document.getElementById("share-status").textContent = "Mensaje copiado. Ya podéis enviarlo por WhatsApp."; } catch { document.getElementById("share-status").textContent = "No se pudo copiar el mensaje. Probad con el botón de WhatsApp."; } });
document.querySelector(".mark").addEventListener("click", event => { event.preventDefault(); showScreen("inicio"); });
updateStartActions();
backgroundMusicButton.addEventListener("click", () => {
  if (!backgroundAudio.paused) {
    backgroundUserPaused = true;
    backgroundAudio.pause();
    updateBackgroundMusicButton();
  } else {
    backgroundUserPaused = false;
    playBackgroundMusic();
  }
});
backgroundAudio.addEventListener("ended", () => {
  if (!backgroundUserPaused && document.getElementById("revelacion").classList.contains("hidden")) {
    backgroundAudio.currentTime = 0;
    playBackgroundMusic();
  }
});
document.addEventListener("pointerdown", event => {
  if (event.target.closest("#background-music-button")) return;
  if (backgroundAudio.paused && !backgroundUserPaused) playBackgroundMusic();
}, { capture: true });
document.addEventListener("keydown", event => {
  if (event.target.closest("#background-music-button")) return;
  if (backgroundAudio.paused && !backgroundUserPaused) playBackgroundMusic();
}, { capture: true });
playBackgroundMusic();
window.addEventListener("hashchange", unlockWhatsapp);
unlockWhatsapp();
