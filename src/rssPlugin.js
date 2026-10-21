import pkg from "../package.json" with {type: "json"};

import dateRfc3339 from "./dateRfc3339.js";
import dateRfc822 from "./dateRfc822.js";
import getNewestCollectionItemDate from "./getNewestCollectionItemDate.js";

import absoluteUrl from "./absoluteUrl.js";
import convertHtmlToAbsoluteUrls from "./htmlToAbsoluteUrls.js";


export default function eleventyRssPlugin(eleventyConfig, options = {}) {
  eleventyConfig.versionCheck(pkg["11ty"].compatibility);

  // Guaranteed unique, first add wins
  const pluginHtmlBase = eleventyConfig.resolvePlugin("@11ty/eleventy/html-base-plugin");
  eleventyConfig.addPlugin(pluginHtmlBase, options.htmlBasePluginOptions || {});

  // Skip entries without a URL (e.g. `permalink: false`), see #66
  eleventyConfig.addFilter("eleventyFeedHasUrl", function(array) {
    return array.filter(entry => entry.url);
  });

  // Sort a copy of a collection by date.
  eleventyConfig.addFilter("eleventyFeedSortByDate", function(array, direction) {
    return [...array].sort((a, b) => direction === "ascending" ? a.date - b.date : b.date - a.date);
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("eleventyFeedHead", function(array, n) {
    if(!n || n === 0) {
      return array;
    }
    if(n < 0) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  // Dates
  eleventyConfig.addNunjucksFilter("getNewestCollectionItemDate", getNewestCollectionItemDate);
  eleventyConfig.addNunjucksFilter("dateToRfc3339", dateRfc3339);
  eleventyConfig.addNunjucksFilter("dateToRfc822", (date) => dateRfc822(date, options.timeZone));

  // Deprecated in favor of the more efficient HTML <base> plugin bundled with Eleventy
  eleventyConfig.addNunjucksFilter("absoluteUrl", absoluteUrl);

  // Deprecated in favor of the more efficient HTML <base> plugin bundled with Eleventy
  eleventyConfig.addNunjucksAsyncFilter("htmlToAbsoluteUrls", (htmlContent, base, callback) => {
    if(!htmlContent) {
      callback(null, "");
      return;
    }

    let posthtmlOptions = Object.assign({
      // default PostHTML render options
      closingSingleTag: "slash"
    }, options.posthtmlRenderOptions);

    convertHtmlToAbsoluteUrls(htmlContent, base, posthtmlOptions).then(html => {
      callback(null, html);
    });
  });

  // These are removed, their names are incorrect! Issue #8, #21
  eleventyConfig.addNunjucksFilter("rssLastUpdatedDate", () => {
    throw new Error("The `rssLastUpdatedDate` filter was removed. Use `getNewestCollectionItemDate | dateToRfc3339` (for Atom) or `getNewestCollectionItemDate | dateToRfc822` (for RSS) instead.")
  });
  eleventyConfig.addNunjucksFilter("rssDate", () => {
    throw new Error("The `rssDate` filter was removed. Use `dateToRfc3339` (for Atom) or `dateToRfc822` (for RSS) instead.");
  });
};

Object.defineProperty(eleventyRssPlugin, "eleventyPackage", {
	value: pkg.name
});

Object.defineProperty(eleventyRssPlugin, "eleventyPluginOptions", {
	value: {
    unique: true
  }
});
