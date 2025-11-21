package com.example.extendedreach.mixin;

import com.example.extendedreach.ExtendedReachMod;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.render.GameRenderer;
import net.minecraft.entity.player.PlayerEntity;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyVariable;

@Mixin(GameRenderer.class)
public class GameRendererMixin {
    
    @Shadow @Final private MinecraftClient client;
    
    @ModifyVariable(method = "updateTargetedEntity", at = @At("STORE"), ordinal = 0)
    private double modifyReachDistance(double original) {
        PlayerEntity player = this.client.player;
        if (player != null && ExtendedReachMod.hasExtendedReach(player.getMainHandStack().getItem())) {
            return 4.5 + ExtendedReachMod.EXTRA_REACH;
        }
        return original;
    }
    
    @ModifyVariable(method = "updateTargetedEntity", at = @At("STORE"), ordinal = 1)
    private double modifyReachDistanceSquared(double original) {
        PlayerEntity player = this.client.player;
        if (player != null && ExtendedReachMod.hasExtendedReach(player.getMainHandStack().getItem())) {
            double newReach = 4.5 + ExtendedReachMod.EXTRA_REACH;
            return newReach * newReach;
        }
        return original;
    }
}
EOFered.asm.mixin.injection.ModifyVariable;

@Mixin(GameRenderer.class)
public class GameRendererMixin {
    
    @Shadow @Final private MinecraftClient client;
    
    // تعديل المسافة في updateTargetedEntity
    @ModifyVariable(method = "updateTargetedEntity", at = @At("STORE"), ordinal = 0)
    private double modifyReachDistance(double original) {
        PlayerEntity player = this.client.player;
        if (player != null && ExtendedReachMod.hasExtendedReach(player.getMainHandStack().getItem())) {
            return 3.0 + ExtendedReachMod.EXTRA_REACH;
        }
        return original;
    }
    
    // تعديل المسافة المربعة
    @ModifyVariable(method = "updateTargetedEntity", at = @At("STORE"), ordinal = 1)
    private double modifyReachDistanceSquared(double original) {
        PlayerEntity player = this.client.player;
        if (player != null && ExtendedReachMod.hasExtendedReach(player.getMainHandStack().getItem())) {
            double newReach = 3.0 + ExtendedReachMod.EXTRA_REACH;
            return newReach * newReach;
        }
        return original;
    }
}
EOF  
