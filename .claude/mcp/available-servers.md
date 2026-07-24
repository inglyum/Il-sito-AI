# MCP Servers — INGLY ENTERPRISE

## Active in this session

### github (mcp__github__*)
GitHub platform integration. Used for:
- Reading PR status and CI results
- Creating/updating files in the repository
- Managing branches and pull requests
- Checking workflow run status

Key tools:
- `push_files` — push code changes to branch
- `create_pull_request` — open PR for review
- `get_file_contents` — read files from repo
- `list_commits` — check deploy history
- `actions_list` / `actions_get` — CI status

### Giuseppe (mcp__Giuseppe__*)
Media and content generation. Relevant for INGLY:
- `generate_image` — generate product mock-ups or lifestyle images
- `generate_video` — create product showcase videos
- `remove_background` — product photo background removal
- `upscale_image` — enhance low-resolution product photos

### Notion (mcp__Notion__*)
Knowledge base and documentation. Can be used for:
- Syncing product catalog to Notion database
- Maintaining editorial calendar for social posts
- Storing customer feedback and order notes

### Windsor AI (mcp__Windsor_ai__*)
Marketing analytics integration. Used for:
- Reading Instagram analytics (post performance)
- Reading Facebook page insights
- Writing to ad platforms (Meta Ads campaigns)

## Recommended MCP Servers to Add

### Stripe MCP (future)
For digital product payment link management:
```
Tool: create_payment_link
Input: { product_name, price, currency, redirect_url }
Output: { payment_link_url }
```

### Cloudflare MCP (future)
For cache purging after admin publishes:
```
Tool: purge_cache
Input: { zone_id, files: ["https://www.inglydesign.it/"] }
```

### Brevo/Sendinblue MCP (future)
For email marketing automation:
```
Tool: send_campaign
Input: { list_id, subject, content_html }
```

## Usage Rules
- Never use MCP tools to commit directly to `main` branch
- Always use the designated branch: `claude/html-prompt-application-x8zf8s`
- Push changes, then verify via GitHub Pages deploy
- Never store API credentials in files — use session context only
