// Bluey Alpha 41 — Relationship Memory V1
// Lightweight, local-first relationship memory for playful world interactions.
(function () {
  'use strict';

  const STORAGE_KEY = 'bluey.relationship.v1';
  const DAY = 24 * 60 * 60 * 1000;

  const objectProfiles = {
    welcome: {
      name: 'Welcome Mat',
      achievement: 'Welcome Mat Enthusiast',
      unlockAt: 6,
      callbacks: [
        "Uh-oh. My welcome mat’s biggest fan is back. 😄",
        "I knew you’d come back to the welcome mat.",
        "The welcome mat remembers you. I’m not sure whether to be impressed or concerned. 😄"
      ]
    },
    idea: {
      name: 'Idea Lamp',
      achievement: 'Bright Idea Regular',
      unlockAt: 6,
      callbacks: [
        "Back to the idea lamp? Okay, something is definitely brewing.",
        "The idea lamp knows that look. What are we inventing this time?",
        "You and this lamp are becoming a dangerous combination. 😄"
      ]
    },
    marbles: {
      name: 'Marble Jar',
      achievement: 'Marble Collector',
      unlockAt: 6,
      callbacks: [
        "The marbles were wondering when you’d be back.",
        "Another marble inspection? You’re getting predictable. 😄",
        "At this point I may have to let you name one of these marbles."
      ]
    }
  };

  function emptyMemory() {
    return {
      version: 1,
      createdAt: Date.now(),
      lastSeenAt: null,
      visits: 0,
      objects: {},
      achievements: {}
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyMemory();
      const parsed = JSON.parse(raw);
      return Object.assign(emptyMemory(), parsed, {
        objects: parsed.objects || {},
        achievements: parsed.achievements || {}
      });
    } catch (_) {
      return emptyMemory();
    }
  }

  let memory = load();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch (_) {}
  }

  function beginVisit() {
    const now = Date.now();
    const previous = memory.lastSeenAt;
    // Count a new visit after 30 minutes away so refreshes don't inflate familiarity.
    if (!previous || now - previous > 30 * 60 * 1000) memory.visits += 1;
    memory.lastSeenAt = now;
    save();
  }

  function canonicalObjectId(id) {
    const value = String(id || '').toLowerCase();
    if (value.includes('welcome') || value.includes('mat')) return 'welcome';
    if (value.includes('idea') || value.includes('lamp')) return 'idea';
    if (value.includes('marble')) return 'marbles';
    return value.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'unknown';
  }

  function rememberObject(id) {
    const key = canonicalObjectId(id);
    const now = Date.now();
    const item = memory.objects[key] || { taps: 0, firstTapAt: now, lastTapAt: null };
    item.taps += 1;
    item.lastTapAt = now;
    memory.objects[key] = item;

    const profile = objectProfiles[key];
    let unlocked = null;
    if (profile && item.taps >= profile.unlockAt && !memory.achievements[key]) {
      unlocked = profile.achievement;
      memory.achievements[key] = { name: unlocked, unlockedAt: now };
    }
    save();
    return { key, item, profile, unlocked };
  }

  function callbackFor(id) {
    const key = canonicalObjectId(id);
    const profile = objectProfiles[key];
    const item = memory.objects[key];
    if (!profile || !item || item.taps < profile.unlockAt) return null;

    // Callbacks are for familiarity across visits, not every tap in one session.
    const achievement = memory.achievements[key];
    if (!achievement) return null;
    const age = Date.now() - achievement.unlockedAt;
    if (age < 5 * 60 * 1000) return null;

    const index = (item.taps + memory.visits) % profile.callbacks.length;
    return profile.callbacks[index];
  }

  function favoriteObject() {
    const entries = Object.entries(memory.objects);
    if (!entries.length) return null;
    entries.sort((a, b) => (b[1].taps || 0) - (a[1].taps || 0));
    const [key, data] = entries[0];
    return { key, name: objectProfiles[key]?.name || key, taps: data.taps || 0 };
  }

  function summary() {
    return {
      visits: memory.visits,
      favoriteObject: favoriteObject(),
      achievements: Object.values(memory.achievements).map(a => a.name),
      objects: JSON.parse(JSON.stringify(memory.objects))
    };
  }

  function reset() {
    memory = emptyMemory();
    save();
    return summary();
  }

  beginVisit();

  window.BlueyRelationshipMemory = {
    version: '1.0',
    rememberObject,
    callbackFor,
    favoriteObject,
    summary,
    reset,
    canonicalObjectId
  };

  // Allow Alpha 40 (or later layers) to announce object taps without tight coupling.
  window.addEventListener('bluey:object', function (event) {
    const id = event && event.detail && (event.detail.id || event.detail.objectId || event.detail.name);
    if (id) rememberObject(id);
  });

  console.info('[Bluey] Relationship Memory V1 ready', summary());
})();
