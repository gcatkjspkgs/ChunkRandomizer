//priority: 10

/**
 * @param {Internal.LootActionsBuilderJS} builder 
 */
const applyModifier = builder => {
    builder.playerPredicate(player => player.persistentData.contains("doubleornothing"))

    builder
        .modifyLoot(Ingredient.all, stack => {
            stack.count = stack.count*2
            return stack
        })
        .randomChance(.5)
        .removeLoot(/.*/)
}

LootJS.modifiers(event => {
    applyModifier(event.addBlockLootModifier(/minecraft:.*_ore/))
    applyModifier(event.addLootTypeModifier(LootType.ENTITY))
    applyModifier(event.addLootTypeModifier(LootType.FISHING))
})