// Import required modules
import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const createApiRequest = () => {
  const apiRequest = {
    searchQuery: '',
    pageCount: 1,
    perPage: 40,

    fetchImages: async function () {
      const options = {
        method: 'get',
        url: 'https://pixabay.com/api/',
        params: {
          key: `40910159-4d501b12f705b7e79a4470018`,
          q: `${apiRequest.searchQuery}`,
          image_type: 'photo',
          orientation: 'horizontal',
          safesearch: true,
          page: `${apiRequest.pageCount}`,
          per_page: `${apiRequest.perPage}`,
        },
      };
      try {
        const response = await axios(options);
        apiRequest.pageCount += 1;
        return response.data;
      } catch (error) {
        Notify.failure(`Oops! Something went wrong! Error:` + error);
      }
    },
    get query() {
      return apiRequest.searchQuery;
    },
    set query(newSearchQuery) {
      apiRequest.searchQuery = newSearchQuery;
    },
  };

  return apiRequest;
};

// Select DOM elements
const searchForm = document.querySelector('.search-form');
const inputEl = document.querySelector('form > input');
const gallery = document.querySelector('.gallery');
const scrollToTopButton = document.createElement('button');

// Set up event listener for the search form
searchForm.addEventListener('submit', whileSearching);

// Set up event listener for the scroll (infinite scrolling)
window.addEventListener('scroll', () => {
  throttle(handleInfiniteScroll, 250);
});

// Set up event listener for the "Home" button
scrollToTopButton.addEventListener('click', () => {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
});

// Home button for end of scrolling (final page)
scrollToTopButton.innerText = 'Home';
scrollToTopButton.id = 'scroll-top';
document.body.appendChild(scrollToTopButton);

// Initialize variables for infinite scrolling
let perPage = 40;
let totalPages = 1;
let endreached = false;
let lightbox;
const apiRequest = createApiRequest();

// Search function
function whileSearching(event) {
  event.preventDefault();
  gallery.innerHTML = '';
  endreached = false;
  scrollToTopButton.style.display = 'none';
  apiRequest.query = inputEl.value.trim();
  apiRequest.pageCount = 1;
  if (apiRequest.query === '') {
    Notify.warning('Please, fill the main field');
    return;
  }

  fetchGallery();
}

// Fetch gallery function
async function fetchGallery() {
  if (apiRequest.pageCount > totalPages) {
    Notify.info("We're sorry, but you've reached the end of search results.");
    endreached = true;
    scrollToTopButton.style.display = 'block';
    return;
  }

  const result = await apiRequest.fetchImages();
  console.log(result);
  if (!result) {
    inputEl.value = '';
    return;
  }

  const { hits, total } = result;
  if (apiRequest.pageCount === 2) {
    if (total === 0) {
      Notify.failure(
        `Sorry, there are no images matching your search query. Please try again.`
      );
      return;
    }
    totalPages = Math.floor(total / perPage) + 1;
    Notify.success(`Found ${total} images!`);
  }

  displayImages(hits);

  if (apiRequest.pageCount === 2) {
    lightbox = new SimpleLightbox('.gallery a', {
      captions: true,
      captionsData: 'alt',
      captionDelay: 250,
    });
  } else {
    lightbox.refresh();
  }
}

// Function to display images in the gallery
function displayImages(images) {
  const markup = images
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="photo-card">
        <a href="${largeImageURL}">
          <img src="${webformatURL}" alt="${tags}" loading="lazy" />
        </a>
        <div class="info"> 
          <p class="info-item"><b>Likes</b> ${likes}</p>
          <p class="info-item"><b>Views</b> ${views}</p>
          <p class="info-item"><b>Comments</b> ${comments}</p>
          <p class="info-item"><b>Downloads</b> ${downloads}</p>
        </div>
      </div>`;
      }
    )
    .join('');
  gallery.insertAdjacentHTML('beforeend', markup);

  if (apiRequest.pageCount > totalPages) {
    scrollToTopButton.style.display = 'block';
  }
}

// Function to handle infinite scrolling
let throttlePause;

const throttle = (callback, time) => {
  if (throttlePause) return;
  throttlePause = true;
  setTimeout(() => {
    callback();
    throttlePause = false;
  }, time);
};

const handleInfiniteScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  if (scrollTop + clientHeight >= scrollHeight - 5 && !endreached) {
    fetchGallery();
  }
};
