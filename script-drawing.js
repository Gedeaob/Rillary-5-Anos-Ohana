document.addEventListener('DOMContentLoaded', () => {
    const drawingCanvas = document.getElementById('drawing-canvas');
    const bgCanvas = document.getElementById('background-canvas');
    const ctx = drawingCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    
    // Novas variáveis de UI
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
    
    // Lista de Imagens de Contorno
    const drawingImages = [
        'drawing 1.jpg', 'drawing 2.jpg', 'drawing 3.jpg', 
        'drawing 4.jpg', 'drawing 5.jpg'
    ];
    let selectedImageObj = null; 
    let lastLoadedImageName = null; 
    
    // Variáveis de Estado
    let drawing = false;
    let currentColor = '#4D87E6'; 
    let brushSize = 10;
    let currentTool = 'brush'; 
    
    // Configurações iniciais do Contexto
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

        // 1. Ajusta o tamanho dos DOIS Canvas
        drawingCanvas.width = size;
        drawingCanvas.height = size;
        bgCanvas.width = size;
        bgCanvas.height = size;
        
        // 2. Não limpa o canvas de desenho. Ele deve manter o que foi desenhado.
        // O bug de auto-apagamento é resolvido NÃO chamando ctx.clearRect() aqui.
        
        // 3. Redesenha a imagem de contorno no Canvas de Fundo (inferior)
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        if (selectedImageObj) {
            bgCtx.drawImage(selectedImageObj, 0, 0, bgCanvas.width, bgCanvas.height);
        }

        // 4. Reinicia as configurações de pincel
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
        const originalHeight = drawingCanvas.height;
        
        // Crie um canvas temporário maior para melhor qualidade de texto/saída (Ex: 800x800)
        const outputSize = 800;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = outputSize;
        tempCanvas.height = outputSize;
        const tempCtx = tempCanvas.getContext('2d');

        // Escala para o Canvas Temporário
        const scale = outputSize / originalWidth;

        // 1. Desenha o fundo e o desenho escalados
        tempCtx.drawImage(bgCanvas, 0, 0, tempCanvas.width, tempCanvas.height); 
        tempCtx.drawImage(drawingCanvas, 0, 0, tempCanvas.width, tempCanvas.height); 

        // 2. --- LÓGICA DA MARCA D'ÁGUA DE ALTA QUALIDADE ---
        
        const padding = outputSize * 0.04; 

        // Rillary (Pacifico)
        const rillaryFontSize = outputSize * 0.08;
        tempCtx.font = `${rillaryFontSize}px 'Pacifico', cursive`;
        tempCtx.textAlign = 'left';
        tempCtx.shadowColor = 'rgba(255, 139, 160, 0.7)';
        tempCtx.shadowBlur = outputSize * 0.005;
        tempCtx.fillStyle = '#4D87E6'; 
        
        const rillaryText = 'Rillary 5 Aninhos 🌸';
        tempCtx.fillText(rillaryText, padding, padding + rillaryFontSize);
        
        // Mensagem de Agradecimento (Bubblegum Sans)
        const thankYouFontSize = outputSize * 0.04; 
        tempCtx.font = `${thankYouFontSize}px 'Bubblegum Sans', cursive`;
        tempCtx.fillStyle = '#FF8BA0'; 
        tempCtx.shadowBlur = outputSize * 0.003;
        
        const thankYouText = 'Muito obrigada por usar o meu site.';
        tempCtx.fillText(thankYouText, padding, padding + rillaryFontSize + thankYouFontSize + (outputSize * 0.01));
        
        // 3. Salvar a imagem/PDF
        
        if (format === 'pdf') {
             // Lógica de PDF (Requer biblioteca jsPDF ou similar - Aqui apenas simula o download)
             alert('A opção PDF requer uma biblioteca externa (como jsPDF) e mais configuração. Para simplicidade e compatibilidade no GitHub Pages, baixe em PNG ou JPG e use um conversor online se necessário.');
             return;
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

    // Controles de Cor
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            updateColor(swatch.dataset.color, swatch);
            setActiveTool('brush'); 
        });
    });
    colorInput.addEventListener('input', (e) => {
        colorPickerButton.style.backgroundColor = e.target.value;
        updateColor(e.target.value, colorPickerButton);
        setActiveTool('brush'); 
    });
    
    // Ferramentas
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveTool(button.dataset.tool);
        });
    });

    // Barra Deslizante de Tamanho (NOVA LÓGICA)
    brushSizeSlider.addEventListener('input', () => {
        brushSize = parseInt(brushSizeSlider.value);
        ctx.lineWidth = brushSize;
        currentSizeDisplay.textContent = `${brushSize} px`;
        // Remove a seleção visual dos botões antigos se houver
        document.querySelectorAll('.size-button').forEach(btn => btn.classList.remove('selected-size'));
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
