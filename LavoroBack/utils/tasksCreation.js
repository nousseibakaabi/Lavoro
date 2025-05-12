const { GoogleGenAI } = require('@google/genai'); 
const genAI = new GoogleGenAI({ apiKey: "AIzaSyBhOHuAkp504kk4bfCmCXheEZQD2u8f_v8" });

async function generateAITasks(projectId, projectName, projectDescription) {
    try {
        // Preparing the input for the AI model
        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              parts: [
                { text: `You are a project manager. Generate 5-8 IT related, realistic tasks for the project below.
      
**Project Name:** ${projectName}
**Description:** ${projectDescription}

For each task, return a JSON array with:
- title: string (e.g., "Implement user login")
- description: string 
- priority: "Low", "Medium", or "High" (based on impact)
- status: "Not Started" (default)
- deadline: YYYY-MM-DD (within 3 months, logical order)
- start_date: YYYY-MM-DD (before deadline)
- estimated_duration: number (days)
- tags: string[] (e.g., ["backend", "auth"])

Return ONLY the JSON array. Example:
[
  {
    "title": "Design database schema",
    "description": "Create collections for user and project data.",
    "priority": "High",
    "status": "Not Started",
    "deadline": "2024-09-15",
    "start_date": "2024-09-10",
    "estimated_duration": 3,
    "tags": ["backend", "database"]
  }
]` }
              ]
            }
          ]
        });
    
        // Process and log the AI response
        console.log("AI Response:", response.text);
        return response.text;
      } catch (error) {
    console.error("AI task generation failed:", error);
    throw new Error(`AI Error: ${error.message}`);
  }
}

// Example usage:
 //generateAITasks("123", "EcoTracker", "A carbon footprint app")
//  .then(tasks => console.log(tasks));
(async () => {
    const projectId = "67f92d3eb11be2926f42a473"; // Your test ID
    const tasks = await generateAITasks(
      projectId,
      "EcoTracker",
      "A carbon footprint tracking app"
    );
    
    console.log("Generated Tasks:", tasks);
  })();

module.exports = { generateAITasks };