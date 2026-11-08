import React, { useState, useEffect } from 'react';
import { obtenerMetricasSedes } from '../services/api';
import './Admin.css';

const Admin = () => {
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
    // Simulamos actualización en tiempo real cada 15 segundos
    const intervalo = setInterval(cargarDatos, 15000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await obtenerMetricasSedes();
      setSedes(data);
      setCargando(false);
    } catch (error) {
      console.error("Error cargando métricas");
    }
  };

  const getColorOcupacion = (porcentaje) => {
    if (porcentaje >= 90) return '#E3000F'; // Rojo
    if (porcentaje >= 70) return '#F39C12'; // Naranja
    return '#008A3E'; // Verde
  };

  if (cargando) return <div className="admin-container"><h2 className="module-title">Cargando Panel...</h2></div>;

  return (
    <div className="admin-container">
      <h2 className="module-title">Panel Central - Gerencia</h2>
      
      <div className="dashboard-grid">
        {sedes.map((sede, index) => {
          const porcentajeAforo = (sede.aforoActual / sede.aforoMaximo) * 100;
          
          return (
            <div key={index} className="sede-card">
              <h3>{sede.sede}</h3>
              <div className="aforo-header">
                <span>Aforo: {sede.aforoActual} / {sede.aforoMaximo}</span>
                <span style={{ color: getColorOcupacion(porcentajeAforo), fontWeight: 'bold' }}>
                  {Math.round(porcentajeAforo)}%
                </span>
              </div>
              
              {/* Barra de progreso del aforo general */}
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${porcentajeAforo}%`, backgroundColor: getColorOcupacion(porcentajeAforo) }}
                ></div>
              </div>

              <div className="atracciones-stats">
                <h4>Estado por Atracción:</h4>
                {sede.atracciones.map((att, i) => (
                  <div key={i} className="att-row">
                    <span>{att.nombre}</span>
                    <div className="mini-bar-bg">
                      <div 
                        className="mini-bar-fill" 
                        style={{ width: `${att.ocupacion}%`, backgroundColor: getColorOcupacion(att.ocupacion) }}
                      ></div>
                    </div>
                    <span>{att.ocupacion}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;