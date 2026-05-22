const CONFIG = {
  STORAGE_KEYS: {
    RECENT: "recentPages"
  },

  LIMITS: {
    RECENT_SIZE: 15
  },

  PATTERNS: {
    GITHUB_NAME: /^(?!-)(?!.*--)[A-Za-z0-9-]{1,100}(?<!-)$/
  },

  URLS: {
    BASE: "https://github.com",
    PAGES: "github.io"
  },

  MESSAGES: {
    INVALID_PATH: "Invalid GitHub path",
    CONFIRM_REMOVE: "Are you sure you want to remove this page?"
  }
}

function showAlert(options) {
  return Swal.fire({
    buttonsStyling: false,
    customClass: {
      container: "githubp-swal-container",
      popup: "githubp-swal",
      icon: "githubp-swal-icon",
      title: "githubp-swal-title",
      htmlContainer: "githubp-swal-text",
      actions: "githubp-swal-actions",
      confirmButton: "githubp-swal-button githubp-swal-button-confirm",
      cancelButton: "githubp-swal-button githubp-swal-button-cancel"
    },
    ...options
  });
}

function showError(message) {
  return showAlert({
    icon: "error",
    iconColor: "#d73a49",
    title: "Error",
    text: message,
    confirmButtonText: "OK"
  });
}

function showConfirm(message) {
  return showAlert({
    icon: "question",
    iconColor: "#62B039",
    title: "Confirm",
    text: message,
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel"
  });
}

function getRecent() {
  return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT) || "[]");
}

function setRecent(data) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT, JSON.stringify(data));
}

function migrateRecentData() {
    const recent = getRecent();
    if (!recent) return;


    if (Array.isArray(recent) && recent.length > 0 && typeof recent[0] === "object" && recent[0].lastVisit) {
        return;
    }

    if (Array.isArray(recent) && recent.every(item => typeof item === "string")) {
        const migratedData = recent.map(url => ({
            url,
            lastVisit: new Date().toGMTString()
        }));

        setRecent(migratedData);
        console.log("LocalStorage data migrated to new format.");
    }
}

function isValidGithubName(name) {
  return CONFIG.PATTERNS.GITHUB_NAME.test(name);
}

function getTargetUrl(username, repositoryName) {
  const targetUrl = repositoryName
    ? `https://${username}.${CONFIG.URLS.PAGES}/${repositoryName}`
    : `https://${username}.${CONFIG.URLS.PAGES}`;
  return targetUrl;
}

function redirectToGithubPages(url) {
  window.location.href = url;
}

function parseGithubPath(path) {
  try {
    const url = path.startsWith("http")
      ? new URL(path)
      : new URL(`${CONFIG.URLS.BASE}/${path.replace(/^\/+/, "")}`);

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
  let lastVisit = new Date().toGMTString()
  let recent = getRecent();
  recent = recent.filter(item => !(item.url===url));
  recent.unshift({url, lastVisit});
  if(recent.length > CONFIG.LIMITS.RECENT_SIZE) recent = recent.slice(0, CONFIG.LIMITS.RECENT_SIZE);
  setRecent(recent);
}

function removeRecent(url) {
  showConfirm(CONFIG.MESSAGES.CONFIRM_REMOVE).then(result => {
    if (result.isConfirmed) {
      let recent = getRecent();
      recent = recent.filter(item => !(item.url===url));
      setRecent(recent);
      renderRecent();
    }
  });
}

function createRecentItem(item) {
  const nowDate = new Date();
  const li = document.createElement("li");
  const spanUrl = document.createElement("span");
  const spanRemove = document.createElement("span");
  const spanLastVisit = document.createElement("span");
  spanUrl.textContent = item.url;
  spanUrl.className = "recent-url";
  spanRemove.innerHTML = `<img src="assets/icons/trash.svg" alt="Remove" class="icon"></img>`;
  spanRemove.className = "recent-remove";
  spanRemove.setAttribute("title", "Remove");
  spanRemove.setAttribute("role", "button");
  spanRemove.setAttribute("tabindex", "0");
  spanRemove.setAttribute("aria-label", "Remove recent item");
  if (nowDate.toLocaleDateString() === new Date(item.lastVisit).toLocaleDateString()) {
    spanLastVisit.textContent = new Date(item.lastVisit).toLocaleTimeString();
  }
  else {
    spanLastVisit.textContent = new Date(item.lastVisit).toLocaleDateString();
  }
  li.appendChild(spanRemove);
  li.appendChild(spanUrl);
  li.appendChild(spanLastVisit);

  return { li, spanRemove, spanUrl};
}

function attachRecentEvents(item, spanRemove, spanUrl) {
  spanUrl.addEventListener("click", () => {
    saveRecent(item.url);
    redirectToGithubPages(item.url);
  });

  spanRemove.addEventListener("click", () => {
    removeRecent(item.url);
  });
}

function renderRecent(){
  const recent = getRecent();
  const recentItems = document.getElementById("recent-items");
  recentItems.innerHTML = "";
  recent.forEach(item => {
    const { li, spanRemove, spanUrl} = createRecentItem(item);
    attachRecentEvents(item, spanRemove, spanUrl);
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
      showError(CONFIG.MESSAGES.INVALID_PATH);
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
    showError(CONFIG.MESSAGES.INVALID_PATH).then(() => {
      location.replace("/");
    });
    return;
  }
  const targetUrl = getTargetUrl(username, repositoryName);
  saveRecent(targetUrl);
  redirectToGithubPages(targetUrl);
}

