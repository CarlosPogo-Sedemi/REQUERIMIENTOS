/*
"use client";
import { useEffect, useState } from 'react';
import { useMsal } from "@azure/msal-react";
import './dashboard.css';

export default function ZohoDashboard() {
  const { instance } = useMsal();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch('/api/test-zoho')
      .then(res => res.json())
      .then(data => {
        if (data.empresas) setEmpresas(data.empresas);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  const empresasFiltradas = empresas.filter(emp =>
    (emp.nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
    (emp.ruc?.toString().includes(busqueda))
  );

  return (
    <div className="dashboard-container">

      //Navigation TopBar 
      <nav className="top-nav">
        <div className="nav-left">
          <button className="back-button" onClick={() => window.location.href = "/dashboard"}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
            </svg>
            Volver al Panel
          </button>
        </div>
        <div className="nav-right">
          <button className="logout-button" onClick={() => instance.logoutRedirect()}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-content">

        //* Header
        <header className="dashboard-header">
          <div className="brand-info">
            <div className="brand-section">
              <div className="brand-logo">S</div>
              <h1 className="brand-title">Panel de Auditoría <span>Sedemi</span></h1>
            </div>
            <p className="subtitle">Gestión centralizada de cuentas y cumplimiento tributario</p>
          </div>
          <div className="sync-status">
            <span className="pulse-dot"></span>
            <span className="text-slate-700 font-semibold text-sm">
              Sincronizado: <span className="text-blue-600">{empresas.length} registros</span>
            </span>
          </div>
        </header>

        //* Search 
        <div className="search-container">
          <div className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por Razón Social o RUC..."
            className="search-input"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        //Table Container
        <div className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Información General</th>
                  <th>Contacto y Web</th>
                  <th>Finanzas y Sector</th>
                  <th style={{ textAlign: 'center' }}>Estado Auditoría</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '6rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                      Conectando con Zoho CRM...
                    </td>
                  </tr>
                ) : empresasFiltradas.length > 0 ? (
                  empresasFiltradas.map((emp) => (
                    <tr key={emp.id} className="table-row">

                      //Name and RUC
                      <td>
                        <span className="emp-name">{emp.nombre}</span>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="emp-ruc-label">RUC</span>
                          <span className="emp-ruc-value">{emp.ruc || '0000000000001'}</span>
                        </div>
                      </td>

                      //Contact Info
                      <td>
                        <div className="contact-item">
                          <span>📞</span> {emp.telefono || 'Sin teléfono'}
                        </div>
                        <a
                          href={emp.web?.startsWith('http') ? emp.web : `https://${emp.web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="web-link"
                        >
                          <span>🌐</span> {emp.web || 'No disponible'}
                        </a>
                      </td>

                      //Finance and Sector
                      <td>
                        <div className="finance-value">
                          {emp.ingresos ? `$${emp.ingresos.toLocaleString()}` : '$0.00'}
                        </div>
                        <div className="sector-tag">
                          <span className="sector-dot"></span>
                          <span className="sector-name">{emp.sector || 'General'}</span>
                        </div>
                      </td>

                      //Status
                      <td>
                        <span className={`status-badge ${emp.calificacion === 'Activo' ? 'status-active' : 'status-pending'}`}>
                          {emp.calificacion || 'Pendiente'}
                        </span>
                        <span className="emp-id">ID: {emp.id?.slice(-6) || 'N/A'}</span>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                      No se encontraron resultados para "{busqueda}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
  */

"use client";
import { useEffect, useState } from 'react';
import './dashboard.css';

export default function ZohoDashboard() {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    fetch('/api/oportunidades')
      .then(res => res.json())
      .then(data => {
        if (data.oportunidades) setDatos(data.oportunidades);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando oportunidades:", err);
        setLoading(false);
      });
  }, []);

  const datosFiltrados = datos.filter(item =>
    item.cliente?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.ruc?.includes(filtro)
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        {/* Encabezado Simple */}
        <header className="dashboard-header">
          <div className="brand-info">
            <h1 className="brand-title">Oportunidades <span>Zoho CRM</span></h1>
            <p className="subtitle">Seguimiento de adjudicaciones y pérdidas - SEDEMI</p>
          </div>
          <div className="sync-status">
            <span className="text-slate-700 font-semibold text-sm">
              Total: <span className="text-blue-600">{datos.length} registros</span>
            </span>
          </div>
        </header>

        {/* Buscador */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Filtrar por Cliente o RUC...."
            className="search-input"
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {/* Tabla de Oportunidades */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente / RUC</th>
                  <th>Descripción del Proyecto</th>
                  <th>Oficina / Fecha</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-20 italic color-slate-400">
                      Obteniendo datos de Zoho...
                    </td>
                  </tr>
                ) : datosFiltrados.length > 0 ? (
                  datosFiltrados.map((op) => (
                    <tr key={op.id} className="table-row">
                      <td>
                        <span className="emp-name" style={{ display: 'block', fontWeight: 'bold' }}>
                          {op.cliente}
                        </span>
                        <span className="emp-ruc-value" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          RUC: {op.ruc}
                        </span>
                      </td>
                      <td style={{ maxWidth: '350px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.2' }}>
                          {op.descripcion}
                        </div>
                      </td>
                      <td>
                        <div className="sector-tag" style={{ marginBottom: '4px' }}>
                          {op.oficina}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Actualizado: {op.fecha}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${op.estado === 'Adjudicada' ? 'status-active' : 'status-pending'}`}>
                          {op.estado.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-10">No se encontraron resultados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}