const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const http = require("node:http");
const https = require("node:https");
const test = require("node:test");

const { hotList, webSearch, xhsHotList } = require("./api");
const {
  buildBriefingResult,
  formatHotListText,
  parseLimit,
  parseSourceIds,
  DEFAULT_HOT_LIST_SOURCES,
} = require("./commands/content");
const { formatSearchText } = require("./commands/web_search");
const { hotListTextFormatter } = require("./commands/xhs");

function captureRequest(callback, responseBody = { success: true, billing: {} }, transport = https) {
  const originalRequest = transport.request;
  let captured;
  transport.request = (options, responseCallback) => {
    const request = new EventEmitter();
    const chunks = [];
    request.write = (chunk) => chunks.push(Buffer.from(chunk));
    request.end = () => {
      captured = { options, body: JSON.parse(Buffer.concat(chunks).toString("utf-8")) };
      const response = new EventEmitter();
      response.statusCode = 200;
      responseCallback(response);
      response.emit("data", Buffer.from(JSON.stringify(responseBody)));
      response.emit("end");
    };
    return request;
  };

  return callback().then((result) => {
    captured.result = result;
    return captured;
  }).finally(() => {
    transport.request = originalRequest;
  });
}

test("webSearch maps current web search options to the Doubao endpoint", async () => {
  const request = await captureRequest(() => webSearch("test-key", {
    query: "最新的北京游玩攻略",
    searchType: "web",
    count: 10,
    queryRewrite: true,
    needContent: true,
    needUrl: true,
    sites: "example.com|volcengine.com",
    blockHosts: "spam.example",
    authInfoLevel: 1,
    timeRange: "OneYear",
    contentFormats: "markdown",
    industry: "finance",
  }));

  assert.equal(request.options.path, "/api/doubao_search");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, {
    query: "最新的北京游玩攻略",
    search_type: "web",
    count: 10,
    query_rewrite: true,
    need_content: true,
    need_url: true,
    sites: "example.com|volcengine.com",
    block_hosts: "spam.example",
    auth_info_level: 1,
    time_range: "OneYear",
    content_formats: "markdown",
    industry: "finance",
  });
});

test("webSearch maps current image filters and rejects invalid count", async () => {
  const request = await captureRequest(() => webSearch("test-key", {
    query: "长城风景",
    searchType: "image",
    count: 5,
    queryRewrite: true,
    imageWidthMin: 1200,
    imageWidthMax: 1920,
    imageHeightMin: 800,
    imageHeightMax: 1080,
    imageShapes: "横长方形|方形",
  }));

  assert.deepEqual(request.body, {
    query: "长城风景",
    search_type: "image",
    count: 5,
    query_rewrite: true,
    image_width_min: 1200,
    image_width_max: 1920,
    image_height_min: 800,
    image_height_max: 1080,
    image_shapes: "横长方形|方形",
  });

  await assert.rejects(
    webSearch("test-key", { query: "长城", searchType: "image", count: 6 }),
    { type: "validation_error" }
  );
  await assert.rejects(
    webSearch("test-key", { query: "长城", searchType: "image", imageWidthMin: "invalid" }),
    { type: "validation_error" }
  );
});

test("formatSearchText renders top-level web search results", () => {
  const text = formatSearchText({
    data: {
      Result: {
        ResultCount: 1,
        TimeCost: 42,
        WebResults: [{
          SortId: 1,
          Title: "北京游玩攻略",
          SiteName: "示例站点",
          Url: "https://example.com/guide",
          Snippet: "推荐路线",
          PublishTime: "2026-07-28",
        }],
      },
    },
  });

  assert.match(text, /结果数: 1/);
  assert.match(text, /耗时: 42ms/);
  assert.match(text, /\[1\] 北京游玩攻略/);
  assert.match(text, /URL: https:\/\/example\.com\/guide/);
});

test("formatSearchText renders top-level image search results", () => {
  const text = formatSearchText({
    data: {
      Result: {
        ResultCount: 1,
        TimeCost: 18,
        ImageResults: [{
          SortId: 1,
          Title: "长城风景",
          SiteName: "示例图片站",
          Image: { Url: "https://example.com/great-wall.jpg", Width: 1920, Height: 1080 },
          Url: "https://example.com/great-wall",
        }],
      },
    },
  });

  assert.match(text, /结果数: 1/);
  assert.match(text, /耗时: 18ms/);
  assert.match(text, /\[1\] 长城风景/);
  assert.match(text, /尺寸: 1920x1080/);
  assert.match(text, /图片: https:\/\/example\.com\/great-wall\.jpg/);
});

test("webSearch raises nested API failures", async () => {
  await assert.rejects(
    captureRequest(
      () => webSearch("test-key", { query: "长城", searchType: "image", count: 1 }),
      { success: true, data: { success: false, message: "image 搜索的 count 必须为 1~5" } }
    ),
    { type: "api_error", message: "image 搜索的 count 必须为 1~5" }
  );
});

test("hotList sends deduplicated sources with current defaults", async () => {
  const request = await captureRequest(
    () => hotList("test-key", { sourceIds: ["zhihu", "weibo", "zhihu", "aihot"] }),
    undefined,
    http
  );

  assert.equal(request.options.path, "/api/hot_list_mixed");
  assert.equal(request.options.port, 80);
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, {
    source_ids: ["zhihu", "weibo", "aihot"],
    latest: true,
    limit: 30,
  });
  assert.deepEqual(parseSourceIds(), DEFAULT_HOT_LIST_SOURCES);
  assert.deepEqual(parseSourceIds("zhihu, weibo,zhihu"), ["zhihu", "weibo"]);
});

test("hotList validates source IDs and limits", async () => {
  await assert.rejects(hotList("test-key", { sourceIds: [] }), { type: "validation_error" });
  await assert.rejects(
    hotList("test-key", { sourceIds: Array.from({ length: 53 }, (_, index) => `source-${index}`) }),
    { type: "validation_error" }
  );
  await assert.rejects(hotList("test-key", { sourceIds: ["zhihu"], limit: 0 }), { type: "validation_error" });
  await assert.rejects(hotList("test-key", { sourceIds: ["zhihu"], limit: 31 }), { type: "validation_error" });
});

test("formatHotListText keeps successful sources and reports failures", () => {
  const text = formatHotListText({
    data: {
      sources: [{
        source_id: "zhihu",
        status: "cache",
        updated_time: 0,
        items: [{ title: "AI 应用趋势", url: "https://example.com/topic", pub_date: "今天" }],
      }],
      failed_sources: [{ source_id: "weibo", message: "上游暂不可用" }],
    },
  });

  assert.match(text, /【zhihu】缓存/);
  assert.match(text, /AI 应用趋势/);
  assert.match(text, /URL: https:\/\/example\.com\/topic/);
  assert.match(text, /失败来源:/);
  assert.match(text, /weibo: 上游暂不可用/);
});

test("hotList raises API failures", async () => {
  await assert.rejects(
    captureRequest(
      () => hotList("test-key", { sourceIds: ["zhihu"] }),
      { success: false, message: "没有可用热榜来源" },
      http
    ),
    { type: "api_error", message: "没有可用热榜来源" }
  );
});

test("xhsHotList calls the XHS hot-list endpoint over HTTP", async () => {
  const responseBody = {
    success: true,
    data: {
      date: "2026-07-29",
      items: [{ rank: 1, title: "夏日穿搭", hot: "123万", trend: "up", url: "https://example.com/xhs" }],
    },
    billing: { service_fee: 0.01 },
  };
  const request = await captureRequest(() => xhsHotList("test-key"), responseBody, http);

  assert.equal(request.options.path, "/api/xhs_hot_list");
  assert.equal(request.options.port, 80);
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, {});
  assert.equal(request.result.billing, undefined);
});

test("xhsHotList raises API failures", async () => {
  await assert.rejects(
    captureRequest(
      () => xhsHotList("test-key"),
      { success: false, message: "小红书热榜暂不可用" },
      http
    ),
    { type: "api_error", message: "小红书热榜暂不可用" }
  );
});

test("buildBriefingResult preserves hot-list fields and adds XHS data", () => {
  const result = buildBriefingResult(
    {
      status: "fulfilled",
      value: {
        success: true,
        data: {
          sources: [{ source_id: "zhihu", items: [{ title: "AI 应用趋势" }] }],
          failed_sources: [{ source_id: "weibo", message: "上游暂不可用" }],
        },
      },
    },
    {
      status: "fulfilled",
      value: {
        success: true,
        data: { date: "2026-07-29", items: [{ rank: 1, title: "AI 工具" }] },
      },
    }
  );

  assert.equal(result.success, true);
  assert.equal(result.data.sources[0].source_id, "zhihu");
  assert.equal(result.data.failed_sources[0].source_id, "weibo");
  assert.equal(result.data.xhs_hot_list.items[0].title, "AI 工具");
  assert.deepEqual(result.data.failed_services, []);
});

test("buildBriefingResult keeps either service when the other one fails", () => {
  const hotListOnly = buildBriefingResult(
    { status: "fulfilled", value: { success: true, data: { sources: [], failed_sources: [] } } },
    { status: "rejected", reason: Object.assign(new Error("小红书超时"), { type: "network_error" }) }
  );
  assert.equal(hotListOnly.data.xhs_hot_list, null);
  assert.deepEqual(hotListOnly.data.failed_services, [{ service: "xhs_hot_list", message: "小红书超时" }]);

  const xhsOnly = buildBriefingResult(
    { status: "rejected", reason: Object.assign(new Error("热榜超时"), { type: "network_error" }) },
    { status: "fulfilled", value: { success: true, data: { date: "2026-07-29", items: [] } } }
  );
  assert.deepEqual(xhsOnly.data.sources, []);
  assert.equal(xhsOnly.data.xhs_hot_list.date, "2026-07-29");
  assert.deepEqual(xhsOnly.data.failed_services, [{ service: "hot_list", message: "热榜超时" }]);
});

test("buildBriefingResult fails only when both services fail", () => {
  assert.throws(
    () => buildBriefingResult(
      { status: "rejected", reason: new Error("热榜超时") },
      { status: "rejected", reason: new Error("小红书超时") }
    ),
    { type: "api_error", message: /均获取失败/ }
  );
});

test("hot-list formatters render XHS trends and service failures", () => {
  const briefingText = formatHotListText({
    data: {
      sources: [],
      xhs_hot_list: {
        date: "2026-07-29",
        items: [{ rank: 1, title: "夏日穿搭", hot: "123万", trend: "up", url: "https://example.com/xhs" }],
      },
      failed_services: [{ service: "hot_list", message: "上游暂不可用" }],
    },
  });
  assert.match(briefingText, /【小红书热榜】2026-07-29/);
  assert.match(briefingText, /\[1\] 夏日穿搭 up/);
  assert.match(briefingText, /服务失败:/);

  const xhsText = hotListTextFormatter({
    data: { date: "2026-07-29", items: [{ rank: 2, title: "露营", hot_value: 88, trend: "new" }] },
  });
  assert.match(xhsText, /小红书热榜/);
  assert.match(xhsText, /\[2\] 露营 new/);
  assert.match(xhsText, /热度: 88/);
});

test("parseLimit accepts the documented range", () => {
  assert.equal(parseLimit(), 30);
  assert.equal(parseLimit("1"), 1);
  assert.equal(parseLimit(30), 30);
  assert.throws(() => parseLimit("0"), { type: "validation_error" });
  assert.throws(() => parseLimit("31"), { type: "validation_error" });
  assert.throws(() => parseLimit("invalid"), { type: "validation_error" });
});
