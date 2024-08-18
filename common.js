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

// 인기 영화 가져오기
const fetchTopRatedMovies = async (page = 1) => {
  try {
    const response = await fetch(`${URL}/movie/top_rated?api_key=${API_KEY_TMDB}&language=ko&page=${page}`, options);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
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

// 영화 표시 함수
const displayMovies = (movies, container) => {
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
          <span class="movie-release-date">${movie.release_date.split('-')[0]}</span>
        </div>
      </div>
    `;
    container.appendChild(movieCard);
  });
};

// 인기 영화 로드
const loadTopRatedMovies = async () => {
  const movies = await fetchTopRatedMovies();
  if (movies) {
    displayMovies(movies.slice(0, 12), $moviesContainer);
    $sectionTitle.textContent = '인기 영화';
  }
};

// 장르별 영화 로드
const loadMoviesByGenre = async (genreId, genreName) => {
  const movies = await fetchMoviesByGenre(genreId);
  if (movies) {
    displayMovies(movies.slice(0, 15), $categoryMovies);
    document.querySelector('#category h2').textContent = `${genreName} 영화 (평점 순)`;

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
  await loadTopRatedMovies(); // 최신 인기 영화를 movies-con 섹션에 로드
  await loadNowPlayingMoviesSlider(); // 최신 개봉 영화 슬라이더 로드
  const actionGenreId = await initGenreButtons();
  if (actionGenreId) {
    await loadMoviesByGenre(actionGenreId, '액션'); // 액션 영화를 category 섹션에 로드
  } else {
    console.error('Action genre not found');
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
