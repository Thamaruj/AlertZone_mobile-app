import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────
// GOOGLE MAPS SETUP GUIDE
// ─────────────────────────────────────────────
// 1. Install the package:
//    npx expo install react-native-maps
//
// 2. Get a Google Maps API key:
//    → Go to https://console.cloud.google.com
//    → Create a project → Enable "Maps SDK for Android" and "Maps SDK for iOS"
//    → Create an API key under Credentials
//
// 3. Add the key to app.json:
//    {
//      "expo": {
//        "android": {
//          "config": {
//            "googleMaps": { "apiKey": "YOUR_ANDROID_KEY" }
//          }
//        },
//        "ios": {
//          "config": {
//            "googleMapsApiKey": "YOUR_IOS_KEY"
//          }
//        }
//      }
//    }
//
// 4. Uncomment the imports below and replace the placeholder View with <MapView>
// ─────────────────────────────────────────────

// TODO: Uncomment after setup
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';  →  npx expo install expo-location

// ── Mock issue pins ──
const MOCK_PINS = [
  { id: '1', title: 'Heavy Traffic',      subtitle: 'Market St',        lat: 6.8900, lng: 79.8900, type: 'traffic',  color: '#E05C5C', icon: 'car'            },
  { id: '2', title: 'Broken Streetlight', subtitle: 'Nawala Road',      lat: 6.8850, lng: 79.9000, type: 'lighting', color: '#F59E0B', icon: 'bulb'           },
  { id: '3', title: 'Pothole',            subtitle: 'Park Avenue',       lat: 6.8950, lng: 79.8950, type: 'road',     color: '#4CC2D1', icon: 'warning'        },
  { id: '4', title: 'Blocked Drain',      subtitle: 'High Street',       lat: 6.8800, lng: 79.8850, type: 'water',    color: '#60A5FA', icon: 'water'          },
];

const FILTER_CHIPS = [
  { id: 'all',     label: 'All Alerts', icon: 'warning-outline',  color: '#F59E0B' },
  { id: 'roads',   label: 'Roads',      icon: 'car-outline',       color: '#E05C5C' },
  { id: 'water',   label: 'Water',      icon: 'water-outline',     color: '#60A5FA' },
  { id: 'weather', label: 'Weather',    icon: 'partly-sunny-outline', color: '#34D399' },
];

const MAP_INITIAL_REGION = {
  latitude: 6.8900,
  longitude: 79.8950,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Dark map style for Google Maps
export const DARK_MAP_STYLE = [
  { elementType: 'geometry',                          stylers: [{ color: '#0d1f2d' }] },
  { elementType: 'labels.text.fill',                  stylers: [{ color: '#4CC2D1' }] },
  { elementType: 'labels.text.stroke',                stylers: [{ color: '#0a1820' }] },
  { featureType: 'road',       elementType: 'geometry', stylers: [{ color: '#1E3A44' }] },
  { featureType: 'road',       elementType: 'geometry.stroke', stylers: [{ color: '#071318' }] },
  { featureType: 'water',      elementType: 'geometry', stylers: [{ color: '#071318' }] },
  { featureType: 'poi',        elementType: 'geometry', stylers: [{ color: '#0a1820' }] },
  { featureType: 'transit',    elementType: 'geometry', stylers: [{ color: '#1E3A44' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1E3A44' }] },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPin, setSelectedPin]   = useState<typeof MOCK_PINS[0] | null>(null);
  const [searchText, setSearchText]     = useState('');

  // TODO: Request location permission and get current position
  // useEffect(() => {
  //   (async () => {
  //     const { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status === 'granted') {
  //       const loc = await Location.getCurrentPositionAsync({});
  //       setRegion({ ...MAP_INITIAL_REGION, latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  //     }
  //   })();
  // }, []);

  // TODO: Fetch pins from Firestore
  // useEffect(() => {
  //   const q = query(collection(db, 'reports'), where('status', '!=', 'RESOLVED'));
  //   const unsub = onSnapshot(q, snap => setPins(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  //   return unsub;
  // }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#071318' }}>

      {/* ── MAP AREA ── */}
      {/* TODO: Replace this placeholder View with the MapView below once setup is done */}
      <View style={{ flex: 1, backgroundColor: '#0D1F2D', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="map" size={60} color="#1E3347" />
        <Text style={{ color: '#2D4F5C', marginTop: 12, fontWeight: '600' }}>Google Maps</Text>
        <Text style={{ color: '#1E3347', fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }}>
          Follow the setup guide in the file comments to configure Google Maps
        </Text>
      </View>

      {/*
      ── UNCOMMENT THIS AFTER SETUP ──
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={MAP_INITIAL_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {MOCK_PINS.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onPress={() => setSelectedPin(pin)}
          >
            <View style={{
              backgroundColor: pin.color,
              borderRadius: 20, padding: 6,
              borderWidth: 2, borderColor: 'white',
            }}>
              <Ionicons name={pin.icon} size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>
      */}

      {/* ── OVERLAY LAYER (sits on top of the map) ── */}

      {/* Search bar + filters */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 16 }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#111E27', borderRadius: 14,
            paddingHorizontal: 14, paddingVertical: 10,
            borderWidth: 1, borderColor: '#1E3347',
            marginBottom: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#3A6070" />
          <TextInput
            placeholder="Search location or alerts"
            placeholderTextColor="#3A6070"
            value={searchText}
            onChangeText={setSearchText}
            style={{ flex: 1, color: 'white', fontSize: 14, marginLeft: 10, padding: 0 }}
          />
          <Pressable className="active:opacity-70">
            <View style={{
              backgroundColor: '#1E3347', borderRadius: 8, padding: 6,
            }}>
              <Ionicons name="options-outline" size={16} color="#4CC2D1" />
            </View>
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
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
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isActive ? chip.color : '#1E3347',
                  }}
                >
                  <Ionicons name={chip.icon as any} size={13} color={isActive ? chip.color : '#5A7D8A'} />
                  <Text style={{
                    color: isActive ? chip.color : '#5A7D8A',
                    fontSize: 12, fontWeight: '600',
                  }}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Zoom controls */}
      <View style={{ position: 'absolute', right: 16, bottom: selectedPin ? 190 : 120 }}>
        {/* TODO: Wire to mapRef.current.animateCamera() for zoom */}
        <Pressable
          style={{
            width: 40, height: 40, backgroundColor: '#111E27',
            borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#1E3347', marginBottom: 8,
          }}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
        <Pressable
          style={{
            width: 40, height: 40, backgroundColor: '#111E27',
            borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#1E3347',
          }}
        >
          <Ionicons name="remove" size={20} color="white" />
        </Pressable>
      </View>

      {/* My location button */}
      <View style={{ position: 'absolute', right: 16, bottom: selectedPin ? 246 : 176 }}>
        <Pressable
          // TODO: onPress → mapRef.current.animateToRegion(userLocation)
          style={{
            width: 40, height: 40, backgroundColor: '#4CC2D1',
            borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="navigate" size={18} color="#071318" />
        </Pressable>
      </View>

      {/* ── Issue Popup (shown when a pin is tapped) ── */}
      {selectedPin && (
        <View
          style={{
            position: 'absolute', bottom: 110, left: 16, right: 16,
            backgroundColor: '#111E27',
            borderRadius: 20, padding: 16,
            borderWidth: 1, borderColor: '#1E3347',
            flexDirection: 'row', alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
          }}
        >
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
            // TODO: Navigate to report detail screen
          >
            <Text style={{ color: '#071318', fontWeight: '700', fontSize: 12 }}>DETAILS</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedPin(null)} style={{ marginLeft: 8 }}>
            <Ionicons name="close" size={18} color="#3A6070" />
          </Pressable>
        </View>
      )}

      {/* Tap a pin prompt (when no pin selected) */}
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