import * as cheerio from "cheerio"
import { buildExcerpt } from "@/lib/related-content"

// =====================================================
// prepareArticleHtml — xử lý HTML bài viết phía server:
//  - H1 trong nội dung → H2 (bài viết chỉ có một H1 là tiêu đề trang)
//  - Gán id anchor cho h2/h3 → build mục lục (TOC)
//  - iframe → click-to-play (src chuyển sang data-src, không load/autoplay sẵn)
//  - img → lazy loading + đánh dấu mở lightbox
//  - a[target=_blank] → rel noopener
// Chạy sau rewriteImageSrcInHtml; không phải sanitize — nội dung do admin viết.
// =====================================================

export type TocItem = {
  id: string
  text: string
  level: 2 | 3
}

export type PreparedArticle = {
  html: string
  toc: TocItem[]
  excerpt: string
}

export function prepareArticleHtml(rawHtml: string): PreparedArticle {
  if (!rawHtml?.trim()) {
    return { html: "", toc: [], excerpt: "" }
  }

  const $ = cheerio.load(rawHtml, null, false)

  // Nội dung bắt đầu heading từ H2 — hạ H1 xuống H2 để tránh nhiều H1 trên trang.
  $("h1").each((_, el) => {
    const $el = $(el)
    const id = $el.attr("id")
    const replacement = $("<h2></h2>")
    if (id) replacement.attr("id", id)
    replacement.html($el.html() ?? "")
    $el.replaceWith(replacement)
  })

  const toc: TocItem[] = []
  $("h2, h3").each((index, el) => {
    const $el = $(el)
    const tagName = (
      (el as { tagName?: string }).tagName ||
      (el as { name?: string }).name ||
      ""
    ).toLowerCase()
    const level: 2 | 3 = tagName === "h3" ? 3 : 2
    let id = ($el.attr("id") || "").trim()
    if (!id) {
      id = `sec-${index + 1}`
      $el.attr("id", id)
    }
    const text = $el.text().replace(/\s+/g, " ").trim()
    if (text) {
      toc.push({ id, text, level: level as 2 | 3 })
    }
  })

  // Video nhúng: click-to-play — dời src sang data-src, chỉ load khi người đọc bấm.
  $("iframe").each((_, el) => {
    const $el = $(el)
    const src = ($el.attr("src") || "").trim()
    if (!src) return
    const title = ($el.attr("title") || "").trim() || "Video nhúng"
    $el.attr("data-src", src)
    $el.removeAttr("src")
    $el.attr("title", title)
    $el.attr("loading", "lazy")
    if (!$el.attr("allow")) {
      $el.attr(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      )
    }
    $el.attr("allowfullscreen", "true")
    $el.attr(
      "style",
      "position:absolute;inset:0;width:100%;height:100%;border:0;"
    )
    $el.wrap(
      '<div class="article-video" style="position:relative;aspect-ratio:16/9;width:100%;overflow:hidden;border-radius:12px;border:1px solid var(--color-line);background:var(--color-surface-1)"></div>'
    )
    $el.parent().append(
      `<button type="button" class="article-video__play" aria-label="Phát video" style="position:absolute;inset:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);cursor:pointer;border:0;padding:0;">` +
        `<span style="display:inline-flex;align-items:center;gap:10px;background:var(--color-accent);color:var(--color-on-accent);font-weight:700;font-size:15px;line-height:1;padding:14px 22px;border-radius:999px;">` +
        `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>` +
        `Xem video` +
        `</span></button>`
    )
  })

  $("img").each((_, el) => {
    const $el = $(el)
    if (!$el.attr("loading")) $el.attr("loading", "lazy")
    if (!$el.attr("decoding")) $el.attr("decoding", "async")
    // Ảnh trong bài có thể bấm để xem lớn (xử lý ở ArticleBody phía client)
    const style = $el.attr("style") || ""
    $el.attr("style", `${style}${style ? ";" : ""}cursor:zoom-in`)
  })

  $('a[target="_blank"]').each((_, el) => {
    $(el).attr("rel", "noopener noreferrer")
  })

  // excerpt từ rawHtml: stripHtml thay thẻ bằng khoảng trắng → không dính chữ
  // giữa các block (cheerio .text() nối liền text node của các element)
  const excerpt = buildExcerpt(rawHtml, 170)

  return { html: $.html(), toc, excerpt }
}
