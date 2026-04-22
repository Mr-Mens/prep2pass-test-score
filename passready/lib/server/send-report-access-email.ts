import "server-only";

type Args = {
  toEmail: string;
  accessUrl: string;
};

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function sendReportAccessEmail({ toEmail, accessUrl }: Args): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REPORT_ACCESS_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[report-access] Magic link for ${toEmail}: ${accessUrl}`);
      return;
    }
    throw new Error("Email delivery is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: "Your Prep2Pass report access link",
      html: `
        <p>Use this secure link to access your Prep2Pass reports:</p>
        <p><a href="${accessUrl}">Open my reports</a></p>
        <p>This link expires shortly for your security.</p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>${getAppUrl()}</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send access email");
  }
}

