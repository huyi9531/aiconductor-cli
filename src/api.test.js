const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const http = require("node:http");
const https = require("node:https");
const test = require("node:test");

const { hotList, webSearch, xhsHotList } = require("./api");
const {
  xhsNoteInfo,
  xhsNoteComments,
  xhsNoteSearch,
  xhsUserInfo,
  xhsUserNotes,
  resolveXhsShortLink,
} = require("./api");
const {
  extractUrlFromText,
  parseXhsNoteId,
  parseXhsUserId,
  formatXhsTime,
  toCount,
} = require("./lib/cli-utils");
const {
  buildBriefingResult,
  formatHotListText,
  parseLimit,
  parseSourceIds,
  DEFAULT_HOT_LIST_SOURCES,
} = require("./commands/content");
const { formatSearchText } = require("./commands/web_search");
const { hotListTextFormatter, notePublishTextFormatter } = require("./commands/xhs");
const {
  wxArticleData,
  wxHistoryArticles,
} = require("./api");
const {
  formatArticleDataText,
  formatHistoryText,
} = require("./commands/wx");

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

test("note-publish formatter surfaces the shareable qrcode image URL", () => {
  const text = notePublishTextFormatter({
    message: "发布页生成成功",
    data: {
      id: "note-1",
      url: "https://oss.aiconductor.fun/temporary_7/xhs_note_publish/note-1/index.html",
      qrcode: "data:image/png;base64,AAAA",
      qrcode_url: "https://oss.aiconductor.fun/temporary_7/xhs_note_publish/note-1/qrcode.png",
    },
  });
  assert.match(text, /H5 地址:/);
  assert.match(text, /二维码图: https:\/\/oss\.aiconductor\.fun\/temporary_7\/xhs_note_publish\/note-1\/qrcode\.png/);
});

test("note-publish formatter tolerates responses without qrcode_url", () => {
  // 旧版后端只返回 base64 二维码，formatter 不能因此报错
  const text = notePublishTextFormatter({
    data: { id: "note-2", url: "https://example.com/index.html" },
  });
  assert.match(text, /H5 地址:/);
  assert.doesNotMatch(text, /二维码图/);
});

test("parseLimit accepts the documented range", () => {
  assert.equal(parseLimit(), 30);
  assert.equal(parseLimit("1"), 1);
  assert.equal(parseLimit(30), 30);
  assert.throws(() => parseLimit("0"), { type: "validation_error" });
  assert.throws(() => parseLimit("31"), { type: "validation_error" });
  assert.throws(() => parseLimit("invalid"), { type: "validation_error" });
});

test("wxArticleData posts the article url with a Bearer header and strips billing", async () => {
  const request = await captureRequest(() => wxArticleData("test-key", " https://mp.weixin.qq.com/s?__biz=M1 "), {
    success: true,
    message: "微信公众号文章互动数据获取成功。",
    billing: { service_fee: 0.02, transaction_ids: [7] },
    data: { read_num: 1200, zan_num: 8 },
  });

  assert.equal(request.options.path, "/api/wx_article_data");
  assert.equal(request.options.port, 443);
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, { url: "https://mp.weixin.qq.com/s?__biz=M1" });
  assert.equal(request.result.billing, undefined);
  assert.equal(request.result.data.read_num, 1200);
});

test("wxArticleData rejects a blank url without calling the endpoint", async () => {
  await assert.rejects(() => wxArticleData("test-key", "  "), { type: "validation_error" });
});

test("wxHistoryArticles maps pagination fields from the api docs", async () => {
  const request = await captureRequest(() => wxHistoryArticles("test-key", {
    name: " 人民日报 ",
    maxPages: "3",
    maxSeconds: "50",
  }), { success: true, data: { data: [] } });

  assert.equal(request.options.path, "/api/wx_history_articles");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, { name: "人民日报", max_pages: 3, max_seconds: 50 });
});

test("wxHistoryArticles accepts a url instead of a name and rejects missing locators", async () => {
  const request = await captureRequest(
    () => wxHistoryArticles("test-key", { url: "https://mp.weixin.qq.com/s/abc" }),
    { success: true, data: { data: [] } }
  );
  assert.deepEqual(request.body, { url: "https://mp.weixin.qq.com/s/abc" });

  await assert.rejects(() => wxHistoryArticles("test-key", {}), { type: "validation_error" });
  await assert.rejects(
    () => wxHistoryArticles("test-key", { name: "人民日报", maxSeconds: 171 }),
    { type: "validation_error" }
  );
});

test("wx endpoints turn HTTP 200 business failures into api_error", async () => {
  const failure = { success: false, message: "账户余额不足，当前余额：0.01，需要：0.02", billing: {} };

  await assert.rejects(
    () => captureRequest(() => wxArticleData("test-key", "https://mp.weixin.qq.com/s/abc"), failure),
    (err) => err.type === "api_error" && err.message === failure.message
  );
  await assert.rejects(
    () => captureRequest(() => wxHistoryArticles("test-key", { name: "人民日报" }), failure),
    { type: "api_error" }
  );
});

test("wx history treats an upstream code inside a successful response as a failure", async () => {
  // 2026-11-05 线上实测：平台仍回 success:true，把上游失败塞进 data.code（api_docs：code 0 为成功），
  // 文章数组为空。若照 success 判断，会把「上游挂了」报成「这个号最近没发文」。
  const upstreamFailure = {
    success: true,
    message: "未能获取到任何数据。请检查参数或账户余额。",
    billing: { pages_billed: 0, transaction_ids: [] },
    data: { code: 20001, msg: "error", data: [], now_page: 0, now_page_articles_num: 0 },
  };

  await assert.rejects(
    () => captureRequest(() => wxHistoryArticles("test-key", { name: "人民日报" }), upstreamFailure),
    (err) =>
      err.type === "api_error" &&
      err.message.includes("未能获取到任何数据") &&
      err.message.includes("20001")
  );
});

test("wx history still resolves an empty page when the upstream code is 0", async () => {
  const emptyButOk = {
    success: true,
    message: "微信公众号历史文章获取完成。成功获取 1 页数据，共 0 篇文章。",
    data: { code: 0, msg: "success", data: [], now_page: 1 },
  };

  const request = await captureRequest(
    () => wxHistoryArticles("test-key", { name: "不存在的号" }),
    emptyButOk
  );
  assert.deepEqual(request.result.data.data, []);
  assert.equal(request.result.success, true);
});

test("wx history formatter lists documented article fields", () => {
  const text = formatHistoryText({
    data: {
      mp_nickname: "人民日报",
      mp_ghid: "gh_363b924965e9",
      now_page: 1,
      data: [{
        title: "今日要闻",
        post_time_str: "2026-08-27 16:32:59",
        read: 12345,
        zan: 67,
        original: 1,
        digest: "摘要内容",
        url: "https://mp.weixin.qq.com/s/abc",
      }],
    },
  });
  assert.match(text, /公众号: 人民日报（gh_363b924965e9）/);
  assert.match(text, /篇数: +1/);
  assert.match(text, /\[1\] 今日要闻/);
  assert.match(text, /时间: 2026-08-27 16:32:59/);
  assert.match(text, /阅读 12345 \| 点赞 67 \| 原创/);
  assert.match(text, /URL: +https:\/\/mp\.weixin\.qq\.com\/s\/abc/);
});

test("wx article-data formatter labels the fields the live endpoint returns", () => {
  // 字段取自 2026-11-04 线上真实响应
  const articleText = formatArticleDataText({
    message: "微信公众号文章互动数据获取成功。",
    data: { read: 100001, zan: 5685, looking: 3202, share_num: 21013, collect_num: 3129, comment_count: 12 },
  });
  assert.match(articleText, /阅读: 100001/);
  assert.match(articleText, /点赞: 5685/);
  assert.match(articleText, /在看: 3202/);
  assert.match(articleText, /分享: 21013/);
  assert.match(articleText, /收藏: 3129/);
  assert.match(articleText, /评论: 12/);

  // 上游新增字段时不能被吞掉
  const withUnknown = formatArticleDataText({ data: { read: 1, new_metric: 7 } });
  assert.match(withUnknown, /阅读: 1/);
  assert.match(withUnknown, /new_metric: 7/);

  const emptyText = formatArticleDataText({ data: {} });
  assert.match(emptyText, /上游未返回字段/);
});

// ---------------------------------------------------------------------------
// 小红书（xhs）数据命令组
// 依据：api_docs/xhs_*.md 的请求字段 + 2026-11-05 线上真实响应
// ---------------------------------------------------------------------------

test("xhsNoteInfo posts note_id to the v3 note detail endpoint over http", async () => {
  const request = await captureRequest(
    () => xhsNoteInfo("test-key", "6ae972260000000015020d84"),
    { success: true, message: "笔记详情获取成功", note_data: { note_id: "6ae972260000000015020d84" }, billing: { service_fee: 0.15 } },
    http
  );

  assert.equal(request.options.hostname, "plugin.aiconductor.fun");
  assert.equal(request.options.path, "/api/xhs_note_info_v3");
  assert.equal(request.options.port, 80);
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, { note_id: "6ae972260000000015020d84" });
  // billing 不进任何输出
  assert.equal(request.result.billing, undefined);
  assert.equal(request.result.note_data.note_id, "6ae972260000000015020d84");
});

test("xhsNoteComments sends pagination fields and accepts share_text", async () => {
  const request = await captureRequest(
    () => xhsNoteComments("test-key", { noteId: "6ae972260000000015020d84", maxPages: 2, maxSeconds: 40 }),
    { success: true, data: { comments: [], total_comments: 0 } },
    http
  );

  assert.equal(request.options.path, "/api/xhs_note_comments_fast");
  assert.equal(request.options.port, 80);
  assert.deepEqual(request.body, {
    note_id: "6ae972260000000015020d84",
    max_pages: 2,
    max_seconds: 40,
  });
});

test("xhsNoteComments prefers share_text only when note id is absent", async () => {
  const withShare = await captureRequest(
    () => xhsNoteComments("test-key", { shareText: "https://xhslink.cn/o/85lbqBJtO94" }),
    { success: true, data: { comments: [] } },
    http
  );
  assert.deepEqual(withShare.body, { share_text: "https://xhslink.cn/o/85lbqBJtO94" });

  // 两个都没给：本地拒绝，不发请求
  await assert.rejects(() => xhsNoteComments("test-key", {}), { type: "validation_error" });
  // 越界：max_pages 只允许 1~5，max_seconds 不超过平台 170s 上限
  await assert.rejects(
    () => xhsNoteComments("test-key", { noteId: "6ae972260000000015020d84", maxPages: 6 }),
    { type: "validation_error" }
  );
  await assert.rejects(
    () => xhsNoteComments("test-key", { noteId: "6ae972260000000015020d84", maxSeconds: 171 }),
    { type: "validation_error" }
  );
});

test("xhsNoteSearch maps keyword filters to the v3 search endpoint", async () => {
  const request = await captureRequest(
    () => xhsNoteSearch("test-key", {
      keyword: "AI编程",
      maxPages: 3,
      sort: "popularity_descending",
      noteTime: "week",
      noteType: "video",
    }),
    { success: true, data: { items: [], has_more: false } },
    http
  );

  assert.equal(request.options.path, "/api/xhs_note_search_v3");
  assert.equal(request.options.port, 80);
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.deepEqual(request.body, {
    keyword: "AI编程",
    max_pages: 3,
    sort: "popularity_descending",
    note_time: "week",
    note_type: "video",
  });
});

test("xhsNoteSearch rejects unknown enum values and empty keywords", async () => {
  await assert.rejects(() => xhsNoteSearch("test-key", { keyword: "  " }), { type: "validation_error" });
  await assert.rejects(
    () => xhsNoteSearch("test-key", { keyword: "AI", sort: "likes" }),
    { type: "validation_error" }
  );
  await assert.rejects(
    () => xhsNoteSearch("test-key", { keyword: "AI", noteTime: "year" }),
    { type: "validation_error" }
  );
  await assert.rejects(
    () => xhsNoteSearch("test-key", { keyword: "AI", noteType: "image" }),
    { type: "validation_error" }
  );
});

test("xhsUserInfo maps user_id and xhsUserNotes maps pagination", async () => {
  const userRequest = await captureRequest(
    () => xhsUserInfo("test-key", "53cd3bbbb4c4d64f93463018"),
    { success: true, user_info: { basic_info: {} } },
    http
  );
  assert.equal(userRequest.options.path, "/api/xhs_user_info_v2");
  assert.equal(userRequest.options.port, 80);
  assert.deepEqual(userRequest.body, { user_id: "53cd3bbbb4c4d64f93463018" });

  const notesRequest = await captureRequest(
    () => xhsUserNotes("test-key", { userId: "53cd3bbbb4c4d64f93463018", maxPages: 2 }),
    { success: true, data: { notes: [] } },
    http
  );
  // 刻意打 v2 端点：v2/v3 现在同上游同输出，v2 是历史真实流量所在
  assert.equal(notesRequest.options.path, "/api/xhs_user_notes_v2");
  assert.equal(notesRequest.options.port, 80);
  assert.deepEqual(notesRequest.body, { user_id: "53cd3bbbb4c4d64f93463018", max_pages: 2 });
});

test("xhs endpoints turn business failures into api_error", async () => {
  await assert.rejects(
    () => captureRequest(
      () => xhsNoteInfo("test-key", "6ae972260000000015020d84"),
      { success: false, message: "笔记ID无效或笔记不可访问" },
      http
    ),
    { type: "api_error", message: "笔记ID无效或笔记不可访问" }
  );
});

test("parseXhsNoteId and parseXhsUserId accept ids, long links and share copy", () => {
  const id = "6ae972260000000015020d84";
  assert.equal(parseXhsNoteId(id), id);
  assert.equal(
    parseXhsNoteId(`字节早就不是下狗了 https://www.xiaohongshu.com/discovery/item/${id}?xsec_token=abc 复制内容`),
    id
  );
  assert.equal(parseXhsNoteId(`https://www.xiaohongshu.com/explore/${id}?xsec_source=pc_share`), id);
  // 小红书号/主页/空串都不该被当成 note id
  assert.equal(parseXhsNoteId("hainingshushu"), null);
  assert.equal(parseXhsNoteId(""), null);
  assert.equal(parseXhsNoteId(undefined), null);

  const userId = "53cd3bbbb4c4d64f93463018";
  assert.equal(parseXhsUserId(userId), userId);
  assert.equal(parseXhsUserId(`https://www.xiaohongshu.com/user/profile/${userId}?xsec_token=x`), userId);
  assert.equal(parseXhsUserId("https://www.xiaohongshu.com/explore/6ae972260000000015020d84"), null);
});

test("extractUrlFromText pulls the first url out of share copy", () => {
  assert.equal(
    extractUrlFromText("字节早就不是下狗了，不想承认也不行 https://xhslink.cn/o/85lbqBJtO94 复制内容，然后进入【小红书】查看相关笔记。"),
    "https://xhslink.cn/o/85lbqBJtO94"
  );
  // 中文全角标点紧贴链接时不能带进 url
  assert.equal(extractUrlFromText("看这个https://xhslink.cn/o/abc），很准"), "https://xhslink.cn/o/abc");
  assert.equal(extractUrlFromText("没有链接"), null);
});

test("formatXhsTime renders UTC epoch as Beijing time", () => {
  // 独立来源：同一视频笔记 note_info.time = 1793578330，+8h 等于 search 返回的 notePublishTime "2026-11-02 08:12:10"
  assert.equal(formatXhsTime(1793578330), "2026-11-02 08:12:10");
  // 毫秒（用户笔记列表）同口径
  assert.equal(formatXhsTime(1793690772000), "2026-11-03 15:26:12");
  assert.equal(formatXhsTime(0), "");
  assert.equal(formatXhsTime(null), "");
});

test("toCount normalises string counts coming from the xhs upstream", () => {
  assert.equal(toCount("54"), 54);
  assert.equal(toCount("1,234"), 1234);
  assert.equal(toCount(7), 7);
  assert.equal(toCount("1.2万"), 12000);
  assert.equal(toCount("1万+"), 10000);
  assert.equal(toCount(undefined), 0);
  assert.equal(toCount("abc"), 0);
});

test("resolveXhsShortLink follows the 302 to the real note url", async () => {
  const finalUrl = "https://www.xiaohongshu.com/discovery/item/6ae972260000000015020d84?type=normal&xsec_token=abc";
  const originalRequest = https.request;
  https.request = (options, responseCallback) => {
    const request = new EventEmitter();
    request.setTimeout = () => {};
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = 302;
      response.headers = { location: finalUrl };
      response.resume = () => {};
      responseCallback(response);
    };
    request.destroy = () => {};
    return request;
  };

  try {
    const url = await resolveXhsShortLink("https://xhslink.cn/o/85lbqBJtO94");
    assert.equal(url, finalUrl);
  } finally {
    https.request = originalRequest;
  }
});

test("xhs text formatters: 评论按赞排序并展开楼内回复，搜索按赞排序", () => {
  const { commentsTextFormatter, searchTextFormatter, noteTextFormatter } = require("./commands/xhs");

  const commentsText = commentsTextFormatter({
    data: {
      has_more: true,
      total_pages: 1,
      comments: [
        { content: "低赞", like_count: "1", sub_comment_count: "0", user: { original_name: "甲" } },
        {
          content: "高赞",
          like_count: "43",
          sub_comment_count: "1",
          user: { original_name: "乙" },
          sub_comments: [{ content: "楼内回复", user: { original_name: "丙" } }],
        },
      ],
    },
  });
  assert.match(commentsText, /共取到 2 条评论/);
  assert.ok(commentsText.indexOf("高赞") < commentsText.indexOf("低赞"), "评论应按点赞降序");
  assert.match(commentsText, /↳ 丙: 楼内回复/);
  assert.match(commentsText, /还有更多评论/);

  const searchText = searchTextFormatter({
    data: {
      has_more: false,
      items: [
        { noteInfo: { title: "低", likeNum: 5, favNum: 1, cmtNum: 0, noteType: "normal" }, userInfo: { nickName: "A" } },
        { noteInfo: { title: "高", likeNum: 900, favNum: 10, cmtNum: 3, noteType: "video" }, userInfo: { nickName: "B" } },
      ],
    },
  });
  assert.ok(searchText.indexOf("高") < searchText.indexOf("低"), "搜索结果应按点赞降序");

  // 时间口径：上游是 UTC epoch，展示必须 +8（独立来源：+8h 等于上游 notePublishTime）
  const noteText = noteTextFormatter({ note_data: { title: "T", type: "normal", time: 1793578330 } });
  assert.match(noteText, /2026-11-02 08:12:10/);
});
