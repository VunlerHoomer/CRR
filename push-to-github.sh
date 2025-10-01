#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🚀 推送项目到 GitHub                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查是否传入了 GitHub 仓库 URL
if [ -z "$1" ]; then
    echo -e "${RED}❌ 错误：请提供 GitHub 仓库 URL${NC}"
    echo ""
    echo -e "${YELLOW}使用方法：${NC}"
    echo -e "  ./push-to-github.sh https://github.com/your-username/your-repo.git"
    echo ""
    echo -e "${YELLOW}或者带自定义提交信息：${NC}"
    echo -e "  ./push-to-github.sh https://github.com/your-username/your-repo.git \"Initial commit\""
    echo ""
    exit 1
fi

REPO_URL=$1
COMMIT_MESSAGE=${2:-"Initial commit: 答题抽签互动网站完整项目"}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 准备推送信息${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "仓库 URL: ${YELLOW}$REPO_URL${NC}"
echo -e "提交信息: ${YELLOW}$COMMIT_MESSAGE${NC}"
echo ""

# 1. 检查 Git 配置
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔧 第 1 步：检查 Git 配置${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

GIT_NAME=$(git config --global user.name)
GIT_EMAIL=$(git config --global user.email)

if [ -z "$GIT_NAME" ] || [ -z "$GIT_EMAIL" ]; then
    echo -e "${YELLOW}⚠️  Git 用户信息未配置${NC}"
    echo ""
    read -p "请输入您的 Git 用户名: " input_name
    read -p "请输入您的 Git 邮箱: " input_email
    
    git config --global user.name "$input_name"
    git config --global user.email "$input_email"
    
    echo -e "${GREEN}✅ Git 用户信息配置完成${NC}"
else
    echo -e "用户名: ${GREEN}$GIT_NAME${NC}"
    echo -e "邮箱: ${GREEN}$GIT_EMAIL${NC}"
fi
echo ""

# 2. 初始化 Git 仓库
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📦 第 2 步：初始化 Git 仓库${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git 仓库已存在，跳过初始化${NC}"
else
    git init
    echo -e "${GREEN}✅ Git 仓库初始化完成${NC}"
fi
echo ""

# 3. 添加文件到暂存区
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📝 第 3 步：添加文件到暂存区${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

git add .
echo -e "${GREEN}✅ 所有文件已添加到暂存区${NC}"
echo ""

# 显示将要提交的文件
echo -e "${YELLOW}📄 将要提交的文件（部分）：${NC}"
git status --short | head -20
TOTAL_FILES=$(git status --short | wc -l | tr -d ' ')
if [ "$TOTAL_FILES" -gt 20 ]; then
    echo -e "${YELLOW}... 还有 $((TOTAL_FILES - 20)) 个文件${NC}"
fi
echo ""

# 4. 创建提交
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}💾 第 4 步：创建提交${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

git commit -m "$COMMIT_MESSAGE"
echo -e "${GREEN}✅ 提交创建成功${NC}"
echo ""

# 5. 连接远程仓库
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔗 第 5 步：连接远程仓库${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查是否已有 origin
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}⚠️  远程仓库 origin 已存在，删除旧的配置${NC}"
    git remote remove origin
fi

git remote add origin "$REPO_URL"
echo -e "${GREEN}✅ 远程仓库已连接${NC}"
echo ""

# 6. 推送到 GitHub
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 第 6 步：推送到 GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}正在推送代码到 GitHub...${NC}"
echo ""

# 推送到 main 分支
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           🎉 恭喜！项目已成功推送到 GitHub！                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📍 您的仓库地址：${NC}"
    echo -e "${YELLOW}   ${REPO_URL%.git}${NC}"
    echo ""
    echo -e "${BLUE}📝 后续操作：${NC}"
    echo -e "   1. 访问上面的 URL 查看您的项目"
    echo -e "   2. 如需再次推送更新："
    echo -e "      ${YELLOW}git add .${NC}"
    echo -e "      ${YELLOW}git commit -m \"更新说明\"${NC}"
    echo -e "      ${YELLOW}git push${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║           ❌ 推送失败！                                       ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}可能的原因：${NC}"
    echo -e "   1. GitHub 仓库 URL 不正确"
    echo -e "   2. 没有该仓库的访问权限"
    echo -e "   3. 需要先在 GitHub 上进行身份验证"
    echo ""
    echo -e "${YELLOW}解决方法：${NC}"
    echo -e "   1. 检查 GitHub 仓库 URL 是否正确"
    echo -e "   2. 确保已登录 GitHub"
    echo -e "   3. 如果使用 HTTPS，可能需要配置 Personal Access Token"
    echo -e "   4. 如果使用 SSH，确保已配置 SSH 密钥"
    echo ""
    exit 1
fi

