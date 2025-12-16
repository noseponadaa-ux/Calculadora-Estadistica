// ============================================
// CALCULADORA ESTADÍSTICA - JAVASCRIPT COMPLETO
// Con todas las funcionalidades mejoradas
// ============================================

// ========== CONFIGURACIÓN GLOBAL ==========
const MAX_HISTORY = 5;
let historialCalculos = [];
let chartInstances = {};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    cargarHistorialDesdeStorage();
    inicializarEventListeners();
});

function inicializarEventListeners() {
    // Prevenir envío de formularios
    document.addEventListener('submit', function(e) {
        e.preventDefault();
    });
}

// ========== UTILIDADES GENERALES ==========

// Mostrar toast notification
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${iconos[tipo]} toast-icon"></i>
        <span class="toast-message">${mensaje}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Mostrar loader
function mostrarLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function ocultarLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Validar array de números
function validarNumeros(texto, nombre = 'datos') {
    if (!texto || texto.trim() === '') {
        throw new Error(`Por favor ingresa ${nombre}.`);
    }
    
    const numeros = texto.trim().split(/[\s,]+/).map(n => parseFloat(n.trim()));
    
    if (numeros.some(isNaN)) {
        throw new Error(`${nombre} contiene valores no numéricos.`);
    }
    
    if (numeros.length === 0) {
        throw new Error(`No se encontraron ${nombre} válidos.`);
    }
    
    return numeros;
}

// Copiar al portapapeles
function copiarAlPortapapeles(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        mostrarToast('Copiado al portapapeles', 'success');
    }).catch(() => {
        mostrarToast('Error al copiar', 'error');
    });
}

// ========== IMPORTAR EXCEL ==========
function importarExcel(targetId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        mostrarLoader();
        
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Extraer todos los números de todas las celdas
            const numeros = [];
            jsonData.forEach(row => {
                row.forEach(cell => {
                    if (typeof cell === 'number') {
                        numeros.push(cell);
                    } else if (typeof cell === 'string') {
                        const parsed = parseFloat(cell);
                        if (!isNaN(parsed)) {
                            numeros.push(parsed);
                        }
                    }
                });
            });
            
            if (numeros.length === 0) {
                throw new Error('No se encontraron datos numéricos en el archivo Excel.');
            }
            
            const targetElement = document.getElementById(targetId);
            
            if (targetElement.tagName === 'TEXTAREA') {
                // Para textareas, usar comas
                targetElement.value = numeros.join(', ');
            } else {
                // Para inputs, también usar comas
                targetElement.value = numeros.join(', ');
            }
            
            mostrarToast(`${numeros.length} valores importados exitosamente`, 'success');
            
        } catch (error) {
            console.error('Error al importar Excel:', error);
            mostrarToast('Error al importar el archivo: ' + error.message, 'error');
        } finally {
            ocultarLoader();
        }
    };
    
    input.click();
}

// ========== LIMPIAR SECCIONES ==========
function limpiarSeccion(seccion) {
    switch(seccion) {
        case 'regresion-simple':
            document.getElementById('simple-x').value = '';
            document.getElementById('simple-y').value = '';
            document.getElementById('resultado-simple').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line fa-3x"></i>
                    <p>Los resultados aparecerán aquí después del cálculo</p>
                </div>
            `;
            document.getElementById('chart-container-simple').style.display = 'none';
            if (chartInstances['graficoRegresion']) {
                chartInstances['graficoRegresion'].destroy();
            }
            break;
            
        case 'regresion-multiple':
            document.getElementById('multiple-x').value = '';
            document.getElementById('multiple-y').value = '';
            document.getElementById('resultado-multiple').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram fa-3x"></i>
                    <p>Los resultados aparecerán aquí después del cálculo</p>
                </div>
            `;
            break;
            
        case 'frecuencias':
            document.getElementById('freq-data').value = '';
            document.getElementById('resultado-frecuencias').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-table fa-3x"></i>
                    <p>La tabla de frecuencias aparecerá aquí</p>
                </div>
            `;
            break;
            
        case 'dispersion':
            document.getElementById('disp-data').value = '';
            document.getElementById('resultado-dispersion').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-scatter fa-3x"></i>
                    <p>Los indicadores de dispersión aparecerán aquí</p>
                </div>
            `;
            break;
            
        case 'posicion':
            document.getElementById('pos-data').value = '';
            document.getElementById('pos-k').value = '';
            document.getElementById('resultado-posicion').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sort-numeric-down fa-3x"></i>
                    <p>El resultado de la medida de posición aparecerá aquí</p>
                </div>
            `;
            break;
            
        case 'intervalos':
            document.getElementById('ci-xbar').value = '';
            document.getElementById('ci-desv').value = '';
            document.getElementById('ci-n-media').value = '';
            document.getElementById('ci-x-prop').value = '';
            document.getElementById('ci-n-prop').value = '';
            document.getElementById('resultado-ci').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-area fa-3x"></i>
                    <p>Introduce los datos para estimar el intervalo</p>
                </div>
            `;
            document.getElementById('chart-container-intervalos').style.display = 'none';
            if (chartInstances['graficoIntervalos']) {
                chartInstances['graficoIntervalos'].destroy();
            }
            break;
    }
    
    mostrarToast('Sección limpiada', 'info');
}

function limpiarLaplace() {
    document.getElementById('lap-fav').value = '';
    document.getElementById('lap-tot').value = '';
    document.getElementById('result-laplace').innerHTML = '';
    mostrarToast('Campos limpiados', 'info');
}

function limpiarBayes() {
    document.getElementById('bay-pa').value = '';
    document.getElementById('bay-pba').value = '';
    document.getElementById('bay-pb').value = '';
    document.getElementById('result-bayes').innerHTML = '';
    mostrarToast('Campos limpiados', 'info');
}

// ========== CARGAR EJEMPLOS ==========
function cargarEjemplo(seccion) {
    switch(seccion) {
        case 'regresion-simple':
            document.getElementById('simple-x').value = '10, 20, 30, 40, 50';
            document.getElementById('simple-y').value = '15, 28, 42, 55, 68';
            mostrarToast('Ejemplo cargado: Relación horas de estudio vs calificación', 'success');
            break;
            
        case 'regresion-multiple':
            // Cargar ejemplo en la tabla
            const ejemploX = [[10, 5], [12, 6], [15, 8], [18, 9], [20, 10]];
            const ejemploY = [100, 120, 145, 165, 180];
            
            // Asegurarse de que haya suficientes filas
            const tbody = document.getElementById('tabla-multiple-body');
            while (tbody.children.length < ejemploX.length) {
                agregarFilaMultiple();
            }
            
            // Llenar la tabla
            const filas = tbody.querySelectorAll('tr');
            ejemploX.forEach((fila, i) => {
                fila.forEach((valor, j) => {
                    const input = filas[i].querySelector(`.x-col-${j+1}`);
                    if (input) input.value = valor;
                });
                const yInput = filas[i].querySelector('.y-col');
                if (yInput) yInput.value = ejemploY[i];
            });
            
            mostrarToast('Ejemplo cargado: Ventas según publicidad y precio', 'success');
            break;
            
        case 'frecuencias':
            document.getElementById('freq-data').value = '12, 15, 12, 18, 20, 22, 15, 18, 20, 25, 12, 15, 18, 22, 25, 20, 18, 15, 12, 20';
            mostrarToast('Ejemplo cargado: Edades de estudiantes', 'success');
            break;
            
        case 'dispersion':
            document.getElementById('disp-data').value = '5, 10, 15, 20, 25, 30, 35';
            mostrarToast('Ejemplo cargado: Datos de muestra', 'success');
            break;
            
        case 'posicion':
            document.getElementById('pos-data').value = '2, 4, 4, 5, 7, 9, 10, 12, 14, 15';
            document.getElementById('pos-k').value = '2';
            mostrarToast('Ejemplo cargado: Cuartil 2 (Mediana)', 'success');
            break;
            
        case 'intervalos':
            document.getElementById('ci-xbar').value = '50';
            document.getElementById('ci-desv').value = '5';
            document.getElementById('ci-n-media').value = '100';
            mostrarToast('Ejemplo cargado: Intervalo de confianza para la media', 'success');
            break;
    }
}

// ========== AYUDA CONTEXTUAL ==========
function mostrarAyuda(seccion) {
    const ayudas = {
        'regresion-simple': 'La regresión lineal simple analiza la relación entre dos variables. X es la variable independiente (predictora) e Y es la variable dependiente (respuesta).',
        'regresion-multiple': 'La regresión múltiple analiza la relación entre una variable dependiente y múltiples variables independientes.',
        'frecuencias': 'La tabla de frecuencias agrupa los datos en clases y calcula frecuencias absolutas, relativas y acumuladas.',
        'dispersion': 'Las medidas de dispersión indican qué tan dispersos están los datos respecto a la media.',
        'posicion': 'Las medidas de posición dividen los datos ordenados en partes iguales.',
        'intervalos': 'Los intervalos de confianza estiman un rango probable para un parámetro poblacional.'
    };
    
    if (ayudas[seccion]) {
        mostrarToast(ayudas[seccion], 'info');
    }
}

// ========== HISTORIAL ==========
function agregarAlHistorial(tipo, datos, resultado) {
    const item = {
        id: Date.now(),
        tipo: tipo,
        fecha: new Date().toLocaleString('es-ES'),
        datos: datos,
        resultado: resultado
    };
    
    historialCalculos.unshift(item);
    
    if (historialCalculos.length > MAX_HISTORY) {
        historialCalculos = historialCalculos.slice(0, MAX_HISTORY);
    }
    
    guardarHistorialEnStorage();
    actualizarVistaHistorial();
}

function guardarHistorialEnStorage() {
    try {
        localStorage.setItem('historial_calculadora', JSON.stringify(historialCalculos));
    } catch (e) {
        console.error('Error al guardar historial:', e);
    }
}

function cargarHistorialDesdeStorage() {
    try {
        const stored = localStorage.getItem('historial_calculadora');
        if (stored) {
            historialCalculos = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error al cargar historial:', e);
        historialCalculos = [];
    }
}

function actualizarVistaHistorial() {
    const container = document.getElementById('historial-container');
    
    if (!container) return;
    
    if (historialCalculos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock fa-3x"></i>
                <p>No hay cálculos en el historial todavía</p>
                <small>Los cálculos se guardarán automáticamente aquí</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = historialCalculos.map(item => `
        <div class="history-item" onclick="verDetalleHistorial(${item.id})">
            <div class="history-header">
                <span class="history-title">
                    <i class="fas fa-calculator"></i> ${item.tipo}
                </span>
                <span class="history-date">${item.fecha}</span>
            </div>
            <div class="history-preview">
                ${item.resultado.substring(0, 100)}...
            </div>
        </div>
    `).join('');
}

function verDetalleHistorial(id) {
    const item = historialCalculos.find(h => h.id === id);
    if (!item) return;
    
    alert(`Cálculo: ${item.tipo}\nFecha: ${item.fecha}\n\n${item.resultado}`);
}

function limpiarHistorial() {
    if (confirm('¿Estás seguro de que deseas limpiar el historial?')) {
        historialCalculos = [];
        guardarHistorialEnStorage();
        actualizarVistaHistorial();
        mostrarToast('Historial limpiado', 'success');
    }
}

function cargarHistorial() {
    actualizarVistaHistorial();
}

// ========== DESCARGAR GRÁFICOS ==========
function descargarGrafico(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        mostrarToast('No hay gráfico para descargar', 'error');
        return;
    }
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${canvasId}_${Date.now()}.png`;
    link.href = url;
    link.click();
    
    mostrarToast('Gráfico descargado', 'success');
}

// ========== EXPORTAR RESULTADOS A EXCEL ==========
function exportarResultadosExcel(datos, nombreArchivo) {
    try {
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
        XLSX.writeFile(wb, `${nombreArchivo}_${Date.now()}.xlsx`);
        mostrarToast('Resultados exportados a Excel', 'success');
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarToast('Error al exportar a Excel', 'error');
    }
}

function exportarRegresionMultiple() {
    if (!window.datosRegresionMultiple) {
        mostrarToast('No hay datos para exportar', 'error');
        return;
    }
    
    const { X, y, coeficientes, r2 } = window.datosRegresionMultiple;
    const numVars = X[0].length;
    
    const datos = X.map((fila, i) => {
        const obj = {};
        fila.forEach((val, j) => {
            obj[`X₍${j+1}₎`] = val;
        });
        obj['Y'] = y[i];
        return obj;
    });
    
    exportarResultadosExcel(datos, 'regresion_multiple');
}

function importarExcelMultiple() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    throw new Error('El archivo debe tener al menos 2 filas (encabezado y datos)');
                }
                
                // Detectar número de columnas X (todas excepto la última que es Y)
                const numCols = jsonData[0].length;
                const numVarsX = numCols - 1;
                
                if (numVarsX < 2 || numVarsX > 5) {
                    throw new Error('El archivo debe tener entre 2 y 5 variables X más 1 columna Y');
                }
                
                // Ajustar selector de variables
                document.getElementById('num-variables').value = numVarsX;
                generarTablaVariables();
                
                // Llenar tabla (saltar primera fila si es encabezado)
                const tbody = document.getElementById('tabla-multiple-body');
                const startRow = isNaN(jsonData[0][0]) ? 1 : 0; // Skip header if first cell is not a number
                
                // Asegurar suficientes filas
                while (tbody.children.length < jsonData.length - startRow) {
                    agregarFilaMultiple();
                }
                
                const filas = tbody.querySelectorAll('tr');
                for (let i = startRow; i < jsonData.length; i++) {
                    const fila = jsonData[i];
                    if (fila.length >= numCols) {
                        const filaHTML = filas[i - startRow];
                        
                        // Llenar X
                        for (let j = 0; j < numVarsX; j++) {
                            const input = filaHTML.querySelector(`.x-col-${j+1}`);
                            if (input) input.value = fila[j];
                        }
                        
                        // Llenar Y
                        const yInput = filaHTML.querySelector('.y-col');
                        if (yInput) yInput.value = fila[numVarsX];
                    }
                }
                
                mostrarToast('Datos importados desde Excel', 'success');
            } catch (error) {
                mostrarToast('Error al importar: ' + error.message, 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    };
    
    input.click();
}

// ========== CAMBIAR FORMULARIO IC ==========
function cambiarFormularioCI() {
    const tipo = document.getElementById('ci-tipo').value;
    const formMedia = document.getElementById('form-ci-media');
    const formProp = document.getElementById('form-ci-prop');
    
    if (tipo === 'media') {
        formMedia.style.display = 'block';
        formProp.style.display = 'none';
    } else {
        formMedia.style.display = 'none';
        formProp.style.display = 'block';
    }
}

// ========== REGRESIÓN LINEAL SIMPLE ==========
function calcularRegresionSimple() {
    mostrarLoader();
    
    setTimeout(() => {
        try {
            const xTexto = document.getElementById('simple-x').value;
            const yTexto = document.getElementById('simple-y').value;
            
            const x = validarNumeros(xTexto, 'valores de X');
            const y = validarNumeros(yTexto, 'valores de Y');
            
            if (x.length !== y.length) {
                throw new Error('X e Y deben tener la misma cantidad de valores.');
            }
            
            if (x.length < 2) {
                throw new Error('Se necesitan al menos 2 pares de valores.');
            }
            
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
            const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
            
            // Coeficientes
            const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const b = (sumY - a * sumX) / n;
            
            // Coeficiente de correlación
            const r = (n * sumXY - sumX * sumY) / 
                     Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            
            // R²
            const r2 = r * r;
            
            // Valores predichos y residuos
            const yPred = x.map(xi => a * xi + b);
            const residuos = y.map((yi, i) => yi - yPred[i]);
            
            // Construir resultado
            let html = `
                <h3><i class="fas fa-chart-line"></i> Resultados de Regresión Lineal Simple</h3>
                
                <div class="step-box">
                    <h4>Ecuación de Regresión:</h4>
                    <p class="formula">y = ${a.toFixed(4)}x + ${b.toFixed(4)}</p>
                </div>
                
                <div class="step-box">
                    <h4>Coeficientes:</h4>
                    <p><strong>Pendiente (a):</strong> ${a.toFixed(4)}</p>
                    <p><strong>Intercepto (b):</strong> ${b.toFixed(4)}</p>
                </div>
                
                <div class="step-box">
                    <h4>Bondad de Ajuste:</h4>
                    <p><strong>Coeficiente de Correlación (r):</strong> ${r.toFixed(4)}</p>
                    <p><strong>Coeficiente de Determinación (R²):</strong> ${r2.toFixed(4)} (${(r2*100).toFixed(2)}%)</p>
                    <p><em>El modelo explica el ${(r2*100).toFixed(2)}% de la variabilidad de Y.</em></p>
                </div>
                
                <div class="step-box">
                    <h4>Interpretación:</h4>
                    <p>Por cada unidad que aumenta X, Y ${a > 0 ? 'aumenta' : 'disminuye'} en promedio ${Math.abs(a).toFixed(4)} unidades.</p>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="copiarResultadoRegresion(${a}, ${b}, ${r}, ${r2})">
                        <i class="fas fa-copy"></i> Copiar Ecuación
                    </button>
                    <button class="btn-secondary" onclick="exportarDatosRegresion(${JSON.stringify(x)}, ${JSON.stringify(y)}, ${JSON.stringify(yPred)})">
                        <i class="fas fa-file-excel"></i> Exportar a Excel
                    </button>
                </div>
            `;
            
            document.getElementById('resultado-simple').innerHTML = html;
            
            // Crear gráfico
            crearGraficoRegresion(x, y, yPred, a, b);
            document.getElementById('chart-container-simple').style.display = 'block';
            
            // Agregar al historial
            agregarAlHistorial(
                'Regresión Lineal Simple',
                { x: x, y: y },
                `y = ${a.toFixed(4)}x + ${b.toFixed(4)}, R² = ${r2.toFixed(4)}`
            );
            
            mostrarToast('Regresión calculada exitosamente', 'success');
            
        } catch (error) {
            document.getElementById('resultado-simple').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
            mostrarToast(error.message, 'error');
        } finally {
            ocultarLoader();
        }
    }, 100);
}

function copiarResultadoRegresion(a, b, r, r2) {
    const texto = `Ecuación: y = ${a.toFixed(4)}x + ${b.toFixed(4)}\nR² = ${r2.toFixed(4)}`;
    copiarAlPortapapeles(texto);
}

function exportarDatosRegresion(x, y, yPred) {
    const datos = x.map((xi, i) => ({
        'X': xi,
        'Y Real': y[i],
        'Y Predicho': yPred[i].toFixed(4),
        'Residuo': (y[i] - yPred[i]).toFixed(4)
    }));
    
    exportarResultadosExcel(datos, 'regresion_lineal_simple');
}

function crearGraficoRegresion(x, y, yPred, a, b) {
    const ctx = document.getElementById('graficoRegresion');
    
    if (chartInstances['graficoRegresion']) {
        chartInstances['graficoRegresion'].destroy();
    }
    
    const theme = document.body.getAttribute('data-theme');
    const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    
    chartInstances['graficoRegresion'] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Datos Reales',
                data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: 'Línea de Regresión',
                data: x.map((xi, i) => ({ x: xi, y: yPred[i] })),
                type: 'line',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderColor: 'rgba(6, 182, 212, 1)',
                borderWidth: 3,
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                title: {
                    display: true,
                    text: `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`,
                    color: textColor,
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'X', color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    title: { display: true, text: 'Y', color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// Continuará en la siguiente parte...

// ========== REGRESIÓN MÚLTIPLE ==========
function calcularRegresionMultiple() {
    mostrarLoader();
    
    setTimeout(() => {
        try {
            const numVars = parseInt(document.getElementById('num-variables').value);
            
            // Leer datos de la tabla
            const X = [];
            const y = [];
            
            const filas = document.querySelectorAll('#tabla-multiple-body tr');
            
            filas.forEach(fila => {
                const xFila = [];
                let yValor = null;
                let filaCompleta = true;
                
                // Leer valores de X
                for (let col = 1; col <= numVars; col++) {
                    const input = fila.querySelector(`.x-col-${col}`);
                    const valor = parseFloat(input.value);
                    if (isNaN(valor) || input.value.trim() === '') {
                        filaCompleta = false;
                        break;
                    }
                    xFila.push(valor);
                }
                
                // Leer valor de Y
                const yInput = fila.querySelector('.y-col');
                yValor = parseFloat(yInput.value);
                if (isNaN(yValor) || yInput.value.trim() === '') {
                    filaCompleta = false;
                }
                
                // Solo agregar si la fila está completa
                if (filaCompleta) {
                    X.push(xFila);
                    y.push(yValor);
                }
            });
            
            if (X.length === 0) {
                throw new Error('Debes ingresar al menos un conjunto de datos completo.');
            }
            
            if (X.length < numVars + 1) {
                throw new Error(`Para ${numVars} variables necesitas al menos ${numVars + 1} observaciones.`);
            }
            
            // Agregar columna de unos para el intercepto
            const XConIntercepto = X.map(fila => [1, ...fila]);
            
            // Calcular (X^T * X)^-1 * X^T * Y usando métodos numéricos básicos
            const resultado = regresionMultipleCalcular(XConIntercepto, y);
            
            const coeficientes = resultado.coeficientes;
            const r2 = resultado.r2;
            
            // Construir ecuación
            let ecuacion = `y = ${coeficientes[0].toFixed(4)}`;
            for (let i = 1; i < coeficientes.length; i++) {
                ecuacion += ` ${coeficientes[i] >= 0 ? '+' : ''} ${coeficientes[i].toFixed(4)}X₍${i}₎`;
            }
            
            let html = `
                <h3><i class="fas fa-project-diagram"></i> Resultados de Regresión Múltiple</h3>
                
                <div class="step-box">
                    <h4>Información del Modelo:</h4>
                    <p><strong>Variables independientes:</strong> ${numVars}</p>
                    <p><strong>Observaciones:</strong> ${X.length}</p>
                </div>
                
                <div class="step-box">
                    <h4>Ecuación de Regresión:</h4>
                    <p class="formula">${ecuacion}</p>
                </div>
                
                <div class="step-box">
                    <h4>Coeficientes:</h4>
                    <p><strong>Intercepto (β₀):</strong> ${coeficientes[0].toFixed(4)}</p>
            `;
            
            for (let i = 1; i < coeficientes.length; i++) {
                html += `<p><strong>β₍${i}₎ (X₍${i}₎):</strong> ${coeficientes[i].toFixed(4)}</p>`;
            }
            
            html += `
                </div>
                
                <div class="step-box">
                    <h4>Bondad de Ajuste:</h4>
                    <p><strong>R² Ajustado:</strong> ${r2.toFixed(4)} (${(r2*100).toFixed(2)}%)</p>
                    <p><em>El modelo explica el ${(r2*100).toFixed(2)}% de la variabilidad de Y.</em></p>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="copiarAlPortapapeles('${ecuacion}')">
                        <i class="fas fa-copy"></i> Copiar Ecuación
                    </button>
                    <button class="btn-secondary" onclick="exportarRegresionMultiple()">
                        <i class="fas fa-file-excel"></i> Exportar a Excel
                    </button>
                </div>
            `;
            
            document.getElementById('resultado-multiple').innerHTML = html;
            
            // Guardar para exportación
            window.datosRegresionMultiple = {
                X: X,
                y: y,
                coeficientes: coeficientes,
                r2: r2
            };
            
            agregarAlHistorial(
                'Regresión Lineal Múltiple',
                { X: X, y: y },
                ecuacion + `, R² = ${r2.toFixed(4)}`
            );
            
            mostrarToast('Regresión múltiple calculada exitosamente', 'success');
            
        } catch (error) {
            document.getElementById('resultado-multiple').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
            mostrarToast(error.message, 'error');
        } finally {
            ocultarLoader();
        }
    }, 100);
}

function regresionMultipleCalcular(X, y) {
    // Implementación simplificada usando mínimos cuadrados
    const n = X.length;
    const k = X[0].length;
    
    // Calcular X^T
    const XT = transponer(X);
    
    // Calcular X^T * X
    const XTX = multiplicarMatrices(XT, X);
    
    // Calcular X^T * y
    const XTy = multiplicarMatrizVector(XT, y);
    
    // Resolver el sistema usando eliminación gaussiana
    const coeficientes = resolverSistema(XTX, XTy);
    
    // Calcular R²
    const yPred = X.map(fila => 
        fila.reduce((sum, xi, i) => sum + xi * coeficientes[i], 0)
    );
    
    const yMedia = y.reduce((a, b) => a + b, 0) / n;
    const SST = y.reduce((sum, yi) => sum + Math.pow(yi - yMedia, 2), 0);
    const SSR = yPred.reduce((sum, yi, i) => sum + Math.pow(y[i] - yi, 2), 0);
    const r2 = 1 - (SSR / SST);
    
    return { coeficientes, r2 };
}

function transponer(matriz) {
    return matriz[0].map((_, i) => matriz.map(fila => fila[i]));
}

function multiplicarMatrices(A, B) {
    const resultado = [];
    for (let i = 0; i < A.length; i++) {
        resultado[i] = [];
        for (let j = 0; j < B[0].length; j++) {
            let suma = 0;
            for (let k = 0; k < A[0].length; k++) {
                suma += A[i][k] * B[k][j];
            }
            resultado[i][j] = suma;
        }
    }
    return resultado;
}

function multiplicarMatrizVector(matriz, vector) {
    return matriz.map(fila => 
        fila.reduce((sum, valor, i) => sum + valor * vector[i], 0)
    );
}

function resolverSistema(A, b) {
    const n = A.length;
    const Ab = A.map((fila, i) => [...fila, b[i]]);
    
    // Eliminación gaussiana
    for (let i = 0; i < n; i++) {
        // Pivote
        let maxFila = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxFila][i])) {
                maxFila = k;
            }
        }
        [Ab[i], Ab[maxFila]] = [Ab[maxFila], Ab[i]];
        
        // Hacer ceros debajo del pivote
        for (let k = i + 1; k < n; k++) {
            const factor = Ab[k][i] / Ab[i][i];
            for (let j = i; j <= n; j++) {
                Ab[k][j] -= factor * Ab[i][j];
            }
        }
    }
    
    // Sustitución hacia atrás
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = Ab[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= Ab[i][j] * x[j];
        }
        x[i] /= Ab[i][i];
    }
    
    return x;
}

// ========== PROBABILIDAD: LAPLACE ==========
function calcularLaplace() {
    try {
        const fav = parseFloat(document.getElementById('lap-fav').value);
        const tot = parseFloat(document.getElementById('lap-tot').value);
        
        if (isNaN(fav) || isNaN(tot)) {
            throw new Error('Ingresa valores numéricos válidos.');
        }
        
        if (tot <= 0) {
            throw new Error('Los casos totales deben ser mayores a 0.');
        }
        
        if (fav < 0 || fav > tot) {
            throw new Error('Los casos favorables deben estar entre 0 y los casos totales.');
        }
        
        const probabilidad = fav / tot;
        
        const html = `
            <div class="step-box">
                <h4>Resultado:</h4>
                <p class="formula">P(A) = ${fav} / ${tot} = ${probabilidad.toFixed(6)}</p>
                <p><strong>Probabilidad:</strong> ${(probabilidad * 100).toFixed(4)}%</p>
            </div>
        `;
        
        document.getElementById('result-laplace').innerHTML = html;
        
        agregarAlHistorial(
            'Regla de Laplace',
            { favorables: fav, totales: tot },
            `P(A) = ${probabilidad.toFixed(6)}`
        );
        
        mostrarToast('Probabilidad calculada', 'success');
        
    } catch (error) {
        document.getElementById('result-laplace').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
                <p style="color: var(--error);">${error.message}</p>
            </div>
        `;
        mostrarToast(error.message, 'error');
    }
}

// ========== PROBABILIDAD: BAYES ==========
function calcularBayes() {
    try {
        const pa = parseFloat(document.getElementById('bay-pa').value);
        const pba = parseFloat(document.getElementById('bay-pba').value);
        const pb = parseFloat(document.getElementById('bay-pb').value);
        
        if (isNaN(pa) || isNaN(pba) || isNaN(pb)) {
            throw new Error('Ingresa valores numéricos válidos.');
        }
        
        if (pa < 0 || pa > 1 || pba < 0 || pba > 1 || pb <= 0 || pb > 1) {
            throw new Error('Las probabilidades deben estar entre 0 y 1.');
        }
        
        const pab = (pba * pa) / pb;
        
        if (pab > 1) {
            throw new Error('Verifica tus datos: P(A|B) no puede ser mayor a 1.');
        }
        
        const html = `
            <div class="step-box">
                <h4>Fórmula de Bayes:</h4>
                <p class="formula">P(A|B) = [P(B|A) × P(A)] / P(B)</p>
            </div>
            
            <div class="step-box">
                <h4>Cálculo:</h4>
                <p class="formula">P(A|B) = [${pba} × ${pa}] / ${pb} = ${pab.toFixed(6)}</p>
                <p><strong>Resultado:</strong> ${(pab * 100).toFixed(4)}%</p>
            </div>
        `;
        
        document.getElementById('result-bayes').innerHTML = html;
        
        agregarAlHistorial(
            'Teorema de Bayes',
            { 'P(A)': pa, 'P(B|A)': pba, 'P(B)': pb },
            `P(A|B) = ${pab.toFixed(6)}`
        );
        
        mostrarToast('Teorema de Bayes calculado', 'success');
        
    } catch (error) {
        document.getElementById('result-bayes').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
                <p style="color: var(--error);">${error.message}</p>
            </div>
        `;
        mostrarToast(error.message, 'error');
    }
}

// Variable global para almacenar las clases de frecuencia
let clasesGlobales = null;

// ========== TABLA DE FRECUENCIAS ==========
function calcularFrecuencias() {
    mostrarLoader();
    
    setTimeout(() => {
        try {
            const texto = document.getElementById('freq-data').value;
            const datos = validarNumeros(texto, 'datos');
            
            datos.sort((a, b) => a - b);
            const n = datos.length;
            
            // Regla de Sturges
            const k = Math.ceil(1 + 3.322 * Math.log10(n));
            const rango = datos[n - 1] - datos[0];
            const amplitud = rango / k;
            
            // Crear clases
            const clases = [];
            let limiteInferior = datos[0];
            
            for (let i = 0; i < k; i++) {
                const limiteSuperior = limiteInferior + amplitud;
                const marcaClase = (limiteInferior + limiteSuperior) / 2;
                
                // Contar frecuencia
                const fi = datos.filter(d => 
                    d >= limiteInferior && (i === k - 1 ? d <= limiteSuperior : d < limiteSuperior)
                ).length;
                
                clases.push({
                    limiteInf: limiteInferior.toFixed(2),
                    limiteSup: limiteSuperior.toFixed(2),
                    marca: marcaClase.toFixed(2),
                    fi: fi,
                    fr: (fi / n).toFixed(4),
                    frPorcentaje: ((fi / n) * 100).toFixed(2)
                });
                
                limiteInferior = limiteSuperior;
            }
            
            // Calcular frecuencias acumuladas
            let fiAcum = 0;
            let frAcum = 0;
            clases.forEach(clase => {
                fiAcum += clase.fi;
                frAcum += parseFloat(clase.fr);
                clase.fiAcum = fiAcum;
                clase.frAcum = frAcum.toFixed(4);
                clase.frAcumPorcentaje = (frAcum * 100).toFixed(2);
            });
            
            // Construir tabla HTML
            let html = `
                <h3><i class="fas fa-table"></i> Tabla de Distribución de Frecuencias</h3>
                
                <div class="step-box">
                    <h4>Información:</h4>
                    <p><strong>n (tamaño):</strong> ${n}</p>
                    <p><strong>k (clases):</strong> ${k} (Regla de Sturges)</p>
                    <p><strong>Rango:</strong> ${rango.toFixed(2)}</p>
                    <p><strong>Amplitud:</strong> ${amplitud.toFixed(2)}</p>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Clase</th>
                            <th>Límite Inf.</th>
                            <th>Límite Sup.</th>
                            <th>Marca de Clase</th>
                            <th>fi</th>
                            <th>fr</th>
                            <th>fr (%)</th>
                            <th>Fi</th>
                            <th>Fr</th>
                            <th>Fr (%)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            clases.forEach((clase, i) => {
                html += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${clase.limiteInf}</td>
                        <td>${clase.limiteSup}</td>
                        <td>${clase.marca}</td>
                        <td>${clase.fi}</td>
                        <td>${clase.fr}</td>
                        <td>${clase.frPorcentaje}%</td>
                        <td>${clase.fiAcum}</td>
                        <td>${clase.frAcum}</td>
                        <td>${clase.frAcumPorcentaje}%</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="4"><strong>TOTAL</strong></td>
                            <td><strong>${n}</strong></td>
                            <td><strong>1.0000</strong></td>
                            <td><strong>100%</strong></td>
                            <td colspan="3"></td>
                        </tr>
                    </tfoot>
                </table>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="exportarTablaFrecuencias()">
                        <i class="fas fa-file-excel"></i> Exportar a Excel
                    </button>
                </div>
            `;
            
            // Guardar clases en variable global para la exportación
            clasesGlobales = clases;
            
            document.getElementById('resultado-frecuencias').innerHTML = html;
            
            agregarAlHistorial(
                'Tabla de Frecuencias',
                { datos: datos },
                `n=${n}, k=${k}, Amplitud=${amplitud.toFixed(2)}`
            );
            
            mostrarToast('Tabla de frecuencias generada', 'success');
            
        } catch (error) {
            document.getElementById('resultado-frecuencias').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
            mostrarToast(error.message, 'error');
        } finally {
            ocultarLoader();
        }
    }, 100);
}

function exportarTablaFrecuencias() {
    if (!clasesGlobales) {
        mostrarToast('No hay datos para exportar', 'error');
        return;
    }
    
    const datos = clasesGlobales.map((clase, i) => ({
        'Clase': i + 1,
        'Límite Inferior': parseFloat(clase.limiteInf),
        'Límite Superior': parseFloat(clase.limiteSup),
        'Marca de Clase': parseFloat(clase.marca),
        'fi': clase.fi,
        'fr': parseFloat(clase.fr),
        'fr (%)': parseFloat(clase.frPorcentaje),
        'Fi': clase.fiAcum,
        'Fr': parseFloat(clase.frAcum),
        'Fr (%)': parseFloat(clase.frAcumPorcentaje)
    }));
    
    exportarResultadosExcel(datos, 'tabla_frecuencias');
}

// Continuará...

// ========== DISPERSIÓN Y FORMA ==========
function calcularDispersion() {
    mostrarLoader();
    
    setTimeout(() => {
        try {
            const texto = document.getElementById('disp-data').value;
            const datos = validarNumeros(texto, 'datos');
            
            const n = datos.length;
            
            // Media
            const media = datos.reduce((a, b) => a + b, 0) / n;
            
            // Varianza y desviación estándar
            const varianza = datos.reduce((sum, x) => sum + Math.pow(x - media, 2), 0) / n;
            const varianzaMuestral = datos.reduce((sum, x) => sum + Math.pow(x - media, 2), 0) / (n - 1);
            const desviacion = Math.sqrt(varianza);
            const desviacionMuestral = Math.sqrt(varianzaMuestral);
            
            // Coeficiente de variación
            const cv = (desviacion / media) * 100;
            
            // Asimetría (Coeficiente de Fisher)
            const asimetria = datos.reduce((sum, x) => sum + Math.pow((x - media) / desviacion, 3), 0) / n;
            
            // Curtosis (Coeficiente de Fisher)
            const curtosis = (datos.reduce((sum, x) => sum + Math.pow((x - media) / desviacion, 4), 0) / n) - 3;
            
            let html = `
                <h3><i class="fas fa-chart-scatter"></i> Medidas de Dispersión y Forma</h3>
                
                <div class="step-box">
                    <h4>Medidas de Tendencia Central:</h4>
                    <p><strong>Media (μ/x̄):</strong> ${media.toFixed(4)}</p>
                    <p><strong>n (tamaño):</strong> ${n}</p>
                </div>
                
                <div class="step-box">
                    <h4>Medidas de Dispersión:</h4>
                    <p><strong>Varianza Poblacional (σ²):</strong> ${varianza.toFixed(4)}</p>
                    <p><strong>Varianza Muestral (s²):</strong> ${varianzaMuestral.toFixed(4)}</p>
                    <p><strong>Desviación Estándar Poblacional (σ):</strong> ${desviacion.toFixed(4)}</p>
                    <p><strong>Desviación Estándar Muestral (s):</strong> ${desviacionMuestral.toFixed(4)}</p>
                    <p><strong>Coeficiente de Variación (CV):</strong> ${cv.toFixed(4)}%</p>
                </div>
                
                <div class="step-box">
                    <h4>Interpretación del CV:</h4>
                    <p>${interpretarCV(cv)}</p>
                </div>
                
                <div class="step-box">
                    <h4>Medidas de Forma:</h4>
                    <p><strong>Asimetría (Skewness):</strong> ${asimetria.toFixed(4)}</p>
                    <p>${interpretarAsimetria(asimetria)}</p>
                    <p><strong>Curtosis (Kurtosis):</strong> ${curtosis.toFixed(4)}</p>
                    <p>${interpretarCurtosis(curtosis)}</p>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="copiarResultadosDispersion(${media}, ${desviacion}, ${cv}, ${asimetria}, ${curtosis})">
                        <i class="fas fa-copy"></i> Copiar Resultados
                    </button>
                </div>
            `;
            
            document.getElementById('resultado-dispersion').innerHTML = html;
            
            agregarAlHistorial(
                'Dispersión y Forma',
                { datos: datos },
                `Media=${media.toFixed(2)}, σ=${desviacion.toFixed(2)}, CV=${cv.toFixed(2)}%`
            );
            
            mostrarToast('Indicadores calculados exitosamente', 'success');
            
        } catch (error) {
            document.getElementById('resultado-dispersion').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
            mostrarToast(error.message, 'error');
        } finally {
            ocultarLoader();
        }
    }, 100);
}

function interpretarCV(cv) {
    if (cv < 15) return '📊 Dispersión BAJA: Los datos son muy homogéneos.';
    if (cv < 30) return '📊 Dispersión MODERADA: Variabilidad aceptable.';
    return '📊 Dispersión ALTA: Los datos son muy heterogéneos.';
}

function interpretarAsimetria(asim) {
    if (Math.abs(asim) < 0.5) return '📊 Distribución SIMÉTRICA: Los datos están balanceados.';
    if (asim > 0) return '📊 Asimetría POSITIVA: Cola hacia la derecha (valores altos).';
    return '📊 Asimetría NEGATIVA: Cola hacia la izquierda (valores bajos).';
}

function interpretarCurtosis(curt) {
    if (Math.abs(curt) < 0.5) return '📊 MESOCÚRTICA: Similar a distribución normal.';
    if (curt > 0) return '📊 LEPTOCÚRTICA: Más puntiaguda que la normal (colas pesadas).';
    return '📊 PLATICÚRTICA: Más aplanada que la normal (colas ligeras).';
}

function copiarResultadosDispersion(media, desv, cv, asim, curt) {
    const texto = `Media: ${media.toFixed(4)}\nDesviación: ${desv.toFixed(4)}\nCV: ${cv.toFixed(2)}%\nAsimetría: ${asim.toFixed(4)}\nCurtosis: ${curt.toFixed(4)}`;
    copiarAlPortapapeles(texto);
}

// ========== MEDIDAS DE POSICIÓN ==========
function calcularPosicion() {
    mostrarLoader();
    
    setTimeout(() => {
        try {
            const texto = document.getElementById('pos-data').value;
            const datos = validarNumeros(texto, 'datos');
            
            const tipo = document.getElementById('pos-tipo').value;
            const k = parseInt(document.getElementById('pos-k').value);
            
            if (isNaN(k) || k < 1) {
                throw new Error('Ingresa un valor k válido.');
            }
            
            // Validar k según el tipo
            if (tipo === 'Q' && (k < 1 || k > 3)) {
                throw new Error('Para Cuartiles, k debe estar entre 1 y 3.');
            } else if (tipo === 'D' && (k < 1 || k > 9)) {
                throw new Error('Para Deciles, k debe estar entre 1 y 9.');
            } else if (tipo === 'P' && (k < 1 || k > 99)) {
                throw new Error('Para Percentiles, k debe estar entre 1 y 99.');
            }
            
            datos.sort((a, b) => a - b);
            const n = datos.length;
            
            // Calcular posición
            let divisor;
            let nombre;
            
            switch(tipo) {
                case 'Q':
                    divisor = 4;
                    nombre = `Cuartil ${k} (Q${k})`;
                    break;
                case 'D':
                    divisor = 10;
                    nombre = `Decil ${k} (D${k})`;
                    break;
                case 'P':
                    divisor = 100;
                    nombre = `Percentil ${k} (P${k})`;
                    break;
            }
            
            const posicion = (k * n) / divisor;
            let valor;
            let explicacion;
            
            if (Number.isInteger(posicion)) {
                // Promedio de dos valores
                valor = (datos[posicion - 1] + datos[posicion]) / 2;
                explicacion = `Posición = ${posicion} (entero), entonces ${nombre} = (dato[${posicion}] + dato[${posicion + 1}]) / 2 = (${datos[posicion - 1]} + ${datos[posicion]}) / 2`;
            } else {
                // Redondear hacia arriba
                const posRedondeada = Math.ceil(posicion);
                valor = datos[posRedondeada - 1];
                explicacion = `Posición = ${posicion.toFixed(2)} ≈ ${posRedondeada}, entonces ${nombre} = dato[${posRedondeada}]`;
            }
            
            let html = `
                <h3><i class="fas fa-sort-numeric-down"></i> ${nombre}</h3>
                
                <div class="step-box">
                    <h4>Datos Ordenados:</h4>
                    <p class="formula">${datos.join(', ')}</p>
                    <p><strong>n =</strong> ${n}</p>
                </div>
                
                <div class="step-box">
                    <h4>Cálculo:</h4>
                    <p class="formula">Posición = (k × n) / ${divisor} = (${k} × ${n}) / ${divisor} = ${posicion.toFixed(2)}</p>
                    <p>${explicacion}</p>
                </div>
                
                <div class="step-box">
                    <h4>Resultado:</h4>
                    <p><strong>${nombre} = ${valor.toFixed(4)}</strong></p>
                    <p><em>El ${((k / divisor) * 100).toFixed(1)}% de los datos es menor o igual a ${valor.toFixed(4)}</em></p>
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn-secondary" onclick="copiarAlPortapapeles('${nombre} = ${valor.toFixed(4)}')">
                        <i class="fas fa-copy"></i> Copiar Resultado
                    </button>
                </div>
            `;
            
            document.getElementById('resultado-posicion').innerHTML = html;
            
            agregarAlHistorial(
                `Medida de Posición: ${nombre}`,
                { datos: datos, k: k },
                `${nombre} = ${valor.toFixed(4)}`
            );
            
            mostrarToast(`${nombre} calculado exitosamente`, 'success');
            
        } catch (error) {
            document.getElementById('resultado-posicion').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
            mostrarToast(error.message, 'error');
        } finally {
            ocultarLoader();
        }
    }, 100);
}

// ========== INTERVALOS DE CONFIANZA ==========
function calcularIntervalo() {
    mostrarLoader();
    
    setTimeout(() => {
        try {
            const tipo = document.getElementById('ci-tipo').value;
            const z = parseFloat(document.getElementById('ci-nivel').value);
            const nivelConfianza = ((1 - 2 * (1 - cdfNormal(z))) * 100).toFixed(0);
            
            let html = '';
            let resultado = '';
            
            if (tipo === 'media') {
                const xbar = parseFloat(document.getElementById('ci-xbar').value);
                const s = parseFloat(document.getElementById('ci-desv').value);
                const n = parseInt(document.getElementById('ci-n-media').value);
                
                if (isNaN(xbar) || isNaN(s) || isNaN(n)) {
                    throw new Error('Completa todos los campos.');
                }
                
                if (n < 31) {
                    throw new Error('Para este método, n debe ser mayor a 30.');
                }
                
                if (s <= 0) {
                    throw new Error('La desviación estándar debe ser mayor a 0.');
                }
                
                const errorEstandar = s / Math.sqrt(n);
                const margenError = z * errorEstandar;
                const limInf = xbar - margenError;
                const limSup = xbar + margenError;
                
                html = `
                    <h3><i class="fas fa-chart-area"></i> Intervalo de Confianza para la Media</h3>
                    
                    <div class="step-box">
                        <h4>Datos:</h4>
                        <p><strong>Media muestral (x̄):</strong> ${xbar}</p>
                        <p><strong>Desviación estándar (s):</strong> ${s}</p>
                        <p><strong>Tamaño de muestra (n):</strong> ${n}</p>
                        <p><strong>Nivel de confianza:</strong> ${nivelConfianza}% (Z = ${z})</p>
                    </div>
                    
                    <div class="step-box">
                        <h4>Cálculo:</h4>
                        <p class="formula">Error Estándar = s / √n = ${s} / √${n} = ${errorEstandar.toFixed(4)}</p>
                        <p class="formula">Margen de Error = Z × Error Estándar = ${z} × ${errorEstandar.toFixed(4)} = ${margenError.toFixed(4)}</p>
                    </div>
                    
                    <div class="step-box">
                        <h4>Intervalo de Confianza:</h4>
                        <p class="formula">[${limInf.toFixed(4)}, ${limSup.toFixed(4)}]</p>
                        <p><strong>IC al ${nivelConfianza}%:</strong> μ ∈ [${limInf.toFixed(4)}, ${limSup.toFixed(4)}]</p>
                    </div>
                    
                    <div class="step-box">
                        <h4>Interpretación:</h4>
                        <p>Estamos ${nivelConfianza}% seguros de que la media poblacional (μ) se encuentra entre ${limInf.toFixed(4)} y ${limSup.toFixed(4)}.</p>
                    </div>
                `;
                
                resultado = `IC ${nivelConfianza}%: [${limInf.toFixed(4)}, ${limSup.toFixed(4)}]`;
                
                // Crear gráfico
                crearGraficoIntervalo(xbar, limInf, limSup, 'Media', nivelConfianza);
                
            } else if (tipo === 'proporcion') {
                const x = parseInt(document.getElementById('ci-x-prop').value);
                const n = parseInt(document.getElementById('ci-n-prop').value);
                
                if (isNaN(x) || isNaN(n)) {
                    throw new Error('Completa todos los campos.');
                }
                
                if (x < 0 || x > n) {
                    throw new Error('Los casos favorables deben estar entre 0 y n.');
                }
                
                if (n <= 0) {
                    throw new Error('El tamaño de muestra debe ser mayor a 0.');
                }
                
                const p = x / n;
                const errorEstandar = Math.sqrt((p * (1 - p)) / n);
                const margenError = z * errorEstandar;
                const limInf = Math.max(0, p - margenError);
                const limSup = Math.min(1, p + margenError);
                
                html = `
                    <h3><i class="fas fa-chart-area"></i> Intervalo de Confianza para la Proporción</h3>
                    
                    <div class="step-box">
                        <h4>Datos:</h4>
                        <p><strong>Casos favorables (x):</strong> ${x}</p>
                        <p><strong>Tamaño de muestra (n):</strong> ${n}</p>
                        <p><strong>Proporción muestral (p̂):</strong> ${p.toFixed(4)} (${(p * 100).toFixed(2)}%)</p>
                        <p><strong>Nivel de confianza:</strong> ${nivelConfianza}% (Z = ${z})</p>
                    </div>
                    
                    <div class="step-box">
                        <h4>Cálculo:</h4>
                        <p class="formula">Error Estándar = √[p̂(1-p̂)/n] = √[${p.toFixed(4)} × ${(1-p).toFixed(4)} / ${n}] = ${errorEstandar.toFixed(4)}</p>
                        <p class="formula">Margen de Error = Z × Error Estándar = ${z} × ${errorEstandar.toFixed(4)} = ${margenError.toFixed(4)}</p>
                    </div>
                    
                    <div class="step-box">
                        <h4>Intervalo de Confianza:</h4>
                        <p class="formula">[${limInf.toFixed(4)}, ${limSup.toFixed(4)}]</p>
                        <p class="formula">[${(limInf * 100).toFixed(2)}%, ${(limSup * 100).toFixed(2)}%]</p>
                        <p><strong>IC al ${nivelConfianza}%:</strong> p ∈ [${(limInf * 100).toFixed(2)}%, ${(limSup * 100).toFixed(2)}%]</p>
                    </div>
                    
                    <div class="step-box">
                        <h4>Interpretación:</h4>
                        <p>Estamos ${nivelConfianza}% seguros de que la proporción poblacional (p) se encuentra entre ${(limInf * 100).toFixed(2)}% y ${(limSup * 100).toFixed(2)}%.</p>
                    </div>
                `;
                
                resultado = `IC ${nivelConfianza}%: [${(limInf * 100).toFixed(2)}%, ${(limSup * 100).toFixed(2)}%]`;
                
                // Crear gráfico
                crearGraficoIntervalo(p, limInf, limSup, 'Proporción', nivelConfianza);
            }
            
            html += `
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="copiarAlPortapapeles('${resultado}')">
                        <i class="fas fa-copy"></i> Copiar Intervalo
                    </button>
                </div>
            `;
            
            document.getElementById('resultado-ci').innerHTML = html;
            document.getElementById('chart-container-intervalos').style.display = 'block';
            
            agregarAlHistorial(
                `Intervalo de Confianza: ${tipo}`,
                { tipo: tipo, nivel: nivelConfianza },
                resultado
            );
            
            mostrarToast('Intervalo calculado exitosamente', 'success');
            
        } catch (error) {
            document.getElementById('resultado-ci').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                    <p style="color: var(--error);">${error.message}</p>
                </div>
            `;
            mostrarToast(error.message, 'error');
        } finally {
            ocultarLoader();
        }
    }, 100);
}

function cdfNormal(z) {
    // Aproximación de la función de distribución acumulada normal estándar
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
}

function crearGraficoIntervalo(valor, limInf, limSup, titulo, confianza) {
    const ctx = document.getElementById('graficoIntervalos');
    
    if (chartInstances['graficoIntervalos']) {
        chartInstances['graficoIntervalos'].destroy();
    }
    
    const theme = document.body.getAttribute('data-theme');
    const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    
    // Calcular la desviación estándar aproximada del intervalo
    // Usamos z-scores para intervalos de confianza comunes
    const zScores = {
        90: 1.645,
        95: 1.96,
        99: 2.576
    };
    const z = zScores[confianza] || 1.96;
    const desviacion = (limSup - valor) / z;
    
    // Generar puntos para la curva normal
    const numPuntos = 200;
    const rango = (limSup - limInf) * 1.5;
    const inicio = valor - rango / 2;
    const fin = valor + rango / 2;
    const paso = (fin - inicio) / numPuntos;
    
    const puntosX = [];
    const puntosY = [];
    const puntosArea = [];
    
    for (let i = 0; i <= numPuntos; i++) {
        const x = inicio + i * paso;
        puntosX.push(x);
        
        // Fórmula de distribución normal
        const exponente = -Math.pow(x - valor, 2) / (2 * Math.pow(desviacion, 2));
        const y = (1 / (desviacion * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
        puntosY.push(y);
        
        // Puntos del área sombreada (1-α)
        if (x >= limInf && x <= limSup) {
            puntosArea.push({ x, y });
        }
    }
    
    chartInstances['graficoIntervalos'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: puntosX,
            datasets: [
                {
                    label: 'Distribución Normal',
                    data: puntosY,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: `Área de Confianza (${confianza}%)`,
                    data: puntosX.map((x, i) => {
                        return (x >= limInf && x <= limSup) ? puntosY[i] : null;
                    }),
                    borderColor: 'rgba(6, 182, 212, 1)',
                    backgroundColor: 'rgba(6, 182, 212, 0.3)',
                    borderWidth: 0,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.4,
                    spanGaps: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                title: {
                    display: true,
                    text: `Intervalo de Confianza al ${confianza}% - ${titulo}`,
                    color: textColor,
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const x = context.parsed.x;
                            if (x === valor) {
                                return `μ = ${valor.toFixed(4)}`;
                            } else if (Math.abs(x - limInf) < 0.01) {
                                return `Límite Inferior: ${limInf.toFixed(4)}`;
                            } else if (Math.abs(x - limSup) < 0.01) {
                                return `Límite Superior: ${limSup.toFixed(4)}`;
                            }
                            return `x = ${x.toFixed(4)}`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        limiteInferior: {
                            type: 'line',
                            xMin: limInf,
                            xMax: limInf,
                            borderColor: 'rgba(239, 68, 68, 0.8)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                display: true,
                                content: `x_α/2 = ${limInf.toFixed(3)}`,
                                position: 'start',
                                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                color: 'white'
                            }
                        },
                        limiteSuperior: {
                            type: 'line',
                            xMin: limSup,
                            xMax: limSup,
                            borderColor: 'rgba(239, 68, 68, 0.8)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                display: true,
                                content: `x_α/2 = ${limSup.toFixed(3)}`,
                                position: 'end',
                                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                color: 'white'
                            }
                        },
                        media: {
                            type: 'line',
                            xMin: valor,
                            xMax: valor,
                            borderColor: 'rgba(139, 92, 246, 1)',
                            borderWidth: 3,
                            label: {
                                display: true,
                                content: `μ = ${valor.toFixed(3)}`,
                                position: 'center',
                                backgroundColor: 'rgba(139, 92, 246, 1)',
                                color: 'white'
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { 
                        display: true, 
                        text: 'Valor',
                        color: textColor,
                        font: { size: 14 }
                    },
                    ticks: { 
                        color: textColor,
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    },
                    grid: { color: gridColor }
                },
                y: {
                    title: { 
                        display: true, 
                        text: 'Densidad de Probabilidad',
                        color: textColor,
                        font: { size: 14 }
                    },
                    ticks: { 
                        color: textColor,
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// ========== FIN DEL ARCHIVO ==========
console.log('✅ Calculadora Estadística Avanzada cargada correctamente');