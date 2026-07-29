/**
 * BlueXlink Capacitor Plugin — 真实 SDK 模式
 *
 * vivo 智能终端设备 SDK（device-rpc.aar）
 * 手表端 ↔ 手机端 BlueXlink 双向数据同步。
 */

package com.gemn.fitness.bluexlink;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import org.json.JSONException;

import com.vivo.device.rpc.DeviceRpcManager;
import com.vivo.device.rpc.InitCallback;
import com.vivo.device.rpc.ConnectCallback;
import com.vivo.device.rpc.SendCallback;

@CapacitorPlugin(name = "BlueXlink")
public class BlueXlinkPlugin extends Plugin {

    private static final String TAG = "BlueXlinkPlugin";

    /**
     * SDK 就绪后改为 false，取消注释各方法中的 REAL SDK 代码块
     */
    private static final boolean USE_MOCK = false;

    /**
     * vivo 开放平台分配的 RPC SDK 密钥
     * 申请路径：dev.vivo.com.cn → 管理中心 → 应用详情 → 智能终端SDK密钥
     */
    private static final String ENCRY_STR = "9d540aa1662c449bac28118e4df7be9f";

    /**
     * vivo 开放平台分配的 APP-ID
     */
    private static final String APP_ID = "106124337";

    private boolean initialized = false;
    private boolean connected = false;

    // SDK 就绪后取消注释:
    private DeviceRpcManager rpcManager;

    @Override
    public void load() {
        Log.i(TAG, "BlueXlinkPlugin loaded, mock mode: " + USE_MOCK);
    }

    /**
     * 初始化 SDK
     *
     * 手表端调用: interconnect.instance({ package: 'com.gemn.fitness' })
     * 手机端需传入手表 App 的 package 名称
     *
     * @param call.data.package  手表 App 包名 (如 "com.gemn.fitness.watch")
     * @param call.data.encryStr vivo 开放平台分配的 SDK 密钥
     */
    @PluginMethod
    public void init(PluginCall call) {
        String watchPackage = call.getString("package", "com.gemn.fitness.watch");
        String encryStr = call.getString("encryStr", ENCRY_STR);

        Log.i(TAG, "init: watchPackage=" + watchPackage + ", encryStr=" + (encryStr.isEmpty() ? "(empty)" : "***"));

        try {
            rpcManager = DeviceRpcManager.getInstance();
            rpcManager.init(getContext(), encryStr, new InitCallback() {
                @Override
                public void onSuccess() {
                    initialized = true;
                    Log.i(TAG, "SDK init success");
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "SDK initialized");
                    call.resolve(result);
                }

                @Override
                public void onFailure(int code, String message) {
                    Log.e(TAG, "SDK init failed: [" + code + "] " + message);
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("error", "Init failed: [" + code + "] " + message);
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "SDK init exception", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Init exception: " + e.getMessage());
            call.resolve(result);
        }
    }

    /**
     * 连接手表
     *
     * 手表端通过 interconnect.instance({package}) 发起连接，
     * 手机端 SDK 自动响应配对请求。
     */
    @PluginMethod
    public void connect(PluginCall call) {
        if (!initialized) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "SDK not initialized — call init() first");
            call.resolve(result);
            return;
        }

        Log.i(TAG, "connect called");

        try {
            rpcManager.connect(new ConnectCallback() {
                @Override
                public void onConnected() {
                    connected = true;
                    Log.i(TAG, "Watch connected");
                    notifyConnectionStatus("connected");
                }

                @Override
                public void onDisconnected() {
                    connected = false;
                    Log.i(TAG, "Watch disconnected");
                    notifyConnectionStatus("disconnected");
                }

                @Override
                public void onMessage(String messageJson) {
                    Log.d(TAG, "Message from watch: " + messageJson);
                    notifyMessageReceived(messageJson);
                }
            });

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("status", "connecting");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Connect exception", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Connect failed: " + e.getMessage());
            call.resolve(result);
        }
    }

    /**
     * 断开与手表的连接
     */
    @PluginMethod
    public void disconnect(PluginCall call) {
        Log.i(TAG, "disconnect called");

        try {
            if (rpcManager != null) {
                rpcManager.disconnect();
            }
        } catch (Exception e) {
            Log.e(TAG, "Disconnect error", e);
        }

        connected = false;
        notifyConnectionStatus("disconnected");

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    /**
     * 发送消息到手表
     *
     * 手表端通过 connect.onMessage 接收消息。
     * 消息格式遵循两端约定的同步协议（xlink-protocol.ts / xlink-sync.js）：
     *   { type: "sync_push"|"sync_pull"|..., version: 1, timestamp: "...", payload: {...} }
     *
     * @param call.data  完整的 SyncMessage JSON 对象
     */
    @PluginMethod
    public void send(PluginCall call) {
        if (!connected) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Not connected to watch — call connect() first");
            call.resolve(result);
            return;
        }

        JSObject data = call.getData();
        Log.i(TAG, "send: " + data.toString());

        try {
            rpcManager.sendRequest(data.toString(), new SendCallback() {
                @Override
                public void onSuccess(String response) {
                    Log.d(TAG, "Send success, response: " + response);
                }

                @Override
                public void onFailure(int code, String message) {
                    Log.e(TAG, "Send failed: [" + code + "] " + message);
                }
            });

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Send exception", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Send failed: " + e.getMessage());
            call.resolve(result);
        }
    }

    /**
     * 查询连接状态
     */
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("initialized", initialized);
        result.put("connected", connected);
        result.put("mock", USE_MOCK);
        call.resolve(result);
    }

    // ==================== 事件通知 ====================

    /**
     * 通知 JS 层连接状态变化
     */
    private void notifyConnectionStatus(String status) {
        JSObject event = new JSObject();
        event.put("status", status);
        notifyListeners("connectionStatusChange", event);
        Log.i(TAG, "Connection status → " + status);
    }

    /**
     * 通知 JS 层收到手表消息
     *
     * 手表端通过 connect.send({data}) 发送的消息在此接收，
     * 通过 Capacitor notifyListeners 机制传给 TS 层 → useWatchSync.ts
     */
    private void notifyMessageReceived(String messageJson) {
        try {
            JSObject event = new JSObject();
            event.put("data", new JSObject(messageJson));
            notifyListeners("messageReceived", event);
            Log.d(TAG, "Message received → JS layer");
        } catch (JSONException e) {
            Log.e(TAG, "Failed to parse message JSON: " + e.getMessage());
        }
    }
}
