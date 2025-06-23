document.addEventListener("DOMContentLoaded", function() {
    const width = 600;
    const height = 928;
    const format = d3.format(",.0f");
    const linkColor = "source-target";

    const data = {
        nodes: [
            { name: "Región del Biobío", category: "state" },
            { name: "Provincia Concepción", category: "provincia" },
            { name: "Provincia Biobío", category: "provincia" },
            { name: "Provincia Arauco", category: "provincia" },
            { name: "Residuos municipales - Concepción", category: "domiciliarios" },
            { name: "Residuos industriales - Concepción", category: "industriales" },
            { name: "Residuos municipales - Biobío", category: "domiciliarios" },
            { name: "Residuos industriales - Biobío", category: "industriales" },
            { name: "Residuos municipales - Arauco", category: "domiciliarios" },
            { name: "Residuos industriales - Arauco", category: "industriales" },
            { name: "Reciclado Provincia Concepción", category: "reciclado" },
            { name: "Reciclado Provincia Biobío", category: "reciclado" },
            { name: "Reciclado Provincia Arauco", category: "reciclado" }
        ],
        links: [
            { source: "Región del Biobío", target: "Provincia Concepción", value: 1165 },
            { source: "Región del Biobío", target: "Provincia Biobío", value: 888 },
            { source: "Región del Biobío", target: "Provincia Arauco", value: 216 },
            { source: "Provincia Concepción", target: "Residuos municipales - Concepción", value: 387 },
            { source: "Provincia Concepción", target: "Residuos industriales - Concepción", value: 777 },
            { source: "Provincia Biobío", target: "Residuos municipales - Biobío", value: 553 },
            { source: "Provincia Biobío", target: "Residuos industriales - Biobío", value: 335 },
            { source: "Provincia Arauco", target: "Residuos municipales - Arauco", value: 57 },
            { source: "Provincia Arauco", target: "Residuos industriales - Arauco", value: 159 },
            { source: "Residuos municipales - Concepción", target: "Reciclado Provincia Concepción", value: 61 },
            { source: "Residuos industriales - Concepción", target: "Reciclado Provincia Concepción", value: 279 },
            { source: "Residuos municipales - Biobío", target: "Reciclado Provincia Biobío", value: 12 },
            { source: "Residuos industriales - Biobío", target: "Reciclado Provincia Biobío", value: 22 },
            { source: "Residuos municipales - Arauco", target: "Reciclado Provincia Arauco", value: 0.457 },
            { source: "Residuos industriales - Arauco", target: "Reciclado Provincia Arauco", value: 51 }
        ]
    };

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3.sankeyJustify)
        .nodeWidth(25)
        .nodePadding(10)
        .extent([[1, 5], [height - 1, width - 5]]); // switched width and height

    const { nodes, links } = sankey({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d))
    });

    const color = d3.scaleOrdinal()
        .domain(["state", "provincia", "domiciliarios", "industriales", "reciclado"])
        .range(["#39FF14", "#00F0FF", "#FF00FF", "#FF8C00", "#2C3E50"]);

    const linkPath = d3.linkVertical()
        .source(d => [(d.source.y0 + d.source.y1) / 2, d.source.x1])
        .target(d => [(d.target.y0 + d.target.y1) / 2, d.target.x0]);

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("g")
        .data(links)
        .join("path")
        .attr("d", linkPath)
        .attr("stroke", d => color(d.source.category))
        .attr("stroke-width", d => Math.max(1, d.width))
        .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)} tons`);

    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g");

    node.append("rect")
        .attr("y", d => d.x0)
        .attr("x", d => d.y0)
        .attr("height", d => d.x1 - d.x0)
        .attr("width", d => d.y1 - d.y0)
        .attr("fill", d => color(d.category))
        .attr("stroke", "#000");

    node.append("text")
        .attr("y", d => (d.x0 + d.x1) / 2)
        .attr("x", d => d.y0 - 6)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .text(d => d.name);

    document.body.appendChild(svg.node());
})