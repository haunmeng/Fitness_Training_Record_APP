package com.gemn.fitness;

import com.getcapacitor.BridgeActivity;
import com.gemn.fitness.bluexlink.BlueXlinkPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(BlueXlinkPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
