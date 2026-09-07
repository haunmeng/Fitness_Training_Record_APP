# Fitness Training Record APP

一款面向 Android 手机的本地健身训练记录应用。数据默认保存在设备本地，无需联网即可记录训练项目、训练组数和历史统计。

## 功能

- 创建和编辑训练项目，记录最大重量与日常训练参考重量
- 使用内置标签或自定义标签管理训练项目
- 项目支持左滑删除、批量管理和标签筛选
- 训练过程中按组记录重量、次数和组间休息时间
- 查看训练历史与项目训练统计，并按标签快速筛选统计结果
- 支持导出和导入本地 JSON 数据
- 支持可选的手表同步桥接功能
- 支持在设置中切换主题配色

## 技术栈

- React + TypeScript + Vite
- Capacitor Android
- Dexie / IndexedDB 本地数据存储
- Tailwind CSS

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 构建 Android APK

需要安装 Node.js、Android SDK 和 Java 17，并配置好 Android 构建环境。

```bash
npm install
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

生成的调试 APK 位于：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

手表同步功能需要额外提供 vivo 智能终端设备 SDK 的 `device-rpc.aar`，并放入 `android/app/libs/`；没有该 SDK 时，应用仍可使用手机端的本地训练记录功能。

## 数据与隐私

应用默认不上传训练数据。导出的 JSON 文件由用户自行保存和管理，请注意保护其中可能包含的个人训练信息。

## License

本项目采用 MIT License，详见 [LICENSE](./LICENSE)。
