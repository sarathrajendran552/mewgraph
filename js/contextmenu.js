console.log("context menu loaded")

let nodeGroups = {}
let groupColors = {}
const defaultGroups = ["CCTV Camera", "Biometric", "TV", "Printer", "Server", "IoT Device"]
let contextTargetNode = null
let nextColorIdx = 0

const colorPalette = [
    "#e17055", "#00b894", "#0984e3", "#fdcb6e", "#6c5ce7",
    "#e84393", "#00cec9", "#fd79a8", "#55efc4", "#74b9ff",
    "#a29bfe", "#fab1a0", "#81ecec", "#ffeaa7", "#dfe6e9"
]

function getNextColor() {
    const color = colorPalette[nextColorIdx % colorPalette.length]
    nextColorIdx++
    return color
}

defaultGroups.forEach((g, i) => {
    groupColors[g] = colorPalette[i % colorPalette.length]
})

function showContextMenu(node, event) {
    contextTargetNode = node
    const menu = document.getElementById("context-menu")
    if (!menu) return
    const existingContainer = document.getElementById("context-menu-existing")
    existingContainer.innerHTML = ""

    const nodeGroup = nodeGroups[node.id()] || []

    if (nodeGroup.length > 0) {
        nodeGroup.forEach(group => {
            const item = document.createElement("div")
            item.className = "context-menu-item"
            item.innerHTML = `
                <span class="context-menu-icon" style="background:${groupColors[group] || '#636e72'}"></span>
                <span>${escapeHtml(group)}</span>
                <span class="remove-group" style="margin-left:auto;color:#636e72;cursor:pointer;font-size:16px" data-group="${escapeHtml(group)}">&times;</span>
            `
            existingContainer.appendChild(item)

            item.querySelector(".remove-group").addEventListener("click", (e) => {
                e.stopPropagation()
                const group = e.target.dataset.group
                removeNodeFromGroup(node.id(), group)
                hideContextMenu()
                updateGroupFilters()
                refreshDetails(node)
            })
        })
    } else {
        const emptyItem = document.createElement("div")
        emptyItem.className = "context-menu-item"
        emptyItem.style.color = "#636e72"
        emptyItem.style.cursor = "default"
        emptyItem.innerHTML = "Not in any group"
        existingContainer.appendChild(emptyItem)
    }

    const availableGroups = defaultGroups.filter(g => !nodeGroup.includes(g))

    if (availableGroups.length > 0) {
        const divider = document.createElement("div")
        divider.className = "context-menu-divider"
        existingContainer.appendChild(divider)

        const header = document.createElement("div")
        header.className = "context-menu-header"
        header.innerHTML = "<h4>Quick Add</h4>"
        existingContainer.appendChild(header)

        availableGroups.forEach(group => {
            const item = document.createElement("div")
            item.className = "context-menu-item"
            const color = groupColors[group] || getNextColor()
            item.innerHTML = `
                <span class="context-menu-icon" style="background:${color}"></span>
                <span>${escapeHtml(group)}</span>
            `
            item.addEventListener("click", () => {
                addNodeToGroup(node.id(), group)
                hideContextMenu()
                updateGroupFilters()
                refreshDetails(node)
            })
            existingContainer.appendChild(item)
        })
    }

    let x = event.pageX || event.clientX
    let y = event.pageY || event.clientY

    menu.style.left = x + "px"
    menu.style.top = y + "px"
    menu.classList.add("visible")

    requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect()
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + "px"
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + "px"
        }
    })
}

function hideContextMenu() {
    const menu = document.getElementById("context-menu")
    if (menu) menu.classList.remove("visible")
    const overlay = document.getElementById("group-input-overlay")
    if (overlay) overlay.classList.remove("visible")
}

function addNodeToGroup(nodeId, group) {
    console.log("addNodeToGroup:", nodeId, group)
    if (!nodeGroups[nodeId]) {
        nodeGroups[nodeId] = []
    }
    if (!nodeGroups[nodeId].includes(group)) {
        nodeGroups[nodeId].push(group)
        console.log("nodeGroups:", JSON.parse(JSON.stringify(nodeGroups)))
        if (!groupColors[group]) {
            groupColors[group] = getNextColor()
        }
        const cy = window.getCy()
        if (cy) {
            const node = cy.getElementById(nodeId)
            if (node.length) {
                node.data("group", nodeGroups[nodeId].join(", "))
            }
        }
    }
}

function removeNodeFromGroup(nodeId, group) {
    if (nodeGroups[nodeId]) {
        nodeGroups[nodeId] = nodeGroups[nodeId].filter(g => g !== group)
        if (nodeGroups[nodeId].length === 0) {
            delete nodeGroups[nodeId]
        }
        const cy = window.getCy()
        if (cy) {
            const node = cy.getElementById(nodeId)
            if (node.length) {
                if (nodeGroups[nodeId]) {
                    node.data("group", nodeGroups[nodeId].join(", "))
                } else {
                    node.removeData("group")
                }
            }
        }
    }
}

function updateGroupFilters() {
    console.log("updateGroupFilters called")
    console.log("nodeGroups:", JSON.parse(JSON.stringify(nodeGroups)))

    const allGroups = {}

    Object.entries(nodeGroups).forEach(([nodeId, groups]) => {
        groups.forEach(group => {
            if (!allGroups[group]) {
                allGroups[group] = []
            }
            allGroups[group].push(nodeId)
        })
    })

    console.log("allGroups:", JSON.parse(JSON.stringify(allGroups)))

    const container = document.getElementById("group-filters")
    if (!container) {
        console.error("group-filters container not found")
        return
    }
    container.innerHTML = ""

    if (Object.keys(allGroups).length === 0) {
        container.innerHTML = `<div class="empty-state">Right-click a node to add to a group</div>`
        return
    }

    Object.entries(allGroups).forEach(([group, nodeIds]) => {
        const label = document.createElement("label")
        label.className = "filter-item"
        label.innerHTML = `
            <input type="checkbox" checked data-group="${escapeHtml(group)}">
            <span class="group-color" style="background:${groupColors[group] || '#636e72'}"></span>
            <span>${escapeHtml(group)}</span>
            <span class="count">${nodeIds.length}</span>
        `
        container.appendChild(label)

        label.querySelector("input").addEventListener("change", window.applyFilters)
    })

    console.log("group-filters rendered")
}

function refreshDetails(node) {
    if (node && node.length) {
        window.showDetails(node)
    }
}

function initContextMenu(cy) {
    cy.on("cxttap", "node", function(evt) {
        evt.preventDefault()
        evt.originalEvent.preventDefault()
        showContextMenu(evt.target, evt.originalEvent)
    })

    cy.on("cxttapstart", "node", function(evt) {
        evt.preventDefault()
        evt.originalEvent.preventDefault()
    })

    document.addEventListener("click", (e) => {
        const menu = document.getElementById("context-menu")
        const overlay = document.getElementById("group-input-overlay")
        if ((!menu || !menu.contains(e.target)) && (!overlay || !overlay.contains(e.target))) {
            hideContextMenu()
        }
    })

    document.addEventListener("contextmenu", (e) => {
        const menu = document.getElementById("context-menu")
        const overlay = document.getElementById("group-input-overlay")
        if ((!menu || !menu.contains(e.target)) && (!overlay || !overlay.contains(e.target))) {
            hideContextMenu()
        }
    })

    const newGroupBtn = document.getElementById("context-menu-new")
    if (newGroupBtn) {
        newGroupBtn.addEventListener("click", () => {
            const menu = document.getElementById("context-menu")
            const overlay = document.getElementById("group-input-overlay")
            if (!menu || !overlay) return

            const rect = menu.getBoundingClientRect()
            overlay.innerHTML = `
                <input type="text" id="new-group-input" placeholder="Group name..." />
                <button id="new-group-submit">Create &amp; Add</button>
            `
            overlay.style.left = rect.left + "px"
            overlay.style.top = (rect.bottom + 4) + "px"
            overlay.classList.add("visible")

            const input = document.getElementById("new-group-input")
            input.focus()

            document.getElementById("new-group-submit").addEventListener("click", () => {
                const name = input.value.trim()
                if (name && contextTargetNode && contextTargetNode.length) {
                    addNodeToGroup(contextTargetNode.id(), name)
                    hideContextMenu()
                    updateGroupFilters()
                    refreshDetails(contextTargetNode)
                }
            })

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    document.getElementById("new-group-submit").click()
                }
                if (e.key === "Escape") {
                    hideContextMenu()
                }
            })
        })
    }
}

function escapeHtml(str) {
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
}

function getNodeGroups(nodeId) {
    return nodeGroups[nodeId] || []
}

function getGroupColor(group) {
    return groupColors[group] || "#636e72"
}

window.initContextMenu = initContextMenu
window.hideContextMenu = hideContextMenu
window.updateGroupFilters = updateGroupFilters
window.getNodeGroups = getNodeGroups
window.getGroupColor = getGroupColor
