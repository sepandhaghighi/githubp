const GITHUB_NAME_PATTERN = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,100}(?<!-)$/;

function isValidGithubName(name) {
  return GITHUB_NAME_PATTERN.test(name);
}

function redirectToGithubPages(username, repositoryName) {
  const targetUrl = repositoryName
    ? `https://${username}.github.io/${repositoryName}`
    : `https://${username}.github.io/`;
  window.location.href = targetUrl;
}

function parseGithubPath(input) {
  try {
    const url = input.startsWith("http")
      ? new URL(input)
      : new URL(`https://github.com/${input.replace(/^\/+/, "")}`);

    const segments = url.pathname.split("/").filter(Boolean);
    return {
      username: segments[0] || null,
      repositoryName:
        segments.length >= 2 && isValidGithubName(segments[1])
          ? segments[1]
          : null
    };
  } catch {
    return { username: null, repositoryName: null };
  }
}


function handleIndexPage() {
  const input = document.getElementById("pathInput");
  const button = document.getElementById("button");
  if (!input || !button) return;

  button.addEventListener("click", () => {
    const value = input.value.trim();
    const { username, repositoryName } = parseGithubPath(value);

    if (!username || !isValidGithubName(username)) {
      alert("Invalid GitHub path");
      return;
    }

    redirectToGithubPages(username, repositoryName);
  });
}


function handle404Page() {
  const { username, repositoryName } = parseGithubPath(location.pathname);
  if (!username || !isValidGithubName(username)) {
    alert("Invalid GitHub path");
    location.replace("/");
    return;
  }

  redirectToGithubPages(username, repositoryName);
}

