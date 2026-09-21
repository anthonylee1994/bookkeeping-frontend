# 11. Performance

- Route-level code splitting；Recharts 等較重 feature lazy load
- Transactions layout、detail、form 同一個 lazy chunk，第一次由詳情撳「修改」唔使再等第二個 download
- `advancedChunks` 手動拆分 react／chakra／intl／vendor，令改動不會令整個 vendor bundle 失效
- 大量 transaction 使用 server-side pagination，避免一次 render 全部資料
- Merchant search debounce 300ms，避免每次 keypress 重算大型列表
- 圖片 preview 使用 object URL，unmount 後 revoke；不上載前不轉 base64
- 圖片顯示用 `loading="lazy"`、固定 aspect ratio，避免 layout shift
- Web Vitals 目標：LCP < 2.5s、INP < 200ms、CLS < 0.1（75th percentile）
