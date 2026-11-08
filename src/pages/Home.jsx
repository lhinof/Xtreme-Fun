import React, { useState } from 'react';
import './Home.css';

// Catálogo de la tienda para el Home
const catalogoTienda = {
  paquetes: [
    { id: 101, name: 'Trampoline Park (1 Hora)', price: 50, desc: 'Acceso a todas las zonas de salto', category: 'Paquete' },
    { id: 102, name: 'Bowling (1 Turno)', price: 40, desc: 'Incluye alquiler de calzados', category: 'Paquete' },
    { id: 103, name: 'Tirolesa Extrema', price: 60, desc: 'Un descenso completo con equipo', category: 'Paquete' },
    { id: 104, name: 'Láser Tag (1 Partida)', price: 45, desc: 'Juego por equipos de 15 minutos', category: 'Paquete' },
  ],
  snacks: [
    { id: 201, name: 'Pipocas Grandes', price: 15, desc: 'Porción grande ideal para compartir', category: 'Snack' },
    { id: 202, name: 'Papas Fritas', price: 12, desc: 'Crujientes papas fritas con salsas', category: 'Snack' },
    { id: 203, name: 'Nachos con Queso', price: 20, desc: 'Nachos bañados en cheddar fundido', category: 'Snack' },
    { id: 204, name: 'Hot Dog Especial', price: 18, desc: 'Salchicha ahumada, papas hilo y salsas', category: 'Snack' },
  ],
  bebidas: [
    { id: 301, name: 'Agua Mineral 500ml', price: 6, desc: 'Sin gas o con gas', category: 'Bebida' },
    { id: 302, name: 'Gaseosa Personal 500ml', price: 8, desc: 'Coca-Cola, Sprite o Fanta', category: 'Bebida' },
    { id: 303, name: 'Energizante Red Bull', price: 22, desc: 'Lata de 250ml', category: 'Bebida' },
    { id: 304, name: 'Jugo Natural de Fruta', price: 10, desc: 'Sabores de temporada en vaso', category: 'Bebida' },
  ],
  bar: [
    { id: 401, name: 'Cerveza Artesanal', price: 25, desc: 'Botella 330ml', category: 'Bar' },
    { id: 402, name: 'Cocktail Xtreme', price: 35, desc: 'Bebida especial de la casa', category: 'Bar' },
    { id: 403, name: 'Fernet con Coca', price: 30, desc: 'Vaso preparado tradicional', category: 'Bar' },
    { id: 404, name: 'Mojito Cubano', price: 32, desc: 'Ron, menta fresca y limón', category: 'Bar' },
  ]
};

const Home = ({ cart, setCart, cliente }) => {
  const [categoriaActiva, setCategoriaActiva] = useState('paquetes');
  const [mensajeAlerta, setMensajeAlerta] = useState('');

  // Función para agregar productos al carrito global
  const handleAddToCart = (producto) => {
    setCart((prevCart) => {
      const existe = prevCart.find((item) => item.id === producto.id);
      if (existe) {
        return prevCart.map((item) =>
          item.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...producto, quantity: 1 }];
    });

    setMensajeAlerta(`¡"${producto.name}" agregado al carrito!`);
    setTimeout(() => setMensajeAlerta(''), 2500);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Sección Hero / Diseño Original */}
      <main className="home-container">
        {/* Sección Izquierda: Textos y Botones */}
        <div className="hero-text-section">
          <span className="tagline">✨ PARQUE DE DIVERSIONES - BOLIVIA</span>
          
          <h1 className="hero-title">
            MÁS JUEGOS.<br />
            MÁS EMOCIÓN.<br />
            <span className="highlight-yellow">MÁS XTREME.</span>
          </h1>
          
          <p className="hero-description">
            Salta, juega, compite y celebra en Xtreme Fun, tu parque de diversiones en La Paz y El Alto. ¡Hay mucho por descubrir!
          </p>

          {cliente && (
            <p style={{ color: '#FFD100', fontSize: '14px', marginBottom: '10px' }}>
              Cliente activo: <strong>{cliente.nombre} {cliente.apellido}</strong> (CI: {cliente.ci})
            </p>
          )}

          {mensajeAlerta && (
            <div style={{ background: '#28a745', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px', display: 'inline-block' }}>
              {mensajeAlerta}
            </div>
          )}

          <div className="buttons-container">
            <button className="btn-yellow" onClick={() => document.getElementById('seccion-tienda').scrollIntoView({ behavior: 'smooth' })}>
              Encuentra tu diversión ↗
            </button>
          </div>

          <div className="links-container">
            <a href="#cumpleanos" className="link-underline">Quiero celebrar ↗</a>
            <div className="sucursales-info">
              <p>Más formas de divertirte</p>
              <h3>3 sucursales para elegir</h3>
            </div>
          </div>
        </div>

        {/* Sección Derecha: Collage de Imágenes */}
        <div className="hero-images-section">
          <div className="image-collage">
            <div className="image-box img-1">
              <span className="badge-red">¡OTRA VEZ!</span>
            </div>
            <div className="image-box img-2">
              <span className="badge-yellow">CERO<br/>RUTINA</span>
            </div>
            <div className="image-box img-3">
              <span className="badge-green">ATRÉVETE A MÁS</span>
            </div>
          </div>
        </div>
      </main>

      {/* Sección Agregada: Tienda Interactiva de Paquetes, Snacks, Bebidas y Bar */}
      <section id="seccion-tienda" style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#FFD100', fontSize: '28px' }}>Tienda y Paquetes XtremeFun</h2>
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '25px', fontSize: '14px' }}>Selecciona los planes de tiempo, snacks o bebidas para agregarlos a tu carrito de compras.</p>

        {/* Botones de Categorías */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setCategoriaActiva('paquetes')}
            style={{
              padding: '10px 20px',
              background: categoriaActiva === 'paquetes' ? '#FFD100' : '#1e1e1e',
              color: categoriaActiva === 'paquetes' ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ⏱️ Paquetes de Tiempo
          </button>

          <button 
            onClick={() => setCategoriaActiva('snacks')}
            style={{
              padding: '10px 20px',
              background: categoriaActiva === 'snacks' ? '#FFD100' : '#1e1e1e',
              color: categoriaActiva === 'snacks' ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🍿 Snacks
          </button>

          <button 
            onClick={() => setCategoriaActiva('bebidas')}
            style={{
              padding: '10px 20px',
              background: categoriaActiva === 'bebidas' ? '#FFD100' : '#1e1e1e',
              color: categoriaActiva === 'bebidas' ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🥤 Bebidas
          </button>

          <button 
            onClick={() => setCategoriaActiva('bar')}
            style={{
              padding: '10px 20px',
              background: categoriaActiva === 'bar' ? '#FFD100' : '#1e1e1e',
              color: categoriaActiva === 'bar' ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🍹 Bar
          </button>
        </div>

        {/* Grid de Productos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {catalogoTienda[categoriaActiva].map((item) => (
            <div 
              key={item.id} 
              style={{ 
                background: '#1a1a1a', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', background: '#333', padding: '3px 8px', borderRadius: '4px', color: '#FFD100', textTransform: 'uppercase' }}>{item.category}</span>
                <h4 style={{ margin: '12px 0 8px 0', color: '#fff', fontSize: '16px' }}>{item.name}</h4>
                <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 15px 0', minHeight: '35px' }}>{item.desc}</p>
              </div>

              <div>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFD100', margin: '0 0 12px 0' }}>
                  Bs. {item.price.toFixed(2)}
                </p>
                <button 
                  onClick={() => handleAddToCart(item)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    background: '#FFD100',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  🛒 Agregar al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;