# Hướng dẫn Việt hóa EA Sports FC 26 & Live Editor

Việc Việt hóa tựa game EA Sports FC 26 có thể chia làm 2 phần chính: Việt hóa giao diện công cụ **FCLiveEditor** (nếu bạn sử dụng công cụ này) và Việt hóa **toàn bộ nội dung game chính thức**.

---

## 1. Việt hóa công cụ Live Editor (Giao diện Mod)

Nếu bạn muốn Việt hóa giao diện của công cụ Live Editor, bạn có thể thực hiện thông qua tệp `localize.json`.

- **Vị trí tệp gốc:** `loc\eng_us\localize.json` (trong thư mục cài đặt game FC 26).
- **Cấu trúc tệp:** Một tệp JSON lớn chứa các chuỗi giao diện tiếng Anh (`translations` key-value).

### Cách thực hiện tự động bằng AI (Sử dụng Node.js & DeepSeek)

Vì bạn đã có sẵn mã nguồn Next.js/Scraper với cấu hình API DeepSeek trong thư mục `c:\dungdibinhluan`, bạn có thể tạo một script nhỏ để dịch tự động toàn bộ tệp `localize.json` này sang tiếng Việt.

Dưới đây là mã nguồn gợi ý để dịch tệp `localize.json`:

```javascript
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const sourcePath = `C:\\Program Files (x86)\\Steam\\steamapps\\common\\FC 26\\loc\\eng_us\\localize.json`;
const targetPath = `C:\\Program Files (x86)\\Steam\\steamapps\\common\\FC 26\\loc\\eng_us\\localize_vi.json`;

async function translateChunk(translationsChunk) {
  const prompt = `Bạn là chuyên gia dịch thuật game bóng đá. Hãy dịch toàn bộ các chuỗi giá trị (values) trong JSON sau sang tiếng Việt tự nhiên, giữ nguyên các placeholders như {name}, {avg}, {count}, v.v.
Trả về chính xác định dạng JSON.

JSON:
${JSON.stringify(translationsChunk, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    
    let text = response.choices[0].message.content.trim();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Lỗi khi dịch chunk:', error.message);
    return translationsChunk; // Trả về gốc nếu lỗi
  }
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error('Không tìm thấy tệp gốc!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const trans = data.translations;
  const keys = Object.keys(trans);
  const translatedTrans = {};

  // Chia nhỏ thành từng chunk 30 keys để tránh quá tải token
  const chunkSize = 30;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunkKeys = keys.slice(i, i + chunkSize);
    const chunkObj = {};
    chunkKeys.forEach(k => chunkObj[k] = trans[k]);

    console.log(`Đang dịch từ dòng ${i} đến ${i + chunkKeys.length}...`);
    const translatedChunk = await translateChunk(chunkObj);
    Object.assign(translatedTrans, translatedChunk);

    // Chờ 1 giây giữa các lượt gọi API
    await new Promise(res => setTimeout(res, 1000));
  }

  data.translations = translatedTrans;
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 4), 'utf8');
  console.log('✅ Đã tạo tệp Việt hóa tại:', targetPath);
}

main().catch(console.error);
```

> [!NOTE]
> Sau khi dịch xong, bạn có thể sao lưu tệp gốc `localize.json` và thay thế nó bằng tệp đã được Việt hóa để áp dụng ngay vào Live Editor.

---

## 2. Việt hóa toàn bộ nội dung trong game (EA FC 26)

Đối với các chuỗi ngôn ngữ chính của game (tên cầu thủ, sự nghiệp, menu, chế độ chơi), EA FC 26 lưu trữ trong các tệp nén của công cụ **Frostbite**.

### Các bước thực hiện:

1. **Sử dụng FIFA Editor Tool / Frosty Editor:**
   - Bạn cần tải phiên bản mới nhất của **FIFA Editor Tool** hoặc **Frosty Editor** (cộng đồng modding game FC 26).
2. **Trích xuất (Extract) tệp ngôn ngữ:**
   - Mở game bằng công cụ Editor.
   - Tìm kiếm các tệp có định dạng `.db` hoặc các tệp ngôn ngữ chunk trong thư mục trò chơi. Thông thường tệp ngôn ngữ chính sẽ chứa từ khóa `eng_us` hoặc `swe_se` tùy theo gói ngôn ngữ cài đặt.
3. **Dịch nội dung:**
   - Sau khi xuất tệp strings ra định dạng văn bản (TXT, CSV hoặc JSON), bạn có thể dùng AI/DeepSeek hoặc Google Translate để dịch sang tiếng Việt.
4. **Nhập lại (Import) & Đóng gói:**
   - Đưa tệp đã dịch ngược lại vào Editor.
   - Xuất (Export) bản mod dưới định dạng `.fbmod` (Frosty Mod).
5. **Kích hoạt Mod:**
   - Người chơi sử dụng **Frosty Mod Manager** để chạy game cùng với bản mod Việt hóa vừa tạo.

---

> [!TIP]
> Do cấu trúc tệp của EA FC 26 phức tạp hơn so với các phiên bản trước do hệ thống **EA Anti-Cheat (EAAC)**, khi thử nghiệm hoặc mod game, hãy đảm bảo rằng bạn sử dụng công cụ bypass chống gian lận phù hợp (chẳng hạn như bypass đi kèm khi chơi chế độ offline).
