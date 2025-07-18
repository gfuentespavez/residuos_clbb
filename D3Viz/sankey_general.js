document.addEventListener("DOMContentLoaded", () => {
    const width = 960, height = 500;
    const format = d3.format(",.0f");

    const data = {
        nodes: [
            { name: "Región del Biobío", category: "state" },
            { name: "Residuos industriales", category: "industriales" },
            { name: "Residuos municipales", category: "municipales" },
            { name: "Reciclaje industrial", category: "reciclado" },
            { name: "Reciclaje municipal", category: "reciclado" }
        ],
        links: [
            { source: "Región del Biobío", target: "Residuos industriales", value: 1271 },
            { source: "Región del Biobío", target: "Residuos municipales", value: 997 },
            { source: "Residuos industriales", target: "Reciclaje industrial", value: 352 },
            { source: "Residuos municipales", target: "Reciclaje municipal", value: 73 }
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

    // Draw nodes
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

    node.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .attr("fill", "white")
        .text(d => d.name);

    // Draw links, initially hidden
    const linkPaths = svg.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => color(d.source.category))
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("stroke-opacity", 0) // start fully transparent
        .style("transition", "stroke-opacity 0.6s ease");

    // Append SVG to #chart div
    document.getElementById("chart").appendChild(svg.node());

    // SCROLL REVEAL LOGIC
    const steps = document.querySelectorAll("section[data-step]");
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const step = +entry.target.getAttribute("data-step");
                // Show the corresponding link path
                linkPaths
                    .filter((d, i) => i === step)
                    .attr("stroke-opacity", 0.7);
            }
        });
    }, {
        threshold: 0.5
    });

    steps.forEach(step => observer.observe(step));
});
