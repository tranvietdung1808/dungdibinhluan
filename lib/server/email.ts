import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendCodeEmail(to: string, code: string, productName: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"DungDiBinhLuan" <${process.env.EMAIL_USER}>`,
      to,
      subject: `[DungDiBinhLuan] Code kích hoạt ${productName}`,
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">
          <h1 style="color:#ce5a67;font-size:20px;text-align:center;letter-spacing:2px">DUNGDIBINHLUAN</h1>
          <p style="text-align:center;color:#888;font-size:12px">Cảm ơn bạn đã mua hàng!</p>
          <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
            <p style="color:#888;font-size:11px;margin:0 0 8px">SẢN PHẨM</p>
            <p style="font-size:16px;font-weight:bold;margin:0 0 16px">${productName}</p>
            <p style="color:#888;font-size:11px;margin:0 0 8px">CODE KÍCH HOẠT</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#ce5a67;margin:0;font-family:monospace">${code}</p>
          </div>
          <p style="font-size:11px;color:#666;text-align:center;margin:0 0 8px">Code có hiệu lực trong 24 giờ</p>
          <p style="font-size:11px;color:#666;text-align:center;margin:0">Vui lòng không chia sẻ code cho người khác</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
