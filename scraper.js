require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

let genAI = null;
let aiModel = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

const BASE_URL = 'https://gamekot.pro';
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36',
};

// URL/slug rác cần bỏ qua
const BLOCKED_SLUGS = [
  'wishlist', 'my-account', 'faqs', 'about-us', 'contact-us',
  'send-us-mod', 'privacy-policy', 'refund_returns', 'cart',
  'checkout', 'payment-page', 'kak-pokypat', 'reshenie-problem'
];

// Các tags hợp lệ (KHÔNG CÓ "Faces")
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
    const res = await fetch(imageUrl, { headers: FETCH_HEADERS });
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
 * Dịch văn bản với Google Translate API
 */
async function translate(text, targetLang = 'en') {
  if (!text || text.trim().length < 3) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[0]?.map((seg) => seg[0]).join('') || text;
  } catch (err) {
    console.error(`  ⚠️  Translate error: ${err.message}`);
    return text;
  }
}

/**
 * Xử lý bằng AI (Tóm tắt & Cấp Tag) một lần gọi API duy nhất
 */
async function aiProcessContent(text, fallbackTitle) {
  const fallback = { summary: smartSummarize(text), tags: ['Cơ chế game'] };
  if (!aiModel || !text) return fallback;

  try {
    const prompt = `Bạn là chuyên gia review game FC 24/FC 26. Dựa vào nội dung bản mod sau, hãy làm 2 việc:
1. Tóm tắt nội dung thành 1 câu tiếng Việt ngắn gọn, hấp dẫn (dưới 150 ký tự).
2. Phân loại mod này vào 1 hoặc tối đa 3 thẻ.
Danh sách thẻ được phép dùng: ["Kits", "Gameplay", "Đồ họa", "Cơ chế game"]. 
Tuyệt đối KHÔNG DÙNG thẻ "Faces".

Hãy trả về chính xác định dạng JSON nguyên thủy (không chứa markdown \`\`\`json):
{
  "summary": "Tóm tắt ngắn gọn",
  "tags": ["tag1", "tag2"]
}

Nội dung mod:
${text.substring(0, 2000)}`;

    const result = await aiModel.generateContent(prompt);
    let rawText = result.response.text().trim();
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(rawText);
    if (!parsed.summary) parsed.summary = fallback.summary;
    if (!parsed.tags || !Array.isArray(parsed.tags) || parsed.tags.length === 0) parsed.tags = fallback.tags;
    
    // Lọc bỏ 'Faces' hoặc tag lạ rác rưởi do AI bị ảo giác
    parsed.tags = parsed.tags.filter(t => VALID_TAGS.includes(t));
    if (parsed.tags.length === 0) parsed.tags = ['Cơ chế game'];

    return parsed;
  } catch (err) {
    console.error(`  ⚠️  AI Process error: ${err.message}`);
    return fallback;
  }
}

/**
 * Tóm tắt thủ công (dự phòng khi AI hỏng)
 */
function smartSummarize(text, maxLength = 200) {
  if (!text) return '';
  let cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;
  let snippet = cleanText.substring(0, maxLength);
  const lastPunctuation = snippet.match(/.*[.!?]/);
  if (lastPunctuation) return lastPunctuation[0];
  const lastSpace = snippet.lastIndexOf(' ');
  return lastSpace > 0 ? snippet.substring(0, lastSpace) + '...' : snippet + '...';
}

/**
 * Lấy link tải modsfire (bỏ qua telegram, gamekot nội bộ)
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

async function scrapeCategory(maxPages = 3) {
  const postLinks = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${BASE_URL}/category/fc26/` : `${BASE_URL}/category/fc26/page/${page}/`;
    console.log(`\n📋 Page ${page}: ${url}`);

    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) break;

    const html = await res.text();
    const $ = cheerio.load(html);

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.startsWith(BASE_URL + '/')) return;
      if (href.includes('#')) return;
      if (/\/(category|page|author|tag|product-category|shop|wp-|wishlist|my-account|faqs|about-us|contact-us|send-us-mod|privacy-policy|refund_returns|cart|checkout|payment-page|kak-pokypat|reshenie-problem)/i.test(href)) return;
      if (href.includes('add-to-cart') || href.includes('add_to_wishlist')) return;

      const slug = href.replace(BASE_URL + '/', '').replace(/\/$/, '');
      if (BLOCKED_SLUGS.some(b => slug === b)) return;
      if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(slug)) return;

      if (!postLinks.includes(href)) {
        postLinks.push(href);
      }
    });
  }
  return postLinks;
}

async function scrapePost(url) {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('h1.entry-title, h1').first().text().trim() || '';
    const rawImageUrl = $('meta[property="og:image"]').attr('content') || $('article img').first().attr('src') || null;

    const contentParts = [];
    $('.entry-content p, .elementor-widget-text-editor p').each((_, el) => {
      if ($(el).closest('.elementor-button, .sharedaddy, .comment-respond').length) return;
      
      const text = $(el).text().trim();
      if (text && text.length > 5 && !text.includes('No Comments')) {
         contentParts.push({ type: 'text', text: text });
      }
    });

    return { 
      title, 
      rawImageUrl, 
      contentParts, 
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
  const postLinks = await scrapeCategory(3);
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
      finalTitle = await translate(post.title, 'en');
    }
    console.log(`  📝 Title : ${finalTitle}`);

    // Dịch các đoạn text 1 lần duy nhất
    console.log(`  🌐 Translating content...`);
    const textsToTranslate = post.contentParts.filter(p => p.type === 'text').map(p => p.text);
    const translatedCombined = await translate(textsToTranslate.join('\n\n').substring(0, 3000), 'vi');
    const translatedParagraphs = translatedCombined.split('\n\n');

    // AI phân tích Tag & Tóm tắt
    console.log(`  🤖 AI processing summary and tags...`);
    const aiResult = await aiProcessContent(translatedCombined, finalTitle);
    console.log(`  🏷️  Tags : ${aiResult.tags.join(', ')}`);

    // Ghép HTML
    let finalHtml = '', textIndex = 0;
    for (const part of post.contentParts) {
       if (part.type === 'text') {
           const translatedP = translatedParagraphs[textIndex] || part.text;
           finalHtml += `<p class="my-3 text-gray-200 leading-relaxed">${translatedP}</p>\n`;
           textIndex++;
       }
    }
    if (!finalHtml.trim()) finalHtml = `<p class="my-3 text-gray-200">Không có mô tả chi tiết cho bản mod này.</p>`;

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
      description: aiResult.summary,
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
