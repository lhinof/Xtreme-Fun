import React, { useState, useEffect } from 'react';
import './ControlAcceso.css';

const ControlAcceso = () => {
  const [vistaActiva, setVistaActiva] = useState('monitoreo'); 
  const [codigoQR, setCodigoQR] = useState('');
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  // Selector de atracción / paquete en cascada
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState('Trampoline Park');
  const [clientesActivos, setClientesActivos] = useState([]);
  const [alertaVencido, setAlertaVencido] = useState(null);

  useEffect(() => {
    cargarClientesActivos();
    const timer = setInterval(() => {
      setClientesActivos(prev => {
        const ahora = new Date().getTime();
        const activos = JSON.parse(localStorage.getItem('xtremefun_activos_tiempo') || '[]');
        
        for (let c of activos) {
          const transcurrido = Math.floor((ahora - c.tiempoIngresoEpoch) / 1000);
          const restante = c.duracionSegundos - transcurrido;
          if (restante === 0) {
            setAlertaVencido(`⚠️ ¡TIEMPO TERMINADO! Cliente: ${c.nombreCliente} | Manilla: ${c.manilla} (${c.paquete})`);
            setTimeout(() => setAlertaVencido(null), 8000);
          }
        }
        return [...activos];
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const cargarClientesActivos = () => {
    const registrados = JSON.parse(localStorage.getItem('xtremefun_activos_tiempo') || '[]');
    setClientesActivos(registrados);
  };

  // Validar código QR y activar únicamente el pase correspondiente a la atracción seleccionada
  const handleValidar = async (e) => {
    e.preventDefault();
    setValidando(true);
    setResultado(null);
    setError(null);

    try {
      const codigoBuscado = codigoQR ? codigoQR.trim() : '';
      if (!codigoBuscado) {
        throw new Error('Ingrese o escanee un código QR o número de venta válido.');
      }

      let ventasGuardadas = JSON.parse(localStorage.getItem('xtremefun_ventas') || '{}');
      let ventaEncontrada = null;
      let claveId = null;

      const claveEncontrada = Object.keys(ventasGuardadas).find(key => {
        const item = ventasGuardadas[key];
        if (!item) return false;
        return (
          codigoBuscado.includes(key) || 
          (item.codigoQR && item.codigoQR.includes(codigoBuscado)) ||
          (item.ventaId && item.ventaId.toString() === codigoBuscado)
        );
      });

      if (claveEncontrada) {
        claveId = claveEncontrada;
        ventaEncontrada = ventasGuardadas[claveEncontrada];
      }

      if (!ventaEncontrada) {
        throw new Error('El código QR o número de venta no existe en el sistema.');
      }

      // Verificamos si la venta tiene la lista de pases individuales
      let pasesCliente = ventaEncontrada.pases;
      if (!pasesCliente || !Array.isArray(pasesCliente)) {
        // Fallback por si la venta es antigua
        pasesCliente = [{
          idPase: 'PASE-1',
          nombre: ventaEncontrada.detalleItems || 'Acceso General',
          usado: ventaEncontrada.usado || false
        }];
      }

      // Buscamos un pase DISPONIBLE que coincida con la atracción seleccionada en la cascada
      const indicePaseValido = pasesCliente.findIndex(p => 
        !p.usado && p.nombre.toLowerCase().includes(paqueteSeleccionado.toLowerCase())
      );

      if (indicePaseValido === -1) {
        const yaFueUsado = pasesCliente.some(p => p.usado && p.nombre.toLowerCase().includes(paqueteSeleccionado.toLowerCase()));
        if (yaFueUsado) {
          throw new Error(`⚠️ El pase para "${paqueteSeleccionado}" de este QR ya fue UTILIZADO y consumido anteriormente.`);
        } else {
          throw new Error(`❌ Este QR NO incluye un pase disponible para "${paqueteSeleccionado}". Verifique las atracciones compradas.`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const numManilla = 'M-' + Math.floor(100 + Math.random() * 900);
      const fechaIngreso = new Date();
      const duracionSegundos = 3600; // 1 Hora por defecto

      const paseConsumido = pasesCliente[indicePaseValido];

      // Marcamos ÚNICAMENTE este pase como usado e inhabilitado
      pasesCliente[indicePaseValido].usado = true;
      pasesCliente[indicePaseValido].fechaUso = fechaIngreso.toLocaleString();
      pasesCliente[indicePaseValido].manilla = numManilla;

      ventasGuardadas[claveId].pases = pasesCliente;
      localStorage.setItem('xtremefun_ventas', JSON.stringify(ventasGuardadas));

      // Registramos la entrada en los cronómetros activos de la atracción
      const nuevoAccesoActivo = {
        id: ventaEncontrada.ventaId,
        nombreCliente: `${ventaEncontrada.cliente?.nombre || 'Cliente'} ${ventaEncontrada.cliente?.apellido || ''}`,
        ci: ventaEncontrada.cliente?.ci || 'S/N',
        paquete: paseConsumido.nombre,
        manilla: numManilla,
        horaIngreso: fechaIngreso.toLocaleTimeString(),
        tiempoIngresoEpoch: fechaIngreso.getTime(),
        duracionSegundos: duracionSegundos,
        horaSalidaEstimada: new Date(fechaIngreso.getTime() + duracionSegundos * 1000).toLocaleTimeString()
      };

      const actualActivos = JSON.parse(localStorage.getItem('xtremefun_activos_tiempo') || '[]');
      actualActivos.push(nuevoAccesoActivo);
      localStorage.setItem('xtremefun_activos_tiempo', JSON.stringify(actualActivos));
      cargarClientesActivos();

      const pasesPendientes = pasesCliente.filter(p => !p.usado).map(p => p.nombre);

      setResultado({
        mensaje: `¡Pase para "${paseConsumido.nombre}" activado e inhabilitado correctamente!`,
        pulsera: numManilla,
        horaIngreso: fechaIngreso.toLocaleTimeString(),
        detalleVenta: ventaEncontrada,
        pasesPendientes: pasesPendientes
      });

      setCodigoQR('');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al validar el acceso.');
    } finally {
      setValidando(false);
    }
  };

  const handleFinalizarEstadia = (manillaId) => {
    const actualActivos = JSON.parse(localStorage.getItem('xtremefun_activos_tiempo') || '[]');
    const filtrados = actualActivos.filter(item => item.manilla !== manillaId);
    localStorage.setItem('xtremefun_activos_tiempo', JSON.stringify(filtrados));
    setClientesActivos(filtrados);
  };

  return (
    <div className="control-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <h2 className="module-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Control de Acceso y Monitoreo de Tiempos</h2>
      
      {/* ALERTA FLOTANTE DE TIEMPO VENCIDO */}
      {alertaVencido && (
        <div style={{ background: '#E3000F', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center', fontSize: '16px', border: '2px solid #fff' }}>
          {alertaVencido}
        </div>
      )}

      {/* BARRA SUPERIOR: SELECTOR EN CASCADA Y BOTÓN DE INGRESO */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#222', padding: '6px 15px', borderRadius: '6px', border: '1px solid #444' }}>
          <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>Atracción Actual:</span>
          <select 
            value={paqueteSeleccionado} 
            onChange={(e) => {
              setPaqueteSeleccionado(e.target.value);
              setVistaActiva('monitoreo');
            }}
            style={{ padding: '8px 12px', background: '#111', color: '#FFD100', border: '1px solid #555', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            <option value="Trampoline Park">Trampoline Park</option>
            <option value="Bowling">Bowling</option>
            <option value="Tirolesa">Tirolesa</option>
            <option value="Láser Tag">Láser Tag</option>
          </select>
        </div>

        <button 
          onClick={() => setVistaActiva(vistaActiva === 'escanear' ? 'monitoreo' : 'escanear')}
          style={{ 
            padding: '12px 25px', 
            background: vistaActiva === 'escanear' ? '#FFD100' : '#333', 
            color: vistaActiva === 'escanear' ? '#000' : '#FFD100', 
            border: '1px solid #FFD100', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            fontSize: '15px' 
          }}
        >
          {vistaActiva === 'escanear' ? '⬅️ Volver al Monitoreo' : `📷 Escanear QR para ${paqueteSeleccionado}`}
        </button>

      </div>

      {/* VISTA 1: MONITOREO DE TIEMPOS (POR DEFECTO AL ENTRAR) */}
      {vistaActiva === 'monitoreo' && (
        <div className="card" style={{ background: '#1a1a1a', padding: '25px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{ marginTop: 0, color: '#FFD100' }}>Monitoreo en Vivo: {paqueteSeleccionado}</h3>
          <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>Clientes activos disfrutando de esta atracción en este momento.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {clientesActivos.filter(c => c.paquete.toLowerCase().includes(paqueteSeleccionado.toLowerCase())).length === 0 ? (
              <p style={{ color: '#777', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>No hay clientes activos en esta atracción actualmente.</p>
            ) : (
              clientesActivos
                .filter(c => c.paquete.toLowerCase().includes(paqueteSeleccionado.toLowerCase()))
                .map((cliente, idx) => {
                  const ahora = new Date().getTime();
                  const transcurrido = Math.floor((ahora - cliente.tiempoIngresoEpoch) / 1000);
                  const restante = cliente.duracionSegundos - transcurrido;
                  const minutos = Math.floor(Math.abs(restante) / 60);
                  const segundos = Math.abs(restante) % 60;
                  const estaVencido = restante <= 0;

                  return (
                    <div key={idx} style={{ background: estaVencido ? '#3b1414' : '#222', border: `2px solid ${estaVencido ? '#E3000F' : '#444'}`, padding: '20px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ background: '#FFD100', color: '#000', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>{cliente.manilla}</span>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>CI: {cliente.ci}</span>
                      </div>

                      <h4 style={{ margin: '8px 0', fontSize: '18px', color: '#fff' }}>{cliente.nombreCliente}</h4>
                      <p style={{ fontSize: '12px', color: '#ccc', margin: '4px 0' }}><strong>Paquete:</strong> {cliente.paquete}</p>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: '4px 0' }}>Ingreso: {cliente.horaIngreso} | Salida: {cliente.horaSalidaEstimada}</p>

                      <div style={{ marginTop: '15px', background: '#111', padding: '12px', borderRadius: '6px', textAlign: 'center', border: `1px solid ${estaVencido ? '#E3000F' : '#333'}` }}>
                        <span style={{ fontSize: '11px', color: estaVencido ? '#ff6b6b' : '#aaa', display: 'block', marginBottom: '3px' }}>
                          {estaVencido ? '⚠️ TIEMPO EXCEDIDO:' : '⏱️ TIEMPO RESTANTE:'}
                        </span>
                        <span style={{ fontSize: '22px', fontWeight: 'bold', color: estaVencido ? '#ff4d4d' : '#28a745' }}>
                          {estaVencido ? '-' : ''}{String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleFinalizarEstadia(cliente.manilla)}
                        style={{ width: '100%', marginTop: '15px', background: '#333', color: '#fff', border: '1px solid #555', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        Terminar / Retirar Manilla
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: FORMULARIO DE ESCANEO / INGRESO */}
      {vistaActiva === 'escanear' && (
        <div className="card" style={{ background: '#1a1a1a', padding: '25px', borderRadius: '8px', border: '1px solid #333', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginTop: 0, color: '#FFD100' }}>Validación de Pase para: <span style={{ color: '#fff' }}>{paqueteSeleccionado}</span></h3>
          <form onSubmit={handleValidar} className="form-group">
            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Escanear / Ingresar Código QR del Ticket o ID de Venta:</label>
              <input 
                type="text" 
                value={codigoQR} 
                onChange={(e) => setCodigoQR(e.target.value)} 
                placeholder="Ej. XTREME|V:1234... o ID de Venta" 
                required 
                autoFocus
                style={{ width: '100%', padding: '12px', borderRadius: '4px', background: '#222', color: '#fff', border: '1px solid #444', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" disabled={validando} style={{ width: '100%', padding: '12px', background: '#FFD100', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {validando ? 'Validando Pase...' : `Validar e Inhabilitar Pase de ${paqueteSeleccionado}`}
            </button>
          </form>

          {resultado && (
            <div className="card success-card mt-20" style={{ background: '#222', border: '1px solid #28a745', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
              <h3 style={{ color: '#28a745', marginTop: 0 }}>✅ Pase Activado con Éxito</h3>
              <p>{resultado.mensaje}</p>
              
              <div className="ticket-info" style={{ background: '#111', padding: '15px', borderRadius: '6px', marginTop: '10px', fontSize: '14px' }}>
                <p><strong>Cliente:</strong> {resultado.detalleVenta.cliente?.nombre} {resultado.detalleVenta.cliente?.apellido}</p>
                <p><strong>Manilla Asignada:</strong> <span style={{ color: '#FFD100', fontWeight: 'bold', fontSize: '16px' }}>{resultado.pulsera}</span></p>
                <p><strong>Hora de Ingreso:</strong> {resultado.horaIngreso}</p>

                {resultado.pasesPendientes && resultado.pasesPendientes.length > 0 ? (
                  <div style={{ marginTop: '10px', padding: '8px', background: '#1e2b1e', borderRadius: '4px', border: '1px solid #28a745' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#85d996' }}><strong>Otros pases aún disponibles en este QR:</strong></p>
                    <ul style={{ margin: '5px 0 0 15px', padding: 0, fontSize: '12px', color: '#fff' }}>
                      {resultado.pasesPendientes.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>🔒 Todos los pases de este QR han sido consumidos.</p>
                )}
              </div>

              <button 
                onClick={() => setVistaActiva('monitoreo')} 
                style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#FFD100', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Ver en Cuadro de Control ({paqueteSeleccionado})
              </button>
            </div>
          )}

          {error && (
            <div className="card error-card mt-20" style={{ background: '#222', border: '1px solid #E3000F', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
              <h3 style={{ color: '#E3000F', marginTop: 0 }}>❌ Acceso Denegado</h3>
              <p style={{ fontSize: '15px', lineHeight: '1.4' }}>{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlAcceso;