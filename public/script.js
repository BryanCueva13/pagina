// Ecuador Games - Tienda de Videojuegos
// API: CheapShark API (https://apidocs.cheapshark.com/)

// Estado global de la aplicación
const appState = {
  allGames: [],
  filteredGames: [],
  currentStore: "",
  currentSort: "default",
  currentPage: 0,
  pageSize: 12,
  isSearchMode: false,
  searchTerm: "",
};

// Elementos del DOM
const elements = {
  searchInput: null,
  searchBtn: null,
  storeFilter: null,
  priceSort: null,
  resetBtn: null,
  gamesGrid: null,
  loadingSpinner: null,
  errorMessage: null,
  errorDetails: null,
  noResults: null,
  gameModal: null,
  closeModal: null,
  modalContent: null,
  loadMoreBtn: null,
  loadMoreContainer: null,
  resultsCounter: null,
  resultsText: null,
};

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
  console.log("Ecuador Games iniciado correctamente");
  initializeElements();
  attachEventListeners();
  loadInitialGames();
});

// Inicializar referencias a elementos del DOM
function initializeElements() {
  elements.searchInput = document.getElementById("searchInput");
  elements.searchBtn = document.getElementById("searchBtn");
  elements.storeFilter = document.getElementById("storeFilter");
  elements.priceSort = document.getElementById("priceSort");
  elements.resetBtn = document.getElementById("resetBtn");
  elements.gamesGrid = document.getElementById("gamesGrid");
  elements.loadingSpinner = document.getElementById("loadingSpinner");
  elements.errorMessage = document.getElementById("errorMessage");
  elements.errorDetails = document.getElementById("errorDetails");
  elements.noResults = document.getElementById("noResults");
  elements.gameModal = document.getElementById("gameModal");
  elements.closeModal = document.getElementById("closeModal");
  elements.modalContent = document.getElementById("modalContent");
  elements.loadMoreBtn = document.getElementById("loadMoreBtn");
  elements.loadMoreContainer = document.getElementById("loadMoreContainer");
  elements.resultsCounter = document.getElementById("resultsCounter");
  elements.resultsText = document.getElementById("resultsText");
}

// Adjuntar event listeners
function attachEventListeners() {
  elements.searchBtn.addEventListener("click", handleSearch);
  elements.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  elements.storeFilter.addEventListener("change", handleFilterChange);
  elements.priceSort.addEventListener("change", handleSortChange);
  elements.resetBtn.addEventListener("click", handleReset);
  elements.closeModal.addEventListener("click", closeModal);
  elements.gameModal.addEventListener("click", (e) => {
    if (e.target === elements.gameModal) closeModal();
  });
  elements.loadMoreBtn.addEventListener("click", loadMoreGames);
}

// Cargar juegos iniciales
async function loadInitialGames() {
  showLoading(true);
  hideError();
  appState.currentPage = 0;
  appState.isSearchMode = false;

  try {
    const response = await fetch(
      `https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=60`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("No se recibieron datos de la API");
    }

    appState.allGames = data;
    appState.filteredGames = [...data];
    appState.currentPage = 0;
    renderGames(appState.filteredGames);
    updateLoadMoreButton();
    showLoading(false);
  } catch (error) {
    console.error("Error al cargar juegos iniciales:", error);
    showError(error.message || "Error desconocido al cargar los videojuegos");
    showLoading(false);
  }
}

// Manejar búsqueda
async function handleSearch() {
  const searchTerm = elements.searchInput.value.trim();

  if (!searchTerm) {
    loadInitialGames();
    return;
  }

  showLoading(true);
  hideError();
  appState.isSearchMode = true;
  appState.searchTerm = searchTerm;
  appState.currentPage = 0;

  try {
    const response = await fetch(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
        searchTerm
      )}&limit=60`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      // No es un error, simplemente no hay resultados
      appState.allGames = [];
      appState.filteredGames = [];
      appState.currentPage = 0;
      renderGames([]);
      showLoading(false);
      return;
    }

    // Transformar los datos de búsqueda al formato de deals
    const transformedData = data.map((game) => ({
      gameID: game.gameID,
      title: game.external,
      salePrice: game.cheapest,
      normalPrice: (parseFloat(game.cheapest) * 1.5).toFixed(2),
      savings: "33",
      thumb: game.thumb,
      storeID: "1",
    }));

    appState.allGames = transformedData;
    appState.filteredGames = [...transformedData];
    appState.currentPage = 0;
    applyFiltersAndSort();
    showLoading(false);
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    showError(error.message || "Error al realizar la búsqueda");
    showLoading(false);
  }
}

// Manejar cambio de filtro de tienda
function handleFilterChange() {
  appState.currentStore = elements.storeFilter.value;
  applyFiltersAndSort();
}

// Manejar cambio de ordenamiento
function handleSortChange() {
  appState.currentSort = elements.priceSort.value;
  applyFiltersAndSort();
}

// Restablecer filtros
function handleReset() {
  elements.searchInput.value = "";
  elements.storeFilter.value = "";
  elements.priceSort.value = "default";
  appState.currentStore = "";
  appState.currentSort = "default";
  appState.currentPage = 0;
  loadInitialGames();
}

// Aplicar filtros y ordenamiento
function applyFiltersAndSort() {
  let filtered = [...appState.allGames];

  // Filtrar por tienda
  if (appState.currentStore) {
    filtered = filtered.filter(
      (game) => game.storeID === appState.currentStore
    );
  }

  // Ordenar por precio
  switch (appState.currentSort) {
    case "sale-asc":
      // Precio de oferta: menor a mayor
      filtered.sort(
        (a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice)
      );
      break;
    case "sale-desc":
      // Precio de oferta: mayor a menor
      filtered.sort(
        (a, b) => parseFloat(b.salePrice) - parseFloat(a.salePrice)
      );
      break;
    case "normal-asc":
      // Precio normal: menor a mayor
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.normalPrice || a.salePrice);
        const priceB = parseFloat(b.normalPrice || b.salePrice);
        return priceA - priceB;
      });
      break;
    case "normal-desc":
      // Precio normal: mayor a menor
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.normalPrice || a.salePrice);
        const priceB = parseFloat(b.normalPrice || b.salePrice);
        return priceB - priceA;
      });
      break;
    case "discount":
      // Mayor descuento
      filtered.sort((a, b) => {
        const discountA = parseFloat(a.savings || 0);
        const discountB = parseFloat(b.savings || 0);
        return discountB - discountA;
      });
      break;
    default:
      // Por defecto, no ordenar
      break;
  }

  appState.filteredGames = filtered;
  appState.currentPage = 0;
  renderGames(filtered);
  updateLoadMoreButton();
}

// Renderizar juegos en el grid
function renderGames(games, append = false) {
  if (!append) {
    elements.gamesGrid.innerHTML = "";
    appState.currentPage = 0;
  }

  if (games.length === 0 && !append) {
    elements.noResults.classList.remove("hidden");
    elements.loadMoreContainer.classList.add("hidden");
    return;
  }

  elements.noResults.classList.add("hidden");

  const startIndex = appState.currentPage * appState.pageSize;
  const endIndex = startIndex + appState.pageSize;
  const gamesToShow = games.slice(startIndex, endIndex);

  gamesToShow.forEach((game) => {
    const card = createGameCard(game);
    elements.gamesGrid.appendChild(card);
  });

  updateLoadMoreButton();
}

// Crear tarjeta de juego
function createGameCard(game) {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 cursor-pointer";

  const discount = Math.round(parseFloat(game.savings || 0));
  const normalPrice = parseFloat(game.normalPrice || game.salePrice);
  const salePrice = parseFloat(game.salePrice);

  card.innerHTML = `
    <div class="relative">
      <img 
        src="${
          game.thumb || "https://via.placeholder.com/300x200?text=No+Image"
        }" 
        alt="${game.title}"
        class="w-full h-48 object-cover"
        onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"
      />
      ${
        discount > 0
          ? `
        <div class="absolute top-2 right-2 bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm">
          -${discount}%
        </div>
      `
          : ""
      }
    </div>
    <div class="p-4">
      <h3 class="font-bold text-lg text-[#4b004c] mb-2 line-clamp-2 min-h-[3.5rem]">
        ${game.title}
      </h3>
      <div class="flex items-center justify-between mb-3">
        <div>
          ${
            normalPrice > salePrice
              ? `
            <p class="text-sm text-gray-500 line-through">$${normalPrice.toFixed(
              2
            )}</p>
          `
              : ""
          }
          <p class="text-2xl font-bold text-green-600">$${salePrice.toFixed(
            2
          )}</p>
        </div>
      </div>
      <button 
        class="w-full bg-[#e63c80] hover:bg-[#c70452] text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        onclick="showGameDetail('${game.gameID || game.dealID}')"
      >
        Ver detalle
      </button>
    </div>
  `;

  return card;
}

// Mostrar detalle del juego
async function showGameDetail(gameID) {
  elements.gameModal.classList.remove("hidden");
  elements.modalContent.innerHTML =
    '<div class="p-8 text-center"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#e63c80] mx-auto"></div><p class="mt-4 text-[#f0b9cf]">Cargando detalles...</p></div>';

  try {
    // Buscar el juego en nuestro estado
    const game = appState.filteredGames.find(
      (g) => g.gameID === gameID || g.dealID === gameID
    );

    if (game) {
      renderGameDetail(game);
    } else {
      elements.modalContent.innerHTML =
        '<div class="p-8 text-center text-[#f0b9cf]">No se pudo cargar el detalle del juego.</div>';
    }
  } catch (error) {
    console.error("Error al mostrar detalle:", error);
    elements.modalContent.innerHTML =
      '<div class="p-8 text-center text-[#f0b9cf]">Error al cargar los detalles.</div>';
  }
}

// Renderizar detalle del juego en el modal
function renderGameDetail(game) {
  const discount = Math.round(parseFloat(game.savings || 0));
  const normalPrice = parseFloat(game.normalPrice || game.salePrice);
  const salePrice = parseFloat(game.salePrice);
  const savings = (normalPrice - salePrice).toFixed(2);

  elements.modalContent.innerHTML = `
    <img 
      src="${
        game.thumb || "https://via.placeholder.com/600x300?text=No+Image"
      }" 
      alt="${game.title}"
      class="w-full h-64 object-cover border-b-2 border-[#e63c80]/30"
      onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'"
    />
    <div class="p-6 sm:p-8">
      <h2 class="text-2xl sm:text-3xl font-bold text-[#f0b9cf] mb-4 drop-shadow-[0_0_10px_rgba(240,185,207,0.3)]">
        ${game.title}
      </h2>
      
      <div class="bg-gradient-to-r from-[#e63c80]/10 to-[#c70452]/10 rounded-xl p-4 sm:p-6 mb-6 border border-[#e63c80]/30">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            ${
              normalPrice > salePrice
                ? `
              <p class="text-[#e0d1ed] line-through text-lg">Precio normal: $${normalPrice.toFixed(
                2
              )}</p>
              <p class="text-3xl sm:text-4xl font-bold text-green-400">$${salePrice.toFixed(
                2
              )}</p>
              <p class="text-green-300 font-semibold mt-1">¡Ahorras $${savings}!</p>
            `
                : `
              <p class="text-3xl sm:text-4xl font-bold text-[#f0b9cf]">$${salePrice.toFixed(
                2
              )}</p>
            `
            }
          </div>
          ${
            discount > 0
              ? `
            <div class="bg-gradient-to-r from-[#c70452] to-[#e63c80] text-white font-bold px-6 py-3 rounded-full text-2xl sm:text-3xl self-start sm:self-auto shadow-lg shadow-[#e63c80]/50">
              -${discount}%
            </div>
          `
              : ""
          }
        </div>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#4b004c]/50 rounded-lg p-4 border border-[#e63c80]/20">
          <p class="text-sm text-[#f0b9cf] mb-1">ID del Juego</p>
          <p class="font-semibold text-white">${
            game.gameID || game.dealID || "N/A"
          }</p>
        </div>
        <div class="bg-[#4b004c]/50 rounded-lg p-4 border border-[#e63c80]/20">
          <p class="text-sm text-[#f0b9cf] mb-1">Tienda</p>
          <p class="font-semibold text-white">${getStoreName(game.storeID)}</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-3">
        <button 
          onclick="window.open('https://www.cheapshark.com/redirect?dealID=${
            game.dealID || game.gameID
          }', '_blank')"
          class="flex-1 bg-gradient-to-r from-[#e63c80] to-[#c70452] hover:from-[#f0b9cf] hover:to-[#e63c80] text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-lg shadow-[#e63c80]/30 hover:shadow-[#f0b9cf]/50 hover:scale-105"
        >
          Comprar ahora
        </button>
        <button 
          onclick="closeModal()"
          class="flex-1 bg-[#4b004c] hover:bg-[#c70452] text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          Cerrar
        </button>
      </div>
    </div>
  `;
}

// Obtener nombre de la tienda
function getStoreName(storeID) {
  const stores = {
    1: "Steam",
    2: "GamersGate",
    3: "GreenManGaming",
    7: "GOG",
    8: "Origin",
    11: "Humble Store",
    13: "Uplay",
    15: "Fanatical",
    21: "WinGameStore",
    23: "GameBillet",
    25: "Epic Games Store",
    27: "Gamesplanet",
    28: "Voidu",
  };
  return stores[storeID] || "Tienda desconocida";
}

// Cerrar modal
function closeModal() {
  elements.gameModal.classList.add("hidden");
}

// Mostrar/ocultar loading
function showLoading(show) {
  if (show) {
    elements.loadingSpinner.classList.remove("hidden");
    elements.gamesGrid.classList.add("hidden");
    elements.loadMoreContainer.classList.add("hidden");
    elements.resultsCounter.classList.add("hidden");
  } else {
    elements.loadingSpinner.classList.add("hidden");
    elements.gamesGrid.classList.remove("hidden");
  }
}

// Mostrar error con mensaje detallado
function showError(errorMessage = "Error desconocido") {
  elements.errorMessage.classList.remove("hidden");
  elements.gamesGrid.classList.add("hidden");
  elements.loadMoreContainer.classList.add("hidden");
  elements.resultsCounter.classList.add("hidden");

  // Mostrar detalles del error
  if (elements.errorDetails) {
    elements.errorDetails.textContent = errorMessage;
  }
}

// Ocultar error
function hideError() {
  elements.errorMessage.classList.add("hidden");
  if (elements.errorDetails) {
    elements.errorDetails.textContent = "";
  }
}

// Cargar más juegos
function loadMoreGames() {
  appState.currentPage++;
  renderGames(appState.filteredGames, true);
}

// Actualizar botón "Ver más"
function updateLoadMoreButton() {
  const totalGames = appState.filteredGames.length;
  const shownGames = (appState.currentPage + 1) * appState.pageSize;

  // Actualizar contador de resultados
  if (totalGames > 0) {
    elements.resultsCounter.classList.remove("hidden");
    const activeFilters = [];
    if (appState.currentStore) {
      activeFilters.push(`Tienda: ${getStoreName(appState.currentStore)}`);
    }
    if (appState.currentSort !== "default") {
      activeFilters.push("Ordenado");
    }

    const filterText =
      activeFilters.length > 0 ? ` (${activeFilters.join(", ")})` : "";
    const displayedCount = Math.min(shownGames, totalGames);
    elements.resultsText.textContent = `Mostrando ${displayedCount} de ${totalGames} videojuegos${filterText}`;
  } else {
    elements.resultsCounter.classList.add("hidden");
  }

  // Actualizar botón "Ver más"
  if (shownGames >= totalGames) {
    elements.loadMoreContainer.classList.add("hidden");
  } else {
    elements.loadMoreContainer.classList.remove("hidden");
    const remainingGames = totalGames - shownGames;
    elements.loadMoreBtn.textContent = `Ver más juegos (${remainingGames} restantes)`;
  }
}
