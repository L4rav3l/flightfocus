import React from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Landing from "./LandingPage/landing";
import Dashboard from "./Dashboard/Dashboard";
import FlightHistory from "./Dashboard/FlightHistory";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="/history" element={<FlightHistory />} />
            </Routes>
        </Router>
    </React.StrictMode>
);
