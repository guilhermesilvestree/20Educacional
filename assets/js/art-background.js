// assets/js/art-background.js

// --- 1. DEFINIÇÃO DOS TEMAS (Configuração de Performance por Tema) ---
const THEMES = {
    DEFAULT: {
        color: () => `hsl(${Math.random() * 360}, 70%, 50%)`,
        size: () => Math.random() * 1.5 + 0.5,
        linkDistance: 100,
        shape: 'circle',
        speed: 0.2 // Reduzida
    },
    ROSE: {
        color: () => `hsl(${Math.random() * 40 + 320}, 80%, 65%)`, 
        size: () => Math.random() * 3 + 1.5,
        linkDistance: 120,
        shape: 'text',
        text: '❤️',
        speed: 0.15 // Mais lento
    },
    CYAN_TECH: {
        color: () => `hsl(${Math.random() * 60 + 180}, 85%, 60%)`,
        size: () => Math.random() * 1.8 + 0.5,
        linkDistance: 150,
        shape: 'circle',
        speed: 0.25 // Velocidade mantida
    },
    GREEN_NATURE: {
        color: () => `hsl(${Math.random() * 80 + 90}, 65%, 45%)`,
        size: () => Math.random() * 2 + 0.8,
        linkDistance: 90,
        shape: 'circle',
        speed: 0.1 // Mais lento
    }
};

function inicializarAnimacaoDeFundo(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas com ID '${canvasId}' não encontrado.`);
        return;
    }
    const ctx = canvas.getContext("2d");
    let particlesArray;

    // --- 2. LÓGICA DE CARREGAMENTO DO TEMA ---
    const storedThemeName = localStorage.getItem('themeBackground') || 'DEFAULT';
    const themeConfig = THEMES[storedThemeName] || THEMES.DEFAULT;
    
    // --- Funções Auxiliares de Tamanho ---
    function setCanvasSize() {
        if (canvasId === 'art-background') {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else {
            const mainContent = document.querySelector(".main-content");
            if (mainContent) {
                canvas.width = mainContent.clientWidth;
                canvas.height = mainContent.clientHeight;
            } else {
                 canvas.width = window.innerWidth;
                 canvas.height = window.innerHeight;
            }
        }
    }
    setCanvasSize();

    // --- 3. CLASSE PARTICLE ADAPTADA AO TEMA ---
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = themeConfig.size();
            this.speedX = Math.random() * (themeConfig.speed * 2) - themeConfig.speed;
            this.speedY = Math.random() * (themeConfig.speed * 2) - themeConfig.speed;
            this.color = themeConfig.color();
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            this.draw();
        }
        draw() {
            ctx.fillStyle = this.color;
            if (themeConfig.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (themeConfig.shape === 'text') {
                // Para emojis/texto
                ctx.font = `bold ${this.size * 10}px Poppins`; 
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(themeConfig.text, this.x, this.y);
            }
        }
    }

    function init() {
        particlesArray = [];
        let numberOfParticles = Math.min(100, Math.floor((canvas.height * canvas.width) / 20000));
        
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    init();

    // Função auxiliar para converter HSL para RGB (necessário para a opacidade)
    function hslToRgb(hsl, defaultRgb = '255,255,255') {
      if(!hsl || typeof hsl !== 'string') return defaultRgb; 
      const hslMatch = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (!hslMatch) return defaultRgb;

      let h = parseInt(hslMatch[1]), s = parseInt(hslMatch[2]) / 100, l = parseInt(hslMatch[3]) / 100;
      let c = (1 - Math.abs(2 * l - 1)) * s,
          x = c * (1 - Math.abs((h / 60) % 2 - 1)),
          m = l - c / 2,
          r = 0, g = 0, b = 0;

      if (0 <= h && h < 60) { r = c; g = x; b = 0; } else if (60 <= h && h < 120) { r = x; g = c; b = 0; } else if (120 <= h && h < 180) { r = 0; g = c; b = x; } else if (180 <= h && h < 240) { r = 0; g = x; b = c; } else if (240 <= h && h < 300) { r = x; g = 0; b = c; } else if (300 <= h && h < 360) { r = c; g = 0; b = x; } 

      r = Math.round((r + m) * 255); g = Math.round((g + m) * 255); b = Math.round((b + m) * 255); 
      return `${r},${g},${b}`;
    }

    function connect() {
        const linkDistance = themeConfig.linkDistance;
        const linkDistanceSq = linkDistance * linkDistance;
        const particles = particlesArray; 
        const n = particles.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                
                // OTIMIZAÇÃO: Compara o quadrado da distância (evita Math.sqrt() desnecessário)
                const distanceSq = dx * dx + dy * dy; 

                if (distanceSq < linkDistanceSq) {
                    const distance = Math.sqrt(distanceSq); // Calcula a raiz APENAS se a distância for relevante
                    let opacityValue = 1 - (distance / linkDistance);
                    
                    const rgbColor = hslToRgb(particles[i].color);

                    ctx.beginPath();
                    // Otimização: A opacidade é reduzida para 50% do valor calculado
                    ctx.strokeStyle = `rgba(${rgbColor}, ${opacityValue * 0.5})`; 
                    ctx.lineWidth = 0.2;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        requestAnimationFrame(animate);
    }
    
    animate();

    window.addEventListener("resize", () => {
        setCanvasSize();
        init();
    });
}

// Exporta a função para que ela possa ser importada em outros arquivos
export { inicializarAnimacaoDeFundo };