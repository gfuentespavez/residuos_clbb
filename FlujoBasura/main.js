import { garbageData, comunaCoords, rellenoCoords } from './data.js';

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VybWFuZnVlbnRlcyIsImEiOiJjbWN4eG5vbzAwam90Mmpva2lqeWZteXUxIn0._4skowp2WM5yDc_sywRDkA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-72.9, -36.8],
    zoom: 8.5,
    pitch: 45
});

const canvas = document.getElementById('flow');
const ctx = canvas.getContext('2d');


let flows = [];

function resizeCanvas() {
    canvas.width = map.getCanvas().width;
    canvas.height = map.getCanvas().height;
}

function hexToRGBA(hex, opacity) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${opacity})`;
}

function getTierConfig(tons) {
    if (tons >= 300) return { tier: 3, color: "#ff00ff" };
    if (tons >= 100) return { tier: 2, color: "#00ff99" };
    return { tier: 1, color: "#00ffff" };
}

function createFlows() {
    flows = [];
    garbageData.forEach(data => {
        const startLngLat = comunaCoords[data.comuna];
        const endLngLat = rellenoCoords[data.relleno];
        const { tier, color } = getTierConfig(data.toneladas);
        for (let i = 0; i < tier; i++) {
            flows.push({
                startLngLat,
                endLngLat,
                offset: i * 55,
                color,
                tier,
                toneladas: data.toneladas,
                particles: [],
            });
        }
    });
}

function animate() {
    function frame() {
        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const zoom = map.getZoom();

        flows.forEach(flow => {
            const start = map.project(flow.startLngLat);
            const end = map.project(flow.endLngLat);
            const mx = (start.x + end.x) / 2;
            const my = (start.y + end.y) / 2;
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const norm = Math.hypot(dx, dy);
            const offsetX = flow.offset * -dy / norm;
            const offsetY = flow.offset * dx / norm;
            const control = { x: mx + offsetX, y: my + offsetY };

            if (flow.particles.length === 0) {
                const baseDots = 8 + flow.tier * 3;
                let dotCount;
                if (flow.tier === 3) {
                    const inverseZoom = Math.max(1, (14 - zoom) / 4);
                    dotCount = Math.min(30, Math.floor(baseDots * Math.pow(inverseZoom, 1.5)));
                } else {
                    dotCount = Math.min(18, Math.floor(baseDots * Math.pow(zoom / 10, 1.2)));
                }
                flow.particles = Array.from({ length: dotCount }, () => ({
                    t: Math.random(),
                    speed: 0.0015 + Math.random() * 0.0005
                }));
            }

            flow.particles.forEach(p => {
                p.t = (p.t + p.speed) % 1;
                const t = p.t;
                const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * control.x + Math.pow(t, 2) * end.x;
                const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * control.y + Math.pow(t, 2) * end.y;
                const fade = 0.08;
                const opacity = t < fade ? t / fade :
                    t > 1 - fade ? (1 - t) / fade : 1;
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = hexToRGBA(flow.color, opacity);
                ctx.shadowColor = flow.color;
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        });

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

map.on('load', () => {
    resizeCanvas();
    createFlows();
    animate();
});

map.on('resize', resizeCanvas);
map.on('move', () => { flows.forEach(f => f.particles = []); });
map.on('zoom', () => { flows.forEach(f => f.particles = []); });
map.on('rotate', () => { flows.forEach(f => f.particles = []); });
map.on('pitch', () => { flows.forEach(f => f.particles = []); });