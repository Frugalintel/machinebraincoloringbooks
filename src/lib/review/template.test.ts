import { describe, expect, it } from "vitest";
import {
  collectRelativeUrls,
  injectFields,
  prepareTemplateHtml,
  renderTemplateSrcdoc,
  replaceFileFonts,
  serializeFieldsJson,
} from "@/lib/review/template";

const COVER_SNIPPET = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Cormorant;src:url("file:///usr/share/fonts/truetype/sand-box/google/Cormorant Garamond/CormorantGaramond-VariableFont_wght.ttf")}
@font-face{font-family:LoraV;src:url("file:///usr/share/fonts/truetype/sand-box/google/Lora/Lora-VariableFont_wght.ttf")}
.title{font-family:Cormorant}
.brand{font-family:LoraV,serif}
</style></head><body>
<img src="assets/frame-front.png">
<div style="background:#fff url(../frame/matter-border.recto.png) 0 0/2588px 3375px"></div>
<script id="fields" type="application/json">{}</script>
</body></html>`;

describe("review templates", () => {
  it("escapes closing tags in injected field JSON", () => {
    expect(serializeFieldsJson({ blurb: "</script>alert(1)" })).toContain("<\\/");
    expect(serializeFieldsJson({ blurb: "</script>alert(1)" })).not.toContain(
      "</script>",
    );
  });

  it("replaces the fields script block", () => {
    const html = injectFields(COVER_SNIPPET, { title: "Garden" });
    expect(html).toContain('"title":"Garden"');
    expect(html.match(/id="fields"/g)).toHaveLength(1);
  });

  it("swaps file fonts for Google Fonts family names", () => {
    const html = replaceFileFonts(COVER_SNIPPET);
    expect(html).toContain("fonts.googleapis.com");
    expect(html).not.toContain("file:///");
    expect(html).toContain("font-family:'Cormorant Garamond'");
    expect(html).toContain("font-family:Lora");
  });

  it("collects and rewrites relative assets to signed URLs", () => {
    const templatePath = "books/ottoline-garden/cover/cover.template.html";
    const paths = collectRelativeUrls(COVER_SNIPPET, templatePath);
    expect(paths).toContain(
      "books/ottoline-garden/cover/assets/frame-front.png",
    );
    expect(paths).toContain(
      "books/ottoline-garden/frame/matter-border.recto.png",
    );
    const prepared = prepareTemplateHtml(COVER_SNIPPET, templatePath, {
      "books/ottoline-garden/cover/assets/frame-front.png":
        "https://signed.example/frame-front.png",
      "books/ottoline-garden/frame/matter-border.recto.png":
        "https://signed.example/matter-border.png",
    });
    expect(prepared).toContain("https://signed.example/frame-front.png");
    expect(prepared).toContain("https://signed.example/matter-border.png");
    expect(prepared).not.toContain("src=\"assets/frame-front.png\"");
  });

  it("rewrites src field values when rendering srcdoc", () => {
    const srcdoc = renderTemplateSrcdoc(
      COVER_SNIPPET,
      { tile_1_src: "assets/tile-p05.svg", print: false },
      "books/ottoline-garden/cover/cover.template.html",
      {
        "books/ottoline-garden/cover/assets/tile-p05.svg":
          "https://signed.example/tile.svg",
      },
    );
    expect(srcdoc).toContain("https://signed.example/tile.svg");
    expect(srcdoc).toContain('"print":false');
  });
});
