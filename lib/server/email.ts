import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function supportSection() {
  return `
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:16px;margin:0 0 24px">
      <p style="color:#ce5a67;font-size:12px;font-weight:bold;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px">Thông tin hỗ trợ</p>
      <p style="margin:0 0 8px;font-size:11px;color:#aaa;line-height:1.6">
        Mọi vấn đề vui lòng liên hệ <a href="https://web.facebook.com/dungbinhluan/" style="color:#ce5a67;text-decoration:none">fanpage hỗ trợ</a>
      </p>
      <p style="margin:0 0 8px;font-size:11px;color:#888;line-height:1.6">
        Page sẽ trả lời trong vòng tối đa <strong style="color:#fff">6 tiếng</strong> (với những thời gian cao điểm) anh em vui lòng không spam để được hỗ trợ tốt nhất.
      </p>
      <p style="margin:0;font-size:11px;color:#888;line-height:1.6">
        Nếu sau 6 tiếng không có phản hồi, vui lòng ib Zalo: <strong style="color:#fff">0917742686</strong>
      </p>
    </div>
  `;
}

function codeSection(code: string, productName: string) {
  return `
    <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center">
      <p style="color:#888;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Sản phẩm</p>
      <p style="font-size:16px;font-weight:bold;margin:0 0 16px">${productName}</p>
      <p style="color:#888;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Code kích hoạt</p>
      <p style="font-size:30px;font-weight:bold;letter-spacing:4px;color:#ce5a67;margin:0;font-family:monospace">${code}</p>
    </div>
  `;
}

function downloadSection(productName: string, downloadUrl: string) {
  return `
    <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center">
      <p style="color:#888;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Sản phẩm</p>
      <p style="font-size:16px;font-weight:bold;margin:0 0 16px">${productName}</p>
      <p style="color:#ce5a67;font-size:13px;font-weight:bold;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Link tải</p>
      <a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#ce5a67;color:#fff;text-decoration:none;border-radius:10px;font-size:13px;font-weight:bold;letter-spacing:1px;margin:0 0 4px">TẢI NGAY</a>
      <p style="margin:8px 0 0;font-size:10px;color:#888">Nhắn tin admin để được hỗ trợ cài đặt</p>
    </div>
  `;
}

function stepsSection(codeEntryUrl: string, hasCode: boolean) {
  if (hasCode) {
    return `
      <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px">
        <p style="color:#ce5a67;font-size:13px;font-weight:bold;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px">Các bước sau khi nhận code</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:top;padding:0 10px 14px 0;width:24px">
              <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#ce5a6720;color:#ce5a67;border-radius:50%;font-size:12px;font-weight:bold;border:1px solid #ce5a6740">1</span>
            </td>
            <td style="vertical-align:top;padding:0 0 14px 0">
              <p style="margin:0;font-size:12px;color:#ddd">Nhập code tại trang</p>
              <a href="${codeEntryUrl}" style="display:inline-block;margin-top:4px;font-size:11px;color:#ce5a67;word-break:break-all">${codeEntryUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding:0 10px 14px 0">
              <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#ce5a6720;color:#ce5a67;border-radius:50%;font-size:12px;font-weight:bold;border:1px solid #ce5a6740">2</span>
            </td>
            <td style="vertical-align:top;padding:0 0 14px 0">
              <p style="margin:0;font-size:12px;color:#ddd">Tải và giải nén</p>
              <p style="margin:4px 0 0;font-size:11px;color:#888">Nếu có vấn đề thì liên hệ admin</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding:0 10px 0 0">
              <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#ce5a6720;color:#ce5a67;border-radius:50%;font-size:12px;font-weight:bold;border:1px solid #ce5a6740">3</span>
            </td>
            <td style="vertical-align:top;padding:0 0 0 0">
              <p style="margin:0;font-size:12px;color:#ddd">Liên hệ admin qua fanpage để add key và cài đặt</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  return `
    <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px">
      <p style="color:#ce5a67;font-size:13px;font-weight:bold;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px">Các bước tiếp theo</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="vertical-align:top;padding:0 10px 14px 0;width:24px">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#ce5a6720;color:#ce5a67;border-radius:50%;font-size:12px;font-weight:bold;border:1px solid #ce5a6740">1</span>
          </td>
          <td style="vertical-align:top;padding:0 0 14px 0">
            <p style="margin:0;font-size:12px;color:#ddd">Tải file từ link bên trên</p>
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top;padding:0 10px 14px 0">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#ce5a6720;color:#ce5a67;border-radius:50%;font-size:12px;font-weight:bold;border:1px solid #ce5a6740">2</span>
          </td>
          <td style="vertical-align:top;padding:0 0 14px 0">
            <p style="margin:0;font-size:12px;color:#ddd">Giải nén (nếu có vấn đề thì liên hệ admin)</p>
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top;padding:0 10px 0 0">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#ce5a6720;color:#ce5a67;border-radius:50%;font-size:12px;font-weight:bold;border:1px solid #ce5a6740">3</span>
          </td>
          <td style="vertical-align:top;padding:0 0 0 0">
            <p style="margin:0;font-size:12px;color:#ddd">Liên hệ admin qua fanpage để add key và cài đặt</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function footerSection(hasCode: boolean) {
  if (hasCode) {
    return `
      <p style="font-size:10px;color:#555;text-align:center;margin:0 0 6px">Code có hiệu lực trong 24 giờ</p>
      <p style="font-size:10px;color:#555;text-align:center;margin:0">Vui lòng không chia sẻ code cho người khác</p>
    `;
  }
  return `
    <p style="font-size:10px;color:#555;text-align:center;margin:0">Vui lòng không chia sẻ link tải cho người khác</p>
  `;
}

export async function sendCodeEmail(
  to: string,
  code: string,
  productName: string,
  codeEntryUrl: string,
  downloadUrl?: string
): Promise<boolean> {
  const hasCode = !downloadUrl;
  const mainSection = hasCode
    ? codeSection(code, productName)
    : downloadSection(productName, downloadUrl);

  try {
    await transporter.sendMail({
      from: `"DungDiBinhLuan" <${process.env.EMAIL_USER}>`,
      to,
      subject: `[DungDiBinhLuan] ${hasCode ? "Code kích hoạt" : "Link tải"} ${productName}`,
      html: `
        <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">

          <h1 style="color:#ce5a67;font-size:20px;text-align:center;letter-spacing:2px;margin:0 0 4px">DUNGDIBINHLUAN</h1>
          <p style="text-align:center;color:#888;font-size:12px;margin:0 0 24px">Cảm ơn bạn đã mua hàng!</p>

          ${mainSection}
          ${stepsSection(codeEntryUrl, hasCode)}
          ${supportSection()}
          ${footerSection(hasCode)}
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
