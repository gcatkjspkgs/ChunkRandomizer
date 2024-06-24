//priority: 10

const blindSpotID = "chunkrandomizer:blind_spot"

EntityEvents.death(event => {
    let { entity } = event
    if (event.level.dimension != blindSpotID) return

    if (entity instanceof $Player) {
        let playerName = entity.name.string
        entity.server.runCommandSilent(`execute in ${blindSpotID} at ${playerName} run kill @e[type=minecraft:warden,nbt={KubeJSPersistentData:{frees:"${playerName}"}}]`)
        entity.xp = 0
        entity.xpLevel = 0
    }
    else if (entity instanceof $Warden && event.source.actual instanceof $Player) {
        let playerName = entity.persistentData.getString("frees")
        let playerInfo = event.server.persistentData.getCompound("trapped").getCompound(playerName)
        entity.server.runCommandSilent(`execute in ${playerInfo.getString("dimension")} run tp ${playerName} ${playerInfo.getString("coords")}`)
    }
})
EntityEvents.drops(event => {
    const { entity } = event
    if (entity.player && entity.level.dimension == blindSpotID) {
        event.drops.forEach(item => {
            item.kill()
        })
    }
})
PlayerEvents.tick(event => {
    let { player } = event
    if (player.level.dimension != blindSpotID || !player.persistentData.contains("ticksinblinddim")) return

    let blindDimTicks = player.persistentData.getInt("ticksinblinddim")
    player.persistentData.putInt("ticksinblinddim", blindDimTicks + 1)

    // if (blindDimTicks==400) player.kill()
    if (blindDimTicks == 3600) {
        if (player.mainHandItem.id == "minecraft:totem_of_undying") {
            player.mainHandItem.count--
            player.kill()
            return
        } else if (player.offHandItem.id == "minecraft:totem_of_undying") {
            player.offHandItem.count--
            player.kill()
            return
        }
        player.kill()
    }
})
PlayerEvents.respawned(event => {
    let { player } = event
    if (!player.persistentData.contains("preblindspotinv")) return

    player.inventory.load(player.persistentData.get("preblindspotinv"))
    player.inventoryMenu.broadcastFullState()
    player.persistentData.remove("preblindspotinv")
})