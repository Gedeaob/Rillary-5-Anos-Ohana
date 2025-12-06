document.addEventListener('DOMContentLoaded', () => {
    const stitchImage = document.querySelector('.stitch-image');
    
    // Animação de Entrada
    const rillaryName = document.querySelector('.rillary-name');
    const ageText = document.querySelector('.age-text');
    
    setTimeout(() => {
        rillaryName.style.opacity = '1';
        rillaryName.style.transform = 'translateY(0)';
        
        ageText.style.opacity = '1';
        ageText.style.transform = 'translateY(0)';
    }, 100);

    // Animação Pulsante na Imagem do Stitch
    if (stitchImage) {
        // Adiciona a classe 'pulse' para iniciar a animação CSS
        stitchImage.classList.add('pulse');
    }
});