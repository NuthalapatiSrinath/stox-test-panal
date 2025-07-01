import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";

const textractClient = new TextractClient({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});
export const extractPanFromTextract = async (bucket, key) => {
  const command = new AnalyzeDocumentCommand({
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
    FeatureTypes: ["FORMS"],
  });
  const response = await textractClient.send(command);
  const lines = response.Blocks
    .filter((b) => b.BlockType === "LINE" && b.Text)
    .map((b) => b.Text.trim());
  return parsePanData(lines);
};
const parsePanData = (lines) => {
  let fullName = "";
  let fatherName = "";
  let panNumber = "";
  let dob = "";
  const garbageWords = ["GOVT", "INDIA", "CARD", "SIGNATURE", "ACCOUNT", "PERMANENT"];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const panMatch = line.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    if (panMatch && panMatch[0].length === 10 && !panNumber) {
      panNumber = panMatch[0];
    }
    const dobMatch = line.match(/\d{2}[-/]\d{2}[-/]\d{4}/);
    if (dobMatch && !dob) dob = dobMatch[0];
    if (!fullName && /name/i.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      fullName = nextLine
        .split(" ")
        .filter((word) => !garbageWords.includes(word.toUpperCase()))
        .join(" ");
    }
    if (!fatherName && /father/i.test(line) && i + 1 < lines.length) {
      fatherName = lines[i + 1].trim();
    }
  }
  return { fullName, fatherName, panNumber, dob };
};