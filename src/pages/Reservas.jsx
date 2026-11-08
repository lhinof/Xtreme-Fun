import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { crearReservaOnline } from '../services/api';
import './Reservas.css';

const atraccionesReserva = [
  { id: 1, nombre: 'Trampoline Park', precio: 50 },
  { id: 2, nombre: 'Bowling', precio: 40 },
  { id: 3, nombre: 'Tirolesa', precio: 60 },
  { id: 4, nombre: 'Láser Tag', precio: 45 },
];

const Reservas = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fecha: '',
    hora: '',
    atraccionId: '',
    personas: 1
  });
  const [reservando, setReservando] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.atraccionId) return alert("Seleccione una atracción");
    
    setReservando(true);
    try {
      const atraccion = atraccionesReserva.find(a => a.id === parseInt(formData.atraccionId));
      const total = atraccion.precio * formData.personas;
      
      const res = await crearReservaOnline({ ...formData, atraccion: atraccion.nombre, total });
      setReservaExitosa(res);
    } catch (error) {
      alert("Error al procesar la reserva");
    } finally {
      setReservando(false);
    }
  };

  if (reservaExitosa) {
    return (
      <div className="reserva-container">
        <div className="card success-card">
          <h2>🎉 ¡Reserva Confirmada!</h2>
          <p>Hola <strong>{reservaExitosa.nombre}</strong>, tu reserva para <strong>{reservaExitosa.atraccion}</strong> el día <strong>{reservaExitosa.fecha}</strong> a las <strong>{reservaExitosa.hora}</strong> está lista.</p>
          <div className="qr-container">
            <QRCodeSVG value={reservaExitosa.codigoQR} size={180} />
            <p>Muestra este código en recepción</p>
          </div>
          <p><strong>Total a pagar en caja:</strong> Bs. {reservaExitosa.total}</p>
          <button className="btn-yellow" onClick={() => window.location.reload()}>Hacer otra reserva</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reserva-container">
      <h2 className="module-title">Reserva tu Aventura</h2>
      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <input type="text" name="nombre" placeholder="Nombre completo" onChange={handleChange} required />
          <input type="text" name="telefono" placeholder="WhatsApp" onChange={handleChange} required />
          
          <div className="input-group">
            <label>Fecha de visita:</label>
            <input type="date" name="fecha" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Hora:</label>
            <input type="time" name="hora" onChange={handleChange} required />
          </div>

          <div className="input-group full-width">
            <label>Selecciona la Atracción:</label>
            <select name="atraccionId" onChange={handleChange} required>
              <option value="">-- Elige --</option>
              {atraccionesReserva.map(att => (
                <option key={att.id} value={att.id}>{att.nombre} (Bs. {att.precio} por persona)</option>
              ))}
            </select>
          </div>

          <div className="input-group full-width">
            <label>Número de personas:</label>
            <input type="number" name="personas" min="1" max="10" value={formData.personas} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn-yellow btn-large" disabled={reservando}>
            {reservando ? 'Procesando Reserva...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reservas;