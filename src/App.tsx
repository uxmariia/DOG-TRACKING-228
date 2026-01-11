import { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { apiClient } from './utils/api';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { DogProfiles } from './components/DogProfiles';
import CreateTrail from './components/CreateTrail';
import DogTracking from "./components/DogTracking";
import { TrackHistory } from './components/TrackHistory';
import { TrackAnalysis } from './components/TrackAnalysis';
import { Statistics } from './components/Statistics';
import { ShareTrack } from './components/ShareTrack';
import { LiveTracking } from './components/LiveTracking';

export type Dog = {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  specialization: string;
  photo?: string;
};

export type TrailPoint = {
  lat: number;
  lng: number;
  timestamp: number;
};

export type ObjectMarker = {
  id: string;
  lat: number;
  lng: number;
  type: 'placed' | 'found';
  timestamp: number;
};

export type Track = {
  id: string;
  dogId: string;
  date: string;
  trailPoints: TrailPoint[];
  dogPoints: TrailPoint[];
  objects: ObjectMarker[];
  conditions: {
    weather: string;
    temperature: string;
    wind: string;
    surface: string;
    notes: string;
  };
  stats: {
    trailDistance: number;
    dogDistance: number;
    duration: number;
    averageSpeed: number;
    averageDeviation: number;
    maxDeviation: number;
    objectsFound: number;
    objectsTotal: number;
  };
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'dogs' | 'create-trail' | 'track-dog' | 'history' | 'analysis' | 'stats' | 'share' | 'live'>('home');
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [currentTrail, setCurrentTrail] = useState<TrailPoint[] | null>(null);
  const [currentObjects, setCurrentObjects] = useState<ObjectMarker[]>([]);
  const [currentConditions, setCurrentConditions] = useState<any>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

  const supabase = createClient();

  // Check for existing session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        apiClient.setToken(session.access_token);
        await loadUserData();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Load dogs from server
      const { dogs: serverDogs } = await apiClient.getDogs();
      setDogs(serverDogs || []);

      // Load tracks from server
      const { tracks: serverTracks } = await apiClient.getTracks();
      setTracks(serverTracks || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      apiClient.setToken(data.session.access_token);
      await loadUserData();
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      const { user: newUser } = await apiClient.signup(email, password, name);
      
      // Now login
      await handleLogin(email, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to signup');
    }
  };

 const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setDogs([]);
      setTracks([]);
      apiClient.setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addDog = async (dog: Dog) => {
    try {
      const { dog: newDog } = await apiClient.createDog(dog);
      setDogs([...dogs, newDog]);
    } catch (error) {
      console.error('Error adding dog:', error);
      alert('Помилка додавання собаки');
    }
  };

const updateDog = async (dog: Dog) => {
    try {
      await apiClient.updateDog(dog);
      setDogs(dogs.map(d => d.id === dog.id ? dog : d));
    } catch (error) {
      console.error('Error updating dog:', error);
      alert('Помилка оновлення профілю');
    }
  };

  const deleteDog = async (id: string) => {
    try {
      await apiClient.deleteDog(id);
      setDogs(dogs.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting dog:', error);
      alert('Помилка видалення собаки');
    }
  };

  const addTrack = async (track: Track) => {
    try {
      const { track: newTrack } = await apiClient.createTrack(track);
      setTracks([...tracks, newTrack]);
    } catch (error) {
      console.error('Error adding track:', error);
      alert('Помилка збереження тренування');
    }
  };

  const navigateTo = (screen: typeof currentScreen, dog?: Dog, track?: Track) => {
    setCurrentScreen(screen);
    if (dog) setSelectedDog(dog);
    if (track) setSelectedTrack(track);
  };

  const startTrail = (dog: Dog) => {
    setSelectedDog(dog);
    setCurrentTrail(null);
    setCurrentObjects([]);
    setCurrentConditions(null);
    setCurrentScreen('create-trail');
  };

  const finishTrail = (trail: TrailPoint[], objects: ObjectMarker[], conditions: any) => {
    setCurrentTrail(trail);
    setCurrentObjects(objects);
    setCurrentConditions(conditions);
    setCurrentScreen('track-dog');
  };

  const finishTracking = async (dogPoints: TrailPoint[], foundObjects: ObjectMarker[]) => {
    if (!selectedDog || !currentTrail) return;

    // Calculate statistics
    const trailDistance = calculateDistance(currentTrail);
    const dogDistance = calculateDistance(dogPoints);
    const duration = dogPoints.length > 0 ? (dogPoints[dogPoints.length - 1].timestamp - dogPoints[0].timestamp) / 1000 : 0;
    const averageSpeed = duration > 0 ? dogDistance / duration : 0;
    const deviations = calculateDeviations(currentTrail, dogPoints);
    
    const newTrack: Track = {
      id: Date.now().toString(),
      dogId: selectedDog.id,
      date: new Date().toISOString(),
      trailPoints: currentTrail,
      dogPoints: dogPoints,
      objects: [...currentObjects, ...foundObjects],
      conditions: currentConditions,
      stats: {
        trailDistance,
        dogDistance,
        duration,
        averageSpeed,
        averageDeviation: deviations.average,
        maxDeviation: deviations.max,
        objectsFound: foundObjects.filter(o => o.type === 'found').length,
        objectsTotal: currentObjects.filter(o => o.type === 'placed').length,
      },
    };

    await addTrack(newTrack);
    setSelectedTrack(newTrack);
    setCurrentTrail(null);
    setCurrentObjects([]);
    setCurrentConditions(null);
    
    // End live session if active
    if (liveSessionId) {
      try {
        await apiClient.endLiveSession(liveSessionId);
        setLiveSessionId(null);
      } catch (error) {
        console.error('Error ending live session:', error);
      }
    }
    
    setCurrentScreen('analysis');
  };

  const calculateDistance = (points: TrailPoint[]): number => {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += getDistanceBetweenPoints(points[i - 1], points[i]);
    }
    return distance;
  };

  const getDistanceBetweenPoints = (p1: TrailPoint, p2: TrailPoint): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDeviations = (trail: TrailPoint[], dog: TrailPoint[]): { average: number; max: number } => {
    if (trail.length === 0 || dog.length === 0) return { average: 0, max: 0 };

    let totalDeviation = 0;
    let maxDeviation = 0;

    dog.forEach(dogPoint => {
      let minDistance = Infinity;
      trail.forEach(trailPoint => {
        const distance = getDistanceBetweenPoints(dogPoint, trailPoint);
        if (distance < minDistance) {
          minDistance = distance;
        }
      });
      totalDeviation += minDistance;
      if (minDistance > maxDeviation) {
        maxDeviation = minDistance;
      }
    });

    return {
      average: totalDeviation / dog.length,
      max: maxDeviation,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'home' && (
        <Home 
          dogs={dogs}
          tracks={tracks}
          user={user}
          onNavigate={navigateTo}
          onStartTrail={startTrail}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'dogs' && (
        <DogProfiles 
          dogs={dogs}
          onAddDog={addDog}
          onDeleteDog={deleteDog}
          onBack={() => navigateTo('home')}
        />
      )}
      {currentScreen === 'create-trail' && (
        <CreateTrail 
          dog={selectedDog}
          onFinish={finishTrail}
          onBack={() => navigateTo('home')}
          onStartLiveSession={async (dogId) => {
            try {
              const { session } = await apiClient.createLiveSession(dogId, 'trail');
              setLiveSessionId(session.id);
              return session.id;
            } catch (error) {
              console.error('Error starting live session:', error);
              return null;
            }
          }}
          liveSessionId={liveSessionId}
        />
      )}
      {currentScreen === 'track-dog' && (
        <DogTracking 
          dog={selectedDog}
          trail={currentTrail || []}
          placedObjects={currentObjects}
          onFinish={finishTracking}
          onBack={() => navigateTo('home')}
          onStartLiveSession={async (dogId) => {
            try {
              const { session } = await apiClient.createLiveSession(dogId, 'tracking');
              setLiveSessionId(session.id);
              return session.id;
            } catch (error) {
              console.error('Error starting live session:', error);
              return null;
            }
          }}
          liveSessionId={liveSessionId}
        />
      )}
      {currentScreen === 'history' && (
        <TrackHistory 
          tracks={tracks}
          dogs={dogs}
          onSelectTrack={(track) => {
            setSelectedTrack(track);
            navigateTo('analysis');
          }}
          onBack={() => navigateTo('home')}
        />
      )}
      {currentScreen === 'analysis' && selectedTrack && (
        <TrackAnalysis 
          track={selectedTrack}
          dog={dogs.find(d => d.id === selectedTrack.dogId)}
          onBack={() => navigateTo('history')}
          onShare={() => {
            navigateTo('share');
          }}
        />
      )}
      {currentScreen === 'stats' && (
        <Statistics 
          tracks={tracks}
          dogs={dogs}
          onBack={() => navigateTo('home')}
        />
      )}
      {currentScreen === 'share' && (
        <ShareTrack 
          track={selectedTrack}
          onBack={() => navigateTo('analysis')}
        />
      )}
      {currentScreen === 'live' && (
        <LiveTracking 
          onBack={() => navigateTo('home')}
        />
      )}
    </div>
  );
}