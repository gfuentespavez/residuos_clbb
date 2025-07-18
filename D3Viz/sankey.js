document.addEventListener('DOMContentLoaded', () => {
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
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; background-color: #000");

    const sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3.sankeyJustify)
        .nodeWidth(10)
        .nodePadding(50)
        .extent([[1, 5], [width - 1, height - 5]]);

    const { nodes, links } = sankey({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d))
    });

    const color = d3.scaleOrdinal()
        .domain(["state", "provincia", "domiciliarios", "industriales", "reciclado"])
        .range(["#39FF14", "#00F0FF", "#FF00FF", "#FF8C00", "#2C3E50"]);

    function DOMuid(name) {
        let count = 0;
        return function () {
            return { id: `link-${name || "g"}-${count++}` };
        };
    }
    const uid = DOMuid();

    if (linkColor === "source-target") {
        const defs = svg.append("defs");

        defs.selectAll("linearGradient")
            .data(links)
            .join("linearGradient")
            .attr("id", d => (d.uid = uid()).id)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d => d.source.x1)
            .attr("x2", d => d.target.x0)
            .call(gradient => {
                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", d => color(d.source.category));
                gradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", d => color(d.target.category));
            });
    }

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("g")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d =>
            linkColor === "source-target" ? `url(#${d.uid.id})` :
                linkColor === "source" ? color(d.source.category) :
                    linkColor === "target" ? color(d.target.category) :
                        linkColor
        )
        .attr("stroke-width", d => Math.max(1, d.width))
        .style("transition", "stroke-opacity 0.2s")
        .on("mouseover", function () { d3.select(this).style("stroke-opacity", 0.7); })
        .on("mouseout", function () { d3.select(this).style("stroke-opacity", 0.3); })
        .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)} tons`);

    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g");

    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => color(d.category))
        .attr("stroke", "#000");

    node.append("title")
        .text(d => d.tooltip ? d.tooltip : `${d.name}\n${format(d.value)} tons`);

    const tooltip = d3.select("#tooltip");

    node.on("mouseover click", function (event, d) {
        tooltip
            .style("opacity", 1)
            .html(`<strong>${d.name}</strong><br/>${d.tooltip || "Sin información"}`)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY + 15) + "px");
    });

    node.on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
    });

    node.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .attr("fill", "white")
        .attr("font-family", "Axiforma")
        .text(d => d.name);

    document.getElementById("chart").appendChild(svg.node());
});