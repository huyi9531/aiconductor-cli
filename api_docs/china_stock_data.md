# 中国股票数据 API 文档（统一 params 结构）

- **Base URL**：`https://plugin.aiconductor.fun`
- **统一入口**：`POST /api/china_stock_data`
- **请求结构**：

```json
{
  "api_key": "",
  "tool_name": "",
  "params": {}
}
```

- **示例股票**：贵州茅台 `600519`

## output_format（点到即可）

多数工具支持 `params.output_format` 指定输出格式：`json | markdown | csv | html | xml | excel`，不传通常默认 `markdown`。

[0m---

## 通用 curl 模板

```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' \
  -H 'Content-Type: application/json' \
  -d '{
    "api_key": "sk_ece2677ec2137c37bab9df9f56a2b2",
    "tool_name": "<TOOL_NAME>",
    "params": {
      
    }
  }'
```

---

## 接口列表（30 个 tool_name）

下面每个“接口”都给一个可直接用的 curl 示例（统一用 `600519`）。

### 1) get_time_info（时间信息）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_time_info","params":{}}'
```

### 2) get_realtime_data（实时行情）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_realtime_data","params":{"symbol":"600519","output_format":"json"}}'
```

### 3) get_hist_data（历史行情）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_hist_data","params":{"symbol":"600519","interval":"day","interval_multiplier":1,"start_date":"2026-01-01","end_date":"2026-03-18","adjust":"none","indicators_list":null,"output_format":"json"}}'
```

### 4) get_news_data（相关新闻）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_news_data","params":{"symbol":"600519","output_format":"json"}}'
```

### 5) get_stock_basic_info（股票概要）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_basic_info","params":{"symbol":"600519","output_format":"json"}}'
```

### 6) get_financial_metrics（关键财务指标）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_financial_metrics","params":{"symbol":"600519","output_format":"json"}}'
```

### 7) get_balance_sheet（资产负债表）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_balance_sheet","params":{"symbol":"600519","output_format":"json"}}'
```

### 8) get_income_statement（利润表）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_income_statement","params":{"symbol":"600519","output_format":"json"}}'
```

### 9) get_cash_flow（现金流量表）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_cash_flow","params":{"symbol":"600519","output_format":"json"}}'
```

### 10) get_fund_flow（资金流向）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_fund_flow","params":{"symbol":"600519","output_format":"json"}}'
```

### 11) get_inner_trade_data（内部股东交易）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_inner_trade_data","params":{"symbol":"600519","output_format":"json"}}'
```

### 12) get_investor_sentiment（投资情绪）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_investor_sentiment","params":{"symbol":"600519","output_format":"json"}}'
```

### 13) get_shareholder_info（股东情况）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_shareholder_info","params":{"symbol":"600519","output_format":"json"}}'
```

### 14) get_product_info（主营构成/产品情况）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_product_info","params":{"symbol":"600519","output_format":"json"}}'
```

### 15) get_profit_forecast（业绩预测）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_profit_forecast","params":{"symbol":"600519","output_format":"json"}}'
```

### 16) get_stock_fhps_detail（分红送股详情）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_fhps_detail","params":{"symbol":"600519","output_format":"json"}}'
```

### 17) get_stock_cyq（筹码分布）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_cyq","params":{"symbol":"600519","output_format":"json"}}'
```

### 18) get_stock_research_report（研究报告）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_research_report","params":{"symbol":"600519","output_format":"json"}}'
```

### 19) get_stock_circulate_stock_holder（流通股东）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_circulate_stock_holder","params":{"symbol":"600519","output_format":"json"}}'
```

### 20) get_stock_management_change（高管变动）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_management_change","params":{"symbol":"600519","output_format":"json"}}'
```

### 21) get_stock_restricted_release_queue（限售解禁）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_restricted_release_queue","params":{"symbol":"600519","output_format":"json"}}'
```

### 22) get_stock_value（估值/价值指标）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_value","params":{"symbol":"600519","output_format":"json"}}'
```

### 23) get_macro_data（宏观指标）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_macro_data","params":{"indicator":"gdp","output_format":"json"}}'
```

### 24) get_stock_a_code_name（A股代码-名称表）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_a_code_name","params":{"output_format":"json"}}'
```

### 25) get_stock_technical_rank（技术形态榜单）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_technical_rank","params":{"indicator_name":"连续上涨","output_format":"json"}}'
```

### 26) get_stock_board_industry_summary（板块行业概览）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_board_industry_summary","params":{"output_format":"json"}}'
```

### 27) get_all_cni_indices（全部中证指数列表）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_all_cni_indices","params":{"output_format":"json"}}'
```

### 28) get_cni_index_hist（中证指数历史）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_cni_index_hist","params":{"symbol":"399300","start_date":"20260101","end_date":"20260318","output_format":"json"}}'
```

### 29) get_cni_index_detail（中证指数成分）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_cni_index_detail","params":{"symbol":"399300","date":"202603","output_format":"json"}}'
```

### 30) get_stock_volatility（分钟级波动率）
```bash
curl -X POST 'https://plugin.aiconductor.fun/api/china_stock_data' -H 'Content-Type: application/json' \
  -d '{"api_key":"sk_ece2677ec2137c37bab9df9f56a2b2","tool_name":"get_stock_volatility","params":{"symbol":"600519","start_date":"2026-03-18 09:30:00","end_date":"2026-03-18 15:00:00","period":"1","adjust":"none","output_format":"json"}}'
```
