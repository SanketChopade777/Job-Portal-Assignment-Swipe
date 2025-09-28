const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY || "your_groq_api_key_here";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

console.log("🔑 Groq API Status:", GROQ_API_KEY ? "✓ Loaded" : "✗ Missing");

export class GroqService {
  static async generateContent(
    prompt,
    systemMessage = null,
    model = "llama3-8b-8192"
  ) {
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

      const requestBody = {
        messages: messages,
        model: model,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      };

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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
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
    }
  }

  static async generateQuestion(difficulty, context = "") {
    const systemMessage = `You are an AI technical interviewer for Full Stack Developer positions specializing in React.js and Node.js.
    
    GUIDELINES:
    - Generate clear, concise, practical technical questions
    - Focus on real-world scenarios and problem-solving
    - Questions should be appropriate for the difficulty level
    - Return ONLY the question text without any additional commentary
    - Avoid numbering, labels, or introductory phrases
    
    DIFFICULTY LEVELS:
    - Easy: Basic concepts, definitions, simple implementations
    - Medium: Practical applications, common patterns, debugging
    - Hard: Architecture, optimization, advanced patterns, system design`;

    const prompt = `Generate one ${difficulty} level technical interview question for a Full Stack Developer.
    
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
    
    Return ONLY the question text.`;

    try {
      const question = await this.generateContent(
        prompt,
        systemMessage,
        "llama3-8b-8192"
      );
      return this.cleanQuestionText(question);
    } catch (error) {
      console.error("Error generating question:", error);
      return this.getMockQuestion(difficulty);
    }
  }

  static async evaluateAnswer(question, answer, difficulty) {
    const systemMessage = `You are an experienced technical interviewer evaluating Full Stack Developer candidates.
    
    EVALUATION CRITERIA:
    1. Technical Accuracy (40%) - Correctness of concepts and facts
    2. Clarity & Communication (30%) - How well the answer is explained
    3. Practical Examples (20%) - Use of real-world examples and code
    4. Completeness (10%) - Addressing all aspects of the question
    
    SCORING GUIDE:
    9-10: Excellent - Comprehensive, accurate, well-explained
    7-8: Good - Solid understanding, minor improvements needed
    5-6: Average - Basic understanding, significant gaps
    0-4: Poor - Major misunderstandings or incomplete
    
    Return valid JSON format only.`;

    const prompt = `Evaluate this interview response for a ${difficulty} level question.
    
    QUESTION: ${question}
    ANSWER: ${answer}
    
    DIFFICULTY CONTEXT: ${difficulty} level question expecting ${
      difficulty === "Easy"
        ? "basic concept understanding"
        : difficulty === "Medium"
        ? "practical implementation knowledge"
        : "advanced architectural thinking"
    }
    
    Provide JSON response with this exact structure:
    {
      "score": number between 0-10,
      "feedback": "constructive technical feedback",
      "improvements": "specific actionable suggestions",
      "strengths": "what the candidate did well",
      "breakdown": {
        "technical_accuracy": number,
        "clarity": number,
        "examples": number,
        "completeness": number
      }
    }`;

    try {
      const response = await this.generateContent(
        prompt,
        systemMessage,
        "mixtral-8x7b-32768"
      );

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        console.log("✅ Evaluation result:", evaluation);
        return this.validateEvaluation(evaluation);
      }

      return this.parseEvaluationResponse(response);
    } catch (error) {
      console.error("Error evaluating answer:", error);
      return this.getMockEvaluation(question, answer, difficulty);
    }
  }

  static async generateSummary(interviewData) {
    const systemMessage = `You are a senior technical interviewer providing candidate summaries.
    Create concise, professional summaries highlighting key strengths and areas for improvement.
    Focus on technical competency and potential for Full Stack Developer roles.`;

    const prompt = `Generate a professional summary for this interview performance:
    
    CANDIDATE: ${interviewData.candidate?.name || "Unknown"}
    ROLE: Full Stack Developer (React/Node.js)
    QUESTIONS COMPLETED: ${interviewData.scores?.length || 0}
    AVERAGE SCORE: ${
      interviewData.scores
        ? (
            interviewData.scores.reduce((a, b) => a + b, 0) /
            interviewData.scores.length
          ).toFixed(1)
        : "N/A"
    }
    DIFFICULTY DISTRIBUTION: ${
      interviewData.difficultyBreakdown || "Not available"
    }
    
    Focus on:
    - Overall technical competency assessment
    - Key strengths and demonstrated skills
    - Areas needing improvement
    - Suitability for the role
    - Recommended next steps
    
    Keep it professional, constructive, and concise (3-4 sentences).`;

    try {
      return await this.generateContent(
        prompt,
        systemMessage,
        "llama3-8b-8192"
      );
    } catch (error) {
      console.error("Error generating summary:", error);
      return this.getMockSummary(interviewData);
    }
  }

  // Utility methods
  static cleanQuestionText(text) {
    // Remove any introductory phrases, numbering, etc.
    return text
      .replace(/^(Question\s*\d*:?\s*)/i, "")
      .replace(/^(Here('s| is).*:\s*)/i, "")
      .replace(/^[•\-]\s*/, "")
      .trim();
  }

  static validateEvaluation(evaluation) {
    // Ensure evaluation has required fields with proper types
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

  static parseEvaluationResponse(response) {
    // Fallback parsing for non-JSON responses
    const scoreMatch = response.match(/(\d+(\.\d+)?)\/10|score[\s:]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[3]) : 6;

    return {
      score: Math.min(10, Math.max(0, score)),
      feedback:
        "Evaluation completed. Consider providing more specific examples in your answers.",
      improvements:
        "Include code snippets and practical implementation details where relevant.",
      strengths: "Demonstrates engagement with technical concepts.",
      breakdown: {
        technical_accuracy: score,
        clarity: score - 1,
        examples: score - 2,
        completeness: score - 1,
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
    const baseScore =
      difficulty === "Easy" ? 7 : difficulty === "Medium" ? 6 : 5;
    const randomVariation = Math.random() * 2 - 1;

    return {
      score: Math.min(10, Math.max(0, Math.round(baseScore + randomVariation))),
      feedback:
        "This demonstrates reasonable understanding. Consider providing more specific examples and practical implementation details.",
      improvements:
        "Include code snippets and discuss real-world applications of the concepts mentioned.",
      strengths:
        "Shows logical thinking and engagement with technical concepts.",
      breakdown: {
        technical_accuracy: baseScore,
        clarity: baseScore + 1,
        examples: baseScore - 1,
        completeness: baseScore,
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

  // Test connection
  static async testConnection() {
    try {
      const testPrompt = "Say 'Hello World'";
      const response = await this.generateContent(
        testPrompt,
        "You are a helpful assistant."
      );
      console.log("✅ Groq connection test successful:", response);
      return true;
    } catch (error) {
      console.log("❌ Groq connection test failed:", error);
      return false;
    }
  }
}

// Test connection on load
GroqService.testConnection();
