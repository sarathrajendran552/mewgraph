console.log("main loaded")

document.getElementById("fileInput").addEventListener("change", function(e) {
    console.log("file selected")
    const file = e.target.files[0]
    if (!file) return

    console.log("reading file:", file.name)

    const reader = new FileReader()

    reader.onload = function() {
        console.log("file read complete, length:", reader.result.length)

        const hosts = parseNmapXML(reader.result)
        console.log("hosts:", hosts.length)

        window.hosts = hosts

        const elements = buildTopology(hosts)
        console.log("elements:", elements.length)

        renderGraph(elements, hosts)
    }

    reader.readAsText(file)
})
