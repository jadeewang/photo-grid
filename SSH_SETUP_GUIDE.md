# SSH Setup Guide for GitHub

## ✅ Step 1: Check Your SSH Key

You already have an SSH key! Your public key is:
```
[Your public key will be shown above]
```

## Step 2: Add SSH Key to GitHub

### Option A: If you haven't added this key to GitHub yet

1. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```
   (This copies it to your clipboard on Mac)

2. **Go to GitHub:**
   - Visit: https://github.com/settings/keys
   - Click "New SSH key" button
   - Title: Give it a name (e.g., "MacBook Pro")
   - Key: Paste your public key (Cmd+V)
   - Click "Add SSH key"

### Option B: If you've already added it

Skip to Step 3!

## Step 3: Test SSH Connection

Test if GitHub recognizes your SSH key:

```bash
ssh -T git@github.com
```

You should see:
```
Hi jadeewang! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see this, you're all set! ✅

## Step 4: Change Remote URL to SSH

Change your repository's remote URL from HTTPS to SSH:

```bash
cd /Users/jade.wang/Desktop/jade-projects/photo-grid
git remote set-url origin git@github.com:jadeewang/photo-grid.git
```

Verify it changed:
```bash
git remote -v
```

You should see:
```
origin  git@github.com:jadeewang/photo-grid.git (fetch)
origin  git@github.com:jadeewang/photo-grid.git (push)
```

## Step 5: Push Using SSH

Now you can push without entering credentials:

```bash
git push origin hand-tracking
```

## Troubleshooting

### If SSH test fails:

1. **Check if SSH agent is running:**
   ```bash
   eval "$(ssh-agent -s)"
   ```

2. **Add your key to the agent:**
   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Try testing again:**
   ```bash
   ssh -T git@github.com
   ```

### If you need to generate a new SSH key:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Then follow Step 2 above to add it to GitHub.

## Quick Reference

**Check current remote:**
```bash
git remote -v
```

**Change to SSH:**
```bash
git remote set-url origin git@github.com:jadeewang/photo-grid.git
```

**Test connection:**
```bash
ssh -T git@github.com
```

**Push:**
```bash
git push origin hand-tracking
```
