import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const parsePDF = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      let fullText = "";

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      const extractedData = extractInfoFromText(fullText);
      resolve(extractedData);
    } catch (error) {
      reject(new Error(`PDF parsing failed: ${error.message}`));
    }
  });
};

export const parseDOCX = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // For DOCX files, we'll use a simple text extraction approach
      // Since mammoth might also have issues, let's use a fallback
      if (typeof mammoth !== "undefined") {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const extractedData = extractInfoFromText(result.value);
        resolve(extractedData);
      } else {
        // Fallback: try to read as text directly
        const textDecoder = new TextDecoder("utf-8");
        const text = textDecoder.decode(arrayBuffer);
        const extractedData = extractInfoFromText(text);
        resolve(extractedData);
      }
    } catch (error) {
      reject(new Error(`DOCX parsing failed: ${error.message}`));
    }
  });
};

// Enhanced text extraction with better patterns
const extractInfoFromText = (text) => {
  console.log("Extracting from text:", text.substring(0, 200));

  // Enhanced email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : "";

  // Enhanced phone regex (international format support)
  const phoneRegex =
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Enhanced name extraction
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  let name = "";

  // Look for name in first few lines with common patterns
  for (let line of lines.slice(0, 8)) {
    const cleanLine = line.trim();

    // Skip lines that are clearly not names
    if (
      cleanLine.includes("@") ||
      cleanLine.includes("http") ||
      cleanLine.match(/\d{10,}/) ||
      cleanLine.length > 100
    ) {
      continue;
    }

    const words = cleanLine.split(/\s+/).filter((word) => word.length > 0);

    // Name typically has 2-4 words, all starting with capital letters
    if (words.length >= 2 && words.length <= 4) {
      const isLikelyName = words.every((word) => {
        return (
          word.length > 1 &&
          word[0] === word[0].toUpperCase() &&
          !word.match(/[0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
        );
      });

      if (isLikelyName) {
        name = cleanLine;
        break;
      }
    }
  }

  // If no name found with pattern matching, use first line as fallback
  if (!name && lines.length > 0) {
    const firstLine = lines[0].trim();
    if (
      firstLine.length > 0 &&
      firstLine.length < 50 &&
      !firstLine.includes("@")
    ) {
      name = firstLine;
    }
  }

  return {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    rawText: text.substring(0, 1000), // Store first 1000 chars
  };
};

export const validateResumeData = (resumeData) => {
  const missing = [];
  const errors = [];

  // Name validation
  if (!resumeData.name || resumeData.name.trim().length < 2) {
    missing.push("name");
    errors.push("Full name is required (minimum 2 characters)");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!resumeData.email || !emailRegex.test(resumeData.email)) {
    missing.push("email");
    errors.push("Valid email address is required");
  }

  // Phone validation (more flexible)
  const cleanPhone = resumeData.phone
    ? resumeData.phone.replace(/[\s\-\(\)\.]/g, "")
    : "";
  const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    missing.push("phone");
    errors.push("Valid phone number is required (8-15 digits)");
  }

  return { missing, errors };
};

// Simple text-based DOCX parser fallback
const simpleDOCXParser = async (arrayBuffer) => {
  try {
    // DOCX is a zip file containing XML, but we'll try simple text extraction
    const textDecoder = new TextDecoder("utf-8");
    const text = textDecoder.decode(arrayBuffer);

    // Try to extract text between common DOCX markers
    const textMatch = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (textMatch) {
      return textMatch
        .map((match) => match.replace(/<w:t[^>]*>|<\/w:t>/g, ""))
        .join(" ");
    }

    return text;
  } catch (error) {
    return "";
  }
};
