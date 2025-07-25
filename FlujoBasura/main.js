import { garbageData, comunaCoords, rellenoCoords } from './data.js';
import { routes } from './routes.js';

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VybWFuZnVlbnRlcyIsImEiOiJjbWN4eG5vbzAwam90Mmpva2lqeWZteXUxIn0._4skowp2WM5yDc_sywRDkA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/germanfuentes/cmcybcvt501b001s4473g8ttb',
    center: [-72.97963, -37.57494],
    zoom: 8.06,
});

const canvas = document.getElementById('flow');
const ctx = canvas.getContext('2d');
const labelContainer = document.getElementById('label-container');

let flows = [];
let activeRellenos = [];
let activeComunaFilter = null;

export const rellenoColors = {
    "Relleno Cemarc Penco": "#FFF3A3",
    "Relleno Los Ángeles": "#FA697C",
    "Relleno Fundo Las Cruces": "#F39E60",
    "Vertedero Licura": "#DD356E",
    "Relleno Sanitario Arauco Curanilahue": "#008891"
};

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function hexToRGBA(hex, opacity) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${opacity})`;
}

function getTierConfig(tons) {
    if (tons > 30000) return { tier: 3 };
    if (tons > 10000) return { tier: 2 };
    return { tier: 1 };
}

function createFlows(selectedRellenos = []) {
    flows = [];
    const zoomLevel = map.getZoom();
    const simplified = zoomLevel < 8.06;

    garbageData.forEach(data => {
        if (selectedRellenos.length && !selectedRellenos.includes(data.relleno)) return;
        if (activeComunaFilter && !activeComunaFilter.includes(data.comuna)) return;

        const startLngLat = comunaCoords[data.comuna];
        const endLngLat = rellenoCoords[data.relleno];
        const color = rellenoColors[data.relleno] || "#ffffff";
        const {tier} = getTierConfig(data.toneladas);

        const arcCount = simplified ? 1 : tier;

        const path = routes[data.route];
        const routeLength = path
            ? path.reduce((sum, [lng1, lat1], i, arr) => {
                if (i === 0) return sum;
                const [lng0, lat0] = arr[i - 1];
                const dx = lng1 - lng0;
                const dy = lat1 - lat0;
                return sum + Math.hypot(dx, dy); // crude distance
            }, 0)
            : null;
        // 🚮 Main flow: comuna ➡ landfill
        for (let i = 0; i < arcCount; i++) {
            flows.push({
                startLngLat,
                endLngLat,
                offset: i * 20,
                color,
                tier,
                toneladas: data.toneladas,
                particles: [],
                isRecycled: false,
                path,
                routeLength
            });
        }

        // ♻️ Reverse flow: landfill ➡ comuna (recycling)
        if (data.reciclaje && data.reciclaje > 0) {
            const recicloTier = getTierConfig(data.reciclaje).tier;
            const recicloColor = "#8EE89E";
            const recicloArcs = simplified ? 1 : recicloTier;

            for (let i = 0; i < recicloArcs; i++) {
                flows.push({
                    startLngLat: endLngLat,
                    endLngLat: startLngLat,
                    offset: i * 50 + 50, // 🔧 slight offset for separation
                    color: recicloColor,
                    tier: recicloTier,
                    toneladas: data.reciclaje,
                    particles: [],
                    isRecycled: true
                });
            }
        }
    });
}

function updateLabels(activeRellenos = []) {
    labelContainer.innerHTML = '';
    Object.entries(rellenoCoords).forEach(([name, coord]) => {
        if (activeRellenos.length && !activeRellenos.includes(name)) return;
        const pos = map.project(coord);
        const label = document.createElement('div');
        label.className = 'relleno-label';
        label.textContent = name;
        label.style.left = `${pos.x}px`;
        label.style.top = `${pos.y}px`;
        labelContainer.appendChild(label);
    });

    const zoom = map.getZoom();
    if (zoom < 8.5) return;

    const displayedComunas = new Set();
    garbageData.forEach(data => {
        if (activeRellenos.length && !activeRellenos.includes(data.relleno)) return;
        if (activeComunaFilter && !activeComunaFilter.includes(data.comuna)) return;
        displayedComunas.add(data.comuna);
    });

    displayedComunas.forEach(comuna => {
        const coord = comunaCoords[comuna];
        const pos = map.project(coord);

        const pinWrapper = document.createElement('div');
        pinWrapper.className = 'comuna-pin-wrapper';
        pinWrapper.style.left = `${pos.x}px`;
        pinWrapper.style.top = `${pos.y}px`;

        const pinDot = document.createElement('div');
        pinDot.className = 'comuna-pin-dot';

        const label = document.createElement('div');
        label.className = 'comuna-pin-label';
        label.textContent = comuna;

        if (activeComunaFilter?.includes(comuna)) {
            label.classList.add('selected-comuna');
        }

        label.addEventListener('click', () => {
            if (!Array.isArray(activeComunaFilter)) activeComunaFilter = [];

            const index = activeComunaFilter.indexOf(comuna);
            if (index >= 0) {
                activeComunaFilter.splice(index, 1);
                label.classList.remove('selected-comuna');
            } else {
                activeComunaFilter.push(comuna);
                label.classList.add('selected-comuna');
            }

            window.filterByComuna?.(activeComunaFilter.length ? activeComunaFilter : null);
        });

        pinWrapper.appendChild(pinDot);
        pinWrapper.appendChild(label);
        labelContainer.appendChild(pinWrapper);
    });
}

function animate() {
    function frame() {
        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const zoom = map.getZoom();

        flows.forEach(flow => {
            // 📍 Project path to screen
            let projectedPath;
            if (flow.path) {
                projectedPath = flow.path.map(([lng, lat]) =>
                    map.project({ lng, lat })
                );
            } else {
                // fallback Bézier arc
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
                projectedPath = [start, control, end];
            }

            // 🧬 Populate particles: evenly spaced along the route
            if (flow.particles.length === 0) {
                const particleCount = Math.min(60, projectedPath.length * 2); // cap for performance
                const speed = 0.0001;

                flow.particles = Array.from({ length: particleCount }, (_, i) => ({
                    t: i / particleCount,
                    speed
                }));
            }

            // 🚚 Particle animation
            flow.particles.forEach(p => {
                p.t = (p.t + p.speed) % 1;
                const totalSegments = projectedPath.length - 1;
                const progress = p.t * totalSegments;
                const index = Math.floor(progress);
                const segmentT = progress - index;

                const p1 = projectedPath[index];
                const p2 = projectedPath[index + 1] || projectedPath[projectedPath.length - 1];
                const x = p1.x + (p2.x - p1.x) * segmentT;
                const y = p1.y + (p2.y - p1.y) * segmentT;

                // 🌫️ Fade based on position
                const fade = zoom < 7 ? 0.2 : 0.08;
                let opacity = p.t < fade
                    ? p.t / fade
                    : p.t > 1 - fade
                        ? (1 - p.t) / fade
                        : 1;

                // 🎯 Zoom-aware radius
                let radius;
                if (zoom < 7) {
                    radius = 0.8;
                    opacity *= 0.7;
                } else if (zoom >= 8.06) {
                    radius = 2.0;
                } else {
                    radius = 1.2 + (zoom - 7) * 0.8;
                }

                if (flow.isRecycled) {
                    radius *= 0.8;
                    opacity *= 0.6;
                }

                // 🎨 Draw particle
                const fill = hexToRGBA(flow.color, opacity);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();
            });
        });

        updateLabels(activeRellenos);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}



window.updateFlowsForPanel = function(selectedRellenos) {
    activeRellenos = selectedRellenos;
    createFlows(activeRellenos, map.getZoom());
};

window.filterByComuna = function(comunaNames) {
    activeComunaFilter = comunaNames;
    createFlows(activeRellenos, map.getZoom());
};

map.on('load', () => {
    resizeCanvas();
    createFlows(activeRellenos, map.getZoom());
    animate();
});

['zoom', 'move', 'rotate', 'pitch'].forEach(evt =>
    map.on(evt, () => {
        flows.forEach(f => f.particles = []);
        createFlows(activeRellenos, map.getZoom());
    })
);