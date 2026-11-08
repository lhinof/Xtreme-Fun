import axios from 'axios';

// --- 1. API DE LA BASE DE DATOS (CLIENTES) ---
export const buscarClientePorCI = async (ci) => {
  // Simulamos la latencia de red
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulamos que el CI "123456" ya existe en la BD
      if (ci === '123456') {
        resolve({ 
          success: true, 
          cliente: { ci: '123456', nombre: 'Juan', apellido: 'Perez', telefono: '+59177777777' } 
        });
      } else {
        resolve({ success: false, cliente: null });
      }
    }, 800);
  });
};

// --- 2. SERVICIO EXTERNO: PASARELA DE PAGOS (Ej. Stripe, BNB, QR Simple) ---
export const procesarPagoPasarela = async (monto, metodoPago) => {
  // Simulamos la llamada a la API externa de pagos
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Lógica simulada: Si el monto es mayor a 0, se aprueba (puedes hacer que falle si quieres probar)
      if (monto > 0) {
        resolve({
          transaccionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          estado: 'Aprobado',
          monto: monto,
          metodo: metodoPago
        });
      } else {
        reject(new Error('Fondos insuficientes o error en la pasarela'));
      }
    }, 2000); // 2 segundos simulando la conexión bancaria
  });
};

// --- 3. SERVICIO EXTERNO: WHATSAPP API (Ej. Twilio o Meta Cloud API) ---
export const enviarWhatsAppConfirmacion = async (telefono, nombreCliente, codigoQR, nombreAtraccion) => {
  // En un caso real, aquí usarías axios.post('https://api.twilio.com/...', { ... })
  
  console.log(`[API WHATSAPP] Conectando con el número ${telefono}...`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mensaje = `¡Hola ${nombreCliente}! 🎉 Tu compra en XtremeFun fue exitosa.\nAtracción: ${nombreAtraccion}\nTu código QR de acceso es: ${codigoQR}\n¡Preséntalo en la entrada!`;
      
      console.log(`[API WHATSAPP] Mensaje enviado: \n${mensaje}`);
      
      resolve({
        success: true,
        messageId: `wamid.${Math.random().toString(36).substring(2, 15)}`,
        mensajeEnviado: mensaje
      });
    }, 1500); // 1.5 segundos simulando el envío
  });
};
// --- 4. API: GUARDAR EXENCIÓN DE RESPONSABILIDAD (Waiver) ---
export const guardarExencionResponsabilidad = async (ci, firmaBase64) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[API CRM] Guardando exención para CI: ${ci}`);
      resolve({
        exencionId: Math.floor(Math.random() * 10000),
        fechaFirma: new Date().toISOString(),
        firmaDigitalUrl: "https://xtremefun.com/firmas/" + ci + ".png", // Simulamos URL de la firma guardada
        vigente: true
      });
    }, 1500);
  });
};
// --- 5. API: CREAR RESERVA EN LÍNEA (Cliente) ---
export const crearReservaOnline = async (datosReserva) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[API RESERVAS] Guardando reserva...", datosReserva);
      resolve({
        reservaId: Math.floor(Math.random() * 10000),
        codigoQR: `RESERVA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        estado: 'Confirmada',
        ...datosReserva
      });
    }, 1500);
  });
};
// --- 6. API: VALIDAR TICKET Y CAPACIDAD (Operador) ---
export const validarAccesoAtraccion = async (codigoQR, atraccionId) => {
  // Simulamos la base de datos de atracciones y sus capacidades actuales
  const capacidades = {
    1: { nombre: 'Trampoline Park', max: 30, actual: 28 },
    2: { nombre: 'Bowling', max: 20, actual: 10 },
    3: { nombre: 'Tirolesa', max: 15, actual: 15 }, // Llena a propósito para probar el rechazo
    4: { nombre: 'Láser Tag', max: 25, actual: 5 },
  };

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const atraccion = capacidades[atraccionId];
      
      if (!atraccion) return reject(new Error("Atracción no válida"));
      if (atraccion.actual >= atraccion.max) {
        return reject(new Error(`Capacidad máxima alcanzada en ${atraccion.nombre}. Turno lleno.`));
      }

      // Simulamos que el código QR es válido si empieza con XTREME o RESERVA
      if (codigoQR.includes('XTREME') || codigoQR.includes('RESERVA')) {
        resolve({
          valido: true,
          mensaje: `Acceso permitido a ${atraccion.nombre}`,
          atraccion: atraccion.nombre,
          pulsera: `PULSERA-${Math.floor(Math.random() * 1000)}`,
          horaIngreso: new Date().toLocaleTimeString()
        });
      } else {
        reject(new Error("Código QR inválido o ya utilizado"));
      }
    }, 1000);
  });
};
// --- 7. API: GESTIÓN DE EVENTOS Y CUMPLEAÑOS ---
export const procesarReservaEvento = async (datosEvento, anticipo) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[API EVENTOS] Procesando depósito de Bs. ${anticipo}...`);
      resolve({
        eventoId: `EVT-${Math.floor(Math.random() * 10000)}`,
        ...datosEvento,
        anticipoPagado: anticipo,
        saldoPendiente: datosEvento.costoTotal - anticipo,
        estado: 'Reservado',
        kitAsignado: datosEvento.paquete
      });
    }, 1500);
  });
};
// --- 8. API: MÉTRICAS Y AFORO MULTI-SUCURSAL ---
export const obtenerMetricasSedes = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulamos la base de datos de las 3 sucursales
      resolve([
        {
          sede: 'Torres Mall',
          aforoMaximo: 500,
          aforoActual: 320,
          atracciones: [
            { nombre: 'Trampoline', ocupacion: 85 }, // %
            { nombre: 'Bowling', ocupacion: 40 },
            { nombre: 'Tirolesa', ocupacion: 90 },
          ]
        },
        {
          sede: 'Megacenter',
          aforoMaximo: 400,
          aforoActual: 150,
          atracciones: [
            { nombre: 'Trampoline', ocupacion: 30 },
            { nombre: 'Láser Tag', ocupacion: 20 },
          ]
        },
        {
          sede: 'Cinebol',
          aforoMaximo: 300,
          aforoActual: 280, // Casi lleno
          atracciones: [
            { nombre: 'Trampoline', ocupacion: 95 },
            { nombre: 'Láser Tag', ocupacion: 80 },
          ]
        }
      ]);
    }, 1000);
  });
};