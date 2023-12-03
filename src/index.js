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

const searchForm = document.querySelector('.search-form');
const inputEl = document.querySelector('form > input');
const gallery = document.querySelector('.gallery');
const scrollToTopButton = document.querySelector('.to-search-form');
const loadMoreButton = document.querySelector('.load-more');
// setari initiale pentru butoane
loadMoreButton.style.display = 'none';
scrollToTopButton.style.display = 'none';

searchForm.addEventListener('submit', whileSearching);
loadMoreButton.addEventListener('click', () => {
  fetchGallery();
});

scrollToTopButton.addEventListener('click', () => {
  window.scrollTo(0, 0);
});
// variabile pentru paginatie
let perPage = 40;
let totalPages = 1;
let lightbox;

const apiRequest = createApiRequest();

// Search function
function whileSearching(event) {
  event.preventDefault();
  gallery.innerHTML = '';

  apiRequest.query = inputEl.value.trim();
  apiRequest.pageCount = 1;

  if (apiRequest.query === '') {
    Notify.warning('Please, fill the main field');
    return;
  }
  fetchGallery();
}

async function fetchGallery() {
  loadMoreButton.style.display = 'none';
  scrollToTopButton.style.display = 'none';
  const result = await apiRequest.fetchImages();
  // daca nu avem nici un result, curatam input-ul si return
  if (!result) {
    inputEl.value = '';
    return;
  }

  const { hits, total } = result;
  if (total === 0) {
    Notify.failure(
      `Sorry, there are no images matching your search query. Please try again.`
    );
    return;
  }
  if (apiRequest.pageCount === 1) {
    totalPages = Math.ceil(total / perPage) + 1;
    Notify.success(`Found ${total} images!`);
  }
  displayImages(hits);

  apiRequest.pageCount += 1;

  let isEndReached = apiRequest.pageCount >= totalPages;
  let hasMoreImages = total > perPage * (apiRequest.pageCount - 1);

  loadMoreButton.style.display = hasMoreImages ? 'block' : 'none';

  scrollToTopButton.style.display =
    apiRequest.pageCount === 2 && isEndReached
      ? 'none'
      : (loadMoreButton.style.display = hasMoreImages ? 'block' : 'none');

  scrollToTopButton.style.display =
    apiRequest.pageCount === 2 && isEndReached ? 'none' : 'block';

  if (isEndReached && !hasMoreImages) {
    Notify.info("We are sorry, but you've reached the end of search results.");
  }

  if (apiRequest.pageCount === 2) {
    lightbox = new SimpleLightbox('.gallery a', {
      captions: true,
      captionsData: 'alt',
      captionDelay: 250,
    });
  } else {
    lightbox.refresh();
  }
  scrollDownToLastCard();
}
function scrollDownToLastCard() {
  const lastCard = document.querySelector('.gallery .photo-card:last-child');
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
}
