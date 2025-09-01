# badboy-recollection
纯前端的「渣男感情史」记录工具。数据以 JSON 文件保存，适合静态托管（GitHub Pages/Netlify/Vercel）。

## 特性
- 纯静态前端，无后端依赖
- 数据保存在 `data/records.json`
- 支持搜索、标签筛选、按时间排序

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

## 许可
MIT
