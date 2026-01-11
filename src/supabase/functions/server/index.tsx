import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper to get user from token
async function getUserFromToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

// =========================
// AUTH ROUTES
// =========================

app.post('/make-server-c8938417/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password and name are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// =========================
// DOG PROFILE ROUTES
// =========================

app.get('/make-server-c8938417/dogs', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dogs = await kv.getByPrefix(`dog:${user.id}:`);
    return c.json({ dogs: dogs || [] });
  } catch (error) {
    console.log(`Error fetching dogs: ${error}`);
    return c.json({ error: 'Failed to fetch dogs' }, 500);
  }
});

app.post('/make-server-c8938417/dogs', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dog = await c.req.json();
    const dogId = dog.id || Date.now().toString();
    const dogData = { ...dog, id: dogId, userId: user.id };

    await kv.set(`dog:${user.id}:${dogId}`, dogData);
    return c.json({ dog: dogData });
  } catch (error) {
    console.log(`Error creating dog: ${error}`);
    return c.json({ error: 'Failed to create dog' }, 500);
  }
});

app.delete('/make-server-c8938417/dogs/:id', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dogId = c.req.param('id');
    await kv.del(`dog:${user.id}:${dogId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting dog: ${error}`);
    return c.json({ error: 'Failed to delete dog' }, 500);
  }
});

// =========================
// TRACK ROUTES
// =========================

app.get('/make-server-c8938417/tracks', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tracks = await kv.getByPrefix(`track:${user.id}:`);
    return c.json({ tracks: tracks || [] });
  } catch (error) {
    console.log(`Error fetching tracks: ${error}`);
    return c.json({ error: 'Failed to fetch tracks' }, 500);
  }
});

app.get('/make-server-c8938417/tracks/:id', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const trackId = c.req.param('id');
    const track = await kv.get(`track:${user.id}:${trackId}`);
    
    if (!track) {
      return c.json({ error: 'Track not found' }, 404);
    }

    return c.json({ track });
  } catch (error) {
    console.log(`Error fetching track: ${error}`);
    return c.json({ error: 'Failed to fetch track' }, 500);
  }
});

app.post('/make-server-c8938417/tracks', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const track = await c.req.json();
    const trackId = track.id || Date.now().toString();
    const trackData = { ...track, id: trackId, userId: user.id };

    await kv.set(`track:${user.id}:${trackId}`, trackData);
    return c.json({ track: trackData });
  } catch (error) {
    console.log(`Error creating track: ${error}`);
    return c.json({ error: 'Failed to create track' }, 500);
  }
});

// =========================
// SHARING ROUTES
// =========================

app.post('/make-server-c8938417/tracks/:id/share', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const trackId = c.req.param('id');
    const track = await kv.get(`track:${user.id}:${trackId}`);
    
    if (!track) {
      return c.json({ error: 'Track not found' }, 404);
    }

    // Generate share code
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Store shared track with expiration metadata
    await kv.set(`shared:${shareCode}`, {
      ...track,
      sharedBy: user.id,
      sharedAt: Date.now(),
      shareCode,
    });

    return c.json({ shareCode });
  } catch (error) {
    console.log(`Error sharing track: ${error}`);
    return c.json({ error: 'Failed to share track' }, 500);
  }
});

app.get('/make-server-c8938417/shared/:code', async (c) => {
  try {
    const shareCode = c.req.param('code');
    const track = await kv.get(`shared:${shareCode}`);
    
    if (!track) {
      return c.json({ error: 'Shared track not found' }, 404);
    }

    return c.json({ track });
  } catch (error) {
    console.log(`Error fetching shared track: ${error}`);
    return c.json({ error: 'Failed to fetch shared track' }, 500);
  }
});

app.post('/make-server-c8938417/shared/:code/import', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shareCode = c.req.param('code');
    const sharedTrack = await kv.get(`shared:${shareCode}`);
    
    if (!sharedTrack) {
      return c.json({ error: 'Shared track not found' }, 404);
    }

    // Import track to user's account
    const newTrackId = Date.now().toString();
    const importedTrack = {
      ...sharedTrack,
      id: newTrackId,
      userId: user.id,
      importedFrom: shareCode,
      importedAt: Date.now(),
    };

    await kv.set(`track:${user.id}:${newTrackId}`, importedTrack);
    return c.json({ track: importedTrack });
  } catch (error) {
    console.log(`Error importing track: ${error}`);
    return c.json({ error: 'Failed to import track' }, 500);
  }
});

// =========================
// LIVE TRACKING ROUTES
// =========================

app.post('/make-server-c8938417/live-sessions', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { dogId, type } = await c.req.json();
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

    const session = {
      id: sessionId,
      userId: user.id,
      dogId,
      type, // 'trail' or 'tracking'
      startedAt: Date.now(),
      active: true,
      points: [],
      objects: [],
    };

    await kv.set(`live:${sessionId}`, session);
    return c.json({ session });
  } catch (error) {
    console.log(`Error creating live session: ${error}`);
    return c.json({ error: 'Failed to create live session' }, 500);
  }
});

app.get('/make-server-c8938417/live-sessions/:id', async (c) => {
  try {
    const sessionId = c.req.param('id');
    const session = await kv.get(`live:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({ session });
  } catch (error) {
    console.log(`Error fetching live session: ${error}`);
    return c.json({ error: 'Failed to fetch live session' }, 500);
  }
});

app.post('/make-server-c8938417/live-sessions/:id/update', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('id');
    const session = await kv.get(`live:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const { points, objects, active } = await c.req.json();
    
    const updatedSession = {
      ...session,
      points: points || session.points,
      objects: objects || session.objects,
      active: active !== undefined ? active : session.active,
      lastUpdated: Date.now(),
    };

    await kv.set(`live:${sessionId}`, updatedSession);
    return c.json({ session: updatedSession });
  } catch (error) {
    console.log(`Error updating live session: ${error}`);
    return c.json({ error: 'Failed to update live session' }, 500);
  }
});

app.post('/make-server-c8938417/live-sessions/:id/end', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('id');
    const session = await kv.get(`live:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updatedSession = {
      ...session,
      active: false,
      endedAt: Date.now(),
    };

    await kv.set(`live:${sessionId}`, updatedSession);
    return c.json({ session: updatedSession });
  } catch (error) {
    console.log(`Error ending live session: ${error}`);
    return c.json({ error: 'Failed to end live session' }, 500);
  }
});

// =========================
// EXPORT ROUTES
// =========================

app.get('/make-server-c8938417/tracks/:id/export', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const trackId = c.req.param('id');
    const track = await kv.get(`track:${user.id}:${trackId}`);
    
    if (!track) {
      return c.json({ error: 'Track not found' }, 404);
    }

    // Export as GPX format
    const gpx = generateGPX(track);
    
    return new Response(gpx, {
      headers: {
        'Content-Type': 'application/gpx+xml',
        'Content-Disposition': `attachment; filename="track-${trackId}.gpx"`,
      },
    });
  } catch (error) {
    console.log(`Error exporting track: ${error}`);
    return c.json({ error: 'Failed to export track' }, 500);
  }
});

function generateGPX(track: any): string {
  const date = new Date(track.date).toISOString();
  
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DogTracker Pro">
  <metadata>
    <name>Dog Track - ${track.dogId}</name>
    <time>${date}</time>
  </metadata>
  <trk>
    <name>Trail</name>
    <trkseg>`;

  track.trailPoints.forEach((point: any) => {
    gpx += `
      <trkpt lat="${point.lat}" lon="${point.lng}">
        <time>${new Date(point.timestamp).toISOString()}</time>
      </trkpt>`;
  });

  gpx += `
    </trkseg>
  </trk>
  <trk>
    <name>Dog Path</name>
    <trkseg>`;

  track.dogPoints.forEach((point: any) => {
    gpx += `
      <trkpt lat="${point.lat}" lon="${point.lng}">
        <time>${new Date(point.timestamp).toISOString()}</time>
      </trkpt>`;
  });

  gpx += `
    </trkseg>
  </trk>`;

  track.objects.forEach((obj: any, i: number) => {
    gpx += `
  <wpt lat="${obj.lat}" lon="${obj.lng}">
    <name>Object ${i + 1} (${obj.type})</name>
    <time>${new Date(obj.timestamp).toISOString()}</time>
  </wpt>`;
  });

  gpx += `
</gpx>`;

  return gpx;
}

Deno.serve(app.fetch);
