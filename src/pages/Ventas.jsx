import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; 
import { procesarPagoPasarela, enviarWhatsAppConfirmacion } from '../services/api';
import './Ventas.css';

const Ventas = ({ cliente: clienteProps }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Capturamos el carrito y el cliente provenientes del state de React Router o props
  const datosCarrito = location.state?.cart || [];
  const clienteActivo = location.state?.cliente || clienteProps;

  // Pasos: 3 (Pago), 4 (Éxito y Ticket), 5 (Vista de Factura para Imprimir)
  const [paso, setPaso] = useState(datosCarrito.length > 0 ? 3 : 1);
  const [metodoPago, setMetodoPago] = useState('');
  
  // Estados de carga de las APIs
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [whatsappExitoso, setWhatsappExitoso] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [facturaGenerada, setFacturaGenerada] = useState(null);

  // Cálculos totales del carrito
  const montoTotalCarrito = datosCarrito.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const detalleItemsTexto = datosCarrito.map(i => `${i.quantity}x ${i.name}`).join(', ');

  // 2. PROCESAR PAGO, DESGLOSAR PASES INDIVIDUALES Y GENERAR TICKET
  const handleProcesarPago = async () => {
    setProcesandoPago(true);
    
    try {
      let transaccion = null;
      if (metodoPago !== 'Efectivo') {
        transaccion = await procesarPagoPasarela(montoTotalCarrito, metodoPago);
      }

      const idVentaGenerado = Math.floor(100000 + Math.random() * 900000);

      // Desglosamos los ítems del carrito en pases individuales independientes para el control de acceso
      const pasesIndividuales = [];
      datosCarrito.forEach((item, index) => {
        for (let q = 0; q < (item.quantity || 1); q++) {
          pasesIndividuales.push({
            idPase: `PASE-${idVentaGenerado}-${index}-${q}`,
            nombre: item.name,
            usado: false,
            fechaUso: null,
            manilla: null
          });
        }
      });

      const nuevaVenta = {
        ventaId: idVentaGenerado,
        cliente: clienteActivo,
        detalleItems: detalleItemsTexto,
        pases: pasesIndividuales, // Array de pases independientes (Ej. Trampolín y Bowling por separado)
        montoTotal: montoTotalCarrito,
        metodoPago: metodoPago,
        transaccionId: transaccion ? transaccion.transaccionId : 'EFECTIVO',
        codigoQR: `XTREME|V:${idVentaGenerado}|CI:${clienteActivo?.ci || 'GEN'}|TOTAL:${montoTotalCarrito}`,
        fecha: new Date().toLocaleString(),
        usado: false 
      };

      // Guardar en el almacenamiento local para que ControlAcceso.jsx lo pueda leer
      try {
        const ventasGuardadas = JSON.parse(localStorage.getItem('xtremefun_ventas') || '{}');
        ventasGuardadas[idVentaGenerado] = nuevaVenta;
        localStorage.setItem('xtremefun_ventas', JSON.stringify(ventasGuardadas));
      } catch (err) {
        console.error("Error al guardar venta en localStorage", err);
      }
      
      setVentaExitosa(nuevaVenta);

      // Generamos el objeto de la factura comercial
      const nuevaFactura = {
        nroFactura: 'FAC-' + idVentaGenerado,
        fecha: nuevaVenta.fecha,
        nitCliente: clienteActivo?.ci || '0000000',
        razonSocial: clienteActivo ? `${clienteActivo.nombre} ${clienteActivo.apellido}` : 'Cliente General',
        items: datosCarrito,
        total: montoTotalCarrito,
        metodoPago: metodoPago,
        transaccionId: nuevaVenta.transaccionId
      };
      setFacturaGenerada(nuevaFactura);

      setPaso(4); // Pantalla de éxito

      if (clienteActivo?.telefono) {
        setEnviandoWhatsApp(true);
        await enviarWhatsAppConfirmacion(
          clienteActivo.telefono, 
          clienteActivo.nombre, 
          nuevaVenta.codigoQR, 
          detalleItemsTexto
        );
        setWhatsappExitoso(true);
      }
      
    } catch (error) {
      alert("Error en el pago: " + error.message);
    } finally {
      setProcesandoPago(false);
      setEnviandoWhatsApp(false);
    }
  };

  // Función para imprimir la factura
  const handleImprimirFactura = () => {
    window.print();
  };

  // Salir al inicio de manera limpia con redirección nativa
  const handleSalirAlInicio = () => {
    localStorage.removeItem('xtremefun_carrito_activo');
    window.location.replace('/');
  };

  return (
    <div className="ventas-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h2 className="module-title">Módulo de Ventas y Cobro (Cajero)</h2>

      {/* PASO 3: Resumen y Pago Directo con el Carrito */}
      {paso === 3 && (
        <div className="card" style={{ background: '#1a1a1a', padding: '25px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3>3. Resumen de Compra y Selección de Pago</h3>
          
          {clienteActivo && (
            <div style={{ background: '#222', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
              <p style={{ margin: 0 }}>Cliente Activo: <strong>{clienteActivo.nombre} {clienteActivo.apellido}</strong> (CI: {clienteActivo.ci})</p>
            </div>
          )}

          <div className="summary" style={{ marginBottom: '20px' }}>
            <p><strong>Ítems en el Carrito:</strong></p>
            <ul style={{ paddingLeft: '20px', color: '#aaa', margin: '5px 0 15px 0' }}>
              {datosCarrito.length > 0 ? (
                datosCarrito.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}x {item.name} - Bs. {(item.price * item.quantity).toFixed(2)}
                  </li>
                ))
              ) : (
                <li>No hay productos seleccionados en el carrito.</li>
              )}
            </ul>
            <p className="total" style={{ fontSize: '18px', color: '#FFD100', fontWeight: 'bold' }}>
              Total a Cobrar: Bs. {montoTotalCarrito.toFixed(2)}
            </p>
          </div>

          <div className="payment-methods">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Seleccionar Método de Pago:</label>
            <div className="payment-options" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMetodoPago('Efectivo')} className={metodoPago === 'Efectivo' ? 'active' : ''} style={{ padding: '10px 20px', background: metodoPago === 'Efectivo' ? '#FFD100' : '#222', color: metodoPago === 'Efectivo' ? '#000' : '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Efectivo</button>
              <button onClick={() => setMetodoPago('QR Simple')} className={metodoPago === 'QR Simple' ? 'active' : ''} style={{ padding: '10px 20px', background: metodoPago === 'QR Simple' ? '#FFD100' : '#222', color: metodoPago === 'QR Simple' ? '#000' : '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>QR Simple</button>
              <button onClick={() => setMetodoPago('Tarjeta')} className={metodoPago === 'Tarjeta' ? 'active' : ''} style={{ padding: '10px 20px', background: metodoPago === 'Tarjeta' ? '#FFD100' : '#222', color: metodoPago === 'Tarjeta' ? '#000' : '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Tarjeta</button>
            </div>
          </div>

          {metodoPago && datosCarrito.length > 0 && (
            <div className="action-area" style={{ marginTop: '20px' }}>
              {metodoPago !== 'Efectivo' && (
                <p className="api-notice" style={{ color: '#FFD100', marginBottom: '10px' }}>🔌 Conectando con Pasarela de Pagos...</p>
              )}
              <button 
                className="btn-yellow btn-large" 
                onClick={handleProcesarPago}
                disabled={procesandoPago}
                style={{ width: '100%', padding: '12px', background: '#FFD100', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
              >
                {procesandoPago ? 'Procesando Transacción...' : 'Confirmar y Generar Ticket'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 4: Pantalla de Éxito y Código QR */}
      {paso === 4 && ventaExitosa && (
        <div className="card success-card" style={{ background: '#1a1a1a', padding: '25px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
          <h3 style={{ color: '#28a745' }}>✅ ¡Venta y Cobro Exitoso!</h3>
          <div className="ticket-receipt" style={{ marginTop: '15px' }}>
            <p><strong>Código de Venta:</strong> #{ventaExitosa.ventaId}</p>
            <p><strong>Transacción:</strong> {ventaExitosa.transaccionId}</p>
            <p><strong>Cliente:</strong> {ventaExitosa.cliente?.nombre} {ventaExitosa.cliente?.apellido}</p>
            <p><strong>Detalle:</strong> {ventaExitosa.detalleItems}</p>
            <p><strong>Monto Total:</strong> Bs. {ventaExitosa.montoTotal.toFixed(2)}</p>
            
            <div className="qr-container" style={{ margin: '20px 0' }}>
              <QRCodeSVG value={ventaExitosa.codigoQR} size={160} />
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>Código QR de acceso generado (Válido para todas las atracciones adquiridas)</p>
            </div>

            <div className="whatsapp-status" style={{ marginBottom: '20px' }}>
              {enviandoWhatsApp ? (
                <p style={{ color: '#FFD100' }}>📱 Enviando confirmación por WhatsApp API...</p>
              ) : whatsappExitoso ? (
                <p className="success-text" style={{ color: '#28a745' }}>✅ Confirmación enviada vía WhatsApp API</p>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setPaso(5)}
                style={{ padding: '12px 20px', background: '#FFD100', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📄 Ver y Imprimir Factura
              </button>

              <button 
                onClick={handleSalirAlInicio}
                style={{ padding: '12px 20px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🚪 Salir al Inicio (Nuevo Cliente)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASO 5: Vista de Factura Comercial para Impresión */}
      {paso === 5 && facturaGenerada && (
        <div className="card invoice-card" style={{ background: '#fff', color: '#000', padding: '30px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '15px', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, color: '#000' }}>XTREMEFUN S.R.L.</h2>
            <p style={{ fontSize: '12px', margin: '5px 0', color: '#555' }}>Parque de Diversiones y Entretenimiento</p>
            <p style={{ fontSize: '12px', margin: 0, color: '#555' }}>NIT: 1029384756 | La Paz - Bolivia</p>
            <h3 style={{ margin: '15px 0 5px 0' }}>FACTURA COMERCIAL</h3>
            <p style={{ fontSize: '14px', margin: 0, fontWeight: 'bold' }}>{facturaGenerada.nroFactura}</p>
          </div>

          <div style={{ fontSize: '13px', marginBottom: '20px' }}>
            <p style={{ margin: '4px 0' }}><strong>Fecha/Hora:</strong> {facturaGenerada.fecha}</p>
            <p style={{ margin: '4px 0' }}><strong>Señor(es):</strong> {facturaGenerada.razonSocial}</p>
            <p style={{ margin: '4px 0' }}><strong>NIT / CI:</strong> {facturaGenerada.nitCliente}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '6px' }}>Cant.</th>
                <th style={{ padding: '6px' }}>Descripción</th>
                <th style={{ padding: '6px', textAlign: 'right' }}>P. Unit.</th>
                <th style={{ padding: '6px', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {facturaGenerada.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px' }}>{item.quantity}</td>
                  <td style={{ padding: '6px' }}>{item.name}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>Bs. {item.price.toFixed(2)}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>Bs. {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', borderTop: '1px solid #000', paddingTop: '10px' }}>
            TOTAL A PAGAR: Bs. {facturaGenerada.total.toFixed(2)}
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '15px', marginBottom: '20px' }}>
            <p style={{ margin: 0 }}>"Esta factura contribuye al desarrollo del país. El uso ilícito será sancionado de acuerdo a ley."</p>
            <p style={{ margin: '5px 0 0 0' }}>Forma de pago: {facturaGenerada.metodoPago}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} className="no-print">
            <button 
              onClick={handleImprimirFactura} 
              style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🖨️ Imprimir Factura
            </button>

            <button 
              onClick={handleSalirAlInicio} 
              style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🚪 Finalizar y Salir al Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;