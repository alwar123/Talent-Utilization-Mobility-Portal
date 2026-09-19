"""
github.py — GitHub Public Profile Scraper (Phase 6)

POST /ai/scrape-github
  Parses a GitHub URL, fetches public repo data using PyGithub or raw requests,
  detects languages, and returns a structured summary.

  Gracefully handles: invalid URLs, private/nonexistent users, rate limits,
  network timeouts, and missing GITHUB_TOKEN.
"""

import re
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import GITHUB_TOKEN

router = APIRouter()
logger = logging.getLogger(__name__)

GITHUB_URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?github\.com/([a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,38})?[a-zA-Z0-9]?)(?:/.*)?$"
)

MAX_REPOS = 10  # Top repos to inspect for language data

class ScrapeGithubRequest(BaseModel):
    github_url: str

class RepoSummary(BaseModel):
    name: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    url: str

def _parse_username(url: str) -> str:
    """Extract GitHub username from a URL. Raises HTTPException on failure."""
    match = GITHUB_URL_PATTERN.match(url.strip())
    if not match:
        raise HTTPException(
            status_code=422,
            detail="Invalid GitHub URL. Expected format: https://github.com/username"
        )
    return match.group(1)

@router.post("/scrape-github")
def scrape_github(payload: ScrapeGithubRequest):
    """
    Phase 6: Scrapes a public GitHub profile to detect programming languages.
    Uses PyGithub if available, falls back to raw GitHub API requests.
    """
    username = _parse_username(payload.github_url)

    # Try PyGithub first, then fall back to requests
    try:
        result = _scrape_with_pygithub(username)
    except ImportError:
        logger.warning("PyGithub not installed, falling back to raw requests.")
        result = _scrape_with_requests(username)

    return result


def _scrape_with_pygithub(username: str) -> dict:
    """Fetch GitHub data using the PyGithub library."""
    try:
        from github import Github, GithubException, UnknownObjectException, RateLimitExceededException
    except ImportError:
        raise ImportError("PyGithub not installed")

    try:
        g = Github(GITHUB_TOKEN) if GITHUB_TOKEN else Github()
        user = g.get_user(username)

        repos = list(user.get_repos(type="public", sort="updated"))[:MAX_REPOS]

        languages_set: set = set()
        top_repos: list = []

        for repo in repos:
            if repo.language:
                languages_set.add(repo.language)
            top_repos.append({
                "name": repo.name,
                "description": repo.description,
                "language": repo.language,
                "stars": repo.stargazers_count,
                "url": repo.html_url,
            })

        return {
            "username": username,
            "public_repos": user.public_repos,
            "followers": user.followers,
            "languages_detected": sorted(languages_set),
            "top_repos": top_repos,
        }

    except UnknownObjectException:
        raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found or profile is private.")
    except RateLimitExceededException:
        raise HTTPException(status_code=503, detail="GitHub API rate limit exceeded. Please try again later.")
    except GithubException as e:
        logger.error("GitHub API error for user %s: %s", username, e)
        raise HTTPException(status_code=502, detail="GitHub API returned an error.")
    except Exception as e:
        logger.error("Unexpected GitHub error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch GitHub profile.")


def _scrape_with_requests(username: str) -> dict:
    """Fallback: fetch GitHub data using raw HTTPS requests."""
    import requests  # stdlib-compatible

    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    try:
        # User endpoint
        user_res = requests.get(
            f"https://api.github.com/users/{username}",
            headers=headers,
            timeout=10,
        )
        if user_res.status_code == 404:
            raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found or profile is private.")
        if user_res.status_code == 403:
            raise HTTPException(status_code=503, detail="GitHub API rate limit exceeded.")
        if not user_res.ok:
            raise HTTPException(status_code=502, detail="GitHub API returned an error.")

        user_data = user_res.json()

        # Repos endpoint
        repos_res = requests.get(
            f"https://api.github.com/users/{username}/repos",
            headers=headers,
            params={"sort": "updated", "per_page": MAX_REPOS, "type": "public"},
            timeout=10,
        )
        repos_data = repos_res.json() if repos_res.ok else []

        languages_set: set = set()
        top_repos: list = []
        for repo in repos_data:
            if repo.get("language"):
                languages_set.add(repo["language"])
            top_repos.append({
                "name": repo.get("name"),
                "description": repo.get("description"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count", 0),
                "url": repo.get("html_url"),
            })

        return {
            "username": username,
            "public_repos": user_data.get("public_repos", 0),
            "followers": user_data.get("followers", 0),
            "languages_detected": sorted(languages_set),
            "top_repos": top_repos,
        }

    except HTTPException:
        raise
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="GitHub API request timed out.")
    except Exception as e:
        logger.error("GitHub requests fallback failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch GitHub profile.")
