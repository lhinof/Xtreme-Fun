import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ cart = [], setCart, generateInvoice }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calcular la cantidad total de items en el carrito
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  return (
    <nav className="navbar" style={{ flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="logo-container">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 className="logo-text">Xtreme<span className="yellow-text">Fun</span></h1>
        </Link>
      </div>

      <ul className="nav-links" style={{ flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', margin: 0, listStyle: 'none', display: 'flex', gap: '15px' }}>
        <li><Link to="/reservas">Reservas</Link></li>
        <li><Link to="/eventos">Eventos</Link></li>
        <li><Link to="/admin">Panel Admin</Link></li>

        {/* Ícono del Carrito Desplegable */}
        <li style={{ position: 'relative', marginLeft: '10px' }}>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            style={{ 
              background: '#FFD100', 
              color: '#1a1a1a', 
              border: 'none', 
              padding: '8px 12px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🛒 <span style={{ background: '#000', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '12px' }}>{totalItems}</span>
          </button>

          {/* Menú flotante del Carrito */}
          {isOpen && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: '45px', 
              width: '300px', 
              background: '#1a1a1a', 
              color: '#fff', 
              border: '1px solid #444', 
              borderRadius: '8px', 
              boxShadow: '0px 4px 12px rgba(0,0,0,0.4)', 
              padding: '15px', 
              zIndex: 1000,
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Tu Carrito</h4>
              {cart.length === 0 ? (
                <p style={{ margin: '10px 0', color: '#aaa', fontSize: '14px' }}>El carrito está vacío.</p>
              ) : (
                <>
                  <ul style={{ listStyle: 'none', padding: 0, maxHeight: '180px', overflowY: 'auto', margin: '0 0 10px 0' }}>
                    {cart.map((item) => (
                      <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '14px' }}>
                        <span>{item.name} (x{item.quantity})</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontWeight: 'bold', marginTop: '10px', textAlign: 'right', fontSize: '15px' }}>
                    Total: ${calculateTotal()}
                  </div>
                  <button 
                    onClick={() => { generateInvoice(); setIsOpen(false); }} 
                    style={{ width: '100%', marginTop: '12px', padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    realizar el pago
                  </button>
                </>
              )}
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;