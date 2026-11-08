import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Ventas from './pages/Ventas';
import Waiver from './pages/Waiver';
import Reservas from './pages/Reservas';
import ControlAcceso from './pages/ControlAcceso';
import Eventos from './pages/Eventos';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRouter />
    </BrowserRouter>
  );
}

function AppRouter() {
  const [cliente, setCliente] = useState(null);
  const [cart, setCart] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const navigate = useNavigate();
  const handleCompleteLogin = (datosCliente) => {
    setCliente(datosCliente);
    navigate('/'); 
  };

  const handleProcederAlCobro = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    navigate('/ventas', { state: { cart, cliente } });
  };

  return (
    <Routes>
      {/* Ruta pública para que el operador de personal acceda directamente sin login de cliente */}
      <Route path="/control" element={<ControlAcceso />} />

      {/* Si no hay cliente autenticado, mostramos el flujo de inicio / CI */}
      {!cliente ? (
        <Route path="*" element={<FlujoIngresoEstilizado onCompleteLogin={handleCompleteLogin} />} />
      ) : (
        /* Si hay cliente, mostramos el layout completo de la aplicación */
        <Route path="*" element={
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar cart={cart} setCart={setCart} generateInvoice={handleProcederAlCobro} />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home cart={cart} setCart={setCart} cliente={cliente} />} />
                <Route path="/home" element={<Home cart={cart} setCart={setCart} cliente={cliente} />} />
                <Route path="/reservas" element={<Reservas cliente={cliente} cart={cart} setCart={setCart} />} />
                <Route path="/ventas" element={<Ventas cart={cart} setCart={setCart} cliente={cliente} />} />
                <Route path="/waiver" element={<Waiver cliente={cliente} />} />
                <Route path="/control" element={<ControlAcceso />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/admin" element={<Admin invoice={invoice} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            <Footer />
          </div>
        } />
      )}
    </Routes>
  );
}

function FlujoIngresoEstilizado({ onCompleteLogin }) {
  const [paso, setPaso] = useState('ingresoCI');
  const [ciIngresado, setCiIngresado] = useState('');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    fechaNacimiento: ''
  });

  const [firmaRealizada, setFirmaRealizada] = useState(false);
  const [firmaUrl, setFirmaUrl] = useState('');
  const [idExencion, setIdExencion] = useState('');

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (paso === 'waiverFirma' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement.offsetWidth - 40;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, [paso]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setFirmaRealizada(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaRealizada(false);
  };

  const handleBuscarCI = (e) => {
    e.preventDefault();
    if (!ciIngresado) {
      alert('Ingrese un número de CI');
      return;
    }

    const clientesGuardados = JSON.parse(localStorage.getItem('xtremefun_clientes') || '{}');

    if (clientesGuardados[ciIngresado]) {
      const clienteEncontrado = clientesGuardados[ciIngresado];
      onCompleteLogin(clienteEncontrado);
    } else if (ciIngresado === '12345') {
      onCompleteLogin({ ci: '12345', nombre: 'Cliente Frecuente' });
    } else {
      setFormData(prev => ({ ...prev, ci: ciIngresado }));
      setPaso('registroCRM');
    }
  };

  const handleGuardarCRM = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Complete los campos obligatorios.');
      return;
    }
    setPaso('waiverFirma');
  };

  const handleFinalizarFirma = () => {
    if (!firmaRealizada) {
      alert('Debe firmar el waiver para continuar.');
      return;
    }

    let urlFirma = '';
    if (canvasRef.current) {
      urlFirma = canvasRef.current.toDataURL();
      setFirmaUrl(urlFirma);
    }

    const nuevoIdExencion = Math.floor(1000 + Math.random() * 9000).toString();
    setIdExencion(nuevoIdExencion);

    const clienteCompleto = {
      ...formData,
      firma: urlFirma,
      idExencion: nuevoIdExencion,
      fechaRegistro: new Date().toLocaleDateString('es-ES')
    };

    const clientesGuardados = JSON.parse(localStorage.getItem('xtremefun_clientes') || '{}');
    clientesGuardados[formData.ci] = clienteCompleto;
    localStorage.setItem('xtremefun_clientes', JSON.stringify(clientesGuardados));

    setFormData(clienteCompleto);
    setPaso('confirmacion');
  };

  const handleReiniciarFlujo = () => {
    setCiIngresado('');
    setFormData({ ci: '', nombre: '', apellido: '', telefono: '', email: '', fechaNacimiento: '' });
    setFirmaRealizada(false);
    setFirmaUrl('');
    setPaso('ingresoCI');
  };

  const fechaHoy = new Date().toLocaleDateString('es-ES');

  return (
    <div className="app-container" >
      
      {/* BOTÓN SUPERIOR DERECHO: PERSONAL */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button 
          onClick={() => navigate('/control')}
          style={{ background: '#222', color: '#FFD100', border: '1px solid #FFD100', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
        >
          👨‍💼 Personal (Control de Acceso)
        </button>
      </div>

      {paso === 'ingresoCI' && (
        <div className="card-container" style={{ width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '8px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Xtreme<span className="yellow-text">Fun</span></h2>
          <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '20px', color: '#aaa' }}>Ingrese su Cédula de Identidad (CI) para comenzar</p>
          <form onSubmit={handleBuscarCI}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Número de CI:</label>
              <input 
                type="text" 
                value={ciIngresado} 
                onChange={(e) => setCiIngresado(e.target.value)} 
                placeholder="Ej. 10918050" 
                className="input-field"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
              Verificar CI
            </button>
          </form>
        </div>
      )}

      {paso === 'registroCRM' && (
        <div className="card-container" style={{ width: '100%', maxWidth: '450px', padding: '30px', borderRadius: '8px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#FFD100' }}>Registrar Nuevo Cliente</h3>
          <form onSubmit={handleGuardarCRM}>
            <div style={{ marginBottom: '10px' }}>
              <label>CI:</label>
              <input type="text" value={formData.ci} disabled className="input-field" style={{ width: '100%', padding: '8px', opacity: 0.7 }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Nombre:</label>
              <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required className="input-field" style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Apellido:</label>
              <input type="text" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} required className="input-field" style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Teléfono / Celular:</label>
              <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} required className="input-field" style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Correo Electrónico:</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" style={{ width: '100%', padding: '8px' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
              Siguiente: Términos y firma de responsabilidad
            </button>
          </form>
        </div>
      )}

      {paso === 'waiverFirma' && (
        <div className="card-container" style={{ width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '8px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#FFD100' }}>Waiver de Responsabilidad</h3>
          
          <div className="waiver-box" style={{ padding: '15px', height: '120px', overflowY: 'scroll', marginBottom: '15px', border: '1px solid #444', fontSize: '13px', lineHeight: '1.4' }}>
            <p><strong>TÉRMINOS Y CONDICIONES DE USO - XTREMEFUN</strong></p>
            <p>Declaro bajo juramento encontrarme en perfecto estado de salud físico y mental. Eximo de toda responsabilidad civil o penal a la empresa por cualquier eventualidad derivada de la práctica de actividades recreativas extremas...</p>
          </div>

          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <p style={{ fontSize: '13px', margin: 0 }}>Firme dentro del recuadro (Mouse o Dedo):</p>
              <button type="button" onClick={clearSignature} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '12px' }}>Limpiar firma</button>
            </div>
            
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ border: '2px dashed #666', background: '#fff', borderRadius: '4px', cursor: 'crosshair', display: 'block', width: '100%' }}
            />
          </div>

          <button 
            type="button" 
            disabled={!firmaRealizada}
            onClick={handleFinalizarFirma}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '12px', 
              cursor: firmaRealizada ? 'pointer' : 'not-allowed',
              opacity: firmaRealizada ? 1 : 0.5,
              fontWeight: 'bold'
            }}
          >
            Firmar y Registrar
          </button>
        </div>
      )}

      {paso === 'confirmacion' && (
        <div className="card-container" style={{ width: '100%', maxWidth: '520px', padding: '35px', borderRadius: '8px', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', color: '#28a745' }}>📋</span>
            <h2 style={{ margin: 0, fontSize: '22px' }}>Exención Firmada</h2>
          </div>

          <p style={{ fontSize: '16px', marginBottom: '10px' }}>
            El cliente con CI <strong>{formData.ci}</strong> ({formData.nombre} {formData.apellido}) ya se encuentra registrado y ha firmado la exención.
          </p>

          <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>
            ID Exención: {idExencion}
          </p>

          <p style={{ margin: '5px 0 20px 0', fontSize: '14px', color: '#aaa' }}>
            Vigente hasta: {fechaHoy}
          </p>

          {firmaUrl && (
            <div style={{ display: 'inline-block', border: '1px solid #666', borderRadius: '6px', padding: '10px', background: '#fff', marginBottom: '25px', minWidth: '260px' }}>
              <img src={firmaUrl} alt="Firma del cliente" style={{ height: '80px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleReiniciarFlujo}
              style={{ background: '#FFD100', color: '#000', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              Firmar otro
            </button>

            <button 
              type="button" 
              onClick={() => onCompleteLogin(formData)}
              className="btn-primary"
              style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              Ingresar a xtreme Fun
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default App;