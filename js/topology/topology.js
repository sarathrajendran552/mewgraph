console.log("topology loaded")

function getSubnet(ip){
    const parts = ip.split(".")
    return parts[0]+"."+parts[1]+"."+parts[2]+".0/24"
}

function buildTopology(hosts){

    const elements=[]
    const subnets=new Set()
    const osGroups = { linux: [], windows: [], unknown: [] }

    hosts.forEach(host=>{
        osGroups[host.os].push(host)
    })

    hosts.forEach(host=>{

        const subnet=getSubnet(host.ip)

        if(!subnets.has(subnet)){

            elements.push({
                data:{
                    id:subnet,
                    label:"switch "+subnet,
                    type:"switch"
                }
            })

            subnets.add(subnet)
        }

        elements.push({
            data:{
                id:host.ip,
                label:host.ip,
                type:"host",
                os: host.os
            }
        })

        elements.push({
            data:{
                source:subnet,
                target:host.ip
            }
        })

        host.ports.forEach(port=>{

            const portNode=host.ip+"-"+port

            elements.push({
                data:{
                    id:portNode,
                    label:port,
                    type:"port",
                    parent:host.ip
                }
            })

        })

    })

    return elements
}
