const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const https = require("node:https");
const test = require("node:test");

const { webSearch } = require("./api");

function captureRequest(callback) {
  const originalRequest = https.request;
  let captured;
  https.request = (options, responseCallback) => {
    const request = new EventEmitter();
    const chunks = [];
    request.write = (chunk) => chunks.push(Buffer.from(chunk));
    request.end = () => {
      captured = { options, body: JSON.parse(Buffer.concat(chunks).toString("utf-8")) };
      const response = new EventEmitter();
      response.statusCode = 200;
      responseCallback(response);
      response.emit("data", Buffer.from(JSON.stringify({ success: true, billing: {} })));
      response.emit("end");
    };
    return request;
  };

  return callback().then(() => captured).finally(() => {
    https.request = originalRequest;
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
