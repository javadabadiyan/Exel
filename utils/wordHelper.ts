
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export const saveAsWord = async (content: string, fileName: string) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: content.split('\n').map(line => 
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: line,
              rightToLeft: true,
              font: "Vazirmatn"
            })
          ]
        })
      ),
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.docx`;
  link.click();
};
