//priority: 500

/**
 * @typedef {Object} areaType
 * @property {Number} weight
 * @property {String} title
 * @property {Number=} color
 * @property {function(Internal.ChunkEvent$Load)=} onLoad
 * @property {function(Internal.TickEvent$PlayerTickEvent)=} onTick
 * @property {function(Internal.EntityEvent$EnteringSection | Internal.EntityJoinLevelEvent | Internal.PlayerEvent$PlayerRespawnEvent)=} onEnter
 * @property {function(Internal.EntityEvent$EnteringSection | Internal.LivingDeathEvent)=} onLeave
 * @property {function(Internal.EntityEvent$EnteringSection | Internal.LivingDeathEvent)=} onLeaveArea
 * @property {function(Internal.LivingEvent$LivingJumpEvent)=} onJump
 * @property {function(Internal.LivingHurtEvent)=} onHurt
 * @property {function(Internal.MobSpawnEvent$FinalizeSpawn)=} onEntityCheck
 */

/**
 * @type {Object.<string, areaType>}
 */
const defaultAreaTypes = {
    blind_spot: {
        weight: 10,
        title: "Blind Spot",
        color: 0x222222,

        onEnter: event => {
            let { entity } = event
            if (entity instanceof $Player && (entity.creative || entity.spectator)) return
            let { server } = entity

            let playerName = entity.name.string
            server.runCommandSilent(`effect give ${playerName} minecraft:darkness infinite`)
            server.runCommandSilent(`effect give ${playerName} minecraft:slowness infinite 1`)

            entity.persistentData.putInt("ticksinblindspot", 0)
            let pData = server.persistentData
            if (!pData.contains("trapped")) pData.put("trapped", {})
            pData.getCompound("trapped").put(playerName, { dimension: entity.level.dimension.toString(), coords: `${entity.xOld} ${entity.yOld} ${entity.zOld}` })
        },
        onLeave: event => {
            let { entity } = event
            if (entity instanceof $Player && (entity.creative || entity.spectator)) return

            let playerName = entity.name.string
            entity.server.runCommandSilent(`effect clear ${playerName} minecraft:darkness`)
            entity.server.runCommandSilent(`effect clear ${playerName} minecraft:slowness`)

            entity.persistentData.remove("ticksinblindspot")
        },
        onTick: event => {
            let { player } = event
            if (player.creative || player.spectator) return
            let { server } = player

            let blindTicks = player.persistentData.getInt("ticksinblindspot")
            player.persistentData.putInt("ticksinblindspot", blindTicks + 1)

            if (blindTicks == 6000) {
                let playerName = player.name.string

                let dimX = randomIntBetween(-256, 256)
                let dimZ = randomIntBetween(-256, 256)

                player.persistentData.put("preblindspotinv", player.nbt.get("Inventory"))
                player.teleportTo(new $ResourceLocation("chunkrandomizer", "blind_spot"), dimX, 2, dimZ, 0, 0)
                player.persistentData.putInt("ticksinblinddim", 0)

                server.runCommandSilent(`effect clear ${playerName}`)
                server.scheduleInTicks(20, () => {
                    server.runCommandSilent(`effect give ${playerName} minecraft:darkness infinite`)
                    server.runCommandSilent(`title ${playerName} subtitle {"text":"You have 3 minutes. The clock is ticking","color":"#AA0000"}`)
                    server.runCommandSilent(`title ${playerName} title {"text":"You've overstayed your welcome..","color":"#AA0000"}`)
                })
                server.scheduleInTicks(200, () => {
                    let warden = new $Warden($EntityType.WARDEN, player.level)
                    warden.health = 18
                    warden.moveTo(new Vec3d(dimX + 10, 2, dimZ + 10))
                    warden.modifyAttribute('minecraft:generic.attack_damage', '-123364,5550,152221,-3120', `-10`, "addition")
                    warden.mergeNbt({ Brain: { memories: { "minecraft:dig_cooldown": { value: {}, ttl: 1000000 } } } })
                    warden.persistentData.putString("frees", playerName)
                    player.level.addFreshEntity(warden)
                })
            }
        }
    },
    elevated_feeling: {
        weight: 15,
        title: "Elevated Feeling",
        color: 0xAAAAAA,

        onEnter: event => {
            let { entity } = event
            if (!(entity instanceof $Player)) return

            entity.abilities.mayfly = true
            entity.onUpdateAbilities()
        },
        onLeave: event => {
            let { entity } = event
            if (!(entity instanceof $Player) || entity.creative || entity.spectator) return

            entity.abilities.mayfly = false
            entity.abilities.flying = false
            entity.onUpdateAbilities()
        }
    },
    the_part_where_he_kills_you: {
        weight: 20,
        title: "The Part Where He Kills You",
        color: 0x8888FF,

        onTick: event => {
            if (tick % 120) return

            let { player } = event
            const spread = 10
            player.server.runCommandSilent(`summon lightning_bolt ${player.x + randomIntBetween(-spread, spread)} ${player.y - 5} ${player.z + randomIntBetween(-spread, spread)}`)
        }
    },
    curse_of_the_maze: {
        weight: 25,
        title: "Curse Of The Maze",
        color: 0x770077,

        onTick: event => {
            if (tick % 35 || Math.random() < .65) return

            let { player } = event
            if (player.abilities.flying) return

            player.teleportTo(player.level.dimension, player.x, player.y, player.z, player.yaw + randomIntBetween(-180, 180), player.pitch)
        }
    },
    // hell_on_earth: {
    //     weight: 25,
    //     title: "Hell On Earth",
    //     color: 0xAA0000,

    //     onEnter: event => {
    //         let { server } = event.entity
    //         let blockPos = event.entity.blockPosition()

    //         let minPos = new BlockPos(convertToArea(blockPos).x*64, 0, convertToArea(blockPos).z*64)
    //         let maxPos = new BlockPos(((convertToArea(blockPos).x+1)*64)-1, 255, ((convertToArea(blockPos).z+1)*64)-1)

    //         server.scheduleInTicks(200, () => {
    //             server.runCommandSilent("gamerule commandModificationBlockLimit 1500000")
    //             server.runCommandSilent(`fill ${minPos.x} ${minPos.y} ${minPos.z} ${maxPos.x} ${maxPos.y} ${maxPos.z} minecraft:lava`)
    //         })
    //     }
    // },
    double_or_nothing: {
        weight: 30,
        title: "Double Or Nothing",
        color: 0xFFFF00,

        onEnter: event => {
            event.entity.persistentData.putBoolean("doubleornothing", true)
        },
        onLeave: event => {
            event.entity.persistentData.remove("doubleornothing")
        }
    },
    high_pressure: {
        weight: 35,
        title: "High Pressure",
        color: 0x555555,

        onTick: event => {
            let { player } = event
            if (player.creative || player.spectator) return

            player.addMotion(0, -5, 0)
            player.hurtMarked = true
        },
        onJump: event => {
            let { entity } = event
            if (entity instanceof $Player && entity.creative || entity.spectator) return

            entity.addMotion(0, -5, 0)
            entity.hurtMarked = true
        }
    },
    something_beneficial: {
        weight: 40,
        title: "Something Beneficial",
        color: 0xFF0088,

        onEnter: event => {
            let { entity } = event
            if (!(entity instanceof $Player)) return

            let effects = [
                "speed",
                "haste",
                "strength",
                "regeneration",
                "resistance",
                "fire_resistance",
                "water_breathing",
                "night_vision",
                "saturation",
                "slow_falling"
            ]

            let playerName = entity.name.string
            let areaPos = convertToArea(entity.blockPosition())

            let random = new $Random(concatStringToNumber(`${areaPos.x}${areaPos.z}${convertToAsciiNumber(playerName)}${entity.server.overworld().seed.toString().slice(0, 5)}`))
            let effect = effects[random.nextInt(effects.length)]
            let amp = random.nextInt(3)

            entity.persistentData.putString("beneficialeffect", effect)
            entity.server.runCommandSilent(`effect give ${playerName} minecraft:${effect} infinite ${amp}`)
        },
        onLeaveArea: event => {
            let { entity } = event
            if (!(entity instanceof $Player) || !entity.persistentData.contains("beneficialeffect")) return

            entity.server.runCommandSilent(`effect clear ${entity.name.string} minecraft:${entity.persistentData.getString("beneficialeffect")}`)
            entity.persistentData.remove("beneficialeffect")
        }
    },
    fragile_zone: {
        weight: 45,
        title: "Fragile Zone",
        color: 0x770000,

        onEnter: event => {
            let { entity } = event

            entity.persistentData.putInt("prefragilehealth", entity.health)
            entity.setAttributeBaseValue($Attributes.MAX_HEALTH, 1)
            entity.health = 1
        },
        onLeave: event => {
            let { entity } = event

            entity.setAttributeBaseValue($Attributes.MAX_HEALTH, 20)
            entity.health = entity.persistentData.getInt("prefragilehealth")
            entity.persistentData.remove("prefragilehealth")
        },
        onHurt: event => {
            let { entity } = event
            if (!event.source) return

            event.amount = entity.health
            entity.persistentData.remove("prefragilehealth")
        }
    },
    peaceful_equilibrium: {
        weight: 50,
        title: "Peaceful Equilibrium",
        color: 0xFF5588,

        onHurt: event => {
            if (event.source.actual instanceof $Player) event.setCanceled(true)
        },
        onEntityCheck: event => {
            if (event.entity instanceof $Monster) event.setSpawnCancelled(true)
        }
    },
    schizophrenia: {
        weight: 55,
        title: "Schizophrenia",
        color: 0x333333,

        onTick: event => {
            if (tick % 1500 || Math.random() < .5) return

            let sounds = [
                "ambient.cave",
                "entity.creeper.primed",
                "entity.generic.explode",
                "entity.generic.big_fall",
                "entity.warden.angry",
                "entity.warden.dig",
                "entity.warden.heartbeat",
                "entity.warden.nearby_closer",
                "entity.wither.spawn",
                "entity.horse.death",
                "entity.skeleton.ambient",
                "entity.zombie.ambient",
                "entity.spider.ambient",
                "block.wooden_door.open",
                "block.chest.open",
                "block.grass.step",
                "entity.player.hurt",
                "entity.player.breath"
            ]

            let { player } = event
            player.server.runCommandSilent(`execute at ${player.name.string} run playsound minecraft:${sounds[randomIntBetween(0, sounds.length - 1)]} master ${player.name.string} ~${randomIntBetween(10, 15) * (-1 * randomIntBetween(0, 1))} ~ ~${randomIntBetween(10, 15) * (-1 * randomIntBetween(0, 1))} ${Math.random()}`)
        }
        ,
    },
    motivational_corner: {
        weight: 60,
        title: "Motivational Corner",
        color: 0xFFFF88,

        onTick: event => {
            if (tick % 1200) return

            let { player } = event
            const quotes = [
                "Give me all your money",
                "Press alt+F4 for free diamonds",
                "Touch grass",
                "You can't open your mouth and look up at the same time",
                ":heh:",
                "There is a virus in your computer",
                "Look behind you",
                "95% of gamblers quit before they hit it big",
                "Build your base in 'the part where he kills you'",
                "Give up, it's too late",
                "Eat rock",
                "Delete system32",
                "Run 'sudo rm -rf --no-preserve-root /'",
                "If you throw away this stick you will die",
                "Play GregTech New Horizons",
                "The best version of minecraft is rd-132211",
                "Ctrl+alt+delete",
                "The server will shutdown in 5 seconds",
                "Fuck around and find out",
                "Stay in the blind spot for a bit and see what happens"
            ]
            player.server.runCommandSilent(`give ${player.name.string} minecraft:stick{display:{Name:'{"text":"${quotes[Math.floor(Math.random() * quotes.length)]}"}'}}`)
        }
    }
}

if (global.noEffectWeight==null) global.noEffectWeight = 100
global.areaTypes = Object.assign((global.areaTypes!=null ? global.areaTypes : {}), {
    no_effect: {
        weight: global.noEffectWeight,
        title: "No Effect"
    }
})
if (global.enableDefaultAreaTypes==null || global.enableDefaultAreaTypes) global.areaTypes = Object.assign(global.areaTypes, defaultAreaTypes)