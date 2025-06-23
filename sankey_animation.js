document.addEventListener("DOMContentLoaded", () => {
    const width = 928;
    const height = 600;
    const format = d3.format(",.0f");
    const linkColor = "source-target";

    const data = {
        nodes: [
            { name: "Región del Biobío", category: "state", tooltip: "La región del Biobío generó en 2023 más de 2 millones 270 mil toneladas de residuos no peligrosos, industriales y municipales." },

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
            // Región to Provincias
            { source: "Región del Biobío", target: "Provincia Concepción", value: 1165, },
            { source: "Región del Biobío", target: "Provincia Biobío", value: 888 },
            { source: "Región del Biobío", target: "Provincia Arauco", value: 216 },

            // Provincia to Tipo de Residuo
            { source: "Provincia Concepción", target: "Residuos municipales - Concepción", value: 387 },
            { source: "Provincia Concepción", target: "Residuos industriales - Concepción", value: 777 },

            { source: "Provincia Biobío", target: "Residuos municipales - Biobío", value: 553 },
            { source: "Provincia Biobío", target: "Residuos industriales - Biobío", value: 335 },

            { source: "Provincia Arauco", target: "Residuos municipales - Arauco", value: 57 },
            { source: "Provincia Arauco", target: "Residuos industriales - Arauco", value: 159 },

            // Tipo de Residuo → Reciclado por Provincia
            { source: "Residuos municipales - Concepción", target: "Reciclado Provincia Concepción", value: 61 },
            { source: "Residuos industriales - Concepción", target: "Reciclado Provincia Concepción", value: 279 },

            { source: "Residuos municipales - Biobío", target: "Reciclado Provincia Biobío", value: 12 },
            { source: "Residuos industriales - Biobío", target: "Reciclado Provincia Biobío", value: 22 },

            { source: "Residuos municipales - Arauco", target: "Reciclado Provincia Arauco", value: 0.457 },
            { source: "Residuos industriales - Arauco", target: "Reciclado Provincia Arauco", value: 51 }
        ]
    };


    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    const sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeWidth(25)
        .nodePadding(40)
        .extent([[1, 5], [width - 1, height - 5]]);

    const { nodes, links } = sankey({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d))
    });

    const color = d3.scaleOrdinal()
        .domain(["state", "industriales", "municipales", "reciclado"])
        .range(["#39FF14", "#FF8C00", "#00FFFF", "#6C5CE7"]);

    // Tooltip
    const tooltip = d3.select("#tooltip");

    // Nodes
    const node = svg.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(nodes)
        .join("g");

    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => color(d.category))
        .on("mouseover", function (event, d) {
            tooltip.html(`<strong>${d.name}</strong><br>${d.tooltip || ''}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .style("opacity", 1);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    node.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);

    // Gradients for links
    const defs = svg.append("defs");
    const uid = (() => {
        let i = 0;
        return () => `uid-${i++}`;
    })();

    links.forEach(d => {
        const id = uid();
        d.gradientId = id;

        const grad = defs.append("linearGradient")
            .attr("id", id)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d.source.x1)
            .attr("x2", d.target.x0);

        grad.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color(d.source.category));
        grad.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", color(d.target.category));
    });

    // Links
    svg.append("g")
        .attr("class", "link")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => `url(#${d.gradientId})`)
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("stroke-dasharray", "12 6")
        .attr("stroke-dashoffset", 0)
        .attr("class", "flow-animate")
        .on("mouseover", function (event, d) {
            tooltip.html(`<strong>${d.source.name} → ${d.target.name}</strong><br>${format(d.value)} tons`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .style("opacity", 1);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    document.body.appendChild(svg.node());
});