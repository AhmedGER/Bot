package com.example.extendedreach;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExtendedReachMod implements ModInitializer {
    public static final String MOD_ID = "extendedreach";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
    
    public static final float EXTRA_REACH = 3.0f;
    
    @Override
    public void onInitialize() {
        LOGGER.info("Extended Reach Mod loaded! Extra reach: " + EXTRA_REACH);
    }
}
