package com.nvr.iaptest;

import com.meta.androidbrowserhelper.horizonbilling.digitalgoods.DigitalGoodsRequestHandler;
import com.meta.androidbrowserhelper.horizonpermissions.PermissionRequestExtraCommandHandler;
import com.meta.androidbrowserhelper.horizonplatformsdk.HorizonPlatformSdkRequestHandler;

public class DelegationService extends
        com.meta.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
        registerExtraCommandHandler(new DigitalGoodsRequestHandler(getApplicationContext()));
        registerExtraCommandHandler(new PermissionRequestExtraCommandHandler());
        registerExtraCommandHandler(new HorizonPlatformSdkRequestHandler(getApplicationContext()));
    }
}
