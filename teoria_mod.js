// Script adicional para teoria.html - Funcionalidades mejoradas

// Función para ir a la calculadora
function irACalculadora() {
    window.location.href = 'index.html';
}

// Función para generar PDF de la teoría
async function generarPDF() {
    const overlay = document.getElementById('pdf-loading');
    overlay.classList.add('active');
    
    try {
        // Obtener el contenido actual mostrado
        const content = document.getElementById('topic-content');
        
        if (!content || content.innerHTML.trim() === '') {
            alert('Por favor, selecciona un tema primero para generar el PDF.');
            overlay.classList.remove('active');
            return;
        }
        
        // Clonar el contenido para no afectar la visualización
        const clonedContent = content.cloneNode(true);
        
        // Crear un contenedor temporal para el PDF
        const pdfContainer = document.createElement('div');
        pdfContainer.style.padding = '20px';
        pdfContainer.style.fontFamily = 'Arial, sans-serif';
        pdfContainer.style.fontSize = '12px';
        pdfContainer.appendChild(clonedContent);
        
        // Configuración de html2pdf
        const opt = {
            margin: [15, 15, 15, 15],
            filename: 'Estadistica_Teoria.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Esperar a que MathJax termine de renderizar
        if (window.MathJax) {
            await MathJax.typesetPromise([pdfContainer]);
            // Dar tiempo extra para renderizado
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Generar PDF
        await html2pdf().set(opt).from(pdfContainer).save();
        
        // Mensaje de éxito
        setTimeout(() => {
            alert('✅ PDF generado exitosamente');
        }, 500);
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('❌ Error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
        overlay.classList.remove('active');
    }
}

// Agregar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Funcionalidades adicionales de teoría cargadas');
});
