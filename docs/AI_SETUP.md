# Setting up the AI check

The AI check sends snapshots of the live charts to Claude and gets back which Matrixchannel setup fits, what's missing, and buy / sell / wait. It needs three things: an Anthropic API key, a small Cloudflare server that keeps the key private, and the server's address entered in the site.

> **Currently off.** The AI check is switched off in the site (`AI_ENABLED = false` in `src/lib/ai.ts`): its buttons are disabled and nothing is sent. Set it to `true` when the server below is set up.

Total time: about 15 minutes. You never need to paste the key anywhere except the GitHub secrets page.

## 1. Anthropic API key

1. Go to **console.anthropic.com** and sign up (this is separate from a Claude subscription).
2. **Settings → Billing**: add credit. $10 lasts a long time at three checks a day.
3. **Settings → Limits**: set a monthly spend limit, e.g. $15.
4. **Settings → API keys → Create key**. Name it `futures-desk`. Copy the key (starts with `sk-ant-`). You'll paste it in step 3.

## 2. Cloudflare (free)

1. Sign up at **dash.cloudflare.com**.
2. Open **Workers & Pages** once. Cloudflare asks you to pick a `workers.dev` subdomain — pick anything (e.g. `natalia`).
3. Copy your **Account ID**: it's on the Workers & Pages overview page, in the right-hand column.
4. Create an API token: top-right profile icon → **My Profile → API Tokens → Create Token** → use the **Edit Cloudflare Workers** template → **Continue to summary → Create Token**. Copy it.

## 3. GitHub secrets

In this repository on GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Add four:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from step 2.4 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 2.3 |
| `ANTHROPIC_API_KEY` | the key from step 1.4 |
| `ACCESS_KEY` | a password you make up — the site asks for it, so nobody else can use your credits |

## 4. Deploy the AI server

**Actions → Deploy AI server → Run workflow**. When it turns green, open the run's log: the deploy step prints your server address, like
`https://futures-desk-ai.natalia.workers.dev`.

It redeploys automatically whenever the `worker/` folder changes on `main`.

## 5. Connect the site

1. Open the site in **Chrome**, Live desk → **AI check → Connect your AI server**.
2. Paste the server address and your `ACCESS_KEY` password → **Test connection** → **Save**.

## Using it

- Press **Share tab**, choose **This tab**, and allow. Chrome shows a "sharing this tab" bar — that's the page capturing its own charts. Sharing lasts until you stop it or close the tab.
- **Analyze now** captures the current 5m chart (and the 1W · 60m chart if "Include 1W · 60m context" is on), sends them to Claude, and shows the verdict in about 20–60 seconds.
- **Auto checks** run at 16:35, 20:05 and 23:05 (your computer's local time; change them in ⚙ Settings) — but only while the site is open in a tab with sharing on, and the computer is awake. Allow notifications to get the verdict as a pop-up.
- **Apply to checklist** fills the panel checklist from Claude's reading. Review each item — it's a reading of a picture, not a measurement.
- Every check, with its snapshots, is saved on the **Signal log** page under **AI checks**. Signals you log within 30 minutes of a check are linked to it in the CSV export.

## Cost

Claude Opus 5.5, about **$0.06 per chart**, so about **$0.10 per check** with the hourly context. Three checks a day is roughly **$0.30/day**. Each check shows its estimated cost.

## Settings you can change

In `worker/wrangler.toml`:

- `MODEL` — `claude-opus-5-5` (default). A cheaper model reads small price labels less reliably.
- `EFFORT` — `high` (default). `medium` is faster and cheaper; `xhigh` thinks longer.
- `ALLOWED_ORIGINS` — the site addresses allowed to call the server.
