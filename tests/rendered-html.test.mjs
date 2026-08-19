import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders client, restaurant, courier and document routes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("routes", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const routes = [
    ["/", "Весь Щучинск"],
    ["/restaurants", "Больше заказов"],
    ["/couriers", "Знаете город"],
    ["/offer", "Пользовательское соглашение и публичная оферта"],
    ["/privacy", "Политика конфиденциальности"],
    ["/consent", "Согласие на обработку персональных данных"],
    ["/cookies", "Политика Cookie"],
    ["/refund", "Возврат и отмена заказа"],
  ];

  for (const [path, expected] of routes) {
    const response = await worker.fetch(
      new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
      env,
      context,
    );
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), new RegExp(expected), path);
  }
});

test("renders the Astana Hub participant mark and official legal references", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("legal", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };

  const home = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, context);
  const offer = await worker.fetch(new Request("http://localhost/offer", { headers: { accept: "text/html" } }), env, context);

  assert.match(await home.text(), /Участник Astana Hub/);
  assert.match(await offer.text(), /adilet\.zan\.kz\/rus\/docs\/Z100000274_/);
});
