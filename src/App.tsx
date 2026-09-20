/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { PassengerDashboard } from './pages/PassengerDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login/:type" element={<Login />} />
          
          <Route 
            path="passenger" 
            element={
              <ProtectedRoute allowedRole="ROLE_PASSENGER">
                <PassengerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="staff" 
            element={
              <ProtectedRoute allowedRole="ROLE_STAFF">
                <StaffDashboard />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}
