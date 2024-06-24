//priority: 100

/*
    "THE WORST KUBEJS SCRIPT KNOWN TO MAN"
                                - G_cat, 2024

    Made by yours truly :)
    Licensed under WTFPL
    Use at your own risk

    ...these are not just biomes I swear
*/

/**
 * @typedef {Object} areaPos
 * @property {Number} x
 * @property {Number} z
 */

/**
 * @type {Object.<string, areaType>}
 */
const areaTypes = global.areaTypes

/**
 * @type {Internal.MinecraftForge}
 */
let $MinecraftForge = Java.loadClass("net.minecraftforge.common.MinecraftForge")
let $Random = Java.loadClass("java.util.Random")
let $Level = Java.loadClass("net.minecraft.world.level.Level")
let $Player = Java.loadClass("net.minecraft.world.entity.player.Player")
let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
let $ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation")
/**
 * @type {Internal.EntityEvent$EnteringSection}
 */
let $EnteringSection = Java.loadClass("net.minecraftforge.event.entity.EntityEvent$EnteringSection")
let $SectionPos = Java.loadClass("net.minecraft.core.SectionPos")
let $ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack")
let $Monster = Java.loadClass("net.minecraft.world.entity.monster.Monster")
let $EntityType = Java.loadClass("net.minecraft.world.entity.EntityType")
let $Warden = Java.loadClass("net.minecraft.world.entity.monster.warden.Warden")
let $Items = Java.loadClass("net.minecraft.world.item.Items")
let $Attributes = Java.loadClass("net.minecraft.world.entity.ai.attributes.Attributes")

const ForgeEvents = {
    onEvent: (event, callback) => {
        $MinecraftForge.EVENT_BUS.addListener("low", false, Java.loadClass(event), callback)
    }
}

if (global.areaSize==null) global.areaSize = 64
if (global.noEffectBuffer==null) global.noEffectBuffer = 4

/**
 * @param {Number} min 
 * @param {Number} max
 * @returns {Number} 
 */
const randomIntBetween = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min) + min)
}
/**
 * @param {Array} array 
 * @param {*} object
 * @returns {Boolean} 
 */
const arrayContains = (array, object) => {
    return array.indexOf(object) >= 0
}
/**
 * @param {BlockPos} pos 
 * @returns {areaPos}
 */
const convertToArea = pos => {
    return {
        x: Math.floor(pos.x / global.areaSize),
        z: Math.floor(pos.z / global.areaSize)
    }
}
/**
 * @param {String} str
 * @returns {Number} 
 */
const convertToAsciiNumber = str => {
    let newstr = ""
    str.split("").forEach(l => {
        let repr = l.codePointAt(0).toString()
        newstr += repr[repr.length - 1]
    })
    return Number(newstr)
}
/**
 * @param {String} str 
 * @returns {Number}
 */
const concatStringToNumber = str => {
    let isNeg = (str.match("-") || []).length % 2
    return Number((isNeg ? "-" : "") + str.replace(/-/g, ""))
}
/**
 * @param {Internal.MinecraftServer} server 
 * @param {areaPos} areaPos 
 * @returns {areaType}
 */
const generateAreaType = (server, areaPos) => {
    let areaTypeId = (areaPos.x < -global.noEffectBuffer || areaPos.x > global.noEffectBuffer) && (areaPos.z < -global.noEffectBuffer || areaPos.z > global.noEffectBuffer)
        ? areaTypeIds[new $Random(concatStringToNumber(`${areaPos.x}${areaPos.z}${server.overworld().seed.toString().slice(0, 10)}`)).nextInt(areaTypeIds.length)]
        : "no_effect"
    server.persistentData.putString(`${areaPos.x}x${areaPos.z}`, areaTypeId)
    return areaTypes[areaTypeId]
}
/**
 * @param {Internal.MinecraftServer} server
 * @param {BlockPos} pos
 * @returns {areaType}
 */
const getAreaTypeAtPos = (server, pos) => {
    let areaPos = convertToArea(pos)
    let areaPosKey = `${areaPos.x}x${areaPos.z}`
    let pData = server.persistentData

    if (pData.contains(areaPosKey)) return areaTypes[pData.getString(areaPosKey)]
    return generateAreaType(server, areaPos)
}

/**
 * @type {Array.<string>}
 */
const dimBlacklist = [
    "chunkrandomizer:blind_spot"
]

let areaTypeIds = Object.keys(areaTypes)
let areaTypePool = []
Object.keys(areaTypes).forEach(id => {
    for (let i = 0; i < areaTypes[id].weight; i++) areaTypePool.push(id)
})

/**
 * @param {Internal.EntityEvent$EnteringSection | Internal.EntityJoinLevelEvent | Internal.PlayerEvent$PlayerRespawnEvent} event
 */
const switchArea = event => {
    let { server } = event.entity
    if (server == null || !(event.entity instanceof $LivingEntity) || arrayContains(dimBlacklist, event.entity.level.dimension)) return

    let newPos = event instanceof $EnteringSection ? event.newPos : $SectionPos.of(event.entity.blockPosition())
    let oldPos = event instanceof $EnteringSection ? event.oldPos : null

    let areaPos = convertToArea(newPos.center())
    if (oldPos && JSON.stringify(areaPos) == JSON.stringify(convertToArea(oldPos.center()))) return

    let areaType = getAreaTypeAtPos(server, newPos.center())
    let oldAreaType = oldPos ? getAreaTypeAtPos(server, oldPos.center()) : null

    if (oldAreaType) {
        if (oldAreaType.onLeaveArea) oldAreaType.onLeaveArea(event)
        if (oldAreaType.onLeave && JSON.stringify(areaType) != JSON.stringify(oldAreaType)) oldAreaType.onLeave(event)
    }
    let color = (areaType.color ? areaType.color : 0xffffff).toString(16).toUpperCase()

    if (oldAreaType!=null || JSON.stringify(areaType) != JSON.stringify(oldAreaType)) {
        server.runCommandSilent(`title ${event.entity.name.string} subtitle {"text":"Area: ${areaPos.x}x${areaPos.z}","color":"#${color}"}`)
        server.runCommandSilent(`title ${event.entity.name.string} title {"text":"${areaType.title}","color":"#${color}"}`)
    }
    if (areaType.onEnter) areaType.onEnter(event)
}

ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityEvent$EnteringSection", switchArea)
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityJoinLevelEvent", switchArea)
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerEvent$PlayerRespawnEvent", switchArea)

/**
 * @param {Internal.LevelAccessor} level 
 * @param {BlockPos} pos 
 * @param {String} areaEventName 
 * @param {Internal.Event} passInEvent 
 */
const triggerAreaEvent = (level, pos, areaEventName, passInEvent) => {
    let { server } = level
    if (server == null || (level instanceof $Level && arrayContains(dimBlacklist, level.dimension))) return

    let areaType = getAreaTypeAtPos(server, pos)
    if (areaType[areaEventName]) areaType[areaEventName](passInEvent)
}
let tick = 0
ForgeEvents.onEvent("net.minecraftforge.event.TickEvent$PlayerTickEvent",
    /**
     * @param {Internal.TickEvent$PlayerTickEvent} event
     */
    event => {
        triggerAreaEvent(event.player.level, event.player.blockPosition(), "onTick", event)
        tick = (tick + 1) % Number.MAX_VALUE
    }
)
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingDeathEvent",
    /**
     * @param {Internal.LivingDeathEvent} event
     */
    event => {
        let { entity } = event
        if (!entity.player) return

        triggerAreaEvent(entity.level, entity.blockPosition(), "onLeaveArea", event)
        triggerAreaEvent(entity.level, entity.blockPosition(), "onLeave", event)
    }
)
ForgeEvents.onEvent("net.minecraftforge.event.level.ChunkEvent$Load",
    /**
     * @param {Internal.ChunkEvent$Load} event
     */
    event => { triggerAreaEvent(event.level, event.chunk.pos.getMiddleBlockPosition(0), "onLoad", event) }
)
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingEvent$LivingJumpEvent",
    /**
     * @param {Internal.LivingEvent$LivingJumpEvent} event
     */
    event => { triggerAreaEvent(event.entity.level, event.entity.blockPosition(), "onJump", event) }
)
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent",
    /**
     * @param {Internal.LivingHurtEvent} event
     */
    event => { triggerAreaEvent(event.entity.level, event.entity.blockPosition(), "onHurt", event) }
)
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn",
    /**
     * @param {Internal.MobSpawnEvent$FinalizeSpawn} event
     */
    event => { triggerAreaEvent(event.level, new BlockPos(event.x, event.y, event.z), "onEntityCheck", event) }
)
