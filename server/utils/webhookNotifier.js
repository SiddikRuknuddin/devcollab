// DevCollab Discord & Slack Automated Webhook Dispatcher

const sendWebhookNotification = async (project, eventType, data) => {
  if (!project.webhooks || project.webhooks.length === 0) return;

  const activeHooks = project.webhooks.filter(
    (wh) => wh.active && (wh.events.length === 0 || wh.events.includes(eventType))
  );

  if (activeHooks.length === 0) return;

  const eventTitles = {
    "task.created": "📌 New Kanban Task Added",
    "task.completed": "✅ Task Completed",
    "milestone.completed": "🎯 Milestone Achieved",
    "member.joined": "👥 New Collaborator Joined",
    "file.uploaded": "📁 New Asset / File Uploaded",
    "standup.started": "🎙️ Team Video Standup Started",
    "code.reviewed": "🛡️ AI Security Scan Executed",
    "test.ping": "🔔 Test Webhook Ping",
  };

  const title = eventTitles[eventType] || `DevCollab Event: ${eventType}`;
  const timestamp = new Date().toISOString();

  for (const hook of activeHooks) {
    try {
      let payload;
      if (hook.platform === "discord") {
        payload = {
          username: "DevCollab Bot",
          avatar_url: "https://img.icons8.com/color/96/collaboration.png",
          embeds: [
            {
              title: `${title} - [${project.title}]`,
              description: data.description || "A project activity was recorded on DevCollab.",
              color: eventType.includes("completed") ? 0x10b981 : 0x6366f1,
              fields: [
                { name: "Project", value: project.title, inline: true },
                { name: "Triggered By", value: data.userName || "DevCollab User", inline: true },
                ...(data.extra ? [{ name: "Details", value: data.extra, inline: false }] : []),
              ],
              footer: { text: "DevCollab Automated Integrations" },
              timestamp,
            },
          ],
        };
      } else if (hook.platform === "slack") {
        payload = {
          text: `*[DevCollab]* ${title} in *${project.title}*`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${title}*\n*Project:* ${project.title}\n*Details:* ${data.description || "Project update"}\n*By:* ${data.userName || "DevCollab User"}`,
              },
            },
          ],
        };
      } else {
        // Generic JSON payload
        payload = {
          event: eventType,
          project: { id: project._id, title: project.title },
          data,
          timestamp,
        };
      }

      await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn(`Failed to dispatch webhook (${hook.platform}):`, err.message);
    }
  }
};

module.exports = { sendWebhookNotification };
