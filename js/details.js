console.log("details loaded")

let selectedElement = null
let customMetadata = {}

function showDetails(ele) {
    selectedElement = ele
    const content = document.getElementById("details-content")
    const data = ele.data()
    const isNode = ele.isNode()
    const isEdge = ele.isEdge()

    let html = ""

    html += `<div class="detail-section">
        <div class="detail-section-title">Type</div>
        <span class="detail-badge ${isNode ? 'type-node' : 'type-edge'}">${isNode ? data.type || "node" : "edge"}</span>
    </div>`

    if (isNode && data.type === "host") {
        const groups = window.getNodeGroups(ele.id())
        if (groups.length > 0) {
            html += `<div class="detail-section">
                <div class="detail-section-title">Groups</div>`
            groups.forEach(group => {
                const color = window.getGroupColor(group)
                html += `<span class="group-tag"><span class="group-color" style="background:${color}"></span>${escapeHtml(group)}</span>`
            })
            html += `</div>`
        }
    }

    html += `<div class="detail-section">
        <div class="detail-section-title">Properties</div>`

    if (isNode) {
        if (data.label) {
            html += detailRow("Label", data.label)
        }
        if (data.id) {
            html += detailRow("ID", data.id)
        }
        if (data.os && data.os !== "unknown") {
            html += detailRow("OS", data.os.charAt(0).toUpperCase() + data.os.slice(1))
        }
        if (data.parent) {
            html += detailRow("Parent", data.parent)
        }
    } else {
        if (data.source) {
            html += detailRow("Source", data.source)
        }
        if (data.target) {
            html += detailRow("Target", data.target)
        }
    }

    html += `</div>`

    const metadataKey = ele.id()
    if (!customMetadata[metadataKey]) {
        customMetadata[metadataKey] = {}
    }
    const metadata = customMetadata[metadataKey]

    html += `<div class="detail-section">
        <div class="detail-section-title">Custom Metadata</div>`

    if (Object.keys(metadata).length === 0) {
        html += `<div class="empty-state">No custom metadata</div>`
    } else {
        Object.entries(metadata).forEach(([key, value]) => {
            html += `
            <div class="metadata-kv-item">
                <span class="kv-key">${escapeHtml(key)}:</span>
                <span class="kv-value">${escapeHtml(value)}</span>
                <button class="delete-kv-btn" data-key="${escapeHtml(key)}">&times;</button>
            </div>`
        })
    }

    html += `</div>`

    html += `
    <div class="detail-actions">
        <h4>Add Metadata</h4>
        <div class="add-kv-form">
            <input type="text" id="kv-key" placeholder="Key" />
            <input type="text" id="kv-value" placeholder="Value" />
        </div>
        <button class="add-kv-btn" id="add-kv-btn">Add</button>
    </div>`

    content.innerHTML = html

    content.querySelectorAll(".delete-kv-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const key = e.target.dataset.key
            delete customMetadata[metadataKey][key]
            showDetails(ele)
            updateMetadataFilters()
        })
    })

    document.getElementById("add-kv-btn").addEventListener("click", () => {
        const keyInput = document.getElementById("kv-key")
        const valueInput = document.getElementById("kv-value")
        const key = keyInput.value.trim()
        const value = valueInput.value.trim()

        if (!key || !value) return

        customMetadata[metadataKey][key] = value
        ele.data(key, value)
        keyInput.value = ""
        valueInput.value = ""
        showDetails(ele)
        updateMetadataFilters()
    })

    document.getElementById("kv-value").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            document.getElementById("add-kv-btn").click()
        }
    })
}

function hideDetails() {
    document.getElementById("details-content").innerHTML = ""
    selectedElement = null
}

function detailRow(key, value) {
    return `<div class="detail-row">
        <span class="detail-key">${escapeHtml(key)}</span>
        <span class="detail-value">${escapeHtml(String(value))}</span>
    </div>`
}

function escapeHtml(str) {
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
}

function updateMetadataFilters() {
    const allMetadata = {}

    Object.entries(customMetadata).forEach(([eleId, metadata]) => {
        Object.entries(metadata).forEach(([key, value]) => {
            if (!allMetadata[key]) {
                allMetadata[key] = {}
            }
            if (!allMetadata[key][value]) {
                allMetadata[key][value] = []
            }
            allMetadata[key][value].push(eleId)
        })
    })

    const container = document.getElementById("metadata-filters")
    container.innerHTML = ""

    if (Object.keys(allMetadata).length === 0) {
        container.innerHTML = `<div class="empty-state">No metadata yet</div>`
        return
    }

    Object.entries(allMetadata).forEach(([key, values]) => {
        const keyHeader = document.createElement("div")
        keyHeader.className = "filter-item"
        keyHeader.style.cursor = "default"
        keyHeader.style.background = "transparent"
        keyHeader.innerHTML = `<span style="font-weight:600;color:#dfe6e9">${escapeHtml(key)}</span>`
        container.appendChild(keyHeader)

        Object.entries(values).forEach(([value, elementIds]) => {
            const label = document.createElement("label")
            label.className = "filter-item"
            label.innerHTML = `
                <input type="checkbox" checked data-metadata-key="${escapeHtml(key)}" data-metadata-value="${escapeHtml(value)}">
                <span>${escapeHtml(value)}</span>
                <span class="count">${elementIds.length}</span>
            `
            container.appendChild(label)

            label.querySelector("input").addEventListener("change", window.applyFilters)
        })
    })
}

window.showDetails = showDetails
window.hideDetails = hideDetails
window.updateMetadataFilters = updateMetadataFilters
