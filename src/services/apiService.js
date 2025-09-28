import { GroqService } from "./groqService";

class ApiServiceManager {
  constructor() {
    this.currentService = "groq";
    this.services = {
      groq: GroqService,
    };
  }

  async generateQuestion(difficulty, context = "") {
    return await this.services[this.currentService].generateQuestion(
      difficulty,
      context
    );
  }

  async evaluateAnswer(question, answer, difficulty) {
    return await this.services[this.currentService].evaluateAnswer(
      question,
      answer,
      difficulty
    );
  }

  async generateSummary(interviewData) {
    return await this.services[this.currentService].generateSummary(
      interviewData
    );
  }

  setService(serviceName) {
    if (this.services[serviceName]) {
      this.currentService = serviceName;
      console.log(`🔄 Switched to ${serviceName} service`);
    }
  }

  getAvailableServices() {
    return Object.keys(this.services);
  }
}

export default new ApiServiceManager();
