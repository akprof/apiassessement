// My DOM Elements
    const countriesContainer = document.getElementById('countries-container');
    const favoritesContainer = document.getElementById('favorites-container');
    const searchInput = document.getElementById('search-input');
    const regionFilter = document.getElementById('region-filter');
    const sortSelect = document.getElementById('sort-by');
    const countryModal = document.getElementById('country-modal');
    const modalContent = document.getElementById('modal-content');
    const closeBtn = document.querySelector('.close-btn');
    const toggleBtn = document.querySelector('.toggle-btn');
    const favoritesBtn = document.querySelector('.favorites-btn');

    // My State variables
    let allCountries = [];
    let filteredCountries = [];
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let isFavoritesView = false;

    // Initialize the app
    document.addEventListener('DOMContentLoaded', () => {
        // Set initial dark mode state
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }

        // Fetch countries data
        fetchCountries();

        // Set up event listeners
        searchInput.addEventListener('input', handleSearch);
        regionFilter.addEventListener('change', handleFilter);
        sortSelect.addEventListener('change', handleSort);
        closeBtn.addEventListener('click', () => countryModal.style.display = 'none');
        toggleBtn.addEventListener('click', toggleDarkMode);
        favoritesBtn.addEventListener('click', toggleFavoritesView);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === countryModal) {
                countryModal.style.display = 'none';
            }
        });
    });

    // Fetch countries from API with specific fields
    async function fetchCountries() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,languages,population,area,currencies,region,timezones,flags,coatOfArms');
            if (!response.ok) throw new Error('Failed to fetch countries');
            
            allCountries = await response.json();
            filteredCountries = [...allCountries];
            
            displayCountries(allCountries);
        } catch (error) {
            console.error('Error fetching countries:', error);
            countriesContainer.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Failed to load countries. Please try again later.
                </div>
            `;
        }
    }

    // Display countries in the grid
    function displayCountries(countries) {
        if (countries.length === 0) {
            countriesContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i> 
                    No countries found. Try a different search.
                </div>
            `;
            return;
        }

        countriesContainer.innerHTML = countries.map(country => {
            // Generate a unique ID for each country since we don't have cca3
            const countryId = country.name.common.toLowerCase().replace(/\s+/g, '-');
            const isFavorite = favorites.some(fav => fav.id === countryId);
            
            return `
                <div class="country-card" data-country-id="${countryId}">
                    <img src="${country.flags.png}" alt="${country.name.common} flag" class="country-flag">
                    <div class="country-info">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-country-id="${countryId}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <h3 class="country-name">${country.name.common}</h3>
                        <div class="country-details">
                            <span><strong>Region:</strong> ${country.region}</span>
                            <span><strong>Population:</strong> ${formatPopulation(country.population)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to country cards and favorite buttons
        document.querySelectorAll('.country-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-btn')) {
                    const countryId = card.getAttribute('data-country-id');
                    showCountryDetails(countryId);
                }
            });
        });

        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const countryId = btn.getAttribute('data-country-id');
                toggleFavorite(countryId);
            });
        });
    }

    // Format population with commas
    function formatPopulation(population) {
        return population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Show country details in modal
    function showCountryDetails(countryId) {
        const country = allCountries.find(c => 
            c.name.common.toLowerCase().replace(/\s+/g, '-') === countryId
        );
        
        if (!country) return;

        modalContent.innerHTML = `
            <img src="${country.flags.png}" alt="${country.name.common} flag" class="modal-flag">
            <h2 class="modal-title">${country.name.common}</h2>
            <div class="modal-details">
                <div class="detail-group">
                    <h3>Basic Information</h3>
                    <p><strong>Official Name:</strong> ${country.name.official}</p>
                    <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
                    <p><strong>Region:</strong> ${country.region}</p>
                    <p><strong>Area:</strong> ${country.area ? country.area.toLocaleString() + ' km²' : 'N/A'}</p>
                    <p><strong>Population:</strong> ${formatPopulation(country.population)}</p>
                </div>
                <div class="detail-group">
                    <h3>Details</h3>
                    <p><strong>Languages:</strong> ${country.languages ? Object.values(country.languages).join(', ') : 'N/A'}</p>
                    <p><strong>Currencies:</strong> ${country.currencies ? Object.values(country.currencies).map(c => c.name).join(', ') : 'N/A'}</p>
                    <p><strong>Timezones:</strong> ${country.timezones.join(', ')}</p>
                    <a href="https://www.google.com/maps/place/${encodeURIComponent(country.name.common)}" target="_blank" class="map-link">
                        <i class="fas fa-map-marker-alt"></i> View on Google Maps
                    </a>
                </div>
            </div>
        `;

        countryModal.style.display = 'block';
    }

    // Toggle favorite status
    function toggleFavorite(countryId) {
        const country = allCountries.find(c => 
            c.name.common.toLowerCase().replace(/\s+/g, '-') === countryId
        );
        
        if (!country) return;

        const favoriteIndex = favorites.findIndex(fav => fav.id === countryId);
        
        if (favoriteIndex === -1) {
            // Add to favorites
            favorites.push({
                id: countryId,
                name: country.name.common,
                flag: country.flags.png,
                region: country.region,
                population: country.population
            });
        } else {
            // Remove from favorites
            favorites.splice(favoriteIndex, 1);
        }

        // Save to localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites));

        // Update UI
        if (isFavoritesView) {
            displayFavorites();
        } else {
            displayCountries(filteredCountries);
        }
    }

    // Display favorites
    function displayFavorites() {
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1;">
                    <i class="fas fa-heart"></i> 
                    You haven't added any favorites yet.
                </div>
            `;
            return;
        }

        favoritesContainer.innerHTML = `
            <h2 style="grid-column: 1 / -1; margin-bottom: 20px;">Your Favorite Countries</h2>
            ${favorites.map(country => `
                <div class="country-card" data-country-id="${country.id}">
                    <img src="${country.flag}" alt="${country.name} flag" class="country-flag">
                    <div class="country-info">
                        <button class="favorite-btn active" data-country-id="${country.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <h3 class="country-name">${country.name}</h3>
                        <div class="country-details">
                            <span><strong>Region:</strong> ${country.region}</span>
                            <span><strong>Population:</strong> ${formatPopulation(country.population)}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;

        // Add event listeners to favorite cards and buttons
        document.querySelectorAll('#favorites-container .country-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-btn')) {
                    const countryId = card.getAttribute('data-country-id');
                    showCountryDetails(countryId);
                }
            });
        });

        document.querySelectorAll('#favorites-container .favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const countryId = btn.getAttribute('data-country-id');
                toggleFavorite(countryId);
            });
        });
    }

    // Toggle favorites view
    function toggleFavoritesView() {
        isFavoritesView = !isFavoritesView;
        
        if (isFavoritesView) {
            countriesContainer.style.display = 'none';
            favoritesContainer.style.display = 'grid';
            displayFavorites();
            favoritesBtn.innerHTML = '<i class="fas fa-globe-americas"></i>';
            favoritesBtn.title = 'View All Countries';
        } else {
            favoritesContainer.style.display = 'none';
            countriesContainer.style.display = 'grid';
            favoritesBtn.innerHTML = '<i class="fas fa-heart"></i>';
            favoritesBtn.title = 'View Favorites';
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        
        if (isDarkMode) {
            toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Handle search
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        applyFilters();
    }

    // Handle region filter
    function handleFilter() {
        applyFilters();
    }

    // Handle sort
    function handleSort() {
        applyFilters();
    }

    // Apply all filters and sorting
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const region = regionFilter.value;
        const sortOrder = sortSelect.value;
        
        // Filter countries
        filteredCountries = allCountries.filter(country => {
            const matchesSearch = country.name.common.toLowerCase().includes(searchTerm);
            const matchesRegion = !region || country.region === region;
            return matchesSearch && matchesRegion;
        });
        
        // Sort countries
        if (sortOrder === 'asc') {
            filteredCountries.sort((a, b) => a.population - b.population);
        } else if (sortOrder === 'desc') {
            filteredCountries.sort((a, b) => b.population - a.population);
        }
        
        // Display filtered countries
        displayCountries(filteredCountries);
    }