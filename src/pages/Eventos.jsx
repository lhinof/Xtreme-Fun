import React, { useState } from 'react';
import { procesarReservaEvento } from '../services/api';
import './Eventos.css';

const paquetes = [
  { id: 1, nombre: 'Básico (2 horas)', precio: 800 },
  { id: 2, nombre: 'Xtreme (3 horas + Comida)', precio: 1500 },
  { id: 3, nombre: 'Premium (4 horas + Kit + Animador)', precio: 2200 },
];

const Eventos = () => {
  const [formData, setFormData] = useState({
    nombreCliente: '',
    telefono: '',
    fecha: '',
    hora: '',
    paqueteId: '',
    invitados: 10
  });
  
  const [procesando, setProcesando] = useState(false);
  const [eventoExitoso, setEventoExitoso] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const paqueteSeleccionado = paquetes.find(p => p.id === parseInt(formData.paqueteId));
  const costoTotal = paqueteSeleccionado ? paqueteSeleccionado.precio : 0;
  const anticipo = costoTotal * 0.5; // 50% de anticipo

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paqueteSeleccionado) return alert("Seleccione un paquete");
    
    setProcesando(true);
    try {
      const datosEvento = {
        ...formData,
        paquete: paqueteSeleccionado.nombre,
        costoTotal: costoTotal
      };
      
      // Simulamos que el coordinador procesa el pago del anticipo en el momento
      const res = await procesarReservaEvento(datosEvento, anticipo);
      setEventoExitoso(res);
    } catch (error) {
      alert("Error al procesar el evento");
    } finally {
      setProcesando(false);
    }
  };

  if (eventoExitoso) {
    return (
      <div className="eventos-container">
        <div className="card success-card">
          <h2>🎉 ¡Evento Reservado!</h2>
          <p><strong>ID Evento:</strong> {eventoExitoso.eventoId}</p>
          <p><strong>Cliente:</strong> {eventoExitoso.nombreCliente}</p>
          <p><strong>Paquete:</strong> {eventoExitoso.paquete}</p>
          <p><strong>Fecha:</strong> {eventoExitoso.fecha} a las {eventoExitoso.hora}</p>
          <hr style={{ margin: '15px 0' }}/>
          <p><strong>Anticipo Pagado:</strong> Bs. {eventoExitoso.anticipoPagado}</p>
          <p><strong>Saldo Pendiente (Pagar en caja):</strong> Bs. {eventoExitoso.saldoPendiente}</p>
          <p style={{ color: 'var(--xtreme-green)', fontWeight: 'bold', marginTop: '10px' }}>
            ✅ Kit de fiesta asignado: {eventoExitoso.kitAsignado}
          </p>
          <button className="btn-yellow mt-20" onClick={() => window.location.reload()}>Nuevo Evento</button>
        </div>
      </div>
    );
  }

  return (
    <div className="eventos-container">
      <h2 className="module-title">Gestión de Eventos y Cumpleaños</h2>
      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <input type="text" name="nombreCliente" placeholder="Nombre del cliente" onChange={handleChange} required />
          <input type="text" name="telefono" placeholder="Teléfono / WhatsApp" onChange={handleChange} required />
          
          <div className="input-group">
            <label>Fecha del Evento:</label>
            <input type="date" name="fecha" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Hora de Inicio:</label>
            <input type="time" name="hora" onChange={handleChange} required />
          </div>

          <div className="input-group full-width">
            <label>Seleccione el Paquete:</label>
            <select name="paqueteId" onChange={handleChange} required>
              <option value="">-- Seleccione --</option>
              {paquetes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} - Bs. {p.precio}</option>
              ))}
            </select>
          </div>

          <div className="input-group full-width">
            <label>Número de Invitados (aprox):</label>
            <input type="number" name="invitados" min="5" max="30" value={formData.invitados} onChange={handleChange} required />
          </div>

          {paqueteSeleccionado && (
            <div className="resumen-pago full-width">
              <p><strong>Costo Total:</strong> Bs. {costoTotal}</p>
              <p><strong>Anticipo a Cobrar (50%):</strong> Bs. {anticipo}</p>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>* El saldo restante se paga el día del evento en caja.</p>
            </div>
          )}

          <button type="submit" className="btn-yellow btn-large full-width" disabled={procesando}>
            {procesando ? 'Procesando Depósito...' : 'Registrar Evento y Cobrar Anticipo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Eventos;