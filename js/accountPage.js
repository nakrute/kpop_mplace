import { requireAuth } from "./auth.js";
import { qs, escapeHtml } from "./utils.js";

export async function initAccountPage() {
  const user = await requireAuth();
  if (!user) return;

  const root = qs("#accountRoot");
  if (!root) return;

  root.innerHTML = `
    <section class="panel card">
      <h1 style="margin:0 0 10px 0;">Account</h1>
      <p class="small" style="margin:0 0 6px 0;">Email: <strong>${escapeHtml(user.email ?? "")}</strong></p>
      <p class="small" style="margin:0;">User ID: <code>${escapeHtml(user.id)}</code></p>
    </section>
  `;
}
