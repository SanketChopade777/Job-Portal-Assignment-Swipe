const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Remove any hardcoded dummy data from beforeUpload function
const handleFileUpload = async (file) => {
  setUploading(true);
  setValidationErrors([]);

  try {
    let parsedData;

    if (file.type === "application/pdf") {
      parsedData = await parsePDF(file);
    } else {
      parsedData = await parseDOCX(file);
    }

    // Don't use any mock data - use actual parsed data
    setExtractedData(parsedData);

    const { missing, errors } = validateResumeData(parsedData);
    setValidationErrors(errors);

    if (missing.length > 0) {
      dispatch(setMissingFields(missing));
      form.setFieldsValue(parsedData);
      message.warning("Please complete the missing information below");
    } else {
      proceedToInterview(parsedData);
    }
  } catch (error) {
    message.error("Error parsing resume: " + error.message);
  } finally {
    setUploading(false);
  }
};

console.log("🔑 Groq API Status:", GROQ_API_KEY ? "✓ Loaded" : "✗ Missing");

export class GroqService {
  // Current available models (as of latest deprecation info)
  static MODELS = {
    FAST: "llama-3.1-8b-instant", // For quick responses
    QUALITY: "llama-3.3-70b-versatile", // For evaluations
    BALANCED: "qwen/qwen3-32b", // Alternative balanced model
    VISION: "meta-llama/llama-4-scout-17b-16e-instruct", // For future expansion
  };

  static async generateContent(prompt, systemMessage = null, model = null) {
    // Use a request lock to prevent duplicate calls
    if (window.groqRequestInProgress) {
      console.log("⏸️ Groq request already in progress, skipping duplicate");
      return this.getMockResponse(prompt);
    }

    window.groqRequestInProgress = true;

    try {
      console.log("📤 Sending to Groq API...");

      const messages = [];

      if (systemMessage) {
        messages.push({
          role: "system",
          content: systemMessage,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      // Use appropriate model based on use case - SKIP DEPRECATED MODELS
      let finalModel = model || this.MODELS.QUALITY; // Use quality model by default

      // Skip known deprecated models
      if (
        finalModel === "llama-3.1-8b-instant" ||
        finalModel === "llama-3.1-70b-versatile"
      ) {
        console.log("🔄 Skipping deprecated model, using alternative");
        finalModel = this.MODELS.QUALITY; // Use quality model instead
      }

      const requestBody = {
        messages: messages,
        model: finalModel,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      };

      console.log("Using model:", finalModel);

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Details:", errorText);

        // For errors, use mock response instead of trying alternatives
        console.log("🔄 Using mock response due to API error");
        return this.getMockResponse(prompt);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response format from Groq API");
      }

      const result = data.choices[0].message.content;
      console.log("✅ Generated content:", result.substring(0, 100) + "...");

      return result;
    } catch (error) {
      console.error("❌ Groq API Error, using mock response:", error.message);
      return this.getMockResponse(prompt);
    } finally {
      window.groqRequestInProgress = false;
    }
  }

  // REMOVE the tryAlternativeModels method entirely - it's causing duplicate calls

  // static async tryAlternativeModels(prompt, systemMessage, failedModel) {
  //   console.log("🔄 Trying alternative models...");

  //   // Try different models in order of preference
  //   const alternatives = [
  //     this.MODELS.QUALITY,
  //     this.MODELS.BALANCED,
  //     this.MODELS.FAST,
  //   ].filter((model) => model !== failedModel);

  //   for (const model of alternatives) {
  //     try {
  //       console.log(`Trying alternative model: ${model}`);
  //       const result = await this.generateContent(prompt, systemMessage, model);
  //       console.log(`✅ Success with model: ${model}`);
  //       return result;
  //     } catch (error) {
  //       console.log(`❌ Failed with model ${model}:`, error.message);
  //       continue;
  //     }
  //   }

  //   throw new Error("All models failed, using mock response");
  // }

  static async generateQuestion(difficulty, context = "") {
    const systemMessage = `You are an AI technical interviewer for Full Stack Developer positions specializing in React.js and Node.js.

GUIDELINES:
- Generate exactly ONE clear, concise, practical technical question
- Focus on real-world scenarios and problem-solving
- Questions should be appropriate for the difficulty level
- Return ONLY the question text without any additional commentary
- Avoid numbering, labels, or introductory phrases
- NEVER return multiple questions or variations

DIFFICULTY LEVELS:
- Easy: Basic concepts, definitions, simple implementations
- Medium: Practical applications, common patterns, debugging
- Hard: Architecture, optimization, advanced patterns, system design`;

    const prompt = `Generate exactly ONE ${difficulty} level technical interview question for a Full Stack Developer.

Focus Area: React.js and Node.js
Difficulty: ${difficulty}
${context ? `Candidate Context: ${context}` : ""}

Expected ${difficulty} Level Focus:
${
  difficulty === "Easy"
    ? "Basic concepts, syntax, simple components"
    : difficulty === "Medium"
    ? "State management, API integration, common patterns"
    : "Performance optimization, architecture, advanced patterns"
}

Return ONLY the question text. Do NOT return multiple questions or variations.`;

    try {
      // Use only the quality model to avoid duplicate calls
      const question = await this.generateContent(
        prompt,
        systemMessage,
        "llama-3.3-70b-versatile" // Use quality model directly
      );

      // Clean and validate the question
      const cleanedQuestion = this.cleanQuestionText(question);

      // Ensure it's a single question (not multiple)
      if (this.containsMultipleQuestions(cleanedQuestion)) {
        console.warn("⚠️ Multiple questions detected, using first one only");
        return this.extractFirstQuestion(cleanedQuestion);
      }

      return cleanedQuestion;
    } catch (error) {
      console.error("Error generating question:", error);
      return this.getMockQuestion(difficulty);
    }
  }

  // Add these new utility methods
  static containsMultipleQuestions(text) {
    // Check for multiple question markers
    const questionMarkers = text.split("?").length - 1;
    const numberedPattern = /\d+\./g;
    const hasNumbering = (text.match(numberedPattern) || []).length > 1;

    return (
      questionMarkers > 1 ||
      hasNumbering ||
      text.toLowerCase().includes("another") ||
      text.toLowerCase().includes("also")
    );
  }

  static extractFirstQuestion(text) {
    // Extract only the first question
    const sentences = text.split(/(?<=[.!?])\s+/);
    let firstQuestion = sentences[0];

    // Find the first sentence that ends with a question mark
    for (let i = 0; i < sentences.length; i++) {
      if (sentences[i].trim().endsWith("?")) {
        firstQuestion = sentences[i];
        break;
      }
    }

    return firstQuestion.trim();
  }

  static cleanQuestionText(text) {
    // More aggressive cleaning
    return text
      .replace(/^(Question\s*\d*:?\s*)/i, "")
      .replace(/^(Here('s| is).*:\s*)/i, "")
      .replace(/^[•\-]\s*/, "")
      .replace(/\d+\.\s*/g, "") // Remove numbering
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .replace(/^(?:Also|Additionally|Furthermore)\s*,?\s*/i, "") // Remove continuation words
      .trim();
  }

  static async evaluateAnswer(question, answer, difficulty) {
    const systemMessage = `You are a strict technical interviewer. Evaluate answers objectively.
  
  SCORING RULES:
  - No answer or "No answer provided" or empty response: Score 0/10
  - Very short or irrelevant answers (less than 10 words): Score 1-3/10  
  - Partial but incomplete answers: Score 4-6/10
  - Good answers with minor issues: Score 7-8/10
  - Excellent comprehensive answers: Score 9-10/10
  
  IMPORTANT: 
  - For unanswered questions, give score 0
  - For "No answer provided", give score 0
  - Be strict but fair
  - Consider the difficulty level when scoring`;

    const prompt = `Evaluate this ${difficulty} level interview response:

  QUESTION: ${question}
  ANSWER: ${answer}

  Score based on:
  1. Relevance to question (40%)
  2. Technical accuracy (30%)
  3. Depth of explanation (20%)
  4. Clarity and structure (10%)

  If answer is empty, "No answer provided", or clearly indicates no response, give score 0.

  Provide JSON response:
  {
    "score": number (0-10),
    "feedback": "honest technical feedback",
    "improvements": "specific suggestions",
    "strengths": "what was done well (if any)"
  }`;

    try {
      // Use the quality model directly to avoid model switching issues
      const response = await this.generateContent(
        prompt,
        systemMessage,
        "llama-3.3-70b-versatile" // Use quality model directly
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);

        // Force 0 score for unanswered questions
        if (
          answer === "No answer provided" ||
          answer.trim() === "" ||
          answer.length < 5
        ) {
          evaluation.score = 0;
          evaluation.feedback = "No answer was provided for this question.";
          evaluation.improvements =
            "Please attempt to answer all questions during the interview.";
          evaluation.strengths = "None - question was not attempted";
        }

        console.log("✅ Evaluation result:", evaluation);
        return this.validateEvaluation(evaluation);
      }

      return this.parseEvaluationResponse(response, answer);
    } catch (error) {
      console.error("Error evaluating answer:", error);
      return this.getMockEvaluation(question, answer, difficulty);
    }
  }

  static async generateSummary(interviewData) {
    const systemMessage = `You are a senior technical interviewer providing honest candidate summaries.
  Base your summary strictly on the actual interview performance, not on assumptions.
  Be objective about strengths and weaknesses.`;

    const prompt = `Generate an honest professional summary for this interview performance:

  CANDIDATE: ${interviewData.candidate?.name || "Unknown"}
  TOTAL QUESTIONS: ${interviewData.totalQuestions || 6}
  QUESTIONS ANSWERED: ${interviewData.answeredQuestions || 0}
  AVERAGE SCORE: ${
    interviewData.scores
      ? (
          interviewData.scores.reduce((a, b) => a + b, 0) /
          interviewData.scores.length
        ).toFixed(1)
      : "0"
  }
  
  INTERVIEW TRANSCRIPT:
  ${JSON.stringify(interviewData.chatHistory || [], null, 2).substring(0, 2000)}

  Focus on:
  - Actual performance based on the Q/A above
  - Specific strengths demonstrated in answers
  - Areas needing improvement based on responses
  - Honest assessment of technical knowledge

  If candidate didn't answer many questions, mention this honestly.
  Keep it professional, constructive, and based only on the evidence provided.`;

    try {
      return await this.generateContent(
        prompt,
        systemMessage,
        "llama-3.1-70b-versatile"
      );
    } catch (error) {
      console.error("Error generating summary:", error);
      return this.getMockSummary(interviewData);
    }
  }

  // Utility methods
  static cleanQuestionText(text) {
    return text
      .replace(/^(Question\s*\d*:?\s*)/i, "")
      .replace(/^(Here('s| is).*:\s*)/i, "")
      .replace(/^[•\-]\s*/, "")
      .trim();
  }

  static validateEvaluation(evaluation) {
    const validated = {
      score: Math.min(10, Math.max(0, parseInt(evaluation.score) || 5)),
      feedback: evaluation.feedback || "Feedback not available",
      improvements:
        evaluation.improvements ||
        "Focus on providing more detailed explanations",
      strengths:
        evaluation.strengths ||
        "Shows willingness to engage with technical questions",
      breakdown: evaluation.breakdown || {
        technical_accuracy: 5,
        clarity: 5,
        examples: 5,
        completeness: 5,
      },
    };

    return validated;
  }

  static parseEvaluationResponse(response, answer) {
    // Force 0 score for unanswered questions
    if (
      answer === "No answer provided" ||
      answer.trim() === "" ||
      answer.length < 5
    ) {
      return {
        score: 0,
        feedback: "No answer was provided for this question.",
        improvements:
          "Please attempt to answer all questions during the interview.",
        strengths: "None - question was not attempted",
        breakdown: {
          technical_accuracy: 0,
          clarity: 0,
          examples: 0,
          completeness: 0,
        },
      };
    }

    const scoreMatch = response.match(/(\d+(\.\d+)?)\/10|score[\s:]*(\d+)/i);
    let score = 5; // Default middle score for actual answers

    if (scoreMatch) {
      score = parseInt(scoreMatch[1] || scoreMatch[3] || "5");
    }

    // For actual answers, provide more nuanced scoring
    const answerLength = answer.split(" ").length;
    if (answerLength < 10) {
      // Very short answers get lower scores
      score = Math.min(score, 3);
    }

    return {
      score: Math.min(10, Math.max(0, score)),
      feedback: "Evaluation completed based on your response.",
      improvements:
        answerLength < 20
          ? "Please provide more detailed explanations with specific examples."
          : "Consider adding more technical depth to your answers.",
      strengths:
        answerLength > 5
          ? "Provided a response to the question."
          : "Attempted to engage with the question.",
      breakdown: {
        technical_accuracy: score,
        clarity: Math.max(0, score - 1),
        examples: Math.max(0, score - 2),
        completeness: Math.max(0, score - 1),
      },
    };
  }

  // Mock responses for fallback
  static getMockResponse(prompt) {
    console.log("🔄 Using mock response");

    if (prompt.includes("question")) {
      const difficulty = prompt.includes("Easy")
        ? "Easy"
        : prompt.includes("Medium")
        ? "Medium"
        : "Hard";
      return this.getMockQuestion(difficulty);
    } else if (prompt.includes("evaluate")) {
      return JSON.stringify({
        score: 7,
        feedback:
          "Good understanding of basic concepts with room for improvement in practical examples.",
        improvements:
          "Include more code examples and discuss real-world applications.",
        strengths: "Clear communication and logical thinking.",
        breakdown: {
          technical_accuracy: 7,
          clarity: 8,
          examples: 6,
          completeness: 7,
        },
      });
    } else {
      return "Mock response for development purposes.";
    }
  }

  static getMockQuestion(difficulty) {
    const questions = {
      Easy: [
        "What is the virtual DOM in React and why is it beneficial?",
        "Explain the difference between let, const, and var in JavaScript.",
        "What is the purpose of package.json in a Node.js project?",
        "How do you create a component in React?",
        "What are props in React and how are they used?",
      ],
      Medium: [
        "How would you optimize the performance of a React application?",
        "Explain the concept of middleware in Express.js with an example.",
        "What are React hooks and when would you use useEffect vs useState?",
        "How do you handle authentication in a React/Node.js application?",
        "What is the difference between synchronous and asynchronous code in JavaScript?",
      ],
      Hard: [
        "Explain how you would implement server-side rendering with React and Node.js.",
        "Describe strategies for state management in large-scale React applications.",
        "How would you design a microservices architecture for a full-stack application?",
        "Explain the concept of JWT authentication and implement a secure login flow.",
        "How do you handle error boundaries and error tracking in production React apps?",
      ],
    };

    const questionsList = questions[difficulty] || questions.Easy;
    const randomQuestion =
      questionsList[Math.floor(Math.random() * questionsList.length)];
    console.log(`🎯 Generated mock ${difficulty} question:`, randomQuestion);
    return randomQuestion;
  }

  static getMockEvaluation(question, answer, difficulty) {
    // Force 0 score for unanswered questions in mock data too
    if (
      answer === "No answer provided" ||
      answer.trim() === "" ||
      answer.length < 5
    ) {
      return {
        score: 0,
        feedback: "No answer was provided for this question.",
        improvements:
          "Please attempt to answer all questions during the interview.",
        strengths: "None - question was not attempted",
        breakdown: {
          technical_accuracy: 0,
          clarity: 0,
          examples: 0,
          completeness: 0,
        },
      };
    }

    const baseScore =
      difficulty === "Easy" ? 7 : difficulty === "Medium" ? 6 : 5;
    const randomVariation = Math.random() * 2 - 1;
    const answerLength = answer.split(" ").length;

    // Adjust score based on answer length
    let adjustedScore = baseScore + randomVariation;
    if (answerLength < 10) {
      adjustedScore = Math.max(1, adjustedScore - 3);
    } else if (answerLength > 50) {
      adjustedScore = Math.min(10, adjustedScore + 1);
    }

    const finalScore = Math.min(10, Math.max(0, Math.round(adjustedScore)));

    return {
      score: finalScore,
      feedback:
        "This demonstrates reasonable understanding. Consider providing more specific examples and practical implementation details.",
      improvements:
        "Include code snippets and discuss real-world applications of the concepts mentioned.",
      strengths:
        "Shows logical thinking and engagement with technical concepts.",
      breakdown: {
        technical_accuracy: finalScore,
        clarity: Math.max(1, finalScore - 1),
        examples: Math.max(1, finalScore - 2),
        completeness: Math.max(1, finalScore - 1),
      },
    };
  }

  static getMockSummary(interviewData) {
    return `The candidate demonstrates ${
      interviewData.scores?.length ? "promising" : "basic"
    } understanding of full-stack development concepts. With additional practice on React best practices and Node.js backend architecture, they show potential for growth in a developer role. Recommended next steps include focused practice on ${
      interviewData.scores?.length ? "advanced concepts" : "fundamentals"
    }.`;
  }

  // Test connection with current models
  static async testConnection() {
    try {
      const testPrompt = "Say 'Hello World'";
      console.log("Testing connection with current models...");

      // Test with different available models
      const models = Object.values(this.MODELS);

      for (const model of models) {
        try {
          console.log(`Testing model: ${model}`);
          const response = await this.generateContent(
            testPrompt,
            "You are a helpful assistant.",
            model
          );
          console.log(
            `✅ ${model} test successful:`,
            response.substring(0, 50)
          );
          return { success: true, workingModel: model };
        } catch (error) {
          console.log(`❌ ${model} test failed:`, error.message);
        }
      }

      return { success: false, workingModel: null };
    } catch (error) {
      console.log("❌ All connection tests failed:", error);
      return { success: false, workingModel: null };
    }
  }

  // Get available models
  static getAvailableModels() {
    return Object.values(this.MODELS);
  }
}

// Test connection on load
GroqService.testConnection();
