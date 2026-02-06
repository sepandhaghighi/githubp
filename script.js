const GITHUB_NAME_PATTERN = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,100}(?<!-)$/;
const recentKey = "recentPages";
const recentSize = 15;

function isValidGithubName(name) {
  return GITHUB_NAME_PATTERN.test(name);
}

function getTargetUrl(username, repositoryName) {
  const targetUrl = repositoryName
    ? `https://${username}.github.io/${repositoryName}`
    : `https://${username}.github.io`;
  return targetUrl;
}

function redirectToGithubPages(url) {
  window.location.href = url;
}

function parseGithubPath(path) {
  try {
    const url = path.startsWith("http")
      ? new URL(path)
      : new URL(`https://github.com/${path.replace(/^\/+/, "")}`);

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

function saveRecent(url) {
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recent = recent.filter(item => !(item===url));
  recent.unshift(url);
  if(recent.length > recentSize) recent = recent.slice(0, recentSize);
  localStorage.setItem(recentKey, JSON.stringify(recent));
}

function renderRecent(){
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  const recentItems = document.getElementById("recent-items");
  recentItems.innerHTML = "";
  recent.forEach(item=>{
    const li = document.createElement("li");
    const spanUrl = document.createElement("span");
    const spanRemove = document.createElement("span");
    spanUrl.textContent = item;
    spanUrl.className = "recent-url";
    spanRemove.textContent = "🗑️";
    spanRemove.className = "recent-remove";
    spanUrl.addEventListener("click", () => {
      saveRecent(item);
      redirectToGithubPages(item);
    });

  spanRemove.addEventListener("click", ()=>{
      const userConfirmed = confirm("Are you sure you want to remove this page?");
      if (userConfirmed){
        let newRecent = JSON.parse(localStorage.getItem(recentKey) || "[]");
        newRecent = newRecent.filter(recentItem => !(recentItem===item));
        localStorage.setItem(recentKey, JSON.stringify(newRecent));
        renderRecent();
      }
    });
    li.appendChild(spanRemove);
    li.appendChild(spanUrl);
    recentItems.appendChild(li);
  });
  document.getElementById("recent-list").style.display = recent.length ? "block" : "none";
}


function handleIndexPage() {
  renderRecent();
  const path = document.getElementById("path");
  const button = document.getElementById("button");
  if (!path || !button) return;

  button.addEventListener("click", () => {
    const value = path.value.trim();
    const { username, repositoryName } = parseGithubPath(value);

    if (!username || !isValidGithubName(username)) {
      alert("Invalid GitHub path");
      return;
    }
    const targetUrl = getTargetUrl(username, repositoryName);
    saveRecent(targetUrl);
    redirectToGithubPages(targetUrl);
  });
}


function handle404Page() {
  const { username, repositoryName } = parseGithubPath(location.pathname);
  if (!username || !isValidGithubName(username)) {
    alert("Invalid GitHub path");
    location.replace("/");
    return;
  }
  const targetUrl = getTargetUrl(username, repositoryName);
  saveRecent(targetUrl);
  redirectToGithubPages(targetUrl);
}

