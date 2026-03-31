import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

// ── Mock issue pins ──
// TODO: Replace with Firestore snapshot
// const q = query(collection(db, 'reports'), where('status', '!=', 'RESOLVED'));
// const unsub = onSnapshot(q, snap => setPins(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
const MOCK_PINS = [
  { id: '1', title: 'Heavy Traffic',      subtitle: 'Market St',   lat: 6.8900, lng: 79.8900, type: 'traffic',  color: '#E05C5C', icon: 'car'     },
  { id: '2', title: 'Broken Streetlight', subtitle: 'Nawala Road', lat: 6.8850, lng: 79.9000, type: 'lighting', color: '#F59E0B', icon: 'bulb'    },
  { id: '3', title: 'Pothole',            subtitle: 'Park Avenue', lat: 6.8950, lng: 79.8950, type: 'road',     color: '#4CC2D1', icon: 'warning' },
  { id: '4', title: 'Blocked Drain',      subtitle: 'High Street', lat: 6.8800, lng: 79.8850, type: 'water',    color: '#60A5FA', icon: 'water'   },
];

const FILTER_CHIPS = [
  { id: 'all',     label: 'All Alerts', icon: 'warning-outline',     color: '#F59E0B' },
  { id: 'roads',   label: 'Roads',      icon: 'car-outline',          color: '#E05C5C' },
  { id: 'water',   label: 'Water',      icon: 'water-outline',        color: '#60A5FA' },
  { id: 'weather', label: 'Weather',    icon: 'partly-sunny-outline', color: '#34D399' },
];

const DEFAULT_REGION = {
  latitude: 6.8900,
  longitude: 79.8950,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry',                                stylers: [{ color: '#0d1f2d' }] },
  { elementType: 'labels.text.fill',                        stylers: [{ color: '#4CC2D1' }] },
  { elementType: 'labels.text.stroke',                      stylers: [{ color: '#0a1820' }] },
  { featureType: 'road',        elementType: 'geometry',    stylers: [{ color: '#1E3A44' }] },
  { featureType: 'road',        elementType: 'geometry.stroke', stylers: [{ color: '#071318' }] },
  { featureType: 'water',       elementType: 'geometry',    stylers: [{ color: '#071318' }] },
  { featureType: 'poi',         elementType: 'geometry',    stylers: [{ color: '#0a1820' }] },
  { featureType: 'transit',     elementType: 'geometry',    stylers: [{ color: '#1E3A44' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1E3A44' }] },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [activeFilter, setActiveFilter]       = useState('all');
  const [selectedPin, setSelectedPin]         = useState<typeof MOCK_PINS[0] | null>(null);
  const [searchText, setSearchText]           = useState('');
  const [region, setRegion]                   = useState(DEFAULT_REGION);
  const [locationGranted, setLocationGranted] = useState(false);

  // ── Request location permission + center on user ──
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied — using default region');
        return;
      }
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const userRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 800);
    })();
  }, []);

  const zoomIn = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta / 2, longitudeDelta: region.longitudeDelta / 2 };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
  };

  const zoomOut = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta * 2, longitudeDelta: region.longitudeDelta * 2 };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
  };

  const goToMyLocation = async () => {
    if (!locationGranted) return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const userRegion = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setRegion(userRegion);
    mapRef.current?.animateToRegion(userRegion, 800);
  };

  const filteredPins = MOCK_PINS.filter((pin) => {
    if (activeFilter === 'all')   return true;
    if (activeFilter === 'roads') return pin.type === 'road' || pin.type === 'traffic';
    if (activeFilter === 'water') return pin.type === 'water';
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#071318' }}>

      {/* ── Google Map ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={region}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
      >
        {filteredPins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onPress={() => setSelectedPin(pin)}
          >
            <View style={{
              backgroundColor: pin.color,
              borderRadius: 20, padding: 6,
              borderWidth: 2, borderColor: 'white',
              shadowColor: pin.color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,
            }}>
              <Ionicons name={pin.icon as any} size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Search + Filter chips overlay ── */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#111E27', borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 10,
          borderWidth: 1, borderColor: '#1E3347', marginBottom: 10,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
        }}>
          <Ionicons name="search-outline" size={18} color="#3A6070" />
          <TextInput
            placeholder="Search location or alerts"
            placeholderTextColor="#3A6070"
            value={searchText}
            onChangeText={setSearchText}
            style={{ flex: 1, color: 'white', fontSize: 14, marginLeft: 10, padding: 0 }}
          />
          <Pressable className="active:opacity-70">
            <View style={{ backgroundColor: '#1E3347', borderRadius: 8, padding: 6 }}>
              <Ionicons name="options-outline" size={16} color="#4CC2D1" />
            </View>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setActiveFilter(chip.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 7,
                    backgroundColor: isActive ? '#1E3A44' : 'rgba(17,30,39,0.9)',
                    borderRadius: 20, borderWidth: 1,
                    borderColor: isActive ? chip.color : '#1E3347',
                  }}
                >
                  <Ionicons name={chip.icon as any} size={13} color={isActive ? chip.color : '#5A7D8A'} />
                  <Text style={{ color: isActive ? chip.color : '#5A7D8A', fontSize: 12, fontWeight: '600' }}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── Controls ── */}
      <View style={{ position: 'absolute', right: 16, bottom: selectedPin ? 250 : 130 }}>
        <Pressable onPress={goToMyLocation} style={{
          width: 40, height: 40, backgroundColor: '#4CC2D1',
          borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        }}>
          <Ionicons name="navigate" size={18} color="#071318" />
        </Pressable>
        <Pressable onPress={zoomIn} style={{
          width: 40, height: 40, backgroundColor: '#111E27',
          borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#1E3347', marginBottom: 8,
        }}>
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
        <Pressable onPress={zoomOut} style={{
          width: 40, height: 40, backgroundColor: '#111E27',
          borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#1E3347',
        }}>
          <Ionicons name="remove" size={20} color="white" />
        </Pressable>
      </View>

      {/* ── Pin popup ── */}
      {selectedPin && (
        <View style={{
          position: 'absolute', bottom: 110, left: 16, right: 16,
          backgroundColor: '#111E27', borderRadius: 20, padding: 16,
          borderWidth: 1, borderColor: '#1E3347',
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
        }}>
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: selectedPin.color + '22',
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name={selectedPin.icon as any} size={22} color={selectedPin.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{selectedPin.title}</Text>
            <Text style={{ color: '#5A7D8A', fontSize: 12, marginTop: 2 }}>{selectedPin.subtitle}</Text>
            <Text style={{ color: '#3A6070', fontSize: 11, marginTop: 2 }}>Reported 5 mins ago by 12 users</Text>
          </View>
          <Pressable
            style={{
              backgroundColor: '#4CC2D1', paddingHorizontal: 14,
              paddingVertical: 8, borderRadius: 10, marginLeft: 8,
            }}
            // TODO: router.push to report detail with selectedPin.id
          >
            <Text style={{ color: '#071318', fontWeight: '700', fontSize: 12 }}>DETAILS</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedPin(null)} style={{ marginLeft: 8 }}>
            <Ionicons name="close" size={18} color="#3A6070" />
          </Pressable>
        </View>
      )}

      {/* ── Hint when no pin selected ── */}
      {!selectedPin && (
        <View style={{
          position: 'absolute', bottom: 110, left: 16, right: 16,
          backgroundColor: 'rgba(17,30,39,0.85)', borderRadius: 16,
          paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          borderWidth: 1, borderColor: '#1E3347',
        }}>
          <Ionicons name="information-circle-outline" size={18} color="#3A6070" />
          <Text style={{ color: '#3A6070', fontSize: 12 }}>
            Tap a pin on the map to see issue details
          </Text>
        </View>
      )}

    </View>
  );
}