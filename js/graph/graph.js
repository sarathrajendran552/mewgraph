console.log("graph loaded")

let cyGlobal = null

function getCy() {
    return cyGlobal
}

function renderGraph(elements, hosts) {

    const width = document.getElementById("cy").clientWidth
    const height = document.getElementById("cy").clientHeight

    computeOrbitPositions(elements, hosts, width, height)

    const cy = cytoscape({

        container: document.getElementById("cy"),

        elements: elements,

        style: [

            {
                selector: 'node[type="switch"]',
                style: {
                    'background-color': '#2d3436',
                    'border-color': '#636e72',
                    'border-width': 3,
                    'shape': 'round-rectangle',
                    'label': 'data(label)',
                    'font-size': '16px',
                    'font-weight': 'bold',
                    'color': '#dfe6e9',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'width': 180,
                    'height': 50
                }
            },

            {
                selector: 'node[type="host"][os="linux"]',
                style: {
                    'background-color': '#00b894',
                    'border-color': '#00cec9',
                    'border-width': 3,
                    'shape': 'ellipse',
                    'label': 'data(label)',
                    'font-size': '13px',
                    'font-weight': 'bold',
                    'color': '#2d3436',
                    'text-valign': 'bottom',
                    'text-margin-y': 8,
                    'width': 80,
                    'height': 80
                }
            },

            {
                selector: 'node[type="host"][os="windows"]',
                style: {
                    'background-color': '#0984e3',
                    'border-color': '#74b9ff',
                    'border-width': 3,
                    'shape': 'ellipse',
                    'label': 'data(label)',
                    'font-size': '13px',
                    'font-weight': 'bold',
                    'color': '#2d3436',
                    'text-valign': 'bottom',
                    'text-margin-y': 8,
                    'width': 80,
                    'height': 80
                }
            },

            {
                selector: 'node[type="host"][os="unknown"]',
                style: {
                    'background-color': '#b2bec3',
                    'border-color': '#dfe6e9',
                    'border-width': 3,
                    'shape': 'ellipse',
                    'label': 'data(label)',
                    'font-size': '13px',
                    'font-weight': 'bold',
                    'color': '#2d3436',
                    'text-valign': 'bottom',
                    'text-margin-y': 8,
                    'width': 80,
                    'height': 80
                }
            },

            {
                selector: 'node[type="port"]',
                style: {
                    'background-color': '#fdcb6e',
                    'border-color': '#e17055',
                    'border-width': 2,
                    'shape': 'ellipse',
                    'label': 'data(label)',
                    'font-size': '10px',
                    'font-weight': 'bold',
                    'color': '#2d3436',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'width': 28,
                    'height': 28
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#b2bec3',
                    'curve-style': 'bezier'
                }
            }

        ],

        layout: {
            name: "preset",
            fit: true,
            padding: 60,
            animate: true,
            animationDuration: 800,
            animationEasing: 'ease-out'
        },

        userPanningEnabled: true,
        boxSelectionEnabled: false,
        autoungrabify: false,
        minZoom: 0.3,
        maxZoom: 3
    })

    cy.on('tap', 'node', function(evt) {
        evt.stopPropagation()
        const node = evt.target
        window.showDetails(node)
        window.hideContextMenu()
    })

    cy.on('tap', 'edge', function(evt) {
        evt.stopPropagation()
        const edge = evt.target
        window.showDetails(edge)
        window.hideContextMenu()
    })

    cy.on('tap', function(evt) {
        if (evt.target === cy) {
            window.hideDetails()
            window.hideContextMenu()
        }
    })

    window.initContextMenu(cy)

    cyGlobal = cy
    window.setCyInstance(cy)
    window.buildSidebar(hosts)

    initDetailsResizer()
}

function initDetailsResizer() {
    const panel = document.getElementById("details-panel")
    const resizer = document.getElementById("details-resizer")
    let startX, startWidth

    resizer.addEventListener("mousedown", (e) => {
        startX = e.clientX
        startWidth = panel.offsetWidth
        resizer.classList.add("active")
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    })

    function onMouseMove(e) {
        const newWidth = startWidth + (e.clientX - startX)
        const clamped = Math.min(Math.max(newWidth, 250), 600)
        panel.style.width = clamped + "px"
        panel.style.minWidth = clamped + "px"
        const cyEl = document.getElementById("cy")
        cyEl.style.width = `calc(100% - 280px - ${clamped}px)`
        cyEl.style.marginLeft = clamped + "px"
        cyGlobal.resize()
    }

    function onMouseUp() {
        resizer.classList.remove("active")
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
    }
}

function computeOrbitPositions(elements, hosts, width, height) {
    const cx = width / 2
    const cyCenter = height / 2

    const subnetNodes = elements.filter(e => e.data.type === "switch")
    const positions = {}

    subnetNodes.forEach((node, i) => {
        const offset = (i - (subnetNodes.length - 1) / 2) * 100
        positions[node.data.id] = { x: cx + offset, y: cyCenter }
    })

    const linuxHosts = hosts.filter(h => h.os === "linux")
    const windowsHosts = hosts.filter(h => h.os === "windows")
    const unknownHosts = hosts.filter(h => h.os === "unknown")

    function positionArc(group, startAngle, endAngle, radius, centerOffsetX, centerOffsetY) {
        group.forEach((host, i) => {
            const t = group.length === 1 ? 0.5 : i / (group.length - 1)
            const angle = startAngle + t * (endAngle - startAngle)
            const x = (cx + centerOffsetX) + radius * Math.cos(angle)
            const y = (cyCenter + centerOffsetY) + radius * Math.sin(angle)
            positions[host.ip] = { x, y }
        })
    }

    const hostRadius = Math.min(width, height) * 0.32

    positionArc(linuxHosts, Math.PI * 0.55, Math.PI * 1.45, hostRadius, -60, 0)
    positionArc(windowsHosts, Math.PI * 1.55, Math.PI * 2.45, hostRadius, 60, 0)
    positionArc(unknownHosts, -Math.PI * 0.45, Math.PI * 0.45, hostRadius, 0, -40)

    const portRadius = 55

    hosts.forEach(host => {
        const hostPos = positions[host.ip]
        if (!hostPos || host.ports.length === 0) return

        host.ports.forEach((port, i) => {
            const angle = (i / host.ports.length) * 2 * Math.PI - Math.PI / 2
            const x = hostPos.x + portRadius * Math.cos(angle)
            const y = hostPos.y + portRadius * Math.sin(angle)
            positions[host.ip + "-" + port] = { x, y }
        })
    })

    elements.forEach(el => {
        if (positions[el.data.id]) {
            el.position = positions[el.data.id]
        }
    })
}
