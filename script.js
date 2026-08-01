const CONFIG = {
  STORAGE_KEYS: {
    RECENT: "recentPages"
  },

  LIMITS: {
    RECENT_SIZE: 15
  },

  PATTERNS: {
    USERNAME: /^(?!-)(?!.*--)[A-Za-z0-9-]{1,100}(?<!-)$/,
    REPOSITORY_NAME: /^[A-Za-z0-9._-]{1,100}$/
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

const Modal = {
  fire(options) {
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
  },

  error(message) {
    return this.fire({
      icon: "error",
      iconColor: "#d73a49",
      title: "Error",
      text: message,
      confirmButtonText: "OK"
    });
  },

  confirm(message) {
    return this.fire({
      icon: "question",
      iconColor: "#62B039",
      title: "Confirm",
      text: message,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel"
    });
  },
}

function getRecent() {
  return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT) || "[]");
}

function setRecent(data) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT, JSON.stringify(data));
}

function getCurrentTimestamp() {
  return new Date().toGMTString()
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
            lastVisit: getCurrentTimestamp()
        }));

        setRecent(migratedData);
        console.log("LocalStorage data migrated to new format.");
    }
}

function isValidUserName(name) {
  return CONFIG.PATTERNS.USERNAME.test(name);
}

function isValidRepositoryName(name) {
  return CONFIG.PATTERNS.REPOSITORY_NAME.test(name);
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
        segments.length >= 2 && isValidRepositoryName(segments[1])
          ? segments[1]
          : null
    };
  } catch {
    return { username: null, repositoryName: null };
  }
}

function submitPath(path) {
  const { username, repositoryName } = parseGithubPath(path);

  if (!username || !isValidUserName(username)) {
    return false;
  }

  const targetUrl = getTargetUrl(username, repositoryName);
  saveRecent(targetUrl);
  redirectToGithubPages(targetUrl);
  return true;
}

function saveRecent(url) {
  let lastVisit = new getCurrentTimestamp()
  let recent = getRecent();
  recent = recent.filter(item => !(item.url===url));
  recent.unshift({url, lastVisit});
  if(recent.length > CONFIG.LIMITS.RECENT_SIZE) recent = recent.slice(0, CONFIG.LIMITS.RECENT_SIZE);
  setRecent(recent);
}

function removeRecent(url) {
  Modal.confirm(CONFIG.MESSAGES.CONFIRM_REMOVE).then(result => {
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
  const lastVisitDate = new Date(item.lastVisit);
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
  if (nowDate.toLocaleDateString() === lastVisitDate.toLocaleDateString()) {
    spanLastVisit.textContent = lastVisitDate.toLocaleTimeString();
  }
  else {
    spanLastVisit.textContent = lastVisitDate.toLocaleDateString();
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
    if (!submitPath(path.value.trim())) {
      Modal.error(CONFIG.MESSAGES.INVALID_PATH);
    }
  });

  path.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      button.click();
    }
  });
}


function handle404Page() {
  if (!submitPath(location.pathname)) {
    Modal.error(CONFIG.MESSAGES.INVALID_PATH).then(() => {
      location.replace("/");
    });
  }
}

