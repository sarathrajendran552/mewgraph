# MewGraph

A web-based network topology visualizer for Nmap scan results. Upload an Nmap XML file and instantly see an interactive graph of your network with hosts, subnets, and open ports.

## Features

### Network Visualization
- **Orbit Layout** — Switches/gateways centered, hosts arranged by OS (Linux on left, Windows on right, Unknown on top), ports orbit around their host
- **Color-coded nodes** — Green for Linux, blue for Windows, grey for Unknown, yellow for ports, dark for switches
- **Zoom & Pan** — Scroll to zoom (0.3x–3x), drag to pan across the graph
- **Draggable nodes** — Reposition any node by dragging

### Nmap XML Parsing
- Extracts host IPs, open ports, and OS detection from Nmap XML output
- Auto-generates /24 subnet "switch" nodes from host IP ranges
- Builds parent-child relationships between hosts and their ports

### Right-Click Context Menu
- **Quick Add to Groups** — Assign nodes to predefined groups (CCTV Camera, Biometric, TV, Printer, Server, IoT Device)
- **Create Custom Groups** — Define your own group names on the fly
- **Remove from Groups** — Remove a node from any group via the × button

### Left Details Panel
- **Resizable** — Drag the right edge to adjust width
- **Node/Edge Properties** — Click any node or edge to view its details (IP, OS, ports, connections)
- **Group Tags** — Shows assigned groups with color indicators
- **Custom Metadata** — Add arbitrary key-value pairs to any node or edge

### Right Sidebar Filters
- **Operating System** — Filter by Linux, Windows, or Unknown
- **Groups** — Filter by assigned group (CCTV Camera, Biometric, etc.)
- **Ports** — Filter by specific open port numbers with usage counts
- **IP Addresses** — Filter by individual host IPs
- **Metadata** — Custom key-value filters auto-generated from added metadata
- All filters are combinable — unchecking any filter hides matching elements and auto-fits the view

## Project Structure

```
mewgraph/
├── index.html              # Entry point
├── .gitignore              # Git ignore rules
├── css/
│   └── style.css           # Dark theme styles
├── js/
│   ├── main.js             # File upload and orchestration
│   ├── parser/
│   │   └── parser.js       # Nmap XML parser
│   ├── topology/
│   │   └── topology.js     # Graph element builder
│   ├── graph/
│   │   └── graph.js        # Cytoscape rendering and layout
│   ├── sidebar.js          # Filter logic
│   ├── details.js          # Details panel and metadata
│   └── contextmenu.js      # Right-click groups menu
└── README.md
```

## Usage

1. Open `index.html` in a browser (use a local server like `python3 -m http.server` for best results)
2. Click **Browse** in the left panel to select an Nmap XML file
3. The graph renders automatically with the orbit layout
4. **Left-click** a node/edge to view its details
5. **Right-click** a host node to add it to a group
6. Use the **right sidebar** to filter by OS, groups, ports, or IPs

## Generating Nmap XML

```bash
nmap -sV -O -oX scan.xml 192.168.1.0/24
```

Then upload the resulting `scan.xml` file to MewGraph.

## Dependencies

- [Cytoscape.js](https://js.cytoscape.org/) — Graph visualization library (loaded from CDN)
- No build tools or package managers required — runs directly in the browser

## Browser Support

Works in any modern browser. Firefox, Chrome, and Edge are tested.

## Credits

Built with [OpenCode](https://opencode.ai) 1.14.33 using the Zen model.
