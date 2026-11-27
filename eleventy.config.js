export default function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
    eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
    return {
        dir: { input: "src", output: "dist", includes: "_includes" },
        templateFormats: ["njk"],
        htmlTemplateEngine: "njk"
    };
}
