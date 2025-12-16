// ========== SCRIPT PARA CAMBIO DE TEMA ==========
// Este script debe cargarse ANTES que cualquier otro JavaScript

(function() {
    'use strict';
    
    console.log('🎨 Inicializando sistema de temas...');
    
    // Función para aplicar el tema
    function applyTheme(theme) {
        console.log('Aplicando tema:', theme);
        
        // Aplicar el atributo data-theme a múltiples elementos
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        
        // También aplicar clases por si acaso
        document.documentElement.className = theme;
        document.body.className = theme;
        
        // Forzar actualización de variables CSS
        document.documentElement.style.setProperty('--current-theme', theme);
        
        console.log('✅ Tema aplicado a:', {
            html: document.documentElement.getAttribute('data-theme'),
            body: document.body.getAttribute('data-theme')
        });
    }
    
    // Función para actualizar el icono del botón
    function updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
            console.log('🔄 Icono actualizado para tema:', theme);
        }
    }
    
    // Función principal para cambiar el tema
    window.toggleTheme = function() {
        console.log('🖱️ Click en botón de tema');
        
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('Cambiando de', currentTheme, 'a', newTheme);
        
        // Aplicar el nuevo tema
        applyTheme(newTheme);
        
        // Guardar en localStorage
        try {
            localStorage.setItem('theme', newTheme);
            console.log('💾 Tema guardado en localStorage:', newTheme);
        } catch (e) {
            console.error('❌ Error guardando tema:', e);
        }
        
        // Actualizar icono
        updateThemeIcon(newTheme);
        
        // Mostrar notificación si la función existe
        if (typeof mostrarToast === 'function') {
            mostrarToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
        }
        
        // Forzar repaint
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        console.log('✨ Cambio de tema completado');
    };
    
    // Cargar tema al iniciar
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM cargado, aplicando tema inicial');
        
        // Obtener tema guardado o usar dark por defecto
        let savedTheme = 'dark';
        try {
            savedTheme = localStorage.getItem('theme') || 'dark';
            console.log('📂 Tema desde localStorage:', savedTheme);
        } catch (e) {
            console.error('❌ Error leyendo localStorage:', e);
        }
        
        // Aplicar el tema inicial
        applyTheme(savedTheme);
        updateThemeIcon(savedTheme);
        
        console.log('🎉 Sistema de temas inicializado correctamente');
    });
    
    // También aplicar el tema inmediatamente (antes del DOMContentLoaded)
    // para evitar flash de contenido
    try {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
    } catch (e) {
        applyTheme('dark');
    }
    
})();