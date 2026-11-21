const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'agendas.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load agendas data
function loadData() {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading agendas.json:', error);
    return { event: {}, tracks: [], speakers: [], sessions: [] };
  }
}

// Helper to enrich sessions with speaker details
function getEnrichedSessions(data) {
  const speakerMap = new Map();
  (data.speakers || []).forEach(speaker => {
    speakerMap.set(speaker.id, speaker);
  });

  return (data.sessions || []).map(session => {
    const speaker = session.speakerId ? speakerMap.get(session.speakerId) || null : null;
    return {
      ...session,
      speaker
    };
  });
}

// API Routes

/**
 * GET /api/event
 * Get general event metadata, summary, and statistics
 */
app.get('/api/event', (req, res) => {
  const data = loadData();
  const sessions = data.sessions || [];
  const speakers = data.speakers || [];
  const tracks = data.tracks || [];

  res.json({
    ...data.event,
    stats: {
      totalSessions: sessions.length,
      totalSpeakers: speakers.length,
      totalTracks: tracks.length
    }
  });
});

/**
 * GET /api/tracks
 * Get list of all event tracks/stages
 */
app.get('/api/tracks', (req, res) => {
  const data = loadData();
  res.json(data.tracks || []);
});

/**
 * GET /api/speakers
 * Get list of all speakers, enriched with their scheduled sessions
 */
app.get('/api/speakers', (req, res) => {
  const data = loadData();
  const speakers = data.speakers || [];
  const sessions = data.sessions || [];

  const enrichedSpeakers = speakers.map(speaker => {
    const speakerSessions = sessions
      .filter(s => s.speakerId === speaker.id)
      .map(({ id, title, startTime, endTime, trackName, room, level }) => ({
        id,
        title,
        startTime,
        endTime,
        trackName,
        room,
        level
      }));

    return {
      ...speaker,
      sessions: speakerSessions
    };
  });

  res.json(enrichedSpeakers);
});

/**
 * GET /api/speakers/:id
 * Get single speaker by ID
 */
app.get('/api/speakers/:id', (req, res) => {
  const data = loadData();
  const speaker = (data.speakers || []).find(s => s.id === req.params.id);

  if (!speaker) {
    return res.status(404).json({ error: 'Speaker not found' });
  }

  const sessions = (data.sessions || [])
    .filter(s => s.speakerId === speaker.id)
    .map(({ id, title, startTime, endTime, trackName, room, level, description }) => ({
      id,
      title,
      startTime,
      endTime,
      trackName,
      room,
      level,
      description
    }));

  res.json({
    ...speaker,
    sessions
  });
});

/**
 * GET /api/schedule
 * Get all sessions with speaker details and optional filtering
 * Query params:
 *   - track: filter by trackId (e.g., 'riat')
 *   - speaker: filter by speakerId
 *   - level: filter by level (e.g., 'Intermediate')
 *   - tag: filter by specific tag
 *   - search: search across title, description, speaker name, and tags
 */
app.get('/api/schedule', (req, res) => {
  const data = loadData();
  let sessions = getEnrichedSessions(data);

  const { track, speaker, level, tag, search } = req.query;

  // Filter by track ID
  if (track && track.toLowerCase() !== 'all') {
    sessions = sessions.filter(s => s.trackId && s.trackId.toLowerCase() === track.toLowerCase());
  }

  // Filter by speaker ID
  if (speaker) {
    sessions = sessions.filter(s => s.speakerId === speaker);
  }

  // Filter by level
  if (level && level.toLowerCase() !== 'all') {
    sessions = sessions.filter(s => s.level && s.level.toLowerCase() === level.toLowerCase());
  }

  // Filter by tag
  if (tag) {
    sessions = sessions.filter(s => s.tags && s.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
  }

  // Search filter
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    sessions = sessions.filter(s => {
      const matchTitle = s.title && s.title.toLowerCase().includes(q);
      const matchDesc = s.description && s.description.toLowerCase().includes(q);
      const matchSpeaker = s.speaker && (
        s.speaker.name.toLowerCase().includes(q) ||
        (s.speaker.company && s.speaker.company.toLowerCase().includes(q))
      );
      const matchTags = s.tags && s.tags.some(t => t.toLowerCase().includes(q));
      const matchRoom = s.room && s.room.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchSpeaker || matchTags || matchRoom;
    });
  }

  res.json(sessions);
});

/**
 * GET /api/schedule/:id
 * Get single session by ID
 */
app.get('/api/schedule/:id', (req, res) => {
  const data = loadData();
  const sessions = getEnrichedSessions(data);
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` DevFest Kisumu 2026 Schedule App is running!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
