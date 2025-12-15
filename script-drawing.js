document.addEventListener('DOMContentLoaded', () => {
    const drawingCanvas = document.getElementById('drawing-canvas');
    const bgCanvas = document.getElementById('background-canvas');
    const ctx = drawingCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    
    const clearButton = document.getElementById('clear-canvas');
    const openSaveOptionsButton = document.getElementById('open-save-options');
    const saveOptionsDiv = document.getElementById('save-options');
    const downloadButtons = document.querySelectorAll('.download-btn');
    const brushSizeSlider = document.getElementById('brush-size-slider');
    const currentSizeDisplay = document.getElementById('current-size-display');
    const freeDrawButton = document.getElementById('free-draw-button');
    const imageSelectionGrid = document.getElementById('image-selection-grid');
    const toolButtons = document.querySelectorAll('.tool-button');
    const colorSwatches = document.querySelectorAll('#color-palette .color-swatch');
    const colorInput = document.getElementById('color-input');
    const colorPickerButton = document.querySelector('.color-picker-button');
    
    const drawingImages = [
        'drawing 1.jpg', 'drawing 2.jpg', 'drawing 3.jpg', 
        'drawing 4.jpg', 'drawing 5.jpg'
    ];
    let selectedImageObj = null; 
    let lastLoadedImageName = null; 
    
    let drawing = false;
    let currentColor = '#4D87E6'; 
    let brushSize = 10;
    let currentTool = 'brush'; 
    
    // Configurações iniciais
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = currentColor;
    ctx.globalCompositeOperation = 'source-over'; 

    // ----------------------------------------------------
    // Funções de Inicialização e Responsividade
    // ----------------------------------------------------
    
    function resizeCanvas() {
        const wrapper = drawingCanvas.parentElement;
        const size = Math.min(wrapper.clientWidth - 20, 600);

        drawingCanvas.width = size;
        drawingCanvas.height = size;
        bgCanvas.width = size;
        bgCanvas.height = size;
        
        // CORREÇÃO: Não limpa o canvas de desenho (ctx.clearRect) aqui. O desenho deve persistir.
        
        // Redesenha a imagem de contorno no Canvas de Fundo
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        if (selectedImageObj) {
            bgCtx.drawImage(selectedImageObj, 0, 0, bgCanvas.width, bgCanvas.height);
        }

        // Reinicia as configurações de pincel
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        setActiveTool(currentTool, false); 
    }
    
    function selectDrawingImage(selectedOption, fileName) {
        document.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
        selectedOption.classList.add('selected');
        
        if (lastLoadedImageName !== fileName) {
            selectedImageObj = new Image();
            selectedImageObj.crossOrigin = "anonymous";
            
            selectedImageObj.onload = () => {
                lastLoadedImageName = fileName;
                // Limpa o desenho anterior ao carregar nova imagem
                ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                resizeCanvas();
            };
            selectedImageObj.src = `images/drawing/${fileName}`;
        } else {
            resizeCanvas(); 
        }
    }
    
    // (setupImageSelection, getPosition, startDrawing, draw, stopDrawing - MANTIDOS)
    
    function setupImageSelection() {
        imageSelectionGrid.innerHTML = '';
        drawingImages.forEach((fileName, index) => {
            const option = document.createElement('div');
            option.classList.add('image-option');
            option.dataset.image = fileName;
            
            const img = document.createElement('img');
            img.src = `images/drawing/${fileName}`;
            img.alt = `Desenho para colorir ${index + 1}`;
            option.appendChild(img);
            
            option.addEventListener('click', () => {
                selectDrawingImage(option, fileName);
            });
            imageSelectionGrid.appendChild(option);
        });
    }
    
    function getPosition(e) { 
        const rect = drawingCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDrawing(e) {
        drawing = true;
        const pos = getPosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault(); 
    }

    function draw(e) { 
        if (!drawing) return;
        const pos = getPosition(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function stopDrawing() { 
        if (drawing) {
            ctx.closePath();
            drawing = false;
        }
    }


    // ----------------------------------------------------
    // Lógica da Borracha e Tamanho do Pincel
    // ----------------------------------------------------

    function setActiveTool(tool, updateUI = true) {
        currentTool = tool;

        if (updateUI) {
            toolButtons.forEach(btn => btn.classList.remove('selected-tool'));
            document.querySelector(`[data-tool="${tool}"]`).classList.add('selected-tool');
        }

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
        }
    }

    function updateColor(color, element) {
        currentColor = color;
        if (currentTool === 'brush') {
            ctx.strokeStyle = currentColor;
        }
        
        document.querySelectorAll('.color-swatch, .color-picker-button').forEach(s => s.classList.remove('selected'));
        if (element) {
             element.classList.add('selected');
        }
    }
    
    // Lógica para Salvar e Marca D'água (Melhor Qualidade)
    function saveDrawing(format) {
        const originalWidth = drawingCanvas.width;
        
        // Define um tamanho de saída fixo de alta resolução (800x800)
        const outputSize = 800; 
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = outputSize;
        tempCanvas.height = outputSize;
        const tempCtx = tempCanvas.getContext('2d');

        // Escala
        const scale = outputSize / originalWidth;

        // 1. Desenha o fundo e o desenho escalados
        tempCtx.drawImage(bgCanvas, 0, 0, tempCanvas.width, tempCanvas.height); 
        tempCtx.drawImage(drawingCanvas, 0, 0, tempCanvas.width, tempCanvas.height); 

        // 2. --- LÓGICA DA MARCA D'ÁGUA DE ALTA QUALIDADE ---
        
        const padding = outputSize * 0.04; 
        
        // Rillary 5 Aninhos (Pacifico)
        const rillaryFontSize = outputSize * 0.07; // Fonte maior para nitidez
        tempCtx.font = `${rillaryFontSize}px 'Pacifico', cursive`;
        tempCtx.textAlign = 'left';
        tempCtx.shadowColor = 'rgba(255, 139, 160, 0.7)';
        tempCtx.shadowBlur = outputSize * 0.005;
        tempCtx.fillStyle = '#4D87E6'; 
        
        const rillaryText = 'Rillary 5 Aninhos 🌸';
        const rillaryY = padding + rillaryFontSize;
        tempCtx.fillText(rillaryText, padding, rillaryY);
        
        // Mensagem de Agradecimento (Bubblegum Sans)
        const thankYouFontSize = outputSize * 0.04; 
        tempCtx.font = `${thankYouFontSize}px 'Bubblegum Sans', cursive`;
        tempCtx.fillStyle = '#FF8BA0'; 
        tempCtx.shadowBlur = outputSize * 0.003;
        
        const thankYouText = 'Muito obrigada por usar o meu site.';
        const thankYouY = rillaryY + thankYouFontSize + (outputSize * 0.01);
        tempCtx.fillText(thankYouText, padding, thankYouY);
        
        // 3. Salvar a imagem/PDF
        
        if (format === 'pdf') {
             // AVISO: A opção PDF requer uma biblioteca externa. Usaremos a saída PNG para download
             alert('A opção PDF é complexa para o GitHub Pages. Baixe em PNG/JPG e use um conversor online para imprimir. Baixando como PNG.');
             format = 'png';
        }
        
        let mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        let quality = format === 'jpg' ? 0.9 : 1.0;

        const dataURL = tempCanvas.toDataURL(mimeType, quality);
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `Desenho_Rillary_5Anos.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert(`Desenho salvo em ${format.toUpperCase()}!`);

        // Esconde as opções de salvamento
        saveOptionsDiv.style.display = 'none';
    }


    // ----------------------------------------------------
    // Event Listeners e Controles
    // ----------------------------------------------------

    // Desenho/Toque
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('touchstart', startDrawing);
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchcancel', stopDrawing);
    drawingCanvas.addEventListener('touchmove', draw);

    // Controles de Cor e Ferramentas (mantidos)

    // Barra Deslizante de Tamanho (NOVA LÓGICA)
    brushSizeSlider.addEventListener('input', () => {
        brushSize = parseInt(brushSizeSlider.value);
        ctx.lineWidth = brushSize;
        currentSizeDisplay.textContent = `${brushSize} px`;
    });
    
    // Botão Limpar
    clearButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar apenas o seu desenho?')) {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            alert('Seu desenho foi limpo! O contorno permanece.');
        }
    });

    // Botão Desenho Livre
    freeDrawButton.addEventListener('click', () => {
        document.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
        selectedImageObj = null; 
        lastLoadedImageName = null;
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); // Limpa o desenho
        resizeCanvas(); 
        alert('Modo de Desenho Livre ativado! Tela Branca.');
    });
    
    // Botão Abrir Opções de Salvar
    openSaveOptionsButton.addEventListener('click', () => {
        saveOptionsDiv.style.display = saveOptionsDiv.style.display === 'none' ? 'block' : 'none';
    });
    
    // Botões de Download
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveDrawing(btn.dataset.format);
        });
    });

    // ----------------------------------------------------
    // Inicialização
    // ----------------------------------------------------
    setupImageSelection();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    updateColor(colorSwatches[0].dataset.color, colorSwatches[0]);
    setActiveTool('brush', false);
});
