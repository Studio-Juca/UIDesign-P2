/* ── STATE ── */
let currentBook = null;
let bookshelf    = [];
let infoMode     = 'blurb';
let usedBooks    = new Set();
let toastTimer; 

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  buildFilterChips();
  bindButtons();
});

/* ── FILTER CHIPS ── */
const genres      = [...new Set(books.flatMap(b => [].concat(b.genre)))];
const activeGenres = new Set(genres);

function buildFilterChips() {
  const container = document.getElementById('filter-chips');
  genres.forEach(genre => {
    const chip = document.createElement('button');
    chip.className   = 'chip selected';
    chip.textContent = genre;
    chip.onclick = () => {
      if (activeGenres.has(genre)) {
        activeGenres.delete(genre);
        chip.classList.remove('selected');
      } else {
        activeGenres.add(genre);
        chip.classList.add('selected');
      }
    };
    container.appendChild(chip);
  });
}

/* ── BIND BUTTONS ── */
function bindButtons() {
  document.getElementById('btn-filters').onclick  = toggleFilters;
  document.getElementById('btn-recommend').onclick = getRecommendation;
  document.getElementById('btn-add').onclick       = addToBookshelf;
  document.getElementById('btn-go-shelf').onclick  = goToShelf;
  document.getElementById('btn-back').onclick      = goHome;
  document.getElementById('book-cover-img').onclick = openLightbox;
  document.getElementById('lightbox-close').onclick = closeLightbox;
  document.getElementById('lightbox').onclick = (e) => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  };
  document.getElementById('toggle-sentence').onclick = () => switchInfo('sentence');
  document.getElementById('toggle-blurb').onclick    = () => switchInfo('blurb');
}

/* ── FILTERS ── */
function toggleFilters() {
  document.getElementById('filter-panel').classList.toggle('open');
}

/* ── RECOMMENDATION ── */
function getRecommendation() {
  const available = books.filter(b => [].concat(b.genre).some(g => activeGenres.has(g)) && !usedBooks.has(b.id));
  if (available.length === 0) {
    usedBooks.clear();
    showToast("You've seen all books! Starting over.");
    return;
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  usedBooks.add(pick.id);
  showBook(pick);
}

/* ── SHOW BOOK ── */
function showBook(book) {
  currentBook = book;

  document.getElementById('book-title').textContent = book.title + ' — ' + book.author;
  renderStars(book.rating, document.getElementById('stars-display'));
  document.getElementById('rating-count').textContent = '(' + book.ratingCount + ')';

  // Cover
  const coverEl = document.getElementById('book-cover-img');
  if (book.coverUrl) {
    coverEl.innerHTML = '<img src="' + book.coverUrl + '" alt="' + book.title + '">';
  } else {
    coverEl.innerHTML = '<div class="cover-placeholder">' + book.title + '</div>';
  }

  updateInfoContent();
  syncAddButton();
}

/* ── STARS ── */
function renderStars(rating, container) {
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className   = 'star' + (i <= Math.round(rating) ? '' : ' empty');
    star.textContent = '★';
    container.appendChild(star);
  }
}

/* ── INFO TOGGLE ── */
function switchInfo(mode) {
  infoMode = mode;
  document.getElementById('toggle-sentence').className = 'toggle-btn ' + (mode === 'sentence' ? 'active' : 'inactive');
  document.getElementById('toggle-blurb').className    = 'toggle-btn ' + (mode === 'blurb'    ? 'active' : 'inactive');
  updateInfoContent();
}

function updateInfoContent() {
  const el = document.getElementById('info-content');
  if (!currentBook) {
    el.textContent = 'Get a recommendation to see book details here.';
    return;
  }
  el.textContent = infoMode === 'sentence' ? currentBook.sentence : currentBook.blurb;
}

/* ── ADD TO BOOKSHELF ── */
function addToBookshelf() {
  if (!currentBook) { showToast('Get a recommendation first!'); return; }
  if (bookshelf.some(b => b.id === currentBook.id)) {
    showToast('"' + currentBook.title + '" is already on your shelf!');
    return;
  }
  bookshelf.push(currentBook);
  syncAddButton();
  showToast('Added "' + currentBook.title + '" to your shelf!');
}

function syncAddButton() {
  const btn       = document.getElementById('btn-add');
  const onShelf   = currentBook && bookshelf.some(b => b.id === currentBook.id);
  btn.textContent = onShelf ? '✓ On bookshelf' : 'Add to bookshelf';
  btn.classList.toggle('added', !!onShelf);
}

/* ── NAVIGATION ── */
function goToShelf() {
  renderShelf();
  document.getElementById('screen-home').classList.remove('active');
  document.getElementById('screen-shelf').classList.add('active');
}

function goHome() {
  document.getElementById('screen-shelf').classList.remove('active');
  document.getElementById('screen-home').classList.add('active');
  syncAddButton();
}

/* ── RENDER BOOKSHELF ── */
function renderShelf() {
  const container = document.getElementById('shelf-contents');

  if (bookshelf.length === 0) {
    container.innerHTML = '<div class="shelf-empty">Your bookshelf is empty.<br>Add some recommendations first!</div>';
    return;
  }

  container.innerHTML = '<div class="shelf-grid" id="shelf-grid"></div>';
  const grid = document.getElementById('shelf-grid');

  bookshelf.forEach(book => {
    const starsHtml = Array.from({ length: 5 }, (_, i) =>
      '<span class="star' + (i < Math.round(book.rating) ? '' : ' empty') + '">★</span>'
    ).join('');

    const card = document.createElement('div');
    card.className = 'shelf-book';
    card.innerHTML = `
      <div class="shelf-cover-placeholder">${book.title}</div>
      <div class="shelf-info">
        <div class="shelf-book-title">${book.title}</div>
        <div class="shelf-book-author">${book.author}</div>
        <div class="shelf-stars">${starsHtml}</div>
      </div>
      <button class="btn-remove" data-id="${book.id}">Remove</button>
    `;
    grid.appendChild(card);
  });

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.onclick = () => {
      bookshelf = bookshelf.filter(b => b.id !== parseInt(btn.dataset.id));
      renderShelf();
    };
  });
}

/* ── LIGHTBOX ── */
function openLightbox() {
  const wrap = document.getElementById('lightbox-img-wrap');
  if (currentBook && currentBook.coverUrl) {
    wrap.innerHTML = '<img src="' + currentBook.coverUrl + '" alt="' + currentBook.title + '">';
  } else {
    wrap.innerHTML = '<div class="lightbox-placeholder">' + (currentBook ? currentBook.title : 'Book cover') + '</div>';
  }
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

/* ── TOAST ── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
