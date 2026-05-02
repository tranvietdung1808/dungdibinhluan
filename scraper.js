require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const OpenAI = require('openai');
const cheerio = require('cheerio');

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'dungdibinhluan-images';

let openaiClient = null;
if (process.env.DEEPSEEK_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
  });
}

const BASE_URL = 'https://gamekot.pro';
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36',
};

const BLOCKED_SLUGS = [
  'wishlist', 'my-account', 'faqs', 'about-us', 'contact-us',
  'send-us-mod', 'privacy-policy', 'refund_returns', 'cart',
  'checkout', 'payment-page', 'kak-pokypat', 'reshenie-problem'
];

const VALID_TAGS = ['Kits', 'Gameplay', 'Đồ họa', 'Cơ chế game'];

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const generateFileName = (ext) => `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
const hasCyrillic = (text) => /[\u0400-\u04FF]/.test(text);

/**
 * Upload ảnh từ URL → R2 → trả về path
 */
async function uploadImageFromUrl(imageUrl) {
  if (!imageUrl) return null;
  try {
    const res = await fetch(encodeURI(imageUrl), { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`Image fetch ${res.status}`);

    const contentType = res.headers.get('content-type') || 'image/webp';
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : contentType.includes('png') ? 'png' : 'webp';
    const fileName = generateFileName(ext);

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    }));

    return `/api/media/${fileName}`;
  } catch (err) {
    console.error(`  ❌ Image upload failed: ${err.message}`);
    return null;
  }
}

/**
 * Dịch văn bản ngắn gọn (Fallback)
 */
async function translateFallback(text, targetLang = 'en') {
  if (!text || text.trim().length < 3) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[0]?.map((seg) => seg[0]).join('') || text;
  } catch (err) {
    console.error(`  ⚠️  Translate fallback error: ${err.message}`);
    return text;
  }
}

/**
 * Sử dụng DeepSeek Chat để dịch bài viết và phân loại tags
 */
async function aiDeepSeekTranslateAndProcess(rawContent) {
  const fallback = {
    short_description: rawContent.substring(0, 150),
    long_description: rawContent,
    tags: ['Cơ chế game']
  };

  if (!openaiClient || !rawContent) return fallback;

  try {
    const prompt = `Bạn là một AI chuyên dịch thuật về game bóng đá (FC 24, FC 26, FIFA). Hãy đọc bài viết giới thiệu mod sau và thực hiện 2 việc sau:
1. Dịch bài viết sang tiếng Việt chuẩn xác và tự nhiên:
   - "long_description": Dịch toàn bộ nội dung này sang tiếng Việt rõ ràng, mượt mà.
   - "short_description": Viết đúng 1 câu mô tả ngắn tiếng Việt (dưới 150 ký tự) từ bài dịch.

2. Chọn thẻ (tags) chính xác:
   Hãy phân loại mod này vào 1 hoặc tối đa 3 thẻ phù hợp. Danh sách thẻ ĐƯỢC PHÉP dùng: ["Kits", "Gameplay", "Đồ họa", "Cơ chế game"].
   - "Kits": Áo đấu, trang phục, quần áo, tài trợ...
   - "Gameplay": Lối chơi, cách di chuyển, tốc độ, AI...
   - "Đồ họa": Giao diện, menu, sân cỏ, mặt, giày, găng tay, hình ảnh...
   - "Cơ chế game": Chuyển nhượng (transfers), sự nghiệp (career), mở khóa (unlock), squad, database, file chỉnh sửa hệ thống...
   * Tuyệt đối KHÔNG DÙNG thẻ "Faces". Hãy chọn thẻ thật khách quan. Không được chỉ chọn "Cơ chế game" nếu nội dung nói về áo đấu hoặc lối chơi.

Hãy trả về chính xác định dạng chuỗi JSON nguyên bản (không chứa markdown \`\`\`json):
{
  "short_description": "Mô tả ngắn tiếng Việt",
  "long_description": "Mô tả dài tiếng Việt đầy đủ",
  "tags": ["Tag1", "Tag2"]
}

Nội dung bài viết:
${rawContent.substring(0, 3000)}`;

    const response = await openaiClient.chat.completions.create({
      model: 'deepseek-chat', // 'deepseek-chat' handles deepseek-v3/deepseek-v4 tasks via their API
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    let rawText = response.choices[0]?.message?.content?.trim() || '';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    if (!parsed.short_description) parsed.short_description = fallback.short_description;
    if (!parsed.long_description) parsed.long_description = fallback.long_description;
    if (!parsed.tags || !Array.isArray(parsed.tags) || parsed.tags.length === 0) parsed.tags = fallback.tags;

    // Lọc tags
    parsed.tags = parsed.tags.filter(t => VALID_TAGS.includes(t));
    if (parsed.tags.length === 0) parsed.tags = ['Cơ chế game'];

    return parsed;
  } catch (err) {
    console.error(`  ⚠️  DeepSeek AI Process error: ${err.message}`);
    return fallback;
  }
}

/**
 * Lấy link tải modsfire
 */
function extractDownloadLink($) {
  let link = null;
  $('[class*="elementor-button-success"] a[href], a.elementor-button[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const parentClass = $(el).closest('[class*="elementor-button-"]').attr('class') || '';
    if (parentClass.includes('elementor-button-info')) return;
    if (href.includes('t.me') || href.includes('telegram') || href.includes('gamekot.pro')) return;
    if (!href || href.startsWith('/')) return;
    if (!link) link = href;
  });
  return link;
}

// ─────────────────────────────────────────────
// SCRAPING LOGIC
// ─────────────────────────────────────────────

async function scrapeCategory() {
  const postLinks = [];
  for (let page = 2; page >= 1; page--) {
    const url = page === 1 ? `${BASE_URL}/category/fc26/` : `${BASE_URL}/category/fc26/page/${page}/`;
    console.log(`\n📋 Page ${page}: ${url}`);

    const res = await fetch(encodeURI(url), { headers: FETCH_HEADERS });
    if (!res.ok) continue;

    const html = await res.text();
    const $ = cheerio.load(html);

    const pageLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.startsWith(BASE_URL + '/')) return;
      if (href.includes('#')) return;
      if (/\/(category|page|author|tag|product-category|shop|wp-|wishlist|my-account|faqs|about-us|contact-us|send-us-mod|privacy-policy|refund_returns|cart|checkout|payment-page|kak-pokypat|reshenie-problem)/i.test(href)) return;
      if (href.includes('add-to-cart') || href.includes('add_to_wishlist')) return;

      const slug = href.replace(BASE_URL + '/', '').replace(/\/$/, '');
      if (BLOCKED_SLUGS.some(b => slug === b)) return;
      if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(slug)) return;

      if (!pageLinks.includes(href) && !postLinks.includes(href)) {
        pageLinks.push(href);
      }
    });

    // Reversing pageLinks makes it process the older posts on the page first
    postLinks.push(...pageLinks.reverse());
  }
  return postLinks;
}

async function scrapePost(url) {
  try {
    const res = await fetch(encodeURI(url), { headers: FETCH_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('h1.entry-title, h1').first().text().trim() || '';
    const rawImageUrl = $('meta[property="og:image"]').attr('content') || $('article img').first().attr('src') || null;

    let originalContentText = '';
    $('.entry-content p, .elementor-widget-text-editor p').each((_, el) => {
      if ($(el).closest('.elementor-button, .sharedaddy, .comment-respond').length) return;
      const text = $(el).text().trim();
      if (text && text.length > 5 && !text.includes('No Comments')) {
         originalContentText += text + '\n\n';
      }
    });

    if (!originalContentText.trim()) {
       originalContentText = $('.entry-content').text().trim().substring(0, 2000);
    }

    return { 
      title, 
      rawImageUrl, 
      originalContentText, 
      downloadLink: extractDownloadLink($), 
      slug: url.replace(BASE_URL + '/', '').replace(/\/$/, '') 
    };
  } catch (err) {
    return null;
  }
}

// ─────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────
async function main() {
  const postLinks = await scrapeCategory();
  let stats = { success: 0, skip: 0, fail: 0 };

  console.log(`\n📦 Total URLs found: ${postLinks.length}`);

  for (const link of postLinks) {
    console.log(`\n🔍 ${link}`);
    const slug = link.replace(BASE_URL + '/', '').replace(/\/$/, '');

    const { data: existing } = await supabase.from('mods').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      console.log(`  ⏭️  Already exists.`);
      stats.skip++;
      continue;
    }

    const post = await scrapePost(link);
    if (!post || !post.downloadLink) {
      console.log(`  ⚠️  Invalid post or no download link, skip.`);
      stats.fail++;
      continue;
    }

    // Tên tiếng Anh
    let finalTitle = post.title;
    if (hasCyrillic(post.title)) {
      finalTitle = await translateFallback(post.title, 'en');
    }
    console.log(`  📝 Title : ${finalTitle}`);

    // Dịch bằng DeepSeek
    console.log(`  🤖 DeepSeek AI processing translation and tags...`);
    const aiResult = await aiDeepSeekTranslateAndProcess(post.originalContentText);
    console.log(`  🏷️  Tags : ${aiResult.tags.join(', ')}`);

    // Ghép HTML mô tả dài
    let finalHtml = '';
    if (aiResult.long_description) {
      finalHtml = aiResult.long_description.split('\n\n').map(p => `<p class="my-3 text-gray-200 leading-relaxed">${p}</p>`).join('\n');
    } else {
      finalHtml = `<p class="my-3 text-gray-200">Không có mô tả chi tiết cho bản mod này.</p>`;
    }

    // Upload Thumbnail R2
    const thumbnailPath = await uploadImageFromUrl(post.rawImageUrl);

    // Save
    const now = new Date();
    const modData = {
      slug: post.slug,
      name: finalTitle,
      author: 'FIFA MODS',
      category: aiResult.tags[0] || 'Cơ chế game',
      version: '1.0',
      updated_at: `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`,
      description: aiResult.short_description || finalTitle,
      long_description: finalHtml,
      thumbnail: thumbnailPath || '',
      thumbnail_orientation: 'landscape',
      download_url: post.downloadLink,
      featured: false,
      tags: aiResult.tags,
    };

    const { error } = await supabase.from('mods').insert([modData]);
    if (error) {
      console.error(`  ❌ DB error: ${error.message}`);
      stats.fail++;
    } else {
      console.log(`  ✅ Saved!`);
      stats.success++;
    }
    await delay(1500);
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`✅ Success : ${stats.success}`);
  console.log(`⏭️  Skipped : ${stats.skip}`);
  console.log(`❌ Failed  : ${stats.fail}`);
  console.log(`${'─'.repeat(40)}`);
}

main().catch(console.error);
