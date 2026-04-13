export const DEFAULT_STATUS = "Planned";
export const STORAGE_KEY = "phubers.projects";

export function splitEntries(value) {
  return [...new Set(value.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean))];
}

export function normalizeProjectPayload(rawProject) {
  return {
    name: rawProject.name.trim(),
    lead: rawProject.lead.trim(),
    icon: rawProject.icon.trim() || "📁",
    description: rawProject.description.trim(),
    teams: splitEntries(rawProject.teams),
    status: rawProject.status.trim() || DEFAULT_STATUS,
    milestone: rawProject.milestone.trim(),
    startDate: rawProject.startDate.trim(),
    targetDate: rawProject.targetDate.trim(),
    members: splitEntries(rawProject.members),
    resources: splitEntries(rawProject.resources),
    createdAt: rawProject.createdAt ?? new Date().toISOString(),
  };
}

export function validateProjectPayload(project) {
  const errors = [];

  if (!project.name) {
    errors.push("Project name is required.");
  }

  if (project.startDate && project.targetDate && project.targetDate < project.startDate) {
    errors.push("Target date must be on or after the start date.");
  }

  return errors;
}

function readProjects() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTagList(items) {
  if (!items.length) {
    return "";
  }

  return `<ul class="tag-list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function renderResources(resources) {
  if (!resources.length) {
    return "";
  }

  return resources
    .map((resource) => {
      const safeText = escapeHtml(resource);
      try {
        const url = new URL(resource);
        const safeUrl = escapeHtml(url.toString());
        return `<li><a href="${safeUrl}" target="_blank" rel="noreferrer">${safeText}</a></li>`;
      } catch {
        return `<li>${safeText}</li>`;
      }
    })
    .join("");
}

function renderProjects(projects, projectList) {
  if (!projects.length) {
    projectList.innerHTML = '<p class="empty-state">No projects yet. Create one to see it here.</p>';
    return;
  }

  projectList.innerHTML = projects
    .map(
      (project) => `
        <article class="project-card" data-project-id="${escapeHtml(project.id)}">
          <header>
            <div>
              <h3>${escapeHtml(project.icon)} ${escapeHtml(project.name)}</h3>
              ${
                project.description
                  ? `<p>${escapeHtml(project.description)}</p>`
                  : '<p class="helper-text">No description provided.</p>'
              }
            </div>
            <span class="badge">${escapeHtml(project.status)}</span>
          </header>
          <dl>
            ${project.lead ? `<dt>Lead</dt><dd>${escapeHtml(project.lead)}</dd>` : ""}
            ${project.milestone ? `<dt>Milestone</dt><dd>${escapeHtml(project.milestone)}</dd>` : ""}
            ${
              project.startDate || project.targetDate
                ? `<dt>Timeline</dt><dd>${escapeHtml(
                    [project.startDate || "?", project.targetDate || "?"].join(" → ")
                  )}</dd>`
                : ""
            }
          </dl>
          ${project.teams.length ? `<p><strong>Teams</strong></p>${renderTagList(project.teams)}` : ""}
          ${
            project.members.length ? `<p><strong>Members</strong></p>${renderTagList(project.members)}` : ""
          }
          ${
            project.resources.length
              ? `<p><strong>Links & documents</strong></p><ul class="meta-list">${renderResources(
                  project.resources
                )}</ul>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function setStatusMessage(statusMessage, text, type) {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initProjectForm() {
  const form = document.querySelector("#project-form");
  const projectList = document.querySelector("#project-list");
  const statusMessage = document.querySelector("#status-message");

  if (!form || !projectList || !statusMessage) {
    return;
  }

  const projects = readProjects();
  renderProjects(projects, projectList);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const project = normalizeProjectPayload({
      name: formData.get("name")?.toString() ?? "",
      lead: formData.get("lead")?.toString() ?? "",
      icon: formData.get("icon")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      teams: formData.get("teams")?.toString() ?? "",
      status: formData.get("status")?.toString() ?? "",
      milestone: formData.get("milestone")?.toString() ?? "",
      startDate: formData.get("startDate")?.toString() ?? "",
      targetDate: formData.get("targetDate")?.toString() ?? "",
      members: formData.get("members")?.toString() ?? "",
      resources: formData.get("resources")?.toString() ?? "",
    });

    const errors = validateProjectPayload(project);

    if (errors.length) {
      setStatusMessage(statusMessage, errors.join(" "), "error");
      return;
    }

    projects.unshift({ id: createId(), ...project });
    saveProjects(projects);
    renderProjects(projects, projectList);
    form.reset();
    form.querySelector("#status").value = DEFAULT_STATUS;
    setStatusMessage(statusMessage, `Created project "${project.name}".`, "success");
  });
}

if (typeof document !== "undefined") {
  initProjectForm();
}
