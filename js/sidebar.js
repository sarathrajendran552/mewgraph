console.log("sidebar loaded")

let cyInstance = null
let currentHosts = []

function setCyInstance(cy) {
    cyInstance = cy
}

function buildSidebar(hosts) {
    currentHosts = hosts

    buildOSFilters(hosts)
    buildPortFilters(hosts)
    buildIPFilters(hosts)
    window.updateGroupFilters()
    window.updateMetadataFilters()
}

function buildOSFilters(hosts) {
    const container = document.getElementById("os-filters")
    container.innerHTML = ""

    const counts = { linux: 0, windows: 0, unknown: 0 }
    hosts.forEach(h => counts[h.os]++)

    const items = [
        { key: "linux", label: "Linux", color: "#00b894" },
        { key: "windows", label: "Windows", color: "#0984e3" },
        { key: "unknown", label: "Unknown", color: "#b2bec3" }
    ]

    items.forEach(item => {
        if (counts[item.key] === 0) return

        const label = document.createElement("label")
        label.className = "filter-item"
        label.innerHTML = `
            <input type="checkbox" checked data-os="${item.key}">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color}"></span>
            <span>${item.label}</span>
            <span class="count">${counts[item.key]}</span>
        `
        container.appendChild(label)
    })

    container.querySelectorAll("input[type='checkbox']").forEach(input => {
        input.addEventListener("change", applyFilters)
    })
}

function buildPortFilters(hosts) {
    const container = document.getElementById("port-filters")
    container.innerHTML = ""

    const portCounts = {}
    hosts.forEach(h => {
        h.ports.forEach(p => {
            portCounts[p] = (portCounts[p] || 0) + 1
        })
    })

    const sortedPorts = Object.entries(portCounts).sort((a, b) => a[0] - b[0])

    sortedPorts.forEach(([port, count]) => {
        const label = document.createElement("label")
        label.className = "filter-item"
        label.innerHTML = `
            <input type="checkbox" checked data-port="${port}">
            <span>Port ${port}</span>
            <span class="count">${count}</span>
        `
        container.appendChild(label)
    })

    container.querySelectorAll("input[type='checkbox']").forEach(input => {
        input.addEventListener("change", applyFilters)
    })
}

function ipToNum(ip) {
    return ip.split(".").map(Number).reduce((acc, v, i) => acc + v * Math.pow(256, 3 - i), 0)
}

function getSubnet(ip) {
    return ip.split(".").slice(0, 3).join(".") + ".0/24"
}

function buildIPFilters(hosts) {
    const container = document.getElementById("ip-filters")
    container.innerHTML = ""

    const subnets = {}
    hosts.forEach(host => {
        const subnet = getSubnet(host.ip)
        if (!subnets[subnet]) subnets[subnet] = []
        subnets[subnet].push(host)
    })

    const sortedSubnets = Object.keys(subnets).sort((a, b) => ipToNum(a) - ipToNum(b))

    sortedSubnets.forEach(subnet => {
        const hostsInSubnet = subnets[subnet].sort((a, b) => ipToNum(a.ip) - ipToNum(b.ip))
        const totalPorts = hostsInSubnet.reduce((sum, h) => sum + h.ports.length, 0)

        const group = document.createElement("div")
        group.className = "subnet-group"

        const header = document.createElement("div")
        header.className = "subnet-header"
        header.innerHTML = `
            <span class="subnet-chevron">&#9654;</span>
            <span>${subnet}</span>
            <label class="subnet-all-label">
                <input type="checkbox" class="subnet-all-cb" checked data-subnet="${subnet}">
                <span>All</span>
            </label>
            <span class="count">${hostsInSubnet.length}</span>
        `
        group.appendChild(header)

        const body = document.createElement("div")
        body.className = "subnet-body collapsed"
        group.appendChild(body)

        hostsInSubnet.forEach(host => {
            const label = document.createElement("label")
            label.className = "filter-item"
            label.innerHTML = `
                <input type="checkbox" checked data-ip="${host.ip}">
                <span>${host.ip}</span>
                <span class="count">${host.ports.length} ports</span>
            `
            body.appendChild(label)

            label.querySelector("input").addEventListener("change", () => {
                updateSubnetAllCB(subnet)
                applyFilters()
            })
        })

        header.addEventListener("click", (e) => {
            if (e.target.closest(".subnet-all-cb")) return
            body.classList.toggle("collapsed")
            const chevron = header.querySelector(".subnet-chevron")
            chevron.classList.toggle("expanded")
        })

        header.querySelector(".subnet-all-cb").addEventListener("change", (e) => {
            e.stopPropagation()
            const checked = e.target.checked
            body.querySelectorAll('input[data-ip]').forEach(cb => cb.checked = checked)
            applyFilters()
        })

        container.appendChild(group)
    })
}

function updateSubnetAllCB(subnet) {
    const groups = document.querySelectorAll(".subnet-group")
    groups.forEach(group => {
        const cb = group.querySelector(`.subnet-all-cb[data-subnet="${subnet}"]`)
        if (!cb) return
        const ips = group.querySelectorAll('input[data-ip]')
        const checkedCount = Array.from(ips).filter(cb => cb.checked).length
        cb.checked = checkedCount === ips.length
        cb.indeterminate = checkedCount > 0 && checkedCount < ips.length
    })
}

function applyFilters() {
    if (!cyInstance) return

    const activeOS = new Set()
    const activePorts = new Set()
    const activeIPs = new Set()
    const activeGroups = new Set()
    const activeMetadata = {}

    document.querySelectorAll("#os-filters input:checked").forEach(el => activeOS.add(el.dataset.os))
    document.querySelectorAll("#port-filters input:checked").forEach(el => activePorts.add(el.dataset.port))
    document.querySelectorAll("#ip-filters input[data-ip]:checked").forEach(el => activeIPs.add(el.dataset.ip))
    document.querySelectorAll("#group-filters input:checked").forEach(el => activeGroups.add(el.dataset.group))

    document.querySelectorAll("#metadata-filters input:checked").forEach(el => {
        const key = el.dataset.metadataKey
        const value = el.dataset.metadataValue
        if (!activeMetadata[key]) activeMetadata[key] = new Set()
        activeMetadata[key].add(value)
    })

    cyInstance.batch(() => {
        cyInstance.elements().forEach(el => {
            if (el.isNode()) {
                const type = el.data("type")
                let visible = true

                if (type === "host") {
                    visible = activeIPs.has(el.id()) && activeOS.has(el.data("os"))
                    if (visible && activeGroups.size > 0) {
                        const nodeGroups = window.getNodeGroups(el.id())
                        const hasMatchingGroup = nodeGroups.some(g => activeGroups.has(g))
                        if (!hasMatchingGroup) visible = false
                    }
                    if (visible && Object.keys(activeMetadata).length > 0) {
                        const eleId = el.id()
                        const metadataMatch = Object.entries(activeMetadata).every(([key, values]) => {
                            const eleValue = el.data(key)
                            return values.has(String(eleValue)) || eleValue === undefined
                        })
                        if (!metadataMatch) visible = false
                    }
                } else if (type === "port") {
                    const port = el.data("label")
                    const hostIP = el.parent().id()
                    visible = activePorts.has(port) && activeIPs.has(hostIP)
                } else if (type === "switch") {
                    const hasVisibleChildren = el.descendants().some(d => d.visible())
                    visible = hasVisibleChildren
                }

                el.visible() ? (visible ? el.show() : el.hide()) : (visible ? el.show() : el.hide())
            } else if (el.isEdge()) {
                const visible = el.source().visible() && el.target().visible()
                el.visible() ? (visible ? el.show() : el.hide()) : (visible ? el.show() : el.hide())
            }
        })
    })

    cyInstance.fit(cyInstance.elements(":visible"), 60)
}

window.setCyInstance = setCyInstance
window.buildSidebar = buildSidebar
window.applyFilters = applyFilters
