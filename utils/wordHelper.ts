
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

/**
 * ذخیره متن به صورت فایل Word با پشتیبانی از فارسی و راست‌به‌چپ
 */
export const saveAsWord = async (content: string, fileName: string) => {
  const sections = content.split('\n').map(line => 
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true, // فعال‌سازی قابلیت دوجهته
      spacing: {
        line: 360, // فاصله خطوط برای خوانایی بیشتر
      },
      children: [
        new TextRun({
          text: line,
          rightToLeft: true,
          font: "Vazirmatn",
          size: 24, // سایز ۱۲ پوینتی
        })
      ]
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // ۱ اینچ حاشیه
            right: 1440,
            bottom: 1440,
            left: 1440,
          }
        }
      },
      children: sections,
    }],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating Word file:", error);
    alert("خطا در تولید فایل Word");
  }
};
