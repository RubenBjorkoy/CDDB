let allCDs = [];
let currentSortBy = 'artist';
let currentAscending = true;

function fetchAndDisplayCDs(sortBy = 'artist', ascending = true, filter = '') {
  currentSortBy = sortBy;
  currentAscending = ascending;

  window.electronAPI.executeQuery('SELECT * FROM CDs')
    .then((results) => {
      allCDs = results;
      const filteredCDs = filterCDs(allCDs, filter);
      const sortedCDs = sortCDs(filteredCDs, sortBy, ascending);
      displayCDs(sortedCDs);
    })
    .catch((error) => {
      console.error('Error fetching CDs:', error);
    });
}

fetchAndDisplayCDs('artist', true);

function displayCDs(cds) {
  const app = document.getElementById('cdList');
  app.innerHTML = cds
    .map(
      (row) => `
    <div class="cdCard" onclick="openEditModal(${row.id}, '${row.album.replace(/'/g, "\\'")}', '${row.artist.replace(/'/g, "\\'")}', ${row.year}, '${row.location.replace(/'/g, "\\'")}', '${row.position.replace(/'/g, "\\'")}')">
      <p><strong>Album:</strong> ${row.album}</p>
      <p><strong>Artist:</strong> ${row.artist}</p>
      <p><strong>Year:</strong> ${row.year}</p>
    </div>
  `
    )
    .join('');
}

function filterCDs(cds, filter) {
  if (!filter) return cds; 
  const searchTerm = filter.toLowerCase();
  return cds.filter(
    (cd) =>
      cd.artist.toLowerCase().includes(searchTerm) ||
      cd.album.toLowerCase().includes(searchTerm) ||
      cd.year.toString().includes(searchTerm)
  );
}

document.querySelector('input[placeholder="Search"]').addEventListener('input', (e) => {
  const searchTerm = e.target.value;
  const filteredCDs = filterCDs(allCDs, searchTerm);
  const sortedCDs = sortCDs(filteredCDs, currentSortBy, currentAscending);
  displayCDs(sortedCDs);
});

document.getElementById('sortOptions').addEventListener('change', (e) => {
  const [sortBy, order] = e.target.value.split('-');
  const ascending = order === 'asc';
  fetchAndDisplayCDs(sortBy, ascending);
});

function sortCDs(cds, sortBy, ascending) {
  return cds.slice().sort((a, b) => {
    if (sortBy === 'artist') {
      if (a.artist !== b.artist) {
        return ascending
          ? a.artist.localeCompare(b.artist)
          : b.artist.localeCompare(a.artist);
      }
      return ascending ? a.year - b.year : b.year - a.year;
    } else if (sortBy === 'year') {
      return ascending ? a.year - b.year : b.year - a.year;
    } else if (sortBy === 'album') {
      return ascending
        ? a.album.localeCompare(b.album)
        : b.album.localeCompare(a.album);
    }
    return 0;
  });
}

document.getElementById('openAddModal').onclick = () => {
  document.getElementById('addModal').style.display = 'flex';
};

document.getElementById('closeAddModal').onclick = () => {
  document.getElementById('addModal').style.display = 'none';
};

document.getElementById('addModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('addModal')) {
    document.getElementById('addModal').style.display = 'none';
  }
});

document.getElementById('addCDForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const album = document.getElementById('newAlbum').value;
  const artist = document.getElementById('newArtist').value;
  const year = parseInt(document.getElementById('newYear').value, 10);
  const location = document.getElementById('newLocation').value;
  const position = document.getElementById('newPosition').value;

  window.electronAPI.addCD({ album, artist, year, location, position })
    .then(() => {
      document.getElementById('addModal').style.display = 'none';
      window.location.reload();
    })
    .catch((error) => console.error('Error adding CD:', error));
});

function openEditModal(id, album, artist, year, location, position) {
  const modal = document.getElementById('editModal');
  modal.style.display = 'block';

  document.getElementById('cdInfoSection').style.display = 'block';
  document.getElementById('cdEditSection').style.display = 'none';

  document.getElementById('infoAlbum').innerText = album;
  document.getElementById('infoArtist').innerText = artist;
  document.getElementById('infoYear').innerText = year;
  document.getElementById('infoLocation').innerText = location;
  document.getElementById('infoPosition').innerText = position;

  window.electronAPI.getEnv('LASTFM_API_KEY').then((apiKey) => {
    fetch(`http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`)
    .then((response) => response.json())
    .then((data) => {
      const albumInfo = data.album;

      if (albumInfo) {
        const albumImage = albumInfo.image.find((img) => img.size === 'mega')?.['#text'] || '';
        document.getElementById('infoApiData').innerHTML = `
          <img src="${albumImage}" alt="${album}" style="width: 100%; border-radius: 10px; margin-bottom: 15px;" />
        `;

        const wikiSummary = albumInfo.wiki?.summary || 'No description available.';
        document.getElementById('infoApiData').innerHTML += `
          <p><strong>Description:</strong> ${wikiSummary}</p>
        `;

        const tracklist = albumInfo.tracks?.track
          .map((track, index) => {
            return `<li><a href="${track.url}" target="_blank">${track.name}</a> (${formatDuration(track.duration)})</li>`;
          })
          .join('') || '<li>No tracks available.</li>';

        document.getElementById('infoApiData').innerHTML += `
          <p><strong>Tracklist:</strong></p>
          <ol>${tracklist}</ol>
        `;
      } else {
        document.getElementById('infoApiData').innerHTML = '<p>No additional info available from API.</p>';
      }
    })
    .catch((error) => {
      console.error('Error fetching additional info:', error);
      document.getElementById('infoApiData').innerText = 'Failed to fetch additional info.';
    });
  })

  document.getElementById('editButton').onclick = () => {
    document.getElementById('cdInfoSection').style.display = 'none';
    document.getElementById('cdEditSection').style.display = 'block';

    document.getElementById('editId').value = id;
    document.getElementById('editAlbum').value = album;
    document.getElementById('editArtist').value = artist;
    document.getElementById('editYear').value = year;
    document.getElementById('editLocation').value = location;
    document.getElementById('editPosition').value = position;
  };
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

document.getElementById('closeModal').onclick = () => {
  document.getElementById('editModal').style.display = 'none';
};

document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('editModal')) {
    document.getElementById('editModal').style.display = 'none';
  }
});

document.getElementById('editCDForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const album = document.getElementById('editAlbum').value;
  const artist = document.getElementById('editArtist').value;
  const year = parseInt(document.getElementById('editYear').value, 10);
  const location = document.getElementById('editLocation').value;
  const position = document.getElementById('editPosition').value;

  window.electronAPI.updateCD({ id, album, artist, year, location, position })
    .then(() => {
        document.getElementById('editModal').style.display = 'none';
        window.location.reload();
    })
    .catch((error) => console.error('Error updating CD:', error));
});
  
document.getElementById('deleteCDButton').addEventListener('click', () => {
  const id = document.getElementById('editId').value;
  const confirmation = confirm('Are you sure you want to delete this CD?');
  if (!confirmation) return;
  window.electronAPI.deleteCD(id)
    .then(() => {
      document.getElementById('editModal').style.display = 'none';
      window.location.reload();
    })
    .catch((error) => console.error('Error deleting CD:', error));
});