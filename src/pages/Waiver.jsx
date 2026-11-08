import React, { useRef, useState } from 'react';
import { guardarExencionResponsabilidad } from '../services/api';
import './Waiver.css';

const Waiver = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ciCliente, setCiCliente] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [waiverGuardado, setWaiverGuardado] = useState(null);

  // --- LÓGICA PARA DIBUJAR LA FIRMA ---
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- ENVIAR A LA API ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ciCliente) return alert("Por favor, ingrese su CI.");
    
    // Verificar que haya firmado (si el canvas está vacío, es una validación simple)
    const canvas = canvasRef.current;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      return alert("Por favor, firme en el recuadro.");
    }

    setGuardando(true);
    try {
      // Convertimos el dibujo a una imagen Base64
      const firmaBase64 = canvas.toDataURL('image/png');
      const res = await guardarExencionResponsabilidad(ciCliente, firmaBase64);
      setWaiverGuardado(res);
    } catch (error) {
      alert("Error al guardar la firma");
    } finally {
      setGuardando(false);
    }
  };

  // --- RENDERIZADO ---
  if (waiverGuardado) {
    return (
      <div className="waiver-container">
        <div className="success-card">
          <h2>✅ Exención Firmada</h2>
          <p>El cliente con CI <strong>{ciCliente}</strong> ha firmado la exención de responsabilidad.</p>
          <p><strong>ID Exención:</strong> {waiverGuardado.exencionId}</p>
          <p><strong>Vigente hasta:</strong> {new Date(waiverGuardado.fechaFirma).toLocaleDateString()}</p>
          <img src={canvasRef.current.toDataURL()} alt="Firma" className="firma-preview" />
          <button className="btn-yellow" onClick={() => window.location.reload()}>Firmar otro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="waiver-container">
      <h2 className="module-title">Exención de Responsabilidad Digital</h2>
      <div className="card">
        <p className="legal-text">
          Yo, el abajo firmante, acepto los riesgos inherentes a las actividades físicas en XtremeFun. Declaro que me encuentro en buen estado de salud y eximo al parque de cualquier responsabilidad por lesiones menores o accidentes ocurridos durante el uso de las atracciones.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Carnet de Identidad (CI):</label>
            <input 
              type="text" 
              value={ciCliente} 
              onChange={(e) => setCiCliente(e.target.value)} 
              placeholder="Ingrese su CI para vincular la firma"
              required 
            />
          </div>

          <div className="canvas-container">
            <label>Firme aquí con el mouse o dedo:</label>
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="signature-pad"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              // Soporte para pantallas táctiles
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const rect = canvas.getBoundingClientRect();
                ctx.beginPath();
                ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                setIsDrawing(true);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                if (!isDrawing) return;
                const touch = e.touches[0];
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const rect = canvas.getBoundingClientRect();
                ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                ctx.stroke();
              }}
              onTouchEnd={stopDrawing}
            />
            <button type="button" className="btn-clear" onClick={clearCanvas}>Limpiar Firma</button>
          </div>

          <button type="submit" className="btn-yellow btn-large" disabled={guardando}>
            {guardando ? 'Guardando en CRM...' : 'Firmar y Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Waiver;