import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const airportIcon = new L.Icon({
  iconUrl: "/leaflet/airport.svg",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const createPlaneIcon = (angle = 0) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${angle}deg); transition: transform 0.5s;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#ffffffff">
          <path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"/>
        </svg>
      </div>
    `,
    className: "plane-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const toRad = value => value * Math.PI / 180;
  const lonDelta = toRad(lon2 - lon1);
  const y = Math.sin(lonDelta) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - 
           Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(lonDelta);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const calculateIntermediatePoint = (lat1, lon1, lat2, lon2, fraction) => {
  const toRad = value => value * Math.PI / 180;
  const toDeg = value => value * 180 / Math.PI;
  
  lat1 = toRad(lat1);
  lon1 = toRad(lon1);
  lat2 = toRad(lat2);
  lon2 = toRad(lon2);
  
  const d = Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
                     Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));
  
  if (Math.abs(d) < 1e-9) return [toDeg(lat1), toDeg(lon1)];
  
  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);
  
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  
  const lat = Math.atan2(z, Math.sqrt(x*x + y*y));
  const lon = Math.atan2(y, x);
  
  return [toDeg(lat), toDeg(lon)];
};

function MapController({ setMapCenter, setMapZoom }) {
  const map = useMapEvents({
    moveend: () => {
      setMapCenter(map.getCenter());
      setMapZoom(map.getZoom());
    }
  });
  
  return null;
}

function FlightProgress({ progress, flightTime }) {
  const hours = Math.floor(flightTime);
  const minutes = Math.round((flightTime - hours) * 60);
  
  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between text-sm text-gray-300 mb-2">
        <span>Flight Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Departure</span>
        <span>{hours}h {minutes > 0 ? `${minutes}m` : ''}</span>
        <span>Destination</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const [airports, setAirports] = useState([]);
  const [currentPosition, setCurrentPosition] = useState("");
  const [departureAirport, setDepartureAirport] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [planePosition, setPlanePosition] = useState(null);
  const [planeIcon, setPlaneIcon] = useState(createPlaneIcon(0));
  const [flightPath, setFlightPath] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flightProgress, setFlightProgress] = useState(0);
  const [mapCenter, setMapCenter] = useState([47.4979, 19.0402]);
  const [mapZoom, setMapZoom] = useState(4);
  const [apiError, setApiError] = useState(null);
  const [flightInfo, setFlightInfo] = useState(null);
  const arrivaldate = new Date(Date.now());
  const lastUpdateRef = useRef(null);
  const navigate = useNavigate();

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const isFlightInProgress = countdown !== null;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          setIsAuthenticated(true);
          await loadInitialData();
        } catch (error) {
          handleAuthError(error);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const handleAuthError = (error) => {
    console.error("Auth error:", error);
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setLoading(false);
  };

  const loadInitialData = async () => {
    
    try {
      setApiError(null);
      
      const airportsResponse = await axios.get("https://flightfocus.marcellh.me/api/boarding/airport", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      setAirports(airportsResponse.data);
      
      const positionResponse = await axios.get("https://flightfocus.marcellh.me/api/boarding/position", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      setCurrentPosition(positionResponse.data);
      setLoading(false);
    } catch (error) {
      console.error("API Error:", error);
      setApiError("Failed to load data from server. Using demo data.");
      setLoading(false);
      
      const demoAirports = [
        { name: "BUD", fullName: "Budapest Liszt Ferenc Airport", latitude: 47.4395, longitude: 19.2618 },
        { name: "LHR", fullName: "London Heathrow Airport", latitude: 51.4700, longitude: -0.4543 },
        { name: "CDG", fullName: "Charles de Gaulle Airport", latitude: 49.0097, longitude: 2.5479 },
        { name: "FRA", fullName: "Frankfurt Airport", latitude: 50.0379, longitude: 8.5622 },
        { name: "AMS", fullName: "Amsterdam Airport Schiphol", latitude: 52.3086, longitude: 4.7639 },
        { name: "FCO", fullName: "Rome Fiumicino Airport", latitude: 41.8003, longitude: 12.2389 },
        { name: "VIE", fullName: "Vienna International Airport", latitude: 48.1103, longitude: 16.5697 },
        { name: "PRG", fullName: "Václav Havel Airport Prague", latitude: 50.1008, longitude: 14.2600 },
        { name: "WAW", fullName: "Warsaw Chopin Airport", latitude: 52.1657, longitude: 20.9671 },
        { name: "IST", fullName: "Istanbul Airport", latitude: 41.2753, longitude: 28.7519 },
      ];
      
      setAirports(demoAirports);
      setCurrentPosition("BUD");
    }
  };

  useEffect(() => {
    if (currentPosition && airports.length > 0) {
      const foundAirport = airports.find(a => a.name === currentPosition);
      if (foundAirport) {
        setDepartureAirport(foundAirport);
        setMapCenter([foundAirport.latitude, foundAirport.longitude]);
        setMapZoom(10);
      }
    }
  }, [currentPosition, airports]);

  useEffect(() => {
    const handleAuth = async () => {
      try
      {
        const response = await axios.post("https://flightfocus.marcellh.me/api/auth/verify", {}, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`, 'Content-Type': 'application/json'}});
      }
      catch(error)
      {
        localStorage.clear();
        navigate("/")
      }
    }

    handleAuth();
  }, []);

  const handleAirportClick = (airport) => {
    if (isFlightInProgress) {
      alert("Cannot select new destination during flight. Please wait until the current flight is completed.");
      return;
    }

    if (!departureAirport) {
      alert("Current position airport not found.");
      return;
    }

    if (airport.name === departureAirport.name) {
      alert("You are already at this airport.");
      return;
    }

    const distance = calculateDistance(
      departureAirport.latitude,
      departureAirport.longitude,
      airport.latitude,
      airport.longitude
    );

    const airbusSpeed = 400;
    const flightTime = distance / airbusSpeed;

    const start = [departureAirport.latitude, departureAirport.longitude];
    const end = [airport.latitude, airport.longitude];

    const pathPoints = [];
    for (let i = 0; i <= 20; i++) {
      const fraction = i / 20;
      const point = calculateIntermediatePoint(
        departureAirport.latitude,
        departureAirport.longitude,
        airport.latitude,
        airport.longitude,
        fraction
      );
      pathPoints.push(point);
    }

    setSelectedAirport(airport);
    setFlightInfo({
      from: departureAirport.fullName,
      to: airport.fullName,
      fromCode: departureAirport.name,
      toCode: airport.name,
      distance: distance.toFixed(2),
      time: flightTime.toFixed(2),
      start,
      end,
    });

    setFlightPath(pathPoints);
    setPlanePosition(null);
    setCountdown(null);
    setFlightProgress(0);
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

const startFlightAnimation = async () => {
  if (!flightInfo) return;
  setShowModal(false);

  try {
    const response = await axios.post("https://flightfocus.marcellh.me/api/boarding/start", {
      Airport: flightInfo.toCode,
      ArrivedDate: arrivaldate
    }, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Flight started successfully:", response.data);
  } catch (error) {
    console.error("Error starting flight:", error);
    alert("Failed to start flight. Please try again.");
    return;
  }

  const { start, end, time } = flightInfo;
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  const bearing = calculateBearing(lat1, lon1, lat2, lon2);
  setPlaneIcon(createPlaneIcon(bearing));

  const durationMs = parseFloat(time) * 3600 * 1000;
  startTimeRef.current = null;

  const totalSeconds = Math.round(parseFloat(time) * 3600);
  setCountdown(totalSeconds);
  
  if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  
  countdownIntervalRef.current = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  const animate = async (timestamp) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / durationMs, 1);

    if (!lastUpdateRef.current || timestamp - lastUpdateRef.current > 150) {
      lastUpdateRef.current = timestamp;

      const [lat, lon] = calculateIntermediatePoint(lat1, lon1, lat2, lon2, progress);
      setPlanePosition([lat, lon]);
      setFlightProgress(progress * 100);
    }

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setCountdown(0);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      try
      {
          const response = await axios.post("https://flightfocus.marcellh.me/api/boarding/complete", {
            Departure: flightInfo.fromCode,
            Arrival: flightInfo.toCode,
            ArrivedDate: arrivaldate
          }, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'application/json'
            }
          });
      }
      catch(error)
      {
        alert("Uncompleted flight route.");
      }
    }
  };

  animationRef.current = requestAnimationFrame(animate);
};

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(x => String(x).padStart(2, "0")).join(":");
};

const handleLogout = () => {
  localStorage.removeItem("token");
  setIsAuthenticated(false);
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading flight data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to access the flight dashboard.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 hover:blue-700 text-white rounded-lg font-semibold shadow-md transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

return (
    <div className="relative h-screen w-screen flex bg-gray-900 overflow-hidden">
      {showModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-600 max-w-md">
            <div className="flex justify-center mb-4">
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">Confirm Flight</h2>
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-left">
                  <p className="text-gray-300 text-sm">From</p>
                  <p className="text-white font-medium">{flightInfo?.from}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm">To</p>
                  <p className="text-white font-medium">{flightInfo?.to}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="text-gray-400">Distance</p>
                  <p className="text-blue-400">{flightInfo?.distance} km</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Duration</p>
                  <p className="text-green-400">{flightInfo?.time} hours</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={startFlightAnimation}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-sm transition-colors duration-200 flex items-center"
              >
                Confirm Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-red-900 px-4 py-2 rounded-lg text-center z-10 border border-red-700 flex items-center max-w-md">
          <span className="text-red-200 text-sm">{apiError}</span>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-gray-800 px-4 py-2 rounded-lg z-10 border border-gray-600 flex items-center shadow-sm">
        <span className="text-gray-200 text-sm">Location: <span className="text-blue-300 font-medium">{currentPosition}</span></span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-normal transition-colors duration-200 flex items-center border border-gray-600"
          onClick={(e) => (navigate("/history"))}
        >
          History
        </button>
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-normal transition-colors duration-200 flex items-center border border-gray-600"
        >
          Sign Out
        </button>
      </div>

      <div className="absolute bottom-5 right-5 bg-gray-800 rounded-lg p-4 w-72 z-10 border border-gray-600 shadow-sm">
        <div className="flex items-center mb-3 pb-2 border-b border-gray-700">
          <h2 className="text-gray-200 font-medium">Flight Control</h2>
        </div>


        {flightInfo ? (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500 text-xs">From</p>
                <p className="text-gray-300">{flightInfo.fromCode}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">To</p>
                <p className="text-gray-300">{flightInfo.toCode}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Distance</p>
                <p className="text-blue-300">{flightInfo.distance} km</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Time</p>
                <p className="text-green-300">{flightInfo.time} h</p>
              </div>
            </div>
            
            {flightProgress > 0 && (
              <FlightProgress progress={flightProgress} flightTime={parseFloat(flightInfo.time)} />
            )}
            
            {countdown !== null && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Arrival in</span>
                  <span className="text-red-300 font-medium">{formatTime(countdown)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-xs italic mb-4">
            Select destination on map to plan route
          </p>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-lg font-medium text-sm transition-colors duration-200 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={!flightInfo || isFlightInProgress}
        >
          {isFlightInProgress ? (
            <>
              Flight in Progress
            </>
          ) : (
            <>
              Plan Flight
            </>
          )}
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController 
          setMapCenter={setMapCenter}
          setMapZoom={setMapZoom}
        />

        {airports.map((airportData, index) => (
          <Marker
            key={index}
            position={[airportData.latitude, airportData.longitude]}
            icon={airportIcon}
            eventHandlers={{
              click: () => handleAirportClick(airportData),
            }}
          >
            <Popup className="custom-popup">
              <div className="text-sm">
                <div className="font-medium text-gray-800">{airportData.fullName}</div>
                <div className="text-gray-600">{airportData.name}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {flightPath.length > 0 && (
          <Polyline 
            positions={flightPath} 
            color="#2563EB" 
            weight={2} 
            dashArray={isFlightInProgress ? null : "5, 5"}
            opacity={0.8}
          />
        )}

        {planePosition && planePosition[0] && planePosition[1] && (
          <Marker position={planePosition} icon={planeIcon} />
        )}
      </MapContainer>
      
      <style>{`
        .plane-icon {
          background: transparent;
          border: none;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 6px;
          padding: 4px;
        }
      `}</style>
    </div>
      );
    }
export default Dashboard;
