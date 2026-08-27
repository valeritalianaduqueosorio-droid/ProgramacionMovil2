// Referencias a los elementos del DOM
const pokemonInput = document.getElementById("poke-input");
const searchButton = document.getElementById("search-btn");
const randomButton = document.getElementById("random-btn");
const loadingIndicator = document.getElementById("loading");
const errorMessage = document.getElementById("error-msg");
const pokemonCard = document.getElementById("poke-card");
const pokemonName = document.getElementById("poke-name");
const pokemonId = document.getElementById("poke-id");
const pokemonImage = document.getElementById("poke-img");
const pokemonTypes = document.getElementById("poke-types");
const attackStat = document.getElementById("stat-attack");
const defenseStat = document.getElementById("stat-defense");
const speedStat = document.getElementById("stat-speed");

// Elementos de Seguridad del Área Privada
const trainerPin = document.getElementById("trainer-pin");
const loginButton = document.getElementById("login-btn");
const loginForm = document.getElementById("login-form");
const secureContent = document.getElementById("secure-content");
const secureFavoriteDisplay = document.getElementById("secure-fav-display");
const addFavoriteButton = document.getElementById("add-fav-btn");
const logoutButton = document.getElementById("logout-btn");
const offlineBadge = document.getElementById("offline-badge");

let currentPokemon = null;
let activePin = null;

function sanitizeInput(input) {
    input = String(input);
    const characterMap = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#x27;", "/": "&#x2F;"
    };
    return input.replace(/[&<>"'/]/g, (match) => characterMap[match]);
}

function encryptData(plainText, pin) {
    const payload = `${pin}_${plainText}`;
    return btoa(encodeURIComponent(payload));
}

function decryptData(cipherText, pin) {
    try {
        const decodedPayload = decodeURIComponent(atob(cipherText));
        const [savedPin, originalPokemon] = decodedPayload.split("_");
        return savedPin === pin? originalPokemon : null;
    } catch (error) {
        return null;
    }
}

async function fetchPokemon(query) {
    loadingIndicator.style.display = "block";
    errorMessage.textContent = "";
    pokemonCard.style.display = "none";
    const safeQuery = sanitizeInput(query).trim().toLowerCase();
    if (!safeQuery) {
        errorMessage.textContent = "Por favor ingresa un nombre o ID válido.";
        loadingIndicator.style.display = "none";
        return;
    }
    const secureUrl = `https://pokeapi.co/api/v2/pokemon/${safeQuery}`;
    try {
        const response = await fetch(secureUrl);
        if (!response.ok) {
            throw new Error("El Pokémon solicitado no existe.");
        }
        const data = await response.json();
        currentPokemon = data.name.toUpperCase();
        renderCard(data);
    } catch (error) {
        console.error("Fallo en la capa de red o parseo de datos:", error);
        errorMessage.textContent = error.message;
    } finally {
        loadingIndicator.style.display = "none";
    }
}

function renderCard(data) {
    pokemonName.textContent = data.name;
    pokemonId.textContent = `N° ${data.id}`;
    pokemonImage.src = data.sprites.front_default || "https://via.placeholder.com/130";
    pokemonTypes.innerHTML = "";
    data.types.forEach((typeInfo) => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = typeInfo.type.name;
        pokemonTypes.appendChild(badge);
    });
    const attack = data.stats.find((stat) => stat.stat.name === "attack");
    const defense = data.stats.find((stat) => stat.stat.name === "defense");
    const speed = data.stats.find((stat) => stat.stat.name === "speed");
    attackStat.textContent = attack? attack.base_stat : "N/A";
    defenseStat.textContent = defense? defense.base_stat : "N/A";
    speedStat.textContent = speed? speed.base_stat : "N/A";
    pokemonCard.style.display = "block";
}

// Eventos de Búsqueda
searchButton.addEventListener("click", () => fetchPokemon(pokemonInput.value));
pokemonInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") fetchPokemon(pokemonInput.value);
});
randomButton.addEventListener("click", () => {
    const randomId = Math.floor(Math.random() * 151) + 1;
    fetchPokemon(randomId);
});

// --- AQUÍ ESTABA LO QUE TE FALTABA PARA EL LOCAL STORAGE ---

loginButton.addEventListener("click", () => {
    const pin = trainerPin.value.trim();
    if (pin.length < 4) {
        alert("El PIN debe tener al menos 4 dígitos");
        return;
    }
    activePin = pin;
    loginForm.style.display = "none";
    secureContent.style.display = "block";

    // Recuperar favorito si existe
    const saved = localStorage.getItem("secureFav");
    if (saved) {
        const decrypted = decryptData(saved, activePin);
        if (decrypted) {
            secureFavoriteDisplay.textContent = `Tu favorito guardado: ${decrypted}`;
        } else {
            secureFavoriteDisplay.textContent = "PIN incorrecto para el favorito guardado";
        }
    } else {
        secureFavoriteDisplay.textContent = "No tienes favorito guardado";
    }
});

addFavoriteButton.addEventListener("click", () => {
    if (!currentPokemon) {
        alert("Primero busca un Pokémon");
        return;
    }
    if (!activePin) {
        alert("Debes hacer login primero");
        return;
    }
    const encrypted = encryptData(currentPokemon, activePin);
    localStorage.setItem("secureFav", encrypted);
    secureFavoriteDisplay.textContent = `Guardado: ${currentPokemon}`;
    console.log("Guardado en Local Storage:", encrypted);
});

logoutButton.addEventListener("click", () => {
    activePin = null;
    loginForm.style.display = "block";
    secureContent.style.display = "none";
    trainerPin.value = "";
});

// Badge de Offline
window.addEventListener("online", () => offlineBadge.style.display = "none");
window.addEventListener("offline", () => offlineBadge.style.display = "block");
if (!navigator.onLine) offlineBadge.style.display = "block";