import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateUser from './pages/CreateUser';
import UploadImages from './pages/UploadImages';
import UploadVideos from './pages/UploadVideos';
import Categories from './pages/Categories';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-user" element={<CreateUser />} />
            <Route path="/upload-images" element={<UploadImages />} />
            <Route path="/upload-videos" element={<UploadVideos />} />
            <Route path="/categories" element={<Categories />} />
          </Routes>
        </Layout>
      </div>
    </AuthProvider>
  );
}

export default App;
