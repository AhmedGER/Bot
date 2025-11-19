package com.example.extendedreach;

import net.fabricmc.api.ModInitializer;

public class ExtendedReachMod implements ModInitializer {
    public static final String MOD_ID = "extendedreach";
    public static final float EXTRA_REACH = 3.0f;
    
    @Override
    public void onInitialize() {
        System.out.println("[Extended Reach] Mod loaded! Extra reach: " + EXTRA_REACH + " blocks");
    }
}
