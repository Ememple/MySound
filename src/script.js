const contentArea = document.getElementById('main-content');
const audio = document.getElementById('audio-player');
const playIcon = document.getElementById('play-icon');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');
const navLinks = document.querySelectorAll('.nav-link');
const progressBar = document.getElementById('progress-bar');
const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');
const volumeBar = document.getElementById('volume-bar');
const volumeIcon = document.getElementById('volume-icon');

const contextMenu = document.getElementById('playlist-context-menu');
const contextCreate = document.getElementById('context-create');
const contextRename = document.getElementById('context-rename');
const contextDelete = document.getElementById('context-delete');
let activeContextPlaylistId = null;

const songContextMenu = document.getElementById('song-context-menu');
const contextSongAdd = document.getElementById('context-song-add');
const contextSongRemove = document.getElementById('context-song-remove');
let rightClickedSongId = null;
let targetSongForPlaylist = null;
let currentViewedPlaylistId = null;

let songsArray = [];
let currentIndex = -1;
let favoriteIds = [];

audio.volume = 1;

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

async function loadFavoriteIds() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/songs/favorites');
        if (response.ok) {
            const favorites = await response.json();
            favoriteIds = favorites.map(song => song.id);
        }
    } catch (e) {
        console.error("Chyba při načítání oblíbených ID:", e);
    }
}

function updateVolumeIcon(vol) {
    if (!volumeIcon) return;
    if (vol === 0) {
        volumeIcon.innerText = 'volume_off';
    } else if (vol < 0.5) {
        volumeIcon.innerText = 'volume_down';
    } else {
        volumeIcon.innerText = 'volume_up';
    }
}

async function loadSidebarPlaylists() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/playlists');
        const playlists = await response.json();
        const sidebarList = document.getElementById('sidebar-playlists');
        if (!sidebarList) return;

        sidebarList.innerHTML = '';

        playlists.forEach(pl => {
            if (pl.id === 1) return;

            const li = document.createElement('li');
            li.className = 'nav-link';
            if (currentViewedPlaylistId === pl.id) li.classList.add('active');

            li.setAttribute('data-name', pl.name);
            li.innerHTML = `<span class="material-symbols-rounded">queue_music</span> ${pl.name}`;

            li.onclick = () => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                li.classList.add('active');

                contentArea.classList.add('fade-out');
                setTimeout(async () => {
                    await renderSpecificPlaylist(pl.id, pl.name);
                    contentArea.classList.remove('fade-out');
                }, 300);
            };

            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                activeContextPlaylistId = pl.id;

                if(contextCreate) contextCreate.style.display = 'none';
                if(contextRename) contextRename.style.display = 'flex';
                if(contextDelete) contextDelete.style.display = 'flex';

                if (contextMenu) {
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = `${e.pageX}px`;
                    contextMenu.style.top = `${e.pageY}px`;
                }
            });

            sidebarList.appendChild(li);
        });
    } catch (e) {
        console.error("Chyba při načítání menu playlistů:", e);
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll('#sidebar-playlists .nav-link').forEach(l => l.classList.remove('active'));

        this.classList.add('active');
        contentArea.classList.add('fade-out');
        setTimeout(async () => {
            if (page === 'playlist') {
                await renderPlaylist();
            } else if (page === 'favorites') {
                await renderFavorites();
            } else {
                renderHome();
            }
            contentArea.classList.remove('fade-out');
        }, 300);
    });
});

function renderHome() {
    currentViewedPlaylistId = null;
    contentArea.innerHTML = `
        <header class="home-intro" style="padding: 20px;">
            <h1 style="font-size: 40px; margin-bottom: 10px;">Vítejte v MySound</h1>
            <p style="color: #b3b3b3; font-size: 16px;">Váš osobní prostor pro hudbu, kde máte vše pod kontrolou.</p>
        </header>
    `;
}

async function renderPlaylist() {
    currentViewedPlaylistId = null;
    contentArea.innerHTML = `
        <h1>Všechny skladby</h1>
        <div id="song-list" class="song-list">Načítání skladeb...</div>
    `;
    await loadSongs('http://127.0.0.1:5000/api/songs');
}

async function renderFavorites() {
    currentViewedPlaylistId = 1;
    contentArea.innerHTML = `
        <h1>Oblíbené skladby</h1>
        <div id="song-list" class="song-list">Načítání oblíbených skladeb...</div>
    `;
    await loadSongs('http://127.0.0.1:5000/api/songs/favorites');
}

async function renderSpecificPlaylist(playlistId, playlistName) {
    currentViewedPlaylistId = playlistId;
    contentArea.innerHTML = `
        <h1>${playlistName}</h1>
        <div id="song-list" class="song-list">Načítání skladeb z playlistu...</div>
    `;
    await loadSongs(`http://127.0.0.1:5000/api/playlists/${playlistId}/songs`);
}

async function renderArtist(artistId, artistName) {
    currentViewedPlaylistId = null;

    contentArea.innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-top: 20px;">
            <div style="width: 150px; height: 150px; background: #282828; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                <span class="material-symbols-rounded" style="font-size: 80px; color: #b3b3b3;">person</span>
            </div>
            <div>
                <p style="margin: 0; text-transform: uppercase; font-size: 14px; letter-spacing: 2px; color: #b3b3b3;">Interpret</p>
                <h1 style="font-size: 60px; margin: 0; font-weight: 700;">${artistName}</h1>
            </div>
        </div>
        <h2>Oblíbené</h2> <div id="song-list" class="song-list" style="margin-top: 20px;">Načítání skladeb interpreta...</div>
    `;
    await loadArtistSongs(`http://127.0.0.1:5000/api/artists/${artistId}/songs`);
}
window.renderArtist = renderArtist;

async function loadSongs(apiUrl) {
    try {
        await loadFavoriteIds();
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Server neodpovídá');

        songsArray = await response.json();
        const songList = document.getElementById('song-list');
        if (!songList) return;

        songList.innerHTML = `
            <div class="song-list-header">
                <div class="song-index">#</div>
                <div>Název</div>
                <div>Album</div>
                <div>Datum přidání <span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle; color: #1db954;">arrow_drop_down</span></div>
                <div style="text-align: right;">Přehrání</div>
                <div style="text-align: right;"><span class="material-symbols-rounded" style="font-size: 18px; vertical-align: middle;">schedule</span></div>
            </div>
        `;

        if (songsArray.length === 0) {
            songList.innerHTML += '<p style="padding: 20px; color: #b3b3b3;">V tomto seznamu zatím nejsou žádné skladby.</p>';
            return;
        }

        songsArray.forEach((song, index) => {
            const div = document.createElement('div');
            div.className = 'song-item' + (songsArray[currentIndex]?.id === song.id ? ' active' : '');
            div.setAttribute('data-index', index);

            const durationId = `duration-${index}`;
            const albumName = song.album || "Neznámé album";
            const artistName = song.artist || "Neznámý interpret";
            const isFavorite = favoriteIds.includes(song.id);

            const dateAdded = (song.date_added && song.date_added !== "None" && song.date_added !== "null" && song.date_added !== "Neznámé")
                ? new Date(song.date_added).toLocaleDateString('cs-CZ')
                : "";

            div.innerHTML = `
                <div class="song-index">${index + 1}</div>
                <div class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist" 
                          onclick="event.stopPropagation(); renderArtist(${song.artist_id}, '${artistName}')" 
                          style="cursor: pointer;" 
                          onmouseover="this.style.textDecoration='underline'" 
                          onmouseout="this.style.textDecoration='none'">
                        ${artistName}
                    </span>
                </div>
                <div class="song-album">${albumName}</div>
                <div class="song-date">${dateAdded}</div>
                <div class="play-count" style="text-align: right; color: #b3b3b3;">${song.plays || '0'}</div>
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
                    <button class="add-to-playlist ${isFavorite ? 'is-added' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite(${song.id}, ${isFavorite})"
                            style="background: none; border: none; padding: 0; cursor: pointer;">
                        <span class="material-symbols-rounded" style="${isFavorite ? 'color:#1db954;' : 'color:#b3b3b3;'} font-size: 20px;">
                            ${isFavorite ? 'task_alt' : 'add_circle'}
                        </span>
                    </button>
                    <span id="${durationId}" class="duration" style="width: 35px; text-align: right;">${song.duration || '0'}</span>
                </div>
            `;

            div.onclick = () => playSong(index);

            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                rightClickedSongId = song.id;

                if (songContextMenu) {
                    songContextMenu.style.display = 'block';
                    songContextMenu.style.left = `${e.pageX}px`;
                    songContextMenu.style.top = `${e.pageY}px`;

                    if (currentViewedPlaylistId) {
                        contextSongRemove.style.display = 'flex';
                    } else {
                        contextSongRemove.style.display = 'none';
                    }
                }
            });

            songList.appendChild(div);

            if (!song.duration || song.duration === '--:--' || song.duration === '0:00' || song.duration === '0') {
                const tempAudio = new Audio(song.url);
                tempAudio.addEventListener('loadedmetadata', () => {
                    const durationSpan = document.getElementById(durationId);
                    if (durationSpan) durationSpan.innerText = formatTime(tempAudio.duration);
                });
            }
        });
    } catch (e) {
        console.error("Chyba při načítání skladeb:", e);
    }
}

async function loadArtistSongs(apiUrl) {
    try {
        await loadFavoriteIds();
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Server neodpovídá');

        songsArray = await response.json();
        const songList = document.getElementById('song-list');
        if (!songList) return;

        songList.innerHTML = '';

        if (songsArray.length === 0) {
            songList.innerHTML = '<p style="padding: 20px; color: #b3b3b3;">Interpret zatím nemá žádné skladby.</p>';
            return;
        }

        songsArray.forEach((song, index) => {
            const div = document.createElement('div');
            const isFavorite = favoriteIds.includes(song.id);
            const isActive = songsArray[currentIndex]?.id === song.id;

            div.className = 'artist-track-item' + (isActive ? ' active' : '');
            div.setAttribute('data-index', index);

            const durationId = `artist-duration-${index}`;
            const formattedPlays = Number(song.plays || 0).toLocaleString('cs-CZ');

            div.innerHTML = `
                <div class="track-index">${index + 1}</div>
                
                <div class="track-img-placeholder">
                    <span class="material-symbols-rounded" style="font-size: 20px; color: #b3b3b3;">music_note</span>
                </div>
                
                <div class="track-info">
                    <div class="track-title">${song.title}</div>
                </div>
                
                <div style="text-align: right; color: #b3b3b3; font-size: 14px;">
                    ${formattedPlays}
                </div>
                
                <div style="text-align: right;">
                    <button class="add-to-playlist ${isFavorite ? 'is-added' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite(${song.id}, ${isFavorite})"
                            style="background: none; border: none; padding: 0; cursor: pointer;">
                        <span class="material-symbols-rounded" style="${isFavorite ? 'color:#1db954;' : 'color:#b3b3b3;'} font-size: 18px;">
                            ${isFavorite ? 'check_circle' : 'add_circle'}
                        </span>
                    </button>
                </div>
                
                <div id="${durationId}" style="text-align: right; color: #b3b3b3; font-size: 14px;">
                    ${song.duration || '0'}
                </div>
            `;

            div.onclick = () => playSong(index);

            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                rightClickedSongId = song.id;
                if (songContextMenu) {
                    songContextMenu.style.display = 'block';
                    songContextMenu.style.left = `${e.pageX}px`;
                    songContextMenu.style.top = `${e.pageY}px`;
                    if (contextSongRemove) contextSongRemove.style.display = 'none';
                }
            });

            songList.appendChild(div);
            if (!song.duration || song.duration === '--:--' || song.duration === '0:00' || song.duration === '0') {
                const tempAudio = new Audio(song.url);
                tempAudio.addEventListener('loadedmetadata', () => {
                    const durationSpan = document.getElementById(durationId);
                    if (durationSpan) durationSpan.innerText = formatTime(tempAudio.duration);
                });
            }
        });
    } catch (e) {
        console.error("Chyba při načítání artist skladeb:", e);
    }
}
async function playSong(index) {
    if (index < 0 || index >= songsArray.length) return;
    currentIndex = index;
    const song = songsArray[currentIndex];
    audio.src = song.url;

    currentTitle.innerText = song.title;
    currentArtist.innerText = song.artist || "Neznámý interpret";

    if (song.artist_id) {
        currentArtist.style.cursor = 'pointer';
        currentArtist.onclick = () => {
            renderArtist(song.artist_id, song.artist);
        };
        currentArtist.onmouseover = () => currentArtist.style.textDecoration = 'underline';
        currentArtist.onmouseout = () => currentArtist.style.textDecoration = 'none';
    } else {
        currentArtist.style.cursor = 'default';
        currentArtist.onclick = null;
        currentArtist.onmouseover = null;
    }

    audio.play();
    playIcon.innerText = "pause";

    updateFooterIcon(song.id);

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/songs/${song.id}/play`, {
            method: 'POST'
        });
        if (response.ok) {
            song.plays = (parseInt(song.plays) || 0) + 1;
            const playsSpan = document.querySelector(`.song-item[data-index="${index}"] .play-count`);
            if (playsSpan) playsSpan.innerText = song.plays;
        }
    } catch (e) {
        console.error("Nepodařilo se aktualizovat poslechy:", e);
    }

    document.querySelectorAll('.song-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.song-item[data-index="${index}"]`);
    if (activeItem) activeItem.classList.add('active');
}

function updateFooterIcon(songId) {
    const footerBtn = document.getElementById('add-to-playlist-btn');
    if (!footerBtn) return;
    const isFavorite = favoriteIds.includes(songId);

    footerBtn.innerHTML = `
        <span class="material-symbols-rounded">
            ${isFavorite ? 'task_alt' : 'add_circle'}
        </span>
    `;

    if (isFavorite) {
        footerBtn.classList.add('is-added');
        footerBtn.style.color = "#1db954";
    } else {
        footerBtn.classList.remove('is-added');
        footerBtn.style.color = "#b3b3b3";
    }
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        if (progressBar) progressBar.value = progress;
        if (currentTimeDisplay) currentTimeDisplay.innerText = formatTime(audio.currentTime);
    }
});

if (progressBar) {
    progressBar.addEventListener('input', () => {
        const time = (progressBar.value / 100) * audio.duration;
        audio.currentTime = time;
    });
}

audio.addEventListener('loadedmetadata', () => {
    if (totalDurationDisplay) totalDurationDisplay.innerText = formatTime(audio.duration);
});

if (volumeBar) {
    volumeBar.addEventListener('input', () => {
        audio.volume = volumeBar.value / 100;
        updateVolumeIcon(audio.volume);
    });
}

document.getElementById('play-pause').addEventListener('click', () => {
    if (!audio.src) {
        if (songsArray.length > 0) playSong(0);
        return;
    }
    if (audio.paused) {
        audio.play();
        playIcon.innerText = "pause";
    } else {
        audio.pause();
        playIcon.innerText = "play_arrow";
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (songsArray.length === 0) return;
    let next = (currentIndex + 1) % songsArray.length;
    playSong(next);
});

document.getElementById('prev').addEventListener('click', () => {
    if (songsArray.length === 0) return;
    let prev = (currentIndex - 1 + songsArray.length) % songsArray.length;
    playSong(prev);
});

audio.onended = () => document.getElementById('next').click();

const modal = document.getElementById('playlist-modal');
const closeModal = document.querySelector('.close-modal');
const modalPlaylistList = document.getElementById('modal-playlist-list');
const addToPlaylistBtn = document.getElementById('add-to-playlist-btn');

if (addToPlaylistBtn) {
    addToPlaylistBtn.addEventListener('click', async () => {
        if (currentIndex === -1) {
            alert("Nejdříve si pusťte nějakou písničku!");
            return;
        }
        targetSongForPlaylist = songsArray[currentIndex].id;
        modal.style.display = "block";
        await loadPlaylistsForModal();
    });
}

if (closeModal) {
    closeModal.onclick = () => modal.style.display = "none";
}

window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
};

async function loadPlaylistsForModal() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/playlists');
        const playlists = await response.json();
        modalPlaylistList.innerHTML = '';
        playlists.forEach(pl => {
            const div = document.createElement('div');
            div.className = 'playlist-option';
            div.innerHTML = `<span class="material-symbols-rounded" style="vertical-align:middle; margin-right:10px;">playlist_play</span> ${pl.name}`;
            div.onclick = () => addSongToSpecificPlaylist(pl.id, pl.name);
            modalPlaylistList.appendChild(div);
        });
    } catch (e) {
        modalPlaylistList.innerHTML = '<p>Chyba při načítání playlistů.</p>';
    }
}

async function addSongToSpecificPlaylist(playlistId, playlistName) {
    if (!targetSongForPlaylist) return;
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/playlists/${playlistId}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song_id: targetSongForPlaylist })
        });
        if (response.ok) {
            alert(`Skladba přidána do "${playlistName}"`);
            modal.style.display = "none";

            await loadFavoriteIds();
            if (currentIndex !== -1 && songsArray[currentIndex].id === targetSongForPlaylist) {
                updateFooterIcon(targetSongForPlaylist);
            }

            const activeLink = document.querySelector('.nav-link.active');
            if (activeLink) {
                const currentPage = activeLink.getAttribute('data-page');
                if (currentPage === 'playlist') renderPlaylist();
                else if (currentPage === 'favorites') renderFavorites();
                else if (currentPage === null && activeContextPlaylistId) {
                    renderSpecificPlaylist(activeContextPlaylistId, activeLink.getAttribute('data-name'));
                }
            }
        }
    } catch (e) {
        alert("Chyba při komunikaci se serverem.");
    }
}

async function toggleFavorite(songId, isCurrentlyFavorite) {
    const endpoint = isCurrentlyFavorite ? 'remove' : 'add';

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/playlists/1/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song_id: songId })
        });

        if (response.ok) {
            await loadFavoriteIds();

            const activeLink = document.querySelector('.nav-link.active');
            if (activeLink) {
                const currentPage = activeLink.getAttribute('data-page');
                if (currentPage === 'playlist') renderPlaylist();
                else if (currentPage === 'favorites') renderFavorites();
            }

            if (currentIndex !== -1 && songsArray[currentIndex].id === songId) {
                updateFooterIcon(songId);
            }
        }
    } catch (e) {
        console.error("Chyba při úpravě playlistu:", e);
    }
}
window.toggleFavorite = toggleFavorite;

document.addEventListener('click', () => {
    if (contextMenu) contextMenu.style.display = 'none';
    if (songContextMenu) songContextMenu.style.display = 'none';
});

const sidebar = document.querySelector('.sidebar');
if (sidebar) {
    sidebar.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        if (e.target.closest('#sidebar-playlists .nav-link')) return;

        activeContextPlaylistId = null;

        if(contextCreate) contextCreate.style.display = 'flex';
        if(contextRename) contextRename.style.display = 'none';
        if(contextDelete) contextDelete.style.display = 'none';

        if (contextMenu) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
        }
    });
}

async function handleCreatePlaylist() {
    const name = prompt("Zadejte název nového playlistu:");
    if (!name) return;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        if (response.ok) {
            await loadSidebarPlaylists();
        }
    } catch (e) {
        console.error("Chyba při vytváření playlistu", e);
    }
}

const btnCreateNew = document.getElementById('btn-create-new');
if (btnCreateNew) btnCreateNew.onclick = handleCreatePlaylist;
if (contextCreate) contextCreate.onclick = handleCreatePlaylist;

if (contextRename) {
    contextRename.onclick = async () => {
        if (!activeContextPlaylistId) return;
        const newName = prompt("Zadejte nový název playlistu:");
        if (!newName) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/playlists/${activeContextPlaylistId}/rename`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                await loadSidebarPlaylists();

                if (currentViewedPlaylistId === activeContextPlaylistId) {
                    renderSpecificPlaylist(currentViewedPlaylistId, newName);
                }
            }
        } catch (e) { console.error(e); }
    };
}

if (contextDelete) {
    contextDelete.onclick = async () => {
        if (!activeContextPlaylistId) return;
        if (!confirm("Opravdu chcete tento playlist smazat? Písničky v něm zůstanou zachovány v hlavní knihovně.")) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/playlists/${activeContextPlaylistId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await loadSidebarPlaylists();
                renderHome();
            }
        } catch (e) { console.error(e); }
    };
}

if (contextSongAdd) {
    contextSongAdd.onclick = async () => {
        if (!rightClickedSongId) return;
        targetSongForPlaylist = rightClickedSongId;
        const modal = document.getElementById('playlist-modal');
        if (modal) modal.style.display = "block";
        await loadPlaylistsForModal();
    };
}

if (contextSongRemove) {
    contextSongRemove.onclick = async () => {
        if (!rightClickedSongId || !currentViewedPlaylistId) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/playlists/${currentViewedPlaylistId}/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ song_id: rightClickedSongId })
            });
            if (response.ok) {
                if (currentViewedPlaylistId === 1) {
                    await loadFavoriteIds();
                    renderFavorites();
                    if (currentIndex !== -1 && songsArray[currentIndex].id === rightClickedSongId) {
                        updateFooterIcon(rightClickedSongId);
                    }
                } else {
                    const activeLink = document.querySelector('.nav-link.active');
                    renderSpecificPlaylist(currentViewedPlaylistId, activeLink ? activeLink.getAttribute('data-name') : "Playlist");
                }
            }
        } catch (e) {
            console.error("Chyba při odebírání skladby", e);
        }
    };
}

loadSidebarPlaylists();
renderHome();