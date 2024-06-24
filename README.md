# ChunkRandomizer

**Randomize yourself, NOW**

## Showcase

![High Pressure](/public/highpressure.gif)
![Something Beneficial](/public/somethingbeneficial.gif)
![The Part Where He Kills You](/public/thepartwherehekillsyou.gif)
![Blind Spot](/public/blindspot.gif)

## Config

*Everything in this section should be done in server scripts. `priority: [>n]` means that the priority must be any number larger than `n`.*

**Make sure to regenerate the world after changing the config. Areas are randomized per-seed.**

### Change the size of areas (in blocks)

```js
//priority: [>100]
global.areaSize = 0 // Number, 64 by default
```

### Change the weight of the "No Effect" area type

```js
//priority: [>500]
global.noEffectWeight = 0 // Number, 100 by default
```

### Change the size of the buffer zone of "No Effect" areas next to spawn (in areas)

```js
//priority: [>100]
global.noEffectBuffer = 0 // Number, 4 by default
```

### Disable default area types

```js
//priority: [>500]
global.enableDefaultAreaTypes = false // Boolean, true by default
```

### Add custom area types

```js
//priority: [>500]

/*
    All fields are optional except weight and title
    The distinction between `onLeave` and `onLeaveArea` is that `onLeave` only triggers when the player exits the area type, meaning that it will not trigger when the player is traveling between areas of the same type
    This type is also defined as `areaType` using JSDoc, use that if you can
*/ 

global.areaTypes = {
    id: {
        weight: 0, // Number
        title: "", // String
        color: 0x222222, // Hex number

        onLoad: event => {}, // Function (event - ChunkEvent$Load)
        onTick: event => {}, // Function (event - TickEvent$PlayerTickEvent)
        onEnter: event => {}, // Function (event - EntityEvent$EnteringSection OR EntityJoinLevelEvent OR PlayerEvent$PlayerRespawnEvent)
        onLeave: event => {}, // Function (event - EntityEvent$EnteringSection OR LivingDeathEvent)
        onLeaveArea: event => {}, // Function (event - EntityEvent$EnteringSection OR LivingDeathEvent)
        onJump: event => {}, // Function (event - LivingEvent$LivingJumpEvent)
        onHurt: event => {}, // Function (event - LivingHurtEvent)
        onEntityCheck: event => {} // Function (event - MobSpawnEvent$FinalizeSpawn)
    }
}
```
