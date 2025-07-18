mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VybWFuZnVlbnRlcyIsImEiOiJjbWN4eG5vbzAwam90Mmpva2lqeWZteXUxIn0._4skowp2WM5yDc_sywRDkA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-73.0, -37.8],
    zoom: 7
});

// Datos separados
const comunas = {
    "Alto Biobío": [-71.3331, -37.9815],
    "Antuco": [-71.6628, -37.3353],
    "Arauco": [-73.3142, -37.2439],
    "Cabrero": [-72.4036, -37.0294],
    "Cañete": [-73.3957, -37.8003],
    "Chiguayante": [-73.0161, -36.9158],
    "Concepción": [-73.0503, -36.8270],
    "Contulmo": [-73.2384, -38.0163],
    "Coronel": [-73.1374, -37.0177],
    "Curanilahue": [-73.3411, -37.4764],
    "Florida": [-72.6642, -36.8219],
    "Hualpén": [-73.1192, -36.8094],
    "Hualqui": [-72.9378, -36.9782],
    "Laja": [-72.7128, -37.2842],
    "Lebu": [-73.6558, -37.6096],
    "Los Álamos": [-73.4542, -37.6226],
    "Los Ángeles": [-72.3537, -37.4693],
    "Lota": [-73.1593, -37.0911],
    "Mulchén": [-72.2415, -37.7183],
    "Nacimiento": [-72.6738, -37.5058],
    "Negrete": [-72.5401, -37.6015],
    "Penco": [-72.9926, -36.7410],
    "Quilaco": [-72.018394, -37.6865092],
    "Quilleco": [-71.9702, -37.4709],
    "San Pedro de la Paz": [-73.1070, -36.8524],
    "San Rosendo": [-72.7184, -37.2662],
    "Santa Bárbara": [-72.0293062, -37.6651548],
    "Santa Juana": [-72.9463, -37.1751],
    "Talcahuano": [-73.1154, -36.7249],
    "Tirúa": [-73.4913, -38.3377],
    "Tomé": [-72.9555, -36.6190],
    "Tucapel": [-72.1678, -37.2858],
    "Yumbel": [-72.5762, -37.0984]
};

const rellenos = {
    "Relleno Cemarc Penco": [-72.9993, -36.7206],
    "Relleno Sanitario Arauco Curanilahue": [-73.364, -37.409],
    "Relleno Los Ángeles": [-72.3395474, -37.2998048],
    "Vertedero Licura": [-72.2754906, -37.654802]
};

const provincias = {
    "Alto Biobío": "Provincia de Biobío",
    "Antuco": "Provincia de Biobío",
    "Arauco": "Provincia de Arauco",
    "Cabrero": "Provincia de Biobío",
    "Cañete": "Provincia de Arauco",
    "Chiguayante": "Provincia de Concepción",
    "Concepción": "Provincia de Concepción",
    "Contulmo": "Provincia de Arauco",
    "Coronel": "Provincia de Concepción",
    "Curanilahue": "Provincia de Arauco",
    "Florida": "Provincia de Concepción",
    "Hualpén": "Provincia de Concepción",
    "Hualqui": "Provincia de Concepción",
    "Laja": "Provincia de Biobío",
    "Lebu": "Provincia de Arauco",
    "Los Álamos": "Provincia de Arauco",
    "Los Ángeles": "Provincia de Biobío",
    "Lota": "Provincia de Concepción",
    "Mulchén": "Provincia de Biobío",
    "Nacimiento": "Provincia de Biobío",
    "Negrete": "Provincia de Biobío",
    "Penco": "Provincia de Concepción",
    "Quilaco": "Provincia de Biobío",
    "Quilleco": "Provincia de Biobío",
    "San Pedro de la Paz": "Provincia de Concepción",
    "San Rosendo": "Provincia de Biobío",
    "Santa Bárbara": "Provincia de Biobío",
    "Santa Juana": "Provincia de Concepción",
    "Talcahuano": "Provincia de Concepción",
    "Tirúa": "Provincia de Arauco",
    "Tomé": "Provincia de Concepción",
    "Tucapel": "Provincia de Biobío",
    "Yumbel": "Provincia de Biobío"
};

const provinceColors = {
    "Provincia de Concepción": "#FF6EC7",   // neon pink
    "Provincia de Arauco": "#39FF14",       // neon green
    "Provincia de Biobío": "#00FFFF"        // neon cyan
};


const landfillColors = {
    "Relleno Cemarc Penco": "#FFD700",                     // neon yellow
    "Relleno Sanitario Arauco Curanilahue": "#FF3131",     // neon red
    "Relleno Los Ángeles": "#8A2BE2",                      // neon purple (blue-violet)
    "Vertedero Licura": "#00BFFF"                          // neon sky blue
};

// Conexiones comuna → relleno
const connections = {
    "Concepción": "Relleno Cemarc Penco",
    "San Pedro de la Paz": "Relleno Cemarc Penco",
    "Coronel": "Relleno Cemarc Penco",
    "Arauco": "Relleno Sanitario Arauco Curanilahue",
    "Curanilahue": "Relleno Sanitario Arauco Curanilahue",
    "Lebu": "Vertedero Licura",
    "Tirúa": "Relleno Los Ángeles"
};

map.on('load', () => {
    const svg = d3.select(".d3-overlay");
    const g = svg.append("g");

    function resizeSvg() {
        const bounds = map.getContainer().getBoundingClientRect();
        svg
            .attr("width", bounds.width)
            .attr("height", bounds.height)
            .style("position", "absolute")
            .style("top", 0)
            .style("left", 0);
    }
    resizeSvg();

    const defs = svg.append("defs");

    function project([lng, lat]) {
        return map.project([lng, lat]);
    }

    function getOrCreateGradient(id, x1, y1, x2, y2, colorStart, colorEnd) {
        defs.select(`#${id}`).remove();
        const grad = defs.append("linearGradient")
            .attr("id", id)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);

        grad.append("stop").attr("offset", "0%").attr("stop-color", colorStart);
        grad.append("stop").attr("offset", "100%").attr("stop-color", colorEnd);
        return grad;
    }

    function updateArcs() {
        const arcs = [];
        for (const comuna in connections) {
            const relleno = connections[comuna];
            const start = project(comunas[comuna]);
            const end = project(rellenos[relleno]);

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 0.6;
            const sweepFlag = start.x < end.x ? 1 : 0;
            const d = `M${start.x},${start.y} A${dr},${dr} 0 0,${sweepFlag} ${end.x},${end.y}`;

            const provincia = provincias[comuna];
            const gradId = `grad-${provincia.replace(/\s+/g, '')}-${relleno.replace(/\s+/g, '')}`;

            getOrCreateGradient(gradId, start.x, start.y, end.x, end.y, provinceColors[provincia], landfillColors[relleno]);
            arcs.push({ d, gradId });
        }

        const paths = g.selectAll("path.conector").data(arcs);
        paths.enter()
            .append("path")
            .attr("class", "conector")
            .merge(paths)
            .attr("d", d => d.d)
            .attr("stroke", d => `url(#${d.gradId})`)
            .attr("fill", "none")
            .attr("stroke-width", 2.5)
            .attr("opacity", 0.9);
        paths.exit().remove();
    }

    const pointsData = [
        ...Object.entries(comunas).map(([name, coords]) => ({ name, coords, isRelleno: false })),
        ...Object.entries(rellenos).map(([name, coords]) => ({ name, coords, isRelleno: true }))
    ];

    const tooltip = d3.select("#tooltip");

    function updatePoints() {
        const circles = g.selectAll("circle").data(pointsData, d => d.name);

        const circlesEnter = circles.enter()
            .append("circle")
            .attr("r", 7)
            .attr("class", d => d.isRelleno ? "relleno" : "comuna")
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                console.log("Clicked:", d.name); // ✅ Diagnostic log
                const [x, y] = d3.pointer(event, svg.node()); // Use D3 to get pointer position
                tooltip
                    .style("left", `${x + 10}px`)
                    .style("top", `${y + 10}px`)
                    .style("display", "block")
                    .html(`<strong>${d.name}</strong>`);
            });

        circlesEnter.merge(circles)
            .attr("cx", d => project(d.coords).x)
            .attr("cy", d => project(d.coords).y)
            .attr("fill", d => {
                if (d.isRelleno) return landfillColors[d.name] || "#ccc";
                const provincia = provincias[d.name];
                return provinceColors[provincia] || "#ccc";
            });

        circles.exit().remove();
    }

    map.on('click', () => {
        tooltip.style("display", "none");
    });

    function update() {
        resizeSvg();
        updateArcs();
        updatePoints();
    }

    map.on("move", update);
    map.on("zoom", update);
    window.addEventListener("resize", update);

    update();
});