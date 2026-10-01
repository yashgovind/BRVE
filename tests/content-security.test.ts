import test from "node:test";
import assert from "node:assert/strict";
import { normalizePost, syncEditorial } from "../src/lib/blogger/normalize";
import { isAllowedAdmin } from "../src/lib/firebase/authorization";
import { videoSchema, settingsSchema, isPublicHttpsUrl } from "../src/lib/validation";
import videos from "../src/content/preview-videos.json";

test("only verified Google identity matching the configured account is authorized", () => {
  const valid = { email: "2brveai@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" } };
  assert.equal(isAllowedAdmin(valid, "2brveai@gmail.com"), true);
  assert.equal(isAllowedAdmin(valid, undefined), false);
  assert.equal(isAllowedAdmin({ ...valid, email: "other@gmail.com" }, valid.email), false);
  assert.equal(isAllowedAdmin({ ...valid, email_verified: false }, valid.email), false);
  assert.equal(isAllowedAdmin({ ...valid, firebase: { sign_in_provider: "password" } }, valid.email), false);
  assert.equal(isAllowedAdmin({ email: valid.email }, valid.email), false);
});

test("content URLs reject executable schemes and private network addresses", () => {
  for (const url of ["javascript:alert(1)", "http://example.com", "https://127.0.0.1/x", "https://localhost/x", "https://[::1]/x", "https://user:pass@example.com/"]) assert.equal(isPublicHttpsUrl(url), false, url);
  assert.equal(settingsSchema.safeParse({ contactFormUrl: "javascript:alert(1)" }).success, false);
  assert.equal(settingsSchema.safeParse({ contactFormUrl: "https://docs.google.com/forms/d/e/test/viewform" }).success, true);
  assert.equal(settingsSchema.safeParse({ contactFormUrl: "", admin: true }).success, false);
});

test("Blogger normalization strips executable content, decodes text, preserves source URLs", () => {
  const result = normalizePost({ id: "123", title: "Ideas &amp; taste", content: "<h2>Headline</h2><p>Actual words.</p><script>steal()</script><img src='https://blogger.googleusercontent.com/image.jpg'>", url: "https://brve.blogspot.com/2026/10/post.html", published: "2026-10-01T00:00:00Z", labels: ["strategy"] });
  assert.equal(result.title, "Ideas & taste");
  assert.equal(result.excerpt, "Headline Actual words.");
  assert.equal(result.coverImage, "https://blogger.googleusercontent.com/image.jpg");
  assert.equal(result.bloggerPostId, "123");
  assert.ok(!("content" in result));
});

test("invalid Blogger data is rejected before the write phase", () => {
  assert.throws(() => normalizePost({ id: "../oops", title: "Title", url: "https://brve.blogspot.com/post", published: "invalid" }));
});

test("sync preserves editorial choices, including deliberately hidden posts", () => {
  assert.deepEqual(syncEditorial({ featured: true, order: 9, active: false }), { featured: true, order: 9, active: false });
  assert.deepEqual(syncEditorial(), { featured: false, order: 0, active: true });
});

test("video validation prevents invalid embed IDs and preserves all selected films", () => {
  assert.equal(videos.length, 7);
  videos.forEach(video => assert.equal(videoSchema.safeParse(video).success, true));
  assert.equal(videoSchema.safeParse({ ...videos[0], provider: "youtube", providerId: '<script>', videoUrl: "https://youtube.com/watch?v=test" }).success, false);
  assert.equal(videoSchema.safeParse({ ...videos[0], order: -1 }).success, false);
  assert.equal(videoSchema.safeParse({ ...videos[0], heroSlide: 7 }).success, false);
});
