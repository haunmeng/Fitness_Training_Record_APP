package com.gemn.fitness.bluexlink;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.vivo.health.deviceRpcSdk.Constant;
import com.vivo.health.deviceRpcSdk.DeviceRpcManager;
import com.vivo.health.deviceRpcSdk.DeviceRpcManager.InitCallBack;
import com.vivo.health.deviceRpcSdk.client.RpcClient;
import com.vivo.health.deviceRpcSdk.data.Notification;
import com.vivo.health.deviceRpcSdk.data.Request;
import com.vivo.health.deviceRpcSdk.service.IDataReceiver;

import org.json.JSONException;

/** Capacitor bridge for vivo's device-rpc SDK. */
@CapacitorPlugin(name = "BlueXlink")
public class BlueXlinkPlugin extends Plugin {

    private static final String TAG = "BlueXlinkPlugin";
    private static final String APP_ID = "106124337";
    private static final String ENCRY_STR = "9d540aa1662c449bac28118e4df7be9f";
    private static final long STATUS_POLL_MS = 2000L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private DeviceRpcManager rpcManager;
    private String watchPackage = "com.gemn.fitness.watch";
    private boolean initialized;
    private boolean connected;
    private boolean receiverRegistered;

    private final Runnable statusPoller = new Runnable() {
        @Override
        public void run() {
            updateConnectionStatus();
            if (receiverRegistered) {
                mainHandler.postDelayed(this, STATUS_POLL_MS);
            }
        }
    };

    private final IDataReceiver dataReceiver = new IDataReceiver() {
        @Override
        public void onReceiveRequest(Request request) {
            handleIncomingData(request.getData());
            if (rpcManager != null) {
                rpcManager.onResponse(new com.vivo.health.deviceRpcSdk.data.Response.Builder()
                        .build(request.getAction())
                        .code(0)
                        .pkgName(request.getOriginPkgName())
                        .originPkgName(rpcManager.getOriginPkgName())
                        .seqId(request.getSeqId())
                        .modelVersion(request.getModelVersion())
                        .build());
            }
        }

        @Override
        public void onReceiveNotification(Notification notification) {
            handleIncomingData(notification.getData());
        }
    };

    @Override
    public void load() {
        Log.i(TAG, "BlueXlinkPlugin loaded");
    }

    @PluginMethod
    public void init(PluginCall call) {
        watchPackage = call.getString("package", "com.gemn.fitness.watch");
        String encryStr = call.getString("encryStr", ENCRY_STR);

        try {
            rpcManager = DeviceRpcManager.getInstance();
            rpcManager.init(getContext(), APP_ID, encryStr, new InitCallBack() {
                @Override
                public void initResult(boolean success, String message) {
                    initialized = success;
                    if (success) {
                        registerReceiver();
                    }
                    JSObject result = new JSObject();
                    result.put("success", success);
                    if (success) {
                        result.put("message", message == null ? "SDK initialized" : message);
                    } else {
                        result.put("error", message == null ? "SDK initialization failed" : message);
                    }
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "SDK init exception", e);
            call.resolve(failure("Init exception: " + e.getMessage()));
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        if (!initialized || rpcManager == null) {
            call.resolve(failure("SDK not initialized - call init() first"));
            return;
        }

        registerReceiver();
        notifyStatus("connecting");
        updateConnectionStatus();
        mainHandler.removeCallbacks(statusPoller);
        mainHandler.post(statusPoller);

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("status", connected ? "connected" : "connecting");
        call.resolve(result);
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        mainHandler.removeCallbacks(statusPoller);
        setConnected(false, "disconnected");
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    @PluginMethod
    public void send(PluginCall call) {
        if (!initialized || rpcManager == null) {
            call.resolve(failure("SDK not initialized"));
            return;
        }
        if (!connected) {
            updateConnectionStatus();
            if (!connected) {
                call.resolve(failure("Watch is not connected"));
                return;
            }
        }

        try {
            Notification notification = new Notification.Builder()
                    .action(Constant.Action.ACTION_DEVICE_BUSINESS_DATA)
                    .modelVersion(1)
                    .pkgName(watchPackage)
                    .data(call.getData().toString())
                    .build();
            RpcClient.getInstance().notify(notification);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Send exception", e);
            call.resolve(failure("Send failed: " + e.getMessage()));
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        updateConnectionStatus();
        JSObject result = new JSObject();
        result.put("initialized", initialized);
        result.put("connected", connected);
        call.resolve(result);
    }

    private void registerReceiver() {
        if (rpcManager != null && !receiverRegistered) {
            rpcManager.registerDataReceiver(dataReceiver);
            receiverRegistered = true;
        }
    }

    private void updateConnectionStatus() {
        boolean nextConnected = false;
        if (initialized && rpcManager != null) {
            try {
                nextConnected = RpcClient.getInstance().isConnected(watchPackage);
            } catch (Exception e) {
                Log.w(TAG, "Unable to query watch connection", e);
            }
        }
        if (nextConnected != connected) {
            setConnected(nextConnected, nextConnected ? "connected" : "disconnected");
        }
    }

    private void setConnected(boolean value, String status) {
        connected = value;
        notifyStatus(status);
    }

    private void notifyStatus(String status) {
        JSObject event = new JSObject();
        event.put("status", status);
        notifyListeners("connectionStatusChange", event);
    }

    private void handleIncomingData(String data) {
        if (data == null || data.isEmpty()) {
            return;
        }
        try {
            JSObject event = new JSObject();
            event.put("data", new JSObject(data));
            notifyListeners("messageReceived", event);
        } catch (JSONException e) {
            Log.e(TAG, "Invalid message from watch", e);
        }
    }

    private JSObject failure(String error) {
        JSObject result = new JSObject();
        result.put("success", false);
        result.put("error", error);
        return result;
    }
}
