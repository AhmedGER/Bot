package com.example.extendedreach.mixin;

import com.example.extendedreach.ExtendedReachMod;
import net.minecraft.client.network.ClientPlayerEntity;
import net.minecraft.client.network.ClientPlayerInteractionManager;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(ClientPlayerInteractionManager.class)
public class ClientPlayerInteractionManagerMixin {
    
    @Shadow private net.minecraft.client.MinecraftClient client;
    
    @Inject(method = "getReachDistance", at = @At("RETURN"), cancellable = true)
    private void extendReachDistance(CallbackInfoReturnable<Float> cir) {
        ClientPlayerEntity player = this.client.player;
        if (player != null && ExtendedReachMod.hasExtendedReach(player.getMainHandStack().getItem())) {
            float originalReach = cir.getReturnValue();
            cir.setReturnValue((float)(originalReach + ExtendedReachMod.EXTRA_REACH));
        }
    }
}
