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
 * Dịch văn bản sang tiếng Anh (Dành cho Title) bằng Google Translate
 */
async function translateToEnglish(text) {
  if (!text || text.trim().length < 3) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[0]?.map((seg) => seg[0]).join('') || text;
  } catch (err) {
    return text;
  }
}

/**
 * Dịch văn bản sang tiếng Việt cực mượt bằng AI Gemini
 */
async function translateToVietnameseAI(text) {
  if (!aiModel || !text) return text; // Fallback nếu không có API key
  try {
    const prompt = `Dịch đoạn văn bản tiếng Anh/Nga sau sang tiếng Việt thật tự nhiên, dùng văn phong của game thủ Việt Nam khi nói về bản mod game FC 24/FC 26. Giữ nguyên các thuật ngữ chuyên ngành (như TU, Title Update, Manager, Career Mode, Kit, Face...). Chỉ trả về nội dung đã dịch, không thêm bất kỳ bình luận nào:\n\n${text}`;
    const result = await aiModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error(`  ⚠️  AI Translate error: ${err.message}`);
    // Fallback sang Google Translate
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text.substring(0, 3000))}`;
      const res = await fetch(url, { headers: FETCH_HEADERS });
      const data = await res.json();
      return data[0]?.map((seg) => seg[0]).join('') || text;
    } catch {
      return text;
    }
  }
}

/**
 * Tự động phân loại tag bằng TỪ KHÓA (nhanh và chính xác 100%)
 */
function autoCategorizeTags(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  const tags = [];
  
  if (text.includes('kit') || text.includes('shirt') || text.includes('áo') || text.includes('trang phục') || text.includes('uniform') || text.includes('sponser')) {
    tags.push('Kits');
  }
  if (text.includes('gameplay') || text.includes('lối chơi') || text.includes('cách chơi') || text.includes('physics')) {
    tags.push('Gameplay');
  }
  if (text.includes('graphic') || text.includes('texture') || text.includes('visual') || text.includes('đồ họa') || text.includes('menu') || text.includes('sân cỏ') || text.includes('pitch') || text.includes('boot') || text.includes('glove') || text.includes('tv logo') || text.includes('scoreboard') || text.includes('tatu') || text.includes('tattoo')) {
    tags.push('Đồ họa');
  }
  if (text.includes('career') || text.includes('manager') || text.includes('transfer') || text.includes('squad') || text.includes('unlock') || text.includes('chuyển nhượng') || text.includes('cơ chế') || text.includes('edit player') || text.includes('database')) {
    tags.push('Cơ chế game');
  }
  
  if (tags.length === 0) tags.push('Cơ chế game');
  return tags;
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
      finalTitle = await translateToEnglish(post.title);
    }
    console.log(`  📝 Title : ${finalTitle}`);

    // Dịch các đoạn text bằng AI Gemini
    console.log(`  🤖 AI is translating content...`);
    const textsToTranslate = post.contentParts.filter(p => p.type === 'text').map(p => p.text);
    const translatedCombined = await translateToVietnameseAI(textsToTranslate.join('\n\n').substring(0, 3000));
    const translatedParagraphs = translatedCombined.split('\n\n');

    // Phân loại tag dựa trên Keyword (Chuẩn xác 100%)
    const generatedTags = autoCategorizeTags(finalTitle, translatedCombined);
    console.log(`  🏷️  Tags : ${generatedTags.join(', ')}`);

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
      category: generatedTags[0] || 'Cơ chế game',
      version: '1.0',
      updated_at: `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`,
      description: smartSummarize(translatedCombined, 180), // Cắt mượt câu thay vì dùng AI bị ảo
      long_description: finalHtml,
      thumbnail: thumbnailPath || '',
      thumbnail_orientation: 'landscape',
      download_url: post.downloadLink,
      featured: false,
      tags: generatedTags,
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
