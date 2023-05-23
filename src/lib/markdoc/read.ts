import type { z } from "zod";
import path from "path";
import matter from "gray-matter";
import fs from "fs/promises";
import { globby } from "globby";
import Markdoc from "@markdoc/markdoc";
import { config } from "./markdoc.config";

// path is relative to where you run the `yarn build` command
const contentDirectory = path.normalize("./content");

async function parseAndTransform({ content }: { content: string }) {
  const ast = Markdoc.parse(content);

  const errors = Markdoc.validate(ast, config);
  if (errors.length) {
    console.error(errors);
    throw new Error("Markdoc validation error");
  }
  const transformedContent = Markdoc.transform(ast, config);

  return transformedContent;
}

function validateFrontmatter<T extends z.ZodTypeAny>({
  frontmatter,
  schema,
  filepath,
}: {
  frontmatter: { [key: string]: unknown };
  schema: T;
  filepath: string;
}) {
  try {
    const validatedFrontmatter = schema.parse(frontmatter);
    return validatedFrontmatter as z.infer<T>;
  } catch (e) {
    console.log(frontmatter);
    const errMessage = `
      There was an error validating your frontmatter. 
      Please make sure your frontmatter for file: ${filepath} matches its schema.
    `;
    throw Error(errMessage + (e as Error).message);
  }
}

export async function read<T extends z.ZodTypeAny>({
  filepath,
  schema,
}: {
  filepath: string;
  schema: T;
}) {
  const rawString = await fs.readFile(filepath, "utf8");
  const { content, data: frontmatter } = matter(rawString);
  const transformedContent = await parseAndTransform({ content }).catch(error => {
    // console.error(filepath);
    return Promise.reject(error);
  })
  const validatedFrontmatter = validateFrontmatter({
    frontmatter,
    schema,
    filepath,
  });

  const split = filepath.split("/");
  let filename = split.pop();
  if (!filename) throw new Error("Check what went wrong");
  let fileNameWithoutExtension = filename.replace(/\.[^.]*$/, "");
  if (fileNameWithoutExtension === "index") {
    const next = split.pop();
    if (!next) throw new Error("Check what went wrong");
    fileNameWithoutExtension = next;
  }


  return {
    slug: fileNameWithoutExtension,
    filepath,
    content: transformedContent,
    frontmatter: validatedFrontmatter,
  };
}

export async function readOne<T extends z.ZodTypeAny>({
  directory,
  slug,
  filepath,
  frontmatterSchema: schema,
}: {
  directory: string;
  slug: string;
  filepath: string;
  frontmatterSchema: T;
}) {
  // let filepath = getPath(slug);
  // if (!await isFile(filepath)) {
  //   filepath = getPath(`${slug}/index`);
  //   console.log({ filepath, is: await isFile(filepath) })
  //   if (!await isFile(filepath)) {
  //     throw new Error("Could not find blog post");
  //   }
  // }
  return read({
    filepath,
    schema,
  });

  function getPath(slug: string) {
    return path.join(contentDirectory, directory, `${slug}.md`);
  }

  async function isFile(path: string) {
    try {
      const stat = await fs.stat(path);
      return stat.isFile();
    } catch {
      return false;
    }
  }
}

export async function readAll<T extends z.ZodTypeAny>({
  directory,
  frontmatterSchema: schema,
}: {
  directory: string;
  frontmatterSchema: T;
}) {
  const pathToDir = path.posix.join(contentDirectory, directory);
  const paths = await globby(`${pathToDir}/**/*.md`);

  return Promise.all(paths.map((path) => read({ filepath: path, schema })));
}
