/**
 * BlueXlink Capacitor Plugin — Java 实现
 *
 * 封装 vivo 智能终端设备 SDK（device-rpc.aar）
 * 实现手机端与手表端的 BlueXlink 双向数据传输。
 *
 * ⚠️ 前置步骤（需要手动完成）：
 * 1. 在 vivo 开放平台 (https://developers-watch.vivo.com.cn) 注册开发者账号
 * 2. 创建应用，申请 appid 和 SDK 密钥
 * 3. 下载 device-rpc.aar，放到 android/app/libs/ 目录
 * 4. 在 android/app/build.gradle 中添加：
 *    implementation files('libs/device-rpc.aar')
 * 5. 在 AndroidManifest.xml 中添加必要的权限（如需要）
 *
 * SDK API 参考（来自官方文档）：
 *   DeviceRpcManager.getInstance().init(context, encryStr, initCallBack)
 *   DeviceRpcManager 负责与手表端 @blueos.bluexlink.connectionManager 通信
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

/**
 * BlueXlink 通信插件
 *
 * 集成 vivo 智能终端设备 SDK 后，取消下方 TODO 注释并实现对应方法。
 * 当前提供完整的接口定义，SDK 就绪后可快速对接。
 */
@CapacitorPlugin(name = "BlueXlink")
public class BlueXlinkPlugin extends Plugin {

    private static final String TAG = "BlueXlinkPlugin";
    private boolean initialized = false;
    private boolean connected = false;

    // TODO: 集成 SDK 后取消注释
    // private DeviceRpcManager rpcManager;

    @Override
    public void load() {
        Log.i(TAG, "BlueXlinkPlugin loaded");
    }

    /**
     * 初始化 SDK
     * 对应 vivo 文档：DeviceRpcManager.getInstance().init(context, encryStr, callback)
     */
    @PluginMethod
    public void init(PluginCall call) {
        String packageName = call.getString("package", "com.gemn.fitness.watch");
        String encryStr = call.getString("encryStr", "");

        Log.i(TAG, "init called with package: " + packageName);

        // TODO: SDK 就绪后替换为真实初始化
        /*
        try {
            rpcManager = DeviceRpcManager.getInstance();
            rpcManager.init(getContext(), encryStr, new InitCallback() {
                @Override
                public void onSuccess() {
                    initialized = true;
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                }

                @Override
                public void onFailure(int code, String message) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("error", "Init failed: [" + code + "] " + message);
                    call.resolve(result);
                }
            });
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Init exception: " + e.getMessage());
            call.resolve(result);
        }
        */

        // Mock: 模拟初始化成功
        initialized = true;
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "SDK initialized (mock)");
        call.resolve(result);
    }

    /**
     * 连接手表
     */
    @PluginMethod
    public void connect(PluginCall call) {
        if (!initialized) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "SDK not initialized");
            call.resolve(result);
            return;
        }

        Log.i(TAG, "connect called");

        // TODO: SDK 就绪后替换为真实连接
        /*
        try {
            rpcManager.connect(new ConnectCallback() {
                @Override
                public void onConnected() {
                    connected = true;
                    notifyConnectionStatus("connected");
                }

                @Override
                public void onDisconnected() {
                    connected = false;
                    notifyConnectionStatus("disconnected");
                }
            });
        } catch (Exception e) { ... }
        */

        // Mock: 模拟连接成功
        connected = true;
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("status", "connected");
        call.resolve(result);
    }

    /**
     * 断开连接
     */
    @PluginMethod
    public void disconnect(PluginCall call) {
        Log.i(TAG, "disconnect called");

        // TODO: SDK 就绪后替换
        connected = false;

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    /**
     * 发送消息到手表
     * 手表端通过 connect.onMessage 接收
     *
     * @param call.data  — 业务消息对象 { type, version, timestamp, payload }
     */
    @PluginMethod
    public void send(PluginCall call) {
        if (!connected) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Not connected to watch");
            call.resolve(result);
            return;
        }

        JSObject data = call.getData();
        Log.i(TAG, "send: " + data.toString());

        // TODO: SDK 就绪后替换为真实发送
        /*
        try {
            // 将 JSObject 转为业务数据格式发送
            // 参考官方文档: 给设备发送 Request 数据
            rpcManager.sendRequest(data.toString(), new SendCallback() { ... });
        } catch (Exception e) { ... }
        */

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Message sent (mock)");
        call.resolve(result);
    }

    /**
     * 检查连接状态
     */
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("initialized", initialized);
        result.put("connected", connected);
        call.resolve(result);
    }

    /**
     * 通知 JS 层连接状态变化
     * 通过 Capacitor 的 notifyListeners 机制发送事件
     */
    private void notifyConnectionStatus(String status) {
        JSObject event = new JSObject();
        event.put("status", status);
        notifyListeners("connectionStatusChange", event);
    }

    /**
     * 通知 JS 层收到手表消息
     * 手表端通过 connect.send({data}) 发送的消息会在这里接收
     */
    private void notifyMessageReceived(String messageJson) {
        try {
            JSObject event = new JSObject();
            event.put("data", new JSObject(messageJson));
            notifyListeners("messageReceived", event);
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse message: " + e.getMessage());
        }
    }
}
