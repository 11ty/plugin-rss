import test from "ava";
import Eleventy from "@11ty/eleventy";
import rssPlugin from "../.eleventy.js";

test("Feed options on the default RSS plugin explain which export to use", async (t) => {
	let elev = new Eleventy("./test", "./test/_site", {
		config(eleventyConfig) {
			eleventyConfig.addPlugin(rssPlugin, {
				type: "atom",
				collection: { name: "posts" },
				outputPath: "/feed.xml",
			});
		},
	});
	let error = await t.throwsAsync(() => elev.toJSON());
	t.regex(error.originalError.message, /collection/);
	t.regex(error.originalError.message, /named.*feedPlugin/);
});

test("Feed-only options are rejected even when their value is false", (t) => {
	let config = {
		versionCheck() {},
		resolvePlugin() {},
		addPlugin() {},
		addFilter() {},
		addNunjucksFilter() {},
		addNunjucksAsyncFilter() {},
	};
	let error = t.throws(() => rssPlugin(config, { type: false }));
	t.true(error.message.includes("type"));
	t.regex(error.message, /named.*feedPlugin/);
});

test("The default RSS plugin still supports manual templates and its own options", async (t) => {
	let elev = new Eleventy("./test", "./test/_site", {
		config(eleventyConfig) {
			eleventyConfig.addPlugin(rssPlugin, {
				htmlBasePluginOptions: {},
				posthtmlRenderOptions: { closingSingleTag: "slash" },
			});
			eleventyConfig.addTemplate("manual.njk", "{{ date | dateToRfc3339 }}", {
				date: new Date("2026-01-01T00:00:00Z"),
			});
		},
	});
	let results = await elev.toJSON();
	t.is(results.length, 1);
	t.is(results[0].content, "2026-01-01T00:00:00Z");
});
