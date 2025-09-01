<div align="center">
  <img src="src/favicon-512x512.png" alt="Badboy Recollection" width="64" height="64" />


  <h1>Badboy Recollection</h1>

  <p>纯前端的「渣男感情史」记录工具 · 以 JSON 存储，支持搜索/筛选/排序/编辑/图表 · 适合 GitHub Pages 等静态托管</p>

  <p>
    <a href="https://img.shields.io/badge/type-static%20site-blue"><img src="https://img.shields.io/badge/type-static%20site-blue" alt="Static" /></a>
    <a href="#许可"><img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="License: Apache-2.0" /></a>
    <a href="#目录结构"><img src="https://img.shields.io/badge/structure-clean-22d3ee" alt="Clean Structure" /></a>
  </p>
</div>

---

# badboy-recollection
纯前端的「渣男感情史」记录工具。数据以 JSON 文件保存，适合静态托管（GitHub Pages/Netlify/Vercel）。

## 目录（TOC）
- [特性](#特性)
- [在线预览](#在线预览)
- [快速开始](#本地运行)
- [使用指南](#使用指南)
- [数据格式](#数据格式datarecordsjson)
- [国际化与主题](#国际化与主题)
- [统计图表](#统计图表)
- [图标](#图标)
- [目录结构](#目录结构)
- [隐私与合规](#隐私与合规)
- [路线图](#路线图)
- [贡献指南](#贡献指南)
- [许可](#许可)

## 特性
- 纯静态前端，无后端依赖，可直接部署到 GitHub Pages/Netlify/Vercel
- 数据保存在 `data/records.json`，导入/导出一键完成
- 支持搜索、标签筛选、按时间排序（新→旧/旧→新）
- 内置编辑器：新增/编辑/删除记录
- 统计图表：按年份、按标签的柱状图
- 国际化：中文/英文动态切换，自动刷新 UI 文案
- 主题：亮/暗主题切换并记忆
- 无跟踪、无外部依赖，专注隐私

## 在线预览
如果你已启用 GitHub Pages，访问仓库的 Pages 地址即可预览。例如：

- GitHub Pages：`https://<your-username>.github.io/badboy-recollection/`

未启用时可参考下文的「本地运行」或「部署」。

## 使用指南
- 打开页面后，默认加载 `data/records.json`
- 顶部工具栏：
  - 导入/导出 JSON 文件
  - 新增记录（打开编辑面板）
  - 语言切换（中文/English）
  - 主题切换（亮/暗）
- 搜索框：按姓名/标签/备注关键字检索
- 标签下拉：按单一标签过滤
- 排序按钮：按开始日期升/降序排列
- 编辑面板：填写姓名、开始/结束日期、标签（逗号分隔）、备注，保存即可

## 国际化与主题
- 多语言：通过右上角选择框在中文与英文间切换，偏好存储于 `localStorage.lang`
- 主题：点击主题按钮切换亮/暗主题，偏好存储于 `localStorage.theme`

## 统计图表
- 年份统计：依据 `startDate` 汇总每年记录数量
- 标签统计：统计各标签出现次数（TOP 20）

## 目录结构
```
.
├─ index.html            # 入口页面
├─ src/
│  ├─ js/
│  │  └─ main.js         # 主逻辑（加载/筛选/渲染、编辑、图表、i18n、主题）
│  ├─ css/
│  │  └─ styles.css      # 样式与主题（暗/亮）
│  ├─ favicon.ico
│  └─ favicon-32x32.png
├─ data/
│  └─ records.json       # 示例数据（可自定义）
└─ .gitignore
```

## 图标
- 页面已在 `index.html` 的 `<head>` 中引用了站点图标：
  - `src/favicon.ico`
  - `src/favicon-32x32.png`
- 预览：

  ![favicon](src/favicon-32x32.png)

- 更换图标：将同名文件替换为你的图标即可。建议同时提供 `.ico` 与 `32x32` 的 `.png`，以兼容不同浏览器与平台。

## 本地运行
浏览器直接以 file:// 打开时，`fetch` 读取 JSON 可能被拦截。建议用本地静态服务：

1) Python（如已安装）
```bash
python -m http.server 5173
```
访问：http://localhost:5173/

2) Node（如已安装）
```bash
npx serve -p 5173
```

## 部署
- GitHub Pages：直接将仓库设为 Pages 源（main 分支 /root）。
- Netlify/Vercel：导入仓库为「静态站点」，无需构建命令与环境变量。

## 数据格式（`data/records.json`）
```json
{
  "records": [
    {
      "name": "A小姐",
      "startDate": "2018-07",
      "endDate": "2019-02",
      "tags": ["校园", "异地"],
      "notes": "备注...",
      "links": [{ "title": "相关链接", "url": "https://example.com" }]
    }
  ]
}
```
- `startDate`/`endDate` 支持 `YYYY-MM` 或 `YYYY-MM-DD`
- `tags` 用于标签筛选
- `notes` 为备注文本，`links` 为可选链接数组

## 隐私与合规
- 避免提交任何个人敏感信息（如身份证、手机号、住址等）。
- 若用于真实记录，请确保已获得相关当事人的授权或做匿名化处理。

## 路线图
- [ ] 增强数据校验（日期/字段必填/格式）
- [ ] 支持多链接编辑 UI（新增/删除链接条目）
- [ ] 更多图表类型与交互（如按时长、按标签组合）
- [ ] GitHub Pages 自动化部署工作流
- [ ] 更丰富的卡片样式与响应式细节

## 贡献指南
本项目不接受 PR。

- 二次开发请自行 Fork 后维护。
- 请遵守开源许可证（Apache-2.0），保留 LICENSE 与相关著作声明。

## 许可
[Apache-2.0](LICENSE)
