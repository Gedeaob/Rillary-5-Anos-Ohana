document.addEventListener('DOMContentLoaded', () => {
    // Mapeamento dos DOIS canvas e seus contextos
    const drawingCanvas = document.getElementById('drawing-canvas'); // Camada Superior (Interativa)
    const bgCanvas = document.getElementById('background-canvas');   // Camada Inferior (Fundo Estático)

    const ctx = drawingCanvas.getContext('2d'); // Contexto de Desenho (Para pincel e borracha)
    const bgCtx = bgCanvas.getContext('2d');   // Contexto de Fundo (Para a imagem de contorno)
    
    // Variáveis de Mapeamento
    const palette = document.getElementById('color-palette');
    const clearButton = document.getElementById('clear-canvas');
    const saveButton = document.getElementById('save-drawing');
    const colorSwatches = palette.querySelectorAll('.color-swatch');
    const colorInput = document.getElementById('color-input');
    const colorPickerButton = document.querySelector('.color-picker-button');
    const freeDrawButton = document.getElementById('free-draw-button');
    const imageSelectionGrid = document.getElementById('image-selection-grid');
    const toolButtons = document.querySelectorAll('.tool-button');
    const sizeButtons = document.querySelectorAll('.size-button');
    
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
    
    // Configurações iniciais do Contexto (Aplicado APENAS ao ctx)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = currentColor;
    ctx.globalCompositeOperation = 'source-over'; 

    // ----------------------------------------------------
    // Funções de Inicialização e Responsividade
    // ----------------------------------------------------
    
    /**
     * Ajusta o tamanho dos DOIS canvas e redesenha a imagem de fundo no canvas INFERIOR.
     */
    function resizeCanvas() {
        const wrapper = drawingCanvas.parentElement;
        const size = Math.min(wrapper.clientWidth, 600);

        // 1. Ajusta o tamanho dos DOIS Canvas
        drawingCanvas.width = size;
        drawingCanvas.height = size;
        bgCanvas.width = size;
        bgCanvas.height = size;
        
        // 2. Limpa SOMENTE o Canvas de Desenho (superior)
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        // 3. Redesenha a imagem de contorno no Canvas de Fundo (inferior)
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        if (selectedImageObj) {
            bgCtx.drawImage(selectedImageObj, 0, 0, bgCanvas.width, bgCanvas.height);
        }

        // 4. Reinicia as configurações do pincel/borracha (apenas no ctx)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        setActiveTool(currentTool, false); // Re-aplica a ferramenta para atualizar o globalCompositeOperation
    }
    
    /**
     * Seleciona uma imagem de contorno.
     */
    function selectDrawingImage(selectedOption, fileName) {
        document.querySelectorAll('.image-option').forEach(opt => opt.classList.remove('selected'));
        selectedOption.classList.add('selected');
        
        if (lastLoadedImageName !== fileName) {
            selectedImageObj = new Image();
            // *** LINHA ADICIONADA: Configura o CORS para evitar o erro de poluição ***
            selectedImageObj.crossOrigin = "anonymous"; 
            
            selectedImageObj.onload = () => {
                lastLoadedImageName = fileName;
                resizeCanvas();
            };
            selectedImageObj.src = `images/drawing/${fileName}`;
        } else {
            resizeCanvas(); // Apenas limpa o canvas superior
        }
    }

    // [Funções de Posicionamento e Evento (Desenho/Toque)]

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

    /** Define a ferramenta ativa (Pincel ou Borracha) */
    function setActiveTool(tool, updateUI = true) {
        currentTool = tool;

        if (updateUI) {
            // Atualiza o CSS de seleção dos botões
            toolButtons.forEach(btn => btn.classList.remove('selected-tool'));
            document.querySelector(`[data-tool="${tool}"]`).classList.add('selected-tool');
        }

        if (tool === 'eraser') {
            // Borracha: usa 'destination-out' para apagar pixels EXISTENTES no ctx.
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            // Pincel: volta para 'source-over'
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
        }
    }

    /** Atualiza a cor do pincel e a seleção visual */
    function updateColor(color, element) {
        currentColor = color;
        // Só atualiza o strokeStyle se o modo for Pincel
        if (currentTool === 'brush') {
            ctx.strokeStyle = currentColor;
        }
        
        document.querySelectorAll('.color-swatch, .color-picker-button').forEach(s => s.classList.remove('selected'));
        element.classList.add('selected');
    }
    
    // [Funções setupImageSelection (Mantida)]
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

    // ----------------------------------------------------
    // Event Listeners
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

    // Seleção de Cor
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
    colorPickerButton.addEventListener('click', () => {
        colorInput.value = currentColor;
    });

    // Ferramentas
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveTool(button.dataset.tool);
        });
    });

    // Tamanho do Pincel/Borracha
    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            brushSize = parseInt(button.dataset.size);
            ctx.lineWidth = brushSize;
            sizeButtons.forEach(btn => btn.classList.remove('selected-size'));
            button.classList.add('selected-size');
        });
    });

    // Botão Limpar (Agora só limpa o Canvas Superior!)
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
        resizeCanvas(); // Limpa e redesenha o fundo (que será branco, pois selectedImageObj é null)
        alert('Modo de Desenho Livre ativado! Divirta-se!');
    });
    
    // Botão Salvar Desenho (Otimizado para salvar ambas as camadas COM MARCA D'ÁGUA)
    saveButton.addEventListener('click', () => {
        // Cria um canvas temporário para juntar as duas camadas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawingCanvas.width;
        tempCanvas.height = drawingCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // 1. Desenha o fundo (imagem de contorno)
        tempCtx.drawImage(bgCanvas, 0, 0); 
        // 2. Desenha o desenho do usuário por cima
        tempCtx.drawImage(drawingCanvas, 0, 0); 

        // 3. --- LÓGICA DA MARCA D'ÁGUA NO TOPO ---
        
        const canvasWidth = tempCanvas.width;
        const canvasHeight = tempCanvas.height;
        
        // Usaremos uma área no topo para a marca d'água, deixando o resto para o desenho.
        const headerHeight = canvasHeight * 0.15; // 15% do topo para o cabeçalho
        const padding = canvasWidth * 0.03;       // 3% de margem lateral

        // Configuração da cor e sombra da marca d'água
        tempCtx.shadowColor = 'rgba(255, 139, 160, 0.7)'; 
        tempCtx.shadowBlur = 5;
        tempCtx.fillStyle = '#4D87E6'; 

        // --- Nome "Rillary" (Fonte Pacifico) ---
        const rillaryFontSize = canvasWidth * 0.06; // Reduzido para caber no topo
        tempCtx.font = `${rillaryFontSize}px 'Pacifico', cursive`;
        tempCtx.textAlign = 'left'; // Alinha o texto à esquerda
        
        const rillaryText = 'Rillary';
        const rillaryX = padding;
        const rillaryY = padding + rillaryFontSize; // Posiciona no topo, com margem

        tempCtx.fillText(rillaryText, rillaryX, rillaryY);

        // --- Frase "5 aninhos 🌸" (Fonte Bubblegum Sans) ---
        const ageFontSize = canvasWidth * 0.04; // Reduzido
        tempCtx.font = `${ageFontSize}px 'Bubblegum Sans', cursive`;
        tempCtx.fillStyle = '#FF8BA0'; 
        tempCtx.shadowColor = 'rgba(77, 135, 230, 0.7)';
        
        const ageText = '5 aninhos 🌸';
        const ageX = padding;
        const ageY = rillaryY + ageFontSize + (canvasWidth * 0.01); // Abaixo do nome Rillary
        
        tempCtx.fillText(ageText, ageX, ageY);
        
        // 4. Salvar a imagem
        const dataURL = tempCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `Desenho_Rillary_5Anos_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert('Desenho final (contorno + cores) salvo!');
    });
    
    // ----------------------------------------------------
    // Inicialização
    // ----------------------------------------------------
    setupImageSelection();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    updateColor(colorSwatches[0].dataset.color, colorSwatches[0]);
    setActiveTool('brush', false); // Chama para configurar o ctx, mas sem re-selecionar o botão
});