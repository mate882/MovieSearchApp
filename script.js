const API_KEY = 'da9ff8edc69ccc0c28141e8d9ce61c76';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

const searchInput = document.getElementById('searchInput');
const moviesGrid = document.getElementById('moviesGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const movieModal = document.getElementById('movieModal');
const closeModal = document.getElementById('closeModal');
const heroSection = document.getElementById('heroSection');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentCategory = 'popular';
let searchTimeout;

let currentMovies = [];


function showLoading() {
    loading.style.display = 'block';
    moviesGrid.style.display = 'none';
    noResults.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    moviesGrid.style.display = 'grid';
}

function showNoResults() {
    loading.style.display = 'none';
    moviesGrid.style.display = 'none';
    noResults.style.display = 'block';
}

function formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function createMovieCard(movie) {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const posterUrl = movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : '/api/placeholder/280/400';
    
    return `
        <div class="movie-card" onclick="showMovieModal(${movie.id})">
            <img class="movie-poster" src="${posterUrl}" alt="${movie.title}" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${year}</p>
                <div class="movie-rating">
                    <span>⭐</span>
                    <span>${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
}


async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
        if (!response.ok) throw new Error('Failed to fetch movie details');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}


function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        showNoResults();
        return;
    }

    hideLoading();
    moviesGrid.innerHTML = movies.map(createMovieCard).join('');
}

async function fetchMovies(endpoint = `/movie/${currentCategory}`) {
    try {
        showLoading();
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();

        if (data && data.results) {
            currentMovies = data.results; 
            displayMovies(currentMovies);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showNoResults();
    }
}


async function searchMovies(query) {
    if (!query.trim()) {
        loadMoviesByCategory(currentCategory);
        return;
    }

    try {
        showLoading();
        heroSection.style.display = 'none';

        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`);
        const data = await response.json();

        if (data && data.results && data.results.length > 0) {
            displayMovies(data.results);
            currentMovies = data.results; 
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error searching movies:', error);
        showNoResults();
    }
}


function loadMoviesByCategory(category) {
    currentCategory = category;
    heroSection.style.display = 'block';

    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    fetchMovies(`/movie/${category}`);
}


async function showMovieModal(movieId) {
    const movie = await fetchMovieDetails(movieId);
    if (!movie) return;

    const backdropUrl = movie.backdrop_path ? BACKDROP_BASE_URL + movie.backdrop_path : '/api/placeholder/1280/720';
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A';

    document.getElementById('modalBackdrop').src = backdropUrl;
    document.getElementById('modalTitle').textContent = movie.title;
    document.getElementById('modalYear').textContent = year;
    document.getElementById('modalRuntime').textContent = movie.runtime ? `${movie.runtime} min` : 'N/A';
    document.getElementById('modalGenres').textContent = genres;
    document.getElementById('modalOverview').textContent = movie.overview;
    document.getElementById('modalRating').textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    document.getElementById('modalVotes').textContent = formatNumber(movie.vote_count || 0);
    document.getElementById('modalPopularity').textContent = movie.popularity ? movie.popularity.toFixed(1) : 'N/A';
    document.getElementById('modalBudget').textContent = formatCurrency(movie.budget);

    movieModal.style.display = 'block';
}


function hideMovieModal() {
    movieModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchMovies(e.target.value);
    }, 300);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loadMoviesByCategory(btn.dataset.category);
    });
});

closeModal.addEventListener('click', hideMovieModal);

movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        hideMovieModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideMovieModal();
    }
});

loadMoviesByCategory('popular');
