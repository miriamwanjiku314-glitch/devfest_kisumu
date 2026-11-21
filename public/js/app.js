// DevFest Kisumu 2026 - Client App

(function () {
  'use strict';

  // State
  let eventData = null;
  let tracks = [];
  let sessions = [];
  let speakers = [];
  let activeTab = 'schedule';
  let activeTrack = 'all';
  let activeLevel = 'all';
  let searchQuery = '';
  let speakerSearchQuery = '';
  let activeTag = null;
  let currentModalSession = null;

  // Bookmarks loaded from LocalStorage
  const STORAGE_KEY = 'devfest_kisumu_2026_bookmarks';
  const THEME_KEY = 'devfest_kisumu_theme';
  let bookmarkedIds = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

  // Track colors fallback
  const trackColorMap = {
    victoria: '#4285F4',
    riat: '#EA4335',
    dunga: '#34A853',
    kavirondo: '#FBBC04'
  };

  // DOM Elements
  const el = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    // Nav
    navTabs: document.querySelectorAll('.nav-tab'),
    bookmarkCount: document.getElementById('bookmarkCount'),
    // Views
    scheduleTabView: document.getElementById('scheduleTabView'),
    speakersTabView: document.getElementById('speakersTabView'),
    bookmarksTabView: document.getElementById('bookmarksTabView'),
    // Hero Meta
    eventOrganizer: document.getElementById('eventOrganizer'),
    eventTheme: document.getElementById('eventTheme'),
    eventDisplayDate: document.getElementById('eventDisplayDate'),
    eventLocation: document.getElementById('eventLocation'),
    statSessions: document.getElementById('statSessions'),
    statSpeakers: document.getElementById('statSpeakers'),
    statTracks: document.getElementById('statTracks'),
    // Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    levelFilter: document.getElementById('levelFilter'),
    trackPillsContainer: document.getElementById('trackPillsContainer'),
    activeFilterBanner: document.getElementById('activeFilterBanner'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    // Containers
    scheduleTimeline: document.getElementById('scheduleTimeline'),
    speakersGrid: document.getElementById('speakersGrid'),
    speakerSearchInput: document.getElementById('speakerSearchInput'),
    bookmarkedSessionsContainer: document.getElementById('bookmarkedSessionsContainer'),
    bookmarkActionsBar: document.getElementById('bookmarkActionsBar'),
    savedCountLabel: document.getElementById('savedCountLabel'),
    printScheduleBtn: document.getElementById('printScheduleBtn'),
    clearAllBookmarksBtn: document.getElementById('clearAllBookmarksBtn'),
    // Modal
    sessionModal: document.getElementById('sessionModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalTrack: document.getElementById('modalTrack'),
    modalLevel: document.getElementById('modalLevel'),
    modalTitle: document.getElementById('modalTitle'),
    modalTime: document.getElementById('modalTime'),
    modalRoom: document.getElementById('modalRoom'),
    modalDescription: document.getElementById('modalDescription'),
    modalTags: document.getElementById('modalTags'),
    modalSpeakerSection: document.getElementById('modalSpeakerSection'),
    modalSpeakerAvatar: document.getElementById('modalSpeakerAvatar'),
    modalSpeakerName: document.getElementById('modalSpeakerName'),
    modalSpeakerRole: document.getElementById('modalSpeakerRole'),
    modalSpeakerBio: document.getElementById('modalSpeakerBio'),
    modalSpeakerSocials: document.getElementById('modalSpeakerSocials'),
    modalBookmarkBtn: document.getElementById('modalBookmarkBtn'),
    modalCalendarBtn: document.getElementById('modalCalendarBtn'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Init Application
  async function init() {
    initTheme();
    setupEventListeners();
    updateBookmarkBadge();

    try {
      await Promise.all([fetchEventData(), fetchTracks(), fetchSchedule(), fetchSpeakers()]);
      renderTrackPills();
      renderSchedule();
      renderSpeakers();
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Could not load event data from server.', 'error');
    }
  }

  // Fetch API helpers
  async function fetchEventData() {
    try {
      const res = await fetch('/api/event');
      if (!res.ok) throw new Error('Failed to fetch event data');
      eventData = await res.json();

      if (eventData) {
        if (eventData.organizer) el.eventOrganizer.textContent = eventData.organizer;
        if (eventData.theme) el.eventTheme.textContent = eventData.theme;
        if (eventData.displayDate) el.eventDisplayDate.textContent = eventData.displayDate;
        if (eventData.location) el.eventLocation.textContent = eventData.location;

        if (eventData.stats) {
          el.statSessions.textContent = eventData.stats.totalSessions;
          el.statSpeakers.textContent = eventData.stats.totalSpeakers;
          el.statTracks.textContent = eventData.stats.totalTracks;
        }
      }
    } catch (e) {
      console.warn('API /api/event fallback error', e);
    }
  }

  async function fetchTracks() {
    try {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      tracks = await res.json();
    } catch (e) {
      console.warn('API /api/tracks fallback', e);
    }
  }

  async function fetchSchedule() {
    try {
      const res = await fetch('/api/schedule');
      if (!res.ok) throw new Error('Failed to fetch schedule');
      sessions = await res.json();
    } catch (e) {
      console.warn('API /api/schedule fallback', e);
    }
  }

  async function fetchSpeakers() {
    try {
      const res = await fetch('/api/speakers');
      if (!res.ok) throw new Error('Failed to fetch speakers');
      speakers = await res.json();
    } catch (e) {
      console.warn('API /api/speakers fallback', e);
    }
  }

  // Setup Event Handlers
  function setupEventListeners() {
    // Nav tabs
    el.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        switchTab(tabName);
      });
    });

    // Theme Toggle
    el.themeToggle.addEventListener('click', toggleTheme);

    // Search Schedule
    el.searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      el.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderSchedule();
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      searchQuery = '';
      el.clearSearchBtn.style.display = 'none';
      renderSchedule();
    });

    // Level Filter
    el.levelFilter.addEventListener('change', e => {
      activeLevel = e.target.value;
      renderSchedule();
    });

    // Reset Filters
    el.resetFiltersBtn.addEventListener('click', () => {
      activeTrack = 'all';
      activeLevel = 'all';
      searchQuery = '';
      activeTag = null;
      el.searchInput.value = '';
      el.clearSearchBtn.style.display = 'none';
      el.levelFilter.value = 'all';

      // Update pills UI
      document.querySelectorAll('.track-pill').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-track') === 'all');
      });

      renderSchedule();
    });

    // Speaker search
    el.speakerSearchInput.addEventListener('input', e => {
      speakerSearchQuery = e.target.value.toLowerCase().trim();
      renderSpeakers();
    });

    // Modal close
    el.modalCloseBtn.addEventListener('click', closeModal);
    el.sessionModal.addEventListener('click', e => {
      if (e.target === el.sessionModal) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el.sessionModal.style.display === 'flex') {
        closeModal();
      }
    });

    // Bookmark toggle inside Modal
    el.modalBookmarkBtn.addEventListener('click', () => {
      if (currentModalSession) {
        toggleBookmark(currentModalSession.id);
        updateModalBookmarkBtn(currentModalSession.id);
      }
    });

    // Calendar export
    el.modalCalendarBtn.addEventListener('click', () => {
      if (currentModalSession) {
        exportToICS(currentModalSession);
      }
    });

    // Bookmarks Tab actions
    el.clearAllBookmarksBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your saved agenda?')) {
        bookmarkedIds.clear();
        saveBookmarks();
        updateBookmarkBadge();
        renderBookmarks();
        renderSchedule();
        showToast('Agenda cleared.', 'info');
      }
    });

    el.printScheduleBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Switch Tab
  function switchTab(tabName) {
    activeTab = tabName;

    el.navTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });

    el.scheduleTabView.classList.toggle('active', tabName === 'schedule');
    el.speakersTabView.classList.toggle('active', tabName === 'speakers');
    el.bookmarksTabView.classList.toggle('active', tabName === 'bookmarks');

    if (tabName === 'bookmarks') {
      renderBookmarks();
    } else if (tabName === 'speakers') {
      renderSpeakers();
    } else if (tabName === 'schedule') {
      renderSchedule();
    }

    window.scrollTo({ top: 380, behavior: 'smooth' });
  }

  // Theme Handling
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      el.themeIcon.className = 'fa-regular fa-sun';
      el.themeToggle.setAttribute('title', 'Switch to light mode');
    } else {
      el.themeIcon.className = 'fa-regular fa-moon';
      el.themeToggle.setAttribute('title', 'Switch to dark mode');
    }
  }

  // Render Track Pills
  function renderTrackPills() {
    if (!tracks || tracks.length === 0) return;

    let html = `<button class="track-pill ${activeTrack === 'all' ? 'active' : ''}" data-track="all">All Tracks</button>`;

    tracks.forEach(track => {
      const color = track.color || trackColorMap[track.id] || '#4285F4';
      const isActive = activeTrack === track.id ? 'active' : '';
      html += `
        <button class="track-pill ${isActive}" data-track="${track.id}">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>
          ${escapeHtml(track.name)}
        </button>
      `;
    });

    el.trackPillsContainer.innerHTML = html;

    // Attach listeners
    el.trackPillsContainer.querySelectorAll('.track-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        el.trackPillsContainer.querySelectorAll('.track-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeTrack = pill.getAttribute('data-track');
        renderSchedule();
      });
    });
  }

  // Filter Schedule Sessions
  function getFilteredSessions() {
    let list = [...sessions];

    // Filter track
    if (activeTrack && activeTrack !== 'all') {
      list = list.filter(s => s.trackId && s.trackId.toLowerCase() === activeTrack.toLowerCase());
    }

    // Filter level
    if (activeLevel && activeLevel !== 'all') {
      list = list.filter(s => s.level && s.level.toLowerCase() === activeLevel.toLowerCase());
    }

    // Filter tag
    if (activeTag) {
      list = list.filter(s => s.tags && s.tags.includes(activeTag));
    }

    // Filter search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => {
        const titleMatch = s.title && s.title.toLowerCase().includes(q);
        const descMatch = s.description && s.description.toLowerCase().includes(q);
        const speakerMatch = s.speaker && (
          s.speaker.name.toLowerCase().includes(q) ||
          (s.speaker.company && s.speaker.company.toLowerCase().includes(q))
        );
        const tagMatch = s.tags && s.tags.some(t => t.toLowerCase().includes(q));
        const roomMatch = s.room && s.room.toLowerCase().includes(q);

        return titleMatch || descMatch || speakerMatch || tagMatch || roomMatch;
      });
    }

    return list;
  }

  // Render Schedule Timeline
  function renderSchedule() {
    const filtered = getFilteredSessions();
    const hasFilter = (activeTrack !== 'all' || activeLevel !== 'all' || searchQuery.trim() !== '' || activeTag !== null);
    el.activeFilterBanner.style.display = hasFilter ? 'flex' : 'none';

    if (filtered.length === 0) {
      el.scheduleTimeline.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3 class="empty-title">No sessions found</h3>
          <p class="empty-desc">Try clearing your search query or selecting a different track or difficulty level.</p>
          <button class="btn-primary" onclick="document.getElementById('resetFiltersBtn').click()">
            <i class="fa-solid fa-rotate-left"></i> Reset All Filters
          </button>
        </div>
      `;
      return;
    }

    // Group by time slots (startTime - endTime)
    const timeSlotsMap = new Map();
    filtered.forEach(session => {
      const slotKey = `${session.startTime} - ${session.endTime}`;
      if (!timeSlotsMap.has(slotKey)) {
        timeSlotsMap.set(slotKey, {
          startTime: session.startTime,
          endTime: session.endTime,
          sessions: []
        });
      }
      timeSlotsMap.get(slotKey).sessions.push(session);
    });

    let html = '';
    timeSlotsMap.forEach(slot => {
      html += `
        <div class="timeline-slot">
          <div class="time-header">
            <div class="time-badge">
              <i class="fa-regular fa-clock"></i>
              <span>${slot.startTime} – ${slot.endTime}</span>
            </div>
            <div class="time-divider"></div>
          </div>
          <div class="sessions-grid-in-slot">
            ${slot.sessions.map(s => createSessionCardHtml(s)).join('')}
          </div>
        </div>
      `;
    });

    el.scheduleTimeline.innerHTML = html;
    attachSessionCardListeners(el.scheduleTimeline);
  }

  // Build Session Card HTML
  function createSessionCardHtml(s) {
    const isBookmarked = bookmarkedIds.has(s.id);
    const trackColor = trackColorMap[s.trackId] || '#4285F4';
    const isBreak = s.isBreak || false;

    let speakerBlock = '';
    if (s.speaker) {
      speakerBlock = `
        <div class="speaker-pill">
          <img class="speaker-avatar-sm" src="${escapeHtml(s.speaker.avatar)}" alt="${escapeHtml(s.speaker.name)}" loading="lazy">
          <div class="speaker-pill-info">
            <span class="speaker-pill-name">${escapeHtml(s.speaker.name)}</span>
            <span class="speaker-pill-role">${escapeHtml(s.speaker.role)} • ${escapeHtml(s.speaker.company)}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="session-card ${isBreak ? 'is-break' : ''}" data-session-id="${s.id}">
        <div class="card-top-row">
          <span class="track-tag" style="background:${trackColor}18; color:${trackColor}; border:1px solid ${trackColor}40;">
            ${escapeHtml(s.trackName || 'Main Stage')}
          </span>
          <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-action="bookmark" data-session-id="${s.id}" title="${isBookmarked ? 'Remove from My Agenda' : 'Save to My Agenda'}">
            <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
          </button>
        </div>

        <h3 class="session-title">${escapeHtml(s.title)}</h3>
        <p class="session-desc">${escapeHtml(s.description || '')}</p>

        ${speakerBlock}

        <div class="card-footer">
          <div class="footer-meta-item">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(s.room || 'Victoria Auditorium')}</span>
          </div>
          <div class="footer-meta-item">
            <span class="level-badge">${escapeHtml(s.level || 'All Levels')}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Attach Listeners to Session Cards
  function attachSessionCardListeners(container) {
    container.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', e => {
        const bookmarkBtn = e.target.closest('[data-action="bookmark"]');
        const sessionId = card.getAttribute('data-session-id');

        if (bookmarkBtn) {
          e.stopPropagation();
          toggleBookmark(sessionId);
          return;
        }

        // Open details modal
        openSessionModal(sessionId);
      });
    });
  }

  // Render Speakers Directory
  function renderSpeakers() {
    let filteredSpeakers = [...speakers];

    if (speakerSearchQuery) {
      filteredSpeakers = filteredSpeakers.filter(sp => {
        return (
          sp.name.toLowerCase().includes(speakerSearchQuery) ||
          sp.role.toLowerCase().includes(speakerSearchQuery) ||
          sp.company.toLowerCase().includes(speakerSearchQuery) ||
          (sp.bio && sp.bio.toLowerCase().includes(speakerSearchQuery))
        );
      });
    }

    if (filteredSpeakers.length === 0) {
      el.speakersGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon"><i class="fa-solid fa-microphone-slash"></i></div>
          <h3 class="empty-title">No speakers found</h3>
          <p class="empty-desc">No speakers matched "${escapeHtml(speakerSearchQuery)}".</p>
        </div>
      `;
      return;
    }

    const html = filteredSpeakers.map(sp => {
      const sessionsList = (sp.sessions || []).map(sess => `
        <div class="speaker-session-item" data-session-id="${sess.id}">
          <i class="fa-regular fa-calendar-check" style="color:var(--accent-color)"></i>
          <span>${escapeHtml(sess.title)}</span>
        </div>
      `).join('');

      return `
        <div class="speaker-card">
          <div class="speaker-photo-wrap">
            <img class="speaker-photo" src="${escapeHtml(sp.avatar)}" alt="${escapeHtml(sp.name)}" loading="lazy">
          </div>
          <h3 class="speaker-card-name">${escapeHtml(sp.name)}</h3>
          <p class="speaker-card-role">${escapeHtml(sp.role)}</p>
          <p class="speaker-card-company">${escapeHtml(sp.company)}</p>
          <p class="speaker-card-bio">${escapeHtml(sp.bio || '')}</p>

          <div class="speaker-socials">
            ${sp.twitter ? `<a href="${escapeHtml(sp.twitter)}" target="_blank" rel="noopener" class="social-link" title="Twitter / X"><i class="fa-brands fa-x-twitter"></i></a>` : ''}
            ${sp.linkedin ? `<a href="${escapeHtml(sp.linkedin)}" target="_blank" rel="noopener" class="social-link" title="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>` : ''}
            ${sp.github ? `<a href="${escapeHtml(sp.github)}" target="_blank" rel="noopener" class="social-link" title="GitHub"><i class="fa-brands fa-github"></i></a>` : ''}
          </div>

          ${(sp.sessions && sp.sessions.length > 0) ? `
            <div class="speaker-sessions-list">
              <div class="speaker-sessions-label">Sessions</div>
              ${sessionsList}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    el.speakersGrid.innerHTML = html;

    // Attach click to sessions inside speaker card
    el.speakersGrid.querySelectorAll('.speaker-session-item').forEach(item => {
      item.addEventListener('click', e => {
        const id = item.getAttribute('data-session-id');
        openSessionModal(id);
      });
    });
  }

  // Render Bookmarked Schedule
  function renderBookmarks() {
    const savedSessions = sessions.filter(s => bookmarkedIds.has(s.id));

    if (savedSessions.length === 0) {
      el.bookmarkActionsBar.style.display = 'none';
      el.bookmarkedSessionsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-regular fa-star"></i></div>
          <h3 class="empty-title">Your schedule is empty</h3>
          <p class="empty-desc">Click the bookmark icon on any session card in the schedule to build your personalized DevFest Kisumu agenda.</p>
          <button class="btn-primary" onclick="document.querySelector('[data-tab=\\'schedule\\']').click()">
            <i class="fa-regular fa-calendar-days"></i> Explore Schedule
          </button>
        </div>
      `;
      return;
    }

    el.bookmarkActionsBar.style.display = 'flex';
    el.savedCountLabel.textContent = `${savedSessions.length} session${savedSessions.length > 1 ? 's' : ''} saved in your itinerary`;

    // Sort by startTime
    savedSessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const html = `
      <div class="sessions-grid-in-slot">
        ${savedSessions.map(s => createSessionCardHtml(s)).join('')}
      </div>
    `;

    el.bookmarkedSessionsContainer.innerHTML = html;
    attachSessionCardListeners(el.bookmarkedSessionsContainer);
  }

  // Toggle Bookmark
  function toggleBookmark(sessionId) {
    if (bookmarkedIds.has(sessionId)) {
      bookmarkedIds.delete(sessionId);
      showToast('Removed from My Agenda', 'info');
    } else {
      bookmarkedIds.add(sessionId);
      showToast('Added to My Agenda!', 'success');
    }

    saveBookmarks();
    updateBookmarkBadge();

    // Update UI on cards
    document.querySelectorAll(`.bookmark-btn[data-session-id="${sessionId}"]`).forEach(btn => {
      const has = bookmarkedIds.has(sessionId);
      btn.classList.toggle('bookmarked', has);
      btn.querySelector('i').className = has ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
    });

    if (activeTab === 'bookmarks') {
      renderBookmarks();
    }
  }

  function saveBookmarks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarkedIds)));
  }

  function updateBookmarkBadge() {
    const count = bookmarkedIds.size;
    el.bookmarkCount.textContent = count;
    el.bookmarkCount.style.display = count > 0 ? 'inline-block' : 'none';
  }

  // Session Modal Handling
  function openSessionModal(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    currentModalSession = session;
    const trackColor = trackColorMap[session.trackId] || '#4285F4';

    el.modalTrack.textContent = session.trackName || 'Main Stage';
    el.modalTrack.style.background = `${trackColor}20`;
    el.modalTrack.style.color = trackColor;
    el.modalTrack.style.border = `1px solid ${trackColor}60`;

    el.modalLevel.textContent = session.level || 'All Levels';
    el.modalLevel.style.background = 'var(--bg-card)';
    el.modalLevel.style.color = 'var(--text-secondary)';
    el.modalLevel.style.border = '1px solid var(--border-color)';

    el.modalTitle.textContent = session.title;
    el.modalTime.textContent = `${session.startTime} – ${session.endTime} (${session.duration || '60 min'})`;
    el.modalRoom.textContent = session.room || 'Victoria Auditorium';
    el.modalDescription.textContent = session.description || 'No detailed description available.';

    // Tags
    if (session.tags && session.tags.length > 0) {
      el.modalTags.innerHTML = session.tags.map(t => `<span class="tag-badge">#${escapeHtml(t)}</span>`).join('');
      el.modalTags.style.display = 'flex';
    } else {
      el.modalTags.style.display = 'none';
    }

    // Speaker Section
    if (session.speaker) {
      el.modalSpeakerSection.style.display = 'block';
      el.modalSpeakerAvatar.src = session.speaker.avatar;
      el.modalSpeakerName.textContent = session.speaker.name;
      el.modalSpeakerRole.textContent = `${session.speaker.role} • ${session.speaker.company}`;
      el.modalSpeakerBio.textContent = session.speaker.bio || '';

      let socialsHtml = '';
      if (session.speaker.twitter) {
        socialsHtml += `<a href="${escapeHtml(session.speaker.twitter)}" target="_blank" rel="noopener" class="social-link"><i class="fa-brands fa-x-twitter"></i></a>`;
      }
      if (session.speaker.linkedin) {
        socialsHtml += `<a href="${escapeHtml(session.speaker.linkedin)}" target="_blank" rel="noopener" class="social-link"><i class="fa-brands fa-linkedin-in"></i></a>`;
      }
      if (session.speaker.github) {
        socialsHtml += `<a href="${escapeHtml(session.speaker.github)}" target="_blank" rel="noopener" class="social-link"><i class="fa-brands fa-github"></i></a>`;
      }
      el.modalSpeakerSocials.innerHTML = socialsHtml;
    } else {
      el.modalSpeakerSection.style.display = 'none';
    }

    updateModalBookmarkBtn(session.id);
    el.sessionModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function updateModalBookmarkBtn(sessionId) {
    const isBookmarked = bookmarkedIds.has(sessionId);
    if (isBookmarked) {
      el.modalBookmarkBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> In Your Agenda (Click to Remove)';
      el.modalBookmarkBtn.style.background = 'var(--google-green)';
      el.modalBookmarkBtn.style.color = '#fff';
    } else {
      el.modalBookmarkBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Add to My Agenda';
      el.modalBookmarkBtn.style.background = 'var(--google-yellow)';
      el.modalBookmarkBtn.style.color = '#171b26';
    }
  }

  function closeModal() {
    el.sessionModal.style.display = 'none';
    document.body.style.overflow = '';
    currentModalSession = null;
  }

  // Export session to .ics file
  function exportToICS(session) {
    const dateStr = '20261121'; // 2026-11-21
    const startHour = session.startTime.replace(':', '');
    const endHour = session.endTime.replace(':', '');

    const dtStart = `${dateStr}T${startHour}00`;
    const dtEnd = `${dateStr}T${endHour}00`;

    const cleanTitle = (session.title || 'DevFest Session').replace(/[,;]/g, ' ');
    const cleanDesc = (session.description || '').replace(/\n/g, '\\n').replace(/[,;]/g, ' ');
    const location = `Lake Basin Convention Centre, ${session.room || 'Kisumu, Kenya'}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GDG Kisumu//DevFest Kisumu 2026//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${session.id}-devfest-kisumu-2026@gdgkisumu.org`,
      `DTSTAMP:${dateStr}T000000Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${session.id}-devfest-kisumu.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded .ics calendar file!', 'success');
  }

  // Toast Helper
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'fa-circle-info';
    let borderColor = 'var(--accent-color)';
    if (type === 'success') {
      icon = 'fa-circle-check';
      borderColor = 'var(--google-green)';
    } else if (type === 'error') {
      icon = 'fa-triangle-exclamation';
      borderColor = 'var(--google-red)';
    }

    toast.style.borderLeftColor = borderColor;
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${borderColor}"></i> <span>${escapeHtml(message)}</span>`;

    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Utility to prevent XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start on load
  document.addEventListener('DOMContentLoaded', init);
})();
