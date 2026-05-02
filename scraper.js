require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');

// ─────────────────────────────────────────────
// INIT CLIENTS
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
  aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const BASE_URL = 'https://gamekot.pro';
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Các slug trang "hệ thống" cần bỏ qua hoàn toàn
const BLOCKED_SLUGS = [
  'kak-pokypat-na-site', 'reshenie-problem-s-modami-fifa-i-fc',
  'payment-page', 'wishlist', 'my-account', 'faqs', 'about-us',
  'contact-us', 'send-us-mod', 'privacy-policy', 'refund_returns',
  'shop', 'cart', 'checkout',
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function generateFileName(ext = 'webp') {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
}

/** Phát hiện văn bản có chứa Cyrillic (tiếng Nga) không */
function hasCyrillic(text) {
  return /[\u0400-\u04FF]/.test(text);
}

/**
 * Dịch văn bản: nếu là tiếng Nga/tiếng khác → sang tiếng Anh (tên)
 * hoặc sang tiếng Việt (mô tả)
 */
async function translate(text, targetLang = 'en') {
  if (!text || text.trim().length < 3) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: { 'User-Agent': FETCH_HEADERS['User-Agent'] } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[0]?.map((seg) => seg[0]).join('') || text;
  } catch (err) {
    console.error(`  ⚠️  Translate error: ${err.message}`);
    return text;
  }
}

/**
 * Trích xuất tóm tắt thông minh từ nội dung dài (cắt đúng câu, không bị đứt chữ)
 */
function smartSummarize(text, maxLength = 200) {
  if (!text) return '';
  // Xóa khoảng trắng thừa và dòng trống
  let cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (cleanText.length <= maxLength) return cleanText;

  // Cắt tới giới hạn
  let snippet = cleanText.substring(0, maxLength);
  
  // Tìm dấu chấm câu cuối cùng (.!?) để cắt cho trọn vẹn câu
  const lastPunctuation = snippet.match(/.*[.!?]/);
  if (lastPunctuation) {
    return lastPunctuation[0];
  }
  
  // Nếu không có dấu chấm, cắt ở khoảng trắng gần nhất
  const lastSpace = snippet.lastIndexOf(' ');
  if (lastSpace > 0) {
    return snippet.substring(0, lastSpace) + '...';
  }
  
  return snippet + '...';
}

/**
 * Dùng AI (Gemini) để tóm tắt văn bản thành 1 câu cực hay
 */
async function aiSummarize(text) {
  if (!aiModel || !text) return smartSummarize(text, 200); // Nếu không có API KEY thì dùng cách cắt chữ
  try {
    const prompt = `Bạn là một chuyên gia về game bóng đá (FC 24, FC 26, FIFA). Hãy tóm tắt đoạn văn bản sau đây thành 1-2 câu tiếng Việt cực kỳ ngắn gọn, hấp dẫn (dưới 200 ký tự) để làm dòng mô tả tóm tắt cho một bản mod game:\n\n${text.substring(0, 2000)}`;
    const result = await aiModel.generateContent(prompt);
    const summary = result.response.text().trim().replace(/\n/g, ' ');
    return summary;
  } catch (err) {
    console.error(`  ⚠️  AI Summarize error: ${err.message}`);
    return smartSummarize(text, 200);
  }
}

/**
 * Upload ảnh từ URL → R2 → trả về /api/media/<filename>
 */
async function uploadImageFromUrl(imageUrl) {
  if (!imageUrl) return null;
  try {
    console.log(`  📷 Downloading: ${imageUrl}`);
    const res = await fetch(imageUrl, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`Image fetch ${res.status}`);

    const contentType = res.headers.get('content-type') || 'image/webp';
    const buffer = Buffer.from(await res.arrayBuffer());

    let ext = 'webp';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
    else if (contentType.includes('png')) ext = 'png';
    else {
      const urlExt = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(urlExt)) ext = urlExt;
    }

    const fileName = generateFileName(ext);
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    }));

    console.log(`  ✅ Uploaded → /api/media/${fileName}`);
    return `/api/media/${fileName}`;
  } catch (err) {
    console.error(`  ❌ Image upload failed: ${err.message}`);
    return null;
  }
}

/**
 * Lấy link tải từ nút xanh lá (elementor-button-success)
 * KHÔNG lấy nút Telegram (elementor-button-info)
 */
function extractDownloadLink($) {
  // Selector chính xác: nút xanh lá của Elementor
  let link = null;

  // Tìm container success (xanh lá) rồi lấy href của <a> bên trong
  $('[class*="elementor-button-success"] a[href], a.elementor-button[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const parentClass = $(el).closest('[class*="elementor-button-"]').attr('class') || '';
    
    // Bỏ qua nếu là nút info (telegram)
    if (parentClass.includes('elementor-button-info')) return;
    // Bỏ qua telegram và link nội bộ gamekot
    if (href.includes('t.me') || href.includes('telegram') || href.includes('gamekot.pro')) return;
    // Bỏ qua empty / relative links
    if (!href || href.startsWith('/')) return;

    if (!link) link = href;
  });

  if (link) return link;

  // Fallback: tìm thẳng <a class="elementor-button ..."> có href ngoài domain
  $('a.elementor-button[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('/')) return;
    if (href.includes('t.me') || href.includes('telegram') || href.includes('gamekot.pro')) return;
    if (!link) link = href;
  });

  return link;
}

/**
 * Tự động phân loại tag dựa trên text (tiêu đề + nội dung)
 * Hỗ trợ các tags: Faces, Kits, Gameplay, Đồ họa, Cơ chế game
 */
function autoCategorizeTags(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  const tags = [];
  
  // Rule 1: Faces
  if (text.includes('face') || text.includes('hair') || text.includes('mặt') || text.includes('tóc') || text.includes('head')) {
    tags.push('Faces');
  }
  
  // Rule 2: Kits
  if (text.includes('kit') || text.includes('shirt') || text.includes('áo') || text.includes('trang phục') || text.includes('uniform') || text.includes('sponser')) {
    tags.push('Kits');
  }
  
  // Rule 3: Gameplay
  if (text.includes('gameplay') || text.includes('lối chơi') || text.includes('cách chơi') || text.includes('physics')) {
    tags.push('Gameplay');
  }
  
  // Rule 4: Đồ họa
  if (text.includes('graphic') || text.includes('texture') || text.includes('visual') || text.includes('đồ họa') || text.includes('menu') || text.includes('sân cỏ') || text.includes('pitch') || text.includes('boot') || text.includes('glove') || text.includes('tv logo') || text.includes('scoreboard') || text.includes('tatu') || text.includes('tattoo')) {
    tags.push('Đồ họa');
  }
  
  // Rule 5: Cơ chế game
  if (text.includes('career') || text.includes('manager') || text.includes('transfer') || text.includes('squad') || text.includes('unlock') || text.includes('chuyển nhượng') || text.includes('cơ chế') || text.includes('edit player') || text.includes('database')) {
    tags.push('Cơ chế game');
  }
  
  // Mặc định
  if (tags.length === 0) {
    tags.push('Cơ chế game'); // hoặc Đồ họa tùy bạn
  }
  
  return tags;
}

/**
 * Cào trang category, chỉ lấy link bài viết FC 26 mod
 * Lọc bỏ các trang hệ thống (wishlist, payment, v.v.)
 */
async function scrapeCategory(maxPages = 3) {
  const postLinks = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${BASE_URL}/category/fc26/` : `${BASE_URL}/category/fc26/page/${page}/`;
    console.log(`\n📋 Page ${page}: ${url}`);

    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) { console.log(`  Stopped (${res.status})`); break; }

    const html = await res.text();
    const $ = cheerio.load(html);
    let found = 0;

    // Link bài viết trên gamekot có text="" và class="" — phải dùng href pattern
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.startsWith(BASE_URL + '/')) return;
      // Bỏ qua comment anchors
      if (href.includes('#')) return;
      // Bỏ qua các đường link hệ thống
      if (/\/(category|page|author|tag|product-category|shop|wp-|wishlist|my-account|faqs|about-us|contact-us|send-us-mod|privacy-policy|refund_returns|cart|checkout|payment-page|kak-pokypat|reshenie-problem)/i.test(href)) return;
      // Bỏ qua trang add-to-cart
      if (href.includes('add-to-cart') || href.includes('add_to_wishlist')) return;

      const slug = href.replace(BASE_URL + '/', '').replace(/\/$/, '');
      // Bỏ qua slug hệ thống
      if (BLOCKED_SLUGS.some(b => slug === b)) return;
      // Phải là slug bài viết: chứa chữ thường và dấu gạch ngang
      if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(slug)) return;

      if (!postLinks.includes(href)) {
        postLinks.push(href);
        found++;
      }
    });

    console.log(`  Found ${found} posts`);
    if (found === 0) break;
    await delay(1500);
  }

  console.log(`\n📦 Total: ${postLinks.length} posts`);
  return [...new Set(postLinks)];
}

/**
 * Cào 1 bài viết
 */
async function scrapePost(url) {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`Fetch ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // ── TIÊU ĐỀ ──
    let title = $('h1.entry-title, h1').first().text().trim()
      || $('meta[property="og:title"]').attr('content')?.replace('- Gamekot.Pro', '').trim()
      || '';

    // ── THUMBNAIL ──
    const rawImageUrl = $('meta[property="og:image"]').attr('content')
      || $('article img').first().attr('src')
      || null;

    // ── NỘI DUNG VÀ HÌNH ẢNH ──
    const contentParts = [];
    $('.entry-content p, .elementor-widget-text-editor p, .entry-content img, article img').each((_, el) => {
      if ($(el).closest('.elementor-button, .sharedaddy, .comment-respond').length) return;
      
      if (el.tagName.toLowerCase() === 'img') {
        let src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.startsWith('/')) src = BASE_URL + src;
        if (src && !src.includes('avatar') && !src.includes('icon') && !src.includes('logo')) {
           contentParts.push({ type: 'img', src: src });
        }
      } else {
        const text = $(el).text().trim();
        if (text && text.length > 5 && !text.includes('No Comments')) {
           contentParts.push({ type: 'text', text: text });
        }
      }
    });

    // Nếu có thumbnail, loại bỏ thumbnail ra khỏi phần content (tránh trùng ảnh đầu)
    if (rawImageUrl && contentParts[0] && contentParts[0].type === 'img' && contentParts[0].src === rawImageUrl) {
        contentParts.shift();
    }

    // ── DOWNLOAD LINK (nút xanh lá) ──
    const downloadLink = extractDownloadLink($);

    // ── SLUG ──
    const slug = url.replace(BASE_URL + '/', '').replace(/\/$/, '');

    return { title, rawImageUrl, contentParts, downloadLink, slug };
  } catch (err) {
    console.error(`  ❌ scrapePost error: ${err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  const postLinks = await scrapeCategory(3);  // Đổi số trang ở đây

  let successCount = 0, skipCount = 0, failCount = 0;

  for (const link of postLinks) {
    console.log(`\n🔍 ${link}`);

    // Kiểm tra tồn tại
    const slug = link.replace(BASE_URL + '/', '').replace(/\/$/, '');

    // Bỏ qua slug hệ thống (phòng thủ thêm)
    if (BLOCKED_SLUGS.some(b => slug === b || slug.startsWith(b + '/'))) {
      console.log(`  ⏭️  System page, skip.`);
      skipCount++;
      continue;
    }

    const { data: existing } = await supabase.from('mods').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      console.log(`  ⏭️  Already exists.`);
      skipCount++;
      await delay(300);
      continue;
    }

    const post = await scrapePost(link);
    if (!post) { failCount++; continue; }

    // Bắt buộc phải có link tải hợp lệ
    if (!post.downloadLink) {
      console.log(`  ⚠️  No valid download link, skip.`);
      failCount++;
      await delay(800);
      continue;
    }

    // ── Dịch tên: nếu có Cyrillic → dịch sang tiếng Anh
    let finalTitle = post.title;
    if (hasCyrillic(post.title)) {
      console.log(`  🌐 Translating title to English...`);
      finalTitle = await translate(post.title, 'en');
      await delay(400);
    }

    console.log(`  📝 Title : ${finalTitle}`);
    console.log(`  🔗 DL    : ${post.downloadLink}`);

    // ── Upload thumbnail lên R2
    const thumbnailPath = await uploadImageFromUrl(post.rawImageUrl);

    // ── Dịch mô tả sang tiếng Việt và Lắp ráp HTML
    console.log(`  🌐 Translating description to Vietnamese...`);
    const textsToTranslate = post.contentParts.filter(p => p.type === 'text').map(p => p.text);
    const combinedText = textsToTranslate.join('\n\n');
    
    // Dịch toàn bộ văn bản 1 lần
    const translatedCombined = await translate(combinedText.substring(0, 3000), 'vi');
    const translatedParagraphs = translatedCombined.split('\n\n');

    // Lắp ráp lại HTML (bao gồm ảnh và p)
    let finalHtml = '';
    let textIndex = 0;
    for (const part of post.contentParts) {
       if (part.type === 'img') {
           finalHtml += `<img src="${part.src}" class="w-full h-auto rounded-lg my-4 shadow-lg" loading="lazy" />\n`;
       } else if (part.type === 'text') {
           const translatedP = translatedParagraphs[textIndex] || part.text;
           finalHtml += `<p class="my-3 text-gray-200 leading-relaxed">${translatedP}</p>\n`;
           textIndex++;
       }
    }
    
    // Đảm bảo không bị rỗng
    if (!finalHtml.trim()) {
       finalHtml = `<p class="my-3 text-gray-200">Không có mô tả chi tiết cho bản mod này.</p>`;
    }

    // Tóm tắt bằng AI (Dùng text thô đã dịch)
    console.log(`  🤖 AI is summarizing the description...`);
    const descShort = await aiSummarize(translatedCombined);
    await delay(400);

    // Ngày định dạng DD/MM/YYYY
    const now = new Date();
    const updatedAt = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

    // Tự động phân loại tags
    const generatedTags = autoCategorizeTags(finalTitle, translatedCombined);
    const mainCategory = generatedTags[0] || 'Cơ chế game';
    console.log(`  🏷️  Tags : ${generatedTags.join(', ')}`);

    const modData = {
      slug: post.slug,
      name: finalTitle,
      author: 'FIFA MODS',
      category: mainCategory,
      version: '1.0',
      updated_at: updatedAt,
      description: descShort,    // Tiếng Việt ngắn
      long_description: finalHtml,// Tiếng Việt dài chứa cả ảnh <img /> và <p>
      thumbnail: thumbnailPath || '',
      thumbnail_orientation: 'landscape', // Luôn set landscape
      download_url: post.downloadLink,
      featured: false,
      tags: generatedTags,
    };

    const { error } = await supabase.from('mods').insert([modData]);
    if (error) {
      console.error(`  ❌ DB error: ${error.message}`);
      failCount++;
    } else {
      console.log(`  ✅ Saved!`);
      successCount++;
    }

    await delay(2500);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Success : ${successCount}`);
  console.log(`⏭️  Skipped : ${skipCount}`);
  console.log(`❌ Failed  : ${failCount}`);
  console.log(`${'─'.repeat(50)}`);
}

main().catch(console.error);
