console.log("parser loaded")

function detectOS(host){

    const osmatch = host.querySelector("os osmatch")

    if(!osmatch) return "unknown"

    const name = osmatch.getAttribute("name").toLowerCase()

    if(name.includes("linux")) return "linux"
    if(name.includes("windows")) return "windows"

    return "unknown"
}


function parseNmapXML(xmlText){

    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlText,"text/xml")

    const hosts=[]

    const hostNodes = xml.querySelectorAll("host")

    hostNodes.forEach(host=>{

        const addrNode = host.querySelector("address")

        if(!addrNode) return

        const ip = addrNode.getAttribute("addr")

        const ports=[]

        host.querySelectorAll("port").forEach(port=>{

            const portid = port.getAttribute("portid")

            ports.push(portid)

        })

        const os = detectOS(host)

        hosts.push({
            ip: ip,
            os: os,
            ports: ports
        })

    })

    return hosts

}
