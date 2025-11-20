package com.example.extendedreach.mixin;

import com.example.extendedreach.ExtendedReachMod;
import net.minecraft.server.network.ServerPlayNetworkHandler;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.Constant;
import org.spongepowered.asm.mixin.injection.ModifyConstant;

@Mixin(ServerPlayNetworkHandler.class)
public class ServerPlayNetworkHandlerMixin {
    
    // تعديل المسافة المسموحة للبلوكات - الرقم 36.0 = 6*6 (squared)
    @ModifyConstant(method = "onPlayerInteractBlock", constant = @Constant(doubleValue = 36.0), require = 0)
    private double extendBlockReach(double original) {
        double newReach = 6.0 + ExtendedReachMod.EXTRA_REACH;
        return newReach * newReach;
    }
    
    // تعديل المسافة المسموحة للكيانات
    @ModifyConstant(method = "onPlayerInteractEntity", constant = @Constant(doubleValue = 36.0), require = 0)
    private double extendEntityReach(double original) {
        double newReach = 6.0 + ExtendedReachMod.EXTRA_REACH;
        return newReach * newReach;
    }
    
    // تعديل المسافة المسموحة لضرب الكيانات
    @ModifyConstant(method = "onPlayerInteractEntity", constant = @Constant(doubleValue = 9.0), require = 0)
    private double extendAttackReach(double original) {
        double newReach = 3.0 + ExtendedReachMod.EXTRA_REACH;
        return newReach * newReach;
    }
}
