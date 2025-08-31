import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Cliente from './pages/Cliente';
import Grafo from './pages/Grafo';
import Sistema from './pages/Sistema';

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <nav style={{
          background: '#2c3e50',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <h1 style={{
              color: 'white',
              margin: 0,
              fontSize: '1.5rem'
            }}>
              📊 Analizador de Patrones
            </h1>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <Link 
                to="/" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#34495e'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                Dashboard
              </Link>
              <Link 
                to="/cliente" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#34495e'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                Cliente
              </Link>
              <Link 
                to="/grafo" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#34495e'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                Grafo
              </Link>
              <Link 
                to="/sistema" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#34495e'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                Sistema
              </Link>
            </div>
          </div>
        </nav>
        
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cliente" element={<Cliente />} />
            <Route path="/grafo" element={<Grafo />} />
            <Route path="/sistema" element={<Sistema />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;