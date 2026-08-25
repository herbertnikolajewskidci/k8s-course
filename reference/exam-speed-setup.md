# CKA Exam Speed Setup & Aliases

Essential bash aliases, environment variables, and Vim configurations for
maximum velocity in the CKA exam environment.

## 1. Fast Command Aliases (`~/.bashrc` / Shell Session)

Set up these shortcuts at the beginning of your exam or practice session:

```bash
# 1. Alias k for kubectl
alias k=kubectl
complete -o default -F __start_kubectl k

# 2. Dry-run YAML generator shortcut
export do="--dry-run=client -o yaml"

# 3. Instant Pod deletion without grace period
export now="--force --grace-period=0"
```

## 2. Speed Usage Examples

### Generate Pod YAML instantly

```bash
k run my-pod --image=nginx $do > pod.yaml
```

### Generate Deployment YAML instantly

```bash
k create deploy my-dep --image=nginx --replicas=3 $do > deploy.yaml
```

### Force-delete a stuck Pod instantly

```bash
k delete pod stuck-pod $now
```

## 3. Recommended Vim Configuration (`~/.vimrc`)

Ensure proper 2-space YAML indentation in Vim:

```vim
set tabstop=2
set shiftwidth=2
set expandtab
set number
set autoindent
```

Or apply on the fly:

```bash
echo "set tabstop=2 shiftwidth=2 expandtab autoindent number" > ~/.vimrc
```
