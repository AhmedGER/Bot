package com.example.extendedreach.mixin;

import com.example.extendedreach.ExtendedReachMod;
import net.minecraft.server.network.ServerPlayNetworkHandler;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.Constant;
import org.spongepowered.asm.mixin.injection.ModifyConstant;

@Mixin(ServerPlayNetworkHandler.class)
public class ServerPlayNetworkHandlerMixin {
    
    @ModifyConstant(method = "onPlayerInteractBlock", constant = @Constant(doubleValue = 36.0))
    private double modifyBlockReachServer(double original) {
        double newReach = 6.0 + ExtendedReachMod.EXTRA_REACH;
        return newReach * newReach;
    }
    
    @ModifyConstant(method = "onPlayerInteractEntity", constant = @Constant(doubleValue = 36.0))
    private double modifyEntityReachServer(double original) {
        double newReach = 6.0 + ExtendedReachMod.EXTRA_REACH;
        return newReach * newReach;
    }
}
