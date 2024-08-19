const API_KEY_TMDB = '1cb327a54ab3a7f77c6a593d258593bb';
const URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
  },
};

const $moviesContainer = document.querySelector('#movies-con .movies');
const $categoryMovies = document.querySelector('#category .movies');
const $searchInput = document.getElementById('search-input');
const $searchButton = document.getElementById('search-btn');
const $sectionTitle = document.getElementById('section-title');
const $categoryButtons = document.querySelectorAll('.category-btn');
const $recentMoviesContainer = document.querySelector('#recent-movies .movies-container');
const $pagination = document.querySelector('#movies-con .pagination');

let currentPage = 1;
let totalPages = 1;
let currentMovies = [];

// 인기 영화 가져오기
const fetchTopRatedMovies = async (page = 1) => {
  try {
    const response = await fetch(`${URL}/movie/top_rated?api_key=${API_KEY_TMDB}&language=ko&page=${page}`, options);
    const data = await response.json();
    totalPages = data.total_pages;
    return data.results;
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
  }
};

// 영화 검색 기능
const searchMovies = async (query, page = 1) => {
  try {
    const response = await fetch(
      `${URL}/search/movie?api_key=${API_KEY_TMDB}&language=ko&query=${encodeURIComponent(query)}&page=${page}`,
      options
    );
    const data = await response.json();
    totalPages = data.total_pages;
    return data.results;
  } catch (error) {
    console.error('Error searching movies:', error);
  }
};

// 최신 영화 가져오기
const fetchNowPlayingMovies = async (page = 1) => {
  try {
    const response = await fetch(`${URL}/movie/now_playing?api_key=${API_KEY_TMDB}&language=ko&page=${page}`, options);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
  }
};

// 장르별 영화 가져오기
const fetchMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await fetch(
      `${URL}/discover/movie?api_key=${API_KEY_TMDB}&with_genres=${genreId}&page=${page}&sort_by=vote_average.desc&vote_count.gte=50&language=ko`,
      options
    );
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
  }
};

// 영화 표시 함수
const displayMovies = (movies, container = $moviesContainer) => {
  container.innerHTML = '';
  movies.forEach((movie) => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.innerHTML = `
      <div class="movie-image" style="background-image: url('${
        movie.poster_path ? IMAGE_URL + movie.poster_path : 'path_to_placeholder_image.jpg'
      }')">
        <div class="movie-overlay">
          <span class="movie-rates">${movie.vote_average.toFixed(1)}</span>
          <h3 class="movie-title">${movie.title}</h3>
          <span class="movie-release-date">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
        </div>
      </div>
    `;
    container.appendChild(movieCard);
  });
};

// 페이지네이션 업데이트 함수
const updatePagination = () => {
  $pagination.innerHTML = '';
  const totalPagesToShow = Math.min(5, totalPages);
  let startPage = Math.max(currentPage - 2, 1);
  let endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);

  if (endPage - startPage + 1 < totalPagesToShow) {
    startPage = Math.max(endPage - totalPagesToShow + 1, 1);
  }

  // 이전 버튼
  if (currentPage > 1) {
    const prevButton = createPageButton('이전', () => changePage(currentPage - 1));
    $pagination.appendChild(prevButton);
  }

  // 페이지 번호 버튼
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = createPageButton(i, () => changePage(i), i === currentPage);
    $pagination.appendChild(pageButton);
  }

  // 다음 버튼
  if (currentPage < totalPages) {
    const nextButton = createPageButton('다음', () => changePage(currentPage + 1));
    $pagination.appendChild(nextButton);
  }
};

// 페이지 버튼 생성 함수
const createPageButton = (text, onClick, isActive = false) => {
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClick);
  if (isActive) {
    button.classList.add('active');
  }
  return button;
};

// 페이지 변경 함수
const changePage = async (newPage) => {
  if (newPage < 1 || newPage > totalPages) return;

  currentPage = newPage;

  if ($searchInput.value.trim()) {
    currentMovies = await searchMovies($searchInput.value.trim(), currentPage);
  } else {
    currentMovies = await fetchTopRatedMovies(currentPage);
  }

  displayMovies(currentMovies.slice(0, 12));
  updatePagination();
};

// 검색 결과 로드
const loadSearchResults = async () => {
  const query = $searchInput.value.trim();
  if (query) {
    currentPage = 1;
    currentMovies = await searchMovies(query);
    if (currentMovies && currentMovies.length > 0) {
      displayMovies(currentMovies.slice(0, 12));
      updatePagination();
      $sectionTitle.textContent = `"${query}" 검색 결과`;
    } else {
      $moviesContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
      $pagination.innerHTML = '';
      $sectionTitle.textContent = `"${query}" 검색 결과`;
    }
  }
};

// 인기 영화 로드
const loadTopRatedMovies = async () => {
  currentPage = 1;
  currentMovies = await fetchTopRatedMovies();
  if (currentMovies) {
    displayMovies(currentMovies.slice(0, 12));
    updatePagination();
    $sectionTitle.textContent = '인기 영화';
  }
};

// 최신 영화 슬라이더 로드
const loadNowPlayingMoviesSlider = async () => {
  let currentPage = 1;
  const totalPages = 10;
  const moviesPerSlide = 3;
  let allMovies = [];

  // 모든 페이지의 영화 데이터 가져오기
  for (let i = 1; i <= totalPages; i++) {
    const movies = await fetchNowPlayingMovies(i);
    allMovies = allMovies.concat(movies);
  }

  const createSlide = (movies) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    movies.forEach((movie) => {
      const movieItem = document.createElement('div');
      movieItem.className = 'movie-item';
      movieItem.innerHTML = `
      <div class="movie-image" style="background-image: url('${
        movie.poster_path ? IMAGE_URL + movie.poster_path : 'path_to_placeholder_image.jpg'
      }')">
        <div class="movie-overlay">
          <h3 class="movie-title">${movie.title}</h3>
          <p class="movie-overview">${movie.overview.slice(0, 100)}...</p>
        </div>
      </div>
    `;
      slide.appendChild(movieItem);
    });
    return slide;
  };

  const updateSlider = () => {
    $recentMoviesContainer.innerHTML = '';
    const startIndex = (currentPage - 1) * moviesPerSlide;
    const endIndex = startIndex + moviesPerSlide;
    const slideMovies = allMovies.slice(startIndex, endIndex);
    const slide = createSlide(slideMovies);
    $recentMoviesContainer.appendChild(slide);
  };

  updateSlider();

  // 다음 슬라이드 버튼
  const nextSlideButton = document.createElement('button');
  nextSlideButton.textContent = '다음';
  nextSlideButton.addEventListener('click', () => {
    currentPage = (currentPage % totalPages) + 1;
    updateSlider();
  });

  // 이전 슬라이드 버튼
  const prevSlideButton = document.createElement('button');
  prevSlideButton.textContent = '이전';
  prevSlideButton.addEventListener('click', () => {
    currentPage = ((currentPage - 2 + totalPages) % totalPages) + 1;
    updateSlider();
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'slider-buttons';
  buttonContainer.appendChild(prevSlideButton);
  buttonContainer.appendChild(nextSlideButton);
  document.querySelector('#recent-movies').appendChild(buttonContainer);
};

// 장르별 영화 로드
const loadMoviesByGenre = async (genreId, genreName) => {
  const movies = await fetchMoviesByGenre(genreId);
  if (movies) {
    displayMovies(movies.slice(0, 15), $categoryMovies);
    document.querySelector('#category h2').textContent = `${genreName} 영화`;

    // 활성 버튼 스타일 변경
    $categoryButtons.forEach((button) => {
      button.classList.remove('active');
      if (button.dataset.genreId == genreId) {
        button.classList.add('active');
      }
    });
  }
};

// 장르 버튼 초기화
const initGenreButtons = async () => {
  const genresResponse = await fetch(`${URL}/genre/movie/list?api_key=${API_KEY_TMDB}&language=ko`, options);
  const genresData = await genresResponse.json();
  const genres = genresData.genres;

  let actionGenreId;
  $categoryButtons.forEach((button) => {
    const genreName = button.textContent;
    const genre = genres.find((g) => g.name === genreName);
    if (genre) {
      button.dataset.genreId = genre.id;
      button.addEventListener('click', () => loadMoviesByGenre(genre.id, genre.name));
      if (genreName === '액션') {
        actionGenreId = genre.id;
      }
    }
  });
  return actionGenreId;
};

// 초기화 함수
async function init() {
  await loadTopRatedMovies();
  await loadNowPlayingMoviesSlider();
  const actionGenreId = await initGenreButtons();
  if (actionGenreId) {
    await loadMoviesByGenre(actionGenreId, '액션');
  } else {
    console.error('Failed to load action genre');
  }

  $searchButton.addEventListener('click', loadSearchResults);
  $searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadSearchResults();
    }
  });
}

// 페이지 로드 시 초기화
window.addEventListener('load', init);
