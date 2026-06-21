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
      subject: "Your Pass Pilot report access link",
      html: `
        <div style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#0f172a;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d7e2ee;border-radius:16px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px 24px 8px 24px;">
                      <p style="margin:0;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0f766e;">Pass Pilot</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 24px 4px 24px;">
                      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0f172a;">Access your TestReady Score</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 24px 0 24px;">
                      <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">
                        Click the button below to securely view your report. This link is private and will expire shortly.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 24px 8px 24px;">
                      <a
                        href="${accessUrl}"
                        style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;border-radius:12px;padding:14px 22px;"
                      >
                        View My Report
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 24px 18px 24px;">
                      <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                        Created by a DVSA-approved driving instructor.
                      </p>
                      <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#475569;">
                        If you didn’t request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">${getAppUrl()}</p>
              </td>
            </tr>
          </table>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send access email");
  }
}

