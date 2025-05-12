const axios = require('axios');

async function createGitHubIssue(task, project) {
  const url = `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues`;

  const body = `
### Project: ${project.name}

*Task:* ${task.title}

*Description:*
${task.description || 'No description provided.'}

*Priority:* ${task.priority}
*Status:* ${task.status}
*Deadline:* ${task.deadline ? new Date(task.deadline).toDateString() : 'N/A'}

Created from internal task ID: \`${task._id}\`
`;

  const payload = {
    title: `[${project.name}] ${task.title}`,
    body: body,
    labels: task.tags || []
  };

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json'
  };

  const response = await axios.post(url, payload, { headers });
  return response.data;
}

module.exports = { createGitHubIssue };