import { marked } from "marked";
import plaintify from "marked-plaintify";

marked.use(plaintify());

export function mardownToPlainText(markdown: string): Promise<string> {
  return marked.parse(markdown, { async: true });
}
