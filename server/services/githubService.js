/**
 * Helper to extract owner and repo name from GitHub URL
 * Supports formats like:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/
 */
const extractRepoFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    const cleanUrl = url.trim().replace(/\.git$/i, "").replace(/\/+$/, "");
    const match = cleanUrl.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i
    );

    if (match && match[1] && match[2]) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Safely fetch public GitHub repository details using GitHub REST API v3
 * No personal access tokens or OAuth credentials required.
 * @param {String} owner
 * @param {String} repo
 */
const getPublicRepoInfo = async (owner, repo) => {
  try {
    if (!owner || !repo) {
      return {
        success: false,
        message: "Invalid repository owner or name",
      };
    }

    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "DevCollab-App",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 404) {
      return {
        success: false,
        notFound: true,
        message: "Repository not found or is private",
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        rateLimited: true,
        message: "GitHub API rate limit exceeded or access forbidden",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `GitHub API error: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      repo: {
        name: data.name,
        fullName: data.full_name,
        description: data.description || "No description provided",
        stars: data.stargazers_count ?? 0,
        forks: data.forks_count ?? 0,
        openIssues: data.open_issues_count ?? 0,
        defaultBranch: data.default_branch || "main",
        language: data.language || "Not specified",
        htmlUrl: data.html_url,
        isPrivate: data.private,
        ownerAvatar: data.owner?.avatar_url || "",
        topics: data.topics || [],
      },
    };
  } catch (error) {
    console.error("GitHub Service Error:", error.message);
    return {
      success: false,
      message: "Unable to communicate with GitHub API",
    };
  }
};

module.exports = {
  extractRepoFromUrl,
  getPublicRepoInfo,
};
