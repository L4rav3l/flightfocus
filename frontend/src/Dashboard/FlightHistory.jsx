import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FlightHistory = () => {
  const [history, setHistory] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
    fetchAirports();
  }, []);

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
  });

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get('https://flightfocus.marcellh.me/api/boarding/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setHistory(response.data);
    } catch (err) {
      setError('Failed to load flight history');
      console.error('Error fetching history:', err);
    }
  };

  const fetchAirports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get('https://flightfocus.marcellh.me/api/boarding/airport', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setAirports(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load airports');
      console.error('Error fetching airports:', err);
      setLoading(false);
    }
  };

  const getAirportStatus = (airportCode) => {
    const hasVisited = history.some(flight => 
      flight.arrival === airportCode || flight.departure === airportCode
    );
    return hasVisited ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Flight History & Airports</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-800 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Flight History</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              {history.length === 0 ? (
                <p className="text-gray-400">No flight history available</p>
              ) : (
                <div className="space-y-3">
                  {history.map((flight, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-300 font-medium">{flight.departure}</span>
                        <span className="text-green-300 font-medium">{flight.arrival}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        Arrived: {formatDate(flight.arrivaldate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Airports Status</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {airports.map((airport) => (
                  <div
                    key={airport.name}
                    className={`p-3 rounded-lg border-2 ${getAirportStatus(airport.name)}`}
                  >
                    <p className="font-medium text-gray-800">{airport.name}</p>
                    <p className="text-sm text-gray-600">{airport.fullName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightHistory;