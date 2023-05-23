
import { readOne, readAll } from "./markdoc/read";
import { blog } from "./markdoc/frontmatter.schema";
import {SITE_BANNER_URL, SITE_URL} from "../config";

export async function getPostSlugs() {
    const posts = await readAll({
        directory: "blog",
        frontmatterSchema: blog,
    });

    // we don't want to generate pages for posts that link to external websites
    const filteredPosts = posts
        .filter((p) => p.frontmatter.draft !== true)
        .filter(({ frontmatter }) => !frontmatter.external);

    //console.log(filteredPosts.map(post => post.slug));

    return filteredPosts.map((post) => {
        return { params: { slug: post.slug } };
    })
}

export async function getPost(slug: string) {
    if (!slug) {
        throw Error(`slug should be string. Received: ${slug}`);
    }

    const posts = await readAll({
        directory: "blog",
        frontmatterSchema: blog,
    });

    const post = posts.find(post => post.slug === slug);
    if (!post) {
        throw Error(`Could not find post: ${slug}`);
    }
    const { content, frontmatter } = post;

    const ogImageAbsoluteUrl =
         frontmatter.ogImagePath
            ? new URL(frontmatter.ogImagePath, SITE_URL).toString()
            : SITE_BANNER_URL;

    return {
        content,
        ogImageAbsoluteUrl,
        frontmatter
    }
}