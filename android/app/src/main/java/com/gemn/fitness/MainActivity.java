package com.gemn.fitness;

import com.getcapacitor.BridgeActivity;
import com.gemn.fitness.bluexlink.BlueXlinkPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // BlueXlink 插件通过 @CapacitorPlugin 注解自动注册
        // 如需手动注册: registerPlugin(BlueXlinkPlugin.class);
    }
}
