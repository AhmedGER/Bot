package com.example.extendedreach;

import net.fabricmc.api.ModInitializer;
import net.minecraft.item.Item;
import net.minecraft.item.Items;

public class ExtendedReachMod implements ModInitializer {
    public static final String MOD_ID = "extendedreach";
    
    // المسافة الإضافية: 15 - 4.5 (المسافة الأصلية) = 10.5
    public static final double EXTRA_REACH = 10.5;
    
    // الأسلحة اللي ليها reach إضافي
    public static boolean hasExtendedReach(Item item) {
        return item == Items.WOODEN_SWORD;
    }
    
    @Override
    public void onInitialize() {
        System.out.println("[Extended Reach] Mod loaded!");
        System.out.println("[Extended Reach] Wooden Sword: 15 blocks reach for BOTH attack and blocks!");
    }
}
