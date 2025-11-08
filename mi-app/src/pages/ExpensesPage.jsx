import React, { useState } from "react";
import { Link } from "react-router-dom";
import ExpenseForm from "../components/Expenses/ExpenseForm";
import ExpenseTable from "../components/Expenses/ExpenseTable";
import { useExpenses } from "../context/ExpensesProvider";
import LogoutButton from "../components/LogoutButton";
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import "../assets/styles/gastos.css";

export default function ExpensesPage() {
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("all");
  const [showRecurring, setShowRecurring] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pdfPeriod, setPdfPeriod] = useState("complete");
  const [pdfMonth, setPdfMonth] = useState(new Date().getMonth() + 1);
  const [pdfYear, setPdfYear] = useState(new Date().getFullYear());
  const [showPdfModal, setShowPdfModal] = useState(false);
  const { list } = useExpenses();

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date();
  
    let filteredData = list;
    let reportTitle = "Reporte Completo de Finanzas";
    let periodText = "";
  
    if (pdfPeriod === "monthly") {
      filteredData = list.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getMonth() + 1 === parseInt(pdfMonth) &&
          itemDate.getFullYear() === parseInt(pdfYear)
        );
      });
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      reportTitle = "Reporte Mensual";
      periodText = `${monthNames[pdfMonth - 1]} ${pdfYear}`;
    } else if (pdfPeriod === "annual") {
      filteredData = list.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === parseInt(pdfYear);
      });
      reportTitle = "Reporte Anual";
      periodText = `Año ${pdfYear}`;
    }
  
    const totalIngresos = filteredData
      .filter((i) => i.type === "income")
      .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0);
  
    const totalGastos = filteredData
      .filter((i) => i.type === "expense")
      .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0);
  
    const balance = totalIngresos - totalGastos;
  
    // === ENCABEZADO ===
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, 14, 20);
  
    if (periodText) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(periodText, 14, 28);
    }
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${today.toLocaleDateString("es-ES")}`, 14, periodText ? 34 : 28);
  
    // === RESUMEN FINANCIERO ===
    const summaryY = periodText ? 46 : 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen Financiero", 14, summaryY);
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(34, 139, 34);
    doc.text(`Total Ingresos: $${totalIngresos.toFixed(2)}`, 14, summaryY + 8);
  
    doc.setTextColor(220, 53, 69);
    doc.text(`Total Gastos: $${totalGastos.toFixed(2)}`, 14, summaryY + 15);
  
    doc.setTextColor(balance >= 0 ? 34 : 220, balance >= 0 ? 139 : 53, balance >= 0 ? 34 : 69);
    doc.setFont("helvetica", "bold");
    doc.text(`Balance: $${balance.toFixed(2)}`, 14, summaryY + 22);
  
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  
    // === TABLA DE DETALLES ===
    autoTable(doc, {
      head: [["Título", "Categoría", "Tipo", "Monto", "Fecha", "Recurrente"]],
      body: filteredData.map((i) => [
        i.title,
        i.category || "-",
        i.type === "income" ? "Ingreso" : "Gasto",
        `$${Math.abs(i.amount).toFixed(2)}`,
        new Date(i.date).toLocaleDateString("es-ES"),
        i.is_recurring ? `Sí (día ${i.recurrence_day || "-"})` : "No",
      ]),
      startY: summaryY + 30,
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });
  
    const filename =
      pdfPeriod === "complete"
        ? `Reporte_Completo_${today.toISOString().split("T")[0]}.pdf`
        : pdfPeriod === "monthly"
        ? `Reporte_${periodText.replace(/ /g, "_")}.pdf`
        : `Reporte_Anual_${pdfYear}.pdf`;
  
    doc.save(filename);
    setShowPdfModal(false);
  };

  // Filtrar por fecha
  const getFilteredByDate = (data) => {
    if (dateFilter === "custom" && startDate && endDate) {
      return data.filter(item => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    switch(dateFilter) {
      case "today":
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.toDateString() === today.toDateString();
        });
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= weekAgo && itemDate <= today;
        });
      case "month":
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
      case "year":
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === currentYear;
        });
      default:
        return data;
    }
  };

  let filteredList = showRecurring
    ? list.filter((i) => i.is_recurring)
    : list;

  filteredList = getFilteredByDate(filteredList);

  return (
    <div className="expenses-page">
      {/* === NAVBAR === */}
      <nav className="navbar">
        <h2 className="nav-title">Mi Panel</h2>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/gastos">Gastos</Link>
          <Link to="/config">Configuración</Link>
          <LogoutButton />
        </div>
      </nav>

      {/* === CONTENIDO PRINCIPAL === */}
      <div className="expenses-grid">
        {/* === COLUMNA IZQUIERDA === */}
        <aside className="form-column">
          <ExpenseForm />
        </aside>

        {/* === COLUMNA DERECHA === */}
        <main className="table-column">
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input-large"
            />
            
            <div className="filter-controls">
              <select value={type} onChange={(e) => setType(e.target.value)} className="filter-select">
                <option value="all">Todos los tipos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
              </select>

              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-select">
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
                <option value="custom">Rango personalizado</option>
              </select>

              {dateFilter === "custom" && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                    placeholder="Desde"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                    placeholder="Hasta"
                  />
                </>
              )}

              <button
                onClick={() => setShowRecurring(!showRecurring)}
                className="btn-recurring"
                style={{
                  background: showRecurring ? "#0077cc" : "#1e3a8a",
                }}
              >
                {showRecurring ? "Ver Todos" : "Ver Recurrentes"}
              </button>

              <button onClick={() => setShowPdfModal(true)} className="btn-pdf">
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <h3>
                {showRecurring
                  ? "Gastos Recurrentes"
                  : "Historial de Ingresos y Gastos"}
              </h3>
              <span className="record-count">
                {filteredList.length} registro{filteredList.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="table-scroll-area">
              <ExpenseTable
                filter={filter}
                type={type}
                customList={filteredList}
              />
            </div>
          </div>
        </main>
      </div>

      {/* === MODAL PDF === */}
      {showPdfModal && (
        <div className="modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Configurar Reporte PDF</h3>
            
            <div className="modal-form">
              <label>Tipo de reporte:</label>
              <select value={pdfPeriod} onChange={(e) => setPdfPeriod(e.target.value)} className="modal-select">
                <option value="complete">Reporte Completo</option>
                <option value="monthly">Reporte Mensual</option>
                <option value="annual">Reporte Anual</option>
              </select>

              {pdfPeriod === "monthly" && (
                <>
                  <label>Mes:</label>
                  <select value={pdfMonth} onChange={(e) => setPdfMonth(e.target.value)} className="modal-select">
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>

                  <label>Año:</label>
                  <input 
                    type="number" 
                    value={pdfYear} 
                    onChange={(e) => setPdfYear(e.target.value)}
                    className="modal-input"
                    min="2000"
                    max="2100"
                  />
                </>
              )}

              {pdfPeriod === "annual" && (
                <>
                  <label>Año:</label>
                  <input 
                    type="number" 
                    value={pdfYear} 
                    onChange={(e) => setPdfYear(e.target.value)}
                    className="modal-input"
                    min="2000"
                    max="2100"
                  />
                </>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowPdfModal(false)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={generatePDF} className="btn-generate">
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Manuel Lozano & Cristóbal Pérez - Ingenieros de Sistemas</p>
      </footer>
    </div>
  );
}