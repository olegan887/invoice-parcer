
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import AppContent from './AppContent'; // We'll move the main app logic to this component

const App: React.FC = () => {
  return (
    <Router>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppContent />
    </Router>
  );
};

export default App;
